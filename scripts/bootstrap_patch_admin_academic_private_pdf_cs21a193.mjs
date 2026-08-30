import fs from 'node:fs';

const path = 'src/admin_students.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceOnce(label, from, to) {
  const count = src.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly 1 preimage, found ${count}`);
  src = src.replace(from, to);
  console.log(`${label}: replaced 1`);
}

replaceOnce('private helper', `function abrirPdfBackend(payload, fallbackUrl = '') {
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
`, `function abrirPdfBackend(payload, fallbackUrl = '') {
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

function abrirPdfPrivadoBackend(payload) {
  try {
    const base64 = String(payload?.pdf_base64 || '').trim();
    const mime = String(payload?.pdf_mime || 'application/pdf').trim().toLowerCase();
    if (!base64 || mime !== 'application/pdf') return false;
    const bin = atob(base64);
    if (bin.slice(0,5) !== '%PDF-') return false;
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type:'application/pdf' }));
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) { URL.revokeObjectURL(url); return false; }
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    return true;
  } catch (e) {
    console.warn('[AdminStudents] No se pudo abrir el PDF privado.', e);
    return false;
  }
}
`);

replaceOnce('transfer quick-open', `                const abrirPdfTraslado = async () => {
                  const id = e.cambio_id || \`${'${codigo}-${nivelKey}'}\`;
                  if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url, '_blank', 'noopener,noreferrer'); return; }
                  setPdfTrasladoBusy(id);
                  try {
                    const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey }, 70000);
                    if (!r?.ok) throw new Error(r?.error || 'No se pudo generar la constancia.');
                    if (!abrirPdfBackend(r, r.pdf_url)) alert('La constancia se generó, pero el navegador bloqueó la apertura. Puede abrirla desde el historial.');
                    onRefresh?.();
                  } catch (err) { alert(adminStudentsSafeUserError(err?.message || String(err), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion')); }
                  finally { setPdfTrasladoBusy(''); }
`, `                const abrirPdfTraslado = async () => {
                  const id = e.cambio_id || \`${'${codigo}-${nivelKey}'}\`;
                  setPdfTrasladoBusy(id);
                  try {
                    const r = await postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000);
                    if (!r?.ok) throw new Error(r?.error || 'No se pudo preparar la constancia.');
                    if (!abrirPdfPrivadoBackend(r)) alert('No se pudo abrir la constancia de forma segura. Intentá de nuevo.');
                    onRefresh?.();
                  } catch (err) { alert(adminStudentsSafeUserError(err?.message || String(err), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion')); }
                  finally { setPdfTrasladoBusy(''); }
`);

replaceOnce('history open private', `  async function abrirDocumento(r){
    const simple=String(r.TIPO_OPERACION||'').toUpperCase()==='TRASLADO_SIMPLE';
    const existingUrl=simple?r.PDF_TRASLADO_URL:r.CARTA_CONAPE_URL;
    if(existingUrl){window.open(existingUrl,'_blank','noopener,noreferrer');return;}
    const key=\`${'${r.CAMBIO_ID}-${simple?\'T\':\'C\'}'}\`;setDocBusy(key);
    try{
      const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:false},80000);
      if(!resp?.ok)throw new Error(resp?.error||'No se pudo generar el documento.');
      if(!abrirPdfBackend(resp,resp.pdf_url))alert('El documento se generó, pero el navegador bloqueó la apertura.');
      cargar();
    }catch(e){alert(adminStudentsSafeUserError(e?.message||String(e), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion'));}finally{setDocBusy('');}
  }
`, `  async function abrirDocumento(r){
    const simple=String(r.TIPO_OPERACION||'').toUpperCase()==='TRASLADO_SIMPLE';
    const key=\`${'${r.CAMBIO_ID}-${simple?\'T\':\'C\'}'}\`;setDocBusy(key);
    try{
      const resp=await postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:true},80000);
      if(!resp?.ok)throw new Error(resp?.error||'No se pudo preparar el documento.');
      if(!abrirPdfPrivadoBackend(resp))alert('No se pudo abrir el documento de forma segura. Intentá de nuevo.');
      cargar();
    }catch(e){alert(adminStudentsSafeUserError(e?.message||String(e), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion'));}finally{setDocBusy('');}
  }
`);

replaceOnce('regenerate private request', `      const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:false},80000);`, `      const resp=await postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true},80000);`);
replaceOnce('regenerate private open', `      if(resp?.pdf_url)window.open(resp.pdf_url,'_blank','noopener,noreferrer');`, `      if(!abrirPdfPrivadoBackend(resp))alert('La carta se recalculó, pero no se pudo abrir de forma segura. Intentá de nuevo.');`);

fs.writeFileSync(path, src);
console.log('CS21A193 exact private academic PDF patch applied');
