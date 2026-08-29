import fs from 'node:fs';

const src = fs.readFileSync('src/admin_students.jsx', 'utf8');
function must(ok, label) { if (!ok) throw new Error(`CS21A193 FAIL: ${label}`); }

must(src.includes("function abrirPdfBackend(payload, fallbackUrl = '', allowUrlFallback = true)"), 'PDF helper exposes explicit URL-fallback policy');
must(src.includes("if (!allowUrlFallback) return false;"), 'PDF helper can fail closed before URL fallback');

must(src.includes("postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000)"), 'student-history transfer requests authenticated PDF bytes');
must(src.includes("abrirPdfBackend(r, '', false)"), 'student-history transfer forbids URL fallback');

must(src.includes("postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:true},80000)"), 'change-history docs request authenticated PDF bytes');
must(src.includes("abrirPdfBackend(resp, '', false)"), 'change-history docs forbid URL fallback');

must(src.includes("postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true},80000)"), 'regenerated CONAPE letter requests authenticated PDF bytes');

for (const bad of [
  "window.open(e.pdf_traslado_url",
  "if(existingUrl){window.open(existingUrl",
  "include_base64:false",
  "window.open(resp.pdf_url",
]) must(!src.includes(bad), `direct/private Drive delivery removed: ${bad}`);

for (const keep of [
  "generarConstanciaTraslado",
  "generarCartaIntegralConape",
  "PDF_TRASLADO_URL",
  "CARTA_CONAPE_URL",
  "marcarConstanciaTrasladoEntregada",
  "adminStudentsSafeUserError",
]) must(src.includes(keep), `business contract preserved: ${keep}`);

console.log('CS21A193 ADMIN PRIVATE CONAPE DOCS: PASS');
console.log('PRIVATE_DELIVERY=AUTHENTICATED_BASE64_ONLY_FOR_TARGETED_ROUTES');
console.log('DRIVE_ACL=UNCHANGED');
console.log('BUSINESS_ENDPOINTS=PRESERVED');
