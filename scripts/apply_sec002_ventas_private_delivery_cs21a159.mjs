import fs from 'node:fs';

const dataPath = 'src/ventas_data.jsx';
const drawerPath = 'src/ventas_drawer.jsx';
let data = fs.readFileSync(dataPath, 'utf8');
let drawer = fs.readFileSync(drawerPath, 'utf8');

function replaceOne(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`);
  return source.replace(before, after);
}
function insertBeforeOne(source, marker, block, label) {
  const count = source.split(marker).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 marker, found ${count}`);
  return source.replace(marker, block + marker);
}

// ── ventas_data.jsx · DTO + private delivery helpers ───────────────────────
data = insertBeforeOne(data, 'async function getProspectoDetalle(cedula) {', `function normalizarDocsExtraVentas(docs) {
  if (!Array.isArray(docs)) return [];
  return docs.map((doc, index) => {
    const d = doc && typeof doc === 'object' ? doc : {};
    const nombre = String(d.nombre_archivo || d.nombre || d.name || \`Documento \${index + 1}\`).trim();
    const mime = String(d.mime_type || d.mime || d.tipo || '').trim().toLowerCase()
      || (/\\.pdf$/i.test(nombre) ? 'application/pdf' : '');
    return {
      ...d,
      nombre_archivo: nombre,
      mime_type: mime,
      file_id: String(d.file_id || d.fileId || d.id || '').trim(),
      size_bytes: Number(d.size_bytes || d.size || 0),
      fecha: d.fecha || d.created_at || d.fecha_subida || '',
    };
  });
}

`, 'docs_extra normalizer');

data = replaceOne(data,
`    const norm = normalizarProspecto(p);`,
`    const docsExtra = normalizarDocsExtraVentas(
      Array.isArray(d?.docs_extra) ? d.docs_extra : p.docs_extra
    );
    const norm = { ...normalizarProspecto(p), docs_extra: docsExtra };`,
'attach private docs DTO');

data = insertBeforeOne(data, 'async function getResumenVentas(asesor) {', `function _ventasPrivateDocSafeName(name) {
  const clean = String(name || 'documento').trim().replace(/[\\\\/:*?"<>|]+/g, '_');
  return clean || 'documento';
}

async function _ventasPrivateDocSha256Hex(bytes) {
  if (!window.crypto?.subtle || !bytes) return '';
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function _ventasPrivateDecodeBase64(base64) {
  const clean = String(base64 || '').replace(/\\s+/g, '');
  if (!clean) return null;
  let binary;
  try { binary = window.atob(clean); }
  catch (_) { return null; }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function descargarDocumentoExtraPrivado(cedula, fileId) {
  const ced = String(cedula || '').trim();
  const id = String(fileId || '').trim();
  if (!ced || !id) return { ok:false, error:'cedula_file_id_requeridos' };
  const r = await postVentasData('descargarDocumentoExtraPrivado', { cedula:ced, file_id:id });
  if (!r?.ok) return r || { ok:false, error:'respuesta_vacia' };
  const bytes = _ventasPrivateDecodeBase64(r.data_base64);
  const expectedSize = Number(r.size_bytes || 0);
  if (!bytes?.length || bytes.length > 5 * 1024 * 1024 || (expectedSize > 0 && expectedSize !== bytes.length)) {
    return { ok:false, error:'documento_incompleto_o_grande' };
  }
  const expectedHash = String(r.sha256 || '').trim().toLowerCase();
  if (expectedHash && window.crypto?.subtle) {
    const digestHex = await _ventasPrivateDocSha256Hex(bytes);
    if (!digestHex || digestHex !== expectedHash) return { ok:false, error:'integridad_documento_invalida' };
  }
  const mime = String(r.mime_type || 'application/octet-stream').trim().toLowerCase() || 'application/octet-stream';
  return {
    ok:true,
    private_delivery:true,
    nombre:_ventasPrivateDocSafeName(r.nombre || 'documento'),
    mime_type:mime,
    size_bytes:bytes.length,
    sha256:expectedHash,
    blob:new Blob([bytes], { type:mime }),
  };
}

`, 'private docs download helper');

