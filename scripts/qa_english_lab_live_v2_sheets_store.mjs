import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'AppsScript', 'EnglishLabLiveV2');
const files = ['00_Constants.js', '02_CanonicalJson.js', '03_Schema.js', '05_Idempotency.js', '14_SchemaGuard.js', '23_SheetsStore.js'];
const context = vm.createContext({ console, Object, Array, JSON, String, Error, Number, Date, RegExp, isFinite });
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
function makeDriver(seed = {}) {
  const tables = clone(seed);
  return {
    getHeaders(name) { return tables[name] ? clone(tables[name].headers) : null; },
    readRows(name) { return tables[name] ? clone(tables[name].rows) : null; },
    appendRow(name, values) {
      if (!tables[name]) throw new Error('missing table');
      tables[name].rows.push(clone(values));
    },
    updateRow(name, index, values) {
      if (!tables[name] || !tables[name].rows[index]) throw new Error('missing row');
      tables[name].rows[index] = clone(values);
    },
    createTable(name, headers) {
      if (tables[name]) throw new Error('duplicate table');
      tables[name] = { headers: clone(headers), rows: [] };
    },
    table(name) { return tables[name]; },
    names() { return Object.keys(tables); }
  };
}

const driver = makeDriver();
let init = context.ELV2_initializeSheetsSchema(driver, { environment: 'QA_SYNTHETIC', now_ms: 1000 });
assert.equal(init.result, 'CREATED');
assert.equal(init.created_tables.length, 7);
assert.equal(driver.names().length, 7);
assert.equal(driver.table('ENGLISH_LAB_LIVE_V2_META').rows.length, 1);

init = context.ELV2_initializeSheetsSchema(driver, { environment: 'QA_SYNTHETIC', now_ms: 2000 });
assert.equal(init.result, 'ALREADY_HEALTHY');
assert.equal(init.created_tables.length, 0);
assert.equal(driver.table('ENGLISH_LAB_LIVE_V2_META').rows.length, 1, 'rerun must not seed META twice');

// An unhealthy existing V2 table blocks ALL creation; initializer never repairs drift or partially creates around a blocker.
const blockedDriver = makeDriver({
  ENGLISH_LAB_LIVE_V2_ROOMS: { headers: ['room_id', 'BROKEN'], rows: [] }
});
assert.throws(
  () => context.ELV2_initializeSheetsSchema(blockedDriver, { environment: 'QA_SYNTHETIC', now_ms: 1000 }),
  /ELV2_SCHEMA_UNHEALTHY/
);
assert.deepEqual(blockedDriver.names(), ['ENGLISH_LAB_LIVE_V2_ROOMS']);

// Reordering is valid. Persisted values must be aligned by header name, never physical position.
const roundsTable = driver.table('ENGLISH_LAB_LIVE_V2_ROUNDS');
roundsTable.headers.reverse();

let store = context.ELV2_createSheetsStore(driver);
const room = {
  room_id: 'room-1', room_code: 'LAB-123', status: 'LOBBY', owner_user_id: 'teacher:opaque:1',
  owner_teacher_id: 'teacher:opaque:1', join_policy: 'MIXED_AUTHORIZED', current_round_id: null,
  state_revision: 0, title: '=NOT_A_FORMULA', config: { max_players: 30 }, created_at: 1000,
  started_at: null, closed_at: null, close_reason: null, created_by_user_id: 'teacher:opaque:1',
  created_service_version: '0.1.0-dev', updated_at: 1000
};
store.createRoom(room);
assert.equal(store.getRoom('room-1').title, '=NOT_A_FORMULA');
const roomTitleIndex = driver.table('ENGLISH_LAB_LIVE_V2_ROOMS').headers.indexOf('title');
assert.equal(driver.table('ENGLISH_LAB_LIVE_V2_ROOMS').rows[0][roomTitleIndex], "'=NOT_A_FORMULA", 'formula-like text must be stored inert');

const player = {
  player_id: 'player-1', room_id: 'room-1', student_id: 'STU-A', room_student_key: 'room-1|STU-A',
  display_name_snapshot: '+Ana', home_group_id_snapshot: 'GROUP-A', status: 'ACTIVE', score_total: 0,
  joined_at: 1000, last_seen_at: 1000, updated_at: 1000
};
store.createPlayer(player);
assert.equal(store.getPlayer('player-1').display_name_snapshot, '+Ana');

const round = {
  round_id: 'round-1', room_id: 'room-1', sequence_no: 1, game_id: 'CONTRACT_PROBE', game_version: '1',
  status: 'OPEN', content_ref: 'TEST:1', content_version: 'v1', content_hash: 'hash-content',
  content_snapshot: { prompt: 'Choose A', solution_option_id: 'A' },
  private_state: { correct: 'A', submissions: {} }, settings: { duration: 10000 },
  scoring_policy: 'SCORE_ON_REVEAL', visibility_model: 'PRIVATE_RESPONSE', submission_policy: 'SINGLE_FINAL',
  created_at: 1000, opened_at: 1100, ends_at: 11100, locked_at: null, revealed_at: null,
  reveal_ends_at: null, closed_at: null, close_reason: null, score_committed_at: null, updated_at: 1100
};
store.createRound(round);

