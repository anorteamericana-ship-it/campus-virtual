import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'AppsScript', 'EnglishLabLiveV2');
const files = ['00_Constants.js', '04_StateMachine.js', '09_Authorization.js', '10_InMemoryStore.js', '12_ConcurrencyGuard.js', '11_RoomEngine.js'];
const context = vm.createContext({ console, Object, Array, JSON, String, Error, isFinite, Number });
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

let now = 1000;
let idCounter = 0;
const store = context.ELV2_createInMemoryStore();
const concurrencyGuard = context.ELV2_createConcurrencyGuard(context.ELV2_createSynchronousTestLockAdapter());
const engine = context.ELV2_createRoomEngine({
  store,
  clock: { nowMs: () => now },
  concurrencyGuard,
  idFactory: (kind) => `${kind}-${++idCounter}`,
  roomCodeFactory: () => 'LAB-MIXED'
});

const teacher = {
  user_id: 'TEACHER-1', teacher_id: 'T-1', role: 'teacher',
  authorized_group_ids: ['GROUP-A'],
  capabilities: ['LIVE_CREATE', 'LIVE_VIEW', 'LIVE_CONTROL_OWN']
};
const admin = {
  user_id: 'ADMIN-1', role: 'admin', capabilities: ['LIVE_CONTROL_ANY']
};
const studentA = {
  user_id: 'USER-A', role: 'student', student_id: 'STU-A', display_name: 'Ana M.',
  home_group_id: 'GROUP-A', live_eligible: true, capabilities: ['LIVE_JOIN', 'LIVE_VIEW', 'LIVE_PLAY']
};
const studentB = {
  user_id: 'USER-B', role: 'student', student_id: 'STU-B', display_name: 'Bruno R.',
  home_group_id: 'GROUP-B', live_eligible: true, capabilities: ['LIVE_JOIN', 'LIVE_VIEW', 'LIVE_PLAY']
};
const blockedStudent = {
  user_id: 'USER-X', role: 'student', student_id: 'STU-X', display_name: 'Blocked',
  home_group_id: 'GROUP-X', live_eligible: false, capabilities: ['LIVE_JOIN']
};

assert.throws(
  () => engine.createRoom(teacher, { group_id: 'GROUP-B', title: 'Foreign group' }),
  /ELV2_FORBIDDEN:room_group/
);
assert.equal(store.findRoomByCode('LAB-MIXED'), null, 'unauthorized group create must have zero effect');

const room = engine.createRoom(teacher, { group_id: 'GROUP-A', title: 'Mixed class' });
assert.equal(room.status, 'LOBBY');
assert.equal(room.host_group_id, 'GROUP-A');
assert.equal(room.join_policy, 'MIXED_AUTHORIZED');
assert.equal(room.state_revision, 0);

const joinedA = engine.joinRoom(studentA, { room_code: 'LAB-MIXED', student_id: 'FORGED-STUDENT' });
assert.equal(joinedA.player.student_id, 'STU-A');
assert.equal(joinedA.player.display_name_snapshot, 'Ana M.');
assert.equal(joinedA.reconnected, false);
assert.equal(joinedA.room.state_revision, 1);

const joinedB = engine.joinRoom(studentB, { room_code: 'LAB-MIXED' });
assert.equal(joinedB.player.student_id, 'STU-B');
assert.equal(joinedB.player.home_group_id_snapshot, 'GROUP-B');
assert.equal(joinedB.room.host_group_id, 'GROUP-A', 'mixed-room join must not rewrite host group');
assert.equal(joinedB.reconnected, false);
assert.equal(joinedB.room.state_revision, 2);
assert.equal(store.listPlayersByRoom(room.room_id).length, 2);

assert.throws(() => engine.joinRoom(blockedStudent, { room_code: 'LAB-MIXED' }), /ELV2_ROOM_NOT_AVAILABLE/);
assert.equal(store.listPlayersByRoom(room.room_id).length, 2);

