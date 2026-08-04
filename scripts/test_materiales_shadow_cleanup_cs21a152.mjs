import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const campus = read('campus.html');
const compatibility = read('src/teacher_cs21a_order_fix.jsx');
const canonical = read('src/book_unit_starts_cs21a60.jsx');
const propagation = read('src/book_unit_propagation_cs21a64.js');
const guard = read('src/teacher_books_unit_guard_cs21a134.js');
const lazyLoader = read('src/lazy_loader.jsx');

function scriptPosition(source, filename) {
  const index = source.indexOf(filename);
  assert.notEqual(index, -1, `${filename} debe continuar publicado durante la transición.`);
  return index;
}

const compatibilityPosition = scriptPosition(campus, 'src/teacher_cs21a_order_fix.jsx');
const canonicalPosition = scriptPosition(campus, 'src/book_unit_starts_cs21a60.jsx');
const propagationPosition = scriptPosition(campus, 'src/book_unit_propagation_cs21a64.js');

assert.ok(
  compatibilityPosition < canonicalPosition && canonicalPosition < propagationPosition,
  'La ruta de compatibilidad debe cargar antes del visor canónico y su autoridad.'
);

assert.match(compatibility, /F98\.4-Z6-CS21A152/);
assert.match(compatibility, /__AN_TEACHER_ORDER_FIX_COMPATIBILITY__/);
assert.doesNotMatch(compatibility, /(?:window\.)?MaterialesView\s*=/);
assert.doesNotMatch(compatibility, /__base\s*=/);
assert.doesNotMatch(compatibility, /teacherBooksOpenImageBook/);
assert.doesNotMatch(compatibility, /an:lazy-module-loaded|an:teacher-material-tab/);
assert.doesNotMatch(compatibility, /function\s+Books\s*\(|function\s+ImageBookSpread\s*\(/);

assert.match(canonical, /window\.__AN_BOOK_RESOURCES_COMPONENT__\s*=\s*BookResourcesCS21A60/);
assert.match(canonical, /Wrapped\.__cs21a75UnitStarts\s*=\s*true/);
assert.match(canonical, /Wrapped\.__cs21a60UnitStarts\s*=\s*true/);
assert.match(canonical, /screen\s*===\s*['"]libros['"]/);
assert.match(canonical, /screen\s*===\s*['"]biblioteca['"]/);

assert.match(propagation, /teacher_books_unit_guard_cs21a134\.js/);
assert.match(propagation, /loadTeacherUnitGuard\(\)/);
assert.match(guard, /__cs21a135BookAuthority/);
assert.match(guard, /window\.__AN_BOOK_RESOURCES_COMPONENT__/);
assert.match(lazyLoader, /window\.MaterialesView\.__cs21a60UnitStarts\s*===\s*true/);

const activeImplementations = [compatibility, canonical].filter(source =>
  /function\s+ImageBookSpread\s*\(|function\s+BookResourcesCS21A60\s*\(/.test(source)
);
assert.equal(activeImplementations.length, 1, 'Solo debe quedar una implementación activa del visor en la carga directa.');

console.log('OK: CS21A58 quedó como compatibilidad inerte y CS21A75 conserva la autoridad del visor.');
