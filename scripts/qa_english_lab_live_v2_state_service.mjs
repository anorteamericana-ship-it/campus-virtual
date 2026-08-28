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
  '06_PublicViewGuard.js', '07_GameRegistry.js', '08_ContractProbeGame.js', '09_Authorization.js',
  '10_InMemoryStore.js', '12_ConcurrencyGuard.js', '11_RoomEngine.js', '13_RoundEngine.js',
  '17_RoundLifecycle.js', '18_StateService.js'
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
const clock = { nowMs: () => now };
const idFactory = (kind) => `${kind}-${++idCounter}`;
const roomEngine = context.ELV2_createRoomEngine({ store, clock, concurrencyGuard, idFactory, roomCodeFactory: () => 'LAB-STATE' });
const roundEngine = context.ELV2_createRoundEngine({
  store, clock, concurrencyGuard, idFactory, payloadHasher: (value) => context.ELV2_canonicalJson(value), allowTestOnlyGames: true
});
const lifecycle = context.ELV2_createRoundLifecycleService({ store, clock, concurrencyGuard });
const stateService = context.ELV2_createStateService({ store, clock, concurrencyGuard, allowTestOnlyGames: true });

const teacher = {
  user_id: 'TEACHER-1', teacher_id: 'T-1', role: 'teacher',
  authorized_group_ids: ['GROUP-A'],
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
const content = {
  prompt: 'Choose A',
  options: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }],
  solution_option_id: 'A'
};

let room = roomEngine.createRoom(teacher, { group_id: 'GROUP-A', title: 'State test' });
assert.equal(room.host_group_id, 'GROUP-A');
const emptyLobby = stateService.getState(teacher, { room_id: room.room_id, view_mode: 'CONTROLLER' });
assert.equal(emptyLobby.participant_count, 0, 'teacher mode intentionally supports an empty lobby');
roomEngine.joinRoom(studentA, { room_code: room.room_code });
roomEngine.joinRoom(studentB, { room_code: room.room_code });
room = roomEngine.startRoom(teacher, room.room_id, 2);
let prepared = roundEngine.prepareRound(teacher, {
  room_id: room.room_id, expected_revision: 3, game_id: 'CONTRACT_PROBE',
  content_ref: 'TEST:STATE:1', resolved_content: content, settings: {}
});
let opened = roundEngine.openRound(teacher, {
  room_id: room.room_id, round_id: prepared.round.round_id, expected_revision: 4, duration_ms: 10_000
});
assert.equal(opened.room.state_revision, 5);

let studentState = stateService.getState(studentA, { room_id: room.room_id, view_mode: 'STUDENT' });
assert.equal(studentState.view_mode, 'STUDENT');
assert.equal(studentState.round.phase, 'OPEN');
assert.equal(studentState.player.display_name, 'Ana M.');
assert.equal(studentState.participant_count, 2, 'participant count must follow joined players after revision changes');
assert.equal(Object.prototype.hasOwnProperty.call(studentState.player, 'student_id'), false);
assert.equal(Object.prototype.hasOwnProperty.call(studentState.game, 'solution_option_id'), false);
assert.equal(studentState.leaderboard.length, 2);
assert.equal(Object.prototype.hasOwnProperty.call(studentState.leaderboard[0], 'student_id'), false);

assert.throws(() => stateService.getState(studentA, { room_id: room.room_id, view_mode: 'CONTROLLER' }), /ELV2_FORBIDDEN/);
const projector = stateService.getState(teacher, { room_id: room.room_id, view_mode: 'PROJECTOR' });
assert.equal(projector.player, null);
assert.equal(projector.round.phase, 'OPEN');
assert.equal(Object.prototype.hasOwnProperty.call(projector.game, 'solution_option_id'), false);

const unchanged = stateService.getState(studentA, { room_id: room.room_id, known_revision: 5 });
assert.equal(unchanged.unchanged, true);
assert.equal(unchanged.state_revision, 5);
assert.equal(Object.prototype.hasOwnProperty.call(unchanged, 'game'), false);

now = 11_000;
const projectedWhileBusy = concurrencyGuard.withRoomMutation(room.room_id, () =>
  stateService.getState(studentA, { room_id: room.room_id, known_revision: 5 })
);
assert.equal(projectedWhileBusy.unchanged, false);
assert.equal(projectedWhileBusy.round.phase, 'LOCKED');
assert.equal(projectedWhileBusy.state_revision, 6);
assert.equal(store.getRound(opened.round.round_id).status, 'OPEN', 'busy poll must not write while lock is held');
assert.equal(store.getRoom(room.room_id).state_revision, 5, 'busy poll must not persist projected revision');

studentState = stateService.getState(studentA, { room_id: room.room_id, known_revision: 5 });
assert.equal(studentState.unchanged, false);
assert.equal(studentState.round.phase, 'LOCKED');
assert.equal(studentState.state_revision, 6);
assert.equal(store.getRound(opened.round.round_id).status, 'LOCKED');
assert.equal(store.getRoom(room.room_id).state_revision, 6);
assert.equal(Object.prototype.hasOwnProperty.call(studentState.game, 'solution_option_id'), false);

now = 12_000;
let revealed = roundEngine.revealRound(teacher, {
  room_id: room.room_id, round_id: prepared.round.round_id, expected_revision: 6, reveal_duration_ms: 2_000
});
assert.equal(revealed.room.state_revision, 7);
studentState = stateService.getState(studentA, { room_id: room.room_id });
assert.equal(studentState.round.phase, 'REVEAL');
assert.equal(studentState.game.solution_option_id, 'A');

now = 14_000;
const autoClosed = stateService.getState(teacher, { room_id: room.room_id, view_mode: 'PROJECTOR' });
assert.equal(autoClosed.round.phase, 'CLOSED');
assert.equal(autoClosed.state_revision, 8);
assert.equal(store.getRoom(room.room_id).current_round_id, null);
assert.equal(store.getRoom(room.room_id).host_group_id, 'GROUP-A');
assert.equal(store.getRound(prepared.round.round_id).close_reason, 'REVEAL_DEADLINE');

prepared = roundEngine.prepareRound(teacher, {
  room_id: room.room_id, expected_revision: 8, game_id: 'CONTRACT_PROBE',
  content_ref: 'TEST:STATE:2', resolved_content: content, settings: {}
});
assert.equal(prepared.room.state_revision, 9);
const manualClosed = lifecycle.closeRound(teacher, {
  room_id: room.room_id, round_id: prepared.round.round_id, expected_revision: 9, reason: 'SKIPPED'
});
assert.equal(manualClosed.round.status, 'CLOSED');
assert.equal(manualClosed.round.close_reason, 'SKIPPED');
assert.equal(manualClosed.room.current_round_id, null);
assert.equal(manualClosed.room.state_revision, 10);

const nextPrepared = roundEngine.prepareRound(teacher, {
  room_id: room.room_id, expected_revision: 10, game_id: 'CONTRACT_PROBE',
  content_ref: 'TEST:STATE:3', resolved_content: content, settings: {}
});
assert.equal(nextPrepared.round.sequence_no, 3);
assert.equal(nextPrepared.room.state_revision, 11);

console.log('ELV2 STATE SERVICE E1 PASS');
