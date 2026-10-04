import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync('ventas.html', 'utf8');
const panel = fs.readFileSync('src/ventas_conape_prospectacion_v1.jsx', 'utf8');
const dash = fs.readFileSync('src/ventas_dashboard.jsx', 'utf8');
const data = fs.readFileSync('src/ventas_data.jsx', 'utf8');

const checks = [];
const check = (name, ok) => {
  checks.push([name, !!ok]);
  console.log((ok ? 'PASS ' : 'FAIL ') + name);
};

check('V1 script is loaded before dashboard',
  html.indexOf('ventas_conape_prospectacion_v1.jsx') >= 0 &&
  html.indexOf('ventas_conape_prospectacion_v1.jsx') < html.indexOf('ventas_dashboard.jsx'));

check('V1 read endpoint is wired', panel.includes("getConapeProspectacionVentas"));
check('preview endpoint is wired', panel.includes("previsualizarConapeProspectacionCsv"));
check('apply endpoint is wired', panel.includes("importarConapeProspectacionCsv"));
check('CSV is sent in POST body as base64', panel.includes('csv_base64') && panel.includes("method: 'POST'"));
check('client blocks non-CSV files', /\.csv\$/.test(panel));
check('client enforces 2MB guard', panel.includes('2 * 1024 * 1024'));
check('preview is required before apply', panel.includes("!file || !preview?.ok"));
check('import controls are supervisor-only', panel.includes('esSupervisor ? <Cpv1Importador'));
check('7/14 labels are visible', panel.includes('7–13 dias') && panel.includes('14+ dias'));
check('dashboard stores V1 payload', dash.includes('conape_prospectacion'));
check('dashboard merges V1 state by cedula', dash.includes('getConapeProspectacionVentas') && dash.includes('mergeConapeStatusVentas'));
check('legacy bridge is fallback only', dash.includes('if (!conapeV1Aplicado)'));
check('panel renders before Estudiantes', dash.indexOf('ConapeProspectacionPanel') >= 0 &&
  dash.indexOf('ConapeProspectacionPanel') < dash.indexOf('ESTUDIANTES'));
check('apply refresh clears old dashboard cache', dash.includes('ventasDashCacheClear'));
check('existing CONAPE visual merge remains non-mutating', data.includes('mergeConapeStatusVentas'));

const failed = checks.filter(([, ok]) => !ok);
assert.equal(failed.length, 0, failed.map(([name]) => name).join(', '));
console.log('QA_CONAPE_PROSPECTACION_V1_FRONT=PASS');
