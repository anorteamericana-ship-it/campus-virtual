// F98.4-Z6-CS21A43 · Seguimiento inmediato: código independiente + resumen directo de 6-historial.
(function(){
'use strict';
const BUILD='F98.4-Z6-CS21A43';
const LEVEL={B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'};
const TONE={APR:['#E7F6EA','#1E6B32','#B7DDBF'],CA:['#EAF4FF','#075B9A','#B9D8F3'],REP:['#FDECEC','#A12828','#E8B1B1'],RI:['#FFF3D6','#8A5A00','#E8C67A'],RJ:['#FFF3D6','#8A5A00','#E8C67A'],CNV:['#EEEAFE','#5140A8','#CFC6F4']};

function parseDate(v){
  if(v instanceof Date)return v;
  let s=String(v||'').replace(/\s*\([^)]*\)\s*$/,'').trim(),m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if(m)return new Date(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0));
  m=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);
  if(m)return new Date(+m[1],+m[2]-1,+m[3],+(m[4]||0),+(m[5]||0));
  const d=new Date(s);return isNaN(d)?null:d;
}
function fullDate(v){const d=parseDate(v);return d?d.toLocaleString('es-CR',{day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true}).replace(/\./g,''):String(v||'—');}
function shortDate(v){const d=parseDate(v);return d?d.toLocaleDateString('es-CR',{day:'2-digit',month:'2-digit'}):'—';}
function period(r){return r.periodLabel||`${String(r.month||'—').padStart(2,'0')}/${r.year||'—'}`;}
function levelId(r){return String(r?.level||'').trim().toUpperCase();}
function levelText(r){return r.levelLabel||LEVEL[levelId(r)]||'Nivel sin enlazar';}
function movementText(r){if(r.advance)return'Desembolso adelantado';return({PRIMER_DESEMBOLSO:'Primer desembolso',NUEVO_DESEMBOLSO:'Nuevo desembolso',DESEMBOLSO_MES_ACTUAL:'Desembolso del periodo',DESEMBOLSO_REPORTADO:'Desembolso reportado',APROBADO_SIN_DESEMBOLSO:'Aprobado sin desembolso',DESEMBOLSO_REMOVIDO:'Desembolso retirado'}[r.type]||String(r.type||'').replaceAll('_',' '));}
function money(v){return '₡'+Number(v||0).toLocaleString('es-CR',{maximumFractionDigits:2});}
function phone(v){const x=String(v||'').replace(/\D/g,'');return x.length===8?'506'+x:x;}
function proper(v){return String(v||'').toLocaleLowerCase('es-CR').replace(/(^|[-'’])([a-záéíóúüñ])/g,(m,p,l)=>p+l.toLocaleUpperCase('es-CR'));}
function givenName(v){const p=String(v||'').trim().split(/\s+/).filter(Boolean);return p.length?proper(p[p.length>=3?2:p.length-1]):'Estudiante';}
function periodKind(v){const x=String(v||'').toUpperCase();return x==='B'||x.includes('BIMEST')?'bimestre':x==='C'||x.includes('CUATRIMEST')?'cuatrimestre':'';}
async function post(fn,payload={}){
  const res=await fetch(`${window.APPS_SCRIPT_URL}?fn=${encodeURIComponent(fn)}`,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({fn,token:window.getSessionToken?window.getSessionToken():'',...payload}),cache:'no-store'});
  const raw=await res.text();let data;try{data=raw?JSON.parse(raw):null;}catch(_){throw new Error('Apps Script devolvió una respuesta inválida.');}
  if(!res.ok||!data?.ok)throw new Error(data?.mensaje||data?.error||`No se pudo ejecutar ${fn}.`);return data;
}
function pendingAmount(ficha,nivel,fallback){
  const x=ficha?.pendientes?.por_nivel?.[nivel]||{},n=v=>Math.max(0,Number(v)||0);
  let total=n(x.matricula_pend)+n(x.cuotas_pend)+n(x.cert_pend);
  if(nivel==='I2')total+=n(x.programa_completo_pend??x.titulo_pend)+n(x.toeic_pend);
  return Math.round((total>0?total:n(fallback?.pendingTotal))*100)/100;
}
function waText(row,amount,kind){
  const name=givenName(row?.name),nivel=levelText(row),last=levelId(row)==='I2',party=String.fromCodePoint(0x1F389),kindText=kind?` (${kind})`:'';
  const amountText=amount>0?`\n\n*Monto correspondiente ${last?'al último nivel, ':'a '}${nivel}${kindText}: ${money(amount)}.*`:'';
  return `*¡Buenas noticias, ${name}! ${party}*\n\nCONAPE nos ha informado que el *desembolso ya fue acreditado en su cuenta.*\n\nLe solicitamos realizar el pago a la Academia *a la mayor brevedad posible*, para mantener su expediente *al día* y evitar atrasos en el desembolso del rubro de sostenimiento.${amountText}`;
}
function openConsult(code){
  code=String(code||'').trim();if(!code)return;
  try{sessionStorage.setItem('an_consulta_prefill',JSON.stringify({codigo:code,origen:'panel_maestro_conape',forceFresh:true}));localStorage.setItem('an_active','buscador');localStorage.setItem('an_active_admin','buscador');}catch(_){ }
  window.location.reload();
}

function DetailButton({row,value,onEdit}){
  const linked=!!String(row?.code||'').trim(),reviewed=linked&&!!String(value||'').trim();
  return <button type="button" disabled={!linked} onClick={()=>linked&&onEdit(row,value)} title={reviewed?String(value):linked?'Agregar seguimiento':'Sin vínculo'} data-reviewed={reviewed?'true':'false'} style={{padding:'3px 6px',borderRadius:999,border:reviewed?'1px solid #4338CA':'1px solid #D8D0C5',background:reviewed?'#4F46E5':linked?'#F5F0E7':'#F0EEE9',color:reviewed?'#fff':'#4D3B2B',font:'900 8.2px/1.1 inherit',whiteSpace:'nowrap',cursor:linked?'pointer':'not-allowed'}}>{!linked?'Sin vínculo':reviewed?'✓ Revisado':'✎ Seguimiento'}</button>;
}
function DetailModal({editor,setEditor,onSave}){
  if(!editor)return null;const row=editor.row||{};
  return <div role="dialog" aria-modal="true" onMouseDown={e=>{if(e.target===e.currentTarget&&!editor.saving)setEditor(null);}} style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(0,22,52,.48)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
    <div style={{width:'min(640px,100%)',background:'#fff',borderRadius:18,boxShadow:'0 24px 70px rgba(0,0,0,.24)',overflow:'hidden'}}>
      <div style={{padding:'18px 22px',background:'#F8F4ED'}}><b style={{color:'#7A1E2C'}}>SEGUIMIENTO CONAPE</b><h3 style={{margin:'4px 0 0',color:'#001E47'}}>Detalle del estudiante</h3><small>{row.name||'Sin nombre'} · {row.code||'Sin código'}</small></div>
      <div style={{padding:'20px 22px'}}>{editor.loading?'Cargando detalle actual…':<><textarea autoFocus value={editor.value} maxLength={3000} onChange={e=>setEditor(x=>({...x,value:e.target.value,error:''}))} style={{width:'100%',minHeight:160,boxSizing:'border-box',border:'2px solid #D9D2C7',borderRadius:12,padding:13,font:'13.5px/1.5 inherit'}}/>{editor.error&&<div style={{marginTop:10,color:'#A31E1E'}}>⚠ {editor.error}</div>}</>}</div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,padding:'0 22px 18px'}}><button onClick={()=>setEditor(null)} disabled={editor.saving}>Cancelar</button><button onClick={onSave} disabled={editor.loading||editor.saving} style={{background:'#002F6C',color:'#fff',border:0,borderRadius:9,padding:'9px 16px',fontWeight:800}}>{editor.saving?'Guardando…':'Guardar detalle'}</button></div>
    </div>
  </div>;
}
function MovementBadge({row}){
  const applied=!!row.appliedInSystem,mora=row.moraState==='SI'?['Mora SI','#FDECEC','#A12828','#E8B1B1']:row.moraState==='NO'?['Mora NO','#EAF6ED','#246B35','#B8D9C0']:['Sin fila','#F3F1EC','#716A61','#D8D1C7'];
  return <div style={{display:'flex',gap:4,flexWrap:'wrap'}}><span className="master-conape-movement-badge" title={movementText(row)} style={applied?{background:'#E5F5E9',color:'#1F6A32',border:'1px solid #A9D5B4',padding:'3px 6px',fontSize:8.4}:{padding:'3px 6px',fontSize:8.4}}>{applied?'✓ Aplicado':movementText(row)}</span><span title={`7-morosidad · ${row.moraYear||row.year||'—'} · periodo ${row.moraPeriod||'—'}`} style={{padding:'2px 5px',borderRadius:999,background:mora[1],color:mora[2],border:`1px solid ${mora[3]}`,fontSize:8,fontWeight:900,whiteSpace:'nowrap'}}>{mora[0]}</span></div>;
}
function AcademicHistory({items}){
  const rows=Array.isArray(items)?items:[];if(!rows.length)return <span className="master-conape-history-empty">Sin historial CONAPE</span>;
  return <div className="master-conape-history-grid">{rows.map((h,i)=>{const status=String(h.status||'SIN_REGISTRO').toUpperCase(),t=TONE[status]||['#F2F0EC','#69635B','#D8D1C7'],hasNote=String(h.note??'').trim()!=='';
    return <div key={`${h.sourceRow||i}-${h.matter||''}`} className="master-conape-history-item" title={`6-historial · ${h.matter||''} · ${h.periodCode||''} · ${status}${hasNote?' '+h.note:''}`}><span className="master-conape-history-level">{String(h.levelLabel||LEVEL[String(h.level||'').toUpperCase()]||h.matter||'Nivel').toUpperCase()}</span><span className="master-conape-history-period">{h.periodCode||`${h.year||''}${h.period||''}${h.periodType||''}`}</span><span className="master-conape-history-status" style={{background:t[0],color:t[1],border:`1px solid ${t[2]}`}}>{status}{hasNote?` ${h.note}`:''}</span></div>;
  })}</div>;
}
function WaButton({row,finance}){
  const [busy,setBusy]=React.useState(false),wa=phone(row?.phone),code=String(row?.code||'').trim(),nivel=levelId(row);
  if(row?.appliedInSystem)return <small title="Ya aplicado; no enviar cobro">No enviar</small>;
  if(!wa)return <small>Sin teléfono</small>;
  async function open(){if(busy)return;setBusy(true);const popup=window.open('','_blank');try{let ficha=null;if(code&&nivel)try{ficha=await post('getEstudiante',{codigo:code});}catch(_){ }const amount=pendingAmount(ficha,nivel,finance),kind=periodKind(ficha?.pendientes?.por_nivel?.[nivel]?.tipo_periodo||finance?.periodType||row?.periodType),url=`https://wa.me/${wa}?text=${encodeURIComponent(waText(row,amount,kind))}`;if(popup)popup.location.href=url;else window.open(url,'_blank','noopener,noreferrer');}catch(e){try{popup?.close();}catch(_){ }alert('No se pudo preparar WhatsApp: '+(e?.message||e));}finally{setBusy(false);}}
  return <button type="button" className="master-wa-action" onClick={open} disabled={busy} style={{width:'100%',padding:'6px 3px',border:0,borderRadius:8,fontSize:8.5,fontWeight:900,whiteSpace:'nowrap'}}>{busy?'…':'WA'}</button>;
}
function CodeCell({code}){return code?<input className="master-conape-code-input" value={code} readOnly aria-label={`Código ${code}`} title={`Código ${code} · clic para seleccionar`} onFocus={e=>e.currentTarget.select()} onClick={e=>e.currentTarget.select()}/>:<span className="master-conape-code-empty">—</span>;}
function Row({row,index,details,openDetail,financeMap}){
  const code=String(row?.code||'').trim(),detail=code&&Object.prototype.hasOwnProperty.call(details,code)?details[code]:String(row.detail||''),finance=financeMap[`${code}|${levelId(row)}`]||financeMap[code]||null,cell={padding:'6px',verticalAlign:'middle',minWidth:0,overflow:'hidden'};
  return <tr key={row.id||index} className={!row.appliedInSystem&&(!row.linked||row.advance||row.mora)?'has-alert':''} style={row.appliedInSystem?{opacity:.78,background:'#F7FAF7'}:null}>
    <td className="master-conape-code-cell" style={{...cell,textAlign:'center'}}><CodeCell code={code}/></td>
    <td className="master-conape-student-cell" style={cell}><div className="master-conape-student-name" title={row.name||'Sin nombre'}>{row.name||'Sin nombre'}</div><div className="master-conape-student-meta"><span className="master-conape-student-id">{row.cedula||'Sin cédula'}</span><DetailButton row={row} value={detail} onEdit={openDetail}/>{code&&<button className="master-conape-consulta-btn" onClick={()=>openConsult(code)}>Consulta</button>}</div></td>
    <td className="master-conape-history-cell" style={cell}><AcademicHistory items={row.historySummary}/></td>
    <td style={cell}><MovementBadge row={row}/></td>
    <td style={cell}><div title={`${period(row)} · Detectado ${fullDate(row.detectedAt)}`} style={{fontSize:9.2,fontWeight:950,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{period(row)} <span style={{color:'#687181'}}>· Det. {shortDate(row.detectedAt)}</span></div><small style={{display:'block',marginTop:2,fontSize:8.1,fontWeight:800,color:'#697384',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{levelText(row)}{row.academicStatus?` · ${row.academicStatus}`:''}</small></td>
    <td style={cell}><div style={{display:'flex',gap:4,flexWrap:'wrap'}}><span className={`master-link-status ${row.linked?'linked':'unlinked'}`} style={{padding:'2px 4px',fontSize:7.8}}>{row.linked?'Vinculado':'Sin vínculo'}</span><small title={row.group||'Sin grupo'} style={{fontSize:7.9,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{row.group||'Sin grupo'}</small></div></td>
    <td style={{...cell,padding:'5px 4px',overflow:'visible'}}><WaButton row={row} finance={finance}/></td>
  </tr>;
}
function Table({items,details,openDetail,financeMap,empty}){return <div className="master-conape-month-table-wrap"><table className="master-conape-month-table"><colgroup>{[8,19,30,13,14,10,6].map((w,i)=><col key={i} style={{width:`${w}%`}}/>)}</colgroup><thead><tr><th>Código</th><th>Estudiante</th><th>Resumen académico</th><th>Movimiento</th><th>Periodo / nivel</th><th>Campus</th><th>WA</th></tr></thead><tbody>{items.map((r,i)=><Row key={r.id||i} row={r} index={i} details={details} openDetail={openDetail} financeMap={financeMap}/>)}</tbody></table>{!items.length&&<div style={{padding:18,textAlign:'center'}}>{empty}</div>}</div>;}
function MasterConapeMovementsTableCS21A43({data,onRefresh}){
  const m=data?.conape?.movements||{},all=Array.isArray(m.rows)?m.rows:[],s=m.summary||{},rows=[...all].sort((a,b)=>Number(a.appliedInSystem)-Number(b.appliedInSystem)||Number(b.detectedSort||0)-Number(a.detectedSort||0)),pending=rows.filter(r=>!r.appliedInSystem),applied=rows.filter(r=>r.appliedInSystem),financeRows=Array.isArray(data?.collections?.rows)?data.collections.rows:[];
  const financeMap=React.useMemo(()=>{const out={},by={};financeRows.forEach(x=>{const c=String(x?.code||'').trim(),l=String(x?.level||'').trim().toUpperCase();if(!c)return;if(l)out[`${c}|${l}`]=x;(by[c]||(by[c]=[])).push(x);});Object.keys(by).forEach(c=>{if(by[c].length===1)out[c]=by[c][0];});return out;},[data]);
  const [busy,setBusy]=React.useState(false),[msg,setMsg]=React.useState(''),[details,setDetails]=React.useState({}),[editor,setEditor]=React.useState(null);
  React.useEffect(()=>{const x={};rows.forEach(r=>{const c=String(r?.code||'').trim();if(c)x[c]=String(r?.detail||'');});setDetails(x);},[data]);
  async function refresh(){setBusy(true);setMsg('');try{const r=await window.masterAction('actualizarPanelConapeAhora');setMsg(r.mensaje||'CONAPE actualizado.');await onRefresh?.();}catch(e){setMsg(e.message||String(e));}finally{setBusy(false);}}
  async function openDetail(row,current){const codigo=String(row?.code||'').trim();if(!codigo)return;setEditor({row,value:String(current||''),loading:true,saving:false,error:''});try{const r=await post('getComentarioAdminEstudiante',{codigo});setEditor(x=>x?{...x,value:String(r.comentario_admin||''),loading:false}:x);}catch(e){setEditor(x=>x?{...x,loading:false,error:e.message||String(e)}:x);}}
  async function saveDetail(){if(!editor||editor.loading||editor.saving)return;const codigo=String(editor.row?.code||'').trim();setEditor(x=>({...x,saving:true,error:''}));try{const r=await post('guardarComentarioAdminEstudiante',{codigo,comentario:String(editor.value||'').trim()}),saved=String(r.comentario_admin||'');setDetails(x=>({...x,[codigo]:saved}));setMsg(saved?'Seguimiento guardado y marcado como revisado.':'Seguimiento eliminado.');setEditor(null);}catch(e){setEditor(x=>x?{...x,saving:false,error:e.message||String(e)}:x);}}
  return <section className="master-card master-conape-month-card" data-build={BUILD}><header><div><span>Seguimiento inmediato</span><h3>Movimientos CONAPE · pendientes recientes primero</h3><p style={{margin:0,fontSize:10}}>Ruta académica desde 6-historial · última lectura {fullDate(m.lastSync)}</p></div><div className="master-conape-month-actions"><span className={`master-live-chip ${(m.monitor||[]).some(x=>x.handler==='sincronizarCONAPE')?'on':'off'}`}>Monitoreo CONAPE</span><button onClick={refresh} disabled={busy}>{busy?'Consultando…':'↻ Actualizar CONAPE ahora'}</button></div></header><div className="master-conape-month-kpis" style={{gridTemplateColumns:'repeat(6,minmax(82px,1fr))'}}><div><b>{s.pending??pending.length}</b><span>pendientes</span></div><div><b>{s.applied??applied.length}</b><span>aplicados</span></div><div><b>{s.mora||0}</b><span>morosos</span></div><div><b>{s.levelLinked||0}</b><span>nivel enlazado</span></div><div><b>{s.unlinked||0}</b><span>por vincular</span></div><div><b>{s.advanced||0}</b><span>adelantados</span></div></div>{msg&&<div className="master-conape-month-msg">{msg}</div>}<Table items={pending} details={details} openDetail={openDetail} financeMap={financeMap} empty="No quedan movimientos pendientes según 7-morosidad."/><details style={{marginTop:10,border:'1px solid #C9D8CC',borderRadius:10,overflow:'hidden'}}><summary style={{padding:'9px 12px',fontWeight:900,color:'#2A6338',cursor:'pointer'}}>✓ Aplicados en sistema ({applied.length})</summary><Table items={applied} details={details} openDetail={openDetail} financeMap={financeMap} empty="Todavía no hay movimientos aplicados."/></details><DetailModal editor={editor} setEditor={setEditor} onSave={saveDetail}/></section>;
}
function apply(){if(typeof window.MasterConapeMovementsTable!=='function')return;window.MasterConapeMovementsTable=MasterConapeMovementsTableCS21A43;window.__AN_MASTER_CONAPE_MOVEMENTS_BUILD__=BUILD;}
window.addEventListener('an:lazy-module-loaded',e=>{if(String(e?.detail?.src||'').includes('admin_master_dashboard.jsx'))apply();});setTimeout(apply,0);
})();
