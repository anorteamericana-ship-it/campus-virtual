import fs from 'node:fs';

const path = 'src/admin_students.jsx';
let s = fs.readFileSync(path, 'utf8');

function one(label, oldText, newText) {
  const n = s.split(oldText).length - 1;
  if (n !== 1) throw new Error(`${label}: expected 1 exact preimage, found ${n}`);
  s = s.replace(oldText, newText);
  console.log(`${label}: replaced 1`);
}

one(
  'student history removes direct Drive open',
  "                  if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url, '_blank', 'noopener,noreferrer'); return; }\n                  setPdfTrasladoBusy(id);",
  "                  setPdfTrasladoBusy(id);"
);

one(
  'student history requests base64',
  "const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey }, 70000);",
  "const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000);"
);

one(
  'student history opens strict private blob',
  "if (!abrirPdfBackend(r, r.pdf_url)) alert('La constancia se generó, pero el navegador bloqueó la apertura. Puede abrirla desde el historial.');",
  "if (!abrirPdfBackend({ pdf_base64:r?.pdf_base64, pdf_mime:r?.pdf_mime })) alert('No se pudo abrir la constancia de forma segura. Intentá de nuevo.');"
);

one(
  'change history removes direct existing URL open',
  "    const simple=String(r.TIPO_OPERACION||'').toUpperCase()==='TRASLADO_SIMPLE';\n    const existingUrl=simple?r.PDF_TRASLADO_URL:r.CARTA_CONAPE_URL;\n    if(existingUrl){window.open(existingUrl,'_blank','noopener,noreferrer');return;}\n    const key=`${r.CAMBIO_ID}-${simple?'T':'C'}`;setDocBusy(key);",
  "    const simple=String(r.TIPO_OPERACION||'').toUpperCase()==='TRASLADO_SIMPLE';\n    const key=`${r.CAMBIO_ID}-${simple?'T':'C'}`;setDocBusy(key);"
);

one(
  'change history requests base64',
  "const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:false},80000);",
  "const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:true},80000);"
);

one(
  'change history opens strict private blob',
  "if(!abrirPdfBackend(resp,resp.pdf_url))alert('El documento se generó, pero el navegador bloqueó la apertura.');",
  "if(!abrirPdfBackend({ pdf_base64:resp?.pdf_base64, pdf_mime:resp?.pdf_mime }))alert('No se pudo abrir el documento de forma segura. Intentá de nuevo.');"
);

one(
  'regenerated letter requests base64',
  "const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:false},80000);",
  "const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true},80000);"
);

one(
  'regenerated letter opens strict private blob',
  "if(resp?.pdf_url)window.open(resp.pdf_url,'_blank','noopener,noreferrer');",
  "if(!abrirPdfBackend({ pdf_base64:resp?.pdf_base64, pdf_mime:resp?.pdf_mime }))alert('La carta se regeneró, pero no se pudo abrir de forma segura. Intentá abrirla nuevamente desde el historial.');"
);

fs.writeFileSync(path, s, 'utf8');
console.log('CS21A193 exact private CONAPE document delivery patch applied');
