import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allowedTarget, safeUrl, FIND_RECRUIT, CLICK_RECRUIT, INSPECT_FORM, pickChangedContext } from './conape_portal/discover_recruit_form_c3_3.mjs';
import { classifyClientActionSource, INSPECT_CLIENT_ACTION } from './conape_portal/discover_recruit_client_action_c3_3b.mjs';
import { classifyBoundSource, INSPECT_BOUND_HANDLERS } from './conape_portal/discover_recruit_bound_handlers_c3_3c.mjs';
import { safeBodyKeys, safeRequestToken } from './conape_portal/recruit_e4_controlled_c3_4.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const ui = read('src/ventas_conape_reclutar_c3_3.jsx');
const html = read('ventas.html');
const discovery = read('scripts/conape_portal/discover_recruit_form_c3_3.mjs');
const submitDiscovery = read('scripts/conape_portal/discover_recruit_submit_contract_c3_3.mjs');
const clientActionDiscovery = read('scripts/conape_portal/discover_recruit_client_action_c3_3b.mjs');
const boundHandlerDiscovery = read('scripts/conape_portal/discover_recruit_bound_handlers_c3_3c.mjs');
const e4Harness = read('scripts/conape_portal/recruit_e4_controlled_c3_4.mjs');
const launcher = read('scripts/conape_portal/run_conape_recruit_discovery_windows.ps1');
const submitLauncher = read('scripts/conape_portal/run_conape_recruit_submit_discovery_windows.ps1');
const clientActionLauncher = read('scripts/conape_portal/run_conape_recruit_client_action_c3_3b_windows.ps1');
const boundHandlerLauncher = read('scripts/conape_portal/run_conape_recruit_bound_handlers_c3_3c_windows.ps1');
const e4Launcher = read('scripts/conape_portal/run_conape_recruit_e4_controlled_windows.ps1');
const failures = [];
const check = (ok, msg) => ok ? console.log(`PASS C3.3: ${msg}`) : failures.push(msg);

check(ui.includes('Reclutar en CONAPE'), 'Ventas contiene botón Reclutar en CONAPE');
check(ui.includes("financing === 'CONAPE'"), 'botón queda acotado a prospectos CONAPE');
check(ui.includes('conapePortalRecruitPreview'), 'preflight usa contrato dedicado');
check(ui.includes('conapePortalRecruitSubmit'), 'submit usa contrato dedicado');
check(ui.includes('preview.can_submit !== true'), 'Enviar solicitud falla cerrado sin autorización del bridge');
check(ui.includes('preserve_existing_email'), 'correo existente CONAPE se conserva explícitamente');
check(ui.includes('correo_campus_secundario'), 'correo Campus distinto queda separado como alterno');
check(ui.includes("first(p, ['whatsapp'"), 'teléfono candidato proviene de WhatsApp Campus');
check(ui.includes(".replace(/\\D/g, '')"), 'cédula/teléfono eliminan separadores');
check(ui.includes('.slice(-8)'), 'teléfono se reduce a 8 dígitos locales');
check(!ui.includes('wwv_flow.ajax'), 'frontend Ventas no llama infraestructura APEX directamente');
check(!ui.match(/contrase(?:ña|na)\s*[:=]/i), 'frontend no contiene contraseña CONAPE');

const drawerPos = html.indexOf('src/ventas_drawer.jsx');
const recruitPos = html.indexOf('src/ventas_conape_reclutar_c3_3.jsx');
const dashboardPos = html.indexOf('src/ventas_dashboard.jsx');
check(drawerPos >= 0 && recruitPos > drawerPos && dashboardPos > recruitPos, 'módulo C3.3 envuelve drawer antes de que cargue dashboard');

check(allowedTarget('https://online.conape.go.cr/apex/f?p=302:1:123') === true, 'discovery acepta host/app CONAPE exactos');
check(allowedTarget('https://online.conape.go.cr.evil.test/apex/f?p=302:1') === false, 'discovery rechaza hostname parecido');
check(allowedTarget('https://online.conape.go.cr/apex/f?p=999:1') === false, 'discovery rechaza otra app APEX');
check(safeUrl('https://online.conape.go.cr/apex/f?p=302:1:987654321::::&session=987654321') === 'https://online.conape.go.cr/apex/f?p=302:1', 'diagnóstico elimina sesión de URL');
check(new Function(`return ${FIND_RECRUIT};`) !== null, 'expresión FIND_RECRUIT compila');
check(new Function(`return ${CLICK_RECRUIT};`) !== null, 'expresión CLICK_RECRUIT compila');
check(new Function(`return ${INSPECT_FORM};`) !== null, 'expresión INSPECT_FORM compila');
check(discovery.includes('input:not([type="hidden"])'), 'discovery excluye inputs hidden');
check(discovery.includes("querySelectorAll('iframe')"), 'discovery inspecciona iframe modal APEX same-origin');
check(discovery.includes('dialogSelector'), 'discovery inspecciona dialogs APEX visibles');
check(discovery.includes('write_performed:false'), 'salida discovery declara no escritura');
check(!discovery.includes('document.documentElement.outerHTML'), 'discovery no vuelca HTML completo');
check(!INSPECT_FORM.match(/\.value\b|defaultValue/), 'INSPECT_FORM no lee valores de controles del formulario');
check(launcher.includes('--incognito') && launcher.includes('--remote-debugging-address=127.0.0.1'), 'launcher usa perfil aislado + CDP loopback');
check(launcher.includes('NO presione Enviar/Guardar'), 'launcher advierte no ejecutar submit real');

