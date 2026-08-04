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

for (const [name, source] of [['biblioteca', bibliography], ['planeamiento', planning]]) {
  assert.match(source, /F98\.4-Z6-CS21A153/);
  assert.doesNotMatch(source, /(?:window\.)?MaterialesView\s*=/, `${name} no debe volver a publicar MaterialesView.`);
  assert.doesNotMatch(source, /__base\s*=/, `${name} no debe envolver una implementación anterior.`);
  assert.doesNotMatch(source, /an:lazy-module-loaded|an:teacher-material-tab/, `${name} no debe instalar listeners.`);
}

assert.match(campus, /src\/book_unit_starts_cs21a60\.jsx/);
assert.match(canonicalBooks, /window\.__AN_BOOK_RESOURCES_COMPONENT__\s*=\s*BookResourcesCS21A60/);
assert.match(canonicalBooks, /screen\s*===\s*['"]biblioteca['"]/);

assert.match(campus, /src\/teacher_cs21a_planeamiento_grouped\.jsx/);
assert.match(canonicalPlanning, /function\s+PlaneamientoGroupedView\s*\(/);
assert.match(canonicalPlanning, /screen\s*===\s*['"]planeamiento['"]/);
assert.match(canonicalPlanning, /function\s+MaterialesViewCS21A9\s*\(/);
assert.match(canonicalPlanning, /__AN_TEACHER_PLANEAMIENTO_GROUPED_VERSION__/);

console.log('OK: biblioteca CS21A10 y planeamiento CS21A6 quedaron como rutas históricas inertes con reemplazos publicados.');
