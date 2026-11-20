// QA E1 de INTEGRACIÓN en navegador (Chromium headless, servidor estático local sobre la raíz del repo).
// Prueba el adaptador real (epl_apps_script_adapter.js), la página en modo ?backend=apps-script y la vista del Campus
// (src/exam_prep_lab.jsx renderizada con React/Babel del propio repo). Las llamadas a script.google.com se interceptan
// y las atiende el núcleo real (epl_server_core.js) en Node con usuarios ficticios. No sale nada a internet.
// Uso: node prototipos/exam_prep_lab/qa_integration_e1.mjs  (CHROME=/ruta opcional)
import assert from 'node:assert/strict'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module'; import { chromium } from 'playwright';
const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url)); const repo = path.resolve(here, '..', '..');
globalThis.window = globalThis; require(path.join(here, 'epl_engine.js')); const EPLServer = require(path.join(here, 'epl_server_core.js'));
const FORMS = {}; for (const f of ['a', 'b']) { const p = path.join(here, 'forms', `form_${f}.json`); if (fs.existsSync(p)) FORMS[f.toUpperCase()] = JSON.parse(fs.readFileSync(p, 'utf8')); }
const CFG = JSON.parse(fs.readFileSync(path.join(repo, 'config', 'apps-script-production.json'), 'utf8'));

/* ── servidor certprepapi simulado (misma forma que 97_Cert_Prep_Lab.js: sesión del Campus o "cp1.") ── */
const T = {}; const db = { read: t => (T[t] || []).map(r => ({ ...r })), upsert(t, pk, row) { T[t] = T[t] || []; const i = T[t].findIndex(r => String(r[pk]) === String(row[pk])); if (i >= 0) T[t][i] = { ...row }; else T[t].push({ ...row }); }, append(t, row) { (T[t] = T[t] || []).push({ ...row }); }, lock: fn => fn() };
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const core = EPLServer.create({ db, config: { ENV: 'DEMO' }, deps: { now: () => Date.now(), uuid: () => crypto.randomUUID(), sha256: sha, forms: () => FORMS, pepper: 'qa',
  searchPeople: () => [], usernameExists: u => ['ana.demo'].includes(u), hashPassword: p => 'h$' + sha('s' + p), verifyPassword: (h, p) => h === 'h$' + sha('s' + p) } });
const CAMPUS = { 'campus-leo': { usuario: 'leo.demo', rol: 'superadmin', nombre: 'Leo Demo' }, 'campus-ana': { usuario: 'ana.demo', rol: 'student', nombre: 'Ana Demo', codigo: '17901' } };
const CERT = {}; const seen = [];
function certprepapi(body) {
  seen.push(body);
  const { action, payload = {}, token = '' } = body;
  if (action === 'login') { const r = core.handle(null, 'verifyLogin', payload); if (!r.ok) return { ok: false, error: 'credenciales_invalidas', mensaje: 'Usuario o clave incorrectos.' }; const tk = 'cp1.' + crypto.randomUUID(); CERT[tk] = { usuario: r.usuario, rol: 'cert_candidate', nombre: r.nombre, codigo: r.codigo }; return { ok: true, token: tk, expira: new Date(Date.now() + 8 * 3600e3).toISOString(), user: CERT[tk] }; }
  if (action === 'logout') { delete CERT[token]; return { ok: true }; }
  if (action === 'verifyLogin') return { ok: false, error: 'accion_desconocida' };
  if (['activationInfo', 'activate'].includes(action)) return core.handle(null, action, payload);
  const ctx = CERT[token] || CAMPUS[token]; if (!ctx) return { ok: false, error: token ? 'sesion_invalida' : 'sesion_requerida' };
  return core.handle(ctx, action, payload);
}
const leo = CAMPUS['campus-leo'];
const ana = core.handle(leo, 'adminRegister', { codigo: '17901', nombre: 'Ana Demo', cedula: '100000901' }); core.handle(leo, 'adminGrant', { candidate_id: ana.candidate.candidate_id, forms: ['B'], sim_forms: ['A'] });
const bruno = core.handle(leo, 'adminRegister', { codigo: '16502', nombre: 'Bruno Demo', cedula: '100000502' }); core.handle(leo, 'adminGrant', { candidate_id: bruno.candidate.candidate_id, forms: ['B'], sim_forms: ['A'] });

