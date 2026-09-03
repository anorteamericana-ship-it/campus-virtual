import fs from 'node:fs';
import path from 'node:path';

const EXPECTED_GET = [
  'verificarCedulaInscripcion',
  'verificarCedulaExiste',
  'buscarEnPadron',
  'getAsesoresActivos',
  'getGruposDisponibles',
  'getInscripcionPublicConfig',
  'getInfoGeneral',
  'getBecasDisponibles',
  'getBecas',
];

const ROUTER_AFTER_SHA256 = '87f80a0240d261ed6361a6c51087ddd86ae429eef6dcb9111609f3d0d6e74c68';
const ROUTER_AFTER_BYTES = 256665;

function fail(message) {
  throw new Error(`QA_GET_ROUTE_PARITY: ${message}`);
}

function uniqueStrict(list, label) {
  const seen = new Set();
  const duplicates = [];
  for (const value of list) {
    if (seen.has(value)) duplicates.push(value);
    seen.add(value);
  }
  if (duplicates.length) {
    fail(`duplicados en ${label}: ${[...new Set(duplicates)].join(', ')}`);
  }
  return [...seen];
}

function sameSet(actual, expected, label) {
  const a = [...actual].sort();
  const e = [...expected].sort();
  if (a.length !== e.length || a.some((value, index) => value !== e[index])) {
    fail(`${label} divergente. actual=[${a.join(',')}] expected=[${e.join(',')}]`);
  }
  return a;
}

function routerGetFns(source) {
  const start = source.search(/\bfunction\s+doGet\s*\(\s*e\s*\)\s*\{/);
  if (start < 0) fail('no se encontró function doGet(e) en 01_Router.js');

  const marker = "'Funcion GET no reconocida: '";
  const markerCount = source.split(marker).length - 1;
  if (markerCount !== 1) fail(`marcador final GET esperado 1 vez, observado ${markerCount}`);

  const markerAt = source.indexOf(marker, start);
  if (markerAt < 0) fail('marcador final GET no encontrado después de doGet');

  const body = source.slice(start, markerAt + marker.length);
  const names = [];
  for (const m of body.matchAll(/\bfn\s*={2,3}\s*(['"])([^'"]+)\1/g)) names.push(m[2]);
  for (const m of body.matchAll(/(['"])([^'"]+)\1\s*={2,3}\s*fn\b/g)) names.push(m[2]);
  for (const m of body.matchAll(/\bcase\s+(['"])([^'"]+)\1\s*:/g)) names.push(m[2]);

  return {
    names: uniqueStrict(names, '01_Router.js#doGet'),
    sliceLines: body.split(/\r\n|\r|\n/).length,
  };
}

function guardGetFns(source) {
  const start = source.indexOf('function _qa144AllowedGetFn_(fn){');
  if (start < 0) fail('no se encontró _qa144AllowedGetFn_ en guard');

  const end = source.indexOf('function _qa144GetBlockedHtml_', start);
  if (end < 0) fail('no se pudo delimitar _qa144AllowedGetFn_');

  const body = source.slice(start, end);
  const arr = body.match(/return\s*\[([\s\S]*?)\]\.indexOf/);
  if (!arr) fail('no se pudo extraer array GET del guard');

  return uniqueStrict(
    [...arr[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]),
    '99_QA_Staging_Guard.js#_qa144AllowedGetFn_',
  );
}

function reconstructGuardFromPatches(repoRoot, manifest) {
  const lines = [];
  for (const part of manifest.patch_parts || []) {
    if (part.source_path !== '99_QA_Staging_Guard.js') continue;
    const patchPath = path.join(repoRoot, part.path);
    const text = fs.readFileSync(patchPath, 'utf8');
    if (text.includes('\r')) fail(`${part.path} contiene CR; los patch blobs deben ser LF exacto`);
    for (const line of text.split('\n')) {
      if (line.startsWith('+++')) continue;
      if (line.startsWith('+')) lines.push(line.slice(1));
    }
  }
  if (!lines.length) fail('no se pudo reconstruir el guard desde patch_parts');
  return `${lines.join('\n')}\n`;
}

function runStaticContract() {
  const repoRoot = process.cwd();
  const manifestPath = path.join(repoRoot, 'patches/apps-script/CS21A211_QA_CONTAINMENT.manifest.json');
  const routerPatchPath = path.join(repoRoot, 'patches/apps-script/CS21A211/01_Router.js.patch');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const routerPatch = fs.readFileSync(routerPatchPath, 'utf8');

  const router = (manifest.touched_files || []).find(item => item.path === '01_Router.js');
  if (!router) fail('manifest sin touched_files para 01_Router.js');
  if (router.after_sha256 !== ROUTER_AFTER_SHA256 || router.after_bytes !== ROUTER_AFTER_BYTES) {
    fail(`identidad contractual de Router cambió: ${router.after_bytes}/${router.after_sha256}`);
  }

  if (!routerPatch.includes('@@ -844,8 +844,14 @@')) fail('hunk self-route de Router cambió');
  if (routerPatch.includes("'Funcion GET no reconocida: '")) fail('01_Router.js.patch toca el marcador final de la allowlist GET');
  for (const name of EXPECTED_GET) {
    if (routerPatch.includes(name)) fail(`01_Router.js.patch toca selector GET certificado: ${name}`);
  }

  const guard = reconstructGuardFromPatches(repoRoot, manifest);
  const guardList = guardGetFns(guard);
  const sorted = sameSet(guardList, EXPECTED_GET, 'guard GET allowlist');

  console.log(`QA_GET_ROUTE_PARITY_STATIC_CS21A211I=PASS GET=${sorted.length}`);
  console.log(`QA_GET_ROUTE_PARITY_LIST=${sorted.join(',')}`);
}

function runCandidate(candidateRoot) {
  const root = path.resolve(candidateRoot);
  const routerPath = path.join(root, '01_Router.js');
  const guardPath = path.join(root, '99_QA_Staging_Guard.js');
  for (const file of [routerPath, guardPath]) {
    if (!fs.existsSync(file)) fail(`falta ${file}`);
  }

  const router = fs.readFileSync(routerPath, 'utf8');
  const guard = fs.readFileSync(guardPath, 'utf8');
  const extracted = routerGetFns(router);
  const routerList = sameSet(extracted.names, EXPECTED_GET, 'Router GET allowlist');
  const guardList = sameSet(guardGetFns(guard), EXPECTED_GET, 'guard GET allowlist');
  sameSet(routerList, guardList, 'Router vs guard');

  console.log(`QA_GET_ROUTE_PARITY_CS21A211I=PASS GET=${routerList.length} SLICE_LINES=${extracted.sliceLines}`);
  console.log(`QA_GET_ROUTE_PARITY_LIST=${routerList.join(',')}`);
}

if (process.argv.includes('--static-contract')) {
  runStaticContract();
} else {
  const candidateRoot = process.argv[2] || process.env.QA_CS21A211_CANDIDATE_ROOT || '';
  if (!candidateRoot) fail('falta candidate root. Pasar ruta o usar --static-contract');
  runCandidate(candidateRoot);
}
