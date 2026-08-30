import fs from 'node:fs';

const src = fs.readFileSync('src/admin_students.jsx', 'utf8');

function must(text, label) {
  if (!src.includes(text)) throw new Error(`SEC002 ADMIN CERT missing: ${label}`);
}
function block(start, end, label) {
  const a = src.indexOf(start);
  if (a < 0) throw new Error(`SEC002 ADMIN CERT missing start: ${label}`);
  const b = src.indexOf(end, a + start.length);
  if (b < 0) throw new Error(`SEC002 ADMIN CERT missing end: ${label}`);
  return src.slice(a, b);
}

must('async function abrirCertificadoPrivadoAdmin', 'private admin certificate helper');
must("postAdminStudents('descargarMiCertificadoPrivado'", 'private certificate endpoint');
must("String(r.mime_type || '').trim().toLowerCase() !== 'application/pdf'", 'PDF MIME validation');
must('bytes.length > 2 * 1024 * 1024', '2 MiB client bound');
must('bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45', 'PDF signature validation');
must("window.crypto.subtle.digest('SHA-256', bytes)", 'SHA-256 validation');
must('URL.createObjectURL(new Blob([bytes], { type:\'application/pdf\' }))', 'Blob/ObjectURL delivery');
must('URL.revokeObjectURL(url)', 'ObjectURL cleanup');

const cert = block('  const buscarCertificado = async () => {', '  const certResult = res[certKey];', 'certificate actions');
const privateCalls = (cert.match(/abrirCertificadoPrivadoAdmin\s*\(/g) || []).length;
if (privateCalls < 3) throw new Error(`SEC002 ADMIN CERT expected >=3 private opens, found ${privateCalls}`);
if (/window\.open\s*\(\s*data\.url/i.test(cert)) throw new Error('SEC002 ADMIN CERT direct data.url open remains');
if (/buscarCertificadoExistente/.test(cert)) throw new Error('SEC002 ADMIN CERT legacy URL lookup remains in admin consumer');
if (/search_url/.test(cert)) throw new Error('SEC002 ADMIN CERT Drive search fallback remains in admin certificate actions');

const render = block('  const certResult = res[certKey];', '      <div style={{ marginTop:14,', 'certificate render');
if (/certResult\?\.url|href=\{certResult\.url\}|search_url|Buscar en Drive/.test(render)) {
  throw new Error('SEC002 ADMIN CERT URL/search fallback remains in certificate render');
}
if (!render.includes('certResult?.private')) throw new Error('SEC002 ADMIN CERT private result state missing');

must("postAdminStudents('generarCertificado'", 'certificate generation preserved');
must('generarCertificadosNivel', 'bulk generation preserved');
must('adminStudentsSafeUserError', 'safe-error boundary preserved');
must('abrirPdfPrivadoBackend', 'CS21A193 private academic docs preserved');

console.log('SEC002 ADMIN CERTIFICATE PRIVATE SOURCE: PASS');
console.log('PUBLIC_ACL_STATUS=P1_STILL_OPEN');
console.log('BACKEND_ENDPOINT_STATUS=PENDING_ISSUE_111');
console.log('E2_ADMIN_AND_STUDENT_REQUIRED=YES');
