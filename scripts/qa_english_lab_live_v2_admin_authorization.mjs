import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'AppsScript', 'EnglishLabLiveV2');
const files = ['00_Constants.js', '04_StateMachine.js', '09_Authorization.js', '10_InMemoryStore.js', '12_ConcurrencyGuard.js', '11_RoomEngine.js'];
const context = vm.createContext({ console, Object, Array, JSON, String, Error, Number, isFinite });
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

let idCounter = 0;
const store = context.ELV2_createInMemoryStore();
const guard = context.ELV2_createConcurrencyGuard(context.ELV2_createSynchronousTestLockAdapter());
const engine = context.ELV2_createRoomEngine({
  store,
  clock: { nowMs: () => 1000 },
  concurrencyGuard: guard,
  idFactory: (kind) => `${kind}-${++idCounter}`,
  roomCodeFactory: (attempt) => `LAB-ADMIN-${attempt}`
});

const admin = {
  user_id: 'ADMIN-1',
  role: 'admin',
  capabilities: ['LIVE_VIEW', 'LIVE_CREATE', 'LIVE_CONTROL_ANY']
};
const teacher = {
  user_id: 'TEACHER-1',
  teacher_id: 'TEACHER-1',
  role: 'teacher',
  authorized_group_ids: ['GROUP-A'],
  capabilities: ['LIVE_VIEW', 'LIVE_CREATE', 'LIVE_CONTROL_OWN']
};

const adminRoom = engine.createRoom(admin, { group_id: 'GROUP-Z', title: 'Admin room' });
assert.equal(adminRoom.host_group_id, 'GROUP-Z');
assert.equal(adminRoom.owner_user_id, 'ADMIN-1');
assert.equal(adminRoom.owner_teacher_id, null);
assert.equal(adminRoom.join_policy, 'MIXED_AUTHORIZED');

assert.throws(
  () => engine.createRoom(teacher, { group_id: 'GROUP-Z', title: 'Forbidden teacher room' }),
  /ELV2_FORBIDDEN:room_group/
);
assert.throws(
  () => engine.createRoom(admin, { group_id: '', title: 'Missing group' }),
  /ELV2_FORBIDDEN:room_group/
);

console.log('ELV2 ADMIN CONTROL-ANY AUTHORIZATION PASS');
