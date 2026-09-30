// QA juegos fase 1 · pruebas de interfaz de English LAB (Academia Play) con Playwright.
// Monta qa/juegos_fase1/harness.html con un servidor estático local y SIN backend (todo POST recibe 404 vacío;
// cualquier request a Apps Script se aborta y se cuenta). Genera capturas y un informe en qa-output/juegos_fase1.
//
// Uso:  node scripts/qa_juegos_fase1_ui.mjs
// Env:  QA_OUT=<carpeta>  QA_CHROME_CHANNEL=chrome (usar Chrome instalado)  QA_SOLO=capturas,mezcla,ordenar,pareo
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const OUT = path.resolve(ROOT, process.env.QA_OUT || 'qa-output/juegos_fase1');
const SHOTS = path.join(OUT, 'capturas');
const SOLO = new Set(String(process.env.QA_SOLO || 'capturas,mezcla,ordenar,pareo').split(',').map(s => s.trim()).filter(Boolean));
const ATTEMPTS = Number(process.env.QA_INTENTOS || 100);
fs.mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = {
  movil: { viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  escritorio: { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 },
};

const results = [];
const captures = [];
const audits = [];
let backendRequests = 0;

function check(area, name, ok, detail = '') {
  results.push({ area, name, ok: !!ok, detail: String(detail || '') });
  console.log(`${ok ? 'PASS' : 'FAIL'} [${area}] ${name}${detail ? ' · ' + detail : ''}`);
}

// ---------------------------------------------------------------- servidor estático sin backend
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jsx': 'text/plain; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

function startServer() {
  const server = http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') { req.resume(); res.writeHead(404); res.end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://qa.local').pathname);
    const file = path.resolve(ROOT, '.' + pathname);
    if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })));
}

// ---------------------------------------------------------------- utilidades de página
async function newPage(browser, vpName, extra = {}) {
  const context = await browser.newContext({ ...VIEWPORTS[vpName], ...extra });
  await context.route(/script\.google(usercontent)?\.com/, route => { backendRequests += 1; return route.abort(); });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.__errors = [];
  page.on('pageerror', err => page.__errors.push(String(err && err.message || err)));
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/Failed to load resource/i.test(text)) return;
    page.__errors.push(text);
  });
  return { context, page };
}

async function open(page, base, query) {
  await page.goto(`${base}/qa/juegos_fase1/harness.html?${query}`);
  await page.waitForFunction(() => window.__apQA && (window.__apQA.ready || window.__apQA.error));
  const err = await page.evaluate(() => window.__apQA.error);
  if (err) throw new Error(err);
}

async function settle(page) {
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
}

async function shot(page, name, note) {
  await settle(page);
  const file = path.join(SHOTS, name + '.jpg');
  await page.screenshot({ path: file, fullPage: true, type: 'jpeg', quality: 72, animations: 'disabled' });
  captures.push({ name: name + '.jpg', note: note || '' });
}

