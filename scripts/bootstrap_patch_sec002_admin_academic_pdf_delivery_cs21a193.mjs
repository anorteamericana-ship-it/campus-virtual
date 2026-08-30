import fs from 'node:fs';

const path = 'src/admin_students.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceExact(label, from, to) {
  const first = src.indexOf(from);
  const last = src.lastIndexOf(from);
  if (first < 0) throw new Error(`CS21A193 patch: missing preimage: ${label}`);
  if (first !== last) throw new Error(`CS21A193 patch: non-unique preimage: ${label}`);
  src = src.slice(0, first) + to + src.slice(first + from.length);
  console.log(`${label}: replaced 1`);
}

replaceExact(
  'insert strict private PDF helper',
  '\nasync function resincronizarEstudianteIndividual(codigo) {',
  `\nfunction abrirPdfPrivadoAdmin(payload) {\n  try {\n    const encoded = String(payload?.pdf_base64 || '').replace(/\\s+/g, '');\n    if (!encoded) return false;\n    const mime = String(payload?.pdf_mime || 'application/pdf').trim().toLowerCase();\n    if (mime !== 'application/pdf') {\n      console.warn('[AdminStudents] PDF privado rechazado por MIME.', { mime });\n      return false;\n    }\n    const maxBytes = 12 * 1024 * 1024;\n    if (encoded.length > Math.ceil(maxBytes * 4 / 3) + 8) {\n      console.warn('[AdminStudents] PDF privado rechazado por tamaño base64.');\n      return false;\n    }\n    const bin = atob(encoded);\n    if (bin.length > maxBytes || bin.slice(0, 5) !== '%PDF-') {\n      console.warn('[AdminStudents] PDF privado rechazado por integridad/tamaño.');\n      return false;\n    }\n    const bytes = new Uint8Array(bin.length);\n    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);\n    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));\n    window.open(url, '_blank', 'noopener,noreferrer');\n    setTimeout(() => URL.revokeObjectURL(url), 120000);\n    return true;\n  } catch (e) {\n    console.warn('[AdminStudents] No se pudo abrir el PDF privado.', e);\n    return false;\n  }\n}\n\nasync function resincronizarEstudianteIndividual(codigo) {`
);

replaceExact(
  'remove direct transfer URL open',
  "                  if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url, '_blank', 'noopener,noreferrer'); return; }\n",
  ''
);
replaceExact(
  'request transfer base64 from student row',
  "const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey }, 70000);",
  "const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000);"
);
replaceExact(
  'open student-row transfer strictly',
  "if (!abrirPdfBackend(r, r.pdf_url)) alert('La constancia se generó, pero el navegador bloqueó la apertura. Puede abrirla desde el historial.');",
  "if (!abrirPdfPrivadoAdmin(r)) alert('No se pudo abrir la constancia. Reintentá desde el historial.');"
);

replaceExact(
  'remove history direct URL shortcut',
  "    const existingUrl=simple?r.PDF_TRASLADO_URL:r.CARTA_CONAPE_URL;\n    if(existingUrl){window.open(existingUrl,'_blank','noopener,noreferrer');return;}\n",
  ''
);
replaceExact(
  'request history document base64',
  "const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:false},80000);",
  "const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:true},80000);"
);
replaceExact(
  'open history document strictly',
  "if(!abrirPdfBackend(resp,resp.pdf_url))alert('El documento se generó, pero el navegador bloqueó la apertura.');",
  "if(!abrirPdfPrivadoAdmin(resp))alert('No se pudo abrir el documento. Reintentá la operación.');"
);
replaceExact(
  'request regenerated CONAPE base64',
  "const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:false},80000);",
  "const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true},80000);"
);
replaceExact(
  'open regenerated CONAPE strictly',
  "      if(resp?.pdf_url)window.open(resp.pdf_url,'_blank','noopener,noreferrer');",
  "      if(!abrirPdfPrivadoAdmin(resp))alert('La carta se actualizó, pero no se pudo abrir el PDF. Reintentá desde el historial.');"
);

if (src.includes("window.open(e.pdf_traslado_url, '_blank', 'noopener,noreferrer')")) throw new Error('CS21A193 patch: direct transfer URL open remains');
if (src.includes("if(existingUrl){window.open(existingUrl,'_blank','noopener,noreferrer');return;}")) throw new Error('CS21A193 patch: history direct URL shortcut remains');
if (src.includes("if(resp?.pdf_url)window.open(resp.pdf_url,'_blank','noopener,noreferrer');")) throw new Error('CS21A193 patch: regenerated CONAPE direct URL open remains');

fs.writeFileSync(path, src);
console.log('CS21A193 exact private admin academic PDF patch applied');
