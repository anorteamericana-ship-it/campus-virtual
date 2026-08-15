import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const dir = path.join(root, 'prototypes', 'speak_lab_phase0');
const files = {
  html: path.join(dir, 'index.html'),
  css: path.join(dir, 'styles.css'),
  app: path.join(dir, 'app.js'),
  phrases: path.join(dir, 'phrases.js'),
  readme: path.join(dir, 'README.md'),
  launcher: path.join(dir, 'ABRIR_SPEAK_LAB_PHASE0.cmd'),
  browser: path.join(root, 'scripts', 'test_speak_lab_phase0_browser.mjs'),
  plan: path.join(root, '00_DOCUMENTACION', 'PLAN_MAESTRO_SPEAK_LAB_2026-08-14.md'),
};

function fail(message){
  console.error(`SPEAK_LAB_PHASE0_FAIL: ${message}`);
  process.exitCode = 1;
}

for (const [name, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) fail(`falta ${name}: ${path.relative(root, file)}`);
}
if (process.exitCode) process.exit(process.exitCode);

const html = fs.readFileSync(files.html, 'utf8');
const css = fs.readFileSync(files.css, 'utf8');
const app = fs.readFileSync(files.app, 'utf8');
const phrases = fs.readFileSync(files.phrases, 'utf8');
const readme = fs.readFileSync(files.readme, 'utf8');
const launcher = fs.readFileSync(files.launcher, 'utf8');
const plan = fs.readFileSync(files.plan, 'utf8');

for (const file of [files.app, files.phrases, files.browser]) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding:'utf8' });
  if (result.status !== 0) fail(`sintaxis JS inválida en ${path.relative(root, file)}: ${result.stderr || result.stdout}`);
}

const phraseIds = [...phrases.matchAll(/id:'(SL\d{2})'/g)].map(match => match[1]);
if (phraseIds.length !== 10) fail(`se esperaban 10 frases y se encontraron ${phraseIds.length}`);
if (new Set(phraseIds).size !== phraseIds.length) fail('hay IDs de frases duplicados');
if (!phrases.includes("What's your name?")) fail('falta la frase inicial canónica');

const requiredDomIds = [
  'phraseId','phraseLevel','phraseFocus','phraseText','phraseHint','phraseCounter',
  'status','support','listenBtn','recordBtn','stopBtn','retryBtn','previousBtn',
  'nextBtn','recordingBox','recordingTime','playbackBox','playback','privacyNote'
];
for (const id of requiredDomIds) {
  if (!html.includes(`id="${id}"`)) fail(`falta DOM id ${id}`);
}

for (const token of ['getUserMedia','MediaRecorder','speechSynthesis','URL.createObjectURL']) {
  if (!app.includes(token)) fail(`app.js no contiene ${token}`);
}

const forbidden = [
  /\bfetch\s*\(/,
  /XMLHttpRequest/,
  /WebSocket/,
  /SpeechRecognition/,
  /webkitSpeechRecognition/,
  /APPS_SCRIPT_URL/,
  /openai/i,
];
for (const pattern of forbidden) {
  if (pattern.test(app)) fail(`app.js contiene patrón prohibido en Fase 0: ${pattern}`);
}

if (/https?:\/\//i.test(html)) fail('index.html contiene recursos HTTP externos; Fase 0 debe ser autocontenida');
if (!css.includes('@media(max-width:420px)')) fail('falta gate responsive de 420 px');
if (!css.includes('@media(max-width:780px)')) fail('falta gate responsive de 780 px');
if (!readme.includes('No usa `SpeechRecognition`')) fail('README no documenta exclusión de SpeechRecognition');
if (!launcher.includes('127.0.0.1')) fail('launcher Windows no está fijado a localhost');
if (!launcher.includes('http.server')) fail('launcher Windows no levanta servidor estático local');
if (/script\.google\.com|openai\.com|api\./i.test(launcher)) fail('launcher Windows contiene un destino externo no permitido');
if (!plan.includes('M50 | AI Exercise Generator')) fail('plan maestro no contiene el backlog M01–M50 completo');
if (!plan.includes('Una transcripción correcta NO demuestra pronunciación correcta')) fail('plan maestro perdió la regla académica principal');

if (!process.exitCode) {
  console.log('SPEAK_LAB_PHASE0_PASS');
  console.log(`frases=${phraseIds.length}`);
  console.log('audio_network_requests=0 (static guard)');
  console.log('speech_recognition=forbidden_phase0');
  console.log('windows_launcher=localhost_only');
}
