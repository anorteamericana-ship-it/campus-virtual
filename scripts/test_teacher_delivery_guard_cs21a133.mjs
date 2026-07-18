import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/teacher_delivery_guard_cs21a133.js', 'utf8');
const today = (() => {
  const values = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Costa_Rica', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).forEach(part => {
    if (part.type !== 'literal') values[part.type] = part.value;
  });
  return `${values.year}-${values.month}-${values.day}`;
})();

let resolveWrite;
let baseCalls = 0;
const context = {
  console,
  Intl,
  Date,
  Promise,
  Map,
  Array,
  Object,
  String,
  Number,
  setTimeout,
  clearTimeout,
  cargarPanelDocenteF80: async () => ({
    ok: true,
    parcial: true,
    version: 'F80_FALLBACK',
    leccion_hoy: { leccion: 99, fecha: '2099-01-01' },
    lecciones: [
      { leccion: 1, fecha: today, riel: 'ican', estado: 'ABIERTA' },
      { leccion: 2, fecha: today, riel: 'curso', estado: 'CERRADA' },
      { leccion: 3, fecha: today, riel: 'curso', estado: 'PROGRAMADA' },
      { leccion: 4, fecha: today, riel: 'curso', estado: 'FERIADO' },
    ],
  }),
  tvIsToday: () => false,
  postTeacher: (fn, payload) => {
    baseCalls += 1;
    if (payload?.fail) return Promise.reject(new Error('fallo controlado'));
    if (payload?.deferred) return new Promise(resolve => { resolveWrite = resolve; });
    return Promise.resolve({ ok: true, fn });
  },
};
context.window = context;
context.window.addEventListener = () => {};
context.window.setTimeout = setTimeout;
context.window.setInterval = () => 1;
context.window.clearInterval = () => {};

vm.createContext(context);
vm.runInContext(source, context, { filename: 'teacher_delivery_guard_cs21a133.js' });

const debug = context.window.anTeacherDeliveryDebugCS21A133();
assert.equal(debug.version, 'F98.4-Z6-CS21A133');
assert.equal(debug.today_costa_rica, today);
assert.equal(debug.panel_patched, true);
assert.equal(debug.today_patched, true);
assert.equal(debug.post_patched, true);

const panel = await context.window.cargarPanelDocenteF80('B1-LM69-0126', 'B1');
assert.equal(panel.leccion_hoy.leccion, 3, 'Debe seleccionar la primera lección no cerrada del día en Costa Rica.');
assert.equal(context.window.tvIsToday(today), true);
assert.equal(context.window.tvIsToday('2099-01-01'), false);

const payload = { cod_grupo: 'B1-LM69-0126', nivel: 'B1', leccion: 3, riel: 'curso', deferred: true };
const first = context.window.postTeacher('docenteIniciarSesionClaseF77', payload, 30000);
const second = context.window.postTeacher('docenteIniciarSesionClaseF77', payload, 30000);
assert.equal(first, second, 'Dos escrituras idénticas simultáneas deben compartir una sola promesa.');
await Promise.resolve();
assert.equal(baseCalls, 1, 'El backend debe recibir una sola solicitud simultánea.');
resolveWrite({ ok: true });
await first;

await context.window.postTeacher('docenteIniciarSesionClaseF77', { ...payload, deferred: false }, 30000);
assert.equal(baseCalls, 2, 'Al terminar la primera operación debe permitirse una nueva solicitud.');

await assert.rejects(
  context.window.postTeacher('docenteCerrarClaseConAsistenciaF87', {
    cod_grupo: 'B1-LM69-0126', nivel: 'B1', leccion: 3, riel: 'curso', fail: true,
  }),
  /fallo controlado/
);
await assert.rejects(
  context.window.postTeacher('docenteCerrarClaseConAsistenciaF87', {
    cod_grupo: 'B1-LM69-0126', nivel: 'B1', leccion: 3, riel: 'curso', fail: true,
  }),
  /fallo controlado/
);
assert.equal(baseCalls, 4, 'Una escritura fallida debe liberar el bloqueo para permitir reintento.');

await Promise.all([
  context.window.postTeacher('getDocenteGruposActuales', { docente: 'DOCENTE' }),
  context.window.postTeacher('getDocenteGruposActuales', { docente: 'DOCENTE' }),
]);
assert.equal(baseCalls, 6, 'Las lecturas no deben deduplicarse ni cambiar de comportamiento.');

console.log('OK: fecha Costa Rica, fallback docente y bloqueo de doble envío CS21A133.');
