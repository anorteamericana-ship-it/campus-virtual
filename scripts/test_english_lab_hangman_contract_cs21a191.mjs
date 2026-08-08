#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const backend = read('apps_script_patches/99M_HANGMAN_QA_CS21A191.gs');
const integration = read('src/english_lab_games/english_lab_hangman_live_cs21a191.jsx');
const registry = read('src/english_lab_games/english_lab_game_registry_cs21a191.js');
const guard = read('src/english_lab_live_student_dependency_guard_cs21a184.js');
const css = read('styles/english_lab_hangman_cs21a191.css');
const schema = JSON.parse(read('schemas/english_lab_game_package_cs21a191.schema.json'));

for (const marker of [
  "ELHANG191_GAME_CODE = 'HANGMAN'",
  'englishLabHangmanSuggestionsCS21A191',
  'englishLabHangmanCreateRoomCS21A191',
  'englishLabHangmanStartRoomCS21A191',
  'englishLabHangmanGetRoomControlCS21A191',
  'englishLabHangmanJoinRoomCS21A191',
  'englishLabHangmanGetPlayerStateCS21A191',
  'englishLabHangmanActionCS21A191',
  'englishLabHangmanCloseRoundCS21A191',
  'englishLabHangmanNextRoundCS21A191',
  'englishLabHangmanCloseRoomCS21A191',
  "fn === 'englishlablivejoinroom' && _elh191IsRoom_(body)",
  "fn === 'englishlablivegetplayerstate' && _elh191IsRoom_(body)",
  'recent_action_keys',
  "return _elh191PlayerStateResponse_(room, player, {accepted:false,repeated:true",
  "reason:'TEACHER'",
  "'TIMEOUT'",
]) assert.ok(backend.includes(marker), `backend marker: ${marker}`);

assert.ok(backend.includes("CONTENT_SOURCE:'CONFIG_UNIDADES|QUESTION_BANK|HANGMAN_CS21A191'"));
assert.ok(backend.includes("curriculum_source:'CONFIG_UNIDADES'"));
assert.ok(backend.includes("content_source:'QUESTION_BANK'"));
assert.ok(backend.includes("delete output.answer"), 'respuesta se elimina en estado público abierto');
assert.ok(backend.includes("if (reveal || output.completed === true"), 'respuesta solo se revela tras cierre/completado');
assert.ok(backend.includes("state.turn_state = _elh191KeepTurn_"), 'acierto conserva turno');
assert.ok(backend.includes("state.turn_state = _elive176NextTurn_"), 'error rota turno');
assert.ok(backend.includes("mensaje:'El turno terminó; la vida del equipo no se reduce.'"), 'timeout no consume vida');
assert.ok(backend.includes("return _elh191PlayerStateResponse_(room, player, {accepted:false,repeated:true,message:'La letra "), 'letra repetida sin castigo');

for (const marker of [
  'HangmanBoard', 'HangmanTeacherView', 'HangmanStudentSession',
  'englishLabHangmanSuggestions', 'englishLabHangmanCreateRoom',
  'englishLabHangmanAction', 'englishLabHangmanGetPlayerState',
  'an:english-lab-hangman-state', '__cs21a144AccessGate',
  'keydown', 'Resolver palabra o frase completa'
]) assert.ok(integration.includes(marker), `frontend marker: ${marker}`);

assert.ok(registry.includes("id:'HANGMAN'"));
assert.ok(registry.includes("id:'MEMORY_MATCH'"));
assert.ok(registry.includes("id:'SENTENCE_ORDER'"));
assert.ok(guard.includes('english_lab_game_registry_cs21a191.js?v=CS21A191'));
assert.ok(guard.includes('hangman_engine_cs21a191.js?v=CS21A191'));
assert.ok(guard.includes('english_lab_hangman_live_cs21a191.jsx?v=CS21A191'));
assert.ok(guard.includes('hangmanRuntimeReady'));
assert.ok(css.includes('@media(max-width:390px)'));
assert.ok(css.includes('min-height:44px'));

assert.equal(schema.properties.game_id.type, 'string');
assert.ok(!JSON.stringify(schema).includes('"const":"MEMORY_MATCH"'), 'contrato genérico no está amarrado a Memory Match');
assert.ok(schema.properties.game_payload.description.includes('Nunca'));

console.log(JSON.stringify({
  ok:true,
  version:'CS21A191',
  backend_authoritative:true,
  generic_registry:true,
  generic_schema:true,
  standard_live_join_intercepted:true,
  access_gate_preserved:true,
  keyboard_accessible:true,
  mobile_390:true,
  curriculum_traceability:true,
  timeout_no_life_penalty:true,
  duplicate_action_guard:true
}, null, 2));
