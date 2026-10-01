import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'AppsScript', 'EnglishLabLiveV2');
const files = [
  '00_Constants.js', '02_CanonicalJson.js', '04_StateMachine.js', '05_Idempotency.js',
  '06_PublicViewGuard.js', '07_GameRegistry.js', '09_Authorization.js', '10_InMemoryStore.js',
  '11_RoomEngine.js', '12_ConcurrencyGuard.js', '13_RoundEngine.js', '28_HangmanGame.js'
];
const context = vm.createContext({ console, Object, Array, JSON, String, Error, Number, RegExp, isFinite });
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

context.ELV2_clearGameRegistryForTests_();
const metadata = context.ELV2_registerGamePlugin(context.ELV2_HangmanGame);
assert.equal(metadata.game_id, 'HANGMAN');
assert.deepEqual([...context.ELV2_listGameIds()], ['HANGMAN']);
const game = context.ELV2_getGamePlugin('HANGMAN');

const words = [
  ['hello', 'hola'], ['goodbye', 'adiós'], ['name', 'nombre'], ['teacher', 'docente'], ['student', 'estudiante'],
  ['phone number', 'número de teléfono'], ['address', 'dirección'], ['country', 'país'], ['class', 'clase'], ['friend', 'amigo']
];
const content = {
  content_type: 'VOCABULARY_SET',
  source_id: 'APOLLO_G3/ACADEMIA_PLAY_BANK',
  level_id: 'B1', unit_id: 'B1-U01',
  curriculum: { level_id: 'B1', unit_id: 'B1-U01', status: 'ACTIVE' },
  items: words.map(([label, hint], index) => ({
    play_item_id: `V-${index + 1}`,
    source_item_id: `V-SRC-${index + 1}`,
    template_id: index < 5 ? 'VOCAB_01' : 'VOCAB_02',
    item_type: index < 5 ? 'MCQ' : 'MATCH',
    label,
    hint_es: hint
  }))
};

assert.equal(game.validateContent(content), true);
assert.equal(game.validateSettings({ item_index: 1, max_errors: 6 }), true);
assert.throws(() => game.validateSettings({ max_errors: 2 }), /ELV2_SETTINGS_INVALID/);
assert.throws(() => game.validateSettings({ turn_ms: 5000 }), /ELV2_SETTINGS_INVALID/);
assert.throws(() => game.validateAttempt({ action_type: 'SOLVE', letter: 'H' }), /ELV2_ATTEMPT_INVALID/);
assert.throws(() => game.validateAttempt({ action_type: 'GUESS_LETTER', letter: 'HH' }), /ELV2_ATTEMPT_INVALID/);
assert.throws(() => game.validateAttempt({ action_type: 'GUESS_LETTER', letter: 'H', extra: true }), /ELV2_ATTEMPT_INVALID/);

let direct = game.createRound(content, { item_index: 1, max_errors: 3 }, {});
assert.equal(direct.scoring_policy, 'SCORE_IMMEDIATE_PUBLIC');
assert.equal(direct.visibility_model, 'SHARED_BOARD');
assert.equal(direct.submission_policy, 'MULTI_ACTION');
assert.equal(context.ELV2_validateCreatedRoundContract(direct), true);
const initial = game.publicView(direct.private_state, { view_mode: 'STUDENT' }, 'OPEN', {});
assert.equal(initial.clue, 'hola');
assert.equal(initial.pattern, '_ _ _ _ _');
assert.equal(Object.prototype.hasOwnProperty.call(initial, 'term'), false);
assert.equal(context.ELV2_assertPublicViewSafe(initial, 'OPEN', game.publicSchema({}, 'OPEN', {})), true);

let lossState = direct.private_state;
for (const letter of ['Z', 'Q', 'X']) {
  const applied = game.applyAttempt(lossState, { action_type: 'GUESS_LETTER', letter }, { student_id: 'LOSS' }, {});
  assert.equal(applied.points_delta, 0);
  lossState = applied.next_private_state;
}
assert.equal(lossState.completed, true);
assert.equal(lossState.won, false);
assert.equal(game.isComplete(lossState, {}), true);
assert.throws(() => game.applyAttempt(lossState, { action_type: 'GUESS_LETTER', letter: 'H' }, { student_id: 'LOSS' }, {}), /ELV2_ROUND_NOT_OPEN/);

