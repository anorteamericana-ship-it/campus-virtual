import fs from 'node:fs';

const path = 'src/admin_students.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceExact(oldText, newText, label) {
  const count = src.split(oldText).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly 1 preimage, found ${count}`);
  src = src.replace(oldText, newText);
  console.log(`${label}: replaced 1`);
}

const insertionMarker = `\nasync function resincronizarEstudianteIndividual(codigo) {`;
const privateHelper = `
function abrirPdfPrivadoAdmin(payload) {
  let objectUrl = '';
  try {
    const b64 = String(payload?.pdf_base64 || '').trim();
    if (!b64) return false;
    const mime = String(payload?.pdf_mime || 'application/pdf').trim().toLowerCase();
    if (mime !== 'application/pdf') throw new Error('mime_pdf_invalido');
    if (b64.length > 28000000) throw new Error('pdf_demasiado_grande');
    const bin = atob(b64);
    if (bin.length < 5 || bin.slice(0, 5) !== '%PDF-') throw new Error('firma_pdf_invalida');
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    objectUrl = URL.createObjectURL(new Blob([bytes], { type:'application/pdf' }));
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
    return true;
  } catch (e) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    console.warn('[AdminStudents] PDF privado rechazado.', { error: e?.message || String(e) });
    return false;
  }
}
`;
replaceExact(insertionMarker, `${privateHelper}${insertionMarker}`, 'insert private PDF helper');

replaceExact(
  `                  if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url, '_blank', 'noopener,noreferrer'); return; }`,
  `                  // CS21A193: incluso si ya existe, se recupera por la sesión autenticada del Campus.`,
  'remove direct transfer Drive open'
);
replaceExact(
  `                    const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey }, 70000);`,
  `                    const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000);`,
  'request transfer base64'
);
replaceExact(
  `                    if (!abrirPdfBackend(r, r.pdf_url)) alert('La constancia se generó, pero el navegador bloqueó la apertura. Puede abrirla desde el historial.');`,
  `                    if (!abrirPdfPrivadoAdmin(r)) alert('La constancia está disponible, pero no pudimos abrirla de forma segura. Intentá de nuevo.');`,
  'open transfer privately'
);

replaceExact(
  `    const existingUrl=simple?r.PDF_TRASLADO_URL:r.CARTA_CONAPE_URL;\n    if(existingUrl){window.open(existingUrl,'_blank','noopener,noreferrer');return;}\n`,
  ``,
  'remove history direct Drive open'
);
replaceExact(
  `      const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:false},80000);`,
  `      const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:true},80000);`,
  'request history base64'
);
replaceExact(
  `      if(!abrirPdfBackend(resp,resp.pdf_url))alert('El documento se generó, pero el navegador bloqueó la apertura.');`,
  `      if(!abrirPdfPrivadoAdmin(resp))alert('El documento está disponible, pero no pudimos abrirlo de forma segura. Intentá de nuevo.');`,
  'open history document privately'
);

replaceExact(
  `      const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:false},80000);`,
  `      const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true},80000);`,
  'request regenerated letter base64'
);
replaceExact(
  `      if(resp?.pdf_url)window.open(resp.pdf_url,'_blank','noopener,noreferrer');`,
  `      if(!abrirPdfPrivadoAdmin(resp))alert('La carta está disponible, pero no pudimos abrirla de forma segura. Intentá de nuevo.');`,
  'open regenerated letter privately'
);

fs.writeFileSync(path, src);
console.log('CS21A193 exact private admin PDF patch applied');
