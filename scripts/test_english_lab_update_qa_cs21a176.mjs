#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const patchPath = path.join(root, 'apps_script_patches/97_ACTUALIZACION_QA.gs');

function fail(message) {
  console.error(`CS21A176 BACKEND FAIL: ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`CS21A176 BACKEND OK: ${message}`);
}

if (!fs.existsSync(patchPath)) fail('falta apps_script_patches/97_ACTUALIZACION_QA.gs');
if (process.exitCode) process.exit(process.exitCode);

const source = fs.readFileSync(patchPath, 'utf8');
try {
  new Function(source);
  ok('sintaxis JavaScript/V8 compilable');
} catch (error) {
  fail(`sintaxis inválida: ${error.message}`);
}

const required = [
  "ELIVE176_VERSION = 'CS21A176'",
  'function verificarActualizacionQA()',
  'englishLabMemoryMatchCreateRoomCS21A176',
  'englishLabMemoryMatchStartRoomCS21A176',
  'englishLabMemoryMatchGetPlayerStateCS21A176',
  'englishLabMemoryMatchGetRoomControlCS21A176',
  'englishLabMemoryMatchSubmitPairCS21A176',
  "fn === 'englishlablivegetplayerstate'",
  "error:'turno_no_activo'",
  'LockService.getScriptLock()',
  'matched_pair_ids',
  'active_player_id',
  'active_team_id',
  'team_player_orders',
  'last_action_key',
  "_elive176NormalizeUnit_('U1')",
  'function _elive176TeamPlan_',
  'function _elive176EnsureTeams_',
  "'Equipo Azul'",
  "'Equipo Rojo'",
  'function _elive176MaybeAdvanceTurn_',
  "'TURN_TIMEOUT'",
  "'LIVE_TURN_TIMEOUT'",
  "timeout_policy:'ADVANCE_TURN_NOT_CLOSE_ROUND'",
  'function _elive176AuthenticatedPlayerId_',
];
for (const token of required) {
  if (!source.includes(token)) fail(`falta contrato: ${token}`);
}
if (!process.exitCode) ok('contrato de acceso, equipos, turnos y tablero compartido presente');

const forbiddenPedagogy = [
  'Choose the best meaning',
  'greeting',
  'apple',
  'bicycle',
  'manzana',
  'bicicleta',
];
for (const sample of forbiddenPedagogy) {
  if (source.includes(sample)) fail(`contenido pedagógico incrustado: ${sample}`);
}
if (!process.exitCode) ok('actualización sin contenido pedagógico incrustado');

if (!source.includes('CacheService.getScriptCache()') || !source.includes('cache.put(key, JSON.stringify(rows), 300)')) {
  fail('falta caché de cinco minutos para QUESTION_BANK');
} else ok('caché QA del banco presente');

if (!source.includes("if (!players.length) return {ok:false,error:'sin_participantes'")) {
  fail('la sala puede iniciar sin participantes');
} else ok('inicio bloqueado sin participantes');

if (!source.includes('players = _elive176EnsureTeams_(room, players, rules)')) {
  fail('modo equipos no garantiza asignación balanceada');
} else ok('equipos vacíos reciben asignación balanceada');

if (!source.includes('var room = _elive176MaybeAdvanceTurn_(found, true)')) {
  fail('submit no actualiza un turno vencido antes de validar');
} else ok('turno vencido rota antes de aceptar acciones');

if (!source.includes('var room = _elive176MaybeAdvanceTurn_(found, false)')) {
  fail('polling estudiante no avanza turnos vencidos');
} else ok('polling puede avanzar turnos vencidos con lock');

if (!source.includes('if (!_elive176CanAct_(turnState, player))')) {
  fail('backend no valida jugador activo');
} else ok('backend rechaza acciones fuera de turno');

if (!source.includes('authenticatedId || requestedId')) {
  fail('identidad autenticada no tiene prioridad sobre player_id enviado');
} else ok('identidad autenticada tiene prioridad');

if (!source.includes('shared.last_action_key') || !source.includes('Intento ya procesado')) {
  fail('falta control idempotente básico');
} else ok('reintento idéntico no avanza dos turnos');

if (!source.includes('var canonicalCards = [pair.first_id, pair.second_id].sort()')) {
  fail('reintento con tarjetas invertidas puede duplicar la acción');
} else ok('orden de tarjetas canonicalizado para idempotencia');

if (source.length > 45000) fail(`actualización temporal demasiado grande: ${source.length} caracteres`);
else ok(`actualización temporal acotada: ${source.length} caracteres`);

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A176 ACTUALIZACION QA: APTO ESTATICAMENTE');
