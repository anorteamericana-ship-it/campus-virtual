import fs from 'node:fs';

const path = 'src/admin_master_conape_data_cs21a96.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceOnce(label, from, to) {
  const count = src.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly 1 preimage, found ${count}`);
  src = src.replace(from, to);
  console.log(`${label}: replaced 1`);
}

replaceOnce('refreshMora explicit result',
` const refreshMora=React.useCallback(async(silent=true)=>{if(liveRef.current||!rowsRef.current.length)return;liveRef.current=true;try{const items=rowsRef.current.map(row=>({id:row.id,cedula:row.cedula,year:row.year,month:row.month,period:academicPeriodForMovement(row)})),result=await post('getConapeMoraStates',{items}),next={};(result.items||[]).forEach(item=>{if(item?.id)next[item.id]=item});setMoraLive(next);if(!silent)setMsg('Morosidad verificada directamente en 7-morosidad oficial.')}catch(error){if(!silent)setMsg(masterConapeSafeUserError(error?.message||String(error),'No se pudo verificar la morosidad en este momento. Intentá de nuevo.','verificar_morosidad'))}finally{liveRef.current=false}},[]);`,
` const refreshMora=React.useCallback(async(silent=true)=>{if(liveRef.current){if(!silent)setMsg('La verificación de morosidad ya está en curso.');return{ok:false,busy:true}}if(!rowsRef.current.length)return{ok:true,empty:true};liveRef.current=true;try{const items=rowsRef.current.map(row=>({id:row.id,cedula:row.cedula,year:row.year,month:row.month,period:academicPeriodForMovement(row)})),result=await post('getConapeMoraStates',{items}),next={};(result.items||[]).forEach(item=>{if(item?.id)next[item.id]=item});setMoraLive(next);if(!silent)setMsg('Morosidad verificada directamente en 7-morosidad oficial.');return{ok:true}}catch(error){if(!silent)setMsg(masterConapeSafeUserError(error?.message||String(error),'No se pudo verificar la morosidad en este momento. Intentá de nuevo.','verificar_morosidad'));return{ok:false}}finally{liveRef.current=false}},[]);`);

replaceOnce('refresh truthful success',
` async function refresh(){setBusy(true);setMsg('');try{const result=await window.masterAction('actualizarPanelConapeAhora');await onRefresh?.();await refreshMora(false);setMsg(result.mensaje||'CONAPE y morosidad oficial actualizados.')}catch(error){setMsg(masterConapeSafeUserError(error?.message||String(error),'No se pudo actualizar CONAPE en este momento. Intentá de nuevo.','actualizar_conape'))}finally{setBusy(false)}}`,
` async function refresh(){setBusy(true);setMsg('');try{const result=await window.masterAction('actualizarPanelConapeAhora');await onRefresh?.();const moraResult=await refreshMora(false);if(!moraResult?.ok)return;if(moraResult.empty){setMsg(result.mensaje||'CONAPE actualizado. No había registros para verificar morosidad.');return}setMsg(result.mensaje||'CONAPE y morosidad oficial actualizados.')}catch(error){setMsg(masterConapeSafeUserError(error?.message||String(error),'No se pudo actualizar CONAPE en este momento. Intentá de nuevo.','actualizar_conape'))}finally{setBusy(false)}}`);

fs.writeFileSync(path, src);
console.log('CS21A195R2 exact truthful refresh patch applied');
