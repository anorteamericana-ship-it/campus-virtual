import fs from 'node:fs';

const path = 'src/admin_students.jsx';
let src = fs.readFileSync(path, 'utf8');

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}
function replaceOnce(oldText, newText, label) {
  const n = count(src, oldText);
  if (n !== 1) throw new Error(`${label}: expected 1 exact preimage, found ${n}`);
  src = src.replace(oldText, newText);
  console.log(`${label}: replaced 1`);
}
function replaceExactCount(oldText, newText, expected, label) {
  const n = count(src, oldText);
  if (n !== expected) throw new Error(`${label}: expected ${expected} exact preimages, found ${n}`);
  src = src.split(oldText).join(newText);
  console.log(`${label}: replaced ${n}`);
}

replaceOnce(
`  return false;\n}\n\nasync function resincronizarEstudianteIndividual(codigo) {`,
`  return false;\n}\n\nfunction abrirPdfPrivadoBackend(payload) {\n  try {\n    const b64 = String(payload?.pdf_base64 || '').trim();\n    const mime = String(payload?.pdf_mime || 'application/pdf').trim().toLowerCase();\n    if (!b64 || mime !== 'application/pdf') {\n      console.warn('[AdminStudents] Documento privado sin payload PDF válido.');\n      return false;\n    }\n    const header = atob(b64).slice(0, 5);\n    if (!header.startsWith('%PDF')) {\n      console.warn('[AdminStudents] Documento privado rechazado por firma PDF inválida.');\n      return false;\n    }\n    return abrirPdfBackend({ pdf_base64: b64, pdf_mime: 'application/pdf' });\n  } catch (e) {\n    console.warn('[AdminStudents] No se pudo preparar el PDF privado.', e);\n    return false;\n  }\n}\n\nasync function resincronizarEstudianteIndividual(codigo) {`,
'insert private PDF opener'
);

replaceOnce(
`                  if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url, '_blank', 'noopener,noreferrer'); return; }\n`,
``,
'remove direct transfer URL open'
);

replaceOnce(
`                    const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey }, 70000);`,
`                    const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000);`,
'request private transfer payload'
);

replaceOnce(
`                    if (!abrirPdfBackend(r, r.pdf_url)) alert('La constancia se generó, pero el navegador bloqueó la apertura. Puede abrirla desde el historial.');`,
`                    if (!abrirPdfPrivadoBackend(r)) alert('No pudimos abrir la constancia de forma segura. Reintentá en unos segundos.');`,
'open transfer private payload'
);

replaceOnce(
`    const existingUrl=simple?r.PDF_TRASLADO_URL:r.CARTA_CONAPE_URL;\n    if(existingUrl){window.open(existingUrl,'_blank','noopener,noreferrer');return;}\n`,
``,
'remove direct historical document URL open'
);

replaceExactCount(
`include_base64:false`,
`include_base64:true`,
2,
'enable base64 for academic documents'
);

replaceOnce(
`      if(!abrirPdfBackend(resp,resp.pdf_url))alert('El documento se generó, pero el navegador bloqueó la apertura.');`,
`      if(!abrirPdfPrivadoBackend(resp))alert('No pudimos abrir el documento de forma segura. Reintentá en unos segundos.');`,
'open historical document private payload'
);

replaceOnce(
`      if(resp?.pdf_url)window.open(resp.pdf_url,'_blank','noopener,noreferrer');`,
`      if(!abrirPdfPrivadoBackend(resp))alert('La carta se regeneró, pero no pudimos abrirla de forma segura. Reintentá desde el historial.');`,
'open regenerated CONAPE letter private payload'
);

fs.writeFileSync(path, src, 'utf8');
console.log('CS21A193 exact private academic document patch applied');
