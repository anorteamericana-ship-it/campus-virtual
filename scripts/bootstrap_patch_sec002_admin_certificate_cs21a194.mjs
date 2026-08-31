import fs from 'node:fs';

const path = 'src/admin_students.jsx';
let s = fs.readFileSync(path, 'utf8');

function one(label, oldText, newText) {
  const n = s.split(oldText).length - 1;
  if (n !== 1) throw new Error(`${label}: expected 1 exact preimage, found ${n}`);
  s = s.replace(oldText, newText);
  console.log(`${label}: replaced 1`);
}
function exactMany(label, oldText, newText, expected) {
  const n = s.split(oldText).length - 1;
  if (n !== expected) throw new Error(`${label}: expected ${expected} exact preimages, found ${n}`);
  s = s.split(oldText).join(newText);
  console.log(`${label}: replaced ${n}`);
}

const helpers = `async function adminCertSha256HexCS21A194(bytes) {\n  if (!window.crypto?.subtle || !bytes) return '';\n  const digest = await window.crypto.subtle.digest('SHA-256', bytes);\n  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');\n}\n\nasync function adminCertPrivadoBlobCS21A194({ codigo, nivel, grupo, registro }) {\n  const codigoLimpio = String(codigo || '').trim();\n  const nivelLimpio = String(nivel || '').trim().toUpperCase();\n  if (!codigoLimpio || !['B1','B2','I1','I2'].includes(nivelLimpio)) {\n    throw new Error('No se pudo identificar el expediente o nivel del certificado.');\n  }\n  const r = await postAdminStudents('descargarMiCertificadoPrivado', {\n    codigo: codigoLimpio,\n    nivel: nivelLimpio,\n    grupo: String(grupo || '').trim(),\n    registro: String(registro || '').trim(),\n  });\n  if (!r?.ok) {\n    throw new Error(adminStudentsSafeUserError(r?.mensaje || r?.error, 'No se pudo abrir el certificado de forma segura. Intentá de nuevo.', 'certificado_privado'));\n  }\n  if (String(r.mime_type || '').trim().toLowerCase() !== 'application/pdf') {\n    throw new Error('El archivo recibido no es un PDF válido.');\n  }\n  const base64 = String(r.data_base64 || '').replace(/\\s+/g, '');\n  if (!base64) throw new Error('El certificado llegó sin contenido.');\n  let binary;\n  try { binary = window.atob(base64); }\n  catch (_) { throw new Error('El certificado llegó con contenido inválido.'); }\n  const bytes = new Uint8Array(binary.length);\n  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);\n  const expectedSize = Number(r.size_bytes || 0);\n  if (!bytes.length || bytes.length > 2 * 1024 * 1024 || (expectedSize > 0 && expectedSize !== bytes.length)) {\n    throw new Error('El certificado llegó incompleto o supera el tamaño permitido.');\n  }\n  if (!(bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45)) {\n    throw new Error('El contenido recibido no corresponde a un PDF válido.');\n  }\n  const expectedHash = String(r.sha256 || '').trim().toLowerCase();\n  if (expectedHash && window.crypto?.subtle) {\n    const digestHex = await adminCertSha256HexCS21A194(bytes);\n    if (!digestHex || digestHex !== expectedHash) throw new Error('No se pudo verificar la integridad del certificado.');\n  }\n  return {\n    blob: new Blob([bytes], { type:'application/pdf' }),\n    nombre: String(r.nombre || ('certificado-' + nivelLimpio + '.pdf')),\n  };\n}\n\nfunction adminCertPreviewCS21A194() {\n  const preview = window.open('', '_blank');\n  if (preview) {\n    try {\n      preview.opener = null;\n      preview.document.title = 'Abriendo certificado…';\n      preview.document.body.innerHTML = '<p style="font-family:system-ui;padding:24px">Verificando certificado…</p>';\n    } catch (_) {}\n  }\n  return preview;\n}\n\nfunction adminCertOpenBlobCS21A194(preview, archivo) {\n  const objectUrl = URL.createObjectURL(archivo.blob);\n  if (preview && !preview.closed) preview.location.replace(objectUrl);\n  else {\n    const a = document.createElement('a');\n    a.href = objectUrl;\n    a.download = archivo.nombre || 'certificado.pdf';\n    a.rel = 'noopener';\n    document.body.appendChild(a);\n    a.click();\n    a.remove();\n  }\n  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);\n}\n\nfunction adminCertClosePreviewCS21A194(preview) {\n  try { if (preview && !preview.closed) preview.close(); } catch (_) {}\n}\n`;

one(
  'insert private certificate helpers',
  "async function resincronizarEstudianteIndividual(codigo) {",
  helpers + "\nasync function resincronizarEstudianteIndividual(codigo) {"
);

exactMany(
  'preopen certificate window',
  "    setRes(r => ({...r, [certKey]: null}));\n    try {",
  "    setRes(r => ({...r, [certKey]: null}));\n    const preview = adminCertPreviewCS21A194();\n    try {",
  3
);

