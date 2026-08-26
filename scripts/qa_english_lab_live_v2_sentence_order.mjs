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
  '11_RoomEngine.js', '12_ConcurrencyGuard.js', '13_RoundEngine.js', '27_SentenceOrderGame.js'
];
const context = vm.createContext({ console, Object, Array, JSON, String, Error, Number, RegExp, isFinite });
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

context.ELV2_clearGameRegistryForTests_();
const metadata = context.ELV2_registerGamePlugin(context.ELV2_SentenceOrderGame);
assert.equal(metadata.game_id, 'SENTENCE_ORDER');
assert.deepEqual([...context.ELV2_listGameIds()], ['SENTENCE_ORDER']);
const game = context.ELV2_getGamePlugin('SENTENCE_ORDER');

const content = {
  content_type: 'SENTENCE_ORDER_SET',
  source_id: 'APOLLO_G3/ACADEMIA_PLAY_BANK',
  level_id: 'B1',
  unit_id: 'B1-U01',
  curriculum: { level_id: 'B1', unit_id: 'B1-U01', status: 'ACTIVE' },
  items: Array.from({ length: 5 }, (_, index) => ({
    play_item_id: `SO-${index + 1}`,
    source_item_id: `SO-SRC-${index + 1}`,
    template_id: 'GRAM_02',
    item_type: 'ORDER',
    prompt_es: 'Ordená las palabras.',
    stem: `Sentence ${index + 1}`,
    words_to_order: `name | is | my | learner${index + 1}`,
    correct_sentence: `My name is learner${index + 1}.`,
    explanation_es: 'Usá el orden sujeto + verbo + complemento.'
  }))
};

assert.equal(game.validateContent(content), true);
assert.equal(game.validateSettings({ item_index: 2 }), true);
assert.throws(() => game.validateSettings({ item_index: 0 }), /ELV2_SETTINGS_INVALID/);
assert.throws(() => game.validateSettings({ item_index: 1, score: 999 }), /ELV2_SETTINGS_INVALID/);
assert.throws(() => game.validateAttempt({ action_type: 'SUBMIT_ORDER', token_ids: ['a', 'b'] }), /ELV2_ATTEMPT_INVALID/);
assert.throws(() => game.validateAttempt({ action_type: 'SUBMIT_ORDER', token_ids: ['a', 'b', 'b'] }), /ELV2_ATTEMPT_INVALID/);
assert.throws(() => game.validateAttempt({ action_type: 'SUBMIT_ORDER', token_ids: ['a', 'b', 'c'], extra: true }), /ELV2_ATTEMPT_INVALID/);

const opaqueIds = ['tok-z9', 'tok-a4', 'tok-m7', 'tok-b2'];
let opaqueIndex = 0;
const directCreated = game.createRound(content, { item_index: 1 }, {
  opaque_id_factory: () => opaqueIds[opaqueIndex++]
});
assert.equal(directCreated.scoring_policy, 'SCORE_ON_REVEAL');
assert.equal(directCreated.visibility_model, 'PRIVATE_RESPONSE');
assert.equal(directCreated.submission_policy, 'SINGLE_FINAL');
assert.equal(context.ELV2_validateCreatedRoundContract(directCreated), true);
assert.deepEqual([...directCreated.private_state.solution_token_ids], opaqueIds);
assert.notDeepEqual(
  directCreated.private_state.display_tokens.map(token => token.token_id),
  opaqueIds,
  'display order must not expose canonical order'
);
assert.deepEqual(
  directCreated.private_state.display_tokens.map(token => token.token_id),
  ['tok-a4', 'tok-b2', 'tok-m7', 'tok-z9']
);

const studentViewer = { student_id: 'STU-A', view_mode: 'STUDENT' };
const openDirect = game.publicView(directCreated.private_state, studentViewer, 'OPEN', {});
assert.equal(openDirect.has_submitted, false);
assert.equal(Object.prototype.hasOwnProperty.call(openDirect, 'answer_sentence'), false);
assert.equal(Object.prototype.hasOwnProperty.call(openDirect, 'answer_token_ids'), false);
assert.equal(Object.prototype.hasOwnProperty.call(openDirect, 'viewer_result'), false);
assert.equal(context.ELV2_assertPublicViewSafe(openDirect, 'OPEN', game.publicSchema(studentViewer, 'OPEN', {})), true);
assert.notDeepEqual(
  openDirect.tokens.map(token => token.label),
  ['My', 'name', 'is', 'learner1.'],
  'visible labels must be scrambled'
);

