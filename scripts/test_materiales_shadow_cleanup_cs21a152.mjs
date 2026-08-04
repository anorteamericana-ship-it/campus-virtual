import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const campus = read('campus.html');
const compatibility = read('src/teacher_cs21a_order_fix.jsx');
const canonical = read('src/book_unit_starts_cs21a60.jsx');
const propagation = read('src/book_unit_propagation_cs21a64.js');
const guard = read('src/teacher_books_unit_guard_cs21a134.js');
const lazyLoader = read('src/lazy_loader.jsx');
const teacher = read('src/teacher_cs21a.jsx');

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
  'La ruta de compatibilidad debe cargar antes del visor canónico y su guard visual.'
);

assert.match(compatibility, /F98\.4-Z6-CS21A152/);
assert.match(compatibility, /__AN_TEACHER_ORDER_FIX_COMPATIBILITY__/);
assert.doesNotMatch(compatibility, /(?:window\.)?MaterialesView\s*=/);
assert.doesNotMatch(compatibility, /__base\s*=|__cs21a58books/);
assert.doesNotMatch(compatibility, /teacherBooksOpenImageBook/);
assert.doesNotMatch(compatibility, /an:lazy-module-loaded|an:teacher-material-tab/);
assert.doesNotMatch(compatibility, /function\s+Books\s*\(|function\s+ImageBookSpread\s*\(/);

assert.match(canonical, /window\.__AN_BOOK_RESOURCES_COMPONENT__\s*=\s*BookResourcesCS21A60/);
assert.match(canonical, /window\.__AN_BOOK_UNIT_STARTS_MODE__\s*=\s*['"]REUSABLE_COMPONENT_ONLY['"]/);
assert.match(canonical, /function\s+BookResourcesCS21A60\s*\(/);
assert.doesNotMatch(canonical, /MaterialesViewCS21A75|window\.MaterialesView\s*=|__base\s*=/);
assert.doesNotMatch(canonical, /Wrapped\.__cs21a75UnitStarts|Wrapped\.__cs21a60UnitStarts/);
assert.doesNotMatch(canonical, /an_teacher_materiales_tab|screen\s*===\s*['"]biblioteca['"]/);

assert.match(teacher, /const\s+BookResources\s*=\s*window\.__AN_BOOK_RESOURCES_COMPONENT__/);
assert.match(teacher, /screen\s*===\s*['"]libros['"][\s\S]{0,220}?<BookResources\s+initialType=['"]SB['"]\s*\/>/);

assert.match(propagation, /teacher_books_unit_guard_cs21a134\.js/);
assert.match(propagation, /loadTeacherUnitGuard\(\)/);
assert.match(guard, /F98\.4-Z6-CS21A162/);
assert.match(guard, /const\s+AUTHORITY_MODE\s*=\s*['"]TEACHER_PORTAL_OWNS_VIEWER['"]/);
assert.match(guard, /authorityMode:\s*AUTHORITY_MODE/);
assert.match(guard, /window\.__AN_BOOK_RESOURCES_COMPONENT__/);
assert.doesNotMatch(guard, /(?:window\.)?MaterialesView\s*=|__cs21a135BookAuthority|setInterval\s*\(/);

assert.match(lazyLoader, /F98\.4-Z6-CS21A168/);
assert.match(lazyLoader, /window\.__AN_BOOK_UNIT_STARTS_MODE__\s*===\s*['"]REUSABLE_COMPONENT_ONLY['"]/);
assert.doesNotMatch(lazyLoader, /MaterialesView\.__cs21a60UnitStarts|MaterialesView\.__cs21a75UnitStarts/);

const activeImplementations = [compatibility, canonical].filter(source =>
  /function\s+ImageBookSpread\s*\(|function\s+BookResourcesCS21A60\s*\(/.test(source)
);
assert.equal(activeImplementations.length, 1, 'Solo debe quedar una implementación activa del visor en la carga directa.');

console.log('OK CS21A169: CS21A58 es inerte y CS21A75 es un componente reutilizable sin wrappers.');
