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
  '11_RoomEngine.js', '12_ConcurrencyGuard.js', '13_RoundEngine.js', '29_QuizTimeGame.js'
];
const context = vm.createContext({ console, Object, Array, JSON, String, Error, Number, RegExp, isFinite });
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

context.ELV2_clearGameRegistryForTests_();
const metadata = context.ELV2_registerGamePlugin(context.ELV2_QuizTimeGame);
assert.equal(metadata.game_id, 'QUIZ_TIME');
assert.deepEqual([...context.ELV2_listGameIds()], ['QUIZ_TIME']);
const game = context.ELV2_getGamePlugin('QUIZ_TIME');

const specs = [
  ['VOCAB', 'VOCAB_01', 'MCQ'],
  ['GRAM', 'GRAM_01', 'MCQ'],
  ['SPEAK', 'SPEAK_02', 'MCQ'],
  ['LISTEN', 'LISTEN_01', 'DIALOGUE_MCQ'],
  ['READ', 'READ_01', 'READING_MCQ']
];
const content = {
  content_type: 'QUIZ_TIME_POOL',
  source_id: 'APOLLO_G3/ACADEMIA_PLAY_BANK',
  level_id: 'B1', unit_id: 'B1-U01',
  curriculum: { level_id: 'B1', unit_id: 'B1-U01', status: 'ACTIVE' },
  items: []
};
for (const [area, template, type] of specs) {
  for (let index = 1; index <= 5; index += 1) {
    const correct = ['A', 'B', 'C', 'D', 'A'][index - 1];
    content.items.push({
      play_item_id: `Q-${area}-${index}`,
      source_item_id: `Q-SRC-${area}-${index}`,
      area_id: area,
      template_id: template,
      item_type: type,
      prompt_es: 'Elegí la mejor respuesta.',
      stem: `${area} question ${index}`,
      mini_text_or_dialogue: (type === 'DIALOGUE_MCQ' || type === 'READING_MCQ') ? `${area} context ${index}` : '',
      options: [`${area}-${index}-A`, `${area}-${index}-B`, `${area}-${index}-C`, `${area}-${index}-D`],
      correct_option: correct,
      explanation_es: `${area} explanation ${index}`
    });
  }
}

assert.equal(game.validateContent(content), true);
assert.equal(game.validateSettings({}), true);
assert.throws(() => game.validateSettings({ item_index: 1 }), /ELV2_SETTINGS_INVALID/);
assert.throws(() => game.validateAttempt({ action_type: 'SELECT_OPTION', answers: [] }), /ELV2_ATTEMPT_INVALID/);
assert.throws(() => game.validateAttempt({ action_type: 'SUBMIT_QUIZ', answers: [] }), /ELV2_ATTEMPT_INVALID/);

let opaqueCounter = 0;
const directCreated = game.createRound(content, {}, {
  opaque_id_factory: () => `opaque-${String(++opaqueCounter).padStart(3, '0')}`
});
assert.equal(directCreated.scoring_policy, 'SCORE_ON_REVEAL');
assert.equal(directCreated.visibility_model, 'PRIVATE_RESPONSE');
assert.equal(directCreated.submission_policy, 'SINGLE_FINAL');
assert.equal(context.ELV2_validateCreatedRoundContract(directCreated), true);
assert.equal(directCreated.private_state.questions.length, 10);
assert.equal(new Set(directCreated.private_state.questions.map(q => q.question_id)).size, 10);
assert.equal(new Set(directCreated.private_state.questions.flatMap(q => q.options.map(o => o.option_id))).size, 40);
for (const area of specs.map(spec => spec[0])) {
  assert.equal(directCreated.private_state.questions.filter(q => q.area_id === area).length, 2);
}