// Full Core integration: server-issued opaque ids, hidden scoring, retry and reveal.
let now = 1_000;
let idCounter = 0;
const gameTokenFixtures = ['g-z9', 'g-a4', 'g-m7', 'g-b2'];
let gameTokenIndex = 0;
const idFactory = (kind) => {
  if (kind === 'game_token') return gameTokenFixtures[gameTokenIndex++];
  return `${kind}-${++idCounter}`;
};
const store = context.ELV2_createInMemoryStore();
const concurrencyGuard = context.ELV2_createConcurrencyGuard(context.ELV2_createSynchronousTestLockAdapter());
const clock = { nowMs: () => now };
const roomEngine = context.ELV2_createRoomEngine({
  store, clock, concurrencyGuard, idFactory, roomCodeFactory: () => 'LAB-SO-V2'
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

let room = roomEngine.createRoom(teacher, { group_id: 'GROUP-A', title: 'Sentence Order v2' });
roomEngine.joinRoom(studentA, { room_code: room.room_code });
roomEngine.joinRoom(studentB, { room_code: room.room_code }); // SALA_MIXTA stays valid.
room = roomEngine.startRoom(teacher, room.room_id, 2);
assert.equal(room.state_revision, 3);

let prepared = roundEngine.prepareRound(teacher, {
  room_id: room.room_id,
  expected_revision: 3,
  game_id: 'SENTENCE_ORDER',
  content_ref: 'APOLLO_PLAY_V1:B1:B1-U01:SENTENCE_ORDER',
  content_version: 'APOLLO_PLAY_V1',
  resolved_content: content,
  settings: { item_index: 1 }
});
assert.equal(prepared.round.status, 'READY');
assert.equal(prepared.round.game_id, 'SENTENCE_ORDER');
assert.equal(prepared.round.private_state.answer_sentence, 'My name is learner1.');
assert.deepEqual([...prepared.round.private_state.solution_token_ids], gameTokenFixtures);
assert.equal(prepared.round.scoring_policy, 'SCORE_ON_REVEAL');

const readyView = roundEngine.buildStudentGameView(prepared.round, studentA);
assert.equal(readyView.has_submitted, false);
assert.equal(Object.prototype.hasOwnProperty.call(readyView, 'answer_sentence'), false);
assert.equal(Object.prototype.hasOwnProperty.call(readyView, 'answer_token_ids'), false);

let opened = roundEngine.openRound(teacher, {
  room_id: room.room_id,
  round_id: prepared.round.round_id,
  expected_revision: 4,
  duration_ms: 10_000
});
const openView = roundEngine.buildStudentGameView(opened.round, studentA);
assert.equal(context.ELV2_assertNoForbiddenPublicKeys(openView, 'OPEN'), true);

const correctOrder = opened.round.private_state.solution_token_ids.slice();
const wrongOrder = opened.round.private_state.display_tokens.map(token => token.token_id);
assert.notDeepEqual(wrongOrder, correctOrder);

const resultA = roundEngine.submitAttempt(studentA, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  request_id: 'REQ-SO-A-1',
  client_seen_revision: 5,
  attempt: { action_type: 'SUBMIT_ORDER', token_ids: correctOrder }
});
assert.equal(resultA.attempt.points_delta, 10);
assert.equal(resultA.attempt.score_status, 'HIDDEN');
assert.equal(resultA.player.score_total, 0, 'private-response score must stay hidden until REVEAL');
assert.equal(resultA.view.has_submitted, true);
assert.equal(Object.prototype.hasOwnProperty.call(resultA.view, 'viewer_result'), false);
assert.equal(Object.prototype.hasOwnProperty.call(resultA.view, 'answer_token_ids'), false);

const replayA = roundEngine.submitAttempt(studentA, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  request_id: 'REQ-SO-A-1',
  client_seen_revision: 999,
  attempt: { action_type: 'SUBMIT_ORDER', token_ids: correctOrder }
});
assert.equal(replayA.replayed, true);
assert.equal(replayA.attempt.attempt_id, resultA.attempt.attempt_id);
assert.equal(store.listAttemptsByRound(opened.round.round_id).length, 1);

