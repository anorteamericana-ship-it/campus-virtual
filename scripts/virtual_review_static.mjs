import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'qa-output');
fs.mkdirSync(outDir, { recursive: true });

const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const cleanRef = value => String(value || '').split('#')[0].split('?')[0];
const findings = [];

function add(severity, category, title, evidence, confidence = 'alta') {
  const id = `VQA-${String(findings.length + 1).padStart(3, '0')}`;
  findings.push({ id, severity, category, title, evidence, confidence, type: 'estática' });
}

function walk(dir) {
  if (!exists(dir)) return [];
  const output = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...walk(relative));
    else output.push(relative);
  }
  return output;
}

function extractAssets(html, source) {
  const refs = [];
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["']/gi)) {
    const raw = match[1];
    if (/^(?:https?:|data:|\/\/)/i.test(raw)) continue;
    refs.push({ raw, file: cleanRef(raw), source });
  }
  return refs;
}

function extractLazyMap(source) {
  const match = source.match(/const\s+F96_LAZY\s*=\s*(\{[\s\S]*?\n\};)/);
  if (!match) throw new Error('No se pudo extraer F96_LAZY de src/app.jsx.');
  return Function(`"use strict";return (${match[1].replace(/;\s*$/, '')});`)();
}

function extractCssAssets(styleFiles) {
  const refs = [];
  for (const file of styleFiles) {
    const directory = path.posix.dirname(file);
    for (const match of read(file).matchAll(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi)) {
      const raw = String(match[2] || '').trim();
      if (!raw || /^(?:https?:|data:|blob:|\/\/|#|var\()/i.test(raw)) continue;
      const cleaned = cleanRef(raw);
      const resolved = cleaned.startsWith('/')
        ? cleaned.replace(/^\/+/, '')
        : path.posix.normalize(path.posix.join(directory, cleaned));
      refs.push({ raw, file: resolved, source: file });
    }
  }
  return refs;
}

function endpointNames(source) {
  const found = new Set();
  const patterns = [
    /(?:postCampusData|postStudentDash|postStudentModules|postSidebar|postSyllabus|postEndpoint|postAppF87)\(\s*["']([A-Za-z0-9_]+)["']/g,
    /\bfn\s*:\s*["']([A-Za-z0-9_]+)["']/g,
    /\?fn=([A-Za-z0-9_]+)/g,
  ];
  for (const pattern of patterns) for (const match of source.matchAll(pattern)) found.add(match[1]);
  return found;
}

const rootHtmlFiles = fs.readdirSync(root, { withFileTypes: true })
  .filter(entry => entry.isFile() && /\.html$/i.test(entry.name))
  .map(entry => entry.name);
const moduleHtmlFiles = walk('modulos').filter(file => /\.html$/i.test(file));
const htmlFiles = [...new Set([...rootHtmlFiles, ...moduleHtmlFiles])];
const app = read('src/app.jsx');
const sourceFiles = walk('src').filter(file => /\.(?:js|jsx)$/i.test(file));
const styleFiles = walk('styles').filter(file => /\.css$/i.test(file));
const allSources = sourceFiles.map(file => ({ file, text: read(file) }));
const staticAssets = htmlFiles.flatMap(file => extractAssets(read(file), file));

let lazyAssets = [];
try {
  const lazyMap = extractLazyMap(app);
  lazyAssets = [...new Set(Object.values(lazyMap).flat())].map(raw => ({
    raw,
    file: cleanRef(raw),
    source: 'src/app.jsx · F96_LAZY',
  }));
} catch (error) {
  add('P1', 'entrega', 'No se pudo auditar el cargador diferido', error.message);
}

const reachableStyleFiles = [...new Set(
  [...staticAssets, ...lazyAssets]
    .map(ref => ref.file)
    .filter(file => /\.css$/i.test(file) && exists(file))
)];
const cssAssets = extractCssAssets(reachableStyleFiles);
const allAssetRefs = [...staticAssets, ...lazyAssets, ...cssAssets];
for (const ref of allAssetRefs) {
  if (!exists(ref.file)) add('P1', 'entrega', 'Recurso local inexistente', `${ref.file} · referencia ${ref.raw} en ${ref.source}.`);
}

const refsByFile = new Map();
for (const ref of [...staticAssets, ...lazyAssets]) {
  if (!refsByFile.has(ref.file)) refsByFile.set(ref.file, new Set());
  refsByFile.get(ref.file).add(ref.raw);
}
for (const [file, refs] of refsByFile) {
  if (refs.size > 1) add('P2', 'caché', 'Un mismo archivo se publica con versiones distintas', `${file}: ${[...refs].join(' | ')}`);
}

const endpointFiles = new Map();
for (const { file, text } of allSources) {
  for (const endpoint of endpointNames(text)) {
    if (!endpointFiles.has(endpoint)) endpointFiles.set(endpoint, []);
    endpointFiles.get(endpoint).push(file);
  }
}

if (exists('00_DOCUMENTACION/BACKEND_OBSERVADO_CS21A131.json')) {
  const backend = JSON.parse(read('00_DOCUMENTACION/BACKEND_OBSERVADO_CS21A131.json'));
  for (const endpoint of backend.verified_missing || []) {
    if (endpointFiles.has(endpoint)) {
      add('P2', 'contrato backend', 'Endpoint usado por frontend ausente en backend observado', `${endpoint}: ${endpointFiles.get(endpoint).join(', ')}`);
    }
  }
}

const utcRisks = [];
const fetchOverrides = [];
const componentOverrides = [];
const silentCatches = [];
for (const { file, text } of allSources) {
  if (/toISOString\(\)\.slice\(0\s*,\s*10\)/.test(text)) utcRisks.push(file);
  if (/window\.fetch\s*=/.test(text)) fetchOverrides.push(file);
  if (/(?:window\.)?MaterialesView\s*=/.test(text)) componentOverrides.push(file);
  if (/catch\s*\([^)]*\)\s*\{\s*\}|\.catch\(\s*\(?.*?\)?\s*=>\s*\{\s*\}\s*\)/s.test(text)) silentCatches.push(file);
}
if (utcRisks.length) add('P2', 'fechas', 'Lógica de fecha potencialmente basada en UTC', utcRisks.join(', '), 'media');
if (fetchOverrides.length > 3) add('P2', 'arquitectura', 'Múltiples capas sustituyen window.fetch', `${fetchOverrides.length} archivos: ${fetchOverrides.join(', ')}`, 'media');
if (componentOverrides.length > 2) add('P2', 'arquitectura', 'Múltiples módulos sustituyen MaterialesView', `${componentOverrides.length} archivos: ${componentOverrides.join(', ')}`, 'alta');
if (silentCatches.length) add('P3', 'diagnóstico', 'Errores potencialmente silenciados', silentCatches.join(', '), 'media');

const placeholders = [...app.matchAll(/Próximamente|aún no está conectado/gi)].length;
if (placeholders) add('P3', 'alcance', 'Módulos administrativos todavía no conectados', `${placeholders} referencias explícitas en src/app.jsx.`);

const requiredSkills = [
  'skills/campus-qa-engineer/SKILL.md',
  'skills/campus-logic-auditor/SKILL.md',
  'skills/campus-release-supervisor/SKILL.md',
];
for (const file of requiredSkills) if (!exists(file)) add('P1', 'gobernanza', 'Skill requerido ausente', file);

const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
for (const finding of findings) counts[finding.severity] += 1;
const verdict = counts.P0 || counts.P1 ? 'BLOQUEADO' : counts.P2 ? 'APTO CON RESERVAS' : 'APTO';
const report = {
  generated_at: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || 'local',
  verdict,
  counts,
  coverage: {
    html_surfaces: htmlFiles.length,
    static_assets: staticAssets.length,
    lazy_assets: lazyAssets.length,
    reachable_styles: reachableStyleFiles.length,
    css_assets: cssAssets.length,
    source_files: sourceFiles.length,
    endpoints_detected: endpointFiles.size,
  },
  limitations: [
    'No prueba permisos reales de Drive.',
    'No confirma cuál versión de Apps Script está desplegada.',
    'No usa estudiantes, docentes, pagos ni notas reales.',
    'Los archivos no alcanzables desde HTML o F96_LAZY no bloquean la entrega.',
  ],
  findings,
};

fs.writeFileSync(path.join(outDir, 'static-report.json'), JSON.stringify(report, null, 2));
const lines = [
  '# Informe del equipo virtual · Auditoría estática',
  '',
  `- Commit: ${report.commit}`,
  `- Veredicto: **${verdict}**`,
  `- Hallazgos: P0 ${counts.P0} · P1 ${counts.P1} · P2 ${counts.P2} · P3 ${counts.P3}`,
  `- Cobertura: ${htmlFiles.length} superficies HTML, ${staticAssets.length} recursos publicados, ${lazyAssets.length} diferidos, ${reachableStyleFiles.length} CSS alcanzables y ${endpointFiles.size} endpoints.`,
  '',
  '## Hallazgos',
  '',
];
if (!findings.length) lines.push('No se detectaron hallazgos estáticos.');
for (const finding of findings) {
  lines.push(`### ${finding.id} · ${finding.severity} · ${finding.title}`, '', `- Categoría: ${finding.category}`, `- Confianza: ${finding.confidence}`, `- Evidencia: ${finding.evidence}`, '');
}
lines.push('## Limitaciones', '', ...report.limitations.map(value => `- ${value}`), '');
fs.writeFileSync(path.join(outDir, 'static-report.md'), lines.join('\n'));

console.log(`VIRTUAL QA: ${verdict}; P0=${counts.P0} P1=${counts.P1} P2=${counts.P2} P3=${counts.P3}`);
if (counts.P0 || counts.P1) process.exit(1);
