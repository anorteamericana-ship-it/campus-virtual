import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { extractF96LazyMapCS21A193 } from './f96_lazy_map_parser_cs21a193.mjs';

const root = process.cwd();
const outDir = path.join(root, 'dist', 'qa-staging');
const read = relative => fs.readFileSync(path.join(outDir, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(outDir, relative));
const cleanRef = value => String(value || '').split('#')[0].split('?')[0];

const forbiddenFiles = [
  'campus_standalone.html',
  'master_preview_temp.html',
  'campus_test.html',
  'src/login_v1.jsx',
  'src/SOLICI~2.JSX',
  'src/ADMIN_~4.JSX',
  'src/syllabus_views (1).jsx',
  'src/MATRIC~3.JSX',
  'src/PANEL_~1.JSX',
  'src/inscripcion_v1.jsx',
  'styles/ADMIN_~2.CSS',
  'styles/login_v1.css',
];

assert.equal(fs.existsSync(outDir), true, 'Debe ejecutarse primero el constructor CS21A148.');

const manifest = JSON.parse(read('QA_STAGING_BUILD.json'));
assert.equal(manifest.marker, 'QA_STAGING_FRONTEND_CS21A148');
assert.equal(manifest.backendUrlEmbedded, false);
assert.equal(manifest.backendStorage, 'sessionStorage');
assert.equal(manifest.productionDeploymentAllowed, false);
assert.deepEqual(manifest.excludedLegacyFiles, forbiddenFiles.slice(1));

const entrypoints = ['campus.html', 'index.html', 'login.html', 'ventas.html', 'inscripcion.html'];
for (const entrypoint of entrypoints) {
  assert.equal(exists(entrypoint), true, `Falta ${entrypoint}.`);
  const html = read(entrypoint);
  const bootstrapIndex = html.indexOf('qa-bootstrap.js?v=CS21A148');
  const runtimeIndex = html.indexOf('src/runtime_config.js');
  assert.notEqual(bootstrapIndex, -1, `${entrypoint} no carga qa-bootstrap.js.`);
  assert.notEqual(runtimeIndex, -1, `${entrypoint} no carga runtime_config.js.`);
  assert.equal(bootstrapIndex < runtimeIndex, true, `${entrypoint} debe instalar QA antes del runtime config.`);
  assert.equal(/campus_standalone|BACKUP_index_QA|Santiago Salazar Chacón/i.test(html), false);

  for (const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["']/gi)) {
    const raw = match[1];
    if (/^(?:https?:|data:|\/\/)/i.test(raw)) continue;
    const local = cleanRef(raw);
    assert.equal(exists(local), true, `${entrypoint} referencia un archivo ausente: ${raw}`);
  }
}

assert.equal(read('index.html'), read('campus.html'), 'index.html debe ser alias exacto de campus.html en el artefacto.');

const bootstrap = read('qa-bootstrap.js');
assert.equal(bootstrap.includes("environment: 'qa'"), true);
assert.equal(bootstrap.includes("sessionStorage.getItem(STORAGE_KEY)"), true);
assert.equal(bootstrap.includes("location.replace('qa-setup.html')"), true);
assert.equal(bootstrap.includes('localStorage'), false);
assert.equal(bootstrap.includes('CAMPUS_QA_BOOTSTRAP'), true);

const setup = read('qa-setup.html');
assert.equal(setup.includes("sessionStorage.setItem(STORAGE_KEY, normalized)"), true);
assert.equal(setup.includes('localStorage'), false);
assert.equal(setup.includes('script.google.com'), true);
assert.equal(setup.includes('STAGING AISLADO'), true);

const syllabus = read('src/syllabus.jsx');
for (const token of ['DEMO_GROUP', 'DEMO_SUSPENSIONS', 'G0001-2026', 'Santiago está en', 'Ricardo Arias']) {
  assert.equal(syllabus.includes(token), false, `El artefacto conserva dato demo: ${token}`);
}

for (const forbiddenFile of forbiddenFiles) {
  assert.equal(exists(forbiddenFile), false, `El artefacto contiene legado: ${forbiddenFile}`);
}

const app = read('src/app.jsx');
const canonicalLoader = exists('src/english_lab_live_canonical_loader_cs21a193.js')
  ? read('src/english_lab_live_canonical_loader_cs21a193.js')
  : '';
const lazyMap = extractF96LazyMapCS21A193(app, canonicalLoader);
for (const raw of Object.values(lazyMap).flat()) {
  const local = cleanRef(raw);
  assert.equal(exists(local), true, `F96_LAZY referencia un archivo ausente: ${raw}`);
}

assert.equal(exists('serve.mjs'), true);
assert.equal(exists('INICIAR_QA_STAGING.cmd'), true);
assert.equal(exists('.nojekyll'), true);

console.log('OK: artefacto QA aislado, sin frontend legado ni datos demostrativos del sílabus.');
