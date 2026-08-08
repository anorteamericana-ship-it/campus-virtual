#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const backendPath = path.join(root, 'apps_script_patches/english_lab_memory_match_live_cs21a174.gs');
const adapterPath = path.join(root, 'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx');
const guardPath = path.join(root, 'src/english_lab_games/english_lab_live_sync_guard_cs21a177.js');

function fail(message) {
  console.error(`CS21A174 FAIL: ${message}`);
  process.exitCode = 1;
}
function ok(message) { console.log(`CS21A174 OK: ${message}`); }

for (const file of [backendPath, adapterPath, guardPath]) {
  if (!fs.existsSync(file)) fail(`falta ${path.relative(root, file)}`);
  else ok(`existe ${path.relative(root, file)}`);
}
if (process.exitCode) process.exit(process.exitCode);

const backend = fs.readFileSync(backendPath, 'utf8');
const adapter = fs.readFileSync(adapterPath, 'utf8');
const guard = fs.readFileSync(guardPath, 'utf8');

const pedagogicalSamples = [
  'apple', 'bicycle', 'notebook', 'phone number',
  'manzana', 'bicicleta', 'cuaderno', 'profesor/a', 'número de teléfono'
];
for (const [label, source] of [['backend', backend], ['adapter', adapter], ['guard', guard]]) {
  for (const sample of pedagogicalSamples) {
    if (source.toLowerCase().includes(sample.toLowerCase())) fail(`${label} contiene contenido pedagógico hardcodeado: ${sample}`);
  }
  if (/AKfycb|script\.google\.com\/macros/i.test(source)) fail(`${label} contiene deployment de Apps Script.`);
}
if (!process.exitCode) ok('sin vocabulario ni URL de deployment incrustados');

const requiredBackend = [
  'ENGLISH_LAB_GAME_DB_ID',
  "_elmm174Rows_('QUESTION_BANK')",
  "_elmm174Rows_('ROUND_RULES')",
  'englishLabMemoryMatchCreateRoom',
  'englishLabMemoryMatchStartRoom',
  'englishLabMemoryMatchGetPlayerState',
  'englishLabMemoryMatchSubmitPair',
  'englishLabMemoryMatchGetRoomControl',
  'englishLabMemoryMatchCloseRound',
  'MEMORY_MATCH_PAIR_SUBMITTED',
  'return _elmm174DoPostBase_(e)',
];
for (const token of requiredBackend) {
  if (!backend.includes(token)) fail(`backend sin contrato: ${token}`);
}
if (!process.exitCode) ok('contrato backend y delegación doPost presentes');

// Este archivo nació en CS21A174/177, pero hoy es una superficie acumulada.
// Validamos capacidades estables, no números de versión ni cadencias históricas.
const requiredAdapter = [
  'EnglishLabMemoryMatchLiveCS21A174',
  'MemoryMatchLiveRoundCS21A174',
  'englishLabMemoryMatchCreateRoom',
  'englishLabMemoryMatchStartRoom',
  'englishLabMemoryMatchGetPlayerState',
  'englishLabMemoryMatchSubmitPair',
  'englishLabMemoryMatchGetRoomControl',
  'packageFromLiveState',
  'mergeLiveState',
  'MemoryMatchGameCS21A173',
  "const GAME_ID = 'MEMORY_MATCH'",
  "const GAME_LABEL = 'MEMORY MATCH'",
  'english_lab_memory_match_cs21a173.css',
  'ensureStyles',
  'global.EnglishLabMemoryMatchLiveCS21A174 = api',
  'EnglishLabTurnEngineCS21A176',
  'english_lab_turn_engine_cs21a176.js?v=CS21A176',
  'english_lab_live_sync_guard_cs21a177.js',
  'EnglishLabLiveSyncCS21A177',
  'ensureSyncGuard',
  'ENDPOINTS.getRoomControl',
  'ENDPOINTS.getPlayerState',
  'pollingRef.current',
  'global.document.visibilityState',
  'setLiveState(current => mergeLiveState(current, result, room, player))',
];
for (const token of requiredAdapter) {
  if (!adapter.includes(token)) fail(`adapter sin contrato acumulado: ${token}`);
}

const versionMatch = adapter.match(/const VERSION = '(CS21A\d+)'/);
if (!versionMatch) fail('adapter no declara una versión CS21A reconocible');
else ok(`adaptador acumulado detectado: ${versionMatch[1]}`);

