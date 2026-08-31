import fs from 'node:fs';

const path = 'src/admin_students.jsx';
let s = fs.readFileSync(path, 'utf8');

function replaceOnce(oldText, newText, label) {
  const count = s.split(oldText).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly 1 preimage, got ${count}`);
  s = s.replace(oldText, newText);
  console.log(`${label}: replaced 1`);
}

function replaceCount(oldText, newText, expected, label) {
  const count = s.split(oldText).length - 1;
  if (count !== expected) throw new Error(`${label}: expected ${expected} preimages, got ${count}`);
  s = s.split(oldText).join(newText);
  console.log(`${label}: replaced ${count}`);
}

const pdfHelper = `function abrirPdfBackend(payload, fallbackUrl = '') {
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

const pdfHelperNew = `${pdfHelper}
function abrirPdfPrivadoPreferente(payload, fallbackUrl = '', context = '') {
  if (payload?.pdf_base64) {
    const opened = abrirPdfBackend({ pdf_base64: payload.pdf_base64, pdf_mime: payload.pdf_mime || 'application/pdf' }, '');
    if (opened) return true;
  }
  const url = payload?.pdf_url || fallbackUrl;
  if (url) {
    console.warn('[AdminStudents] Entrega privada de PDF no disponible; se usa fallback temporal a URL.', { context });
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  return false;
}
`;
replaceOnce(pdfHelper, pdfHelperNew, 'private preferred helper');

replaceOnce(
  "                  if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url, '_blank', 'noopener,noreferrer'); return; }\n                  setPdfTrasladoBusy(id);",
  "                  setPdfTrasladoBusy(id);",
  'remove direct traslado row URL open'
);

replaceOnce(
  "const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey }, 70000);",
  "const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000);",
  'request traslado private bytes'
);

replaceOnce(
  "if (!abrirPdfBackend(r, r.pdf_url)) alert('La constancia se generó, pero el navegador bloqueó la apertura. Puede abrirla desde el historial.');",
  "if (!abrirPdfPrivadoPreferente(r, r?.pdf_url || e.pdf_traslado_url, 'traslado_panel')) alert('No pudimos abrir la constancia. Intentá nuevamente desde el historial.');",
  'open traslado private-first'
);

replaceOnce(
  "    const existingUrl=simple?r.PDF_TRASLADO_URL:r.CARTA_CONAPE_URL;\n    if(existingUrl){window.open(existingUrl,'_blank','noopener,noreferrer');return;}\n    const key=`${r.CAMBIO_ID}-${simple?'T':'C'}`;setDocBusy(key);",
  "    const existingUrl=simple?r.PDF_TRASLADO_URL:r.CARTA_CONAPE_URL;\n    const key=`${r.CAMBIO_ID}-${simple?'T':'C'}`;setDocBusy(key);",
  'remove direct history URL open'
);

replaceCount('include_base64:false', 'include_base64:true', 2, 'enable private bytes for history and regeneration');

replaceOnce(
  "if(!abrirPdfBackend(resp,resp.pdf_url))alert('El documento se generó, pero el navegador bloqueó la apertura.');",
  "if(!abrirPdfPrivadoPreferente(resp, existingUrl || resp?.pdf_url, 'historial_documento'))alert('No pudimos abrir el documento. Intentá nuevamente.');",
  'open history document private-first'
);

replaceOnce(
  "      if(resp?.pdf_url)window.open(resp.pdf_url,'_blank','noopener,noreferrer');",
  "      if(!abrirPdfPrivadoPreferente(resp, resp?.pdf_url, 'regenerar_carta_conape'))alert('La carta se regeneró, pero no pudimos abrirla. Intentá abrirla nuevamente desde el historial.');",
  'open regenerated carta private-first'
);

fs.writeFileSync(path, s, 'utf8');
console.log('CS21A193 exact private PDF transition patch applied');
