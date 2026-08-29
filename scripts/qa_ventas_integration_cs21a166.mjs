import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const inherited = [
  'scripts/qa_prospectos_ventas_cs21a151.mjs',
  'scripts/qa_ventas_demo_isolation_cs21a152.mjs',
  'scripts/qa_ventas_asesores_reales_cs21a153.mjs',
  'scripts/qa_rel002_sales_auth_cs21a155.mjs',
  'scripts/qa_ventas_no_hardcoded_qa_cs21a157.mjs',
  'scripts/qa_ventas_call_whatsapp_cs21a158.mjs',
  'scripts/qa_sec002_ventas_private_delivery_cs21a159.mjs',
];

let failures = 0;
function check(name, ok, detail='') {
  if (ok) console.log(`PASS ${name}`);
  else { failures++; console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
}

for (const script of inherited) {
  const r = spawnSync(process.execPath, [script], { encoding:'utf8' });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  check(`inherited guard ${script}`, r.status === 0, `exit=${r.status}`);
}

const html = fs.readFileSync('ventas.html', 'utf8');
const dash = fs.readFileSync('src/ventas_dashboard.jsx', 'utf8');
const data = fs.readFileSync('src/ventas_data.jsx', 'utf8');
const drawer = fs.readFileSync('src/ventas_drawer.jsx', 'utf8');
const parts = fs.readFileSync('src/ventas_parts.jsx', 'utf8');
const app = fs.readFileSync('src/app.jsx', 'utf8');
const prospect = fs.readFileSync('src/prospect_free_student.jsx', 'utf8');
const sidebar = fs.readFileSync('src/sidebar.jsx', 'utf8');

check('dead design-system css reference removed', !html.includes('design_system_05c.css'));
check('demo isolation runtime guard loaded by ventas.html', html.includes('src/ventas_runtime_guard_cs21a152.js'));
check('real advisors endpoint present', dash.includes('getAsesoresActivos'));
check('scopeAsesor propagates in dashboard', dash.includes('scopeAsesor'));
check('postVentas includes Campus session token', /getSessionToken/.test(data) && /token/.test(data));
check('no preview_test remains in Ventas data layer', !data.includes('preview_test'));
check('private extra-doc endpoint consumer present', data.includes('descargarDocumentoExtraPrivado'));
check('private signed-enrollment endpoint consumer present', data.includes('descargarMatriculaFirmadaPrivada'));
check('drawer separates telephone action', drawer.includes('tel:'));
check('drawer preserves WhatsApp action', drawer.includes('https://wa.me/'));
check('drawer no longer exposes public signedDoc.url navigation', !/href=\{signedDoc\.url\}/.test(drawer));
check('drawer no longer exposes public docs_extra href', !/href=\{doc\.url\}/.test(drawer));
check('Sales table prioritizes WhatsApp visible phone', parts.includes('p.whatsapp || p.telefono'));
check('prospect frontend does not show Apps Script diagnostics', !/Apps Script/.test(prospect));
check('free prospect sidebar source still has simplified gate marker', /esProspectoGratis|prospect/i.test(sidebar));
check('app user-facing publication copy no longer mentions GitHub completion', !/GitHub termine de publicar|archivo del módulo no terminó de publicarse en GitHub/.test(app));
check('ventas data no longer returns raw HTML/backend deployment diagnostic to user', !/El backend devolvió HTML en vez de JSON/.test(data));

// Integration-specific regression: both real advisor selection and scope
// propagation must coexist in the same dashboard source.
const advisorFetchPos = dash.indexOf('getAsesoresActivos');
const scopePos = dash.indexOf('scopeAsesor');
check('real advisor and scope code coexist', advisorFetchPos >= 0 && scopePos >= 0);

// Runtime backend endpoints for SEC-002 are intentionally not asserted here;
// Issue #111 still blocks claiming end-to-end private delivery.

if (failures) {
  console.error(`CS21A166 VENTAS INTEGRATION: FAIL (${failures})`);
  process.exit(1);
}
console.log('CS21A166 VENTAS INTEGRATION: PASS');
