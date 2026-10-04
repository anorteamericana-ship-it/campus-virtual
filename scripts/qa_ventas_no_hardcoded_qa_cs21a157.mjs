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
check(!drawer.includes("generar('CARTA'"), 'Ventas no longer generates Carta de no deuda');
check(!drawer.includes('Carta de no deuda (CONAPE)'), 'Carta de no deuda is removed from the seller surface');
check(drawer.includes("REGLAMENTO_TIPO_PRIVADO = 'REGLAMENTO'"), 'Reglamento estudiantil is wired to private delivery');
check(drawer.includes('openReglamentoPrivate'), 'seller can open Reglamento estudiantil through authenticated delivery');
check(drawer.includes("const puedeActualizarFirmada = rolActual === 'admin' || rolActual === 'superadmin';"), 'only admin/superadmin keep signed-enrollment update controls');
check(drawer.includes('!firmadaRegistrada || puedeActualizarFirmada'), 'seller generation/upload controls close after the first signed document');
check(drawer.includes('if (demo)'), 'general design demo behavior remains intentionally untouched');

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A157 static QA PASS');
