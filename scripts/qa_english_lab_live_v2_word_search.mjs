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
  '11_RoomEngine.js', '12_ConcurrencyGuard.js', '13_RoundEngine.js', '30_WordSearchGame.js'
];
const context = vm.createContext({
  console, Object, Array, JSON, String, Error, Number, RegExp, isFinite, Math
});
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

context.ELV2_clearGameRegistryForTests_();
const metadata = context.ELV2_registerGamePlugin(context.ELV2_WordSearchGame);
assert.equal(metadata.game_id, 'WORD_SEARCH');
assert.deepEqual([...context.ELV2_listGameIds()], ['WORD_SEARCH']);
const game = context.ELV2_getGamePlugin('WORD_SEARCH');

const labels = ['HELLO', 'NUMBER', 'PHONE', 'EMAIL', 'FRIEND', 'TEACHER', 'STUDENT', 'SCHOOL', 'GOODBYE', 'COUNTRY'];
const content = {
  content_type: 'VOCABULARY_SET',
  source_id: 'APOLLO_G3/ACADEMIA_PLAY_BANK',
  level_id: 'B1',
  unit_id: 'B1-U01',
  curriculum: { level_id: 'B1', unit_id: 'B1-U01', status: 'ACTIVE' },
  items: labels.map((label, index) => ({
    play_item_id: `VOC-${index + 1}`,
    source_item_id: `VOC-SRC-${index + 1}`,
    template_id: index < 5 ? 'VOCAB_01' : 'VOCAB_02',
    item_type: index < 5 ? 'MCQ' : 'MATCH',
    label,
    hint_es: `Pista ${index + 1}`
  }))
};

assert.equal(game.validateContent(content), true);
assert.equal(game.validateSettings({}), true);
assert.throws(() => game.validateSettings({ size: 20 }), /ELV2_SETTINGS_INVALID/);
assert.throws(() => game.validateContent({ ...content, items: content.items.slice(0, 9) }), /ELV2_CONTENT_INVALID/);
const duplicateTokenContent = JSON.parse(JSON.stringify(content));
duplicateTokenContent.items[9].label = 'HELLO';
assert.throws(() => game.validateContent(duplicateTokenContent), /ELV2_CONTENT_INVALID/);
assert.throws(() => game.validateAttempt({
  action_type: 'CLAIM_PATH', start_row: 0, start_col: 0, end_row: 0, end_col: 4, word_id: 'forged'
}), /ELV2_ATTEMPT_INVALID/);
assert.throws(() => game.validateAttempt({
  action_type: 'CLAIM_PATH', start_row: 0, start_col: 0, end_row: 1, end_col: 3
}), /ELV2_ATTEMPT_INVALID/);

let directOpaque = 0;
const directCreated = game.createRound(content, {}, {
  opaque_id_factory: () => `opaque-direct-${++directOpaque}`
});
assert.equal(directCreated.scoring_policy, 'SCORE_IMMEDIATE_PUBLIC');
assert.equal(directCreated.visibility_model, 'SHARED_BOARD');
assert.equal(directCreated.submission_policy, 'MULTI_ACTION');
assert.equal(context.ELV2_validateCreatedRoundContract(directCreated), true);
assert.equal(directCreated.private_state.grid.length, 14);
assert.equal(directCreated.private_state.grid.every(row => row.length === 14), true);
assert.equal(directCreated.private_state.words.length, 10);
assert.equal(Object.keys(directCreated.private_state.placements).length, 10);
for (const word of directCreated.private_state.words) {
  assert.equal(context.ELV2_wsOccurrences_(directCreated.private_state.grid, word.grid_word).length, 1);
  const placement = directCreated.private_state.placements[word.target_id];
  const spelled = placement.cells.map(cell => directCreated.private_state.grid[cell.row][cell.col]).join('');
  assert.equal(spelled, word.grid_word);
}

const studentViewer = { student_id: 'STU-A', view_mode: 'STUDENT' };
const directOpen = game.publicView(directCreated.private_state, studentViewer, 'OPEN', {});
assert.equal(directOpen.grid_size, 14);
assert.equal(directOpen.claimed_count, 0);
assert.equal(Object.prototype.hasOwnProperty.call(directOpen, 'revealed_paths'), false);
assert.equal(Object.prototype.hasOwnProperty.call(directOpen, 'placements'), false);
assert.equal(JSON.stringify(directOpen).includes('VOC-SRC-'), false);
assert.equal(context.ELV2_assertPublicViewSafe(directOpen, 'OPEN', game.publicSchema(studentViewer, 'OPEN', {})), true);

