from pathlib import Path

# ── ventas_data.jsx ───────────────────────────────────────────────────────
p = Path('src/ventas_data.jsx')
s = p.read_text()
marker = """async function notificarMatriculaFirmadaVentasSeguro({ cedula, codigo, canal, file_id = '', email = '', preview_test = false }) {
  return postVentasData('notificarMatriculaFirmadaVentas', {
    cedula: cedula || '',
    codigo: codigo || '',
    canal: canal || '',
    file_id,
    email,
    preview_test,
  });
}
"""
insert = marker + r'''
async function descargarMatriculaFirmadaPrivadaVentasSeguro({ cedula, codigo, file_id = '', preview_test = false }) {
  const r = await postVentasData('descargarMatriculaFirmadaPrivada', {
    cedula: cedula || '',
    codigo: codigo || '',
    file_id,
    preview_test,
  });
  if (!r?.ok) return r || { ok:false, error:'respuesta_vacia' };
  if (String(r.mime_type || '').toLowerCase() !== 'application/pdf') return { ok:false, error:'matricula_firmada_mime_invalido' };
  const base64 = String(r.data_base64 || '').replace(/\s+/g, '');
  if (!base64) return { ok:false, error:'matricula_firmada_sin_contenido' };
  let binary;
  try { binary = window.atob(base64); }
  catch (_) { return { ok:false, error:'matricula_firmada_base64_invalido' }; }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const expectedSize = Number(r.size_bytes || 0);
  if (!bytes.length || bytes.length > 9 * 1024 * 1024 || (expectedSize > 0 && expectedSize !== bytes.length)) {
    return { ok:false, error:'matricula_firmada_incompleta_o_grande' };
  }
  const expectedHash = String(r.sha256 || '').trim().toLowerCase();
  if (expectedHash && window.crypto?.subtle) {
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    const digestHex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (digestHex !== expectedHash) return { ok:false, error:'integridad_matricula_firmada_invalida' };
  }
  return {
    ok:true,
    private_delivery:true,
    nombre:String(r.nombre || 'matricula_firmada.pdf'),
    mime_type:'application/pdf',
    size_bytes:bytes.length,
    blob:new Blob([bytes], { type:'application/pdf' }),
  };
}
'''
if s.count(marker) != 1:
    raise SystemExit(f'ventas_data signed notify marker expected 1 found {s.count(marker)}')
s = s.replace(marker, insert)
old = "generarDocumentoVentasSeguro, subirMatriculaFirmadaVentasSeguro, notificarMatriculaFirmadaVentasSeguro,"
new = "generarDocumentoVentasSeguro, subirMatriculaFirmadaVentasSeguro, notificarMatriculaFirmadaVentasSeguro, descargarMatriculaFirmadaPrivadaVentasSeguro,"
if s.count(old) != 1:
    raise SystemExit(f'ventas_data export marker expected 1 found {s.count(old)}')
s = s.replace(old, new)
p.write_text(s)

# ── ventas_drawer.jsx ─────────────────────────────────────────────────────
p = Path('src/ventas_drawer.jsx')
s = p.read_text()
old = """  const [signedDoc, setSignedDoc] = vUseState(null);
  const signedFileRef = React.useRef(null);"""
new = """  const [signedDoc, setSignedDoc] = vUseState(null);
  const [openingSigned, setOpeningSigned] = vUseState(false);
  const signedFileRef = React.useRef(null);"""
if s.count(old) != 1:
    raise SystemExit(f'ventas_drawer signed state expected 1 found {s.count(old)}')
s = s.replace(old, new)

marker = """  const notifySigned = async (canal) => {"""
handler = r'''  const openSignedPrivate = async () => {
    if (openingSigned || !(signedDoc && signedDoc.file_id)) return;
    if (demo) {
      onToast && onToast({ tipo:'ok', msg:'Vista previa: el documento firmado privado se abre únicamente contra backend QA real.' });
      return;
    }
    setOpeningSigned(true); setErr('');
    const preview = window.open('', '_blank');
    if (preview) {
      try {
        preview.opener = null;
        preview.document.title = 'Verificando matrícula firmada…';
        preview.document.body.innerHTML = '<p style="font-family:system-ui;padding:24px">Verificando matrícula firmada…</p>';
      } catch (_) {}
    }
    try {
      const r = await window.descargarMatriculaFirmadaPrivadaVentasSeguro({
        cedula: cedulaDoc,
        codigo,
        file_id: signedDoc.file_id,
        preview_test: previewMatriculaCR,
      });
      if (!r?.ok || !r.blob) throw new Error(r?.mensaje || r?.error || 'No se pudo abrir la matrícula firmada.');
      const objectUrl = URL.createObjectURL(r.blob);
      if (preview && !preview.closed) preview.location.replace(objectUrl);
      else {
        const a = document.createElement('a');
        a.href = objectUrl; a.download = r.nombre || 'matricula_firmada.pdf';
        document.body.appendChild(a); a.click(); a.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
    } catch (e) {
      try { if (preview && !preview.closed) preview.close(); } catch (_) {}
      const m = e?.message || 'No se pudo abrir la matrícula firmada.';
      setErr(m); onToast && onToast({ tipo:'err', msg:m });
    } finally { setOpeningSigned(false); }
  };

  const notifySigned = async (canal) => {'''
