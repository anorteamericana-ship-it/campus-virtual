import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/teacher_books_unit_guard_cs21a134.js', 'utf8');
let role = 'teacher';
let activeTab = 'libros';
let backendPayload = { ok:true, level:'B1', book_type:'TB', unit_starts:[] };
let backendCalls = 0;

const appended = [];
const documentStub = {
  documentElement:{},
  head:{ appendChild(node){ appended.push(node); } },
  body:{ appendChild(){} },
  getElementById(){ return null; },
  createElement(tag){
    return {
      tagName:String(tag).toUpperCase(),
      style:{},
      dataset:{},
      classList:{ add(){} },
      setAttribute(){},
      appendChild(){},
      append(){},
      querySelectorAll(){ return []; },
    };
  },
  querySelectorAll(){ return []; },
  addEventListener(){},
};

class MutationObserverStub {
  constructor(callback){ this.callback = callback; }
  observe(){}
  disconnect(){}
}

const Viewer = function Viewer(props){ return { viewer:true, props }; };
const BaseMateriales = function BaseMateriales(props){ return { base:true, props }; };

const context = {
  console,
  Array,
  Object,
  String,
  Number,
  Map,
  Promise,
  URL,
  Response,
  Headers,
  document:documentStub,
  MutationObserver:MutationObserverStub,
};
context.window = context;
context.window.location = { href:'https://example.test/campus.html' };
context.window.getSesion = () => ({ rol:role });
context.window.getComputedStyle = () => ({ color:'rgb(0, 0, 0)', backgroundColor:'rgb(255, 255, 255)' });
context.window.addEventListener = () => {};
context.window.setInterval = () => 1;
context.window.clearInterval = () => {};
context.window.setTimeout = callback => { callback(); return 1; };
context.window.requestAnimationFrame = callback => { callback(); return 1; };
context.window.React = {
  createElement(type, props){ return { type, props:props || {} }; },
};
context.window.__AN_BOOK_RESOURCES_COMPONENT__ = Viewer;
context.window.MaterialesView = BaseMateriales;
context.MaterialesView = BaseMateriales;
context.sessionStorage = {
  getItem(key){
    if (key === 'an_usuario') return JSON.stringify({ rol:role });
    if (key === 'an_teacher_materiales_tab') return activeTab;
    return null;
  },
};
context.window.fetch = async () => {
  backendCalls += 1;
  return new Response(JSON.stringify(backendPayload), {
    status:200,
    headers:{ 'content-type':'application/json;charset=utf-8' },
  });
};

vm.createContext(context);
vm.runInContext(source, context, { filename:'teacher_books_unit_guard_cs21a134.js' });

const guard = context.window.__AN_TEACHER_BOOK_NAVIGATION_CS21A135;
const correctedB1 = [8,14,22,28,36,42,50,56,64,70,78,84,92,98,106,112];
assert.equal(guard.version, 'F98.4-Z6-CS21A135');
assert.equal(Object.keys(guard.maps).length, 12, 'Deben existir SB, TB y WB para los cuatro niveles.');
assert.equal(guard.knownBad['B1|SB'].length, 2);
for (const [key, values] of Object.entries(guard.maps)) {
  assert.equal(values.length, 16, `${key} debe tener 16 unidades.`);
  assert.equal(values.every(value => Number.isFinite(value) && value > 0), true, `${key} debe tener páginas válidas.`);
}

for (const sequence of [
  [9,15,23,29,37,43,51,57,65,71,79,85,93,99,107,113],
  [6,12,20,26,34,40,48,54,62,68,76,82,90,96,104,110],
]) {
  const repairedB1 = guard.repairPayload({
    ok:true,
    level:'B1',
    book_type:'SB',
    unit_starts:sequence,
    unit_starts_source:'BOOK_JSON',
  });
  assert.deepEqual(Array.from(repairedB1.unit_starts), correctedB1);
  assert.equal(repairedB1.unit_starts_repaired_frontend, true);
}

const missingB2SB = guard.repairPayload({ ok:true, level:'B2', book_type:'SB', unit_starts:[] });
assert.deepEqual(
  Array.from(missingB2SB.unit_starts),
  [22,28,36,42,50,56,64,70,78,84,92,98,106,112,120,126],
  'B2 SB debe conservar respaldo porque su manifiesto no trae unit_starts.'
);

const partialI2WB = guard.repairPayload({ ok:true, level:'I2', book_type:'WB', unit_starts:[5,11,null] });
assert.deepEqual(Array.from(partialI2WB.unit_starts), [5,11,17,23,29,35,41,47,53,59,65,71,77,83,89,95]);

const customComplete = Array.from({ length:16 }, (_, index) => 200 + index * 3);
const preserved = { ok:true, level:'B1', book_type:'TB', unit_starts:customComplete };
assert.equal(guard.repairPayload(preserved), preserved, 'Una calibración completa distinta debe respetarse.');

role = 'student';
const studentPayload = {
  ok:true,
  level:'B1',
  book_type:'SB',
  unit_starts:[9,15,23,29,37,43,51,57,65,71,79,85,93,99,107,113],
};
assert.equal(guard.repairPayload(studentPayload), studentPayload, 'El guard no debe cambiar la respuesta del estudiante.');

role = 'teacher';
assert.equal(context.window.MaterialesView.__cs21a135BookAuthority, true);
assert.equal(context.window.MaterialesView.__cs21a58books, true, 'La marca debe bloquear el regreso del visor antiguo.');
let rendered = context.window.MaterialesView({ sample:1 });
assert.equal(rendered.type, Viewer, 'Libros del docente deben usar el visor institucional.');
assert.equal(rendered.props.initialType, 'SB');

activeTab = 'biblioteca';
rendered = context.window.MaterialesView({ sample:2 });
assert.equal(rendered.type, Viewer);
assert.equal(rendered.props.initialType, 'TB');

context.window.MaterialesView = function LegacyCS21A58(){};
assert.equal(guard.installAuthority(), true);
assert.equal(context.window.MaterialesView.__cs21a135BookAuthority, true, 'La autoridad debe recuperarse después de una reinstalación tardía del legado.');
assert.equal(context.window.MaterialesView.__cs21a58books, true);

backendPayload = { ok:true, level:'B2', book_type:'WB', unit_starts:[] };
const response = await context.window.fetch('https://script.google.test/exec?fn=teacherBooksOpenImageBook', {
  method:'POST',
});
const body = await response.json();
assert.deepEqual(Array.from(body.unit_starts), [6,12,18,24,30,36,42,48,54,60,66,72,78,84,90,96]);
assert.equal(backendCalls, 1);

backendPayload = { ok:true, value:'lectura normal' };
const untouchedResponse = await context.window.fetch('https://script.google.test/exec?fn=getDocenteGruposActuales');
assert.deepEqual(await untouchedResponse.json(), backendPayload);
assert.equal(backendCalls, 2);

assert.equal(appended.some(node => node.tagName === 'STYLE'), true, 'Debe instalarse el acabado visual de la botonera.');
console.log('OK: 12 mapas, autoridad del visor, TB/WB persistentes y diseño CS21A135 validados.');
