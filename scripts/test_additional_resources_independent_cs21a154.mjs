import assert from 'node:assert/strict';
import fs from 'node:fs';

const panel = fs.readFileSync('src/additional_resources_panel_cs21a68.jsx', 'utf8');
const studentMenu = fs.readFileSync('src/student_menu_academic_cs21a120.jsx', 'utf8');
const campus = fs.readFileSync('campus.html', 'utf8');

assert.match(panel, /F98\.4-Z6-CS21A154/);
assert.match(panel, /function\s+AdditionalResourcesPanel\s*\(/);
assert.match(panel, /window\.AdditionalResourcesPanel\s*=\s*AdditionalResourcesPanel/);
assert.match(panel, /getBibliotecaNivelEstudiante/);
assert.match(panel, /resourcesForRole/);
assert.match(panel, /Diccionario Word by Word/);

assert.doesNotMatch(panel, /(?:window\.)?MaterialesView\s*=/);
assert.doesNotMatch(panel, /__base\s*=/);
assert.doesNotMatch(panel, /MutationObserver/);
assert.doesNotMatch(panel, /querySelector\(['"]aside|querySelectorAll\(['"]aside/);
assert.doesNotMatch(panel, /insertAdjacentElement|createPortal/);
assert.doesNotMatch(panel, /an:resources-panel-mode|an_teacher_materiales_tab/);
assert.doesNotMatch(panel, /setInterval\s*\(/);

assert.match(studentMenu, /route===['"]recursos_adicionales['"]/);
assert.match(studentMenu, /window\.AdditionalResourcesPanel/);
assert.match(studentMenu, /id:['"]recursos_adicionales['"]/);
assert.match(studentMenu, /label:['"]Recursos adicionales['"]/);
assert.match(campus, /src\/additional_resources_panel_cs21a68\.jsx/);
assert.ok(
  campus.indexOf('src/additional_resources_panel_cs21a68.jsx') < campus.indexOf('src/student_menu_academic_cs21a120.jsx'),
  'El componente debe publicarse antes del menú que lo consume.'
);

console.log('OK: Recursos adicionales se publica como componente independiente y la ruta estudiantil lo consume directamente.');
