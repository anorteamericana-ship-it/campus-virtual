import fs from 'node:fs';

const src = fs.readFileSync('src/admin_students.jsx', 'utf8');
const contract = JSON.parse(fs.readFileSync('security/sec002_admin_academic_docs_cs21a193.json', 'utf8'));

function must(cond, msg) {
  if (!cond) {
    console.error(`CS21A193 FAIL: ${msg}`);
    process.exit(1);
  }
}

must(contract.status === 'SOURCE_CANDIDATE_RUNTIME_E2_REQUIRED', 'contract must remain runtime-E2 gated');
must(contract.source_policy?.drive_acl_change === false, 'contract must not change Drive ACL');
must(contract.source_policy?.apps_script_change === false, 'contract must not claim Apps Script changes');

must(src.includes('function abrirPdfPrivadoBackend(payload)'), 'private PDF opener missing');
must(src.includes("include_base64:true"), 'private document requests must request base64');
must(src.includes("generarConstanciaTraslado"), 'transfer operation must remain present');
must(src.includes("generarCartaIntegralConape"), 'CONAPE letter operation must remain present');
must(src.includes("adminStudentsSafeUserError"), 'safe error boundary must remain present');

must(!src.includes("if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url"), 'direct transfer Drive open must be removed');
must(!src.includes("if(existingUrl){window.open(existingUrl"), 'direct historical academic document open must be removed');
must(!src.includes("include_base64:false"), 'target document flow must not explicitly disable base64');
must(!src.includes("window.open(resp.pdf_url"), 'regenerated CONAPE letter must not open backend URL directly');

must(src.includes("PDF_TRASLADO_URL"), 'historical transfer URL metadata must remain for state/labels');
must(src.includes("CARTA_CONAPE_URL"), 'historical CONAPE URL metadata must remain for state/labels');
must(src.includes("function abrirPdfBackend(payload, fallbackUrl = '')"), 'legacy generic helper must remain untouched for unrelated compatibility');

console.log('CS21A193 ADMIN PRIVATE ACADEMIC DOCS: PASS');
console.log('TARGET_DIRECT_DRIVE_OPEN=NO');
console.log('PRIVATE_BASE64_REQUEST=YES');
console.log('DRIVE_ACL_CHANGE=NO');
console.log('APPS_SCRIPT_CHANGE=NO');
console.log('RUNTIME_E2_REQUIRED=YES');
