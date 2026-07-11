// F98.4-Z6-CS21A35 · Seguimiento inmediato CONAPE con detalle revisado resaltado.
(function(){
'use strict';
const BUILD='F98.4-Z6-CS21A35';
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
function phone(v){const d=String(v||'').replace(/\D/g,'');return d.length===8?'506'+d:d;}
function money(v){return '₡'+Number(v||0).toLocaleString('es-CR',{maximumFractionDigits:2});}
function period(r){return r.periodLabel||((r.month?MONTHS[+r.month-1]:'—')+' '+(r.year||'—'));}
function type(r){
  if(r.advance)return'Desembolso adelantado';
  return ({PRIMER_DESEMBOLSO:'Primer desembolso',NUEVO_DESEMBOLSO:'Nuevo desembolso',DESEMBOLSO_MES_ACTUAL:'Desembolso del periodo',DESEMBOLSO_REPORTADO:'Desembolso reportado',APROBADO_SIN_DESEMBOLSO:'Aprobado sin desembolso',DESEMBOLSO_REMOVIDO:'Desembolso retirado'}[r.type]||String(r.type||'').replaceAll('_',' '));
}
function levelText(r){return r.levelLabel||LEVEL_LABEL[String(r.level||'').toUpperCase()]||'Nivel sin enlazar';}
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
function detalleVisible(v){const text=String(v||'').trim();if(!text)return'Sin nota registrada.';return text.length>110?text.slice(0,107)+'…':text;}
function DetailButton({row,value,onEdit}){
  const linked=!!String(row?.code||'').trim();
  const text=String(value||'').trim();
  const reviewed=linked&&!!text;
  const label=!linked
    ?'Detalle: Sin vínculo con DATOS.'
    :reviewed
      ?`✓ REVISADO · CON SEGUIMIENTO — ${detalleVisible(text)}`
      :'Detalle: Sin nota registrada.';
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
      width:'100%',marginTop:6,padding:reviewed?'9px 10px':'7px 9px',borderRadius:9,
      border:reviewed?'2px solid #4338CA':'1px solid #DED5C7',
      background:reviewed?'#4F46E5':(linked?'#F5F0E7':'#F0EEE9'),
      color:reviewed?'#FFFFFF':(linked?'#4D3B2B':'#8B867F'),
      boxShadow:reviewed?'0 0 0 3px rgba(79,70,229,.14)':'none',
      fontSize:reviewed?10.8:10.5,lineHeight:1.4,whiteSpace:'normal',textAlign:'left',
      cursor:linked?'pointer':'not-allowed',fontFamily:'inherit',fontWeight:reviewed?900:700,
      transition:'background .16s ease,border-color .16s ease,color .16s ease,box-shadow .16s ease'
    }}>
    <b>{label}</b>{linked&&<span style={{float:'right',marginLeft:8,fontSize:reviewed?14:12}}>{reviewed?'✓':'✎'}</span>}
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
  const moraRef=`7-morosidad · ${row.moraYear||row.year||'—'} · periodo ${row.moraPeriod||'—'}`;
  if(row.appliedInSystem)return <><span className="master-conape-movement-badge" style={{background:'#E5F5E9',color:'#1F6A32',border:'1px solid #A9D5B4'}}>✓ Aplicado en sistema</span><small style={{display:'block',marginTop:6,color:'#315D3A',fontWeight:800}}>{type(row)} · {levelText(row)}</small><small style={{display:'block',marginTop:3,color:'#5F6F63'}}>{moraRef} · estado NO</small>{Number(row.appliedCount||0)>0?<small style={{display:'block',marginTop:3,color:'#6A746C'}}>Evidencia complementaria: {money(row.appliedAmount)} · {Number(row.appliedCount||0)} registro(s)</small>:null}</>;
  const pending=row.moraState==='SI'?'Pendiente · 7-morosidad estado SI':'Pendiente · sin fila exacta en 7-morosidad';
  return <><span className="master-conape-movement-badge" style={row.advance?{background:'#FFF3CD',color:'#8A5A00'}:null}>{type(row)}</span><small style={{display:'block',marginTop:6,color:'#8A4F00',fontWeight:850}}>{pending}</small><small style={{display:'block',marginTop:3,color:'#73695C'}}>{moraRef} · {levelText(row)}</small></>;
}
function Row({r,i,details,openDetail}){
  const p=period(r),wa=phone(r.phone),code=String(r?.code||'').trim(),detail=code&&Object.prototype.hasOwnProperty.call(details,code)?details[code]:String(r.detail||'');
  const txt=`Hola ${String(r.name||'').split(' ')[0]}, CONAPE reportó el desembolso #${r.disbursement||''} del periodo ${p}. Te contactamos desde Academia Norteamericana para dar seguimiento.`;
  return <tr key={r.id||i} className={!r.appliedInSystem&&(!r.linked||r.advance||r.mora)?'has-alert':''} style={r.appliedInSystem?{opacity:.78,background:'#F7FAF7'}:null}>
    <td style={{whiteSpace:'normal',verticalAlign:'top'}}><strong>{r.name||'Sin nombre'}</strong><small>{r.cedula}{r.code?` · ${r.code}`:''}</small><DetailButton row={r} value={detail} onEdit={openDetail}/></td>
    <td style={{verticalAlign:'top'}}><ApplicationBadge row={r}/><span style={{display:'inline-block',marginTop:7,padding:'3px 7px',borderRadius:999,fontSize:9.5,fontWeight:900,...moraStyle(r)}}>{moraText(r)}</span>{r.moraRowCount>1&&<small style={{display:'block',marginTop:4,color:'#A12828',fontWeight:850}}>⚠ {r.moraRowCount} filas de morosidad</small>}</td>
    <td style={{verticalAlign:'top'}}><b>#{r.disbursement||'—'}</b><small>{fmt(r.eventDate,false)}</small></td>
    <td style={{verticalAlign:'top',fontWeight:800}}>{p}<small style={{display:'block',marginTop:4,fontWeight:700,color:'#697384'}}>{levelText(r)}{r.academicStatus?` · ${r.academicStatus}`:''}</small></td>
    <td style={{verticalAlign:'top'}}>{r.linked?<span className="master-link-status linked">Vinculado</span>:<span className="master-link-status unlinked">Sin vínculo</span>}<small>{r.group||'Sin grupo'}</small>{r.appliedInSystem?<small style={{display:'block',marginTop:4,color:'#2F6B3B',fontWeight:800}}>Aplicación: 7-morosidad</small>:null}{r.appliedSources?.length?<small style={{display:'block',marginTop:4,color:'#6A746C'}}>Pagos complementarios: {r.appliedSources.join(' + ')}</small>:null}</td>
    <td style={{verticalAlign:'top'}}>{fmt(r.detectedAt,true)}</td>
    <td style={{verticalAlign:'top'}}>{wa?<a className="master-wa-action" href={`https://wa.me/${wa}?text=${encodeURIComponent(txt)}`} target="_blank" rel="noreferrer">WA Dar seguimiento</a>:<span className="master-no-phone">Sin teléfono</span>}</td>
  </tr>;
}
function Table({items,details,openDetail,empty}){
  return <div className="master-conape-month-table-wrap"><table className="master-conape-month-table" style={{tableLayout:'fixed',minWidth:1240}}><thead><tr><th style={{width:'24%'}}>Estudiante</th><th style={{width:'20%'}}>Movimiento</th><th>Desembolso</th><th>Periodo / nivel</th><th>Campus</th><th>Detectado</th><th>Contacto</th></tr></thead><tbody>{items.map((r,i)=><Row key={r.id||i} r={r} i={i} details={details} openDetail={openDetail}/>)}</tbody></table>{!items.length&&<div style={{padding:24,textAlign:'center'}}>{empty}</div>}</div>;
}
function MasterConapeMovementsTableCS21A35({data,onRefresh}){
  const m=data?.conape?.movements||{},all=Array.isArray(m.rows)?m.rows:[],s=m.summary||{};
  const rows=[...all].sort((a,b)=>Number(a.appliedInSystem)-Number(b.appliedInSystem)||Number(b.detectedSort||0)-Number(a.detectedSort||0));
  const pending=rows.filter(r=>!r.appliedInSystem),applied=rows.filter(r=>r.appliedInSystem);
  const [busy,setBusy]=React.useState(false),[msg,setMsg]=React.useState(''),[details,setDetails]=React.useState({}),[editor,setEditor]=React.useState(null);
  React.useEffect(()=>{const next={};rows.forEach(r=>{const code=String(r?.code||'').trim();if(code)next[code]=String(r?.detail||'');});setDetails(next);},[data]);
  async function refresh(){setBusy(true);setMsg('');try{const r=await window.masterAction('actualizarPanelConapeAhora');setMsg(r.mensaje||'CONAPE actualizado.');await onRefresh?.();}catch(e){setMsg(e.message||String(e));}finally{setBusy(false);}}
  async function openDetail(row,current){const code=String(row?.code||'').trim();if(!code)return;setEditor({row,value:String(current||''),loading:true,saving:false,error:''});try{const data=await postDetalle('getComentarioAdminEstudiante',{codigo:code});setEditor(x=>x?{...x,value:String(data.comentario_admin||''),loading:false,error:''}:x);}catch(e){setEditor(x=>x?{...x,loading:false,error:e.message||String(e)}:x);}}
  async function saveDetail(){if(!editor||editor.loading||editor.saving)return;const code=String(editor.row?.code||'').trim();if(!code)return;setEditor(x=>({...x,saving:true,error:''}));try{const data=await postDetalle('guardarComentarioAdminEstudiante',{codigo:code,comentario:String(editor.value||'').trim()});const saved=String(data.comentario_admin||'');setDetails(prev=>({...prev,[code]:saved}));setMsg(saved?`Detalle de ${editor.row?.name||code} guardado y marcado como revisado.`:`Detalle de ${editor.row?.name||code} eliminado; vuelve a estado sin revisar.`);setEditor(null);}catch(e){setEditor(x=>x?{...x,saving:false,error:e.message||String(e)}:x);}}
  return <section className="master-card master-conape-month-card" data-build={BUILD}>
    <header><div><span>Seguimiento inmediato</span><h3>Movimientos CONAPE · pendientes recientes primero</h3><p>“Aplicado en sistema” se determina por coincidencia exacta en 7-morosidad: misma cédula, año y periodo cuatrimestral con estado NO. Meses 01–04=P1, 05–08=P2 y 09–12=P3. Los detalles con contenido se resaltan como revisados para facilitar el seguimiento del día siguiente. BDBANCARIO queda excluida · última lectura {fmt(m.lastSync,true)}</p></div><div className="master-conape-month-actions"><span className={`master-live-chip ${(m.monitor||[]).some(x=>x.handler==='sincronizarCONAPE')?'on':'off'}`}>Monitoreo CONAPE</span><button onClick={refresh} disabled={busy}>{busy?'Consultando…':'↻ Actualizar CONAPE ahora'}</button></div></header>
    <div className="master-conape-month-kpis" style={{gridTemplateColumns:'repeat(6,minmax(120px,1fr))'}}><div><b>{s.pending!=null?s.pending:pending.length}</b><span>pendientes arriba</span></div><div><b>{s.applied!=null?s.applied:applied.length}</b><span>aplicados fuera</span></div><div><b>{s.mora||0}</b><span>morosos</span></div><div><b>{s.levelLinked||0}</b><span>nivel enlazado</span></div><div><b>{s.unlinked||0}</b><span>por vincular</span></div><div><b>{s.advanced||0}</b><span>adelantados</span></div></div>
    {msg&&<div className="master-conape-month-msg">{msg}</div>}
    <Table items={pending} details={details} openDetail={openDetail} empty="No quedan movimientos pendientes según 7-morosidad."/>
    <details style={{marginTop:16,border:'1px solid #C9D8CC',borderRadius:12,background:'#F7FAF7',overflow:'hidden'}}><summary style={{cursor:'pointer',padding:'13px 16px',fontWeight:900,color:'#2A6338',listStyle:'none'}}>✓ Aplicados en sistema · fuera del seguimiento principal ({applied.length})</summary><div style={{borderTop:'1px solid #D7E2D9'}}><Table items={applied} details={details} openDetail={openDetail} empty="Todavía no hay movimientos con estado NO exacto en 7-morosidad."/></div></details>
    <DetailModal editor={editor} setEditor={setEditor} onSave={saveDetail}/>
  </section>;
}
function apply(){if(typeof window.MasterConapeMovementsTable!=='function')return;window.MasterConapeMovementsTable=MasterConapeMovementsTableCS21A35;window.__AN_MASTER_CONAPE_MOVEMENTS_BUILD__=BUILD;}
window.addEventListener('an:lazy-module-loaded',e=>{if(String(e?.detail?.src||'').includes('admin_master_dashboard.jsx'))apply();});
setTimeout(apply,0);
})();
