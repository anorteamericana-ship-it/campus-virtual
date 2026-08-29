import fs from 'node:fs';

const path = 'src/ventas_drawer.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceExact(before, after, label, expected = 1) {
  const count = src.split(before).length - 1;
  if (count !== expected) throw new Error(`${label}: expected ${expected} matches, found ${count}`);
  src = src.split(before).join(after);
}

replaceExact(
`  const cedulaPreviewMatricula = String(d.cedula || d.CEDULA || '').replace(/[^\\d]/g, '');
  const previewMatriculaCR = cedulaPreviewMatricula === '120180140';
  const codigo = String(d.codigo || d.codigo_estudiante || d.CODIGO_ESTUDIANTE || d.rec_m || '').trim();
  const puedeSubirFirmada = !!codigo || previewMatriculaCR;`,
`  const codigo = String(d.codigo || d.codigo_estudiante || d.CODIGO_ESTUDIANTE || d.rec_m || '').trim();
  const puedeSubirFirmada = !!codigo;`,
'identity-specific preview gate'
);

replaceExact(
"  const waNumDoc = waDigits(d.telefono || d.TELEFONO || d.whatsapp || d.WHATSAPP || d.tel1 || d.TEL1 || d.telefono1 || d.TELEFONO_1 || '');",
"  const waNumDoc = waDigits(d.whatsapp || d.WHATSAPP || d.telefono || d.TELEFONO || d.tel1 || d.TEL1 || d.telefono1 || d.TELEFONO_1 || '');",
'WhatsApp-first document contact'
);

replaceExact('            preview_test: previewMatriculaCR,\n', '', 'preview_test payloads', 2);

replaceExact(
`      {!codigo && !previewMatriculaCR ? <div className="vx-docest-note">La subida firmada requiere código de estudiante real.</div> : null}
      {!codigo && previewMatriculaCR ? <div className="vx-docest-note">Modo prueba: se adjunta por cédula y se usa un código sugerido solo para revisar el flujo. No matricula ni reserva consecutivo.</div> : null}`,
`      {!codigo ? <div className="vx-docest-note">La subida firmada requiere código de estudiante real.</div> : null}`,
'preview upload note'
);

replaceExact('      {!matriculado && !previewMatriculaCR ? (', '      {!matriculado ? (', 'matriculation lock');

const previewStart = '      ) : previewMatriculaCR ? (\n';
const realStart = `      ) : (\n        <React.Fragment>\n          <div className="vx-docest-sub">\n            Estudiante matriculado`;
const start = src.indexOf(previewStart);
const end = src.indexOf(realStart, start + previewStart.length);
if (start < 0 || end < 0) throw new Error(`preview branch bounds not found: start=${start} end=${end}`);
if (src.indexOf(previewStart, start + 1) !== -1) throw new Error('preview branch marker appears more than once');
src = src.slice(0, start) + src.slice(end);

replaceExact(
"generar('CARTA', 'MATRICULA_2', 'Este documento requiere soporte backend.')",
"generar('CARTA', 'MATRICULA_2', 'No se pudo generar la carta de no deuda.')",
'user-safe carta error'
);
replaceExact('title="Falta adjuntar el archivo"', 'title="Reglamento no disponible"', 'reglamento button title');
replaceExact('Falta adjuntar el Reglamento Estudiantil al proyecto.', 'El Reglamento Estudiantil aún no está disponible.', 'reglamento user copy');

for (const forbidden of ['120180140', 'previewMatriculaCR', 'cedulaPreviewMatricula', 'preview_test:', 'CERT_MATRICULA_INA_TEST', 'CERT_MATRICULA_SIN_INA_TEST', 'Modo prueba controlado']) {
  if (src.includes(forbidden)) throw new Error(`forbidden QA marker remains: ${forbidden}`);
}
if (!src.includes('const puedeSubirFirmada = !!codigo;')) throw new Error('real-code upload gate missing');
if (!src.includes("d.whatsapp || d.WHATSAPP || d.telefono")) throw new Error('WhatsApp-first contact ordering missing');
if (!src.includes('El Reglamento Estudiantil aún no está disponible.')) throw new Error('safe reglamento copy missing');

fs.writeFileSync(path, src);
console.log('CS21A157 source patch PASS');
