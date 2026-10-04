import fs from 'node:fs';

const drawer = fs.readFileSync('src/ventas_drawer.jsx', 'utf8');

function check(condition, message) {
  if (!condition) {
    console.error('FAIL CS21A157: ' + message);
    process.exitCode = 1;
  } else {
    console.log('PASS: ' + message);
  }
}

const forbidden = [
  '120180140',
  'previewMatriculaCR',
  'cedulaPreviewMatricula',
  'preview_test:',
  'CERT_MATRICULA_INA_TEST',
  'CERT_MATRICULA_SIN_INA_TEST',
  'Modo prueba controlado',
  'Estos botones son temporales y solo aparecen para este prospecto de prueba.',
];
for (const marker of forbidden) check(!drawer.includes(marker), 'drawer excludes hardcoded QA marker: ' + marker);

check(drawer.includes("const codigo = String(d.codigo || d.codigo_estudiante"), 'document workflow derives the real student code');
check(drawer.includes("const matriculado = !!codigo || est.estado === 'MATRICULADO';"), 'real student code unlocks matriculated document workflow');
check(drawer.includes('if (!codigo)'), 'signed enrollment upload requires a real student code');
check(!drawer.includes('!matriculado && !preview'), 'matriculation lock has no QA bypass');
check(!drawer.includes('Carta de no deuda (CONAPE)'), 'seller no longer receives CONAPE no-debt generation');
check(!drawer.includes("tipo:'MATRICULA_2'"), 'seller document workflow no longer calls no-debt generation');
check(drawer.includes('1K_yZjUpiPF6MtXgapeFq7J314qqPQ-Ei'), 'official student regulation is wired');
check(drawer.includes('Ventas solo puede consultarla'), 'seller read-only copy is explicit after signed enrollment');
check(drawer.includes('if (demo)'), 'general design demo behavior remains intentionally untouched');

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A157 static QA PASS');