// Full shared-board integration with immediate public scoring and SALA_MIXTA.
let now = 2_000;
let idCounter = 0;
const store = context.ELV2_createInMemoryStore();
const concurrencyGuard = context.ELV2_createConcurrencyGuard(context.ELV2_createSynchronousTestLockAdapter());
const clock = { nowMs: () => now };
const idFactory = kind => `${kind}-${++idCounter}`;
const roomEngine = context.ELV2_createRoomEngine({
  store, clock, concurrencyGuard, idFactory, roomCodeFactory: () => 'LAB-HANG-V2'
});
const roundEngine = context.ELV2_createRoundEngine({
  store, clock, concurrencyGuard, idFactory,
  payloadHasher: value => context.ELV2_canonicalJson(value)
});
const teacher = {
  user_id: 'teacher:1', teacher_id: 'T-1', role: 'teacher', authorized_group_ids: ['GROUP-A'],
  capabilities: ['LIVE_CREATE', 'LIVE_VIEW', 'LIVE_CONTROL_OWN']
};
const studentA = {
  user_id: 'student:A', role: 'student', student_id: 'STU-A', display_name: 'Ana',
  home_group_id: 'GROUP-A', live_eligible: true, capabilities: ['LIVE_JOIN', 'LIVE_VIEW', 'LIVE_PLAY']
};
const studentB = {
  user_id: 'student:B', role: 'student', student_id: 'STU-B', display_name: 'Bruno',
  home_group_id: 'GROUP-B', live_eligible: true, capabilities: ['LIVE_JOIN', 'LIVE_VIEW', 'LIVE_PLAY']
};

let room = roomEngine.createRoom(teacher, { group_id: 'GROUP-A', title: 'Hangman v2' });
roomEngine.joinRoom(studentA, { room_code: room.room_code });
roomEngine.joinRoom(studentB, { room_code: room.room_code });
room = roomEngine.startRoom(teacher, room.room_id, 2);
assert.equal(room.state_revision, 3);

let prepared = roundEngine.prepareRound(teacher, {
  room_id: room.room_id, expected_revision: 3,
  game_id: 'HANGMAN', content_ref: 'APOLLO_PLAY_V1:B1:B1-U01:VOCABULARY',
  content_version: 'APOLLO_PLAY_V1', resolved_content: content,
  settings: { item_index: 1, max_errors: 6 }
});
assert.equal(prepared.round.status, 'READY');
assert.equal(prepared.round.scoring_policy, 'SCORE_IMMEDIATE_PUBLIC');
assert.equal(prepared.round.visibility_model, 'SHARED_BOARD');
assert.equal(prepared.round.submission_policy, 'MULTI_ACTION');
let ready = roundEngine.buildStudentGameView(prepared.round, studentA);
assert.equal(ready.pattern, '_ _ _ _ _');
assert.equal(Object.prototype.hasOwnProperty.call(ready, 'term'), false);

let opened = roundEngine.openRound(teacher, {
  room_id: room.room_id, round_id: prepared.round.round_id,
  expected_revision: 4, duration_ms: 30_000
});

const guessH = roundEngine.submitAttempt(studentA, {
  room_id: room.room_id, round_id: opened.round.round_id,
  request_id: 'REQ-H-1', client_seen_revision: 5,
  attempt: { action_type: 'GUESS_LETTER', letter: 'H' }
});
assert.equal(guessH.attempt.points_delta, 10);
assert.equal(guessH.attempt.score_status, 'COMMITTED');
assert.equal(guessH.player.score_total, 10);
assert.equal(guessH.view.pattern, 'H _ _ _ _');
assert.equal(guessH.view.errors_used, 0);
assert.equal(Object.prototype.hasOwnProperty.call(guessH.view, 'term'), false);
assert.equal(context.ELV2_assertPublicViewSafe(guessH.view, 'OPEN', game.publicSchema({ view_mode: 'STUDENT' }, 'OPEN', {})), true);

const replayH = roundEngine.submitAttempt(studentA, {
  room_id: room.room_id, round_id: opened.round.round_id,
  request_id: 'REQ-H-1', client_seen_revision: 999,
  attempt: { action_type: 'GUESS_LETTER', letter: 'H' }
});
assert.equal(replayH.replayed, true);
assert.equal(replayH.attempt.attempt_id, guessH.attempt.attempt_id);
assert.equal(store.getPlayerByRoomStudent(room.room_id, 'STU-A').score_total, 10);
assert.equal(store.listAttemptsByRound(opened.round.round_id).length, 1);

assert.throws(() => roundEngine.submitAttempt(studentB, {
  room_id: room.room_id, round_id: opened.round.round_id,
  request_id: 'REQ-H-REPEAT',
  attempt: { action_type: 'GUESS_LETTER', letter: 'h' }
}), /ELV2_ALREADY_GUESSED/);
assert.equal(store.listAttemptsByRound(opened.round.round_id).length, 1);

