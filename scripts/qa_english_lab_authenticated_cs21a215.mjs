import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const required = [
  'QA_STAGING_APPS_SCRIPT_URL',
  'QA_STUDENT_USER', 'QA_STUDENT_PASS',
  'QA_TEACHER_USER', 'QA_TEACHER_PASS',
];
const missing = required.filter(name => !String(process.env[name] || '').trim());
if (missing.length) throw new Error(`Faltan variables de QA autenticada: ${missing.join(', ')}`);

const stagingUrl = process.env.QA_STAGING_APPS_SCRIPT_URL.trim();
const campusBase = String(process.env.QA_CAMPUS_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const productionSource = fs.readFileSync('src/data.jsx', 'utf8');
const prodMatch = productionSource.match(/const\s+APPS_SCRIPT_URL\s*=\s*['"]([^'"]+)['"]/);
if (!prodMatch) throw new Error('No se encontró la URL productiva para aplicar el bloqueo.');
if (stagingUrl === prodMatch[1]) throw new Error('BLOQUEADO: la URL de QA coincide con producción.');

const outDir = path.resolve('qa-output/cs21a215-authenticated');
fs.mkdirSync(outDir, { recursive: true });
const report = {
  ok: false,
  version: 'CS21A215',
  generated_at: new Date().toISOString(),
  qa_backend_verified: false,
  actors: {},
  scenarios: {},
  notes: [],
};

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
  catch (_) { throw new Error(`${fn} devolvió respuesta no JSON: ${raw.slice(0, 220)}`); }
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
  catch (_) { throw new Error(`${fn} devolvió respuesta no JSON: ${raw.slice(0, 220)}`); }
  return { response, data };
}

const status = await get('getInfoGeneral');
const qa = status.data?.qa;
assert.equal(status.response.ok, true, 'getInfoGeneral debe responder HTTP OK.');
assert.equal(status.data?.ok, true, 'getInfoGeneral debe responder ok=true.');
assert.equal(qa?.qa_staging, true, 'La URL debe identificarse como QA staging.');
assert.equal(qa?.master_match, true, 'QA debe demostrar master_match.');
assert.equal(qa?.operational_match, true, 'QA debe demostrar operational_match.');
assert.equal(qa?.writes_guarded, true, 'QA debe mantener escrituras protegidas.');
report.qa_backend_verified = true;
report.qa_marker = qa?.marker || null;

async function login(label, user, pass, expectedRole) {
  const result = await post('iniciarSesion', { usuario: user, clave: pass });
  assert.equal(result.response.ok, true, `${label}: login HTTP debe ser OK.`);
  assert.equal(result.data?.ok, true, `${label}: login debe responder ok=true.`);
  assert.ok(result.data?.token, `${label}: login debe devolver token.`);
  const role = String(result.data?.rol || '').toLowerCase();
  assert.equal(role, expectedRole, `${label}: rol inesperado ${role}.`);
  report.actors[label] = { authenticated: true, role };
  return result.data;
}

const student = await login('student', process.env.QA_STUDENT_USER, process.env.QA_STUDENT_PASS, 'student');
const teacher = await login('teacher', process.env.QA_TEACHER_USER, process.env.QA_TEACHER_PASS, 'teacher');

let freeStudent = null;
if (String(process.env.QA_FREE_USER || '').trim() && String(process.env.QA_FREE_PASS || '').trim()) {
  freeStudent = await login('free_student', process.env.QA_FREE_USER, process.env.QA_FREE_PASS, 'student');
} else {
  report.actors.free_student = { authenticated: false, skipped: true, reason: 'No hay secretos QA_FREE_USER / QA_FREE_PASS configurados.' };
}

const browser = await chromium.launch({ headless: true });
const deprecatedBrand = ['Academia', 'Play'].join(' ');

