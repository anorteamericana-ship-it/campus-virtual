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
    navigation: [
      { id: 'mi_curso', label: 'Mi curso' },
      { id: 'evaluaciones', label: 'Evaluaciones' },
      { id: 'dashboard', label: 'Mi Campus' },
    ],
  },
  {
    role: 'student', route: 'libros_audios_estudiante', clickLabel: 'Libros y Audios', viewport: { width: 1440, height: 900 },
    navigation: [
      { id: 'evaluaciones', label: 'Evaluaciones' },
      { id: 'mi_curso', label: 'Mi curso' },
      { id: 'dashboard', label: 'Mi Campus' },
    ],
  },
  {
    role: 'teacher', route: 'grupos', viewport: { width: 1440, height: 900 },
    navigation: [
      { label: 'Cronograma Inglés Conversacional' },
      { label: 'Mis Grupos' },
    ],
  },
  {
    role: 'teacher', route: 'materiales', viewport: { width: 390, height: 844 },
    navigation: [
      { label: 'Biblioteca del Programa' },
      { label: 'Mis Grupos' },
      { label: 'Biblioteca del Programa' },
    ],
  },
  {
    role: 'superadmin', route: 'dashboard', viewport: { width: 1440, height: 900 },
    navigation: [
      { label: 'Estudiantes' },
      { label: 'Panel Maestro' },
    ],
  },
  {
    role: 'superadmin', route: 'banco', viewport: { width: 390, height: 844 },
    navigation: [
      { label: 'Estudiantes' },
      { label: 'Importar banco' },
    ],
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
const findingKeys = new Set();
const add = (severity, scenario, title, evidence) => {
  const normalizedEvidence = String(evidence || '').replace(/\s+/g, ' ').trim();
  const key = [severity, scenario, title, normalizedEvidence].join('|');
  if (findingKeys.has(key)) return;
  findingKeys.add(key);
  findings.push({
    id: `BQA-${String(findings.length + 1).padStart(3, '0')}`,
    severity,
    type: 'sintética',
    scenario,
    title,
    evidence: String(evidence || ''),
  });
};

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function snapshot(page) {
  return page.evaluate(() => {
    const root = document.getElementById('root');
    const bodyText = document.body?.innerText?.trim() || '';
    const rootHtml = root?.innerHTML || '';
    const rootText = root?.innerText?.trim() || '';
    const loginDetected = /login\.html$/i.test(location.pathname)
      || Boolean(document.querySelector('form[action*="login" i], .login-page, [data-screen-label*="login" i]'));
    const mountedSurface = Boolean(
      document.querySelector('.app, .sb, main, [data-screen-label], #root > *')
    );
    return {
      bodyText,
      rootHtml,
      rootText,
      rootChildren: root?.children?.length || 0,
      labels: Array.from(document.querySelectorAll('[data-screen-label]'))
        .map(node => node.getAttribute('data-screen-label'))
        .filter(Boolean)
        .slice(0, 12),
      overflow: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) - window.innerWidth,
      hash: location.hash,
      path: location.pathname,
      href: location.href,
      historyLength: history.length,
      loginDetected,
      appMounted: !loginDetected && mountedSurface && rootHtml.length > 20 && rootText.length > 5,
      sidebarMounted: Boolean(document.querySelector('.sb')),
      mobileMenuOpen: document.body.classList.contains('an-mobile-nav-open'),
    };
  });
}

function validateState(state, key, phase, options = {}) {
  const prefix = phase ? `${phase}: ` : '';
  if (state.loginDetected) add('P1', key, `${prefix}La sesión sintética fue rechazada`, state.path);
  if (state.bodyText.length < 20 || state.rootHtml.length < 20 || state.rootChildren < 1) {
    add('P1', key, `${prefix}Pantalla vacía o raíz sin contenido`, `body=${state.bodyText.length}, root=${state.rootHtml.length}, children=${state.rootChildren}`);
  } else if (!state.appMounted) {
    add('P2', key, `${prefix}No se reconoció una superficie montada estable`, `path=${state.path}, hash=${state.hash}, sidebar=${state.sidebarMounted}`);
  }
  if (state.overflow > 24) add('P2', key, `${prefix}Desbordamiento horizontal`, `${state.overflow}px fuera del viewport.`);
  if (options.requireDiagnosticLabel && !state.labels.length) {
    add('P3', key, `${prefix}Pantalla sin etiqueta de diagnóstico`, `path=${state.path}, hash=${state.hash}`);
  }
}

