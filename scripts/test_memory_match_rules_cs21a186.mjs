#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const runtimeSource = fs.readFileSync('src/english_lab_games/english_lab_runtime_cs21a173.js', 'utf8');
const runtimeWindow = {};
vm.runInNewContext(runtimeSource, {window:runtimeWindow, console, Date, Object, Array, String, Number, Math, JSON});
const runtime = runtimeWindow.EnglishLabRuntimeCS21A173;
assert.ok(runtime, 'No se instaló EnglishLabRuntimeCS21A173.');
assert.equal(runtime.CLOCK_FIX_VERSION, 'CS21A186-MEMORY-CLOCK-FIX1');

const clientReceived = Date.parse('2026-08-07T20:47:13.000Z');
const normalized = runtime.normalizeRoomPackage({
  server_now:'2026-08-07T20:47:12.937Z',
  // Este valor reproduce el bug real: quedó congelado al inicio de LAB-9848.
  received_at_ms:Date.parse('2026-08-07T20:40:05.669Z'),
  // Solo para hacer determinista el test; producción usa Date.now() al normalizar.
  client_received_at_ms:clientReceived,
  room:{room_code:'LAB-9848',game_id:'MEMORY_MATCH',mode:'TEAMS',level_id:'B1'},
  round:{round_id:'LAB-9848-R1',index:1,cards:[
    {card_id:'A-L',pair_id:'A',label:'apple'},
    {card_id:'A-R',pair_id:'A',label:'manzana'},
    {card_id:'B-L',pair_id:'B',label:'teacher'},
    {card_id:'B-R',pair_id:'B',label:'profesor/a'},
  ]},
  rules:{round_duration_ms:30000},
  state:{phase:'OPEN',started_at:'2026-08-07T20:47:12.937Z',ends_at:'2026-08-07T20:47:42.937Z'},
});
const remaining = normalized.clock.remainingMs(normalized.state.endsAt, clientReceived);
assert.ok(remaining >= 29800 && remaining <= 30000, `Reloj inválido: ${remaining} ms; debería rondar 30 s.`);
assert.ok(remaining > 0, 'El turno quedó bloqueado en 0 s por received_at_ms histórico.');

const rulesSource = fs.readFileSync('apps_script_patches/99G_FIX_MEMORY_MATCH_RULES_QA_CS21A186.gs', 'utf8');
const appContext = {
  console,
  Date,
  JSON,
  Math,
  Number,
  String,
  ELIVE176_POLICY_TEAM_ALTERNATING:'TEAM_ALTERNATING',
  verificarMemoryMatchStartFixCS21A183:() => ({ok:true,version:'CS21A185-MM-CLOSED-ROOM-FIX1',closed_room_terminal:true,qa_master:'QA',qa_operational:'QA'}),
  _elive176Iso_:(value) => (value instanceof Date ? value : new Date(value)).toISOString(),
  _elive176Text_:(value) => String(value == null ? '' : value).trim(),
  _elive176NextTurn_:(turnState, now, durationMs, reason) => {
    const next = JSON.parse(JSON.stringify(turnState));
    next.turn_number = Number(turnState.turn_number || 1) + 1;
    next.turn_started_at = now.toISOString();
    next.turn_ends_at = new Date(now.getTime() + durationMs).toISOString();
    next.last_player_id = turnState.active_player_id;
    next.last_team_id = turnState.active_team_id;
    next.reason = reason;
    next.team_cursor = (Number(turnState.team_cursor || 0) + 1) % turnState.team_order.length;
    next.active_team_id = turnState.team_order[next.team_cursor];
    next.active_player_id = turnState.team_player_orders[next.active_team_id][0];
    return next;
  },
};
vm.createContext(appContext);
vm.runInContext(rulesSource, appContext);
assert.equal(appContext.CS21A186_MM_RULES_FIX_VERSION, 'CS21A186-MM-RULES-FIX1');
assert.equal(appContext._cs21a186MmPoints_(true), 1);
assert.equal(appContext._cs21a186MmPoints_(false), 0);

const baseTurn = {
  participation_policy:'TEAM_ALTERNATING',
  player_order:['P1','P2'],
  player_cursor:0,
  team_order:['Equipo Azul','Equipo Rojo'],
  team_cursor:0,
  team_player_orders:{'Equipo Azul':['P1'],'Equipo Rojo':['P2']},
  team_player_cursors:{'Equipo Azul':0,'Equipo Rojo':0},
  active_player_id:'P1',
  active_team_id:'Equipo Azul',
  turn_number:3,
  turn_started_at:'2026-08-07T20:00:00.000Z',
  turn_ends_at:'2026-08-07T20:00:30.000Z',
};
const now = new Date('2026-08-07T20:00:10.000Z');
const correct = appContext._cs21a186MmContinueSamePlayer_(baseTurn, now, 30000, 'PAIR_CORRECT_CONTINUE');
assert.equal(correct.active_player_id, 'P1');
assert.equal(correct.active_team_id, 'Equipo Azul');
assert.equal(correct.team_cursor, 0);
assert.equal(correct.turn_number, 4);
assert.equal(Date.parse(correct.turn_ends_at) - Date.parse(correct.turn_started_at), 30000);

const wrong = appContext._elive176NextTurn_(baseTurn, now, 30000, 'PAIR_INCORRECT');
assert.equal(wrong.active_player_id, 'P2');
assert.equal(wrong.active_team_id, 'Equipo Rojo');
assert.equal(wrong.turn_number, 4);

const verifier = appContext.verificarMemoryMatchStartFixCS21A183();
assert.equal(verifier.ok, true);
assert.equal(verifier.correct_pair_points, 1);
assert.equal(verifier.correct_pair_keeps_player, true);
assert.equal(verifier.incorrect_pair_rotates_turn, true);
assert.equal(verifier.timeout_rotates_turn, true);
assert.equal(verifier.expired_submit_rejected, true);

assert.ok(rulesSource.includes("error:'turno_expirado'"), 'El backend debe rechazar un par enviado después del límite del turno.');
assert.ok(rulesSource.includes("'LIVE_TURN_CONTINUED'"), 'Debe existir evento de continuación tras acierto.');
assert.ok(rulesSource.includes("'LIVE_TURN_ADVANCED'"), 'Debe existir evento de rotación tras fallo.');

console.log(JSON.stringify({
  ok:true,
  version:'CS21A186',
  clock_fix:runtime.CLOCK_FIX_VERSION,
  stale_received_at_ignored:true,
  remaining_ms:remaining,
  correct_pair_points:1,
  correct_pair_keeps_player:true,
  correct_pair_keeps_team:true,
  correct_pair_resets_timer:true,
  incorrect_pair_rotates_turn:true,
  timeout_rotates_turn:true,
}, null, 2));