async function openCampus(session, route = 'academia_play', viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport, ignoreHTTPSErrors: true });
  await context.addInitScript(({ session, route }) => {
    sessionStorage.setItem('an_usuario', JSON.stringify(session));
    localStorage.setItem('an_active', route);
    const role = String(session?.rol || '').toLowerCase();
    localStorage.setItem(`an_active_${role === 'superadmin' ? 'admin' : role}`, route);
  }, { session, route });

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  await page.route('**/*', async routeHandler => {
    const requestUrl = routeHandler.request().url();
    if (requestUrl.startsWith(prodMatch[1])) {
      const source = new URL(requestUrl);
      const target = new URL(stagingUrl);
      target.search = source.search;
      await routeHandler.continue({ url: target.toString() });
      return;
    }
    await routeHandler.continue();
  });
  await page.goto(`${campusBase}/campus.html#${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  return { context, page, errors };
}

async function assertBrand(page, label) {
  const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  assert.match(body, /English LAB/, `${label}: debe mostrar English LAB.`);
  assert.equal(body.toLowerCase().includes(deprecatedBrand.toLowerCase()), false, `${label}: no puede mostrar la marca histórica.`);
}

async function assertNoOverflow(page, label) {
  const dims = await page.evaluate(() => ({
    scroll: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
    client: window.innerWidth,
  }));
  assert.ok(dims.scroll <= dims.client + 2, `${label}: overflow horizontal ${dims.scroll} > ${dims.client}`);
}

async function runStudent() {
  const { context, page, errors } = await openCampus(student, 'academia_play', { width: 1440, height: 900 });
  try {
    await page.locator('.el215-shell[data-el215-mode="home"]').waitFor({ state: 'visible', timeout: 20000 });
    await assertBrand(page, 'student home');
    const modes = await page.locator('button.el215-mode-card strong').allTextContents();
    assert.deepEqual(modes, ['Practicar & Competir', 'Jugar en equipos', 'Clase en vivo']);

    await page.locator('button.el215-mode-card', { hasText: 'Practicar & Competir' }).click();
    await page.locator('.el215-shell[data-el215-mode="practice"]').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('.aplay-shell').waitFor({ state: 'visible', timeout: 15000 });
    await assertBrand(page, 'student practice');
    const practiceText = (await page.locator('.aplay-shell').innerText()).replace(/\s+/g, ' ');
    assert.ok(practiceText.length > 80, 'student practice: la superficie curricular debe contener contenido real.');
    await page.locator('button.el215-back').click();

    await page.locator('button.el215-mode-card', { hasText: 'Jugar en equipos' }).click();
    await page.locator('.el215-shell[data-el215-mode="teams"]').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.el215-mini-card').count(), 6, 'student teams: deben existir seis tarjetas de dinámica.');
    await page.locator('.el215-mini-card', { hasText: 'Hangman · Equipos' }).locator('button').click();
    await page.locator('.el215-live-wrap[data-el215-mode="live"]').waitFor({ state: 'visible', timeout: 15000 });
    assert.match(page.url(), /[?&]game=HANGMAN(?:&|$)/);
    assert.equal(await page.getByRole('button', { name: /Memory Match/i }).count(), 0, 'student live: no debe exponer botón de Memory Match compartido.');
    await assertBrand(page, 'student live Hangman');

    await page.locator('button.el215-back').click();
    await page.locator('button.el215-mode-card', { hasText: 'Jugar en equipos' }).click();
    await page.locator('.el215-mini-card', { hasText: 'Quiz Time' }).locator('button').click();
    await page.locator('.el215-live-wrap[data-el215-mode="live"]').waitFor({ state: 'visible', timeout: 15000 });
    assert.match(page.url(), /[?&]game=QUIZ_TIME(?:&|$)/);
    await assertBrand(page, 'student live Quiz Time');

    await page.screenshot({ path: path.join(outDir, 'student-authenticated.png'), fullPage: true });
    report.scenarios.student = { ok: true, modes, practice_loaded: true, hangman_entry: true, quiz_entry: true, errors: errors.slice(0, 12) };
  } finally {
    await context.close();
  }
}

async function runTeacher() {
  const { context, page, errors } = await openCampus(teacher, 'academia_play', { width: 1366, height: 768 });
  try {
    await page.locator('.el215-shell[data-el215-mode="home"]').waitFor({ state: 'visible', timeout: 20000 });
    await assertBrand(page, 'teacher home');
    const modes = await page.locator('button.el215-mode-card strong').allTextContents();
    assert.deepEqual(modes, ['Practicar & Competir', 'Jugar en equipos', 'Clase en vivo']);

    await page.locator('button.el215-mode-card', { hasText: 'Clase en vivo' }).click();
    await page.locator('.el215-live-wrap[data-el215-mode="live"]').waitFor({ state: 'visible', timeout: 15000 });
    assert.match(page.url(), /[?&]game=HANGMAN(?:&|$)/);
    assert.equal(await page.getByRole('button', { name: /Memory Match/i }).count(), 0, 'teacher live: no debe exponer botón de Memory Match compartido.');
    await assertBrand(page, 'teacher live');
    await page.screenshot({ path: path.join(outDir, 'teacher-authenticated.png'), fullPage: true });
    report.scenarios.teacher = { ok: true, modes, hangman_entry: true, errors: errors.slice(0, 12) };
  } finally {
    await context.close();
  }
}

async function runMobileStudent() {
  const { context, page, errors } = await openCampus(student, 'academia_play', { width: 390, height: 844 });
  try {
    await page.locator('.el215-shell[data-el215-mode="home"]').waitFor({ state: 'visible', timeout: 20000 });
    await assertBrand(page, 'student mobile home');
    await assertNoOverflow(page, 'student mobile home');
    await page.locator('button.el215-mode-card', { hasText: 'Jugar en equipos' }).click();
    await assertNoOverflow(page, 'student mobile teams');
    await page.screenshot({ path: path.join(outDir, 'student-authenticated-390.png'), fullPage: true });
    report.scenarios.student_mobile = { ok: true, width: 390, no_overflow: true, errors: errors.slice(0, 12) };
  } finally {
    await context.close();
  }
}

async function runFreeStudent() {
  if (!freeStudent) {
    report.scenarios.free_student = { ok: null, skipped: true, reason: 'Actor autenticado gratuito no configurado.' };
    return;
  }
  const { context, page, errors } = await openCampus(freeStudent, 'academia_play', { width: 390, height: 844 });
  try {
    await page.locator('.aplay-shell').waitFor({ state: 'visible', timeout: 20000 });
    await assertBrand(page, 'free student');
    await assertNoOverflow(page, 'free student');
    assert.equal(await page.locator('.el215-shell[data-el215-mode="home"]').count(), 0, 'free student: debe conservar entrada directa a práctica curricular.');
    await page.screenshot({ path: path.join(outDir, 'free-student-authenticated.png'), fullPage: true });
    report.scenarios.free_student = { ok: true, direct_practice: true, errors: errors.slice(0, 12) };
  } finally {
    await context.close();
  }
}

try {
  await runStudent();
  await runTeacher();
  await runMobileStudent();
  await runFreeStudent();
  report.ok = true;
} finally {
  await browser.close();
  fs.writeFileSync(path.join(outDir, 'result.json'), JSON.stringify(report, null, 2));
  const lines = [
    '# CS21A215 · QA autenticada English LAB',
    '',
    `- Resultado: **${report.ok ? 'PASS' : 'FAIL'}**`,
    `- Backend QA verificado: ${report.qa_backend_verified ? 'sí' : 'no'}`,
    `- Estudiante matriculado: ${report.scenarios.student?.ok === true ? 'PASS' : 'NO EJECUTADO/FAIL'}`,
    `- Docente: ${report.scenarios.teacher?.ok === true ? 'PASS' : 'NO EJECUTADO/FAIL'}`,
    `- Estudiante 390px: ${report.scenarios.student_mobile?.ok === true ? 'PASS' : 'NO EJECUTADO/FAIL'}`,
    `- Prospecto gratis autenticado: ${report.scenarios.free_student?.ok === true ? 'PASS' : report.scenarios.free_student?.skipped ? 'PENDIENTE · actor no configurado' : 'FAIL'}`,
    '',
    'No se modifica Apps Script, datos, deployment, producción ni implementación de Memory Match.',
    '',
  ];
  fs.writeFileSync(path.join(outDir, 'summary.md'), lines.join('\n'));
}

console.log(`CS21A215_AUTH_QA=${report.ok ? 'PASS' : 'FAIL'}`);
console.log(`FREE_AUTH=${report.scenarios.free_student?.ok === true ? 'PASS' : 'SKIPPED'}`);
