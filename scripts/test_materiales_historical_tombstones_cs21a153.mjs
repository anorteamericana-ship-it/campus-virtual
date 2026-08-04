import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = file => fs.readFileSync(file, 'utf8');
const campus = read('campus.html');
const app = read('src/app.jsx');
const bibliography = read('src/teacher_cs21a_biblioteca_pdf.jsx');
const planning = read('src/teacher_cs21a_planeamiento32.jsx');
const canonicalBooks = read('src/book_unit_starts_cs21a60.jsx');
const canonicalPlanning = read('src/teacher_cs21a_planeamiento_grouped.jsx');
const teacherHub = read('src/teacher_cs21a.jsx');
const lazyLoader = read('src/lazy_loader.jsx');

const retiredFiles = [
  'src/teacher_cs21a_biblioteca_pdf.jsx',
  'src/teacher_cs21a_planeamiento32.jsx',
];

for (const file of retiredFiles) {
  assert.equal(campus.includes(file), false, `${file} no debe cargarse directamente.`);
  assert.equal(app.includes(file), false, `${file} no debe pertenecer a F96_LAZY.`);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(absolute));
    else out.push(absolute.replaceAll(path.sep, '/'));
  }
  return out;
}

const runtimeFiles = walk('src').filter(file => /\.(?:js|jsx)$/i.test(file) && !retiredFiles.includes(file));
for (const retired of retiredFiles) {
  const consumers = runtimeFiles.filter(file => read(file).includes(retired));
  assert.deepEqual(consumers, [], `${retired} no debe tener cargadores dinámicos.`);
}

for (const [name, source, marker] of [
  ['biblioteca', bibliography, '__AN_TEACHER_BIBLIOTECA_PDF_COMPATIBILITY__'],
  ['planeamiento', planning, '__AN_TEACHER_PLANEAMIENTO32_COMPATIBILITY__'],
]) {
  assert.match(source, /F98\.4-Z6-CS21A153/);
  assert.match(source, new RegExp(marker));
  assert.doesNotMatch(source, /(?:window\.)?MaterialesView\s*=/, `${name} no debe volver a publicar MaterialesView.`);
  assert.doesNotMatch(source, /MaterialesViewCS21A|__base\s*=/, `${name} no debe envolver una implementación anterior.`);
  assert.doesNotMatch(source, /React|fetch\s*\(|an:lazy-module-loaded|an:teacher-material-tab|setInterval|MutationObserver/, `${name} debe ser un tombstone inerte.`);
}

assert.match(campus, /src\/book_unit_starts_cs21a60\.jsx/);
assert.match(canonicalBooks, /window\.__AN_BOOK_RESOURCES_COMPONENT__\s*=\s*BookResourcesCS21A60/);
assert.match(canonicalBooks, /window\.__AN_BOOK_UNIT_STARTS_MODE__\s*=\s*['"]REUSABLE_COMPONENT_ONLY['"]/);
assert.doesNotMatch(canonicalBooks, /screen\s*===\s*['"]biblioteca['"]|MaterialesViewCS21A75|window\.MaterialesView\s*=|__base\s*=/);
assert.match(teacherHub, /const\s+BookResources\s*=\s*window\.__AN_BOOK_RESOURCES_COMPONENT__/);
assert.match(teacherHub, /screen\s*===\s*['"]libros['"][\s\S]{0,220}?<BookResources\s+initialType=['"]SB['"]\s*\/>/);

assert.match(campus, /src\/teacher_cs21a_planeamiento_grouped\.jsx/);
assert.match(canonicalPlanning, /function\s+PlaneamientoGroupedView\s*\(/);
assert.match(canonicalPlanning, /window\.PlaneamientoGroupedViewCS21A140\s*=\s*PlaneamientoGroupedView/);
assert.match(canonicalPlanning, /__AN_TEACHER_PLANNING_GROUPED_VERSION__/);
assert.doesNotMatch(canonicalPlanning, /screen\s*===\s*['"]planeamiento['"]|MaterialesViewCS21A9|window\.MaterialesView\s*=|__base\s*=/);
assert.match(teacherHub, /const\s+PlanningView\s*=\s*window\.PlaneamientoGroupedViewCS21A140/);
assert.match(teacherHub, /screen\s*===\s*['"]planeamiento['"][\s\S]{0,220}?<PlanningView\s*\/>/);

assert.match(lazyLoader, /F98\.4-Z6-CS21A168/);
assert.match(lazyLoader, /window\.__AN_BOOK_UNIT_STARTS_MODE__\s*===\s*['"]REUSABLE_COMPONENT_ONLY['"]/);
assert.doesNotMatch(lazyLoader, /MaterialesView\.__cs21a60UnitStarts|MaterialesView\.__cs21a75UnitStarts/);

console.log('OK CS21A169: CS21A6/10 son tombstones y TeacherHub consume libros y planeamiento como componentes puros.');
