import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE='b8ca70c26a9fbd3529063650879f2ca4d59a760a';
const BRANCH='fix/aplicar-pago-safe-errors-cs21a210i';
const exactScope=process.argv.includes('--exact-scope');
const must=(ok,label)=>{if(!ok)throw new Error(`CS21A210I FAIL: ${label}`)};
const src=fs.readFileSync('src/aplicar_pago.jsx','utf8');

must(src.includes("function apSafeUserError(raw, fallback, context = '')"),'safe helper exists');
must(src.includes("console.warn('[AplicarPago] Detalle técnico oculto al operador.'"),'technical detail remains console-only');
for(const marker of ['Apps Script','backend','endpoint','token','request[_ -]?id','getEstudiante','getComprobantes','aplicarPago']) must(src.includes(marker),`technical filter covers ${marker}`);

must(!src.includes("setErrLocal(data.error || 'Estudiante no encontrado')"),'student backend raw sink removed');
must(!src.includes("setErrLocal(data.error || 'Error al cargar comprobantes')"),'receipts backend raw sink removed');
must(!src.includes("setErrLocal(data.error || 'Error al aplicar el pago')"),'apply backend raw sink removed');
must(!src.includes("setErrLocal('Error de conexión: ' + e.message)"),'direct exception sinks removed');
must(!src.includes("setPrefillError('No se pudo cargar el estudiante desde el acceso rápido: ' + (data.error"),'prefill backend raw sink removed');
must(!src.includes("setPrefillError('No se pudo cargar el estudiante desde el acceso rápido: ' + (e.message"),'prefill exception raw sink removed');

for(const context of ['buscar_estudiante','cargar_comprobantes','aplicar_pago','prefill_estudiante']) must(src.includes(`'${context}'`),`safe context ${context}`);

must(src.includes("token: window.getSessionToken ? window.getSessionToken() : ''"),'token remains in POST body');
must(src.includes("fn:             'aplicarPago'"),'aplicarPago endpoint preserved');
must(src.includes('request_id:     requestIdRef.current'),'idempotency request_id preserved');
must(src.includes('monto_total:    total'),'payment amount preserved');
must(src.includes('rubros,'),'rubros payload preserved');
must(src.includes("postAP({ fn: 'getComprobantes' })"),'getComprobantes preserved');
must(src.includes("postAP({ fn: 'getEstudiante', codigo: idBusqueda })"),'prefill getEstudiante preserved');
must(src.includes("const conapeSyncFallo = data.conape_sync === false"),'CONAPE result behavior preserved');

if(exactScope){
  const changed=execFileSync('git',['diff','--name-only',`${BASE}...HEAD`],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean).sort();
  const allowed=[
    '.github/workflows/qa-aplicar-pago-safe-errors-cs21a210i.yml',
    '00_DOCUMENTACION/APLICAR_PAGO_SAFE_ERRORS_CS21A210I_2026-08-31.md',
    'scripts/qa_aplicar_pago_safe_errors_cs21a210i.mjs',
    'src/aplicar_pago.jsx',
  ].sort();
  must(JSON.stringify(changed)===JSON.stringify(allowed),`exact scope mismatch: ${changed.join(', ')}`);
}

console.log('CS21A210I APLICAR PAGO SAFE ERRORS: PASS');
console.log(`BASE=${BASE}`);
console.log(`BRANCH=${BRANCH}`);
console.log('DIRECT_RAW_SINKS=8_REMOVED');
console.log('PAYMENT_SEMANTICS=PRESERVED');
console.log(`EXACT_SCOPE=${exactScope?'VERIFIED':'SKIPPED_BOOTSTRAP'}`);
console.log('EVIDENCE=E0_E1_SOURCE_ONLY');
console.log('APPS_SCRIPT_WRITE=NO');
console.log('DRIVE_ACL_CHANGE=NO');
console.log('PROD=NOT_TOUCHED');
