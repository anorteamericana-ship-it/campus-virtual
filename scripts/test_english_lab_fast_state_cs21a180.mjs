#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const backendPath = path.join(root, 'apps_script_patches', '97_ACTUALIZACION_QA.gs');
const frontendPath = path.join(root, 'src', 'english_lab_live.jsx');
const backend = fs.readFileSync(backendPath, 'utf8');
const frontend = fs.readFileSync(frontendPath, 'utf8');

function fail(message) {
  console.error(`CS21A180 FAIL: ${message}`);
  process.exitCode = 1;
}
function ok(message) {
  console.log(`CS21A180 OK: ${message}`);
}
function functionSource(name) {
  const marker = `function ${name}(`;
  const start = backend.indexOf(marker);
  if (start < 0) return '';
  const brace = backend.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = brace; index < backend.length; index += 1) {
    const char = backend[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === "'" || char === '"' || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return backend.slice(start, index + 1);
    }
  }
  return '';
}
function requireToken(source, token, message) {
  if (!source.includes(token)) fail(message);
  else ok(message);
}

try {
  new Function(backend);
  ok('backend compilable en JavaScript/V8');
} catch (error) {
  fail(`backend con sintaxis invalida: ${error.message}`);
}

const createSource = functionSource('englishLabMemoryMatchCreateRoomCS21A180');
const controlSource = functionSource('englishLabMemoryMatchGetRoomControlCS21A180');
const playerSource = functionSource('englishLabMemoryMatchGetPlayerStateCS21A180');
const snapshotSource = functionSource('_elive180BuildSnapshot_');

requireToken(backend, "ELIVE180_VERSION = 'CS21A180'", 'version CS21A180 presente');
requireToken(createSource, '_elive180AppendObject_(ELIVE_ROOMS_SHEET', 'creacion usa encabezados reales de ROOMS');
requireToken(createSource, 'GAME_CODE:ELMM174_GAME_CODE', 'Memory Match se crea como Memory Match desde el origen');
if (createSource.includes('englishLabLiveCreateRoom')) fail('creacion todavia pasa por WORD_MATCH generico');
else ok('creacion no pasa por el creador generico');
if (controlSource.includes('englishLabLiveGetRoomControl')) fail('control rapido llama al control generico pesado');
else ok('control rapido evita el control generico pesado');
if (playerSource.includes('englishLabLiveGetPlayerState')) fail('estado de estudiante llama al estado generico pesado');
else ok('estado de estudiante evita el estado generico pesado');

for (const sheet of ['ELIVE_PLAYERS_SHEET', 'ELIVE_ANSWERS_SHEET', 'ELIVE_EVENTS_SHEET']) {
  const count = snapshotSource.split(`_elive180Table_(${sheet}`).length - 1;
  if (count !== 1) fail(`snapshot debe leer ${sheet} exactamente una vez; encontro ${count}`);
  else ok(`snapshot lee ${sheet} una sola vez`);
}
requireToken(backend, 'ELIVE180_SNAPSHOT_TTL_SECONDS = 3', 'snapshot compartido tiene cache corto de tres segundos');
requireToken(backend, 'ELIVE180_LAST_SEEN_TTL_SECONDS = 30', 'LAST_SEEN no se escribe en cada polling');
requireToken(backend, '_cs21a144RequireLab_', 'estado rapido conserva autorizacion academica del estudiante');
requireToken(backend, 'questions:[], question:null, current_question:null', 'Memory Match nunca recibe preguntas genericas');
requireToken(frontend, 'const memoryMatch = !!(data?.memory_match ||', 'frontend reconoce la senal especializada del backend');
requireToken(frontend, 'question={memoryMatch ? null :', 'proyector bloquea preguntas genericas en Memory Match');
requireToken(frontend, ': memoryMatch ? <Alert tone="warn">Memory Match esta listo.', 'control muestra espera especializada antes de iniciar');

try {
  const source = functionSource('_elive180ValuesForHeaders_');
  const valuesForHeaders = new Function('_elive176Upper_', `return (${source});`)(value => String(value ?? '').trim().toUpperCase());
  const headers = ['ROOM_ID', 'CREATED_AT', 'SETTINGS_JSON', '', 'ROUND_STATUS', 'UNIT'];
  const room = {ROOM_ID:'ELIVE-TEST',CREATED_AT:'2026-08-05 22:00:00',SETTINGS_JSON:'{"engine":"MEMORY_MATCH"}',ROUND_STATUS:'READY',UNIT:'U01'};
  const values = valuesForHeaders(headers, room);
  if (values[1] !== room.CREATED_AT || values[2] !== room.SETTINGS_JSON || values[3] !== '' || values[4] !== 'READY' || values[5] !== 'U01') {
    fail('mapeo por encabezado no respeta el orden fisico de la hoja');
  } else ok('mapeo por encabezado respeta columnas fisicas y columnas vacias');
} catch (error) {
  fail(`no se pudo probar el mapeo por encabezado: ${error.message}`);
}

if (backend.length > 70000) fail(`archivo temporal excede 70000 caracteres: ${backend.length}`);
else ok(`archivo temporal dentro del limite CS21A180: ${backend.length} caracteres`);

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A180 ENGLISH LAB FAST STATE: APTO ESTATICAMENTE');
