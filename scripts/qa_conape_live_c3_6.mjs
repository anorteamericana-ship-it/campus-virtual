import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const server = read('services/conape-bridge/server.mjs');
const server37 = read('services/conape-bridge/server_c3_7.mjs');
const server373 = read('services/conape-bridge/server_c3_7_3.mjs');
const server374 = read('services/conape-bridge/server_c3_7_4.mjs');
const server375 = read('services/conape-bridge/server_c3_7_5.mjs');
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
  ['C3.7 vuelve a validar acceso al prospecto', /fn:'getProspectoDetalle'/.test(server37) && /PROSPECT_ACCESS_DENIED/.test(server37)],
  ['C3.7 exige financiamiento CONAPE', /PROSPECT_NOT_CONAPE/.test(server37)],
  ['identidad prohibida en submit', /IDENTITY_FIELDS_FORBIDDEN/.test(server37) && /P2_PRS_NOMBRE/.test(server37)],
  ['source_version one-shot', /source\.consumed=true/.test(server37) && /SOURCE_VERSION_USED/.test(server37)],
  ['C3.7.3 conserva timeout Campus ampliado', /CAMPUS_REQUEST_TIMEOUT_MS/.test(server373) && /Number\(ms\) === 30000/.test(server373)],
  ['C3.7.4 fijó correo existente como inmutable', /update_correo:!conapeMail&&!!mail/.test(server374) && /preserve_existing_conape_email:true/.test(server374)],
  ['C3.7.6 conserva correo CONAPE y solo valida correo Campus si hace falta', /update_correo:!conapeMail&&!!mail/.test(server375) && /if\(!conapeMail&&!validEmail\(mail\)\)/.test(server375)],
  ['C3.7.6 setter teléfono replica E4 con input/change/blur', /P2_PRS_CELULAR/.test(server375) && /new Event\('change'/.test(server375) && /el\.focus\(\); el\.blur\(\)/.test(server375)],
  ['C3.7.6 usa click real Playwright en Crear nuevo Prospecto', /getByRole\('button',\{name:\/crear nuevo prospecto\/i\}\)/.test(server375) && /await button\.click/.test(server375)],
  ['C3.7.6 observa request y response CREATE', /p\.on\('request',onRequest\)/.test(server375) && /p\.on\('response',onResponse\)/.test(server375) && /apex_http_status/.test(server375)],
  ['C3.7.6 invalid después del click es solo telemetría', /invalid_after_click_telemetry_only:true/.test(server375) && !/error_message:.*invalid\.length/s.test(server375)],
  ['C3.7.6 éxito tiene precedencia', /if\(outcome\.success_message\)\{ConapeSession/.test(server375) && /if\(outcome\.server_error_message\)throw/.test(server375)],
  ['C3.7.6 exige una sola solicitud CREATE', /created\.createCount!==1/.test(server375) && /WRITE_RESULT_UNCERTAIN/.test(server375)],
  ['C3.7.6 verifica creación contra reporte como fallback', /verify_created_in_report:true/.test(server375) && /readEstadoAfterCreate/.test(server375) && /if\(!estado\)throw new AppError\('WRITE_RESULT_UNCERTAIN'/.test(server375)],
  ['C3.7.6 telemetría no emite PII ni secretos', /conape_create_telemetry/.test(server375) && /visible_alerts/.test(server375) && /pii:false/.test(server375) && !/Tigrina|402110915/.test(server375)],
  ['Docker sigue ejecutando wrapper versionado', /COPY server_c3_7_5\.mjs/.test(docker) && /CMD \["node", "server_c3_7_5\.mjs"\]/.test(docker)],
  ['Ventas no carga shim loopback', !/conape_local_bridge_shim_c3_5/.test(ventas)],
  ['Prematrículas queda fuera del bundle Ventas', !/ventas_prematriculas/.test(ventas)],
  ['config live apunta Railway HTTPS', /https:\/\/conape-bridge-production\.up\.railway\.app/.test(config)],
  ['cliente no recibe credenciales CONAPE', /getSessionToken/.test(client) && !/CONAPE_PORTAL_PASSWORD|CONAPE_PORTAL_USERNAME/.test(client)],
  ['UI conexión es mínima', /¿Conectar CONAPE en línea\?/.test(sessionUi) && /Conectando\.\./.test(sessionUi) && /progress-pct/.test(sessionUi)],
  ['comparación carga identidad Campus', /campusIdentity/.test(compareUi) && /apellido_1:identity\.apellido_1/.test(compareUi) && /nombre:identity\.nombre/.test(compareUi)],
  ['correo diferente conserva CONAPE y Campus queda alterno', /preserveExisting/.test(compareUi) && /Conservar CONAPE · Campus queda alterno/.test(compareUi) && /update_correo:!conape\.correo&&!!campus\.correo/.test(compareUi)],
  ['botón por fila usa comparador estable', /conapeRecruitBuildComparisonC371 \|\| window\.conapeRecruitBuildComparisonC33/.test(row)],
  ['cache bust C3.7.5 aplicado', /conape_compare_ui_c3_7_1\.js\?v=C3\.7\.5/.test(ventas) && /ventas_conape_reclutar_row_c3_5\.jsx\?v=C3\.7\.5/.test(ventas)],
  ['botón CONAPE está por fila', /ConapeRecruitRowButtonC35/.test(row) && /<th>CONAPE<\/th><th>Acción<\/th>/.test(table)],
  ['Etapa prioriza estado CONAPE raw', /estado_conape_raw/.test(table)],
];

let failed = 0;
for (const [name, ok] of checks) {
  if (ok) console.log(`PASS: ${name}`);
  else { console.error(`FAIL: ${name}`); failed += 1; }
}
if (failed) process.exit(1);
console.log(`C3.7.6 QA PASS · ${checks.length}/${checks.length}`);
