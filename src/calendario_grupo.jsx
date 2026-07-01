/* global React, CronogramaGrupo, AdminEstudiantesView */
// F98.4-Z6-AN · Calendario académico limpio
// - La Consulta individual se trasladó al menú principal.
// - Esta pantalla carga únicamente el calendario de grupos.
// - La vista de estudiantes se abre bajo demanda para no bloquear la primera pintura.

function _asTokenCalGrupo(){ try{return window.getSessionToken?window.getSessionToken():'';}catch(_){return '';} }
async function _asPostCalGrupo(fn,payload={}){
  const res=await fetch(window.APPS_SCRIPT_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({fn,token:_asTokenCalGrupo(),...payload}),cache:'no-store'});
  const raw=String(await res.text()||'').trim();
  if(!raw)throw new Error('El backend no devolvió contenido.');
  if(/^<!doctype\s+html|^<html/i.test(raw))throw new Error('Apps Script devolvió HTML en lugar de datos.');
  let data;try{data=JSON.parse(raw);}catch(_){throw new Error('Respuesta inválida del backend.');}
  if(!res.ok||data?.ok===false)throw new Error(data?.error||data?.mensaje||`HTTP ${res.status}`);
  return data;
}
function FusionGrupoModalAS({grupo,onClose,onComplete}){
  const [ctx,setCtx]=React.useState(null),[loading,setLoading]=React.useState(true),[error,setError]=React.useState(''),[destino,setDestino]=React.useState(''),[confirmacion,setConfirmacion]=React.useState(''),[procesando,setProcesando]=React.useState(false);
  React.useEffect(()=>{let live=true;setLoading(true);_asPostCalGrupo('getFusionGrupoContexto',{grupo_origen:grupo}).then(r=>{if(!live)return;setCtx(r);setDestino(r.candidatos?.[0]?.grupo||'');}).catch(e=>live&&setError(e.message||String(e))).finally(()=>live&&setLoading(false));return()=>{live=false};},[grupo]);
  const ejecutar=async()=>{
    if(!destino||confirmacion.trim()!==destino)return setError('Escribí exactamente el código del grupo destino para confirmar.');
    if(!window.confirm(`Se trasladarán ${ctx?.total_estudiantes||0} estudiantes CA de ${grupo} a ${destino}. El grupo origen quedará COMPLETADO y conservará todo su historial. ¿Continuar?`))return;
    setProcesando(true);setError('');
    try{
      const request_id=`FUS-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
      const r=await _asPostCalGrupo('fusionarGrupo',{request_id,grupo_origen:grupo,grupo_destino:destino,confirmacion_fusion:confirmacion.trim()});
      onComplete&&onComplete(r,destino);
    }catch(e){setError(e.message||String(e));}finally{setProcesando(false);}
  };
  return <div style={{position:'fixed',inset:0,zIndex:12000,background:'rgba(8,20,43,.62)',display:'grid',placeItems:'center',padding:18}} onMouseDown={e=>{if(e.target===e.currentTarget&&!procesando)onClose()}}>
    <div style={{width:'min(720px,96vw)',maxHeight:'90vh',overflow:'auto',background:'white',borderRadius:18,boxShadow:'0 30px 80px rgba(0,0,0,.28)'}}>
      <div style={{padding:'18px 20px',background:'linear-gradient(135deg,var(--an-navy),#123A73)',color:'white',display:'flex',justifyContent:'space-between',gap:14,alignItems:'start'}}>
        <div><div style={{fontSize:10,fontWeight:900,letterSpacing:'.15em',textTransform:'uppercase',opacity:.75}}>Fusión de grupo</div><div style={{fontSize:23,fontWeight:900,marginTop:3}}>{grupo}</div></div>
        <button onClick={onClose} disabled={procesando} style={{border:'1px solid rgba(255,255,255,.35)',background:'rgba(255,255,255,.12)',color:'white',borderRadius:9,padding:'7px 10px',cursor:'pointer'}}>✕</button>
      </div>
      <div style={{padding:20}}>
        {loading?<div style={{padding:30,textAlign:'center'}}>Revisando nivel, estudiantes y grupos compatibles…</div>:error&&!ctx?<div style={{padding:14,borderRadius:10,background:'#FFEBEE',color:'#B42318',fontWeight:800}}>{error}</div>:<>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:9,marginBottom:16}}>
            {[['Nivel',ctx?.nivel],['Estado',ctx?.comentario],['Estudiantes CA',ctx?.total_estudiantes],['Programa',ctx?.programa]].map(([k,v])=><div key={k} style={{padding:12,border:'1px solid var(--line)',borderRadius:10,background:'var(--surface-2)'}}><div style={{fontSize:9,fontWeight:900,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--ink-3)'}}>{k}</div><div style={{marginTop:4,fontWeight:900}}>{v||'—'}</div></div>)}
          </div>
          <div style={{padding:'11px 13px',borderRadius:10,background:'#FFF8E6',border:'1px solid #EACB7A',fontSize:12,lineHeight:1.5,color:'#7B5200',marginBottom:15}}><strong>Regla:</strong> se usa “Cambio por cupo”: mismo intento, sin matrícula nueva, sin cuotas nuevas y sin cargo. El grupo origen no se borra; queda <strong>Completado</strong> y conserva los pasos de cada estudiante.</div>
          <label style={{display:'block',fontSize:11,fontWeight:900,marginBottom:6}}>Grupo destino EN CURSO</label>
          <select value={destino} onChange={e=>{setDestino(e.target.value);setConfirmacion('')}} style={{width:'100%',padding:'11px 12px',border:'1px solid var(--line)',borderRadius:10,fontFamily:'inherit'}}>
            <option value="">Seleccionar…</option>{(ctx?.candidatos||[]).map(c=><option key={c.grupo} value={c.grupo}>{c.grupo} · {c.dias} {c.hora_ini}–{c.hora_fin} · {c.cupo} cupos · {c.docente}</option>)}
          </select>
          {!ctx?.candidatos?.length&&<div style={{marginTop:10,padding:12,borderRadius:9,background:'#FFEBEE',color:'#B42318',fontWeight:800}}>No existe otro grupo EN CURSO del mismo nivel y programa con cupo suficiente.</div>}
          {destino&&<><label style={{display:'block',fontSize:11,fontWeight:900,margin:'16px 0 6px'}}>Confirmá escribiendo: <span style={{fontFamily:'var(--f-mono)',color:'var(--an-navy)'}}>{destino}</span></label><input value={confirmacion} onChange={e=>setConfirmacion(e.target.value)} style={{width:'100%',padding:'11px 12px',border:'1px solid var(--line)',borderRadius:10,fontFamily:'var(--f-mono)'}} /></>}
          {error&&<div style={{marginTop:12,padding:12,borderRadius:9,background:'#FFEBEE',color:'#B42318',fontWeight:800}}>{error}</div>}
          <div style={{display:'flex',justifyContent:'flex-end',gap:9,marginTop:18}}><button onClick={onClose} disabled={procesando} style={{padding:'10px 14px',border:'1px solid var(--line)',borderRadius:9,background:'white',fontWeight:800,cursor:'pointer'}}>Cancelar</button><button onClick={ejecutar} disabled={procesando||!destino||confirmacion.trim()!==destino||!ctx?.total_estudiantes} style={{padding:'10px 15px',border:0,borderRadius:9,background:'var(--an-red,#D62828)',color:'white',fontWeight:900,cursor:'pointer',opacity:(procesando||!destino||confirmacion.trim()!==destino||!ctx?.total_estudiantes)?0.6:1}}>{procesando?'Fusionando…':'Fusionar grupo'}</button></div>
        </>}
      </div>
    </div>
  </div>;
}
function CalendarioGrupoOperativo({ rol = 'superadmin', onNavigate, grupoInicial }) {
  const [grupoSeleccionado,setGrupoSeleccionado] = React.useState(grupoInicial||null);
  const [mostrarEstudiantes,setMostrarEstudiantes] = React.useState(!!grupoInicial);
  const [fusionModal,setFusionModal]=React.useState(false);
  const [fusionVersion,setFusionVersion]=React.useState(0);
  const [fusiones,setFusiones]=React.useState([]);
  const [mensaje,setMensaje]=React.useState(null);
  const [consultaGrupo,setConsultaGrupo]=React.useState('');
  const esSuperadmin=String(rol||'').toLowerCase()==='superadmin';
  const cargarFusiones=React.useCallback(()=>{_asPostCalGrupo('getFusionesGrupo',{}).then(r=>setFusiones(r.fusiones||[])).catch(()=>{});},[]);
  React.useEffect(()=>{cargarFusiones()},[cargarFusiones,fusionVersion]);
  React.useEffect(()=>{if(grupoInicial){setGrupoSeleccionado(grupoInicial);setMostrarEstudiantes(true)}},[grupoInicial]);
  const irAuditoria = React.useCallback(() => { if (onNavigate) onNavigate('auditoria_academica'); },[onNavigate]);
  const scrollGrupo = React.useCallback((behavior='smooth') => { const mover=()=>{const el=document.getElementById('calgrupo-estudiantes-panel');if(el?.scrollIntoView)el.scrollIntoView({behavior,block:'start'});};requestAnimationFrame(()=>requestAnimationFrame(mover));setTimeout(mover,180);},[]);
  React.useEffect(()=>{if(grupoSeleccionado&&mostrarEstudiantes)scrollGrupo('smooth');},[grupoSeleccionado,mostrarEstudiantes,scrollGrupo]);
  const abrirGrupo=React.useCallback((grupo)=>{setGrupoSeleccionado(grupo);setMostrarEstudiantes(true);setTimeout(()=>scrollGrupo('smooth'),80);},[scrollGrupo]);
  const handleNavigateFromCronograma = React.useCallback((target,opts={})=>{if(target==='estudiantes'&&opts?.grupo){abrirGrupo(opts.grupo);return;}if(onNavigate)onNavigate(target,opts);},[onNavigate,abrirGrupo]);
  const onFusionComplete=(r,destino)=>{setFusionModal(false);setFusionVersion(v=>v+1);setMensaje({ok:!!r.ok,text:r.mensaje||'Fusión procesada.',destino});setMostrarEstudiantes(true);};
  return (
    <section data-screen-label="Calendario académico" style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:18,marginBottom:18,flexWrap:'wrap'}}>
        <div style={{minWidth:260}}><div style={{fontSize:10,fontWeight:800,letterSpacing:'0.22em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:6}}>Gestión académica</div><h1 style={{fontFamily:'var(--f-serif)',fontWeight:500,letterSpacing:'-0.03em',fontSize:36,lineHeight:1.05,margin:'0 0 6px',color:'var(--ink)'}}>Calendario académico</h1><div style={{fontSize:13.5,color:'var(--ink-2)',lineHeight:1.5,maxWidth:820}}>GRUPOS.COMENTARIO define el nivel operativo: Completado, En curso o Proyectado. Los traslados conservan el recorrido histórico del estudiante.</div></div>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:6,padding:5,border:'1px solid var(--line)',borderRadius:10,background:'white'}}><input value={consultaGrupo} onChange={e=>setConsultaGrupo(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&consultaGrupo.trim())abrirGrupo(consultaGrupo.trim())}} placeholder="Consultar grupo por código" style={{width:205,border:0,outline:'none',padding:'5px 7px',fontFamily:'var(--f-mono)',fontSize:11}}/><button type="button" onClick={()=>consultaGrupo.trim()&&abrirGrupo(consultaGrupo.trim())} style={{padding:'7px 9px',border:0,borderRadius:7,background:'var(--an-navy)',color:'white',fontWeight:900,cursor:'pointer'}}>Consultar</button></div>
          {grupoSeleccionado&&<div style={{padding:'8px 12px',borderRadius:'var(--r-pill)',background:'color-mix(in srgb, var(--an-navy) 9%, white)',border:'1px solid color-mix(in srgb, var(--an-navy) 18%, white)',color:'var(--an-navy-ink)',fontSize:12,fontWeight:800,fontFamily:'var(--f-mono)'}}>Grupo activo · {grupoSeleccionado}</div>}<button type="button" onClick={irAuditoria} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'9px 14px',borderRadius:'var(--r-md)',border:'1px solid var(--line)',background:'var(--surface)',color:'var(--ink-2)',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}><IconMiniAudit /> Abrir Auditoría Académica</button></div>
      </div>
      {mensaje&&<div style={{marginBottom:14,padding:'12px 14px',borderRadius:10,background:mensaje.ok?'#E8F5E9':'#FFF4E5',border:`1px solid ${mensaje.ok?'#A5D6A7':'#F2C57C'}`,color:mensaje.ok?'#1B5E20':'#8A5200',fontWeight:800,fontSize:12}}>{mensaje.text}{mensaje.destino&&<button onClick={()=>abrirGrupo(mensaje.destino)} style={{marginLeft:10,padding:'5px 8px',borderRadius:7,border:'1px solid currentColor',background:'transparent',color:'inherit',fontWeight:900,cursor:'pointer'}}>Consultar grupo actual</button>}</div>}
      <div style={{background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',boxShadow:'var(--sh-1)',overflow:'hidden',marginBottom:22}}><div style={{padding:'12px 16px',borderBottom:'1px solid var(--line)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',background:'linear-gradient(180deg,#fff,var(--surface-2))'}}><div><div style={{fontSize:10,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--ink-3)'}}>Calendario de grupos</div><div style={{fontSize:13,color:'var(--ink-2)',marginTop:2}}>El nivel y color se toman primero de GRUPOS.COMENTARIO; el calendario es respaldo.</div></div><div style={{fontSize:11,color:'var(--ink-3)',fontWeight:700}}>Tocá una lección para abrir el grupo.</div></div><div style={{padding:14}}><CronogramaGrupo key={`cal-${fusionVersion}`} rol={rol} onNavigate={handleNavigateFromCronograma} /></div></div>
      {!!fusiones.length&&<div style={{marginBottom:22,background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',padding:14}}><div style={{fontSize:10,fontWeight:900,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:9}}>Grupos fusionados · historial visible</div><div style={{display:'grid',gap:8}}>{fusiones.slice(0,12).map(f=><div key={f.fusion_id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',padding:'10px 12px',border:'1px solid var(--line)',borderRadius:10,background:'var(--surface-2)'}}><div><strong>{f.grupo_origen}</strong> <span style={{color:'var(--ink-3)'}}>→</span> <strong>{f.grupo_destino}</strong><div style={{fontSize:10.5,color:'var(--ink-3)',marginTop:3}}>{f.nivel} · {f.estado} · {f.procesados}/{f.total} trasladados</div></div><div style={{display:'flex',gap:7}}><button onClick={()=>abrirGrupo(f.grupo_origen)} style={{padding:'6px 9px',border:'1px solid var(--line)',borderRadius:7,background:'white',fontWeight:800,cursor:'pointer'}}>Consultar origen</button><button onClick={()=>abrirGrupo(f.grupo_destino)} style={{padding:'6px 9px',border:'1px solid #C9D9F1',borderRadius:7,background:'#EEF4FF',color:'#244A7C',fontWeight:800,cursor:'pointer'}}>Grupo actual</button></div></div>)}</div></div>}
      <div id="calgrupo-estudiantes-panel" style={{background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',boxShadow:'var(--sh-1)',overflow:'visible'}}><div style={{padding:'14px 18px',borderBottom:'1px solid var(--line)',background:grupoSeleccionado?'linear-gradient(135deg,var(--an-navy),#123A73)':'linear-gradient(180deg,#fff,var(--surface-2))',color:grupoSeleccionado?'white':'var(--ink)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:14,flexWrap:'wrap',borderRadius:'var(--r-lg) var(--r-lg) 0 0'}}><div><div style={{fontSize:10,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:grupoSeleccionado?'rgba(255,255,255,.78)':'var(--ink-3)'}}>Estudiantes del grupo</div><div style={{fontFamily:'var(--f-serif)',fontSize:22,fontWeight:500,letterSpacing:'-0.02em',marginTop:2}}>{grupoSeleccionado||'Seleccioná un grupo desde el calendario'}</div></div><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>{grupoSeleccionado&&esSuperadmin&&<button type="button" onClick={()=>setFusionModal(true)} style={{padding:'8px 12px',borderRadius:'var(--r-md)',border:'1px solid rgba(255,255,255,.55)',background:'var(--an-red,#D62828)',color:'white',fontSize:12,fontWeight:900,cursor:'pointer'}}>⇄ Fusionar grupo</button>}{grupoSeleccionado&&<button type="button" onClick={()=>setMostrarEstudiantes(v=>!v)} style={{padding:'8px 12px',borderRadius:'var(--r-md)',border:'1px solid rgba(255,255,255,.35)',background:'rgba(255,255,255,.10)',color:'white',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>{mostrarEstudiantes?'Ocultar estudiantes':'Mostrar estudiantes'}</button>}<button type="button" onClick={irAuditoria} style={{padding:'8px 12px',borderRadius:'var(--r-md)',border:grupoSeleccionado?'1px solid rgba(255,255,255,.35)':'1px solid var(--line)',background:grupoSeleccionado?'rgba(255,255,255,.10)':'var(--surface)',color:grupoSeleccionado?'white':'var(--ink-2)',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>Auditoría</button></div></div>
        {!grupoSeleccionado?<div style={{padding:'34px 24px',textAlign:'center',color:'var(--ink-3)'}}><div style={{fontSize:30,marginBottom:8,opacity:.55}}>🗓️</div><div style={{fontSize:16,fontWeight:700,color:'var(--ink)',marginBottom:4}}>Seleccioná un grupo</div><div style={{fontSize:13,lineHeight:1.5}}>Abrí una clase y usá <strong>Ver estudiantes de este grupo</strong>.</div></div>:mostrarEstudiantes?<div style={{background:'var(--bg)',borderTop:'1px solid var(--line)'}}><AdminEstudiantesView key={`calgrupo-${grupoSeleccionado}-${fusionVersion}`} onNavigate={onNavigate} grupoInicial={grupoSeleccionado} modo="calgrupo" /></div>:<div style={{padding:'22px 24px',color:'var(--ink-2)',fontSize:13,lineHeight:1.55}}>Grupo listo. Usá <strong>Mostrar estudiantes</strong> para cargar la vista.</div>}
      </div>
      {fusionModal&&grupoSeleccionado&&<FusionGrupoModalAS grupo={grupoSeleccionado} onClose={()=>setFusionModal(false)} onComplete={onFusionComplete} />}
    </section>
  );
}

function IconMiniAudit(){
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/><path d="M9 9h1"/></svg>;
}

Object.assign(window,{CalendarioGrupoOperativo});
