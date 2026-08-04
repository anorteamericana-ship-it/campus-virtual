import assert from 'node:assert/strict';
import fs from 'node:fs';

const compatibility = fs.readFileSync('src/admin_resources_superadmin_cs21a60.jsx', 'utf8');
const app = fs.readFileSync('src/app.jsx', 'utf8');
const resourcesCompatibility = fs.readFileSync('src/resources_panel_cs21a65.jsx', 'utf8');
const adminView = fs.readFileSync('src/admin_resources_view_cs21a156.jsx', 'utf8');
const sidebar = fs.readFileSync('src/sidebar.jsx', 'utf8');
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
assert.match(app, /recursos_didacticos:\s*<LazyRoute[^>]*component=['"]AdminResourcesView['"]/);

assert.match(sidebar, /id:\s*['"]recursos_didacticos['"]\s*,\s*label:\s*['"]Libros y Audios['"]/);
assert.match(sidebar, /data-nav-id=\{item\.id\}/);
assert.match(sidebar, /aria-current=\{active===item\.id \? ['"]page['"] : undefined\}/);

assert.match(adminView, /function\s+AdminResourcesView\s*\(/);
assert.match(adminView, /role === ['"]admin['"] \|\| role === ['"]superadmin['"]/);
assert.match(adminView, /window\.AdminResourcesView\s*=\s*AdminResourcesView/);
assert.doesNotMatch(adminView, /(?:window\.)?Sidebar\s*=|AdminMasterDashboard|createPortal|MutationObserver/);

assert.match(resourcesCompatibility, /F98\.4-Z6-CS21A157/);
assert.match(resourcesCompatibility, /__AN_RESOURCES_PANEL_COMPATIBILITY__/);
assert.doesNotMatch(resourcesCompatibility, /function\s+currentRole\s*\(|AdminResourcesPortal|__cs21a65UnifiedResources/);
assert.doesNotMatch(resourcesCompatibility, /(?:window\.)?Sidebar\s*=|ReactDOM|createPortal|MutationObserver|setInterval/);

const historicalPosition = campus.indexOf('src/admin_resources_superadmin_cs21a60.jsx');
const viewerPosition = campus.indexOf('src/book_unit_starts_cs21a60.jsx');
const resourcesCompatibilityPosition = campus.indexOf('src/resources_panel_cs21a65.jsx');
assert.ok(historicalPosition >= 0, 'La ruta histórica CS21A60 debe conservarse durante la transición.');
assert.ok(viewerPosition > historicalPosition, 'El visor canónico debe cargar después de la compatibilidad histórica.');
assert.ok(resourcesCompatibilityPosition > viewerPosition, 'La compatibilidad CS21A157 debe cargar después del visor canónico.');

console.log('OK: CS21A60 y CS21A65 quedaron inertes; superadmin usa ruta y componente administrativos canónicos.');
