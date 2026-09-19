import fs from 'node:fs';
import vm from 'node:vm';

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

// HOTFIX 2026-09-19 · ejecutar el normalizador real con una respuesta MIXTA.
// Este fixture reproduce la clase de fallo del drawer: identidad ya venía en
// minúsculas, pero teléfono/correo/dirección/documentos seguían con headers de
// PROSPECTOS. El test evalúa la función extraída del source; no reimplementa la lógica.
const siNoMatch = ventasData.match(/const siNoV = [^\n]+;/);
const fmtStart = ventasData.indexOf('function fmtCedulaV2(raw) {');
const normStart = ventasData.indexOf('function normalizarProspecto(P) {');
const normEnd = ventasData.indexOf('\n}\n// Mapea el resumen', normStart);
const fmtBlock = fmtStart >= 0 && normStart > fmtStart ? ventasData.slice(fmtStart, normStart) : '';
const normBlock = normStart >= 0 && normEnd > normStart ? ventasData.slice(normStart, normEnd + 2) : '';
check(!!siNoMatch && !!fmtBlock && !!normBlock, 'Se pudo extraer el normalizador real de Ventas para fixture ejecutable');
if (siNoMatch && fmtBlock && normBlock) {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(
    `${siNoMatch[0]}\n${fmtBlock}\n${normBlock}\nglobalThis.__normalizarProspecto = normalizarProspecto;`,
    sandbox
  );
  const fixture = {
    cedula: '1-1111-1111',
    nombre: 'PERSONA PRUEBA',
    CORREO: 'fixture@example.test',
    TELEFONO: '88887777',
    PROVINCIA: 'SAN JOSE',
    DIRECCION: 'DIRECCION FIXTURE',
    FINANCIAMIENTO: 'CONAPE',
    CONAPE_EQUIPO: 'NINGUNO',
    CONAPE_SOSTENIMIENTO: 'NO',
    ETAPA: 'LEAD',
    CED_FRENTE_FILE_ID: 'fixture-frente-id',
    DOC_IDENTIDAD_FILE_ID: 'fixture-identidad-id',
    TITULO_FILE_ID: 'fixture-titulo-id',
    EXTRA_NO_MAPEADO: 'preservar',
  };
  const out = sandbox.__normalizarProspecto(fixture);
  check(out.cedula === '1-1111-1111' && out.nombre === 'PERSONA PRUEBA', 'Normalizador conserva identidad minúscula existente');
  check(out.correo === 'fixture@example.test' && out.telefono === '88887777', 'Normalizador recupera contacto mayúsculo en respuesta mixta');
  check(out.provincia === 'SAN JOSE' && out.direccion === 'DIRECCION FIXTURE', 'Normalizador recupera ubicación mayúscula en respuesta mixta');
  check(out.financiamiento === 'CONAPE' && out.conape?.equipo === 'NINGUNO', 'Normalizador recupera financiamiento CONAPE mixto');
  check(out.ced_frente_file_id === 'fixture-frente-id' && out.titulo_file_id === 'fixture-titulo-id', 'Normalizador recupera FILE_ID privados mixtos');
  check(out.EXTRA_NO_MAPEADO === 'preservar', 'Normalizador conserva campos adicionales del backend');

  const yaNormalizado = sandbox.__normalizarProspecto({
    cedula:'2-2222-2222', nombre:'OTRA PRUEBA', correo:'lower@example.test', telefono:'81112222',
    financiamiento:'CONAPE', conape:{ equipo:'LAPTOP_319', toeic:true, sostenimiento:'SI' },
    notas:[{ texto:'fixture' }], docs_extra:[{ file_id:'extra-1' }], etapa:'CONAPE_SOLICITUD'
  });
  check(yaNormalizado.correo === 'lower@example.test' && yaNormalizado.conape?.equipo === 'LAPTOP_319', 'Normalizador no pisa la forma minúscula ya canónica');
  check(Array.isArray(yaNormalizado.notas) && yaNormalizado.notas.length === 1 && Array.isArray(yaNormalizado.docs_extra), 'Normalizador conserva arrays ya normalizados');
}

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
