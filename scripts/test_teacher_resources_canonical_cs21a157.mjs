import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const teacher = read('src/teacher_cs21a.jsx');
const compatibility = read('src/resources_panel_cs21a65.jsx');
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

assert.match(compatibility, /F98\.4-Z6-CS21A157/);
assert.match(compatibility, /__AN_RESOURCES_PANEL_COMPATIBILITY__/);
assert.doesNotMatch(compatibility, /(?:window\.)?Sidebar\s*=/);
assert.doesNotMatch(compatibility, /__base\s*=|MutationObserver|requestAnimationFrame|an:lazy-module-loaded|an:teacher-material-tab/);

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
assert.match(viewer, /\['SB','TB','WB'\]/);

const order = [
  'src/book_unit_starts_cs21a60.jsx',
  'src/book_inline_audio_cs21a63.js',
  'src/resources_panel_cs21a65.jsx',
].map(file => {
  const index = campus.indexOf(file);
  assert.notEqual(index, -1, `${file} debe estar publicado.`);
  return index;
});
assert.ok(order[0] < order[1] && order[1] < order[2], 'El visor debe publicarse antes del audio y la compatibilidad inerte.');

console.log('OK: el docente usa una sola ruta Libros y Audios con visor, pistas y recursos canónicos.');
