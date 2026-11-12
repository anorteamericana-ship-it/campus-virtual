// Northbound · Aventura 001 · prueba E1 en navegador real (Chrome), página servida desde el repo.
// Uso:  python3 -m http.server 4173   (raíz del repo)   y   node prototipos/english_lab_2/qa_aventura_e1.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
const BASE = (process.env.QA_BASE_URL || 'http://127.0.0.1:4173') + '/prototipos/english_lab_2/';
const URL = BASE + 'aventura-001.html', shots = process.env.QA_SHOTS || '';
let passed = 0;
const ok = (name, detail = '') => { passed++; console.log('PASS', name, detail); };

async function open(browser, opts = {}) {
  const context = await browser.newContext({ viewport: { width: opts.width || 1280, height: opts.height || 800 }, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  const problems = [], backend = [], media = [];
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) problems.push(m.text()); });
  page.on('pageerror', e => problems.push(String(e)));
  page.on('request', r => { const u = r.url(); if (/script\.google|googleusercontent/.test(u)) backend.push(u); if (/\.mp4/.test(u)) media.push(u.split('/').pop()); });
  if (opts.route) await opts.route(page);
  await page.goto(URL, { waitUntil: 'load' });
  return { context, page, problems, backend, media };
}
const noSideScroll = page => page.evaluate(() => document.scrollingElement.scrollWidth <= window.innerWidth + 1);
async function start(page, name) {
  if (await page.isVisible('#nb-skip')) await page.click('#nb-skip');
  await page.fill('#nb-name', name);
  await page.click('#nb-start');
  await page.waitForSelector('.l2-episode');
}
const go = page => page.click('.l2-step .l2-btn-go:not([disabled])');
async function playStep(page, step, name, vars, mistakes) {
  const fill = s => s.replaceAll('{name}', name).replaceAll('{drink}', vars.drink);
  await page.waitForSelector('.l2-step');
  if (step.kind === 'line') return go(page);
  if (step.kind === 'say') return page.click('.l2-actions .l2-btn-go');
  if (step.kind === 'pick') { await page.click(`.l2-option:text-is("${vars.pick}")`); await page.waitForSelector('.l2-reply'); return go(page); }
  if (step.kind === 'choice') {
    if (mistakes) {
      const wrong = step.options.find(o => !o.ok && o.react);
      if (wrong) {
        await page.click(`.l2-option:text-is("${fill(wrong.t)}")`);
        assert((await page.textContent('.l2-reply')).includes(fill(wrong.react)), 'el personaje reacciona en inglés al error');
        assert((await page.textContent('.l2-feedback.is-no')).includes(wrong.why_es));
        assert(await page.locator('.nb-portrait.nb-confused').count(), 'el retrato cambia de expresión');
      }
    }
    await page.click(`.l2-option:text-is("${fill(step.options.find(o => o.ok).t)}")`);
    await page.waitForSelector('.l2-feedback.is-ok');
    assert(await page.locator('.nb-portrait.nb-happy').count(), 'el retrato sonríe al acertar');
    if (step.then) assert((await page.textContent('.l2-reply')).includes(fill(step.then)), 'el personaje sigue la conversación');
    return go(page);
  }
  if (step.kind === 'spell') { await page.fill('#l2-spell-input', step.own ? name : step.word); await page.click('.l2-input-row button[type=submit]'); await page.waitForSelector('.l2-feedback.is-ok'); return go(page); }
  if (step.kind === 'build') { for (const w of step.answer.map(fill)) await page.click(`.l2-tiles .l2-tile:text-is("${w}")`); await page.click('.l2-actions .l2-btn-go'); await page.waitForSelector('.l2-feedback.is-ok'); return go(page); }
  if (step.kind === 'type') { await page.fill('#l2-type-input', step.accept[0]); await page.click('.l2-input-row button[type=submit]'); await page.waitForSelector('.l2-feedback.is-ok'); return go(page); }
  throw new Error('paso sin prueba: ' + step.kind);
}

