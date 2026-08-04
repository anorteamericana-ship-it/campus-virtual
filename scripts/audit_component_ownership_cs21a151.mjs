import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'qa-output', 'component-ownership-cs21a151');
fs.mkdirSync(outputDir, { recursive: true });

const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const normalizeRef = value => String(value || '').split('#')[0].split('?')[0].replace(/^\.\//, '');

const CRITICAL_GLOBALS = [
  'Sidebar',
  'MaterialesView',
  'AdminMasterDashboard',
  'AdminEstudiantesView',
  'CalendarioGrupoOperativo',
  'ImportadorBancario',
  'AplicarPago',
  'ClubICANDocenteView',
  'ICANViewNew',
  'GruposView',
  'CronogramaDocenteSeguroF82',
];

function walk(relativeDir) {
  const absolute = path.join(root, relativeDir);
  if (!fs.existsSync(absolute)) return [];
  const found = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.posix.join(relativeDir, entry.name);
    if (entry.isDirectory()) found.push(...walk(relative));
    else found.push(relative);
  }
  return found;
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

function extractDirectScripts() {
  const html = read('campus.html');
  const scripts = [];
  for (const match of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)) {
    const file = normalizeRef(match[1]);
    if (!file || /^(?:https?:|\/\/)/i.test(file)) continue;
    scripts.push({ file, surface: 'campus.html', order: scripts.length + 1 });
  }
  return scripts;
}

function extractLazyMap() {
  const app = read('src/app.jsx');
  const match = app.match(/const\s+F96_LAZY\s*=\s*(\{[\s\S]*?\n\};)/);
  if (!match) return { map: {}, error: 'No se pudo extraer F96_LAZY de src/app.jsx.' };
  try {
    const map = Function(`"use strict"; return (${match[1].replace(/;\s*$/, '')});`)();
    return { map, error: '' };
  } catch (error) {
    return { map: {}, error: error?.message || String(error) };
  }
}

function scanGlobal(file, source, globalName) {
  const records = [];
  const escaped = globalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    { kind: 'declaration', regex: new RegExp(`\\bfunction\\s+${escaped}\\s*\\(`, 'g') },
    { kind: 'declaration', regex: new RegExp(`\\b(?:const|let|var)\\s+${escaped}\\s*=`, 'g') },
    { kind: 'window-assignment', regex: new RegExp(`\\bwindow\\.${escaped}\\s*=`, 'g') },
    { kind: 'bare-assignment', regex: new RegExp(`(?<![.\\w$])${escaped}\\s*=`, 'g') },
    { kind: 'object-publish', regex: new RegExp(`Object\\.assign\\(\\s*window\\s*,\\s*\\{[\\s\\S]{0,500}?\\b${escaped}\\b`, 'g') },
    { kind: 'base-capture', regex: new RegExp(`\\b(?:Base|Previous|Old|Original|Current)[A-Za-z0-9_$]*\\s*=\\s*(?:window\\.)?${escaped}\\b`, 'g') },
    { kind: 'wrapper-marker', regex: new RegExp(`__base\\s*=|__cs21a[A-Za-z0-9_$]*\\s*=`, 'g') },
  ];

  for (const { kind, regex } of patterns) {
    for (const match of source.matchAll(regex)) {
      records.push({
        file,
        line: lineNumber(source, match.index || 0),
        kind,
        excerpt: source.slice(Math.max(0, (match.index || 0) - 80), Math.min(source.length, (match.index || 0) + 180)).replace(/\s+/g, ' ').trim(),
      });
    }
  }

  const unique = [];
  const keys = new Set();
  for (const record of records.sort((a, b) => a.line - b.line || a.kind.localeCompare(b.kind))) {
    const key = `${record.line}|${record.kind}|${record.excerpt}`;
    if (keys.has(key)) continue;
    keys.add(key);
    unique.push(record);
  }
  return unique;
}

const directScripts = extractDirectScripts();
const directOrder = new Map(directScripts.map(item => [item.file, item.order]));
const lazy = extractLazyMap();
const lazyEntries = [];
for (const [bundle, files] of Object.entries(lazy.map || {})) {
  (files || []).forEach((raw, index) => {
    const file = normalizeRef(raw);
    if (file) lazyEntries.push({ bundle, file, order: index + 1 });
  });
}

const sourceFiles = walk('src').filter(file => /\.(?:js|jsx)$/i.test(file));
const sourceMap = new Map(sourceFiles.map(file => [file, read(file)]));
const inventory = {};

