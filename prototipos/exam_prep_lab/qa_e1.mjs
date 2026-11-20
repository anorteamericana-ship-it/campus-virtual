// QA E1 en navegador (Chromium headless, servidor estático local, backend SIMULADO, usuarios ficticios).
// No toca el Campus ni Apps Script. Uso: node prototipos/exam_prep_lab/qa_e1.mjs  (requiere playwright; CHROME=/ruta opcional; ONLY=regex)
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0);
const BASE = `http://127.0.0.1:${server.address().port}/index.html`;
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--autoplay-policy=no-user-gesture-required', '--disable-background-networking', '--disable-component-update', '--no-first-run'] });
const results = []; const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
async function t(name, fn, opts = {}) {
  if (only && !only.test(name)) return;
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 900 } });
  ctx.setDefaultTimeout(opts.timeout || 20000);
  if (opts.fast) await ctx.addInitScript(() => { const p = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { this.playbackRate = 16; return p.call(this); }; });
  const page = await ctx.newPage(); const errors = []; const external = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { const u = new URL(r.url()); if (u.protocol.startsWith('http') && !['127.0.0.1', 'localhost'].includes(u.hostname)) external.push(r.url()); });
  const t0 = Date.now();
  try { await Promise.race([fn(page, ctx), new Promise((_, rej) => setTimeout(() => rej(new Error('tiempo de prueba agotado')), opts.max || 90000))]); assert.deepEqual(errors, [], 'errores JS: ' + errors.join(' | ')); assert.deepEqual(external, [], 'peticiones externas'); results.push(['PASS', name + ` (${Math.round((Date.now() - t0) / 1000)} s)`]); }
  catch (err) { results.push(['FAIL', name + ' → ' + String(err.message).replace(/\s+/g, ' ').slice(0, 260)]); await page.screenshot({ path: `/tmp/qa_fail_${results.length}.png`, fullPage: true }).catch(() => {}); }
  console.log(results[results.length - 1].join(' '));
  await ctx.close();
}
const main = async page => { await page.waitForTimeout(150); return page.textContent('main'); };
async function login(page, who) { await page.goto(BASE); await page.waitForSelector('[data-demo]'); await page.click(`[data-demo=${who}]`); await page.waitForFunction(() => document.getElementById('epl-who').textContent.trim().length > 0 && !document.querySelector('[data-demo]')); await page.waitForTimeout(300); }
async function certLogin(page, u, p) { await page.goto(BASE); await page.waitForSelector('#lu'); await page.fill('#lu', u); await page.fill('#lp', p); await page.click('#lcert'); await page.waitForTimeout(300); }
async function startPart(page, p) { await page.goto(BASE + '#entrenar'); await page.waitForSelector(`[data-act=start][data-part="${p}"]`); await page.click(`[data-act=start][data-part="${p}"]`); await page.waitForSelector('.q .opts .opt'); }
async function answerUnit(page, pick = 0) {
  await page.waitForSelector('.q .opts .opt');
  for (const g of await page.$$('.q .opts')) { const b = await g.$$('.opt'); await b[Math.min(pick, b.length - 1)].click(); await page.waitForTimeout(120); }
  await page.waitForSelector('[data-act=check]:not([disabled])'); await page.click('[data-act=check]'); await page.waitForSelector('[data-act=next]');
}
async function runPractice(page, pick = 0) { for (let k = 0; k < 40; k++) { await page.waitForSelector('[data-act=check], main h1:has-text("Resultado")'); if (!(await page.$('[data-act=check]'))) break; await answerUnit(page, pick); await page.click('[data-act=next]'); await page.waitForTimeout(200); } await page.waitForSelector('main h1:has-text("Resultado")'); }