assert.throws(() => roundEngine.submitAttempt(studentA, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  request_id: 'REQ-SO-A-2',
  attempt: { action_type: 'SUBMIT_ORDER', token_ids: wrongOrder }
}), /ELV2_ALREADY_SUBMITTED/);
assert.equal(store.listAttemptsByRound(opened.round.round_id).length, 1);

const forged = wrongOrder.slice();
forged[0] = 'forged-token';
assert.throws(() => game.applyAttempt(opened.round.private_state, {
  action_type: 'SUBMIT_ORDER', token_ids: forged
}, { student_id: 'ATTACKER' }, {}), /ELV2_INVALID_SELECTION/);

const resultB = roundEngine.submitAttempt(studentB, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  request_id: 'REQ-SO-B-1',
  client_seen_revision: 6,
  attempt: { action_type: 'SUBMIT_ORDER', token_ids: wrongOrder }
});
assert.equal(resultB.attempt.points_delta, 0);
assert.equal(resultB.attempt.score_status, 'HIDDEN');
assert.equal(resultB.player.score_total, 0);
assert.equal(game.isComplete(store.getRound(opened.round.round_id).private_state, {
  active_student_ids: ['STU-A', 'STU-B']
}), true);

const locked = roundEngine.lockRound(teacher, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  expected_revision: 7
});
const lockedView = roundEngine.buildStudentGameView(locked.round, studentA);
assert.equal(Object.prototype.hasOwnProperty.call(lockedView, 'answer_sentence'), false);
assert.equal(Object.prototype.hasOwnProperty.call(lockedView, 'answer_token_ids'), false);
assert.equal(context.ELV2_assertNoForbiddenPublicKeys(lockedView, 'LOCKED'), true);

now = 12_000;
const revealed = roundEngine.revealRound(teacher, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  expected_revision: 8,
  reveal_duration_ms: 3_000
});
assert.equal(store.getPlayerByRoomStudent(room.room_id, 'STU-A').score_total, 10);
assert.equal(store.getPlayerByRoomStudent(room.room_id, 'STU-B').score_total, 0);
const revealA = roundEngine.buildStudentGameView(revealed.round, studentA);
assert.equal(revealA.answer_sentence, 'My name is learner1.');
assert.deepEqual([...revealA.answer_token_ids], correctOrder);
assert.equal(revealA.viewer_result.is_correct, true);
assert.equal(revealA.viewer_result.points_awarded, 10);
assert.equal(context.ELV2_assertPublicViewSafe(revealA, 'REVEAL', game.publicSchema(studentViewer, 'REVEAL', {})), true);

const projector = { student_id: null, view_mode: 'PROJECTOR' };
const projectorReveal = game.publicView(revealed.round.private_state, projector, 'REVEAL', {});
assert.equal(projectorReveal.answer_sentence, 'My name is learner1.');
assert.equal(Object.prototype.hasOwnProperty.call(projectorReveal, 'viewer_result'), false);
assert.equal(context.ELV2_assertPublicViewSafe(projectorReveal, 'REVEAL', game.publicSchema(projector, 'REVEAL', {})), true);

const pluginSource = fs.readFileSync(path.join(sourceDir, '27_SentenceOrderGame.js'), 'utf8');
for (const forbidden of ['SpreadsheetApp', 'LockService', 'PropertiesService', 'UrlFetchApp', 'Utilities', 'Session']) {
  assert.equal(pluginSource.includes(forbidden), false, `Sentence Order plugin must not access ${forbidden}`);
}

console.log(JSON.stringify({
  ok: true,
  gate: 'E6-SENTENCE_ORDER',
  game_id: 'SENTENCE_ORDER',
  private_response: true,
  score_on_reveal: true,
  opaque_server_tokens: true,
  mixed_room_regression: true,
  writes_external: 0
}));
