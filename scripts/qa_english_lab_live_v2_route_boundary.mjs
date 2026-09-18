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
  '11_RoomEngine.js', '12_ConcurrencyGuard.js', '13_RoundEngine.js', '15_IdempotencyService.js',
  '17_RoundLifecycle.js', '18_StateService.js', '19_RequestValidation.js', '20_ContentResolver.js',
  '21_Dispatcher.js', '22_CampusAuthAdapter.js', '24_RuntimeLockAdapters.js', '25_RuntimeAssembler.js',
  '32_CampusRouteBoundary.js'
];
const context = vm.createContext({ console, Object, Array, JSON, String, Error, Number, Date, RegExp, isFinite, Math });
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

const sessions = {
  teacher: { ok: true, rol: 'teacher', usuario: 'teacher-1', nombre: 'Teacher One' },
  student: { ok: true, rol: 'student', codigo: 'STU-B', nombre: 'Bruno', grupo: 'GROUP-B' }
};
const authAdapter = context.ELV2_createCampusAuthAdapter({
  validateSession: token => sessions[token] || null,
  getStrictStudentEnrollments: code => code === 'STU-B' ? [{ group_id: 'GROUP-B', level: 'B1' }] : [],
  getTeacherGroupsForSession: session => session.usuario === 'teacher-1' ? [{ grupo: 'GROUP-A' }] : [],
  getActiveGroupIds: () => ['GROUP-A', 'GROUP-B'],
  stableUserIdForSession: (session, role) => `${role}:${session.codigo || session.usuario}`
});

const store = context.ELV2_createInMemoryStore();
const idempotencyStore = context.ELV2_createInMemoryIdempotencyStore();
let idCounter = 0;
let traceCounter = 0;
const clock = { nowMs: () => 1000 };
const concurrencyGuard = context.ELV2_createConcurrencyGuard(context.ELV2_createSynchronousTestLockAdapter());
const mutationGuard = context.ELV2_createExclusiveMutationGuard(context.ELV2_createSynchronousTestLockAdapter());
const runtime = context.ELV2_createRuntime({
  store,
  idempotencyStore,
  authAdapter,
  contentSource: context.ELV2_createInMemoryContentSource({}),
  clock,
  concurrencyGuard,
  idempotencyMutationGuard: mutationGuard,
  idFactory: kind => `${kind}-${++idCounter}`,
  roomCodeFactory: () => 'LAB-E8-BOUNDARY',
  payloadHasher: value => context.ELV2_canonicalJson(value),
  keyHasher: value => context.ELV2_canonicalJson(value),
  traceIdFactory: () => `trace-${++traceCounter}`
});

let factoryCalls = 0;
const options = {
  runtime_factory: () => {
    factoryCalls += 1;
    return runtime;
  }
};

// Legacy and near-miss traffic must not be claimed and must not construct a v2 runtime.
for (const request of [
  null,
  {},
  { fn: 'iniciarSesion', usuario: 'legacy' },
  { api_version: 'english_lab_live.v1', action: 'joinRoom' },
  { api_version: 'english_lab_live.v2 ' },
  { API_VERSION: 'english_lab_live.v2' }
]) {
  const result = context.ELV2_tryHandleCampusPost(request, options);
  assert.equal(result.handled, false);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'response'), false);
}
const inherited = Object.create({ api_version: 'english_lab_live.v2' });
inherited.action = 'joinRoom';
assert.equal(context.ELV2_tryHandleCampusPost(inherited, options).handled, false, 'inherited api_version must never claim routing ownership');
assert.equal(factoryCalls, 0, 'non-v2 traffic must not construct runtime');

// Exact v2 owns the request even when malformed or unauthenticated; it never downgrades to legacy.
let result = context.ELV2_tryHandleCampusPost({
  api_version: 'english_lab_live.v2', action: 'joinRoom', request_id: 'REQ-NO-TOKEN', room_id: 'ROOM-X', payload: {}
}, options);
assert.equal(result.handled, true);
assert.equal(result.response.ok, false);
assert.equal(result.response.error.code, 'AUTH_REQUIRED');
assert.equal(factoryCalls, 1);

result = context.ELV2_tryHandleCampusPost({
  token: 'teacher', api_version: 'english_lab_live.v2', action: 'createRoom', request_id: 'REQ-FN',
  fn: 'iniciarSesion', payload: { group_id: 'GROUP-A', title: 'No downgrade' }
}, options);
assert.equal(result.handled, true);
assert.equal(result.response.ok, false);
assert.equal(result.response.error.code, 'INVALID_REQUEST');

