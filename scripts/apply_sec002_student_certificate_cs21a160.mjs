import fs from 'node:fs';

const path = 'src/student_modules.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceOne(before, after, label) {
  const count = src.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`);
  src = src.replace(before, after);
}
function insertBeforeOne(marker, block, label) {
  const count = src.split(marker).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 marker, found ${count}`);
  src = src.replace(marker, block + marker);
}

replaceOne(
`        {loading && !data ? <SkeletonGrid /> : error ? <ErrorState message={error} onRetry={reload} /> : <CertificadosContenido data={data} />}`,
`        {loading && !data ? <SkeletonGrid /> : error ? <ErrorState message={error} onRetry={reload} /> : <CertificadosContenido data={data} codigo={codigo} />}`,
'pass student code to certificate content'
);
replaceOne(`function CertificadosContenido({ data }) {`, `function CertificadosContenido({ data, codigo }) {`, 'certificate content signature');
replaceOne(
`        {rows.map(row => <CertificadoEstadoCardF984 key={row.nivel} row={row} />)}`,
`        {rows.map(row => <CertificadoEstadoCardF984 key={row.nivel} row={row} codigo={codigo} />)}`,
'pass code to certificate cards'
);

insertBeforeOne('function CertificadoEstadoCardF984({ row }) {', `async function _smSha256HexF984(bytes) {
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
    codigo: codigoLimpio,
    nivel,
    registro: row?.registro || '',
    grupo: row?.grupo || row?.cod_grupo || '',
  });
  if (!r?.ok) throw new Error(r?.mensaje || r?.error || 'No se pudo abrir el certificado privado.');
  if (String(r.mime_type || '').trim().toLowerCase() !== 'application/pdf') {
    throw new Error('El archivo recibido no es un PDF válido.');
  }

  const base64 = String(r.data_base64 || '').replace(/\\s+/g, '');
  if (!base64) throw new Error('El certificado llegó sin contenido.');
  let binary;
  try { binary = window.atob(base64); }
  catch (_) { throw new Error('El certificado llegó con contenido inválido.'); }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const expectedSize = Number(r.size_bytes || 0);
  if (!bytes.length || bytes.length > 2 * 1024 * 1024 || (expectedSize > 0 && expectedSize !== bytes.length)) {
    throw new Error('El certificado llegó incompleto o supera el tamaño permitido.');
  }
  if (!(bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45)) {
    throw new Error('El contenido recibido no corresponde a un PDF válido.');
  }

  const expectedHash = String(r.sha256 || '').trim().toLowerCase();
  if (expectedHash && window.crypto?.subtle) {
    const digestHex = await _smSha256HexF984(bytes);
    if (!digestHex || digestHex !== expectedHash) {
      throw new Error('No se pudo verificar la integridad del certificado.');
    }
  }

  return {
    blob: new Blob([bytes], { type:'application/pdf' }),
    nombre: String(r.nombre || \`certificado-\${nivel}.pdf\`),
  };
}

`, 'private certificate helper');

replaceOne(`function CertificadoEstadoCardF984({ row }) {`, `function CertificadoEstadoCardF984({ row, codigo }) {`, 'certificate card signature');

replaceOne(
`  const checks = [
    ['Estado académico', row.estatus || 'Sin registro'],
    ['Nota', row.nota != null ? \`${row.nota}/100\` : 'Sin dato'],
    ['Asistencia', row.asistencia_pct != null ? \`${row.asistencia_pct}%\` : 'Sin dato verificable'],
    ['Morosidad', row.morosidad_verificada ? (row.morosidad ? 'Registra morosidad' : 'Al Día') : 'Sin dato verificable'],
    ['Pago de certificado', row.certificado_pagado ? 'Registrado' : 'No registrado'],
    ['Número oficial', row.registro || 'Sin asignar'],
  ];`,
`  const checks = [
    ['Estado académico', row.estatus || 'Sin registro'],
    ['Nota', row.nota != null ? \`${row.nota}/100\` : 'Sin dato'],
    ['Asistencia', row.asistencia_pct != null ? \`${row.asistencia_pct}%\` : 'Sin dato verificable'],
    ['Morosidad', row.morosidad_verificada ? (row.morosidad ? 'Registra morosidad' : 'Al Día') : 'Sin dato verificable'],
    ['Pago de certificado', row.certificado_pagado ? 'Registrado' : 'No registrado'],
    ['Número oficial', row.registro || 'Sin asignar'],
  ];
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
      if (preview && !preview.closed) preview.location.replace(objectUrl);
      else {
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = archivo.nombre || 'certificado.pdf';
        a.rel = 'noopener';
        document.body.appendChild(a); a.click(); a.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
    } catch (e) {
      try { if (preview && !preview.closed) preview.close(); } catch (_) {}
      setCertError(e?.message || 'No se pudo abrir el certificado.');
    } finally { setAbriendo(false); }
  };`,
'certificate private state and opener'
);

replaceOne(
`        {row.url ? (
          <a className="btn btn-primary" href={row.url} target="_blank" rel="noreferrer" style={{ marginTop:14, width:'100%', justifyContent:'center' }}>
            <Icon name="download" size={14} className="" /> Abrir Certificado
          </a>
        ) : null}`,
`        {disponible ? (
          <>
            <button type="button" className="btn btn-primary" disabled={abriendo} onClick={abrirPrivado} style={{ marginTop:14, width:'100%', justifyContent:'center' }}>
              <Icon name="download" size={14} className="" /> {abriendo ? 'Verificando…' : 'Abrir Certificado'}
            </button>
            {certError ? <div role="alert" style={{ marginTop:8, fontSize:11, lineHeight:1.4, color:'var(--danger)' }}>{certError}</div> : null}
          </>
        ) : null}`,
'replace public certificate anchor'
);

for (const forbidden of ['href={row.url}', '<a className="btn btn-primary" href={row.url}']) {
  if (src.includes(forbidden)) throw new Error(`public certificate link remains: ${forbidden}`);
}
for (const required of [
  "postStudentModules('descargarMiCertificadoPrivado'",
  'bytes.length > 2 * 1024 * 1024',
  "window.crypto.subtle.digest('SHA-256', bytes)",
  'URL.createObjectURL(archivo.blob)',
  'URL.revokeObjectURL(objectUrl)',
  "bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45",
]) {
  if (!src.includes(required)) throw new Error(`private certificate invariant missing: ${required}`);
}

fs.writeFileSync(path, src);
console.log('CS21A160 source patch PASS');