check(submitDiscovery.includes('userGesture:true'), 'submit discovery activa Reclutar con userGesture real de CDP');
check(submitDiscovery.includes('MAX_NAV_ATTEMPTS = 5'), 'submit discovery limita reintentos de navegación');
check(submitDiscovery.includes('NAV_RETRY_MS'), 'submit discovery reintenta si PROSPECTO no fue observado');
check(submitDiscovery.includes('RECRUIT_NAVIGATION_NOT_OBSERVED'), 'submit discovery bloquea explícitamente si el click no navega');
check(!submitDiscovery.includes('let opened = false'), 'submit discovery no queda latcheado por un click no confirmado');
check(submitDiscovery.includes('write_performed:false'), 'submit discovery mantiene evidencia de cero escritura');
check(submitLauncher.includes('NO presionará Crear nuevo Prospecto'), 'launcher submit mantiene prohibición de presionar Crear nuevo Prospecto');

const classicConfirm = classifyClientActionSource("apex.confirm('Confirmar alta','CREATE')");
check(classicConfirm.family === 'APEX_CONFIRM', 'C3.3b clasifica apex.confirm');
check(classicConfirm.request_candidate === 'CREATE', 'C3.3b extrae request seguro de apex.confirm clásico');
const pageConfirm = classifyClientActionSource("apex.page.confirm('Confirmar',{request:'CREATE_PROSPECTO'})");
check(pageConfirm.family === 'APEX_PAGE_CONFIRM' && pageConfirm.request_candidate === 'CREATE_PROSPECTO', 'C3.3b clasifica apex.page.confirm con request en opciones');
const directSubmit = classifyClientActionSource("apex.page.submit('SAVE')");
check(directSubmit.family === 'APEX_PAGE_SUBMIT' && directSubmit.request_candidate === 'SAVE', 'C3.3b clasifica submit directo');
const redirect = classifyClientActionSource("apex.navigation.redirect('f?p=302:2:SESSION')");
check(redirect.family === 'APEX_NAVIGATION_REDIRECT' && redirect.redirect_detected === true, 'C3.3b clasifica redirect sin exponer destino');
check(new Function(`return ${INSPECT_CLIENT_ACTION};`) !== null, 'expresión C3.3b INSPECT_CLIENT_ACTION compila');
check(clientActionDiscovery.includes('raw_onclick_emitted:false'), 'C3.3b declara que no emite onclick crudo');
check(clientActionDiscovery.includes('hidden_values_read:false'), 'C3.3b declara que no lee valores hidden');
check(clientActionDiscovery.includes('button_clicked:false'), 'C3.3b declara que Crear nuevo Prospecto no fue presionado');
check(clientActionDiscovery.includes('write_performed:false'), 'C3.3b declara cero escritura');
check(!clientActionDiscovery.includes('console.log(onclick)'), 'C3.3b no imprime onclick crudo');
check(clientActionLauncher.includes('WILL NOT click Crear nuevo Prospecto'), 'launcher C3.3b prohíbe click del botón de escritura');
check(clientActionLauncher.includes('--incognito') && clientActionLauncher.includes('--remote-debugging-address=127.0.0.1'), 'launcher C3.3b conserva perfil aislado y CDP loopback');

