/* global React, PageHeader */
// F111 · Lista de asistencia de grupos (SUPERADMIN: edita / ADMIN: consulta).
// No es Auditoría Académica ni cambia el motor de docentes: lee la matriz
// oficial getAuditoriaAcademicaGrupo y escribe sólo deltas en endpoints existentes.
(function(){
'use strict';
function attSafeError(raw, fallback) {
  try { console.error('[Asistencia de grupos]', String(raw || fallback)); } catch (_) {}
  return String(fallback || 'No se pudo completar la operación.');
}
function attCode(v){return String(v == null ? '' : v).trim();}
function attUpper(v){return attCode(v).toUpperCase();}
function attCell(data, lec, code){
  return ((data && data.matriz) || {})[String(lec)]?.[code] || {};
}
function attInitialCell(c){
  return {asistencia:c.presente === true ? 'P' : c.presente === false ? 'A' : '',comentario:String(c.retro || '')};
}
function attIsClosed(l){return ['CERRADA','CALCULADA'].includes(attUpper(l?.estado));}
function attStateLabel(l){return attCode(l?.estado)||'SIN ESTADO';}
function attLessonType(l){return attUpper(l?.tipo);}
function attDay(iso){
  const s=attCode(iso);if(!s)return 'Sin fecha';
  const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? m[3]+'/'+m[2]+'/'+m[1] : s;
}
async function attPost(fn,body){
  const token=window.getSessionToken?.();
  if(!token)throw new Error('Sesión requerida');
  const resp=await fetch(window.APPS_SCRIPT_URL+'?fn='+encodeURIComponent(fn),{
    method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({fn,token,...(body||{})})
  });
  const json=await resp.json();
  if(!resp.ok||!json?.ok)throw new Error('Operación de lectura no disponible.');
  return json;
}
function AttendanceGroupsSuperadminView(){
  const user=window.getSesion?.()||{},isSuper=attCode(user.rol)==='superadmin';
  const [groups,setGroups]=React.useState([]),[groupsLoading,setGroupsLoading]=React.useState(true);
  const [group,setGroup]=React.useState(''),[level,setLevel]=React.useState('B1');
  const [data,setData]=React.useState(null),[selected,setSelected]=React.useState(0);
  const [search,setSearch]=React.useState(''),[draft,setDraft]=React.useState({});
  const [reason,setReason]=React.useState(''),[loading,setLoading]=React.useState(false);
  const [saving,setSaving]=React.useState(false),[error,setError]=React.useState('');
  const [notice,setNotice]=React.useState(''),[showGrid,setShowGrid]=React.useState(true);

  React.useEffect(()=>{
    let alive=true;
    attPost('getGruposActivos',{alcance:'COMPLETO'}).then(d=>{
      if(!alive)return;
      const a=Array.isArray(d.grupos)?d.grupos:[],unique=new Map();
      a.forEach(g=>{const code=attCode(g.code||g.cod_grupo);
        if(code&&!unique.has(code))unique.set(code,{...g,code});});
      const all=Array.from(unique.values());
      setGroups(all);
      if(all.length){setGroup(old=>old||all[0].code);
        const n=attUpper(all[0].nivelId||all[0].nivel);
        if(['B1','B2','I1','I2'].includes(n))setLevel(n);}
      setGroupsLoading(false);
    }).catch(e=>{if(alive){setError(attSafeError(e?.message,'No se pudieron obtener los grupos.'));setGroupsLoading(false);}});
    return()=>{alive=false};
  },[]);

  const lessons=React.useMemo(()=>{
    const all=Array.isArray(data?.lecciones)?data.lecciones:[];
    const byLesson=new Map();
    all.forEach(l=>{
      const n=Number(l.leccion||0);
      if(n<1||n>32||attLessonType(l)==='ICAN')return;
      if(!byLesson.has(n))byLesson.set(n,l);
    });
    return Array.from(byLesson.values()).sort((a,b)=>Number(a.leccion)-Number(b.leccion));
  },[data]);
  const students=Array.isArray(data?.estudiantes)?data.estudiantes:[];
  const visible=students.filter(e=>{
    const q=attUpper(search);
    return !q||attUpper((e.name||e.nombre||'')+' '+(e.code||e.codigo||'')).includes(q);
  });
  const activeLesson=lessons.find(l=>Number(l.leccion)===selected)||null;
  const lessonEvidence=students.some(e=>{
    const c=attCell(data,selected,attCode(e.code||e.codigo));
    return c.presente===true||c.presente===false;
  });
  const fechaMeta=attCode(activeLesson?.fecha);
  const fechaPast=/^\d{4}-\d{2}-\d{2}/.test(fechaMeta)&&
    new Date(fechaMeta.slice(0,10)+'T23:59:59').getTime()<Date.now();
  // Calendario 0826: 0/32 cerradas aunque hay registros oficiales.
  // Superadmin edita solo si clase cerrada o fecha pasada + evidencia oficial.
  const editableByEvidence=!!activeLesson&&lessonEvidence&&fechaPast;
  const readonly=!isSuper||!activeLesson||(!attIsClosed(activeLesson)&&!editableByEvidence);
  const initial=React.useMemo(()=>{
    const map={};
    students.forEach(e=>{const code=attCode(e.code||e.codigo);if(code)map[code]=attInitialCell(attCell(data,selected,code));});
    return map;
  },[data,selected]);
  React.useEffect(()=>{setDraft(initial);setReason('');},[initial]);

  const counts=React.useMemo(()=>{
    let p=0,a=0,missing=0,comments=0;
    students.forEach(e=>{
      const c=attInitialCell(attCell(data,selected,attCode(e.code||e.codigo)));
      if(c.asistencia==='P')p++;else if(c.asistencia==='A')a++;else missing++;
      if(c.comentario.trim())comments++;
    });
    return{p,a,missing,comments};
  },[students,data,selected]);

  const changes=React.useMemo(()=>{
    const att=[],retro=[],missing=[];
    students.forEach(e=>{
      const code=attCode(e.code||e.codigo),now=draft[code]||initial[code]||{},old=initial[code]||{};
      if(now.asistencia!==old.asistencia){
        if(now.asistencia==='P'||now.asistencia==='A'){
          att.push({cod_estudiante:code,presente:now.asistencia==='P'});
          if(!old.asistencia)missing.push(code);
        }
      }
      if(String(now.comentario||'')!==String(old.comentario||''))
        retro.push({cod_estudiante:code,comentario:String(now.comentario||'')});
    });
    return{att,retro,missing};
  },[draft,initial,students]);

  const reload=React.useCallback(async(silent=false)=>{
    if(!group||!level)return null;
    if(!silent){setLoading(true);setError('');setNotice('');}
    try{
      const x=await window.fetchAuditoriaAcademicaGrupo({cod_grupo:group,nivel:level});
      if(!x?.ok)throw new Error(x?.error||'Auditoría no disponible');
      setData(x);
      const found=Array.isArray(x.lecciones)?x.lecciones.filter(l=>attLessonType(l)!=='ICAN'):[];
      const ordered=found.sort((a,b)=>Number(a.leccion)-Number(b.leccion));
      const hasCurrent=ordered.some(l=>Number(l.leccion)===selected);
      if(!hasCurrent){
        const registered=ordered.find(l=>{
          return (x.estudiantes||[]).some(e=>{
            const c=attCell(x,Number(l.leccion),attCode(e.code||e.codigo));
            return c.presente===true||c.presente===false;
          });
        });
        setSelected(Number((registered||ordered[0]||{}).leccion)||0);
      }
      return x;
    }catch(e){setError(attSafeError(e?.message,'No pudimos cargar la lista. Intentá de nuevo.'));return null;}
    finally{if(!silent)setLoading(false);}
  },[group,level,selected]);

  async function save(){
    if(!isSuper||readonly||saving||!activeLesson)return;
    if(!changes.att.length&&!changes.retro.length)return;
    if(changes.missing.length&&changes.att.some(a=>changes.missing.includes(a.cod_estudiante)&&a.presente))
      return setError('No se puede crear una presencia retroactiva sin registro previo.');
    if(changes.missing.length&&reason.trim().length<12)
      return setError('Para registrar ausencias faltantes, anotá el motivo (mínimo 12 caracteres).');
    if(!window.confirm('¿Guardar las correcciones de la lección '+selected+'? Se registrarán en el expediente académico.'))return;
    setSaving(true);setError('');setNotice('');
    let attSaved=0,retroSaved=0;
    try{
      if(changes.att.length){
        const result=await window.fetchEditarAsistenciaNotaCerrada({
          cod_grupo:group,nivel:level,leccion:selected,riel:'curso',
          asistencias:changes.att,notas:[],justificacion:reason.trim(),
          editado_por:attCode(user.nombre||user.usuario||'SUPERADMIN')
        });
        if(!result?.ok)throw new Error(result?.error||'El backend rechazó la asistencia.');
        attSaved=Number(result.asistencia_editada||0)+Number(result.ausencias_agregadas||0);
        if(attSaved!==changes.att.length)throw new Error('La asistencia NO se guardó completa: el servidor confirmó '+attSaved+' de '+changes.att.length+' cambios. No reintentar a ciegas.');
      }
      if(changes.retro.length){
        const result=await window.fetchEditarRetroPCCerrada({
          tipo:'retro',cod_grupo:group,nivel:level,riel:'curso',
          leccion_num:selected,lista:changes.retro,
          editado_por:attCode(user.nombre||user.usuario||'SUPERADMIN')
        });
        if(!result?.ok)throw new Error(result?.error||'El backend rechazó los comentarios.');
        retroSaved=Number(result.actualizados||0)+Number(result.agregados||0);
        if(retroSaved!==changes.retro.length)throw new Error('Se confirmó '+retroSaved+' de '+changes.retro.length+' comentarios. Revisá la lista.');
      }
      const after=await reload(true);
      if(!after)throw new Error('Se guardó, pero no fue posible verificar el resultado. Revisar antes de repetir.');
      const mismatches=changes.att.filter(a=>attCell(after,selected,a.cod_estudiante).presente!==a.presente);
      const noteMismatch=changes.retro.filter(a=>String(attCell(after,selected,a.cod_estudiante).retro||'')!==a.comentario);
      if(mismatches.length||noteMismatch.length)throw new Error('El readback no coincide: '+mismatches.length+' asistencias y '+noteMismatch.length+' comentarios pendientes de verificar.');
      setNotice('Guardado y verificado: '+attSaved+' asistencias y '+retroSaved+' comentarios. Se conservan las demás filas.');
    }catch(e){
      setError('No se pudo certificar el guardado. '+String(e?.message||'Revisá los registros antes de reintentar.'));
      // Recuperar el estado del servidor si hubo alguna escritura parcial.
      if(attSaved||retroSaved)await reload(true);
    }finally{setSaving(false);}
  }
  const change=(code,key,val)=>{setDraft(prev=>({...prev,[code]:{...(prev[code]||initial[code]||{}),[key]:val}}));setError('');};
  const tone=(state)=>state==='P'?{bg:'#E8F5EE',fg:'#1B6848',text:'P'}:state==='A'?{bg:'#FDEBE9',fg:'#A52D27',text:'A'}:{bg:'#F2F4F7',fg:'#718096',text:'—'};
  const card={background:'var(--surface,#fff)',border:'1px solid var(--line,#E5E7EB)',borderRadius:12,padding:15};
  const filterStyle={padding:'9px 11px',border:'1px solid var(--line,#CBD5E1)',borderRadius:8,background:'white',fontSize:12,minHeight:39};
  const labelStyle={display:'block',fontSize:10,fontWeight:800,letterSpacing:'.07em',textTransform:'uppercase',marginBottom:5,color:'var(--ink-3,#637185)'};
  return <div style={{display:'grid',gap:16,paddingBottom:30}}>
    <header style={{display:'flex',gap:12,justifyContent:'space-between',alignItems:'center',flexWrap:'wrap'}}>
      <div>
        <div style={{fontSize:10,fontWeight:850,letterSpacing:'.14em',color:'#56708F'}}>GESTIÓN ACADÉMICA · ASISTENCIA OFICIAL</div>
        <h1 style={{fontSize:27,fontWeight:850,color:'var(--an-navy,#12386F)',margin:'4px 0'}}>Lista de asistencia de grupos</h1>
        <div style={{fontSize:12,color:'var(--ink-3,#62708B)'}}>Como en la lista docente: estudiantes, clases, presente/ausente y comentarios. Sin registro es distinto de ausente.</div>
      </div>
      <span style={{fontSize:11,background:isSuper?'#E8F4EE':'#F1F4F8',color:isSuper?'#1B6848':'#4A5C73',padding:'7px 10px',borderRadius:999,fontWeight:800}}>
        {isSuper?'Superadmin · edición autorizada':'Consulta · solo lectura'}
      </span>
    </header>
    <section style={{...card,display:'flex',alignItems:'end',flexWrap:'wrap',gap:12}}>
      <div style={{flex:'1 1 260px'}}><label style={labelStyle}>Grupo</label>
        <select aria-label="Grupo de asistencia" style={{...filterStyle,width:'100%'}} value={group} disabled={groupsLoading||saving}
          onChange={e=>{const code=e.target.value;setGroup(code);setData(null);setSelected(0);setError('');setNotice('');
            const g=groups.find(z=>z.code===code);const n=attUpper(g?.nivelId||g?.nivel);if(['B1','B2','I1','I2'].includes(n))setLevel(n);
          }}>
          {groupsLoading?<option value="">Cargando grupos…</option>:!groups.length?<option value="">Sin grupos disponibles</option>:
            groups.map(g=><option key={g.code} value={g.code}>{g.code}{g.docente?' · '+g.docente:''}</option>)}
        </select>
      </div>
      <div style={{flex:'0 1 160px'}}><label style={labelStyle}>Nivel</label>
        <select aria-label="Nivel de asistencia" style={{...filterStyle,width:'100%'}} value={level} disabled={saving}
          onChange={e=>{setLevel(e.target.value);setData(null);setSelected(0);}}>
          {[['B1','Básico I'],['B2','Básico II'],['I1','Intermedio I'],['I2','Intermedio II']].map(([n,label])=>
            <option key={n} value={n}>{n} · {label}</option>)}
        </select>
      </div>
      <button type="button" disabled={!group||loading||saving} onClick={()=>reload()}
        style={{...filterStyle,background:'#12386F',color:'white',fontWeight:800,cursor:'pointer',padding:'9px 17px'}}>
        {loading?'Cargando…':data?'Actualizar lista':'Ver asistencia'}
      </button>
    </section>
    {error&&<div role="alert" style={{...card,borderColor:'#E3A49D',background:'#FFF6F5',color:'#9A302B',fontSize:12}}>{error}</div>}
    {notice&&<div role="status" style={{...card,borderColor:'#A1C6B3',background:'#F1FAF5',color:'#1E6046',fontSize:12}}>{notice}</div>}
    {!data&&!loading&&<div style={{...card,textAlign:'center',padding:38,color:'var(--ink-3,#62708B)'}}>
      Seleccioná grupo y nivel, y hacé clic en <b>Ver asistencia</b>. Aquí aparecerá la lista de estudiantes y sus lecciones.
    </div>}
    {data&&<>
      <section style={{...card,display:'flex',gap:20,flexWrap:'wrap',justifyContent:'space-between',alignItems:'center'}}>
        <div><b style={{fontSize:14}}>{group} · {level}</b>
          <div style={{fontSize:11,color:'var(--ink-3)',marginTop:3}}>{data.grupo?.docente||'Docente no indicado'} · {data.grupo?.programa||'Programa no indicado'}</div>
        </div>
        <div style={{display:'flex',gap:16,flexWrap:'wrap',fontSize:12}}>
          <span><b>{students.length}</b> estudiantes</span>
          <span><b>{lessons.length}</b> lecciones</span>
          <span><b>{counts.p}</b> presentes en L{selected||'—'}</span>
          <span><b>{counts.a}</b> ausentes</span>
          <span><b>{counts.missing}</b> sin registro</span>
          <span><b>{counts.comments}</b> comentarios</span>
        </div>
      </section>
      <section style={{...card,padding:0,overflow:'hidden'}}>
        <div style={{padding:14,display:'flex',gap:12,justifyContent:'space-between',alignItems:'center',flexWrap:'wrap'}}>
          <div><b style={{fontSize:14}}>Matriz de asistencia · lecciones 1–32</b>
            <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4}}>P = Presente · A = Ausente · — = Sin registro · ● = Comentario docente. Seleccioná una lección para ver y corregir su lista.</div>
          </div>
          <button type="button" onClick={()=>setShowGrid(v=>!v)} style={{...filterStyle,cursor:'pointer'}}>{showGrid?'Ocultar matriz':'Mostrar matriz'}</button>
        </div>
        {showGrid&&<div style={{overflowX:'auto',maxWidth:'100%'}}>
          <table style={{borderCollapse:'separate',borderSpacing:0,fontSize:11,width:'max-content',minWidth:'100%'}}>
            <thead><tr><th style={{position:'sticky',left:0,zIndex:2,background:'#EAF0F8',textAlign:'left',padding:'12px 14px',minWidth:235,borderBottom:'1px solid #CBD5E1'}}>Estudiante</th>
              {lessons.map(l=><th key={l.leccion} style={{background:Number(l.leccion)===selected?'#D7E9FF':'#F3F6FA',minWidth:55,padding:'9px 4px',borderBottom:'1px solid #CBD5E1',textAlign:'center'}}>
                <button type="button" onClick={()=>setSelected(Number(l.leccion))} title={'Lección '+l.leccion+' · '+attDay(l.fecha)+' · '+attStateLabel(l)}
                  style={{border:0,background:'transparent',fontWeight:850,fontSize:11,color:Number(l.leccion)===selected?'#0F3972':'#4F6180',cursor:'pointer'}}>
                  L{l.leccion}
                </button>
              </th>)}
            </tr></thead>
            <tbody>{visible.map((e,i)=><tr key={attCode(e.code||e.codigo)}>
              <td style={{position:'sticky',left:0,zIndex:1,background:i%2?'#F8FAFD':'white',padding:'9px 14px',borderBottom:'1px solid #E5EAF0',fontWeight:750}}>
                {e.name||e.nombre}<div style={{fontSize:9,color:'#67758E',fontWeight:500}}>{e.code||e.codigo}</div>
              </td>
              {lessons.map(l=>{
                const c=attCell(data,l.leccion,attCode(e.code||e.codigo));
                const v=attInitialCell(c),t=tone(v.asistencia),active=Number(l.leccion)===selected;
                return <td key={l.leccion} style={{padding:'7px 4px',borderBottom:'1px solid #E5EAF0',background:active?'#F0F7FF':i%2?'#FAFBFD':'white',textAlign:'center'}}>
                  <button type="button" onClick={()=>setSelected(Number(l.leccion))}
                    title={'L'+l.leccion+': '+(v.asistencia==='P'?'Presente':v.asistencia==='A'?'Ausente':'Sin registro')+(v.comentario?' · '+v.comentario:'')}
                    style={{minWidth:35,minHeight:29,border:active?'1px solid #8CB7E7':'1px solid transparent',borderRadius:8,background:t.bg,color:t.fg,fontWeight:900,fontSize:11,cursor:'pointer'}}>
                    {t.text}{v.comentario?<span style={{fontSize:7,verticalAlign:'top'}}> ●</span>:null}
                  </button>
                </td>;
              })}
            </tr>)}</tbody>
          </table>
        </div>}
      </section>
      {lessons.length>0&&<section style={{...card,padding:0,overflow:'hidden'}}>
        <div style={{padding:'15px 18px',background:'#F4F7FC',borderBottom:'1px solid var(--line,#DDE4ED)',display:'flex',alignItems:'end',gap:12,flexWrap:'wrap',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:10,fontWeight:900,color:'#4E6481',letterSpacing:'.12em'}}>LISTA DE UNA LECCIÓN · ASISTENCIA Y COMENTARIOS</div>
            <h2 style={{fontSize:19,margin:'5px 0',color:'#143A6D'}}>Lección {selected||'—'} · {attDay(activeLesson?.fecha)}</h2>
            <div style={{fontSize:11,color:'var(--ink-3)'}}>Estado: <b>{attStateLabel(activeLesson)}</b>. {readonly?'Solo consulta: requiere Superadmin y lección cerrada o con asistencia oficial previa.':'Podés corregir registros existentes o agregar ausencias justificadas.'}</div>
          </div>
          <div style={{minWidth:170}}><label style={labelStyle}>Elegir lección</label>
            <select aria-label="Lección de asistencia" value={selected} onChange={e=>setSelected(Number(e.target.value))} style={{...filterStyle,width:'100%'}}>
              {lessons.map(l=><option key={l.leccion} value={l.leccion}>{'L'+l.leccion+' · '+attDay(l.fecha)+' · '+attStateLabel(l)}</option>)}
            </select>
          </div>
        </div>
        <div style={{padding:'12px 18px',display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <label style={{fontSize:11,fontWeight:800}}>Buscar estudiante
            <input aria-label="Buscar estudiante" type="search" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Nombre o código" style={{...filterStyle,display:'block',marginTop:5,width:260,maxWidth:'100%'}} />
          </label>
          <div style={{fontSize:11,color:'#61748C'}}>{visible.length} de {students.length} estudiantes</div>
        </div>
        <div style={{maxHeight:520,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead style={{position:'sticky',top:0,zIndex:1,background:'#EDF2F8'}}><tr>
              <th style={{padding:12,textAlign:'left',width:'33%'}}>Estudiante</th>
              <th style={{padding:12,textAlign:'left',width:200}}>Asistencia</th>
              <th style={{padding:12,textAlign:'left'}}>Comentario del docente / corrección</th>
            </tr></thead>
            <tbody>{visible.map((e,i)=>{
              const code=attCode(e.code||e.codigo),initialCell=initial[code]||{asistencia:'',comentario:''};
              const cell=draft[code]||initialCell;
              const status=cell.asistencia||'',allowPresent=!!initialCell.asistencia;
              return <tr key={code} style={{background:i%2?'#FBFCFE':'white',borderBottom:'1px solid #E7ECF2'}}>
                <td style={{padding:'12px 10px 12px 16px',verticalAlign:'top'}}>
                  <b>{e.name||e.nombre}</b><div style={{fontSize:10,color:'#60718C',marginTop:3}}>{code}</div>
                </td>
                <td style={{padding:'11px 8px',verticalAlign:'top'}}>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                    {[['P','Presente'],['A','Ausente']].map(([id,label])=><button key={id} type="button"
                      disabled={readonly||saving||(id==='P'&&!allowPresent)}
                      onClick={()=>change(code,'asistencia',id)}
                      title={id==='P'&&!allowPresent?'No se puede crear presencia sin registro previo':label}
                      style={{padding:'7px 10px',fontSize:11,fontWeight:850,borderRadius:7,
                        border:cell.asistencia===id?'2px solid '+(id==='P'?'#22845F':'#B83B34'):'1px solid #CCD5E1',
                        color:id==='P'?'#176F4D':'#AA3933',background:cell.asistencia===id?(id==='P'?'#E8F5EF':'#FCE9E7'):'white',
                        cursor:readonly||saving?'not-allowed':'pointer',opacity:readonly ? .74 : 1}}>{id==='P'?'✓':'✕'} {label}</button>)}
                  </div>
                  <div style={{fontSize:10,color:'#64748B',marginTop:5}}>{initialCell.asistencia===''?'Sin registro oficial':initialCell.asistencia==='P'?'Registro: Presente':'Registro: Ausente'}</div>
                </td>
                <td style={{padding:'10px 16px 10px 8px',verticalAlign:'top'}}>
                  <textarea aria-label={'Comentario para '+(e.name||e.nombre||code)} value={cell.comentario||''}
                    onChange={ev=>change(code,'comentario',ev.target.value)} maxLength={800} rows={2}
                    disabled={readonly||saving} placeholder="Sin comentario registrado"
                    style={{width:'100%',minWidth:150,boxSizing:'border-box',resize:'vertical',
                      border:'1px solid #C9D3DF',background:readonly?'#F5F7F9':'white',
                      borderRadius:8,padding:'8px 10px',fontFamily:'inherit',fontSize:11}} />
                </td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        <div style={{padding:16,display:'grid',gap:9,borderTop:'1px solid #E3E8F0'}}>
          {changes.missing.length>0&&<div>
            <label htmlFor="att-late-reason" style={labelStyle}>Justificación de ausencias sin registro (obligatoria)</label>
            <input id="att-late-reason" value={reason} onChange={e=>setReason(e.target.value)}
              disabled={readonly||saving} placeholder="Ej.: estudiante se incorporó después de la lección"
              maxLength={300} style={{...filterStyle,width:'100%',boxSizing:'border-box'}}/>
            <div style={{fontSize:10,color:'#6E7890',marginTop:5}}>No se generan presencias retroactivas. Las nuevas ausencias quedan auditadas.</div>
          </div>}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <span style={{fontSize:11,color:'#5F6F87'}}>{changes.att.length} cambios de asistencia · {changes.retro.length} comentarios modificados
              {changes.missing.length?' · '+changes.missing.length+' registros nuevos':''}</span>
            <button type="button" disabled={readonly||saving||(!changes.att.length&&!changes.retro.length)||
              (changes.missing.length>0&&reason.trim().length<12)} onClick={save}
              style={{border:0,borderRadius:9,padding:'11px 17px',
                background:readonly||saving?'#9CA3AF':'#143D73',color:'white',fontWeight:850,
                cursor:readonly||saving?'not-allowed':'pointer'}}>
              {saving?'Guardando y verificando…':'Guardar correcciones'}
            </button>
          </div>
        </div>
      </section>}
      {!lessons.length&&<div style={{...card}}>No hay lecciones de curso disponibles para este grupo y nivel.</div>}
    </>}
  </div>;
}
Object.assign(window,{AttendanceGroupsSuperadminView});
})();