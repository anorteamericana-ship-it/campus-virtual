import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const required = [
  'QA_STAGING_APPS_SCRIPT_URL',
  'QA_STUDENT_USER', 'QA_STUDENT_PASS',
  'QA_TEACHER_USER', 'QA_TEACHER_PASS',
  'QA_SUPERADMIN_USER', 'QA_SUPERADMIN_PASS',
  'QA_STUDENT_CODE', 'QA_GROUP_CODE',
];
const missing = required.filter(name => !String(process.env[name] || '').trim());
if (missing.length) throw new Error(`Faltan variables de QA: ${missing.join(', ')}`);

const stagingUrl = String(process.env.QA_STAGING_APPS_SCRIPT_URL || '').trim();
const studentCode = String(process.env.QA_STUDENT_CODE || '').trim().toUpperCase();
const groupCode = String(process.env.QA_GROUP_CODE || '').trim().toUpperCase();
const qaUsers = [
  String(process.env.QA_STUDENT_USER || '').trim(),
  String(process.env.QA_TEACHER_USER || '').trim(),
  String(process.env.QA_SUPERADMIN_USER || '').trim(),
];

const productionSource = fs.readFileSync('src/data.jsx', 'utf8');
const prodMatch = productionSource.match(/const\s+APPS_SCRIPT_URL\s*=\s*['"]([^'"]+)['"]/);
if (!prodMatch) throw new Error('No se encontró la URL productiva para aplicar el bloqueo.');
const productionUrl = prodMatch[1];

let parsedStaging;
try { parsedStaging = new URL(stagingUrl); }
catch (_) { throw new Error('BLOQUEADO: QA_STAGING_APPS_SCRIPT_URL no es una URL válida.'); }
if (parsedStaging.hostname !== 'script.google.com' || !/^\/macros\/s\/[^/]+\/exec$/.test(parsedStaging.pathname)) {
  throw new Error('BLOQUEADO: la URL QA no tiene forma de Web App Apps Script /macros/s/.../exec.');
}
if (stagingUrl === productionUrl) throw new Error('BLOQUEADO: la URL QA coincide con producción.');
if (!/^QA-/.test(studentCode)) throw new Error('BLOQUEADO: QA_STUDENT_CODE debe ser una identidad QA-.');
if (!/-99\d\d$/.test(groupCode)) throw new Error('BLOQUEADO: QA_GROUP_CODE debe terminar en -99XX.');
if (qaUsers.some(user => !/^qa_/i.test(user))) throw new Error('BLOQUEADO: las tres identidades de login deben ser cuentas qa_.');
if (process.env.QA_EXECUTE_WRITES && process.env.QA_EXECUTE_WRITES !== 'NO') {
  throw new Error('BLOQUEADO: CS21A210BO es exclusivamente read-only.');
}

const outDir = path.join(process.cwd(), 'qa-output-real-auth');
const shotsDir = path.join(outDir, 'screens');
fs.mkdirSync(shotsDir, { recursive: true });

const findings = [];
const checks = [];
const add = (severity, area, title, evidence = '') => findings.push({ severity, area, title, evidence });
const timeoutMs = Number(process.env.QA_TIMEOUT_MS || 30000);

function countsNow() {
  const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
  for (const item of findings) counts[item.severity] += 1;
  return counts;
}

function writeReport(mode = 'AUTHENTICATED_STAGING_READ_ONLY') {
  const counts = countsNow();
  const verdict = counts.P0 || counts.P1 ? 'BLOQUEADO' : counts.P2 ? 'APTO CON RESERVAS' : 'APTO';
  const report = {
    version: 'CS21A210BO',
    generated_at: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || 'local',
    mode,
    verdict,
    counts,
    checks,
    findings,
    safety: [
      'La URL QA debe llegar explícitamente por secret y se rechaza si coincide con producción.',
      'Antes de enviar credenciales se exige identidad QA local y prueba nativa CS21A144 desde getInfoGeneral.',
      'La prueba nativa requiere qa_staging, qa_marker, qa_ids_ok y qa_properties_configured válidos.',
      'Este runner no contiene operaciones de pago, notas, asistencia, cierres ni otras escrituras.',
      'Las pruebas de navegador reescriben únicamente llamadas al URL productivo del frontend hacia el URL QA explícito.',
    ],
  };
  fs.writeFileSync(path.join(outDir, 'authenticated-report.json'), JSON.stringify(report, null, 2));
  const md = [
    '# QA E2 autenticado · CS21A210BO · Solo lectura', '',
    `- Veredicto: **${verdict}**`,
    `- Modo: ${mode}`,
    `- Pruebas: ${checks.length}`,
    `- Hallazgos: P0 ${counts.P0} · P1 ${counts.P1} · P2 ${counts.P2} · P3 ${counts.P3}`, '',
    '## Hallazgos', '',
    ...(findings.length ? findings.map(item => `- **${item.severity} · ${item.area} · ${item.title}:** ${item.evidence}`) : ['No se detectaron hallazgos.']), '',
    '## Seguridad', '',
    ...report.safety.map(item => `- ${item}`), '',
  ].join('\n');
  fs.writeFileSync(path.join(outDir, 'authenticated-report.md'), md);
  return { counts, verdict };
}

