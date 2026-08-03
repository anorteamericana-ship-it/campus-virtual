import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const outDir = path.join(process.cwd(), 'qa-output');
const shotsDir = path.join(outDir, 'screens');
fs.mkdirSync(shotsDir, { recursive: true });

const scenarios = [
  {
    role: 'student', route: 'dashboard', viewport: { width: 390, height: 844 },
    navigation: ['Calendario académico', 'Evaluaciones', 'Resumen Académico'],
  },
  {
    role: 'student', route: 'libros_audios_estudiante', clickLabel: 'Libros y Audios', viewport: { width: 1440, height: 900 },
    navigation: ['Evaluaciones', 'Libros y Audios'],
  },
  {
    role: 'teacher', route: 'grupos', viewport: { width: 1440, height: 900 },
    navigation: ['Calendario académico', 'Mis grupos'],
  },
  {
    role: 'teacher', route: 'materiales', viewport: { width: 390, height: 844 },
    navigation: ['Libros de texto', 'Mis grupos', 'Libros de texto'],
  },
  {
    role: 'superadmin', route: 'dashboard', viewport: { width: 1440, height: 900 },
    navigation: ['Estudiantes', 'Panel Maestro'],
  },
  {
    role: 'superadmin', route: 'banco', viewport: { width: 390, height: 844 },
    navigation: ['Estudiantes', 'Importar banco'],
  },
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
const coverage = [];
const add = (severity, scenario, title, evidence) => findings.push({
  id: `BQA-${String(findings.length + 1).padStart(3, '0')}`,
  severity,
  type: 'sintética',
  scenario,
  title,
  evidence,
});

async function snapshot(page) {
  return page.evaluate(() => ({
    bodyText: document.body?.innerText?.trim() || '',
    rootHtml: document.getElementById('root')?.innerHTML || '',
    labels: Array.from(document.querySelectorAll('[data-screen-label]')).map(node => node.getAttribute('data-screen-label')).filter(Boolean).slice(0, 8),
    overflow: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) - window.innerWidth,
    hash: location.hash,
    path: location.pathname,
    href: location.href,
    historyLength: history.length,
    appMounted: Boolean(document.querySelector('.app')),
  }));
}

function validateState(state, key, phase) {
  const prefix = phase ? `${phase}: ` : '';
  if (/login\.html$/i.test(state.path)) add('P1', key, `${prefix}La sesión sintética fue rechazada`, state.path);
  if (state.bodyText.length < 20 || state.rootHtml.length < 20) add('P1', key, `${prefix}Pantalla vacía o aplicación no montada`, `body=${state.bodyText.length}, root=${state.rootHtml.length}`);
  if (!state.appMounted) add('P1', key, `${prefix}El árbol principal del Campus no fue montado`, `path=${state.path}, hash=${state.hash}`);
  if (state.overflow > 24) add('P2', key, `${prefix}Desbordamiento horizontal`, `${state.overflow}px fuera del viewport.`);
  if (!state.labels.length) add('P3', key, `${prefix}Pantalla sin etiqueta de diagnóstico`, `path=${state.path}, hash=${state.hash}`);
}

async function findNavigationControl(page, label) {
  const exact = page.getByText(label, { exact: true });
  if (await exact.count()) return exact.last();
  const candidates = page.locator('button, a, [role="button"]').filter({ hasText: label });
  return (await candidates.count()) ? candidates.last() : null;
}

async function exerciseNavigation(page, scenario, key) {
  const labels = scenario.navigation || [];
  if (!labels.length) return;

  const initial = await snapshot(page);
  let successfulClicks = 0;
  for (let cycle = 0; cycle < 2; cycle += 1) {
    for (const label of labels) {
      const control = await findNavigationControl(page, label);
      if (!control) {
        add('P2', key, 'No se encontró el control de navegación esperado', `${label} · ciclo ${cycle + 1}`);
        continue;
      }
      try {
        await control.click({ timeout: 5000 });
        await page.waitForTimeout(700);
        const state = await snapshot(page);
        validateState(state, key, `alternancia ${label}`);
        successfulClicks += 1;
      } catch (error) {
        add('P1', key, 'La alternancia repetida de menús falló', `${label} · ciclo ${cycle + 1} · ${error.message}`);
      }
    }
  }
  coverage.push({ scenario: key, check: 'alternancia_repetida', attempted: labels.length * 2, successful: successfulClicks });

  const beforeReload = await snapshot(page);
  try {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    const afterReload = await snapshot(page);
    validateState(afterReload, key, 'recarga directa');
    coverage.push({
      scenario: key,
      check: 'recarga_directa',
      before: { path: beforeReload.path, hash: beforeReload.hash },
      after: { path: afterReload.path, hash: afterReload.hash },
      mounted: afterReload.appMounted,
    });
  } catch (error) {
    add('P1', key, 'La recarga directa no terminó', error.message || String(error));
  }

  const afterReload = await snapshot(page);
  if (afterReload.historyLength > initial.historyLength || afterReload.hash !== initial.hash || afterReload.href !== initial.href) {
    try {
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(1500);
      const afterBack = await snapshot(page);
      validateState(afterBack, key, 'navegación Atrás');
      coverage.push({ scenario: key, check: 'atras', exercised: true, mounted: afterBack.appMounted, hash: afterBack.hash });
    } catch (error) {
      add('P2', key, 'La navegación Atrás no se recuperó correctamente', error.message || String(error));
    }
  } else {
    coverage.push({ scenario: key, check: 'atras', exercised: false, reason: 'La navegación interna no creó una entrada observable en el historial.' });
  }
}

const browser = await chromium.launch({ headless: true });
for (const scenario of scenarios) {
  const key = `${scenario.role}-${scenario.route}-${scenario.viewport.width}`;
  const context = await browser.newContext({ viewport: scenario.viewport, ignoreHTTPSErrors: true });
  const session = syntheticSession(scenario.role);
  await context.addInitScript(({ session, route }) => {
    sessionStorage.setItem('an_usuario', JSON.stringify(session));
    sessionStorage.removeItem('an_just_logged_in');
    const uiRole = session.rol === 'superadmin' || session.rol === 'admin' ? 'admin' : session.rol;
    localStorage.setItem('an_role', uiRole);
    localStorage.setItem(`an_active_${uiRole}`, route);
    localStorage.setItem('an_active', route);
  }, { session, route: scenario.role === 'student' ? 'dashboard' : scenario.route });

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

    if (scenario.clickLabel) {
      const control = await findNavigationControl(page, scenario.clickLabel);
      if (control) {
        await control.click({ timeout: 5000 });
        await page.waitForTimeout(3000);
      } else {
        add('P2', key, 'No se encontró el control de navegación esperado', scenario.clickLabel);
      }
    }

    const state = await snapshot(page);
    validateState(state, key, 'carga inicial');
    await exerciseNavigation(page, scenario, key);

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
  navigation_coverage: coverage,
  safety: 'Todas las llamadas a Apps Script fueron respondidas localmente; no hubo escrituras reales.',
  limitations: [
    'Las sesiones son sintéticas y no sustituyen una cuenta controlada real.',
    'No verifica permisos reales de Drive ni datos productivos.',
    'No ejecuta operaciones de escritura.',
    'La prueba Atrás solo puede ejercerse cuando la navegación interna crea una entrada observable en el historial del navegador.',
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
  '## Cobertura de navegación',
  '',
  ...coverage.map(item => `- ${item.scenario} · ${item.check}: ${item.exercised === false ? item.reason : 'ejecutado'}`),
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
