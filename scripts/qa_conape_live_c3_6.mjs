import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const server = read('services/conape-bridge/server.mjs');
const ventas = read('ventas.html');
const client = read('src/conape_bridge_client_c3_6.js');
const config = read('src/conape_bridge_config_c3_6.js');
const row = read('src/ventas_conape_reclutar_row_c3_5.jsx');
const table = read('src/ventas_sortable_table_cs21a20.jsx');

const checks = [
  ['bridge usa credenciales solo por env', /CONAPE_PORTAL_USERNAME/.test(server) && /CONAPE_PORTAL_PASSWORD/.test(server) && !/Tigrina|402110915/.test(server)],
  ['bridge valida sesión Campus', /fn:'validarSesion'/.test(server) && /ROLE_ALLOW/.test(server)],
  ['bridge vuelve a validar acceso al prospecto', /fn:'getProspectoDetalle'/.test(server) && /PROSPECT_ACCESS_DENIED/.test(server)],
  ['bridge exige financiamiento CONAPE', /PROSPECT_NOT_CONAPE/.test(server)],
  ['identidad prohibida en submit', /IDENTITY_FIELDS_FORBIDDEN/.test(server) && /P2_PRS_NOMBRE/.test(server)],
  ['solo contactos se escriben antes de CREATE', /P2_PRS_CELULAR/.test(server) && /P2_PRS_EMAIL/.test(server) && /fillContacts/.test(server)],
  ['source_version one-shot', /source\.consumed = true/.test(server) && /SOURCE_VERSION_USED/.test(server)],
  ['CREATE único y resultado incierto fail closed', /createCount !== 1/.test(server) && /WRITE_RESULT_UNCERTAIN/.test(server)],
  ['estado raw se relee de CONAPE', /readEstadoAfterCreate/.test(server) && /estado_conape_raw/.test(server)],
  ['logs declaran pii false', /pii:false/.test(server)],
  ['Ventas no carga shim loopback', !/conape_local_bridge_shim_c3_5/.test(ventas)],
  ['Prematrículas queda fuera del bundle Ventas', !/ventas_prematriculas/.test(ventas)],
  ['cliente bridge carga después de módulos CONAPE', ventas.indexOf('ventas_conape_reclutar_row_c3_5') < ventas.indexOf('conape_bridge_client_c3_6')],
  ['config live apunta al bridge Railway HTTPS', /https:\/\/conape-bridge-production\.up\.railway\.app/.test(config)],
  ['cliente envía token Campus al bridge y no credencial CONAPE', /getSessionToken/.test(client) && !/CONAPE_PORTAL_PASSWORD|CONAPE_PORTAL_USERNAME/.test(client)],
  ['fila CONAPE falla cerrado si cliente bridge no está activo', /CONAPE_BRIDGE_C36_ACTIVE\s*!==\s*true/.test(row)],
  ['modal no se descarta durante sending', /const canClose = state !== 'sending'/.test(row) && /disabled=\{!canClose\}/.test(row) && /requestClose/.test(row)],
  ['resultado incierto queda terminal y no vuelve a ready', /WRITE_RESULT_UNCERTAIN/.test(row) && /setState\('uncertain'\)/.test(row) && /state === 'uncertain' \? 'No repetir'/.test(row)],
  ['submit fallido no rehabilita la misma preview', /setState\('submit_error'\)/.test(row) && !/catch \(e\) \{[\s\S]{0,160}setState\('ready'\)/.test(row)],
  ['reclutado confirmado oculta Reclutar aunque estado raw venga vacío', /p\?\.conape_reclutado === true/.test(row) && /conape_reclutado:true/.test(row)],
  ['botón CONAPE está por fila', /ConapeRecruitRowButtonC35/.test(row) && /<th>CONAPE<\/th><th>Acción<\/th>/.test(table)],
  ['Etapa prioriza estado CONAPE raw', /estado_conape_raw/.test(table)],
];

let failed = 0;
for (const [name, ok] of checks) {
  if (ok) console.log(`PASS: ${name}`);
  else { console.error(`FAIL: ${name}`); failed += 1; }
}
if (failed) process.exit(1);
console.log(`C3.6 QA PASS · ${checks.length}/${checks.length}`);