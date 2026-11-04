import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const outDir = path.join(process.cwd(), 'qa-output');
const shotsDir = path.join(outDir, 'screens');
fs.mkdirSync(shotsDir, { recursive: true });

const scenarios = [
  { role: 'student', route: 'dashboard', viewport: { width: 390, height: 844 } },
  // Use stable route IDs; the visible label changes with EN/ES.
  { role: 'student', route: 'libros_audios_estudiante', lang: 'en', navId: 'libros_audios_estudiante', expectedLabel: 'Books & Audio', viewport: { width: 1440, height: 900 } },
  { role: 'student', route: 'libros_audios_estudiante', lang: 'es', navId: 'libros_audios_estudiante', expectedLabel: 'Libros y Audios', viewport: { width: 1440, height: 900 } },
  { role: 'student', route: 'resumen_academico', lang: 'en', navId: 'resumen_academico', expectedLabel: 'Academic Summary', viewport: { width: 1440, height: 900 } },
  { role: 'student', route: 'calendario_academico', lang: 'en', navId: 'calendario_academico', expectedLabel: 'Academic Calendar', viewport: { width: 390, height: 844 } },
  { role: 'teacher', route: 'grupos', viewport: { width: 1440, height: 900 } },
  { role: 'teacher', route: 'materiales', viewport: { width: 390, height: 844 } },
  { role: 'superadmin', route: 'dashboard', viewport: { width: 1440, height: 900 } },
  { role: 'superadmin', route: 'banco', viewport: { width: 390, height: 844 } },
];

function syntheticSession(role) {
  const base = {
    rol: role,
    nombre: `QA ${role}`,
    cedula: `QA-${role}`,
    token: 'qa-readonly-token',
    expira: '2099-12-31T23:59:59.000Z',
  };
  if (role === 'student') return {
    ...base,
    codigo: 'QA-STUDENT',
    grupo: 'SJ01-B1-LM69-QA',
    cod_grupo: 'SJ01-B1-LM69-QA',
    nivel_activo: 'B1',
    estatus_activo: 'CA',
    niveles_estatus: { B1: 'CA', B2: '', I1: '', I2: '' },
    tipoUsuario: 'estudiante',
  };
  if (role === 'teacher') return {
    ...base,
    cod_docente: 'QA-TEACHER',
    grupo: 'SJ01-B1-LM69-QA',
    grupoActivo: 'SJ01-B1-LM69-QA',
    grupos: ['SJ01-B1-LM69-QA'],
    tipoUsuario: 'docente',
  };
  return { ...base, tipoUsuario: 'superadmin', permisos: ['*'] };
}

