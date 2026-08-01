import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const syllabusPath = path.join(root, 'src/syllabus.jsx');
const source = fs.readFileSync(syllabusPath, 'utf8');

const forbidden = [
  'DEMO_GROUP',
  'DEMO_SUSPENSIONS',
  'G0001-2026',
  'Santiago está en',
  'Ricardo Arias',
  'El prototipo asume',
];

for (const token of forbidden) {
  assert.equal(
    source.includes(token),
    false,
    `src/syllabus.jsx no debe conservar el dato demostrativo: ${token}`,
  );
}

for (const token of [
  'const PRIORITY_BLOCK',
  'const SYLLABUS_BASICO_I',
  'const SYLLABUS_BY_LEVEL',
  'function buildGroupSchedule',
  'function parseScheduleDays',
  'function fmtDate',
  'Object.assign(window',
]) {
  assert.equal(source.includes(token), true, `Falta contrato canónico: ${token}`);
}

const window = {};
const context = vm.createContext({ window, Date, Object, Set });
vm.runInContext(source, context, { filename: 'src/syllabus.jsx' });

assert.equal('DEMO_GROUP' in window, false);
assert.equal('DEMO_SUSPENSIONS' in window, false);
assert.deepEqual(Object.keys(window.SYLLABUS_BY_LEVEL).sort(), ['b1', 'b2', 'i1', 'i2']);
assert.equal(window.SYLLABUS_BASICO_I.lessons.length, 32);
assert.equal(window.ICAN_SLOTS_AFTER.length, 16);

const schedule = window.buildGroupSchedule('b1', {
  scheduleDays: 'Lun/Mié 6–9pm',
  startDate: '2026-09-07',
});

assert.equal(schedule.length, 32);
assert.equal(schedule[0].n, 1);
assert.equal(schedule[31].n, 32);
assert.equal(schedule.every(item => item.status === 'scheduled'), true);

console.log('OK: sílabus canónico sin identidades, grupos ni suspensiones demostrativas.');
