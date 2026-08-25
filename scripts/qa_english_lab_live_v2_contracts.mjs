import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'AppsScript', 'EnglishLabLiveV2');
const files = ['00_Constants.js', '01_Clock.js', '02_CanonicalJson.js', '03_Schema.js'];

const context = vm.createContext({ console, Date, Object, Array, JSON, String, Error, isFinite });
for (const name of files) {
  const source = fs.readFileSync(path.join(sourceDir, name), 'utf8');
  vm.runInContext(source, context, { filename: name });
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

assert.equal(context.ELV2_API_VERSION, 'english_lab_live.v2');
assert.equal(context.ELV2_SCHEMA_VERSION, '2.2.0');
assert.deepEqual(plain(context.ELV2_ROOM_STATUS), { LOBBY: 'LOBBY', LIVE: 'LIVE', CLOSED: 'CLOSED' });
assert.deepEqual(plain(context.ELV2_ROUND_STATUS), {
  READY: 'READY', OPEN: 'OPEN', LOCKED: 'LOCKED', REVEAL: 'REVEAL', CLOSED: 'CLOSED'
});

const fakeClock = context.ELV2_makeClock(() => 123456789);
assert.equal(fakeClock.nowMs(), 123456789);
assert.throws(() => context.ELV2_makeClock(() => Number.NaN).nowMs(), /ELV2_CLOCK_VALUE_INVALID/);

assert.equal(
  context.ELV2_canonicalJson({ z: 1, a: { y: 2, x: [3, 4] } }),
  context.ELV2_canonicalJson({ a: { x: [3, 4], y: 2 }, z: 1 })
);
assert.notEqual(
  context.ELV2_canonicalJson({ a: [1, 2] }),
  context.ELV2_canonicalJson({ a: [2, 1] })
);
assert.throws(() => context.ELV2_canonicalJson({ a: undefined }), /ELV2_CANONICAL_JSON_UNSUPPORTED_TYPE/);
assert.throws(() => context.ELV2_canonicalJson({ a: Number.POSITIVE_INFINITY }), /ELV2_CANONICAL_JSON_NON_FINITE_NUMBER/);

const tableKeys = Object.keys(context.ELV2_TABLES).sort();
assert.deepEqual(tableKeys, ['ATTEMPTS', 'EVENTS', 'IDEMPOTENCY', 'META', 'PLAYERS', 'ROOMS', 'ROUNDS']);

for (const key of tableKeys) {
  const spec = context.ELV2_TABLES[key];
  assert.match(spec.name, /^ENGLISH_LAB_LIVE_V2_/);
  assert.ok(spec.headers.length > 0, `${key} headers must not be empty`);
  assert.equal(new Set(spec.headers).size, spec.headers.length, `${key} headers must be unique`);

  const reordered = [...spec.headers].reverse();
  const healthy = context.ELV2_validateHeaderSet(spec.headers, reordered);
  assert.equal(healthy.ok, true, `${key} must be order-independent`);

  const missing = context.ELV2_validateHeaderSet(spec.headers, spec.headers.slice(1));
  assert.equal(missing.ok, false, `${key} must fail on a missing header`);
  assert.deepEqual(plain(missing.missing), [spec.headers[0]]);

  const duplicateHeaders = [...spec.headers, spec.headers[0]];
  const duplicate = context.ELV2_validateHeaderSet(spec.headers, duplicateHeaders);
  assert.equal(duplicate.ok, false, `${key} must fail on duplicate headers`);
  assert.deepEqual(plain(duplicate.duplicates), [spec.headers[0]]);

  const extra = context.ELV2_validateHeaderSet(spec.headers, [...spec.headers, 'unexpected_field']);
  assert.equal(extra.ok, false, `${key} must fail on unexpected headers`);
  assert.deepEqual(plain(extra.extra), ['unexpected_field']);
}

assert.ok(context.ELV2_TABLES.ROOMS.headers.includes('host_group_id'), 'ROOMS must persist its canonical host group');
for (const required of ['scoring_policy', 'visibility_model', 'submission_policy']) {
  assert.ok(context.ELV2_TABLES.ROUNDS.headers.includes(required), `ROUNDS must persist ${required}`);
}
assert.ok(context.ELV2_TABLES.ATTEMPTS.headers.includes('payload_hash'), 'ATTEMPTS must persist payload_hash for retry conflict detection');

const sourceText = files.map((name) => fs.readFileSync(path.join(sourceDir, name), 'utf8')).join('\n');
for (const forbidden of ['SpreadsheetApp', 'LockService', 'UrlFetchApp', 'doPost', 'doGet']) {
  assert.equal(sourceText.includes(forbidden), false, `isolated contract layer must not reference ${forbidden}`);
}
for (const legacy of [
  'ENGLISH_LAB_LIVE_ROOMS',
  'ENGLISH_LAB_LIVE_PLAYERS',
  'ENGLISH_LAB_LIVE_ANSWERS',
  'ENGLISH_LAB_LIVE_EVENTS'
]) {
  const exactLegacy = new RegExp(`['\"]${legacy}['\"]`);
  assert.equal(exactLegacy.test(sourceText), false, `v2 schema must not target legacy table ${legacy}`);
}

console.log('ELV2 CONTRACTS E1 PASS');
