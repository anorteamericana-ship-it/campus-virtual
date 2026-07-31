import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const self = path.relative(root, new URL(import.meta.url).pathname).replace(/^\//, '').replace(/\\/g, '/');
const errors = [];
const warnings = [];

const candidates = [
  {
    file: 'master_preview_temp.html',
    canonical: null,
    reason: 'Preview local con backend mock y datos demostrativos.',
  },
  {
    file: 'src/login_v1.jsx',
    canonical: 'src/login.jsx',
    reason: 'Versión histórica; login.html carga src/login.jsx.',
  },
  {
    file: 'src/SOLICI~2.JSX',
    canonical: 'src/solicitudes_unificadas.jsx',
    reason: 'Nombre corto DOS/Windows y versión histórica del módulo de solicitudes.',
  },
  {
    file: 'src/ADMIN_~4.JSX',
    canonical: 'src/admin_master_dashboard.jsx',
    reason: 'Nombre corto DOS/Windows y versión anterior del Panel Maestro.',
  },
];

const studentStandardRoutes = [
  'dashboard',
  'mi_curso',
  'evaluaciones',
  'ican',
  'academia_play',
  'pagos',
  'certificados',
  'documentos_ayuda',
];

const studentCustomRoutes = [
  'perfil_estudiante',
  'info_programa',
  'resumen_academico',
  'syllabus_estudiante',
  'planeamiento_estudiante',
  'plan_estudio_estudiante',
  'cronograma_general_estudiante',
  'libros_audios_estudiante',
  'recursos_adicionales',
];

const ignoredDirectories = new Set(['.git', 'node_modules']);
const textExtensions = new Set([
  '.css', '.csv', '.html', '.js', '.jsx', '.json', '.md', '.mjs', '.txt', '.yml', '.yaml',
]);

function relative(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function walk(directory) {
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...walk(absolute));
    else output.push(absolute);
  }
  return output;
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
}

function fileInfo(file) {
  const source = read(file);
  return {
    bytes: Buffer.byteLength(source),
    lines: source.split(/\r?\n/).length,
    sha256: sha256(file),
  };
}

