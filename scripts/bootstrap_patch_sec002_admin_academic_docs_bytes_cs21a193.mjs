import fs from 'node:fs';

const path = 'src/admin_students.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceOnce(label, before, after) {
  const first = src.indexOf(before);
  if (first < 0) throw new Error(`${label}: preimage not found`);
  if (src.indexOf(before, first + before.length) >= 0) throw new Error(`${label}: preimage is not unique`);
  src = src.slice(0, first) + after + src.slice(first + before.length);
  console.log(`${label}: replaced 1`);
}

replaceOnce(
  'transfer existing-url short circuit',
  "                  if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url, '_blank', 'noopener,noreferrer'); return; }\n                  setPdfTrasladoBusy(id);",
  "                  setPdfTrasladoBusy(id);"
);

replaceOnce(
  'transfer request bytes',
  "const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey }, 70000);",
  "const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000);"
);

replaceOnce(
  'transfer byte-first opener',
  "if (!abrirPdfBackend(r, r.pdf_url)) alert('La constancia se generó, pero el navegador bloqueó la apertura. Puede abrirla desde el historial.');",
  "if (!abrirPdfBackend(r, e.pdf_traslado_url || r.pdf_url)) alert('La constancia está disponible, pero el navegador bloqueó la apertura. Puede abrirla desde el historial.');"
);

replaceOnce(
  'history existing-url short circuit',
  "    if(existingUrl){window.open(existingUrl,'_blank','noopener,noreferrer');return;}\n    const key=`${r.CAMBIO_ID}-${simple?'T':'C'}`;setDocBusy(key);",
  "    const key=`${r.CAMBIO_ID}-${simple?'T':'C'}`;setDocBusy(key);"
);

replaceOnce(
  'history request bytes',
  "const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:false},80000);",
  "const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:true},80000);"
);

replaceOnce(
  'history byte-first opener',
  "if(!abrirPdfBackend(resp,resp.pdf_url))alert('El documento se generó, pero el navegador bloqueó la apertura.');",
  "if(!abrirPdfBackend(resp,existingUrl||resp.pdf_url))alert('El documento está disponible, pero el navegador bloqueó la apertura.');"
);

replaceOnce(
  'CONAPE regeneration request bytes',
  "const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:false},80000);",
  "const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true},80000);"
);

replaceOnce(
  'CONAPE regeneration byte-first opener',
  "      if(resp?.pdf_url)window.open(resp.pdf_url,'_blank','noopener,noreferrer');",
  "      if(!abrirPdfBackend(resp,resp.pdf_url))alert('La carta está disponible, pero el navegador bloqueó la apertura.');"
);

fs.writeFileSync(path, src, 'utf8');
console.log('CS21A193 exact byte-first patch applied');
