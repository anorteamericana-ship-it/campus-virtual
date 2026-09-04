import fs from 'node:fs';

const data = fs.readFileSync('src/ventas_data.jsx', 'utf8');
const drawer = fs.readFileSync('src/ventas_drawer.jsx', 'utf8');

function check(condition, message) {
  if (!condition) {
    console.error(`FAIL CS21A159: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

// Transport and DTO contract.
check(data.includes('function normalizarDocsExtraVentas(docs)'), 'docs_extra has a dedicated DTO normalizer');
check(data.includes("file_id: String(d.file_id || d.fileId || d.id || '').trim()"), 'docs_extra preserves file_id instead of requiring a URL');
check(data.includes("postVentasData('subirDocumentoExtra'"), 'extra document upload uses authenticated POST helper');
check(data.includes("postVentasData('descargarDocumentoExtraPrivado'"), 'extra document private download endpoint is wired');
check(data.includes("postVentasData('descargarMatriculaFirmadaPrivada'"), 'signed enrollment private download endpoint is wired');
check(data.includes("bytes.length > 5 * 1024 * 1024"), 'extra document private download enforces 5 MB client limit');
check(data.includes("bytes.length > 9 * 1024 * 1024"), 'signed enrollment private download enforces 9 MB client limit');
check(data.includes("window.crypto.subtle.digest('SHA-256', bytes)"), 'private downloads can verify SHA-256 integrity');
check(data.includes("new Blob([bytes]"), 'private payloads are exposed only as local Blob objects');

// Removed QA bypass surface.
check(!data.includes('preview_test'), 'Ventas data layer no longer exposes preview_test for signed enrollment');
check(!drawer.includes('preview_test'), 'Ventas drawer no longer exposes preview_test');

// UI must use file_id/private endpoint, never public links for these classes.
check(drawer.includes('signedDoc && signedDoc.file_id'), 'signed enrollment UI is keyed by file_id');
check(drawer.includes('window.descargarMatriculaFirmadaPrivadaVentasSeguro'), 'signed enrollment view uses private delivery helper');
check(drawer.includes('window.descargarDocumentoExtraPrivado(cedula, fileId)'), 'docs_extra view uses private delivery helper');
check(drawer.includes('URL.createObjectURL(r.blob)'), 'private documents use temporary ObjectURL');
check(drawer.includes('URL.revokeObjectURL(objectUrl)'), 'temporary ObjectURLs are revoked');
check(!drawer.includes('signedDoc.url'), 'signed enrollment UI does not consume a public URL');
check(!drawer.includes('href={doc.url}'), 'docs_extra UI does not expose a public Drive anchor');
check(!drawer.includes('url: base64'), 'new docs_extra rows do not persist data URLs');
check(drawer.includes("privado pendiente"), 'legacy rows without file_id fail closed instead of opening public URL');

// WhatsApp must not transmit a Drive link for signed enrollment.
check(drawer.includes('ya está disponible de forma privada en el Campus Virtual'), 'signed enrollment WhatsApp copy points user to private Campus access');
check(!drawer.includes('te compartimos tu documento de matrícula firmado de Academia Norteamericana: ${url}'), 'signed enrollment WhatsApp no longer embeds public URL');

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A159 static QA PASS');
