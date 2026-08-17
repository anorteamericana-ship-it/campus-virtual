import fs from 'node:fs';

const src = fs.readFileSync('src/ventas_data.jsx', 'utf8');
const start = src.indexOf('async function getProspectoDetalle(cedula)');
const end = src.indexOf('async function getResumenVentas', start);
if (start < 0 || end < 0) throw new Error('No se pudo aislar getProspectoDetalle');
const fn = src.slice(start, end);

for (const token of [
  'normalizarDocsExtraVentas',
  'd.docs_extra',
  'p.docs_extra',
  'docs_extra: docsExtra',
  'nombre_archivo:',
  'mime_type:',
]) {
  if (!src.includes(token)) throw new Error(`Falta contrato docs_extra: ${token}`);
}
if (!fn.includes('docs_extra: docsExtra')) throw new Error('getProspectoDetalle no fusiona docs_extra en prospecto');

const helperStart = src.indexOf('function normalizarDocsExtraVentas');
if (helperStart < 0 || helperStart > start) throw new Error('normalizarDocsExtraVentas debe existir antes del wrapper');
const helper = src.slice(helperStart, start);
if (!/\.nombre_archivo\s*\|\|\s*[a-zA-Z_$][\w$]*\.nombre/.test(helper)) throw new Error('No normaliza nombre -> nombre_archivo');
if (!/application\/pdf/.test(helper)) throw new Error('No deriva MIME PDF cuando falta mime_type');
if (!/Array\.isArray/.test(helper)) throw new Error('Helper docs_extra no fail-safe para arrays');
if (!/webViewLink/.test(helper)) throw new Error('No conserva compatibilidad con webViewLink legacy');

console.log('PASS SEC-002 ventas docs_extra contract');
