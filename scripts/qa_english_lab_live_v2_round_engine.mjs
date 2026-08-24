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
  '06_PublicViewGuard.js', '07_GameRegistry.js', '08_ContractProbeGame.js',
  '09_Authorization.js', '10_InMemoryStore.js', '11_RoomEngine.js',
  '12_ConcurrencyGuard.js', '13_RoundEngine.js'
];
const context = vm.createContext({ console, Object, Array, JSON, String, Error, isFinite, Number });
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

context.ELV2_clearGameRegistryForTests_();
context.ELV2_registerGamePlugin(context.ELV2_ContractProbeGame, { test_only: true });

let now = 1_000;
let idCounter = 0;
const store = context.ELV2_createInMemoryStore();
const concurrencyGuard = context.ELV2_createConcurrencyGuard(context.ELV2_createSynchronousTestLockAdapter());
const deps = {
  store,
  clock: { nowMs: () => now },
  concurrencyGuard,
  idFactory: (kind) => `${kind}-${++idCounter}`,
  payloadHasher: (value) => context.ELV2_canonicalJson(value)
};
const roomEngine = context.ELV2_createRoomEngine({
  store,
  clock: deps.clock,
  idFactory: deps.idFactory,
  roomCodeFactory: () => 'LAB-ROUND'
});
const roundEngine = context.ELV2_createRoundEngine(deps);

const teacher = {
  user_id: 'TEACHER-1', teacher_id: 'T-1', role: 'teacher',
  capabilities: ['LIVE_CREATE', 'LIVE_VIEW', 'LIVE_CONTROL_OWN']
};
const studentA = {
  user_id: 'USER-A', role: 'student', student_id: 'STU-A', display_name: 'Ana M.',
  home_group_id: 'GROUP-A', live_eligible: true, capabilities: ['LIVE_JOIN', 'LIVE_VIEW', 'LIVE_PLAY']
};
const studentB = {
  user_id: 'USER-B', role: 'student', student_id: 'STU-B', display_name: 'Bruno R.',
  home_group_id: 'GROUP-B', live_eligible: true, capabilities: ['LIVE_JOIN', 'LIVE_VIEW', 'LIVE_PLAY']
};

let room = roomEngine.createRoom(teacher, { title: 'Round test' });
roomEngine.joinRoom(studentA, { room_code: room.room_code });
roomEngine.joinRoom(studentB, { room_code: room.room_code });
room = roomEngine.startRoom(teacher, room.room_id, 2);
assert.equal(room.state_revision, 3);

const content = {
  prompt: 'Choose A',
  options: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }],
  solution_option_id: 'A'
};
let prepared = roundEngine.prepareRound(teacher, {
  room_id: room.room_id,
  expected_revision: 3,
  game_id: 'CONTRACT_PROBE',
  content_ref: 'TEST:PROBE:1',
  content_version: 'fixture-1',
  resolved_content: content,
  settings: {}
});
assert.equal(prepared.round.status, 'READY');
assert.equal(prepared.room.state_revision, 4);
assert.equal(prepared.round.content_snapshot.solution_option_id, 'A');

let opened = roundEngine.openRound(teacher, {
  room_id: room.room_id,
  round_id: prepared.round.round_id,
  expected_revision: 4,
  duration_ms: 10_000
});
assert.equal(opened.round.status, 'OPEN');
assert.equal(opened.round.ends_at, 11_000);
assert.equal(opened.room.state_revision, 5);

let resultA = roundEngine.submitAttempt(studentA, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  request_id: 'REQ-A-1',
  client_seen_revision: 5,
  attempt: { action_type: 'SELECT_OPTION', option_id: 'A' }
});
assert.equal(resultA.replayed, false);
assert.equal(resultA.attempt.points_delta, 10);
assert.equal(resultA.attempt.score_status, 'HIDDEN');
assert.equal(resultA.player.score_total, 0, 'secret-dependent score must remain hidden during OPEN');
assert.equal(resultA.room.state_revision, 6);
assert.equal(Object.prototype.hasOwnProperty.call(resultA.view, 'solution_option_id'), false);

const replayA = roundEngine.submitAttempt(studentA, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  request_id: 'REQ-A-1',
  client_seen_revision: 5,
  attempt: { action_type: 'SELECT_OPTION', option_id: 'A' }
});
assert.equal(replayA.replayed, true);
assert.equal(replayA.attempt.attempt_id, resultA.attempt.attempt_id);
assert.equal(replayA.room.state_revision, 6, 'idempotent replay must not mutate room revision');
assert.equal(store.listAttemptsByRound(opened.round.round_id).length, 1);

assert.throws(() => roundEngine.submitAttempt(studentA, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  request_id: 'REQ-A-1',
  attempt: { action_type: 'SELECT_OPTION', option_id: 'B' }
}), /ELV2_REQUEST_ID_CONFLICT/);
assert.equal(store.listAttemptsByRound(opened.round.round_id).length, 1);

const resultB = roundEngine.submitAttempt(studentB, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  request_id: 'REQ-B-1',
  client_seen_revision: 6,
  attempt: { action_type: 'SELECT_OPTION', option_id: 'B' }
});
assert.equal(resultB.attempt.points_delta, 0);
assert.equal(resultB.attempt.score_status, 'HIDDEN');
assert.equal(resultB.room.state_revision, 7);
assert.equal(store.listAttemptsByRound(opened.round.round_id).length, 2);

now = 11_000;
assert.throws(() => roundEngine.submitAttempt(studentB, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  request_id: 'REQ-B-LATE',
  attempt: { action_type: 'SELECT_OPTION', option_id: 'A' }
}), /ELV2_DEADLINE_PASSED/);
assert.equal(store.listAttemptsByRound(opened.round.round_id).length, 2, 'late request must not create an attempt');
let lockedRound = store.getRound(opened.round.round_id);
let lockedRoom = store.getRoom(room.room_id);
assert.equal(lockedRound.status, 'LOCKED');
assert.equal(lockedRoom.state_revision, 8, 'deadline canonicalization is a visible state mutation');

now = 12_000;
const revealed = roundEngine.revealRound(teacher, {
  room_id: room.room_id,
  round_id: opened.round.round_id,
  expected_revision: 8,
  reveal_duration_ms: 3_000
});
assert.equal(revealed.round.status, 'REVEAL');
assert.equal(revealed.room.state_revision, 9);
assert.equal(store.getPlayerByRoomStudent(room.room_id, 'STU-A').score_total, 10);
assert.equal(store.getPlayerByRoomStudent(room.room_id, 'STU-B').score_total, 0);
for (const attempt of store.listAttemptsByRound(opened.round.round_id)) {
  assert.equal(attempt.score_status, 'COMMITTED');
  assert.equal(attempt.committed_at, 12_000);
}
const revealViewA = roundEngine.buildStudentGameView(store.getRound(opened.round.round_id), studentA);
assert.equal(revealViewA.solution_option_id, 'A');
assert.equal(revealViewA.viewer_result.is_correct, true);

assert.throws(() => concurrencyGuard.withRoomMutation(room.room_id, () => {
  return concurrencyGuard.withRoomMutation(room.room_id, () => true);
}), /ELV2_BUSY_RETRY/);

console.log('ELV2 ROUND ENGINE E1 PASS');
