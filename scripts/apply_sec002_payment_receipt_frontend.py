from pathlib import Path

# data.jsx: private receipt loader + demo-local data URI fallback
p = Path('src/data.jsx')
s = p.read_text()
marker = """async function marcarSolicitudAplicada({ id, admin_nombre }) {"""
helper = r'''async function _solpSha256Hex(bytes) {
  if (!window.crypto?.subtle || !bytes) return '';
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function _solpComprobanteDemoPrivado(id) {
  const sol = _solpRead().find(x => String(x.id || '') === String(id || ''));
  const dataUrl = String(sol?.url_comprobante || '');
  if (!sol || !dataUrl.startsWith('data:')) return { ok:false, error:'comprobante_demo_no_disponible' };
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    if (!blob.size || blob.size > 5 * 1024 * 1024) return { ok:false, error:'comprobante_demo_invalido_o_grande' };
    return {
      ok:true,
      demo:true,
      private_delivery:true,
      nombre:`comprobante-${String(id || 'demo')}`,
      mime_type:String(blob.type || sol.foto_mime || 'application/octet-stream').toLowerCase(),
      size_bytes:blob.size,
      blob,
    };
  } catch (_) {
    return { ok:false, error:'comprobante_demo_invalido' };
  }
}

async function descargarComprobantePagoPrivado(id) {
  const solicitudId = String(id || '').trim();
  if (!solicitudId) return { ok:false, error:'solicitud_id_requerido' };
  const r = await _solpFetch(
    () => _solpPost('descargarComprobantePagoPrivado', { id:solicitudId }),
    () => _solpComprobanteDemoPrivado(solicitudId)
  );
  if (!r?.ok || r.blob) return r;

  const mime = String(r.mime_type || '').trim().toLowerCase();
  if (!['image/jpeg','image/png','application/pdf'].includes(mime)) return { ok:false, error:'mime_comprobante_no_permitido' };
  const base64 = String(r.data_base64 || '').replace(/\s+/g, '');
  if (!base64) return { ok:false, error:'comprobante_sin_contenido' };

  let binary;
  try { binary = window.atob(base64); }
  catch (_) { return { ok:false, error:'comprobante_base64_invalido' }; }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const expectedSize = Number(r.size_bytes || 0);
  if (!bytes.length || bytes.length > 5 * 1024 * 1024 || (expectedSize > 0 && expectedSize !== bytes.length)) {
    return { ok:false, error:'comprobante_incompleto_o_grande' };
  }
  const expectedHash = String(r.sha256 || '').trim().toLowerCase();
  if (expectedHash && window.crypto?.subtle) {
    const digestHex = await _solpSha256Hex(bytes);
    if (!digestHex || digestHex !== expectedHash) return { ok:false, error:'integridad_comprobante_invalida' };
  }

  return {
    ok:true,
    private_delivery:true,
    nombre:String(r.nombre || `comprobante-${solicitudId}`),
    mime_type:mime,
    size_bytes:bytes.length,
    sha256:expectedHash,
    blob:new Blob([bytes], { type:mime }),
  };
}

async function marcarSolicitudAplicada({ id, admin_nombre }) {'''
if s.count(marker) != 1:
    raise SystemExit(f'expected one marcarSolicitudAplicada marker, found {s.count(marker)}')
s = s.replace(marker, helper)

old = "reportarPago, getSolicitudesPago, marcarSolicitudAplicada, rechazarSolicitudPago,"
new = "reportarPago, getSolicitudesPago, descargarComprobantePagoPrivado, marcarSolicitudAplicada, rechazarSolicitudPago,"
if s.count(old) != 1:
    raise SystemExit(f'expected one payment export line, found {s.count(old)}')
s = s.replace(old, new)
p.write_text(s)

# solicitudes_pago.jsx: remove all public URL rendering/navigation
p = Path('src/solicitudes_pago.jsx')
s = p.read_text()

marker = """function SolicitudesPagoView({ onNavigate, categoria = 'TODAS', embedded = false }) {"""
helper = r'''function spTieneComprobante(sol) {
  if (sol?.tiene_comprobante === true) return true;
  const demoLocal = String(sol?.url_comprobante || '');
  return demoLocal.startsWith('data:');
}

function SolicitudesPagoView({ onNavigate, categoria = 'TODAS', embedded = false }) {'''
if s.count(marker) != 1:
    raise SystemExit(f'expected one SolicitudesPagoView marker, found {s.count(marker)}')
s = s.replace(marker, helper)