function mockPayload(fn, session) {
  const common = {
    ok: true,
    qa: true,
    rows: [],
    items: [],
    data: [],
    grupos: [],
    estudiantes: [],
    sesiones: [],
    pendientes: [],
  };
  if (fn === 'validarSesion') return { ok: true, rol: session.rol, qa: true };
  if (fn === 'getDocenteSesionActivaF87') return { ok: true, sesion: null, qa: true };
  if (fn === 'getEstudiante') return {
    ok: true,
    estudiante: { ...session, NOMBRE: session.nombre, CODIGO: session.codigo },
    niveles: { B1: { estatus: 'CA' }, B2: {}, I1: {}, I2: {} },
    grupo: { COD_GRUPO: session.grupo || '', NIVEL: 'B1' },
    pendientes: {},
    qa: true,
  };
  if (/grupos/i.test(fn)) return { ...common, grupos: [], qa: true };
  if (/biblioteca|book|audio|material/i.test(fn)) return { ...common, nivel: 'B1', book_type: 'SB', unit_starts: [], qa: true };
  return common;
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
  const key = `${scenario.role}-${scenario.route}-${scenario.lang || 'default'}-${scenario.viewport.width}`;
  const context = await browser.newContext({ viewport: scenario.viewport, ignoreHTTPSErrors: true });
  const session = syntheticSession(scenario.role);
  await context.addInitScript(({ session, route, lang }) => {
    sessionStorage.setItem('an_usuario', JSON.stringify(session));
    sessionStorage.removeItem('an_just_logged_in');
    if (lang === 'es' || lang === 'en') sessionStorage.setItem('an_i18n_pilot_lang', lang);
    const uiRole = session.rol === 'superadmin' || session.rol === 'admin' ? 'admin' : session.rol;
    localStorage.setItem('an_role', uiRole);
    localStorage.setItem(`an_active_${uiRole}`, route);
    localStorage.setItem('an_active', route);
  }, { session, route: scenario.role === 'student' ? 'dashboard' : scenario.route, lang: scenario.lang });

  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const localFailures = [];

  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => {
    const failure = request.failure()?.errorText || '';
    if (request.url().startsWith(baseURL) && !/ERR_ABORTED/i.test(failure)) {
      localFailures.push(`${request.url()} · ${failure || 'falló'}`);
    }
  });
  page.on('response', response => {
    if (response.url().startsWith(baseURL) && response.status() >= 400) localFailures.push(`${response.status()} · ${response.url()}`);
  });

  await page.route('**/*', async route => {
    const request = route.request();
    const url = request.url();
    if (/script\.google\.com\/macros|script\.googleusercontent\.com/i.test(url)) {
      let payload = {};
      try { payload = JSON.parse(request.postData() || '{}'); } catch (_) {}
      let fn = String(payload.fn || '');
      try { fn = fn || new URL(url).searchParams.get('fn') || ''; } catch (_) {}
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(mockPayload(fn, session)),
      });
      return;
    }
    await route.continue();
  });

  try {
    await page.goto(`${baseURL}/campus.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4500);

    if (scenario.navId) {
      // On mobile the sidebar is intentionally closed until the hamburger opens it.
      if (scenario.viewport.width <= 640) {
        const menuToggle = page.locator('.an-mobile-nav-toggle').first();
        if (await menuToggle.count() && await menuToggle.isVisible()) {
          await menuToggle.click({timeout: 5000});
          await page.waitForTimeout(200);
        }
      }
      const button = page.locator('button[data-nav-id="' + scenario.navId + '"]').first();
      if (await button.count() && await button.isVisible()) {
        const label = (await button.locator('.sb-label').innerText()).trim();
        if (label !== scenario.expectedLabel) {
          add('P2', key, 'Etiqueta del menú distinta al idioma esperado',
            'route=' + scenario.navId + ', expected=' + scenario.expectedLabel + ', observed=' + label);
        }
        await button.click({ timeout: 5000 });
        await page.waitForTimeout(3000);
      } else {
        add('P2', key, 'Ruta estudiantil no encontrada en menú', scenario.navId);
      }
    }

    const state = await page.evaluate(() => ({
      bodyText: document.body?.innerText?.trim() || '',
      rootHtml: document.getElementById('root')?.innerHTML || '',
      labels: Array.from(document.querySelectorAll('[data-screen-label]')).map(node => node.getAttribute('data-screen-label')).filter(Boolean).slice(0, 8),
      overflow: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) - window.innerWidth,
      hash: location.hash,
      path: location.pathname,
      appMounted: Boolean(document.querySelector('.app')),
      language: window.AN_I18N?.getLang?.() || null,
      icanStandaloneMenuCount: document.querySelectorAll('aside[data-role="student"] button[data-nav-id="ican"]').length,
      tasksStandaloneMenuCount: document.querySelectorAll('aside[data-role="student"] button[data-nav-id="tareas"], aside[data-role="student"] button[data-nav-id="tareas_estudiante"]').length,
    }));

    if (/login\.html$/i.test(state.path)) add('P1', key, 'La sesión sintética fue rechazada', state.path);
    if (state.bodyText.length < 20 || state.rootHtml.length < 20) add('P1', key, 'Pantalla vacía o aplicación no montada', `body=${state.bodyText.length}, root=${state.rootHtml.length}`);
    if (!state.appMounted) add('P1', key, 'El árbol principal del Campus no fue montado', `path=${state.path}, hash=${state.hash}`);
    if (scenario.role === 'student') {
      if (state.language !== (scenario.lang || 'en')) {
        add('P1', key, 'Idioma seleccionado no se conserva', 'expected=' + (scenario.lang || 'en') + ', observed=' + state.language);
      }
      if (state.icanStandaloneMenuCount > 0 || state.tasksStandaloneMenuCount > 0) {
        add('P2', key, 'Menú demo muestra módulo independiente sin terminar',
          'I CAN=' + state.icanStandaloneMenuCount + ', Tasks=' + state.tasksStandaloneMenuCount);
      }
    }
    if (state.overflow > 24) add('P2', key, 'Desbordamiento horizontal', `${state.overflow}px fuera del viewport.`);
    if (!state.labels.length) add('P3', key, 'Pantalla sin etiqueta de diagnóstico', `path=${state.path}, hash=${state.hash}`);
    for (const error of pageErrors) add('P1', key, 'Excepción no controlada en navegador', error);
    for (const failure of [...new Set(localFailures)]) add('P1', key, 'Recurso local no disponible', failure);
    for (const error of [...new Set(consoleErrors)].slice(0, 10)) {
      const severity = /^Warning:/i.test(error) ? 'P3' : 'P2';
      add(severity, key, severity === 'P3' ? 'Advertencia de React' : 'Error de consola', error);
    }

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
  safety: 'Todas las llamadas a Apps Script fueron respondidas localmente; no hubo escrituras reales.',
  limitations: [
    'Las sesiones son sintéticas y no sustituyen una cuenta controlada real.',
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
