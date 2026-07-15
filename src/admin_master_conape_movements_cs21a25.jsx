// F98.4-Z6-CS21A91 · Panel Maestro CONAPE buscable, ordenable y con nueva segunda plantilla WhatsApp
(function(){
'use strict';

const BUILD='F98.4-Z6-CS21A91';
const LEVEL={B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'};
const LEVEL_ORDER={B1:1,B2:2,I1:3,I2:4};
const STATUS_ORDER={CA:1,APR:2,REP:3,CNV:4,RI:5,RJ:6,PE:7};
const TONE={
  APR:['#E7F6EA','#1E6B32','#B7DDBF'],
  CA:['#EAF4FF','#075B9A','#B9D8F3'],
  REP:['#FDECEC','#A12828','#E8B1B1'],
  RI:['#FFF3D6','#8A5A00','#E8C67A'],
  RJ:['#FFF3D6','#8A5A00','#E8C67A'],
  CNV:['#EEEAFE','#5140A8','#CFC6F4'],
  PE:['#F3F1EC','#625E58','#D9D3CB']
};
const WA_TEMPLATES=[
  {id:1,label:'Mensaje 1'},
  {id:2,label:'Mensaje 2'},
  {id:3,label:'Alerta'},
  {id:4,label:'Atención'}
];

function injectStyles(){
  if(document.getElementById('an-master-conape-cs21a91-styles'))return;
  const style=document.createElement('style');
  style.id='an-master-conape-cs21a91-styles';
  style.textContent=`
    .master-conape-controls{display:grid;grid-template-columns:minmax(260px,1.45fr) repeat(5,minmax(132px,.72fr)) auto;gap:9px;align-items:end;margin:0 0 12px;padding:12px;border:1px solid #E4DED3;border-radius:14px;background:#FBF9F5}
    .master-conape-controls label{display:flex;flex-direction:column;gap:4px;min-width:0}
    .master-conape-controls label>span{font-size:8.5px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:#7A8494}
    .master-conape-controls input,.master-conape-controls select{width:100%;box-sizing:border-box;min-height:36px;border:1px solid #D9D2C7;border-radius:9px;background:#fff;color:#263650;padding:7px 9px;font:700 10.5px inherit;outline:none}
    .master-conape-controls input:focus,.master-conape-controls select:focus{border-color:#6F8FB6;box-shadow:0 0 0 3px rgba(49,95,150,.10)}
    .master-conape-search{position:relative}
    .master-conape-search input{padding-left:31px}
    .master-conape-search:before{content:"⌕";position:absolute;left:10px;bottom:8px;color:#6E7888;font-size:16px;z-index:1}
    .master-conape-clear{min-height:36px;border:0;border-radius:9px;padding:7px 11px;background:#F1E4E2;color:#8A302B;font:800 10px inherit;cursor:pointer;white-space:nowrap}
    .master-conape-result-count{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:-2px 0 10px;color:#6B7484;font-size:10px}
    .master-conape-result-count strong{color:#263650}
    .master-conape-sort-btn{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;color:inherit;padding:0;font:inherit;text-transform:inherit;letter-spacing:inherit;cursor:pointer}
    .master-conape-sort-btn[data-active="true"]{color:#123C73}
    .master-conape-sort-arrow{font-size:10px;line-height:1}
    .master-conape-period-primary{display:block;color:#001E47;font-size:11.5px;font-weight:950;white-space:nowrap}
    .master-conape-period-primary em{font-style:normal;color:#7A1E2C;font-size:9.5px}
    .master-conape-period-extra{display:block;margin-top:4px;padding-top:4px;border-top:1px dashed #D8D1C5;color:#5E6879;font-size:9.5px;font-weight:800;white-space:nowrap}
    .master-conape-period-level{display:block;margin-top:5px;color:#8B7460;font-size:8.8px;font-weight:800;line-height:1.35}
    .master-conape-advance-detail{display:inline-flex;align-items:center;border-radius:999px;padding:4px 7px;background:#FFF1D7;color:#8A5A00;border:1px solid #E7C77D;font-size:8.2px;font-weight:950;white-space:nowrap}
    .master-conape-movement-stack{align-items:flex-start}
    .master-conape-filter-empty{padding:24px 18px;text-align:center;color:#8A93A2;font-size:11px}
    @media(max-width:1480px){.master-conape-controls{grid-template-columns:minmax(240px,1.2fr) repeat(3,minmax(132px,.8fr))}.master-conape-clear{grid-column:auto}}
    @media(max-width:900px){.master-conape-controls{grid-template-columns:1fr 1fr}.master-conape-search{grid-column:1/-1}}
    @media(max-width:620px){.master-conape-controls{grid-template-columns:1fr}.master-conape-search{grid-column:auto}}
  `;
  document.head.appendChild(style);
}

function parseDate(v){
  if(v instanceof Date)return v;
  let s=String(v||'').replace(/\s*\([^)]*\)\s*$/,'').trim();
  let m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if(m)return new Date(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0));
  m=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);
  if(m)return new Date(+m[1],+m[2]-1,+m[3],+(m[4]||0),+(m[5]||0));
  const d=new Date(s);
  return isNaN(d)?null:d;
}
function fullDate(v){
  const d=parseDate(v);
  return d?d.toLocaleString('es-CR',{day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true}).replace(/\./g,''):String(v||'—');
}
function shortDate(v){
  const d=parseDate(v);
  return d?d.toLocaleDateString('es-CR',{day:'2-digit',month:'2-digit'}):'—';
}
function period(r){return r.periodLabel||`${String(r.month||'—').padStart(2,'0')}/${r.year||'—'}`;}
function levelId(r){return String(r?.level||'').trim().toUpperCase();}
function levelText(r){return r.levelLabel||LEVEL[levelId(r)]||'Nivel sin enlazar';}
function movementText(r){
  return({
    PRIMER_DESEMBOLSO:'Primer desembolso',
    NUEVO_DESEMBOLSO:'Nuevo desembolso',
    DESEMBOLSO_MES_ACTUAL:'Desembolso del periodo',
    DESEMBOLSO_REPORTADO:'Desembolso reportado',
    APROBADO_SIN_DESEMBOLSO:'Aprobado sin desembolso',
    DESEMBOLSO_REMOVIDO:'Desembolso retirado'
  }[r.type]||String(r.type||'').replaceAll('_',' '));
}
function money(v){return '₡'+Number(v||0).toLocaleString('es-CR',{maximumFractionDigits:2});}
function phone(v){const x=String(v||'').replace(/\D/g,'');return x.length===8?'506'+x:x;}
function normalize(v){
  return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-CR').replace(/\s+/g,' ').trim();
}
function proper(v){
  return String(v||'').toLocaleLowerCase('es-CR').replace(/(^|[-'’])([a-záéíóúüñ])/g,(m,p,l)=>p+l.toLocaleUpperCase('es-CR'));
}
function givenName(v){const p=String(v||'').trim().split(/\s+/).filter(Boolean);return p.length?proper(p[p.length>=3?2:p.length-1]):'Estudiante';}
function periodKind(v){const x=String(v||'').toUpperCase();return x==='B'||x.includes('BIMEST')?'bimestre':x==='C'||x.includes('CUATRIMEST')?'cuatrimestre':'';}
function disbursementNumber(row){
  const raw=row?.numDisbursement??row?.disbursementNumber??row?.numDesembolso??row?.numeroDesembolso??row?.disbursement??row?.num_desembolso??row?.number??'';
  return raw===''?null:Number(String(raw).replace(/\D/g,''));
}
function isAcademicDisbursement01(row){return disbursementNumber(row)===1;}
function disbursementCode(value){
  const n=Number(value||0);
  return n>0?String(n).padStart(2,'0'):'—';
}
function periodMovementRows(row){
  const fromBackend=Array.isArray(row?.periodMovements)?row.periodMovements.filter(Boolean):[];
  if(fromBackend.length)return fromBackend.slice().sort((a,b)=>Number(a.number||999)-Number(b.number||999)||Number(a.detectedSort||0)-Number(b.detectedSort||0));
  return [{
    number:disbursementNumber(row)||1,
    code:disbursementCode(disbursementNumber(row)||1),
    month:Number(row?.month)||0,
    year:Number(row?.year)||0,
    detectedAt:row?.detectedAt||'',
    detectedSort:Number(row?.detectedSort)||0,
    type:row?.type||'',
    advance:!!row?.advance
  }];
}
function periodFull(item,row){
  const number=disbursementCode(item?.number||item?.code||disbursementNumber(row)||1);
  const month=String(Number(item?.month||row?.month)||0).padStart(2,'0');
  const year=Number(item?.year||row?.year)||'—';
  return `${number}/${month}/${year}`;
}
function movementCategory(row){return row?.advance?'Desembolso adelantado':movementText(row);}
function rowSearch(row){
  return normalize([
    row?.code,row?.cedula,row?.phone,row?.name,row?.group,
    movementText(row),movementCategory(row),levelText(row),row?.academicStatus,
    period(row),...(periodMovementRows(row).map(x=>periodFull(x,row)))
  ].join(' '));
}
function matchesSearch(row,query){
  const q=normalize(query);
  if(!q)return true;
  if(rowSearch(row).includes(q))return true;
  const digits=String(query||'').replace(/\D/g,'');
  if(!digits)return false;
  return [row?.code,row?.cedula,row?.phone].some(v=>String(v||'').replace(/\D/g,'').includes(digits));
}
async function post(fn,payload={}){
  const res=await fetch(`${window.APPS_SCRIPT_URL}?fn=${encodeURIComponent(fn)}`,{
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({fn,token:window.getSessionToken?window.getSessionToken():'',...payload}),
    cache:'no-store'
  });
  const raw=await res.text();
  let data;
  try{data=raw?JSON.parse(raw):null;}catch(_){throw new Error('Apps Script devolvió una respuesta inválida.');}
  if(!res.ok||!data?.ok)throw new Error(data?.mensaje||data?.error||`No se pudo ejecutar ${fn}.`);
  return data;
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
  const party=String.fromCodePoint(0x1F389),warning=String.fromCodePoint(0x26A0,0xFE0F),pin=String.fromCodePoint(0x1F4CC),smile=String.fromCodePoint(0x1F642);
  if(templateId===2){
    return `*CONAPE nos ha solicitado información sobre tu proceso de matrícula, ya que nos informó que el desembolso correspondiente ya fue realizado a tu cuenta.*\n\nPor esta razón, te compartimos nuevamente los números de cuenta de la Academia para que puedas gestionar tu pago de inscripción a la mayor brevedad posible.\n\n*Realizar tu matrícula oportunamente te permitirá evitar atrasos en el desembolso de sostenimiento y posibles inconvenientes con los siguientes desembolsos y los beneficios de tu financiamiento.*\n\nQuedo atenta a tu comprobante de pago. ¡Con gusto te ayudaremos en lo que necesites! ${smile}`;
  }
  if(templateId===3){
    return `*Alerta de pago, ${name} ${warning}*\n\nCONAPE nos confirmó que el *desembolso académico ya fue acreditado en su cuenta.*\n\nAún *no registramos el pago correspondiente en la Academia*. Le agradecemos realizar la transferencia y enviarnos el comprobante a la mayor brevedad para mantener su expediente al día.${amountText}`;
  }
  if(templateId===4){
    return `*Atención prioritaria, ${name} ${pin}*\n\nEl pago correspondiente al desembolso académico de CONAPE *continúa pendiente de aplicación en la Academia.*\n\nLe solicitamos atenderlo *hoy* o comunicarse con nosotros para revisar su caso y evitar atrasos en los próximos desembolsos.${amountText}`;
  }
  return `*¡Buenas noticias, ${name}! ${party}*\n\nCONAPE nos ha informado que el *desembolso ya fue acreditado en su cuenta.*\n\nLe solicitamos realizar el pago a la Academia *a la mayor brevedad posible*, para mantener su expediente *al día* y evitar atrasos en el desembolso del rubro de sostenimiento.${amountText}`;
}
function openConsult(code){
  code=String(code||'').trim();
  if(!code)return;
  try{
    sessionStorage.setItem('an_consulta_prefill',JSON.stringify({codigo:code,origen:'panel_maestro_conape',forceFresh:true}));
    localStorage.setItem('an_active','buscador');
    localStorage.setItem('an_active_admin','buscador');
  }catch(_){}
  window.location.reload();
}
function DetailButton({row,value,onEdit}){
  const linked=!!String(row?.code||'').trim(),reviewed=linked&&!!String(value||'').trim();
  return <button
    type="button"
    className="master-conape-detail-btn"
    disabled={!linked}
    onClick={()=>linked&&onEdit(row,value)}
    title={reviewed?String(value):linked?'Agregar seguimiento':'Sin vínculo'}
    data-reviewed={reviewed?'true':'false'}
  >{!linked?'Sin vínculo':reviewed?'✓ Revisado':'✎ Seguimiento'}</button>;
}
function DetailModal({editor,setEditor,onSave}){
  if(!editor)return null;
  const row=editor.row||{};
  return <div role="dialog" aria-modal="true" onMouseDown={e=>{if(e.target===e.currentTarget&&!editor.saving)setEditor(null);}} style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(0,22,52,.48)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
    <div style={{width:'min(640px,100%)',background:'#fff',borderRadius:18,boxShadow:'0 24px 70px rgba(0,0,0,.24)',overflow:'hidden'}}>
      <div style={{padding:'18px 22px',background:'#F8F4ED'}}>
        <b style={{color:'#7A1E2C'}}>SEGUIMIENTO CONAPE</b>
        <h3 style={{margin:'4px 0 0',color:'#001E47'}}>Detalle del estudiante</h3>
        <small>{row.name||'Sin nombre'} · {row.code||'Sin código'}</small>
      </div>
      <div style={{padding:'20px 22px'}}>
        {editor.loading?'Cargando detalle actual…':<>
          <textarea autoFocus value={editor.value} maxLength={3000} onChange={e=>setEditor(x=>({...x,value:e.target.value,error:''}))} style={{width:'100%',minHeight:160,boxSizing:'border-box',border:'2px solid #D9D2C7',borderRadius:12,padding:13,font:'13.5px/1.5 inherit'}}/>
          {editor.error&&<div style={{marginTop:10,color:'#A31E1E'}}>⚠ {editor.error}</div>}
        </>}
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,padding:'0 22px 18px'}}>
        <button onClick={()=>setEditor(null)} disabled={editor.saving}>Cancelar</button>
        <button onClick={onSave} disabled={editor.loading||editor.saving} style={{background:'#002F6C',color:'#fff',border:0,borderRadius:9,padding:'9px 16px',fontWeight:800}}>{editor.saving?'Guardando…':'Guardar detalle'}</button>
      </div>
    </div>
  </div>;
}
function MovementBadge({row}){
  const applied=!!row.appliedInSystem;
  const mora=row.moraState==='SI'
    ?['Mora SI','#FDECEC','#A12828','#E8B1B1']
    :row.moraState==='NO'
      ?['Mora NO','#EAF6ED','#246B35','#B8D9C0']
      :null;
  return <div className="master-conape-movement-stack">
    <span className="master-conape-movement-badge" data-applied={applied?'true':'false'} title={movementText(row)}>
      {applied?'✓ Aplicado':movementText(row)}
    </span>
    {row.advance&&<span className="master-conape-advance-detail" title={`Periodo ${period(row)} detectado ${fullDate(row.detectedAt)}`}>Desembolso adelantado</span>}
    {mora&&<span className="master-conape-mora-badge" title={`7-morosidad · ${row.moraYear||row.year||'—'} · periodo ${row.moraPeriod||'—'}`} style={{background:mora[1],color:mora[2],borderColor:mora[3]}}>{mora[0]}</span>}
  </div>;
}
function AcademicHistory({items}){
  const rows=(Array.isArray(items)?items:[]).slice().sort((a,b)=>(LEVEL_ORDER[String(a?.level||'').toUpperCase()]||99)-(LEVEL_ORDER[String(b?.level||'').toUpperCase()]||99));
  if(!rows.length)return <span className="master-conape-history-empty">Sin historial CONAPE</span>;
  return <div className="master-conape-history-grid">{rows.map((h,i)=>{
    const status=String(h.status||'SIN_REGISTRO').toUpperCase(),t=TONE[status]||['#F2F0EC','#69635B','#D8D1C7'],hasNote=String(h.note??'').trim()!=='';
    return <div key={`${h.sourceRow||i}-${h.matter||''}`} className="master-conape-history-item" title={`6-historial · ${h.matter||''} · ${h.periodCode||''} · ${status}${hasNote?' '+h.note:''}`}>
      <span className="master-conape-history-level">{String(h.levelLabel||LEVEL[String(h.level||'').toUpperCase()]||h.matter||'Nivel').toUpperCase()}</span>
      <span className="master-conape-history-period">{h.periodCode||`${h.year||''}${h.period||''}${h.periodType||''}`}</span>
      <span className="master-conape-history-status" style={{background:t[0],color:t[1],borderColor:t[2]}}>{status}{hasNote?` ${h.note}`:''}</span>
    </div>;
  })}</div>;
}
function WaButton({row,finance}){
  const [busy,setBusy]=React.useState(false);
  const [template,setTemplate]=React.useState(1);
  const wa=phone(row?.phone),code=String(row?.code||'').trim(),nivel=levelId(row),current=WA_TEMPLATES.find(x=>x.id===template)||WA_TEMPLATES[0];
  if(row?.appliedInSystem)return <div className="master-wa-closed" title="Ya aplicado; no enviar cobro">Cerrado</div>;
  if(!wa)return <div className="master-wa-closed">Sin teléfono</div>;
  function cycle(delta){setTemplate(v=>{const i=WA_TEMPLATES.findIndex(x=>x.id===v),next=(i+delta+WA_TEMPLATES.length)%WA_TEMPLATES.length;return WA_TEMPLATES[next].id;});}
  async function open(){
    if(busy)return;
    setBusy(true);
    const popup=window.open('','_blank');
    try{
      let ficha=null;
      if(code&&nivel)try{ficha=await post('getEstudiante',{codigo:code});}catch(_){}
      const amount=pendingAmount(ficha,nivel,finance);
      const kind=periodKind(ficha?.pendientes?.por_nivel?.[nivel]?.tipo_periodo||finance?.periodType||row?.periodType);
      const url=`https://wa.me/${wa}?text=${encodeURIComponent(waText(row,amount,kind,template))}`;
      if(popup)popup.location.href=url;else window.open(url,'_blank','noopener,noreferrer');
    }catch(e){
      try{popup?.close();}catch(_){}
      alert('No se pudo preparar WhatsApp: '+(e?.message||e));
    }finally{setBusy(false);}
  }
  return <div className="master-wa-panel">
    <div className="master-wa-picker">
      <button type="button" onClick={()=>cycle(-1)} aria-label="Mensaje anterior">‹</button>
      <span title={`Plantilla ${current.id}: ${current.label}`}><b>{current.id}</b> · {current.label}</span>
      <button type="button" onClick={()=>cycle(1)} aria-label="Mensaje siguiente">›</button>
    </div>
    <button type="button" className="master-wa-action" onClick={open} disabled={busy}>{busy?'Preparando…':'WA · Enviar'}</button>
  </div>;
}
function CodeCell({code}){
  return code
    ?<input className="master-conape-code-input" value={code} readOnly aria-label={`Código ${code}`} title={`Código ${code} · clic para seleccionar`} onFocus={e=>e.currentTarget.select()} onClick={e=>e.currentTarget.select()}/>
    :<span className="master-conape-code-empty">—</span>;
}
function StudentCell({row,detail,openDetail,code}){
  return <div className="master-conape-student-box">
    <div className="master-conape-student-name" title={row.name||'Sin nombre'}>{row.name||'Sin nombre'}</div>
    <div className="master-conape-student-meta">
      <span className="master-conape-student-id">{row.cedula||'Sin cédula'}</span>
      <DetailButton row={row} value={detail} onEdit={openDetail}/>
      {code&&<button className="master-conape-consulta-btn" onClick={()=>openConsult(code)}>Consulta</button>}
    </div>
    <div className="master-conape-campus-line">
      <span className={`master-link-status ${row.linked?'linked':'unlinked'}`}>{row.linked?'Vinculado':'Sin vínculo'}</span>
      <span title={row.group||'Sin grupo'}>{row.group||'Sin grupo'}</span>
    </div>
  </div>;
}
function PeriodCell({row}){
  const context=periodMovementRows(row);
  const primary=context.find(item=>Number(item.number)===1)||context[0];
  const extras=context.filter(item=>item!==primary);
  return <div className="master-conape-period-box" title={`${periodFull(primary,row)} · Detectado ${fullDate(primary?.detectedAt||row.detectedAt)}`}>
    <span className="master-conape-period-primary">{periodFull(primary,row)} <em>- D-{shortDate(primary?.detectedAt||row.detectedAt)}</em></span>
    {extras.map((item,index)=><span key={`${item.number||index}-${item.detectedSort||index}`} className="master-conape-period-extra">{periodFull(item,row)} · D-{shortDate(item.detectedAt)}</span>)}
    <span className="master-conape-period-level">{levelText(row)}{row.academicStatus?` · ${row.academicStatus}`:''}</span>
  </div>;
}
function Row({row,index,details,openDetail,financeMap}){
  const code=String(row?.code||'').trim();
  const detail=code&&Object.prototype.hasOwnProperty.call(details,code)?details[code]:String(row.detail||'');
  const finance=financeMap[`${code}|${levelId(row)}`]||financeMap[code]||null;
  const cell={verticalAlign:'middle',minWidth:0};
  return <tr key={row.id||index} className={!row.appliedInSystem&&(!row.linked||row.advance||row.mora)?'has-alert':''} data-applied={row.appliedInSystem?'true':'false'}>
    <td className="master-conape-code-cell" style={cell}><CodeCell code={code}/></td>
    <td className="master-conape-student-cell" style={cell}><StudentCell row={row} detail={detail} openDetail={openDetail} code={code}/></td>
    <td className="master-conape-history-cell" style={cell}><AcademicHistory items={row.historySummary}/></td>
    <td className="master-conape-movement-cell" style={cell}><MovementBadge row={row}/></td>
    <td className="master-conape-period-cell" style={cell}><PeriodCell row={row}/></td>
    <td className="master-conape-wa-cell" style={cell}><WaButton row={row} finance={finance}/></td>
  </tr>;
}
function sortValue(row,key){
  if(key==='code'){
    const n=Number(String(row?.code||'').replace(/\D/g,''));
    return Number.isFinite(n)&&n>0?n:String(row?.code||'');
  }
  if(key==='student')return normalize(row?.name||'');
  if(key==='academic')return (LEVEL_ORDER[levelId(row)]||99)*100+(STATUS_ORDER[String(row?.academicStatus||'').toUpperCase()]||90);
  if(key==='movement')return normalize(movementCategory(row));
  if(key==='period')return (Number(row?.year)||0)*100+(Number(row?.month)||0);
  if(key==='whatsapp')return row?.appliedInSystem?2:(phone(row?.phone)?0:1);
  return Number(row?.detectedSort||0);
}
function compareRows(a,b,sort){
  const av=sortValue(a,sort.key),bv=sortValue(b,sort.key);
  let cmp=0;
  if(typeof av==='number'&&typeof bv==='number')cmp=av-bv;
  else cmp=String(av).localeCompare(String(bv),'es',{numeric:true,sensitivity:'base'});
  if(cmp===0)cmp=Number(b?.detectedSort||0)-Number(a?.detectedSort||0);
  return sort.dir==='asc'?cmp:-cmp;
}
function SortHeader({id,label,sort,onSort}){
  const active=sort.key===id;
  return <button type="button" className="master-conape-sort-btn" data-active={active?'true':'false'} onClick={()=>onSort(id)} title={`Ordenar por ${label}`}>
    <span>{label}</span>
    <span className="master-conape-sort-arrow">{active?(sort.dir==='asc'?'↑':'↓'):'↕'}</span>
  </button>;
}
function Table({items,details,openDetail,financeMap,empty,sort,onSort}){
  const headers=[
    ['code','Código'],['student','Estudiante'],['academic','Resumen académico'],
    ['movement','Movimiento'],['period','Periodo / nivel'],['whatsapp','WhatsApp']
  ];
  return <div className="master-conape-month-table-wrap">
    <table className="master-conape-month-table">
      <colgroup>{[8,22,29,14,14,13].map((w,i)=><col key={i} style={{width:`${w}%`}}/>)}</colgroup>
      <thead><tr>{headers.map(([id,label])=><th key={id}><SortHeader id={id} label={label} sort={sort} onSort={onSort}/></th>)}</tr></thead>
      <tbody>{items.map((r,i)=><Row key={r.id||i} row={r} index={i} details={details} openDetail={openDetail} financeMap={financeMap}/>)}</tbody>
    </table>
    {!items.length&&<div className="master-conape-empty">{empty}</div>}
  </div>;
}
function filterRows(rows,filters){
  return rows.filter(row=>{
    if(!matchesSearch(row,filters.query))return false;
    if(filters.movement!=='ALL'&&movementCategory(row)!==filters.movement)return false;
    if(filters.level==='SIN_NIVEL'&&levelId(row))return false;
    if(filters.level!=='ALL'&&filters.level!=='SIN_NIVEL'&&levelId(row)!==filters.level)return false;
    if(filters.status!=='ALL'&&String(row?.academicStatus||'SIN_ESTADO').toUpperCase()!==filters.status)return false;
    if(filters.period!=='ALL'&&`${String(row?.month||0).padStart(2,'0')}/${row?.year||0}`!==filters.period)return false;
    if(filters.whatsapp==='AVAILABLE'&&(!phone(row?.phone)||row?.appliedInSystem))return false;
    if(filters.whatsapp==='MISSING'&&phone(row?.phone))return false;
    if(filters.whatsapp==='CLOSED'&&!row?.appliedInSystem)return false;
    return true;
  });
}
function uniqueSorted(values){
  return Array.from(new Set(values.filter(Boolean))).sort((a,b)=>String(a).localeCompare(String(b),'es',{numeric:true,sensitivity:'base'}));
}
function MasterConapeMovementsTableCS21A70({data,onRefresh}){
  injectStyles();
  const m=data?.conape?.movements||{};
  const source=Array.isArray(m.rows)?m.rows:[];
  const all=source.filter(isAcademicDisbursement01);
  const financeRows=Array.isArray(data?.collections?.rows)?data.collections.rows:[];

  const [busy,setBusy]=React.useState(false);
  const [msg,setMsg]=React.useState('');
  const [details,setDetails]=React.useState({});
  const [editor,setEditor]=React.useState(null);
  const [query,setQuery]=React.useState('');
  const [movementFilter,setMovementFilter]=React.useState('ALL');
  const [levelFilter,setLevelFilter]=React.useState('ALL');
  const [statusFilter,setStatusFilter]=React.useState('ALL');
  const [periodFilter,setPeriodFilter]=React.useState('ALL');
  const [whatsappFilter,setWhatsappFilter]=React.useState('ALL');
  const [sort,setSort]=React.useState({key:'detected',dir:'desc'});

  const financeMap=React.useMemo(()=>{
    const out={},by={};
    financeRows.forEach(x=>{
      const c=String(x?.code||'').trim(),l=String(x?.level||'').trim().toUpperCase();
      if(!c)return;
      if(l)out[`${c}|${l}`]=x;
      (by[c]||(by[c]=[])).push(x);
    });
    Object.keys(by).forEach(c=>{if(by[c].length===1)out[c]=by[c][0];});
    return out;
  },[data]);

  React.useEffect(()=>{
    const x={};
    all.forEach(r=>{const c=String(r?.code||'').trim();if(c)x[c]=String(r?.detail||'');});
    setDetails(x);
  },[data]);

  const movementOptions=React.useMemo(()=>uniqueSorted(all.map(movementCategory)),[data]);
  const statusOptions=React.useMemo(()=>uniqueSorted(all.map(r=>String(r?.academicStatus||'SIN_ESTADO').toUpperCase())),[data]);
  const periodOptions=React.useMemo(()=>uniqueSorted(all.map(r=>`${String(r?.month||0).padStart(2,'0')}/${r?.year||0}`)),[data]);

  const filters={query,movement:movementFilter,level:levelFilter,status:statusFilter,period:periodFilter,whatsapp:whatsappFilter};
  const visible=React.useMemo(()=>filterRows(all,filters).slice().sort((a,b)=>compareRows(a,b,sort)),[
    data,query,movementFilter,levelFilter,statusFilter,periodFilter,whatsappFilter,sort.key,sort.dir
  ]);
  const pending=visible.filter(r=>!r.appliedInSystem);
  const applied=visible.filter(r=>r.appliedInSystem);
  const originalPending=all.filter(r=>!r.appliedInSystem);
  const originalApplied=all.filter(r=>r.appliedInSystem);
  const stats={
    mora:all.filter(r=>r.moraState==='SI').length,
    levelLinked:all.filter(r=>!!r.level).length,
    unlinked:all.filter(r=>!r.linked).length,
    advanced:all.filter(r=>!!r.advance).length
  };
  const hasFilters=!!query||movementFilter!=='ALL'||levelFilter!=='ALL'||statusFilter!=='ALL'||periodFilter!=='ALL'||whatsappFilter!=='ALL';

  function onSort(key){
    setSort(current=>current.key===key?{key,dir:current.dir==='asc'?'desc':'asc'}:{key,dir:'asc'});
  }
  function clearFilters(){
    setQuery('');
    setMovementFilter('ALL');
    setLevelFilter('ALL');
    setStatusFilter('ALL');
    setPeriodFilter('ALL');
    setWhatsappFilter('ALL');
  }
  async function refresh(){
    setBusy(true);
    setMsg('');
    try{
      const r=await window.masterAction('actualizarPanelConapeAhora');
      setMsg(r.mensaje||'CONAPE actualizado.');
      await onRefresh?.();
    }catch(e){
      setMsg(e.message||String(e));
    }finally{
      setBusy(false);
    }
  }
  async function openDetail(row,current){
    const codigo=String(row?.code||'').trim();
    if(!codigo)return;
    setEditor({row,value:String(current||''),loading:true,saving:false,error:''});
    try{
      const r=await post('getComentarioAdminEstudiante',{codigo});
      setEditor(x=>x?{...x,value:String(r.comentario_admin||''),loading:false}:x);
    }catch(e){
      setEditor(x=>x?{...x,loading:false,error:e.message||String(e)}:x);
    }
  }
  async function saveDetail(){
    if(!editor||editor.loading||editor.saving)return;
    const codigo=String(editor.row?.code||'').trim();
    setEditor(x=>({...x,saving:true,error:''}));
    try{
      const r=await post('guardarComentarioAdminEstudiante',{codigo,comentario:String(editor.value||'').trim()});
      const saved=String(r.comentario_admin||'');
      setDetails(x=>({...x,[codigo]:saved}));
      setMsg(saved?'Seguimiento guardado y marcado como revisado.':'Seguimiento eliminado.');
      setEditor(null);
    }catch(e){
      setEditor(x=>x?{...x,saving:false,error:e.message||String(e)}:x);
    }
  }

  return <section className="master-card master-conape-month-card" data-build={BUILD}>
    <header>
      <div>
        <span>Seguimiento inmediato</span>
        <h3>Desembolsos académicos 01 · pendientes primero</h3>
        <p>01 se gestiona; 02, 03 y posteriores del mismo periodo se muestran debajo como referencia · última lectura {fullDate(m.lastSync)}</p>
      </div>
      <div className="master-conape-month-actions">
        <span className={`master-live-chip ${(m.monitor||[]).some(x=>x.handler==='sincronizarCONAPE')?'on':'off'}`}>Monitoreo CONAPE</span>
        <button onClick={refresh} disabled={busy}>{busy?'Consultando…':'↻ Actualizar CONAPE ahora'}</button>
      </div>
    </header>

    <div className="master-conape-month-kpis">
      <div><b>{originalPending.length}</b><span>01 pendientes</span></div>
      <div><b>{originalApplied.length}</b><span>01 cerrados</span></div>
      <div><b>{stats.mora}</b><span>morosos</span></div>
      <div><b>{stats.levelLinked}</b><span>nivel enlazado</span></div>
      <div><b>{stats.unlinked}</b><span>por vincular</span></div>
      <div><b>{stats.advanced}</b><span>adelantados</span></div>
    </div>

    <div className="master-conape-controls">
      <label className="master-conape-search">
        <span>Buscar estudiante</span>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Código, cédula, teléfono o nombre"/>
      </label>
      <label>
        <span>Movimiento</span>
        <select value={movementFilter} onChange={e=>setMovementFilter(e.target.value)}>
          <option value="ALL">Todos</option>
          {movementOptions.map(value=><option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label>
        <span>Nivel</span>
        <select value={levelFilter} onChange={e=>setLevelFilter(e.target.value)}>
          <option value="ALL">Todos</option>
          {Object.keys(LEVEL).map(value=><option key={value} value={value}>{value} · {LEVEL[value]}</option>)}
          <option value="SIN_NIVEL">Sin nivel enlazado</option>
        </select>
      </label>
      <label>
        <span>Resumen académico</span>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="ALL">Todos</option>
          {statusOptions.map(value=><option key={value} value={value}>{value==='SIN_ESTADO'?'Sin estado':value}</option>)}
        </select>
      </label>
      <label>
        <span>Periodo</span>
        <select value={periodFilter} onChange={e=>setPeriodFilter(e.target.value)}>
          <option value="ALL">Todos</option>
          {periodOptions.map(value=><option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label>
        <span>WhatsApp</span>
        <select value={whatsappFilter} onChange={e=>setWhatsappFilter(e.target.value)}>
          <option value="ALL">Todos</option>
          <option value="AVAILABLE">Disponible para enviar</option>
          <option value="MISSING">Sin teléfono</option>
          <option value="CLOSED">Cerrados</option>
        </select>
      </label>
      <label>
        <span>Orden</span>
        <select value={`${sort.key}:${sort.dir}`} onChange={e=>{const [key,dir]=e.target.value.split(':');setSort({key,dir});}}>
          <option value="detected:desc">Más reciente</option>
          <option value="code:asc">Código ascendente</option>
          <option value="code:desc">Código descendente</option>
          <option value="student:asc">Estudiante A–Z</option>
          <option value="student:desc">Estudiante Z–A</option>
          <option value="academic:asc">Resumen académico</option>
          <option value="movement:asc">Movimiento</option>
          <option value="period:asc">Periodo ascendente</option>
          <option value="period:desc">Periodo descendente</option>
          <option value="whatsapp:asc">WhatsApp disponible primero</option>
        </select>
      </label>
      {hasFilters&&<button type="button" className="master-conape-clear" onClick={clearFilters}>Limpiar filtros</button>}
    </div>

    <div className="master-conape-result-count">
      <span><strong>{visible.length}</strong> de {all.length} estudiantes visibles</span>
      <span>También podés ordenar tocando cada encabezado.</span>
    </div>

    {msg&&<div className="master-conape-month-msg">{msg}</div>}

    <Table
      items={pending}
      details={details}
      openDetail={openDetail}
      financeMap={financeMap}
      empty={hasFilters?'No hay pendientes que coincidan con los filtros.':'No quedan desembolsos académicos 01 pendientes según 7-morosidad.'}
      sort={sort}
      onSort={onSort}
    />

    <details className="master-conape-applied">
      <summary>✓ Desembolsos académicos 01 cerrados ({applied.length}{hasFilters?` de ${originalApplied.length}`:''})</summary>
      <Table
        items={applied}
        details={details}
        openDetail={openDetail}
        financeMap={financeMap}
        empty={hasFilters?'No hay cerrados que coincidan con los filtros.':'Todavía no hay desembolsos académicos 01 cerrados.'}
        sort={sort}
        onSort={onSort}
      />
    </details>

    <DetailModal editor={editor} setEditor={setEditor} onSave={saveDetail}/>
  </section>;
}

function apply(){
  if(typeof window.MasterConapeMovementsTable!=='function')return;
  window.MasterConapeMovementsTable=MasterConapeMovementsTableCS21A70;
  window.__AN_MASTER_CONAPE_MOVEMENTS_BUILD__=BUILD;
}
window.addEventListener('an:lazy-module-loaded',e=>{
  if(String(e?.detail?.src||'').includes('admin_master_dashboard.jsx'))apply();
});
setTimeout(apply,0);
})();