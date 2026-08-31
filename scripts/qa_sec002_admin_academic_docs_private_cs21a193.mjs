import fs from 'node:fs';

const src = fs.readFileSync('src/admin_students.jsx', 'utf8');
const must = [
  "function abrirPdfBackend(payload, fallbackUrl = '', options = {})",
  "const allowUrl = options?.allowUrl !== false;",
  "if (allowUrl) {",
  "include_base64:true",
  "abrirPdfBackend(r,'',{allowUrl:false})",
  "abrirPdfBackend(resp,'',{allowUrl:false})",
  "generarConstanciaTraslado",
  "generarCartaIntegralConape",
  "adminStudentsSafeUserError",
];
for (const token of must) {
  if (!src.includes(token)) throw new Error(`CS21A193 missing required token: ${token}`);
}
const forbidden = [
  "if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url",
  "if(existingUrl){window.open(existingUrl",
  "window.open(resp.pdf_url",
  "include_base64:false",
];
for (const token of forbidden) {
  if (src.includes(token)) throw new Error(`CS21A193 forbidden direct/private URL path remains: ${token}`);
}
const base64True = (src.match(/include_base64:true/g) || []).length;
if (base64True < 3) throw new Error(`CS21A193 expected >=3 private base64 requests, found ${base64True}`);
if (!src.includes("const url = payload?.pdf_url || fallbackUrl;")) throw new Error('CS21A193 changed legacy URL helper semantics globally; expected preserved fallback inside allowUrl gate.');
console.log('CS21A193 SEC002 ADMIN ACADEMIC DOCS PRIVATE: PASS');
console.log(`PRIVATE_BASE64_REQUESTS=${base64True}`);
console.log('DIRECT_DRIVE_OPEN_TARGET_PATHS=REMOVED');
console.log('LEGACY_HELPER_URL_FALLBACK=PRESERVED_FOR_NON_TARGET_PATHS');
console.log('RUNTIME_E2=REQUIRED_BEFORE_RELEASE');
