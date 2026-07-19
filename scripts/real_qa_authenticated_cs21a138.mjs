import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const required = [
  'QA_STAGING_APPS_SCRIPT_URL',
  'QA_STUDENT_USER', 'QA_STUDENT_PASS',
  'QA_TEACHER_USER', 'QA_TEACHER_PASS',
  'QA_SUPERADMIN_USER', 'QA_SUPERADMIN_PASS',
  'QA_STUDENT_CODE', 'QA_GROUP_CODE', 'QA_BANK_DOCUMENT',
];
const missing = required.filter(name => !String(process.env[name] || '').trim());
if (missing.length) throw new Error(`Faltan variables de QA: ${missing.join(', ')}`);

const stagingUrl = process.env.QA_STAGING_APPS_SCRIPT_URL.trim();
const productionSource = fs.readFileSync('src/data.jsx', 'utf8');
const prodMatch = productionSource.match(/const\s+APPS_SCRIPT_URL\s*=\s*['"]([^'"]+)['"]/);
if (!prodMatch) throw new Error('No se encontró la URL productiva para aplicar el bloqueo.');
if (stagingUrl === prodMatch[1]) throw new Error('BLOQUEADO: la URL de staging coincide con producción.');

const marker = 'QA_STAGING_CS21A138';
const executeWrites = process.env.QA_EXECUTE_WRITES === 'CS21A138_STAGING_ONLY';
const outDir = path.join(process.cwd(), 'qa-output-real-auth');
const shotsDir = path.join(outDir, 'screens');
fs.mkdirSync(shotsDir, { recursive: true });

async function post(fn, payload = {}, token = '') {
  const url = new URL(stagingUrl);
  url.searchParams.set('fn', fn);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token, ...payload }),
    redirect: 'follow',
  });
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); }
  catch (_) { throw new Error(`${fn} devolvió una respuesta no JSON: ${raw.slice(0, 240)}`); }
  return { response, data };
}

async function get(fn, params = {}) {
  const url = new URL(stagingUrl);
  url.searchParams.set('fn', fn);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, { redirect: 'follow' });
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); }
  catch (_) { throw new Error(`${fn} devolvió una respuesta no JSON: ${raw.slice(0, 240)}`); }
  return { response, data };
}

const findings = [];
const checks = [];
const add = (severity, area, title, evidence) => findings.push({ severity, area, title, evidence });

const status = await get('getInfoGeneral');
const qa = status.data && status.data.qa;
if (!status.response.ok || status.data.ok !== true || !qa || qa.marker !== marker || qa.qa_staging !== true || qa.master_match !== true || qa.operational_match !== true || qa.writes_guarded !== true) {
  throw new Error(`BLOQUEADO: la URL no demuestra staging seguro. Estado: ${JSON.stringify(qa || status.data).slice(0, 800)}`);
}
checks.push({ area: 'staging_guard', ok: true, marker: qa.marker });

const credentials = {
  student: [process.env.QA_STUDENT_USER, process.env.QA_STUDENT_PASS],
  teacher: [process.env.QA_TEACHER_USER, process.env.QA_TEACHER_PASS],
  superadmin: [process.env.QA_SUPERADMIN_USER, process.env.QA_SUPERADMIN_PASS],
};
const sessions = {};
for (const [role, [usuario, clave]] of Object.entries(credentials)) {
  const result = await post('iniciarSesion', { usuario, clave });
  if (!result.response.ok || result.data.ok !== true || !result.data.token) {
    add('P1', 'autenticación', `No inició sesión ${role}`, JSON.stringify(result.data).slice(0, 500));
    continue;
  }
  sessions[role] = result.data;
  checks.push({ area: 'login', role, ok: true, returned_role: result.data.rol });
}
if (Object.keys(sessions).length !== 3) throw new Error('BLOQUEADO: no se obtuvieron las tres sesiones QA.');

async function roleRead(role, fn, payload = {}) {
  const result = await post(fn, payload, sessions[role].token);
  const ok = result.response.ok && result.data && result.data.ok === true;
  checks.push({ area: 'backend_read', role, fn, ok });
  if (!ok) add('P1', 'backend', `${role} no pudo ejecutar ${fn}`, JSON.stringify(result.data).slice(0, 500));
  return result.data;
}

await roleRead('student', 'getEstudiante', { codigo: process.env.QA_STUDENT_CODE });
await roleRead('student', 'getEvaluacionesEstudiante', { codigo: process.env.QA_STUDENT_CODE, nivel: 'B1' });
await roleRead('teacher', 'getCalendarioDocente', { cod_docente: sessions.teacher.nombre || process.env.QA_TEACHER_USER });
await roleRead('teacher', 'getGrupoEstudiantes', { cod_grupo: process.env.QA_GROUP_CODE });
await roleRead('superadmin', 'getPagosCampus', { codigo_est: process.env.QA_STUDENT_CODE });

