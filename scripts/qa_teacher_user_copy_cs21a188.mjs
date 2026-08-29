import fs from 'node:fs';

const views = fs.readFileSync('src/teacher_views.jsx', 'utf8');

function must(ok, label) {
  if (!ok) throw new Error(`CS21A188 FAIL: ${label}`);
}

must(views.includes('Elegí el grupo que querés visualizar.'), 'natural CR teacher group selector copy present');
must(views.includes('No hay grupos activos asignados en este momento.'), 'consistent empty-groups copy present');
must(views.includes('Preparando estudiantes, cronograma, asistencia y notas oficiales'), 'user-facing loading copy present');

must(!views.includes('Elije el grupo que deseas visualizar'), 'incorrect/non-local selector copy removed');
must(!views.includes('No hay grupos En curso asignados.'), 'internal-status capitalization removed');
must(!views.includes('Uniendo GRUPOS, ESTATUS, cronograma, asistencia y notas oficiales'), 'internal sheet/state names removed from visible loader');

must(views.includes('function teacherSessionSafeUserError'), 'safe error boundary preserved');

console.log('CS21A188 TEACHER USER COPY: PASS');
console.log('SELECTOR_COPY=PASS');
console.log('EMPTY_GROUPS_COPY=PASS');
console.log('LOADING_COPY_NO_INTERNAL_NAMES=PASS');
