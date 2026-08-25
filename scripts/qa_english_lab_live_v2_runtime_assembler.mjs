import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'AppsScript', 'EnglishLabLiveV2');
const files = [
  '00_Constants.js', '01_Clock.js', '02_CanonicalJson.js', '04_StateMachine.js', '05_Idempotency.js',
  '06_PublicViewGuard.js', '07_GameRegistry.js', '09_Authorization.js', '10_InMemoryStore.js',
  '11_RoomEngine.js', '12_ConcurrencyGuard.js', '13_RoundEngine.js', '15_IdempotencyService.js',
  '17_RoundLifecycle.js', '18_StateService.js', '19_RequestValidation.js', '20_ContentResolver.js',
  '21_Dispatcher.js', '22_CampusAuthAdapter.js', '23_SheetsStore.js', '24_RuntimeLockAdapters.js',
  '25_RuntimeAssembler.js'
];
const context = vm.createContext({ console, Object, Array, JSON, String, Error, Number, Date, RegExp, isFinite });
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

const sessions = {
  teacher: { ok: true, rol: 'teacher', usuario: 'teacher-1', nombre: 'Teacher One' },
  student: { ok: true, rol: 'student', codigo: 'STU-B', nombre: 'Bruno', grupo: 'GROUP-B' },
  admin: { ok: true, rol: 'admin', usuario: 'admin-1', nombre: 'Admin One' }
};
const authAdapter = context.ELV2_createCampusAuthAdapter({
  validateSession: (token) => sessions[token] || null,
  getStrictStudentEnrollments: (code) => code === 'STU-B' ? [{ group_id: 'GROUP-B', level: 'B1' }] : [],
  getTeacherGroupsForSession: (session) => session.usuario === 'teacher-1' ? [{ grupo: 'GROUP-A' }] : [],
  getActiveGroupIds: () => ['GROUP-A', 'GROUP-B', 'GROUP-Z'],
  stableUserIdForSession: (session, role) => `${role}:${session.codigo || session.usuario}`
});

const store = context.ELV2_createInMemoryStore();
const idempotencyStore = context.ELV2_createInMemoryIdempotencyStore();
let now = 1000;
let idCounter = 0;
let roomCodeCounter = 0;
let traceCounter = 0;
const clock = { nowMs: () => now };
const concurrencyGuard = context.ELV2_createConcurrencyGuard(context.ELV2_createSynchronousTestLockAdapter());
const mutationGuard = context.ELV2_createExclusiveMutationGuard(context.ELV2_createSynchronousTestLockAdapter());
const payloadHasher = (value) => context.ELV2_canonicalJson(value);
const runtimeDeps = {
  store,
  idempotencyStore,
  authAdapter,
  contentSource: context.ELV2_createInMemoryContentSource({}),
  clock,
  concurrencyGuard,
  idempotencyMutationGuard: mutationGuard,
  idFactory: (kind) => `${kind}-${++idCounter}`,
  roomCodeFactory: () => `LAB-E4-${++roomCodeCounter}`,
  payloadHasher,
  keyHasher: payloadHasher,
  traceIdFactory: () => `trace-${++traceCounter}`
};

let runtime = context.ELV2_createRuntime(runtimeDeps);
assert.equal(store.listRoundsByRoom('missing').length, 0, 'runtime construction must not create domain data');
assert.throws(() => runtime.initializeSchema({}), /ELV2_SCHEMA_INITIALIZER_UNAVAILABLE/);

const createTeacherRoom = {
  token: 'teacher',
  api_version: 'english_lab_live.v2',
  action: 'createRoom',
  request_id: 'REQ-CREATE-A',
  payload: { group_id: 'GROUP-A', title: 'Teacher room', config: {} }
};
let response = runtime.dispatchTransport(createTeacherRoom);
assert.equal(response.ok, true);
assert.equal(response.data.replayed, false);
const roomId = response.data.effect.id;
assert.equal(store.getRoom(roomId).host_group_id, 'GROUP-A');
assert.equal(store.getRoom(roomId).owner_user_id, 'teacher:teacher-1');