// Auditoría visual en la página: desbordes horizontales, textos recortados, objetivos táctiles y contraste.
async function audit(page, label, scope) {
  await settle(page);
  const data = await page.evaluate((scopeName) => {
    const vw = document.documentElement.clientWidth;
    const out = { vw, scrollWidth: document.documentElement.scrollWidth, overflow: [], clipped: [], small: [], contrast: [] };
    const hidden = el => !!el.closest('[aria-hidden="true"], .ap-live-region');
    const visible = el => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0;
    };
    const inScroller = el => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (/(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth + 1) return true;
      }
      return false;
    };
    const name = el => (el.getAttribute('aria-label') || el.textContent || String(el.className) || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 70);
    const shell = document.querySelector('.aplay-shell') || document.body;
    const scopeRoots = scopeName === 'juego'
      ? [...shell.querySelectorAll('.ap-practice-card, .ap-summary-card, .ap-next-splash-card, .ap-mode-tabs')]
      : [shell];

    // 1) nada fuera de la pantalla ni recortado
    shell.querySelectorAll('*').forEach(el => {
      if (hidden(el) || !visible(el)) return;
      const r = el.getBoundingClientRect();
      if ((r.right > vw + 1 || r.left < -1) && !inScroller(el)) out.overflow.push(`${name(el)} (${Math.round(r.left)}→${Math.round(r.right)})`);
      const s = getComputedStyle(el);
      const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      if (hasText && /(hidden|clip)/.test(s.overflowX) && el.scrollWidth > el.clientWidth + 1) out.clipped.push(`${name(el)} (${el.scrollWidth}>${el.clientWidth})`);
    });

    // 2) objetivos táctiles ≥ 44 px
    scopeRoots.forEach(root => root.querySelectorAll('button, a[href], [role="button"], input, select').forEach(el => {
      if (hidden(el) || !visible(el)) return;
      const r = el.getBoundingClientRect();
      if (r.height < 44 - 0.5 || r.width < 44 - 0.5) out.small.push(`${name(el)} (${Math.round(r.width)}×${Math.round(r.height)})`);
    }));

    // 3) contraste de texto (peor caso contra colores de fondo y degradados detrás)
    const parse = c => {
      const m = String(c).match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    };
    const over = (top, bottom) => ({ r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1 });
    const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    function backgrounds(el) {
      const layers = [];
      for (let p = el; p; p = p.parentElement) {
        const s = getComputedStyle(p);
        // ::before absoluto de un ancestro (velos, anillo del resumen): se pinta entre su fondo y sus hijos.
        // Solo si puede cubrir el texto (se ignoran trazos decorativos finos, como la línea de logros).
        const pb = p === el ? null : getComputedStyle(p, '::before');
        const own = el.getBoundingClientRect();
        const covers = pb && parseFloat(pb.height) >= own.height * 0.8 && parseFloat(pb.width) >= own.width * 0.5;
        if (covers && pb.content && pb.content !== 'none' && pb.content !== 'normal' && /absolute|fixed/.test(pb.position)) {
          const pc = [];
          const pbg = parse(pb.backgroundColor);
          if (/gradient/.test(pb.backgroundImage)) (pb.backgroundImage.match(/rgba?\([^)]+\)/g) || []).map(parse).filter(c => c && c.a > 0).forEach(c => pc.push(c));
          if (pbg && pbg.a > 0) pc.push(pbg);
          if (pc.length) layers.push(pc);
          if (pbg && pbg.a >= 1) break;
        }
        const colors = [];
        const bg = parse(s.backgroundColor);
        if (/gradient/.test(s.backgroundImage)) (s.backgroundImage.match(/rgba?\([^)]+\)/g) || []).map(parse).filter(c => c && c.a > 0).forEach(c => colors.push(c));
        if (bg && bg.a > 0) colors.push(bg);
        if (colors.length) layers.push(colors);
        if (bg && bg.a >= 1) break;
      }
      let candidates = [{ r: 255, g: 255, b: 255, a: 1 }];
      for (let i = layers.length - 1; i >= 0; i--) {
        const next = [];
        layers[i].forEach(c => candidates.forEach(base => next.push(over(c, base))));
        candidates = next.slice(0, 64);
      }
      return candidates;
    }
    scopeRoots.forEach(root => root.querySelectorAll('*').forEach(el => {
      if (hidden(el) || !visible(el)) return;
      const text = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
      if (!text) return;
      const s = getComputedStyle(el);
      let alpha = 1;
      for (let p = el; p; p = p.parentElement) alpha *= Number(getComputedStyle(p).opacity);
      const fg = parse(s.color);
      if (!fg) return;
      const size = parseFloat(s.fontSize);
      const bold = Number(s.fontWeight) >= 700;
      const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
      const worst = Math.min(...backgrounds(el).map(bg => ratio(over({ ...fg, a: fg.a * alpha }, bg), bg)));
      if (worst < need) out.contrast.push(`"${text.slice(0, 40)}" ${worst.toFixed(2)}:1 (mín ${need}) · ${String(el.className || el.tagName).slice(0, 40)}`);
    }));
    return out;
  }, scope);
  audits.push({ label, scope, ...data });
  check('visual', `${label} · sin scroll horizontal`, data.scrollWidth <= data.vw, `scrollWidth ${data.scrollWidth} / ancho ${data.vw}`);
  check('visual', `${label} · nada fuera de pantalla`, !data.overflow.length, data.overflow.slice(0, 4).join(' | '));
  check('visual', `${label} · sin textos recortados`, !data.clipped.length, data.clipped.slice(0, 4).join(' | '));
  check('visual', `${label} · toques ≥ 44 px`, !data.small.length, data.small.slice(0, 6).join(' | '));
  check('visual', `${label} · contraste AA`, !data.contrast.length, data.contrast.slice(0, 4).join(' | '));
  return data;
}

