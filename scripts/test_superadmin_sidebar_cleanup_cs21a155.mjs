import assert from 'node:assert/strict';
import fs from 'node:fs';

const compatibility = fs.readFileSync('src/admin_resources_superadmin_cs21a60.jsx', 'utf8');
const app = fs.readFileSync('src/app.jsx', 'utf8');
const resources = fs.readFileSync('src/resources_panel_cs21a65.jsx', 'utf8');
const campus = fs.readFileSync('campus.html', 'utf8');

assert.match(compatibility, /F98\.4-Z6-CS21A155/);
assert.match(compatibility, /__AN_ADMIN_RESOURCES_SUPERADMIN_COMPATIBILITY__/);
assert.doesNotMatch(compatibility, /(?:window\.)?Sidebar\s*=/);
assert.doesNotMatch(compatibility, /__base\s*=/);
assert.doesNotMatch(compatibility, /ReactDOM|createPortal|MutationObserver/);
assert.doesNotMatch(compatibility, /setInterval|an:lazy-module-loaded/);
assert.doesNotMatch(compatibility, /props\?\.role.*superadmin/);

assert.match(app, /else if \(role === ['"]admin['"]\)/);
assert.match(app, /Admin \/ superadmin/);
assert.match(app, /<Sidebar[\s\S]*?role=\{role\}[\s\S]*?rolReal=\{rolReal\}/);

assert.match(resources, /function\s+currentRole\s*\(/);
assert.match(resources, /props\?\.rolReal/);
assert.match(resources, /role === ['"]admin['"] \|\| role === ['"]superadmin['"]/);
assert.match(resources, /AdminResourcesPortal/);
assert.match(resources, /__cs21a65UnifiedResources/);

const historicalPosition = campus.indexOf('src/admin_resources_superadmin_cs21a60.jsx');
const replacementPosition = campus.indexOf('src/resources_panel_cs21a65.jsx');
assert.ok(historicalPosition >= 0, 'La ruta histórica debe conservarse durante la transición.');
assert.ok(replacementPosition > historicalPosition, 'El panel vigente debe cargar después de la compatibilidad histórica.');

console.log('OK: el wrapper CS21A60 quedó inerte y ResourcesPanel CS21A65 conserva el portal administrativo por rol real.');
