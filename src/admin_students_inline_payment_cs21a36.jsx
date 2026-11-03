// F98.4-Z6-CS21A36 · Aplicar pago dentro de Consulta individual, por intento vigente.
// Reutiliza sin duplicar los endpoints oficiales getComprobantes, getEstudiante y aplicarPago.
(function(){
'use strict';

const BUILD='F111-TOEIC-PROFORMA-HISTORICA-20261031';
const LABEL={B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'};
const RUBRO_LABEL={MATRICULA:'Matrícula',CUOTA:'Cuotas',CERTIFICADO:'Certificado',PROGRAMA_COMPLETO:'Programa completo',TOEIC:'TOEIC'};
const InlinePaymentContext=React.createContext(null);
let OriginalResumen=null;
let OriginalIntento=null;
let OriginalAbrirPago=null;

function norm(v){return String(v==null?'':v).trim();}
function upper(v){return norm(v).toUpperCase();}
function num(v){const n=Number(v||0);return Number.isFinite(n)?n:0;}
function round(v){return Math.round((num(v)+Number.EPSILON)*100)/100;}
function money(v){try{return new Intl.NumberFormat('es-CR',{style:'currency',currency:'CRC',maximumFractionDigits:0}).format(num(v));}catch(_){return '₡'+Math.round(num(v)).toLocaleString('es-CR');}}
function receiptSaldo(item){const direct=Number(item?.saldo),calc=num(item?.credito)-num(item?.aplicado);return Math.max(0,round(Number.isFinite(direct)?direct:calc));}
function availableReceipts(list){const seen=new Set();return (Array.isArray(list)?list:[]).filter(x=>{const d=norm(x?.doc),s=receiptSaldo(x);if(!d||seen.has(d)||s<=.009)return false;seen.add(d);return true;}).map(x=>({...x,saldo:receiptSaldo(x)}));}
function requestId(){try{if(globalThis.crypto?.randomUUID)return 'PAY-'+crypto.randomUUID();}catch(_){}return `PAY-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;}

function inlineFinanceSafeUserError(raw, fallback, context = '') {
  const msg=String(raw==null?'':raw).trim();
  if(!msg)return fallback;
  const technicalCode=/^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);
  const technicalText=/apps?\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|aborterror|failed to fetch|network request failed|<html|\bjson\b|\btoken\b|unauthorized|forbidden|internal server|http\s*\d{3}|status\s*\d{3}|respuesta inv[aá]lida|request[_ -]?id|getEstudiante|getComprobantes|aplicarPago/i.test(msg);
  if(technicalCode||technicalText){
    console.warn('[AdminInlineFinance] Detalle técnico oculto al operador.',{context,error:msg});
    return fallback;
  }
  return msg;
}

async function postInline(fn,payload={},timeoutMs=35000){
  const token=window.getSessionToken?window.getSessionToken():'';
  const controller=typeof AbortController!=='undefined'?new AbortController():null;
  const timer=controller?setTimeout(()=>controller.abort(),timeoutMs):null;
  try{
    const response=await fetch(`${window.APPS_SCRIPT_URL}?fn=${encodeURIComponent(fn)}`,{
      method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({fn,token,...payload}),cache:'no-store',redirect:'follow',
      signal:controller?controller.signal:undefined
    });
    const raw=await response.text();let data;
    try{data=JSON.parse(String(raw||'').trim());}catch(_){throw new Error(`Respuesta inválida del backend en ${fn}.`);}
    if(!response.ok||data?.ok!==true)throw new Error(data?.error||data?.mensaje||`No se pudo ejecutar ${fn}.`);
    return data;
  }catch(e){
    if(e?.name==='AbortError')throw new Error(`El backend tardó demasiado en ${fn}.`);
    throw e;
  }finally{if(timer)clearTimeout(timer);}
}

function ruleFor(type,info,rubro){
  const r=rubro||{};let pending=0,unit=0;
  if(type==='MATRICULA'){pending=Math.max(num(info?.matricula_pend),num(r?.deuda_exigible));unit=num(info?.precio_matricula)||pending;}
  else if(type==='CUOTA'){pending=Math.max(num(info?.cuotas_pend),num(r?.deuda_exigible));unit=num(info?.precio_cuota)||pending;}
  else if(type==='CERTIFICADO'){const raw=Math.max(0,num(info?.precio_certificado)-num(info?.cert_pagado));pending=Math.max(num(info?.cert_pend),raw,num(r?.deuda_exigible));unit=num(info?.precio_certificado)||pending;}
  else if(type==='PROGRAMA_COMPLETO'){const raw=Math.max(0,num(info?.precio_programa_completo||info?.precio_titulo)-num(info?.programa_completo_pagado||info?.titulo_pagado));pending=Math.max(num(info?.programa_completo_pend||info?.titulo_pend),raw,num(r?.deuda_exigible));unit=num(info?.precio_programa_completo||info?.precio_titulo)||pending;}
  else if(type==='TOEIC'){const raw=Math.max(0,num(info?.precio_toeic)-num(info?.toeic_pagado));pending=Math.max(num(info?.toeic_pend),raw,num(r?.deuda_exigible));unit=num(info?.precio_toeic)||pending;}
  pending=round(Math.max(0,pending));unit=round(Math.max(0,unit));if(!unit&&pending)unit=pending;
  return{pending,unit};
}
function qtyText(amount,unit){if(amount<=.009)return'0';if(unit<=.009)return'1';const q=amount/unit;return Math.abs(q-Math.round(q))<.001?String(Math.round(q)):q.toFixed(2);}

function InlineRubroCard({type,rubro,color,certificadoRegistro,active,amount,onMinus,onPlus,rule,disabledReason}){
  const r=rubro||{},comps=Array.isArray(r.comprobantes)?r.comprobantes:[],debt=num(r.deuda_exigible),contract=num(r.saldo_contractual),isCert=type==='CERTIFICADO',cert=norm(certificadoRegistro),certIssued=!!cert;
  const paid=num(r.aplicado),status=isCert?(certIssued?'EMITIDO':'PENDIENTE'):(debt<=.005?'AL DÍA':money(debt));
  const statusColor=isCert?(certIssued?'#2E7D32':'#9A6200'):(debt<=.005?'#2E7D32':'#C62828');
  const canAdd=active&&rule.pending>.009&&!disabledReason&&amount<rule.pending-.009;
  return <div style={{padding:'9px 10px',borderRadius:10,border:`1px solid ${amount>.009?'#90B7DF':'#E2DDD6'}`,background:amount>.009?'#F1F7FD':'white',minWidth:0,boxShadow:amount>.009?'0 0 0 2px rgba(23,105,165,.10)':'none'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:6,alignItems:'center'}}><span style={{fontSize:8.5,fontWeight:950,letterSpacing:'.07em',textTransform:'uppercase',color:'#756D65'}}>{RUBRO_LABEL[type]||type}</span><span style={{width:18,height:3,borderRadius:999,background:color}}/></div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:7,marginTop:5}}><span style={{fontSize:8.5,color:'#81776F'}}>Aplicado</span><b style={{fontSize:10.5,fontFamily:'var(--f-mono,monospace)',color:'#14213D'}}>{money(paid)}</b></div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:7,marginTop:2}}><span style={{fontSize:8.5,color:'#81776F'}}>{isCert?'Documento':'Pendiente'}</span><b style={{fontSize:9.5,color:statusColor}}>{status}</b></div>
    {isCert&&!certIssued&&<div style={{marginTop:2,fontSize:7.8,color:rule.pending>.005?'#B42318':'#8A6D3B'}}>{rule.pending>.005?`Saldo financiero: ${money(rule.pending)}. Falta aplicar comprobante.`:'Pago cubierto; falta emitir el documento oficial.'}</div>}
    {isCert&&certIssued&&<div style={{marginTop:2,fontSize:7.8,color:'#2E7D32'}}>Registro oficial: {cert}</div>}
    {!isCert&&debt<=.005&&contract>.005&&<div style={{marginTop:2,fontSize:7.8,color:'#8A6D3B'}}>Saldo contractual futuro: {money(contract)}</div>}
    <div style={{marginTop:6,paddingTop:5,borderTop:'1px dashed #E6E0D9'}}>{comps.length?comps.map((c,i)=><div key={c.id||i} style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:5,fontSize:7.8,color:'#5D6673',marginTop:i?3:0}}><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.fecha||'Sin fecha'} · Rec. {c.recibo||'—'}{c.documento?` · Doc. ${c.documento}`:''}</span><b style={{fontFamily:'var(--f-mono,monospace)',color:'#25364F'}}>{money(c.monto)}</b></div>):<div style={{fontSize:7.8,color:'#9A9087'}}>Sin comprobante aplicado en este intento.</div>}</div>
    {active&&<div style={{marginTop:8,paddingTop:7,borderTop:'1px solid #DCE6F0'}}>{disabledReason?<div style={{minHeight:31,display:'flex',alignItems:'center',fontSize:8.2,color:'#9A6200',fontWeight:800}}>{disabledReason}</div>:rule.pending<=.009?<div style={{minHeight:31,display:'flex',alignItems:'center',fontSize:8.5,color:'#2E7D32',fontWeight:900}}>✓ Sin monto pendiente</div>:<div style={{display:'grid',gridTemplateColumns:'30px minmax(40px,1fr) 30px',gap:5,alignItems:'center'}}><button type="button" onClick={onMinus} disabled={amount<=.009} style={{height:30,borderRadius:8,border:'1px solid #CBD6E2',background:amount>.009?'white':'#F2F3F5',color:'#14213D',fontWeight:950,cursor:amount>.009?'pointer':'not-allowed'}}>−</button><div style={{textAlign:'center'}}><div style={{fontSize:10.5,fontWeight:950,color:'#14213D'}}>{qtyText(amount,rule.unit)} × {money(rule.unit)}</div><div style={{fontSize:8,color:'#667085'}}>Aplicar {money(amount)}</div></div><button type="button" onClick={onPlus} disabled={!canAdd} style={{height:30,borderRadius:8,border:'1px solid #1769A5',background:canAdd?'#1769A5':'#E8EDF2',color:canAdd?'white':'#87919C',fontWeight:950,cursor:canAdd?'pointer':'not-allowed'}}>＋</button></div>}</div>}
  </div>;
}

function InlineCargoCard({cargo,selected,onToggle,disabled}){
  const amount=num(cargo?.MONTO),concept=norm(cargo?.CONCEPTO)||'Otro cargo',code=norm(cargo?.CODIGO_PRECIO)||'OTRO';
  return <button type="button" onClick={()=>!disabled&&onToggle?.()} disabled={disabled} style={{width:'100%',display:'grid',gridTemplateColumns:'28px minmax(0,1fr) auto',gap:8,alignItems:'center',textAlign:'left',padding:'8px 10px',borderRadius:9,border:`1px solid ${selected?'#A78B3B':'#DED8D0'}`,background:selected?'#FFF8E1':'white',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.55:1}}><span style={{width:24,height:24,borderRadius:7,display:'inline-flex',alignItems:'center',justifyContent:'center',background:selected?'#9A6200':'#F2EFEA',color:selected?'white':'#81776F',fontWeight:950}}>{selected?'✓':'＋'}</span><span style={{minWidth:0}}><b style={{display:'block',fontSize:9.2,color:'#14213D',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{concept}</b><small style={{fontSize:7.8,color:'#81776F'}}>{code} · monto exacto · {norm(cargo?.CARGO_ID)}</small></span><b style={{fontFamily:'var(--f-mono,monospace)',fontSize:10.5,color:'#8A5A00'}}>{money(amount)}</b></button>;
}

function AgIndIntentoFinancieroCS21A36({intento,color,nivel,certificadoRegistro}){
  const ctx=React.useContext(InlinePaymentContext),it=intento||{},rubros=it.rubros||{},types=nivel==='I2'?['MATRICULA','CUOTA','CERTIFICADO','PROGRAMA_COMPLETO','TOEIC']:['MATRICULA','CUOTA','CERTIFICADO'];
  const debt=num(it.deuda_exigible),ok=debt<=.005,excess=num(it.excedente_bancario),period=it.periodo?.corto||it.periodo?.largo||'',open=!!ctx&&ctx.openLevel===nivel&&it.es_actual===true;
  const [query,setQuery]=React.useState(''),[results,setResults]=React.useState([]),[receipt,setReceipt]=React.useState(null),[fresh,setFresh]=React.useState(null),[amounts,setAmounts]=React.useState({}),[selectedCargos,setSelectedCargos]=React.useState({}),[loading,setLoading]=React.useState(false),[searching,setSearching]=React.useState(false),[applying,setApplying]=React.useState(false),[error,setError]=React.useState(''),[success,setSuccess]=React.useState(null);
  const requestIdRef=React.useRef('');

  React.useEffect(()=>{
    if(!open)return;let alive=true;
    setLoading(true);setError('');setFresh(null);setReceipt(null);setResults([]);setAmounts({});setSelectedCargos({});setSuccess(null);
    postInline('getEstudiante',{codigo:ctx.codigo},40000).then(data=>{
      if(!alive)return;const info=data?.pendientes?.por_nivel?.[nivel]||null;if(!info)throw new Error(`No existe información financiera vigente para ${LABEL[nivel]||nivel}.`);
      const canonical=norm(info.grupo||data?.niveles?.[nivel]?.grupo);if(canonical&&norm(it.grupo)&&canonical!==norm(it.grupo))throw new Error(`Este intento es histórico. El grupo financiero vigente es ${canonical}; no se aplicará un pago a ${it.grupo}.`);
      const cargos=(Array.isArray(data?.otros_cargos)?data.otros_cargos:[]).filter(c=>upper(c?.ESTADO)==='PENDIENTE'&&(!norm(c?.NIVEL)||upper(c?.NIVEL)===nivel));
      setFresh({ficha:data,info,canonicalGroup:canonical||norm(it.grupo),cargos});
    }).catch(e=>alive&&setError(inlineFinanceSafeUserError(e?.message || String(e), 'No pudimos cargar la información financiera. Intentá de nuevo.', 'cargar_finanzas'))).finally(()=>alive&&setLoading(false));
    return()=>{alive=false;};
  },[open,ctx?.codigo,nivel,it?.grupo,it?.intento_id]);

  const info=fresh?.info||{},rules={};types.forEach(t=>{rules[t]=ruleFor(t,info,rubros[t]);});
  const cargoTotal=round((fresh?.cargos||[]).reduce((s,c)=>s+(selectedCargos[norm(c.CARGO_ID)]?num(c.MONTO):0),0));
  const payloadSignature=JSON.stringify({doc:norm(receipt?.doc),amounts,selectedCargos,codigo:ctx?.codigo,nivel,grupo:fresh?.canonicalGroup||it?.grupo});
  React.useEffect(()=>{requestIdRef.current='';},[payloadSignature]);
  const coreTotal=round(types.reduce((s,t)=>s+num(amounts[t]),0)),total=round(coreTotal+cargoTotal),saldo=receiptSaldo(receipt),status=upper(info?.estatus||it?.estatus);

  function disabledReason(type,selection=amounts){
    if(type==='CERTIFICADO'&&!['CA','APR'].includes(status))return'Certificado solo disponible en CA o APR.';
    if(type==='PROGRAMA_COMPLETO'){
      if(nivel!=='I2')return'Solo corresponde a Intermedio II.';
      if(!['CA','APR'].includes(status))return'Programa Completo solo disponible en CA o APR.';
      if(info?.programa_completo_aplica===false||upper(info?.programa_completo_estado)==='NO_APLICA_NIVELACION')return'No aplica por nivel convalidado mediante nivelación.';
      if(info?.programa_completo_cobrable===false)return'Requiere B1, B2 e I1 aprobados.';
      const certPending=rules.CERTIFICADO?.pending||0,certSelected=num(selection.CERTIFICADO);if(certPending>.009&&certSelected+0.01<certPending)return'Incluí primero el certificado de I2 en esta misma operación.';
    }
    if(type==='TOEIC'){
      if(nivel!=='I2')return'Solo corresponde a Intermedio II.';
      if(!['CA','APR'].includes(status))return'TOEIC solo disponible en CA o APR.';
      if(info?.toeic_aplica===false)return'TOEIC no está incluido en este plan.';
      if(info?.toeic_omitido||upper(info?.toeic_estado)==='OMITIDO')return'TOEIC fue omitido administrativamente.';
    }
    return'';
  }

  function change(type,direction){
    if(!receipt){setError('Primero seleccioná un comprobante bancario vigente.');return;}
    const rule=rules[type]||{pending:0,unit:0},current=num(amounts[type]);
    if(direction<0){setAmounts(a=>({...a,[type]:round(Math.max(0,current-Math.min(rule.unit||current,current)))}));return;}
    const reason=disabledReason(type);if(reason){setError(reason);return;}
    const add=round(Math.min(rule.unit||rule.pending,Math.max(0,rule.pending-current),Math.max(0,saldo-total)));
    if(add<=.009){setError(saldo-total<=.009?'El comprobante ya no tiene saldo libre para otro rubro.':'Este rubro no tiene monto pendiente.');return;}
    setError('');setAmounts(a=>({...a,[type]:round(current+add)}));
  }

  function toggleCargo(cargo){
    if(!receipt){setError('Primero seleccioná un comprobante bancario vigente.');return;}
    const id=norm(cargo?.CARGO_ID),selected=!!selectedCargos[id],amount=num(cargo?.MONTO);
    if(!selected&&total+amount>saldo+.01){setError(`El cargo ${money(amount)} excede el saldo libre del comprobante.`);return;}
    setError('');setSelectedCargos(s=>({...s,[id]:!selected}));
  }

  async function searchReceipt(){
    const q=norm(query);if(!q){setError('Escribí el número de documento, una fecha o parte de la descripción.');return;}
    setSearching(true);setError('');setResults([]);setReceipt(null);setAmounts({});setSelectedCargos({});
    try{
      const exact=/^\d{4,}$/.test(q),data=await postInline('getComprobantes',exact?{numero_documento:q,consulta_en:Date.now()}:{consulta_en:Date.now()},45000),needle=q.toLowerCase();
      const list=availableReceipts(data.comprobantes).filter(x=>exact?norm(x.doc)===q:[x.doc,x.fecha,x.descripcion,x.estudiante].some(v=>norm(v).toLowerCase().includes(needle))).slice(0,12);
      setResults(list);if(exact&&list.length===1)await selectReceipt(list[0]);else if(!list.length)setError('No se encontró un comprobante disponible con ese criterio.');
    }catch(e){setError(inlineFinanceSafeUserError(e?.message || String(e), 'No pudimos buscar los comprobantes. Intentá de nuevo.', 'buscar_comprobante'));}finally{setSearching(false);}
  }

  async function selectReceipt(item){
    const doc=norm(item?.doc);if(!doc)return;setSearching(true);setError('');
    try{const data=await postInline('getComprobantes',{numero_documento:doc,consulta_en:Date.now()},45000),current=availableReceipts(data.comprobantes).find(x=>norm(x.doc)===doc);if(!current)throw new Error(`El comprobante ${doc} ya no tiene saldo disponible.`);setReceipt(current);setResults([]);setQuery(doc);setAmounts({});setSelectedCargos({});}
    catch(e){setReceipt(null);setError(inlineFinanceSafeUserError(e?.message || String(e), 'No pudimos actualizar el comprobante. Intentá de nuevo.', 'seleccionar_comprobante'));}finally{setSearching(false);}
  }

  function fillDebt(){
    if(!receipt){setError('Primero seleccioná un comprobante bancario vigente.');return;}
    let remaining=saldo,next={};
    types.forEach(type=>{const rule=rules[type]||{pending:0};if(disabledReason(type,next)||remaining<=.009||rule.pending<=.009)return;const take=round(Math.min(rule.pending,remaining));if(take>.009){next[type]=take;remaining=round(remaining-take);}});
    const cargos={};(fresh?.cargos||[]).forEach(c=>{const amount=num(c.MONTO);if(amount>.009&&amount<=remaining+.01){cargos[norm(c.CARGO_ID)]=true;remaining=round(remaining-amount);}});
    setAmounts(next);setSelectedCargos(cargos);setError('');
  }

  async function applyPayment(){
    if(!receipt){setError('Seleccioná un comprobante.');return;}
    const core=types.filter(t=>num(amounts[t])>.009).map(t=>({tipo:t,nivel,monto:round(amounts[t]),grupo:fresh?.canonicalGroup||norm(it.grupo)}));
    const extras=(fresh?.cargos||[]).filter(c=>selectedCargos[norm(c.CARGO_ID)]).map(c=>({tipo:'OTRO',nivel,monto:round(c.MONTO),grupo:fresh?.canonicalGroup||norm(it.grupo),cargo_id:norm(c.CARGO_ID),codigo_precio:upper(c.CODIGO_PRECIO),concepto:norm(c.CONCEPTO)||'OTRO PAGO'}));
    const selected=[...core,...extras];if(!selected.length||total<=.009){setError('Agregá al menos un rubro o cargo con el botón ＋.');return;}if(total>saldo+.01){setError(`El total ${money(total)} excede el saldo ${money(saldo)}.`);return;}
    const lines=selected.map(x=>`• ${x.tipo==='OTRO'?(x.concepto||'Otro cargo'):RUBRO_LABEL[x.tipo]}: ${money(x.monto)}`).join('\n');
    if(!confirm(`APLICAR PAGO SIN SALIR DE CONSULTA\n\nEstudiante: ${ctx.codigo}\nNivel: ${LABEL[nivel]||nivel}\nIntento: ${it.etiqueta||''} · ${fresh?.canonicalGroup||it.grupo}\nComprobante: ${receipt.doc}\n\n${lines}\n\nTOTAL: ${money(total)}\nSaldo bancario después: ${money(saldo-total)}\n\n¿Confirmar operación?`))return;
    setApplying(true);setError('');setSuccess(null);
    try{
      const check=await postInline('getComprobantes',{numero_documento:receipt.doc,consulta_en:Date.now()},45000),current=availableReceipts(check.comprobantes).find(x=>norm(x.doc)===norm(receipt.doc));if(!current)throw new Error(`El comprobante ${receipt.doc} ya fue agotado o retirado.`);if(total>receiptSaldo(current)+.01)throw new Error(`El saldo cambió. Disponible ahora: ${money(receiptSaldo(current))}.`);
      if(!requestIdRef.current)requestIdRef.current=requestId();
      const result=await postInline('aplicarPago',{request_id:requestIdRef.current,doc:receipt.doc,monto_total:total,cod_estudiante:ctx.codigo,rubros:selected},100000),syncOk=result?.conape_sync===true||result?.conape_sync?.ok===true;
      requestIdRef.current='';const message=`Pago aplicado · recibo(s) ${(result?.recibos||[]).join(', ')||'generados'}${syncOk?' · CONAPE actualizado':' · CONAPE pendiente'}`;setSuccess({message,syncOk});setReceipt(null);setAmounts({});setSelectedCargos({});setTimeout(()=>ctx.refresh?.(message),1100);
    }catch(e){setError(inlineFinanceSafeUserError(e?.message || String(e), 'No pudimos aplicar el pago. Revisá los datos e intentá de nuevo.', 'aplicar_pago'));}finally{setApplying(false);}
  }

  return <div style={{border:'1px solid #DCD5CC',borderRadius:11,overflow:'hidden',background:'#FDFCFA'}}>
    <div style={{padding:'8px 10px',background:it.es_actual?'#EEF5FC':'#F3EFE9',display:'flex',justifyContent:'space-between',gap:10,alignItems:'flex-start',flexWrap:'wrap',borderBottom:'1px solid #DDD6CE'}}>
      <div style={{minWidth:180}}><div style={{fontSize:11,fontWeight:950,color:'#14213D'}}>{it.etiqueta||`Intento ${it.numero||''}`}</div><div style={{fontSize:8.5,color:'#667085',marginTop:2}}>{it.grupo||'Grupo sin identificar'}{period?` · ${period}`:''} · {it.estatus||'—'}{it.nota!==''&&it.nota!=null?` · nota ${it.nota}`:''}</div>{!it.es_actual&&<div style={{fontSize:8.2,color:'#8A5A00',fontWeight:900,marginTop:2}}>Intento histórico · solo consulta</div>}</div>
      {open&&<div style={{flex:'1 1 560px',minWidth:'min(100%,320px)'}}><div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto auto',gap:6,alignItems:'center'}}><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchReceipt()} disabled={loading||applying} placeholder="Buscar comprobante: número, fecha o descripción…" style={{width:'100%',minWidth:0,boxSizing:'border-box',height:34,border:'2px solid #1769A5',borderRadius:9,padding:'0 10px',fontFamily:'var(--f-mono,monospace)',fontSize:10.5,outline:'none',background:'white'}}/><button type="button" onClick={searchReceipt} disabled={searching||loading||applying} style={{height:34,padding:'0 11px',borderRadius:9,border:'none',background:'#1769A5',color:'white',fontSize:10,fontWeight:950,cursor:searching?'wait':'pointer'}}>{searching?'Buscando…':'Buscar'}</button><button type="button" onClick={()=>ctx.close?.()} disabled={applying} title="Cerrar aplicación de pago" style={{height:34,width:34,borderRadius:9,border:'1px solid #CBD6E2',background:'white',color:'#596273',fontWeight:950,cursor:'pointer'}}>×</button></div>{receipt&&<div style={{marginTop:5,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',fontSize:8.8,color:'#244A7C',fontWeight:850}}><span>✓ Doc. {receipt.doc}</span><span>Crédito {money(receipt.credito)}</span><span>Disponible <b style={{color:'#2E7D32'}}>{money(saldo)}</b></span><button type="button" onClick={()=>{setReceipt(null);setAmounts({});setSelectedCargos({});}} style={{border:'none',background:'none',color:'#B42318',fontSize:8.5,fontWeight:900,cursor:'pointer'}}>Cambiar</button></div>}</div>}
      <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end'}}><span style={{padding:'4px 7px',borderRadius:999,border:`1px solid ${ok?'#BFE4C3':'#F4B7B7'}`,background:ok?'#E8F5E9':'#FFEBEE',color:ok?'#2E7D32':'#C62828',fontSize:8.5,fontWeight:950}}>{ok?'FINANZAS AL DÍA':`DEUDA ${money(debt)}`}</span>{excess>.005&&<span style={{padding:'4px 7px',borderRadius:999,border:'1px solid #E8C67A',background:'#FFF7DF',color:'#8A5A00',fontSize:8.5,fontWeight:950}}>EXCEDENTE {money(excess)}</span>}</div>
      {open&&results.length>0&&<div style={{flexBasis:'100%',width:'100%',display:'grid',gap:5}}>{results.map(item=><button key={item.doc} type="button" onClick={()=>selectReceipt(item)} style={{width:'100%',display:'grid',gridTemplateColumns:'100px 105px minmax(0,1fr) 105px',gap:8,alignItems:'center',textAlign:'left',padding:'7px 9px',borderRadius:8,border:'1px solid #C8D8E7',background:'white',cursor:'pointer',fontSize:8.8,color:'#475467'}}><b style={{fontFamily:'var(--f-mono,monospace)',color:'#14213D'}}>{item.doc}</b><span>{item.fecha||'—'}</span><span style={{overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{item.descripcion||'Sin descripción'}</span><b style={{textAlign:'right',color:'#2E7D32'}}>{money(receiptSaldo(item))}</b></button>)}</div>}
      {open&&error&&<div style={{flexBasis:'100%',width:'100%',padding:'7px 9px',borderRadius:8,background:'#FFEBEE',border:'1px solid #F4B7B7',color:'#B42318',fontSize:9,fontWeight:800}}>⚠ {error}</div>}
      {open&&success&&<div style={{flexBasis:'100%',width:'100%',padding:'7px 9px',borderRadius:8,background:success.syncOk?'#E8F5E9':'#FFF8E1',border:`1px solid ${success.syncOk?'#BFE4C3':'#E5C56D'}`,color:success.syncOk?'#256B36':'#7A4900',fontSize:9,fontWeight:900}}>✓ {success.message}</div>}
    </div>
    <div style={{padding:8}}><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))',gap:6}}>{types.map(type=><InlineRubroCard key={type} type={type} rubro={rubros[type]} color={color} certificadoRegistro={type==='CERTIFICADO'?certificadoRegistro:''} active={open} amount={num(amounts[type])} onMinus={()=>change(type,-1)} onPlus={()=>change(type,1)} rule={rules[type]||ruleFor(type,{},rubros[type])} disabledReason={open?disabledReason(type):''}/>)}</div>
      {open&&fresh?.cargos?.length>0&&<div style={{marginTop:8,paddingTop:7,borderTop:'1px solid #DDD6CE'}}><div style={{fontSize:8.5,fontWeight:950,textTransform:'uppercase',letterSpacing:'.07em',color:'#756D65',marginBottom:5}}>Otros cargos pendientes · monto exacto</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:6}}>{fresh.cargos.map(c=><InlineCargoCard key={norm(c.CARGO_ID)} cargo={c} selected={!!selectedCargos[norm(c.CARGO_ID)]} onToggle={()=>toggleCargo(c)} disabled={applying}/>)}</div></div>}
      {open&&!loading&&fresh&&<div style={{display:'flex',justifyContent:'flex-end',gap:7,alignItems:'center',flexWrap:'wrap',marginTop:8,paddingTop:7,borderTop:'1px solid #DDE4EB'}}><button type="button" onClick={fillDebt} disabled={!receipt||applying} style={{padding:'7px 10px',borderRadius:8,border:'1px solid #C5D5E5',background:'white',color:'#244A7C',fontSize:9.5,fontWeight:900,cursor:receipt?'pointer':'not-allowed',opacity:receipt?1:.55}}>Completar deuda con saldo</button><span style={{fontSize:9.5,color:'#596273'}}>Total seleccionado: <b style={{fontSize:12,color:'#14213D'}}>{money(total)}</b></span><button type="button" onClick={applyPayment} disabled={!receipt||total<=.009||applying} style={{padding:'8px 12px',borderRadius:8,border:'none',background:receipt&&total>.009?'#0D6B3B':'#D8DDD9',color:receipt&&total>.009?'white':'#7A827D',fontSize:9.8,fontWeight:950,cursor:applying?'wait':receipt&&total>.009?'pointer':'not-allowed'}}>{applying?'Aplicando…':'✓ Aplicar pago'}</button></div>}
      {open&&loading&&<div style={{marginTop:7,fontSize:9,color:'#667085'}}>Validando intento y deuda vigente…</div>}
      <div style={{display:'flex',justifyContent:'flex-end',gap:14,flexWrap:'wrap',marginTop:6,fontSize:8.2,color:'#667085'}}><span>Aplicado: <b style={{color:'#14213D'}}>{money(it.total_aplicado)}</b></span>{num(it.depositado_banco)>0&&<span>Depositado: <b style={{color:'#14213D'}}>{money(it.depositado_banco)}</b></span>}<span>Contrato: <b style={{color:'#14213D'}}>{money(it.total_contractual)}</b></span></div>
    </div>
  </div>;
}

// F111: cobro CONAPE en PE desde Consulta individual; mismo aplicarPago que
// la pantalla de Aplicar Pago. El servidor vuelve a validar TODOS los importes.
// F111: recuperar proformas anteriores al registro PROSPECTOS 2026.
// No hace cobros: registra el PDF que Super Admin ya revisó.
function AgIndProformaLegacy({codigo,referencia}){
  const ctx=React.useContext(InlinePaymentContext);
  const [open,setOpen]=React.useState(false),[url,setUrl]=React.useState('');
  const [choice,setChoice]=React.useState(''),[amount,setAmount]=React.useState(String(referencia||''));
  const [checked,setChecked]=React.useState(false),[saving,setSaving]=React.useState(false);
  const [error,setError]=React.useState('');
  React.useEffect(()=>{
    const handler=e=>{if(norm(e?.detail?.codigo)===norm(codigo))setOpen(true);};
    window.addEventListener('an:legacy-proforma-open',handler);
    return()=>window.removeEventListener('an:legacy-proforma-open',handler);
  },[codigo]);
  async function guardar(){
    if(saving)return;
    if(!/^(SI|NO)$/.test(choice)){setError('Seleccioná la opción indicada en la proforma.');return;}
    if(!/^https:\/\/drive\.google\.com\/file\/d\/[-_a-zA-Z0-9]+/.test(url)){
      setError('Ingresá el enlace del PDF histórico en Google Drive.');return;
    }
    if(choice==='SI'&&(!Number.isFinite(Number(amount))||Number(amount)<=0)){
      setError('Ingresá el valor del TOEIC que figura en la proforma.');return;
    }
    if(!checked){setError('Confirmá que revisaste la proforma original.');return;}
    setSaving(true);setError('');
    try{
      await postInline('registrarProformaHistoricaConape',{
        codigo,toeic_incluido:choice,toeic_monto:choice==='SI'?Number(amount):0,
        proforma_url:url,documento_revisado:true
      },55000);
      setOpen(false);
      ctx?.refresh?.('Proforma histórica verificada. Actualizando cotización...');
    }catch(e){setError(inlineFinanceSafeUserError(e?.message||String(e),
      'No se pudo guardar la verificación documental.','proforma_historica'))}
    finally{setSaving(false);}
  }
  return <div style={{border:'1px solid #E2BD6B',background:'#FFF9EA',borderRadius:10,padding:10,marginBottom:9}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
      <div style={{fontSize:10.5,color:'#78521C',fontWeight:750}}>Proforma histórica CONAPE sin documento vinculado. El precio TOEIC de referencia es <b>{referencia>0?money(referencia):'no disponible'}</b>; falta comprobar si se financió.</div>
      <button type="button" onClick={()=>setOpen(v=>!v)} style={{border:'1px solid #BD924B',padding:'7px 10px',borderRadius:8,background:'white',color:'#72501A',fontWeight:900,cursor:'pointer'}}>
        {open?'Cerrar verificación':'Vincular proforma histórica'}
      </button>
    </div>
    {open&&<div style={{display:'grid',gap:8,marginTop:10,maxWidth:620}}>
      <label style={{fontSize:10,fontWeight:850}}>¿La proforma financiada incluye TOEIC?
        <select value={choice} onChange={e=>{setChoice(e.target.value);setError('');}} style={{display:'block',width:'100%',padding:8,marginTop:3}}>
          <option value="">Verificar en PDF...</option><option value="SI">Sí, incluido</option><option value="NO">No, excluido</option>
        </select>
      </label>
      {choice==='SI'&&<label style={{fontSize:10,fontWeight:850}}>TOEIC según proforma (₡)
        <input type="number" min="1" step="1" value={amount} onChange={e=>setAmount(e.target.value)} style={{display:'block',width:'100%',padding:8,marginTop:3}}/>
      </label>}
      <label style={{fontSize:10,fontWeight:850}}>Enlace al PDF original de la proforma
        <input type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://drive.google.com/file/d/..." style={{display:'block',width:'100%',padding:8,marginTop:3}}/>
      </label>
      <label style={{display:'flex',gap:7,fontSize:10,alignItems:'flex-start'}}>
        <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/>
        Revisé el PDF original y confirmo que estos importes coinciden con el financiamiento CONAPE del estudiante.
      </label>
      {error&&<div role="alert" style={{color:'#B42318',fontSize:10,fontWeight:850}}>{error}</div>}
      <button type="button" onClick={guardar} disabled={saving||!checked||!choice} style={{padding:'8px 12px',background:'#194872',color:'white',border:0,borderRadius:8,fontWeight:900,cursor:'pointer',opacity:saving?.6:1}}>
        {saving?'Verificando PDF...':'Guardar verificación de proforma'}
      </button>
    </div>}
  </div>;
}

function AgIndAnticipoConape({codigo,nivel,color}){
  const ctx=React.useContext(InlinePaymentContext);
  const open=ctx?.openLevel===nivel;
  const [loading,setLoading]=React.useState(false);
  const [pendingProforma,setPendingProforma]=React.useState(false);
  const [finance,setFinance]=React.useState(null);
  const [query,setQuery]=React.useState('');
  const [receipt,setReceipt]=React.useState(null);
  const [searching,setSearching]=React.useState(false);
  const [applying,setApplying]=React.useState(false);
  const [accepted,setAccepted]=React.useState(false);
  const [error,setError]=React.useState('');
  const [success,setSuccess]=React.useState('');
  const idRef=React.useRef('');

  React.useEffect(()=>{
    if(!open)return;
    let alive=true;
    setFinance(null);setLoading(true);setPendingProforma(false);setError('');setReceipt(null);
    setAccepted(false);setQuery('');setSuccess('');idRef.current='';
    postInline('getEstudiante',{codigo},45000).then(data=>{
      if(!alive)return;
      const e=data.estudiante||{},levels=data.niveles||{},target=levels[nivel]||{},info=data.pendientes?.por_nivel?.[nivel]||{};
      const order=['B1','B2','I1','I2'],index=order.indexOf(nivel),previous=index>0?order[index-1]:'';
      const prevStatus=previous?upper(levels[previous]?.estatus):'';
      if(upper(e.CONVENIO||e.convenio)!=='CONAPE'||upper(target.estatus)!=='PE'||index<0||(previous&&prevStatus!=='CA'))
        throw new Error('Solo se anticipa CONAPE del nivel PE inmediatamente siguiente al que está CA.');
      const n=num(info.n_cuotas_periodo),m=num(info.precio_matricula),q=num(info.precio_cuota),c=num(info.precio_certificado);
      if(![2,4].includes(n)||m<=0||q<=0||c<=0)throw new Error('El nivel no tiene precios contractuales completos para anticiparlo.');
      const dueMat=round(Math.max(0,m-num(info.mat_pagada)));
      const dueQuota=round(Math.max(0,q*n-num(info.cuotas_pagadas)));
      const dueCert=round(Math.max(0,c-num(info.cert_pagado)));
      let dueTitle=0,dueToeic=0;
      if(nivel==='I2'){
        if(info.proforma_toeic_confirmado!==true){
          setPendingProforma(true);
          return;
        }
        const title=num(info.precio_programa_completo??info.precio_titulo);
        if(title<=0)throw new Error('La proforma no tiene precio confirmado para el título final de I2.');
        dueTitle=round(Math.max(0,title-num(info.programa_completo_pagado??info.titulo_pagado)));
        if(info.toeic_aplica===true){
          const precioToeic=num(info.precio_toeic);
          if(info.toeic_incluido_proforma!==true||precioToeic<=0)
            throw new Error('La proforma TOEIC no coincide con el importe registrado. Revisá antes de cobrar.');
          dueToeic=round(Math.max(0,precioToeic-num(info.toeic_pagado)));
        }
      }
      const total=round(dueMat+dueQuota+dueCert+dueTitle+dueToeic);
      if(total<=.009)throw new Error('Este nivel ya no tiene saldo financiero por anticipar.');
      const group=norm(info.grupo||target.grupo);
      if(!group)throw new Error('El nivel PE no tiene grupo financiero asignado.');
      setFinance({m:dueMat,q:dueQuota,c:dueCert,t:dueTitle,tc:dueToeic,total,group,previous,n,unit:q});
    }).catch(e=>alive&&setError(inlineFinanceSafeUserError(e?.message||String(e),'No se pudo preparar el anticipo. Actualizá la consulta.','anticipo_futuro')))
      .finally(()=>alive&&setLoading(false));
    return()=>{alive=false;};
  },[open,codigo,nivel]);

  async function buscar(){
    if(!finance)return;
    const doc=norm(query);
    if(!/^\d{4,}$/.test(doc)){setError('Escribí el número exacto del comprobante bancario.');return;}
    setSearching(true);setError('');setReceipt(null);setAccepted(false);idRef.current='';
    try{
      const r=await postInline('getComprobantes',{numero_documento:doc,consulta_en:Date.now()},45000);
      const found=availableReceipts(r.comprobantes).find(x=>norm(x.doc)===doc);
      if(!found)throw new Error('El comprobante no existe o no tiene saldo disponible.');
      setReceipt(found);
    }catch(e){setError(inlineFinanceSafeUserError(e?.message||String(e),'No se pudo consultar el comprobante.','buscar_anticipo'))}
    finally{setSearching(false);}
  }

  async function aplicar(){
    if(!finance||!receipt||!accepted||applying)return;
    const saldo=receiptSaldo(receipt);
    if(saldo+0.01<finance.total){setError('El comprobante no cubre el saldo completo del nivel: '+money(finance.total));return;}
    const rubros=[
      {tipo:'MATRICULA',nivel,monto:finance.m,grupo:finance.group},
      {tipo:'CUOTA',nivel,monto:finance.q,grupo:finance.group},
      {tipo:'CERTIFICADO',nivel,monto:finance.c,grupo:finance.group},
      {tipo:'PROGRAMA_COMPLETO',nivel,monto:finance.t||0,grupo:finance.group},
      {tipo:'TOEIC',nivel,monto:finance.tc||0,grupo:finance.group}
    ].filter(x=>x.monto>.009);
    if(!confirm('ANTICIPO CONAPE DESDE CONSULTA INDIVIDUAL\n\nEstudiante: '+codigo+
      '\nNivel: '+(LABEL[nivel]||nivel)+' (mantiene PE)\nComprobante: '+receipt.doc+
      '\nMatrícula: '+money(finance.m)+'\nCuotas: '+money(finance.q)+
      '\nCertificado nivel: '+money(finance.c)+
      (nivel==='I2'?'\nTítulo final: '+money(finance.t)+'\nTOEIC: '+money(finance.tc):'')+
      '\nTOTAL PROFORMA: '+money(finance.total)+
      '\n\n¿Confirmar este pago real?'))return;
    setApplying(true);setError('');
    try{
      const bank=await postInline('getComprobantes',{numero_documento:receipt.doc,consulta_en:Date.now()},45000);
      const current=availableReceipts(bank.comprobantes).find(x=>norm(x.doc)===norm(receipt.doc));
      if(!current||receiptSaldo(current)+.01<finance.total)throw new Error('El comprobante ya no tiene saldo suficiente. No se aplicó ningún pago.');
      if(!idRef.current)idRef.current=requestId();
      const result=await postInline('aplicarPago',{
        request_id:idRef.current,doc:receipt.doc,monto_total:finance.total,
        cod_estudiante:codigo,anticipo_futuro:true,rubros
      },100000);
      const synced=result?.conape_sync===true||result?.conape_sync?.ok===true;
      const msg='Anticipo '+nivel+' registrado: '+money(finance.total)+' · Recibos '+(result.recibos||[]).join(', ')+(synced?' · CONAPE actualizado':' · CONAPE pendiente de conciliación');
      idRef.current='';setSuccess(msg);setReceipt(null);setAccepted(false);
      ctx?.refresh?.(msg);
    }catch(e){
      // Conservar request_id en fallo incierto para que un reintento sea idempotente.
      setError(inlineFinanceSafeUserError(e?.message||String(e),
        'No se confirmó la operación. Revisá su estado antes de intentar nuevamente.','aplicar_anticipo'));
    }finally{setApplying(false);}
  }

  if(!open)return null;
  const saldo=receiptSaldo(receipt),canApply=!!finance&&!!receipt&&accepted&&!applying&&saldo+.01>=finance.total;
  return <div style={{marginBottom:9,padding:12,borderRadius:11,border:'2px solid #9ABFDE',background:'#F1F7FD'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center',flexWrap:'wrap'}}>
      <b style={{fontSize:12,color:'#14385C'}}>💳 Aplicar anticipo CONAPE de {LABEL[nivel]||nivel}</b>
      <button type="button" onClick={()=>ctx?.close?.()} disabled={applying} style={{border:'1px solid #B6CDE2',background:'white',padding:'5px 9px',borderRadius:8,cursor:'pointer'}}>Cerrar</button>
    </div>
    {loading&&<div style={{fontSize:10,marginTop:8}}>Verificando el nivel y los importes...</div>}
    {pendingProforma&&<div style={{marginTop:9,padding:10,borderRadius:9,border:'1px solid #E1B45D',background:'#FFF8E5',fontSize:10,color:'#765017'}}><b>El anticipo I2 se puede preparar, pero todavia no cobrar.</b><div style={{marginTop:4}}>Primero vincula la proforma historica para confirmar si CONAPE financio el TOEIC. El servidor no admitira un anticipo incompleto.</div><button type="button" onClick={()=>window.dispatchEvent(new CustomEvent('an:legacy-proforma-open',{detail:{codigo}}))} style={{marginTop:8,padding:'7px 10px',border:'1px solid #A97D36',borderRadius:7,background:'white',fontWeight:900,color:'#765017',cursor:'pointer'}}>Vincular proforma historica</button></div>}
    {finance&&<div style={{marginTop:9,fontSize:10,color:'#244A7C'}}>
      <div>Matrícula {money(finance.m)} · {finance.n} cuotas de {money(finance.unit)}: {money(finance.q)} · Certificado {money(finance.c)}{nivel==='I2'&&<> · Título final {money(finance.t)} · TOEIC {finance.tc>0?money(finance.tc):'NO INCLUIDO'}</>}</div>
      <b style={{fontSize:13}}>Anticipo completo: {money(finance.total)}</b>
      <div style={{fontSize:9,marginTop:3}}>El nivel continúa PE; no se alteran notas ni morosidad.</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:9}}>
        <input value={query} onChange={e=>{setQuery(e.target.value);setReceipt(null);setAccepted(false);idRef.current='';}}
          onKeyDown={e=>e.key==='Enter'&&buscar()} disabled={applying||searching}
          placeholder="N.º comprobante bancario" style={{flex:'1 1 190px',minWidth:180,padding:'8px 10px',border:'1px solid #AFC4D6',borderRadius:8}}/>
        <button type="button" onClick={buscar} disabled={searching||applying} style={{padding:'8px 12px',borderRadius:8,border:'none',background:'#1769A5',color:'white',fontWeight:900,cursor:'pointer'}}>{searching?'Buscando…':'Buscar comprobante'}</button>
      </div>
    </div>}
    {receipt&&finance&&<div style={{marginTop:9,padding:'9px 10px',background:'white',borderRadius:8,fontSize:10}}>
      <div>Documento <b>{receipt.doc}</b> · saldo disponible <b>{money(saldo)}</b></div>
      {saldo+.01<finance.total?<b style={{color:'#B42318'}}>Saldo insuficiente para pagar el nivel completo.</b>:<label style={{display:'flex',alignItems:'flex-start',gap:7,marginTop:8}}>
        <input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/>
        Confirmé el comprobante y autorizo el anticipo completo de {nivel}, sin activar el nivel académico.
      </label>}
      <button type="button" onClick={aplicar} disabled={!canApply} style={{marginTop:9,padding:'9px 13px',borderRadius:8,border:'none',background:canApply?'#0D6B3B':'#D8DDD9',color:canApply?'white':'#667',fontWeight:950,cursor:canApply?'pointer':'not-allowed'}}>
        {applying?'Aplicando…':'✓ Aplicar '+money(finance.total)}
      </button>
    </div>}
    {error&&<div role="alert" style={{marginTop:8,padding:'8px 9px',borderRadius:8,background:'#FFEBEE',color:'#B42318',fontSize:10,fontWeight:800}}>⚠ {error}</div>}
    {success&&<div style={{marginTop:8,padding:8,background:'#E8F5E9',color:'#256B36',borderRadius:8,fontSize:10,fontWeight:900}}>✓ {success}</div>}
  </div>;
}

function AdminEstudianteResumenIndividualCS21A36(props){
  const codigo=norm(props?.estudianteBase?.codigo||props?.estudianteBase?.rec_m||props?.estudianteBase?.CODIGO);
  const [version,setVersion]=React.useState(0),[openLevel,setOpenLevel]=React.useState(''),[toast,setToast]=React.useState('');
  React.useEffect(()=>{const handler=e=>{const d=e?.detail||{};if(norm(d.codigo)&&norm(d.codigo)!==codigo)return;setOpenLevel(upper(d.nivel));};window.addEventListener('an:inline-payment-open',handler);return()=>window.removeEventListener('an:inline-payment-open',handler);},[codigo]);
  const value=React.useMemo(()=>({codigo,openLevel,close:()=>setOpenLevel(''),refresh:(message)=>{setOpenLevel('');setVersion(v=>v+1);if(message){setToast(message);setTimeout(()=>setToast(''),5500);}}}),[codigo,openLevel]);
  return <InlinePaymentContext.Provider value={value}><OriginalResumen key={version} {...props}/>{toast&&<div style={{position:'fixed',right:22,bottom:22,zIndex:12000,maxWidth:460,padding:'11px 15px',borderRadius:10,background:'#0D6B3B',color:'white',fontSize:11.5,fontWeight:900,boxShadow:'0 10px 28px rgba(0,0,0,.26)'}}>✓ {toast}</div>}</InlinePaymentContext.Provider>;
}

function abrirPagoInline(estudiante,nivel){const codigo=norm(estudiante?.codigo||estudiante?.rec_m||estudiante?.CODIGO);window.dispatchEvent(new CustomEvent('an:inline-payment-open',{detail:{codigo,nivel:upper(nivel)}}));}

function apply(){
  let resumen,intento,abrir;
  try{resumen=window.AdminEstudianteResumenIndividual||AdminEstudianteResumenIndividual;}catch(_){resumen=window.AdminEstudianteResumenIndividual;}
  try{intento=window.AgIndIntentoFinanciero||AgIndIntentoFinanciero;}catch(_){intento=window.AgIndIntentoFinanciero;}
  try{abrir=window.abrirPago||abrirPago;}catch(_){abrir=window.abrirPago;}
  if(typeof resumen!=='function'||typeof intento!=='function')return false;
  if(window.__AN_INLINE_PAYMENT_BUILD__===BUILD)return true;
  OriginalResumen=resumen;OriginalIntento=intento;OriginalAbrirPago=abrir;
  window.AdminEstudianteResumenIndividual=AdminEstudianteResumenIndividualCS21A36;
  window.AgIndIntentoFinanciero=AgIndIntentoFinancieroCS21A36;
  window.AgIndAnticipoConape=AgIndAnticipoConape;
  window.AgIndProformaLegacy=AgIndProformaLegacy;
  window.abrirPago=abrirPagoInline;
  try{AdminEstudianteResumenIndividual=AdminEstudianteResumenIndividualCS21A36;}catch(_){ }
  try{AgIndIntentoFinanciero=AgIndIntentoFinancieroCS21A36;}catch(_){ }
  try{abrirPago=abrirPagoInline;}catch(_){ }
  window.__AN_INLINE_PAYMENT_BUILD__=BUILD;
  window.__AN_INLINE_PAYMENT_ORIGINAL__={resumen:OriginalResumen,intento:OriginalIntento,abrirPago:OriginalAbrirPago};
  return true;
}

window.addEventListener('an:lazy-module-loaded',e=>{if(String(e?.detail?.src||'').includes('admin_students.jsx'))setTimeout(apply,0);});
setTimeout(apply,0);
})();