// Full Core integration: server-generated board, path-only claims, first-claim-wins, mixed room.
let now = 1_000;
let idCounter = 0;
let gameTokenCounter = 0;
const idFactory = kind => kind === 'game_token' ? `game-opaque-${++gameTokenCounter}` : `${kind}-${++idCounter}`;
const store = context.ELV2_createInMemoryStore();
const concurrencyGuard = context.ELV2_createConcurrencyGuard(context.ELV2_createSynchronousTestLockAdapter());
const clock = { nowMs: () => now };
const roomEngine = context.ELV2_createRoomEngine({
  store, clock, concurrencyGuard, idFactory, roomCodeFactory: () => 'LAB-WS-V2'
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

let room = roomEngine.createRoom(teacher, { group_id: 'GROUP-A', title: 'Word Search v2' });
roomEngine.joinRoom(studentA, { room_code: room.room_code });
roomEngine.joinRoom(studentB, { room_code: room.room_code });
room = roomEngine.startRoom(teacher, room.room_id, 2);
assert.equal(room.state_revision, 3);

let prepared = roundEngine.prepareRound(teacher, {
  room_id: room.room_id,
  expected_revision: 3,
  game_id: 'WORD_SEARCH',
  content_ref: 'APOLLO_PLAY_V1:B1:B1-U01:VOCABULARY',
  content_version: 'APOLLO_PLAY_V1',
  resolved_content: content,
  settings: {}
});
assert.equal(prepared.round.status, 'READY');
assert.equal(prepared.round.game_id, 'WORD_SEARCH');
assert.equal(prepared.round.private_state.grid.length, 14);
assert.equal(prepared.round.private_state.claimed_count, 0);
assert.equal(prepared.round.scoring_policy, 'SCORE_IMMEDIATE_PUBLIC');

let opened = roundEngine.openRound(teacher, {
  room_id: room.room_id,
  round_id: prepared.round.round_id,
  expected_revision: 4,
  duration_ms: 180_000
});
const openBefore = roundEngine.buildStudentGameView(opened.round, studentA);
assert.equal(openBefore.claimed_count, 0);
assert.equal(Object.prototype.hasOwnProperty.call(openBefore, 'revealed_paths'), false);
assert.equal(JSON.stringify(openBefore).includes('STU-A'), false);
assert.equal(context.ELV2_assertNoForbiddenPublicKeys(openBefore, 'OPEN'), true);

function claimAttempt(placement, reverse = false) {
  const cells = placement.cells;
  const first = reverse ? cells[cells.length - 1] : cells[0];
  const last = reverse ? cells[0] : cells[cells.length - 1];
  return {
    action_type: 'CLAIM_PATH',
    start_row: first.row,
    start_col: first.col,
    end_row: last.row,
    end_col: last.col
  };
}

let currentRound = store.getRound(opened.round.round_id);
const firstTarget = currentRound.private_state.words[0];
const firstPlacement = currentRound.private_state.placements[firstTarget.target_id];
const firstAttempt = claimAttempt(firstPlacement, true); // reversed endpoints must remain valid.
const resultA = roundEngine.submitAttempt(studentA, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  request_id: 'REQ-WS-A-1',
  client_seen_revision: 5,
  attempt: firstAttempt
});
assert.equal(resultA.replayed, false);
assert.equal(resultA.attempt.points_delta, 10);
assert.equal(resultA.attempt.score_status, 'COMMITTED');
assert.equal(resultA.player.score_total, 10);
assert.equal(resultA.view.claimed_count, 1);
assert.equal(resultA.view.words.filter(word => word.claimed).length, 1);
assert.equal(Object.prototype.hasOwnProperty.call(resultA.view, 'revealed_paths'), false);
assert.equal(JSON.stringify(resultA.view).includes('STU-A'), false);

const replayA = roundEngine.submitAttempt(studentA, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  request_id: 'REQ-WS-A-1',
  client_seen_revision: 999,
  attempt: firstAttempt
});
assert.equal(replayA.replayed, true);
assert.equal(replayA.attempt.attempt_id, resultA.attempt.attempt_id);
assert.equal(store.listAttemptsByRound(opened.round.round_id).length, 1);

