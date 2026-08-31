import fs from 'node:fs';

const path = 'src/admin_students.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceOne(before, after, label) {
  const count = src.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: expected exactly 1 preimage, found ${count}`);
  }
  src = src.replace(before, after);
  console.log(`${label}: replaced 1`);
}

replaceOne(
`function abrirPdfBackend(payload, fallbackUrl = '') {
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
}`,
`function abrirPdfBackend(payload) {
  try {
    const b64 = String(payload?.pdf_base64 || '').replace(/\\s+/g, '');
    if (!b64) return false;
    const mime = String(payload?.pdf_mime || 'application/pdf').toLowerCase();
    if (mime !== 'application/pdf') throw new Error('Tipo de documento inválido.');
    if (b64.length > 21 * 1024 * 1024) throw new Error('Documento demasiado grande.');
    const bin = atob(b64);
    if (bin.length < 5 || bin.slice(0, 4) !== '%PDF') throw new Error('Firma PDF inválida.');
    if (bin.length > 15 * 1024 * 1024) throw new Error('Documento demasiado grande.');
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type:'application/pdf' }));
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) { URL.revokeObjectURL(url); return false; }
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    return true;
  } catch (e) {
    console.warn('[AdminStudents] PDF privado rechazado antes de abrir.', e);
    return false;
  }
}`,
'private PDF helper'
);

replaceOne(
`                  if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url, '_blank', 'noopener,noreferrer'); return; }
                  setPdfTrasladoBusy(id);`,
`                  setPdfTrasladoBusy(id);`,
'direct transfer URL open'
);

replaceOne(
`                    const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey }, 70000);`,
`                    const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000);`,
'transfer private bytes request'
);

replaceOne(
`                    if (!abrirPdfBackend(r, r.pdf_url)) alert('La constancia se generó, pero el navegador bloqueó la apertura. Puede abrirla desde el historial.');`,
`                    if (!abrirPdfBackend(r)) alert('No pudimos abrir la constancia de forma segura. Intentá de nuevo.');`,
'transfer fail-closed open'
);

replaceOne(
`    const existingUrl=simple?r.PDF_TRASLADO_URL:r.CARTA_CONAPE_URL;
    if(existingUrl){window.open(existingUrl,'_blank','noopener,noreferrer');return;}
    const key=\`${'${r.CAMBIO_ID}'}-${'${simple?\'T\':\'C\'}'}\`;setDocBusy(key);`,
`    const key=\`${'${r.CAMBIO_ID}'}-${'${simple?\'T\':\'C\'}'}\`;setDocBusy(key);`,
'history direct URL open'
);

replaceOne(
`      const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:false},80000);`,
`      const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:true},80000);`,
'history private bytes request'
);

replaceOne(
`      if(!abrirPdfBackend(resp,resp.pdf_url))alert('El documento se generó, pero el navegador bloqueó la apertura.');`,
`      if(!abrirPdfBackend(resp))alert('No pudimos abrir el documento de forma segura. Intentá de nuevo.');`,
'history fail-closed open'
);

replaceOne(
`      const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:false},80000);`,
`      const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true},80000);`,
'regenerated letter private bytes request'
);

replaceOne(
`      if(resp?.pdf_url)window.open(resp.pdf_url,'_blank','noopener,noreferrer');`,
`      if(!abrirPdfBackend(resp))alert('La carta se actualizó, pero no pudimos abrir el PDF de forma segura. Intentá de nuevo.');`,
'regenerated letter fail-closed open'
);

fs.writeFileSync(path, src, 'utf8');
console.log('CS21A193 exact private academic PDF patch applied');
