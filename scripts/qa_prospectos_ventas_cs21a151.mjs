import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const fail = [];
const pass = [];

function check(ok, label, evidence = '') {
  if (ok) pass.push(label);
  else fail.push(`${label}${evidence ? ` · ${evidence}` : ''}`);
}

const ventasHtml = read('ventas.html');
const ventasParts = read('src/ventas_parts.jsx');
const prospect = read('src/prospect_free_student.jsx');
const sidebar = read('src/sidebar.jsx');
const drawer = read('src/ventas_drawer.jsx');
const ventasData = read('src/ventas_data.jsx');

check(
  !ventasHtml.includes('styles/design_system_05c.css'),
  'Ventas no referencia el CSS inexistente design_system_05c.css'
);

check(
  ventasParts.includes('{fmtTelV(p.whatsapp || p.telefono)}') &&
    !ventasParts.includes('{fmtTelV(p.telefono)}'),
  'La tabla muestra el mismo número prioritario que abre WhatsApp'
);

const forbiddenProspectCopy = [
  'El backend devolvió HTML',
  'Revisá la URL publicada de Apps Script',
  'Respuesta inválida del servidor.',
];
check(
  forbiddenProspectCopy.every(text => !prospect.includes(text)),
  'El prospecto no recibe diagnósticos técnicos de backend/Apps Script',
  forbiddenProspectCopy.filter(text => prospect.includes(text)).join(', ')
);
check(
  prospect.includes('freeStudentSafeError') && prospect.includes("console.error('[Prematricula]") && prospect.includes("console.warn('[Prematricula]"),
  'El detalle técnico queda en consola y la UI usa mensajes filtrados'
);

const freeStart = sidebar.indexOf('const studentSections = esUsuarioGratis ? [');
const freeEnd = sidebar.indexOf('] : [', freeStart);
const freeMenu = freeStart >= 0 && freeEnd > freeStart ? sidebar.slice(freeStart, freeEnd) : '';
check(!!freeMenu, 'Se localizó el menú específico de prematrícula');
check(
  !!freeMenu && !freeMenu.includes('locked: true'),
  'Prematrícula no muestra opciones bloqueadas'
);
for (const label of ['Mi curso', 'Materiales', 'Club I CAN', 'Pagos', 'Certificados', 'Solicitar contacto']) {
  check(!freeMenu.includes(`label: '${label}'`), `Prematrícula oculta ${label}`);
}
check(
  freeMenu.includes("label: 'Mi Campus'") && freeMenu.includes("label: 'English LAB'"),
  'Prematrícula conserva únicamente las entradas útiles del Campus'
);

console.log('QA PROSPECTOS / VENTAS · CS21A151');
for (const item of pass) console.log(`PASS · ${item}`);

// Deuda detectada durante esta auditoría. Se imprime como WARNING porque pertenece
// a cortes separados (#113 / aislamiento QA) y no debe mezclarse con este PR visual.
const warnings = [];
if (drawer.includes('Modo prueba controlado') || drawer.includes('previewMatriculaCR')) {
  warnings.push('ventas_drawer.jsx conserva flujo de prueba ligado a una cédula; aislar en corte QA separado.');
}
if (drawer.includes('setGrupos(window.DEMO_GRUPOS)')) {
  warnings.push('ventas_drawer.jsx usa DEMO_GRUPOS como fallback ante error real; retirar en corte de aislamiento DEMO.');
}
const postVentasMatch = ventasData.match(/async function postVentas\(payload\)[\s\S]*?\n\}/);
if (postVentasMatch && !/getSessionToken|token/.test(postVentasMatch[0])) {
  warnings.push('postVentas() no inyecta token; corresponde a PR #113 REL-002, no a este corte visual.');
}
for (const item of warnings) console.warn(`WARN · ${item}`);

if (fail.length) {
  for (const item of fail) console.error(`FAIL · ${item}`);
  process.exit(1);
}
console.log(`PASS TOTAL · ${pass.length} invariantes · ${warnings.length} warnings conocidos`);
