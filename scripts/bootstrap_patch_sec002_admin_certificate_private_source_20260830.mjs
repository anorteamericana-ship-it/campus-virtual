import fs from 'node:fs';

const path = 'src/admin_students.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceOnce(before, after, label) {
  const n = src.split(before).length - 1;
  if (n !== 1) throw new Error(`SEC002 ADMIN CERT preimage mismatch ${label}: ${n}`);
  src = src.replace(before, after);
  console.log(`${label}: replaced 1`);
}

const anchor = `function abrirPdfPrivadoBackend(payload) {
  try {
    const b64 = String(payload?.pdf_base64 || '').trim();
    if (!b64) return false;
    const mime = String(payload?.pdf_mime || 'application/pdf').trim().toLowerCase();
    if (mime !== 'application/pdf') return false;
    const bin = atob(b64);
    if (!bin.startsWith('%PDF-')) return false;
    if (bin.length > 16 * 1024 * 1024) return false;
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    return true;
  } catch (e) {
    console.warn('[AdminStudents] No se pudo preparar el PDF privado.', e);
    return false;
  }
}
`;

const helpers = `${anchor}
async function adminCertSha256Hex(bytes) {
  if (!window.crypto?.subtle || !bytes) return '';
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function abrirCertificadoPrivadoAdmin({ codigo, nivel, grupo, registro = '' }) {
  const r = await postAdminStudents('descargarMiCertificadoPrivado', {
    codigo: String(codigo || '').trim(),
    nivel: String(nivel || '').trim().toUpperCase(),
    grupo: String(grupo || '').trim(),
    registro: String(registro || '').trim(),
  });
  if (!r?.ok) {
    throw new Error(adminStudentsSafeUserError(r?.mensaje || r?.error, 'No se pudo abrir el certificado.', 'abrir_certificado_admin'));
  }
  if (String(r.mime_type || '').trim().toLowerCase() !== 'application/pdf') {
    throw new Error('El archivo recibido no es un PDF válido.');
  }
  const base64 = String(r.data_base64 || '').replace(/\\s+/g, '');
  if (!base64) throw new Error('El certificado llegó sin contenido.');
  let binary;
  try { binary = window.atob(base64); }
  catch (_) { throw new Error('El certificado llegó con contenido inválido.'); }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const announced = Number(r.size_bytes || 0);
  if (announced && announced !== bytes.length) throw new Error('No se pudo verificar el tamaño del certificado.');
  if (!bytes.length || bytes.length > 2 * 1024 * 1024) throw new Error('El certificado excede el tamaño permitido para apertura privada.');
  if (!(bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45)) {
    throw new Error('El contenido recibido no corresponde a un PDF válido.');
  }
  const expectedHash = String(r.sha256 || '').trim().toLowerCase();
  if (expectedHash && window.crypto?.subtle) {
    const digestHex = await adminCertSha256Hex(bytes);
    if (!digestHex || digestHex !== expectedHash) throw new Error('No se pudo verificar la integridad del certificado.');
  }
  const url = URL.createObjectURL(new Blob([bytes], { type:'application/pdf' }));
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 120000);
  return {
    private:true,
    nombre:String(r.nombre || 'certificado.pdf'),
    mensaje:'Certificado abierto de forma privada.',
  };
}
`;
replaceOnce(anchor, helpers, 'private certificate helper');

