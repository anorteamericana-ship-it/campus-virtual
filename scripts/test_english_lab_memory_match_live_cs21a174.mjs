#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const backendPath = path.join(root, 'apps_script_patches/english_lab_memory_match_live_cs21a174.gs');
const adapterPath = path.join(root, 'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx');

function fail(message) {
  console.error(`CS21A174 FAIL: ${message}`);
  process.exitCode = 1;
}
function ok(message) { console.log(`CS21A174 OK: ${message}`); }

for (const file of [backendPath, adapterPath]) {
  if (!fs.existsSync(file)) fail(`falta ${path.relative(root, file)}`);
  else ok(`existe ${path.relative(root, file)}`);
}
if (process.exitCode) process.exit(process.exitCode);

const backend = fs.readFileSync(backendPath, 'utf8');
const adapter = fs.readFileSync(adapterPath, 'utf8');

for (const [label, source] of [['backend', backend], ['adapter', adapter]]) {
  for (const sample of ['apple', 'bicycle', 'teacher', 'student', 'notebook', 'phone number', 'manzana', 'bicicleta', 'cuaderno']) {
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

const requiredAdapter = [
  'EnglishLabMemoryMatchLiveCS21A174',
  'MemoryMatchLiveRoundCS21A174',
  'englishLabMemoryMatchCreateRoom',
  'englishLabMemoryMatchStartRoom',
  'englishLabMemoryMatchGetPlayerState',
  'englishLabMemoryMatchSubmitPair',
  'packageFromLiveState',
  'MemoryMatchGameCS21A173',
  "const GAME_ID = 'MEMORY_MATCH'",
  'global.EnglishLabMemoryMatchLiveCS21A174 = api',
];
for (const token of requiredAdapter) {
  if (!adapter.includes(token)) fail(`adapter sin contrato: ${token}`);
}
if (/\bfetch\s*\(|SpreadsheetApp|PropertiesService|ENGLISH_LAB_GAME_DB/i.test(adapter)) {
  fail('el adaptador frontend consulta red o conoce Sheets/configuración.');
} else ok('adaptador frontend sin red, Sheets ni ID de base');

if (!/function isMemoryMatchRoom\(room\)[\s\S]*roomGameId\(room\) === GAME_ID/.test(adapter)) {
  fail('detección de sala Memory Match no está ligada exclusivamente a GAME_ID');
} else if (!/target|VOCAB_SPRINT/.test(adapter) && /GAME_ID\s*=\s*'VOCAB_SPRINT'/.test(adapter)) {
  fail('adapter captura juegos existentes');
} else ok('adapter queda limitado a MEMORY_MATCH');

// Compilación del Apps Script con stubs mínimos.
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
console.log('CS21A174 MEMORY MATCH LIVE CONTRACT: APTO');
