import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'AppsScript', 'EnglishLabLiveV2');
const files = ['00_Constants.js', '04_StateMachine.js'];
const context = vm.createContext({ console, Object, Array, Error, isFinite, Number });
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

for (const [from, to] of [
  ['LOBBY', 'LIVE'], ['LOBBY', 'CLOSED'], ['LIVE', 'CLOSED']
]) {
  assert.equal(context.ELV2_canRoomTransition(from, to), true, `${from}->${to} should be valid`);
}
for (const [from, to] of [
  ['CLOSED', 'LIVE'], ['LIVE', 'LOBBY'], ['CLOSED', 'LOBBY']
]) {
  assert.equal(context.ELV2_canRoomTransition(from, to), false, `${from}->${to} should be invalid`);
}

for (const [from, to] of [
  ['READY', 'OPEN'], ['READY', 'CLOSED'], ['OPEN', 'LOCKED'], ['OPEN', 'CLOSED'],
  ['LOCKED', 'REVEAL'], ['LOCKED', 'CLOSED'], ['REVEAL', 'CLOSED']
]) {
  assert.equal(context.ELV2_canRoundTransition(from, to), true, `${from}->${to} should be valid`);
}
for (const [from, to] of [
  ['OPEN', 'REVEAL'], ['CLOSED', 'OPEN'], ['REVEAL', 'OPEN'], ['LOCKED', 'OPEN']
]) {
  assert.equal(context.ELV2_canRoundTransition(from, to), false, `${from}->${to} should be invalid`);
}

const endsAt = 10_000;
const openRound = { status: 'OPEN', ends_at: endsAt, reveal_ends_at: null };
assert.equal(context.ELV2_canAcceptAttempt(openRound, endsAt - 1), true);
assert.equal(context.ELV2_canAcceptAttempt(openRound, endsAt), false);
assert.equal(context.ELV2_canAcceptAttempt(openRound, endsAt + 1), false);
assert.equal(context.ELV2_canAcceptAttempt({ ...openRound, status: 'LOCKED' }, endsAt - 1), false);

let plan = context.ELV2_planTimedRoundCanonicalization(openRound, endsAt - 1, {});
assert.equal(plan.to_status, 'OPEN');
assert.deepEqual([...plan.transitions], []);

plan = context.ELV2_planTimedRoundCanonicalization(openRound, endsAt, {});
assert.equal(plan.to_status, 'LOCKED');
assert.deepEqual([...plan.transitions], ['LOCKED']);

plan = context.ELV2_planTimedRoundCanonicalization(openRound, endsAt, { auto_reveal: true });
assert.equal(plan.to_status, 'REVEAL');
assert.deepEqual([...plan.transitions], ['LOCKED', 'REVEAL']);

const revealRound = { status: 'REVEAL', reveal_ends_at: 20_000 };
plan = context.ELV2_planTimedRoundCanonicalization(revealRound, 19_999, {});
assert.equal(plan.to_status, 'REVEAL');
plan = context.ELV2_planTimedRoundCanonicalization(revealRound, 20_000, {});
assert.equal(plan.to_status, 'CLOSED');
assert.deepEqual([...plan.transitions], ['CLOSED']);

assert.equal(context.ELV2_nextRevision(0), 1);
assert.equal(context.ELV2_nextRevision(41), 42);
assert.throws(() => context.ELV2_nextRevision(-1), /ELV2_REVISION_INVALID/);
assert.throws(() => context.ELV2_nextRevision(1.5), /ELV2_REVISION_INVALID/);

console.log('ELV2 STATE MACHINE E1 PASS');