const browser = await chromium.launch({ channel: process.env.QA_CHANNEL || 'chrome', args: ['--autoplay-policy=document-user-activation-required'] });
try {
  // 1. Primera visita en computadora: el video se reproduce de verdad, en silencio, y el sonido no arranca solo
  let { page, context, problems, backend, media } = await open(browser);
  await page.waitForFunction(() => { const v = document.getElementById('nb-video'); return v.currentTime > 0.6 && v.videoWidth > 0; }, null, { timeout: 15000 });
  const v = await page.evaluate(() => { const x = document.getElementById('nb-video'); return { w: x.videoWidth, h: x.videoHeight, d: x.duration, muted: x.muted, paused: x.paused, src: x.currentSrc.split('/').pop(), audio: window.NB.audio.state().context }; });
  assert.deepEqual([v.w, v.h, v.muted, v.paused, v.src, v.audio], [1280, 720, true, false, 'corner_cup_intro.mp4', 'none']);
  assert(Math.abs(v.d - 10) < 0.2, 'dura 10 s');
  assert.equal(await page.isVisible('#nb-title'), false);
  if (shots) { await page.waitForFunction(() => document.getElementById('nb-video').currentTime > 5.4); await page.screenshot({ path: shots + '/a1_video.png' }); }
  ok('video reproducido', `${v.w}x${v.h}, ${v.d.toFixed(1)} s, en silencio, avanzando; sin contexto de audio antes del clic`);

  // 2. Omitir con teclado, portada y comienzo
  await page.keyboard.press('Escape');
  await page.waitForSelector('#nb-title:not([hidden])');
  assert.equal(await page.isDisabled('#nb-start'), true, 'sin nombre no empieza');
  assert.equal(await page.evaluate(() => document.getElementById('nb-video').paused), true, 'el video se detiene al omitir');
  await page.keyboard.type('José');
  if (shots) await page.screenshot({ path: shots + '/a2_portada.png' });
  await page.keyboard.press('Enter');
  await page.waitForSelector('.l2-episode');
  const st = await page.evaluate(() => window.NB.audio.state());
  assert.equal(st.context, 'running'); assert.equal(st.ambience, true);
  assert.equal(await page.isVisible('#nb-sound'), true);
  assert.equal(await page.isVisible('#nb-intro'), false);
  ok('omitir, portada y comienzo', 'Escape omite, Enter comienza; el sonido arranca con el clic; entra directo al episodio');
  const name = 'Jose';
  const content = await page.evaluate(() => window.LAB2_CONTENT.episodes[0]);

  // 3. Escena 1 con errores: escuchar primero, reacción del personaje, retrato
  await page.click('.l2-scene-card:nth-child(1) .l2-btn');
  await go(page);
  assert(await page.locator('.l2-say-hidden').count(), 'primero se escucha: el texto queda detrás de los subtítulos');
  await page.click('.l2-say-hidden .l2-link');
  assert((await page.textContent('.l2-say')).includes('Good morning! Welcome to The Corner Cup.'), 'los subtítulos siempre están disponibles');
  assert.equal(await page.locator('.l2-listen-slow').count(), 1, 'botón Más lento');
  assert(await page.locator('.nb-portrait').count(), 'retrato de Ms. Rivera');
  if (shots) await page.screenshot({ path: shots + '/a3_escena.png', fullPage: true });
  const vars = { drink: 'tea', pick: 'Tea, please.' };
  for (const step of content.scenes[0].steps.slice(1)) await playStep(page, step, name, vars, true);
  await page.waitForSelector('.l2-result');
  ok('escena 1', 'escucha con subtítulos a pedido, reacciones en inglés, expresión del retrato');

  // 4. Escena 2 y escena 3: la decisión de la bebida vuelve después, también tras recargar a medias
  await page.click('.l2-actions .l2-btn-go');
  for (const step of content.scenes[1].steps) await playStep(page, step, name, vars, true);
  await page.waitForSelector('.l2-result');
  await page.click('.l2-actions .l2-btn-go');
  const s3 = content.scenes[2].steps, pickAt = s3.findIndex(s => s.kind === 'pick');
  for (const step of s3.slice(0, pickAt + 1)) await playStep(page, step, name, vars, false);
  await page.reload({ waitUntil: 'load' });                                   // cierre y recuperación de la partida
  await page.waitForSelector('#nb-title:not([hidden])');
  assert.equal(await page.evaluate(() => document.getElementById('nb-video').getAttribute('src')), null, 'la introducción no se repite al volver');
  assert.equal(await page.inputValue('#nb-name'), 'Jose', 'recuerda el nombre');
  await page.click('#nb-start');
  await page.waitForSelector('.l2-episode');
  assert.equal((await page.textContent('.l2-scene-card:nth-child(3) .l2-btn')).trim(), 'Retomar');
  await page.click('.l2-scene-card:nth-child(3) .l2-btn');
  for (const step of s3.slice(pickAt + 1)) {
    if (step.say && step.say.includes('{drink}')) assert((await page.textContent('.l2-say')).includes("Here's your tea, Jose."), 'la bebida elegida vuelve en el diálogo');
    await playStep(page, step, name, vars, true);
  }
  ok('decisión con continuidad', 'elegir té cambia una línea posterior y sobrevive a recargar a media escena');

  // 5. Recuerdo final
  await page.waitForSelector('#nb-souvenir:not([hidden])');
  const sv = await page.textContent('#nb-souvenir');
  assert(sv.includes('Jose') && sv.includes('tea') && sv.includes('En preparación'));
  if (shots) await page.screenshot({ path: shots + '/a4_recuerdo.png' });
  await page.keyboard.press('Escape');
  assert.equal(await page.isVisible('#nb-souvenir'), false);
  await page.waitForSelector('.l2-result');
  ok('recuerdo', 'vaso con el nombre y la bebida; se cierra con Escape; sin prometer fecha');

  // 6. Controles de sonido independientes, con memoria; el ambiente baja cuando habla un personaje
  await page.click('#nb-sound button[data-k="voice"]');
  assert.equal(await page.getAttribute('#nb-sound button[data-k="voice"]', 'aria-pressed'), 'false');
  assert.equal(await page.evaluate(() => window.LAB2.voice.muted), true);
  assert.equal(await page.getAttribute('#nb-sound button[data-k="ambience"]', 'aria-pressed'), 'true', 'los otros no cambian');
  assert.equal(await page.evaluate(() => { window.LAB2.emit('voice-start', {}); const s = window.NB.audio.state(); window.LAB2.emit('voice-end', {}); return s.target; }), 0.18);
  await page.click('#nb-sound button[data-k="all"]');
  assert.deepEqual(await page.evaluate(() => window.NB.audio.get()), { voice: false, ambience: false, sfx: false });
  assert.equal(await page.evaluate(() => window.NB.audio.state().target), 0);
  await page.reload({ waitUntil: 'load' }); await page.click('#nb-start'); await page.waitForSelector('.l2-episode');
  assert.deepEqual(await page.evaluate(() => window.NB.audio.get()), { voice: false, ambience: false, sfx: false }, 'el silencio se recuerda');
  assert.equal(await page.evaluate(() => window.NB.audio.state().ambience), false, 'silenciado: el ambiente ni se crea');
  ok('sonido', 'voz, ambiente y efectos por separado; silenciar todo; se recuerda; el ambiente cede ante la voz');
  assert.deepEqual(problems, []); assert.deepEqual(backend, []);
  assert.deepEqual([...new Set(media)], ['corner_cup_intro.mp4'], 'solo se pidió el video una vez elegido');
  ok('aislamiento', 'cero errores de consola, cero llamadas a Apps Script, un solo archivo de video pedido');
  await context.close();

  // 7. Movimiento reducido: nada se reproduce solo y el video ni se descarga
  ({ page, context, media } = await open(browser, { reduced: true }));
  await page.waitForSelector('#nb-title:not([hidden])');
  assert.deepEqual(media, []);
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.nb-video')).backgroundColor !== ''), true);
  await start(page, 'Ana');
  await page.click('.l2-scene-card:nth-child(1) .l2-btn'); await go(page);
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.nb-eye')).animationName), 'none');
  ok('movimiento reducido', 'sin video automático ni descarga; retratos sin animación');
  await context.close();

  // 8. Celular: versión liviana del video, sin desplazamiento lateral
  ({ page, context, media, problems } = await open(browser, { width: 390, height: 780 }));
  await page.waitForFunction(() => document.getElementById('nb-video').currentTime > 0.3, null, { timeout: 15000 });
  assert.deepEqual([...new Set(media)], ['corner_cup_intro_480.mp4']);
  assert(await noSideScroll(page));
  await start(page, 'Ana'); assert(await noSideScroll(page));
  await page.click('.l2-scene-card:nth-child(1) .l2-btn'); await go(page); await page.click('.l2-say-hidden .l2-link');
  assert(await noSideScroll(page));
  const bar = await page.evaluate(() => { const r = document.getElementById('nb-sound').getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth; });
  assert(bar, 'la barra de sonido cabe');
  if (shots) await page.screenshot({ path: shots + '/a5_celular.png' });
  assert.deepEqual(problems, []);
  ok('celular 390 px', 'video de 480p (0,5 MB), sin desplazamiento lateral, barra de sonido dentro de pantalla');
  await context.close();

  // 9. Conexión lenta: se puede omitir y empezar sin esperar el video
  ({ page, context } = await open(browser, { route: p => p.route('**/*.mp4', async r => { await new Promise(x => setTimeout(x, 6000)); r.continue().catch(() => {}); }) }));
  const t0 = Date.now();
  await start(page, 'Ana');
  assert(Date.now() - t0 < 3000, 'empezar no espera al video');
  ok('conexión lenta', 'con el video demorado 6 s se entra al juego en ' + (Date.now() - t0) + ' ms');
  await context.close();

  // 10. El video falla: se sigue con la imagen y un aviso
  ({ page, context } = await open(browser, { route: p => p.route('**/*.mp4', r => r.abort()) }));
  await page.waitForSelector('#nb-title:not([hidden])');
  assert((await page.textContent('#nb-video-status')).includes('Seguís con la imagen'));
  await start(page, 'Ana');
  ok('video no disponible', 'aviso claro y la aventura sigue con la imagen de respaldo');

  // 11. Enlaces
  for (const href of await page.evaluate(() => [...document.querySelectorAll('.nb-top a')].map(a => a.href))) assert.equal((await page.request.get(href)).status(), 200, href);
  assert((await page.getAttribute('.nb-foot a', 'href')).includes('wa.me/50686860097'));
  for (const f of ['media/corner_cup_poster.jpg', 'media/corner_cup_intro.mp4', 'media/corner_cup_intro_480.mp4']) assert.equal((await page.request.get(BASE + f)).status(), 200, f);
  ok('enlaces y archivos', 'navegación, WhatsApp institucional y los tres archivos de medios responden');
  await context.close();
  console.log('\nE1 AVENTURA PASS ·', passed, 'grupos');
} finally { await browser.close(); }