old = """  const [verComprobante, setVerComprobante] = React.useState(null); // sol"""
new = """  const [verComprobante, setVerComprobante] = React.useState(null); // sol + ObjectURL privado
  const [abriendoComprobante, setAbriendoComprobante] = React.useState('');"""
if s.count(old) != 1:
    raise SystemExit(f'expected one verComprobante state, found {s.count(old)}')
s = s.replace(old, new)

old = """  const verComp = (sol) => {
    const url = sol.url_comprobante || '';
    const esPdf = /pdf/i.test(sol.foto_mime || '') || /\.pdf($|\?)/i.test(url);
    if (esPdf && url) { window.open(url, '_blank', 'noopener'); return; }
    setVerComprobante(sol);
  };"""
new = r'''  const cerrarComprobante = React.useCallback(() => {
    setVerComprobante(cur => {
      if (cur?._object_url) {
        try { URL.revokeObjectURL(cur._object_url); } catch (_) {}
      }
      return null;
    });
  }, []);

  const verComp = async (sol) => {
    const id = String(sol?.id || '').trim();
    if (!id || abriendoComprobante) return;
    setAbriendoComprobante(id);
    const preview = window.open('', '_blank');
    if (preview) {
      try {
        preview.opener = null;
        preview.document.title = 'Verificando comprobante…';
        preview.document.body.innerHTML = '<p style="font-family:system-ui;padding:24px">Verificando comprobante…</p>';
      } catch (_) {}
    }
    try {
      const r = await window.descargarComprobantePagoPrivado(id);
      if (!r?.ok || !r.blob) throw new Error(r?.mensaje || r?.error || 'No se pudo abrir el comprobante.');
      const objectUrl = URL.createObjectURL(r.blob);
      const mime = String(r.mime_type || r.blob.type || '').toLowerCase();
      if (mime === 'application/pdf') {
        if (preview && !preview.closed) preview.location.replace(objectUrl);
        else {
          const a = document.createElement('a');
          a.href = objectUrl; a.download = r.nombre || `comprobante-${id}.pdf`;
          document.body.appendChild(a); a.click(); a.remove();
        }
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
        return;
      }
      if (/^image\/(jpeg|png)$/i.test(mime)) {
        try { if (preview && !preview.closed) preview.close(); } catch (_) {}
        setVerComprobante({ ...sol, _object_url:objectUrl, _mime:mime, _nombre:r.nombre || `comprobante-${id}` });
        return;
      }

      try { if (preview && !preview.closed) preview.close(); } catch (_) {}
      const a = document.createElement('a');
      a.href = objectUrl; a.download = r.nombre || `comprobante-${id}`;
      document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (e) {
      try { if (preview && !preview.closed) preview.close(); } catch (_) {}
      showToast(e?.message || 'No se pudo abrir el comprobante.', 'err');
    } finally {
      setAbriendoComprobante('');
    }
  };'''
if s.count(old) != 1:
    raise SystemExit(f'expected one legacy verComp, found {s.count(old)}')
s = s.replace(old, new)

old = """      {verComprobante && <SpComprobanteModal sol={verComprobante} onClose={() => setVerComprobante(null)} />}"""
new = """      {verComprobante && <SpComprobanteModal sol={verComprobante} onClose={cerrarComprobante} />}"""
if s.count(old) != 1:
    raise SystemExit(f'expected one comprobante modal caller, found {s.count(old)}')
s = s.replace(old, new)

s = s.replace("{sol.url_comprobante ? (", "{spTieneComprobante(sol) ? (")

old = """          <img src={sol.url_comprobante} alt="Comprobante de pago" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--line)', background: '#fff' }} />"""
new = """          <img src={sol._object_url} alt="Comprobante de pago" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--line)', background: '#fff' }} />"""
if s.count(old) != 1:
    raise SystemExit(f'expected one public image src, found {s.count(old)}')
s = s.replace(old, new)

old = """          <a href={sol.url_comprobante} target="_blank" rel="noopener" style={{ ...spLinkBtn, textDecoration: 'none' }}>Abrir en pestaña nueva</a>"""
new = """          <button type="button" onClick={() => {
            const a = document.createElement('a');
            a.href = sol._object_url; a.download = sol._nombre || `comprobante-${sol.id || 'pago'}`;
            document.body.appendChild(a); a.click(); a.remove();
          }} style={spLinkBtn}>Descargar copia</button>"""
if s.count(old) != 1:
    raise SystemExit(f'expected one public receipt anchor, found {s.count(old)}')
s = s.replace(old, new)

p.write_text(s)
print('PATCHED SEC-002 payment receipt private frontend')
