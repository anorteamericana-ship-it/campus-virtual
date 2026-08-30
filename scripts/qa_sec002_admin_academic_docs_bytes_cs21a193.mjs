import fs from 'node:fs';

const src = fs.readFileSync('src/admin_students.jsx', 'utf8');
const contract = JSON.parse(fs.readFileSync('security/sec002_admin_academic_docs_transition_cs21a193.json', 'utf8'));

function must(label, condition) {
  if (!condition) {
    console.error(`FAIL ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS ${label}`);
  }
}

must('contract remains transition-not-closed', contract.security_status === 'TRANSITION_NOT_CLOSED');
must('contract keeps fresh snapshot gate', contract.backend_contract_evidence?.fresh_runtime_snapshot === 'PENDING_ISSUE_111');
must('contract records no prod/ACL/backend change', contract.production_status === 'NO_PROD_NO_ACL_CHANGE_NO_APPS_SCRIPT_CHANGE');

must('Blob/ObjectURL path remains primary when base64 exists', src.includes("if (payload?.pdf_base64)") && src.includes('URL.createObjectURL(new Blob([bytes]'));
must('legacy fallback remains explicitly available during transition', src.includes('const url = payload?.pdf_url || fallbackUrl;'));

must('transfer button no longer short-circuits directly to Drive URL', !src.includes("if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url, '_blank', 'noopener,noreferrer'); return; }"));
must('transfer fetch requests authenticated bytes', src.includes("postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000)"));
must('transfer opening keeps compatibility fallback only after backend read', src.includes('abrirPdfBackend(r, e.pdf_traslado_url || r.pdf_url)'));

must('change-history open no longer short-circuits existingUrl', !src.includes("if(existingUrl){window.open(existingUrl,'_blank','noopener,noreferrer');return;}"));
must('change-history document request asks for bytes', src.includes("{cambio_id:r.CAMBIO_ID,include_base64:true},80000"));
must('change-history opening prefers backend bytes and retains legacy fallback', src.includes('abrirPdfBackend(resp,existingUrl||resp.pdf_url)'));

must('CONAPE regeneration asks for bytes', src.includes("{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true},80000"));
must('CONAPE regeneration no longer directly opens resp.pdf_url', !src.includes("if(resp?.pdf_url)window.open(resp.pdf_url,'_blank','noopener,noreferrer');"));
must('CONAPE regeneration uses byte-first opener', src.includes('abrirPdfBackend(resp,resp.pdf_url)'));

must('old include_base64=false target pattern removed', !src.includes('include_base64:false'));
must('safe-error boundary preserved', src.includes('function adminStudentsSafeUserError(raw, fallback, context = \'\')'));

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A193 SEC002 ADMIN ACADEMIC DOCS BYTE-FIRST TRANSITION: PASS');
console.log('PRIVATE_BYTES=PREFERRED');
console.log('LEGACY_PRIVATE_URL_FALLBACK=TEMPORARY');
console.log('SEC002_RUNTIME_CLOSURE=PENDING_E2_AND_FRESH_SNAPSHOT');