if (/\bfetch\s*\(|global\.fetch\s*=|SpreadsheetApp|PropertiesService|ENGLISH_LAB_GAME_DB/i.test(adapter)) {
  fail('el adaptador mezcla transporte directo o conoce Sheets/configuración.');
} else ok('adaptador sin transporte directo, Sheets ni ID de base');

const detectionContract = /function isMemoryMatchRoom\(room\)[\s\S]*roomGameId\(room\) === GAME_ID[\s\S]*roomGameLabel\(room\) === GAME_LABEL/;
if (!detectionContract.test(adapter) || !adapter.includes('room.memory_match === true')) {
  fail('detección Memory Match no acepta bandera, código y etiqueta normalizada');
} else if (/GAME_ID\s*=\s*'VOCAB_SPRINT'/.test(adapter)) {
  fail('adapter captura juegos existentes');
} else ok('adapter reconoce respuestas históricas sin capturar otros juegos');

const requiredGuard = [
  "endpoint.indexOf('englishLab') !== 0",
  'return originalFetch(input, init)',
  'englishLabLiveJoinRoom',
  'englishLabMemoryMatchGetPlayerState',
  'READ_ENDPOINTS',
  'inFlightReads',
  'join_upgrade:true',
  'global.EnglishLabLiveSyncCS21A177 = api',
];
for (const token of requiredGuard) {
  if (!guard.includes(token)) fail(`guard CS21A177 sin contrato: ${token}`);
}
if (/SpreadsheetApp|PropertiesService|ENGLISH_LAB_GAME_DB/i.test(guard)) {
  fail('guard frontend conoce Sheets/configuración.');
} else ok('guard limitado a transporte English LAB');

if (!/createElement\('link'\)[\s\S]*rel\s*=\s*'stylesheet'[\s\S]*appendChild/.test(adapter)) {
  fail('el adaptador no instala la hoja visual de forma diferida');
} else ok('estilos visuales cargados únicamente con el adaptador Live');

// Desde CS21A188 el polling también cubre estudiantes para convergencia del tablero.
// Debe seguir siendo silencioso, adaptativo, sin solapamiento y con endpoint por rol.
const adaptivePolling =
  adapter.includes('function livePollMsForPlayers(count)') &&
  adapter.includes('const POLL_TIERS = Object.freeze([') &&
  adapter.includes('const endpoint = readOnly ? ENDPOINTS.getRoomControl : ENDPOINTS.getPlayerState;') &&
  adapter.includes('if (disposed || pollingRef.current) return;') &&
  adapter.includes("global.document.visibilityState === 'hidden'") &&
  adapter.includes('global.setInterval(poll, pollMs)');
if (!adaptivePolling) fail('polling acumulado no conserva adaptación, pausa oculta, endpoint por rol y exclusión de solapamiento');
else ok('polling silencioso acumulado válido para estudiante y docente');

const backendContext = {
  console,
  JSON,
  Date,
  Math,
  Number,
  String,
  Object,
  Array,
  Error,
  doPost: () => ({legacy:true}),
  _an4406_parseBody_: () => ({}),
  _an4406_json_: value => value,
};
vm.createContext(backendContext);
try {
  new vm.Script(backend, { filename:'english_lab_memory_match_live_cs21a174.gs' }).runInContext(backendContext);
  ok('Apps Script compila con router base aislado');
} catch (error) {
  fail(`Apps Script no compila: ${error.message}`);
}

if (typeof backendContext._elmm174Hash_ !== 'function' || typeof backendContext._elmm174Shuffle_ !== 'function') {
  fail('helpers deterministas no exportados al contexto Apps Script');
} else {
  const first = backendContext._elmm174Shuffle_([1,2,3,4,5,6], 'LAB-174');
  const second = backendContext._elmm174Shuffle_([1,2,3,4,5,6], 'LAB-174');
  if (JSON.stringify(first) !== JSON.stringify(second)) fail('shuffle no es determinista por sala');
  else ok('selección y orden deterministas por código de sala');
}

try {
  const delegated = backendContext.doPost({ parameter:{fn:'legacyEndpoint'} });
  if (!delegated || delegated.legacy !== true) fail('router CS21A174 no delega endpoints anteriores');
  else ok('router nuevo preserva endpoints anteriores');
} catch (error) {
  fail(`router delegado lanzó error: ${error.message}`);
}

if ((backend.match(/ELMM174_QA_DB_ID/g) || []).length > 3) fail('el ID QA se usa fuera de configuración/instalación');
else ok('ID QA limitado a configuración del instalador');

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A174+ MEMORY MATCH LIVE ACCUMULATED CONTRACT: APTO');
