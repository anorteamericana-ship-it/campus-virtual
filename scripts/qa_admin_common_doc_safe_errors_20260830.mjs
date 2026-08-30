import fs from 'node:fs';

const src = fs.readFileSync('src/admin_students.jsx', 'utf8');
const start = src.indexOf('  const generarDocumentoComun = async (tipo) => {');
const end = src.indexOf('  };', start + 10);
if (start < 0 || end < 0) throw new Error('ADMIN COMMON DOC: generarDocumentoComun block missing');
const block = src.slice(start, end + 4);

if (!block.includes("adminStudentsSafeUserError(data?.error || data?.mensaje, 'No se pudo generar el documento. Intentá de nuevo.', 'generar_documento_comun')")) {
  throw new Error('ADMIN COMMON DOC: backend message is not sanitized');
}
if (/\{\s*error\s*:\s*data\.error\s*\|\|\s*data\.mensaje\s*\}/.test(block)) {
  throw new Error('ADMIN COMMON DOC: raw backend error still reaches state');
}
if (!block.includes("fn:'generarDocumento'")) throw new Error('ADMIN COMMON DOC: generarDocumento endpoint changed');
if (!block.includes('{ url:data.url, nombre:data.nombre }')) throw new Error('ADMIN COMMON DOC: URL delivery changed unexpectedly; private delivery is a separate backend-gated cut');
if (!src.includes('abrirCertificadoPrivadoAdmin')) throw new Error('ADMIN COMMON DOC: private certificate source regression');
if (!src.includes('abrirPdfPrivadoBackend')) throw new Error('ADMIN COMMON DOC: private academic docs regression');

console.log('ADMIN COMMON DOC SAFE ERRORS: PASS');
console.log('COMMON_DOC_URL_DELIVERY=UNCHANGED_BACKEND_GATED');
console.log('PRIVATE_DELIVERY_STATUS=PENDING');
