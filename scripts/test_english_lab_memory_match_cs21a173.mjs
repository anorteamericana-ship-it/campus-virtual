#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const runtimePath = path.join(root, 'src/english_lab_games/english_lab_runtime_cs21a173.js');
const enginePath = path.join(root, 'src/english_lab_games/memory_match_engine_cs21a173.jsx');
const cssPath = path.join(root, 'styles/english_lab_memory_match_cs21a173.css');
const schemaPath = path.join(root, 'schemas/english_lab_room_package_cs21a173.schema.json');

function fail(message) {
  console.error(`CS21A173 FAIL: ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`CS21A173 OK: ${message}`);
}

for (const file of [runtimePath, enginePath, cssPath, schemaPath]) {
  if (!fs.existsSync(file)) fail(`falta ${path.relative(root, file)}`);
  else ok(`existe ${path.relative(root, file)}`);
}

if (process.exitCode) process.exit(process.exitCode);

const runtimeSource = fs.readFileSync(runtimePath, 'utf8');
const engineSource = fs.readFileSync(enginePath, 'utf8');
const cssSource = fs.readFileSync(cssPath, 'utf8');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const forbiddenRuntime = [
  /\bfetch\s*\(/,
  /SpreadsheetApp/,
  /google\.script/,
  /APPS_SCRIPT_URL/,
  /ACADEMIA_PLAY_BANK/,
  /QUESTION_BANK/,
];
for (const pattern of forbiddenRuntime) {
  if (pattern.test(runtimeSource) || pattern.test(engineSource)) {
    fail(`el motor contiene integración o banco prohibido: ${pattern}`);
  }
}
if (!process.exitCode) ok('motor sin fetch, Sheets ni banco incrustado');

const pedagogicalSamples = [
  'Choose the best meaning',
  'greeting',
  'a way to say hello',
  'apple',
  'bicycle',
  'My name is Ana',
];
for (const sample of pedagogicalSamples) {
  if (runtimeSource.includes(sample) || engineSource.includes(sample)) {
    fail(`contenido pedagógico hardcodeado detectado: ${sample}`);
  }
}
if (!process.exitCode) ok('sin preguntas ni vocabulario incrustados');

const runtimeWindow = {};
vm.runInNewContext(runtimeSource, {
  window: runtimeWindow,
  Date,
  Math,
  Number,
  String,
  Object,
  Array,
  Set,
  Map,
  console,
});
const runtime = runtimeWindow.EnglishLabRuntimeCS21A173;
if (!runtime) fail('runtime no exportado');
else {
  const clock = runtime.createServerClock({server_now: 20000, received_at_ms: 15000});
  if (clock.now(16000) !== 21000) fail('reloj no aplica offset del servidor');
  else ok('reloj sincronizado por timestamp del servidor');

  const rules = runtime.normalizeRules({timer_seconds: 15, auto_start_delay: 5, reveal_seconds: 3});
  if (rules.roundDurationMs !== 15000 || rules.autoStartDelayMs !== 5000 || rules.revealDurationMs !== 3000) {
    fail('reglas de tiempo no normalizadas');
  } else ok('reglas por nivel/juego convertidas a milisegundos');

  const submission = runtime.buildSubmission({
    roomCode: 'LAB-2618', roundId: 'R1', playerId: 'QA-STU-001', answerValue: {first_card_id:'A',second_card_id:'B'}, timeMs: 2345,
  });
  if (submission.room_code !== 'LAB-2618' || submission.time_ms !== 2345 || submission.answer_type !== 'PAIR') {
    fail('submission compacto inválido');
  } else ok('submission compacto válido');
}

const requiredEngineTokens = [
  'MemoryMatchGameCS21A173',
  'validateMemoryMatchCardsCS21A173',
  'EnglishLabGameRegistryCS21A173',
  'aria-live="polite"',
  'role="grid"',
  'server',
  'onTimeout',
  'onSubmit',
];
for (const token of requiredEngineTokens) {
  if (!engineSource.includes(token)) fail(`falta contrato visual: ${token}`);
}
if (!process.exitCode) ok('contrato visual, accesibilidad y callbacks presentes');

if (!cssSource.includes('@media(max-width:620px)') || !cssSource.includes('prefers-reduced-motion')) {
  fail('CSS sin responsive o reducción de movimiento');
} else ok('CSS responsive y accesible');

if (schema?.properties?.room?.properties?.game_id?.const !== 'MEMORY_MATCH') {
  fail('schema no fija MEMORY_MATCH');
} else if (schema?.properties?.round?.properties?.cards?.maxItems > 24) {
  fail('schema permite paquetes demasiado grandes');
} else ok('schema compacto de sala válido');

if (engineSource.length > 30000) fail(`motor demasiado grande: ${engineSource.length} caracteres`);
else ok(`motor liviano: ${engineSource.length} caracteres`);

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A173 MEMORY MATCH: APTO');
