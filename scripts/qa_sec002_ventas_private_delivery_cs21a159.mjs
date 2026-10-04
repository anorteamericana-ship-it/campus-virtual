import fs from 'node:fs';

const data = fs.readFileSync('src/ventas_data.jsx', 'utf8');
const drawer = fs.readFileSync('src/ventas_drawer.jsx', 'utf8');
const parts = fs.readFileSync('src/ventas_parts.jsx', 'utf8');

function check(condition, message) {
  if (!condition) {
    console.error('FAIL CS21A159: ' + message);
    process.exitCode = 1;
  } else {
    console.log('PASS: ' + message);
  }
}

check(data.includes('function normalizarDocsExtraVentas(docs)'), 'docs_extra has a dedicated DTO normalizer');
check(data.includes("file_id: String(d.file_id || d.fileId || d.id || '').trim()"), 'docs_extra preserves file_id instead of requiring a URL');
check(data.includes("postVentasData('subirDocumentoExtra'"), 'extra document upload uses authenticated POST helper');
check(data.includes("postVentasData('descargarDocumentoExtraPrivado'"), 'extra document private download endpoint is wired');
check(data.includes("postVentasData('descargarDocumentoInscripcionPrivado'"), 'identity/title private download endpoint is wired');
check(data.includes("postVentasData('descargarMatriculaFirmadaPrivada'"), 'signed enrollment private download endpoint is wired');
check(data.includes('bytes.length > 5 * 1024 * 1024'), 'extra document private download enforces 5 MB client limit');
check(data.includes('bytes.length > 12 * 1024 * 1024'), 'identity/title private download enforces 12 MB client limit');
check(data.includes('bytes.length > 9 * 1024 * 1024'), 'signed enrollment private download enforces 9 MB client limit');
check(data.includes("window.crypto.subtle.digest('SHA-256', bytes)"), 'private downloads verify SHA-256 when available');
check(data.includes('new Blob([bytes]'), 'private payloads are exposed only as local Blob objects');

check(!data.includes('preview_test'), 'Ventas data layer no longer exposes preview_test for signed enrollment');
check(!drawer.includes('preview_test'), 'Ventas drawer no longer exposes preview_test');

check(parts.includes('onOpenPrivate(tipo, cap)'), 'identity/title cards open through authenticated private delivery');
check(parts.includes('const canOpenPrivate = !!privateFileId || (!!src && !legacyInline);'), 'legacy identity/title URLs are routed through private delivery');
check(!parts.includes('Documento privado registrado'), 'seller no longer gets a blind private-file placeholder');
check(!parts.includes('Subir manualmente'), 'seller cannot fake canonical identity/title uploads from the drawer');

check(drawer.includes("const signedExists = !!((signedDoc && signedDoc.file_id) || firmadoBackend.existe);"), 'signed enrollment state survives drawer reopen via backend metadata');
check(drawer.includes('const puedePreparar = !!codigo && !signedExists;'), 'seller becomes read-only after signed enrollment');
check(drawer.includes("file_id:signedDoc && signedDoc.file_id ? signedDoc.file_id : ''"), 'signed private view falls back to latest authorized historical PDF');
check(drawer.includes('window.descargarMatriculaFirmadaPrivadaVentasSeguro'), 'signed enrollment view uses private delivery helper');
check(drawer.includes('URL.createObjectURL(r.blob)'), 'private documents use temporary ObjectURL');
check(drawer.includes('URL.revokeObjectURL(objectUrl)'), 'temporary ObjectURLs are revoked');
check(!drawer.includes('signedDoc.url'), 'signed enrollment UI does not consume a public URL');
check(!drawer.includes('href={doc.url}'), 'docs_extra UI does not expose a public Drive anchor');
check(!drawer.includes('url: base64'), 'new docs_extra rows do not persist data URLs');
check(drawer.includes('Ventas no puede regenerarlo ni sustituirlo; sí puede consultarlo y volver a enviarlo.'), 'seller locked state is explicit after signed enrollment');
check(!drawer.includes('Reemplazar PDF firmado'), 'Ventas does not expose admin replacement controls');
check(drawer.includes('notificarMatriculaFirmadaVentasSeguro'), 'seller can resend signed enrollment through private notification');

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A159 static QA PASS');