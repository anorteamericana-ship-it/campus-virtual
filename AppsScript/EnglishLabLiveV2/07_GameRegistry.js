/** English LAB LIVE v2 · explicit game registry and contract validation. */
var ELV2_REQUIRED_GAME_METHODS = Object.freeze([
  'gameId',
  'gameVersion',
  'validateContent',
  'validateSettings',
  'validateAttempt',
  'createRound',
  'applyAttempt',
  'publicView',
  'publicSchema',
  'isComplete'
]);

var ELV2_GAME_REGISTRY_ = {};

function ELV2_validateGamePlugin(plugin) {
  if (!plugin || typeof plugin !== 'object') throw new Error('ELV2_GAME_PLUGIN_INVALID');
  ELV2_REQUIRED_GAME_METHODS.forEach(function (methodName) {
    if (typeof plugin[methodName] !== 'function') {
      throw new Error('ELV2_GAME_PLUGIN_METHOD_MISSING:' + methodName);
    }
  });
  var gameId = plugin.gameId();
  var gameVersion = plugin.gameVersion();
  if (typeof gameId !== 'string' || !/^[A-Z0-9_]+$/.test(gameId)) {
    throw new Error('ELV2_GAME_ID_INVALID');
  }
  if (typeof gameVersion !== 'string' || !gameVersion.trim()) {
    throw new Error('ELV2_GAME_VERSION_INVALID');
  }
  return Object.freeze({ game_id: gameId, game_version: gameVersion });
}

function ELV2_validateCreatedRoundContract(created) {
  if (!created || typeof created !== 'object' || !created.private_state || typeof created.private_state !== 'object') {
    throw new Error('ELV2_GAME_ROUND_CONTRACT_INVALID');
  }
  if (Object.keys(ELV2_SCORING_POLICY).map(function (key) { return ELV2_SCORING_POLICY[key]; }).indexOf(created.scoring_policy) === -1) {
    throw new Error('ELV2_GAME_SCORING_POLICY_INVALID');
  }
  if (Object.keys(ELV2_VISIBILITY_MODEL).map(function (key) { return ELV2_VISIBILITY_MODEL[key]; }).indexOf(created.visibility_model) === -1) {
    throw new Error('ELV2_GAME_VISIBILITY_MODEL_INVALID');
  }
  if (Object.keys(ELV2_SUBMISSION_POLICY).map(function (key) { return ELV2_SUBMISSION_POLICY[key]; }).indexOf(created.submission_policy) === -1) {
    throw new Error('ELV2_GAME_SUBMISSION_POLICY_INVALID');
  }
  if (created.visibility_model === ELV2_VISIBILITY_MODEL.PRIVATE_RESPONSE &&
      created.scoring_policy === ELV2_SCORING_POLICY.SCORE_IMMEDIATE_PUBLIC) {
    throw new Error('ELV2_GAME_SCORE_ORACLE_POLICY_INVALID');
  }
  return true;
}

function ELV2_registerGamePlugin(plugin, options) {
  var metadata = ELV2_validateGamePlugin(plugin);
  if (Object.prototype.hasOwnProperty.call(ELV2_GAME_REGISTRY_, metadata.game_id)) {
    throw new Error('ELV2_GAME_ALREADY_REGISTERED:' + metadata.game_id);
  }
  ELV2_GAME_REGISTRY_[metadata.game_id] = Object.freeze({
    plugin: plugin,
    test_only: !!(options && options.test_only)
  });
  return metadata;
}

function ELV2_getGamePlugin(gameId, options) {
  var entry = ELV2_GAME_REGISTRY_[gameId];
  if (!entry) throw new Error('ELV2_GAME_NOT_AVAILABLE:' + gameId);
  if (entry.test_only && !(options && options.include_test_only === true)) {
    throw new Error('ELV2_GAME_NOT_AVAILABLE:' + gameId);
  }
  return entry.plugin;
}

function ELV2_listGameIds(options) {
  var includeTestOnly = !!(options && options.include_test_only === true);
  return Object.keys(ELV2_GAME_REGISTRY_).filter(function (gameId) {
    return includeTestOnly || !ELV2_GAME_REGISTRY_[gameId].test_only;
  }).sort();
}

function ELV2_clearGameRegistryForTests_() {
  Object.keys(ELV2_GAME_REGISTRY_).forEach(function (gameId) {
    delete ELV2_GAME_REGISTRY_[gameId];
  });
}