data = replaceOne(data,
`const subirDocumentoExtra     = (cedula, nombre_archivo, mime_type, base64) => { ventasDashCacheClear(); return postVentas({ fn:'subirDocumentoExtra', cedula, nombre_archivo, mime_type, base64 }); };`,
`const subirDocumentoExtra     = (cedula, nombre_archivo, mime_type, base64) => { ventasDashCacheClear(); return postVentasData('subirDocumentoExtra', { cedula, nombre_archivo, mime_type, base64 }); };`,
'authenticated extra-doc upload');

data = replaceOne(data,
`async function subirMatriculaFirmadaVentasSeguro({ cedula, codigo, nivel, nombre_archivo, mime_type, base64, enviar_correo = false, crear_alerta = false, email = '', preview_test = false }) {`,
`async function subirMatriculaFirmadaVentasSeguro({ cedula, codigo, nivel, nombre_archivo, mime_type, base64, enviar_correo = false, crear_alerta = false, email = '' }) {`,
'remove signed upload preview parameter');
data = replaceOne(data, `    email,\n    preview_test,\n  });`, `    email,\n  });`, 'remove signed upload preview payload');
data = replaceOne(data,
`async function notificarMatriculaFirmadaVentasSeguro({ cedula, codigo, canal, file_id = '', email = '', preview_test = false }) {`,
`async function notificarMatriculaFirmadaVentasSeguro({ cedula, codigo, canal, file_id = '', email = '' }) {`,
'remove signed notify preview parameter');
data = replaceOne(data, `    file_id,\n    email,\n    preview_test,\n  });`, `    file_id,\n    email,\n  });`, 'remove signed notify preview payload');

data = insertBeforeOne(data, '// ── ENDPOINTS v4.27.1 (becas + proformas CONAPE) ───────────────────────────', `async function descargarMatriculaFirmadaPrivadaVentasSeguro({ cedula, codigo, file_id = '' }) {
  const r = await postVentasData('descargarMatriculaFirmadaPrivada', {
    cedula: cedula || '',
    codigo: codigo || '',
    file_id,
  });
  if (!r?.ok) return r || { ok:false, error:'respuesta_vacia' };
  if (String(r.mime_type || '').toLowerCase() !== 'application/pdf') return { ok:false, error:'matricula_firmada_mime_invalido' };
  const bytes = _ventasPrivateDecodeBase64(r.data_base64);
  const expectedSize = Number(r.size_bytes || 0);
  if (!bytes?.length || bytes.length > 9 * 1024 * 1024 || (expectedSize > 0 && expectedSize !== bytes.length)) {
    return { ok:false, error:'matricula_firmada_incompleta_o_grande' };
  }
  if (!(bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45)) {
    return { ok:false, error:'contenido_pdf_firmado_invalido' };
  }
  const expectedHash = String(r.sha256 || '').trim().toLowerCase();
  if (expectedHash && window.crypto?.subtle) {
    const digestHex = await _ventasPrivateDocSha256Hex(bytes);
    if (!digestHex || digestHex !== expectedHash) return { ok:false, error:'integridad_matricula_firmada_invalida' };
  }
  return {
    ok:true,
    private_delivery:true,
    nombre:_ventasPrivateDocSafeName(r.nombre || 'matricula_firmada.pdf'),
    mime_type:'application/pdf',
    size_bytes:bytes.length,
    sha256:expectedHash,
    blob:new Blob([bytes], { type:'application/pdf' }),
  };
}

`, 'private signed enrollment helper');

data = replaceOne(data,
`  getProspectosAsesor, getProspectoDetalle, getResumenVentas, getGruposVentas, ventasDashCacheClear,`,
`  getProspectosAsesor, getProspectoDetalle, descargarDocumentoExtraPrivado, getResumenVentas, getGruposVentas, ventasDashCacheClear,`,
'export private extra helper');
data = replaceOne(data,
`  generarDocumentoVentasSeguro, subirMatriculaFirmadaVentasSeguro, notificarMatriculaFirmadaVentasSeguro,`,
`  generarDocumentoVentasSeguro, subirMatriculaFirmadaVentasSeguro, notificarMatriculaFirmadaVentasSeguro, descargarMatriculaFirmadaPrivadaVentasSeguro,`,
'export private signed helper');