async function waitForCampusReady(page, timeout = 15000) {
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    const text = root?.innerText?.trim() || '';
    return Boolean(root && root.children.length && root.innerHTML.length > 20 && text.length > 5);
  }, null, { timeout });
  await page.waitForTimeout(500);
}

async function ensureMobileMenuOpen(page) {
  const isMobile = await page.evaluate(() => window.matchMedia('(max-width: 900px)').matches);
  if (!isMobile) return;
  const state = await page.evaluate(() => ({
    open: document.body.classList.contains('an-mobile-nav-open'),
    sidebarHidden: document.querySelector('.sb')?.getAttribute('aria-hidden') === 'true',
  }));
  if (state.open && !state.sidebarHidden) return;
  const toggle = page.locator('.an-mobile-nav-toggle:visible').first();
  if (await toggle.count()) {
    await toggle.click({ timeout: 5000 });
    await page.waitForFunction(() => document.body.classList.contains('an-mobile-nav-open'), null, { timeout: 5000 });
    await page.waitForTimeout(150);
  }
}

async function firstVisible(locator) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  return null;
}

async function findNavigationControl(page, target) {
  await ensureMobileMenuOpen(page);

  if (target.id) {
    const byId = await firstVisible(page.locator(`.sb-item[data-nav-id="${target.id}"]:not([disabled])`));
    if (byId) return byId;
  }

  const label = String(target.label || target).trim();
  const exact = new RegExp(`^\\s*${escapeRegex(label)}\\s*$`, 'i');
  const preferred = page.locator('.sb-item:not([disabled]):visible').filter({ hasText: exact });
  const preferredVisible = await firstVisible(preferred);
  if (preferredVisible) return preferredVisible;

  const roleButton = page.getByRole('button', { name: exact });
  const roleButtonVisible = await firstVisible(roleButton);
  if (roleButtonVisible) return roleButtonVisible;

  const roleLink = page.getByRole('link', { name: exact });
  const roleLinkVisible = await firstVisible(roleLink);
  if (roleLinkVisible) return roleLinkVisible;

  const generic = page.locator('button:visible, a:visible, [role="button"]:visible').filter({ hasText: label });
  return await firstVisible(generic);
}

async function clickNavigation(page, target, key, cycle) {
  const label = target.label || target.id || String(target);
  const control = await findNavigationControl(page, target);
  if (!control) {
    add('P2', key, 'No se encontró un control de navegación visible', `${label} · ciclo ${cycle}`);
    return false;
  }
  try {
    await control.click({ timeout: 7000 });
    await waitForCampusReady(page);
    return true;
  } catch (error) {
    add('P1', key, 'Falló un control de navegación visible', `${label} · ciclo ${cycle} · ${error.message}`);
    return false;
  }
}