// Reconstruct the runtime over the same stores: committed idempotency must survive composition reload.
runtime = context.ELV2_createRuntime(runtimeDeps);
response = runtime.dispatchTransport(createTeacherRoom);
assert.equal(response.ok, true);
assert.equal(response.data.replayed, true);
assert.equal(response.data.effect.id, roomId);
assert.equal(roomCodeCounter, 1, 'replay must not execute room creation again');

response = runtime.dispatchTransport({
  token: 'teacher', api_version: 'english_lab_live.v2', action: 'createRoom', request_id: 'REQ-FOREIGN',
  payload: { group_id: 'GROUP-Z', title: 'Forbidden', config: {} }
});
assert.equal(response.ok, false);
assert.equal(response.error.code, 'FORBIDDEN');
assert.equal(roomCodeCounter, 1, 'forbidden group must fail before room mutation');

// Admin can create for a canonical active group outside the teacher's own scope.
response = runtime.dispatchTransport({
  token: 'admin', api_version: 'english_lab_live.v2', action: 'createRoom', request_id: 'REQ-ADMIN',
  payload: { group_id: 'GROUP-Z', title: 'Admin room', config: {} }
});
assert.equal(response.ok, true);
assert.equal(store.getRoom(response.data.effect.id).host_group_id, 'GROUP-Z');

// SALA_MIXTA: active student GROUP-B can join teacher room hosted by GROUP-A.
response = runtime.dispatchTransport({
  token: 'student', api_version: 'english_lab_live.v2', action: 'joinRoom', request_id: 'REQ-JOIN',
  room_id: roomId, payload: {}
});
assert.equal(response.ok, true);
assert.equal(response.view.room.host_group_id, 'GROUP-A');
assert.equal(store.getPlayerByRoomStudent(roomId, 'STU-B').home_group_id_snapshot, 'GROUP-B');

// Transport preserves forged/unknown fields so RequestValidation rejects them.
response = runtime.dispatchTransport({
  token: 'student', api_version: 'english_lab_live.v2', action: 'joinRoom', request_id: 'REQ-FORGED',
  room_id: roomId, payload: {}, user_id: 'FORGED'
});
assert.equal(response.ok, false);
assert.equal(response.error.code, 'INVALID_REQUEST');

response = runtime.dispatchTransport({
  api_version: 'english_lab_live.v2', action: 'joinRoom', request_id: 'REQ-NO-TOKEN', room_id: roomId, payload: {}
});
assert.equal(response.ok, false);
assert.equal(response.error.code, 'AUTH_REQUIRED');

// Apps Script runtime construction is inert: opening the workbook is allowed; no sheet creation/write occurs.
let openCalls = 0;
let insertCalls = 0;
context.SpreadsheetApp = {
  openById(id) {
    openCalls += 1;
    assert.equal(id, 'QA-SYNTHETIC-SPREADSHEET');
    return {
      getSheetByName() { return null; },
      insertSheet() { insertCalls += 1; throw new Error('unexpected write during construction'); }
    };
  }
};
context.LockService = {
  getScriptLock() {
    return { tryLock: () => true, releaseLock: () => {} };
  }
};
let uuidCounter = 0;
context.Utilities = {
  DigestAlgorithm: { SHA_256: 'SHA_256' },
  Charset: { UTF_8: 'UTF_8' },
  getUuid: () => `00000000-0000-4000-8000-${String(++uuidCounter).padStart(12, '0')}`,
  computeDigest: (_algorithm, text) => Array.from(Buffer.from(String(text))).slice(0, 16),
  base64EncodeWebSafe: (bytes) => Buffer.from(bytes).toString('base64url')
};
const appsRuntime = context.ELV2_createAppsScriptRuntime({
  spreadsheet_id: 'QA-SYNTHETIC-SPREADSHEET',
  content_source: { getByRef: () => null },
  auth_adapter: authAdapter
});
assert.equal(typeof appsRuntime.dispatchTransport, 'function');
assert.equal(typeof appsRuntime.initializeSchema, 'function');
assert.equal(openCalls, 1);
assert.equal(insertCalls, 0, 'Apps Script runtime construction must never initialize schema implicitly');

console.log('ELV2 RUNTIME ASSEMBLER E4 PASS');
