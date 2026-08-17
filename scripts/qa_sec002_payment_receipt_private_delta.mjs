import fs from 'node:fs';

const patch = fs.readFileSync('qa/sec002_payment_receipt_private_delta.patch', 'utf8');
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else { failures.push(name); console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
};

const hunks = (patch.match(/^@@ /gm) || []).length;
check('payment delta has exactly seven hunks', hunks === 7, `observed=${hunks}`);
check('payment delta targets Code.gs only', /^--- Code\.gs$/m.test(patch) && /^\+\+\+ Code\.gs\.sec002pago$/m.test(patch));
const added = patch.split(/\r?\n/).filter(x => /^\+(?!\+\+)/.test(x)).join('\n');
const removed = patch.split(/\r?\n/).filter(x => /^-(?!--)/.test(x)).join('\n');

check('private receipt endpoint admin-only in permission map', added.includes('+    descargarComprobantePagoPrivado: adminSuper,'));
check('private receipt endpoint is routed', added.includes("fn === 'descargarComprobantePagoPrivado'"));
check('private endpoint requires injected session', added.includes("if (!sesion || sesion.ok !== true) return { ok:false, error:'sesion_requerida' };"));
check('private endpoint restricts admin/superadmin', added.includes("if (['admin','superadmin'].indexOf(rol) < 0)"));
check('private endpoint is keyed by solicitud id', added.includes("body.id || body.solicitud_id") && added.includes("error:'solicitud_id_requerido'"));
check('duplicate solicitud id fails closed', added.includes("error:'solicitud_id_ambiguo'"));
check('Drive id is derived from stored row, not browser', added.includes('_sec002PagoDriveIdFromUrl_(found.solicitud.url)'));
check('file authorization enumerates immediate SOLICITUDES_PAGO folder', added.includes("getFoldersByName('SOLICITUDES_PAGO')") && added.includes('var it = folder.getFiles();'));
check('private file lookup does not trust DriveApp.getFileById request', !/DriveApp\.getFileById\s*\(\s*(?:fileId|body\.|wanted)/.test(added));
check('filename must bind to solicitud id', added.includes("indexOf(reqId + '.') !== 0"));
check('private payload has SHA-256 and base64', added.includes('sha256:_sec002PagoHexBytes_(digest)') && added.includes('data_base64:Utilities.base64Encode(bytes)'));
check('private endpoint has fail-closed rate limiter', added.includes('SEC002_PAGO_PRIVATE_RATE_MAX = 20') && added.includes("error:'rate_limit_no_disponible'"));

check('reporter actor is canonicalized from session', added.includes('body.usuario_reporta = String(sesionPago.cedula || sesionPago.usuario') && added.includes('body.nombre_reporta = String(sesionPago.nombre || sesionPago.usuario'));
check('ventas report is constrained to own prospect', added.includes("if (fn === 'reportarPago')") && added.includes('_sec006cVentasPuedeProspecto_(sesion, pagoCed.prospecto)'));
check('ventas origin is canonical', added.includes("body.origen = 'VENDEDOR'"));
check('upload MIME whitelist only allows JPEG PNG PDF', added.includes("'image/jpeg':'jpg'") && added.includes("'image/png':'png'") && added.includes("'application/pdf':'pdf'"));
check('upload and private delivery enforce 5 MiB', added.includes('SEC002_PAGO_PRIVATE_MAX_BYTES = 5 * 1024 * 1024'));
check('invalid uploaded receipt fails instead of silently dropping evidence', added.includes("error:'comprobante_invalido'"));

check('list DTO replaces public URL with availability boolean', added.includes('solicitud.tiene_comprobante = !!String(solicitud.url_comprobante') && added.includes("solicitud.url_comprobante = '';"));
const responseStart = added.indexOf("version:'SEC002-PAGO-PRIVATE-1'");
const responseEndMarker = 'rate_remaining:rate.remaining';
const responseEnd = responseStart >= 0 ? added.indexOf(responseEndMarker, responseStart) : -1;
const response = responseStart >= 0 && responseEnd >= responseStart ? added.slice(responseStart, responseEnd + responseEndMarker.length) : '';
check('private response is isolated', !!response);
check('private response exposes no Drive URL or file id', !!response && !/\burl\s*:|file_id\s*:|drive_url\s*:/.test(response));

check('transition does not remove existing public sharing yet', !/ANYONE_WITH_LINK|setSharing\s*\(/.test(removed));
check('delta does not touch English LAB or Memory Match', !/englishLabMemoryMatch|MEMORY_MATCH|memory_match|englishLabQuizTime|englishLabWordSearch|englishLabHangman|englishLabSentenceOrder/.test(added));

if (failures.length) {
  console.error(`SEC002 PAYMENT RECEIPT PRIVATE DELTA: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC002 PAYMENT RECEIPT PRIVATE DELTA: PASS');
