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
const formModeStart = server.indexOf('async function readFormMode');
const formModeEnd = server.indexOf('function deriveCampusIdentity', formModeStart);
const formModeBlock = formModeStart >= 0 && formModeEnd > formModeStart ? server.slice(formModeStart, formModeEnd) : '';
const formStateStart = server.indexOf('async function readFormState');
const formStateEnd = server.indexOf('async function lookupCedulaOnPage', formStateStart);
const formStateBlock = formStateStart >= 0 && formStateEnd > formStateStart ? server.slice(formStateStart, formStateEnd) : '';
const createStart = server.indexOf('async function clickCreateOnce');
const createEnd = server.indexOf('async function countIrFilters', createStart);
const createBlock = createStart >= 0 && createEnd > createStart ? server.slice(createStart, createEnd) : '';
const executeStart = server.indexOf('async function execute(body) {');
const executeEnd = server.indexOf('function corsHeaders', executeStart);
const executeBlock = executeStart >= 0 && executeEnd > executeStart ? server.slice(executeStart, executeEnd) : '';
const executeTelemetryStart = executeBlock.indexOf("event:'conape_execute_telemetry'");
const executeTelemetryEnd = executeBlock.indexOf('}));', executeTelemetryStart);
const executeTelemetryBlock = executeTelemetryStart >= 0 && executeTelemetryEnd > executeTelemetryStart ? executeBlock.slice(executeTelemetryStart, executeTelemetryEnd) : '';

