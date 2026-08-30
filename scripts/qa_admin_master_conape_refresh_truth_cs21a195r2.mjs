import fs from 'node:fs';

const src = fs.readFileSync('src/admin_master_conape_data_cs21a96.jsx', 'utf8');

const required = [
  "if(liveRef.current){if(!silent)setMsg('La verificación de morosidad ya está en curso.');return{ok:false,busy:true}}",
  "if(!rowsRef.current.length)return{ok:true,empty:true};",
  "return{ok:true}}catch(error)",
  "return{ok:false}}finally{liveRef.current=false}",
  "const moraResult=await refreshMora(false);if(!moraResult?.ok)return;",
  "if(moraResult.empty){setMsg(result.mensaje||'CONAPE actualizado. No había registros para verificar morosidad.');return}",
  "setMsg(result.mensaje||'CONAPE y morosidad oficial actualizados.')",
  "masterConapeSafeUserError(error?.message||String(error),'No se pudo verificar la morosidad en este momento. Intentá de nuevo.','verificar_morosidad')",
];
for (const needle of required) {
  if (!src.includes(needle)) throw new Error(`CS21A195R2 missing truthful-refresh contract: ${needle}`);
}

const forbidden = [
  "await refreshMora(false);setMsg(result.mensaje||'CONAPE y morosidad oficial actualizados.')",
  "if(liveRef.current||!rowsRef.current.length)return;",
];
for (const needle of forbidden) {
  if (src.includes(needle)) throw new Error(`CS21A195R2 stale false-success path remains: ${needle}`);
}

if (!src.includes("post('getConapeMoraStates',{items})")) throw new Error('CS21A195R2 changed morosidad endpoint unexpectedly.');
if (!src.includes("window.masterAction('actualizarPanelConapeAhora')")) throw new Error('CS21A195R2 changed panel refresh endpoint unexpectedly.');
if (!src.includes('setMoraLive(next)')) throw new Error('CS21A195R2 lost morosidad state update.');

console.log('CS21A195R2 ADMIN MASTER CONAPE REFRESH TRUTH: PASS');
console.log('FALSE_SUCCESS_AFTER_MORA_FAILURE=BLOCKED');
console.log('MORA_ENDPOINT=UNCHANGED');
console.log('PANEL_REFRESH_ENDPOINT=UNCHANGED');
console.log('BUSY_AND_EMPTY_STATES=EXPLICIT');