if s.count(marker) != 1:
    raise SystemExit(f'ventas_drawer notify marker expected 1 found {s.count(marker)}')
s = s.replace(marker, handler)

old = """    if (canal === 'whatsapp') {
      const url = signedDoc && signedDoc.url ? signedDoc.url : '';
      if (!url) { onToast && onToast({ tipo:'err', msg:'Primero subí el PDF firmado para obtener el enlace.' }); return; }
      if (!waNumDoc) { onToast && onToast({ tipo:'err', msg:'Este estudiante no tiene WhatsApp/teléfono registrado.' }); return; }
      const msg = `Hola, te compartimos tu documento de matrícula firmado de Academia Norteamericana: ${url}`;
      window.open(`https://wa.me/${waNumDoc}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
      return;
    }"""
new = """    if (canal === 'whatsapp') {
      if (!(signedDoc && signedDoc.file_id)) { onToast && onToast({ tipo:'err', msg:'Primero subí el PDF firmado al expediente.' }); return; }
      if (!waNumDoc) { onToast && onToast({ tipo:'err', msg:'Este estudiante no tiene WhatsApp/teléfono registrado.' }); return; }
      const msg = 'Hola. Tu documento de matrícula firmado de Academia Norteamericana ya está disponible de forma privada en el Campus Virtual, en Documentos y ayuda. También podemos enviártelo adjunto por correo.';
      window.open(`https://wa.me/${waNumDoc}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
      return;
    }"""
if s.count(old) != 1:
    raise SystemExit(f'ventas_drawer WhatsApp public link block expected 1 found {s.count(old)}')
s = s.replace(old, new)

old = """        {signedDoc && signedDoc.url ? (
          <a className="vx-btn vx-btn-ghost" href={signedDoc.url} target="_blank" rel="noopener" style={{ textDecoration:'none', justifyContent:'center' }}>
            <window.Vico d={window.VI.doc} size={14} /> Ver firmado
          </a>
        ) : null}"""
new = """        {signedDoc && signedDoc.file_id ? (
          <button type="button" className="vx-btn vx-btn-ghost" disabled={openingSigned} onClick={openSignedPrivate} style={{ justifyContent:'center' }}>
            {openingSigned ? <><span className="vx-spin dark" /> Verificando…</> : <><window.Vico d={window.VI.doc} size={14} /> Ver firmado</>}
          </button>
        ) : null}"""
if s.count(old) != 1:
    raise SystemExit(f'ventas_drawer signed public anchor expected 1 found {s.count(old)}')
s = s.replace(old, new)
old = """      {signedDoc && signedDoc.url ? ("""
new = """      {signedDoc && signedDoc.file_id ? ("""
if s.count(old) != 1:
    raise SystemExit(f'ventas_drawer signed action condition expected 1 found {s.count(old)}')
s = s.replace(old, new)
p.write_text(s)

