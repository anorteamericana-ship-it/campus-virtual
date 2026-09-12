import fs from 'node:fs';

const server = fs.readFileSync('services/conape-bridge/server_v2.mjs','utf8');
const docker = fs.readFileSync('services/conape-bridge/Dockerfile','utf8');
const railway = JSON.parse(fs.readFileSync('services/conape-bridge/railway.json','utf8'));
const connectStart = server.indexOf('  async connect() {');
const statusStart = server.indexOf('  async status() {', connectStart);
const connectBlock = connectStart >= 0 && statusStart > connectStart ? server.slice(connectStart, statusStart) : '';
const listReadStart = server.indexOf('async function readProspectListPage');
const listEnd = server.indexOf('function categoryStatus', listReadStart);
const listBlock = listReadStart >= 0 && listEnd > listReadStart ? server.slice(listReadStart, listEnd) : '';
const listTelemetryMatches = server.match(/event:'conape_list_dump'/g) || [];
const confirmStart = server.indexOf('async function confirmInHome');
const confirmEnd = server.indexOf('async function readProspectListPage', confirmStart);
const confirmBlock = confirmStart >= 0 && confirmEnd > confirmStart ? server.slice(confirmStart, confirmEnd) : '';

const legacyCopies = [
  'server.mjs','start_c3_6_2.mjs','server_c3_7.mjs','server_c3_7_3.mjs','server_c3_7_4.mjs',
  'server_c3_7_5.mjs','server_c3_7_7.mjs','server_c3_7_8.mjs','server_c3_7_9.mjs',
];
const listFields = ['cedula','apellido_1','apellido_2','nombre','telefono','correo','estado','fecha_estado','fecha_registro','usuario_registro','aprobacion','formalizacion','ultimo_desembolso','proximo_desembolso'];

