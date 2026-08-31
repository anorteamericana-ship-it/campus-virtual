import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE='ff862ce99db561c1711f929ceae99ddc0d9b6f64';
const BRANCH='fix/admin-status-safe-errors-cs21a210h';
const exactScope=process.argv.includes('--exact-scope');
const must=(ok,label)=>{if(!ok)throw new Error(`CS21A210H FAIL: ${label}`)};
const text=p=>fs.readFileSync(p,'utf8');
const fresh=text('src/admin_students_status_fresh_cs21a42.jsx');
const missing=text('src/admin_students_status_missing_next_cs21a29.jsx');

must(fresh.includes('function statusSafeUserError(raw, fallback, context ='), 'fresh safe helper exists');
must(missing.includes("function status29SafeUserError(raw,fallback,context='')"), 'missing-next safe helper exists');
must(fresh.includes("console.warn('[AdminStatus] Detalle técnico oculto al operador.'"), 'fresh technical detail console-only');
must(missing.includes("console.warn('[AdminStatus29] Detalle técnico oculto al operador.'"), 'missing-next technical detail console-only');

must(!fresh.includes('.catch(e=>live&&setError(e.message))'), 'fresh direct e.message load sink removed');
must(!fresh.includes("setError('El cambio quedó guardado, pero la ficha real no pudo cargarse: '+e.message)"), 'fresh concatenated e.message sink removed');
must(!fresh.includes('setError(e.message);setBusy'), 'fresh direct e.message save sink removed');
must(!missing.includes('.catch(e=>live&&setError(e.message))'), 'missing-next direct e.message load sink removed');
must(!missing.includes('setError(e.message);setBusy(false)'), 'missing-next direct e.message save sink removed');

must(fresh.includes("statusSafeUserError(e?.message || String(e), 'No se pudo verificar el siguiente nivel."), 'fresh verification fallback');
must(fresh.includes("statusSafeUserError(e?.message || String(e), 'No se pudo guardar el cambio de estatus."), 'fresh save fallback');
must(missing.includes("status29SafeUserError(e?.message || String(e), 'No se pudo verificar el siguiente nivel."), 'missing-next verification fallback');
must(missing.includes("status29SafeUserError(e?.message || String(e), 'No se pudo guardar el cambio de estatus."), 'missing-next save fallback');

must(fresh.includes("const safe=statusSafeUserError(error?.message||String(error),'No se pudo completar la operación financiera."), 'reversal transport sanitizes exception');
must(!fresh.includes('error:error?.message||String(error),mensaje:error?.message||String(error)'), 'reversal raw transport propagation removed');

must(!fresh.includes('Guardando en ESTATUS…'), 'visible ESTATUS progress copy removed');
must(!fresh.includes('restaurará exactamente ESTATUS y el grupo académico'), 'visible ESTATUS reversal copy removed');
must(!missing.includes('en ESTATUS y dejarlo activo en CA'), 'visible ESTATUS creation copy removed');

must(fresh.includes("postCampusData(fn,p)"), 'fresh transport preserved');
must(fresh.includes("call('getEstudianteFresh'"), 'fresh endpoint preserved');
must(fresh.includes("call(promo?'actualizarEstatusPromocionSegura':'actualizarEstatus'"), 'fresh save endpoints preserved');
must(missing.includes("token:window.getSessionToken?window.getSessionToken():''"), 'missing-next token transport preserved');
must(missing.includes("post(promo?'actualizarEstatusPromocionSegura':'actualizarEstatus'"), 'missing-next save endpoints preserved');

if(exactScope){
  const changed=execFileSync('git',['diff','--name-only',`${BASE}...HEAD`],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean).sort();
  const allowed=[
    '.github/workflows/qa-admin-status-safe-errors-cs21a210h.yml',
    '00_DOCUMENTACION/ADMIN_STATUS_SAFE_ERRORS_CS21A210H_2026-08-31.md',
    'scripts/qa_admin_status_safe_errors_cs21a210h.mjs',
    'src/admin_students_status_fresh_cs21a42.jsx',
    'src/admin_students_status_missing_next_cs21a29.jsx',
  ].sort();
  must(JSON.stringify(changed)===JSON.stringify(allowed),`exact scope mismatch: ${changed.join(', ')}`);
}

console.log('CS21A210H ADMIN STATUS SAFE ERRORS: PASS');
console.log(`BASE=${BASE}`);
console.log(`BRANCH=${BRANCH}`);
console.log('RAW_VISIBLE_EXCEPTION_SINKS=REMOVED_IN_TARGET_FILES');
console.log('REVERSAL_ERROR_BOUNDARY=SAFE');
console.log('INTERNAL_ESTATUS_COPY=REMOVED');
console.log(`EXACT_SCOPE=${exactScope?'VERIFIED':'SKIPPED_BOOTSTRAP'}`);
console.log('EVIDENCE=E0_E1_SOURCE_ONLY');
console.log('APPS_SCRIPT_WRITE=NO');
console.log('DRIVE_ACL_CHANGE=NO');
console.log('PROD=NOT_TOUCHED');
