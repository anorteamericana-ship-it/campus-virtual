// F98.4-Z6-CS21A102 · Estado, cierre idempotente y recuperación de siguiente nivel.
(function(){'use strict';const N=window.ANQuickUpdate99,{NEXT,clean,upper,num,round,money,requestId,quickUpdateSafeUserError,post,fillDebt}=N;
function freshLevelStatus(fresh,level){const root=fresh?.ficha||fresh||{},niveles=root?.niveles||root?.levels||root?.estudiante?.niveles||fresh?.niveles||fresh?.estudiante?.niveles||{};const n=niveles[level]||{};return upper(typeof n==='string'?n:(n.estatus||n.status||n.ESTATUS))}function freshReady(fresh,academic){if(!fresh?.ok)return false;if(academic?.nivel&&freshLevelStatus(fresh,academic.nivel)!=='APR')return false;if(academic?.siguiente_nivel&&freshLevelStatus(fresh,academic.siguiente_nivel)!=='CA')return false;return true}
function useQuickUpdate(props){const estudiante=props.estudiante||{},actual=upper(estudiante.estatus||'CA'),codigo=clean(estudiante.codigo||estudiante.rec_m),grupo=clean(estudiante.grupo||estudiante.GRUPO),nivel=upper(props.nivel),siguiente=NEXT[nivel]||'';
 const[nuevo,setNuevo]=React.useState(actual),[step,setStep]=React.useState('ACADEMIC'),[busy,setBusy]=React.useState(''),[error,setError]=React.useState(''),[academic,setAcademic]=React.useState(null),[model,setModel]=React.useState(null),[query,setQuery]=React.useState(''),[receipt,setReceipt]=React.useState(null),[selected,setSelected]=React.useState({}),[payment,setPayment]=React.useState(null),[conape,setConape]=React.useState(null),[fresh,setFresh]=React.useState(null);
 const academicReq=React.useRef(requestId('ACAD-CS21A102')),paymentReq=React.useRef(requestId('PAY-CS21A102')),conapeReq=React.useRef(requestId('CONAPE-CS21A102')),syncingRef=React.useRef(false),finishingRef=React.useRef(false),items=model?.items||[],total=round(items.reduce((a,x)=>a+num(selected[x.tipo]),0)),available=num(receipt?.saldo),after=round(Math.max(0,available-total)),promo=actual==='CA'&&nuevo==='APR',resume=actual==='APR'&&nuevo==='APR'&&!!siguiente,quickAcademic=promo||resume;
 function amount(type,value){setSelected(s=>({...s,[type]:round(value)}));setError('')}function complete(rec=receipt){if(!rec)return setError('Primero seleccioná un comprobante.');setSelected(fillDebt(items,rec));setError('')}
 async function legacy(){if(nuevo===actual)return props.onClose?.();setBusy('legacy');setError('');try{const r=await post('actualizarEstatus',{codigo,cod_estudiante:codigo,nivel,estatus:nuevo,nota:estudiante.nota??null,grupo});props.onClose?.();setTimeout(()=>props.onSuccess?.(r),0)}catch(e){setError(quickUpdateSafeUserError(e?.message||String(e),'No se pudo guardar el cambio de estatus. Intentá de nuevo.','legacy_estatus'))}finally{setBusy('')}}
 async function academicSave(){setBusy('academic');setError('');try{const r=await post('aplicarPuestaAlDiaAcademica',{request_id:academicReq.current,codigo,cod_estudiante:codigo,nivel,nota:estudiante.nota??null,grupo},120000);setAcademic(r);setModel(r.pago||null);setSelected({});setStep(r.pago?.sin_deuda||!r.pago?.items?.some(x=>x.seleccionable)?'CONAPE':'PAYMENT')}catch(e){setError(quickUpdateSafeUserError(e?.message||String(e),'No se pudo actualizar el expediente académico. Intentá de nuevo.','actualizar_academico'))}finally{setBusy('')}}
 async function receiptFind(){const doc=clean(query);if(!/^\d{4,}$/.test(doc))return setError('Pegá el número exacto del comprobante bancario.');setBusy('receipt');setError('');try{const r=await post('getComprobantes',{numero_documento:doc,consulta_en:Date.now()},50000),found=(r.comprobantes||[]).find(x=>clean(x.doc)===doc);if(!found)throw Error(`El comprobante ${doc} no existe o ya no tiene saldo disponible.`);setReceipt(found);setSelected(fillDebt(items,found))}catch(e){setReceipt(null);setSelected({});setError(quickUpdateSafeUserError(e?.message||String(e),'No se pudo consultar el comprobante. Intentá de nuevo.','buscar_comprobante'))}finally{setBusy('')}}
 async function paymentApply(){if(!receipt)return setError('Seleccioná el comprobante.');if(total<=.009)return setError('Agregá al menos un rubro con saldo pendiente.');if(total>available+.01)return setError(`El total ${money(total)} supera el saldo disponible ${money(available)}.`);const rubros=items.filter(x=>num(selected[x.tipo])>.009).map(x=>({tipo:x.tipo,nivel:model.nivel,monto:round(selected[x.tipo]),grupo:model.grupo}));setBusy('payment');setError('');try{const r=await post('aplicarPagoPuestaAlDia',{request_id:paymentReq.current,codigo,doc:receipt.doc,monto_total:total,rubros},120000);setPayment(r);setStep('CONAPE')}catch(e){setError(quickUpdateSafeUserError(e?.message||String(e),'No se pudo aplicar el pago. Intentá de nuevo.','aplicar_pago'))}finally{setBusy('')}}

 async function loadFreshAndReturn(conapeResult){
  if(finishingRef.current)return;
  finishingRef.current=true;setStep('RELOADING');setBusy('reload');setError('');
  let last=null,lastError=null;
  try{
    // Única lectura acotada: un fallo de actualización visual no repite pago,
    // aprobación ni sincronización CONAPE.
    last=await post('getEstudianteFresh',{codigo,cod_estudiante:codigo,force_fresh:true,quick_update_request_id:conapeReq.current},25000);
  }catch(e){lastError=e}
  setFresh(last);setBusy('');
  if(!freshReady(last,academic)){
    finishingRef.current=false;
    setStep('DONE');
    setError('La actualización local y el resultado de CONAPE no se vuelven a ejecutar. No fue posible confirmar la ficha nueva automáticamente. Podés cargarla otra vez o cerrar para actualizar la lista.');
    if(lastError)console.warn('[QuickUpdate] No se confirmó la lectura del estudiante.',lastError);
    return;
  }
  try{sessionStorage.setItem('an_consulta_prefill',JSON.stringify({codigo,origen:'quick_update_cs21a150',forceFresh:true}))}catch(_){}
  const detail={ok:true,codigo,academic,payment,conape:conapeResult,fresh:last,quick_update:true,reload_same_student:true,forceFresh:true};
  try{
    props.onClose?.();
    setTimeout(()=>props.onSuccess?.(detail),0);
    window.dispatchEvent(new CustomEvent('an:quick-update-finished',{detail}));
  }catch(e){
    finishingRef.current=false;setStep('DONE');
    setError('La ficha fue verificada, pero no se pudo cerrar la ventana automáticamente. Usá “Cerrar y actualizar lista”.');
    console.warn('[QuickUpdate] Falló el cierre visual.',e);
  }
 }
 async function conapeSync(){
  if(syncingRef.current||busy)return;
  syncingRef.current=true;setBusy('conape');setError('');
  try{
    const r=await post('sincronizarConapePuestaAlDia',{codigo,operacion_id:payment?.operacion_id||'',request_id:conapeReq.current},120000);
    setConape(r);await loadFreshAndReturn(r);
  }catch(e){
    setError(quickUpdateSafeUserError(e?.message||String(e),'No se pudo confirmar CONAPE. Consultá su estado antes de volver a intentarlo; los pagos y la aprobación no se repetirán.','sincronizar_conape'));
    setBusy('');
  }finally{syncingRef.current=false}
 }
 async function conapePending(){
  if(syncingRef.current||busy)return;
  syncingRef.current=true;
  const r={ok:false,pendiente:true,mensaje:'CONAPE quedó pendiente por decisión del operador.'};
  setConape(r);
  try{await loadFreshAndReturn(r)}
  finally{syncingRef.current=false}
 }
 async function retryFresh(){
  if(finishingRef.current||busy)return;
  await loadFreshAndReturn(conape||{ok:false,pendiente:true});
 }
 function finish(){if(finishingRef.current)return;finishingRef.current=true;const detail={ok:true,codigo,academic,payment,conape,fresh,quick_update:true,reload_same_student:true,forceFresh:true};props.onClose?.();setTimeout(()=>props.onSuccess?.(detail),0);window.dispatchEvent(new CustomEvent('an:quick-update-finished',{detail}))}
 return{...props,estudiante,actual,codigo,grupo,nivel,siguiente,nuevo,setNuevo,step,busy,error,academic,model,query,setQuery,receipt,selected,payment,conape,fresh,items,total,available,after,promo,resume,quickAcademic,amount,complete,legacy,academicSave,receiptFind,paymentApply,conapeSync,conapePending,retryFresh,finish};}
N.useQuickUpdate=useQuickUpdate;})();
