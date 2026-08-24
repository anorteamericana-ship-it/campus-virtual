import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'AppsScript', 'EnglishLabLiveV2');
const files = ['00_Constants.js', '02_CanonicalJson.js', '05_Idempotency.js', '06_PublicViewGuard.js'];
const context = vm.createContext({ console, Object, Array, JSON, String, Error, isFinite });
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

assert.equal(context.ELV2_requireRequestId('submitAttempt', ' req-1 '), 'req-1');
assert.throws(() => context.ELV2_requireRequestId('submitAttempt', ''), /ELV2_REQUEST_ID_INVALID/);
assert.equal(context.ELV2_requireRequestId('getState', null), null);

const scopeA = context.ELV2_idempotencyScopeMaterial('submitAttempt', 'user-1', 'req-1');
const scopeB = context.ELV2_idempotencyScopeMaterial('submitAttempt', 'user-1', 'req-1');
assert.equal(scopeA, scopeB);
const attemptKey = context.ELV2_attemptKeyMaterial('room-1', 'round-1', 'stu-1', 'req-1');
assert.match(attemptKey, /room-1/);

assert.equal(context.ELV2_classifyIdempotency(null, 'hash-a'), 'NEW');
assert.equal(context.ELV2_classifyIdempotency({ status: 'COMMITTED', payload_hash: 'hash-a' }, 'hash-a'), 'REPLAY_COMMITTED');
assert.equal(context.ELV2_classifyIdempotency({ status: 'STARTED', payload_hash: 'hash-a' }, 'hash-a'), 'IN_PROGRESS');
assert.equal(context.ELV2_classifyIdempotency({ status: 'FAILED', payload_hash: 'hash-a' }, 'hash-a'), 'RETRY_FAILED');
assert.equal(context.ELV2_classifyIdempotency({ status: 'COMMITTED', payload_hash: 'hash-a' }, 'hash-b'), 'CONFLICT');

const studentOpenSchema = {
  room: { title: true, status: true },
  round: { round_id: true, game_id: true, phase: true, ends_at: true },
  player: { has_submitted: true },
  leaderboard: { $array: { display_name: true, score: true, rank: true } }
};
const safeView = {
  room: { title: 'LAB', status: 'LIVE' },
  round: { round_id: 'r1', game_id: 'QUIZ_TIME', phase: 'OPEN', ends_at: 1000 },
  player: { has_submitted: true },
  leaderboard: [{ display_name: 'Ana M.', score: 20, rank: 1 }]
};
assert.equal(context.ELV2_assertPublicViewSafe(safeView, 'OPEN', studentOpenSchema), true);

assert.throws(
  () => context.ELV2_assertPublicViewSafe({ ...safeView, debug_state: {} }, 'OPEN', studentOpenSchema),
  /ELV2_PUBLIC_VIEW_SCHEMA_VIOLATION/
);
assert.throws(
  () => context.ELV2_assertPublicViewSafe({ ...safeView, round: { ...safeView.round, solution: 'B' } }, 'OPEN', {
    ...studentOpenSchema,
    round: { ...studentOpenSchema.round, solution: true }
  }),
  /ELV2_ANSWER_LEAK_BLOCKED/
);
assert.throws(
  () => context.ELV2_assertPublicViewSafe({ payload: [{ meta: { correct_answer: 'B' } }] }, 'LOCKED', {
    payload: { $array: { meta: { correct_answer: true } } }
  }),
  /ELV2_ANSWER_LEAK_BLOCKED/
);
assert.equal(
  context.ELV2_assertPublicViewSafe({ round: { solution: 'B', explanation: 'Because.' } }, 'REVEAL', {
    round: { solution: true, explanation: true }
  }),
  true
);

console.log('ELV2 SECURITY CORE E1 PASS');
