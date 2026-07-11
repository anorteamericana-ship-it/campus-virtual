// F98.4-Z6-CS21A38 · Seguimiento inmediato CONAPE compacto, sin scroll horizontal y con WA siempre visible.
(function(){
'use strict';
const BUILD='F98.4-Z6-CS21A38';
const MONTHS=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const LEVEL_LABEL={B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'};

function date(v){
  if(v instanceof Date)return v;
  let s=String(v||'').replace(/\s*\([^)]*\)\s*$/,'').trim();
  let m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if(m)return new Date(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0));
  m=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);
  if(m)return new Date(+m[1],+m[2]-1,+m[3],+(m[4]||0),+(m[5]||0));
  const d=new Date(s);
  return isNaN(d)?null:d;
}
function fmt(v,time){
  const d=date(v);
  if(!d)return String(v||'—');
  const f=d.toLocaleDateString('es-CR',{day:'2-digit',month:'short',year:'numeric'}).replace(/\./g,'');
  return time?f+' · '+d.toLocaleTimeString('es-CR',{hour:'numeric',minute:'2-digit',hour12:true}):f;
}
function fmtCompact(v){
  const d=date(v);
  if(!d)return String(v||'—');
  return d.toLocaleDateString('es-CR',{day:'2-digit',month:'2-digit',year:'2-digit'});
}
function phone(v){const d=String(v||'').replace(/\D/g,'');return d.length===8?'506'+d:d;}
function money(v){return '₡'+Number(v||0).toLocaleString('es-CR',{maximumFractionDigits:2});}
function period(r){return r.periodLabel||((r.month?MONTHS[+r.month-1]:'—')+' '+(r.year||'—'));}
function type(r){
  if(r.advance)return'Desembolso adelantado';
  return ({PRIMER_DESEMBOLSO:'Primer desembolso',NUEVO_DESEMBOLSO:'Nuevo desembolso',DESEMBOLSO_MES_ACTUAL:'Desembolso del periodo',DESEMBOLSO_REPORTADO:'Desembolso reportado',APROBADO_SIN_DESEMBOLSO:'Aprobado sin desembolso',DESEMBOLSO_REMOVIDO:'Desembolso retirado'}[r.type]||String(r.type||'').replaceAll('_',' '));
}
function levelId(r){return String(r?.level||'').trim().toUpperCase();}
function levelText(r){return r.levelLabel||LEVEL_LABEL[levelId(r)]||'Nivel sin enlazar';}
function moraText(r){return r.moraState==='SI'?'Estado SI · pendiente':r.moraState==='NO'?'Estado NO · aplicado':r.moraState==='SIN_FILA'?'Sin fila exacta':'Sin estado';}
function moraStyle(r){
  if(r.moraState==='SI')return{background:'#FDECEC',color:'#A12828',border:'1px solid #E8B1B1'};
  if(r.moraState==='NO')return{background:'#EAF6ED',color:'#246B35',border:'1px solid #B8D9C0'};
  return{background:'#F3F1EC',color:'#716A61',border:'1px solid #D8D1C7'};
}
async function postDetalle(fn,payload={}){
  const url=window.APPS_SCRIPT_URL;
  const res=await fetch(`${url}?fn=${encodeURIComponent(fn)}`,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({fn,token:window.getSessionToken?window.getSessionToken():'',...payload}),cache:'no-store'});
  const raw=await res.text();let data=null;
  try{data=raw?JSON.parse(raw):null;}catch(_){throw new Error('Apps Script devolvió una respuesta inválida.');}
  if(!res.ok||!data?.ok)throw new Error(data?.mensaje||data?.error||`No se pudo ejecutar ${fn}.`);
  return data;
}
function properToken(v){
  return String(v||'').toLocaleLowerCase('es-CR').replace(/(^|[-'’])([a-záéíóúüñ])/g,(m,p,l)=>p+l.toLocaleUpperCase('es-CR'));
}
function givenName(fullName){
  const parts=String(fullName||'').trim().split(/\s+/).filter(Boolean);
  if(!parts.length)return'Estudiante';
  const idx=parts.length>=3?2:parts.length-1;
  return properToken(parts[idx]||parts[0]);
}
function periodKind(v){
  const x=String(v||'').trim().toUpperCase();
  if(x==='B'||x.includes('BIMEST'))return'bimestre';
  if(x==='C'||x.includes('CUATRIMEST'))return'cuatrimestre';
  return'';
}
function pendingAmount(ficha,nivel,fallback){
  const info=ficha?.pendientes?.por_nivel?.[nivel]||{};
  const num=v=>{const n=Number(v||0);return Number.isFinite(n)?Math.max(0,n):0;};
  let total=num(info.matricula_pend)+num(info.cuotas_pend)+num(info.cert_pend);
  if(nivel==='I2')total+=num(info.programa_completo_pend??info.titulo_pend)+num(info.toeic_pend);
  if(total<=0)total=num(fallback?.pendingTotal);
  return Math.round(total*100)/100;
}
function buildWaText(row,amount,kind){
  const name=givenName(row?.name);
  const nivel=levelText(row);
  const last=levelId(row)==='I2';
  const periodLabel=kind?` (${kind})`:'';
  const amountLine=amount>0
    ? last
      ? `\n\nEl monto correspondiente al último nivel, ${nivel}${periodLabel}, es de ${money(amount)}.`
      : `\n\nEl monto correspondiente a ${nivel}${periodLabel} es de ${money(amount)}.`
    : '';
  return `¡Buenas noticias ${name}! 🥳\n\nCONAPE nos ha informado que el desembolso ya fue acreditado en su cuenta.\n\nLe solicitamos realizar el pago a la Academia a la mayor brevedad posible, para mantener su expediente al día y evitar atrasos en el desembolso del rubro de sostenimiento.${amountLine}`;
}
function DetailButton({row,value,onEdit}){
  const linked=!!String(row?.code||'').trim();
  const text=String(value||'').trim();
  const reviewed=linked&&!!text;
  const label=!linked?'Sin vínculo':reviewed?'✓ Revisado':'✎ Seguimiento';
  const title=!linked
    ?'Este movimiento todavía no está vinculado a un estudiante de DATOS.'
    :reviewed
      ?`Expediente revisado. ${text}`
      :'Agregar detalle del estudiante';
  return <button
    type="button"
    onClick={()=>linked&&onEdit(row,value)}
    disabled={!linked}
    title={title}
    data-reviewed={reviewed?'true':'false'}
    style={{
      display:'inline-flex',alignItems:'center',justifyContent:'center',gap:4,
      maxWidth:'100%',padding:'3px 7px',borderRadius:999,whiteSpace:'nowrap',
      border:reviewed?'1px solid #4338CA':'1px solid #D8D0C5',
      background:reviewed?'#4F46E5':(linked?'#F5F0E7':'#F0EEE9'),
      color:reviewed?'#FFFFFF':(linked?'#4D3B2B':'#8B867F'),
      boxShadow:reviewed?'0 0 0 2px rgba(79,70,229,.10)':'none',
      fontSize:8.6,lineHeight:1.15,cursor:linked?'pointer':'not-allowed',
      fontFamily:'inherit',fontWeight:reviewed?900:800,
      transition:'background .16s ease,border-color .16s ease,color .16s ease,box-shadow .16s ease'
    }}>
    {label}
  </button>;
}
function DetailModal({editor,setEditor,onSave}){
  if(!editor)return null;const row=editor.row||{};
  return <div role="dialog" aria-modal="true" aria-label="Editar detalle del estudiante" onMouseDown={e=>{if(e.target===e.currentTarget&&!editor.saving)setEditor(null);}} style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(0,22,52,.48)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
    <div style={{width:'min(640px,100%)',background:'#fff',borderRadius:18,boxShadow:'0 24px 70px rgba(0,0,0,.24)',overflow:'hidden',border:'1px solid #D9D2C7'}}>
      <div style={{padding:'18px 22px',background:'#F8F4ED',borderBottom:'1px solid #E4DDD2'}}><div style={{fontSize:11,fontWeight:900,letterSpacing:'.11em',textTransform:'uppercase',color:'#7A1E2C'}}>Seguimiento CONAPE</div><div style={{fontSize:21,fontWeight:700,color:'#001E47',marginTop:3}}>Detalle del estudiante</div><div style={{fontSize:12,color:'#6F665C',marginTop:4}}>{row.name||'Sin nombre'} · {row.code||'Sin código'}</div></div>
      <div style={{padding:'20px 22px'}}>{editor.loading?<div style={{padding:'30px 0',textAlign:'center',color:'#6F665C'}}>Cargando detalle actual…</div>:<><textarea autoFocus value={editor.value} maxLength={3000} onChange={e=>setEditor(x=>({...x,value:e.target.value,error:''}))} placeholder="Escriba aquí la nota de seguimiento del estudiante…" style={{width:'100%',minHeight:170,resize:'vertical',boxSizing:'border-box',border:'2px solid #D9D2C7',borderRadius:12,padding:'13px 14px',fontFamily:'inherit',fontSize:13.5,lineHeight:1.55,color:'#172033',outline:'none'}}/><div style={{display:'flex',justifyContent:'space-between',gap:12,marginTop:7,fontSize:11,color:'#7C746A'}}><span>Se guarda en DATOS · COMENTARIO_ADMIN</span><span>{String(editor.value||'').length}/3000</span></div>{editor.error&&<div style={{marginTop:12,padding:'10px 12px',borderRadius:9,background:'#FFF0F0',border:'1px solid #E5A4A4',color:'#A31E1E',fontSize:12}}>⚠ {editor.error}</div>}</>}</div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,padding:'14px 22px 18px'}}><button type="button" onClick={()=>setEditor(null)} disabled={editor.saving} style={{padding:'9px 15px',borderRadius:9,border:'1px solid #D7D0C5',background:'#fff',fontWeight:700,cursor:'pointer'}}>Cancelar</button><button type="button" onClick={onSave} disabled={editor.loading||editor.saving} style={{padding:'9px 16px',borderRadius:9,border:'1px solid #002F6C',background:'#002F6C',color:'#fff',fontWeight:800,cursor:editor.saving?'wait':'pointer',opacity:(editor.loading||editor.saving)?0.65:1}}>{editor.saving?'Guardando…':'Guardar detalle'}</button></div>
    </div>
  </div>;
}
function ApplicationBadge({row}){
  const applied=!!row.appliedInSystem;
  const movementLabel=applied?'✓ Aplicado':type(row);
  const movementStyle=applied
    ?{background:'#E5F5E9',color:'#1F6A32',border:'1px solid #A9D5B4'}
    :(row.advance?{background:'#FFF3CD',color:'#8A5A00',border:'1px solid #E8C67A'}:{});
  const moraTitle=`7-morosidad · ${row.moraYear||row.year||'—'} · periodo ${row.moraPeriod||'—'}`;
  return <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap',minWidth:0}}>
    <span className="master-conape-movement-badge" title={`${type(row)} · ${moraTitle}`} style={{...movementStyle,padding:'3px 6px',fontSize:8.5,whiteSpace:'nowrap'}}>{movementLabel}</span>
    <span title={moraTitle} style={{display:'inline-flex',padding:'2px 5px',borderRadius:999,fontSize:8.1,fontWeight:900,whiteSpace:'nowrap',...moraStyle(row)}}>{row.moraState==='SI'?'Mora SI':row.moraState==='NO'?'Mora NO':'Sin fila'}</span>
    {row.moraRowCount>1&&<span title={`${row.moraRowCount} filas de morosidad`} style={{fontSize:9,color:'#A12828',fontWeight:950}}>⚠{row.moraRowCount}</span>}
  </div>;
}
function WaButton({row,finance}){
  const [busy,setBusy]=React.useState(false);
  const wa=phone(row?.phone),code=String(row?.code||'').trim(),nivel=levelId(row);
  if(row?.appliedInSystem)return <span className="master-no-phone" title="El movimiento ya figura aplicado; no se debe volver a solicitar el pago." style={{display:'block',fontSize:8.2,lineHeight:1.15,textAlign:'center'}}>No enviar</span>;
  if(!wa)return <span className="master-no-phone">Sin teléfono</span>;
  async function openWa(){
    if(busy)return;
    setBusy(true);
    const popup=window.open('','_blank');
    try{if(popup)popup.opener=null;}catch(_){ }
    try{
      let ficha=null;
      if(code&&nivel){try{ficha=await postDetalle('getEstudiante',{codigo:code});}catch(_){ficha=null;}}
      const amount=pendingAmount(ficha,nivel,finance);
      const kind=periodKind(ficha?.pendientes?.por_nivel?.[nivel]?.tipo_periodo||finance?.periodType||row?.periodType);
      const text=buildWaText(row,amount,kind);
      const url=`https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
      if(popup)popup.location.href=url;else window.open(url,'_blank','noopener,noreferrer');
    }catch(e){
      try{if(popup)popup.close();}catch(_){ }
      alert('No se pudo preparar el mensaje de WhatsApp: '+(e?.message||e));
    }finally{setBusy(false);}
  }
  return <button type="button" className="master-wa-action" onClick={openWa} disabled={busy} title="Preparar mensaje de desembolso con el monto pendiente del nivel" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'100%',minWidth:0,padding:'6px 7px',border:'none',borderRadius:8,whiteSpace:'nowrap',fontSize:9,fontWeight:900,cursor:busy?'wait':'pointer',fontFamily:'inherit'}}>{busy?'Preparando…':'WA Pago'}</button>;
}
function Row({r,i,details,openDetail,financeMap}){
  const p=period(r),code=String(r?.code||'').trim(),detail=code&&Object.prototype.hasOwnProperty.call(details,code)?details[code]:String(r.detail||'');
  const finance=financeMap[`${code}|${levelId(r)}`]||financeMap[code]||null;
  const cell={padding:'6px 7px',verticalAlign:'middle',minWidth:0,overflow:'hidden'};
  return <tr key={r.id||i} className={!r.appliedInSystem&&(!r.linked||r.advance||r.mora)?'has-alert':''} style={r.appliedInSystem?{opacity:.78,background:'#F7FAF7'}:null}>
    <td style={cell}>
      <div title={r.name||'Sin nombre'} style={{fontSize:10.2,fontWeight:900,color:'#14213D',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.name||'Sin nombre'}</div>
      <div style={{display:'flex',alignItems:'center',gap:5,minWidth:0,marginTop:3}}><small title={`${r.cedula||''}${r.code?` · ${r.code}`:''}`} style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:8.2,color:'#697384'}}>{r.cedula}{r.code?` · ${r.code}`:''}</small><DetailButton row={r} value={detail} onEdit={openDetail}/></div>
    </td>
    <td style={cell}><ApplicationBadge row={r}/></td>
    <td style={cell}><div title={`${p} · ${levelText(r)}${r.academicStatus?` · ${r.academicStatus}`:''}`} style={{fontSize:9.3,fontWeight:900,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p}</div><small style={{display:'block',marginTop:2,fontSize:8.2,fontWeight:800,color:'#697384',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{levelText(r)}{r.academicStatus?` · ${r.academicStatus}`:''}</small></td>
    <td style={cell}><div style={{display:'flex',alignItems:'center',gap:4,minWidth:0}}>{r.linked?<span className="master-link-status linked" style={{padding:'2px 5px',fontSize:8}}>Vinculado</span>:<span className="master-link-status unlinked" style={{padding:'2px 5px',fontSize:8}}>Sin vínculo</span>}<small title={r.group||'Sin grupo'} style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:8.2}}>{r.group||'Sin grupo'}</small></div></td>
    <td style={{...cell,whiteSpace:'nowrap',fontSize:8.6,fontWeight:800,color:'#596273'}} title={fmt(r.detectedAt,true)}>{fmtCompact(r.detectedAt)}</td>
    <td style={{...cell,padding:'5px 6px',overflow:'visible'}}><WaButton row={r} finance={finance}/></td>
  </tr>;
}
function Table({items,details,openDetail,empty,financeMap}){
  return <div className="master-conape-month-table-wrap" style={{width:'100%',maxWidth:'100%',overflowX:'hidden'}}><table className="master-conape-month-table" style={{width:'100%',minWidth:0,tableLayout:'fixed',fontSize:10}}><colgroup><col style={{width:'27%'}}/><col style={{width:'18%'}}/><col style={{width:'19%'}}/><col style={{width:'18%'}}/><col style={{width:'8%'}}/><col style={{width:'10%'}}/></colgroup><thead><tr><th>Estudiante</th><th>Movimiento</th><th>Periodo / nivel</th><th>Campus</th><th>Detectado</th><th style={{whiteSpace:'nowrap'}}>WA</th></tr></thead><tbody>{items.map((r,i)=><Row key={r.id||i} r={r} i={i} details={details} openDetail={openDetail} financeMap={financeMap}/>)}</tbody></table>{!items.length&&<div style={{padding:18,textAlign:'center'}}>{empty}</div>}</div>;
}
function MasterConapeMovementsTableCS21A38({data,onRefresh}){

  const m=data?.conape?.movements||{},all=Array.isArray(m.rows)?m.rows:[],s=m.summary||{};
  const rows=[...all].sort((a,b)=>Number(a.appliedInSystem)-Number(b.appliedInSystem)||Number(b.detectedSort||0)-Number(a.detectedSort||0));
  const pending=rows.filter(r=>!r.appliedInSystem),applied=rows.filter(r=>r.appliedInSystem);
  const financeRows=Array.isArray(data?.collections?.rows)?data.collections.rows:[];
  const financeMap=React.useMemo(()=>{const map={};const byCode={};financeRows.forEach(x=>{const c=String(x?.code||'').trim(),l=String(x?.level||'').trim().toUpperCase();if(!c)return;if(l)map[`${c}|${l}`]=x;(byCode[c]||(byCode[c]=[])).push(x);});Object.keys(byCode).forEach(c=>{if(byCode[c].length===1)map[c]=byCode[c][0];});return map;},[data]);
  const [busy,setBusy]=React.useState(false),[msg,setMsg]=React.useState(''),[details,setDetails]=React.useState({}),[editor,setEditor]=React.useState(null);
  React.useEffect(()=>{const next={};rows.forEach(r=>{const code=String(r?.code||'').trim();if(code)next[code]=String(r?.detail||'');});setDetails(next);},[data]);
  async function refresh(){setBusy(true);setMsg('');try{const r=await window.masterAction('actualizarPanelConapeAhora');setMsg(r.mensaje||'CONAPE actualizado.');await onRefresh?.();}catch(e){setMsg(e.message||String(e));}finally{setBusy(false);}}
  async function openDetail(row,current){const code=String(row?.code||'').trim();if(!code)return;setEditor({row,value:String(current||''),loading:true,saving:false,error:''});try{const data=await postDetalle('getComentarioAdminEstudiante',{codigo:code});setEditor(x=>x?{...x,value:String(data.comentario_admin||''),loading:false,error:''}:x);}catch(e){setEditor(x=>x?{...x,loading:false,error:e.message||String(e)}:x);}}
  async function saveDetail(){if(!editor||editor.loading||editor.saving)return;const code=String(editor.row?.code||'').trim();if(!code)return;setEditor(x=>({...x,saving:true,error:''}));try{const data=await postDetalle('guardarComentarioAdminEstudiante',{codigo:code,comentario:String(editor.value||'').trim()});const saved=String(data.comentario_admin||'');setDetails(prev=>({...prev,[code]:saved}));setMsg(saved?`Detalle de ${editor.row?.name||code} guardado y marcado como revisado.`:`Detalle de ${editor.row?.name||code} eliminado; vuelve a estado sin revisar.`);setEditor(null);}catch(e){setEditor(x=>x?{...x,saving:false,error:e.message||String(e)}:x);}}
  return <section className="master-card master-conape-month-card" data-build={BUILD}>
    <header style={{alignItems:'center'}}><div><span>Seguimiento inmediato</span><h3 style={{marginBottom:3}}>Movimientos CONAPE · pendientes recientes primero</h3><p style={{margin:0,fontSize:10.5,lineHeight:1.35}}>Pendientes arriba · aplicados abajo · WA con monto del nivel · última lectura {fmt(m.lastSync,true)}</p></div><div className="master-conape-month-actions"><span className={`master-live-chip ${(m.monitor||[]).some(x=>x.handler==='sincronizarCONAPE')?'on':'off'}`}>Monitoreo CONAPE</span><button onClick={refresh} disabled={busy}>{busy?'Consultando…':'↻ Actualizar CONAPE ahora'}</button></div></header>
    <div className="master-conape-month-kpis" style={{gridTemplateColumns:'repeat(6,minmax(82px,1fr))',gap:7}}><div><b>{s.pending!=null?s.pending:pending.length}</b><span>pendientes arriba</span></div><div><b>{s.applied!=null?s.applied:applied.length}</b><span>aplicados fuera</span></div><div><b>{s.mora||0}</b><span>morosos</span></div><div><b>{s.levelLinked||0}</b><span>nivel enlazado</span></div><div><b>{s.unlinked||0}</b><span>por vincular</span></div><div><b>{s.advanced||0}</b><span>adelantados</span></div></div>
    {msg&&<div className="master-conape-month-msg">{msg}</div>}
    <Table items={pending} details={details} openDetail={openDetail} financeMap={financeMap} empty="No quedan movimientos pendientes según 7-morosidad."/>
    <details style={{marginTop:10,border:'1px solid #C9D8CC',borderRadius:10,background:'#F7FAF7',overflow:'hidden'}}><summary style={{cursor:'pointer',padding:'9px 12px',fontWeight:900,color:'#2A6338',listStyle:'none'}}>✓ Aplicados en sistema · fuera del seguimiento principal ({applied.length})</summary><div style={{borderTop:'1px solid #D7E2D9'}}><Table items={applied} details={details} openDetail={openDetail} financeMap={financeMap} empty="Todavía no hay movimientos con estado NO exacto en 7-morosidad."/></div></details>
    <DetailModal editor={editor} setEditor={setEditor} onSave={saveDetail}/>
  </section>;
}
function apply(){if(typeof window.MasterConapeMovementsTable!=='function')return;window.MasterConapeMovementsTable=MasterConapeMovementsTableCS21A38;window.__AN_MASTER_CONAPE_MOVEMENTS_BUILD__=BUILD;}
window.addEventListener('an:lazy-module-loaded',e=>{if(String(e?.detail?.src||'').includes('admin_master_dashboard.jsx'))apply();});
setTimeout(apply,0);
})();
