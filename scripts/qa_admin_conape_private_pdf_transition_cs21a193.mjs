import fs from 'node:fs';

const p = 'src/admin_students.jsx';
const s = fs.readFileSync(p, 'utf8');
const must = (needle, label) => {
  if (!s.includes(needle)) throw new Error(`CS21A193 missing: ${label}`);
};
const forbid = (needle, label) => {
  if (s.includes(needle)) throw new Error(`CS21A193 forbidden: ${label}`);
};

must('function abrirPdfPrivadoPreferente(payload, fallbackUrl = \'\', context = \'\')', 'private-preferred PDF helper');
must("console.warn('[AdminStudents] Entrega privada de PDF no disponible; se usa fallback temporal a URL.', { context });", 'explicit transition diagnostic');
must("include_base64:true", 'base64 request enabled');
const base64Requests = (s.match(/include_base64:true/g) || []).length;
if (base64Requests < 3) throw new Error(`CS21A193 expected >=3 include_base64:true requests, got ${base64Requests}`);
must("abrirPdfPrivadoPreferente(r, r?.pdf_url || e.pdf_traslado_url, 'traslado_panel')", 'panel traslado private-first open');
must("abrirPdfPrivadoPreferente(resp, existingUrl || resp?.pdf_url, 'historial_documento')", 'history document private-first open');
must("abrirPdfPrivadoPreferente(resp, resp?.pdf_url, 'regenerar_carta_conape')", 'regenerated CONAPE letter private-first open');

forbid("if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url", 'direct row traslado URL open');
forbid("if(existingUrl){window.open(existingUrl", 'direct history URL open');
forbid("include_base64:false", 'explicit base64 disable in admin CONAPE docs');
forbid("if(resp?.pdf_url)window.open(resp.pdf_url", 'direct regenerated URL open');

must('function abrirPdfBackend(payload, fallbackUrl = \'\')', 'legacy compatible PDF helper preserved');
must("adminStudentsSafeUserError", 'CS21A191 safe error boundary preserved');

console.log('CS21A193 ADMIN CONAPE PRIVATE PDF TRANSITION: PASS');
console.log('PRIVATE_BYTES=PREFERRED');
console.log('URL_FALLBACK=TEMPORARY_AND_DIAGNOSTIC');
console.log('SEC002_RUNTIME_CLOSED=NO_E2_PENDING');
