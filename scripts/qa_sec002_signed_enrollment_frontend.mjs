import fs from 'node:fs';

const data = fs.readFileSync('src/ventas_data.jsx','utf8');
const drawer = fs.readFileSync('src/ventas_drawer.jsx','utf8');
const student = fs.readFileSync('src/student_experience.jsx','utf8');
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else { failures.push(name); console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
};

const vStart = data.indexOf('async function descargarMatriculaFirmadaPrivadaVentasSeguro');
const vEnd = data.indexOf('// ── ENDPOINTS v4.27.1', vStart);
const ventasHelper = vStart >= 0 && vEnd > vStart ? data.slice(vStart,vEnd) : '';
check('ventas private signed helper exists', !!ventasHelper);
check('ventas helper uses authenticated postVentasData', ventasHelper.includes("postVentasData('descargarMatriculaFirmadaPrivada'"));
check('ventas helper validates PDF MIME', ventasHelper.includes("!== 'application/pdf'"));
check('ventas helper validates 9 MiB and backend size', ventasHelper.includes('bytes.length > 9 * 1024 * 1024') && ventasHelper.includes('expectedSize !== bytes.length'));
check('ventas helper validates SHA-256', ventasHelper.includes("window.crypto?.subtle.digest('SHA-256', bytes)") && ventasHelper.includes('digestHex !== expectedHash'));
check('ventas helper returns Blob not base64', ventasHelper.includes("blob:new Blob([bytes], { type:'application/pdf' })") && !/data_base64\s*:/.test(ventasHelper));
check('ventas helper exported', data.includes('notificarMatriculaFirmadaVentasSeguro, descargarMatriculaFirmadaPrivadaVentasSeguro,'));

const docStart = drawer.indexOf('function DocsEstudianteVentas');
const docEnd = drawer.indexOf('// Tipos de pago reportables', docStart);
const signedUi = docStart >= 0 && docEnd > docStart ? drawer.slice(docStart,docEnd) : '';
check('sales signed open handler exists', signedUi.includes('const openSignedPrivate = async () =>'));
check('sales signed open requires file_id', signedUi.includes('signedDoc && signedDoc.file_id'));
check('sales signed open calls private helper', signedUi.includes('window.descargarMatriculaFirmadaPrivadaVentasSeguro'));
check('sales signed open uses and revokes ObjectURL', signedUi.includes('URL.createObjectURL(r.blob)') && signedUi.includes('URL.revokeObjectURL(objectUrl)'));
check('sales UI no longer uses signedDoc.url', !/signedDoc\s*&&\s*signedDoc\.url|href=\{signedDoc\.url\}|signedDoc\.url\s*\?/.test(signedUi));
check('sales WhatsApp has no document URL', !/Matrícula firmado[^\n]*https?:|documento de matrícula firmado[^\n]*\$\{url\}/i.test(signedUi) && signedUi.includes('sin enlace público') === false);
check('sales WhatsApp copy points to private Campus', signedUi.includes('disponible de forma privada en el Campus Virtual'));
check('sales notify still passes file_id to backend', signedUi.includes('file_id: signedDoc && signedDoc.file_id ? signedDoc.file_id :'));

const sStart = student.indexOf('async function _studentPrivateSignedPdfF984');
const sEnd = student.indexOf('function StudentDocumentsHelpView', sStart);
const studentPrivate = sStart >= 0 && sEnd > sStart ? student.slice(sStart,sEnd) : '';
check('student private signed helper/card exists', !!studentPrivate && studentPrivate.includes('function StudentSignedEnrollmentPrivateF984'));
check('student request sends only endpoint + token identity', studentPrivate.includes("body:JSON.stringify({ fn:'descargarMatriculaFirmadaPrivada', token })"));
check('student request does not send cedula/codigo/file id', !/JSON\.stringify\([^\n]*(cedula|codigo|file_id)/.test(studentPrivate));
check('student validates PDF/size/hash', studentPrivate.includes("!== 'application/pdf'") && studentPrivate.includes('bytes.length > 9 * 1024 * 1024') && studentPrivate.includes("window.crypto?.subtle.digest('SHA-256', bytes)"));
check('student uses/revokes ObjectURL', studentPrivate.includes('URL.createObjectURL(r.blob)') && studentPrivate.includes('URL.revokeObjectURL(objectUrl)'));
check('student Program/Documents tab includes private signed card', student.includes('<StudentSignedEnrollmentPrivateF984 />'));
check('student private card has no Drive URL fallback', !/drive\.google\.com|lh3\.googleusercontent\.com/.test(studentPrivate));

if (failures.length) {
  console.error(`SEC002 SIGNED ENROLLMENT FRONTEND: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC002 SIGNED ENROLLMENT FRONTEND: PASS');
