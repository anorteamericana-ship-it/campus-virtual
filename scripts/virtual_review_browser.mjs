import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const outDir = path.join(process.cwd(), 'qa-output');
const shotsDir = path.join(outDir, 'screens');
fs.mkdirSync(shotsDir, { recursive: true });

const scenarios = [
  { role: 'student', route: 'dashboard', viewport: { width: 390, height: 844 } },
  { role: 'student', route: 'libros_audios_estudiante', viewport: { width: 1440, height: 900 } },
  { role: 'teacher', route: 'grupos', viewport: { width: 1440, height: 900 } },
  { role: 'teacher', route: 'materiales', viewport: { width: 390, height: 844 } },
  { role: 'superadmin', route: 'dashboard', viewport: { width: 1440, height: 900 } },
  { role: 'superadmin', route: 'banco', viewport: { width: 390, height: 844 } },
];

function syntheticSession(role) {
  const base = {
    rol: role,
    role,
    nombre: `QA ${role}`,
    cedula: `QA-${role}`,
    token: 'qa-readonly-token',
  };
  if (role === 'student') return {
    ...base,
    codigo: 'QA-STUDENT',
    grupo: 'SJ01-B1-LM69-QA',
    cod_grupo: 'SJ01-B1-LM69-QA',
    nivel_activo: 'B1',
    niveles_estatus: { B1: 'CA', B2: '', I1: '', I2: '' },
    tipoUsuario: 'estudiante',
  };
  if (role === 'teacher') return { ...base, cod_docente: 'QA-TEACHER', tipoUsuario: 'docente' };
  return { ...base, tipoUsuario: 'superadmin', permisos: ['*'] };
}

const findings = [];
const add = (severity, scenario, title, evidence) => findings.push({
  id: `BQA-${String(findings.length + 1).padStart(3, '0')}`,
  severity,
  type: 'sintética',
  scenario,
  title,
  evidence,
});

const browser = await chromium.launch({ headless: true });
for (const scenario of scenarios) {
  const key = `${scenario.role}-${scenario.route}-${scenario.viewport.width}`;
  const context = await browser.newContext({ viewport: scenario.viewport, ignoreHTTPSErrors: true });
  const session = syntheticSession(scenario.role);
  await context.addInitScript(({ session }) => {
    const raw = JSON.stringify(session);
    for (const key of ['an_usuario', 'an_session', 'campus_session', 'session']) {
      sessionStorage.setItem(key, raw);
      localStorage.setItem(key, raw);
    }
    sessionStorage.setItem('an_token', session.token);
    localStorage.setItem('an_token', session.token);
  }, { session });

  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const localFailures = [];

  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => {
    if (request.url().startsWith(baseURL)) localFailures.push(`${request.url()} · ${request.failure()?.errorText || 'falló'}`);
  });
  page.on('response', response => {
    if (response.url().startsWith(baseURL) && response.status() >= 400) localFailures.push(`${response.status()} · ${response.url()}`);
  });

  await page.route('**/*', async route => {
    const url = route.request().url();
    if (/script\.google\.com\/macros|script\.googleusercontent\.com/i.test(url)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ ok: false, error: 'qa_readonly_mock', qa: true }),
      });
      return;
    }
    await route.continue();
  });

  try {
    await page.goto(`${baseURL}/campus.html#${scenario.route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    const state = await page.evaluate(() => ({
      bodyText: document.body?.innerText?.trim() || '',
      rootHtml: document.getElementById('root')?.innerHTML || '',
      labels: Array.from(document.querySelectorAll('[data-screen-label]')).map(node => node.getAttribute('data-screen-label')).filter(Boolean).slice(0, 8),
      overflow: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) - window.innerWidth,
      hash: location.hash,
    }));

    if (state.bodyText.length < 20 || state.rootHtml.length < 20) add('P1', key, 'Pantalla vacía o aplicación no montada', `body=${state.bodyText.length}, root=${state.rootHtml.length}, hash=${state.hash}`);
    if (state.overflow > 24) add('P2', key, 'Desbordamiento horizontal', `${state.overflow}px fuera del viewport.`);
    if (!state.labels.length) add('P3', key, 'Pantalla sin etiqueta de diagnóstico', `No se encontró data-screen-label en ${state.hash}.`);
    for (const error of pageErrors) add('P1', key, 'Excepción no controlada en navegador', error);
    for (const failure of [...new Set(localFailures)]) add('P1', key, 'Recurso local no disponible', failure);
    for (const error of [...new Set(consoleErrors)].slice(0, 10)) add('P2', key, 'Error de consola', error);

    await page.screenshot({ path: path.join(shotsDir, `${key}.png`), fullPage: true });
  } catch (error) {
    add('P1', key, 'El escenario no terminó', error.message || String(error));
  } finally {
    await context.close();
  }
}
await browser.close();

const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
for (const finding of findings) counts[finding.severity] += 1;
const verdict = counts.P0 || counts.P1 ? 'BLOQUEADO' : counts.P2 ? 'APTO CON RESERVAS' : 'APTO';
const report = {
  generated_at: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || 'local',
  base_url: baseURL,
  verdict,
  counts,
  scenarios,
  safety: 'Apps Script fue sustituido por una respuesta sintética de solo lectura.',
  limitations: [
    'Las sesiones son sintéticas y pueden no cubrir todas las variantes del login real.',
    'No verifica permisos reales de Drive ni datos productivos.',
    'No ejecuta operaciones de escritura.',
  ],
  findings,
};
fs.writeFileSync(path.join(outDir, 'browser-report.json'), JSON.stringify(report, null, 2));
const markdown = [
  '# Informe del equipo virtual · Navegador',
  '',
  `- Commit: ${report.commit}`,
  `- Veredicto: **${verdict}**`,
  `- Escenarios: ${scenarios.length}`,
  `- Hallazgos: P0 ${counts.P0} · P1 ${counts.P1} · P2 ${counts.P2} · P3 ${counts.P3}`,
  `- Seguridad: ${report.safety}`,
  '',
  '## Hallazgos',
  '',
  ...(findings.length ? findings.flatMap(item => [`### ${item.id} · ${item.severity} · ${item.title}`, '', `- Escenario: ${item.scenario}`, `- Evidencia: ${item.evidence}`, '']) : ['No se detectaron hallazgos en los escenarios sintéticos.', '']),
  '## Limitaciones',
  '',
  ...report.limitations.map(value => `- ${value}`),
  '',
].join('\n');
fs.writeFileSync(path.join(outDir, 'browser-report.md'), markdown);
console.log(`BROWSER QA: ${verdict}; P0=${counts.P0} P1=${counts.P1} P2=${counts.P2} P3=${counts.P3}`);
if (counts.P0 || counts.P1) process.exit(1);