/* ── estático sobre la raíz del repo + página de prueba de la vista del Campus ── */
const types = { '.html': 'text/html', '.js': 'text/javascript', '.jsx': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.json': 'application/json' };
const HARNESS = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>QA vista Campus</title></head><body><div id="root"></div>
<script src="vendor/react.js"></script><script src="vendor/react-dom.js"></script><script src="vendor/babel.js"></script>
<script>window.APPS_SCRIPT_URL='https://script.google.com/macros/s/${CFG.deploymentId}/exec';window.getSessionToken=()=>'campus-ana';</script>
<script type="text/babel" data-plugins="transform-block-scoping" src="src/exam_prep_lab.jsx"></script>
<script type="text/babel">ReactDOM.render(<ExamPrepLabView usuario={{usuario:'ana.demo',nombre:'Ana Demo',rol:'student'}} />, document.getElementById('root'));</script></body></html>`;
const requested = [];
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname); requested.push(p);
  if (p === '/qa_epl_wrapper.html') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(HARNESS); }
  const f = path.join(repo, p);
  if (!f.startsWith(repo) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0);
const ORIGIN = `http://127.0.0.1:${server.address().port}`;
const PAGE = ORIGIN + '/prototipos/exam_prep_lab/index.html?backend=apps-script';
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const results = [];
async function t(name, fn) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); ctx.setDefaultTimeout(20000);
  const page = await ctx.newPage(); const errors = []; const external = []; const apiCalls = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { const u = new URL(r.url()); if (u.hostname !== '127.0.0.1' && u.hostname !== 'script.google.com') external.push(r.url()); });
  await page.route('https://script.google.com/**', async route => {
    const req = route.request(); const u = new URL(req.url());
    assert.equal(u.pathname, `/macros/s/${CFG.deploymentId}/exec`); assert.equal(u.searchParams.get('fn'), 'certprepapi');
    const body = JSON.parse(req.postData() || '{}'); apiCalls.push(body);
    const out = certprepapi(body); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out) }); apiCalls[apiCalls.length - 1]._resp = out;
  });
  const t0 = Date.now();
  try { await fn(page, apiCalls); assert.deepEqual(errors, [], 'errores JS: ' + errors.join(' | ')); assert.deepEqual(external, [], 'peticiones externas'); results.push(['PASS', `${name} (${Math.round((Date.now() - t0) / 1000)} s)`]); }
  catch (e) { results.push(['FAIL', `${name} → ${String(e.message).replace(/\s+/g, ' ').slice(0, 260)}`]); await page.screenshot({ path: `/tmp/qa_int_fail_${results.length}.png`, fullPage: true }).catch(() => {}); }
  console.log(results[results.length - 1].join(' ')); await ctx.close();
}
const LEAK = /"(correct|explanation|distractors|script|image_desc_after)"/;

await t('Modo apps-script: no carga banco ni núcleo en el navegador; URL desde config de producción', async (page) => {
  requested.length = 0; await page.goto(PAGE); await page.waitForSelector('#lu');
  assert.ok(!requested.some(p => /forms\/form_|epl_server_core|epl_mock_backend/.test(p)), requested.join(','));
  assert.ok(requested.includes('/config/apps-script-production.json'));
  assert.ok(!(await page.evaluate(() => !!window.EPL_FORMS || !!window.EPLServer || !!window.EPLMock)));
});
let actToken;
await t('Enlace de activación de un solo uso → cuenta de preparación (página real, servidor simulado)', async (page) => {
  actToken = core.handle(leo, 'adminActivationLink', { candidate_id: bruno.candidate.candidate_id }).token;
  await page.goto(PAGE + '#activar-' + actToken); await page.waitForSelector('#ac-u');
  await page.fill('#ac-u', 'bruno.prep'); await page.fill('#ac-p', 'Prueba2026x'); await page.fill('#ac-p2', 'Prueba2026x'); await page.click('[data-act=activate]');
  await page.waitForSelector('text=Ya podés iniciar sesión');
});
await t('Login de preparación: token cp1 solo en sessionStorage; práctica sin claves en la red', async (page, calls) => {
  await page.goto(PAGE); await page.waitForSelector('#lu'); await page.fill('#lu', 'bruno.prep'); await page.fill('#lp', 'Prueba2026x'); await page.click('#lcert');
  await page.waitForFunction(() => document.getElementById('epl-who').textContent.includes('Bruno'));
  const st = await page.evaluate(() => ({ s: sessionStorage.getItem('epl_cert_session_v1'), l: Object.keys(localStorage).filter(k => /cert|token/i.test(k)) }));
  assert.match(JSON.parse(st.s).token, /^cp1\./); assert.deepEqual(st.l, []);
  await page.goto(PAGE + '#entrenar'); await page.waitForSelector('[data-act=start][data-part="5"]'); await page.click('[data-act=start][data-part="5"]'); await page.waitForSelector('.q .opts .opt');
  const start = calls.find(c => c.action === 'start'); assert.ok(start && start._resp.ok); assert.ok(!LEAK.test(JSON.stringify(start._resp)), 'la respuesta de start filtró claves');
  assert.ok(calls.every(c => !('codigo' in (c.payload || {})) && !('cedula' in (c.payload || {})) && !('candidate_id' in (c.payload || {}))), 'el navegador envió identidad');
  assert.ok(calls.filter(c => c.action !== 'login').every(c => /^cp1\./.test(c.token)));
});
await t('Vista del Campus: usa la sesión del Campus, pestañas sin tocar el hash del Campus, recursos bajo prototipos/', async (page, calls) => {
  await page.goto(ORIGIN + '/qa_epl_wrapper.html#campus-ruta'); await page.waitForSelector('#epl-tabs a', { timeout: 30000 });
  await page.waitForFunction(() => /Hola, Ana/.test(document.querySelector('main').textContent));
  assert.ok(calls.length && calls.every(c => c.token === 'campus-ana'));
  const tab = await page.$('#epl-tabs a[data-go="entrenar"]'); await tab.click(); await page.waitForSelector('[data-act=start][data-part="1"]');
  assert.equal(await page.evaluate(() => location.hash), '#campus-ruta');
  await page.click('[data-act=start][data-part="1"]'); await page.waitForSelector('.photo img');
  const img = await page.$eval('.photo img', i => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 }));
  assert.match(img.src, /^prototipos\/exam_prep_lab\/img\//); await page.waitForFunction(() => { const i = document.querySelector('.photo img'); return i.complete && i.naturalWidth > 0; });
  assert.ok(!(await page.evaluate(() => !!window.EPL_FORMS || !!window.EPLServer)));
});

results.forEach(() => {}); const fails = results.filter(r => r[0] !== 'PASS').length;
console.log(`\n${results.length - fails}/${results.length} PASS`);
await browser.close(); server.close(); process.exit(fails ? 1 : 0);
