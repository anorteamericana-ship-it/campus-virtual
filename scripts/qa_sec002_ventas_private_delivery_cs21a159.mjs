import fs from 'node:fs';

const data = fs.readFileSync('src/ventas_data.jsx', 'utf8');
const drawer = fs.readFileSync('src/ventas_drawer.jsx', 'utf8');
const parts = fs.readFileSync('src/ventas_parts.jsx', 'utf8');

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
check(data.includes("postVentasData('descargarDocumentoProspectoPrivado'"), 'required prospect documents use authenticated private delivery');
check(data.includes("postVentasData('descargarMatriculaFirmadaPrivada'"), 'signed enrollment private download endpoint is wired');
check(data.includes("bytes.length > 5 * 1024 * 1024"), 'extra document private download enforces 5 MB client limit');
check(data.includes("bytes.length > 9 * 1024 * 1024"), 'signed enrollment private download enforces 9 MB client limit');
check(data.includes("window.crypto.subtle.digest('SHA-256', bytes)"), 'private downloads can verify SHA-256 integrity');
check(data.includes("new Blob([bytes]"), 'private payloads are exposed only as local Blob objects');

// Removed QA bypass surface.
check(!data.includes('preview_test'), 'Ventas data layer no longer exposes preview_test for signed enrollment');
check(!drawer.includes('preview_test'), 'Ventas drawer no longer exposes preview_test');

// UI must use authenticated private delivery, never public Drive links.
check(drawer.includes('const firmadaRegistrada = signedExists || !!(signedDoc && signedDoc.file_id);'), 'signed enrollment state rehydrates from backend metadata after drawer reload');
check(drawer.includes('if (openingSigned || !puedeSubirFirmada || !firmadaRegistrada) return;'), 'signed enrollment private view requires a registered signed document');
check(drawer.includes("file_id:signedDoc && signedDoc.file_id ? signedDoc.file_id : ''"), 'signed enrollment private view falls back to the latest authorized historical PDF');
check(drawer.includes('window.descargarMatriculaFirmadaPrivadaVentasSeguro'), 'signed enrollment view uses private delivery helper');
check(drawer.includes('window.descargarDocumentoProspectoPrivado(cedula, kind, id)'), 'required identity/title documents use private delivery helper');
check(parts.includes("foto_ced_frente: 'CED_FRENTE'"), 'C?dula frente maps to private required-document delivery');
check(parts.includes("foto_ced_dorso: 'CED_DORSO'"), 'C?dula dorso maps to private required-document delivery');
check(parts.includes("foto_titulo: 'TITULO'"), 'T?tulo maps to private required-document delivery');
check(parts.includes('Documento privado disponible'), 'private required documents are presented as viewable');
check(!parts.includes('Subir manualmente'), 'seller cannot fake correction of required identity/title documents through docs_extra');
check(drawer.includes('window.descargarDocumentoExtraPrivado(cedula, fileId)'), 'docs_extra view uses private delivery helper');
check(drawer.includes('URL.createObjectURL(r.blob)'), 'private documents use temporary ObjectURL');
check(drawer.includes('URL.revokeObjectURL(objectUrl)'), 'temporary ObjectURLs are revoked');
check(!drawer.includes('signedDoc.url'), 'signed enrollment UI does not consume a public URL');
check(!drawer.includes('href={doc.url}'), 'docs_extra UI does not expose a public Drive anchor');
check(!drawer.includes('url: base64'), 'new docs_extra rows do not persist data URLs');
check(drawer.includes("privado pendiente"), 'legacy rows without file_id fail closed instead of opening public URL');

// Seller lifecycle: first signed upload closes replacement; sending remains possible.
check(drawer.includes('Ventas no puede reemplazarlo'), 'seller UI explains signed-enrollment immutability');
check(drawer.includes("onClick={() => notifySigned('correo')}"), 'historical signed enrollment can be sent again by email');
check(drawer.includes("onClick={() => notifySigned('whatsapp')}"), 'historical signed enrollment can be shared again by WhatsApp notice');
check(!drawer.includes('drive.google.com/file/d/'), 'signed enrollment UI does not embed a public Drive file URL');

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A159 static QA PASS');