assert.throws(() => roundEngine.submitAttempt(studentB, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  request_id: 'REQ-WS-B-DUPLICATE',
  attempt: claimAttempt(firstPlacement, false)
}), /ELV2_ALREADY_CLAIMED/);
assert.equal(store.listAttemptsByRound(opened.round.round_id).length, 1);

assert.throws(() => roundEngine.submitAttempt(studentB, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  request_id: 'REQ-WS-B-FORGED',
  attempt: { action_type: 'CLAIM_PATH', start_row: 0, start_col: 0, end_row: 0, end_col: 2 }
}), /ELV2_INVALID_SELECTION/);
assert.equal(store.listAttemptsByRound(opened.round.round_id).length, 1);

for (let index = 1; index < 10; index += 1) {
  currentRound = store.getRound(opened.round.round_id);
  const target = currentRound.private_state.words[index];
  const placement = currentRound.private_state.placements[target.target_id];
  const actor = index % 2 === 0 ? studentA : studentB;
  const result = roundEngine.submitAttempt(actor, {
    room_id: room.room_id,
    round_id: opened.round.round_id,
    request_id: `REQ-WS-${index + 1}`,
    attempt: claimAttempt(placement, index % 3 === 0)
  });
  assert.equal(result.attempt.points_delta, 10);
  assert.equal(result.attempt.score_status, 'COMMITTED');
}

currentRound = store.getRound(opened.round.round_id);
assert.equal(currentRound.private_state.claimed_count, 10);
assert.equal(game.isComplete(currentRound.private_state, {}), true);
assert.equal(store.listAttemptsByRound(opened.round.round_id).length, 10);
assert.equal(store.getRoom(room.room_id).state_revision, 15);
assert.equal(store.getPlayerByRoomStudent(room.room_id, 'STU-A').score_total, 50);
assert.equal(store.getPlayerByRoomStudent(room.room_id, 'STU-B').score_total, 50);
const completedOpen = roundEngine.buildStudentGameView(currentRound, studentA);
assert.equal(completedOpen.completed, true);
assert.equal(completedOpen.claimed_count, 10);
assert.equal(Object.prototype.hasOwnProperty.call(completedOpen, 'revealed_paths'), false);

assert.throws(() => roundEngine.submitAttempt(studentA, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  request_id: 'REQ-WS-A-AFTER-COMPLETE',
  attempt: firstAttempt
}), /ELV2_ROUND_NOT_OPEN/);

const locked = roundEngine.lockRound(teacher, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  expected_revision: 15
});
assert.equal(locked.room.state_revision, 16);
const lockedView = roundEngine.buildStudentGameView(locked.round, studentB);
assert.equal(Object.prototype.hasOwnProperty.call(lockedView, 'revealed_paths'), false);
assert.equal(context.ELV2_assertNoForbiddenPublicKeys(lockedView, 'LOCKED'), true);

now = 200_000;
const revealed = roundEngine.revealRound(teacher, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  expected_revision: 16,
  reveal_duration_ms: 5_000
});
assert.equal(revealed.room.state_revision, 17);
const revealView = roundEngine.buildStudentGameView(revealed.round, studentA);
assert.equal(revealView.revealed_paths.length, 10);
for (const path of revealView.revealed_paths) assert.ok(path.cells.length >= 3 && path.cells.length <= 14);
assert.equal(context.ELV2_assertPublicViewSafe(revealView, 'REVEAL', game.publicSchema(studentViewer, 'REVEAL', {})), true);
assert.equal(JSON.stringify(revealView).includes('STU-A'), false);
assert.equal(JSON.stringify(revealView).includes('VOC-SRC-'), false);

const pluginSource = fs.readFileSync(path.join(sourceDir, '30_WordSearchGame.js'), 'utf8');
for (const forbidden of ['SpreadsheetApp', 'LockService', 'PropertiesService', 'UrlFetchApp', 'Utilities', 'Session']) {
  assert.equal(pluginSource.includes(forbidden), false, `Word Search plugin must not access ${forbidden}`);
}

console.log(JSON.stringify({
  ok: true,
  gate: 'E6-WORD_SEARCH',
  game_id: 'WORD_SEARCH',
  grid_size: 14,
  targets: 10,
  path_only_claim: true,
  reversed_path_supported: true,
  first_claim_wins: true,
  shared_board: true,
  immediate_public_score: true,
  mixed_room_regression: true,
  writes_external: 0
}));