function failClosed(area, title, evidence = '') {
  add('P1', area, title, evidence);
  writeReport();
  throw new Error(`BLOQUEADO: ${title}`);
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

async function getJson(fn, params = {}) {
  const url = new URL(stagingUrl);
  url.searchParams.set('fn', fn);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetchWithTimeout(url);
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); }
  catch (_) { return { response, data: null, parse_error: true, content_type: response.headers.get('content-type') || '' }; }
  return { response, data, parse_error: false, content_type: response.headers.get('content-type') || '' };
}

async function postJson(fn, payload = {}, token = '') {
  const url = new URL(stagingUrl);
  url.searchParams.set('fn', fn);
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token, ...payload }),
  });
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); }
  catch (_) { return { response, data: null, parse_error: true, content_type: response.headers.get('content-type') || '' }; }
  return { response, data, parse_error: false, content_type: response.headers.get('content-type') || '' };
}

// Fail-closed staging proof. No credential leaves the runner before this passes.
const infoProbe = await getJson('getInfoGeneral');
if (!infoProbe.response.ok || infoProbe.parse_error || !infoProbe.data || infoProbe.data.ok !== true) {
  failClosed('staging_guard', 'getInfoGeneral no demuestra un backend JSON válido', `HTTP ${infoProbe.response.status}; content-type=${infoProbe.content_type || 'n/a'}`);
}
const qaMarker = String(infoProbe.data.qa_marker || '').trim();
const nativeQaProof = {
  qa_staging: infoProbe.data.qa_staging === true,
  qa_marker: qaMarker === 'QA_STAGING_CS21A144',
  qa_ids_ok: infoProbe.data.qa_ids_ok === true,
  qa_properties_configured: infoProbe.data.qa_properties_configured === true,
};
if (!Object.values(nativeQaProof).every(Boolean)) {
  failClosed(
    'staging_guard',
    'getInfoGeneral no demuestra el contrato QA nativo CS21A144',
    `qa_staging=${nativeQaProof.qa_staging}; qa_marker=${nativeQaProof.qa_marker}; qa_ids_ok=${nativeQaProof.qa_ids_ok}; qa_properties_configured=${nativeQaProof.qa_properties_configured}`,
  );
}
checks.push({
  area: 'staging_guard',
  fn: 'getInfoGeneral',
  ok: true,
  status: infoProbe.response.status,
  qa_marker: qaMarker,
  qa_staging: true,
  qa_ids_ok: true,
  qa_properties_configured: true,
});

const credentials = {
  student: [process.env.QA_STUDENT_USER, process.env.QA_STUDENT_PASS],
  teacher: [process.env.QA_TEACHER_USER, process.env.QA_TEACHER_PASS],
  superadmin: [process.env.QA_SUPERADMIN_USER, process.env.QA_SUPERADMIN_PASS],
};
const expectedRoles = { student: 'student', teacher: 'teacher', superadmin: 'superadmin' };
const sessions = {};

for (const [role, [usuario, clave]] of Object.entries(credentials)) {
  const result = await postJson('iniciarSesion', { usuario, clave });
  if (!result.response.ok || result.parse_error || !result.data || result.data.ok !== true || !result.data.token) {
    add('P1', 'autenticación', `No inició sesión ${role}`, `HTTP ${result.response.status}; error=${result.data?.error || (result.parse_error ? 'respuesta_no_json' : 'sin_token')}`);
    continue;
  }
  if (String(result.data.rol || '').toLowerCase() !== expectedRoles[role]) {
    add('P1', 'autenticación', `Rol inesperado para ${role}`, `returned_role=${String(result.data.rol || 'vacío')}`);
    continue;
  }
  if (role === 'student' && result.data.codigo && String(result.data.codigo).trim().toUpperCase() !== studentCode) {
    add('P1', 'autenticación', 'El login estudiante devolvió otro código', 'La identidad QA retornada no coincide con QA_STUDENT_CODE.');
    continue;
  }
  sessions[role] = result.data;
  checks.push({ area: 'login', role, ok: true, returned_role: result.data.rol });
}
if (Object.keys(sessions).length !== 3) {
  writeReport();
  throw new Error('BLOQUEADO: no se obtuvieron las tres sesiones QA esperadas.');
}

