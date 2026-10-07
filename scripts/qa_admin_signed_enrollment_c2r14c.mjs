import fs from 'node:fs';

const admin = fs.readFileSync('src/admin_students.jsx', 'utf8');
const app = fs.readFileSync('src/app.jsx', 'utf8');

let fail = 0;
function check(ok, label) {
  if (ok) console.log('PASS ' + label);
  else { fail++; console.error('FAIL ' + label); }
}

check(admin.includes("postAdminStudents('descargarMatriculaFirmadaPrivada'"), 'Admin opens signed enrollment through private endpoint');
check(admin.includes("postAdminStudents('subirMatriculaFirmadaVentas'"), 'Admin versions signed enrollment through shared backend endpoint');
check(admin.includes("postAdminStudents('getProspectoDetalle'"), 'Admin reads latest signed-document metadata');
check(admin.includes("file_id: ''"), 'Admin opens the latest authorized signed version');
check(admin.includes("window.crypto.subtle.digest('SHA-256', bytes)"), 'Admin verifies signed PDF integrity');
check(admin.includes('bytes.length > 9 * 1024 * 1024'), 'Admin enforces signed PDF size limit');
check(admin.includes('data-admin-signed-enrollment="true"'), 'Admin Documents tab exposes signed versioning controls');
check(admin.includes('Las versiones anteriores se conservan'), 'Admin UI explains version preservation');
check(admin.includes("fn: tipo === 'CERTIFICADO' ? 'generarDocumentoVentas' : 'generarDocumento'"), 'Admin enrollment uses the same canonical renderer as Sales while preserving other admin documents');
check(!admin.includes("fn:'generarDocumentoAdminFirmado'"), 'No duplicate enrollment generator was introduced');
check(app.includes('src/admin_students.jsx?v=F98.4Z6CS21A214'), 'Admin lazy bundle is cache-busted');

if (fail) process.exit(1);
console.log('C2-R14C ADMIN SIGNED ENROLLMENT QA PASS');
