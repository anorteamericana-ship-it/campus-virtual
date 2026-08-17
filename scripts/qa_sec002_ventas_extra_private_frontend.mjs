import fs from 'node:fs';

const data = fs.readFileSync('src/ventas_data.jsx', 'utf8');
const drawer = fs.readFileSync('src/ventas_drawer.jsx', 'utf8');
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else { failures.push(name); console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
};

const dStart = data.indexOf('async function descargarDocumentoExtraPrivado(cedula, fileId)');
const dEnd = data.indexOf('async function getResumenVentas', dStart);
const helper = dStart >= 0 && dEnd > dStart ? data.slice(dStart, dEnd) : '';
check('authenticated private download helper exists', !!helper);
check('helper uses postVentasData endpoint', helper.includes("postVentasData('descargarDocumentoExtraPrivado', { cedula:ced, file_id:id })"));
check('helper never accepts public Drive URL', !/doc\.url|webViewLink|drive\.google\.com/.test(helper));
check('helper validates decoded size <= 5 MiB', helper.includes('bytes.length > 5 * 1024 * 1024') && helper.includes('expectedSize !== bytes.length'));
check('helper validates SHA-256 when WebCrypto exists', helper.includes('_ventasPrivateDocSha256Hex(bytes)') && helper.includes('digestHex !== expectedHash'));
check('helper constructs local Blob only', helper.includes('blob:new Blob([bytes], { type:mime })'));
check('helper does not return data_base64', !/data_base64\s*:/.test(helper));
check('helper is exported to window', /getProspectoDetalle,\s*descargarDocumentoExtraPrivado,\s*getResumenVentas/.test(data));

const pStart = drawer.indexOf('function ProspectoDrawer(');
const pEnd = drawer.indexOf('// ──', pStart + 40);
const docsBlockAt = drawer.indexOf('Sin documentos adicionales.', pStart);
const docsTail = docsBlockAt >= 0 ? drawer.slice(Math.max(pStart, docsBlockAt - 1800), docsBlockAt + 1600) : '';
check('drawer has private open handler', drawer.includes('const abrirDocumentoExtraPrivado = async (doc) =>'));
check('drawer requires file_id', drawer.includes("const fileId = String(doc?.file_id || '').trim();"));
check('drawer calls private helper with cedula + file_id', drawer.includes('window.descargarDocumentoExtraPrivado(cedula, fileId)'));
check('docs_extra block no longer navigates to doc.url', !/href=\{doc\.url\}|window\.open\(doc\.url|location(?:\.href)?\s*=\s*doc\.url/.test(docsTail));
check('drawer uses ObjectURL and revokes it', drawer.includes('URL.createObjectURL(r.blob)') && drawer.includes('URL.revokeObjectURL(objectUrl)'));
check('inline whitelist excludes SVG/HTML', drawer.includes("/^(application\\/pdf|image\\/(jpeg|png|gif|webp))$/i") && !/image\\\/svg|text\\\/html/.test(drawer.slice(drawer.indexOf('const inlineSeguro'), drawer.indexOf('const inlineSeguro') + 300)));
check('non-inline files force browser download', drawer.includes("a.download = r.nombre || 'documento';"));
check('missing file_id has no public fallback', drawer.includes('privado pendiente') && !/doc\.url\s*&&\s*doc\.url/.test(docsTail));

if (failures.length) {
  console.error(`SEC002 VENTAS EXTRA PRIVATE FRONTEND: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC002 VENTAS EXTRA PRIVATE FRONTEND: PASS');