const studentViewer = { student_id: 'STU-A', view_mode: 'STUDENT' };
const openDirect = game.publicView(directCreated.private_state, studentViewer, 'OPEN', {});
assert.equal(openDirect.question_count, 10);
assert.equal(openDirect.questions.length, 10);
assert.equal(openDirect.has_submitted, false);
assert.equal(openDirect.response_count, 0);
assert.equal(Object.prototype.hasOwnProperty.call(openDirect, 'answer_key'), false);
assert.equal(Object.prototype.hasOwnProperty.call(openDirect, 'viewer_result'), false);
assert.equal(context.ELV2_assertPublicViewSafe(openDirect, 'OPEN', game.publicSchema(studentViewer, 'OPEN', {})), true);
for (const question of openDirect.questions) {
  assert.equal(question.options.length, 4);
  assert.equal(Object.prototype.hasOwnProperty.call(question, 'correct_option_id'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(question, 'source_item_id'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(question, 'play_item_id'), false);
}

// Full Core integration: 10-question final submission, no score/correctness before REVEAL.
let now = 3_000;
let idCounter = 0;
const store = context.ELV2_createInMemoryStore();
const concurrencyGuard = context.ELV2_createConcurrencyGuard(context.ELV2_createSynchronousTestLockAdapter());
const clock = { nowMs: () => now };
const idFactory = kind => `${kind}-${++idCounter}`;
const roomEngine = context.ELV2_createRoomEngine({
  store, clock, concurrencyGuard, idFactory, roomCodeFactory: () => 'LAB-QUIZ-V2'
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

let room = roomEngine.createRoom(teacher, { group_id: 'GROUP-A', title: 'Quiz Time v2' });
roomEngine.joinRoom(studentA, { room_code: room.room_code });
roomEngine.joinRoom(studentB, { room_code: room.room_code });
room = roomEngine.startRoom(teacher, room.room_id, 2);
assert.equal(room.state_revision, 3);

let prepared = roundEngine.prepareRound(teacher, {
  room_id: room.room_id, expected_revision: 3,
  game_id: 'QUIZ_TIME', content_ref: 'APOLLO_PLAY_V1:B1:B1-U01:QUIZ_TIME',
  content_version: 'APOLLO_PLAY_V1', resolved_content: content, settings: {}
});
assert.equal(prepared.round.status, 'READY');
assert.equal(prepared.round.game_id, 'QUIZ_TIME');
assert.equal(prepared.round.scoring_policy, 'SCORE_ON_REVEAL');
assert.equal(prepared.round.private_state.questions.length, 10);
const readyView = roundEngine.buildStudentGameView(prepared.round, studentA);
assert.equal(Object.prototype.hasOwnProperty.call(readyView, 'answer_key'), false);
assert.equal(Object.prototype.hasOwnProperty.call(readyView, 'viewer_result'), false);

let opened = roundEngine.openRound(teacher, {
  room_id: room.room_id, round_id: prepared.round.round_id,
  expected_revision: 4, duration_ms: 60_000
});
const privateQuestions = opened.round.private_state.questions;
const correctAnswers = privateQuestions.map(question => ({
  question_id: question.question_id,
  option_id: question.correct_option_id
}));
const wrongAnswers = privateQuestions.map(question => ({
  question_id: question.question_id,
  option_id: question.options.find(option => option.option_id !== question.correct_option_id).option_id
}));

const forgedAnswers = correctAnswers.map(answer => ({ ...answer }));
forgedAnswers[0].option_id = 'forged-option';
assert.throws(() => roundEngine.submitAttempt(studentB, {
  room_id: room.room_id, round_id: opened.round.round_id,
  request_id: 'REQ-QUIZ-FORGED', client_seen_revision: 5,
  attempt: { action_type: 'SUBMIT_QUIZ', answers: forgedAnswers }
}), /ELV2_INVALID_SELECTION/);
assert.equal(store.listAttemptsByRound(opened.round.round_id).length, 0);
assert.equal(store.getRoom(room.room_id).state_revision, 5);

const resultA = roundEngine.submitAttempt(studentA, {
  room_id: room.room_id, round_id: opened.round.round_id,
  request_id: 'REQ-QUIZ-A-1', client_seen_revision: 5,
  attempt: { action_type: 'SUBMIT_QUIZ', answers: correctAnswers }
});
assert.equal(resultA.attempt.points_delta, 100);
assert.equal(resultA.attempt.score_status, 'HIDDEN');
assert.equal(resultA.player.score_total, 0);
assert.equal(resultA.view.has_submitted, true);
assert.equal(resultA.view.response_count, 1);
assert.equal(Object.prototype.hasOwnProperty.call(resultA.view, 'answer_key'), false);
assert.equal(Object.prototype.hasOwnProperty.call(resultA.view, 'viewer_result'), false);
assert.equal(context.ELV2_assertNoForbiddenPublicKeys(resultA.view, 'OPEN'), true);

const replayA = roundEngine.submitAttempt(studentA, {
  room_id: room.room_id, round_id: opened.round.round_id,
  request_id: 'REQ-QUIZ-A-1', client_seen_revision: 999,
  attempt: { action_type: 'SUBMIT_QUIZ', answers: correctAnswers }
});
assert.equal(replayA.replayed, true);
assert.equal(replayA.attempt.attempt_id, resultA.attempt.attempt_id);
assert.equal(store.listAttemptsByRound(opened.round.round_id).length, 1);
assert.equal(store.getPlayerByRoomStudent(room.room_id, 'STU-A').score_total, 0);

assert.throws(() => roundEngine.submitAttempt(studentA, {
  room_id: room.room_id, round_id: opened.round.round_id,
  request_id: 'REQ-QUIZ-A-2',
  attempt: { action_type: 'SUBMIT_QUIZ', answers: wrongAnswers }
}), /ELV2_ALREADY_SUBMITTED/);
assert.equal(store.listAttemptsByRound(opened.round.round_id).length, 1);

const resultB = roundEngine.submitAttempt(studentB, {
  room_id: room.room_id, round_id: opened.round.round_id,
  request_id: 'REQ-QUIZ-B-1', client_seen_revision: 6,
  attempt: { action_type: 'SUBMIT_QUIZ', answers: wrongAnswers }
});
assert.equal(resultB.attempt.points_delta, 0);
assert.equal(resultB.attempt.score_status, 'HIDDEN');
assert.equal(resultB.player.score_total, 0);
assert.equal(resultB.view.response_count, 2);
assert.equal(Object.prototype.hasOwnProperty.call(resultB.view, 'answer_key'), false);
assert.equal(game.isComplete(store.getRound(opened.round.round_id).private_state, {
  active_student_ids: ['STU-A', 'STU-B']
}), true);

const locked = roundEngine.lockRound(teacher, {
  room_id: room.room_id, round_id: opened.round.round_id, expected_revision: 7
});
const lockedA = roundEngine.buildStudentGameView(locked.round, studentA);
assert.equal(Object.prototype.hasOwnProperty.call(lockedA, 'answer_key'), false);
assert.equal(Object.prototype.hasOwnProperty.call(lockedA, 'viewer_result'), false);
assert.equal(context.ELV2_assertNoForbiddenPublicKeys(lockedA, 'LOCKED'), true);

now = 20_000;
const revealed = roundEngine.revealRound(teacher, {
  room_id: room.room_id, round_id: opened.round.round_id,
  expected_revision: 8, reveal_duration_ms: 5_000
});
assert.equal(store.getPlayerByRoomStudent(room.room_id, 'STU-A').score_total, 100);
assert.equal(store.getPlayerByRoomStudent(room.room_id, 'STU-B').score_total, 0);
for (const attempt of store.listAttemptsByRound(opened.round.round_id)) {
  assert.equal(attempt.score_status, 'COMMITTED');
}
const revealA = roundEngine.buildStudentGameView(revealed.round, studentA);
assert.equal(revealA.answer_key.length, 10);
assert.equal(revealA.viewer_result.correct_count, 10);
assert.equal(revealA.viewer_result.score, 100);
assert.equal(revealA.viewer_result.answers.every(answer => answer.is_correct === true), true);
assert.equal(context.ELV2_assertPublicViewSafe(revealA, 'REVEAL', game.publicSchema(studentViewer, 'REVEAL', {})), true);

const revealB = roundEngine.buildStudentGameView(revealed.round, studentB);
assert.equal(revealB.viewer_result.correct_count, 0);
assert.equal(revealB.viewer_result.score, 0);
const projector = { student_id: null, view_mode: 'PROJECTOR' };
const projectorReveal = game.publicView(revealed.round.private_state, projector, 'REVEAL', {});
assert.equal(projectorReveal.answer_key.length, 10);
assert.equal(Object.prototype.hasOwnProperty.call(projectorReveal, 'viewer_result'), false);

const pluginSource = fs.readFileSync(path.join(sourceDir, '29_QuizTimeGame.js'), 'utf8');
for (const forbidden of ['SpreadsheetApp', 'LockService', 'PropertiesService', 'UrlFetchApp', 'Utilities', 'Session']) {
  assert.equal(pluginSource.includes(forbidden), false, `Quiz Time plugin must not access ${forbidden}`);
}

console.log(JSON.stringify({
  ok: true,
  gate: 'E6-QUIZ_TIME',
  game_id: 'QUIZ_TIME',
  questions: 10,
  questions_per_area: 2,
  private_response: true,
  single_final: true,
  score_on_reveal: true,
  opaque_question_and_option_ids: true,
  mixed_room_regression: true,
  writes_external: 0
}));
