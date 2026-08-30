import fs from 'node:fs';

const src = fs.readFileSync('src/admin_students.jsx', 'utf8');
const mustHave = [
  'function abrirPdfPrivadoBackend(payload)',
  "postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }",
  "postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:true}",
  "postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true}",
  'abrirPdfPrivadoBackend(r)',
  'abrirPdfPrivadoBackend(resp)',
  "adminStudentsSafeUserError",
];
for (const needle of mustHave) {
  if (!src.includes(needle)) throw new Error(`CS21A193 missing required private-delivery contract: ${needle}`);
}
const forbidden = [
  "if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url",
  'const existingUrl=simple?r.PDF_TRASLADO_URL:r.CARTA_CONAPE_URL;',
  "window.open(existingUrl,'_blank'",
  "include_base64:false",
  'abrirPdfBackend(resp,resp.pdf_url)',
  'if(resp?.pdf_url)window.open(resp.pdf_url',
];
for (const needle of forbidden) {
  if (src.includes(needle)) throw new Error(`CS21A193 direct-URL fallback still present: ${needle}`);
}
if (!src.includes("mime !== 'application/pdf'")) throw new Error('CS21A193 private helper must enforce PDF MIME.');
if (!src.includes("bin.slice(0,5) !== '%PDF-'")) throw new Error('CS21A193 private helper must enforce PDF signature.');
if (!src.includes('URL.revokeObjectURL(url)')) throw new Error('CS21A193 must revoke private Blob URLs.');

console.log('CS21A193 ADMIN ACADEMIC PRIVATE PDF: PASS');
console.log('DIRECT_DRIVE_OPEN=REMOVED_FOR_TRANSFER_AND_CONAPE_LETTER');
console.log('PRIVATE_DELIVERY=BASE64_TO_BLOB_FAIL_CLOSED');
console.log('DRIVE_ACL=UNCHANGED');
console.log('E2_ADMIN_RUNTIME=REQUIRED_BEFORE_RELEASE');
