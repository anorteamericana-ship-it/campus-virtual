import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const server = read('services/conape-bridge/server.mjs');
const server37 = read('services/conape-bridge/server_c3_7.mjs');
const ventas = read('ventas.html');
const client = read('src/conape_bridge_client_c3_6.js');
const sessionUi = read('src/conape_session_ui_c3_7.js');
const compareUi = read('src/conape_compare_ui_c3_7_1.js');
const config = read('src/conape_bridge_config_c3_6.js');
const row = read('src/ventas_conape_reclutar_row_c3_5.jsx');
const table = read('src/ventas_sortable_table_cs21a20.jsx');
const docker = read('services/conape-bridge/Dockerfile');

const checks = [
  ['bridge legacy usa credenciales solo por env', /CONAPE_PORTAL_USERNAME/.test(server) && /CONAPE_PORTAL_PASSWORD/.test(server) && !/Tigrina|402110915/.test(server)],
  ['C3.7 usa credenciales solo por env', /CONAPE_PORTAL_USERNAME/.test(server37) && /CONAPE_PORTAL_PASSWORD/.test(server37) && !/Tigrina|402110915/.test(server37)],
  ['C3.7 valida sesión Campus antes de conectar', /authorizeCampusSession/.test(server37) && /fn:'validarSesion'/.test(server37) && /ROLE_ALLOW/.test(server37)],
  ['C3.7 separa session connect/status de recruit', /\/v1\/session\/connect/.test(server37) && /\/v1\/session\/status/.test(server37) && /\/v1\/recruit\/preview/.test(server37)],
  ['C3.7 mantiene navegador persistente', /ConapeSession/.test(server37) && /state:'DISCONNECTED'/.test(server37) && /KEEPALIVE_MS/.test(server37)],
  ['C3.7 login acepta home autenticado', /PROSPECTACION RECLUTADOR/.test(server37) && /authenticated:!password/.test(server37)],
  ['C3.7 prepara PROSPECTO por ruta directa con fallbacks', /\/prospecto/.test(server37) && /f\?p=302:2/.test(server37) && /clickRecruit/.test(server37)],
  ['C3.7 vuelve a validar acceso al prospecto', /fn:'getProspectoDetalle'/.test(server37) && /PROSPECT_ACCESS_DENIED/.test(server37)],
  ['C3.7 exige financiamiento CONAPE', /PROSPECT_NOT_CONAPE/.test(server37)],
  ['identidad prohibida en submit C3.7', /IDENTITY_FIELDS_FORBIDDEN/.test(server37) && /P2_PRS_NOMBRE/.test(server37)],
  ['solo contactos se escriben antes de CREATE C3.7', /P2_PRS_CELULAR/.test(server37) && /P2_PRS_EMAIL/.test(server37) && /fillContacts/.test(server37)],
  ['source_version one-shot C3.7', /source\.consumed=true/.test(server37) && /SOURCE_VERSION_USED/.test(server37)],
  ['CREATE único y resultado incierto fail closed C3.7', /createCount!==1/.test(server37) && /WRITE_RESULT_UNCERTAIN/.test(server37)],
  ['estado raw se relee de CONAPE', /readEstadoAfterCreate/.test(server37) && /estado_conape_raw/.test(server37)],
  ['logs declaran pii false', /pii:false/.test(server37)],
  ['Docker ejecuta server C3.7', /COPY server_c3_7\.mjs/.test(docker) && /CMD \["node", "server_c3_7\.mjs"\]/.test(docker)],
  ['Ventas no carga shim loopback', !/conape_local_bridge_shim_c3_5/.test(ventas)],
  ['Prematrículas queda fuera del bundle Ventas', !/ventas_prematriculas/.test(ventas)],
  ['cliente bridge carga después de módulos CONAPE', ventas.indexOf('ventas_conape_reclutar_row_c3_5') < ventas.indexOf('conape_bridge_client_c3_6')],
  ['config live apunta al bridge Railway HTTPS', /https:\/\/conape-bridge-production\.up\.railway\.app/.test(config)],
  ['cliente C3.7 envía token Campus y no credencial CONAPE', /getSessionToken/.test(client) && !/CONAPE_PORTAL_PASSWORD|CONAPE_PORTAL_USERNAME/.test(client)],
  ['cliente expone session manager C3.7', /CONAPE_PORTAL_BRIDGE_C37/.test(client) && /sessionStatus/.test(client) && /connect/.test(client) && /disconnect/.test(client)],
  ['compatibilidad botón fila conserva namespace C36', /CONAPE_PORTAL_BRIDGE_C36 = api/.test(client)],
  ['UI de conexión es mínima', /¿Conectar CONAPE en línea\?/.test(sessionUi) && /Conectando\.\./.test(sessionUi) && /progress-pct/.test(sessionUi) && /progress-fill/.test(sessionUi)],
  ['UI de conexión no explica credenciales', !/usuario y la contraseña|contraseña no se muestran|credenciales CONAPE/.test(sessionUi)],
  ['UI no contiene credenciales CONAPE', !/CONAPE_PORTAL_PASSWORD|CONAPE_PORTAL_USERNAME/.test(sessionUi)],
  ['comparación carga identidad Campus', /campusIdentity/.test(compareUi) && /apellido_1:identity\.apellido_1/.test(compareUi) && /nombre:identity\.nombre/.test(compareUi)],
  ['identidad visual se compara Campus-CONAPE', /state:cmp\(campus\.apellido_1,conape\.apellido_1,key\)/.test(compareUi) && /state:cmp\(campus\.nombre,conape\.nombre,key\)/.test(compareUi)],
  ['comparador C3.7.1 expone namespace estable', /conapeRecruitBuildComparisonC371=buildComparison/.test(compareUi)],
  ['botón por fila prefiere comparador estable', /conapeRecruitBuildComparisonC371 \|\| window\.conapeRecruitBuildComparisonC33/.test(row) && /const buildComparison = comparisonBuilder\(\)/.test(row)],
  ['override visual no agrega identidad al payload', !/payload:\{[^}]*apellido_1/s.test(compareUi) && !/payload:\{[^}]*nombre:/s.test(compareUi)],
  ['override visual carga antes del botón por fila', ventas.indexOf('conape_compare_ui_c3_7_1.js') < ventas.indexOf('ventas_conape_reclutar_row_c3_5.jsx')],
  ['UI se carga antes del dashboard', ventas.indexOf('conape_session_ui_c3_7.js') < ventas.indexOf('ventas_dashboard.jsx')],
  ['cache bust C3.7.2 aplicado', /conape_compare_ui_c3_7_1\.js\?v=C3\.7\.2/.test(ventas) && /ventas_conape_reclutar_row_c3_5\.jsx\?v=C3\.7\.2/.test(ventas)],
  ['botón CONAPE está por fila', /ConapeRecruitRowButtonC35/.test(row) && /<th>CONAPE<\/th><th>Acción<\/th>/.test(table)],
  ['Etapa prioriza estado CONAPE raw', /estado_conape_raw/.test(table)],
];

let failed = 0;
for (const [name, ok] of checks) {
  if (ok) console.log(`PASS: ${name}`);
  else { console.error(`FAIL: ${name}`); failed += 1; }
}
if (failed) process.exit(1);
console.log(`C3.7.2 QA PASS · ${checks.length}/${checks.length}`);
