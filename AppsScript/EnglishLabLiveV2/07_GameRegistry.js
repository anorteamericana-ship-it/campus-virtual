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
  ELV2_GAME_REGISTRY_ = {};
}