const oldActions = `  const buscarCertificado = async () => {
    if (gen[certKey] || !certNum) return;
    setGen(g => ({...g, [certKey]: true}));
    setRes(r => ({...r, [certKey]: null}));
    try {
      const data = await postAdminStudents('buscarCertificadoExistente', {
        codigo: String(est.codigo || est.rec_m || ''),
        nivel: nivelCert,
        grupo: grupoCert,
        registro: certNum,
      });
      if (data.ok) {
        setRes(r => ({...r, [certKey]: { url:data.url, nombre:data.nombre, mensaje:data.mensaje }}));
        if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        setRes(r => ({...r, [certKey]: { error:data.mensaje || data.error, search_url:data.search_url }}));
      }
    } catch(e) {
      setRes(r => ({...r, [certKey]: { error:'Error de conexión' }}));
    } finally {
      setGen(g => ({...g, [certKey]: false}));
    }
  };

  const regenerarCertificadoMismoRegistro = async () => {
    if (gen[certKey] || !certNum) return;
    const confirmar = window.confirm(
      \`Se volverá a crear el PDF de \${NIVEL_LABEL_D[nivelCert] || nivelCert} con el registro \${certNum}.\\n\\n\` +
      'El sistema comprueba que el número de certificado corresponde exactamente al nivel seleccionado. No se cambiará el estado académico ni se generará un número nuevo.\\n\\n¿Continuar?'
    );
    if (!confirmar) return;
    setGen(g => ({...g, [certKey]: true}));
    setRes(r => ({...r, [certKey]: null}));
    try {
      const data = await postAdminStudents('generarCertificado', {
        codigo: String(est.codigo || est.rec_m || ''),
        nivel: nivelCert,
        grupo: grupoCert,
        registro_esperado: certNum,
        forzar_generar: true,
      });
      if (data && data.ok) {
        setRes(r => ({...r, [certKey]: { url:data.url, nombre:data.nombre, mensaje:data.mensaje }}));
        if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        setRes(r => ({...r, [certKey]: { error:(data && (data.mensaje || data.error)) || 'No se pudo regenerar el certificado.' }}));
      }
    } catch(e) {
      setRes(r => ({...r, [certKey]: { error:'Error de conexión' }}));
    } finally {
      setGen(g => ({...g, [certKey]: false}));
    }
  };

  const generarCertificadoNuevo = async () => {
    if (gen[certKey] || !certState.canCrear) return;
    const confirmar = window.confirm(
      \`Generar por primera vez el certificado de \${NIVEL_LABEL_D[nivelCert] || nivelCert}.\\n\\n\` +
      \`Estado: \${estatusCert || '—'} · Pago de certificado: \${certPago ? 'Sí' : 'No'}\\n\\n¿Continuar?\`
    );
    if (!confirmar) return;
    setGen(g => ({...g, [certKey]: true}));
    setRes(r => ({...r, [certKey]: null}));
    try {
      const data = await postAdminStudents('generarCertificado', {
        codigo: String(est.codigo || est.rec_m || ''),
        nivel: nivelCert,
        grupo: grupoCert,
      });
      if (data && data.ok) {
        setRes(r => ({...r, [certKey]: { url:data.url, nombre:data.nombre, mensaje:data.mensaje }}));
        if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        setRes(r => ({...r, [certKey]: { error:(data && (data.mensaje || data.error)) || 'No se pudo generar el certificado.' }}));
      }
    } catch(e) {
      setRes(r => ({...r, [certKey]: { error:'Error de conexión' }}));
    } finally {
      setGen(g => ({...g, [certKey]: false}));
    }
  };
`;

