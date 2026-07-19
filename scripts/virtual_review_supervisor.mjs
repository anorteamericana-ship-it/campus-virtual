import fs from 'node:fs';
import path from 'node:path';

const outDir = path.join(process.cwd(), 'qa-output');
fs.mkdirSync(outDir, { recursive: true });

function readJson(file) {
  const full = path.join(outDir, file);
  if (!fs.existsSync(full)) return null;
  try { return JSON.parse(fs.readFileSync(full, 'utf8')); }
  catch (error) { return { findings: [{ severity: 'P1', title: `Informe ilegible: ${file}`, evidence: error.message, type: 'supervisión' }] }; }
}

const sources = [readJson('static-report.json'), readJson('browser-report.json')].filter(Boolean);
const unique = new Map();
for (const source of sources) {
  for (const item of source.findings || []) {
    const key = [item.severity, item.title, item.evidence].join('|').toLowerCase();
    if (!unique.has(key)) unique.set(key, item);
  }
}
const findings = [...unique.values()];
const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
for (const finding of findings) counts[finding.severity] = (counts[finding.severity] || 0) + 1;

let verdict = 'APTO';
if (counts.P0 || counts.P1) verdict = 'BLOQUEADO';
else if (counts.P2) verdict = 'APTO CON RESERVAS';
if (!sources.length) verdict = 'INDETERMINADO';

const manual = [
  'Prueba autenticada con una cuenta controlada de estudiante, docente y superadmin.',
  'Confirmar permisos reales de Drive para abrir y descargar PDFs.',
  'Comparar el Code.gs desplegado con el backend observado en documentación.',
  'Probar operaciones críticas desde dos pestañas o dispositivos antes de entregar.',
];
const report = {
  generated_at: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || 'local',
  verdict,
  counts,
  source_reports: sources.length,
  findings,
  manual_tests_required: manual,
  policy: 'El equipo virtual informa; no corrige, no hace push y no fusiona.',
};
fs.writeFileSync(path.join(outDir, 'supervisor-report.json'), JSON.stringify(report, null, 2));

const lines = [
  '# QA virtual · Informe del supervisor',
  '',
  `- Commit: ${report.commit}`,
  `- Fecha: ${report.generated_at}`,
  `- Veredicto: **${verdict}**`,
  `- Hallazgos: P0 ${counts.P0} · P1 ${counts.P1} · P2 ${counts.P2} · P3 ${counts.P3}`,
  `- Informes recibidos: ${sources.length}/2`,
  `- Política: ${report.policy}`,
  '',
  '## Hallazgos consolidados',
  '',
];
if (!findings.length) lines.push('No se detectaron hallazgos consolidados.', '');
for (const item of findings) {
  lines.push(`### ${item.severity} · ${item.title}`, '', `- Tipo: ${item.type || 'no indicado'}`, item.scenario ? `- Escenario: ${item.scenario}` : '', `- Evidencia: ${item.evidence}`, '').filter(Boolean);
}
lines.push('## Pruebas manuales todavía requeridas', '', ...manual.map(value => `- ${value}`), '');
fs.writeFileSync(path.join(outDir, 'supervisor-report.md'), lines.join('\n'));
console.log(`SUPERVISOR: ${verdict}; P0=${counts.P0} P1=${counts.P1} P2=${counts.P2} P3=${counts.P3}`);
