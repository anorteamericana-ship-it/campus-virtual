#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const enginePath = path.join(root, 'src/english_lab_games/english_lab_turn_engine_cs21a176.js');
const schemaPath = path.join(root, 'schemas/english_lab_turn_state_cs21a176.schema.json');

function fail(message) {
  console.error(`CS21A176 FAIL: ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`CS21A176 OK: ${message}`);
}

for (const file of [enginePath, schemaPath]) {
  if (!fs.existsSync(file)) fail(`falta ${path.relative(root, file)}`);
  else ok(`existe ${path.relative(root, file)}`);
}
if (process.exitCode) process.exit(process.exitCode);

const source = fs.readFileSync(enginePath, 'utf8');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

for (const forbidden of [/\bfetch\s*\(/, /SpreadsheetApp/, /google\.script/, /APPS_SCRIPT_URL/, /QUESTION_BANK/]) {
  if (forbidden.test(source)) fail(`el motor contiene dependencia prohibida: ${forbidden}`);
}
if (!process.exitCode) ok('motor puro sin backend ni banco pedagógico');

const windowObject = {};
vm.runInNewContext(source, {
  window: windowObject,
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

const engine = windowObject.EnglishLabTurnEngineCS21A176;
if (!engine) fail('motor no exportado');
if (process.exitCode) process.exit(process.exitCode);

const players = [
  {player_id:'P1', name:'Ana', team_id:'AZUL'},
  {player_id:'P2', name:'Luis', team_id:'ROJO'},
  {player_id:'P3', name:'María', team_id:'AZUL'},
  {player_id:'P4', name:'Carlos', team_id:'ROJO'},
];

const roundRobin = engine.createTurnState({
  policy:'ROUND_ROBIN', players, seed:'LAB-1000|R1', now_ms:1000, turn_duration_ms:15000,
});
if (roundRobin.player_order.length !== 4 || !roundRobin.active_player_id) {
  fail('ROUND_ROBIN no seleccionó jugador activo');
} else ok(`ROUND_ROBIN inicia con ${roundRobin.active_player_id}`);

const roundRobinNext = engine.nextTurn(roundRobin, {now_ms:2000, turn_duration_ms:15000});
if (roundRobinNext.active_player_id === roundRobin.active_player_id || roundRobinNext.turn_number !== 2) {
  fail('ROUND_ROBIN no avanzó al siguiente jugador');
} else ok(`ROUND_ROBIN rota a ${roundRobinNext.active_player_id}`);

const activeRoundRobinPlayer = players.find((player) => player.player_id === roundRobin.active_player_id);
const waitingRoundRobinPlayer = players.find((player) => player.player_id !== roundRobin.active_player_id);
if (!engine.canPlayerAct(roundRobin, activeRoundRobinPlayer)) fail('jugador activo no puede actuar');
if (engine.canPlayerAct(roundRobin, waitingRoundRobinPlayer)) fail('jugador en espera puede actuar');
if (!process.exitCode) ok('acciones fuera de turno rechazadas');

const everyone = engine.createTurnState({policy:'EVERYONE', players, seed:'LAB-1001|R1', now_ms:1000});
if (!players.every((player) => engine.canPlayerAct(everyone, player))) {
  fail('EVERYONE no habilita a todos los jugadores');
} else ok('EVERYONE habilita todos contra todos');

const teamState = engine.createTurnState({
  policy:'TEAM_ALTERNATING', players, seed:'LAB-1002|R1', now_ms:1000, turn_duration_ms:20000,
});
if (teamState.team_order.length !== 2 || !teamState.active_team_id || !teamState.active_player_id) {
  fail('TEAM_ALTERNATING no creó orden de equipos e integrante activo');
} else ok(`TEAM_ALTERNATING inicia ${teamState.active_team_id}/${teamState.active_player_id}`);

const teamActivePlayer = players.find((player) => player.player_id === teamState.active_player_id);
const otherTeamPlayer = players.find((player) => player.team_id !== teamState.active_team_id);
if (!engine.canPlayerAct(teamState, teamActivePlayer)) fail('integrante activo del equipo no puede actuar');
if (engine.canPlayerAct(teamState, otherTeamPlayer)) fail('integrante de equipo contrario puede actuar');

const teamNext = engine.nextTurn(teamState, {now_ms:3000, turn_duration_ms:20000});
if (teamNext.active_team_id === teamState.active_team_id) {
  fail('TEAM_ALTERNATING no alternó equipo');
} else ok(`TEAM_ALTERNATING rota a ${teamNext.active_team_id}/${teamNext.active_player_id}`);

const teamBack = engine.nextTurn(teamNext, {now_ms:4000, turn_duration_ms:20000});
if (teamBack.active_team_id !== teamState.active_team_id) {
  fail('TEAM_ALTERNATING no volvió al equipo inicial');
} else if (teamBack.active_player_id === teamState.active_player_id) {
  fail('TEAM_ALTERNATING no rotó integrante dentro del equipo');
} else ok(`rotación interna correcta: ${teamState.active_player_id} → ${teamBack.active_player_id}`);

const repeatA = engine.createTurnState({policy:'RANDOM_PLAYER', players, seed:'MISMA-SEMILLA', now_ms:1000});
const repeatB = engine.createTurnState({policy:'RANDOM_PLAYER', players, seed:'MISMA-SEMILLA', now_ms:1000});
if (JSON.stringify(repeatA.player_order) !== JSON.stringify(repeatB.player_order)) {
  fail('orden aleatorio no es reproducible');
} else ok('orden aleatorio reproducible por semilla');

const description = engine.describeTurn(teamState, players);
if (!description.active_player || !description.next_player || description.turn_number !== 1) {
  fail('descripción de turno incompleta');
} else ok(`describe turno actual y siguiente: ${description.active_player.name} → ${description.next_player.name}`);

if (schema?.properties?.version?.const !== 'CS21A176') fail('schema no fija CS21A176');
if (!schema?.properties?.participation_policy?.enum?.includes('TEAM_ALTERNATING')) fail('schema no incluye TEAM_ALTERNATING');
if (!process.exitCode) ok('schema del estado de turnos válido');

if (source.length > 30000) fail(`motor demasiado grande: ${source.length} caracteres`);
else ok(`motor liviano: ${source.length} caracteres`);

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A176 LIVE TURN ENGINE: APTO');
