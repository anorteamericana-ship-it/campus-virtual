from pathlib import Path

# --- ventas_data.jsx: authenticated fetch + integrity verification ---
p = Path('src/ventas_data.jsx')
s = p.read_text()

marker = "async function getResumenVentas(asesor) {"
helper = r'''function _ventasPrivateDocSafeName(name) {
  const clean = String(name || 'documento').trim().replace(/[\\/:*?"<>|]+/g, '_');
  return clean || 'documento';
}

async function _ventasPrivateDocSha256Hex(bytes) {
  if (!window.crypto?.subtle || !bytes) return '';
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function descargarDocumentoExtraPrivado(cedula, fileId) {
  const ced = String(cedula || '').trim();
  const id = String(fileId || '').trim();
  if (!ced || !id) return { ok:false, error:'cedula_file_id_requeridos' };

  const r = await postVentasData('descargarDocumentoExtraPrivado', { cedula:ced, file_id:id });
  if (!r?.ok) return r || { ok:false, error:'respuesta_vacia' };

  const base64 = String(r.data_base64 || '').replace(/\s+/g, '');
  if (!base64) return { ok:false, error:'documento_sin_contenido' };
  let binary;
  try { binary = window.atob(base64); }
  catch (_) { return { ok:false, error:'documento_base64_invalido' }; }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const expectedSize = Number(r.size_bytes || 0);
  if (!bytes.length || bytes.length > 5 * 1024 * 1024 || (expectedSize > 0 && expectedSize !== bytes.length)) {
    return { ok:false, error:'documento_incompleto_o_grande' };
  }

  const expectedHash = String(r.sha256 || '').trim().toLowerCase();
  if (expectedHash && window.crypto?.subtle) {
    const digestHex = await _ventasPrivateDocSha256Hex(bytes);
    if (!digestHex || digestHex !== expectedHash) return { ok:false, error:'integridad_documento_invalida' };
  }

  const mime = String(r.mime_type || 'application/octet-stream').trim().toLowerCase() || 'application/octet-stream';
  const nombre = _ventasPrivateDocSafeName(r.nombre || 'documento');
  return {
    ok:true,
    private_delivery:true,
    nombre,
    mime_type:mime,
    size_bytes:bytes.length,
    sha256:expectedHash,
    blob:new Blob([bytes], { type:mime }),
  };
}

async function getResumenVentas(asesor) {'''
if s.count(marker) != 1:
    raise SystemExit(f'expected one getResumenVentas marker, found {s.count(marker)}')
s = s.replace(marker, helper)

old = "getProspectosAsesor, getProspectoDetalle, getResumenVentas, getGruposVentas, ventasDashCacheClear,"
new = "getProspectosAsesor, getProspectoDetalle, descargarDocumentoExtraPrivado, getResumenVentas, getGruposVentas, ventasDashCacheClear,"
if s.count(old) != 1:
    raise SystemExit(f'expected one Object.assign export line, found {s.count(old)}')
s = s.replace(old, new)
p.write_text(s)

# --- ventas_drawer.jsx: never navigate to docs_extra Drive URL ---
p = Path('src/ventas_drawer.jsx')
s = p.read_text()

old = "  const [savingNota, setSavingNota] = vUseState(false);"
new = """  const [savingNota, setSavingNota] = vUseState(false);
  const [docPrivadoAbriendo, setDocPrivadoAbriendo] = vUseState('');"""
if s.count(old) != 1:
    raise SystemExit(f'expected one savingNota state, found {s.count(old)}')
s = s.replace(old, new)

marker = "  // ── Subir documento (extra o manual de los 3) ──"
handler = r'''  const abrirDocumentoExtraPrivado = async (doc) => {
    const fileId = String(doc?.file_id || '').trim();
    if (!fileId || docPrivadoAbriendo) {
      if (!fileId) onToast({ tipo:'err', msg:'Este documento todavía no tiene identificador privado. Recargá el expediente después de actualizar el backend QA.' });
      return;
    }

    const key = fileId;
    setDocPrivadoAbriendo(key);
    const preview = window.open('', '_blank');
    if (preview) {
      try {
        preview.opener = null;
        preview.document.title = 'Abriendo documento…';
        preview.document.body.innerHTML = '<p style="font-family:system-ui;padding:24px">Verificando documento…</p>';
      } catch (_) {}
    }

    try {
      const r = await window.descargarDocumentoExtraPrivado(cedula, fileId);
      if (!r?.ok || !r.blob) throw new Error(r?.mensaje || r?.error || 'No se pudo abrir el documento.');
      const objectUrl = URL.createObjectURL(r.blob);
      const inlineSeguro = /^(application\/pdf|image\/(jpeg|png|gif|webp))$/i.test(r.mime_type || '');

      if (inlineSeguro && preview && !preview.closed) {
        preview.location.replace(objectUrl);
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
      } else {
        try { if (preview && !preview.closed) preview.close(); } catch (_) {}
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = r.nombre || 'documento';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      }
    } catch (e) {
      try { if (preview && !preview.closed) preview.close(); } catch (_) {}
      onToast({ tipo:'err', msg:e?.message || 'No se pudo abrir el documento.' });
    } finally {
      setDocPrivadoAbriendo('');
    }
  };

  // ── Subir documento (extra o manual de los 3) ──'''
if s.count(marker) != 1:
    raise SystemExit(f'expected one upload marker, found {s.count(marker)}')
s = s.replace(marker, handler)

old = """                    {doc.url && doc.url !== '#' ? <a className=\"vx-copy\" href={doc.url} target=\"_blank\" rel=\"noopener\">ver</a> : null}"""
new = """                    {doc.file_id ? (
                      <button type=\"button\" className=\"vx-copy\" disabled={!!docPrivadoAbriendo}
                        onClick={() => abrirDocumentoExtraPrivado(doc)}>
                        {docPrivadoAbriendo === String(doc.file_id) ? 'abriendo…' : 'ver'}
                      </button>
                    ) : <span style={{ fontSize:10.5, color:'var(--v-ink-3)' }}>privado pendiente</span>}"""
if s.count(old) != 1:
    raise SystemExit(f'expected one direct docs_extra Drive link, found {s.count(old)}')
s = s.replace(old, new)
p.write_text(s)

print('PATCHED SEC-002 private docs_extra frontend')