const newActions = `  const buscarCertificado = async () => {
    if (gen[certKey] || !certNum) return;
    setGen(g => ({...g, [certKey]: true}));
    setRes(r => ({...r, [certKey]: null}));
    try {
      const privado = await abrirCertificadoPrivadoAdmin({
        codigo: String(est.codigo || est.rec_m || ''), nivel:nivelCert, grupo:grupoCert, registro:certNum,
      });
      setRes(r => ({...r, [certKey]: privado}));
    } catch(e) {
      setRes(r => ({...r, [certKey]: { error:adminStudentsSafeUserError(e?.message || String(e), 'No se pudo abrir el certificado. Intentá de nuevo.', 'abrir_certificado_admin') }}));
    } finally {
      setGen(g => ({...g, [certKey]: false}));
    }
  };

  const regenerarCertificadoMismoRegistro = async () => {
    if (gen[certKey] || !certNum) return;
    const confirmar = window.confirm(
      \`Se volverá a crear el PDF de \${NIVEL_LABEL_D[nivelCert] || nivelCert} con el registro \${certNum}.\\n\\n\` +
      'El sistema comprueba que el número de certificado corresponde exactamente al nivel seleccionado. No se cambiará el estado académico ni se generará un número nuevo.\\n\\n¿Continuar?'
    );
    if (!confirmar) return;
    setGen(g => ({...g, [certKey]: true}));
    setRes(r => ({...r, [certKey]: null}));
    try {
      const data = await postAdminStudents('generarCertificado', {
        codigo: String(est.codigo || est.rec_m || ''), nivel:nivelCert, grupo:grupoCert,
        registro_esperado:certNum, forzar_generar:true,
      });
      if (!data?.ok) throw new Error(data?.mensaje || data?.error || 'No se pudo regenerar el certificado.');
      const privado = await abrirCertificadoPrivadoAdmin({
        codigo:String(est.codigo || est.rec_m || ''), nivel:nivelCert, grupo:grupoCert, registro:certNum,
      });
      setRes(r => ({...r, [certKey]: privado}));
    } catch(e) {
      setRes(r => ({...r, [certKey]: { error:adminStudentsSafeUserError(e?.message || String(e), 'No se pudo regenerar el certificado. Intentá de nuevo.', 'regenerar_certificado_admin') }}));
    } finally {
      setGen(g => ({...g, [certKey]: false}));
    }
  };

  const generarCertificadoNuevo = async () => {
    if (gen[certKey] || !certState.canCrear) return;
    const confirmar = window.confirm(
      \`Generar por primera vez el certificado de \${NIVEL_LABEL_D[nivelCert] || nivelCert}.\\n\\n\` +
      \`Estado: \${estatusCert || '—'} · Pago de certificado: \${certPago ? 'Sí' : 'No'}\\n\\n¿Continuar?\`
    );
    if (!confirmar) return;
    setGen(g => ({...g, [certKey]: true}));
    setRes(r => ({...r, [certKey]: null}));
    try {
      const data = await postAdminStudents('generarCertificado', {
        codigo:String(est.codigo || est.rec_m || ''), nivel:nivelCert, grupo:grupoCert,
      });
      if (!data?.ok) throw new Error(data?.mensaje || data?.error || 'No se pudo generar el certificado.');
      const privado = await abrirCertificadoPrivadoAdmin({
        codigo:String(est.codigo || est.rec_m || ''), nivel:nivelCert, grupo:grupoCert,
      });
      setRes(r => ({...r, [certKey]: privado}));
    } catch(e) {
      setRes(r => ({...r, [certKey]: { error:adminStudentsSafeUserError(e?.message || String(e), 'No se pudo generar el certificado. Intentá de nuevo.', 'generar_certificado_admin') }}));
    } finally {
      setGen(g => ({...g, [certKey]: false}));
    }
  };
`;
replaceOnce(oldActions, newActions, 'certificate actions');

const oldResult = `{certResult?.url && <div style={{ marginTop:8, padding:'8px 12px', background:'color-mix(in srgb,#2E7D32 8%,white)', border:'1px solid #2E7D32', borderRadius:'var(--r-md, 8px)', display:'flex', alignItems:'center', gap:8 }}><span>✅</span><div style={{ flex:1 }}><div style={{ fontSize:11, fontWeight:700, color:'#2E7D32' }}>{certResult.mensaje || \`PDF de \${nivelCert} listo\`}</div><div style={{ fontSize:10, color:'var(--ink-3, #999)' }}>{certResult.nombre}</div></div><a href={certResult.url} target="_blank" rel="noreferrer" style={{ padding:'4px 12px', borderRadius:5, background:'#2E7D32', color:'white', fontSize:11, fontWeight:700, textDecoration:'none' }}>Abrir</a></div>}
              {certResult?.error && <div style={{ marginTop:6, padding:'8px 10px', background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md, 8px)', fontSize:11, color:'#8B0000' }}>❌ {certResult.error}{certResult.search_url && <a href={certResult.search_url} target="_blank" rel="noreferrer" style={{ marginLeft:8, color:'#8B0000', fontWeight:800 }}>Buscar en Drive</a>}</div>}`;
const newResult = `{certResult?.private && <div style={{ marginTop:8, padding:'8px 12px', background:'color-mix(in srgb,#2E7D32 8%,white)', border:'1px solid #2E7D32', borderRadius:'var(--r-md, 8px)', display:'flex', alignItems:'center', gap:8 }}><span>✅</span><div style={{ flex:1 }}><div style={{ fontSize:11, fontWeight:700, color:'#2E7D32' }}>{certResult.mensaje || \`PDF de \${nivelCert} abierto de forma privada\`}</div><div style={{ fontSize:10, color:'var(--ink-3, #999)' }}>{certResult.nombre}</div></div></div>}
              {certResult?.error && <div style={{ marginTop:6, padding:'8px 10px', background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md, 8px)', fontSize:11, color:'#8B0000' }}>❌ {certResult.error}</div>}`;
replaceOnce(oldResult, newResult, 'certificate private result render');

fs.writeFileSync(path, src);
console.log('SEC002 admin certificate private source exact patch applied');
