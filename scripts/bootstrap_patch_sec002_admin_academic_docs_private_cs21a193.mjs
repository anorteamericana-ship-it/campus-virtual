import fs from 'node:fs';

const path = 'src/admin_students.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceOne(label, before, after) {
  const count = src.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly 1 preimage, found ${count}`);
  src = src.replace(before, after);
  console.log(`${label}: replaced 1`);
}

replaceOne(
  'private PDF helper option',
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
`function abrirPdfBackend(payload, fallbackUrl = '', options = {}) {
  const allowUrl = options?.allowUrl !== false;
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
    if (allowUrl) {
      const url = payload?.pdf_url || fallbackUrl;
      if (url) { window.open(url, '_blank', 'noopener,noreferrer'); return true; }
    }
  } catch (_) {}
  return false;
}`
);

replaceOne(
  'group transfer private open',
`                const abrirPdfTraslado = async () => {
                  const id = e.cambio_id || \`${'${codigo}'}-${'${nivelKey}'}\`;
                  if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url, '_blank', 'noopener,noreferrer'); return; }
                  setPdfTrasladoBusy(id);
                  try {
                    const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey }, 70000);
                    if (!r?.ok) throw new Error(r?.error || 'No se pudo generar la constancia.');
                    if (!abrirPdfBackend(r, r.pdf_url)) alert('La constancia se generó, pero el navegador bloqueó la apertura. Puede abrirla desde el historial.');`,
`                const abrirPdfTraslado = async () => {
                  const id = e.cambio_id || \`${'${codigo}'}-${'${nivelKey}'}\`;
                  setPdfTrasladoBusy(id);
                  try {
                    const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000);
                    if (!r?.ok) throw new Error(r?.error || 'No se pudo generar la constancia.');
                    if (!abrirPdfBackend(r,'',{allowUrl:false})) alert('No se pudo abrir la constancia de forma segura. Intentá de nuevo.');`
);

replaceOne(
  'history private open',
`  async function abrirDocumento(r){
    const simple=String(r.TIPO_OPERACION||'').toUpperCase()==='TRASLADO_SIMPLE';
    const existingUrl=simple?r.PDF_TRASLADO_URL:r.CARTA_CONAPE_URL;
    if(existingUrl){window.open(existingUrl,'_blank','noopener,noreferrer');return;}
    const key=\`${'${r.CAMBIO_ID}'}-${'${simple?\'T\':\'C\'}'}\`;setDocBusy(key);
    try{
      const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:false},80000);
      if(!resp?.ok)throw new Error(resp?.error||'No se pudo generar el documento.');
      if(!abrirPdfBackend(resp,resp.pdf_url))alert('El documento se generó, pero el navegador bloqueó la apertura.');`,
`  async function abrirDocumento(r){
    const simple=String(r.TIPO_OPERACION||'').toUpperCase()==='TRASLADO_SIMPLE';
    const key=\`${'${r.CAMBIO_ID}'}-${'${simple?\'T\':\'C\'}'}\`;setDocBusy(key);
    try{
      const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:true},80000);
      if(!resp?.ok)throw new Error(resp?.error||'No se pudo generar el documento.');
      if(!abrirPdfBackend(resp,'',{allowUrl:false}))alert('No se pudo abrir el documento de forma segura. Intentá de nuevo.');`
);

replaceOne(
  'regenerated letter requests private bytes',
`      const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:false},80000);`,
`      const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true},80000);`
);

replaceOne(
  'regenerated letter private open',
`      if(resp?.pdf_url)window.open(resp.pdf_url,'_blank','noopener,noreferrer');`,
`      if(!abrirPdfBackend(resp,'',{allowUrl:false}))alert('La carta se procesó, pero no pudimos abrir el PDF de forma segura. Intentá de nuevo.');`
);

fs.writeFileSync(path, src);
console.log('CS21A193 exact private academic-document patch applied');
