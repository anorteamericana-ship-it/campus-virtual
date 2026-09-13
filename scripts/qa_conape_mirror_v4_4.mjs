import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = p => fs.readFileSync(p, 'utf8');
const must = (condition, label) => {
  if (!condition) {
    console.error(`FAIL · ${label}`);
    process.exitCode = 1;
  } else console.log(`PASS · ${label}`);
};

execFileSync(process.execPath, ['services/conape-bridge/build_runtime_v4_4.mjs'], { stdio:'inherit' });
const runtime = read('services/conape-bridge/server_runtime.mjs');
const source = read('services/conape-bridge/server_v2.mjs');
const client = read('src/conape_bridge_client_c3_6.js');
const ventas = read('ventas.html');
const dashboard = read('src/ventas_dashboard.jsx');
const apps = read('apps-script-patches/conape_reclutamiento_mirror_v4_4.js');
const docker = read('services/conape-bridge/Dockerfile');

const salesStart = runtime.indexOf('async function listProspectStatusesForSales(body) {');
const salesEnd = runtime.indexOf('\n\nfunction categoryStatus', salesStart);
const sales = runtime.slice(salesStart, salesEnd);
const applyStart = apps.indexOf('function conapeMirrorApplySnapshotV44(body) {');
const applyEnd = apps.indexOf('\n\nfunction conapeMirrorReadForSalesV44', applyStart);
const apply = applyStart >= 0 && applyEnd > applyStart ? apps.slice(applyStart, applyEnd) : '';
const route = "else if (action === 'prospects_sales_status') result = await listProspectStatusesForSales(body);";

must(runtime.includes("const VERSION = 'V4.4.0';"), 'runtime V4.4.0');
must(source.includes("const VERSION = 'V4.3.2';"), 'baseline V4.3.2 preservado');
must(runtime.includes('function createIsolatedConapeSession()') && runtime.includes('listProspectsFromHome(session = ConapeSession)'), 'cada sync puede usar sesión CONAPE aislada');
must(runtime.includes(route) && !runtime.includes("prospects_sales_status') result = await serial(() => listProspectStatusesForSales(body))"), 'sales-status no usa cola compartida');
must(sales.includes("list?.method === 'CSV_DOWNLOAD'") && sales.includes('list?.counts_match === true') && sales.includes('rowsCsv === rowsHtmlAll') && sales.includes('rowsCsv > 0') && sales.includes('rowsHtmlAll > 0'), 'gate CSV vs Rows=All y no vacío');
must(sales.includes("fn:'conapeMirrorApplySnapshotV44'") && sales.indexOf('validSnapshot') < sales.indexOf("fn:'conapeMirrorApplySnapshotV44'"), 'solo persiste después del gate');
must(sales.includes("event:'conape_mirror_sync_abort'") && sales.includes('counts_match:false'), 'corrida abortada registra conteos sin PII');
must(apps.includes("'RETIRADO_DE_LISTA'") && apply.includes('if(!valid) return') && apply.indexOf('if(!valid) return') < apply.indexOf('_conapeV44DetectMovements_(oldMap,newMap)'), 'RETIRADO solo puede calcularse tras snapshot válido');
must(apps.indexOf('_conapeV44AppendMovements_(events,syncId)') < apps.indexOf('_conapeV44WriteMirror_(newMap,stamp)'), 'movimientos se escriben antes del espejo');
must(apps.includes("getSheetByName('CONAPE_RECLUTAMIENTO')") && apps.includes('CONAPE_MIRROR_V44_HEADERS'), 'espejo exacto CONAPE_RECLUTAMIENTO');
must(!/LockService|newTrigger|ScriptApp\.newTrigger|debounce/i.test(apps), 'patch del espejo no introduce locks, triggers ni debounce');
must(client.includes("const fresh = await salesStatuses('');") && client.includes('installImmediatePostRecruitRefresh'), 'post-reclutamiento refresca en el mismo momento');
must(ventas.includes('conape_bridge_client_c3_6.js?v=V4.4.0'), 'cache bust cliente V4.4');
must(dashboard.indexOf('setDash(baseDash);') >= 0 && dashboard.indexOf('setDash(baseDash);') < dashboard.indexOf('await bridge.salesStatuses(scopeAsesor)'), 'tabla base se pinta antes de leer CONAPE');
must(apps.includes("if(row&&_conapeV44Text_(row.ULTIMO_DESEMBOLSO))return;"), 'Ventas corta visibilidad después del primer desembolso');
must(docker.includes('node build_runtime_v4_4.mjs') && docker.includes('mv server_runtime.mjs server_v2.mjs') && docker.includes('CMD ["node", "server_v2.mjs"]'), 'Railway arranca V4.4 generado con el nombre canónico server_v2');

if (process.exitCode) process.exit(process.exitCode);
console.log('PASS · contrato CONAPE mirror V4.4 completo');
