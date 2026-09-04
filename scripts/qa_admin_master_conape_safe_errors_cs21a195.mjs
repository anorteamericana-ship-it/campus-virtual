import fs from 'node:fs';

const core = fs.readFileSync('src/admin_master_conape_review_core_cs21a96.jsx', 'utf8');
const data = fs.readFileSync('src/admin_master_conape_data_cs21a96.jsx', 'utf8');
const review = fs.readFileSync('src/admin_master_conape_review_state_cs21a96.jsx', 'utf8');

function check(condition, message) {
  if (!condition) {
    console.error(`FAIL CS21A195: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

check(/function\s+masterConapeSafeUserError\s*\(\s*raw\s*,\s*fallback\s*,\s*context(?:\s*=\s*['"]{2})?\s*\)/.test(core), 'shared safe-user-error helper exists');
check(core.includes('matchesSearch,post,masterConapeSafeUserError,pendingAmount'), 'safe-user-error helper is exported from core');
check(core.includes("throw Error('Apps Script devolvió una respuesta inválida.')"), 'internal post diagnostic remains available');
check(core.includes('throw Error(data?.mensaje||data?.error||`No se pudo ejecutar ${fn}.`)'), 'post transport behavior remains unchanged');

check(data.includes('post,masterConapeSafeUserError,uniqueSorted'), 'data layer consumes shared safe-error helper');
check(data.includes("masterConapeSafeUserError(error?.message||String(error),'No se pudo verificar la morosidad en este momento. Intentá de nuevo.','verificar_morosidad')"), 'mora refresh uses final R2 safe user copy');
check(data.includes("masterConapeSafeUserError(error?.message||String(error),'No se pudo actualizar CONAPE en este momento. Intentá de nuevo.','actualizar_conape')"), 'panel refresh uses final R2 safe user copy');
check(data.includes("masterConapeSafeUserError(error?.message||String(error),'No se pudo cargar el seguimiento del estudiante. Intentá de nuevo.','cargar_seguimiento')"), 'detail load uses final R2 safe user copy');
check(data.includes("masterConapeSafeUserError(error?.message||String(error),'No se pudo guardar el seguimiento. Intentá de nuevo.','guardar_seguimiento')"), 'detail save uses safe user copy');

check(review.includes('post,masterConapeSafeUserError}=N'), 'review state consumes shared safe-error helper');
check(review.includes("masterConapeSafeUserError(error?.message||String(error),'No se pudo guardar la revisión. Intentá de nuevo.','guardar_revision')"), 'review save uses safe user copy');
check(review.includes("clean(error?.message).toLowerCase().includes('cerrado')"), 'closed-state rollback logic remains intact');

check(!data.includes('setMsg(error?.message||String(error))'), 'raw error is not sent directly to panel message');
check(!data.includes('setMsg(error.message||String(error))'), 'raw error.message is not sent directly to panel message');
check(!data.includes('error:error.message||String(error)'), 'raw error is not stored in detail editor');
check(!review.includes('setMsg(error?.message||String(error))'), 'raw review error is not sent directly to UI');

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A195 ADMIN MASTER CONAPE SAFE ERRORS: PASS');
console.log('RAW_TECHNICAL_ERRORS_VISIBLE=NO_FOR_GUARDED_PATHS');
console.log('POST_TRANSPORT=UNCHANGED');
console.log('REVIEW_CLOSED_LOGIC=PRESERVED');
