// F98.4-Z6-CS21A25 · Panel Maestro CONAPE sin filtro mensual.
(function(){
const MONTHS=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
function date(v){if(v instanceof Date)return v;let s=String(v||'').replace(/\s*\([^)]*\)\s*$/,'').trim(),m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);if(m)return new Date(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0));m=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);if(m)return new Date(+m[1],+m[2]-1,+m[3],+(m[4]||0),+(m[5]||0));let d=new Date(s);return isNaN(d)?null:d}
function fmt(v,time){let d=date(v);if(!d)return String(v||'—');let f=d.toLocaleDateString('es-CR',{day:'2-digit',month:'short',year:'numeric'}).replace(/\./g,'');return time?f+' · '+d.toLocaleTimeString('es-CR',{hour:'numeric',minute:'2-digit',hour12:true}):f}
function phone(v){let d=String(v||'').replace(/\D/g,'');return d.length===8?'506'+d:d}
function period(r){return r.periodLabel||((r.month?MONTHS[+r.month-1]:'—')+' '+(r.year||'—'))}
function type(r){if(r.advance)return'Desembolso adelantado';return({PRIMER_DESEMBOLSO:'Primer desembolso',NUEVO_DESEMBOLSO:'Nuevo desembolso',DESEMBOLSO_MES_ACTUAL:'Desembolso del mes',DESEMBOLSO_REPORTADO:'Desembolso reportado',APROBADO_SIN_DESEMBOLSO:'Aprobado sin desembolso',DESEMBOLSO_REMOVIDO:'Desembolso retirado'}[r.type]||String(r.type||'').replaceAll('_',' '))}
function MasterConapeMovementsTableCS21A25({data,onRefresh}){
 const m=data?.conape?.movements||{},rows=m.rows||[],s=m.summary||{},[busy,setBusy]=React.useState(false),[msg,setMsg]=React.useState('');
 async function refresh(){setBusy(true);setMsg('');try{let r=await window.masterAction('actualizarPanelConapeAhora');setMsg(r.mensaje||'CONAPE actualizado.');await onRefresh?.()}catch(e){setMsg(e.message)}finally{setBusy(false)}}
 return <section className="master-card master-conape-month-card">
  <header><div><span>Seguimiento inmediato</span><h3>Movimientos CONAPE · Todos los periodos</h3><p>Todos los movimientos nuevos, desembolsos adelantados y detalle APOLLO · última lectura {fmt(m.lastSync,true)}</p></div><div className="master-conape-month-actions"><span className={`master-live-chip ${(m.monitor||[]).some(x=>x.handler==='sincronizarCONAPE')?'on':'off'}`}>Monitoreo CONAPE</span><button onClick={refresh} disabled={busy}>{busy?'Consultando…':'↻ Actualizar CONAPE ahora'}</button></div></header>
  <div className="master-conape-month-kpis" style={{gridTemplateColumns:'repeat(5,minmax(130px,1fr))'}}><div><b>{s.total||0}</b><span>movimientos nuevos</span></div><div><b>{s.advanced||0}</b><span>adelantados</span></div><div><b>{s.linked||0}</b><span>vinculados</span></div><div><b>{s.unlinked||0}</b><span>por vincular</span></div><div><b>{s.newDisbursement||0}</b><span>desembolsos</span></div></div>
  {msg&&<div className="master-conape-month-msg">{msg}</div>}
  <div className="master-conape-month-table-wrap"><table className="master-conape-month-table" style={{tableLayout:'fixed',minWidth:1180}}><thead><tr><th style={{width:'25%'}}>Estudiante</th><th>Movimiento</th><th>Desembolso</th><th>Periodo</th><th>Campus</th><th>Detectado</th><th>Contacto</th></tr></thead><tbody>
  {rows.map((r,i)=>{let p=period(r),wa=phone(r.phone),txt=`Hola ${String(r.name||'').split(' ')[0]}, CONAPE reportó el desembolso #${r.disbursement||''} del periodo ${p}. Te contactamos desde Academia Norteamericana para dar seguimiento.`;return <tr key={r.id||i} className={!r.linked||r.advance?'has-alert':''}>
   <td style={{whiteSpace:'normal',verticalAlign:'top'}}><strong>{r.name||'Sin nombre'}</strong><small>{r.cedula}{r.code?` · ${r.code}`:''}</small><div title={r.detail||''} style={{marginTop:6,padding:'6px 8px',borderRadius:7,background:'#F5F0E7',fontSize:10.5,lineHeight:1.4,whiteSpace:'normal'}}><b>Detalle APOLLO:</b> {r.detail||'Sin nota registrada'}</div></td>
   <td style={{verticalAlign:'top'}}><span className="master-conape-movement-badge" style={r.advance?{background:'#FFF3CD',color:'#8A5A00'}:null}>{type(r)}</span>{r.advance&&<small style={{color:'#8A5A00',fontWeight:800}}>Periodo posterior</small>}</td>
   <td style={{verticalAlign:'top'}}><b>#{r.disbursement||'—'}</b><small>{fmt(r.eventDate,false)}</small></td><td style={{verticalAlign:'top',fontWeight:800}}>{p}</td>
   <td style={{verticalAlign:'top'}}>{r.linked?<span className="master-link-status linked">Vinculado</span>:<span className="master-link-status unlinked">Sin vínculo</span>}<small>{r.group||'Sin grupo'}</small></td>
   <td style={{verticalAlign:'top'}}>{fmt(r.detectedAt,true)}</td><td style={{verticalAlign:'top'}}>{wa?<a className="master-wa-action" href={`https://wa.me/${wa}?text=${encodeURIComponent(txt)}`} target="_blank" rel="noreferrer">WA Dar seguimiento</a>:<span className="master-no-phone">Sin teléfono</span>}</td>
  </tr>})}</tbody></table>{!rows.length&&<div style={{padding:24,textAlign:'center'}}>Sin movimientos nuevos.</div>}</div>
 </section>
}
function apply(){if(typeof window.MasterConapeMovementsTable!=='function')return;window.MasterConapeMovementsTable=MasterConapeMovementsTableCS21A25}
window.addEventListener('an:lazy-module-loaded',e=>{if(String(e?.detail?.src||'').includes('admin_master_dashboard.jsx'))apply()});setTimeout(apply,0);
})();