const attemptKey = context.ELV2_attemptKeyMaterial('room-1', 'round-1', 'STU-A', 'REQ-1');
const attempt = {
  attempt_id: 'attempt-1', room_id: 'room-1', round_id: 'round-1', player_id: 'player-1', student_id: 'STU-A',
  request_id: 'REQ-1', attempt_key: attemptKey, payload_hash: 'hash-attempt-A', game_id: 'CONTRACT_PROBE',
  action_type: 'SELECT_OPTION', payload: { action_type: 'SELECT_OPTION', option_id: 'A' },
  private_result: { is_correct: true }, points_delta: 10, score_status: 'HIDDEN', client_seen_revision: 2,
  received_at: 1200, recorded_at: 1200, committed_at: null, created_revision: 3
};
store.createAttempt(attempt);

// Simulate a new Apps Script execution: construct a fresh Store over the same physical rows.
store = context.ELV2_createSheetsStore(driver);
const reloadedRound = store.getRound('round-1');
assert.equal(reloadedRound.scoring_policy, 'SCORE_ON_REVEAL');
assert.equal(reloadedRound.visibility_model, 'PRIVATE_RESPONSE');
assert.equal(reloadedRound.submission_policy, 'SINGLE_FINAL');
assert.deepEqual(clone(reloadedRound.private_state), { correct: 'A', submissions: {} });
assert.deepEqual(clone(reloadedRound.content_snapshot), { prompt: 'Choose A', solution_option_id: 'A' });

const reloadedAttempt = store.getAttemptByKey(attemptKey);
assert.equal(reloadedAttempt.payload_hash, 'hash-attempt-A', 'payload hash must survive execution reload');
assert.deepEqual(clone(reloadedAttempt.payload), { action_type: 'SELECT_OPTION', option_id: 'A' });
assert.deepEqual(clone(reloadedAttempt.private_result), { is_correct: true });

// Update semantics survive physical persistence.
const updatedPlayer = store.getPlayer('player-1');
updatedPlayer.score_total = 10;
updatedPlayer.updated_at = 1300;
store.updatePlayer(updatedPlayer);
assert.equal(context.ELV2_createSheetsStore(driver).getPlayer('player-1').score_total, 10);
assert.throws(() => store.createRoom(room), /ELV2_STORE_ROOM_CONFLICT/);
assert.throws(() => store.createPlayer(player), /ELV2_STORE_PLAYER_CONFLICT/);
assert.throws(() => store.createRound(round), /ELV2_STORE_ROUND_CONFLICT/);
assert.throws(() => store.createAttempt(attempt), /ELV2_STORE_ATTEMPT_CONFLICT/);

// Idempotency and event rows are physical too.
let idempotencyStore = context.ELV2_createSheetsIdempotencyStore(driver);
const idem = {
  idempotency_id: 'idem-1', scope_key: 'scope-1', request_id: 'REQ-1', action: 'submitAttempt',
  actor_user_id: 'student:opaque:1', room_id: 'room-1', round_id: 'round-1', payload_hash: 'idem-hash',
  status: 'STARTED', effect_type: '', effect_id: '', revision_after: null, result_code: '',
  created_at: 1200, updated_at: 1200, expires_at: null
};
idempotencyStore.create(idem);
idempotencyStore = context.ELV2_createSheetsIdempotencyStore(driver);
assert.equal(idempotencyStore.getByScopeKey('scope-1').payload_hash, 'idem-hash');
const committed = idempotencyStore.getByScopeKey('scope-1');
committed.status = 'COMMITTED'; committed.effect_type = 'ATTEMPT'; committed.effect_id = 'attempt-1'; committed.revision_after = 3;
idempotencyStore.update(committed);
assert.equal(context.ELV2_createSheetsIdempotencyStore(driver).getByScopeKey('scope-1').status, 'COMMITTED');

const eventStore = context.ELV2_createSheetsEventStore(driver);
eventStore.append({
  event_id: 'event-1', event_type: 'ATTEMPT_RECORDED', severity: 'INFO', server_at: 1200, trace_id: 'trace-1',
  actor_user_id: 'student:opaque:1', actor_role: 'student', room_id: 'room-1', round_id: 'round-1',
  player_id: 'player-1', request_id: 'REQ-1', revision_before: 2, revision_after: 3, code: 'OK', duration_ms: 12,
  data: { action_type: 'SELECT_OPTION' }, service_version: '0.1.0-dev'
});
const eventDataIndex = driver.table('ENGLISH_LAB_LIVE_V2_EVENTS').headers.indexOf('data_json');
assert.equal(driver.table('ENGLISH_LAB_LIVE_V2_EVENTS').rows[0][eventDataIndex], JSON.stringify({ action_type: 'SELECT_OPTION' }));

// Any schema drift anywhere blocks the next write before mutation.
const playersPhysical = driver.table('ENGLISH_LAB_LIVE_V2_PLAYERS');
playersPhysical.headers.push('unexpected_column');
for (const row of playersPhysical.rows) row.push('');
const beforeRooms = driver.table('ENGLISH_LAB_LIVE_V2_ROOMS').rows.length;
assert.throws(() => store.createRoom({ ...room, room_id: 'room-2', room_code: 'LAB-456' }), /ELV2_SCHEMA_UNHEALTHY/);
assert.equal(driver.table('ENGLISH_LAB_LIVE_V2_ROOMS').rows.length, beforeRooms, 'blocked write must have zero effect');

console.log('ELV2 SHEETS STORE E3 PASS');
