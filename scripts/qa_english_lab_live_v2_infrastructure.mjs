import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'AppsScript', 'EnglishLabLiveV2');
const files = [
  '00_Constants.js', '02_CanonicalJson.js', '03_Schema.js', '05_Idempotency.js',
  '14_SchemaGuard.js', '15_IdempotencyService.js', '16_Events.js'
];
const context = vm.createContext({ console, Object, Array, JSON, String, Error, isFinite });
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

const emptyPlan = context.ELV2_buildInitializeSchemaPlan({});
assert.equal(emptyPlan.ok, true);
assert.equal(emptyPlan.result, 'CREATE_REQUIRED');
assert.equal(emptyPlan.actions.length, 7);
assert.equal(emptyPlan.blockers.length, 0);

const healthySnapshot = {};
for (const key of Object.keys(context.ELV2_TABLES)) {
  const spec = context.ELV2_TABLES[key];
  healthySnapshot[spec.name] = [...spec.headers].reverse();
}
const healthy = context.ELV2_schemaHealthFromSnapshot(healthySnapshot);
assert.equal(healthy.ok, true);
const healthyPlan = context.ELV2_buildInitializeSchemaPlan(healthySnapshot);
assert.equal(healthyPlan.result, 'ALREADY_HEALTHY');
assert.equal(healthyPlan.actions.length, 0);

const driftedSnapshot = { ...healthySnapshot };
const roomsName = context.ELV2_TABLES.ROOMS.name;
driftedSnapshot[roomsName] = [...context.ELV2_TABLES.ROOMS.headers].slice(1);
const driftedPlan = context.ELV2_buildInitializeSchemaPlan(driftedSnapshot);
assert.equal(driftedPlan.ok, false);
assert.equal(driftedPlan.result, 'SCHEMA_UNHEALTHY');
assert.equal(driftedPlan.actions.length, 0, 'initializer must refuse all auto-create work when an existing V2 table is unhealthy');
assert.equal(driftedPlan.blockers.length, 1);

let now = 1_000;
let idCounter = 0;
const idStore = context.ELV2_createInMemoryIdempotencyStore();
const service = context.ELV2_createIdempotencyService({
  store: idStore,
  clock: { nowMs: () => now },
  idFactory: (kind) => `${kind}-${++idCounter}`,
  payloadHasher: (value) => `payload:${context.ELV2_canonicalJson(value)}`,
  keyHasher: (value) => `scope:${value}`
});

let begin = service.begin({
  action: 'createRoom', actor_user_id: 'TEACHER-1', request_id: 'REQ-1', payload: { title: 'Room' }
});
assert.equal(begin.decision, 'NEW');
assert.equal(begin.record.status, 'STARTED');
const committed = service.commit(begin.record, {
  effect_type: 'ROOM', effect_id: 'ROOM-1', revision_after: 0, result_code: 'OK'
});
assert.equal(committed.status, 'COMMITTED');

begin = service.begin({
  action: 'createRoom', actor_user_id: 'TEACHER-1', request_id: 'REQ-1', payload: { title: 'Room' }
});
assert.equal(begin.decision, 'REPLAY_COMMITTED');
assert.equal(begin.record.effect_id, 'ROOM-1');

begin = service.begin({
  action: 'createRoom', actor_user_id: 'TEACHER-1', request_id: 'REQ-1', payload: { title: 'Other' }
});
assert.equal(begin.decision, 'CONFLICT');

now = 2_000;
let failedBegin = service.begin({
  action: 'closeRoom', actor_user_id: 'TEACHER-1', request_id: 'REQ-2', room_id: 'ROOM-1', payload: { reason: 'done' }
});
assert.equal(failedBegin.decision, 'NEW');
service.fail(failedBegin.record, 'TRANSIENT_FAILURE');
now = 3_000;
failedBegin = service.begin({
  action: 'closeRoom', actor_user_id: 'TEACHER-1', request_id: 'REQ-2', room_id: 'ROOM-1', payload: { reason: 'done' }
});
assert.equal(failedBegin.decision, 'RETRY_FAILED');
assert.equal(failedBegin.record.status, 'STARTED');

const event = context.ELV2_buildEvent({
  event_type: 'ROUND_OPENED',
  severity: 'INFO',
  trace_id: 'TRACE-1',
  actor_user_id: 'TEACHER-1',
  room_id: 'ROOM-1',
  round_id: 'ROUND-1',
  revision_before: 3,
  revision_after: 4,
  data: { game_id: 'CONTRACT_PROBE' }
}, {
  clock: { nowMs: () => 4_000 },
  idFactory: (kind) => `${kind}-${++idCounter}`
});
assert.equal(event.event_type, 'ROUND_OPENED');
assert.equal(event.server_at, 4_000);
assert.equal(event.data.game_id, 'CONTRACT_PROBE');

assert.throws(() => context.ELV2_buildEvent({
  event_type: 'ATTEMPT_RECORDED',
  data: { nested: { session_token: 'secret' } }
}, {
  clock: { nowMs: () => 4_000 },
  idFactory: (kind) => `${kind}-${++idCounter}`
}), /ELV2_EVENT_SECRET_BLOCKED/);

assert.throws(() => context.ELV2_buildEvent({
  event_type: 'ATTEMPT_RECORDED',
  data: { correct_answer: 'A' }
}, {
  clock: { nowMs: () => 4_000 },
  idFactory: (kind) => `${kind}-${++idCounter}`
}), /ELV2_EVENT_SECRET_BLOCKED/);

console.log('ELV2 INFRASTRUCTURE E1 PASS');
