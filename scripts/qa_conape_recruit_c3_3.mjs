import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allowedTarget, safeUrl, FIND_RECRUIT, CLICK_RECRUIT, INSPECT_FORM } from './conape_portal/discover_recruit_form_c3_3.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const ui = read('src/ventas_conape_reclutar_c3_3.jsx');
const html = read('ventas.html');
const discovery = read('scripts/conape_portal/discover_recruit_form_c3_3.mjs');
const launcher = read('scripts/conape_portal/run_conape_recruit_discovery_windows.ps1');
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
check(discovery.includes('write_performed:false'), 'salida discovery declara no escritura');
check(!discovery.includes('document.documentElement.outerHTML'), 'discovery no vuelca HTML completo');
check(launcher.includes('--incognito') && launcher.includes('--remote-debugging-address=127.0.0.1'), 'launcher usa perfil aislado + CDP loopback');
check(launcher.includes('NO presione Enviar/Guardar'), 'launcher advierte no ejecutar submit real');

if (failures.length) {
  console.error('\nC3.3 FAILURES:');
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}
console.log('\nC3.3 CONAPE Recruit QA: PASS (UI contract + read-only discovery + privacy)');
