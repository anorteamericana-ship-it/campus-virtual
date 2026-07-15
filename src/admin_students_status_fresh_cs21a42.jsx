// F98.4-Z6-CS21A95 · Estado fresco preservado + reversión financiera y restauración académica para Superadmin.
(function(){
'use strict';

const BUILD='F98.4-Z6-CS21A42';
const NEXT={B1:'B2',B2:'I1',I1:'I2'};
const LABEL={B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'};

async function call(fn,p={},timeout=100000){
  if(typeof postCampusData!=='function')throw Error('El conector del Campus no está disponible.');
  let timer;
  try{
    const result=await Promise.race([
      postCampusData(fn,p),
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('La operación tardó demasiado.')),timeout)})
    ]);
    if(result?.ok!==true)throw Error(result?.error||result?.mensaje||'No se pudo completar la operación.');
    return result;
  }finally{if(timer)clearTimeout(timer)}
}

function Modal({estudiante,nivel,onClose,onSuccess}){
  const actual=String(estudiante?.estatus||'CA').toUpperCase();
  const codigo=String(estudiante?.codigo||estudiante?.rec_m||'');
  const grupo=String(estudiante?.grupo||'');
  const nv=String(nivel||'').toUpperCase();
  const sig=NEXT[nv]||'';
  const [nuevo,setNuevo]=React.useState(actual);
  const [busy,setBusy]=React.useState('');
  const [next,setNext]=React.useState(null);
  const [choice,setChoice]=React.useState('');
  const [error,setError]=React.useState('');
  const [saved,setSaved]=React.useState(null);
  const promo=actual==='CA'&&nuevo==='APR';

  React.useEffect(()=>{
    let live=true;
    setNext(null);setChoice('');
    if(!promo||!sig)return()=>{live=false};
    setBusy('check');
    call('getEstudianteFresh',{codigo,consulta_en:Date.now()},50000)
      .then(f=>{if(live){const i=f?.niveles?.[sig]||{};setNext({estatus:String(i.estatus||'SIN REGISTRO').toUpperCase(),grupo:String(i.grupo||grupo)})}})
      .catch(e=>live&&setError(e.message))
      .finally(()=>live&&setBusy(''));
    return()=>{live=false};
  },[promo,sig,codigo,grupo]);

  const estado=String(next?.estatus||'');
  const pregunta=promo&&sig&&['PE','SIN REGISTRO'].includes(estado);

  async function fresh(result){
    setBusy('fresh');setError('');
    try{
      const ficha=await call('getEstudianteFresh',{codigo,nocache:true,consulta_en:Date.now()});
      onSuccess?.({...result,ficha_fresh:ficha,lectura_fresca:true});
      onClose?.();
    }catch(e){setError('El cambio quedó guardado, pero la ficha real no pudo cargarse: '+e.message);setBusy('')}
  }

  async function save(){
    if(nuevo===actual)return onClose?.();
    if(pregunta&&!choice)return setError('Indicá si también querés activar o crear el siguiente nivel.');
    setBusy('save');setError('');
    try{
      const d=await call(promo?'actualizarEstatusPromocionSegura':'actualizarEstatus',{
        codigo,cod_estudiante:codigo,nivel:nv,estatus:nuevo,nota:estudiante?.nota??null,grupo,
        activar_siguiente:pregunta&&choice==='SI',
        crear_siguiente:estado==='SIN REGISTRO'&&choice==='SI',
        siguiente_nivel:sig,siguiente_grupo:next?.grupo||grupo
      });
      setSaved(d);
      if(d.conape_sync===false){setBusy('conape');return}
      await fresh(d);
    }catch(e){setError(e.message);setBusy('')}
  }

  const msg=busy==='check'?'Verificando siguiente nivel…':busy==='save'?'Guardando en ESTATUS…':busy==='fresh'?'Reconstruyendo ficha real…':'';
  return <div style={{position:'fixed',inset:0,zIndex:10000,background:'#00153088',display:'flex',alignItems:'center',justifyContent:'center',padding:18}}>
    <div style={{width:'min(580px,96vw)',background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 24px 70px #0005'}}>
      <div style={{padding:'16px 19px',background:'#0d2b51',color:'#fff'}}>
        <small>Consulta individual</small><h3 style={{margin:'3px 0'}}>Cambiar estatus · {LABEL[nv]||nv}</h3><div>{estudiante?.display||codigo} · actual <b>{actual}</b></div>
      </div>
      <div style={{padding:18}}>
        <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:14}}>{['CA','APR','REP','CNV','RI','RJ','PE'].map(s=><button key={s} disabled={!!busy} onClick={()=>setNuevo(s)} style={{padding:'8px 12px',borderRadius:8,border:`2px solid ${nuevo===s?'#002f6c':'#d7dde5'}`,background:nuevo===s?'#002f6c':'#fff',color:nuevo===s?'#fff':'#26364d',fontWeight:900}}>{s}</button>)}</div>
        {promo&&sig&&<div style={{padding:12,borderRadius:10,background:'#eef4ff',border:'1px solid #c9d9f1',marginBottom:12}}><b>Promoción académica</b><p>{estado==='PE'?`¿Activar también ${LABEL[sig]}?`:estado==='SIN REGISTRO'?`¿Crear y activar ${LABEL[sig]}?`:`Siguiente nivel: ${estado||'verificando…'}`}</p>{pregunta&&<div style={{display:'flex',gap:8}}><button onClick={()=>setChoice('SI')}>Sí</button><button onClick={()=>setChoice('NO')}>No</button></div>}</div>}
        {msg&&<div style={{padding:11,background:'#eef4ff',borderRadius:9,marginBottom:10,fontWeight:900}}>↻ {msg}<div style={{fontSize:9,marginTop:3}}>No se cerrará hasta confirmar datos reales.</div></div>}
        {busy==='conape'&&<div style={{padding:11,background:'#fff8e1',borderRadius:9,marginBottom:10,color:'#7a4900'}}>El estado quedó guardado; CONAPE está pendiente.</div>}
        {error&&<div style={{padding:10,background:'#ffebee',borderRadius:9,marginBottom:10,color:'#b42318'}}>⚠ {error}</div>}
        <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>{busy==='conape'?<button onClick={()=>fresh(saved||{ok:true})}>Cerrar con datos reales</button>:<><button disabled={!!busy} onClick={onClose}>Cancelar</button><button disabled={!!busy||pregunta&&!choice} onClick={save} style={{background:'#002f6c',color:'#fff'}}>Guardar cambio</button></>}</div>
      </div>
    </div>
  </div>;
}

