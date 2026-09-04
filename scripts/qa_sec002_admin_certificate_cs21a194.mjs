import fs from 'node:fs';

const src = fs.readFileSync('src/admin_students.jsx', 'utf8');
const contract = JSON.parse(fs.readFileSync('security/sec002_admin_certificate_contract_cs21a194.json', 'utf8'));

function check(condition, message) {
  if (!condition) {
    console.error(`FAIL CS21A194: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

check(contract.status === 'SOURCE_MIGRATED_BACKEND_QA_PENDING_ACL_UNCHANGED', 'contract preserves backend/ACL gate');
check(contract.severity === 'P1', 'P1 remains explicit');
check(contract.drive_acl_evidence?.sample_count === 3, 'three ACL samples documented');
check(contract.drive_acl_evidence?.all_samples_anyone_reader === true, 'public-by-link sample evidence remains explicit');
check(contract.production === 'NOT_TOUCHED', 'production remains untouched');

check(src.includes('async function abrirCertificadoAdminPrivado('), 'admin private certificate helper exists');
check(src.includes("postAdminStudents('descargarMiCertificadoPrivado'"), 'private certificate endpoint is wired for admin');
check(src.includes("String(r?.mime_type || '').trim().toLowerCase() !== 'application/pdf'"), 'PDF MIME is required');
check(src.includes('bytes.length > 2 * 1024 * 1024'), '2 MiB decoded limit is enforced');
check(src.includes("bin.slice(0, 5) !== '%PDF-'"), 'PDF signature is validated');
check(src.includes("window.crypto.subtle.digest('SHA-256', bytes)"), 'SHA-256 is verified when Web Crypto exists');
check(src.includes("new Blob([bytes], { type:'application/pdf' })"), 'local PDF Blob is created');
check(src.includes('URL.revokeObjectURL(objectUrl)'), 'ObjectURL is revoked');

const calls = (src.match(/abrirCertificadoAdminPrivado\(/g) || []).length;
check(calls >= 4, 'helper plus three admin certificate calls exist');

check(!src.includes("if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');"), 'direct certificate data.url navigation is absent');
check(!src.includes('[certKey]: { url:data.url'), 'public certificate URL is not stored in certificate UI state');
check(src.includes("postAdminStudents('generarCertificado'"), 'certificate generation endpoint remains');
check(src.includes("postAdminStudents('buscarCertificadoExistente'"), 'existing-certificate lookup remains');
check(src.includes('forzar_generar: true'), 'same-registration regeneration remains');
check(src.includes('adminStudentsSafeUserError'), 'safe user error boundary remains');

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A194 SEC002 ADMIN CERTIFICATE: PASS');
console.log('PUBLIC_URL_NAVIGATION=REMOVED_FROM_ADMIN_CERTIFICATE_PATHS');
console.log('PRIVATE_ENDPOINT=SOURCE_WIRED_RUNTIME_PENDING');
console.log('ACL=UNCHANGED');
