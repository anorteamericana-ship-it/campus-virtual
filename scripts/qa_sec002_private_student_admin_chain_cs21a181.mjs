import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function must(text, needle, label) {
  if (!text.includes(needle)) throw new Error(`Missing ${label}: ${needle}`);
}
function mustNot(text, needle, label) {
  if (text.includes(needle)) throw new Error(`Forbidden ${label}: ${needle}`);
}
function count(text, needle) {
  return text.split(needle).length - 1;
}

const student = read('src/student_modules.jsx');
const data = read('src/data.jsx');
const pagos = read('src/solicitudes_pago.jsx');
const experience = read('src/student_experience.jsx');

// CS21A160 · certificado estudiante privado.
must(student, "postStudentModules('descargarMiCertificadoPrivado'", 'private student certificate route');
must(student, 'URL.createObjectURL', 'certificate ObjectURL');
mustNot(student, 'href={row.url}', 'direct certificate public navigation');
if (count(student, 'row.url') > 1) throw new Error('row.url may remain only as legacy availability state, never as a destination');

// CS21A161 · comprobante admin privado.
must(data, 'descargarComprobantePagoPrivado', 'private payment receipt client');
must(pagos, 'window.descargarComprobantePagoPrivado(id)', 'private payment receipt consumer');
must(pagos, 'tiene_comprobante', 'private receipt availability shape');
must(pagos, 'URL.createObjectURL', 'receipt ObjectURL');
if (count(pagos, 'url_comprobante') > 1) throw new Error('url_comprobante may remain only for local demo data URL compatibility');
mustNot(pagos, "const url = sol.url_comprobante", 'direct payment receipt URL');
mustNot(pagos, "window.open(url, '_blank'", 'direct payment receipt navigation');

// CS21A162 · matrícula firmada privada estudiante.
must(experience, '_studentPrivateSignedPdfF984', 'student signed enrollment private helper');
must(experience, "fn: 'descargarMatriculaFirmadaPrivada'", 'private signed enrollment route');
must(experience, 'StudentSignedEnrollmentPrivateF984', 'private signed enrollment UI');
must(experience, 'URL.createObjectURL', 'signed enrollment ObjectURL');

// Este corte es consumidor/source. No puede fingir que backend/ACL ya cerraron.
for (const [name, text] of [['student_modules', student], ['data', data], ['solicitudes_pago', pagos], ['student_experience', experience]]) {
  mustNot(text, 'DriveApp.Access.ANYONE', `${name} public ACL mutation`);
  mustNot(text, '.setSharing(', `${name} sharing mutation`);
}

console.log('CS21A181 SEC002 PRIVATE STUDENT ADMIN CHAIN: PASS');
console.log('CERTIFICATE_PRIVATE_CONSUMER=PASS');
console.log('PAYMENT_RECEIPT_PRIVATE_CONSUMER=PASS');
console.log('SIGNED_ENROLLMENT_PRIVATE_CONSUMER=PASS');
console.log('BACKEND_RUNTIME_CLAIM=NONE');