const checks = [
  ['runtime canónico es autocontenido y no compone wrappers C3.7.x', !/replaceBlock|server_c3_7_|_runtime\.mjs|buildOnlyUrl/.test(server)],
  ['expone execute y conserva endpoints legacy durante transición', ['/v1/session/status','/v1/session/connect','/v1/session/disconnect','/v1/recruit/preview','/v1/recruit/submit','/v1/recruit/execute'].every(v => server.includes(v))],
  ['usa credenciales CONAPE solo desde env', /CONAPE_PORTAL_USERNAME/.test(server) && /CONAPE_PORTAL_PASSWORD/.test(server) && !/Tigrina|password\s*=\s*['"][^'"]+['"]/i.test(server)],
  ['revalida sesión Campus y rol', /authorizeCampusSession/.test(server) && /fn:'validarSesion'/.test(server) && /ROLE_ALLOW/.test(server)],
  ['revalida acceso y financiamiento del prospecto', /fn:'getProspectoDetalle'/.test(server) && /PROSPECT_CEDULA_MISMATCH/.test(server) && /PROSPECT_NOT_CONAPE/.test(server)],
  ['execute hace validarSesion + getProspectoDetalle en paralelo', /authorizeCampusParallel/.test(server) && /Promise\.all\(\[/.test(server) && /cachedSessionValidation\(cleanToken\)/.test(server) && /campusCall\(\{ fn:'getProspectoDetalle'/.test(server)],
  ['validarSesion tiene caché de 30 segundos por token hasheado', /SESSION_CACHE_TTL_MS = 30_000/.test(server) && /sessionValidationCache/.test(server) && /const key = sha\(cleanToken\)/.test(server)],
  ['campusCall conserva telemetría segura V2.0.2', /event:'campus_call'/.test(server) && /body_starts_with_angle/.test(server) && /json_parsed/.test(server) && /pii:false/.test(server)],
  ['session/connect solo autentica y no prepara Prospectos', /const s = await this\.login\(p\);/.test(connectBlock) && /this\.state = 'CONNECTED'/.test(connectBlock) && !/freshProspectoFromHome|formReady|RECLUTAR PROSPECTOS/.test(connectBlock)],
  ['preview/submit legacy siguen abriendo formulario fresco', /freshProspectoFromHome/.test(server) && /lookupCedulaOnFreshPage/.test(server)],
  ['execute separa formulario fresco y lookup único', /const \{ p, meta \} = await ConapeSession\.freshProspectoFromHome\(\)/.test(server) && /const state = await lookupCedulaOnPage\(p, auth\.cedula\)/.test(server)],
  ['contexto Evento/Prospectador es telemetría y no gate', /event:'conape_prospecto_context'/.test(server) && /gate:false/.test(server) && !/CONAPE_PROSPECTO_CONTEXT_NOT_READY/.test(server)],
  ['click Reclutar y CREATE terminan en locator.click real', /items\.nth\(index\)\.click\(\{ timeout:15_000 \}\)/.test(server) && /clickVisibleByLabel\(p, \/CREAR NUEVO PROSPECTO\/i/.test(server)],
  ['lookup conserva setter nativo para cédula; contactos usan Playwright fill con fallback apex.item.setValue', /nativeSetValue\(p, 'P2_PRS_CEDULA'/.test(server) && /locator\.fill\(target/.test(server) && /window\.apex\?\.item\?\.\(fieldId\)/.test(server) && /item\.setValue\(fieldValue\)/.test(server)],
  ['contactos esperan APEX y exigen relectura antes de CREATE', /waitForApexDynamicAction/.test(server) && /readContactFieldState/.test(server) && /CONTACT_WRITE_FAILED/.test(server) && /'FILL'/.test(server) && /fill_match:false/.test(server)],
  ['gate previo a CREATE falla cerrado con IDs vacíos sin valores', /FORM_INCOMPLETE_BEFORE_CREATE/.test(server) && /error\.empty_field_ids = missing/.test(server) && /await assertPreCreateFields\(p\)/.test(server)],
  ['telemetría de fill no contiene valores y reporta intentos, verificaciones, método y longitudes', ['fill_attempted_fields','fill_verified_fields','fill_methods','fill_target_len','fill_readback_len','fill_match','form_incomplete_ids'].every(v => server.includes(v))],
  ['execute bloquea mismatch de identidad antes de CREATE', /IDENTITY_MISMATCH/.test(server) && /assertIdentityMatch\(comparison\)/.test(server) && /'BEFORE_CREATE'/.test(server)],
  ['runtime nunca escribe nombre/apellidos en DOM', !/nativeSetValue\(p, ['"]P2_PRS_(?:NOMBRE|APELLIDO_1|APELLIDO_2)/.test(server)],
  ['correo CONAPE existente siempre gana', /correo:conapeMail \|\| campusMail/.test(server) && /update_correo:!conapeMail && !!campusMail/.test(server)],
  ['teléfono Campus queda normalizado a 8 dígitos', /d\.length === 11 && d\.startsWith\('506'\)/.test(server) && /return d\.slice\(-8\)/.test(server)],
  ['legacy source_version mantiene contrato one-shot mientras preview/submit existan', /source\.consumed = true/.test(server) && /SOURCE_VERSION_USED/.test(server) && /SOURCE_VERSION_EXPIRED/.test(server) && /SOURCE_VERSION_OWNER_MISMATCH/.test(server)],
  ['CREATE exige exactamente una request y nunca se dispara con formulario incompleto', /created\.createCount !== 1/.test(server) && /WRITE_RESULT_UNCERTAIN/.test(server) && /FORM_INCOMPLETE_BEFORE_CREATE/.test(server)],
  ['HTTP APEX es solo telemetría y no criterio 200/302', /apex_http_status/.test(server) && !/apex_http_status\s*[!=]==?\s*(?:200|302)|status\(\)\s*[!=]==?\s*(?:200|302)/.test(server)],
  ['telemetría segura incluye body keys e IDs, no valores', /create_body_keys/.test(server) && /page_item_ids/.test(server) && /safeBodyKeys/.test(server) && /pii:false/.test(server)],
  ['execute mide total y tramos campus/form/lookup/fill/create', /event:'conape_execute_telemetry'/.test(server) && ['ms_total','ms_campus','ms_form','ms_lookup','ms_fill','ms_create'].every(v => server.includes(v))],
  ['confirmación CREATE depende de existencia y no de estado concreto', /return \{ found:true, estado \}/.test(confirmBlock) && /if \(confirmation\.found\)/.test(server) && !/\bREGISTRO\b/.test(confirmBlock) && !/confirmation\.registro|confirmation_registro/.test(server)],
  ['telemetría de confirmación reporta existencia y estado informativo', /confirmation_found/.test(server) && /confirmation_estado:upper\(confirmation\?\.estado \|\| ''\)/.test(server) && !/confirmation_registro/.test(server)],
  ['health identifica runtime y commit Railway', /version:VERSION/.test(server) && /RAILWAY_GIT_COMMIT_SHA/.test(server) && /started_at:STARTED_AT/.test(server)],
  ['logs operativos declaran pii:false', /console\.log\(JSON\.stringify\(\{ rid, action/.test(server) && /pii:false/.test(server)],
  ['self-test NAV está protegido por sesión Campus y no usa cédula/CREATE', /\/v1\/selftest\/nav/.test(server) && /authorizeCampusSession\(campusTokenFromRequest\(req\)\)/.test(server) && /runNavSelftest/.test(server) && /login:'FAIL'/.test(server) && /recruit_click:'FAIL'/.test(server) && /form_ready:'FAIL'/.test(server)],
  ['prospects/list es GET y exige la misma sesión Campus', /req\.method === 'GET' && url\.pathname === '\/v1\/prospects\/list'/.test(server) && /action = 'prospects_list'/.test(server) && /authorizeCampusSession\(campusTokenFromRequest\(req\)\)/.test(server)],
  ['prospects/list expone exactamente las 14 columnas contractuales', listFields.every(field => listBlock.includes(`'${field}'`)) && /PROSPECT_LIST_READY/.test(listBlock)],
  ['prospects/list reutiliza Home con sesión APEX, maximiza Rows y pagina', /CONAPE_FRIENDLY_HOME/.test(listBlock) && /urlWithSession/.test(listBlock) && /maximizeProspectRows/.test(listBlock) && /clickProspectNextPage/.test(listBlock)],
  ['prospects/list es solo lectura y nunca entra al CREATE', !!listBlock && !/clickCreateOnce|fillContacts|nativeSetValue|CREAR NUEVO PROSPECTO|\/v1\/recruit\/execute/.test(listBlock)],
  ['prospects/list falla cerrado si no reconoce el esquema', /CONAPE_LIST_SCHEMA_NOT_READY/.test(listBlock) && /REQUIRED_COLUMN_MISSING/.test(listBlock)],
  ['prospects/list telemetría tiene solo métricas agregadas', listTelemetryMatches.length === 1 && /console\.log\(JSON\.stringify\(\{ event:'conape_list_dump', rows:rowsByCedula\.size, pages, ms:Date\.now\(\)-started, pii:false \}\)\)/.test(listBlock)],
  ['Docker contiene solo server_v2 + self-test', /COPY server_v2\.mjs/.test(docker) && /COPY nav_selftest\.mjs/.test(docker) && legacyCopies.every(name => !docker.includes(`COPY ${name} ./`))],
  ['Docker arranca server_v2 canónico', /CMD \["node", "server_v2\.mjs"\]/.test(docker)],
  ['Railway fija startCommand canónico', railway?.deploy?.startCommand === 'node server_v2.mjs'],
];

let failed = 0;
for (const [name, ok] of checks) {
  if (ok) console.log(`PASS: ${name}`);
  else { console.error(`FAIL: ${name}`); failed += 1; }
}
if (failed) process.exit(1);
console.log(`CONAPE Bridge V4.1.2 QA PASS · ${checks.length}/${checks.length}`);
