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
  '10_InMemoryStore.js', '11_RoomEngine.js', '12_ConcurrencyGuard.js', '13_RoundEngine.js',
  '15_IdempotencyService.js', '17_RoundLifecycle.js', '18_StateService.js',
  '19_RequestValidation.js', '20_ContentResolver.js', '21_Dispatcher.js'
];
const context = vm.createContext({ console, Object, Array, JSON, String, Error, isFinite, Number, Date });
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

context.ELV2_clearGameRegistryForTests_();
context.ELV2_registerGamePlugin(context.ELV2_ContractProbeGame, { test_only: true });

let now = 1_000;
let idCounter = 0;
let traceCounter = 0;
const store = context.ELV2_createInMemoryStore();
const concurrencyGuard = context.ELV2_createConcurrencyGuard(context.ELV2_createSynchronousTestLockAdapter());
const clock = { nowMs: () => now };
const idFactory = (kind) => `${kind}-${++idCounter}`;
const payloadHasher = (value) => context.ELV2_canonicalJson(value);
const roomEngine = context.ELV2_createRoomEngine({
  store, clock, concurrencyGuard, idFactory, roomCodeFactory: () => 'LAB-DISPATCH'
});
const roundEngine = context.ELV2_createRoundEngine({
  store, clock, concurrencyGuard, idFactory, payloadHasher, allowTestOnlyGames: true
});
const roundLifecycle = context.ELV2_createRoundLifecycleService({ store, clock, concurrencyGuard });
const stateService = context.ELV2_createStateService({
  store, clock, concurrencyGuard, allowTestOnlyGames: true
});
const content = {
  prompt: 'Choose A',
  options: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }],
  solution_option_id: 'A'
};
const contentResolver = context.ELV2_createContentResolver(context.ELV2_createInMemoryContentSource({
  'TEST:PROBE:1': { game_id: 'CONTRACT_PROBE', content_version: 'fixture-1', content }
}));
const idempotencyStore = context.ELV2_createInMemoryIdempotencyStore();
const idempotencyService = context.ELV2_createIdempotencyService({
  store: idempotencyStore,
  clock,
  idFactory,
  payloadHasher,
  keyHasher: payloadHasher
});
const dispatcher = context.ELV2_createDispatcher({
  roomEngine,
  roundEngine,
  roundLifecycle,
  stateService,
  contentResolver,
  idempotencyService,
  clock,
  traceIdFactory: () => `trace-${++traceCounter}`
});

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
const base = (action, request_id, extra = {}) => ({
  api_version: 'english_lab_live.v2', action, request_id, payload: {}, ...extra
});

// Envelope and auth boundary.
let response = dispatcher.dispatch({ ...base('createRoom', 'REQ-INVALID-TOP'), unexpected: true }, teacher);
assert.equal(response.ok, false);
assert.equal(response.error.code, 'INVALID_REQUEST');
response = dispatcher.dispatch({ ...base('createRoom', 'REQ-BAD-API'), api_version: 'v1' }, teacher);
assert.equal(response.ok, false);
assert.equal(response.error.code, 'INVALID_REQUEST');
response = dispatcher.dispatch(base('notAnAction', 'REQ-BAD-ACTION'), teacher);
assert.equal(response.ok, false);
assert.equal(response.error.code, 'INVALID_REQUEST');
response = dispatcher.dispatch({ api_version: 'english_lab_live.v2', action: 'createRoom', payload: {} }, teacher);
assert.equal(response.ok, false);
assert.equal(response.error.code, 'INVALID_REQUEST');
response = dispatcher.dispatch(base('createRoom', 'REQ-NO-ACTOR'), null);
assert.equal(response.ok, false);
assert.equal(response.error.code, 'AUTH_REQUIRED');
response = dispatcher.dispatch(base('createRoom', 'REQ-EXTRA', { payload: { title: 'X', basura: 'z' } }), teacher);
assert.equal(response.ok, false);
assert.equal(response.error.code, 'INVALID_REQUEST');
const nestedReserved = JSON.parse('{"settings":[{"constructor":"forged"}]}');
response = dispatcher.dispatch(base('prepareRound', 'REQ-RESERVED', {
  room_id: 'room-x', payload: { game_id: 'CONTRACT_PROBE', content_ref: 'TEST:PROBE:1', ...nestedReserved }
}), teacher);
assert.equal(response.ok, false);
assert.equal(response.error.code, 'INVALID_REQUEST');

// Build a room through the Dispatcher.
response = dispatcher.dispatch(base('createRoom', 'REQ-CREATE', { payload: { title: 'Dispatcher room', config: {} } }), teacher);
assert.equal(response.ok, true);
const roomId = response.data.effect.id;
assert.equal(response.view.room.room_id, roomId);
assert.equal(response.view.state_revision, 0);

response = dispatcher.dispatch(base('joinRoom', 'REQ-JOIN-A', { room_id: roomId }), studentA);
assert.equal(response.ok, true);
assert.equal(response.view.state_revision, 1);
response = dispatcher.dispatch(base('joinRoom', 'REQ-JOIN-B', { room_id: roomId }), studentB);
assert.equal(response.ok, true);
assert.equal(response.view.state_revision, 2);

response = dispatcher.dispatch(base('startRoom', 'REQ-START', {
  room_id: roomId, payload: { expected_revision: 2 }
}), teacher);
assert.equal(response.ok, true);
assert.equal(response.view.room.status, 'LIVE');
assert.equal(response.view.state_revision, 3);