// ── ventas_drawer.jsx · consume file_id, never a public Drive URL ──────────
drawer = replaceOne(drawer,
`  const [signedDoc, setSignedDoc] = vUseState(null);`,
`  const [signedDoc, setSignedDoc] = vUseState(null);\n  const [openingSigned, setOpeningSigned] = vUseState(false);`,
'signed private opening state');

drawer = insertBeforeOne(drawer, '  const notifySigned = async (canal) => {', `  const openSignedPrivate = async () => {
    if (openingSigned || !(signedDoc && signedDoc.file_id)) return;
    if (demo) {
      onToast && onToast({ tipo:'ok', msg:'Vista previa: la apertura privada requiere una sesión real.' });
      return;
    }
    setOpeningSigned(true); setErr('');
    const preview = window.open('', '_blank');
    if (preview) {
      try {
        preview.opener = null;
        preview.document.title = 'Verificando documento…';
        preview.document.body.innerHTML = '<p style="font-family:system-ui;padding:24px">Verificando documento…</p>';
      } catch (_) {}
    }
    try {
      const r = await window.descargarMatriculaFirmadaPrivadaVentasSeguro({
        cedula: cedulaDoc,
        codigo,
        file_id: signedDoc.file_id,
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

`, 'private signed opener');

drawer = replaceOne(drawer,
`    if (canal === 'whatsapp') {
      const url = signedDoc && signedDoc.url ? signedDoc.url : '';
      if (!url) { onToast && onToast({ tipo:'err', msg:'Primero subí el PDF firmado para obtener el enlace.' }); return; }
      if (!waNumDoc) { onToast && onToast({ tipo:'err', msg:'Este estudiante no tiene WhatsApp/teléfono registrado.' }); return; }
      const msg = \`Hola, te compartimos tu documento de matrícula firmado de Academia Norteamericana: \${url}\`;
      window.open(\`https://wa.me/\${waNumDoc}?text=\${encodeURIComponent(msg)}\`, '_blank', 'noopener');
      return;
    }`,
`    if (canal === 'whatsapp') {
      if (!(signedDoc && signedDoc.file_id)) { onToast && onToast({ tipo:'err', msg:'Primero subí el PDF firmado al expediente.' }); return; }
      if (!waNumDoc) { onToast && onToast({ tipo:'err', msg:'Este estudiante no tiene WhatsApp/teléfono registrado.' }); return; }
      const msg = 'Hola. Tu documento de matrícula firmado de Academia Norteamericana ya está disponible de forma privada en el Campus Virtual, en Documentos y ayuda. También podemos enviártelo adjunto por correo.';
      window.open(\`https://wa.me/\${waNumDoc}?text=\${encodeURIComponent(msg)}\`, '_blank', 'noopener');
      return;
    }`,
'private signed WhatsApp message');

drawer = replaceOne(drawer,
`        {signedDoc && signedDoc.url ? (
          <a className="vx-btn vx-btn-ghost" href={signedDoc.url} target="_blank" rel="noopener" style={{ textDecoration:'none', justifyContent:'center' }}>
            <window.Vico d={window.VI.doc} size={14} /> Ver firmado
          </a>
        ) : null}`,
`        {signedDoc && signedDoc.file_id ? (
          <button type="button" className="vx-btn vx-btn-ghost" disabled={openingSigned} onClick={openSignedPrivate} style={{ justifyContent:'center' }}>
            {openingSigned ? <><span className="vx-spin dark" /> Verificando…</> : <><window.Vico d={window.VI.doc} size={14} /> Ver firmado</>}
          </button>
        ) : null}`,
'private signed view button');
drawer = replaceOne(drawer, `{signedDoc && signedDoc.url ? (`, `{signedDoc && signedDoc.file_id ? (`, 'signed notification controls use file_id');

