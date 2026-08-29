import fs from 'node:fs';

const drawer = fs.readFileSync('src/ventas_drawer.jsx', 'utf8');

function check(condition, message) {
  if (!condition) {
    console.error(`FAIL CS21A157: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
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
for (const marker of forbidden) check(!drawer.includes(marker), `drawer excludes hardcoded QA marker: ${marker}`);

check(drawer.includes('const puedeSubirFirmada = !!codigo;'), 'signed enrollment upload requires a real student code');
check(drawer.includes('{!matriculado ? ('), 'documents remain locked until MATRICULADO');
check(!drawer.includes('!matriculado && !preview'), 'matriculation lock has no QA bypass');
check(drawer.includes('d.whatsapp || d.WHATSAPP || d.telefono || d.TELEFONO'), 'document sharing prioritizes WhatsApp over alternate phone');
check(drawer.includes("generar('CARTA', 'MATRICULA_2', 'No se pudo generar la carta de no deuda.')"), 'CONAPE carta error copy is user-safe');
check(drawer.includes('El Reglamento Estudiantil aún no está disponible.'), 'reglamento missing-state copy is user-safe');
check(drawer.includes('if (demo)'), 'general design demo behavior remains intentionally untouched');

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A157 static QA PASS');