now = 2000;
const rejoinedA = engine.joinRoom({ ...studentA, display_name: 'FORGED-NAME?' }, { room_code: 'LAB-MIXED' });
assert.equal(rejoinedA.reconnected, true);
assert.equal(rejoinedA.player.player_id, joinedA.player.player_id);
assert.equal(rejoinedA.player.display_name_snapshot, 'Ana M.');
assert.equal(store.listPlayersByRoom(room.room_id).length, 2);
assert.equal(rejoinedA.room.state_revision, 2, 'reconnect must not create a visible room mutation');

assert.throws(() => engine.startRoom(studentA, room.room_id, 2), /ELV2_FORBIDDEN/);
assert.throws(() => engine.startRoom(teacher, room.room_id, 1), /ELV2_STATE_CHANGED/);
const started = engine.startRoom(teacher, room.room_id, 2);
assert.equal(started.status, 'LIVE');
assert.equal(started.state_revision, 3);

const foreignTeacher = {
  user_id: 'TEACHER-2', role: 'teacher', capabilities: ['LIVE_CONTROL_OWN']
};
assert.throws(() => context.ELV2_assertRoomController(foreignTeacher, started), /ELV2_FORBIDDEN/);
assert.equal(context.ELV2_assertRoomController(admin, started), true);

now = 3000;
const closed = engine.closeRoom(teacher, { room_id: room.room_id, expected_revision: 3, reason: 'E1_DONE' });
assert.equal(closed.room.status, 'CLOSED');
assert.equal(closed.room.state_revision, 4);
assert.equal(closed.room.close_reason, 'E1_DONE');
assert.throws(() => engine.joinRoom(studentA, { room_code: 'LAB-MIXED' }), /ELV2_ROOM_NOT_AVAILABLE/);
assert.throws(() => engine.startRoom(teacher, room.room_id, 4), /ELV2_INVALID_ROOM_TRANSITION/);

// A code collision is handled server-side and never surfaces to the teacher.
const collisionStore = context.ELV2_createInMemoryStore();
const collisionGuard = context.ELV2_createConcurrencyGuard(context.ELV2_createSynchronousTestLockAdapter());
const seedEngine = context.ELV2_createRoomEngine({
  store: collisionStore,
  clock: { nowMs: () => now },
  concurrencyGuard: collisionGuard,
  idFactory: () => 'room-seed',
  roomCodeFactory: () => 'LAB-DUP'
});
seedEngine.createRoom(teacher, { group_id: 'GROUP-A', title: 'Seed' });
let codeCalls = 0;
const retryEngine = context.ELV2_createRoomEngine({
  store: collisionStore,
  clock: { nowMs: () => now },
  concurrencyGuard: collisionGuard,
  idFactory: () => 'room-retry',
  roomCodeFactory: () => (++codeCalls === 1 ? 'LAB-DUP' : 'LAB-UNIQUE')
});
const retriedRoom = retryEngine.createRoom(teacher, { group_id: 'GROUP-A', title: 'Collision retry' });
assert.equal(retriedRoom.room_code, 'LAB-UNIQUE');
assert.equal(retriedRoom.host_group_id, 'GROUP-A');
assert.equal(codeCalls, 2);

// Teacher rehearsal/control mode intentionally remains valid with zero participants.
const emptyStore = context.ELV2_createInMemoryStore();
const emptyGuard = context.ELV2_createConcurrencyGuard(context.ELV2_createSynchronousTestLockAdapter());
const emptyEngine = context.ELV2_createRoomEngine({
  store: emptyStore,
  clock: { nowMs: () => now },
  concurrencyGuard: emptyGuard,
  idFactory: (kind) => `empty-${kind}`,
  roomCodeFactory: () => 'LAB-EMPTY'
});
const emptyRoom = emptyEngine.createRoom(teacher, { group_id: 'GROUP-A', title: 'Teacher rehearsal' });
assert.equal(emptyStore.listPlayersByRoom(emptyRoom.room_id).length, 0);
const emptyStarted = emptyEngine.startRoom(teacher, emptyRoom.room_id, 0);
assert.equal(emptyStarted.status, 'LIVE');
assert.equal(emptyStarted.state_revision, 1);

console.log('ELV2 ROOM ENGINE E1 PASS');