result = context.ELV2_tryHandleCampusPost({
  token: 'teacher', api_version: 'english_lab_live.v2', action: 'createRoom', request_id: 'REQ-AUTH-SESSION',
  _auth_session: { rol: 'superadmin', usuario: 'forged' }, payload: { group_id: 'GROUP-A' }
}, options);
assert.equal(result.handled, true);
assert.equal(result.response.error.code, 'INVALID_REQUEST');

result = context.ELV2_tryHandleCampusPost({
  token: 'teacher', api_version: 'english_lab_live.v2', action: 'createRoom', request_id: 'REQ-USER-ID',
  user_id: 'forged-user', payload: { group_id: 'GROUP-A' }
}, options);
assert.equal(result.handled, true);
assert.equal(result.response.error.code, 'INVALID_REQUEST');

result = context.ELV2_tryHandleCampusPost({
  token: 'student', api_version: 'english_lab_live.v2', action: 'joinRoom', request_id: 'REQ-PAYLOAD-ID',
  room_id: 'ROOM-X', payload: { student_id: 'FORGED-STUDENT' }
}, options);
assert.equal(result.handled, true);
assert.equal(result.response.error.code, 'INVALID_REQUEST');

// A valid exact-v2 request passes through the established token -> AuthAdapter -> RequestValidation -> Dispatcher chain.
result = context.ELV2_tryHandleCampusPost({
  token: 'teacher', api_version: 'english_lab_live.v2', action: 'createRoom', request_id: 'REQ-CREATE',
  payload: { group_id: 'GROUP-A', title: 'Boundary room', config: {} }
}, options);
assert.equal(result.handled, true);
assert.equal(result.response.ok, true);
const roomId = result.response.data.effect.id;
assert.equal(store.getRoom(roomId).host_group_id, 'GROUP-A');
assert.equal(store.getRoom(roomId).owner_user_id, 'teacher:teacher-1');

// Runtime-construction failure still belongs to v2 and returns a safe envelope instead of falling through.
const constructionFailure = context.ELV2_tryHandleCampusPost({
  api_version: 'english_lab_live.v2', action: 'getState', room_id: 'ROOM-X', payload: {}
}, {
  runtime_factory: () => { throw new Error('sensitive runtime detail must not escape'); },
  clock: { nowMs: () => 7777 },
  trace_id_factory: () => 'trace-boundary-test'
});
assert.equal(constructionFailure.handled, true);
assert.equal(constructionFailure.response.ok, false);
assert.equal(constructionFailure.response.error.code, 'INTERNAL_ERROR');
assert.equal(constructionFailure.response.trace_id, 'trace-boundary-test');
assert.equal(constructionFailure.response.server_now, 7777);
assert.equal(JSON.stringify(constructionFailure.response).includes('sensitive runtime detail'), false);

const invalidRuntime = context.ELV2_tryHandleCampusPost({
  api_version: 'english_lab_live.v2', action: 'getState', room_id: 'ROOM-X', payload: {}
}, {
  runtime_factory: () => ({}),
  clock: { nowMs: () => 8888 },
  trace_id_factory: () => 'trace-invalid-runtime'
});
assert.equal(invalidRuntime.handled, true);
assert.equal(invalidRuntime.response.error.code, 'INTERNAL_ERROR');

const source = fs.readFileSync(path.join(sourceDir, '32_CampusRouteBoundary.js'), 'utf8');
assert.equal(/function\s+doPost\s*\(/.test(source), false, 'E8 must not own doPost yet');
assert.equal(/function\s+doGet\s*\(/.test(source), false, 'E8 must not own doGet');
for (const forbidden of ['SpreadsheetApp', 'LockService', 'PropertiesService', 'UrlFetchApp']) {
  assert.equal(source.includes(forbidden), false, `route boundary must not directly access ${forbidden}`);
}

console.log(JSON.stringify({
  ok: true,
  gate: 'E8-ROUTE_BOUNDARY',
  exact_api_version_only: true,
  malformed_v2_no_downgrade: true,
  legacy_passthrough: true,
  forged_identity_rejected_by_core: true,
  runtime_failure_owned_by_v2: true,
  router_global_modified: false,
  writes_external: 0
}));
