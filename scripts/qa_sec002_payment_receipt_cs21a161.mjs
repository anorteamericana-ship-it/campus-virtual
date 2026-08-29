import fs from 'node:fs';

const data = fs.readFileSync('src/data.jsx', 'utf8');
const view = fs.readFileSync('src/solicitudes_pago.jsx', 'utf8');

function check(condition, message) {
  if (!condition) {
    console.error(`FAIL CS21A161: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

check(data.includes("_solpPost('descargarComprobantePagoPrivado'"), 'private payment receipt endpoint is wired');
check(data.includes("['image/jpeg','image/png','application/pdf'].includes(mime)"), 'private receipt MIME allowlist exists');
check(data.includes('bytes.length > 5 * 1024 * 1024'), 'private receipt enforces 5 MB client limit');
check(data.includes("window.crypto.subtle.digest('SHA-256', bytes)"), 'private receipt verifies SHA-256 when available');
check(data.includes('blob:new Blob([bytes], { type:mime })'), 'private receipt returns a local Blob');
check(data.includes('descargarComprobantePagoPrivado, marcarSolicitudAplicada'), 'private receipt helper is exported');

check(view.includes('function spTieneComprobante(sol)'), 'receipt availability is represented without public navigation');
check(view.includes('window.descargarComprobantePagoPrivado(id)'), 'admin receipt view calls private helper');
check(view.includes('URL.createObjectURL(r.blob)'), 'receipt viewer uses temporary ObjectURL');
check(view.includes('URL.revokeObjectURL'), 'receipt viewer revokes temporary ObjectURL');
check(view.includes('<img src={sol._object_url}'), 'image receipt modal uses local ObjectURL');
check(view.includes('a.href = sol._object_url'), 'download copy uses local ObjectURL');
check(!view.includes("window.open(url, '_blank'"), 'legacy direct public PDF navigation is absent');
check(!view.includes('img src={sol.url_comprobante}'), 'legacy public image source is absent');
check(!view.includes('href={sol.url_comprobante}'), 'legacy public receipt anchor is absent');

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A161 static QA PASS');
