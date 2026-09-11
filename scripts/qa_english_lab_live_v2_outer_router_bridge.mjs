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
  '32_CampusRouteBoundary.js', '33_CampusOuterRouterBridge.js'
];
const context = vm.createContext({ console, Object, Array, JSON, String, Error, Number, Date, RegExp, isFinite, Math });
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

const sessions = {
  teacher: { ok: true, rol: 'teacher', usuario: 'teacher-1', nombre: 'Teacher One' }
};
const authAdapter = context.ELV2_createCampusAuthAdapter({
  validateSession: token => sessions[token] || null,
  getStrictStudentEnrollments: () => [],
  getTeacherGroupsForSession: session => session.usuario === 'teacher-1' ? [{ grupo: 'GROUP-A' }] : [],
  getActiveGroupIds: () => ['GROUP-A'],
  stableUserIdForSession: session => `teacher:${session.usuario}`
});

const store = context.ELV2_createInMemoryStore();
const idempotencyStore = context.ELV2_createInMemoryIdempotencyStore();
let idCounter = 0;
const runtime = context.ELV2_createRuntime({
  store,
  idempotencyStore,
  authAdapter,
  contentSource: context.ELV2_createInMemoryContentSource({}),
  clock: { nowMs: () => 1000 },
  concurrencyGuard: context.ELV2_createConcurrencyGuard(context.ELV2_createSynchronousTestLockAdapter()),
  idempotencyMutationGuard: context.ELV2_createExclusiveMutationGuard(context.ELV2_createSynchronousTestLockAdapter()),
  idFactory: kind => `${kind}-${++idCounter}`,
  roomCodeFactory: () => 'LAB-E9-BRIDGE',
  payloadHasher: value => context.ELV2_canonicalJson(value),
  keyHasher: value => context.ELV2_canonicalJson(value),
  traceIdFactory: () => 'trace-e9'
});

let factoryCalls = 0;
let serializerCalls = 0;
let legacyCalls = 0;
let qaGuardCalls = 0;
const routeOptions = {
  runtime_factory: () => {
    factoryCalls += 1;
    return runtime;
  }
};
const serializer = value => {
  serializerCalls += 1;
  return JSON.stringify(value);
};

function simulatedOuterQaGuard(req, idsOk = true) {
  qaGuardCalls += 1;
  if (!idsOk) {
    return JSON.stringify({ ok: false, error: 'qa_ids_invalidos' });
  }
  const v2 = context.ELV2_tryHandleCampusPostAtOuterGuard(req, serializer, routeOptions);
  if (v2.handled) return v2.output;
  legacyCalls += 1;
  return JSON.stringify({ ok: true, legacy: true, fn: req && req.fn || '' });
}

// QA environment guard must run first and must prevent any v2 runtime construction.
let out = JSON.parse(simulatedOuterQaGuard({
  api_version: 'english_lab_live.v2', action: 'createRoom', request_id: 'REQ-BLOCKED', token: 'teacher',
  payload: { group_id: 'GROUP-A' }
}, false));
assert.equal(out.error, 'qa_ids_invalidos');
assert.equal(factoryCalls, 0);
assert.equal(serializerCalls, 0);
assert.equal(legacyCalls, 0);

// Legacy traffic falls through unchanged and must not construct the v2 runtime or invoke the serializer.
out = JSON.parse(simulatedOuterQaGuard({ fn: 'iniciarSesion', usuario: 'legacy' }, true));
assert.equal(out.legacy, true);
assert.equal(out.fn, 'iniciarSesion');
assert.equal(factoryCalls, 0);
assert.equal(serializerCalls, 0);
assert.equal(legacyCalls, 1);

// Exact v2 traffic is consumed before legacy routing and serialized exactly once.
out = JSON.parse(simulatedOuterQaGuard({
  api_version: 'english_lab_live.v2', action: 'createRoom', request_id: 'REQ-CREATE', token: 'teacher',
  payload: { group_id: 'GROUP-A', title: 'Outer bridge room', config: {} }
}, true));
assert.equal(out.ok, true);
assert.equal(factoryCalls, 1);
assert.equal(serializerCalls, 1);
assert.equal(legacyCalls, 1);

// Malformed exact-v2 traffic remains owned by v2 and must never fall through to legacy.
out = JSON.parse(simulatedOuterQaGuard({
  api_version: 'english_lab_live.v2', action: 'joinRoom', request_id: 'REQ-NO-TOKEN', room_id: 'ROOM-X', payload: {}
}, true));
assert.equal(out.ok, false);
assert.equal(out.error.code, 'AUTH_REQUIRED');
assert.equal(factoryCalls, 2);
assert.equal(serializerCalls, 2);
assert.equal(legacyCalls, 1);

assert.throws(
  () => context.ELV2_tryHandleCampusPostAtOuterGuard({}, null, routeOptions),
  /ELV2_OUTER_SERIALIZER_REQUIRED/
);

const bridgeSource = fs.readFileSync(path.join(sourceDir, '33_CampusOuterRouterBridge.js'), 'utf8');
assert.equal(/function\s+doPost\s*\(/.test(bridgeSource), false, 'E9 helper must not redefine doPost itself');
assert.equal(/function\s+doGet\s*\(/.test(bridgeSource), false, 'E9 helper must not redefine doGet');
for (const forbidden of ['SpreadsheetApp', 'LockService', 'PropertiesService', 'UrlFetchApp']) {
  assert.equal(bridgeSource.includes(forbidden), false, `outer bridge must not directly access ${forbidden}`);
}

assert.equal(qaGuardCalls, 4);
console.log(JSON.stringify({
  ok: true,
  gate: 'E9-OUTER_ROUTER_BRIDGE',
  qa_preflight_first: true,
  legacy_passthrough: true,
  exact_v2_no_downgrade: true,
  serializer_only_for_v2: true,
  doPost_redefined_by_helper: false,
  writes_external: 0
}));
