import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = path => fs.readFileSync(path, 'utf8');
const source = read('src/teacher_lesson_book_link_cs21a142.js');
const storage = new Map();
const sandbox = {
  window: {},
  document: {
    documentElement: {},
    querySelector: () => null,
    querySelectorAll: () => [],
  },
  sessionStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key),
  },
  MutationObserver: class { observe() {} },
  CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
  requestAnimationFrame: callback => callback(),
  setTimeout: () => 0,
  addEventListener: () => {},
  dispatchEvent: () => {},
  console,
  Date,
};
sandbox.window.window = sandbox.window;

vm.runInNewContext(source, sandbox, { filename:'teacher_lesson_book_link_cs21a142.js' });
const api = sandbox.window.__AN_TEACHER_LESSON_BOOK_LINK_TEST__;
assert.ok(api, 'El script debe exponer sus funciones puras para validación.');

function drawer(dataset, textContent) {
  return { dataset, textContent, querySelectorAll:() => [] };
}

assert.deepEqual(
  { ...api.context(drawer({ teacherLevel:'I1', teacherLesson:'29', teacherRail:'curso' }, 'B1-KJ69-C3-0225')) },
  { level:'I1', lesson:29, unit:15, book_type:'SB', ican:false },
  'Los metadatos reales del drawer deben prevalecer sobre un código de grupo histórico.',
);

assert.deepEqual(
  { ...api.context(drawer({}, 'Detalle de clase · Lección 29 · Intermedio I')) },
  { level:'I1', lesson:29, unit:15, book_type:'SB', ican:false },
  'El respaldo debe reconocer texto acentuado y convertir Lección 29 en U15.',
);

assert.equal(api.levelFromText('Básico I'), 'B1');
assert.equal(api.levelFromText('Básico II'), 'B2');
assert.equal(api.levelFromText('Intermedio I'), 'I1');
assert.equal(api.levelFromText('Intermedio II'), 'I2');
assert.equal(api.context(drawer({ teacherLevel:'I1', teacherLesson:'15', teacherRail:'ican' }, 'Club I CAN')).ican, true);

const teacherViews = read('src/teacher_views.jsx');
const resourcesState = read('src/resources_panel_state_cs21a65.js');
const attendanceBridge = read('src/att77_bridge.js');
const app = read('src/app.jsx');
const campus = read('campus.html');

assert.match(teacherViews, /data-teacher-level=\{nivel\}/);
assert.match(teacherViews, /data-teacher-lesson=\{lesson\?\.leccion\}/);
assert.match(teacherViews, /data-teacher-rail=\{rielLeccion\}/);
assert.match(resourcesState, /teacher_lesson_book_link_cs21a142\.js\?v=F98\.4Z6CS21A142/);
assert.match(attendanceBridge, /teacher_views\.jsx\?v=F98\.4Z6CS21A142/);
assert.equal((app.match(/teacher_views\.jsx\?v=F98\.4Z6CS21A142/g) || []).length, 2);
assert.match(campus, /resources_panel_state_cs21a65\.js\?v=F98\.4Z6CS21A142/);
assert.match(campus, /att77_bridge\.js\?v=F98\.4Z6CS21A142/);
assert.match(campus, /app\.jsx\?v=F98\.4Z6CS21A142/);
assert.match(source, /sessionStorage\.removeItem\(REQUEST_KEY\)/);
assert.match(source, /section\[data-screen-label\*="Libros"\]/);
assert.doesNotMatch(source, /data-screen-label\*="CS21A60"/);
assert.match(source, /unitButton\.dataset\.active === 'true'/);
assert.match(source, /Date\.now\(\) - stableTarget\.since < 700/);

console.log('CS21A142: Lección 29 abre I1 · SB · U15 y libera luego la navegación del libro.');
