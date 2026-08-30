import fs from 'node:fs';

const src = fs.readFileSync('src/admin_students.jsx', 'utf8');

function must(text, label) {
  if (!src.includes(text)) throw new Error(`CS21A193 missing: ${label}`);
}
function mustNot(text, label) {
  if (src.includes(text)) throw new Error(`CS21A193 forbidden: ${label}`);
}
function block(start, end, label) {
  const a = src.indexOf(start);
  if (a < 0) throw new Error(`CS21A193 missing block start: ${label}`);
  const b = src.indexOf(end, a + start.length);
  if (b < 0) throw new Error(`CS21A193 missing block end: ${label}`);
  return src.slice(a, b);
}

must('function abrirPdfPrivadoBackend(payload)', 'private PDF opener');
must("const b64 = String(payload?.pdf_base64 || '').trim();", 'base64-only payload');
must("if (mime !== 'application/pdf') return false;", 'PDF MIME validation');
must("if (!bin.startsWith('%PDF-')) return false;", 'PDF signature validation');
must('URL.createObjectURL(new Blob([bytes], { type: mime }))', 'Blob/ObjectURL delivery');
must('URL.revokeObjectURL(url)', 'ObjectURL cleanup');

const traslado = block('const abrirPdfTraslado = async () => {', '                return (', 'traslado opener');
if (!traslado.includes('include_base64:true')) throw new Error('CS21A193 traslado must request private base64');
if (!traslado.includes('abrirPdfPrivadoBackend(r)')) throw new Error('CS21A193 traslado must use private opener');
if (/window\.open\s*\(\s*e\.pdf_traslado_url/i.test(traslado)) throw new Error('CS21A193 traslado still opens persisted Drive URL directly');

const historial = block('async function abrirDocumento(r){', '  async function regenerarCarta(r){', 'history document opener');
if (!historial.includes('include_base64:true')) throw new Error('CS21A193 history document must request private base64');
if (!historial.includes('abrirPdfPrivadoBackend(resp)')) throw new Error('CS21A193 history document must use private opener');
if (/existingUrl|window\.open\s*\(/i.test(historial)) throw new Error('CS21A193 history document still short-circuits to URL');

const regen = block('async function regenerarCarta(r){', '  async function descargarFormularioConape(r){', 'CONAPE regeneration');
if (!regen.includes('include_base64:true')) throw new Error('CS21A193 regenerated CONAPE letter must request private base64');
if (!regen.includes('abrirPdfPrivadoBackend(resp)')) throw new Error('CS21A193 regenerated CONAPE letter must use private opener');
if (/window\.open\s*\(\s*resp\?\.pdf_url|window\.open\s*\(\s*resp\.pdf_url/i.test(regen)) throw new Error('CS21A193 regenerated letter still opens Drive URL directly');

must("postAdminStudents('generarConstanciaTraslado'", 'traslado endpoint preserved');
must("postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape'", 'history endpoints preserved');
must("postAdminStudents('generarCartaIntegralConape'", 'CONAPE endpoint preserved');
must('PDF_TRASLADO_URL', 'persisted traslado metadata preserved');
must('CARTA_CONAPE_URL', 'persisted CONAPE metadata preserved');
must('adminStudentsSafeUserError', 'CS21A191 safe-error boundary preserved');

mustNot("include_base64:false},80000", 'private academic document calls must not explicitly disable base64');

console.log('CS21A193 SEC002 ADMIN PRIVATE ACADEMIC DOCS: PASS');
console.log('DRIVE_ACL_CHANGE=NO');
console.log('PRIVATE_DELIVERY=BASE64_BLOB_OBJECTURL');
console.log('E2_ADMIN=REQUIRED_BEFORE_RELEASE');
