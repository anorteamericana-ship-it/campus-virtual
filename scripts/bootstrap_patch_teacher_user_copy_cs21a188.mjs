import fs from 'node:fs';

const path = 'src/teacher_views.jsx';
let s = fs.readFileSync(path, 'utf8');

function replaceOnce(oldText, newText, label) {
  const count = s.split(oldText).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exact preimage once, found ${count}`);
  s = s.replace(oldText, newText);
}

replaceOnce(
  'Elije el grupo que deseas visualizar',
  'Elegí el grupo que querés visualizar.',
  'group selector copy'
);
replaceOnce(
  'No hay grupos En curso asignados.',
  'No hay grupos activos asignados en este momento.',
  'empty groups copy'
);
replaceOnce(
  'Uniendo GRUPOS, ESTATUS, cronograma, asistencia y notas oficiales',
  'Preparando estudiantes, cronograma, asistencia y notas oficiales',
  'loading copy'
);

fs.writeFileSync(path, s, 'utf8');
console.log('CS21A188 exact copy patch applied');
