import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'AppsScript', 'EnglishLabLiveV2');
const files = [
  '00_Constants.js', '07_GameRegistry.js', '08_ContractProbeGame.js',
  '27_SentenceOrderGame.js', '28_HangmanGame.js', '29_QuizTimeGame.js',
  '30_WordSearchGame.js', '31_ProductionGames.js'
];
const context = vm.createContext({ console, Object, Array, JSON, String, Error, Number, RegExp, Math, isFinite });
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

const expected = ['HANGMAN', 'QUIZ_TIME', 'SENTENCE_ORDER', 'WORD_SEARCH'];

context.ELV2_clearGameRegistryForTests_();
let metadata = context.ELV2_registerProductionGamePlugins();
assert.deepEqual([...context.ELV2_listGameIds()], expected);
assert.deepEqual([...metadata].map(item => item.game_id), expected);
assert.equal(metadata.every(item => typeof item.game_version === 'string' && item.game_version.length > 0), true);

// Repeated initialization in the same Apps Script execution must be idempotent.
metadata = context.ELV2_registerProductionGamePlugins();
assert.deepEqual([...context.ELV2_listGameIds()], expected);
assert.deepEqual([...metadata].map(item => item.game_id), expected);

// Same game_id occupied by a different object is a hard conflict, even if the object satisfies the method shape.
context.ELV2_clearGameRegistryForTests_();
const fakeSentence = {
  gameId: () => 'SENTENCE_ORDER',
  gameVersion: () => 'evil-test',
  validateContent: () => true,
  validateSettings: () => true,
  validateAttempt: () => true,
  createRound: () => ({
    private_state: {}, scoring_policy: 'SCORE_ON_REVEAL',
    visibility_model: 'PRIVATE_RESPONSE', submission_policy: 'SINGLE_FINAL'
  }),
  applyAttempt: () => ({ next_private_state: {}, attempt_result_private: {}, points_delta: 0, public_effects: {}, completion_hint: false }),
  publicView: () => ({}),
  publicSchema: () => ({}),
  isComplete: () => false
};
context.ELV2_registerGamePlugin(fakeSentence);
assert.throws(
  () => context.ELV2_registerProductionGamePlugins(),
  /ELV2_GAME_REGISTRY_CONFLICT:SENTENCE_ORDER/
);

// A real production plugin accidentally registered as test-only must not silently enter production.
context.ELV2_clearGameRegistryForTests_();
context.ELV2_registerGamePlugin(context.ELV2_SentenceOrderGame, { test_only: true });
assert.throws(
  () => context.ELV2_registerProductionGamePlugins(),
  /ELV2_GAME_REGISTRY_CONFLICT:production_allowlist/
);

// Any fifth non-test game violates the closed production allowlist.
context.ELV2_clearGameRegistryForTests_();
context.ELV2_registerGamePlugin(context.ELV2_ContractProbeGame);
assert.throws(
  () => context.ELV2_registerProductionGamePlugins(),
  /ELV2_GAME_REGISTRY_CONFLICT:production_allowlist/
);

context.ELV2_clearGameRegistryForTests_();
metadata = context.ELV2_registerProductionGamePlugins();
assert.deepEqual([...context.ELV2_listGameIds()], expected);

const registrySource = fs.readFileSync(path.join(sourceDir, '31_ProductionGames.js'), 'utf8');
for (const forbidden of ['SpreadsheetApp', 'LockService', 'PropertiesService', 'UrlFetchApp', 'Utilities', 'Session']) {
  assert.equal(registrySource.includes(forbidden), false, `production registry must not access ${forbidden}`);
}

console.log(JSON.stringify({
  ok: true,
  gate: 'E7-PRODUCTION_REGISTRY',
  games: expected,
  exact_allowlist: true,
  idempotent_reload: true,
  conflict_fail_closed: true,
  writes_external: 0
}));
