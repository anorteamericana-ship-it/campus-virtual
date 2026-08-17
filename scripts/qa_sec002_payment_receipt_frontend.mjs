import fs from 'node:fs';

const data = fs.readFileSync('src/data.jsx', 'utf8');
const ui = fs.readFileSync('src/solicitudes_pago.jsx', 'utf8');
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else { failures.push(name); console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
};

const hStart = data.indexOf('async function descargarComprobantePagoPrivado(id)');
const hEnd = data.indexOf('async function marcarSolicitudAplicada', hStart);
const helper = hStart >= 0 && hEnd > hStart ? data.slice(hStart, hEnd) : '';
check('private payment frontend helper exists', !!helper);
check('real payment fetch uses authenticated _solpPost', helper.includes("_solpPost('descargarComprobantePagoPrivado', { id:solicitudId })"));
check('helper validates real MIME whitelist', helper.includes("['image/jpeg','image/png','application/pdf'].includes(mime)"));
check('helper validates size <= 5 MiB and backend size', helper.includes('bytes.length > 5 * 1024 * 1024') && helper.includes('expectedSize !== bytes.length'));
check('helper validates SHA-256', helper.includes('_solpSha256Hex(bytes)') && helper.includes('digestHex !== expectedHash'));
check('helper returns Blob not base64', helper.includes('blob:new Blob([bytes], { type:mime })') && !/data_base64\s*:/.test(helper));
check('private helper exported', /getSolicitudesPago,\s*descargarComprobantePagoPrivado,\s*marcarSolicitudAplicada/.test(data));

const demoStart = data.indexOf('async function _solpComprobanteDemoPrivado');
const demoEnd = data.indexOf('async function descargarComprobantePagoPrivado', demoStart);
const demo = demoStart >= 0 && demoEnd > demoStart ? data.slice(demoStart, demoEnd) : '';
check('demo fallback accepts only local data URI', demo.includes("dataUrl.startsWith('data:')"));
check('demo fallback has no Drive/lh3 allowance', !/drive\.google\.com|lh3\.googleusercontent\.com/.test(demo));

check('UI availability uses tiene_comprobante', ui.includes('function spTieneComprobante(sol)') && ui.includes('sol?.tiene_comprobante === true'));
check('only demo local data URI is legacy availability fallback', ui.includes("demoLocal.startsWith('data:')"));
check('UI loads receipt by solicitud id', ui.includes('window.descargarComprobantePagoPrivado(id)'));
check('UI never renders public URL as img src', !/src=\{sol\.url_comprobante\}/.test(ui));
check('UI never anchors public receipt URL', !/href=\{sol\.url_comprobante\}/.test(ui));
check('UI never window.open public receipt URL', !/window\.open\(\s*(?:sol\.)?url_comprobante/.test(ui));
check('private image modal uses ObjectURL', ui.includes('src={sol._object_url}') && ui.includes('URL.createObjectURL(r.blob)'));
check('UI revokes ObjectURLs', ui.includes('URL.revokeObjectURL(cur._object_url)') && ui.includes('URL.revokeObjectURL(objectUrl)'));
check('PDF opens only from ObjectURL', ui.includes("mime === 'application/pdf'") && ui.includes('preview.location.replace(objectUrl)'));
check('inline real images limited to JPEG/PNG', ui.includes('/^image\\/(jpeg|png)$/i.test(mime)'));
check('modal secondary action downloads ObjectURL', ui.includes('a.href = sol._object_url') && ui.includes('Descargar copia'));
check('table/detail availability no longer depends on public URL directly', (ui.match(/spTieneComprobante\(sol\)/g) || []).length >= 2);

if (failures.length) {
  console.error(`SEC002 PAYMENT RECEIPT FRONTEND: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC002 PAYMENT RECEIPT FRONTEND: PASS');