for (const globalName of CRITICAL_GLOBALS) {
  const records = [];
  for (const [file, source] of sourceMap) {
    const matches = scanGlobal(file, source, globalName);
    for (const match of matches) {
      records.push({
        ...match,
        directOrder: directOrder.get(file) || null,
        lazyBundles: lazyEntries.filter(item => item.file === file).map(item => ({ bundle: item.bundle, order: item.order })),
        reachable: directOrder.has(file) || lazyEntries.some(item => item.file === file),
      });
    }
  }
  inventory[globalName] = records;
}

const findings = [];
function add(severity, title, evidence) {
  findings.push({ id: `OWN-${String(findings.length + 1).padStart(3, '0')}`, severity, title, evidence });
}

if (lazy.error) add('P1', 'No se pudo leer F96_LAZY', lazy.error);
for (const globalName of CRITICAL_GLOBALS) {
  const records = inventory[globalName] || [];
  const reachable = records.filter(item => item.reachable);
  const declarations = reachable.filter(item => item.kind === 'declaration');
  const assignments = reachable.filter(item => item.kind === 'window-assignment' || item.kind === 'bare-assignment' || item.kind === 'object-publish');
  const wrapperFiles = [...new Set(reachable.filter(item => item.kind === 'base-capture' || item.kind === 'wrapper-marker').map(item => item.file))];
  if (!declarations.length && !assignments.length) {
    add('P2', `Global crítico sin propietario alcanzable: ${globalName}`, 'No se encontró declaración ni publicación en campus.html o F96_LAZY.');
  }
  if (assignments.length > 1 || wrapperFiles.length > 1) {
    add('P2', `Propiedad múltiple de ${globalName}`, `${assignments.length} publicaciones/asignaciones y ${wrapperFiles.length} archivos con patrón de wrapper: ${wrapperFiles.join(', ') || '—'}.`);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || 'local',
  directScripts,
  lazyBundles: lazy.map,
  criticalGlobals: CRITICAL_GLOBALS,
  inventory,
  findings,
  summary: {
    sourceFiles: sourceFiles.length,
    directScripts: directScripts.length,
    lazyFiles: lazyEntries.length,
    globalsAudited: CRITICAL_GLOBALS.length,
    P0: findings.filter(item => item.severity === 'P0').length,
    P1: findings.filter(item => item.severity === 'P1').length,
    P2: findings.filter(item => item.severity === 'P2').length,
    P3: findings.filter(item => item.severity === 'P3').length,
  },
};

fs.writeFileSync(path.join(outputDir, 'component-ownership.json'), JSON.stringify(report, null, 2));

const markdown = [
  '# Auditoría de propiedad de componentes · CS21A151',
  '',
  `- Commit: ${report.commit}`,
  `- Fuentes revisadas: ${report.summary.sourceFiles}`,
  `- Scripts directos: ${report.summary.directScripts}`,
  `- Referencias diferidas: ${report.summary.lazyFiles}`,
  `- Hallazgos: P0 ${report.summary.P0} · P1 ${report.summary.P1} · P2 ${report.summary.P2} · P3 ${report.summary.P3}`,
  '',
  '## Componentes críticos',
  '',
];

for (const globalName of CRITICAL_GLOBALS) {
  markdown.push(`### ${globalName}`, '');
  const records = (inventory[globalName] || []).filter(item => item.reachable);
  if (!records.length) {
    markdown.push('- Sin propietario alcanzable detectado.', '');
    continue;
  }
  for (const record of records) {
    const route = record.directOrder
      ? `campus.html #${record.directOrder}`
      : record.lazyBundles.length
        ? record.lazyBundles.map(item => `${item.bundle} #${item.order}`).join(', ')
        : 'no alcanzable';
    markdown.push(`- \`${record.file}:${record.line}\` · ${record.kind} · ${route}`);
  }
  markdown.push('');
}

markdown.push('## Hallazgos', '');
if (!findings.length) markdown.push('- Sin hallazgos.');
for (const finding of findings) markdown.push(`- **${finding.id} · ${finding.severity} · ${finding.title}** — ${finding.evidence}`);
markdown.push('', '## Regla de uso', '', 'Este informe no autoriza eliminar archivos. La consolidación debe demostrar equivalencia funcional, actualizar la ruta de carga y conservar pruebas por rol antes de retirar cada propietario histórico.', '');

fs.writeFileSync(path.join(outputDir, 'component-ownership.md'), markdown.join('\n'));

console.log(`COMPONENT OWNERSHIP CS21A151: P0=${report.summary.P0} P1=${report.summary.P1} P2=${report.summary.P2} P3=${report.summary.P3}`);
if (report.summary.P0 || report.summary.P1) process.exit(1);