if (executeWrites) {
  const confirmation = { qa_confirmation: marker };
  const paymentPayload = {
    ...confirmation,
    doc: process.env.QA_BANK_DOCUMENT,
    cod_estudiante: process.env.QA_STUDENT_CODE,
    monto_total: 20000,
    request_id: 'QA-CS21A138-PAGO-MATRICULA-001',
    rubros: [{ tipo: 'MATRICULA', nivel: 'B1', monto: 20000, grupo: process.env.QA_GROUP_CODE }],
  };
  const firstPayment = await post('aplicarPago', paymentPayload, sessions.superadmin.token);
  checks.push({ area: 'write_payment', ok: firstPayment.data.ok === true, result: firstPayment.data.ok ? 'applied' : firstPayment.data.error });
  if (firstPayment.data.ok !== true) add('P1', 'pago', 'No se aplicó el pago QA', JSON.stringify(firstPayment.data).slice(0, 700));
  else {
    const repeatedPayment = await post('aplicarPago', paymentPayload, sessions.superadmin.token);
    const idempotent = repeatedPayment.data.ok === true && repeatedPayment.data.idempotent === true;
    checks.push({ area: 'write_payment_idempotency', ok: idempotent });
    if (!idempotent) add('P1', 'pago', 'El reenvío del pago no fue idempotente', JSON.stringify(repeatedPayment.data).slice(0, 700));
  }

  const grade = await post('registrarNotaEstatus', {
    ...confirmation,
    cod_estudiante: process.env.QA_STUDENT_CODE,
    grupo: process.env.QA_GROUP_CODE,
    nivel: 'B1',
    tipo_eval: 'ORAL_1',
    nota: 12,
    leccion_num: 9,
    registrado_por: 'QA DOCENTE',
  }, sessions.teacher.token);
  checks.push({ area: 'write_grade', ok: grade.data.ok === true });
  if (grade.data.ok !== true) add('P1', 'nota', 'No se guardó la nota QA', JSON.stringify(grade.data).slice(0, 700));

  const attendance = await post('registrarAsistencia', {
    ...confirmation,
    cod_grupo: process.env.QA_GROUP_CODE,
    leccion_num: 1,
    fecha_leccion: '2026-07-20',
    programa: 'SIN_INA',
    nivel: 'B1',
    registrado_por: 'QA DOCENTE',
    lista: [{ cod_estudiante: process.env.QA_STUDENT_CODE, presente: true }],
  }, sessions.teacher.token);
  checks.push({ area: 'write_attendance', ok: attendance.data.ok === true });
  if (attendance.data.ok !== true) add('P1', 'asistencia', 'No se guardó la asistencia QA', JSON.stringify(attendance.data).slice(0, 700));

  await roleRead('student', 'getEvaluacionesEstudiante', { codigo: process.env.QA_STUDENT_CODE, nivel: 'B1' });
  await roleRead('student', 'getAsistenciaEstudiante', { codigo: process.env.QA_STUDENT_CODE });
} else {
  checks.push({ area: 'writes', ok: true, skipped: true, reason: 'QA_EXECUTE_WRITES no fue habilitado.' });
}

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
    if (requestUrl.startsWith(prodMatch[1])) {
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
    checks.push({ area: 'two_device_browser', scenario: key, ok, labels: state.labels, overflow: state.overflow, errors: errors.slice(0, 10) });
    if (!ok) add('P1', 'navegador', `No cargó ${key}`, JSON.stringify(state));
    if (state.overflow > 24) add('P2', 'responsive', `Desbordamiento horizontal en ${key}`, `${state.overflow}px`);
    if (errors.length) add('P2', 'consola', `Errores en ${key}`, errors.slice(0, 5).join(' | '));
  } catch (error) {
    add('P1', 'navegador', `Falló escenario ${scenario.role}/${scenario.route}`, error.message);
  } finally {
    await context.close();
  }
}
await browser.close();

const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
for (const item of findings) counts[item.severity] += 1;
const verdict = counts.P0 || counts.P1 ? 'BLOQUEADO' : counts.P2 ? 'APTO CON RESERVAS' : 'APTO';
const report = {
  version: 'CS21A138',
  generated_at: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || 'local',
  mode: executeWrites ? 'AUTHENTICATED_STAGING_WITH_WRITES' : 'AUTHENTICATED_STAGING_READ_ONLY',
  verdict,
  counts,
  checks,
  findings,
  safety: 'La ejecución se negó a continuar hasta demostrar marcador, hojas staging y guardas de escritura.',
};
fs.writeFileSync(path.join(outDir, 'authenticated-report.json'), JSON.stringify(report, null, 2));
const markdown = [
  '# QA real autenticado · Staging', '',
  `- Veredicto: **${verdict}**`,
  `- Modo: ${report.mode}`,
  `- Pruebas: ${checks.length}`,
  `- Hallazgos: P0 ${counts.P0} · P1 ${counts.P1} · P2 ${counts.P2} · P3 ${counts.P3}`, '',
  '## Hallazgos', '',
  ...(findings.length ? findings.map(item => `- **${item.severity} · ${item.area} · ${item.title}:** ${item.evidence}`) : ['No se detectaron hallazgos.']), '',
  `Seguridad: ${report.safety}`, '',
].join('\n');
fs.writeFileSync(path.join(outDir, 'authenticated-report.md'), markdown);
console.log(`REAL QA AUTH: ${verdict}; mode=${report.mode}; P1=${counts.P1}; P2=${counts.P2}`);
if (counts.P0 || counts.P1) process.exit(1);