async function roleRead(role, fn, payload = {}) {
  const result = await postJson(fn, payload, sessions[role].token);
  const ok = result.response.ok && !result.parse_error && result.data && result.data.ok === true;
  checks.push({ area: 'backend_read', role, fn, ok, status: result.response.status });
  if (!ok) add('P1', 'backend', `${role} no pudo ejecutar ${fn}`, `HTTP ${result.response.status}; error=${result.data?.error || (result.parse_error ? 'respuesta_no_json' : 'ok_false')}`);
  return result.data;
}

await roleRead('student', 'getEstudiante', { codigo: studentCode });
await roleRead('student', 'getEvaluacionesEstudiante', { codigo: studentCode, nivel: 'B1' });
await roleRead('teacher', 'getCalendarioDocente', { cod_docente: sessions.teacher.nombre || process.env.QA_TEACHER_USER });
await roleRead('teacher', 'getGrupoEstudiantes', { cod_grupo: groupCode });
await roleRead('superadmin', 'getPagosCampus', { codigo_est: studentCode });
checks.push({ area: 'writes', ok: true, skipped: true, reason: 'CS21A210BO no implementa operaciones mutantes.' });

const campusBase = process.env.QA_CAMPUS_BASE_URL || 'http://127.0.0.1:4173';
const scenarios = [
  { role: 'student', route: 'dashboard', viewport: { width: 390, height: 844 } },
  { role: 'student', route: 'libros_audios_estudiante', viewport: { width: 1440, height: 900 } },
  { role: 'teacher', route: 'grupos', viewport: { width: 1440, height: 900 } },
  { role: 'teacher', route: 'materiales', viewport: { width: 390, height: 844 } },
  { role: 'superadmin', route: 'dashboard', viewport: { width: 1440, height: 900 } },
  { role: 'superadmin', route: 'banco', viewport: { width: 390, height: 844 } },
];

const browser = await chromium.launch({ headless: true });
for (const scenario of scenarios) {
  const session = sessions[scenario.role];
  const context = await browser.newContext({ viewport: scenario.viewport, ignoreHTTPSErrors: true });
  await context.addInitScript(({ session, route }) => {
    sessionStorage.setItem('an_usuario', JSON.stringify(session));
    localStorage.setItem('an_active', route);
    localStorage.setItem(`an_active_${session.rol === 'superadmin' ? 'admin' : session.rol}`, route);
  }, { session, route: scenario.route });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('**/*', async route => {
    const requestUrl = route.request().url();
    if (requestUrl.startsWith(productionUrl)) {
      const source = new URL(requestUrl);
      const target = new URL(stagingUrl);
      target.search = source.search;
      await route.continue({ url: target.toString() });
      return;
    }
    await route.continue();
  });
  try {
    await page.goto(`${campusBase}/campus.html#${scenario.route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6500);
    const state = await page.evaluate(() => ({
      text: document.body?.innerText?.trim() || '',
      labels: Array.from(document.querySelectorAll('[data-screen-label]')).map(node => node.getAttribute('data-screen-label')).filter(Boolean).slice(0, 10),
      overflow: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) - window.innerWidth,
      href: location.href,
    }));
    const key = `${scenario.role}-${scenario.route}-${scenario.viewport.width}`;
    await page.screenshot({ path: path.join(shotsDir, `${key}.png`), fullPage: true });
    const ok = state.text.length > 20 && state.labels.length > 0 && !/login\.html/i.test(state.href);
    checks.push({ area: 'browser_read', scenario: key, ok, labels: state.labels, overflow: state.overflow, errors: errors.slice(0, 10) });
    if (!ok) add('P1', 'navegador', `No cargó ${key}`, 'La superficie no alcanzó el estado esperado.');
    if (state.overflow > 24) add('P2', 'responsive', `Desbordamiento horizontal en ${key}`, `${state.overflow}px`);
    if (errors.length) add('P2', 'consola', `Errores en ${key}`, errors.slice(0, 5).join(' | '));
  } catch (error) {
    add('P1', 'navegador', `Falló escenario ${scenario.role}/${scenario.route}`, error.message);
  } finally {
    await context.close();
  }
}
await browser.close();

const result = writeReport();
console.log(`REAL QA AUTH READONLY BO: ${result.verdict}; checks=${checks.length}; P1=${result.counts.P1}; P2=${result.counts.P2}`);
if (result.counts.P0 || result.counts.P1) process.exit(1);
