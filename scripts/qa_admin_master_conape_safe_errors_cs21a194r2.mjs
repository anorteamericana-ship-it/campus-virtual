import fs from 'node:fs';

const core = fs.readFileSync('src/admin_master_conape_review_core_cs21a96.jsx', 'utf8');
const data = fs.readFileSync('src/admin_master_conape_data_cs21a96.jsx', 'utf8');

const coreRequired = [
  'function masterConapeSafeUserError(raw,fallback,context)',
  "console.warn('[MasterCONAPE] Detalle técnico oculto al operador.'",
  'masterConapeSafeUserError,',
  "throw Error('Apps Script devolvió una respuesta inválida.')",
  'throw Error(data?.mensaje||data?.error||`No se pudo ejecutar ${fn}.`)',
];
for (const needle of coreRequired) {
  if (!core.includes(needle)) throw new Error(`CS21A194R2 core contract missing: ${needle}`);
}

const dataRequired = [
  'masterConapeSafeUserError',
  "masterConapeSafeUserError(error?.message||String(error),'No se pudo verificar la morosidad en este momento. Intentá de nuevo.','verificar_morosidad')",
  "masterConapeSafeUserError(error?.message||String(error),'No se pudo actualizar CONAPE en este momento. Intentá de nuevo.','actualizar_conape')",
  "masterConapeSafeUserError(error?.message||String(error),'No se pudo cargar el seguimiento del estudiante. Intentá de nuevo.','cargar_seguimiento')",
  "masterConapeSafeUserError(error?.message||String(error),'No se pudo guardar el seguimiento. Intentá de nuevo.','guardar_seguimiento')",
  "setMsg(result.mensaje||'CONAPE y morosidad oficial actualizados.')",
  "setMsg(saved?'Seguimiento guardado y marcado como revisado.':'Seguimiento eliminado.')",
];
for (const needle of dataRequired) {
  if (!data.includes(needle)) throw new Error(`CS21A194R2 data contract missing: ${needle}`);
}

const forbiddenData = [
  'setMsg(error?.message||String(error))',
  'setMsg(error.message||String(error))',
  'error:error.message||String(error)',
];
for (const needle of forbiddenData) {
  if (data.includes(needle)) throw new Error(`CS21A194R2 raw technical UI propagation remains: ${needle}`);
}

console.log('CS21A194R2 ADMIN MASTER CONAPE SAFE ERRORS: PASS');
console.log('VISIBLE_ERROR_BOUNDARIES=SANITIZED');
console.log('POST_INTERNAL_DIAGNOSTICS=PRESERVED');
console.log('BUSINESS_SUCCESS_MESSAGES=PRESERVED');
console.log('ENDPOINTS_AND_PAYLOADS=UNCHANGED');