await t('01 estudiante: panel sin fecha de examen; diagnóstico equilibrado de 20 → resultado sin MCER', async page => {
  await login(page, 'ana'); const p = await main(page); assert.match(p, /Hola, Ana/); assert.doesNotMatch(p, /fecha de tu examen|días para/i);
  await page.click('[data-act=start][data-tipo=diagnostic]'); await page.waitForSelector('.q');
  assert.match(await main(page), /de 20/); await runPractice(page, 0);
  const r = await main(page); assert.match(r, /\d+\/20/); assert.match(r, /no equivale a un nivel MCER/); for (const n of [1, 2, 3, 4, 5, 6, 7]) assert.match(r, new RegExp('Parte ' + n));
});
await t('02 Partes 1–2: el texto de las opciones no está en la página antes de responder', async page => {
  await login(page, 'ana'); await startPart(page, 2);
  assert.equal((await page.$eval('.q .opts', g => g.innerText)).replace(/\s/g, ''), 'ABC');
  await answerUnit(page, 1); assert.match(await main(page), /Transcripción/);
});
await t('03 audio: suena, avanza y se limita a 3 reproducciones en práctica', async page => {
  await login(page, 'ana'); await startPart(page, 2);
  await page.click('[data-act=play]'); await page.waitForTimeout(1500); const w = await page.$eval('#pl-bar', el => parseFloat(el.style.width)); assert.ok(w > 0, 'la barra no avanzó');
  await page.click('[data-act=play]'); await page.click('[data-act=play]'); assert.equal(await page.$eval('[data-act=play]', b => b.disabled), true);
});
await t('04 Parte 3: transcripción y explicaciones solo después de revisar', async page => {
  await login(page, 'ana'); await startPart(page, 3);
  assert.doesNotMatch(await page.content(), /Transcripción|Estrategia:|\(correcta\)/);
  await answerUnit(page, 3); const after = await main(page); assert.match(after, /Transcripción/); assert.match(after, /Correcto|Incorrecto/);
});
await t('05 errores se registran y aparecen en el repaso espaciado', async page => {
  await login(page, 'ana'); await startPart(page, 5); await runPractice(page, 3);
  await page.goto(BASE + '#errores'); await page.waitForSelector('table'); const txt = await main(page); assert.match(txt, /pendiente|en repaso/); assert.match(txt, /Repasar todos los pendientes \(\d+\)/);
});
await t('06 continuar una actividad después de recargar (respuestas guardadas en el servidor)', async page => {
  await login(page, 'ana'); await startPart(page, 5); await (await page.$$('.q .opts .opt'))[2].click(); await page.waitForTimeout(500);
  await page.reload(); await page.goto(BASE + '#panel'); await page.waitForSelector('[data-act=open-attempt]');
  await page.click('[data-act=open-attempt]'); await page.waitForSelector('.q'); assert.equal(await page.$$eval('.opt[aria-pressed=true]', x => x.length), 1);
});
await t('07 dos estudiantes separados; egresado con cuenta de preparación; estudiante sin acceso', async page => {
  await login(page, 'ana'); await startPart(page, 5); await runPractice(page, 0);
  await page.goto(BASE + '#salir'); await page.waitForSelector('[data-demo]'); await certLogin(page, 'bruno.demo', 'Demo2026x'); await page.waitForSelector('text=Hola, Bruno');
  const b = await main(page); assert.match(b, /Todavía no terminaste ninguna actividad/); assert.match(await page.textContent('#epl-who'), /cert_candidate/);
  await page.goto(BASE + '#salir'); await page.waitForSelector('[data-demo]'); await login(page, 'carla'); assert.match(await main(page), /no está activo|No tenés acceso/);
});
await t('08 audio que no carga en práctica: aviso y se puede saltar sin contar', async (page, ctx) => {
  await ctx.route(/audio\/[AB]\/[AB]-P2-\d+\.mp3/, r => r.fulfill({ status: 404, body: '' }));
  await login(page, 'ana'); await startPart(page, 2); await page.waitForSelector('[role=alert]');
  assert.match(await page.textContent('[role=alert]'), /No se pudo cargar el audio/); await page.click('[data-act=skip-unit]'); await page.waitForTimeout(400);
});
await t('09 simulacro Listening no inicia si falta un audio', async (page, ctx) => {
  await ctx.route(/A-G4-07\.mp3/, r => r.fulfill({ status: 404, body: '' }));
  await login(page, 'ana'); await page.goto(BASE + '#simulacros'); await page.click('[data-act=start][data-tipo=sim_listening]');
  await page.click('[data-act=sim-begin]'); await page.waitForSelector('text=no cargaron', { timeout: 40000 }); assert.match(await main(page), /no empieza con audio incompleto/);
}, { max: 60000 });
await t('10 simulacro Listening de 100: audio continuo con instrucciones, sin repetir, sin texto P1–P2, corrección al final', async page => {
  await login(page, 'ana'); await page.goto(BASE + '#simulacros'); await page.click('[data-act=start][data-tipo=sim_listening]'); await page.click('[data-act=sim-begin]');
  await page.waitForSelector('text=Audio en curso', { timeout: 40000 }); assert.equal(await page.$('[data-act=play]'), null); assert.match(await main(page), /de 100/);
  assert.equal((await page.$eval('.q .opts', g => g.innerText)).replace(/\s/g, ''), 'ABCD');
  for (let k = 0; k < 3000; k++) { if (await page.$('main h1:has-text("Resultado")')) break; const o = await page.$('.q .opts:not(:has([aria-pressed=true])) .opt'); if (o) await o.click().catch(() => {}); await page.waitForTimeout(100); }
  const txt = await main(page); assert.match(txt, /\d+\/100/); assert.match(txt, /Revisión pregunta por pregunta/);
}, { fast: true, max: 420000 });
await t('11 recarga durante Listening: el audio interrumpido no se repite y el simulacro sigue', async page => {
  await login(page, 'ana'); await page.goto(BASE + '#simulacros'); await page.click('[data-act=start][data-tipo=sim_listening]'); await page.click('[data-act=sim-begin]');
  await page.waitForSelector('text=Audio en curso', { timeout: 40000 }); await page.waitForTimeout(1200); const before = await page.textContent('.qhead');
  await page.reload(); await page.goto(BASE + '#simulacros'); await page.click('[data-act=open-attempt]');
  await page.waitForSelector('text=ese audio no se repite'); await page.click('[data-act=sim-interrupted]');
  await page.waitForSelector('text=Audio en curso'); const after = await page.textContent('.qhead'); assert.notEqual(before, after, 'no avanzó');
}, { max: 70000 });
await t('12 simulacro Reading: reloj del servidor (75 min), mapa, marcas, recarga y fin por tiempo', async page => {
  await page.clock.install({ time: new Date('2026-11-20T09:00:00-06:00') });
  await login(page, 'ana'); await page.goto(BASE + '#simulacros'); await page.click('[data-act=start][data-tipo=sim_reading]');
  await page.waitForSelector('.palette', { state: 'attached' }); assert.match(await page.textContent('#timer'), /^1:15:00|^1:14:5\d/);
  await (await page.$$('.q .opt'))[1].click(); await page.waitForTimeout(400); await page.click('[data-act=flag]'); await page.click('[data-act=sim-move][data-d="1"]'); await page.click('[data-act=sim-move][data-d="-1"]');
  assert.equal(await page.$$eval('.palette button.flag', x => x.length), 1);
  await page.reload(); await page.goto(BASE + '#simulacros'); await page.waitForSelector('[data-act=open-attempt]'); await page.click('[data-act=open-attempt]'); await page.waitForSelector('.palette', { state: 'attached' });
  assert.equal(await page.$$eval('.palette button.done', x => x.length), 1, 'la respuesta no sobrevivió');
  await page.clock.fastForward('01:16:00'); await page.waitForSelector('text=Terminado por tiempo', { timeout: 15000 }); assert.match(await main(page), /Manejo del tiempo/);
});
await t('13 simulacro integral: 200 preguntas en orden, empieza por Listening', async page => {
  await login(page, 'ana'); await page.goto(BASE + '#simulacros'); await page.click('[data-act=start][data-tipo=sim_full]');
  await page.waitForSelector('[data-act=sim-begin]'); assert.match(await main(page), /carguen los 54 audios/);
  await page.click('[data-act=sim-begin]'); await page.waitForSelector('text=Audio en curso', { timeout: 40000 }); assert.match(await main(page), /pregunta 1 de 200/);
}, { fast: true, max: 60000 });
await t('14 teclado: 1–4 eligen y Enter confirma', async page => {
  await login(page, 'ana'); await startPart(page, 5); await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press('2'); await page.waitForTimeout(300); assert.equal(await page.$$eval('.opt[aria-pressed=true]', x => x.length), 1);
  await page.evaluate(() => document.activeElement.blur()); await page.keyboard.press('Enter'); await page.waitForSelector('[data-act=next]');
});
await t('15 superadmin: busca, registra, habilita, genera enlace; el egresado activa; enlace de un uso; suspender; auditoría', async (page, ctx) => {
  await login(page, 'leo'); assert.match(await main(page), /Candidatos de Exam Prep Lab/);
  await page.fill('#q', 'Diego'); await page.click('[data-act=search]'); await page.waitForSelector('[data-act=register-person]'); await page.click('[data-act=register-person]');
  await page.waitForSelector('[data-act=grant]'); await page.fill('#g-motivo', 'QA'); await page.click('[data-act=grant]'); await page.waitForSelector('text=ACTIVO');
  await page.click('[data-act=activation]'); await page.waitForSelector('#act-url'); const url = await page.inputValue('#act-url'); assert.match(url, /#activar-[0-9a-f]{40,}/);
  const p2 = await ctx.newPage(); await p2.goto(url); await p2.waitForSelector('#ac-u'); await p2.fill('#ac-u', 'diego.demo'); await p2.fill('#ac-p', 'Diego2026x'); await p2.fill('#ac-p2', 'Diego2026x'); await p2.click('[data-act=activate]'); await p2.waitForSelector('text=Ya podés iniciar sesión');
  await p2.goto(BASE); await p2.goto(url); await p2.waitForSelector('main h1'); await p2.waitForTimeout(300); assert.match(await p2.textContent('main'), /no es válido|ya se usó/);
  await page.click('[data-act=revoke]'); await page.click('[data-act=revoke]'); await page.waitForSelector('text=SUSPENDIDO');
  await page.goto(BASE + '#auditoria'); await page.waitForSelector('table'); const aud = await main(page); for (const a of ['REGISTER', 'GRANT', 'ACTIVATION_LINK', 'ACTIVATE', 'REVOKE']) assert.match(aud, new RegExp(a));
});
await t('16 vista editorial separada: el estudiante no la ve; la revisora no puede publicar; la docente solo ve a su asignada', async page => {
  await login(page, 'ana'); await page.goto(BASE + '#banco'); await page.waitForTimeout(500); assert.match(await main(page), /Hola, Ana/); assert.doesNotMatch(await page.textContent('#epl-tabs'), /Banco/);
  await page.goto(BASE + '#salir'); await page.waitForSelector('[data-demo]'); await login(page, 'profe'); await page.waitForSelector('text=Mis candidatos'); const m = await main(page); assert.match(m, /Ana Demo/); assert.doesNotMatch(m, /Bruno/);
  await page.goto(BASE + '#banco'); await page.waitForSelector('text=Tu rol editorial'); const b = await main(page); assert.match(b, /REVISOR/); assert.match(b, /Completa/); assert.match(b, /0 errores/);
  assert.equal(await page.$('[data-act=set-status][data-s=PUBLISHED]'), null);
  await page.check('.sel >> nth=0'); await page.click('[data-act=set-status][data-s=IN_REVIEW]'); await page.waitForSelector('text=1 actualizadas');
});
await t('17 sin conexión: la respuesta queda en cola y se envía al volver', async page => {
  await login(page, 'ana'); await startPart(page, 5); await page.check('#sim-offline');
  await (await page.$$('.q .opts .opt'))[0].click(); await page.waitForSelector('#epl-offline:not([hidden])'); assert.match(await page.textContent('#epl-offline'), /Sin conexión/);
  await page.uncheck('#sim-offline'); await page.waitForFunction(() => document.getElementById('epl-offline').hidden, null, { timeout: 15000 });
  await page.reload(); await page.goto(BASE + '#panel'); await page.click('[data-act=open-attempt]'); await page.waitForSelector('.q'); assert.equal(await page.$$eval('.opt[aria-pressed=true]', x => x.length), 1);
});
for (const r of [['ana', 'panel'], ['ana', 'sesion'], ['ana', 'simulacros'], ['ana', 'reportes'], ['leo', 'candidatos'], ['profe', 'banco']]) {
  await t(`18 móvil 390 px sin desbordamiento horizontal · ${r[0]} · ${r[1]}`, async page => {
    await login(page, r[0]); if (r[1] === 'sesion') await startPart(page, 7); else { await page.goto(BASE + '#' + r[1]); await page.waitForTimeout(700); }
    const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); assert.ok(o <= 1, 'desborde ' + o + ' px');
    await page.screenshot({ path: `/tmp/qa_mobile_${r[0]}_${r[1]}.png` });
  }, { viewport: { width: 390, height: 844 } });
}
server.close(); await browser.close();
const fail = results.filter(r => r[0] === 'FAIL').length; console.log(`\n${results.length - fail}/${results.length} PASS`);
process.exit(fail ? 1 : 0);
