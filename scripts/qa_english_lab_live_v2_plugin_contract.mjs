import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'AppsScript', 'EnglishLabLiveV2');
const files = [
  '00_Constants.js',
  '06_PublicViewGuard.js',
  '07_GameRegistry.js',
  '08_ContractProbeGame.js'
];
const context = vm.createContext({ console, Object, Array, JSON, String, Error });
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

context.ELV2_clearGameRegistryForTests_();
const metadata = context.ELV2_registerGamePlugin(context.ELV2_ContractProbeGame, { test_only: true });
assert.equal(metadata.game_id, 'CONTRACT_PROBE');
assert.deepEqual([...context.ELV2_listGameIds()], []);
assert.deepEqual([...context.ELV2_listGameIds({ include_test_only: true })], ['CONTRACT_PROBE']);
assert.throws(() => context.ELV2_getGamePlugin('CONTRACT_PROBE'), /ELV2_GAME_NOT_AVAILABLE/);
const game = context.ELV2_getGamePlugin('CONTRACT_PROBE', { include_test_only: true });
assert.throws(() => context.ELV2_registerGamePlugin(game, { test_only: true }), /ELV2_GAME_ALREADY_REGISTERED/);

const content = {
  prompt: 'Choose A',
  options: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }],
  solution_option_id: 'A'
};
const created = game.createRound(content, {}, {});
assert.equal(created.scoring_policy, 'SCORE_ON_REVEAL');
assert.equal(created.visibility_model, 'PRIVATE_RESPONSE');
assert.equal(created.submission_policy, 'SINGLE_FINAL');
assert.equal(context.ELV2_validateCreatedRoundContract(created), true);
assert.throws(() => context.ELV2_validateCreatedRoundContract({
  private_state: {},
  scoring_policy: 'SCORE_IMMEDIATE_PUBLIC',
  visibility_model: 'PRIVATE_RESPONSE',
  submission_policy: 'SINGLE_FINAL'
}), /ELV2_GAME_SCORE_ORACLE_POLICY_INVALID/);
assert.throws(() => game.validateSettings({ hidden_switch: true }), /ELV2_SETTINGS_INVALID/);
assert.throws(() => game.validateAttempt({ action_type: 'SELECT_OPTION', option_id: 'A', basura: true }), /ELV2_ATTEMPT_INVALID/);

let state = created.private_state;
const actorA = { student_id: 'STU_A' };
const actorB = { student_id: 'STU_B' };

let openView = game.publicView(state, actorA, 'OPEN', {});
assert.equal(openView.has_submitted, false);
assert.equal(Object.prototype.hasOwnProperty.call(openView, 'solution_option_id'), false);
assert.equal(context.ELV2_assertPublicViewSafe(openView, 'OPEN', game.publicSchema(actorA, 'OPEN', {})), true);

const attemptA = game.applyAttempt(state, { action_type: 'SELECT_OPTION', option_id: 'A' }, actorA, {});
assert.equal(attemptA.points_delta, 10);
assert.equal(attemptA.attempt_result_private.is_correct, true);
state = attemptA.next_private_state;
openView = game.publicView(state, actorA, 'OPEN', {});
assert.equal(openView.has_submitted, true);
assert.equal(Object.prototype.hasOwnProperty.call(openView, 'viewer_result'), false);
assert.equal(context.ELV2_assertPublicViewSafe(openView, 'OPEN', game.publicSchema(actorA, 'OPEN', {})), true);
assert.throws(
  () => game.applyAttempt(state, { action_type: 'SELECT_OPTION', option_id: 'B' }, actorA, {}),
  /ELV2_ALREADY_SUBMITTED/
);

const attemptB = game.applyAttempt(state, { action_type: 'SELECT_OPTION', option_id: 'B' }, actorB, {});
assert.equal(attemptB.points_delta, 0);
state = attemptB.next_private_state;
assert.equal(game.isComplete(state, { active_student_ids: ['STU_A', 'STU_B'] }), true);

const revealA = game.publicView(state, actorA, 'REVEAL', {});
assert.equal(revealA.solution_option_id, 'A');
assert.equal(revealA.viewer_result.is_correct, true);
assert.equal(context.ELV2_assertPublicViewSafe(revealA, 'REVEAL', game.publicSchema(actorA, 'REVEAL', {})), true);
const revealB = game.publicView(state, actorB, 'REVEAL', {});
assert.equal(revealB.viewer_result.is_correct, false);

const pluginSource = fs.readFileSync(path.join(sourceDir, '08_ContractProbeGame.js'), 'utf8');
for (const forbidden of ['SpreadsheetApp', 'LockService', 'PropertiesService', 'UrlFetchApp', 'Session']) {
  assert.equal(pluginSource.includes(forbidden), false, `plugin must not access ${forbidden}`);
}

console.log('ELV2 PLUGIN CONTRACT E1 PASS');
