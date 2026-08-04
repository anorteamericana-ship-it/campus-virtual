import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const outDir = path.join(process.cwd(), 'qa-output', 'admin-resources-cs21a156');
fs.mkdirSync(outDir, { recursive: true });

function session(role) {
  return {
    rol: role,
    nombre: `QA ${role}`,
    cedula: `QA-${role}`,
    token: 'qa-readonly-token',
    expira: '2099-12-31T23:59:59.000Z',
    tipoUsuario: role,
    permisos: ['*'],
  };
}

function mock(fn, role) {
  if (fn === 'validarSesion') return { ok:true, rol:role, qa:true };
  if (fn === 'teacherBooksOpenImageBook') {
    const image = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="390"><rect width="100%" height="100%" fill="white"/><text x="30" y="60" font-size="24">QA BOOK</text></svg>');
    return {
      ok:true,
      level:'B1',
      book_type:'SB',
      pages:[
        { source_page:1, display_index:1, file_id:'QA-P1', image_url:image, fallback_url:image },
        { source_page:2, display_index:2, file_id:'QA-P2', image_url:image, fallback_url:image },
      ],
      unit_starts:Array.from({length:16}, (_, index) => index + 1),
      qa:true,
    };
  }
  return { ok:true, rows:[], items:[], data:[], grupos:[], estudiantes:[], sesiones:[], pendientes:[], qa:true };
}

const results = [];
const browser = await chromium.launch({ headless:true });

for (const role of ['admin', 'superadmin']) {
  const context = await browser.newContext({ viewport:{ width:1440, height:900 }, ignoreHTTPSErrors:true });
  const user = session(role);
  await context.addInitScript(({ user }) => {
    sessionStorage.setItem('an_usuario', JSON.stringify(user));
    sessionStorage.removeItem('an_just_logged_in');
    localStorage.setItem('an_role', 'admin');
    localStorage.setItem('an_active_admin', 'dashboard');
    localStorage.setItem('an_active', 'dashboard');
  }, { user });

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.route('**/script.google.com/**', async route => {
    const request = route.request();
    let fn = '';
    try {
      fn = new URL(request.url()).searchParams.get('fn') || '';
      const raw = request.postData() || '';
      if (raw) fn = JSON.parse(raw).fn || fn;
    } catch (_) {}
    await route.fulfill({
      status:200,
      contentType:'application/json; charset=utf-8',
      body:JSON.stringify(mock(fn, role)),
    });
  });

  await page.goto(`${baseURL}/campus.html`, { waitUntil:'domcontentloaded', timeout:30000 });
  await page.waitForFunction(() => document.querySelector('aside.admin-sb') && document.getElementById('root')?.innerText?.trim().length > 20, null, { timeout:20000 });

  const nav = page.locator('aside.admin-sb .sb-item[data-nav-id="recursos_didacticos"]');
  await assert.doesNotReject(async () => nav.waitFor({ state:'visible', timeout:10000 }));
  await nav.click();

  const canonical = page.locator('[data-screen-label*="Ruta canónica"]');
  await canonical.waitFor({ state:'visible', timeout:20000 });
  await page.getByText('Libros de texto · Básico I', { exact:true }).waitFor({ state:'visible', timeout:15000 });
  await page.getByRole('button', { name:'Actualizar desde Drive', exact:true }).waitFor({ state:'visible', timeout:10000 });

  const active = await nav.evaluate(node => node.classList.contains('active') && node.getAttribute('aria-current') === 'page');
  assert.equal(active, true, `${role}: la ruta canónica debe quedar seleccionada.`);

  const legacyHosts = await page.locator('#an-admin-resources-nav-cs21a59, #an-superadmin-resources-cs21a60, #an-resources-nav-cs21a65').count();
  assert.equal(legacyHosts, 0, `${role}: no deben existir hosts de menú fabricados por DOM.`);

  const markers = await page.evaluate(() => {
    const dashboard = window.AdminMasterDashboard;
    return {
      cs59:Boolean(dashboard?.__cs21a59AdminResources),
      cs61:Boolean(dashboard?.__cs21a61ResourceRuntime),
      direct:Boolean(dashboard?.__cs21a75DirectResources),
      view:typeof window.AdminResourcesView,
      canonical:window.__AN_ADMIN_RESOURCES_CANONICAL_VERSION__ || '',
    };
  });
  assert.equal(markers.cs59, false, `${role}: Panel Maestro no debe conservar wrapper CS21A59.`);
  assert.equal(markers.cs61, false, `${role}: Panel Maestro no debe conservar wrapper CS21A61.`);
  assert.equal(markers.direct, false, `${role}: Panel Maestro no debe conservar wrapper directo.`);
  assert.equal(markers.view, 'function');
  assert.match(markers.canonical, /CS21A156/);

  const calibrate = page.getByRole('button', { name:'Actualizar', exact:true });
  const visibleCalibrate = await calibrate.evaluateAll(nodes => nodes.filter(node => {
    const style = getComputedStyle(node);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }).length);
  if (role === 'superadmin') assert.ok(visibleCalibrate > 0, 'superadmin debe poder calibrar inicios de unidad.');
  else assert.equal(visibleCalibrate, 0, 'admin no debe calibrar inicios de unidad.');

  assert.deepEqual(pageErrors, [], `${role}: no debe producir pageerror.`);
  await page.screenshot({ path:path.join(outDir, `${role}.png`), fullPage:true });
  results.push({ role, active, legacyHosts, markers, visibleCalibrate });
  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(outDir, 'result.json'), JSON.stringify({ ok:true, results }, null, 2));
console.log('OK: ruta canónica de Recursos Didácticos validada para admin y superadmin.');
