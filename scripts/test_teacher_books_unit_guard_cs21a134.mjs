import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/teacher_books_unit_guard_cs21a134.js', 'utf8');
let role = 'teacher';
let backendPayload = { ok:true, level:'B1', book_type:'TB', unit_starts:[] };
let backendCalls = 0;

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
};
context.window = context;
context.window.location = { href:'https://example.test/campus.html' };
context.window.getSesion = () => ({ rol:role });
context.sessionStorage = { getItem:() => JSON.stringify({ rol:role }) };
context.window.fetch = async () => {
  backendCalls += 1;
  return new Response(JSON.stringify(backendPayload), {
    status:200,
    headers:{ 'content-type':'application/json;charset=utf-8' },
  });
};

vm.createContext(context);
vm.runInContext(source, context, { filename:'teacher_books_unit_guard_cs21a134.js' });

const guard = context.window.__AN_TEACHER_BOOK_UNIT_GUARD_CS21A134;
const correctedB1 = [8,14,22,28,36,42,50,56,64,70,78,84,92,98,106,112];
assert.equal(guard.version, 'F98.4-Z6-CS21A134');
assert.equal(Object.keys(guard.maps).length, 9);
assert.equal(guard.known_bad_b1_sb.length, 2);
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

const customComplete = Array.from({ length:16 }, (_, index) => 200 + index * 3);
const preserved = { ok:true, level:'B1', book_type:'TB', unit_starts:customComplete };
assert.equal(guard.repairPayload(preserved), preserved, 'Una calibración completa distinta debe respetarse.');

const partial = { ok:true, level:'I2', book_type:'WB', unit_starts:[5,11,null] };
const filled = guard.repairPayload(partial);
assert.deepEqual(Array.from(filled.unit_starts), [5,11,17,23,29,35,41,47,53,59,65,71,77,83,89,95]);

role = 'student';
const studentPayload = {
  ok:true,
  level:'B1',
  book_type:'SB',
  unit_starts:[9,15,23,29,37,43,51,57,65,71,79,85,93,99,107,113],
};
assert.equal(guard.repairPayload(studentPayload), studentPayload, 'El guard no debe cambiar la respuesta del estudiante.');

role = 'teacher';
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

console.log('OK: unidades SB/TB/WB del docente reparadas sin alterar estudiante ni calibraciones completas.');
