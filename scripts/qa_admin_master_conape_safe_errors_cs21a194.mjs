// Bootstrap evidence: run 33283524185 SUCCESS · exact patch + CS21A194 + regressions 193/192 + diff hygiene.
import fs from 'node:fs';

const files = {
  core: fs.readFileSync('src/admin_master_conape_review_core_cs21a96.jsx','utf8'),
  data: fs.readFileSync('src/admin_master_conape_data_cs21a96.jsx','utf8'),
  review: fs.readFileSync('src/admin_master_conape_review_state_cs21a96.jsx','utf8'),
  wa: fs.readFileSync('src/admin_master_conape_wa_cs21a96.jsx','utf8'),
  panel: fs.readFileSync('src/admin_master_conape_panel_cs21a96.jsx','utf8'),
};
const all = Object.values(files).join('\n');
const req = (text,label) => { if(!all.includes(text)) throw new Error(`CS21A194 missing: ${label}`); };
const forbid = (text,label) => { if(all.includes(text)) throw new Error(`CS21A194 forbidden: ${label}`); };

req('function safeUserError(raw,fallback,context=', 'shared safeUserError helper');
req("console.warn('[MasterCONAPE] Detalle técnico oculto al operador.'", 'console diagnostics');
req("safeUserError(error?.message||String(error),'No se pudo verificar la morosidad. Intentá de nuevo.'", 'mora error boundary');
req("safeUserError(error?.message||String(error),'No se pudo actualizar CONAPE. Intentá de nuevo.'", 'refresh error boundary');
req("safeUserError(error?.message||String(error),'No se pudo cargar el seguimiento. Intentá de nuevo.'", 'detail load boundary');
req("safeUserError(error?.message||String(error),'No se pudo guardar el seguimiento. Intentá de nuevo.'", 'detail save boundary');
req("safeUserError(rawError,'No se pudo guardar la revisión. Intentá de nuevo.'", 'review save boundary');
req("safeUserError(e?.message||String(e),'No se pudo preparar WhatsApp. Intentá de nuevo.'", 'WhatsApp boundary');
req("safeUserError(error?.message||String(error),'No se pudo cargar el Panel Maestro CONAPE. Intentá de nuevo.'", 'master panel load boundary');

forbid("setMsg(error?.message||String(error))", 'raw setMsg error');
forbid("error:error.message||String(error)", 'raw editor error');
forbid("error:error?.message||String(error)", 'raw state error');
forbid("alert('No se pudo preparar WhatsApp: '+(e?.message||e))", 'raw WhatsApp alert');

req("body:JSON.stringify({fn,token:window.getSessionToken?.()||'',...payload})", 'token remains in POST body');
req("post('setConapeRevisionSemaforo'", 'review endpoint preserved');
req("post('getComentarioAdminEstudiante'", 'detail endpoint preserved');
req("post('guardarComentarioAdminEstudiante'", 'detail save endpoint preserved');

console.log('CS21A194 ADMIN MASTER CONAPE SAFE ERRORS: PASS');
console.log('RAW_TECHNICAL_ERRORS_VISIBLE=NO_FOR_GUARDED_PATHS');
console.log('ENDPOINTS_AND_TOKEN_FLOW=PRESERVED');
