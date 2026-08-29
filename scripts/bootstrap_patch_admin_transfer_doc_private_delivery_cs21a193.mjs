import fs from 'node:fs';

const path='src/admin_students.jsx';
let s=fs.readFileSync(path,'utf8');
function one(label,oldText,newText){const n=s.split(oldText).length-1;if(n!==1)throw new Error(`${label}: expected 1 exact preimage, found ${n}`);s=s.replace(oldText,newText);}

one('private helper signature',"function abrirPdfBackend(payload, fallbackUrl = '') {","function abrirPdfBackend(payload) {");
one('remove helper URL fallback',"    const url = payload?.pdf_url || fallbackUrl;\n    if (url) { window.open(url, '_blank', 'noopener,noreferrer'); return true; }\n","");
one('remove inline direct transfer URL',"                  if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url, '_blank', 'noopener,noreferrer'); return; }\n                  setPdfTrasladoBusy(id);","                  setPdfTrasladoBusy(id);");
one('inline request bytes',"postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey }, 70000)","postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000)");
one('inline private open',"if (!abrirPdfBackend(r, r.pdf_url)) alert('La constancia se generó, pero el navegador bloqueó la apertura. Puede abrirla desde el historial.');","if (!abrirPdfBackend(r)) alert('La constancia está disponible, pero no se pudo abrir de forma segura. Intentá de nuevo.');");
one('remove history stored URL open',"    const existingUrl=simple?r.PDF_TRASLADO_URL:r.CARTA_CONAPE_URL;\n    if(existingUrl){window.open(existingUrl,'_blank','noopener,noreferrer');return;}\n    const key=`${r.CAMBIO_ID}-${simple?'T':'C'}`;setDocBusy(key);","    const key=`${r.CAMBIO_ID}-${simple?'T':'C'}`;setDocBusy(key);");
one('history request bytes',"postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:false},80000)","postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:true},80000)");
one('history private open',"if(!abrirPdfBackend(resp,resp.pdf_url))alert('El documento se generó, pero el navegador bloqueó la apertura.');","if(!abrirPdfBackend(resp))alert('El documento está disponible, pero no se pudo abrir de forma segura. Intentá de nuevo.');");
one('regen request bytes',"postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:false},80000)","postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true},80000)");
one('regen private open',"      if(resp?.pdf_url)window.open(resp.pdf_url,'_blank','noopener,noreferrer');","      if(!abrirPdfBackend(resp))alert('La carta se regeneró, pero no se pudo abrir de forma segura. Intentá de nuevo.');");

fs.writeFileSync(path,s,'utf8');
console.log('CS21A193 exact private-delivery patch applied');