function cleanRef(value) {
  return String(value || '').split('#')[0].split('?')[0].replace(/^\.\//, '');
}

function extractHtmlRefs(source) {
  const refs = [];
  for (const match of source.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["']/gi)) {
    const raw = match[1];
    if (/^(?:https?:|data:|\/\/)/i.test(raw)) continue;
    refs.push(cleanRef(raw));
  }
  return refs;
}

function extractLazyRefs(source) {
  const match = source.match(/const\s+F96_LAZY\s*=\s*(\{[\s\S]*?\n\};)/);
  if (!match) {
    errors.push('No se pudo extraer F96_LAZY de src/app.jsx.');
    return [];
  }
  const map = Function(`"use strict";return (${match[1].replace(/;\s*$/, '')});`)();
  return [...new Set(Object.values(map).flat().map(cleanRef))];
}

function containsRoute(source, route) {
  return new RegExp(`["']${route}["']|\\b${route}\\s*:`).test(source);
}

const required = [
  'campus.html',
  'login.html',
  'src/app.jsx',
  'src/data.jsx',
  'src/lazy_loader.jsx',
  'src/login.jsx',
  'src/sidebar.jsx',
  'src/student_menu_academic_cs21a120.jsx',
  'src/student_menu_academic_guard_cs21a120.js',
];

for (const file of required) {
  if (!exists(file)) errors.push(`Falta archivo requerido del núcleo: ${file}`);
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

const campus = read('campus.html');
const login = read('login.html');
const app = read('src/app.jsx');
const studentMenu = read('src/student_menu_academic_cs21a120.jsx');
const staticRefs = extractHtmlRefs(campus);
const loginRefs = extractHtmlRefs(login);
const lazyRefs = extractLazyRefs(app);
const loadedRefs = new Set([...staticRefs, ...loginRefs, ...lazyRefs]);

for (const file of [...loadedRefs]) {
  if (!exists(file)) errors.push(`Una entrada publicada referencia un archivo inexistente: ${file}`);
}

for (const route of studentStandardRoutes) {
  if (!containsRoute(app, route)) errors.push(`No se localizó la ruta estándar del estudiante: ${route}`);
}
for (const route of studentCustomRoutes) {
  if (!containsRoute(studentMenu, route)) errors.push(`No se localizó la ruta académica personalizada: ${route}`);
}

if (!loginRefs.includes('src/login.jsx')) {
  errors.push('login.html no carga src/login.jsx.');
}
if (loginRefs.includes('src/login_v1.jsx')) {
  errors.push('login.html volvió a cargar src/login_v1.jsx.');
}

const coreOrder = [
  'src/data.jsx',
  'src/primitives.jsx',
  'src/sidebar.jsx',
  'src/lazy_loader.jsx',
  'src/student_menu_academic_cs21a120.jsx',
  'src/student_menu_academic_guard_cs21a120.js',
  'src/app.jsx',
];
let previousIndex = -1;
for (const file of coreOrder) {
  const currentIndex = staticRefs.indexOf(file);
  if (currentIndex < 0) errors.push(`campus.html no carga el archivo núcleo: ${file}`);
  else if (currentIndex <= previousIndex) errors.push(`Orden inesperado del núcleo en campus.html: ${file}`);
  previousIndex = currentIndex;
}

const allFiles = walk(root)
  .map(relative)
  .filter(file => textExtensions.has(path.extname(file).toLowerCase()));
const deliveryFiles = allFiles.filter(file =>
  file !== self &&
  !file.startsWith('00_DOCUMENTACION/') &&
  !file.startsWith('skills/')
);

function referencesTo(candidate) {
  const names = new Set([candidate.file, path.posix.basename(candidate.file)]);
  const found = [];
  for (const file of deliveryFiles) {
    if (file === candidate.file) continue;
    const source = read(file);
    if ([...names].some(name => source.includes(name))) found.push(file);
  }
  return found;
}

const candidateReport = [];
for (const candidate of candidates) {
  const references = referencesTo(candidate);
  const loaded = loadedRefs.has(candidate.file);
  const present = exists(candidate.file);

  if (loaded) errors.push(`Candidato de limpieza todavía cargado por una entrada: ${candidate.file}`);
  if (references.length) {
    errors.push(`Candidato ${candidate.file} todavía tiene referencias: ${references.join(', ')}`);
  }
  if (candidate.canonical && !exists(candidate.canonical)) {
    errors.push(`No existe el reemplazo canónico de ${candidate.file}: ${candidate.canonical}`);
  }

  candidateReport.push({
    file: candidate.file,
    present,
    loaded,
    references,
    reason: candidate.reason,
    current: present ? fileInfo(candidate.file) : null,
    canonical: candidate.canonical
      ? { file: candidate.canonical, ...fileInfo(candidate.canonical) }
      : null,
    decision: present ? 'RESPALDAR_Y_RETIRAR' : 'RETIRADO',
  });
}

const endpointUrlPattern = /https:\/\/script\.google\.com\/macros\/s\/[^'"\s<)]+\/exec/g;
const hardcodedBackendFiles = [];
for (const file of deliveryFiles) {
  const matches = [...read(file).matchAll(endpointUrlPattern)].map(match => match[0]);
  if (matches.length) hardcodedBackendFiles.push({ file, urls: [...new Set(matches)] });
}
if (hardcodedBackendFiles.length > 1) {
  warnings.push(`La URL de Apps Script sigue repetida en ${hardcodedBackendFiles.length} archivos de entrega.`);
}

const demoMarkers = [
  "window.APPS_SCRIPT_URL='mock'",
  '127.0.0.1:8765',
  'Santiago',
];
const liveDemoHits = [];
for (const file of deliveryFiles) {
  if (candidates.some(candidate => candidate.file === file)) continue;
  const source = read(file);
  const markers = demoMarkers.filter(marker => source.includes(marker));
  if (markers.length) liveDemoHits.push({ file, markers });
}
if (liveDemoHits.length) {
  warnings.push(`Marcadores de demo localizados fuera de candidatos retirables: ${JSON.stringify(liveDemoHits)}`);
}

const report = {
  audit: 'CS21A145',
  entrypoints: {
    campusStaticRefs: staticRefs.length,
    loginRefs,
    lazyRefs: lazyRefs.length,
  },
  routes: {
    studentStandard: studentStandardRoutes,
    studentCustom: studentCustomRoutes,
  },
  candidates: candidateReport,
  hardcodedBackendFiles,
  liveDemoHits,
  warnings,
  errors,
};

console.log(JSON.stringify(report, null, 2));
for (const warning of warnings) console.warn(`WARN: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}
console.log('AUDIT OK: núcleo, rutas estudiantiles y candidatos de limpieza verificados.');