async function exerciseNavigation(page, scenario, key) {
  const targets = scenario.navigation || [];
  if (!targets.length) return;

  const initial = await snapshot(page);
  let successfulClicks = 0;
  for (let cycle = 1; cycle <= 2; cycle += 1) {
    for (const target of targets) {
      const clicked = await clickNavigation(page, target, key, cycle);
      if (!clicked) continue;
      const state = await snapshot(page);
      validateState(state, key, `alternancia ${target.label || target.id}`);
      successfulClicks += 1;
    }
  }
  coverage.push({
    scenario: key,
    check: 'alternancia_repetida',
    attempted: targets.length * 2,
    successful: successfulClicks,
  });

  const beforeReload = await snapshot(page);
  try {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForCampusReady(page, 20000);
    const afterReload = await snapshot(page);
    validateState(afterReload, key, 'recarga directa', { requireDiagnosticLabel: true });
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
  const historyChanged = afterReload.historyLength > initial.historyLength
    || afterReload.href !== initial.href;
  if (historyChanged) {
    try {
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 10000 });
      await waitForCampusReady(page, 15000);
      const afterBack = await snapshot(page);
      validateState(afterBack, key, 'navegación Atrás');
      coverage.push({ scenario: key, check: 'atras', exercised: true, mounted: afterBack.appMounted, hash: afterBack.hash });
    } catch (error) {
      add('P2', key, 'La navegación Atrás no se recuperó correctamente', error.message || String(error));
    }
  } else {
    coverage.push({
      scenario: key,
      check: 'atras',
      exercised: false,
      reason: 'La navegación interna no creó una entrada observable en el historial; no se clasifica como defecto.',
    });
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
  const externalFailures = [];

  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => {
    const failure = request.failure()?.errorText || '';
    if (/ERR_ABORTED/i.test(failure)) return;
    const item = `${request.url()} · ${failure || 'falló'}`;
    if (request.url().startsWith(baseURL)) localFailures.push(item);
    else externalFailures.push(item);
  });
  page.on('response', response => {
    if (response.status() < 400) return;
    const item = `${response.status()} · ${response.url()}`;
    if (response.url().startsWith(baseURL)) localFailures.push(item);
    else if (!/script\.google(?:usercontent)?\.com/i.test(response.url())) externalFailures.push(item);
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
    await waitForCampusReady(page, 20000);

    if (scenario.clickLabel) {
      const control = await findNavigationControl(page, { label: scenario.clickLabel });
      if (control) {
        await control.click({ timeout: 7000 });
        await waitForCampusReady(page, 15000);
      } else {
        add('P2', key, 'No se encontró el control inicial visible', scenario.clickLabel);
      }
    }

    const state = await snapshot(page);
    validateState(state, key, 'carga inicial', { requireDiagnosticLabel: true });
    await exerciseNavigation(page, scenario, key);

    for (const error of [...new Set(pageErrors)]) add('P1', key, 'Excepción no controlada en navegador', error);
    for (const failure of [...new Set(localFailures)]) add('P1', key, 'Recurso local no disponible', failure);
    for (const failure of [...new Set(externalFailures)]) add('P3', key, 'Recurso externo no disponible', failure);
    for (const error of [...new Set(consoleErrors)].slice(0, 10)) {
      if (/Failed to load resource/i.test(error) && (localFailures.length || externalFailures.length)) continue;
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
    'La prueba Atrás solo se ejecuta cuando la aplicación crea una entrada observable en el historial.',
    'Un recurso externo fallido se reporta como P3 salvo que impida montar la aplicación.',
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
  ...coverage.map(item => {
    if (item.check === 'alternancia_repetida') return `- ${item.scenario} · alternancia: ${item.successful}/${item.attempted}`;
    if (item.exercised === false) return `- ${item.scenario} · ${item.check}: ${item.reason}`;
    return `- ${item.scenario} · ${item.check}: ejecutado`;
  }),
  '',
  '## Hallazgos',
  '',
  ...(findings.length ? findings.flatMap(item => [
    `### ${item.id} · ${item.severity} · ${item.title}`,
    '',
    `- Escenario: ${item.scenario}`,
    `- Evidencia: ${item.evidence}`,
    '',
  ]) : ['No se detectaron hallazgos en los escenarios sintéticos.', '']),
  '## Limitaciones',
  '',
  ...report.limitations.map(value => `- ${value}`),
  '',
].join('\n');
fs.writeFileSync(path.join(outDir, 'browser-report.md'), markdown);

console.log(`BROWSER QA: ${verdict}; P0=${counts.P0} P1=${counts.P1} P2=${counts.P2} P3=${counts.P3}`);
if (counts.P0 || counts.P1) process.exitCode = 1;
