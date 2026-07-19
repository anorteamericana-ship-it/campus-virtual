import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'qa-output-real');
fs.mkdirSync(outDir, { recursive: true });

const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const timeoutMs = Number(process.env.QA_TIMEOUT_MS || 30000);

function productionAppsScriptUrl() {
  const source = read('src/data.jsx');
  const match = source.match(/const\s+APPS_SCRIPT_URL\s*=\s*['"]([^'"]+)['"]/);
  if (!match) throw new Error('No se encontró APPS_SCRIPT_URL en src/data.jsx.');
  return match[1];
}

function bookIds() {
  const source = read('src/book_unit_starts_cs21a60.jsx');
  const rows = [];
  let currentLevel = '';
  for (const line of source.split(/\r?\n/)) {
    const levelMatch = line.match(/code:\s*['"](B1|B2|I1|I2)['"]/);
    if (levelMatch) currentLevel = levelMatch[1];
    const bookMatch = line.match(/^\s*(SB|TB|WB):\s*\{\s*id:\s*['"]([^'"]+)['"]/);
    if (currentLevel && bookMatch) rows.push({ level: currentLevel, type: bookMatch[1], id: bookMatch[2] });
  }
  if (rows.length !== 12) throw new Error(`Se esperaban 12 libros y se encontraron ${rows.length}.`);
  return rows;
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { redirect: 'follow', ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const findings = [];
const checks = [];
function finding(severity, area, title, evidence) {
  findings.push({ severity, area, title, evidence });
}

async function checkAppsScript(baseUrl, fn, params = {}) {
  const url = new URL(baseUrl);
  url.searchParams.set('fn', fn);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const started = Date.now();
  try {
    const response = await fetchWithTimeout(url);
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) {}
    const ok = response.ok && data && data.ok === true;
    checks.push({ type: 'apps_script', fn, status: response.status, elapsed_ms: Date.now() - started, ok, response_keys: data ? Object.keys(data).slice(0, 20) : [] });
    if (!response.ok) finding('P1', 'Apps Script', `${fn} respondió HTTP ${response.status}`, text.slice(0, 300));
    else if (!data) finding('P1', 'Apps Script', `${fn} no devolvió JSON`, text.slice(0, 300));
    else if (data.ok !== true) finding('P1', 'Apps Script', `${fn} devolvió ok=false`, JSON.stringify(data).slice(0, 500));
  } catch (error) {
    checks.push({ type: 'apps_script', fn, ok: false, elapsed_ms: Date.now() - started, error: error.message });
    finding('P1', 'Apps Script', `${fn} no respondió`, error.message);
  }
}

async function checkDriveBook(book) {
  const url = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(book.id)}`;
  const started = Date.now();
  try {
    const response = await fetchWithTimeout(url, { headers: { Range: 'bytes=0-2047' } });
    const contentType = response.headers.get('content-type') || '';
    const accessible = response.status === 200 || response.status === 206;
    checks.push({ type: 'drive', level: book.level, book_type: book.type, status: response.status, elapsed_ms: Date.now() - started, content_type: contentType, final_host: new URL(response.url).hostname, accessible });
    if (!accessible) finding('P1', 'Drive', `${book.level} ${book.type} no es accesible`, `HTTP ${response.status}`);
    else if (/text\/html/i.test(contentType)) finding('P2', 'Drive', `${book.level} ${book.type} requiere confirmación visual`, `Drive respondió HTML en lugar del PDF directo; URL final: ${new URL(response.url).hostname}`);
  } catch (error) {
    checks.push({ type: 'drive', level: book.level, book_type: book.type, accessible: false, elapsed_ms: Date.now() - started, error: error.message });
    finding('P1', 'Drive', `${book.level} ${book.type} no respondió`, error.message);
  }
}

const appsScriptUrl = process.env.QA_APPS_SCRIPT_URL || productionAppsScriptUrl();
const allowOnlyRead = process.env.QA_ALLOW_WRITES !== 'true';
if (!allowOnlyRead) throw new Error('Este script es estrictamente de lectura y no acepta QA_ALLOW_WRITES=true.');

await checkAppsScript(appsScriptUrl, 'getInfoGeneral');
await checkAppsScript(appsScriptUrl, 'getInscripcionPublicConfig');
await checkAppsScript(appsScriptUrl, 'getGruposDisponibles', { programa: 'SIN_INA' });
for (const book of bookIds()) await checkDriveBook(book);

const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
for (const item of findings) counts[item.severity] += 1;
const verdict = counts.P0 || counts.P1 ? 'BLOQUEADO' : counts.P2 ? 'APTO CON RESERVAS' : 'APTO';
const report = {
  version: 'CS21A138',
  generated_at: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || 'local',
  mode: 'REAL_READ_ONLY',
  verdict,
  counts,
  checks,
  findings,
  safety: [
    'Solo se ejecutaron solicitudes GET.',
    'No se enviaron tokens, usuarios ni contraseñas.',
    'No se ejecutaron pagos, notas, asistencia ni cierres.',
  ],
};

fs.writeFileSync(path.join(outDir, 'real-readonly-report.json'), JSON.stringify(report, null, 2));
const lines = [
  '# QA real · Apps Script y Drive · Solo lectura',
  '',
  `- Commit: ${report.commit}`,
  `- Fecha: ${report.generated_at}`,
  `- Veredicto: **${verdict}**`,
  `- Comprobaciones: ${checks.length}`,
  `- Hallazgos: P0 ${counts.P0} · P1 ${counts.P1} · P2 ${counts.P2} · P3 ${counts.P3}`,
  '',
  '## Comprobaciones',
  '',
  ...checks.map(item => `- ${item.type === 'apps_script' ? `Apps Script · ${item.fn}` : `Drive · ${item.level} ${item.book_type}`}: ${item.ok === false || item.accessible === false ? 'FALLÓ' : 'OK'}${item.status ? ` · HTTP ${item.status}` : ''} · ${item.elapsed_ms} ms`),
  '',
  '## Hallazgos',
  '',
  ...(findings.length ? findings.map(item => `- **${item.severity} · ${item.area} · ${item.title}:** ${item.evidence}`) : ['No se detectaron hallazgos.']),
  '',
  '## Seguridad',
  '',
  ...report.safety.map(value => `- ${value}`),
  '',
];
fs.writeFileSync(path.join(outDir, 'real-readonly-report.md'), lines.join('\n'));
console.log(`REAL QA READONLY: ${verdict}; checks=${checks.length}; P1=${counts.P1}; P2=${counts.P2}`);
if (counts.P0 || counts.P1) process.exit(1);
