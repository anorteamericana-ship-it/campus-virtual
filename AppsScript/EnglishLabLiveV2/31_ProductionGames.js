/** English LAB LIVE v2 · closed production GamePlugin allowlist (E7). */
var ELV2_PRODUCTION_GAME_IDS = Object.freeze([
  'HANGMAN',
  'QUIZ_TIME',
  'SENTENCE_ORDER',
  'WORD_SEARCH'
]);

function ELV2_registerProductionGamePlugins() {
  var plugins = ELV2_productionGamePlugins_();
  var expected = ELV2_PRODUCTION_GAME_IDS.slice().sort();

  plugins.forEach(function (plugin) {
    var metadata = ELV2_validateGamePlugin(plugin);
    var existing = null;
    try {
      existing = ELV2_getGamePlugin(metadata.game_id, { include_test_only: true });
    } catch (error) {
      var message = String(error && error.message || error);
      if (message !== 'ELV2_GAME_NOT_AVAILABLE:' + metadata.game_id) throw error;
      ELV2_registerGamePlugin(plugin);
      existing = plugin;
    }
    if (existing !== plugin) {
      throw new Error('ELV2_GAME_REGISTRY_CONFLICT:' + metadata.game_id);
    }
  });

  var actual = ELV2_listGameIds().slice().sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error('ELV2_GAME_REGISTRY_CONFLICT:production_allowlist');
  }

  return Object.freeze(actual.map(function (gameId) {
    var plugin = ELV2_getGamePlugin(gameId);
    return Object.freeze({
      game_id: gameId,
      game_version: plugin.gameVersion()
    });
  }));
}

function ELV2_productionGamePlugins_() {
  if (typeof ELV2_SentenceOrderGame === 'undefined' ||
      typeof ELV2_HangmanGame === 'undefined' ||
      typeof ELV2_QuizTimeGame === 'undefined' ||
      typeof ELV2_WordSearchGame === 'undefined') {
    throw new Error('ELV2_PRODUCTION_GAMES_UNAVAILABLE');
  }
  return [
    ELV2_SentenceOrderGame,
    ELV2_HangmanGame,
    ELV2_QuizTimeGame,
    ELV2_WordSearchGame
  ];
}
