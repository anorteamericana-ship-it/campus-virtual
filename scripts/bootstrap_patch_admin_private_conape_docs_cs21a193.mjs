import fs from 'node:fs';

const path = 'src/admin_students.jsx';
let s = fs.readFileSync(path, 'utf8');

function one(label, oldText, newText) {
  const n = s.split(oldText).length - 1;
  if (n !== 1) throw new Error(`${label}: expected 1 exact preimage, found ${n}`);
  s = s.replace(oldText, newText);
}

one(
  'explicit PDF URL fallback policy',
  "function abrirPdfBackend(payload, fallbackUrl = '') {",
  "function abrirPdfBackend(payload, fallbackUrl = '', allowUrlFallback = true) {"
);
one(
  'fail closed before URL fallback',
  "    const url = payload?.pdf_url || fallbackUrl;\n    if (url) { window.open(url, '_blank', 'noopener,noreferrer'); return true; }",
  "    if (!allowUrlFallback) return false;\n    const url = payload?.pdf_url || fallbackUrl;\n    if (url) { window.open(url, '_blank', 'noopener,noreferrer'); return true; }"
);

one(
  'remove direct transfer Drive open',
  "                  if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url, '_blank', 'noopener,noreferrer'); return; }\n                  setPdfTrasladoBusy(id);",
  "                  setPdfTrasladoBusy(id);"
);
one(
  'request transfer bytes from authenticated backend',
  "const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey }, 70000);",
  "const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000);"
);
one(
  'transfer opens bytes only',
  "if (!abrirPdfBackend(r, r.pdf_url)) alert('La constancia se generó, pero el navegador bloqueó la apertura. Puede abrirla desde el historial.');",
  "if (!abrirPdfBackend(r, '', false)) alert('No pudimos abrir la constancia. Intentá de nuevo.');"
);

one(
  'remove direct history Drive open',
  "    const existingUrl=simple?r.PDF_TRASLADO_URL:r.CARTA_CONAPE_URL;\n    if(existingUrl){window.open(existingUrl,'_blank','noopener,noreferrer');return;}\n    const key=`${r.CAMBIO_ID}-${simple?'T':'C'}`;setDocBusy(key);",
  "    const key=`${r.CAMBIO_ID}-${simple?'T':'C'}`;setDocBusy(key);"
);
one(
  'history requests private bytes',
  "const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:false},80000);",
  "const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:true},80000);"
);
one(
  'history opens bytes only',
  "if(!abrirPdfBackend(resp,resp.pdf_url))alert('El documento se generó, pero el navegador bloqueó la apertura.');",
  "if(!abrirPdfBackend(resp, '', false))alert('No pudimos abrir el documento. Intentá de nuevo.');"
);
one(
  'regenerated letter requests private bytes',
  "const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:false},80000);",
  "const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true},80000);"
);
one(
  'regenerated letter opens bytes only',
  "      if(resp?.pdf_url)window.open(resp.pdf_url,'_blank','noopener,noreferrer');",
  "      if(!abrirPdfBackend(resp, '', false))alert('La carta se actualizó, pero no pudimos abrir el PDF. Intentá de nuevo.');"
);

fs.writeFileSync(path, s, 'utf8');
console.log('CS21A193 exact private CONAPE document patch applied');
