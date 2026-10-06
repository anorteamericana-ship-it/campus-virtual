import fs from 'node:fs';

const src = fs.readFileSync('src/aperturas_admin_cs21a20.jsx', 'utf8');
const css = fs.readFileSync('styles/aperturas_admin_cs21a20.css', 'utf8');
const campus = fs.readFileSync('campus.html', 'utf8');

const checks = [
  [src.includes("apPost('getGruposEnCursoAdmin')"), 'carga grupos en curso'],
  [src.includes("apPost('actualizarGrupoEnCursoAdmin'"), 'guarda grupos en curso'],
  [src.includes('disponible_inscripcion:form.disponible_inscripcion'), 'toggle matrícula apertura'],
  [src.includes('recalcular_nivel:grupo.calendario_desalineado === true'), 'desalineación auto-recalcula'],
  [src.includes('Grupos en curso'), 'panel grupos en curso'],
  [src.includes('<GruposEnCursoPanel />'), 'panel montado en Gestión Académica'],
  [css.includes('.ap-enrollment-toggle'), 'estilo toggle matrícula'],
  [css.includes('.ap-card-course'), 'estilo grupos en curso'],
  [campus.includes('aperturas_admin_cs21a20.jsx?v=F98.4Z6CS21A212'), 'cache bust JSX'],
  [campus.includes('aperturas_admin_cs21a20.css?v=F98.4Z6CS21A212'), 'cache bust CSS'],
];

let failed = 0;
for (const [ok, label] of checks) {
  console.log((ok ? 'PASS ' : 'FAIL ') + label);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log('PASS ' + checks.length + '/' + checks.length);
