import fs from 'node:fs';

const src = fs.readFileSync('src/admin_students.jsx', 'utf8');
function must(cond, msg) { if (!cond) throw new Error(`CS21A198R guard: ${msg}`); }

const start = src.indexOf('  const generarDocumentoComun = async (tipo) => {');
const end = src.indexOf('  };', start + 10);
must(start >= 0 && end >= 0, 'generarDocumentoComun block missing');
const block = src.slice(start, end + 4);

must(block.includes("adminStudentsSafeUserError(data?.error || data?.mensaje, 'No se pudo generar el documento. Intentá de nuevo.', 'generar_documento_comun')"), 'backend response must pass safe-error boundary');
must(!/\{\s*error\s*:\s*data\.error\s*\|\|\s*data\.mensaje\s*\}/.test(block), 'raw backend error cannot reach common-doc state');
must(block.includes("fn:'generarDocumento'"), 'generarDocumento endpoint preserved');
must(block.includes('{ url:data.url, nombre:data.nombre }'), 'URL delivery deliberately unchanged in this cut');
must(src.includes('async function abrirCertificadoPrivadoAdmin'), 'CS21A197R private certificate consumer preserved');
must(src.includes("postAdminStudents('descargarMiCertificadoPrivado'"), 'private certificate operation preserved');
must(src.includes("function abrirPdfBackend(payload, fallbackUrl = '', options = {})"), 'CS21A193 academic document helper preserved');
must(src.includes('const allowUrl = options?.allowUrl !== false;'), 'CS21A193 fail-closed policy preserved');

console.log('CS21A198R ADMIN COMMON DOC SAFE ERRORS REBASE: PASS');
console.log('COMMON_DOC_URL_DELIVERY=UNCHANGED_BACKEND_GATED');
console.log('CERTIFICATE_PRIVATE_SOURCE=PRESERVED');
console.log('PRIVATE_COMMON_DOC_DELIVERY=PENDING');
