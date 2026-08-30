import fs from 'node:fs';

const src = fs.readFileSync('src/admin_students.jsx', 'utf8');
const contract = JSON.parse(fs.readFileSync('security/sec002_admin_academic_pdf_delivery_cs21a193.json', 'utf8'));

function must(cond, msg) {
  if (!cond) throw new Error(`CS21A193 guard: ${msg}`);
}

must(contract.runtime_gate === 'E2_ADMIN_REQUIRED_BEFORE_RELEASE', 'runtime E2 gate must remain explicit');
must(contract.drive_acl_evidence.acl_change_in_this_cut === 'NONE', 'this cut must not change Drive ACL');
must(contract.backend_compatibility_evidence.fresh_modular_QA_snapshot === 'PENDING_ISSUE_111', 'fresh modular backend must remain unproven until Issue #111 snapshot');

must(src.includes('function abrirPdfPrivadoAdmin(payload)'), 'strict private PDF helper is missing');
must(src.includes("mime !== 'application/pdf'"), 'private helper must enforce PDF MIME');
must(src.includes("bin.slice(0, 5) !== '%PDF-'"), 'private helper must enforce PDF signature');
must(src.includes('12 * 1024 * 1024'), 'private helper must keep a bounded PDF size');
must(src.includes('URL.createObjectURL'), 'private helper must render with ObjectURL');
must(src.includes('URL.revokeObjectURL'), 'private helper must revoke ObjectURL');

must(!src.includes("window.open(e.pdf_traslado_url, '_blank', 'noopener,noreferrer')"), 'transfer certificate must not open the historical Drive URL directly');
must(!src.includes("if(existingUrl){window.open(existingUrl,'_blank','noopener,noreferrer');return;}"), 'history modal must not open existing Drive URLs directly');
must(!src.includes("if(resp?.pdf_url)window.open(resp.pdf_url,'_blank','noopener,noreferrer');"), 'regenerated CONAPE letter must not open Drive URL directly');

must(src.includes("postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000)"), 'student-row transfer certificate must request authenticated base64');
must(src.includes("postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:true},80000)"), 'history document open must request authenticated base64');
must(src.includes("postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true},80000)"), 'CONAPE regeneration must request authenticated base64');

must((src.match(/abrirPdfPrivadoAdmin\(/g) || []).length >= 4, 'target flows must use the strict private PDF helper');
must(src.includes('PDF_TRASLADO_URL') && src.includes('CARTA_CONAPE_URL'), 'historical metadata fields must remain available for state/labels');
must(src.includes("async function postAdminStudents(fn, payload = {}, timeoutMs = 25000)"), 'authenticated admin transport must remain present');
must(src.includes('adminStudentsSafeUserError'), 'CS21A191 safe-error boundary must remain present');

console.log('CS21A193 SEC002 ADMIN ACADEMIC PDF DELIVERY: PASS');
console.log('TARGET_DRIVE_URL_OPEN=DIRECT_NO');
console.log('TARGET_DELIVERY=AUTH_POST_BASE64_OBJECT_URL');
console.log('DRIVE_ACL_CHANGE=NONE');
console.log('BACKEND_FRESH_SNAPSHOT=PENDING_ISSUE_111');
console.log('RELEASE_GATE=E2_ADMIN_REQUIRED');
