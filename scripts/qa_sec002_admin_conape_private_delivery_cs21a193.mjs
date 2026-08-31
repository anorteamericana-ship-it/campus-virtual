import fs from 'node:fs';

const src = fs.readFileSync('src/admin_students.jsx', 'utf8');

function must(ok, label) {
  if (!ok) throw new Error(`CS21A193 FAIL: ${label}`);
}

must(src.includes('function adminStudentsSafeUserError('), 'CS21A191 safe-error boundary preserved');
must(src.includes('Bitácora oficial conectada'), 'CS21A192 operational copy preserved');

must(
  src.includes("postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000)"),
  'student-history transfer document requests authenticated base64 delivery'
);
must(
  src.includes("postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:true},80000)"),
  'change-history document requests authenticated base64 delivery'
);
must(
  src.includes("postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true},80000)"),
  'regenerated CONAPE letter requests authenticated base64 delivery'
);

const strictOpenCount = (src.match(/abrirPdfBackend\(\{\s*pdf_base64:/g) || []).length;
must(strictOpenCount >= 3, 'three guarded document openings use base64-only payloads');

const forbidden = [
  "if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url, '_blank', 'noopener,noreferrer'); return; }",
  'const existingUrl=simple?r.PDF_TRASLADO_URL:r.CARTA_CONAPE_URL;',
  "if(existingUrl){window.open(existingUrl,'_blank','noopener,noreferrer');return;}",
  'include_base64:false',
  'abrirPdfBackend(r, r.pdf_url)',
  'abrirPdfBackend(resp,resp.pdf_url)',
  "if(resp?.pdf_url)window.open(resp.pdf_url,'_blank','noopener,noreferrer');",
];
for (const pattern of forbidden) {
  must(!src.includes(pattern), `direct/private-URL fallback removed: ${pattern}`);
}

must(src.includes("r.PDF_TRASLADO_URL?'📄 Abrir traslado':'📄 Generar traslado'"), 'existing-document UI state remains available');
must(src.includes("r.CARTA_CONAPE_URL?'📄 Abrir carta CONAPE':'📄 Carta CONAPE'"), 'existing-letter UI state remains available');
must(src.includes("marcarConstanciaTrasladoEntregada"), 'delivery state operation preserved');

console.log('CS21A193 SEC002 ADMIN CONAPE PRIVATE DELIVERY: PASS');
console.log(`STRICT_BASE64_OPENINGS=${strictOpenCount}`);
console.log('DIRECT_DRIVE_OPENINGS_IN_GUARDED_PATHS=NO');
console.log('DRIVE_ACL_CHANGE=NO');
console.log('RUNTIME_E2=REQUIRED_BEFORE_RELEASE');