response = dispatcher.dispatch(base('prepareRound', 'REQ-PREPARE', {
  room_id: roomId,
  payload: { expected_revision: 3, game_id: 'CONTRACT_PROBE', content_ref: 'TEST:PROBE:1', settings: {} }
}), teacher);
assert.equal(response.ok, true);
const roundId = response.data.effect.id;
assert.equal(response.view.round.phase, 'READY');
assert.equal(response.view.state_revision, 4);

// A second prepare is a stable domain rejection, not INTERNAL_ERROR, and replays identically.
const duplicatePrepare = base('prepareRound', 'REQ-PREPARE-DUP', {
  room_id: roomId,
  payload: { expected_revision: 4, game_id: 'CONTRACT_PROBE', content_ref: 'TEST:PROBE:1', settings: {} }
});
response = dispatcher.dispatch(duplicatePrepare, teacher);
assert.equal(response.ok, false);
assert.equal(response.error.code, 'STATE_CHANGED');
const duplicatePrepareReplay = dispatcher.dispatch(duplicatePrepare, teacher);
assert.equal(duplicatePrepareReplay.ok, false);
assert.equal(duplicatePrepareReplay.error.code, 'STATE_CHANGED');
assert.equal(store.listRoundsByRoom(roomId).length, 1);

// Invalid duration is deterministic and never presented as INTERNAL_ERROR.
const invalidOpen = base('openRound', 'REQ-OPEN-BAD', {
  room_id: roomId, round_id: roundId, payload: { expected_revision: 4, duration_ms: '10000' }
});
response = dispatcher.dispatch(invalidOpen, teacher);
assert.equal(response.ok, false);
assert.equal(response.error.code, 'INVALID_REQUEST');
const invalidOpenReplay = dispatcher.dispatch(invalidOpen, teacher);
assert.equal(invalidOpenReplay.ok, false);
assert.equal(invalidOpenReplay.error.code, 'INVALID_REQUEST');
assert.equal(store.getRound(roundId).status, 'READY');

response = dispatcher.dispatch(base('openRound', 'REQ-OPEN', {
  room_id: roomId, round_id: roundId, payload: { expected_revision: 4, duration_ms: 10_000 }
}), teacher);
assert.equal(response.ok, true);
assert.equal(response.view.round.phase, 'OPEN');
assert.equal(response.view.state_revision, 5);

// Strict plugin schema rejects arbitrary client fields before ATTEMPT persistence.
response = dispatcher.dispatch(base('submitAttempt', 'REQ-GARBAGE', {
  room_id: roomId, round_id: roundId, client_seen_revision: 5,
  payload: { action_type: 'SELECT_OPTION', option_id: 'A', basura: 'persist-me' }
}), studentA);
assert.equal(response.ok, false);
assert.equal(response.error.code, 'INVALID_REQUEST');
assert.equal(store.listAttemptsByRound(roundId).length, 0);

// Legitimate retry: diagnostic revision may change without changing logical request identity.
const firstAttempt = base('submitAttempt', 'REQ-SUBMIT-A', {
  room_id: roomId, round_id: roundId, client_seen_revision: 5,
  payload: { action_type: 'SELECT_OPTION', option_id: 'A' }
});
response = dispatcher.dispatch(firstAttempt, studentA);
assert.equal(response.ok, true);
assert.equal(response.data.replayed, false);
const attemptId = response.data.effect.id;
assert.equal(store.listAttemptsByRound(roundId).length, 1);
const retryWithNewRevision = dispatcher.dispatch({ ...firstAttempt, client_seen_revision: 99 }, studentA);
assert.equal(retryWithNewRevision.ok, true);
assert.equal(retryWithNewRevision.data.replayed, true);
assert.equal(retryWithNewRevision.data.effect.id, attemptId);
assert.equal(store.listAttemptsByRound(roundId).length, 1);

// Same request id with different logical attempt remains a conflict.
const conflict = dispatcher.dispatch({
  ...firstAttempt,
  client_seen_revision: 100,
  payload: { action_type: 'SELECT_OPTION', option_id: 'B' }
}, studentA);
assert.equal(conflict.ok, false);
assert.equal(conflict.error.code, 'REQUEST_ID_CONFLICT');
assert.equal(store.listAttemptsByRound(roundId).length, 1);

// IN_PROGRESS is exposed as BUSY_RETRY without executing the mutation.
const inProgressRequest = base('closeRoom', 'REQ-IN-PROGRESS', {
  room_id: roomId, payload: { expected_revision: 6, reason: 'TEST' }
});
idempotencyService.begin({
  action: inProgressRequest.action,
  actor_user_id: teacher.user_id,
  request_id: inProgressRequest.request_id,
  room_id: roomId,
  round_id: '',
  payload: { room_id: roomId, room_code: '', round_id: '', payload: inProgressRequest.payload }
});
response = dispatcher.dispatch(inProgressRequest, teacher);
assert.equal(response.ok, false);
assert.equal(response.error.code, 'BUSY_RETRY');
assert.notEqual(store.getRoom(roomId).status, 'CLOSED');

// Oversized/deep payloads fail at the boundary.
const deep = {}; let cursor = deep;
for (let i = 0; i < 10; i += 1) { cursor.next = {}; cursor = cursor.next; }
response = dispatcher.dispatch(base('createRoom', 'REQ-DEEP', { payload: { config: deep } }), teacher);
assert.equal(response.ok, false);
assert.equal(response.error.code, 'INVALID_REQUEST');

// Unknown internal messages are sanitized.
assert.equal(context.ELV2_publicErrorCode_(new Error('SENSITIVE_INTERNAL_DETAIL')), 'INTERNAL_ERROR');
assert.equal(context.ELV2_safeErrorMessage_('INTERNAL_ERROR'), 'No pudimos completar la acción.');

console.log('ELV2 DISPATCHER E1 PASS');
