import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const self = 'scripts/audit_cleanup_candidates_cs21a149.mjs';

const retired = [
  {
    file: 'src/MATRIC~3.JSX',
    archivedSha256: '7937afe7374d2a42f1ea77a1e987800e5062286d9e8be2f59c6dd2385594ed64',
    canonical: 'src/matriculas_calendario.jsx',
    exactDuplicate: true,
  },
  {
    file: 'src/PANEL_~1.JSX',
    archivedSha256: '31494ee76b15927dbf09e16420836da9f21d2dba612865f0c87a11022e88fb31',
    canonical: 'src/panel_admin_supervision.jsx',
    exactDuplicate: true,
  },
  {
    file: 'src/inscripcion_v1.jsx',
    archivedSha256: '8075eff4d560f1d4bbfbbf06afa6d3c22047ccf75a0b04334d5ba44f232d5740',
    canonical: 'src/inscripcion.jsx',
    exactDuplicate: false,
  },
  {
    file: 'styles/ADMIN_~2.CSS',
    archivedSha256: 'c739f5959f2b307e340d9368fe11c99688da1f10c3a42756e3f6a18900aa395f',
    canonical: 'styles/admin_master_dashboard.css',
    exactDuplicate: false,
  },
  {
    file: 'styles/login_v1.css',
    archivedSha256: '519784a255de180149b097d3cc919019bbd2464c38e630b3a5b3cffc0d203037',
    canonical: 'styles/login.css',
    exactDuplicate: false,
  },
];

const textExtensions = new Set(['.css', '.html', '.js', '.jsx', '.json', '.md', '.mjs', '.txt', '.yml', '.yaml']);

function exists(relative) {
  return fs.existsSync(path.join(root, relative));
}

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function sha256(relative) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');
}

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else files.push(path.relative(root, absolute).replace(/\\/g, '/'));
  }
  return files;
}

const allControlAndDeliveryFiles = walk(root).filter(file =>
  file !== self &&
  textExtensions.has(path.extname(file).toLowerCase()) &&
  !file.startsWith('00_DOCUMENTACION/') &&
  !file.startsWith('.github/workflows/') &&
  !file.startsWith('skills/')
);
const executionFiles = allControlAndDeliveryFiles.filter(file => !file.startsWith('scripts/'));
const controlFiles = allControlAndDeliveryFiles.filter(file => file.startsWith('scripts/'));
const controlReferences = {};

for (const item of retired) {
  assert.equal(exists(item.file), false, `Archivo retirado reapareció: ${item.file}`);
  assert.equal(exists(item.canonical), true, `Falta reemplazo canónico: ${item.canonical}`);

  const names = [item.file, path.posix.basename(item.file)];
  const references = executionFiles.filter(file => {
    const source = read(file);
    return names.some(name => source.includes(name));
  });
  controlReferences[item.file] = controlFiles.filter(file => {
    const source = read(file);
    return names.some(name => source.includes(name));
  });
  assert.deepEqual(references, [], `Persisten referencias de ejecución a ${item.file}: ${references.join(', ')}`);

  if (item.exactDuplicate) {
    assert.equal(
      sha256(item.canonical),
      item.archivedSha256,
      `El duplicado retirado ya no coincide con su archivo canónico: ${item.file}`,
    );
  }
}

const campus = read('campus.html');
const login = read('login.html');
const inscripcion = read('inscripcion.html');
assert.equal(campus.includes('styles/admin_master_dashboard.css'), true);
assert.equal(login.includes('styles/login.css'), true);
assert.equal(inscripcion.includes('src/inscripcion.jsx'), true);

assert.equal(exists('src/calendar88_selftest.js'), true, 'calendar88_selftest.js sigue cargado y no pertenece a esta limpieza.');
assert.equal(campus.includes('src/calendar88_selftest.js'), true, 'campus.html debe conservar calendar88_selftest.js hasta su auditoría funcional.');

console.log(JSON.stringify({ controlReferences }, null, 2));
console.log('OK: segunda ola respaldada; cinco archivos históricos ausentes y reemplazos canónicos verificados.');