function apply(){
  if(typeof window.ModalEstatus!=='function')return;
  window.ModalEstatus=Modal;
  try{ModalEstatus=Modal}catch(_){}
  window.__AN_STATUS_FRESH_BUILD__=BUILD;
}
window.addEventListener('an:lazy-module-loaded',e=>{if(String(e?.detail?.src||'').includes('admin_students.jsx'))setTimeout(apply,10)});
setTimeout(apply,10);
})();

(function(){
'use strict';

const REV_BUILD='F98.4-Z6-CS21A95';
let installed=false;
function clean(v){return String(v==null?'':v).trim()}
function cash(v){const n=Number(v||0);try{return new Intl.NumberFormat('es-CR',{style:'currency',currency:'CRC',maximumFractionDigits:0}).format(Number.isFinite(n)?n:0)}catch(_){return '₡'+Math.round(Number.isFinite(n)?n:0).toLocaleString('es-CR')}}
function rubroLabel(v){const x=clean(v).toUpperCase();return({MATRICULA:'Matrícula',CUOTA:'Cuota',CERTIFICADO:'Certificado',PROGRAMA_COMPLETO:'Programa completo',TITULO:'Programa completo',TOEIC:'TOEIC',OTRO:'Otro cargo',CAMBIO_GRUPO:'Cambio de grupo'})[x]||x||'Rubro'}
function academicLine(a){if(!a?.ok)return'Expediente académico no verificable';const levels=(a.niveles||[]).map(x=>`${x.nivel} ${x.estatus}${x.nota!=null?` ${x.nota}`:''}`).join(' · ');return `${levels||'Sin niveles'}${a.grupo_actual?` · Grupo ${a.grupo_actual}`:''}`}

async function postRev(fn,payload={},timeout=100000){
  try{return await call(fn,payload,timeout)}catch(error){return{ok:false,error:error?.message||String(error),mensaje:error?.message||String(error)}}
}

function ReversalModal({codigo,operaciones,onClose,onDone}){
  const [selected,setSelected]=React.useState(operaciones?.[0]?.operacion_id||'');
  const [motivo,setMotivo]=React.useState('Comprobante aplicado al estudiante incorrecto');
  const [busy,setBusy]=React.useState(false);
  const [error,setError]=React.useState('');
  const op=(operaciones||[]).find(x=>x.operacion_id===selected)||operaciones?.[0]||null;

  async function submit(){
    if(!op)return setError('Seleccioná una operación.');
    if(clean(motivo).length<8)return setError('Indicá el motivo de la reversión.');
    const rubros=(op.rubros||[]).map((r,i)=>`• ${rubroLabel(r.tipo)}: ${cash(r.monto)}${op.recibos?.[i]?` · Rec. ${op.recibos[i]}`:''}`).join('\n');
    const academic=academicLine(op.academico);
    const ok=window.confirm(`REVERTIR PAGO Y RESTAURAR EXPEDIENTE\n\nEstudiante: ${codigo}\nOperación: ${op.operacion_id}\nComprobante: ${op.documento}\nTotal: ${cash(op.monto_total)}\nRecibos: ${(op.recibos||[]).join(', ')}\n\n${rubros}\n\nEXPEDIENTE QUE SE CONSERVARÁ:\n${academic}\n\nEsta acción retirará todos los rubros, devolverá el saldo al comprobante bancario y restaurará exactamente ESTATUS y el grupo académico.\n\n¿Confirmar reversión integral?`);
    if(!ok)return;
    setBusy(true);setError('');
    const d=await postRev('revertirPagoOperacion',{operacion_id:op.operacion_id,codigo_esperado:codigo,motivo:clean(motivo)},120000);
    setBusy(false);
    if(!d?.ok)return setError(d?.mensaje||d?.error||'No se pudo completar la reversión integral.');
    onDone?.(d);
  }

  return <div role="dialog" aria-modal="true" style={{position:'fixed',inset:0,zIndex:13000,background:'rgba(0,20,46,.62)',display:'flex',alignItems:'center',justifyContent:'center',padding:18}} onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose?.()}}>
    <div style={{width:'min(760px,97vw)',maxHeight:'92vh',overflow:'auto',background:'#fff',borderRadius:16,boxShadow:'0 28px 80px rgba(0,0,0,.32)'}}>
      <div style={{padding:'16px 19px',background:'#7A1E2C',color:'#fff'}}><small style={{fontWeight:900,letterSpacing:'.08em'}}>SUPERADMIN · OPERACIÓN INTEGRAL</small><h3 style={{margin:'4px 0 2px'}}>↶ Revertir pago y restaurar expediente</h3><div style={{fontSize:11,opacity:.9}}>Se revierte la operación completa y se conserva la trayectoria académica exacta.</div></div>
      <div style={{padding:18}}>
        {!operaciones?.length?<div style={{padding:18,borderRadius:10,background:'#F7F5F2',color:'#667085'}}>No hay operaciones confirmadas disponibles para reversión en este estudiante.</div>:<div style={{display:'grid',gap:8}}>{operaciones.map((item,idx)=><button key={item.operacion_id} type="button" onClick={()=>setSelected(item.operacion_id)} disabled={busy} style={{width:'100%',textAlign:'left',padding:'11px 12px',borderRadius:10,border:`2px solid ${item.operacion_id===op?.operacion_id?'#9F2636':'#DDD6CE'}`,background:item.operacion_id===op?.operacion_id?'#FFF2F3':'#fff',cursor:'pointer'}}><div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><b style={{color:'#14213D'}}>{idx===0?'Más reciente · ':''}{item.creado_en||'Sin fecha'}</b><b style={{color:'#7A1E2C'}}>{cash(item.monto_total)}</b></div><div style={{marginTop:4,fontSize:10,color:'#596273'}}>Comprobante {item.documento||'—'} · Recibos {(item.recibos||[]).join(', ')||'—'}</div><div style={{marginTop:5,fontSize:9,color:'#756D65'}}>{(item.rubros||[]).map(r=>`${rubroLabel(r.tipo)} ${cash(r.monto)}`).join(' · ')}</div><div style={{marginTop:5,fontSize:9,fontWeight:850,color:'#1F5E38'}}>{academicLine(item.academico)}</div></button>)}</div>}
        <label style={{display:'block',marginTop:14}}><span style={{display:'block',fontSize:9,fontWeight:950,textTransform:'uppercase',letterSpacing:'.08em',color:'#756D65',marginBottom:5}}>Motivo obligatorio</span><textarea value={motivo} onChange={e=>setMotivo(e.target.value)} disabled={busy||!op} maxLength={500} style={{width:'100%',boxSizing:'border-box',minHeight:72,padding:10,border:'1px solid #D7C9C9',borderRadius:9,fontFamily:'inherit'}}/></label>
        {error&&<div style={{marginTop:10,padding:'9px 11px',borderRadius:9,background:'#FFEBEE',border:'1px solid #F4B7B7',color:'#B42318',fontSize:10,fontWeight:850}}>⚠ {error}</div>}
        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:14}}><button type="button" onClick={onClose} disabled={busy} style={{padding:'9px 13px',borderRadius:8,border:'1px solid #D7DCE2',background:'#fff',fontWeight:900}}>Cancelar</button><button type="button" onClick={submit} disabled={busy||!op||clean(motivo).length<8} style={{padding:'9px 14px',borderRadius:8,border:0,background:busy||!op?'#D7D7D7':'#9F2636',color:'#fff',fontWeight:950,cursor:busy?'wait':'pointer'}}>{busy?'Revirtiendo y restaurando…':'↶ Confirmar reversión integral'}</button></div>
      </div>
    </div>
  </div>;
}

