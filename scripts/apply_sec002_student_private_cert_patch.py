from pathlib import Path

p = Path('src/student_modules.jsx')
s = p.read_text()

old = "        {loading && !data ? <SkeletonGrid /> : error ? <ErrorState message={error} onRetry={reload} /> : <CertificadosContenido data={data} />}"
new = "        {loading && !data ? <SkeletonGrid /> : error ? <ErrorState message={error} onRetry={reload} /> : <CertificadosContenido data={data} codigo={codigo} />}"
if s.count(old) != 1:
    raise SystemExit(f'expected one CertificadosContenido caller, found {s.count(old)}')
s = s.replace(old, new)

old = "function CertificadosContenido({ data }) {"
new = "function CertificadosContenido({ data, codigo }) {"
if s.count(old) != 1:
    raise SystemExit(f'expected one CertificadosContenido definition, found {s.count(old)}')
s = s.replace(old, new)

old = "        {rows.map(row => <CertificadoEstadoCardF984 key={row.nivel} row={row} />)}"
new = "        {rows.map(row => <CertificadoEstadoCardF984 key={row.nivel} row={row} codigo={codigo} />)}"
if s.count(old) != 1:
    raise SystemExit(f'expected one certificate card map, found {s.count(old)}')
s = s.replace(old, new)

marker = "function CertificadoEstadoCardF984({ row }) {"
helper = r'''async function _smSha256HexF984(bytes) {
  if (!window.crypto?.subtle || !bytes) return '';
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function _smCertificadoPrivadoBlobF984(codigo, row) {
  const nivel = String(row?.nivel || '').trim().toUpperCase();
  const codigoLimpio = String(codigo || '').trim();
  if (!codigoLimpio || !['B1','B2','I1','I2'].includes(nivel)) {
    throw new Error('No se pudo identificar el expediente o nivel del certificado.');
  }

  const r = await postStudentModules('descargarMiCertificadoPrivado', {
    codigo:codigoLimpio,
    nivel,
    registro:row?.registro || '',
    grupo:row?.grupo || row?.cod_grupo || '',
  });
  if (!r?.ok) throw new Error(r?.mensaje || r?.error || 'No se pudo abrir el certificado privado.');

  const mime = String(r.mime_type || '').trim().toLowerCase();
  if (mime !== 'application/pdf') throw new Error('El archivo recibido no es un PDF válido.');
  const base64 = String(r.data_base64 || '').replace(/\s+/g, '');
  if (!base64) throw new Error('El certificado llegó sin contenido.');

  let binary;
  try { binary = window.atob(base64); }
  catch (_) { throw new Error('El certificado llegó con contenido inválido.'); }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const expectedSize = Number(r.size_bytes || 0);
  if (!bytes.length || (expectedSize > 0 && expectedSize !== bytes.length)) {
    throw new Error('El certificado llegó incompleto. Intentá de nuevo.');
  }

  const expectedHash = String(r.sha256 || '').trim().toLowerCase();
  if (expectedHash && window.crypto?.subtle) {
    const digestHex = await _smSha256HexF984(bytes);
    if (!digestHex || digestHex !== expectedHash) {
      throw new Error('No se pudo verificar la integridad del certificado.');
    }
  }

  return {
    blob:new Blob([bytes], { type:'application/pdf' }),
    nombre:String(r.nombre || `certificado-${nivel}.pdf`),
  };
}

function CertificadoEstadoCardF984({ row, codigo }) {'''
if s.count(marker) != 1:
    raise SystemExit(f'expected one certificate card definition, found {s.count(marker)}')
s = s.replace(marker, helper)

needle = """  const checks = [
    ['Estado académico', row.estatus || 'Sin registro'],
    ['Nota', row.nota != null ? `${row.nota}/100` : 'Sin dato'],
    ['Asistencia', row.asistencia_pct != null ? `${row.asistencia_pct}%` : 'Sin dato verificable'],
    ['Morosidad', row.morosidad_verificada ? (row.morosidad ? 'Registra morosidad' : 'Al Día') : 'Sin dato verificable'],
    ['Pago de certificado', row.certificado_pagado ? 'Registrado' : 'No registrado'],
    ['Número oficial', row.registro || 'Sin asignar'],
  ];"""
replacement = needle + r'''
  const [abriendo, setAbriendo] = React.useState(false);
  const [certError, setCertError] = React.useState('');
  const disponible = row.estado === 'DISPONIBLE_DESCARGA' || !!row.url;

  const abrirPrivado = async () => {
    if (abriendo) return;
    setCertError('');
    setAbriendo(true);
    const preview = window.open('', '_blank');
    if (preview) {
      try {
        preview.opener = null;
        preview.document.title = 'Abriendo certificado…';
        preview.document.body.innerHTML = '<p style="font-family:system-ui;padding:24px">Verificando certificado…</p>';
      } catch (_) {}
    }
    try {
      const archivo = await _smCertificadoPrivadoBlobF984(codigo, row);
      const objectUrl = URL.createObjectURL(archivo.blob);
      if (preview && !preview.closed) {
        preview.location.replace(objectUrl);
      } else {
        const a = document.createElement('a');
        a.href = objectUrl;
        a.target = '_blank';
        a.rel = 'noopener';
        a.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
    } catch (e) {
      try { if (preview && !preview.closed) preview.close(); } catch (_) {}
      setCertError(e?.message || 'No se pudo abrir el certificado.');
    } finally {
      setAbriendo(false);
    }
  };'''
if s.count(needle) != 1:
    raise SystemExit(f'expected one certificate checks block, found {s.count(needle)}')
s = s.replace(needle, replacement)

old = """        {row.url ? (
          <a className="btn btn-primary" href={row.url} target="_blank" rel="noreferrer" style={{ marginTop:14, width:'100%', justifyContent:'center' }}>
            <Icon name="download" size={14} className="" /> Abrir Certificado
          </a>
        ) : null}"""
new = """        {disponible ? (
          <>
            <button type="button" className="btn btn-primary" disabled={abriendo} onClick={abrirPrivado} style={{ marginTop:14, width:'100%', justifyContent:'center' }}>
              <Icon name="download" size={14} className="" /> {abriendo ? 'Verificando…' : 'Abrir Certificado'}
            </button>
            {certError ? <div role="alert" style={{ marginTop:8, fontSize:11, lineHeight:1.4, color:'var(--danger)' }}>{certError}</div> : null}
          </>
        ) : null}"""
if s.count(old) != 1:
    raise SystemExit(f'expected one direct Drive certificate link, found {s.count(old)}')
s = s.replace(old, new)

p.write_text(s)
print('PATCHED SEC-002 student certificate consumer')