const daHandler = classifyBoundSource("function(){ apex.da.handleEvent(); var cfg={action:'NATIVE_SUBMIT_PAGE',attribute01:'CREATE'}; }");
check(daHandler.dynamic_action_detected === true, 'C3.3c detecta handler APEX Dynamic Action');
check(daHandler.called_apis.includes('apex.da.handleEvent'), 'C3.3c clasifica apex.da.handleEvent sin ejecutar handler');
check(daHandler.apex_da_actions.some(x => x.action === 'NATIVE_SUBMIT_PAGE' && x.attributes.attribute01 === 'CREATE'), 'C3.3c extrae candidato seguro de Dynamic Action submit');
check(new Function(`return ${INSPECT_BOUND_HANDLERS};`) !== null, 'expresión C3.3c INSPECT_BOUND_HANDLERS compila');
check(boundHandlerDiscovery.includes("jq._data(hit, 'events')"), 'C3.3c inspecciona metadata jQuery del botón sin click');
check(boundHandlerDiscovery.includes('inline_script_matches'), 'C3.3c busca referencias inline al id del botón sin emitir script crudo');
check(boundHandlerDiscovery.includes('raw_handler_source_emitted:false'), 'C3.3c declara que no emite source de handlers');
check(boundHandlerDiscovery.includes('raw_inline_script_emitted:false'), 'C3.3c declara que no emite script inline crudo');
check(boundHandlerDiscovery.includes('handler_invoked:false'), 'C3.3c declara que no invoca handler de escritura');
check(boundHandlerDiscovery.includes('button_clicked:false'), 'C3.3c declara que no presiona Crear nuevo Prospecto');
check(boundHandlerDiscovery.includes('write_performed:false'), 'C3.3c declara cero escritura');
check(boundHandlerLauncher.includes('NO presiona ni invoca Crear nuevo Prospecto'), 'launcher C3.3c prohíbe click e invocación del botón');
check(boundHandlerLauncher.includes('--incognito') && boundHandlerLauncher.includes('--remote-debugging-address=127.0.0.1'), 'launcher C3.3c conserva perfil aislado y CDP loopback');

const bodyKeys = safeBodyKeys('p_request=CREATE&P2_PRS_CEDULA=111111111&P2_PRS_EMAIL=a%40b.test');
check(bodyKeys.includes('p_request') && bodyKeys.includes('P2_PRS_CEDULA') && bodyKeys.includes('P2_PRS_EMAIL'), 'C3.4 inventaría nombres de parámetros sin necesitar sus valores');
check(safeRequestToken('p_request=CREATE&P2_PRS_CEDULA=111111111') === 'CREATE', 'C3.4 extrae únicamente request CREATE permitido');
check(safeRequestToken('p_request=%3Cscript%3E') === '', 'C3.4 rechaza request no seguro');
check(e4Harness.includes("ack !== 'CREAR'"), 'C3.4 exige confirmación CREAR en runtime antes de escribir');
check(e4Harness.includes("write_count:1"), 'C3.4 limita y documenta una sola escritura');
check(e4Harness.includes("CREATE_NOT_CONFIRMED"), 'C3.4 prohíbe reintento ciego cuando no hay confirmación suficiente');
check(e4Harness.includes("pii_emitted:false") && e4Harness.includes("cookies_emitted:false") && e4Harness.includes("hidden_values_emitted:false"), 'C3.4 evidencia final no emite PII/cookies/hidden values');
check(e4Launcher.includes('PUEDE crear exactamente un prospecto real'), 'launcher C3.4 advierte explícitamente que la prueba sí puede escribir');
check(e4Launcher.includes('NO reintente CREATE automáticamente'), 'launcher C3.4 advierte contra duplicación por reintento');
check(e4Launcher.includes('--incognito') && e4Launcher.includes('--remote-debugging-address=127.0.0.1'), 'launcher C3.4 conserva perfil aislado y CDP loopback');

const f = (id, label='') => ({ tag:'input', type:'text', id, name:'', label });
const baseline = {
  title:'PROSPECTACIÓN RECLUTADOR',
  contexts:[{ kind:'top', controls:[f('P1_PRO_ID','Prospectador'), f('P1_EVE_ID','Evento'), f('REPORT_SEARCH',''), { tag:'select', type:'', id:'ROWS', name:'p_accept_processing', label:'Rows' }] }]
};
const unchanged = JSON.parse(JSON.stringify(baseline));
check(pickChangedContext(baseline, unchanged) === null, 'no acepta como formulario los 4 controles preexistentes del reporte');

const withDialog = {
  title:'PROSPECTACIÓN RECLUTADOR',
  contexts:[
    ...baseline.contexts,
    { kind:'iframe', label:'apex-dialog', controls:[f('P10_CEDULA','Cédula'), f('P10_CORREO','Correo')] }
  ]
};
check(pickChangedContext(baseline, withDialog)?.kind === 'iframe', 'acepta formulario nuevo dentro de iframe APEX');

const withInline = {
  title:'PROSPECTACIÓN RECLUTADOR',
  contexts:[{ kind:'top', controls:[...baseline.contexts[0].controls, f('P10_CEDULA','Cédula')] }]
};
check(pickChangedContext(baseline, withInline)?.kind === 'top', 'acepta formulario inline solo cuando aparece un control nuevo');

if (failures.length) {
  console.error('\nC3.3 FAILURES:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('\nC3.3/C3.4 CONAPE Recruit QA: PASS (UI + E2 contracts + safe one-shot E4 harness)');
