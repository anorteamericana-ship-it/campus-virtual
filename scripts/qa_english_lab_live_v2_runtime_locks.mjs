import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'AppsScript', 'EnglishLabLiveV2');

let globallyHeld = false;
let acquireCalls = 0;
let releaseCalls = 0;
const fakeLockService = {
  getScriptLock() {
    let localHeld = false;
    return {
      tryLock(timeoutMs) {
        assert.ok(Number.isInteger(timeoutMs));
        acquireCalls += 1;
        if (globallyHeld) return false;
        globallyHeld = true;
        localHeld = true;
        return true;
      },
      releaseLock() {
        assert.equal(localHeld, true, 'only an acquired lock may be released');
        assert.equal(globallyHeld, true);
        localHeld = false;
        globallyHeld = false;
        releaseCalls += 1;
      }
    };
  }
};

const context = vm.createContext({
  console, Object, Array, JSON, String, Error, Number, Date, RegExp, isFinite,
  LockService: fakeLockService
});
for (const name of [
  '00_Constants.js', '02_CanonicalJson.js', '05_Idempotency.js', '12_ConcurrencyGuard.js',
  '15_IdempotencyService.js', '24_RuntimeLockAdapters.js'
]) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

// Apps Script adapter is intentionally SCRIPT_GLOBAL, even when callers use different room/scope keys.
const roomGuard = context.ELV2_createAppsScriptRoomConcurrencyGuard({ timeout_ms: 25 });
assert.equal(roomGuard.withRoomMutation('room-A', () => 'ok'), 'ok');
assert.equal(globallyHeld, false);
assert.equal(acquireCalls, 1);
assert.equal(releaseCalls, 1);

// finally must release the global lock even when a mutation throws.
assert.throws(
  () => roomGuard.withRoomMutation('room-B', () => { throw new Error('boom'); }),
  /boom/
);
assert.equal(globallyHeld, false);
assert.equal(acquireCalls, 2);
assert.equal(releaseCalls, 2);

// Contention maps to BUSY_RETRY rather than executing without a lock.
globallyHeld = true;
assert.throws(() => roomGuard.withRoomMutation('room-C', () => 'must-not-run'), /ELV2_BUSY_RETRY/);
globallyHeld = false;

const idemMutationGuard = context.ELV2_createAppsScriptIdempotencyMutationGuard({ timeout_ms: 25 });
const innerStore = context.ELV2_createInMemoryIdempotencyStore();
const guardedStore = {
  getByScopeKey(scopeKey) {
    assert.equal(globallyHeld, true, 'idempotency lookup must occur inside the exclusive mutation guard');
    return innerStore.getByScopeKey(scopeKey);
  },
  create(record) {
    assert.equal(globallyHeld, true, 'idempotency create must occur inside the exclusive mutation guard');
    return innerStore.create(record);
  },
  update(record) {
    assert.equal(globallyHeld, true, 'idempotency update must occur inside the exclusive mutation guard');
    return innerStore.update(record);
  }
};

let now = 1000;
let idCounter = 0;
const service = context.ELV2_createIdempotencyService({
  store: guardedStore,
  clock: { nowMs: () => now },
  idFactory: () => `idem-${++idCounter}`,
  payloadHasher: (payload) => context.ELV2_canonicalJson(payload),
  keyHasher: (value) => `key:${value}`,
  mutationGuard: idemMutationGuard
});

const input = {
  action: 'submitAttempt', request_id: 'REQ-ATOMIC-1', actor_user_id: 'student:opaque:1',
  room_id: 'room-A', round_id: 'round-A', payload: { attempt: { option_id: 'A' } }
};
let begun = service.begin(input);
assert.equal(begun.decision, 'NEW');
assert.equal(begun.record.status, 'STARTED');
assert.equal(globallyHeld, false, 'begin must release before domain effect execution');

// A concurrent same logical request sees STARTED under the same global lock; it cannot create a duplicate record.
const second = service.begin(input);
assert.equal(second.decision, 'IN_PROGRESS');
assert.equal(idCounter, 1);
assert.equal(globallyHeld, false);

now = 1100;
const committed = service.commit(begun.record, {
  effect_type: 'ATTEMPT', effect_id: 'attempt-1', room_id: 'room-A', round_id: 'round-A', revision_after: 3
});
assert.equal(committed.status, 'COMMITTED');
assert.equal(globallyHeld, false);

const replay = service.begin(input);
assert.equal(replay.decision, 'REPLAY_COMMITTED');
assert.equal(replay.record.effect_id, 'attempt-1');

// Different logical payload under the same request id remains a conflict, still under the guard.
assert.equal(
  service.begin({ ...input, payload: { attempt: { option_id: 'B' } } }).decision,
  'CONFLICT'
);

// Busy idempotency lock never falls back to an unsafe unlocked lookup/create sequence.
globallyHeld = true;
assert.throws(() => service.begin({ ...input, request_id: 'REQ-BUSY' }), /ELV2_BUSY_RETRY/);
globallyHeld = false;

assert.throws(() => context.ELV2_createAppsScriptGlobalLockAdapter({ timeout_ms: -1 }), /ELV2_LOCK_TIMEOUT_INVALID/);
assert.throws(() => context.ELV2_createAppsScriptGlobalLockAdapter({ timeout_ms: 6000 }), /ELV2_LOCK_TIMEOUT_INVALID/);

console.log('ELV2 RUNTIME LOCKS + ATOMIC IDEMPOTENCY E3 PASS');
