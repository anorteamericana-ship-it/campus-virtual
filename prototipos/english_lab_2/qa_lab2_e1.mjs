// English Lab 2.0 · prueba E1 (sintética local) del prototipo.
// Carga la página real servida desde el repo, sin sesión, sin backend y sin sustituir código.
// Uso:  python3 -m http.server 4173   (desde la raíz del repo)
//       node prototipos/english_lab_2/qa_lab2_e1.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

const URL = (process.env.QA_BASE_URL || 'http://127.0.0.1:4173') + '/prototipos/english_lab_2/index.html';
const shots = process.env.QA_SHOTS || '';
const results = [];
const ok = (name, detail = '') => { results.push(name); console.log('PASS', name, detail); };

async function newPage(browser, { width = 1280, height = 900, noVoice = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const problems = [];
  const external = [];
  page.on('console', m => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', e => problems.push(String(e)));
  page.on('request', r => { const u = r.url(); if (/script\.google|googleusercontent/.test(u)) external.push(u); });
  if (noVoice) await page.addInitScript(() => { try { delete window.speechSynthesis; Object.defineProperty(window, 'speechSynthesis', { value: undefined }); } catch (_) {} });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForSelector('.l2-home');
  return { context, page, problems, external };
}
const noSideScroll = page => page.evaluate(() => document.scrollingElement.scrollWidth <= window.innerWidth + 1);
const sceneData = (page, id) => page.evaluate(sid => {
  const ep = window.LAB2_CONTENT.episodes[0];
  return ep.scenes.find(s => s.id === sid);
}, id);
const go = page => page.click('.l2-step .l2-btn-go:not([disabled])');

// Juega un paso. mistakes=true comete un error antes de acertar donde se puede.
async function playStep(page, step, name, mistakes) {
  await page.waitForSelector('.l2-step');
  if (step.kind === 'line') return go(page);
  if (step.kind === 'choice') {
    const right = step.options.find(o => o.ok).t.replaceAll('{name}', name);
    if (mistakes) {
      const wrong = step.options.find(o => !o.ok);
      await page.click(`.l2-option:text-is("${wrong.t.replaceAll('{name}', name)}")`);
      const fb = await page.textContent('.l2-feedback.is-no');
      assert(fb.includes(wrong.why_es), 'el error muestra la explicación específica de esa opción');
    }
    await page.click(`.l2-option:text-is("${right}")`);
    await page.waitForSelector('.l2-feedback.is-ok');
    return go(page);
  }
  if (step.kind === 'spell') {
    const word = step.own ? name.toUpperCase() : step.word;
    if (mistakes && !step.own) {
      const bad = word.replace('E', 'I');
      await page.fill('#l2-spell-input', bad === word ? word.slice(0, -1) : bad);
      await page.click('.l2-input-row button[type=submit]');
      await page.waitForSelector('.l2-feedback.is-no');
      await page.waitForSelector('.l2-marks .is-no');
    }
    await page.fill('#l2-spell-input', word.toLowerCase());
    await page.click('.l2-input-row button[type=submit]');
    await page.waitForSelector('.l2-feedback.is-ok');
    return go(page);
  }
  if (step.kind === 'build') {
    const answer = step.answer.map(w => w.replaceAll('{name}', name));
    if (mistakes) {
      await page.click(`.l2-tiles .l2-tile:text-is("${step.extra[0]}")`);
      await page.click('.l2-actions .l2-btn-go');
      const fb = await page.textContent('.l2-feedback.is-no');
      assert(fb.includes('sobra'), 'el error dice qué palabra sobra');
      await page.click('.l2-actions .l2-btn-quiet');
    }
    for (const w of answer) await page.click(`.l2-tiles .l2-tile:text-is("${w}")`);
    await page.click('.l2-actions .l2-btn-go');
    await page.waitForSelector('.l2-feedback.is-ok');
    return go(page);
  }
  if (step.kind === 'type') {
    if (mistakes) {
      await page.fill('#l2-type-input', 'please');
      await page.click('.l2-input-row button[type=submit]');
      await page.waitForSelector('.l2-feedback.is-no');
    }
    await page.fill('#l2-type-input', "  You're WELCOME!  ".replace("You're WELCOME", step.accept[0]));
    await page.click('.l2-input-row button[type=submit]');
    await page.waitForSelector('.l2-feedback.is-ok');
    return go(page);
  }
  if (step.kind === 'say') return page.click('.l2-actions .l2-btn-go');
  throw new Error('tipo de paso sin prueba: ' + step.kind);
}

const browser = await chromium.launch({ channel: process.env.QA_CHANNEL || 'chrome' });
try {
  // 1. Carga, nombre y entrada
  let { page, problems, external, context } = await newPage(browser);
  assert.equal(await page.isDisabled('.l2-stop.is-open .l2-btn-go'), true, 'sin nombre no se entra');
  await page.fill('#l2-name', 'José María');
  await page.click('.l2-pass-form button[type=submit]');
  assert.equal((await page.textContent('.l2-pass-name')).trim(), 'Jose');
  ok('entrada', 'nombre normalizado a Jose');
  const name = 'Jose';
  if (shots) await page.screenshot({ path: shots + '/01_inicio.png', fullPage: true });
  await page.click('.l2-stop.is-open .l2-btn-go');
  await page.waitForSelector('.l2-episode');
  assert.equal(await page.locator('.l2-scene-card').count(), 4);
  assert((await page.textContent('.l2-status')).includes('BORRADOR IA'));
  ok('episodio', '4 escenas, estado BORRADOR IA visible');
  if (shots) await page.screenshot({ path: shots + '/02_episodio.png', fullPage: true });

  // 2. Escena 1 con errores: retroalimentación, resultado y repaso
  const s1 = await sceneData(page, 'B1-U01-S1');
  await page.click('.l2-scene-card:nth-child(1) .l2-btn');
  let first = true;
  for (const step of s1.steps) {
    if (shots && step.kind === 'choice' && first) { await page.screenshot({ path: shots + '/03_escena.png', fullPage: true }); first = false; }
    await playStep(page, step, name, true);
  }
  await page.waitForSelector('.l2-result');
  const facts = await page.locator('.l2-facts dd').allTextContents();
  assert.equal(facts[0].trim(), '0 de 5', 'con un error en cada una, cero a la primera');
  assert.equal(await page.locator('.l2-review li').count(), 5, 'el repaso lista las cinco');
  ok('escena 1 con errores', 'resultado ' + facts.join(' | '));
  if (shots) await page.screenshot({ path: shots + '/04_resultado.png', fullPage: true });

  // 3. Repetir sin errores: mejora el mejor resultado y sube el intento
  await page.click('.l2-actions .l2-btn:text-is("Repetir esta escena")');
  for (const step of s1.steps) await playStep(page, step, name, false);
  await page.waitForSelector('.l2-result');
  const facts2 = await page.locator('.l2-facts dd').allTextContents();
  assert.deepEqual(facts2.map(x => x.trim()), ['5 de 5', '2', '5 de 5']);
  assert(await page.locator('.l2-stamp.is-gold').count(), 'sello dorado');
  ok('repetir', 'intentos=2, mejor=5 de 5, sello dorado');

  // 4. Escena 2: salir a medias, recargar la página y retomar
  await page.click('.l2-actions .l2-btn-go');
  const s2 = await sceneData(page, 'B1-U01-S2');
  await playStep(page, s2.steps[0], name, false);
  await playStep(page, s2.steps[1], name, true);
  await page.click('.l2-scene-bar .l2-back');
  assert((await page.textContent('.l2-scene-card:nth-child(2) .l2-stop-meta')).includes('En curso · vas por el paso 3 de 6'));
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('.l2-home');
  assert.equal((await page.textContent('.l2-pass-name')).trim(), 'Jose', 'el nombre sobrevive a recargar');
  await page.click('.l2-stop.is-open .l2-btn-go');
  assert.equal((await page.textContent('.l2-scene-card:nth-child(2) .l2-btn')).trim(), 'Retomar');
  await page.click('.l2-scene-card:nth-child(2) .l2-btn');
  assert((await page.getAttribute('.l2-progress', 'aria-label')).startsWith('Paso 3 de 6'));
  for (const step of s2.steps.slice(2)) await playStep(page, step, name, false);
  await page.waitForSelector('.l2-result');
  assert.equal((await page.locator('.l2-facts dd').first().textContent()).trim(), '4 de 5', 'el error previo a salir se conserva al retomar');
  ok('interrumpir, recargar y retomar', 'retoma en el paso 3 y conserva el error anterior');

  // 5. Escenas 3 y 4 completas
  for (const id of ['B1-U01-S3', 'B1-U01-S4']) {
    await page.click('.l2-actions .l2-btn-go');
    const sc = await sceneData(page, id);
    for (const step of sc.steps) await playStep(page, step, name, id.endsWith('S3'));
    await page.waitForSelector('.l2-result');
  }
  assert.equal(await page.locator('.l2-actions .l2-btn-go').count(), 0, 'la última escena no ofrece siguiente');
  await page.click('.l2-actions .l2-btn:text-is("Volver al episodio")');
  assert.equal(await page.locator('.l2-scene-card.is-done').count(), 4);
  await page.click('.l2-episode > .l2-back');
  assert((await page.locator('.l2-pass-name').nth(1).textContent()).includes('4 de 4'));
  ok('episodio completo', '4 de 4 sellos');
  assert.deepEqual(problems, [], 'sin errores de consola');
  assert.deepEqual(external, [], 'sin llamadas a Apps Script');
  ok('aislamiento', 'cero errores de consola, cero llamadas al backend');
  await context.close();

  // 6. La respuesta correcta no queda fija en una posición
  ({ page, context } = await newPage(browser));
  const spread = await page.evaluate(() => {
    const seen = new Set();
    for (let i = 0; i < 60; i++) seen.add(window.LAB2.shuffle([0, 1, 2]).indexOf(0));
    return [...seen].sort();
  });
  assert.deepEqual(spread, [0, 1, 2]);
  ok('opciones barajadas', 'la correcta aparece en las tres posiciones');
  await context.close();

  // 7. Teléfono, sin voz y solo teclado
  ({ page, problems, context } = await newPage(browser, { width: 375, height: 700, noVoice: true }));
  await page.fill('#l2-name', 'Ana');
  await page.keyboard.press('Enter');
  assert(await noSideScroll(page), 'inicio sin desplazamiento lateral');
  await page.click('.l2-stop.is-open .l2-btn-go');
  assert(await noSideScroll(page), 'episodio sin desplazamiento lateral');
  await page.click('.l2-scene-card:nth-child(2) .l2-btn');
  await page.keyboard.press('Enter');                       // Continuar tiene el foco
  await page.waitForSelector('.l2-sounds');
  assert.equal(await page.locator('.l2-sounds li').count(), 5, 'sin voz, las pistas de sonido salen solas');
  assert.equal(await page.locator('.l2-listen').count(), 0, 'sin voz no se ofrece un botón que no sirve');
  assert(await noSideScroll(page), 'escena sin desplazamiento lateral');
  if (shots) await page.screenshot({ path: shots + '/05_telefono_sin_voz.png', fullPage: true });
  await page.focus('#l2-spell-input');
  await page.keyboard.type('reyes');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.l2-feedback.is-ok');
  await page.keyboard.press('Enter');
  assert((await page.getAttribute('.l2-progress', 'aria-label')).startsWith('Paso 3'));
  ok('teléfono, sin voz, teclado', '375 px sin desplazamiento lateral; pistas visibles; paso resuelto solo con teclado');
  assert.deepEqual(problems, []);
  await context.close();

  console.log('\nE1 PASS ·', results.length, 'grupos');
} finally {
  await browser.close();
}
