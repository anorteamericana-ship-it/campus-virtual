import assert from 'node:assert/strict';
import fs from 'node:fs';

const loader = fs.readFileSync('src/lazy_loader.jsx', 'utf8');
const viewer = fs.readFileSync('src/book_unit_starts_cs21a60.jsx', 'utf8');

assert.match(loader, /F98\.4-Z6-CS21A168/);
assert.match(loader, /function\s+unifiedMaterialsReady\s*\(\)/);
assert.match(loader, /typeof\s+window\.MaterialesView\s*===\s*['"]function['"]/);
assert.match(loader, /typeof\s+window\.__AN_BOOK_RESOURCES_COMPONENT__\s*===\s*['"]function['"]/);
assert.match(loader, /window\.__AN_BOOK_UNIT_STARTS_MODE__\s*===\s*['"]REUSABLE_COMPONENT_ONLY['"]/);
assert.match(loader, /if\s*\(needsUnifiedMaterials\(component\)\)\s*return\s+unifiedMaterialsReady\(\)/);
assert.doesNotMatch(loader, /MaterialesView\.__cs21a60UnitStarts|MaterialesView\.__cs21a75UnitStarts|MaterialesView\.__cs21a58books/);

assert.match(viewer, /window\.__AN_BOOK_RESOURCES_COMPONENT__\s*=\s*BookResourcesCS21A60/);
assert.match(viewer, /window\.__AN_BOOK_UNIT_STARTS_MODE__\s*=\s*['"]REUSABLE_COMPONENT_ONLY['"]/);
assert.doesNotMatch(viewer, /window\.MaterialesView\s*=|MaterialesViewCS21A75|__base\s*=/);

console.log('OK CS21A168: el lazy loader espera el componente reutilizable y no marcas de wrappers históricos.');