const guessZ = roundEngine.submitAttempt(studentB, {
  room_id: room.room_id, round_id: opened.round.round_id,
  request_id: 'REQ-Z-1', client_seen_revision: 6,
  attempt: { action_type: 'GUESS_LETTER', letter: 'Z' }
});
assert.equal(guessZ.attempt.points_delta, 0);
assert.equal(guessZ.attempt.score_status, 'COMMITTED');
assert.equal(guessZ.view.errors_used, 1);
assert.deepEqual([...guessZ.view.wrong_letters], ['Z']);

const guessL = roundEngine.submitAttempt(studentA, {
  room_id: room.room_id, round_id: opened.round.round_id,
  request_id: 'REQ-L-1',
  attempt: { action_type: 'GUESS_LETTER', letter: 'L' }
});
assert.equal(guessL.attempt.points_delta, 20);
assert.equal(guessL.player.score_total, 30);
assert.equal(guessL.view.pattern, 'H _ L L _');

const guessE = roundEngine.submitAttempt(studentB, {
  room_id: room.room_id, round_id: opened.round.round_id,
  request_id: 'REQ-E-1',
  attempt: { action_type: 'GUESS_LETTER', letter: 'E' }
});
assert.equal(guessE.attempt.points_delta, 10);
assert.equal(guessE.player.score_total, 10);

const guessO = roundEngine.submitAttempt(studentA, {
  room_id: room.room_id, round_id: opened.round.round_id,
  request_id: 'REQ-O-1',
  attempt: { action_type: 'GUESS_LETTER', letter: 'O' }
});
assert.equal(guessO.attempt.points_delta, 10);
assert.equal(guessO.player.score_total, 40);
assert.equal(guessO.view.pattern, 'H E L L O');
assert.equal(guessO.view.completed, true);
assert.equal(guessO.view.won, true);
assert.equal(Object.prototype.hasOwnProperty.call(guessO.view, 'term'), false,
  'shared board may reveal solved letters, but explicit source term stays out until REVEAL');
assert.equal(game.isComplete(store.getRound(opened.round.round_id).private_state, {}), true);

assert.throws(() => roundEngine.submitAttempt(studentA, {
  room_id: room.room_id, round_id: opened.round.round_id,
  request_id: 'REQ-AFTER-COMPLETE',
  attempt: { action_type: 'GUESS_LETTER', letter: 'A' }
}), /ELV2_ROUND_NOT_OPEN/);
assert.equal(store.listAttemptsByRound(opened.round.round_id).length, 5);

const locked = roundEngine.lockRound(teacher, {
  room_id: room.room_id, round_id: opened.round.round_id, expected_revision: 10
});
const lockedView = roundEngine.buildStudentGameView(locked.round, studentA);
assert.equal(Object.prototype.hasOwnProperty.call(lockedView, 'term'), false);
assert.equal(context.ELV2_assertNoForbiddenPublicKeys(lockedView, 'LOCKED'), true);

const revealed = roundEngine.revealRound(teacher, {
  room_id: room.room_id, round_id: opened.round.round_id,
  expected_revision: 11, reveal_duration_ms: 3_000
});
const revealView = roundEngine.buildStudentGameView(revealed.round, studentA);
assert.equal(revealView.term, 'hello');
assert.equal(revealView.pattern, 'H E L L O');
assert.equal(store.getPlayerByRoomStudent(room.room_id, 'STU-A').score_total, 40);
assert.equal(store.getPlayerByRoomStudent(room.room_id, 'STU-B').score_total, 10);
assert.equal(context.ELV2_assertPublicViewSafe(revealView, 'REVEAL', game.publicSchema({ view_mode: 'STUDENT' }, 'REVEAL', {})), true);

const pluginSource = fs.readFileSync(path.join(sourceDir, '28_HangmanGame.js'), 'utf8');
for (const forbidden of ['SpreadsheetApp', 'LockService', 'PropertiesService', 'UrlFetchApp', 'Utilities', 'Session']) {
  assert.equal(pluginSource.includes(forbidden), false, `Hangman plugin must not access ${forbidden}`);
}

console.log(JSON.stringify({
  ok: true,
  gate: 'E6-HANGMAN',
  game_id: 'HANGMAN',
  shared_board: true,
  multi_action: true,
  immediate_public_scoring: true,
  repeated_letter_no_penalty: true,
  mixed_room_regression: true,
  legacy_memory_dependency: false,
  writes_external: 0
}));