one(
  'existing certificate opens through private endpoint',
  "      if (data.ok) {\n        setRes(r => ({...r, [certKey]: { url:data.url, nombre:data.nombre, mensaje:data.mensaje }}));\n        if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');\n      } else {\n        setRes(r => ({...r, [certKey]: { error:data.mensaje || data.error, search_url:data.search_url }}));\n      }",
  "      if (data.ok) {\n        const archivo = await adminCertPrivadoBlobCS21A194({ codigo:String(est.codigo || est.rec_m || ''), nivel:nivelCert, grupo:grupoCert, registro:certNum });\n        adminCertOpenBlobCS21A194(preview, archivo);\n        setRes(r => ({...r, [certKey]: { opened:true, nombre:archivo.nombre, mensaje:data.mensaje || 'Certificado abierto de forma segura.' }}));\n      } else {\n        adminCertClosePreviewCS21A194(preview);\n        setRes(r => ({...r, [certKey]: { error:adminStudentsSafeUserError(data.mensaje || data.error, 'No se pudo localizar el certificado. Intentá de nuevo.', 'buscar_certificado'), search_url:data.search_url }}));\n      }"
);

one(
  'regenerated certificate opens through private endpoint',
  "      const data = await postAdminStudents('generarCertificado', {\n        codigo: String(est.codigo || est.rec_m || ''),\n        nivel: nivelCert,\n        grupo: grupoCert,\n        registro_esperado: certNum,\n        forzar_generar: true,\n      });\n      if (data && data.ok) {\n        setRes(r => ({...r, [certKey]: { url:data.url, nombre:data.nombre, mensaje:data.mensaje }}));\n        if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');\n      } else {\n        setRes(r => ({...r, [certKey]: { error:(data && (data.mensaje || data.error)) || 'No se pudo regenerar el certificado.' }}));\n      }",
  "      const data = await postAdminStudents('generarCertificado', {\n        codigo: String(est.codigo || est.rec_m || ''),\n        nivel: nivelCert,\n        grupo: grupoCert,\n        registro_esperado: certNum,\n        forzar_generar: true,\n      });\n      if (data && data.ok) {\n        const archivo = await adminCertPrivadoBlobCS21A194({ codigo:String(est.codigo || est.rec_m || ''), nivel:nivelCert, grupo:grupoCert, registro:certNum });\n        adminCertOpenBlobCS21A194(preview, archivo);\n        setRes(r => ({...r, [certKey]: { opened:true, nombre:archivo.nombre, mensaje:data.mensaje || 'Certificado regenerado y abierto de forma segura.' }}));\n      } else {\n        adminCertClosePreviewCS21A194(preview);\n        setRes(r => ({...r, [certKey]: { error:adminStudentsSafeUserError((data && (data.mensaje || data.error)), 'No se pudo regenerar el certificado. Intentá de nuevo.', 'regenerar_certificado') }}));\n      }"
);

one(
  'new certificate opens through private endpoint',
  "      const data = await postAdminStudents('generarCertificado', {\n        codigo: String(est.codigo || est.rec_m || ''),\n        nivel: nivelCert,\n        grupo: grupoCert,\n      });\n      if (data && data.ok) {\n        setRes(r => ({...r, [certKey]: { url:data.url, nombre:data.nombre, mensaje:data.mensaje }}));\n        if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');\n      } else {\n        setRes(r => ({...r, [certKey]: { error:(data && (data.mensaje || data.error)) || 'No se pudo generar el certificado.' }}));\n      }",
  "      const data = await postAdminStudents('generarCertificado', {\n        codigo: String(est.codigo || est.rec_m || ''),\n        nivel: nivelCert,\n        grupo: grupoCert,\n      });\n      if (data && data.ok) {\n        const archivo = await adminCertPrivadoBlobCS21A194({ codigo:String(est.codigo || est.rec_m || ''), nivel:nivelCert, grupo:grupoCert, registro:data.registro || data.reg_certificados || '' });\n        adminCertOpenBlobCS21A194(preview, archivo);\n        setRes(r => ({...r, [certKey]: { opened:true, nombre:archivo.nombre, mensaje:data.mensaje || 'Certificado generado y abierto de forma segura.' }}));\n      } else {\n        adminCertClosePreviewCS21A194(preview);\n        setRes(r => ({...r, [certKey]: { error:adminStudentsSafeUserError((data && (data.mensaje || data.error)), 'No se pudo generar el certificado. Intentá de nuevo.', 'generar_certificado') }}));\n      }"
);

exactMany(
  'certificate catches close preview and sanitize error',
  "    } catch(e) {\n      setRes(r => ({...r, [certKey]: { error:'Error de conexión' }}));\n    } finally {",
  "    } catch(e) {\n      adminCertClosePreviewCS21A194(preview);\n      setRes(r => ({...r, [certKey]: { error:adminStudentsSafeUserError(e?.message || String(e), 'No se pudo completar la operación de certificado. Intentá de nuevo.', 'certificado_privado') }}));\n    } finally {",
  3
);

one('certificate result condition', 'certResult?.url &&', 'certResult?.opened &&');
one(
  'remove direct certificate success anchor',
  "<a href={certResult.url} target=\"_blank\" rel=\"noreferrer\" style={{ padding:'4px 12px', borderRadius:5, background:'#2E7D32', color:'white', fontSize:11, fontWeight:700, textDecoration:'none' }}>Abrir</a>",
  "<span style={{ padding:'4px 10px', borderRadius:5, background:'#E8F5E9', color:'#2E7D32', fontSize:10.5, fontWeight:800 }}>Verificado</span>"
);

fs.writeFileSync(path, s, 'utf8');
console.log('CS21A194 exact admin private certificate patch applied');
