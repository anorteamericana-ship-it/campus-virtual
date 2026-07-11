// F98.4-Z6-CS21A49 · Seguimiento inmediato horizontal profesional + WA con 3 plantillas.
(function(){
'use strict';
const BUILD='F98.4-Z6-CS21A49';
const LEVEL={B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'};
const LEVEL_ORDER={B1:1,B2:2,I1:3,I2:4};
const TONE={APR:['#E7F6EA','#1E6B32','#B7DDBF'],CA:['#EAF4FF','#075B9A','#B9D8F3'],REP:['#FDECEC','#A12828','#E8B1B1'],RI:['#FFF3D6','#8A5A00','#E8C67A'],RJ:['#FFF3D6','#8A5A00','#E8C67A'],CNV:['#EEEAFE','#5140A8','#CFC6F4'],PE:['#F3F1EC','#625E58','#D9D3CB']};
const WA_TEMPLATES=[{id:1,label:'Mensaje'},{id:2,label:'Alerta'},{id:3,label:'Atención'}];

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
function disbursementNumber(row){const raw=row?.numDisbursement??row?.disbursementNumber??row?.numDesembolso??row?.numeroDesembolso??row?.disbursement??row?.num_desembolso??row?.number??'';return raw===''?null:Number(raw);}
function isAcademicDisbursement01(row){const n=disbursementNumber(row);return n===1;}
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
function amountLine(row,amount,kind){
  if(!(amount>0))return'';
  const last=levelId(row)==='I2',kindText=kind?` (${kind})`:'';
  return `\n\n*Monto correspondiente ${last?'al último nivel, ':'a '}${levelText(row)}${kindText}: ${money(amount)}.*`;
}
function waText(row,amount,kind,templateId){
  const name=givenName(row?.name),amountText=amountLine(row,amount,kind);
  const party=String.fromCodePoint(0x1F389),warning=String.fromCodePoint(0x26A0,0xFE0F),pin=String.fromCodePoint(0x1F4CC);
  if(templateId===2){
    return `*Alerta de pago, ${name} ${warning}*\n\nCONAPE nos confirmó que el *desembolso académico ya fue acreditado en su cuenta.*\n\nAún *no registramos el pago correspondiente en la Academia*. Le agradecemos realizar la transferencia y enviarnos el comprobante a la mayor brevedad para mantener su expediente al día.${amountText}`;
  }
  if(templateId===3){
    return `*Atención prioritaria, ${name} ${pin}*\n\nEl pago correspondiente al desembolso académico de CONAPE *continúa pendiente de aplicación en la Academia.*\n\nLe solicitamos atenderlo *hoy* o comunicarse con nosotros para revisar su caso y evitar atrasos en los próximos desembolsos.${amountText}`;
  }
  return `*¡Buenas noticias, ${name}! ${party}*\n\nCONAPE nos ha informado que el *desembolso ya fue acreditado en su cuenta.*\n\nLe solicitamos realizar el pago a la Academia *a la mayor brevedad posible*, para mantener su expediente *al día* y evitar atrasos en el desembolso del rubro de sostenimiento.${amountText}`;
}
function openConsult(code){
  code=String(code||'').trim();if(!code)return;
  try{sessionStorage.setItem('an_consulta_prefill',JSON.stringify({codigo:code,origen:'panel_maestro_conape',forceFresh:true}));localStorage.setItem('an_active','buscador');localStorage.setItem('an_active_admin','buscador');}catch(_){ }
  window.location.reload();
}
function DetailButton({row,value,onEdit}){
  const linked=!!String(row?.code||'').trim(),reviewed=linked&&!!String(value||'').trim();
  return <button type="button" className="master-conape-detail-btn" disabled={!linked} onClick={()=>linked&&onEdit(row,value)} title={reviewed?String(value):linked?'Agregar seguimiento':'Sin vínculo'} data-reviewed={reviewed?'true':'false'}>{!linked?'Sin vínculo':reviewed?'✓ Revisado':'✎ Seguimiento'}</button>;
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
  return <div className="master-conape-movement-stack"><span className="master-conape-movement-badge" data-applied={applied?'true':'false'} title={movementText(row)}>{applied?'✓ Aplicado':movementText(row)}</span><span className="master-conape-mora-badge" title={`7-morosidad · ${row.moraYear||row.year||'—'} · periodo ${row.moraPeriod||'—'}`} style={{background:mora[1],color:mora[2],borderColor:mora[3]}}>{mora[0]}</span></div>;
}
function AcademicHistory({items}){
  const rows=(Array.isArray(items)?items:[]).slice().sort((a,b)=>(LEVEL_ORDER[String(a?.level||'').toUpperCase()]||99)-(LEVEL_ORDER[String(b?.level||'').toUpperCase()]||99));
  if(!rows.length)return <span className="master-conape-history-empty">Sin historial CONAPE</span>;
  return <div className="master-conape-history-grid">{rows.map((h,i)=>{const status=String(h.status||'SIN_REGISTRO').toUpperCase(),t=TONE[status]||['#F2F0EC','#69635B','#D8D1C7'],hasNote=String(h.note??'').trim()!=='';
    return <div key={`${h.sourceRow||i}-${h.matter||''}`} className="master-conape-history-item" title={`6-historial · ${h.matter||''} · ${h.periodCode||''} · ${status}${hasNote?' '+h.note:''}`}><span className="master-conape-history-level">{String(h.levelLabel||LEVEL[String(h.level||'').toUpperCase()]||h.matter||'Nivel').toUpperCase()}</span><span className="master-conape-history-period">{h.periodCode||`${h.year||''}${h.period||''}${h.periodType||''}`}</span><span className="master-conape-history-status" style={{background:t[0],color:t[1],borderColor:t[2]}}>{status}{hasNote?` ${h.note}`:''}</span></div>;
  })}</div>;
}
function WaButton({row,finance}){
  const [busy,setBusy]=React.useState(false),[template,setTemplate]=React.useState(1),wa=phone(row?.phone),code=String(row?.code||'').trim(),nivel=levelId(row),current=WA_TEMPLATES.find(x=>x.id===template)||WA_TEMPLATES[0];
  if(row?.appliedInSystem)return <div className="master-wa-closed" title="Ya aplicado; no enviar cobro">Cerrado</div>;
  if(!wa)return <div className="master-wa-closed">Sin teléfono</div>;
  function cycle(delta){setTemplate(v=>{const i=WA_TEMPLATES.findIndex(x=>x.id===v),next=(i+delta+WA_TEMPLATES.length)%WA_TEMPLATES.length;return WA_TEMPLATES[next].id;});}
  async function open(){if(busy)return;setBusy(true);const popup=window.open('','_blank');try{let ficha=null;if(code&&nivel)try{ficha=await post('getEstudiante',{codigo:code});}catch(_){ }const amount=pendingAmount(ficha,nivel,finance),kind=periodKind(ficha?.pendientes?.por_nivel?.[nivel]?.tipo_periodo||finance?.periodType||row?.periodType),url=`https://wa.me/${wa}?text=${encodeURIComponent(waText(row,amount,kind,template))}`;if(popup)popup.location.href=url;else window.open(url,'_blank','noopener,noreferrer');}catch(e){try{popup?.close();}catch(_){ }alert('No se pudo preparar WhatsApp: '+(e?.message||e));}finally{setBusy(false);}}
  return <div className="master-wa-panel"><div className="master-wa-picker"><button type="button" onClick={()=>cycle(-1)} aria-label="Mensaje anterior">‹</button><span title={`Plantilla ${current.id}: ${current.label}`}><b>{current.id}</b> · {current.label}</span><button type="button" onClick={()=>cycle(1)} aria-label="Mensaje siguiente">›</button></div><button type="button" className="master-wa-action" onClick={open} disabled={busy}>{busy?'Preparando…':'WA · Enviar'}</button></div>;
}
function CodeCell({code}){return code?<input className="master-conape-code-input" value={code} readOnly aria-label={`Código ${code}`} title={`Código ${code} · clic para seleccionar`} onFocus={e=>e.currentTarget.select()} onClick={e=>e.currentTarget.select()}/>:<span className="master-conape-code-empty">—</span>;}
function StudentCell({row,detail,openDetail,code}){
  return <div className="master-conape-student-box"><div className="master-conape-student-name" title={row.name||'Sin nombre'}>{row.name||'Sin nombre'}</div><div className="master-conape-student-meta"><span className="master-conape-student-id">{row.cedula||'Sin cédula'}</span><DetailButton row={row} value={detail} onEdit={openDetail}/>{code&&<button className="master-conape-consulta-btn" onClick={()=>openConsult(code)}>Consulta</button>}</div><div className="master-conape-campus-line"><span className={`master-link-status ${row.linked?'linked':'unlinked'}`}>{row.linked?'Vinculado':'Sin vínculo'}</span><span title={row.group||'Sin grupo'}>{row.group||'Sin grupo'}</span></div></div>;
}
function PeriodCell({row}){return <div className="master-conape-period-box" title={`${period(row)} · Detectado ${fullDate(row.detectedAt)}`}><strong>{period(row)} <span>· Det. {shortDate(row.detectedAt)}</span></strong><small>{levelText(row)}{row.academicStatus?` · ${row.academicStatus}`:''}</small></div>;}
function Row({row,index,details,openDetail,financeMap}){
  const code=String(row?.code||'').trim(),detail=code&&Object.prototype.hasOwnProperty.call(details,code)?details[code]:String(row.detail||''),finance=financeMap[`${code}|${levelId(row)}`]||financeMap[code]||null,cell={verticalAlign:'middle',minWidth:0};
  return <tr key={row.id||index} className={!row.appliedInSystem&&(!row.linked||row.advance||row.mora)?'has-alert':''} data-applied={row.appliedInSystem?'true':'false'}>
    <td className="master-conape-code-cell" style={cell}><CodeCell code={code}/></td>
    <td className="master-conape-student-cell" style={cell}><StudentCell row={row} detail={detail} openDetail={openDetail} code={code}/></td>
    <td className="master-conape-history-cell" style={cell}><AcademicHistory items={row.historySummary}/></td>
    <td className="master-conape-movement-cell" style={cell}><MovementBadge row={row}/></td>
    <td className="master-conape-period-cell" style={cell}><PeriodCell row={row}/></td>
    <td className="master-conape-wa-cell" style={cell}><WaButton row={row} finance={finance}/></td>
  </tr>;
}
function Table({items,details,openDetail,financeMap,empty}){return <div className="master-conape-month-table-wrap"><table className="master-conape-month-table"><colgroup>{[8,22,29,14,14,13].map((w,i)=><col key={i} style={{width:`${w}%`}}/>)}</colgroup><thead><tr><th>Código</th><th>Estudiante</th><th>Resumen académico</th><th>Movimiento</th><th>Periodo / nivel</th><th>WhatsApp</th></tr></thead><tbody>{items.map((r,i)=><Row key={r.id||i} row={r} index={i} details={details} openDetail={openDetail} financeMap={financeMap}/>)}</tbody></table>{!items.length&&<div className="master-conape-empty">{empty}</div>}</div>;}
function MasterConapeMovementsTableCS21A49({data,onRefresh}){
  const m=data?.conape?.movements||{},source=Array.isArray(m.rows)?m.rows:[],all=source.filter(isAcademicDisbursement01),rows=[...all].sort((a,b)=>Number(a.appliedInSystem)-Number(b.appliedInSystem)||Number(b.detectedSort||0)-Number(a.detectedSort||0)),pending=rows.filter(r=>!r.appliedInSystem),applied=rows.filter(r=>r.appliedInSystem),financeRows=Array.isArray(data?.collections?.rows)?data.collections.rows:[];
  const stats={mora:rows.filter(r=>r.moraState==='SI').length,levelLinked:rows.filter(r=>!!r.level).length,unlinked:rows.filter(r=>!r.linked).length,advanced:rows.filter(r=>!!r.advance).length};
  const financeMap=React.useMemo(()=>{const out={},by={};financeRows.forEach(x=>{const c=String(x?.code||'').trim(),l=String(x?.level||'').trim().toUpperCase();if(!c)return;if(l)out[`${c}|${l}`]=x;(by[c]||(by[c]=[])).push(x);});Object.keys(by).forEach(c=>{if(by[c].length===1)out[c]=by[c][0];});return out;},[data]);
  const [busy,setBusy]=React.useState(false),[msg,setMsg]=React.useState(''),[details,setDetails]=React.useState({}),[editor,setEditor]=React.useState(null);
  React.useEffect(()=>{const x={};rows.forEach(r=>{const c=String(r?.code||'').trim();if(c)x[c]=String(r?.detail||'');});setDetails(x);},[data]);
  async function refresh(){setBusy(true);setMsg('');try{const r=await window.masterAction('actualizarPanelConapeAhora');setMsg(r.mensaje||'CONAPE actualizado.');await onRefresh?.();}catch(e){setMsg(e.message||String(e));}finally{setBusy(false);}}
  async function openDetail(row,current){const codigo=String(row?.code||'').trim();if(!codigo)return;setEditor({row,value:String(current||''),loading:true,saving:false,error:''});try{const r=await post('getComentarioAdminEstudiante',{codigo});setEditor(x=>x?{...x,value:String(r.comentario_admin||''),loading:false}:x);}catch(e){setEditor(x=>x?{...x,loading:false,error:e.message||String(e)}:x);}}
  async function saveDetail(){if(!editor||editor.loading||editor.saving)return;const codigo=String(editor.row?.code||'').trim();setEditor(x=>({...x,saving:true,error:''}));try{const r=await post('guardarComentarioAdminEstudiante',{codigo,comentario:String(editor.value||'').trim()}),saved=String(r.comentario_admin||'');setDetails(x=>({...x,[codigo]:saved}));setMsg(saved?'Seguimiento guardado y marcado como revisado.':'Seguimiento eliminado.');setEditor(null);}catch(e){setEditor(x=>x?{...x,saving:false,error:e.message||String(e)}:x);}}
  return <section className="master-card master-conape-month-card" data-build={BUILD}><header><div><span>Seguimiento inmediato</span><h3>Desembolsos académicos 01 · pendientes primero</h3><p>Ruta académica desde 6-historial · última lectura {fullDate(m.lastSync)}</p></div><div className="master-conape-month-actions"><span className={`master-live-chip ${(m.monitor||[]).some(x=>x.handler==='sincronizarCONAPE')?'on':'off'}`}>Monitoreo CONAPE</span><button onClick={refresh} disabled={busy}>{busy?'Consultando…':'↻ Actualizar CONAPE ahora'}</button></div></header><div className="master-conape-month-kpis"><div><b>{pending.length}</b><span>01 pendientes</span></div><div><b>{applied.length}</b><span>01 cerrados</span></div><div><b>{stats.mora}</b><span>morosos</span></div><div><b>{stats.levelLinked}</b><span>nivel enlazado</span></div><div><b>{stats.unlinked}</b><span>por vincular</span></div><div><b>{stats.advanced}</b><span>adelantados</span></div></div>{msg&&<div className="master-conape-month-msg">{msg}</div>}<Table items={pending} details={details} openDetail={openDetail} financeMap={financeMap} empty="No quedan desembolsos académicos 01 pendientes según 7-morosidad."/><details className="master-conape-applied"><summary>✓ Desembolsos académicos 01 cerrados ({applied.length})</summary><Table items={applied} details={details} openDetail={openDetail} financeMap={financeMap} empty="Todavía no hay desembolsos académicos 01 cerrados."/></details><DetailModal editor={editor} setEditor={setEditor} onSave={saveDetail}/></section>;
}
function apply(){if(typeof window.MasterConapeMovementsTable!=='function')return;window.MasterConapeMovementsTable=MasterConapeMovementsTableCS21A49;window.__AN_MASTER_CONAPE_MOVEMENTS_BUILD__=BUILD;}
window.addEventListener('an:lazy-module-loaded',e=>{if(String(e?.detail?.src||'').includes('admin_master_dashboard.jsx'))apply();});setTimeout(apply,0);
})();