// Texto visible de cada opción (el último nodo del botón es el texto; el primero es la letra o el ícono).
async function optionTexts(page) {
  return page.evaluate(() => [...document.querySelectorAll('.ap-answer')].map(b => b.lastChild ? b.lastChild.textContent : ''));
}

async function backToCatalog(page) {
  const back = page.locator('.ap-practice-top .ap-btn-light, .ap-summary-card .ap-btn-ghost').first();
  await back.click();
  await page.waitForSelector('.ap-card-grid-catalog .ap-game-card');
}

async function openGameFromCatalog(page, title) {
  await page.locator('.ap-card-grid-catalog:not(.ap-bank-card-grid) .ap-game-card', { hasText: title }).first().click();
  await page.getByRole('button', { name: 'Empezar', exact: true }).click();
  await page.waitForSelector('.ap-choice-card, .ap-match-card, .ap-order-card');
}

async function answerChoice(page, flowQuestion, pickCorrect) {
  const texts = await optionTexts(page);
  const correctText = flowQuestion.options[flowQuestion.correct];
  let idx = texts.indexOf(correctText);
  if (!pickCorrect) idx = texts.findIndex(t => t !== correctText);
  await page.locator('.ap-answer').nth(idx).click();
  await page.getByRole('button', { name: 'Confirmar respuesta' }).click();
  await page.waitForSelector('.ap-feedback');
}

