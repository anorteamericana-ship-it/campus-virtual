import fs from 'node:fs';

const modules = fs.readFileSync('src/student_modules.jsx', 'utf8');
const experience = fs.readFileSync('src/student_experience.jsx', 'utf8');

function must(text, needle, label) {
  if (!text.includes(needle)) throw new Error(`Missing ${label}: ${needle}`);
}
function mustNot(text, needle, label) {
  if (text.includes(needle)) throw new Error(`Forbidden ${label}: ${needle}`);
}

must(modules, 'function _smSafeUserErrorF984(', 'certificate safe-error helper');
must(modules, "console.warn('[StudentCertificates] Detalle técnico oculto al estudiante.'", 'certificate console diagnostic');
must(modules, "_smSafeUserErrorF984(r?.mensaje || r?.error, 'No se pudo verificar los certificados.', 'estado_certificados')", 'safe certificate status backend');
must(modules, "_smSafeUserErrorF984(e?.message, 'No se pudo verificar los certificados.', 'estado_certificados')", 'safe certificate status catch');
must(modules, "_smSafeUserErrorF984(r?.mensaje || r?.error, 'No se pudo abrir el certificado.', 'abrir_certificado')", 'safe certificate backend');
must(modules, "_smSafeUserErrorF984(e?.message, 'No se pudo abrir el certificado.', 'abrir_certificado')", 'safe certificate catch');
mustNot(modules, "throw new Error(r?.mensaje || r?.error || 'No se pudo verificar los certificados.')", 'raw certificate status error');
mustNot(modules, "error:e?.message || 'No se pudo verificar los certificados.'", 'raw certificate state error');
mustNot(modules, "throw new Error(r?.mensaje || r?.error || 'No se pudo abrir el certificado privado.')", 'raw certificate backend error');
mustNot(modules, "setCertError(e?.message || 'No se pudo abrir el certificado.')", 'raw certificate catch');

must(experience, 'function studentSafeUserErrorF984(', 'signed enrollment safe-error helper');
must(experience, "console.warn('[StudentDocuments] Detalle técnico oculto al estudiante.'", 'signed enrollment console diagnostic');
must(experience, "studentSafeUserErrorF984(r?.mensaje || r?.error, 'No hay una matrícula firmada disponible todavía.', 'matricula_firmada')", 'safe signed enrollment backend');
must(experience, "studentSafeUserErrorF984(e?.message, 'No se pudo abrir la matrícula firmada.', 'matricula_firmada')", 'safe signed enrollment catch');
mustNot(experience, "throw new Error(r?.mensaje || r?.error || 'No hay una matrícula firmada disponible todavía.')", 'raw signed enrollment backend');
mustNot(experience, "setError(e?.message || 'No se pudo abrir la matrícula firmada.')", 'raw signed enrollment catch');

// Privacy/integrity regressions remain mandatory.
must(modules, "postStudentModules('descargarMiCertificadoPrivado'", 'private certificate route');
must(modules, 'URL.createObjectURL', 'certificate ObjectURL');
mustNot(modules, 'href={row.url}', 'public certificate navigation');
must(experience, "fn:'descargarMatriculaFirmadaPrivada'", 'private signed enrollment route');
must(experience, 'integridad_matricula_firmada_invalida', 'signed enrollment integrity gate');
must(experience, 'URL.createObjectURL', 'signed enrollment ObjectURL');

console.log('CS21A183 STUDENT PRIVATE DOC SAFE ERRORS: PASS');
console.log('INTEGRITY_CHECKS_PRESERVED=PASS');
console.log('PRIVATE_ROUTES_PRESERVED=PASS');
