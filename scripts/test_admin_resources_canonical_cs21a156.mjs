import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const app = read('src/app.jsx');
const sidebar = read('src/sidebar.jsx');
const view = read('src/admin_resources_view_cs21a156.jsx');
const cs59 = read('src/admin_resources_cs21a59.jsx');
const cs61 = read('src/admin_resources_runtime_cs21a61.jsx');
const direct = read('src/admin_resources_direct_cs21a74.js');
const panel = read('src/resources_panel_cs21a65.jsx');
const state = read('src/resources_panel_state_cs21a65.js');
const viewer = read('src/book_unit_starts_cs21a60.jsx');

assert.match(app, /admin_resources:\s*\[\s*['"]src\/book_unit_starts_cs21a60\.jsx[^'"]*['"]\s*,\s*['"]src\/admin_resources_view_cs21a156\.jsx[^'"]*['"]\s*\]/);
assert.match(app, /recursos_didacticos:\s*<LazyRoute[^>]*component=['"]AdminResourcesView['"][^>]*files=\{F96_LAZY\.admin_resources\}/);
assert.match(sidebar, /id:\s*['"]recursos_didacticos['"]\s*,\s*label:\s*['"]Libros y Audios['"]/);
assert.match(sidebar, /label:\s*['"]Recursos didácticos['"]/);
assert.match(sidebar, /key=\{item\.id\}[\s\S]{0,120}?data-nav-id=\{item\.id\}[\s\S]{0,160}?className=\{`sb-item admin-sb-item/);
assert.match(sidebar, /key=\{item\.id\}[\s\S]{0,120}?type=['"]button['"][\s\S]{0,120}?data-nav-id=\{item\.id\}[\s\S]{0,120}?disabled/);

assert.match(view, /function\s+AdminResourcesView\s*\(/);
assert.match(view, /window\.__AN_BOOK_RESOURCES_COMPONENT__/);
assert.match(view, /role === ['"]admin['"] \|\| role === ['"]superadmin['"]/);
assert.match(view, /window\.AdminResourcesView\s*=\s*AdminResourcesView/);
assert.doesNotMatch(view, /AdminMasterDashboard|window\.Sidebar|MaterialesView\s*=/);
assert.doesNotMatch(view, /an_admin_resources_open|an_admin_resources_tab|setInterval|MutationObserver/);

for (const [name, source] of [['CS21A59', cs59], ['CS21A61', cs61], ['CS21A75 directa', direct]]) {
  assert.match(source, /F98\.4-Z6-CS21A156/, `${name} debe declarar la transición.`);
  assert.doesNotMatch(source, /(?:window\.)?AdminMasterDashboard\s*=/, `${name} no debe envolver Panel Maestro.`);
  assert.doesNotMatch(source, /(?:window\.)?Sidebar\s*=/, `${name} no debe envolver Sidebar.`);
  assert.doesNotMatch(source, /(?:window\.)?MaterialesView\s*=/, `${name} no debe envolver MaterialesView.`);
  assert.doesNotMatch(source, /__base\s*=|createPortal|MutationObserver|setInterval/, `${name} debe ser inerte.`);
  assert.doesNotMatch(source, /an_admin_resources_open|an_admin_resources_tab/, `${name} no debe manejar estado de ruta.`);
}

assert.match(panel, /teacherResourcesNormalizerCS21A156/);
assert.match(panel, /TeacherResourcesNormalizer/);
assert.doesNotMatch(panel, /AdminResourcesPortal|AdminResourcesMirror|AdminMasterDashboard/);
assert.doesNotMatch(panel, /recursos_didacticos|an_admin_resources_open|an_admin_resources_tab/);
assert.doesNotMatch(panel, /ReactDOM|createPortal/);
assert.doesNotMatch(panel, /role === ['"]admin['"]|role === ['"]superadmin['"]/);

assert.match(state, /resourcesSupportLoaderCS21A156/);
assert.doesNotMatch(state, /an_admin_resources_open|an:admin-resource-tab|document\.addEventListener\(['"]click['"]/);
assert.match(state, /sidebar_active_state_cs21a69\.js/);
assert.match(state, /teacher_lesson_book_link_cs21a142\.js/);

assert.match(viewer, /const canCalibrate = storedRole === ['"]superadmin['"]/);
assert.match(viewer, /const canRefreshDrive = storedRole === ['"]admin['"] \|\| storedRole === ['"]superadmin['"]/);
assert.match(viewer, /window\.__AN_BOOK_RESOURCES_COMPONENT__\s*=\s*BookResourcesCS21A60/);

console.log('OK: Recursos Didácticos admin usa ruta, menú y componente canónicos sin envolver Panel Maestro.');
