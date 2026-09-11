import fs from 'node:fs';

const server = fs.readFileSync('services/conape-bridge/server_v2.mjs','utf8');
const docker = fs.readFileSync('services/conape-bridge/Dockerfile','utf8');
const connectStart = server.indexOf('  async connect() {');
const statusStart = server.indexOf('  async status() {', connectStart);
const connectBlock = connectStart >= 0 && statusStart > connectStart ? server.slice(connectStart, statusStart) : '';

const checks = [
  ['V2 es autocontenido y no compone wrappers C3.7.x', !/replaceBlock|server_c3_7_|_runtime\.mjs|buildOnlyUrl/.test(server)],
  ['V2 expone los cinco endpoints públicos requeridos', ['/v1/session/status','/v1/session/connect','/v1/session/disconnect','/v1/recruit/preview','/v1/recruit/submit'].every(v => server.includes(v))],
  ['V2 usa credenciales CONAPE solo desde env', /CONAPE_PORTAL_USERNAME/.test(server) && /CONAPE_PORTAL_PASSWORD/.test(server) && !/Tigrina|password\s*=\s*['"][^'"]+['"]/i.test(server)],
  ['V2 revalida sesión Campus y rol', /authorizeCampusSession/.test(server) && /fn:'validarSesion'/.test(server) && /ROLE_ALLOW/.test(server)],
  ['V2 revalida acceso y financiamiento del prospecto', /fn:'getProspectoDetalle'/.test(server) && /PROSPECT_CEDULA_MISMATCH/.test(server) && /PROSPECT_NOT_CONAPE/.test(server)],
  ['session/connect solo autentica y no prepara Prospectos', /const s = await this\.login\(p\);/.test(connectBlock) && /this\.state = 'CONNECTED'/.test(connectBlock) && !/freshProspectoFromHome|formReady|RECLUTAR PROSPECTOS/.test(connectBlock)],
  ['preview y submit siempre abren formulario fresco desde Home', /freshProspectoFromHome/.test(server) && /await p\.goto\(CONAPE_HOME/.test(server) && /RECLUTAR PROSPECTOS/.test(server) && /lookupCedulaOnFreshPage/.test(server)],
  ['click Reclutar y CREATE terminan en locator.click real', /items\.nth\(index\)\.click\(\{ timeout:15_000 \}\)/.test(server) && /clickVisibleByLabel\(p, \/CREAR NUEVO PROSPECTO\/i/.test(server)],
  ['lookup y contactos replican setter nativo + input/change/focus/blur', /Object\.getOwnPropertyDescriptor\(proto, 'value'\)/.test(server) && /new Event\('input'/.test(server) && /new Event\('change'/.test(server) && /el\.focus\(\);\s*el\.blur\(\)/.test(server)],
  ['Campus nunca puede enviar identidad en submit', /IDENTITY_FIELDS_FORBIDDEN/.test(server) && ['nombre','apellido_1','apellido_2','P2_PRS_NOMBRE','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2'].every(v => server.includes(`'${v}'`))],
  ['V2 nunca escribe nombre/apellidos en DOM', !/nativeSetValue\(p, ['"]P2_PRS_(?:NOMBRE|APELLIDO_1|APELLIDO_2)/.test(server)],
  ['correo CONAPE existente siempre gana', /correo:conapeMail \|\| campusMail/.test(server) && /update_correo:!conapeMail && !!campusMail/.test(server)],
  ['teléfono Campus queda normalizado a 8 dígitos', /d\.length === 11 && d\.startsWith\('506'\)/.test(server) && /return d\.slice\(-8\)/.test(server)],
  ['source_version mantiene contrato one-shot', /source\.consumed = true/.test(server) && /SOURCE_VERSION_USED/.test(server) && /SOURCE_VERSION_EXPIRED/.test(server) && /SOURCE_VERSION_OWNER_MISMATCH/.test(server)],
  ['CREATE exige exactamente una request', /created\.createCount !== 1/.test(server) && /WRITE_RESULT_UNCERTAIN/.test(server)],
  ['HTTP APEX es solo telemetría y no criterio 200/302', /apex_http_status/.test(server) && !/apex_http_status\s*[!=]==?\s*(?:200|302)|status\(\)\s*[!=]==?\s*(?:200|302)/.test(server)],
  ['telemetría segura incluye body keys e IDs, no valores', /create_body_keys/.test(server) && /page_item_ids/.test(server) && /safeBodyKeys/.test(server) && /pii:false/.test(server)],
  ['telemetría conserva entry/page age/reuse', /entry_path/.test(server) && /session_param_present/.test(server) && /page_age_ms/.test(server) && /page_reused_from_preview/.test(server)],
  ['resultado ambiguo verifica tabla Home antes de decidir', /readEstadoAfterCreate/.test(server) && /if \(estado\) return \{ ok:true, confirmed:true, code:'CREATED'/.test(server)],
  ['health identifica runtime y commit Railway', /version:VERSION/.test(server) && /RAILWAY_GIT_COMMIT_SHA/.test(server) && /started_at:STARTED_AT/.test(server)],
  ['logs operativos declaran pii:false', /console\.log\(JSON\.stringify\(\{ rid, action/.test(server) && /pii:false/.test(server)],
  ['Docker conserva rollback legacy e incluye V2 en imagen', /COPY server_c3_7_8\.mjs/.test(docker) && /COPY server_v2\.mjs/.test(docker)],
];

let failed = 0;
for (const [name, ok] of checks) {
  if (ok) console.log(`PASS: ${name}`);
  else { console.error(`FAIL: ${name}`); failed += 1; }
}
if (failed) process.exit(1);
console.log(`CONAPE Bridge V2 QA PASS · ${checks.length}/${checks.length}`);
