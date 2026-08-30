import fs from 'node:fs';

const path = 'src/admin_students.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceOnce(before, after, label) {
  const count = src.split(before).length - 1;
  if (count !== 1) throw new Error(`CS21A193 exact preimage mismatch ${label}: ${count}`);
  src = src.replace(before, after);
  console.log(`${label}: replaced 1`);
}

const openerAnchor = `function abrirPdfBackend(payload, fallbackUrl = '') {
  try {
    if (payload?.pdf_base64) {
      const bin = atob(payload.pdf_base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: payload.pdf_mime || 'application/pdf' }));
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 120000);
      return true;
    }
    const url = payload?.pdf_url || fallbackUrl;
    if (url) { window.open(url, '_blank', 'noopener,noreferrer'); return true; }
  } catch (_) {}
  return false;
}
`;

const privateOpener = `${openerAnchor}
function abrirPdfPrivadoBackend(payload) {
  try {
    const b64 = String(payload?.pdf_base64 || '').trim();
    if (!b64) return false;
    const mime = String(payload?.pdf_mime || 'application/pdf').trim().toLowerCase();
    if (mime !== 'application/pdf') return false;
    const bin = atob(b64);
    if (!bin.startsWith('%PDF-')) return false;
    if (bin.length > 16 * 1024 * 1024) return false;
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    return true;
  } catch (e) {
    console.warn('[AdminStudents] No se pudo preparar el PDF privado.', e);
    return false;
  }
}
`;
replaceOnce(openerAnchor, privateOpener, 'private PDF opener');

replaceOnce(
  "                  if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url, '_blank', 'noopener,noreferrer'); return; }\n",
  '',
  'remove direct traslado URL short-circuit'
);
replaceOnce(
  "                    const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey }, 70000);",
  "                    const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000);",
  'request private traslado bytes'
);
replaceOnce(
  "                    if (!abrirPdfBackend(r, r.pdf_url)) alert('La constancia se generó, pero el navegador bloqueó la apertura. Puede abrirla desde el historial.');",
  "                    if (!abrirPdfPrivadoBackend(r)) alert('No fue posible abrir la constancia desde el Campus. Intentá de nuevo.');",
  'open traslado through private bytes'
);

replaceOnce(
  "    const existingUrl=simple?r.PDF_TRASLADO_URL:r.CARTA_CONAPE_URL;\n    if(existingUrl){window.open(existingUrl,'_blank','noopener,noreferrer');return;}\n",
  '',
  'remove history direct Drive URL short-circuit'
);
replaceOnce(
  "      const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:false},80000);",
  "      const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:true},80000);",
  'request history document private bytes'
);
replaceOnce(
  "      if(!abrirPdfBackend(resp,resp.pdf_url))alert('El documento se generó, pero el navegador bloqueó la apertura.');",
  "      if(!abrirPdfPrivadoBackend(resp))alert('No fue posible abrir el documento desde el Campus. Intentá de nuevo.');",
  'open history document through private bytes'
);

replaceOnce(
  "      const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:false},80000);",
  "      const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true},80000);",
  'request regenerated CONAPE private bytes'
);
replaceOnce(
  "      if(resp?.pdf_url)window.open(resp.pdf_url,'_blank','noopener,noreferrer');",
  "      if(!abrirPdfPrivadoBackend(resp))alert('La carta se actualizó, pero no fue posible abrirla desde el Campus. Intentá de nuevo.');",
  'open regenerated CONAPE through private bytes'
);

fs.writeFileSync(path, src);
console.log('CS21A193 exact private academic document patch applied');