# ── student_experience.jsx ────────────────────────────────────────────────
p = Path('src/student_experience.jsx')
s = p.read_text()
marker = """function StudentDocumentsHelpView({ initialTab='programa', onTabChange }) {"""
helper = r'''async function _studentPrivateSignedPdfF984() {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  if (!token) return { ok:false, error:'sesion_requerida' };
  const url = window.APPS_SCRIPT_URL;
  if (!url) return { ok:false, error:'backend_no_configurado' };
  const res = await fetch(`${url}?fn=descargarMatriculaFirmadaPrivada`, {
    method:'POST',
    headers:{ 'Content-Type':'text/plain;charset=utf-8' },
    body:JSON.stringify({ fn:'descargarMatriculaFirmadaPrivada', token }),
  });
  const r = await res.json();
  if (!r?.ok) return r || { ok:false, error:'respuesta_vacia' };
  if (String(r.mime_type || '').toLowerCase() !== 'application/pdf') return { ok:false, error:'matricula_firmada_mime_invalido' };
  const base64 = String(r.data_base64 || '').replace(/\s+/g, '');
  if (!base64) return { ok:false, error:'matricula_firmada_sin_contenido' };
  let binary;
  try { binary = window.atob(base64); }
  catch (_) { return { ok:false, error:'matricula_firmada_base64_invalido' }; }
  const bytes = new Uint8Array(binary.length);
  for (let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const expectedSize = Number(r.size_bytes || 0);
  if (!bytes.length || bytes.length > 9 * 1024 * 1024 || (expectedSize > 0 && expectedSize !== bytes.length)) return { ok:false, error:'matricula_firmada_incompleta_o_grande' };
  const expectedHash = String(r.sha256 || '').trim().toLowerCase();
  if (expectedHash && window.crypto?.subtle) {
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    const digestHex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (digestHex !== expectedHash) return { ok:false, error:'integridad_matricula_firmada_invalida' };
  }
  return { ok:true, nombre:String(r.nombre || 'matricula_firmada.pdf'), blob:new Blob([bytes], { type:'application/pdf' }) };
}

function StudentSignedEnrollmentPrivateF984() {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const abrir = async () => {
    if (busy) return;
    setBusy(true); setError('');
    const preview = window.open('', '_blank');
    if (preview) {
      try {
        preview.opener = null;
        preview.document.title = 'Verificando matrícula firmada…';
        preview.document.body.innerHTML = '<p style="font-family:system-ui;padding:24px">Verificando matrícula firmada…</p>';
      } catch (_) {}
    }
    try {
      const r = await _studentPrivateSignedPdfF984();
      if (!r?.ok || !r.blob) throw new Error(r?.mensaje || r?.error || 'No hay una matrícula firmada disponible todavía.');
      const objectUrl = URL.createObjectURL(r.blob);
      if (preview && !preview.closed) preview.location.replace(objectUrl);
      else {
        const a = document.createElement('a');
        a.href = objectUrl; a.download = r.nombre || 'matricula_firmada.pdf';
        document.body.appendChild(a); a.click(); a.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
    } catch (e) {
      try { if (preview && !preview.closed) preview.close(); } catch (_) {}
      setError(e?.message || 'No se pudo abrir la matrícula firmada.');
    } finally { setBusy(false); }
  };
  return (
    <section className="card" style={{ marginTop:16, padding:'18px 20px' }}>
      <div style={{ fontSize:10.5, fontWeight:900, letterSpacing:'.13em', textTransform:'uppercase', color:'var(--an-granate)' }}>Documento privado</div>
      <h2 style={{ fontFamily:'var(--f-serif)', color:'var(--an-navy-ink)', margin:'7px 0 6px', fontSize:22 }}>Matrícula firmada</h2>
      <p style={{ margin:'0 0 12px', color:'var(--ink-3)', fontSize:12.5, lineHeight:1.55 }}>Cuando Admisiones adjunte tu PDF firmado, podés abrir aquí la versión más reciente de tu propio expediente.</p>
      <button type="button" className="btn btn-primary" disabled={busy} onClick={abrir}>{busy ? 'Verificando…' : 'Abrir matrícula firmada'}</button>
      {error ? <div role="alert" style={{ marginTop:9, color:'var(--danger)', fontSize:12 }}>{error}</div> : null}
    </section>
  );
}

function StudentDocumentsHelpView({ initialTab='programa', onTabChange }) {'''
if s.count(marker) != 1:
    raise SystemExit(f'student_experience documents marker expected 1 found {s.count(marker)}')
s = s.replace(marker, helper)
old = """        {tab==='programa' && (typeof window.InfoProgramaView === 'function'
          ? <window.InfoProgramaView />
          : <EmptyState icon="📖" title="Documentos no disponibles" subtitle="No fue posible cargar la información del programa." />)}"""
new = """        {tab==='programa' && <>
          {typeof window.InfoProgramaView === 'function'
            ? <window.InfoProgramaView />
            : <EmptyState icon="📖" title="Documentos no disponibles" subtitle="No fue posible cargar la información del programa." />}
          <StudentSignedEnrollmentPrivateF984 />
        </>}"""
if s.count(old) != 1:
    raise SystemExit(f'student_experience program tab expected 1 found {s.count(old)}')
s = s.replace(old, new)
p.write_text(s)

print('PATCHED SEC-002 signed enrollment private frontend')
