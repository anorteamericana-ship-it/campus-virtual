import fs from 'node:fs';
import '../services/conape-bridge/conape_v444_csv.test.mjs';

const server = fs.readFileSync('services/conape-bridge/server_v2.mjs','utf8');
const docker = fs.readFileSync('services/conape-bridge/Dockerfile','utf8');
const csvV444 = fs.readFileSync('services/conape-bridge/conape_v444_csv.mjs','utf8');
const railway = JSON.parse(fs.readFileSync('services/conape-bridge/railway.json','utf8'));
const connectStart = server.indexOf('  async connect() {');
const statusStart = server.indexOf('  async status() {', connectStart);
const connectBlock = connectStart >= 0 && statusStart > connectStart ? server.slice(connectStart, statusStart) : '';
const listReadStart = server.indexOf('async function readProspectListPage');
const listEnd = server.indexOf('function categoryStatus', listReadStart);
const listBlock = listReadStart >= 0 && listEnd > listReadStart ? server.slice(listReadStart, listEnd) : '';
const eventContextStart = server.indexOf('async function readEventContextValues(p)');
const filterRowsStart = server.indexOf('async function applyProspectEventFilter(p, eventId)');
const filterRowsEnd = server.indexOf('async function resetProspectListReport(p, sessionId, eventId)', filterRowsStart);
const eventContextBlock = eventContextStart >= 0 && filterRowsStart > eventContextStart ? server.slice(eventContextStart, filterRowsStart) : '';
const filterRowsBlock = filterRowsStart >= 0 && filterRowsEnd > filterRowsStart ? server.slice(filterRowsStart, filterRowsEnd) : '';
const resetListStart = server.indexOf('async function resetProspectListReport(p, sessionId, eventId)');
const resetListEnd = server.indexOf('function prospectSnapshotFingerprint', resetListStart);
const resetListBlock = resetListStart >= 0 && resetListEnd > resetListStart ? server.slice(resetListStart, resetListEnd) : '';
const listProspectsStart = server.indexOf('async function listProspectsFromHome()');
const listProspectsEnd = server.indexOf('const SALES_STATUS_FIELDS', listProspectsStart);
const listProspectsBlock = listProspectsStart >= 0 && listProspectsEnd > listProspectsStart ? server.slice(listProspectsStart, listProspectsEnd) : '';
const listTelemetryMatches = server.match(/event:'conape_list_dump'/g) || [];
const salesStatusStart = server.indexOf('const SALES_STATUS_FIELDS');
const salesStatusEnd = server.indexOf('function categoryStatus', salesStatusStart);
const salesStatusBlock = salesStatusStart >= 0 && salesStatusEnd > salesStatusStart ? server.slice(salesStatusStart, salesStatusEnd) : '';
const confirmStart = server.indexOf('async function confirmInHome');
const confirmEnd = server.indexOf('async function readProspectListPage', confirmStart);
const confirmBlock = confirmStart >= 0 && confirmEnd > confirmStart ? server.slice(confirmStart, confirmEnd) : '';
const formModeStart = server.indexOf('async function readFormMode');
const formModeEnd = server.indexOf('function deriveCampusIdentity', formModeStart);
const formModeBlock = formModeStart >= 0 && formModeEnd > formModeStart ? server.slice(formModeStart, formModeEnd) : '';
const formStateStart = server.indexOf('async function readFormState');
const formStateEnd = server.indexOf('async function lookupCedulaOnPage', formStateStart);
const formStateBlock = formStateStart >= 0 && formStateEnd > formStateStart ? server.slice(formStateStart, formStateEnd) : '';
const createStart = server.indexOf('async function clickFinalAction');
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
const listFields = ['cedula','apellido_1','apellido_2','nombre','telefono','celular','correo','estado','fecha_estado','fecha_registro','usuario_registro','aprobacion','formalizacion','ultimo_desembolso','proximo_desembolso'];
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
  ['contexto de navegación Evento/Prospectador sigue como telemetría no bloqueante', /event:'conape_prospecto_context'/.test(server) && /gate:false/.test(server) && !/CONAPE_PROSPECTO_CONTEXT_NOT_READY/.test(server)],
  ['V4.2.7 prioriza Home -> Reclutar con click real y DIRECT_URL solo fallback', /readSignedNavigationTelemetry/.test(server) && /CONAPE_FRIENDLY_HOME/.test(server) && server.includes("clickVisibleByLabel(p, /(^| )RECLUTAR( |$)/i)") && server.includes("return finish('HOME_CLICK_RECRUIT', true)") && server.includes("return finish('DIRECT_URL', false)") && server.indexOf("return finish('HOME_CLICK_RECRUIT', true)") < server.indexOf("return finish('DIRECT_URL', false)")],
  ['V4.2.7 espera APEX idle, limita Reclutar a 6 s y vuelca Home antes del fallback', /await waitForApexDynamicAction\(p\)/.test(server) && /__conapeLabelSearchTimeoutMs = 6_000/.test(server) && /event:'conape_home_nav_debug'/.test(server) && ['url_path','frames_count','visible_button_labels','visible_link_labels','authenticated','route_ok','recruit_click_found'].every(v => server.includes(v)) && /\.slice\(0,40\)/.test(server)],
  ['V4.4.35 entra al módulo por enlace real y registra solo presencia de firma', /async function clickProspectacionModuleLink\(p\)/.test(server) && /PROSPECTACION RECLUTADOR/.test(server) && /event:'conape_module_navigation'/.test(server) && /signed_eve:moduleNav\.signed_eve === true/.test(server) && /signed_pro:moduleNav\.signed_pro === true/.test(server) && /has_cs:moduleNav\.has_cs === true/.test(server) && /const moduleNav = await clickProspectacionModuleLink\(p\)/.test(server) && !/conape_module_navigation[\s\S]{0,500}(href|p2_eve_id|p2_pro_id)/i.test(server)],
  ['V4.2.6 no escribe P2_EVE_ID/P2_PRO_ID y usa env solo para verificación', /CONAPE_EVE_ID/.test(server) && /CONAPE_PRO_ID/.test(server) && /async function observeEventContext/.test(server) && !/item\.setValue\(String\(value\), null, false\)/.test(server) && /expectedEve:CONAPE_EVE_ID/.test(server) && /expectedPro:CONAPE_PRO_ID/.test(server)],
  ['V4.2.6 deja contexto ausente en telemetría y no bloquea antes del clic', !/EVENT_CONTEXT_MISSING/.test(createBlock) && !/if \(!eventContext\.eve_id_present\)/.test(createBlock) && /const eventContext = await observeEventContext\(p\)/.test(createBlock)],
  ['V4.2.6 telemetría de contexto expone solo fuente/presencia, nunca valores', ['eve_id_source','eve_id_present','pro_id_source','pro_id_present'].every(v => executeTelemetryBlock.includes(v)) && !/CONAPE_EVE_ID|CONAPE_PRO_ID/.test(executeTelemetryBlock)],
  ['V4.2.7 telemetría de navegación expone entry path, firma y hallazgo Recruit sin checksum', ['entry_path','recruit_click_found','nav_signed_eve','nav_signed_pro','nav_has_cs','nav_eve_matches_env','nav_pro_matches_env'].every(v => executeTelemetryBlock.includes(v)) && !/\bcs\s*:|checksum/.test(executeTelemetryBlock)],
  ['acción final CREATE/UPDATE termina en locator.click real', /items\.nth\(index\)\.click\(\{ timeout:15_000 \}\)/.test(server) && /CREAR NUEVO PROSPECTO/.test(createBlock) && /APLICAR CAMBIOS/.test(createBlock) && /clickVisibleByLabel\(p, label\)/.test(createBlock)],
  ['lookup conserva setter nativo para cédula; contactos usan Playwright fill con fallback apex.item.setValue', /nativeSetValue\(p, 'P2_PRS_CEDULA'/.test(server) && /locator\.fill\(target/.test(server) && /window\.apex\?\.item\?\.\(fieldId\)/.test(server) && /item\.setValue\(fieldValue\)/.test(server)],
  ['contactos esperan APEX y exigen relectura antes de CREATE', /waitForApexDynamicAction/.test(server) && /readContactFieldState/.test(server) && /CONTACT_WRITE_FAILED/.test(server) && /'FILL'/.test(server) && /fill_match:false/.test(server)],
  ['gate previo a CREATE falla cerrado con IDs vacíos sin valores', /FORM_INCOMPLETE_BEFORE_CREATE/.test(server) && /error\.empty_field_ids = missing/.test(server) && /await assertPreCreateFields\(p\)/.test(server)],
  ['telemetría de fill no contiene valores y reporta intentos, verificaciones, método y longitudes', ['fill_attempted_fields','fill_verified_fields','fill_methods','fill_target_len','fill_readback_len','fill_match','form_incomplete_ids'].every(v => server.includes(v))],
  ['V4.2 telemetría preacción usa solo booleans/IDs y expone editabilidad/APEX legible', ['precreate_apex_values','precreate_dom_values','field_editable','skipped_fields','field_apex_readable'].every(v => executeTelemetryBlock.includes(v)) && /precreate_dom_values\[id\] = String\(el\.value/.test(server) && /precreate_apex_values\[id\] = apexValue\.trim\(\) !== ''/.test(server)],
  ['execute bloquea mismatch de identidad antes de CREATE', /IDENTITY_MISMATCH/.test(server) && /assertIdentityMatch\(comparison\)/.test(server) && /'BEFORE_CREATE'/.test(server)],
  ['runtime nunca escribe nombre/apellidos en DOM', !/nativeSetValue\(p, ['"]P2_PRS_(?:NOMBRE|APELLIDO_1|APELLIDO_2)/.test(server)],
  ['correo CONAPE existente siempre gana', /correo:conapeMail \|\| campusMail/.test(server) && /update_correo:!conapeMail && !!campusMail/.test(server)],
  ['teléfono Campus queda normalizado a 8 dígitos y se escribe siempre si es editable', /d\.length === 11 && d\.startsWith\('506'\)/.test(server) && /return d\.slice\(-8\)/.test(server) && /update_telefono:true/.test(server) && /results\.push\(await writeContactField\(p, 'P2_PRS_CELULAR'/.test(server) && /readFieldEditability/.test(server)],
  ['legacy source_version mantiene contrato one-shot mientras preview/submit existan', /source\.consumed = true/.test(server) && /SOURCE_VERSION_USED/.test(server) && /SOURCE_VERSION_EXPIRED/.test(server) && /SOURCE_VERSION_OWNER_MISMATCH/.test(server)],
  ['acción final exige exactamente una request y nunca se dispara con formulario incompleto', /created\.actionCount !== 1/.test(executeBlock) && /WRITE_RESULT_UNCERTAIN/.test(server) && /FORM_INCOMPLETE_BEFORE_CREATE/.test(server)],
  ['HTTP APEX es solo telemetría y no criterio 200/302', /apex_http_status/.test(server) && !/apex_http_status\s*[!=]==?\s*(?:200|302)|status\(\)\s*[!=]==?\s*(?:200|302)/.test(server)],
  ['telemetría segura incluye body keys e IDs, no valores', /create_body_keys/.test(server) && /page_item_ids/.test(server) && /safeBodyKeys/.test(server) && /pii:false/.test(server)],
  ['V4.2 captura alerts_before antes del click final', createBlock.indexOf('const before = await readFormState(p);') >= 0 && createBlock.indexOf('const before = await readFormState(p);') < createBlock.indexOf('clickVisibleByLabel(p, label)') && /alerts_before:before\.categories \|\| \[\]/.test(createBlock)],
  ['V4.1.6 clasifica alertas solo a categorías permitidas', safeAlertCategories.every(v => formStateBlock.includes(`'${v}'`)) && /categories\.push/.test(formStateBlock)],
  ['V4.1.6 obtiene alert_dom_ids solo de id/clases e apex_error_item_ids solo de ids', /node\.id/.test(formStateBlock) && /node\.classList/.test(formStateBlock) && /alert_dom_ids:alertDomIds/.test(formStateBlock) && /document\.querySelectorAll\('\.apex-page-item-error'\)/.test(formStateBlock) && /apex_error_item_ids:apexErrorItemIds/.test(formStateBlock)],
  ['conape_execute_telemetry emite los cuatro arrays de alertas', /alerts_before:created\?\.alerts_before \|\| \[\]/.test(executeTelemetryBlock) && /visible_alerts:created\?\.outcome\?\.categories \|\| \[\]/.test(executeTelemetryBlock) && /alert_dom_ids:created\?\.outcome\?\.alert_dom_ids \|\| \[\]/.test(executeTelemetryBlock) && /apex_error_item_ids:created\?\.outcome\?\.apex_error_item_ids \|\| \[\]/.test(executeTelemetryBlock)],
  ['arrays de alertas conservan categorías/IDs sin texto DOM crudo', !/(textContent|innerText|innerHTML|outerHTML|alert_message|message\s*:)/.test(executeTelemetryBlock) && /safeToken/.test(formStateBlock) && /\.slice\(0,40\)/.test(formStateBlock)],
  ['V4.2.3 emite alert_text_sanitized con redacción dura y máximo 200 caracteres', executeTelemetryBlock.includes("alert_text_sanitized:created?.outcome?.alert_text_sanitized || ''") && formStateBlock.includes(".replace(/\\S*@\\S*/g, '[MAIL]')") && formStateBlock.includes(".replace(/\\d{5,}/g, '[NUM]')") && formStateBlock.includes('.slice(0,200)') && !/(textContent|innerText|innerHTML|outerHTML)/.test(executeTelemetryBlock)],
  ['execute mide total y tramos campus/form/lookup/fill/create/confirmation', /event:'conape_execute_telemetry'/.test(server) && ['ms_total','ms_campus','ms_form','ms_lookup','ms_fill','ms_create','ms_confirmation'].every(v => server.includes(v))],
  ['confirmación CREATE depende de existencia y no de estado concreto', /found:scanned\.found/.test(confirmBlock) && /if \(confirmation\.found\)/.test(server) && !/\bREGISTRO\b/.test(confirmBlock) && !/confirmation\.registro|confirmation_registro/.test(server)],
  ['telemetría de confirmación reporta existencia y estado informativo', /confirmation_found/.test(server) && /confirmation_estado:upper\(confirmation\?\.estado \|\| ''\)/.test(server) && !/confirmation_registro/.test(server)],
  ['confirmación IR usa reset determinista por URL RIR', /confirmationResetUrl/.test(server) && /:::RIR:/.test(server) && /ir_reset_method:'URL_RIR'/.test(confirmBlock) && /waitForApexDynamicAction/.test(confirmBlock) && !/resetInteractiveReport\(p\)/.test(confirmBlock)],
  ['confirmación usa lector mínimo CEDULA separado del esquema estricto de prospects/list', /readConfirmationProspectPage/.test(server) && /scanConfirmationPagesForCedula/.test(server) && /clickConfirmationNextPage/.test(server) && /pages_scanned/.test(server) && /rows_scanned/.test(server) && !/readProspectListPage\(p\)/.test(confirmBlock)],
  ['telemetría confirmación incluye filtros antes/después, reset, páginas y filas', ['ir_filters_before','ir_filters_after','ir_reset_method','pages_scanned','rows_scanned','ms_confirmation'].every(v => server.includes(v))],
  ['modo formulario distingue CREATE/UPDATE/UNKNOWN por botones visibles', /CREAR NUEVO PROSPECTO/.test(formModeBlock) && /APLICAR CAMBIOS/.test(formModeBlock) && /hasCreate \? 'CREATE' : \(hasUpdate \? 'UPDATE' : 'UNKNOWN'\)/.test(formModeBlock)],
  ['UPDATE escribe contactos y pulsa Aplicar Cambios; UNKNOWN sigue fail-closed', /if \(formMode === 'UNKNOWN'\) enforceRecruitFormMode/.test(executeBlock) && /clickFinalAction\(p, formMode\)/.test(executeBlock) && /formMode === 'UPDATE' \? 'UPDATED' : 'CREATED'/.test(executeBlock) && /APLICAR CAMBIOS/.test(createBlock)],
  ['UNKNOWN falla cerrado sin CREATE', /FORM_MODE_UNKNOWN/.test(server) && /new AppError\('FORM_MODE_UNKNOWN'.*409, 'LOOKUP'\)/s.test(server)],
  ['post-CREATE confirma primero por modo UPDATE y deja Home de fallback', /async function confirmAfterCreate/.test(server) && /confirmation_method:'FORM_MODE_UPDATE'/.test(server) && /confirmation_method:'HOME_FALLBACK'/.test(server) && executeBlock.includes('confirmAfterCreate(auth.cedula, meta.sessionId)')],
  ['telemetría segura incluye form_mode y readonly por campo', ['form_mode','form_readonly_fields','confirmation_method','confirmation_form_mode','confirmation_readonly_fields'].every(v => server.includes(v)) && /readonly:field\?\.readonly === true/.test(server)],
  ['health identifica runtime y commit Railway', /version:VERSION/.test(server) && /RAILWAY_GIT_COMMIT_SHA/.test(server) && /started_at:STARTED_AT/.test(server)],
  ['logs operativos declaran pii:false', /console\.log\(JSON\.stringify\(\{ rid, action/.test(server) && /pii:false/.test(server)],
  ['self-test NAV está protegido por sesión Campus y no usa cédula/CREATE', /\/v1\/selftest\/nav/.test(server) && /authorizeCampusSession\(campusTokenFromRequest\(req\)\)/.test(server) && /runNavSelftest/.test(server) && /login:'FAIL'/.test(server) && /recruit_click:'FAIL'/.test(server) && /form_ready:'FAIL'/.test(server)],
  ['prospects/list es GET y exige la misma sesión Campus', /req\.method === 'GET' && url\.pathname === '\/v1\/prospects\/list'/.test(server) && /action = 'prospects_list'/.test(server) && /authorizeCampusSession\(campusTokenFromRequest\(req\)\)/.test(server)],
  ['prospects/list conserva contrato de 15 campos con teléfono/celular flexibles', listFields.length === 15 && listFields.every(field => listBlock.includes(`'${field}'`)) && /PROSPECT_LIST_READY/.test(listBlock)],
  ['V4.5.6 conserva 302:1 y los LOV P1 configurados sin exponer IDs', /CONAPE_REPORT_URL/.test(server) && /f\?p=302:1::::::/.test(server) && /p\.goto\(CONAPE_REPORT_URL/.test(server) && /conapeReportUrlWithSession\(reportSession\)/.test(server) && /CONAPE_REPORT_PRO_ID/.test(server) && /CONAPE_REPORT_EVE_ID/.test(server) && /P1_PRO_ID/.test(server) && /P1_EVE_ID/.test(server) && !/console\.log.*(?:P1_PRO_ID|P1_EVE_ID|CONAPE_REPORT_PRO_ID|CONAPE_REPORT_EVE_ID)/.test(listProspectsBlock)],
    ['V4.5.8 usa Popup LOV real y mide filas materializadas', /selectSingleReportLov\(p, 'P1_PRO_ID'/.test(server) && /selectSingleReportLov\(p, 'P1_EVE_ID'/.test(server) && /searchInput\.fill\(''\)/.test(server) && /selectOption\(\{ label:allText \}\)/.test(server) && /materializedRows = materialized\?\.ok/.test(server)],
    ['V4.5.8 evita setValue oculto y exige filas materializadas', /CONAPE_REPORT_EMPTY_AFTER_SEQUENCE/.test(server) && /selection_method:'POPUP_LOV_VISIBLE_TEXT'/.test(server) && !/pro\.setValue\(proId/.test(server) && !/eve\.setValue\(eveId/.test(server)],
  ['V4.4.4 CSV usa GET_DOWNLOAD_LINK + GET firmado y no persiste archivos', /GET_DOWNLOAD_LINK/.test(csvV444) && /page\.context\(\)\.request\.get\(signedLink/.test(csvV444) && /text\/csv/.test(csvV444) && /content-disposition/.test(csvV444) && !/saveAs|savePath|writeFile.*csv/i.test(csvV444)],
  ['V4.5 valida doble lectura Rows All por conteo y fingerprint', /const first = await readRowsAllSnapshot\(p\)/.test(listProspectsBlock) && /const second = await readRowsAllSnapshot\(p\)/.test(listProspectsBlock) && /rowsA = first\.rows\.length/.test(listProspectsBlock) && /rowsB = second\.rows\.length/.test(listProspectsBlock) && /first\.fingerprint === second\.fingerprint/.test(listProspectsBlock)],
  ['prospects/list nunca usa Save Report', !/SAVE REPORT|SAVE_REPORT|guardar informe|guardar reporte/i.test(listProspectsBlock)],
  ['prospects/list es solo lectura y nunca entra al CREATE', !!listProspectsBlock && !/clickCreateOnce|fillContacts|nativeSetValue|CREAR NUEVO PROSPECTO|\/v1\/recruit\/execute/.test(listProspectsBlock)],
  ['V4.5 falla cerrado si Rows All es incompleto o las lecturas divergen', ['CONAPE_REPORT_ROWS_ALL_INCOMPLETE','CONAPE_REPORT_DOUBLE_MISMATCH','CONAPE_REPORT_VERIFICATION_FAILED'].every(v => server.includes(v)) && /throw mismatch/.test(listProspectsBlock)],
  ['prospects/list telemetría solo expone método, conteos, verificación, tiempo y filtros', listTelemetryMatches.length === 1 && ['method','rows:rowsByCedula.size','columns_ok:columnsOk','verification_method:verificationMethod','ms:Date.now() - started','ir_filters_before:irFiltersBefore','pii:false'].every(v => listProspectsBlock.includes(v)) && !/console\.log.*(?:cedula|nombre|correo|telefono)/i.test(listProspectsBlock)],
  ['V4.4.7 expone conteos A/B y conserva aliases legacy sin exponer filas en summary', ['rows_a','rows_b','rows_csv','rows_html_all','counts_match','verification_method'].every(v => listProspectsBlock.includes(v)) && /rows_csv_a/.test(csvV444) && /rows_csv_b/.test(csvV444)],
  ['V4.2.9 summary=1 no devuelve filas con PII al navegador', server.includes('summaryOnly') && server.includes("url.searchParams.get('summary')") && server.includes('const payload = summaryOnly ? {')],
  ['V4.4.4 telemetría de lista conserva solo conteos y pii false', server.includes("event:'conape_list_dump'") && ['rows_csv','rows_html_all','counts_match','columns_ok','verification_method','ir_filters_before','pii:false'].every(v=>server.includes(v))],
  ['V4.3.2 contrato de lista conserva 15 columnas incluyendo teléfono y celular separados', listFields.length === 15 && listFields.includes('telefono') && listFields.includes('celular') && server.includes("['TELEFONO','telefono'],['CELULAR','celular']")],
  ['V4.4.19 tolera cabeceras mojibake observadas en CSV real sin relajar contrato', [
    "['C_DULA','cedula']",
    "['TEL_FONOCELULAR','celular']",
    "['CORREO_ELECTR_NICO','correo']",
    "['FECHA_DEESTADO','fecha_estado']",
    "['FECHA_DEREGISTRO','fecha_registro']",
    "['USUARIO_QUEREGISTR','usuario_registro']",
    "['APROBACI_N','aprobacion']",
    "['FORMALIZACI_N','formalizacion']",
    "['LTIMODESEMBOLSO','ultimo_desembolso']",
    "['PR_XIMODESEMBOLSO','proximo_desembolso']"
  ].every(v => server.includes(v)) && /prospectListMissingFields\(headers\)/.test(server)],
  ['V4.4.34 aplica Reg Eve Id con Evento dinámico y fallback env', /effectiveEventId = txt\(eventId \|\| CONAPE_EVE_ID\)/.test(filterRowsBlock) && /optionIndex\(column, 'REG EVE ID'\)/.test(filterRowsBlock) && /optionIndex\(operator, '='\)/.test(filterRowsBlock) && /expression\.fill\(effectiveEventId\)/.test(filterRowsBlock) && /CONAPE_LIST_EVENT_FILTER_EMPTY/.test(filterRowsBlock)],
  ['V4.4.36 conserva Friendly Home y limpia filtros residuales antes del filtro Evento', /openProspectListHome\(p, sessionId\)/.test(resetListBlock) && !/confirmationResetUrl\(sessionId\)/.test(resetListBlock) && /if \(filtersBefore > 0\)/.test(resetListBlock) && /resetInteractiveReport\(p\)/.test(resetListBlock) && /waitProspectListReady\(p\)/.test(resetListBlock) && /CONAPE_LIST_FILTER_RESET_FAILED/.test(resetListBlock) && /applyProspectEventFilter\(p, eventId\)/.test(resetListBlock) && /FRIENDLY_HOME_EVENT_FILTER/.test(resetListBlock) && !/prospectListResetUrl\(sessionId\)/.test(resetListBlock)],
  ['V4.5 prepara el mismo contexto Prospectador/Evento/Rows All en ambas lecturas', /ensureProspectReportContext\(p\)/.test(server) && /const first = await readRowsAllSnapshot\(p\)/.test(listProspectsBlock) && /const second = await readRowsAllSnapshot\(p\)/.test(listProspectsBlock) && /ROWS_ALL_DOUBLE/.test(listProspectsBlock)],
  ['V4.5 conserva contrato publisher HTML_DOUBLE con verificación Rows All', /const method = 'HTML_DOUBLE'/.test(listProspectsBlock) && /const verificationMethod = 'ROWS_ALL_DOUBLE'/.test(listProspectsBlock) && /addProspectRows\(rowsByCedula, second\.rows\)/.test(listProspectsBlock) && /counts_match:true/.test(listProspectsBlock)],
  ['V4.5 ruta activa no usa RIR ni exportación CSV y rehace la segunda lectura', !/downloadProspectCsv\(p\)|resetProspectListReport\(|readHtmlProspectSnapshot\(/.test(listProspectsBlock) && /await p\.reload\(\{ waitUntil:'domcontentloaded'/.test(listProspectsBlock)],
  ['V4.4.4 valida origen, ruta, PLUGIN, FILE_ID, sesión y checksum de la URL firmada', ['CSV_DOWNLOAD_LINK_ORIGIN_INVALID','CSV_DOWNLOAD_LINK_PATH_INVALID','CSV_DOWNLOAD_LINK_REQUEST_INVALID','CSV_DOWNLOAD_LINK_SESSION_INVALID','CSV_DOWNLOAD_LINK_FILE_INVALID','CSV_DOWNLOAD_LINK_CHECKSUM_INVALID'].every(v => csvV444.includes(v)) && /CONAPE_ORIGIN/.test(csvV444)],
  ['V4.4.4 runtime importa helper CSV firmado y doble verificación', /from '\.\/conape_v444_csv\.mjs'/.test(server) && /downloadProspectCsvViaDialog/.test(server) && /verifyDoubleCsv/.test(server)],
  ['V4.3.1 lista completa queda restringida a admin/superadmin', server.includes("fullListRole = roleOf(auth.session)") && server.includes("['ADMIN','ADMINISTRADOR','SUPERADMIN','SUPER ADMIN'].includes(fullListRole)")],
  ['V4.4.7 sales-status lee solo el snapshot Campus y no consulta CONAPE vivo', /\/v1\/prospects\/sales-status/.test(server) && /listProspectStatusesForSales\(body\)/.test(server) && salesStatusBlock.includes("fn:'getConapeProspectacionVentas'") && salesStatusBlock.includes("source:'CAMPUS_SNAPSHOT'") && !/listProspectsFromHome\(/.test(salesStatusBlock)],
  ['V4.4.7 sales-status minimiza campos devueltos', ['cedula','estado','fecha_estado','aprobacion','formalizacion','ultimo_desembolso','proximo_desembolso'].every(v=>salesStatusBlock.includes(`'${v}'`)) && !/nombre|apellido|correo|telefono|usuario_registro/i.test(salesStatusBlock)],
  ['V4.4.7 refresh es la única ruta POST que consulta CONAPE y publica snapshot firmado', /\/v1\/prospects\/refresh/.test(server) && /refreshProspectacionVentas\(body\)/.test(server) && /buildConapeProspectacionV2SignedEnvelope/.test(server) && /publishProspectacionSnapshot/.test(server) && /agentConapeProspectacionApplySnapshotV2/.test(fs.readFileSync('services/conape-bridge/conape_v44_publisher.mjs','utf8'))],
  ['V4.4.32 ticket inválido nunca autoriza y cae a validación Campus', /function authorizeProspectRefreshTicket\(token, ticket\)/.test(server) && /REFRESH_TICKET_PURPOSE = 'CONAPE_PROSPECTACION_REFRESH_V1'/.test(server) && /let ticketAuthorized = false/.test(server) && /authorizeProspectRefreshTicket\(body\?\.token, body\.refresh_ticket\)/.test(server) && /event:'conape_refresh_ticket_fallback'/.test(server) && /if \(!ticketAuthorized\) await authorizeCampusSessionStatus\(body\?\.token\)/.test(server) && /tokenHash !== sha\(cleanToken\)/.test(server) && /timingSafeHexEqual\(expected, signature\)/.test(server)],
  ['Docker incluye runtime canónico, helper V4.4.4 y su QA sin patcher', /COPY server_v2\.mjs/.test(docker) && /COPY nav_selftest\.mjs/.test(docker) && /COPY conape_v444_csv\.mjs/.test(docker) && /COPY conape_v444_csv\.test\.mjs/.test(docker) && /RUN node conape_v444_csv\.test\.mjs/.test(docker) && legacyCopies.every(name => !docker.includes(`COPY ${name} ./`)) && !/hotfix_v4_2_4|RUN node hotfix/i.test(docker)],
  ['Docker arranca server_v2 canónico', /CMD \["node", "server_v2\.mjs"\]/.test(docker)],
  ['Railway fija startCommand canónico', railway?.deploy?.startCommand === 'node server_v2.mjs'],
];

let failed = 0;
for (const [name, ok] of checks) {
  if (ok) console.log(`PASS: ${name}`);
  else { console.error(`FAIL: ${name}`); failed += 1; }
}
if (failed) process.exit(1);
console.log(`CONAPE Bridge V4.5.8 QA PASS · ${checks.length}/${checks.length}`);
