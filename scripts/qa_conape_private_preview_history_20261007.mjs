import fs from 'node:fs';

const parts = fs.readFileSync('src/ventas_parts.jsx','utf8');
const data = fs.readFileSync('src/ventas_data.jsx','utf8');
const conape = fs.readFileSync('src/ventas_conape_prospectacion_v1.jsx','utf8');
const bridge = fs.readFileSync('services/conape-bridge/server_v2.mjs','utf8');
const html = fs.readFileSync('ventas.html','utf8');
const previewStart = parts.indexOf('function VxPrivateDocPreview');
const previewEnd = parts.indexOf('function DocsBlock', previewStart);
const previewBlock = previewStart >= 0 && previewEnd > previewStart ? parts.slice(previewStart, previewEnd) : '';

const checks = [
  ['private thumbnail component', parts.includes('function VxPrivateDocPreview')],
  ['private endpoint only', parts.includes('window.descargarDocumentoProspectoPrivado')],
  ['blob object URL preview', parts.includes('URL.createObjectURL(r.blob)')],
  ['no public drive links in preview', !!previewBlock && !previewBlock.includes('drive.google.com')],
  ['private doc cache', data.includes('_ventasProspectPrivateDocCache')],
  ['history heading', conape.includes('Historial de movimientos CONAPE')],
  ['persistent history copy', conape.includes('Registro persistente')],
  ['bridge ordinal14 fallback', bridge.includes("schemaMode = 'ORDINAL14'") && bridge.includes('ratio < 0.7')],
  ['bridge cédula guard', bridge.includes('first.length >= 8 && first.length <= 12')],
  ['bridge version', bridge.includes("V4.5.17-ORDINAL14-RECOVERY")],
  ['ventas data cache bust', html.includes('ventas_data.jsx?v=CONAPE-V2-PRIVATE-PREVIEW-20261007')],
  ['ventas parts cache bust', html.includes('ventas_parts.jsx?v=CONAPE-V2-PRIVATE-PREVIEW-20261007')],
  ['conape UI cache bust', html.includes('ventas_conape_prospectacion_v1.jsx?v=CONAPE-V2-HISTORY-20261007')],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log('CONAPE PRIVATE PREVIEW + HISTORY QA: PASS ' + checks.length + '/' + checks.length);
