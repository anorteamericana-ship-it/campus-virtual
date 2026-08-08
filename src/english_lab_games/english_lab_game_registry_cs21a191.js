// CS21A191 · Registro genérico y liviano de juegos para English LAB Live.
// No hace fetch, no contiene contenido pedagógico y no modifica juegos históricos.
(function installEnglishLabGameRegistryCS21A191(global) {
  'use strict';

  if (!global || global.EnglishLabGameRegistryCS21A191) return;

  const VERSION = 'CS21A191';
  const games = new Map();

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function upper(value) {
    return clean(value).toUpperCase();
  }

  function gameIdFromRoom(room) {
    const source = room && typeof room === 'object' ? room : {};
    return upper(
      source.game_id || source.gameId || source.game_code || source.gameCode ||
      source.GAME_ID || source.GAME_CODE
    );
  }

  function normalize(config) {
    const source = config && typeof config === 'object' ? config : {};
    const id = upper(source.id || source.game_id || source.gameId || source.code);
    if (!id) throw new Error('El juego requiere un id.');
    return Object.freeze({
      id,
      label:clean(source.label || source.name || id),
      category:clean(source.category || source.area || 'English LAB'),
      version:clean(source.version || VERSION),
      specialized:source.specialized !== false,
      endpoints:Object.freeze({
        suggestions:clean(source.endpoints && source.endpoints.suggestions),
        create:clean(source.endpoints && source.endpoints.create),
        start:clean(source.endpoints && source.endpoints.start),
        control:clean(source.endpoints && source.endpoints.control),
        join:clean(source.endpoints && source.endpoints.join),
        state:clean(source.endpoints && source.endpoints.state),
        action:clean(source.endpoints && source.endpoints.action),
        next:clean(source.endpoints && source.endpoints.next),
        closeRound:clean(source.endpoints && source.endpoints.closeRound),
        closeRoom:clean(source.endpoints && source.endpoints.closeRoom),
      }),
      capabilities:Object.freeze({
        individual:source.capabilities ? source.capabilities.individual !== false : true,
        teams:source.capabilities ? source.capabilities.teams !== false : true,
        projector:source.capabilities ? source.capabilities.projector !== false : true,
        serverAuthoritative:source.capabilities ? source.capabilities.serverAuthoritative !== false : true,
        curriculum:source.capabilities ? source.capabilities.curriculum !== false : true,
      }),
    });
  }

  function register(config) {
    const normalized = normalize(config);
    games.set(normalized.id, normalized);
    return normalized;
  }

  function get(gameId) {
    return games.get(upper(gameId)) || null;
  }

  function has(gameId) {
    return games.has(upper(gameId));
  }

  function list() {
    return Array.from(games.values());
  }

  function isRoom(gameId, room) {
    return upper(gameId) === gameIdFromRoom(room);
  }

  // Metadatos de compatibilidad: no reemplazan sus motores actuales.
  register({
    id:'MEMORY_MATCH', label:'Memory Match', category:'Vocabulario', version:'CS21A190',
    endpoints:{
      create:'englishLabMemoryMatchCreateRoom', start:'englishLabMemoryMatchStartRoom',
      control:'englishLabMemoryMatchGetRoomControl', state:'englishLabMemoryMatchGetPlayerState',
      action:'englishLabMemoryMatchSubmitPair', closeRound:'englishLabMemoryMatchCloseRound',
    }
  });
  register({
    id:'SENTENCE_ORDER', label:'Ordena la oración', category:'Gramática', version:'CS21A183',
    endpoints:{
      suggestions:'englishLabSentenceOrderTeacherData', create:'englishLabSentenceOrderCreateRoom',
      start:'englishLabSentenceOrderStartRoom', control:'englishLabSentenceOrderGetRoomControl',
      join:'englishLabSentenceOrderJoinRoom', state:'englishLabSentenceOrderGetPlayerState',
      action:'englishLabSentenceOrderSubmit', next:'englishLabSentenceOrderNextSentence',
      closeRoom:'englishLabSentenceOrderCloseRoom',
    }
  });
  register({
    id:'HANGMAN', label:'Ahorcado', category:'Vocabulario y ortografía', version:'CS21A191',
    endpoints:{
      suggestions:'englishLabHangmanSuggestions', create:'englishLabHangmanCreateRoom',
      start:'englishLabHangmanStartRoom', control:'englishLabHangmanGetRoomControl',
      join:'englishLabHangmanJoinRoom', state:'englishLabHangmanGetPlayerState',
      action:'englishLabHangmanAction', next:'englishLabHangmanNextRound',
      closeRound:'englishLabHangmanCloseRound', closeRoom:'englishLabHangmanCloseRoom',
    }
  });

  global.EnglishLabGameRegistryCS21A191 = Object.freeze({
    VERSION,
    register,
    get,
    has,
    list,
    isRoom,
    gameIdFromRoom,
  });
})(window);
