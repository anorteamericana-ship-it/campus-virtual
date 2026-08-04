import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const teacher = read('src/teacher_cs21a.jsx');
const orderFix = read('src/teacher_cs21a_order_fix.jsx');
const compatibility = read('src/resources_panel_cs21a65.jsx');
const additionalResources = read('src/additional_resources_panel_cs21a68.jsx');
const guard = read('src/student_menu_academic_guard_cs21a120.js');
const inlineAudio = read('src/book_inline_audio_cs21a63.js');
const viewer = read('src/book_unit_starts_cs21a60.jsx');
const campus = read('campus.html');

assert.match(teacher, /section:['"]Recursos Didácticos['"]\s*,\s*items:\[\s*\{\s*id:['"]libros_docente['"][\s\S]{0,180}?label:['"]Libros y Audios['"]/);
assert.equal((teacher.match(/id:['"]libros_docente['"]/g) || []).length, 1);
assert.equal((teacher.match(/intent:['"]libros['"]/g) || []).length, 1);
assert.doesNotMatch(teacher, /id:['"]biblioteca_docente['"]|id:['"]audios_docente['"]/);
assert.doesNotMatch(teacher, /label:['"]Biblioteca digital['"]|label:['"]Libros de texto['"]|label:['"]Audios['"]/);
assert.match(teacher, /libros:\[['"]Recursos Didácticos['"],['"]Libros y Audios['"]/);
assert.match(teacher, /data-nav-id=\{item\.id\}/);
assert.match(teacher, /aria-current=\{isActive\(item\) \? ['"]page['"] : undefined\}/);
assert.match(teacher, /const\s+\[intent,\s*setIntent\]\s*=\s*React\.useState\(\(\)\s*=>\s*sessionStorage\.getItem\(['"]an_teacher_materiales_tab['"]\)\s*\|\|\s*['"]info['"]\)/);
assert.match(teacher, /window\.addEventListener\(['"]an:teacher-material-tab['"],\s*syncIntent\)/);
assert.match(teacher, /window\.removeEventListener\(['"]an:teacher-material-tab['"],\s*syncIntent\)/);
assert.match(teacher, /if\(item\.intent\)\s*\{\s*setIntent\(item\.intent\);\s*setHubScreen\(item\.intent\);\s*\}/);
assert.match(teacher, /const\s+BookResources\s*=\s*window\.__AN_BOOK_RESOURCES_COMPONENT__/);
assert.match(teacher, /screen\s*===\s*['"]libros['"][\s\S]{0,220}?<BookResources\s+initialType=['"]SB['"]\s*\/>/);
assert.doesNotMatch(teacher, /\['syllabus','planeamiento','cronograma_modulo','cronograma_general','libros'\]/);

assert.match(orderFix, /F98\.4-Z6-CS21A152/);
assert.match(orderFix, /__AN_TEACHER_ORDER_FIX_COMPATIBILITY__/);
assert.doesNotMatch(orderFix, /(?:window\.)?MaterialesView\s*=/);
assert.doesNotMatch(orderFix, /__base\s*=|__cs21a58books|React|fetch\s*\(|addEventListener|setInterval|MutationObserver/);

assert.match(compatibility, /F98\.4-Z6-CS21A157/);
assert.match(compatibility, /__AN_RESOURCES_PANEL_COMPATIBILITY__/);
assert.doesNotMatch(compatibility, /(?:window\.)?Sidebar\s*=/);
assert.doesNotMatch(compatibility, /__base\s*=|MutationObserver|requestAnimationFrame|an:lazy-module-loaded|an:teacher-material-tab/);

assert.match(additionalResources, /F98\.4-Z6-CS21A154/);
assert.match(additionalResources, /window\.AdditionalResourcesPanel\s*=\s*AdditionalResourcesPanel/);
assert.doesNotMatch(additionalResources, /(?:window\.)?MaterialesView\s*=/);
assert.doesNotMatch(additionalResources, /__base\s*=|MutationObserver|requestAnimationFrame|MODE_KEY|MODE_EVENT|BUTTON_ID_PREFIX/);

assert.doesNotMatch(guard, /__cs21a65UnifiedResources|__cs21a59AdminResources|__cs21a60SuperResources/);
assert.match(guard, /__cs21a69ActiveState/);
assert.match(guard, /__cs21a120StudentMenu/);

assert.match(inlineAudio, /F98\.4-Z6-CS21A157/);
assert.match(inlineAudio, /data-screen-label\*=\"CS21A75\"/);
assert.doesNotMatch(inlineAudio, /data-screen-label\*=\"CS21A60\"/);
assert.match(inlineAudio, /Audio de la unidad seleccionada/);
assert.match(inlineAudio, /Recursos adicionales del nivel/);
assert.match(inlineAudio, /getBibliotecaNivelEstudiante/);
assert.match(inlineAudio, /getAudioPistaEstudiante/);

assert.match(viewer, /data-screen-label=\{`\$\{studentMode \? ['"]Estudiante['"] : ['"]Recursos['"]\} · CS21A75 · Libros`\}/);
assert.match(viewer, /window\.__AN_BOOK_RESOURCES_COMPONENT__\s*=\s*BookResourcesCS21A60/);
assert.match(viewer, /const\s+TONES\s*=\s*\{[\s\S]*?SB:\s*\{[\s\S]*?TB:\s*\{[\s\S]*?WB:\s*\{/);
assert.match(viewer, /function\s+TypeButtons\s*\(\{\s*type,\s*setType,\s*allowedTypes\s*\}\)/);
assert.match(viewer, /allowedTypes\.map\(key\s*=>/);
assert.match(viewer, /const\s+allowedTypes\s*=\s*studentMode\s*\?\s*\[['"]SB['"],\s*['"]WB['"]\]\s*:\s*\[['"]SB['"],\s*['"]TB['"],\s*['"]WB['"]\]/);
assert.match(viewer, /<TypeButtons\s+type=\{bookType\}\s+setType=\{setBookType\}\s+allowedTypes=\{allowedTypes\}\s*\/>/);
assert.doesNotMatch(viewer, /an_teacher_materiales_tab/);
assert.doesNotMatch(viewer, /role\s*===\s*['"]teacher['"][\s\S]{0,180}?BookResourcesCS21A60/);
assert.doesNotMatch(viewer, /role\s*===\s*['"]docente['"][\s\S]{0,180}?BookResourcesCS21A60/);

const order = [
  'src/teacher_cs21a_order_fix.jsx',
  'src/book_unit_starts_cs21a60.jsx',
  'src/book_inline_audio_cs21a63.js',
  'src/resources_panel_cs21a65.jsx',
  'src/additional_resources_panel_cs21a68.jsx',
].map(file => {
  const index = campus.indexOf(file);
  assert.notEqual(index, -1, `${file} debe estar publicado.`);
  return index;
});
assert.ok(order[0] < order[1] && order[1] < order[2] && order[2] < order[3] && order[3] < order[4], 'Las compatibilidades inertes deben cargar antes del visor y sus extensiones independientes.');

console.log('OK CS21A163: TeacherHub es propietario de Libros y Audios; CS21A58 y CS21A68 no envuelven MaterialesView.');