const legacyCopies = [
  'server.mjs','start_c3_6_2.mjs','server_c3_7.mjs','server_c3_7_3.mjs','server_c3_7_4.mjs',
  'server_c3_7_5.mjs','server_c3_7_7.mjs','server_c3_7_8.mjs','server_c3_7_9.mjs',
];
const listFields = ['cedula','apellido_1','apellido_2','nombre','telefono','correo','estado','fecha_estado','fecha_registro','usuario_registro','aprobacion','formalizacion','ultimo_desembolso','proximo_desembolso'];
const safeAlertCategories = ['YA_REGISTRADO','CAMPO_OBLIGATORIO','DATO_INVALIDO','SIN_PERMISO','ERROR_DE_PORTAL','ALERTA_NO_CLASIFICADA'];

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
  ['V4.1.6 captura alerts_before antes del click CREATE', createBlock.indexOf('const before = await readFormState(p);') >= 0 && createBlock.indexOf('const before = await readFormState(p);') < createBlock.indexOf('clickVisibleByLabel(p, /CREAR NUEVO PROSPECTO/i)') && /alerts_before:before\.categories \|\| \[\]/.test(createBlock)],
  ['V4.1.6 clasifica alertas solo a categorías permitidas', safeAlertCategories.every(v => formStateBlock.includes(`'${v}'`)) && /categories\.push/.test(formStateBlock)],
  ['V4.1.6 obtiene alert_dom_ids solo de id/clases e apex_error_item_ids solo de ids', /node\.id/.test(formStateBlock) && /node\.classList/.test(formStateBlock) && /alert_dom_ids:alertDomIds/.test(formStateBlock) && /document\.querySelectorAll\('\.apex-page-item-error'\)/.test(formStateBlock) && /apex_error_item_ids:apexErrorItemIds/.test(formStateBlock)],
  ['conape_execute_telemetry emite los cuatro arrays de alertas', /alerts_before:created\?\.alerts_before \|\| \[\]/.test(executeTelemetryBlock) && /visible_alerts:created\?\.outcome\?\.categories \|\| \[\]/.test(executeTelemetryBlock) && /alert_dom_ids:created\?\.outcome\?\.alert_dom_ids \|\| \[\]/.test(executeTelemetryBlock) && /apex_error_item_ids:created\?\.outcome\?\.apex_error_item_ids \|\| \[\]/.test(executeTelemetryBlock)],
  ['arrays de alertas no emiten texto libre de CONAPE', !/(textContent|innerText|innerHTML|outerHTML|alert_text|alert_message|message\s*:)/.test(executeTelemetryBlock) && /safeToken/.test(formStateBlock) && /\.slice\(0,40\)/.test(formStateBlock)],
  ['execute mide total y tramos campus/form/lookup/fill/create/confirmation', /event:'conape_execute_telemetry'/.test(server) && ['ms_total','ms_campus','ms_form','ms_lookup','ms_fill','ms_create','ms_confirmation'].every(v => server.includes(v))],
  ['confirmación CREATE depende de existencia y no de estado concreto', /found:scanned\.found/.test(confirmBlock) && /if \(confirmation\.found\)/.test(server) && !/\bREGISTRO\b/.test(confirmBlock) && !/confirmation\.registro|confirmation_registro/.test(server)],
  ['telemetría de confirmación reporta existencia y estado informativo', /confirmation_found/.test(server) && /confirmation_estado:upper\(confirmation\?\.estado \|\| ''\)/.test(server) && !/confirmation_registro/.test(server)],
  ['confirmación IR usa reset determinista por URL RIR', /confirmationResetUrl/.test(server) && /:::RIR:/.test(server) && /ir_reset_method:'URL_RIR'/.test(confirmBlock) && /waitForApexDynamicAction/.test(confirmBlock) && !/resetInteractiveReport\(p\)/.test(confirmBlock)],
  ['confirmación usa lector mínimo CEDULA separado del esquema estricto de prospects/list', /readConfirmationProspectPage/.test(server) && /scanConfirmationPagesForCedula/.test(server) && /clickConfirmationNextPage/.test(server) && /pages_scanned/.test(server) && /rows_scanned/.test(server) && !/readProspectListPage\(p\)/.test(confirmBlock)],
  ['telemetría confirmación incluye filtros antes/después, reset, páginas y filas', ['ir_filters_before','ir_filters_after','ir_reset_method','pages_scanned','rows_scanned','ms_confirmation'].every(v => server.includes(v))],
  ['modo formulario distingue CREATE/UPDATE/UNKNOWN por botones visibles', /CREAR NUEVO PROSPECTO/.test(formModeBlock) && /APLICAR CAMBIOS/.test(formModeBlock) && /hasCreate \? 'CREATE' : \(hasUpdate \? 'UPDATE' : 'UNKNOWN'\)/.test(formModeBlock)],
  ['UPDATE corta en LOOKUP antes de fill y CREATE', /ALREADY_RECRUITED/.test(server) && /new AppError\('ALREADY_RECRUITED'.*409, 'LOOKUP'\)/s.test(server) && executeBlock.indexOf('enforceRecruitFormMode') >= 0 && executeBlock.indexOf('enforceRecruitFormMode') < executeBlock.indexOf('fillContacts') && executeBlock.indexOf('enforceRecruitFormMode') < executeBlock.indexOf('clickCreateOnce')],
  ['UNKNOWN falla cerrado sin CREATE', /FORM_MODE_UNKNOWN/.test(server) && /new AppError\('FORM_MODE_UNKNOWN'.*409, 'LOOKUP'\)/s.test(server)],
  ['post-CREATE confirma primero por modo UPDATE y deja Home de fallback', /async function confirmAfterCreate/.test(server) && /confirmation_method:'FORM_MODE_UPDATE'/.test(server) && /confirmation_method:'HOME_FALLBACK'/.test(server) && executeBlock.includes('confirmAfterCreate(auth.cedula, meta.sessionId)')],
  ['telemetría segura incluye form_mode y readonly por campo', ['form_mode','form_readonly_fields','confirmation_method','confirmation_form_mode','confirmation_readonly_fields'].every(v => server.includes(v)) && /readonly:field\?\.readonly === true/.test(server)],
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
console.log(`CONAPE Bridge V4.1.6 QA PASS · ${checks.length}/${checks.length}`);