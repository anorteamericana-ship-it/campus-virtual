import fs from 'node:fs';

const srcPath = 'src/admin_students.jsx';
const contractPath = 'security/sec002_admin_academic_docs_contract_cs21a193.json';
const src = fs.readFileSync(srcPath, 'utf8');
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

const fail = (msg) => {
  console.error(`CS21A193 FAIL: ${msg}`);
  process.exit(1);
};
const requireText = (needle, label = needle) => {
  if (!src.includes(needle)) fail(`missing required source contract: ${label}`);
};
const forbidText = (needle, label = needle) => {
  if (src.includes(needle)) fail(`forbidden direct/private URL path remains: ${label}`);
};

if (contract?.status !== 'SOURCE_READY_RUNTIME_UNVERIFIED') fail('contract status must remain SOURCE_READY_RUNTIME_UNVERIFIED');
if (contract?.frontend_contract?.url_fallback !== false) fail('contract must fail closed without URL fallback');
if (contract?.production !== 'NOT_TOUCHED') fail('production boundary changed');

requireText('function abrirPdfBackend(payload) {', 'private PDF helper without URL fallback parameter');
requireText("payload?.pdf_mime", 'MIME validation');
requireText("'%PDF'", 'PDF signature validation');
requireText('15 * 1024 * 1024', '15 MiB decoded-size bound');
requireText("URL.createObjectURL(new Blob([bytes], { type:'application/pdf' }))", 'Blob/ObjectURL delivery');
requireText("include_base64:true", 'base64 request flag');

const includeBase64Count = (src.match(/include_base64:true/g) || []).length;
if (includeBase64Count < 3) fail(`expected at least 3 include_base64:true requests, found ${includeBase64Count}`);

requireText("postAdminStudents('generarConstanciaTraslado'", 'transfer certificate endpoint preserved');
requireText("postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape'", 'history document endpoint selection preserved');
requireText("postAdminStudents('generarCartaIntegralConape'", 'CONAPE letter endpoint preserved');

forbidText("function abrirPdfBackend(payload, fallbackUrl = '')", 'legacy helper fallback parameter');
forbidText("const url = payload?.pdf_url || fallbackUrl", 'legacy helper URL fallback');
forbidText("window.open(e.pdf_traslado_url", 'direct transfer URL open');
forbidText("if(existingUrl){window.open(existingUrl", 'direct history URL open');
forbidText("include_base64:false", 'explicitly disabled private bytes');
forbidText("if(resp?.pdf_url)window.open(resp.pdf_url", 'direct regenerated letter URL open');
forbidText("abrirPdfBackend(resp,resp.pdf_url)", 'history helper URL fallback');
forbidText("abrirPdfBackend(r, r.pdf_url)", 'transfer helper URL fallback');

requireText("adminStudentsSafeUserError", 'existing safe-user-error boundary');
requireText("No pudimos abrir", 'stable failure copy');

console.log('CS21A193 SEC002 ADMIN ACADEMIC DOCS: PASS');
console.log('DIRECT_DRIVE_URL_OPEN=NO_FOR_GUARDED_PATHS');
console.log('PRIVATE_BYTES_REQUESTED=YES');
console.log('PDF_VALIDATION=MIME_SIGNATURE_SIZE');
console.log('RUNTIME_QA=UNVERIFIED');
console.log('DRIVE_ACL=UNCHANGED');