drawer = replaceOne(drawer,
`  const [savingNota, setSavingNota] = vUseState(false);`,
`  const [savingNota, setSavingNota] = vUseState(false);\n  const [docPrivadoAbriendo, setDocPrivadoAbriendo] = vUseState('');`,
'extra doc opening state');

drawer = insertBeforeOne(drawer, '  // ── Subir documento (extra o manual de los 3) ──', `  const abrirDocumentoExtraPrivado = async (doc) => {
    const fileId = String(doc?.file_id || '').trim();
    if (!fileId || docPrivadoAbriendo) {
      if (!fileId) onToast({ tipo:'err', msg:'Este documento todavía no está disponible para apertura privada.' });
      return;
    }
    setDocPrivadoAbriendo(fileId);
    const preview = window.open('', '_blank');
    if (preview) {
      try {
        preview.opener = null;
        preview.document.title = 'Verificando documento…';
        preview.document.body.innerHTML = '<p style="font-family:system-ui;padding:24px">Verificando documento…</p>';
      } catch (_) {}
    }
    try {
      const r = await window.descargarDocumentoExtraPrivado(cedula, fileId);
      if (!r?.ok || !r.blob) throw new Error(r?.mensaje || r?.error || 'No se pudo abrir el documento.');
      const objectUrl = URL.createObjectURL(r.blob);
      const inlineSeguro = /^(application\\/pdf|image\\/(jpeg|png|gif|webp))$/i.test(r.mime_type || '');
      if (inlineSeguro && preview && !preview.closed) {
        preview.location.replace(objectUrl);
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
      } else {
        try { if (preview && !preview.closed) preview.close(); } catch (_) {}
        const a = document.createElement('a');
        a.href = objectUrl; a.download = r.nombre || 'documento'; a.rel = 'noopener';
        document.body.appendChild(a); a.click(); a.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      }
    } catch (e) {
      try { if (preview && !preview.closed) preview.close(); } catch (_) {}
      onToast({ tipo:'err', msg:e?.message || 'No se pudo abrir el documento.' });
    } finally { setDocPrivadoAbriendo(''); }
  };

`, 'private extra-doc opener');

drawer = replaceOne(drawer,
`          const nuevo = { nombre_archivo: file.name, mime_type: file.type, url: base64, fecha: window.HOY };`,
`          const nuevo = {
            nombre_archivo: r.nombre || file.name,
            mime_type: r.mime_type || file.type,
            file_id: r.file_id || '',
            size_bytes: Number(r.size_bytes || file.size || 0),
            fecha: window.HOY,
          };`,
'private uploaded extra DTO');

drawer = replaceOne(drawer,
`                    {doc.url && doc.url !== '#' ? <a className="vx-copy" href={doc.url} target="_blank" rel="noopener">ver</a> : null}`,
`                    {doc.file_id ? (
                      <button type="button" className="vx-copy" disabled={!!docPrivadoAbriendo}
                        onClick={() => abrirDocumentoExtraPrivado(doc)}>
                        {docPrivadoAbriendo === String(doc.file_id) ? 'abriendo…' : 'ver'}
                      </button>
                    ) : <span style={{ fontSize:10.5, color:'var(--v-ink-3)' }}>privado pendiente</span>}`,
'private extra-doc view control');

for (const forbidden of [
  'preview_test',
  'signedDoc.url',
  'href={doc.url}',
  "url: base64",
  'para obtener el enlace',
  'actualizar el backend QA',
]) {
  if (data.includes(forbidden) || drawer.includes(forbidden)) throw new Error(`forbidden public/QA marker remains: ${forbidden}`);
}
for (const required of [
  "postVentasData('descargarDocumentoExtraPrivado'",
  "postVentasData('descargarMatriculaFirmadaPrivada'",
  'URL.createObjectURL(r.blob)',
  'signedDoc && signedDoc.file_id',
  'doc.file_id ? (',
  "postVentasData('subirDocumentoExtra'",
]) {
  if (!(data.includes(required) || drawer.includes(required))) throw new Error(`required private-delivery invariant missing: ${required}`);
}

fs.writeFileSync(dataPath, data);
fs.writeFileSync(drawerPath, drawer);
console.log('CS21A159 source patch PASS');
