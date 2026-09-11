import fs from 'node:fs';

const server = fs.readFileSync('services/conape-bridge/server_v2.mjs','utf8');
const docker = fs.readFileSync('services/conape-bridge/Dockerfile','utf8');
const railway = JSON.parse(fs.readFileSync('services/conape-bridge/railway.json','utf8'));
const connectStart = server.indexOf('  async connect() {');
const statusStart = server.indexOf('  async status() {', connectStart);
const connectBlock = connectStart >= 0 && statusStart > connectStart ? server.slice(connectStart, statusStart) : '';

const legacyCopies = [
  'server.mjs','start_c3_6_2.mjs','server_c3_7.mjs','server_c3_7_3.mjs','server_c3_7_4.mjs',
  'server_c3_7_5.mjs','server_c3_7_7.mjs','server_c3_7_8.mjs','server_c3_7_9.mjs',
];

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
  ['lookup y contactos replican setter nativo + input/change/focus/blur', /Object\.getOwnPropertyDescriptor\(proto, 'value'\)/.test(server) && /new Event\('input'/.test(server) && /new Event\('change'/.test(server) && /el\.focus\(\);\s*el\.blur\(\)/.test(server)],
  ['execute bloquea mismatch de identidad antes de CREATE', /IDENTITY_MISMATCH/.test(server) && /assertIdentityMatch\(comparison\)/.test(server) && /'BEFORE_CREATE'/.test(server)],
  ['runtime nunca escribe nombre/apellidos en DOM', !/nativeSetValue\(p, ['"]P2_PRS_(?:NOMBRE|APELLIDO_1|APELLIDO_2)/.test(server)],
  ['correo CONAPE existente siempre gana', /correo:conapeMail \|\| campusMail/.test(server) && /update_correo:!conapeMail && !!campusMail/.test(server)],
  ['teléfono Campus queda normalizado a 8 dígitos', /d\.length === 11 && d\.startsWith\('506'\)/.test(server) && /return d\.slice\(-8\)/.test(server)],
  ['legacy source_version mantiene contrato one-shot mientras preview/submit existan', /source\.consumed = true/.test(server) && /SOURCE_VERSION_USED/.test(server) && /SOURCE_VERSION_EXPIRED/.test(server) && /SOURCE_VERSION_OWNER_MISMATCH/.test(server)],
  ['CREATE exige exactamente una request', /created\.createCount !== 1/.test(server) && /WRITE_RESULT_UNCERTAIN/.test(server)],
  ['HTTP APEX es solo telemetría y no criterio 200/302', /apex_http_status/.test(server) && !/apex_http_status\s*[!=]==?\s*(?:200|302)|status\(\)\s*[!=]==?\s*(?:200|302)/.test(server)],
  ['telemetría segura incluye body keys e IDs, no valores', /create_body_keys/.test(server) && /page_item_ids/.test(server) && /safeBodyKeys/.test(server) && /pii:false/.test(server)],
  ['execute mide total y tramos campus/form/lookup/fill/create', /event:'conape_execute_telemetry'/.test(server) && ['ms_total','ms_campus','ms_form','ms_lookup','ms_fill','ms_create'].every(v => server.includes(v))],
  ['resultado ambiguo verifica tabla Home antes de decidir', /readEstadoAfterCreate/.test(server) && /if \(estado\) return \{ ok:true, confirmed:true, code:'CREATED'/.test(server)],
  ['health identifica runtime y commit Railway', /version:VERSION/.test(server) && /RAILWAY_GIT_COMMIT_SHA/.test(server) && /started_at:STARTED_AT/.test(server)],
  ['logs operativos declaran pii:false', /console\.log\(JSON\.stringify\(\{ rid, action/.test(server) && /pii:false/.test(server)],
  ['self-test NAV está protegido por sesión Campus y no usa cédula/CREATE', /\/v1\/selftest\/nav/.test(server) && /authorizeCampusSession\(campusTokenFromRequest\(req\)\)/.test(server) && /runNavSelftest/.test(server) && /login:'FAIL'/.test(server) && /recruit_click:'FAIL'/.test(server) && /form_ready:'FAIL'/.test(server)],
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
console.log(`CONAPE Bridge V3 QA PASS · ${checks.length}/${checks.length}`);
