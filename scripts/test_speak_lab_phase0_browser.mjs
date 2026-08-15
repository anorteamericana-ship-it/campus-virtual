import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const root = process.cwd();
const port = 4174;
const origin = `http://127.0.0.1:${port}`;
const target = `${origin}/prototypes/speak_lab_phase0/index.html`;
const outputDir = path.join(root, 'qa-output', 'speak-lab-phase0');
fs.mkdirSync(outputDir, { recursive:true });

function assert(condition, message){
  if (!condition) throw new Error(message);
}

async function waitForServer(timeoutMs=15000){
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(target, { cache:'no-store' });
      if (response.ok) return;
    } catch (_) {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('El servidor local no respondió a tiempo.');
}

const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverLog = '';
server.stdout.on('data', chunk => { serverLog += String(chunk); });
server.stderr.on('data', chunk => { serverLog += String(chunk); });

let browser;
const evidence = {
  gate: 'SPEAK_LAB_PHASE0_BROWSER',
  target,
  viewport: { width:390, height:844 },
  checks: {},
  requests: [],
  consoleErrors: [],
};

try {
  await waitForServer();

  browser = await chromium.launch({
    headless:true,
    args:[
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });

  const context = await browser.newContext({
    viewport:{ width:390, height:844 },
    permissions:['microphone'],
  });
  const page = await context.newPage();

  page.on('request', request => {
    evidence.requests.push(request.url());
  });
  page.on('console', msg => {
    if (msg.type() === 'error') evidence.consoleErrors.push(msg.text());
  });
  page.on('pageerror', error => evidence.consoleErrors.push(String(error && error.message || error)));

  await page.goto(target, { waitUntil:'networkidle' });

  const phrase = (await page.locator('#phraseText').textContent() || '').trim();
  assert(phrase === "What's your name?", `Frase inicial inesperada: ${phrase}`);
  evidence.checks.initialPhrase = phrase;

  const counter = (await page.locator('#phraseCounter').textContent() || '').trim();
  assert(counter === '1 / 10', `Contador inesperado: ${counter}`);
  evidence.checks.counter = counter;

  const runtime = await page.evaluate(() => ({
    secureContext: window.isSecureContext,
    mediaDevices: !!navigator.mediaDevices,
    getUserMedia: !!navigator.mediaDevices?.getUserMedia,
    mediaRecorder: typeof window.MediaRecorder === 'function',
    speechSynthesis: !!window.speechSynthesis,
    listenDisabled: document.getElementById('listenBtn')?.disabled,
    recordDisabled: document.getElementById('recordBtn')?.disabled,
  }));
  assert(runtime.secureContext === true, 'localhost no fue tratado como secure context');
  assert(runtime.getUserMedia && runtime.mediaRecorder, 'Chromium no expuso MediaRecorder/getUserMedia');
  assert(runtime.recordDisabled === false, 'Record quedó deshabilitado con soporte disponible');
  evidence.checks.runtime = runtime;

  await page.locator('#recordBtn').click();
  await page.waitForFunction(() => document.getElementById('status')?.textContent?.includes('Grabando localmente'));
  assert(await page.locator('#stopBtn').isEnabled(), 'Stop no se habilitó durante la grabación');
  assert(await page.locator('#nextBtn').isDisabled(), 'Next debe bloquearse durante la grabación');
  assert(await page.locator('#previousBtn').isDisabled(), 'Previous debe bloquearse durante la grabación');
  evidence.checks.recordingStarted = true;

  await page.waitForTimeout(1200);
  await page.locator('#stopBtn').click();
  await page.waitForFunction(() => {
    const audio = document.getElementById('playback');
    const box = document.getElementById('playbackBox');
    return !!audio?.src?.startsWith('blob:') && box && !box.hidden;
  }, { timeout:10000 });

  const playback = await page.evaluate(() => ({
    src: document.getElementById('playback')?.src || '',
    boxHidden: document.getElementById('playbackBox')?.hidden,
    status: document.getElementById('status')?.textContent || '',
  }));
  assert(playback.src.startsWith('blob:'), 'Playback no recibió una URL blob local');
  assert(playback.boxHidden === false, 'Playback box quedó oculto');
  evidence.checks.playbackReady = true;

  await page.locator('#retryBtn').click();
  const retryState = await page.evaluate(() => ({
    playbackHidden: document.getElementById('playbackBox')?.hidden,
    playbackSrc: document.getElementById('playback')?.getAttribute('src') || '',
  }));
  assert(retryState.playbackHidden === true, 'Retry no ocultó el playback');
  assert(!retryState.playbackSrc, 'Retry no limpió el src del playback');
  evidence.checks.retryReset = true;

  await page.locator('#nextBtn').click();
  const second = (await page.locator('#phraseText').textContent() || '').trim();
  assert(second.length > 0 && second !== phrase, 'Next no cambió de frase');
  await page.locator('#previousBtn').click();
  const back = (await page.locator('#phraseText').textContent() || '').trim();
  assert(back === phrase, 'Previous no regresó a la frase inicial');
  evidence.checks.navigation = true;

  const mobile = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  assert(mobile.scrollWidth <= mobile.innerWidth + 1, `Overflow horizontal: ${mobile.scrollWidth} > ${mobile.innerWidth}`);
  assert(mobile.bodyScrollWidth <= mobile.innerWidth + 1, `Overflow body horizontal: ${mobile.bodyScrollWidth} > ${mobile.innerWidth}`);
  evidence.checks.mobile = mobile;

  const externalRequests = evidence.requests.filter(url => !url.startsWith(origin));
  assert(externalRequests.length === 0, `Se observaron requests externos: ${externalRequests.join(', ')}`);
  evidence.checks.externalRequests = 0;

  assert(evidence.consoleErrors.length === 0, `Errores de consola: ${evidence.consoleErrors.join(' | ')}`);

  await page.screenshot({
    path:path.join(outputDir, 'speak-lab-phase0-390x844.png'),
    fullPage:true,
  });

  evidence.result = 'PASS';
  fs.writeFileSync(path.join(outputDir, 'browser-result.json'), JSON.stringify(evidence, null, 2));
  fs.writeFileSync(path.join(outputDir, 'summary.md'), [
    '# SPEAK LAB Phase 0 · Browser QA',
    '',
    '- Resultado: **PASS**',
    '- Chromium headless: micrófono simulado + MediaRecorder: PASS',
    '- Grabación → blob local → playback: PASS',
    '- Retry: PASS',
    '- Navegación entre 10 frases: PASS',
    '- Viewport 390×844 sin overflow horizontal: PASS',
    '- Requests externos: 0',
    '- Errores de consola: 0',
  ].join('\n'));

  console.log('SPEAK_LAB_PHASE0_BROWSER_PASS');
  console.log(JSON.stringify(evidence.checks, null, 2));
  await context.close();
} catch (error) {
  evidence.result = 'FAIL';
  evidence.error = String(error && error.stack || error);
  fs.writeFileSync(path.join(outputDir, 'browser-result.json'), JSON.stringify(evidence, null, 2));
  console.error('SPEAK_LAB_PHASE0_BROWSER_FAIL');
  console.error(evidence.error);
  process.exitCode = 1;
} finally {
  if (browser) {
    try { await browser.close(); } catch (_) {}
  }
  try { server.kill('SIGTERM'); } catch (_) {}
  fs.writeFileSync(path.join(outputDir, 'server.log'), serverLog);
}