function ReversalControl({codigo,onRefresh}){
  const [allowed,setAllowed]=React.useState(false);
  const [ops,setOps]=React.useState([]);
  const [open,setOpen]=React.useState(false);
  const [busy,setBusy]=React.useState(false);
  const [toast,setToast]=React.useState('');

  async function load(show){
    if(!codigo)return;
    setBusy(!!show);
    const d=await postRev('getOperacionesPagoReversibles',{codigo,consulta_en:Date.now()},45000);
    setBusy(false);
    if(d?.ok===true){setAllowed(true);setOps(Array.isArray(d.operaciones)?d.operaciones:[]);if(show)setOpen(true)}
    else if(['no_autorizado','sesion_requerida','sesion_invalida','endpoint_no_declarado'].includes(clean(d?.error))){setAllowed(false)}
    else if(show){setToast(d?.mensaje||d?.error||'No se pudieron cargar las operaciones.');setTimeout(()=>setToast(''),5000)}
  }

  React.useEffect(()=>{
    let live=true;
    (async()=>{const d=await postRev('getOperacionesPagoReversibles',{codigo,consulta_en:Date.now()},45000);if(!live)return;if(d?.ok===true){setAllowed(true);setOps(Array.isArray(d.operaciones)?d.operaciones:[])}})();
    return()=>{live=false};
  },[codigo]);

  if(!allowed)return null;
  return <>
    <div style={{display:'flex',justifyContent:'flex-end',margin:'0 0 8px'}}><button type="button" onClick={()=>load(true)} disabled={busy} style={{padding:'7px 11px',borderRadius:8,border:'1px solid #C97B84',background:'#FFF5F6',color:'#8E2230',fontSize:10,fontWeight:950,cursor:busy?'wait':'pointer'}}>{busy?'Consultando…':'↶ Revertir pago y expediente'}</button></div>
    {open&&<ReversalModal codigo={codigo} operaciones={ops} onClose={()=>setOpen(false)} onDone={d=>{setOpen(false);setToast(`Pago y expediente restaurados · ${d.academico?.nivel_actual||'nivel actual'} ${d.academico?.estatus_actual||''} · ${cash(d.monto_revertido)}`);setOps(x=>x.filter(o=>o.operacion_id!==d.operacion_id));onRefresh?.();window.dispatchEvent(new CustomEvent('an:payment-reversed',{detail:d}));setTimeout(()=>setToast(''),6500)}}/>}
    {toast&&<div style={{position:'fixed',right:22,bottom:22,zIndex:14000,maxWidth:520,padding:'11px 15px',borderRadius:10,background:'#7A1E2C',color:'#fff',fontSize:11,fontWeight:900,boxShadow:'0 12px 32px rgba(0,0,0,.28)'}}>{toast}</div>}
  </>;
}

function installReversal(){
  if(installed||!window.__AN_INLINE_PAYMENT_BUILD__)return false;
  const Base=window.AdminEstudianteResumenIndividual;
  if(typeof Base!=='function')return false;
  function Wrapped(props){const codigo=clean(props?.estudianteBase?.codigo||props?.estudianteBase?.rec_m||props?.estudianteBase?.CODIGO);const [revision,setRevision]=React.useState(0);return <><ReversalControl codigo={codigo} onRefresh={()=>setRevision(v=>v+1)}/><Base key={revision} {...props}/></>}
  Wrapped.__cs21a92PaymentReversal=true;Wrapped.__base=Base;
  window.AdminEstudianteResumenIndividual=Wrapped;
  try{AdminEstudianteResumenIndividual=Wrapped}catch(_){}
  window.__AN_PAYMENT_REVERSAL_BUILD__=REV_BUILD;
  installed=true;
  return true;
}

let attempts=0;
function retry(){if(installReversal())return;if(++attempts<80)setTimeout(retry,100)}
window.addEventListener('an:lazy-module-loaded',()=>setTimeout(retry,40));
setTimeout(retry,20);
})();