// ---------------------------------------------------------------- capturas y auditoría de cada juego
async function capturasJuegos(browser, base, vp) {
  const { context, page } = await newPage(browser, vp);
  await open(page, base, 'view=student');
  await page.waitForSelector('.ap-card-grid-catalog .ap-game-card');
  const games = await page.evaluate(() => Object.keys(window.AP_FLOWS).map(id => ({
    id, kind: window.AP_FLOWS[id].kind, title: (window.AP_GAMES.find(g => g.id === id) || {}).title, flow: window.AP_FLOWS[id],
  })));
  await shot(page, `${vp}_00_catalogo`, 'Catálogo English LAB');
  await audit(page, `${vp} · catálogo`, 'catalogo');

  let n = 1;
  const seen = { choice: false, match: false, order: false };
  for (const g of games) {
    const prefix = `${vp}_${String(n++).padStart(2, '0')}_${g.id}`;
    await openGameFromCatalog(page, g.title);
    await shot(page, prefix, `${g.title} · pregunta`);
    await audit(page, `${vp} · ${g.title}`, 'juego');

    if (g.kind === 'choice' && !seen.choice) {
      seen.choice = true;
      await answerChoice(page, g.flow.questions[0], true);
      await shot(page, `${prefix}_correcto`, `${g.title} · respuesta correcta`);
      await audit(page, `${vp} · ${g.title} correcto`, 'juego');
      await page.getByRole('button', { name: /Siguiente pregunta/ }).click();
      await answerChoice(page, g.flow.questions[1], false);
      await shot(page, `${prefix}_incorrecto`, `${g.title} · respuesta incorrecta`);
      await audit(page, `${vp} · ${g.title} incorrecto`, 'juego');
      for (let q = 2; q < g.flow.questions.length; q++) {
        await page.getByRole('button', { name: /Siguiente pregunta/ }).click();
        await answerChoice(page, g.flow.questions[q], true);
      }
      await page.getByRole('button', { name: /Siguiente pregunta/ }).click();
      await page.waitForSelector('.ap-summary-card');
      await shot(page, `${prefix}_resumen`, `${g.title} · resumen`);
      await audit(page, `${vp} · ${g.title} resumen`, 'juego');
    } else if (g.kind === 'match' && !seen.match) {
      seen.match = true;
      const pairs = g.flow.pairs;
      for (let i = 0; i < 3; i++) {
        await page.locator('.ap-match-col').first().locator('.ap-match-chip', { hasText: pairs[i].en }).click();
        await page.locator('.ap-match-col').last().locator('.ap-match-chip', { hasText: pairs[i].es }).click();
      }
      await shot(page, `${prefix}_lineas`, `${g.title} · 3 pares unidos`);
      await audit(page, `${vp} · ${g.title} con líneas`, 'juego');
      const alignment = await lineAlignment(page);
      check('pareo', `${vp} · ${g.title}: líneas sobre los botones reales`, alignment.ok, alignment.detail);
    } else if (g.kind === 'order' && !seen.order) {
      seen.order = true;
      const q0 = g.flow.questions[0];
      for (const w of q0.answer) await page.locator('.ap-word-bank .ap-word-token', { hasText: new RegExp('^' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).first().click();
      await page.getByRole('button', { name: 'Confirmar orden' }).click();
      await shot(page, `${prefix}_correcto`, `${g.title} · orden correcto`);
      await audit(page, `${vp} · ${g.title} correcto`, 'juego');
      await page.getByRole('button', { name: /Siguiente frase/ }).click();
      const q1 = g.flow.questions[1];
      for (let i = 0; i < q1.words.length; i++) await page.locator('.ap-word-bank .ap-word-token').first().click();
      await page.getByRole('button', { name: 'Confirmar orden' }).click();
      await shot(page, `${prefix}_incorrecto`, `${g.title} · orden incorrecto`);
      await audit(page, `${vp} · ${g.title} incorrecto`, 'juego');
    }
    await backToCatalog(page);
  }
  check('general', `${vp} · sin errores de consola/página`, !page.__errors.length, page.__errors.slice(0, 3).join(' | '));
  await context.close();

  // Juegos con ítems con forma de banco (mismo camino que APBankGameRunner tras cargar el juego).
  for (const fx of ['mcq', 'reading', 'match', 'order']) {
    const { context: c2, page: p2 } = await newPage(browser, vp);
    await open(p2, base, 'bank=' + fx);
    await p2.getByRole('button', { name: 'Empezar', exact: true }).click();
    await p2.waitForSelector('.ap-choice-card, .ap-match-card, .ap-order-card');
    await shot(p2, `${vp}_banco_${fx}`, `Banco (ficticio) · ${fx}`);
    await audit(p2, `${vp} · banco ${fx}`, 'juego');
    check('general', `${vp} · banco ${fx} sin errores de consola`, !p2.__errors.length, p2.__errors.slice(0, 3).join(' | '));
    await c2.close();
  }
}

// ---------------------------------------------------------------- mezcla de opciones
// Con movimiento reducido (preferencia real del sistema) no hay animaciones que esperar; la mezcla no depende de ellas.
async function pruebaMezcla(browser, base) {
  // A) Juego real Vocabulary Sprint: cada entrada desde el catálogo es un intento nuevo.
  {
    const { context, page } = await newPage(browser, 'escritorio', { reducedMotion: 'reduce' });
    await open(page, base, 'view=student');
    await page.waitForSelector('.ap-card-grid-catalog .ap-game-card');
    const info = await page.evaluate(() => ({ title: window.AP_GAMES.find(g => g.id === 'vocabulary').title, q: window.AP_FLOWS.vocabulary.questions[0] }));
    const correctText = info.q.options[info.q.correct];
    const positions = [0, 0, 0, 0];
    let unstable = 0; let wrongMark = 0; let lost = 0;
    for (let i = 0; i < ATTEMPTS; i++) {
      await openGameFromCatalog(page, info.title);
      const before = await optionTexts(page);
      const idx = before.indexOf(correctText);
      if (idx < 0 || [...before].sort().join('|') !== [...info.q.options].sort().join('|')) lost += 1;
      await page.locator('.ap-answer').nth((idx + 1) % 4).click();          // re-render por selección
      const afterSelect = await optionTexts(page);
      await page.getByRole('button', { name: 'Confirmar respuesta' }).click();
      await page.waitForSelector('.ap-feedback');
      const afterConfirm = await optionTexts(page);
      if (afterSelect.join('|') !== before.join('|') || afterConfirm.join('|') !== before.join('|')) unstable += 1;
      const marked = await page.evaluate(() => [...document.querySelectorAll('.ap-answer')].findIndex(b => b.classList.contains('correct')));
      if (marked !== idx) wrongMark += 1;
      if (idx >= 0) positions[idx] += 1;
      await backToCatalog(page);
    }
    const detail = `A:${positions[0]} B:${positions[1]} C:${positions[2]} D:${positions[3]} en ${ATTEMPTS} intentos`;
    check('mezcla', `Vocabulary Sprint (catálogo → juego): la correcta aparece en A, B, C y D`, positions.every(x => x > 0), detail);
    check('mezcla', 'Vocabulary Sprint: mismas 4 opciones y la correcta siempre presente', lost === 0, `${lost} intentos con opciones alteradas`);
    check('mezcla', 'Vocabulary Sprint: orden fijo dentro del intento (seleccionar/confirmar no re-mezcla)', unstable === 0, `${unstable} intentos inestables`);
    check('mezcla', 'Vocabulary Sprint: se marca como correcta la opción correcta tras mezclar', wrongMark === 0, `${wrongMark} marcas erróneas`);
    fs.writeFileSync(path.join(OUT, 'mezcla_vocabulary.json'), JSON.stringify({ attempts: ATTEMPTS, positions }, null, 2));
    await context.close();
  }

  // B) Banco (todas las correctas en A, como el banco real) con "Repetir juego": 5 preguntas × N intentos.
  {
    const { context, page } = await newPage(browser, 'escritorio', { reducedMotion: 'reduce' });
    await open(page, base, 'bank=mcq');
    const flow = await page.evaluate(() => { const fx = window.AP_QA_FIXTURES.bank.mcq; return window.apFlowFromBankGame(fx.game, fx.items); });
    const perQuestion = flow.questions.map(() => [0, 0, 0, 0]);
    let wrongMark = 0;
    for (let i = 0; i < ATTEMPTS; i++) {
      await page.getByRole('button', { name: 'Empezar', exact: true }).click();
      for (let q = 0; q < flow.questions.length; q++) {
        const texts = await optionTexts(page);
        const idx = texts.indexOf(flow.questions[q].options[flow.questions[q].correct]);
        await page.locator('.ap-answer').nth(idx).click();
        await page.getByRole('button', { name: 'Confirmar respuesta' }).click();
        const marked = await page.evaluate(() => [...document.querySelectorAll('.ap-answer')].findIndex(b => b.classList.contains('correct')));
        if (marked !== idx) wrongMark += 1;
        if (idx >= 0) perQuestion[q][idx] += 1;
        await page.getByRole('button', { name: /Siguiente pregunta/ }).click();
      }
      await page.getByRole('button', { name: 'Repetir juego' }).click();
    }
    const summary = perQuestion.map((p, q) => `P${q + 1} A:${p[0]} B:${p[1]} C:${p[2]} D:${p[3]}`).join(' · ');
    check('mezcla', `Banco (correctas en A) con "Repetir juego": cada pregunta aparece en las 4 posiciones`, perQuestion.every(p => p.every(x => x > 0)), summary);
    check('mezcla', 'Banco: 100% de aciertos al elegir la opción correcta mezclada', wrongMark === 0, `${wrongMark} marcas erróneas`);
    fs.writeFileSync(path.join(OUT, 'mezcla_banco.json'), JSON.stringify({ attempts: ATTEMPTS, perQuestion }, null, 2));
    check('general', 'mezcla · sin errores de consola', !page.__errors.length, page.__errors.slice(0, 3).join(' | '));
    await context.close();
  }
}

// ---------------------------------------------------------------- fichas de ordenar
// Banco con 4 frases (incluye fichas repetidas y una fuente ya ordenada), 20 intentos con "Repetir juego".
async function pruebaOrdenar(browser, base) {
  const ROUNDS = 20;
  const { context, page } = await newPage(browser, 'escritorio', { reducedMotion: 'reduce' });
  await open(page, base, 'bank=order');
  const flow = await page.evaluate(() => { const fx = window.AP_QA_FIXTURES.bank.order; return window.apFlowFromBankGame(fx.game, fx.items); });
  const bankTiles = () => page.evaluate(() => [...document.querySelectorAll('.ap-word-bank .ap-word-token')].map(b => b.textContent));
  const exact = w => new RegExp('^' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$');
  const orders = flow.questions.map(() => []);
  let shownSolved = 0; let unstable = 0; let notCorrect = 0;
  for (let round = 0; round < ROUNDS; round++) {
    await page.getByRole('button', { name: 'Empezar', exact: true }).click();
    for (let qi = 0; qi < flow.questions.length; qi++) {
      const q = flow.questions[qi];
      const before = await bankTiles();
      orders[qi].push(before.join(' '));
      if (before.join(' ') === q.answer.join(' ')) shownSolved += 1;
      // Re-render dentro del intento: agregar una ficha y limpiar no cambia el orden del banco.
      await page.locator('.ap-word-bank .ap-word-token').first().click();
      if ((await bankTiles()).join('|') !== before.slice(1).join('|')) unstable += 1;
      await page.getByRole('button', { name: 'Limpiar' }).click();
      if ((await bankTiles()).join('|') !== before.join('|')) unstable += 1;
      // Armar la respuesta; con fichas repetidas se toma la primera disponible.
      for (const w of q.answer) await page.locator('.ap-word-bank .ap-word-token', { hasText: exact(w) }).first().click();
      await page.getByRole('button', { name: 'Confirmar orden' }).click();
      if (!(await page.locator('.ap-feedback.correct').count())) notCorrect += 1;
      await page.getByRole('button', { name: /Siguiente frase/ }).click();
    }
    await page.waitForSelector('.ap-summary-card');
    await page.getByRole('button', { name: 'Repetir juego' }).click();
  }
  const changes = orders.map(list => list.slice(1).filter((o, i) => o !== list[i]).length);
  check('ordenar', `fichas nunca en el orden de la respuesta (${flow.questions.length} frases × ${ROUNDS} intentos)`, shownSolved === 0, `${shownSolved} veces resueltas`);
  check('ordenar', 'el orden no cambia dentro del intento (agregar ficha / limpiar)', unstable === 0, `${unstable} cambios`);
  check('ordenar', 'la respuesta se arma y marca correcta, también con fichas repetidas ("the … the")', notCorrect === 0, `${notCorrect} fallos`);
  check('ordenar', 'el orden cambia al repetir', changes.every(c => c >= Math.floor(0.75 * (ROUNDS - 1))),
    changes.map((c, i) => `F${i + 1}: cambió en ${c}/${ROUNDS - 1}`).join(' · '));
  check('general', 'ordenar · sin errores de consola', !page.__errors.length, page.__errors.slice(0, 3).join(' | '));
  fs.writeFileSync(path.join(OUT, 'ordenar_banco.json'), JSON.stringify({ rounds: ROUNDS, orders }, null, 2));
  await context.close();
}

// ---------------------------------------------------------------- pareo con palabras de 2 renglones
async function lineAlignment(page) {
  return page.evaluate(() => {
    const svg = document.querySelector('.ap-match-lines-svg');
    if (!svg) return { ok: false, detail: 'sin svg' };
    const box = svg.getBoundingClientRect();
    const fixed = [...document.querySelectorAll('.ap-match-col:first-of-type .ap-match-chip.fixed')];
    const paths = [...svg.querySelectorAll('path')];
    const problems = [];
    if (paths.length !== fixed.length) problems.push(`${paths.length} líneas para ${fixed.length} pares`);
    paths.forEach(p => {
      const id = p.getAttribute('data-pair-id');
      const nums = (p.getAttribute('d') || '').match(/-?\d+(\.\d+)?/g) || [];
      if (!id || nums.length < 8) { problems.push('línea sin id o sin coordenadas: ' + p.getAttribute('d')); return; }
      const [x1, y1] = [Number(nums[0]), Number(nums[1])];
      const [x2, y2] = [Number(nums[nums.length - 2]), Number(nums[nums.length - 1])];
      const l = document.querySelector(`.ap-match-chip[data-side="en"][data-pair-id="${CSS.escape(id)}"]`);
      const r = document.querySelector(`.ap-match-chip[data-side="es"][data-pair-id="${CSS.escape(id)}"]`);
      if (!l || !r) { problems.push('sin botones para ' + id); return; }
      const a = l.getBoundingClientRect(); const b = r.getBoundingClientRect();
      const exp = [a.right - box.left, a.top + a.height / 2 - box.top, b.left - box.left, b.top + b.height / 2 - box.top];
      const got = [x1, y1, x2, y2];
      const diff = Math.max(...exp.map((v, i) => Math.abs(v - got[i])));
      if (diff > 1.5) problems.push(`${id}: desvío ${diff.toFixed(1)}px`);
    });
    const par = svg.getAttribute('preserveAspectRatio');
    if (par === 'none') problems.push('preserveAspectRatio="none"');
    return { ok: !problems.length, detail: problems.slice(0, 4).join(' | ') || `${paths.length} líneas alineadas (±1.5px)` };
  });
}

async function lineCounts(page) {
  return page.evaluate(() => [...document.querySelectorAll('.ap-match-chip')].map(chip => {
    const range = document.createRange();
    range.selectNodeContents(chip);
    const tops = new Set([...range.getClientRects()].filter(r => r.width > 1).map(r => Math.round(r.top)));
    return { side: chip.getAttribute('data-side'), id: chip.getAttribute('data-pair-id'), lines: tops.size, height: Math.round(chip.getBoundingClientRect().height) };
  }));
}

async function pruebaPareo(browser, base) {
  for (const vp of ['movil', 'escritorio']) {
    const { context, page } = await newPage(browser, vp);
    await open(page, base, 'flow=matchLong');
    const pairs = await page.evaluate(() => window.AP_QA_FIXTURES.flows.matchLong.pairs);
    const orders = [];
    const rounds = vp === 'escritorio' ? 12 : 1;
    for (let round = 0; round < rounds; round++) {
      await page.getByRole('button', { name: 'Empezar', exact: true }).click();
      await page.waitForSelector('.ap-match-card');
      const order = await page.evaluate(() => ({
        en: [...document.querySelectorAll('.ap-match-chip[data-side="en"]')].map(b => b.getAttribute('data-pair-id')),
        es: [...document.querySelectorAll('.ap-match-chip[data-side="es"]')].map(b => b.getAttribute('data-pair-id')),
      }));
      orders.push(order);

      if (round === 0) {
        const counts = await lineCounts(page);
        const multi = counts.filter(c => c.lines >= 2);
        check('pareo', `${vp} · hay botones de 2+ renglones en ambas columnas`, multi.some(c => c.side === 'en') && multi.some(c => c.side === 'es'),
          counts.map(c => `${c.side}:${c.id}=${c.lines}r/${c.height}px`).join(' '));
        const svgInfo = await page.evaluate(() => { const s = document.querySelector('.ap-match-lines-svg'); return s ? { par: s.getAttribute('preserveAspectRatio'), vb: s.getAttribute('viewBox') } : null; });
        check('pareo', `${vp} · SVG sin preserveAspectRatio="none"`, svgInfo && svgInfo.par !== 'none', JSON.stringify(svgInfo));
        // par incorrecto primero: marca error y no dibuja línea
        const wrongRight = pairs.find(p => p.id !== order.en[0]).id;
        await page.locator(`.ap-match-chip[data-side="en"][data-pair-id="${order.en[0]}"]`).click();
        await page.locator(`.ap-match-chip[data-side="es"][data-pair-id="${wrongRight}"]`).click();
        const wrongShown = await page.evaluate(() => !!document.querySelector('.ap-match-chip.wrong'));
        check('pareo', `${vp} · par incorrecto se marca en rojo y no fija línea`, wrongShown && (await page.locator('.ap-match-lines-svg path').count()) === 0);
        await page.waitForTimeout(320);
        // unir todos menos el último y verificar cada vez
        let allAligned = true; let lastDetail = '';
        for (let i = 0; i < pairs.length - 1; i++) {
          const id = order.en[i];
          await page.locator(`.ap-match-chip[data-side="en"][data-pair-id="${id}"]`).click();
          await page.locator(`.ap-match-chip[data-side="es"][data-pair-id="${id}"]`).click();
          await settle(page);
          const a = await lineAlignment(page);
          if (!a.ok) { allAligned = false; lastDetail = a.detail; }
          else lastDetail = a.detail;
        }
        check('pareo', `${vp} · cada línea une el borde real de sus dos botones`, allAligned, lastDetail);
        await shot(page, `${vp}_pareo_2_renglones`, 'Pareo con textos de 2+ renglones, 5 de 6 pares unidos');
        await audit(page, `${vp} · pareo 2 renglones`, 'juego');

        // Redimensionar: ResizeObserver debe recalcular.
        const size = VIEWPORTS[vp].viewport;
        await page.setViewportSize({ width: vp === 'movil' ? 412 : 900, height: size.height });
        await page.waitForTimeout(120);
        const afterResize = await lineAlignment(page);
        check('pareo', `${vp} · tras redimensionar, las líneas siguen alineadas`, afterResize.ok, afterResize.detail);
        await page.setViewportSize(size);
        await page.waitForTimeout(120);
        // Scroll: la posición relativa se mantiene y se recalcula sin romperse.
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(120);
        const afterScroll = await lineAlignment(page);
        check('pareo', `${vp} · tras hacer scroll, las líneas siguen alineadas`, afterScroll.ok, afterScroll.detail);
        const stable = await page.evaluate(() => [...document.querySelectorAll('.ap-match-chip[data-side="en"]')].map(b => b.getAttribute('data-pair-id')));
        check('pareo', `${vp} · el orden de columnas no cambia dentro del intento`, stable.join('|') === order.en.join('|'));
        // último par → resumen
        const lastId = order.en[pairs.length - 1];
        await page.locator(`.ap-match-chip[data-side="en"][data-pair-id="${lastId}"]`).click();
        await page.locator(`.ap-match-chip[data-side="es"][data-pair-id="${lastId}"]`).click();
      } else {
        for (const id of order.en) {
          await page.locator(`.ap-match-chip[data-side="en"][data-pair-id="${id}"]`).click();
          await page.locator(`.ap-match-chip[data-side="es"][data-pair-id="${id}"]`).click();
        }
      }
      await page.waitForSelector('.ap-summary-card');
      if (round < rounds - 1) {
        await page.getByRole('button', { name: 'Repetir juego' }).click();
      }
    }
    if (vp === 'escritorio') {
      const source = pairs.map(p => p.id).join('|');
      const enOrders = new Set(orders.map(o => o.en.join('|')));
      const esOrders = new Set(orders.map(o => o.es.join('|')));
      check('pareo', 'columna de inglés mezclada entre intentos', enOrders.size > 1 && orders.some(o => o.en.join('|') !== source), `${enOrders.size} órdenes distintos en ${orders.length} intentos`);
      check('pareo', 'columna de español mezclada entre intentos', esOrders.size > 1, `${esOrders.size} órdenes distintos en ${orders.length} intentos`);
      check('pareo', 'nunca quedan todas las parejas alineadas fila a fila', orders.every(o => o.en.some((id, i) => o.es[i] !== id)));
    }
    check('general', `${vp} · pareo sin errores de consola`, !page.__errors.length, page.__errors.slice(0, 3).join(' | '));
    await context.close();
  }
}

// ---------------------------------------------------------------- informe
function writeReport(startedAt) {
  const failed = results.filter(r => !r.ok);
  const lines = [
    '# QA juegos fase 1 · interfaz English LAB',
    '',
    `- Fecha: ${new Date().toISOString()}`,
    `- Duración: ${Math.round((Date.now() - startedAt) / 1000)} s`,
    `- Evidencia: E1 sintética local (harness sin backend; requests a Apps Script bloqueadas: ${backendRequests})`,
    `- Resultado: ${results.length - failed.length}/${results.length} PASS`,
    '',
    '| Estado | Área | Chequeo | Detalle |',
    '|---|---|---|---|',
    ...results.map(r => `| ${r.ok ? 'PASS' : '**FAIL**'} | ${r.area} | ${r.name} | ${String(r.detail).replace(/\|/g, '/')} |`),
    '',
    '## Capturas',
    '',
    'En la carpeta de salida (`capturas/`); en CI, dentro del artifact `qa-juegos-fase1-<número de ejecución>`. No se versionan en el repo.',
    '',
    ...captures.map(c => `- \`capturas/${c.name}\` · ${c.note}`),
    '',
  ];
  fs.writeFileSync(path.join(OUT, 'informe.md'), lines.join('\n'));
  fs.writeFileSync(path.join(OUT, 'resultados.json'), JSON.stringify({ results, captures, audits, backendRequests }, null, 2));
  return failed.length;
}

(async function main() {
  const startedAt = Date.now();
  const { server, base } = await startServer();
  const browser = await chromium.launch({ channel: process.env.QA_CHROME_CHANNEL || undefined });
  try {
    if (SOLO.has('capturas')) for (const vp of Object.keys(VIEWPORTS)) await capturasJuegos(browser, base, vp);
    if (SOLO.has('mezcla')) await pruebaMezcla(browser, base);
    if (SOLO.has('ordenar')) await pruebaOrdenar(browser, base);
    if (SOLO.has('pareo')) await pruebaPareo(browser, base);
  } catch (err) {
    check('general', 'ejecución completa sin excepciones', false, String(err && err.stack || err).split('\n').slice(0, 3).join(' '));
  } finally {
    await browser.close();
    server.close();
  }
  check('general', 'ninguna llamada a Apps Script', backendRequests === 0, `${backendRequests} requests bloqueadas`);
  const failed = writeReport(startedAt);
  console.log(`\n${results.length - failed}/${results.length} PASS · informe: ${path.relative(ROOT, path.join(OUT, 'informe.md'))}`);
  process.exit(failed ? 1 : 0);
})();
