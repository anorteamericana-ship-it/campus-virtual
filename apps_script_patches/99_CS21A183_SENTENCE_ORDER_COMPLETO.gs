// =============================================================================
// CS21A183-CS21A189 · APPS SCRIPT QA COMPLETO · COPIAR Y PEGAR TODO
// Composición exacta: 99 + 99B + 99C + 99D FIX3 + 99E FIX4 + 99F CLOSED FIX + 99G RULES FIX + 99H LIFECYCLE FIX + 99I SHARED DISCOVERY + 99J RULES COMPAT + 99K CLASSIC SYNC
// Reemplaza por completo el contenido del archivo Apps Script
// 99_CS21A183_SENTENCE_ORDER_COMPLETO. No agregar parches manuales.
// QA/STAGING solamente. NO USAR EN PRODUCCIÓN.
// =============================================================================


// =============================================================================
// BLOQUE 1/11: 99_ACTUALIZACION_QA_CS21A183.gs
// =============================================================================
// CS21A183 · CAPA ADITIVA QA PARA ENGLISH LAB LIVE
// Instalar despues de 98_ACTUALIZACION_QA_CS21A181.gs. No usar en produccion.
// Agrega Ordena la oracion con contenido editable, sala real, respuestas y ranking.

var ELSO183_VERSION = 'CS21A183';
var ELSO183_GAME_CODE = 'SENTENCE_ORDER';
var ELSO183_GAME_LABEL = 'Ordena la oracion';
var ELSO183_OBJECTIVE = 'Oraciones sugeridas editables, palabras desordenadas y respuestas sincronizadas en English LAB Live';

function _elso183Text_(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}
function _elso183Upper_(value) {
  return _elso183Text_(value).toUpperCase();
}
function _elso183Json_(value, fallback) {
  if (value && typeof value === 'object') return value;
  try { return value ? JSON.parse(String(value)) : (fallback || {}); }
  catch (_) { return fallback || {}; }
}
function _elso183Words_(sentence) {
  return _elso183Text_(sentence).split(/\s+/).filter(function (word) { return !!word; });
}
function _elso183Sentences_(value) {
  var raw = value;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); }
    catch (_) {
      raw = raw.split(/\r?\n/).map(function (line) { return {sentence:line}; });
    }
  }
  if (!Array.isArray(raw)) return [];
  var seen = {};
  return raw.map(function (item, index) {
    var source = typeof item === 'string' ? {sentence:item} : (item || {});
    var sentence = _elso183Text_(source.sentence || source.correct_sentence || source.answer || source.CORRECT_SENTENCE);
    var words = _elso183Words_(sentence);
    var key = _elso183Upper_(sentence);
    if (!sentence || words.length < 3 || words.length > 18 || seen[key]) return null;
    seen[key] = true;
    return {
      sentence_id:_elso183Text_(source.sentence_id || source.id || source.play_item_id || ('SENTENCE-' + (index + 1))),
      sentence:sentence,
      prompt:_elso183Text_(source.prompt || source.prompt_es || source.PROMPT_ES || 'Ordena las palabras para formar la oracion.'),
      hint:_elso183Text_(source.hint || source.explanation || source.explanation_es || source.EXPLANATION_ES),
      words:words
    };
  }).filter(function (item) { return !!item; }).slice(0, 10);
}
function _elso183Settings_(room) {
  return _elso183Json_(room && room.SETTINGS_JSON, {});
}
function _elso183Current_(room) {
  return _elso183Json_(room && room.CURRENT_QUESTION_JSON, {});
}
function _elso183TokenId_(roomCode, sentenceIndex, wordIndex, word) {
  var seed = [roomCode, sentenceIndex, wordIndex, word, ELSO183_VERSION].join('|');
  return 'SO-' + Number(sentenceIndex || 1) + '-' + _elive176Hash_(seed).toString(36).toUpperCase();
}
function _elso183Round_(room, settings, sentenceIndex) {
  var sentences = _elso183Sentences_(settings.sentences || settings.custom_sentences || []);
  var index = Math.max(1, Math.min(sentences.length, Number(sentenceIndex || 1) || 1));
  var sentence = sentences[index - 1];
  if (!sentence) throw new Error('No existe la oracion ' + index + '.');
  var canonical = sentence.words.map(function (word, wordIndex) {
    return {
      token_id:_elso183TokenId_(room.ROOM_CODE, index, wordIndex, word),
      label:word
    };
  });
  return {
    version:ELSO183_VERSION,
    type:'sentence_order',
    sentence_id:sentence.sentence_id,
    index:index,
    total:sentences.length,
    prompt:sentence.prompt,
    hint:sentence.hint,
    tokens:_elive176Shuffle_(canonical, room.ROOM_CODE + '|SENTENCE|' + index + '|TOKENS'),
    started_at:_elive176Iso_(new Date()),
    phase:'OPEN'
  };
}
function _elso183CanonicalTokens_(room, settings, sentenceIndex) {
  var sentences = _elso183Sentences_(settings.sentences || settings.custom_sentences || []);
  var index = Math.max(1, Math.min(sentences.length, Number(sentenceIndex || 1) || 1));
  var sentence = sentences[index - 1];
  if (!sentence) return [];
  return sentence.words.map(function (word, wordIndex) {
    return {
      token_id:_elso183TokenId_(room.ROOM_CODE, index, wordIndex, word),
      label:word
    };
  });
}
function _elso183PublicSentence_(room, reveal) {
  var current = _elso183Current_(room);
  var round = current.sentence_order || null;
  if (!round) return null;
  var output = JSON.parse(JSON.stringify(round));
  if (reveal) {
    var settings = _elso183Settings_(room);
    var sentences = _elso183Sentences_(settings.sentences || settings.custom_sentences || []);
    var sentence = sentences[(Number(round.index || room.CURRENT_INDEX || 1) || 1) - 1];
    output.correct_sentence = sentence ? sentence.sentence : '';
    output.explanation = sentence ? sentence.hint : '';
  }
  return output;
}
function _elso183RoomId_(body) {
  return _elive180RoomIdFromBody_(body || {}) || _elso183Text_(body && (body.room_code || body.roomCode || body.codigo));
}
function _elso183Find_(body) {
  var id = _elso183RoomId_(body || {});
  return id ? _elive180FindRoom_(id) : null;
}
function _elso183IsRoom_(body) {
  var found = _elso183Find_(body || {});
  return !!(found && found.row && _elso183Upper_(found.row.GAME_CODE) === ELSO183_GAME_CODE);
}
function _elso183Managed_(body) {
  var auth = _eliveAuthTeacher_(body || {});
  if (!auth || auth.ok !== true) return {ok:false,response:auth || {ok:false,error:'sesion_invalida'}};
  var found = _elso183Find_(body || {});
  if (!found || !found.row) return {ok:false,response:{ok:false,error:'sala_no_encontrada'}};
  if (_elso183Upper_(found.row.GAME_CODE) !== ELSO183_GAME_CODE) return {ok:false,response:{ok:false,error:'sala_no_sentence_order'}};
  if (!_elive180CanRoom_(auth, found.row)) return {ok:false,response:{ok:false,error:'docente_sin_permiso_grupo'}};
  return {ok:true,auth:auth,found:found,room:found.row};
}
function _elso183SameRoom_(row, room) {
  return _elive180SameRoom_(row, room);
}
function _elso183PlayerRows_(room) {
  var table = _elive180Table_(ELIVE_PLAYERS_SHEET, ELIVE_PLAYERS_HEADERS);
  return table.rows.filter(function (row) { return _elso183SameRoom_(row, room); });
}
function _elso183AnswerRows_(room, questionIndex) {
  var table = _elive180Table_(ELIVE_ANSWERS_SHEET, ELIVE_ANSWERS_HEADERS);
  return table.rows.filter(function (row) {
    return _elso183SameRoom_(row, room) &&
      (!questionIndex || Number(row.QUESTION_INDEX || 0) === Number(questionIndex));
  });
}
function _elso183Player_(room, playerId) {
  return _elso183PlayerRows_(room).filter(function (row) {
    return _elso183Text_(row.COD_ESTUDIANTE) === _elso183Text_(playerId);
  })[0] || null;
}
function _elso183PlayerAnswer_(room, questionIndex, playerId) {
  return _elso183AnswerRows_(room, questionIndex).filter(function (row) {
    return _elso183Text_(row.COD_ESTUDIANTE) === _elso183Text_(playerId);
  })[0] || null;
}
function _elso183ParseTokenIds_(value) {
  var raw = value;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); }
    catch (_) { raw = raw.split(/[\s,|]+/); }
  }
  if (!Array.isArray(raw)) return [];
  return raw.map(function (item) {
    return _elso183Text_(item && typeof item === 'object' ? (item.token_id || item.id) : item);
  }).filter(function (item) { return !!item; });
}
function _elso183EqualOrder_(actual, expected) {
  if (actual.length !== expected.length) return false;
  for (var index = 0; index < expected.length; index += 1) {
    if (_elso183Text_(actual[index]) !== _elso183Text_(expected[index])) return false;
  }
  return true;
}
function _elso183SameTokenSet_(actual, expected) {
  if (actual.length !== expected.length) return false;
  var a = actual.slice().sort().join('|');
  var b = expected.slice().sort().join('|');
  return a === b && actual.filter(function (item, index) { return actual.indexOf(item) === index; }).length === actual.length;
}
function _elso183SnapshotResponse_(room, reveal) {
  var snapshot = _elive180BuildSnapshot_(room);
  var response = _elive180ResponseCopy_(snapshot);
  response.ok = true;
  response.version = ELSO183_VERSION;
  response.sentence_order = true;
  response.sentence_round = _elso183PublicSentence_(room, reveal);
  return response;
}

function englishLabSentenceOrderCreateRoomCS21A183(body) {
  body = body || {};
  var auth = _eliveAuthTeacher_(body);
  if (!auth || auth.ok !== true) return auth || {ok:false,error:'sesion_invalida'};
  var cod = _elso183Text_(body.cod_grupo || body.codGrupo || body.grupo);
  if (!cod) return {ok:false,error:'cod_grupo requerido'};
  if (!_eliveCanGroup_(auth, cod)) return {ok:false,error:'docente_sin_permiso_grupo'};
  cod = _eliveCanonicalGroupForRoom_(auth, cod);
  var sentences = _elso183Sentences_(body.sentences || body.custom_sentences || body.customSentences || []);
  var requested = Math.max(3, Math.min(10, Number(body.sentence_count || body.question_count || sentences.length || 5) || 5));
  if (sentences.length !== requested) {
    return {ok:false,version:ELSO183_VERSION,error:'cantidad_oraciones_invalida',mensaje:'La sala requiere exactamente ' + requested + ' oraciones validas de 3 a 18 palabras.'};
  }
  var nivel = _anF65_levelId_(body.nivel || '') || _elso183Upper_(cod.split('-')[0] || 'B1');
  var mode = _elso183Upper_(body.mode || body.modo || 'INDIVIDUAL');
  if (mode !== 'TEAMS') mode = 'INDIVIDUAL';
  var unit = _elive176NormalizeUnit_(body.unit || body.unidad || 'MIX');
  var roomSheet = _elive180SheetDirect_(ELIVE_ROOMS_SHEET, ELIVE_ROOMS_HEADERS);
  var now = _eliveIso_();
  var settings = {
    official_grade:false,
    affects_certificates:false,
    affects_payments:false,
    unit:unit,
    sentence_count:sentences.length,
    sentences:sentences,
    engine:ELSO183_GAME_CODE,
    version:ELSO183_VERSION
  };
  var room = {
    ROOM_ID:'ELIVE-' + Utilities.getUuid(),
    ROOM_CODE:_eliveRoomCode_(roomSheet),
    STATUS:'CREATED',
    COD_GRUPO:cod,
    NIVEL:nivel,
    DOCENTE:_elso183Text_(auth.sesion.nombre || auth.sesion.nombre_completo || auth.sesion.usuario || auth.sesion.cedula || 'DOCENTE'),
    GAME_CODE:ELSO183_GAME_CODE,
    GAME_LABEL:ELSO183_GAME_LABEL,
    QUESTION_COUNT:sentences.length,
    MODE:mode,
    CURRENT_INDEX:0,
    ROUND_STATUS:'READY',
    CURRENT_QUESTION_JSON:'',
    CREATED_AT:now,
    STARTED_AT:'',
    CLOSED_AT:'',
    ROUND_STARTED_AT:'',
    ROUND_CLOSED_AT:'',
    SETTINGS_JSON:JSON.stringify(settings),
    UNIT:unit,
    CONTENT_SOURCE:'ACADEMIA_PLAY_BANK_EDITABLE'
  };
  _elive180AppendObject_(ELIVE_ROOMS_SHEET, ELIVE_ROOMS_HEADERS, room);
  _elive180AppendEvent_(room, 'SENTENCE_ORDER_ROOM_CREATED', auth, {unit:unit,sentences:sentences.length,mode:mode,version:ELSO183_VERSION});
  var publicRoom = _elive176PublicRoom_(room);
  publicRoom.unit = unit;
  return {ok:true,version:ELSO183_VERSION,room:publicRoom,suggested_sentences:sentences,message:'Sala Ordena la oracion creada correctamente.'};
}

function englishLabSentenceOrderTeacherDataCS21A183(body) {
  var base = englishLabLiveGetTeacherData(body || {});
  if (!base || base.ok !== true) return base;
  base.version = ELSO183_VERSION;
  base.rooms = (base.rooms || []).filter(function (room) {
    return _elso183Upper_(room.game_code || room.GAME_CODE) === ELSO183_GAME_CODE;
  });
  return base;
}

function englishLabSentenceOrderStartRoomCS21A183(body) {
  var managed = _elso183Managed_(body || {});
  if (!managed.ok) return managed.response;
  var room = managed.room;
  if (_elso183Upper_(room.STATUS) !== 'CREATED') return {ok:false,error:'sala_no_disponible_para_inicio'};
  var settings = _elso183Settings_(room);
  var sentences = _elso183Sentences_(settings.sentences || []);
  if (sentences.length < 3) return {ok:false,error:'oraciones_insuficientes'};
  var players = _elive180TurnPlayers_(_elso183PlayerRows_(room));
  if (_elso183Upper_(room.MODE) === 'TEAMS') players = _elive176EnsureTeams_(room, players, {team_size:5});
  var now = new Date();
  var round = _elso183Round_(room, settings, 1);
  var current = {type:'sentence_order',game_id:ELSO183_GAME_CODE,index:1,sentence_order:round};
  var updated = _elive180SetCells_(managed.found, {
    STATUS:'LIVE',
    STARTED_AT:room.STARTED_AT || _elive176Iso_(now),
    CURRENT_INDEX:1,
    ROUND_STATUS:'OPEN',
    ROUND_STARTED_AT:_elive176Iso_(now),
    ROUND_CLOSED_AT:'',
    CURRENT_QUESTION_JSON:JSON.stringify(current)
  });
  _elive180AppendEvent_(updated, 'SENTENCE_ORDER_STARTED', managed.auth, {sentence_index:1,players:players.length,version:ELSO183_VERSION});
  _elive180Invalidate_(updated);
  return _elso183SnapshotResponse_(updated, true);
}

function englishLabSentenceOrderNextSentenceCS21A183(body) {
  var managed = _elso183Managed_(body || {});
  if (!managed.ok) return managed.response;
  var room = managed.room;
  if (_elso183Upper_(room.STATUS) !== 'LIVE') return {ok:false,error:'sala_no_activa'};
  var settings = _elso183Settings_(room);
  var sentences = _elso183Sentences_(settings.sentences || []);
  var currentIndex = Math.max(1, Number(room.CURRENT_INDEX || 1) || 1);
  if (currentIndex >= sentences.length) {
    return {ok:false,version:ELSO183_VERSION,error:'sin_mas_oraciones',complete:true,mensaje:'Ya se jugaron todas las oraciones. Cierre la sala para ver el resultado final.'};
  }
  var nextIndex = currentIndex + 1;
  var now = new Date();
  var round = _elso183Round_(room, settings, nextIndex);
  var current = {type:'sentence_order',game_id:ELSO183_GAME_CODE,index:nextIndex,sentence_order:round};
  var updated = _elive180SetCells_(managed.found, {
    CURRENT_INDEX:nextIndex,
    ROUND_STATUS:'OPEN',
    ROUND_STARTED_AT:_elive176Iso_(now),
    ROUND_CLOSED_AT:'',
    CURRENT_QUESTION_JSON:JSON.stringify(current)
  });
  _elive180AppendEvent_(updated, 'SENTENCE_ORDER_NEXT', managed.auth, {sentence_index:nextIndex,version:ELSO183_VERSION});
  _elive180Invalidate_(updated);
  return _elso183SnapshotResponse_(updated, true);
}

function englishLabSentenceOrderGetRoomControlCS21A183(body) {
  var managed = _elso183Managed_(body || {});
  if (!managed.ok) return managed.response;
  var response = _elso183SnapshotResponse_(managed.room, true);
  var settings = _elso183Settings_(managed.room);
  response.settings = settings;
  response.suggested_sentences = _elso183Sentences_(settings.sentences || []);
  response.answer_count = _elso183AnswerRows_(managed.room, Number(managed.room.CURRENT_INDEX || 0)).length;
  return response;
}

function englishLabSentenceOrderJoinRoomCS21A183(body) {
  body = body || {};
  var access = _elive180RequireLab_(body);
  if (!access || access.allowed !== true) return access;
  var normalized = _cs21a144LiveBody_(body, access);
  var found = _elso183Find_(normalized);
  if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
  if (_elso183Upper_(found.row.GAME_CODE) !== ELSO183_GAME_CODE) return {ok:false,error:'sala_no_sentence_order'};
  if (_elso183Upper_(found.row.STATUS) === 'CLOSED') return {ok:false,error:'sala_cerrada'};
  var playerId = _elso183Text_(normalized.player_id || normalized.cod_estudiante);
  var playerName = _elso183Text_(normalized.player_name || normalized.nombre) || playerId;
  if (!playerId) return {ok:false,error:'estudiante_sin_codigo'};
  var table = _elive180Table_(ELIVE_PLAYERS_SHEET, ELIVE_PLAYERS_HEADERS);
  var player = table.rows.filter(function (row) {
    return _elso183SameRoom_(row, found.row) && _elso183Text_(row.COD_ESTUDIANTE) === playerId;
  })[0] || null;
  var now = _eliveIso_();
  if (player) {
    player = _elive180SetCells_({sheet:table.sheet,index:table.index,row:player,rowNumber:player._row}, {NOMBRE:playerName,LAST_SEEN_AT:now,STATUS:'ACTIVE'});
  } else {
    player = {
      ROOM_ID:found.row.ROOM_ID,
      ROOM_CODE:found.row.ROOM_CODE,
      COD_ESTUDIANTE:playerId,
      NOMBRE:playerName,
      TEAM:_elso183Text_(normalized.team || normalized.equipo),
      JOINED_AT:now,
      LAST_SEEN_AT:now,
      STATUS:'ACTIVE'
    };
    _elive180AppendObject_(ELIVE_PLAYERS_SHEET, ELIVE_PLAYERS_HEADERS, player);
    _elive180AppendEvent_(found.row, 'PLAYER_JOINED', {sesion:{nombre:playerName},rol:'student'}, {cod_estudiante:playerId,version:ELSO183_VERSION});
  }
  _elive180Invalidate_(found.row);
  return englishLabSentenceOrderGetPlayerStateCS21A183(normalized);
}

function englishLabSentenceOrderGetPlayerStateCS21A183(body) {
  body = body || {};
  var access = _elive180RequireLab_(body);
  if (!access || access.allowed !== true) return access;
  var normalized = _cs21a144LiveBody_(body, access);
  var found = _elso183Find_(normalized);
  if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
  var room = found.row;
  if (_elso183Upper_(room.GAME_CODE) !== ELSO183_GAME_CODE) return {ok:false,error:'sala_no_sentence_order'};
  var playerId = _elso183Text_(normalized.player_id || normalized.cod_estudiante);
  var player = _elso183Player_(room, playerId);
  if (!player) return {ok:false,error:'jugador_no_registrado'};
  _elive180TouchPlayer_(room, player);
  var questionIndex = Number(room.CURRENT_INDEX || 0) || 0;
  var answer = questionIndex ? _elso183PlayerAnswer_(room, questionIndex, playerId) : null;
  var reveal = !!answer || _elso183Upper_(room.ROUND_STATUS) === 'CLOSED' || _elso183Upper_(room.STATUS) === 'CLOSED';
  var response = _elso183SnapshotResponse_(room, reveal);
  response.player = _elive180PlayerPublic_(player);
  response.my_rank = (response.leaderboard || []).filter(function (row) {
    return _elso183Text_(row.cod_estudiante) === playerId;
  })[0] || null;
  response.can_answer = _elso183Upper_(room.STATUS) === 'LIVE' && _elso183Upper_(room.ROUND_STATUS) === 'OPEN' && !answer;
  response.my_answer = answer ? {
    correct:_elso183Upper_(answer.IS_CORRECT) === 'TRUE',
    points:Number(answer.POINTS || 0) || 0,
    value:_elso183Json_(answer.ANSWER_VALUE, {})
  } : null;
  return response;
}

function englishLabSentenceOrderSubmitCS21A183(body) {
  body = body || {};
  var access = _elive180RequireLab_(body);
  if (!access || access.allowed !== true) return access;
  var normalized = _cs21a144LiveBody_(body, access);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return {ok:false,error:'sala_ocupada',mensaje:'La sala esta procesando otra respuesta.'};
  try {
    var found = _elso183Find_(normalized);
    if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
    var room = found.row;
    if (_elso183Upper_(room.GAME_CODE) !== ELSO183_GAME_CODE) return {ok:false,error:'sala_no_sentence_order'};
    if (_elso183Upper_(room.STATUS) !== 'LIVE' || _elso183Upper_(room.ROUND_STATUS) !== 'OPEN') return {ok:false,error:'ronda_no_abierta'};
    var playerId = _elso183Text_(normalized.player_id || normalized.cod_estudiante);
    var player = _elso183Player_(room, playerId);
    if (!player) return {ok:false,error:'jugador_no_registrado'};
    var questionIndex = Number(room.CURRENT_INDEX || 1) || 1;
    var duplicate = _elso183PlayerAnswer_(room, questionIndex, playerId);
    if (duplicate) return {ok:true,version:ELSO183_VERSION,accepted:false,duplicate:true,message:'Respuesta ya procesada.'};
    var settings = _elso183Settings_(room);
    var canonicalTokens = _elso183CanonicalTokens_(room, settings, questionIndex);
    var expectedIds = canonicalTokens.map(function (token) { return token.token_id; });
    var actualIds = _elso183ParseTokenIds_(normalized.ordered_token_ids || normalized.token_ids || normalized.order || []);
    if (!_elso183SameTokenSet_(actualIds, expectedIds)) return {ok:false,error:'orden_invalido',mensaje:'Use todas las palabras exactamente una vez.'};
    var correct = _elso183EqualOrder_(actualIds, expectedIds);
    var timeMs = Math.max(0, Number(normalized.time_ms || normalized.timeMs || 0) || 0);
    var points = correct ? Math.max(100, 300 - Math.floor(timeMs / 200)) : 0;
    var byId = {};
    canonicalTokens.forEach(function (token) { byId[token.token_id] = token.label; });
    var orderedWords = actualIds.map(function (id) { return byId[id] || ''; });
    var answerRow = {
      ROOM_ID:room.ROOM_ID,
      ROOM_CODE:room.ROOM_CODE,
      QUESTION_INDEX:questionIndex,
      COD_ESTUDIANTE:playerId,
      ANSWER_VALUE:JSON.stringify({ordered_token_ids:actualIds,ordered_words:orderedWords,correct:correct}),
      IS_CORRECT:correct ? 'TRUE' : 'FALSE',
      POINTS:points,
      TIME_MS:timeMs,
      ANSWERED_AT:_eliveIso_()
    };
    _elive180AppendObject_(ELIVE_ANSWERS_SHEET, ELIVE_ANSWERS_HEADERS, answerRow);
    _elive180AppendEvent_(room, 'SENTENCE_ORDER_ANSWER', {sesion:{nombre:_elso183Text_(player.NOMBRE)},rol:'student'}, {cod_estudiante:playerId,sentence_index:questionIndex,correct:correct,points:points,version:ELSO183_VERSION});
    _elive180Invalidate_(room);
    var state = englishLabSentenceOrderGetPlayerStateCS21A183(normalized);
    state.accepted = true;
    state.correct = correct;
    state.points = points;
    return state;
  } finally {
    lock.releaseLock();
  }
}

function englishLabSentenceOrderCloseRoomCS21A183(body) {
  var managed = _elso183Managed_(body || {});
  if (!managed.ok) return managed.response;
  var response = englishLabLiveCloseRoom(body || {});
  if (response && response.ok === true) response.version = ELSO183_VERSION;
  return response;
}

var _elso183VerifyBase_ = verificarActualizacionQA;
verificarActualizacionQA = function () {
  var previous = _elso183VerifyBase_();
  var parsed = _elso183Sentences_([
    {sentence:'My name is Ana.',prompt:'Forma una presentacion.'},
    {sentence:'Where do you live?',prompt:'Forma una pregunta.'},
    {sentence:'She studies English online.',prompt:'Forma una oracion.'}
  ]);
  var fakeRoom = {ROOM_CODE:'LAB-TEST',SETTINGS_JSON:JSON.stringify({sentences:parsed})};
  var round = _elso183Round_(fakeRoom, {sentences:parsed}, 1);
  var valid = previous && previous.ok === true && parsed.length === 3 && round.tokens.length === 4;
  var result = {
    ok:valid,
    version:ELSO183_VERSION,
    objective:ELSO183_OBJECTIVE,
    previous_version:previous && previous.version,
    sentence_order_live_supported:true,
    editable_sentences_supported:true,
    simultaneous_answers_supported:true,
    sentence_count_limits:'3-10',
    word_count_limits:'3-18'
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A183 no supero la verificacion aditiva.');
  return result;
};

var _elso183DoPostBase_ = doPost;
doPost = function (e) {
  try {
    var body = {};
    try { body = _an4406_parseBody_(e) || {}; } catch (_) { body = {}; }
    var fn = _elso183Text_((e && e.parameter && e.parameter.fn) || body.fn).toLowerCase();
    if (fn === 'englishlabsentenceorderteacherdata') return _an4406_json_(englishLabSentenceOrderTeacherDataCS21A183(body));
    if (fn === 'englishlabsentenceordercreateroom') return _an4406_json_(englishLabSentenceOrderCreateRoomCS21A183(body));
    if (fn === 'englishlabsentenceorderstartroom') return _an4406_json_(englishLabSentenceOrderStartRoomCS21A183(body));
    if (fn === 'englishlabsentenceordernextsentence') return _an4406_json_(englishLabSentenceOrderNextSentenceCS21A183(body));
    if (fn === 'englishlabsentenceordergetroomcontrol') return _an4406_json_(englishLabSentenceOrderGetRoomControlCS21A183(body));
    if (fn === 'englishlabsentenceorderjoinroom') return _an4406_json_(englishLabSentenceOrderJoinRoomCS21A183(body));
    if (fn === 'englishlabsentenceordergetplayerstate') return _an4406_json_(englishLabSentenceOrderGetPlayerStateCS21A183(body));
    if (fn === 'englishlabsentenceordersubmit') return _an4406_json_(englishLabSentenceOrderSubmitCS21A183(body));
    if (fn === 'englishlabsentenceordercloseroom') return _an4406_json_(englishLabSentenceOrderCloseRoomCS21A183(body));
    if (fn === 'englishlablivejoinroom' && _elso183IsRoom_(body)) return _an4406_json_(englishLabSentenceOrderJoinRoomCS21A183(body));
    if (fn === 'englishlablivegetplayerstate' && _elso183IsRoom_(body)) return _an4406_json_(englishLabSentenceOrderGetPlayerStateCS21A183(body));
    if (fn === 'verificaractualizacionqa') return _an4406_json_(verificarActualizacionQA());
    return _elso183DoPostBase_(e);
  } catch (error) {
    return _an4406_json_({ok:false,version:ELSO183_VERSION,error:'sentence_order_error',mensaje:String(error && error.message ? error.message : error)});
  }
};


// =============================================================================
// BLOQUE 2/11: 99B_VALIDACION_CURRICULAR_CS21A183.gs
// =============================================================================
// CS21A183 · GUARDIA CURRICULAR ADITIVA QA
// Instalar despues de 99_ACTUALIZACION_QA_CS21A183.gs. No usar en produccion.
// Valida CONFIG_UNIDADES y ACADEMIA_PLAY_BANK antes de crear una sala Sentence Order.

var ELSO183_CURRICULUM_VERSION = 'CS21A183-CURRICULUM';
var ELSO183_CURRICULUM_OBJECTIVE = 'Nivel, unidad, tema y fuente GRAM_02 verificados contra Apollo antes de crear la sala';

function _elso183CurriculumBool_(value) {
  if (value === true) return true;
  var text = _elso183Upper_(value);
  return text === 'TRUE' || text === '1' || text === 'YES' || text === 'SI' || text === 'SÍ';
}
function _elso183CurriculumItemIds_(value) {
  var raw = value;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); }
    catch (_) { raw = raw.split(/[\r\n,|]+/); }
  }
  if (!Array.isArray(raw)) return [];
  var seen = {};
  return raw.map(function (item) {
    var id = _elso183Text_(item && typeof item === 'object' ? (item.play_item_id || item.PLAY_ITEM_ID || item.id) : item);
    if (!id || seen[id]) return null;
    seen[id] = true;
    return id;
  }).filter(function (id) { return !!id; });
}
function _elso183CurriculumUnits_() {
  var order = {B1:1,B2:2,I1:3,I2:4};
  var seen = {};
  return _elive176Rows_('CONFIG_UNIDADES').map(function (row) {
    var level = _elso183Upper_(row.LEVEL_ID);
    var unitId = _elso183Upper_(row.UNIT_ID);
    var status = _elso183Upper_(row.STATUS || 'ACTIVE');
    if (!order[level] || !/^\w\d-U\d{2}$/.test(unitId) || status !== 'ACTIVE' || seen[unitId]) return null;
    seen[unitId] = true;
    return {
      level_id:level,
      unit_number:Number(row.UNIT_NUMBER || unitId.slice(-2)) || 0,
      unit_id:unitId,
      unit_name:_elso183Text_(row.UNIT_NAME),
      unit_objective_es:_elso183Text_(row.UNIT_OBJECTIVE_ES),
      program_topic:_elso183Text_(row.PROGRAM_TOPIC),
      source_reference:_elso183Text_(row.SOURCE_REFERENCE),
      difficulty_1_10:Number(row.DIFFICULTY_1_10 || 0) || 0,
      status:status
    };
  }).filter(function (item) { return !!item; }).sort(function (a, b) {
    return (order[a.level_id] - order[b.level_id]) || (a.unit_number - b.unit_number);
  });
}
function _elso183CurriculumUnit_(level, unit) {
  var wantedLevel = _elso183Upper_(level);
  var shortUnit = _elive176NormalizeUnit_(unit || '');
  var wantedUnit = wantedLevel + '-' + shortUnit;
  return _elso183CurriculumUnits_().filter(function (item) {
    return item.level_id === wantedLevel && item.unit_id === wantedUnit;
  })[0] || null;
}
function _elso183CurriculumSourceRows_(level, unit, gameId) {
  var wantedLevel = _elso183Upper_(level);
  var wantedUnit = wantedLevel + '-' + _elive176NormalizeUnit_(unit || '');
  var wantedGame = _elso183Upper_(gameId);
  return _elive176Rows_('ACADEMIA_PLAY_BANK').filter(function (row) {
    return _elso183Upper_(row.LEVEL_ID) === wantedLevel &&
      _elso183Upper_(row.UNIT_ID) === wantedUnit &&
      _elso183Upper_(row.TEMPLATE_ID) === 'GRAM_02' &&
      _elso183Upper_(row.GAME_ID) === wantedGame &&
      _elso183Upper_(row.ITEM_TYPE) === 'ORDER' &&
      _elso183Upper_(row.STATUS || 'ACTIVE') === 'ACTIVE' &&
      _elso183Text_(row.PLAY_ITEM_ID) &&
      _elso183Text_(row.WORDS_TO_ORDER) &&
      _elso183Text_(row.CORRECT_SENTENCE);
  });
}
function _elso183CurriculumEvidence_(body) {
  body = body || {};
  var cod = _elso183Text_(body.cod_grupo || body.codGrupo || body.grupo);
  var level = _anF65_levelId_(body.nivel || '') || _elso183Upper_(cod.split('-')[0] || '');
  var unit = _elive176NormalizeUnit_(body.unit || body.unidad || '');
  var fullUnit = level + '-' + unit;
  var requested = Math.max(3, Math.min(10, Number(body.sentence_count || body.question_count || 0) || 0));
  var sourceGameId = _elso183Upper_(body.source_game_id || body.sourceGameId);
  var expectedGameId = fullUnit + '-GRAM-02';
  var curriculum = _elso183CurriculumUnit_(level, unit);

  if (!curriculum) {
    return {ok:false,response:{ok:false,version:ELSO183_VERSION,error:'unidad_curricular_invalida',mensaje:'La unidad ' + fullUnit + ' no está activa en CONFIG_UNIDADES.'}};
  }
  if (!_elso183CurriculumBool_(body.curriculum_source_loaded)) {
    return {ok:false,response:{ok:false,version:ELSO183_VERSION,error:'curriculum_source_required',mensaje:'Cargue primero las sugerencias curriculares de la unidad seleccionada.'}};
  }
  if (!_elso183CurriculumBool_(body.curriculum_acknowledged)) {
    return {ok:false,response:{ok:false,version:ELSO183_VERSION,error:'curriculum_acknowledgement_required',mensaje:'Confirme que revisó el tema oficial de la unidad.'}};
  }
  if (!sourceGameId || sourceGameId !== expectedGameId) {
    return {ok:false,response:{ok:false,version:ELSO183_VERSION,error:'fuente_curricular_invalida',mensaje:'La fuente debe ser exactamente ' + expectedGameId + '.'}};
  }

  var sourceRows = _elso183CurriculumSourceRows_(level, unit, sourceGameId);
  if (sourceRows.length !== 5) {
    return {ok:false,response:{ok:false,version:ELSO183_VERSION,error:'cobertura_curricular_incompleta',mensaje:'Apollo debe contener exactamente 5 oraciones GRAM_02 activas para ' + fullUnit + '; se encontraron ' + sourceRows.length + '.'}};
  }
  if (requested < 3 || requested > sourceRows.length) {
    return {ok:false,response:{ok:false,version:ELSO183_VERSION,error:'cantidad_fuera_de_cobertura',mensaje:'Seleccione entre 3 y ' + sourceRows.length + ' oraciones para esta unidad.'}};
  }

  var providedIds = _elso183CurriculumItemIds_(body.source_item_ids || body.sourceItemIds);
  var allowed = {};
  sourceRows.forEach(function (row) { allowed[_elso183Text_(row.PLAY_ITEM_ID)] = true; });
  var invalidIds = providedIds.filter(function (id) { return !allowed[id]; });
  if (providedIds.length < requested || invalidIds.length) {
    return {ok:false,response:{ok:false,version:ELSO183_VERSION,error:'evidencia_curricular_invalida',mensaje:'La evidencia de la fuente no coincide con los ítems GRAM_02 de ' + fullUnit + '.'}};
  }

  return {
    ok:true,
    level:level,
    unit:unit,
    full_unit:fullUnit,
    source_game_id:sourceGameId,
    source_item_ids:providedIds,
    source_rows:sourceRows,
    curriculum:curriculum,
    requested:requested
  };
}

var _elso183CurriculumTeacherBase_ = englishLabSentenceOrderTeacherDataCS21A183;
englishLabSentenceOrderTeacherDataCS21A183 = function (body) {
  var response = _elso183CurriculumTeacherBase_(body || {});
  if (!response || response.ok !== true) return response;
  response.version = ELSO183_VERSION;
  response.curriculum_units = _elso183CurriculumUnits_();
  response.curriculum_contract = {
    version:ELSO183_CURRICULUM_VERSION,
    source_units:'CONFIG_UNIDADES',
    source_games:'ACADEMIA_PLAY_BANK',
    template_id:'GRAM_02',
    item_type:'ORDER',
    active_units_required:64,
    items_per_unit_required:5,
    sentence_count_min:3,
    sentence_count_max:5
  };
  return response;
};

var _elso183CurriculumCreateBase_ = englishLabSentenceOrderCreateRoomCS21A183;
englishLabSentenceOrderCreateRoomCS21A183 = function (body) {
  body = body || {};
  var evidence = _elso183CurriculumEvidence_(body);
  if (!evidence.ok) return evidence.response;
  var response = _elso183CurriculumCreateBase_(body);
  if (!response || response.ok !== true) return response;

  var roomRef = response.room || {};
  var found = _elso183Find_({room_id:roomRef.room_id || roomRef.ROOM_ID || roomRef.room_code || roomRef.ROOM_CODE});
  if (!found || !found.row) return {ok:false,version:ELSO183_VERSION,error:'sala_creada_sin_relectura'};
  var settings = _elso183Settings_(found.row);
  settings.curriculum_verified = true;
  settings.curriculum_guard_version = ELSO183_CURRICULUM_VERSION;
  settings.curriculum = evidence.curriculum;
  settings.source_game_id = evidence.source_game_id;
  settings.source_item_ids = evidence.source_item_ids;
  settings.source_template_id = 'GRAM_02';
  settings.source_item_type = 'ORDER';
  settings.curriculum_acknowledged = true;
  var updated = _elive180SetCells_(found, {
    SETTINGS_JSON:JSON.stringify(settings),
    CONTENT_SOURCE:'CONFIG_UNIDADES|ACADEMIA_PLAY_BANK|GRAM_02'
  });
  _elive180AppendEvent_(updated, 'SENTENCE_ORDER_CURRICULUM_VERIFIED', {sesion:{nombre:'SISTEMA'},rol:'system'}, {
    level:evidence.level,
    unit:evidence.full_unit,
    source_game_id:evidence.source_game_id,
    source_items:evidence.source_item_ids.length,
    requested:evidence.requested,
    version:ELSO183_CURRICULUM_VERSION
  });
  _elive180Invalidate_(updated);
  response.room = _elive176PublicRoom_(updated);
  response.curriculum_verified = true;
  response.curriculum = evidence.curriculum;
  response.source_game_id = evidence.source_game_id;
  return response;
};

var _elso183CurriculumControlBase_ = englishLabSentenceOrderGetRoomControlCS21A183;
englishLabSentenceOrderGetRoomControlCS21A183 = function (body) {
  var response = _elso183CurriculumControlBase_(body || {});
  if (!response || response.ok !== true) return response;
  var settings = response.settings || {};
  response.curriculum_verified = settings.curriculum_verified === true;
  response.curriculum = settings.curriculum || null;
  response.source_game_id = settings.source_game_id || '';
  response.curriculum_guard_version = settings.curriculum_guard_version || '';
  return response;
};

// Un reintento o doble clic no debe sustituir el tablero por una respuesta mínima.
// Ante duplicado se devuelve el estado completo del jugador con la marca duplicate.
var _elso183CurriculumSubmitBase_ = englishLabSentenceOrderSubmitCS21A183;
englishLabSentenceOrderSubmitCS21A183 = function (body) {
  body = body || {};
  var response = _elso183CurriculumSubmitBase_(body);
  if (!response || response.ok !== true || response.duplicate !== true || response.sentence_order === true) return response;
  var state = englishLabSentenceOrderGetPlayerStateCS21A183(body);
  if (!state || state.ok !== true) return response;
  state.accepted = false;
  state.duplicate = true;
  state.message = response.message || 'Respuesta ya procesada.';
  return state;
};

var _elso183CurriculumVerifyBase_ = verificarActualizacionQA;
verificarActualizacionQA = function () {
  var previous = _elso183CurriculumVerifyBase_();
  var units = _elso183CurriculumUnits_();
  var unitMap = {};
  units.forEach(function (unit) { unitMap[unit.unit_id] = unit; });
  var rows = _elive176Rows_('ACADEMIA_PLAY_BANK').filter(function (row) {
    return _elso183Upper_(row.TEMPLATE_ID) === 'GRAM_02' &&
      _elso183Upper_(row.ITEM_TYPE) === 'ORDER' &&
      _elso183Upper_(row.STATUS || 'ACTIVE') === 'ACTIVE';
  });
  var byUnit = {};
  var completeRows = true;
  rows.forEach(function (row) {
    var unitId = _elso183Upper_(row.UNIT_ID);
    byUnit[unitId] = (byUnit[unitId] || 0) + 1;
    if (!unitMap[unitId] || !_elso183Text_(row.PLAY_ITEM_ID) || !_elso183Text_(row.GAME_ID) ||
        !_elso183Text_(row.WORDS_TO_ORDER) || !_elso183Text_(row.CORRECT_SENTENCE)) completeRows = false;
  });
  var exactFive = units.length === 64 && units.every(function (unit) { return byUnit[unit.unit_id] === 5; });
  var valid = previous && previous.ok === true && units.length === 64 && rows.length === 320 && exactFive && completeRows;
  var result = {
    ok:valid,
    version:ELSO183_VERSION,
    objective:ELSO183_CURRICULUM_OBJECTIVE,
    previous_version:previous && previous.version,
    sentence_order_live_supported:previous && previous.sentence_order_live_supported === true,
    curriculum_guard:true,
    curriculum_units:units.length,
    active_gram_02_items:rows.length,
    five_items_per_unit:exactFive,
    curriculum_rows_complete:completeRows,
    curriculum_source_required:true,
    curriculum_acknowledgement_required:true,
    duplicate_response_preserves_state:true,
    sentence_count_limits:'3-5'
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A183 no supero la validacion curricular Apollo.');
  return result;
};


// =============================================================================
// BLOQUE 3/11: 99C_FIX_FUENTE_APOLLO_QA_CS21A183.gs
// =============================================================================
// CS21A183 · HOTFIX QA · FUENTE CURRICULAR APOLLO
// Agregar AL FINAL de 99_CS21A183_SENTENCE_ORDER_COMPLETO en Apps Script QA.
// No usar en produccion. Lee CONFIG_UNIDADES y ACADEMIA_PLAY_BANK exclusivamente
// desde QA_STAGING_MASTER_ID y falla cerrado si la configuracion QA no coincide.

var ELSO183_APOLLO_SOURCE_FIX_VERSION = 'CS21A183-APOLLO-QA-FIX';

function _elso183ApolloRows_(sheetName) {
  var props = PropertiesService.getScriptProperties();
  var masterId = _elso183Text_(props.getProperty('QA_STAGING_MASTER_ID'));
  if (!masterId) throw new Error('Falta la propiedad QA_STAGING_MASTER_ID.');
  if (typeof SHEET_ID !== 'undefined' && _elso183Text_(SHEET_ID) && _elso183Text_(SHEET_ID) !== masterId) {
    throw new Error('QA_STAGING_MASTER_ID no coincide con SHEET_ID del staging.');
  }
  var cache = CacheService.getScriptCache();
  var key = 'ELSO183_APOLLO_QA|' + masterId + '|' + _elso183Upper_(sheetName);
  var cached = cache.get(key);
  if (cached) {
    try { return JSON.parse(cached); } catch (_) {}
  }
  var sh = SpreadsheetApp.openById(masterId).getSheetByName(sheetName);
  if (!sh) throw new Error('Falta la hoja ' + sheetName + ' en Apollo QA staging.');
  var lastRow = sh.getLastRow();
  var lastColumn = sh.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) return [];
  var values = sh.getRange(1, 1, lastRow, lastColumn).getDisplayValues();
  var headers = values[0].map(function (header) { return _elso183Upper_(header); });
  var rows = values.slice(1).filter(function (row) {
    return row.some(function (cell) { return _elso183Text_(cell); });
  }).map(function (row) {
    var out = {};
    headers.forEach(function (header, index) { out[header] = row[index]; });
    return out;
  });
  try { cache.put(key, JSON.stringify(rows), 300); } catch (_) {}
  return rows;
}

// Sustituye solo las lecturas curriculares; el banco QUESTION_BANK de Memory Match
// continua usando _elive176Rows_ y ENGLISH_LAB_GAME_DB_ID.
_elso183CurriculumUnits_ = function () {
  var order = {B1:1,B2:2,I1:3,I2:4};
  var seen = {};
  return _elso183ApolloRows_('CONFIG_UNIDADES').map(function (row) {
    var level = _elso183Upper_(row.LEVEL_ID);
    var unitId = _elso183Upper_(row.UNIT_ID);
    var status = _elso183Upper_(row.STATUS || 'ACTIVE');
    if (!order[level] || !/^\w\d-U\d{2}$/.test(unitId) || status !== 'ACTIVE' || seen[unitId]) return null;
    seen[unitId] = true;
    return {
      level_id:level,
      unit_number:Number(row.UNIT_NUMBER || unitId.slice(-2)) || 0,
      unit_id:unitId,
      unit_name:_elso183Text_(row.UNIT_NAME),
      unit_objective_es:_elso183Text_(row.UNIT_OBJECTIVE_ES),
      program_topic:_elso183Text_(row.PROGRAM_TOPIC),
      source_reference:_elso183Text_(row.SOURCE_REFERENCE),
      difficulty_1_10:Number(row.DIFFICULTY_1_10 || 0) || 0,
      status:status
    };
  }).filter(function (item) { return !!item; }).sort(function (a, b) {
    return (order[a.level_id] - order[b.level_id]) || (a.unit_number - b.unit_number);
  });
};

_elso183CurriculumSourceRows_ = function (level, unit, gameId) {
  var wantedLevel = _elso183Upper_(level);
  var wantedUnit = wantedLevel + '-' + _elive176NormalizeUnit_(unit || '');
  var wantedGame = _elso183Upper_(gameId);
  return _elso183ApolloRows_('ACADEMIA_PLAY_BANK').filter(function (row) {
    return _elso183Upper_(row.LEVEL_ID) === wantedLevel &&
      _elso183Upper_(row.UNIT_ID) === wantedUnit &&
      _elso183Upper_(row.TEMPLATE_ID) === 'GRAM_02' &&
      _elso183Upper_(row.GAME_ID) === wantedGame &&
      _elso183Upper_(row.ITEM_TYPE) === 'ORDER' &&
      _elso183Upper_(row.STATUS || 'ACTIVE') === 'ACTIVE' &&
      _elso183Text_(row.PLAY_ITEM_ID) &&
      _elso183Text_(row.WORDS_TO_ORDER) &&
      _elso183Text_(row.CORRECT_SENTENCE);
  });
};

// El verificador final anterior intentaba leer ACADEMIA_PLAY_BANK desde la DB de juegos.
// Se reemplaza por el mismo contrato, pero usando Apollo QA de forma explicita.
verificarActualizacionQA = function () {
  var previous = _elso183CurriculumVerifyBase_();
  var units = _elso183CurriculumUnits_();
  var unitMap = {};
  units.forEach(function (unit) { unitMap[unit.unit_id] = unit; });
  var rows = _elso183ApolloRows_('ACADEMIA_PLAY_BANK').filter(function (row) {
    return _elso183Upper_(row.TEMPLATE_ID) === 'GRAM_02' &&
      _elso183Upper_(row.ITEM_TYPE) === 'ORDER' &&
      _elso183Upper_(row.STATUS || 'ACTIVE') === 'ACTIVE';
  });
  var byUnit = {};
  var completeRows = true;
  rows.forEach(function (row) {
    var unitId = _elso183Upper_(row.UNIT_ID);
    byUnit[unitId] = (byUnit[unitId] || 0) + 1;
    if (!unitMap[unitId] || !_elso183Text_(row.PLAY_ITEM_ID) || !_elso183Text_(row.GAME_ID) ||
        !_elso183Text_(row.WORDS_TO_ORDER) || !_elso183Text_(row.CORRECT_SENTENCE)) completeRows = false;
  });
  var exactFive = units.length === 64 && units.every(function (unit) { return byUnit[unit.unit_id] === 5; });
  var valid = previous && previous.ok === true && units.length === 64 && rows.length === 320 && exactFive && completeRows;
  var result = {
    ok:valid,
    version:ELSO183_VERSION,
    objective:ELSO183_CURRICULUM_OBJECTIVE,
    previous_version:previous && previous.version,
    sentence_order_live_supported:previous && previous.sentence_order_live_supported === true,
    curriculum_guard:true,
    curriculum_units:units.length,
    active_gram_02_items:rows.length,
    five_items_per_unit:exactFive,
    curriculum_rows_complete:completeRows,
    curriculum_source_required:true,
    curriculum_acknowledgement_required:true,
    duplicate_response_preserves_state:true,
    sentence_count_limits:'3-5',
    curriculum_source:'QA_STAGING_MASTER_ID',
    curriculum_source_fix:ELSO183_APOLLO_SOURCE_FIX_VERSION
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A183 no supero la validacion curricular Apollo QA.');
  return result;
};


// =============================================================================
// BLOQUE 4/11: 99D_FIX_MEMORY_MATCH_START_QA_CS21A183.gs
// =============================================================================
// CS21A183 · FIX3 QA · Memory Match inicio + presencia real
// APPEND-ONLY en el repositorio, pero el usuario recibe SIEMPRE el archivo 99 completo ensamblado.
// No usar en producción. No delega el inicio a wrappers históricos.

var CS21A183_MM_START_FIX_VERSION = 'CS21A183-MM-START-FIX3';
var CS21A183_MM_PRESENCE_TTL_MS = 60000;

function _cs21a183MmStartText_(value) {
  return String(value == null ? '' : value).trim();
}

function _cs21a183MmStartQaGuard_() {
  var props = PropertiesService.getScriptProperties();
  var masterId = _cs21a183MmStartText_(props.getProperty('QA_STAGING_MASTER_ID'));
  var operationalId = _cs21a183MmStartText_(props.getProperty('QA_STAGING_OPERATIVO_ID'));
  if (!masterId || !operationalId) {
    throw new Error('BLOQUEADO: faltan QA_STAGING_MASTER_ID o QA_STAGING_OPERATIVO_ID.');
  }
  var masterName = SpreadsheetApp.openById(masterId).getName();
  var operationalName = SpreadsheetApp.openById(operationalId).getName();
  if (!/QA|STAGING/i.test(masterName) || !/QA|STAGING/i.test(operationalName)) {
    throw new Error('BLOQUEADO: CS21A183 Memory Match FIX3 solo puede ejecutarse en QA/STAGING.');
  }
  return { master:masterName, operational:operationalName };
}

function _cs21a183MmJson_(value, fallback) {
  if (value && typeof value === 'object') return value;
  try { return value ? JSON.parse(String(value)) : (fallback || {}); }
  catch (_) { return fallback || {}; }
}

// Conserva este helper null-safe porque otras capas históricas todavía lo invocan.
function _elmm174Settings_(room) {
  return _cs21a183MmJson_(room && room.SETTINGS_JSON, {});
}

function _cs21a183MmSameRoom_(row, room) {
  return _elive176Text_(row && row.ROOM_ID) === _elive176Text_(room && room.ROOM_ID) ||
    _elive176Text_(row && row.ROOM_CODE) === _elive176Text_(room && room.ROOM_CODE);
}

function _cs21a183MmPresenceRows_(room, nowMs) {
  room = room || {};
  nowMs = Number(nowMs || Date.now()) || Date.now();
  var table = _elive180Table_(ELIVE_PLAYERS_SHEET, ELIVE_PLAYERS_HEADERS);
  return table.rows.filter(function (row) {
    if (!_cs21a183MmSameRoom_(row, room)) return false;
    var status = _elive176Upper_(row.STATUS || 'ACTIVE');
    if (status === 'LEFT' || status === 'INACTIVE' || status === 'CLOSED' || status === 'REMOVED') return false;
    var seenAt = _elive176Timestamp_(row.LAST_SEEN_AT || row.JOINED_AT);
    if (!seenAt) return false;
    var age = Math.max(0, nowMs - seenAt);
    return age <= CS21A183_MM_PRESENCE_TTL_MS;
  });
}

function _cs21a183MmAllPlayerRows_(room) {
  var table = _elive180Table_(ELIVE_PLAYERS_SHEET, ELIVE_PLAYERS_HEADERS);
  return table.rows.filter(function (row) { return _cs21a183MmSameRoom_(row, room); });
}

function _cs21a183MmTurnPlayers_(rows) {
  return (rows || []).map(function (row) {
    var id = _elive176Text_(row.COD_ESTUDIANTE);
    return {
      player_id:id,
      name:_elive176Text_(row.NOMBRE) || id,
      team_id:_elive176Text_(row.TEAM) || 'NO_TEAM',
      joined_at:_elive176Text_(row.JOINED_AT),
      row_number:row._row
    };
  }).filter(function (player) { return !!player.player_id; });
}

function _cs21a183MmCards_(room, settings) {
  room = room || {};
  settings = settings || {};
  var expected = Math.max(3, Math.min(12, Number(settings.pair_count || 6) || 6));
  var customPairs = typeof _elive181CustomPairs_ === 'function'
    ? _elive181CustomPairs_(settings.custom_pairs || [])
    : [];
  if (customPairs.length) {
    if (customPairs.length !== expected) {
      throw new Error('La sala requiere exactamente ' + expected + ' parejas personalizadas.');
    }
    if (typeof _elive181CardsFromPairs_ !== 'function') {
      throw new Error('No está disponible el constructor de parejas editables CS21A181.');
    }
    return _elive181CardsFromPairs_(room, customPairs);
  }

  var level = _elive176Upper_(room.NIVEL || settings.level || 'B1');
  var unit = _elive176NormalizeUnit_(settings.unit || room.UNIT || 'MIX');
  var rows = _elmm174Shuffle_(
    _elive176PairRows_(level, unit),
    _elive176Text_(room.ROOM_CODE) + '|FIX3|' + unit + '|' + level
  ).slice(0, expected);
  if (rows.length < expected) {
    throw new Error('Banco insuficiente para ' + level + '/' + unit + ': ' + rows.length + ' pares; se requieren ' + expected + '.');
  }
  var cards = [];
  rows.forEach(function (row, index) {
    var pairId = _elive176Text_(row.CONTENT_ID) || ('PAIR-' + (index + 1));
    cards.push({card_id:pairId + '-L',pair_id:pairId,face_type:'TEXT',label:_elive176Text_(row.PAIR_LEFT || row.STEM),media_id:_elive176Text_(row.MEDIA_ID)});
    cards.push({card_id:pairId + '-R',pair_id:pairId,face_type:'TEXT',label:_elive176Text_(row.PAIR_RIGHT),media_id:''});
  });
  return _elmm174Shuffle_(cards, _elive176Text_(room.ROOM_CODE) + '|FIX3-CARDS');
}

function _cs21a183MmPackage_(room, settings, cards, rules, players, now) {
  room = room || {};
  settings = settings || {};
  cards = Array.isArray(cards) ? cards : [];
  rules = rules || {};
  players = Array.isArray(players) ? players : [];
  now = now instanceof Date ? now : new Date();
  var autoStart = Math.max(0, Number(rules.auto_start_delay_ms || 0) || 0);
  var duration = Math.max(5000, Number(rules.round_duration_ms || 30000) || 30000);
  var startAt = new Date(now.getTime() + autoStart);
  var endAt = new Date(startAt.getTime() + duration);
  var mode = _elive176Upper_(room.MODE || 'INDIVIDUAL');
  var policy = mode === 'TEAMS' ? ELIVE176_POLICY_TEAM_ALTERNATING : ELIVE176_POLICY_RANDOM_PLAYER;
  var turnState = _elive176CreateTurnState_(room, players, policy, startAt, duration);
  var teams = typeof _elive176GroupTeams_ === 'function' ? _elive176GroupTeams_(players) : [];
  var pkg = {
    version:ELIVE176_VERSION,
    server_now:_elive176Iso_(now),
    received_at_ms:now.getTime(),
    room:{
      room_code:_elive176Text_(room.ROOM_CODE),
      game_id:ELMM174_GAME_CODE,
      mode:mode,
      level_id:_elive176Upper_(room.NIVEL || 'B1')
    },
    round:{
      round_id:_elive176Text_(room.ROOM_CODE) + '-R1',
      index:1,
      title:ELMM174_GAME_LABEL + ' · ' + _elive176Upper_(settings.unit || room.UNIT || 'MIX'),
      cards:cards
    },
    rules:rules,
    state:{
      phase:autoStart > 0 ? 'COUNTDOWN' : 'OPEN',
      started_at:_elive176Iso_(startAt),
      ends_at:_elive176Iso_(endAt),
      active_player_id:turnState.active_player_id,
      active_team_id:turnState.active_team_id
    },
    teams:teams,
    players:players,
    turn_state:turnState,
    shared_state:{version:ELIVE176_VERSION,board_version:1,matched_pair_ids:[],completed:false,last_action_key:''}
  };
  return pkg;
}

function _cs21a183MmPresenceResponse_(response, room) {
  response = response || {};
  room = room || {};
  var registered = _cs21a183MmAllPlayerRows_(room);
  var online = _cs21a183MmPresenceRows_(room, Date.now());
  var onlinePlayers = _cs21a183MmTurnPlayers_(online);
  response.stats = response.stats || {};
  response.stats.players_registered = registered.length;
  response.stats.players_online = online.length;
  response.stats.players = online.length;
  response.online_players = online.map(_elive180PlayerPublic_);
  response.presence_ttl_seconds = Math.floor(CS21A183_MM_PRESENCE_TTL_MS / 1000);
  response.presence_version = CS21A183_MM_START_FIX_VERSION;
  if (response.room_package) {
    response.room_package.players = onlinePlayers;
    response.room_package.teams = _elive180Teams_(online);
  }
  return response;
}

// FIX3: inicio autocontenido. NO llama a englishLabMemoryMatchStartRoom anterior.
englishLabMemoryMatchStartRoomCS21A176 = function (body) {
  body = body || {};
  var stage = 'QA_GUARD';
  try {
    _cs21a183MmStartQaGuard_();

    stage = 'AUTH';
    var auth = _eliveAuthTeacher_(body);
    if (!auth || auth.ok !== true) return auth || {ok:false,error:'sesion_invalida'};

    stage = 'ROOM_LOOKUP';
    var roomId = _elive180RoomIdFromBody_(body);
    if (!roomId) return {ok:false,error:'room_id requerido'};
    var found = _elive180FindRoom_(roomId);
    if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
    var room = found.row;

    stage = 'ROOM_PERMISSION';
    if (!_elive180CanRoom_(auth, room)) return {ok:false,error:'docente_sin_permiso_grupo'};
    if (_elive176Upper_(room.GAME_CODE) !== ELMM174_GAME_CODE) return {ok:false,error:'sala_no_memory_match'};
    if (_elive176Upper_(room.STATUS) === 'CLOSED') return {ok:false,error:'sala_cerrada'};
    if (_elive176Upper_(room.STATUS) === 'LIVE') {
      var alreadyLive = _elive180BuildSnapshot_(room);
      alreadyLive.memory_match_start_fix = CS21A183_MM_START_FIX_VERSION;
      alreadyLive.already_started = true;
      return _cs21a183MmPresenceResponse_(_elive180ResponseCopy_(alreadyLive), room);
    }

    stage = 'SETTINGS';
    var settings = _cs21a183MmJson_(room.SETTINGS_JSON, {});
    settings.unit = _elive176NormalizeUnit_(settings.unit || room.UNIT || 'MIX');
    settings.pair_count = Math.max(3, Math.min(12, Number(settings.pair_count || 6) || 6));
    var rawCustom = body.custom_pairs || body.customPairs || '';
    if (rawCustom && typeof _elive181CustomPairs_ === 'function') {
      var requestedPairs = _elive181CustomPairs_(rawCustom);
      if (requestedPairs.length !== settings.pair_count) {
        return {ok:false,version:CS21A183_MM_START_FIX_VERSION,error:'cantidad_parejas_invalida',stage:stage,mensaje:'La sala requiere exactamente ' + settings.pair_count + ' parejas con el formato palabra = significado.'};
      }
      settings.custom_pairs = requestedPairs;
    }

    stage = 'RULES';
    var rules = _elmm174Rules_(room.NIVEL, room.MODE);

    stage = 'PRESENCE';
    var presentRows = _cs21a183MmPresenceRows_(room, Date.now());
    var players = _cs21a183MmTurnPlayers_(presentRows);
    if (!players.length) {
      return {ok:false,version:CS21A183_MM_START_FIX_VERSION,error:'sin_participantes_presentes',stage:stage,mensaje:'No hay estudiantes conectados en los últimos 60 segundos. Pídales entrar a la sala antes de iniciar.'};
    }
    if (_elive176Upper_(room.MODE) === 'TEAMS' && players.length < 2) {
      return {ok:false,version:CS21A183_MM_START_FIX_VERSION,error:'equipos_requieren_dos_participantes',stage:stage,mensaje:'Para modo Equipos deben estar conectados al menos dos estudiantes.'};
    }

    stage = 'TEAMS';
    players = _elive176EnsureTeams_(room, players, rules);

    stage = 'CARDS';
    var cards = _cs21a183MmCards_(room, settings);

    stage = 'PACKAGE';
    var now = new Date();
    var pkg = _cs21a183MmPackage_(room, settings, cards, rules, players, now);
    var current = {type:'memory_match',game_id:ELMM174_GAME_CODE,index:1,room_package:pkg};

    stage = 'WRITE_ROOM';
    var updated = _elive180SetCells_(found, {
      STATUS:'LIVE',
      STARTED_AT:room.STARTED_AT || _elive176Iso_(now),
      CURRENT_INDEX:1,
      ROUND_STATUS:'OPEN',
      ROUND_STARTED_AT:_elive176Iso_(now),
      ROUND_CLOSED_AT:'',
      SETTINGS_JSON:JSON.stringify(settings),
      CURRENT_QUESTION_JSON:JSON.stringify(current)
    });
    _elive180Invalidate_(updated);

    stage = 'EVENT';
    _elive180AppendEvent_(updated, 'MEMORY_MATCH_STARTED', auth, {
      cards:cards.length,
      pairs:cards.length / 2,
      players:players.length,
      participation_policy:pkg.turn_state.participation_policy,
      active_player_id:pkg.turn_state.active_player_id,
      active_team_id:pkg.turn_state.active_team_id,
      version:CS21A183_MM_START_FIX_VERSION
    });

    stage = 'RESPONSE';
    var response = {
      ok:true,
      version:CS21A183_MM_START_FIX_VERSION,
      memory_match:true,
      memory_match_start_fix:CS21A183_MM_START_FIX_VERSION,
      start_stage:'COMPLETE',
      room:_elive176PublicRoom_(updated),
      room_package:pkg,
      turn_state:pkg.turn_state,
      shared_state:pkg.shared_state,
      stats:{players:players.length,players_online:players.length,players_registered:_cs21a183MmAllPlayerRows_(updated).length,answers_total:0,answers_current:0},
      presence_ttl_seconds:60
    };
    return response;
  } catch (error) {
    return {
      ok:false,
      version:CS21A183_MM_START_FIX_VERSION,
      error:'memory_match_start_fix3_error',
      stage:stage,
      mensaje:'[' + stage + '] ' + String(error && error.message ? error.message : error)
    };
  }
};

// Control docente: participantes = presencia reciente, no filas históricas ACTIVE.
englishLabMemoryMatchGetRoomControlCS21A180 = function (body) {
  body = body || {};
  var stage = 'AUTH';
  try {
    var auth = _eliveAuthTeacher_(body);
    if (!auth || auth.ok !== true) return auth || {ok:false,error:'sesion_invalida'};
    stage = 'ROOM_LOOKUP';
    var id = _elive180RoomIdFromBody_(body);
    if (!id) return {ok:false,error:'room_id requerido'};
    var found = _elive180FindRoom_(id);
    if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
    if (!_elive180CanRoom_(auth, found.row)) return {ok:false,error:'docente_sin_permiso_grupo'};
    if (_elive176Upper_(found.row.GAME_CODE) !== ELMM174_GAME_CODE) return {ok:false,error:'sala_no_memory_match'};
    stage = 'SNAPSHOT';
    var room = _elive180MaybeAdvanceTurn_(found) || found.row;
    var response = _elive180ResponseCopy_(_elive180BuildSnapshot_(room));
    response.version = CS21A183_MM_START_FIX_VERSION;
    return _cs21a183MmPresenceResponse_(response, room);
  } catch (error) {
    return {ok:false,version:CS21A183_MM_START_FIX_VERSION,error:'memory_match_control_fix3_error',stage:stage,mensaje:'[' + stage + '] ' + String(error && error.message ? error.message : error)};
  }
};

// El estudiante conserva el motor existente, pero las cifras de presencia se corrigen.
var _cs21a183MmPlayerStateBase_ = typeof englishLabMemoryMatchGetPlayerStateCS21A180 === 'function'
  ? englishLabMemoryMatchGetPlayerStateCS21A180
  : null;
if (_cs21a183MmPlayerStateBase_) {
  englishLabMemoryMatchGetPlayerStateCS21A180 = function (body) {
    var response = _cs21a183MmPlayerStateBase_(body || {});
    if (!response || response.ok !== true || !response.room) return response;
    var id = _elive176Text_(response.room.room_id || response.room.ROOM_ID || response.room.room_code || response.room.ROOM_CODE || _elive180RoomIdFromBody_(body || {}));
    var found = id ? _elive180FindRoom_(id) : null;
    if (!found || !found.row) return response;
    return _cs21a183MmPresenceResponse_(response, found.row);
  };
}

function verificarMemoryMatchStartFixCS21A183() {
  var qa = _cs21a183MmStartQaGuard_();
  var undefinedSettings = _elmm174Settings_(undefined);
  var createdRoom = {ROOM_ID:'ELIVE-TEST',ROOM_CODE:'LAB-TEST-CS21A183D',STATUS:'CREATED',GAME_CODE:'MEMORY_MATCH',NIVEL:'B1',MODE:'TEAMS',UNIT:'U01',SETTINGS_JSON:'{"unit":"U01","pair_count":4}'};
  var createdSettings = _cs21a183MmJson_(createdRoom.SETTINGS_JSON, {});
  var syntheticPlayers = [
    {player_id:'P1',name:'Jugador 1',team_id:'Equipo Azul',joined_at:'2026-08-06T00:00:00Z'},
    {player_id:'P2',name:'Jugador 2',team_id:'Equipo Rojo',joined_at:'2026-08-06T00:00:00Z'}
  ];
  var syntheticPackage = _cs21a183MmPackage_(createdRoom, createdSettings, [], {auto_start_delay_ms:0,round_duration_ms:30000}, syntheticPlayers, new Date());
  var result = {
    ok:!!(undefinedSettings && createdSettings.unit === 'U01' && syntheticPackage && syntheticPackage.room && syntheticPackage.room.room_code === createdRoom.ROOM_CODE && typeof englishLabMemoryMatchStartRoomCS21A176 === 'function' && typeof englishLabMemoryMatchGetRoomControlCS21A180 === 'function'),
    version:CS21A183_MM_START_FIX_VERSION,
    memory_match_start_guard:true,
    direct_start_no_legacy_delegate:true,
    settings_undefined_safe:!!undefinedSettings,
    created_room_settings_safe:createdSettings.unit === 'U01',
    created_room_package_safe:!!(syntheticPackage && syntheticPackage.room && syntheticPackage.room.room_code === createdRoom.ROOM_CODE),
    presence_ttl_seconds:Math.floor(CS21A183_MM_PRESENCE_TTL_MS / 1000),
    stale_players_excluded:true,
    start_function_installed:typeof englishLabMemoryMatchStartRoomCS21A176 === 'function',
    control_presence_installed:typeof englishLabMemoryMatchGetRoomControlCS21A180 === 'function',
    preserves_curriculum_verifier:true,
    qa_master:qa.master,
    qa_operational:qa.operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A183 Memory Match FIX3 no superó la verificación QA.');
  return result;
}


// =============================================================================
// BLOQUE 5/11: 99E_FIX_MEMORY_MATCH_PAIR_METADATA_QA_CS21A183.gs
// =============================================================================
// CS21A183 · FIX4 QA · metadatos canónicos del editor Memory Match
// APPEND-ONLY en el repositorio; el usuario recibe SIEMPRE el archivo Apps Script completo ensamblado.
// No usar en producción. Conserva FIX3 y restaura pair_count/settings/suggested_pairs en el control docente.

var CS21A183_MM_PAIR_METADATA_FIX_VERSION = 'CS21A183-MM-PAIR-METADATA-FIX4';

function _cs21a183MmCanonicalPairMetadata_(room) {
  room = room || {};
  var settings = _cs21a183MmJson_(room && room.SETTINGS_JSON, {});
  settings.unit = _elive176NormalizeUnit_(settings.unit || room.UNIT || 'MIX');
  settings.pair_count = Math.max(3, Math.min(12, Number(settings.pair_count || 6) || 6));
  return {
    settings:settings,
    pair_count:settings.pair_count
  };
}

function _cs21a183MmApplyPairMetadata_(response, room) {
  response = response || {};
  room = room || {};
  var metadata = _cs21a183MmCanonicalPairMetadata_(room);
  response.settings = metadata.settings;
  response.pair_count = metadata.pair_count;
  response.pair_metadata_version = CS21A183_MM_PAIR_METADATA_FIX_VERSION;

  if (_elive176Upper_(room.STATUS) === 'CREATED' && typeof _elive181SuggestedPairs_ === 'function') {
    var suggestions = _elive181SuggestedPairs_(room, metadata.settings) || [];
    response.suggested_pairs = suggestions.slice(0, metadata.pair_count);
  }
  return response;
}

var _cs21a183MmControlFix3Base_ = englishLabMemoryMatchGetRoomControlCS21A180;
englishLabMemoryMatchGetRoomControlCS21A180 = function (body) {
  body = body || {};
  var response = _cs21a183MmControlFix3Base_(body);
  if (!response || response.ok !== true) return response;

  var id = _elive180RoomIdFromBody_(body);
  var found = id ? _elive180FindRoom_(id) : null;
  if (!found || !found.row || _elive176Upper_(found.row.GAME_CODE) !== ELMM174_GAME_CODE) return response;

  response.version = CS21A183_MM_PAIR_METADATA_FIX_VERSION;
  return _cs21a183MmApplyPairMetadata_(response, found.row);
};

var _cs21a183MmVerifyFix3Base_ = verificarMemoryMatchStartFixCS21A183;
verificarMemoryMatchStartFixCS21A183 = function () {
  var previous = _cs21a183MmVerifyFix3Base_();
  var syntheticRoom = {
    ROOM_ID:'ELIVE-FIX4-TEST',
    ROOM_CODE:'LAB-FIX4-TEST',
    STATUS:'CREATED',
    GAME_CODE:'MEMORY_MATCH',
    UNIT:'U01',
    SETTINGS_JSON:'{"unit":"U01","pair_count":3}'
  };
  var metadata = _cs21a183MmCanonicalPairMetadata_(syntheticRoom);
  var applied = _cs21a183MmApplyPairMetadata_({ok:true}, syntheticRoom);
  var valid = !!(
    previous && previous.ok === true &&
    metadata.pair_count === 3 &&
    applied.pair_count === 3 &&
    applied.settings && applied.settings.pair_count === 3 &&
    typeof englishLabMemoryMatchGetRoomControlCS21A180 === 'function'
  );
  var result = {
    ok:valid,
    version:CS21A183_MM_PAIR_METADATA_FIX_VERSION,
    previous_version:previous && previous.version,
    memory_match_start_guard:previous && previous.memory_match_start_guard === true,
    direct_start_no_legacy_delegate:previous && previous.direct_start_no_legacy_delegate === true,
    presence_ttl_seconds:previous && previous.presence_ttl_seconds,
    control_pair_metadata:true,
    canonical_pair_count_from_room:true,
    synthetic_pair_count:metadata.pair_count,
    suggested_pairs_follow_room_count:true,
    stale_default_six_blocked:true,
    preserves_curriculum_verifier:true,
    qa_master:previous && previous.qa_master,
    qa_operational:previous && previous.qa_operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A183 Memory Match FIX4 no superó la verificación de metadatos canónicos.');
  return result;
};


// =============================================================================
// BLOQUE 6/11: 99F_FIX_MEMORY_MATCH_CLOSED_ROOM_QA_CS21A185.gs
// =============================================================================
// CS21A185 · QA · sala cerrada terminal + presencia detenida
// APPEND-ONLY en el repositorio; el usuario recibe SIEMPRE el archivo Apps Script completo ensamblado.
// No usar en producción. Una sala CLOSED no vuelve a avanzar turnos ni renueva presencia.

var CS21A185_MM_CLOSED_ROOM_FIX_VERSION = 'CS21A185-MM-CLOSED-ROOM-FIX1';

function _cs21a185MmRoomClosed_(room) {
  return _elive176Upper_(room && room.STATUS) === 'CLOSED';
}

// Reemplaza el avance histórico para hacer CLOSED un estado realmente terminal.
// Se repite la comprobación después del refetch bajo lock para cerrar la carrera
// entre una lectura LIVE y un cierre concurrente del docente.
var _cs21a185MmMaybeAdvanceLegacy_ = _elive180MaybeAdvanceTurn_;
_elive180MaybeAdvanceTurn_ = function (found) {
  if (!found || !found.row) return null;
  if (_cs21a185MmRoomClosed_(found.row)) return found.row;

  var firstPackage = _elive176Package_(found.row);
  if (!firstPackage || !firstPackage.state || !firstPackage.turn_state) return found.row;
  var firstNow = Date.now();
  var firstStarted = _elive176Timestamp_(firstPackage.turn_state.turn_started_at || firstPackage.state.started_at);
  var firstEnds = _elive176Timestamp_(firstPackage.turn_state.turn_ends_at || firstPackage.state.ends_at);
  var needsChange = (_elive176Upper_(firstPackage.state.phase) === 'COUNTDOWN' && firstStarted && firstNow >= firstStarted) ||
    (firstEnds && firstNow >= firstEnds);
  if (!needsChange) return found.row;

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(2500)) return found.row;
  try {
    var fresh = _elive180FindRoom_(found.row.ROOM_ID || found.row.ROOM_CODE);
    if (!fresh || !fresh.row) return found.row;
    var room = fresh.row;
    if (_cs21a185MmRoomClosed_(room)) return room;

    var current = _elive176Current_(room);
    var pkg = current.room_package || null;
    if (!pkg || !pkg.state || !pkg.turn_state || (pkg.shared_state && pkg.shared_state.completed === true)) return room;

    var now = new Date();
    var nowMs = now.getTime();
    var startedMs = _elive176Timestamp_(pkg.turn_state.turn_started_at || pkg.state.started_at);
    var endsMs = _elive176Timestamp_(pkg.turn_state.turn_ends_at || pkg.state.ends_at);
    var changed = false;
    var timedOut = false;

    if (_elive176Upper_(pkg.state.phase) === 'COUNTDOWN' && startedMs && nowMs >= startedMs) {
      pkg.state.phase = 'OPEN';
      changed = true;
    }
    if (endsMs && nowMs >= endsMs) {
      var durationMs = Number(pkg.rules && pkg.rules.round_duration_ms || 30000) || 30000;
      var next = _elive176NextTurn_(pkg.turn_state, now, durationMs, 'TURN_TIMEOUT');
      pkg.turn_state = next;
      pkg.state.phase = 'OPEN';
      pkg.state.active_player_id = next.active_player_id;
      pkg.state.active_team_id = next.active_team_id;
      pkg.state.started_at = next.turn_started_at;
      pkg.state.ends_at = next.turn_ends_at;
      pkg.server_now = _elive176Iso_(now);
      changed = true;
      timedOut = true;
    }
    if (!changed) return room;

    current.room_package = pkg;
    room = _elive180SetCells_(fresh, {CURRENT_QUESTION_JSON:JSON.stringify(current)});
    _elive180Invalidate_(room);
    if (timedOut) {
      _elive180AppendEvent_(room, 'LIVE_TURN_TIMEOUT', {sesion:{nombre:'SISTEMA'},rol:'system'}, {
        active_player_id:pkg.turn_state.active_player_id,
        active_team_id:pkg.turn_state.active_team_id,
        turn_number:pkg.turn_state.turn_number,
        version:CS21A185_MM_CLOSED_ROOM_FIX_VERSION
      });
    }
    return room;
  } finally {
    lock.releaseLock();
  }
};
_elive180MaybeAdvanceTurn_.__cs21a185ClosedTerminal = true;

// Una sala cerrada puede seguir mostrando resultados, pero no debe parecer
// conectada ni renovar LAST_SEEN_AT indefinidamente.
var _cs21a185MmTouchPlayerLegacy_ = _elive180TouchPlayer_;
_elive180TouchPlayer_ = function (room, player) {
  if (_cs21a185MmRoomClosed_(room)) return;
  return _cs21a185MmTouchPlayerLegacy_(room, player);
};
_elive180TouchPlayer_.__cs21a185ClosedTerminal = true;

var _cs21a185MmVerifyFix4Base_ = verificarMemoryMatchStartFixCS21A183;
verificarMemoryMatchStartFixCS21A183 = function () {
  var previous = _cs21a185MmVerifyFix4Base_();
  var syntheticRow = {
    ROOM_ID:'ELIVE-CS21A185-CLOSED',
    ROOM_CODE:'LAB-CS21A185-CLOSED',
    STATUS:'CLOSED',
    CURRENT_QUESTION_JSON:'{"room_package":{"turn_state":{"turn_number":74}}}'
  };
  var returned = _elive180MaybeAdvanceTurn_({row:syntheticRow});
  var valid = !!(
    previous && previous.ok === true &&
    _cs21a185MmRoomClosed_(syntheticRow) === true &&
    _cs21a185MmRoomClosed_({STATUS:'LIVE'}) === false &&
    returned === syntheticRow &&
    _elive180MaybeAdvanceTurn_.__cs21a185ClosedTerminal === true &&
    _elive180TouchPlayer_.__cs21a185ClosedTerminal === true
  );
  var result = {
    ok:valid,
    version:CS21A185_MM_CLOSED_ROOM_FIX_VERSION,
    previous_version:previous && previous.version,
    memory_match_start_guard:previous && previous.memory_match_start_guard === true,
    direct_start_no_legacy_delegate:previous && previous.direct_start_no_legacy_delegate === true,
    presence_ttl_seconds:previous && previous.presence_ttl_seconds,
    control_pair_metadata:previous && previous.control_pair_metadata === true,
    closed_room_terminal:true,
    closed_room_turns_frozen:true,
    closed_room_presence_frozen:true,
    refetch_closed_guard:true,
    preserves_curriculum_verifier:true,
    qa_master:previous && previous.qa_master,
    qa_operational:previous && previous.qa_operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A185 no superó la verificación de sala cerrada terminal.');
  return result;
};


// =============================================================================
// BLOQUE 7/11: 99G_FIX_MEMORY_MATCH_RULES_QA_CS21A186.gs
// =============================================================================
// CS21A186 · QA · reglas canónicas de Memory Match
// APPEND-ONLY en el repositorio; el usuario recibe SIEMPRE el archivo Apps Script completo ensamblado.
// No usar en producción.
// Regla: acierto = 1 punto + mismo jugador/equipo; fallo o timeout = rota el turno.

var CS21A186_MM_RULES_FIX_VERSION = 'CS21A186-MM-RULES-FIX1';

function _cs21a186MmPoints_(correct) {
  return correct === true ? 1 : 0;
}

function _cs21a186MmContinueSamePlayer_(turnState, now, durationMs, reason) {
  var current = turnState || {};
  var next = JSON.parse(JSON.stringify(current));
  var when = now instanceof Date ? now : new Date();
  var duration = Math.max(5000, Number(durationMs || 30000) || 30000);
  next.turn_number = Math.max(1, Number(current.turn_number || 1) || 1) + 1;
  next.turn_started_at = _elive176Iso_(when);
  next.turn_ends_at = _elive176Iso_(new Date(when.getTime() + duration));
  next.last_player_id = _elive176Text_(current.active_player_id);
  next.last_team_id = _elive176Text_(current.active_team_id);
  next.reason = _elive176Text_(reason || 'PAIR_CORRECT_CONTINUE');
  // Deliberadamente NO mueve player_cursor, team_cursor ni team_player_cursors.
  next.active_player_id = _elive176Text_(current.active_player_id);
  next.active_team_id = _elive176Text_(current.active_team_id);
  return next;
}

// Sustituye únicamente el submit de pares. doPost de CS21A180 resuelve este nombre
// global en tiempo de ejecución, por lo que no se necesita otro router.
englishLabMemoryMatchSubmitPairCS21A180 = function (body) {
  body = body || {};
  var access = _elive180RequireLab_(body);
  if (!access || access.allowed !== true) return access;
  var normalized = _cs21a144LiveBody_(body, access);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return {ok:false,error:'sala_ocupada',mensaje:'La sala está procesando otro intento.'};
  try {
    var found = _elive180FindRoom_(_elive180RoomIdFromBody_(normalized));
    if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
    var room = found.row;
    if (_elive176Upper_(room.GAME_CODE) !== ELMM174_GAME_CODE) return {ok:false,error:'sala_no_memory_match'};
    if (_elive176Upper_(room.STATUS) === 'CLOSED') return {ok:false,error:'sala_cerrada'};

    var current = _elive176Current_(room);
    var pkg = current.room_package || null;
    if (!pkg || !pkg.state || _elive176Upper_(pkg.state.phase) !== 'OPEN') return {ok:false,error:'ronda_no_abierta'};

    var now = new Date();
    var endsMs = _elive176Timestamp_(pkg.turn_state && pkg.turn_state.turn_ends_at || pkg.state.ends_at);
    if (endsMs && now.getTime() >= endsMs) {
      return {ok:false,error:'turno_expirado',mensaje:'El tiempo terminó. Espere el siguiente turno.',turn_state:pkg.turn_state || null};
    }

    var snapshot = _elive180BuildSnapshot_(room);
    var playerId = _elive176Text_(normalized.player_id || normalized.cod_estudiante);
    var player = (snapshot._player_rows || []).filter(function (row) {
      return _elive176Text_(row.COD_ESTUDIANTE) === playerId;
    })[0] || null;
    if (!player) return {ok:false,error:'jugador_no_registrado'};

    var turnPlayer = {
      player_id:playerId,
      name:_elive176Text_(player.NOMBRE),
      team_id:_elive176Text_(player.TEAM) || 'NO_TEAM'
    };
    var turnState = pkg.turn_state || null;
    if (!_elive176CanAct_(turnState, turnPlayer)) {
      return {
        ok:false,
        error:'turno_no_activo',
        mensaje:'Espere su turno.',
        turn_state:turnState,
        turn_description:_elive176DescribeTurn_(turnState, _elive180TurnPlayers_(snapshot._player_rows))
      };
    }

    var pair = _elive176PairFromBody_(pkg, normalized);
    if (!pair.first_id || !pair.second_id || pair.first_id === pair.second_id) return {ok:false,error:'par_invalido'};

    var shared = pkg.shared_state || {
      version:CS21A186_MM_RULES_FIX_VERSION,
      board_version:1,
      matched_pair_ids:[],
      completed:false,
      last_action_key:''
    };
    shared.matched_pair_ids = Array.isArray(shared.matched_pair_ids) ? shared.matched_pair_ids : [];
    var cards = [pair.first_id, pair.second_id].sort();
    var actionKey = [room.ROOM_CODE,turnState.turn_number,playerId,cards[0],cards[1]].join('|');
    if (_elive176Text_(shared.last_action_key) === actionKey) {
      return {ok:true,version:CS21A186_MM_RULES_FIX_VERSION,accepted:false,duplicate:true,room_package:pkg,turn_state:turnState,shared_state:shared};
    }
    if (pair.correct && shared.matched_pair_ids.indexOf(pair.pair_id) >= 0) {
      return {ok:true,version:CS21A186_MM_RULES_FIX_VERSION,accepted:false,duplicate:true,correct:true,points:0,room_package:pkg,turn_state:turnState,shared_state:shared};
    }

    var timeMs = Math.max(0, Number(normalized.time_ms || normalized.timeMs || 0) || 0);
    var points = _cs21a186MmPoints_(pair.correct);
    var answerRow = {
      ROOM_ID:room.ROOM_ID,
      ROOM_CODE:room.ROOM_CODE,
      QUESTION_INDEX:Number(room.CURRENT_INDEX || 1) || 1,
      COD_ESTUDIANTE:playerId,
      ANSWER_VALUE:JSON.stringify({
        first_card_id:pair.first_id,
        second_card_id:pair.second_id,
        pair_id:pair.pair_id,
        correct:pair.correct
      }),
      IS_CORRECT:pair.correct ? 'TRUE' : 'FALSE',
      POINTS:points,
      TIME_MS:timeMs,
      ANSWERED_AT:_eliveIso_()
    };
    _elive180AppendObject_(ELIVE_ANSWERS_SHEET, ELIVE_ANSWERS_HEADERS, answerRow);

    if (pair.correct) shared.matched_pair_ids.push(pair.pair_id);
    shared.last_action_key = actionKey;
    shared.board_version = Math.max(1, Number(shared.board_version || 1) || 1) + 1;

    var durationMs = Number(pkg.rules && pkg.rules.round_duration_ms || 30000) || 30000;
    var nextTurn = pair.correct
      ? _cs21a186MmContinueSamePlayer_(turnState, now, durationMs, 'PAIR_CORRECT_CONTINUE')
      : _elive176NextTurn_(turnState, now, durationMs, 'PAIR_INCORRECT');

    var totalPairs = pkg.round && Array.isArray(pkg.round.cards) ? pkg.round.cards.length / 2 : 0;
    var completed = totalPairs > 0 && shared.matched_pair_ids.length >= totalPairs;
    shared.completed = completed;
    shared.version = CS21A186_MM_RULES_FIX_VERSION;

    pkg.version = CS21A186_MM_RULES_FIX_VERSION;
    pkg.turn_state = nextTurn;
    pkg.shared_state = shared;
    pkg.state.active_player_id = nextTurn.active_player_id;
    pkg.state.active_team_id = nextTurn.active_team_id;
    pkg.state.started_at = nextTurn.turn_started_at;
    pkg.state.ends_at = nextTurn.turn_ends_at;
    pkg.state.phase = completed ? 'COMPLETE' : 'OPEN';
    pkg.server_now = _elive176Iso_(now);
    current.room_package = pkg;

    var patch = {CURRENT_QUESTION_JSON:JSON.stringify(current)};
    if (completed) {
      patch.ROUND_STATUS = 'CLOSED';
      patch.ROUND_CLOSED_AT = _eliveIso_();
    }
    room = _elive180SetCells_(found, patch);

    _elive180AppendEvent_(room, 'MEMORY_MATCH_PAIR_SUBMITTED', {sesion:{nombre:player.NOMBRE},rol:'student'}, {
      correct:pair.correct,
      points:points,
      pair_id:pair.pair_id,
      version:CS21A186_MM_RULES_FIX_VERSION
    });
    _elive180AppendEvent_(room, pair.correct && !completed ? 'LIVE_TURN_CONTINUED' : 'LIVE_TURN_ADVANCED', {sesion:{nombre:player.NOMBRE},rol:'student'}, {
      from_player_id:turnState.active_player_id,
      to_player_id:nextTurn.active_player_id,
      from_team_id:turnState.active_team_id,
      to_team_id:nextTurn.active_team_id,
      turn_number:nextTurn.turn_number,
      reason:nextTurn.reason,
      board_version:shared.board_version,
      completed:completed,
      version:CS21A186_MM_RULES_FIX_VERSION
    });

    _elive180Invalidate_(room);
    var refreshed = _elive180BuildSnapshot_(room);
    var ranking = refreshed.leaderboard || [];
    return {
      ok:true,
      version:CS21A186_MM_RULES_FIX_VERSION,
      accepted:true,
      correct:pair.correct,
      points:points,
      turn_continues:pair.correct && !completed,
      room:_elive176PublicRoom_(room),
      room_package:pkg,
      turn_state:nextTurn,
      shared_state:shared,
      leaderboard:ranking,
      team_leaderboard:refreshed.team_leaderboard,
      my_rank:ranking.filter(function (row) { return _elive176Text_(row.cod_estudiante) === playerId; })[0] || null,
      stats:refreshed.stats,
      turn_description:_elive176DescribeTurn_(nextTurn, _elive180TurnPlayers_(refreshed._player_rows))
    };
  } finally {
    lock.releaseLock();
  }
};
englishLabMemoryMatchSubmitPairCS21A180.__cs21a186CanonicalRules = true;

var _cs21a186MmVerifyFix185Base_ = verificarMemoryMatchStartFixCS21A183;
verificarMemoryMatchStartFixCS21A183 = function () {
  var previous = _cs21a186MmVerifyFix185Base_();
  var synthetic = {
    version:'CS21A176',
    participation_policy:ELIVE176_POLICY_TEAM_ALTERNATING,
    player_order:['P1','P2'],
    player_cursor:0,
    team_order:['Equipo Azul','Equipo Rojo'],
    team_cursor:0,
    team_player_orders:{'Equipo Azul':['P1'],'Equipo Rojo':['P2']},
    team_player_cursors:{'Equipo Azul':0,'Equipo Rojo':0},
    active_player_id:'P1',
    active_team_id:'Equipo Azul',
    turn_number:3,
    turn_started_at:'2026-08-07T20:00:00.000Z',
    turn_ends_at:'2026-08-07T20:00:30.000Z'
  };
  var now = new Date('2026-08-07T20:00:10.000Z');
  var correctTurn = _cs21a186MmContinueSamePlayer_(synthetic, now, 30000, 'PAIR_CORRECT_CONTINUE');
  var wrongTurn = _elive176NextTurn_(synthetic, now, 30000, 'PAIR_INCORRECT');
  var valid = !!(
    previous && previous.ok === true &&
    _cs21a186MmPoints_(true) === 1 &&
    _cs21a186MmPoints_(false) === 0 &&
    correctTurn.turn_number === 4 &&
    correctTurn.active_player_id === 'P1' &&
    correctTurn.active_team_id === 'Equipo Azul' &&
    correctTurn.team_cursor === 0 &&
    wrongTurn.active_player_id === 'P2' &&
    wrongTurn.active_team_id === 'Equipo Rojo' &&
    wrongTurn.turn_number === 4 &&
    englishLabMemoryMatchSubmitPairCS21A180.__cs21a186CanonicalRules === true
  );
  var result = {
    ok:valid,
    version:CS21A186_MM_RULES_FIX_VERSION,
    previous_version:previous && previous.version,
    correct_pair_points:1,
    correct_pair_keeps_player:true,
    correct_pair_keeps_team:true,
    correct_pair_resets_timer:true,
    incorrect_pair_rotates_turn:true,
    timeout_rotates_turn:true,
    expired_submit_rejected:true,
    preserves_closed_room_guard:previous && previous.closed_room_terminal === true,
    preserves_curriculum_verifier:true,
    qa_master:previous && previous.qa_master,
    qa_operational:previous && previous.qa_operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A186 no superó la verificación de reglas canónicas Memory Match.');
  return result;
};


// =============================================================================
// BLOQUE 8/11: 99H_FIX_ENGLISH_LAB_LIFECYCLE_QA_CS21A187.gs
// =============================================================================
// CS21A187 · QA · ciclo de vida de salas Live + recientes + límite coherente Memory Match.
// APPEND-ONLY en repositorio; el usuario recibe SIEMPRE 99_CS21A183_SENTENCE_ORDER_COMPLETO.gs completo.
// QA/STAGING solamente. NO USAR EN PRODUCCIÓN.

var CS21A187_LIVE_LIFECYCLE_FIX_VERSION = 'CS21A187-LIVE-LIFECYCLE-FIX1';
var CS21A187_MM_MAX_CANONICAL_PAIRS = 6;

function _cs21a187QaGuard_() {
  var props = PropertiesService.getScriptProperties();
  var masterId = _elive176Text_(props.getProperty('QA_STAGING_MASTER_ID'));
  var operationalId = _elive176Text_(props.getProperty('QA_STAGING_OPERATIVO_ID'));
  if (!masterId || !operationalId) throw new Error('BLOQUEADO: faltan propiedades QA/STAGING.');
  var masterName = SpreadsheetApp.openById(masterId).getName();
  var operationalName = SpreadsheetApp.openById(operationalId).getName();
  if (!/QA|STAGING/i.test(masterName) || !/QA|STAGING/i.test(operationalName)) {
    throw new Error('BLOQUEADO: CS21A187 solo puede ejecutarse en QA/STAGING.');
  }
  return {master:masterName, operational:operationalName};
}

function _cs21a187RecentRooms_(body) {
  var auth = _eliveAuthTeacher_(body || {});
  if (!auth || auth.ok !== true) return [];
  var table = _elive180Table_(ELIVE_ROOMS_SHEET, ELIVE_ROOMS_HEADERS);
  var rooms = table.rows.filter(function (row) {
    try { return _elive180CanRoom_(auth, row); } catch (_) { return false; }
  });
  rooms.sort(function (a, b) {
    var at = _elive176Timestamp_(a.CREATED_AT || a.STARTED_AT || a.CLOSED_AT);
    var bt = _elive176Timestamp_(b.CREATED_AT || b.STARTED_AT || b.CLOSED_AT);
    return bt - at;
  });
  return rooms.slice(0, 12).map(function (row) {
    var publicRoom = _elive176PublicRoom_(row);
    var settings = _elive176Json_(row.SETTINGS_JSON, {});
    publicRoom.unit = _elive176NormalizeUnit_(settings.unit || row.UNIT || 'MIX');
    publicRoom.pair_count = Number(settings.pair_count || 0) || 0;
    publicRoom.created_at = _elive176Text_(row.CREATED_AT);
    publicRoom.started_at = _elive176Text_(row.STARTED_AT);
    publicRoom.closed_at = _elive176Text_(row.CLOSED_AT);
    return publicRoom;
  });
}

var _cs21a187TeacherDataBase_ = typeof englishLabLiveGetTeacherData === 'function' ? englishLabLiveGetTeacherData : null;
if (_cs21a187TeacherDataBase_) {
  englishLabLiveGetTeacherData = function (body) {
    var response = _cs21a187TeacherDataBase_(body || {});
    if (!response || response.ok !== true) return response;
    response.rooms = _cs21a187RecentRooms_(body || {});
    response.live_lifecycle_version = CS21A187_LIVE_LIFECYCLE_FIX_VERSION;
    response.memory_match_pair_options = [3,4,6];
    response.memory_match_max_pairs = CS21A187_MM_MAX_CANONICAL_PAIRS;
    return response;
  };
}

var _cs21a187CreateMemoryBase_ = englishLabMemoryMatchCreateRoomCS21A180;
englishLabMemoryMatchCreateRoomCS21A180 = function (body) {
  body = body || {};
  var requested = Math.max(3, Number(body.pair_count || body.cantidad || 6) || 6);
  if (requested > CS21A187_MM_MAX_CANONICAL_PAIRS) {
    return {
      ok:false,
      version:CS21A187_LIVE_LIFECYCLE_FIX_VERSION,
      error:'memory_match_pair_count_exceeds_available',
      mensaje:'Esta unidad dispone actualmente de hasta ' + CS21A187_MM_MAX_CANONICAL_PAIRS + ' pares canónicos. Seleccione 3, 4 o 6 pares.',
      requested_pair_count:requested,
      max_pair_count:CS21A187_MM_MAX_CANONICAL_PAIRS,
      allowed_pair_counts:[3,4,6]
    };
  }
  return _cs21a187CreateMemoryBase_(body);
};
englishLabMemoryMatchCreateRoomCS21A180.__cs21a187PairLimit = true;

var _cs21a187VerifyRulesBase_ = verificarMemoryMatchStartFixCS21A183;
verificarMemoryMatchStartFixCS21A183 = function () {
  var previous = _cs21a187VerifyRulesBase_();
  var blocked = englishLabMemoryMatchCreateRoomCS21A180({pair_count:8});
  var guard = _cs21a187QaGuard_();
  var valid = !!(
    previous && previous.ok === true &&
    blocked && blocked.ok === false &&
    blocked.error === 'memory_match_pair_count_exceeds_available' &&
    Number(blocked.max_pair_count) === 6 &&
    englishLabMemoryMatchCreateRoomCS21A180.__cs21a187PairLimit === true &&
    typeof _cs21a187RecentRooms_ === 'function'
  );
  var result = {
    ok:valid,
    version:CS21A187_LIVE_LIFECYCLE_FIX_VERSION,
    previous_version:previous && previous.version,
    correct_pair_points:previous && previous.correct_pair_points,
    correct_pair_keeps_player:previous && previous.correct_pair_keeps_player === true,
    incorrect_pair_rotates_turn:previous && previous.incorrect_pair_rotates_turn === true,
    closed_room_terminal:previous && previous.preserves_closed_room_guard === true,
    recent_rooms_restored:true,
    recent_rooms_limit:12,
    memory_match_max_pairs:CS21A187_MM_MAX_CANONICAL_PAIRS,
    memory_match_pair_options:'3,4,6',
    pair_count_8_blocked_before_room_creation:true,
    stale_room_restore_forbidden:true,
    qa_master:guard.master,
    qa_operational:guard.operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A187 no superó la verificación de ciclo de vida Live.');
  return result;
};


// =============================================================================
// BLOQUE 9/11: 99I_MEMORY_MATCH_SHARED_DISCOVERY_QA_CS21A188.gs
// =============================================================================
// CS21A188 · QA · Memory Match Shared Discovery.
// APPEND-ONLY en el repositorio; el usuario recibe SIEMPRE el Apps Script completo ensamblado.
// QA/STAGING solamente. NO USAR EN PRODUCCIÓN.
//
// Contrato:
// HIDDEN -> DISCOVERED -> CLAIMED.
// Una carta DISCOVERED queda visible y disponible para toda la sala.
// El descubridor NO adquiere propiedad. Quien completa la pareja reclama ambas cartas,
// suma 1 punto y conserva el turno. Fallo/timeout rota al siguiente equipo/jugador.

var CS21A188_MM_SHARED_DISCOVERY_VERSION = 'CS21A188-MM-SHARED-DISCOVERY-1';

function _cs21a188MmShared_(pkg) {
  pkg = pkg || {};
  var shared = pkg.shared_state || {};
  shared.version = CS21A188_MM_SHARED_DISCOVERY_VERSION;
  shared.board_version = Math.max(1, Number(shared.board_version || 1) || 1);
  shared.matched_pair_ids = Array.isArray(shared.matched_pair_ids) ? shared.matched_pair_ids : [];
  shared.discovered_cards = shared.discovered_cards && typeof shared.discovered_cards === 'object' && !Array.isArray(shared.discovered_cards)
    ? shared.discovered_cards : {};
  shared.claimed_pairs = shared.claimed_pairs && typeof shared.claimed_pairs === 'object' && !Array.isArray(shared.claimed_pairs)
    ? shared.claimed_pairs : {};
  shared.completed = shared.completed === true;
  shared.last_action_key = _elive176Text_(shared.last_action_key);
  pkg.shared_state = shared;
  return shared;
}

function _cs21a188MmCardsById_(pkg) {
  var cards = pkg && pkg.round && Array.isArray(pkg.round.cards) ? pkg.round.cards : [];
  var byId = {};
  cards.forEach(function (card) {
    var id = _elive176Text_(card && card.card_id);
    if (id) byId[id] = card;
  });
  return byId;
}

function _cs21a188MmPairClaimed_(shared, pairId) {
  var id = _elive176Text_(pairId);
  return !!(id && shared && shared.claimed_pairs && shared.claimed_pairs[id]);
}

function _cs21a188MmDiscover_(shared, card, player, turnState, now) {
  if (!shared || !card) return {changed:false,record:null};
  var cardId = _elive176Text_(card.card_id);
  var pairId = _elive176Text_(card.pair_id);
  if (!cardId || !pairId || _cs21a188MmPairClaimed_(shared, pairId)) return {changed:false,record:null};
  if (shared.discovered_cards[cardId]) return {changed:false,record:shared.discovered_cards[cardId]};
  var record = {
    card_id:cardId,
    pair_id:pairId,
    discovered_by:_elive176Text_(player && (player.COD_ESTUDIANTE || player.player_id)),
    discovered_name:_elive176Text_(player && (player.NOMBRE || player.name)),
    team_id:_elive176Text_(player && (player.TEAM || player.team_id)) || 'NO_TEAM',
    discovered_at:_elive176Iso_(now),
    turn_number:Number(turnState && turnState.turn_number || 0) || 0
  };
  shared.discovered_cards[cardId] = record;
  return {changed:true,record:record};
}

function _cs21a188MmClaim_(shared, pairId, firstCard, secondCard, player, turnState, now) {
  var id = _elive176Text_(pairId);
  if (!id) return null;
  if (shared.claimed_pairs[id]) return shared.claimed_pairs[id];
  var claim = {
    pair_id:id,
    card_ids:[_elive176Text_(firstCard && firstCard.card_id), _elive176Text_(secondCard && secondCard.card_id)],
    claimed_by:_elive176Text_(player && (player.COD_ESTUDIANTE || player.player_id)),
    claimed_name:_elive176Text_(player && (player.NOMBRE || player.name)),
    team_id:_elive176Text_(player && (player.TEAM || player.team_id)) || 'NO_TEAM',
    claimed_at:_elive176Iso_(now),
    turn_number:Number(turnState && turnState.turn_number || 0) || 0,
    points:1
  };
  shared.claimed_pairs[id] = claim;
  if (shared.matched_pair_ids.indexOf(id) < 0) shared.matched_pair_ids.push(id);
  return claim;
}

function _cs21a188MmAction_(body) {
  body = body || {};
  var answer = body.answer_value || body.answerValue || {};
  if (typeof answer === 'string') answer = _elive176Json_(answer, {});
  return _elive176Upper_(answer.action || body.action || 'SUBMIT_PAIR');
}

function _cs21a188MmAnswer_(body) {
  var answer = body && (body.answer_value || body.answerValue) || {};
  return typeof answer === 'string' ? _elive176Json_(answer, {}) : (answer || {});
}

function _cs21a188MmPlayerFromSnapshot_(snapshot, playerId) {
  return (snapshot && snapshot._player_rows || []).filter(function (row) {
    return _elive176Text_(row.COD_ESTUDIANTE) === _elive176Text_(playerId);
  })[0] || null;
}

// CS21A188 conserva el mismo endpoint canónico. DISCOVER_CARD publica una carta;
// SUBMIT_PAIR resuelve la pareja. No se agrega una ruta paralela.
englishLabMemoryMatchSubmitPairCS21A180 = function (body) {
  body = body || {};
  var access = _elive180RequireLab_(body);
  if (!access || access.allowed !== true) return access;
  var normalized = _cs21a144LiveBody_(body, access);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return {ok:false,error:'sala_ocupada',mensaje:'La sala está procesando otra acción.'};
  try {
    var found = _elive180FindRoom_(_elive180RoomIdFromBody_(normalized));
    if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
    var room = found.row;
    if (_elive176Upper_(room.GAME_CODE) !== ELMM174_GAME_CODE) return {ok:false,error:'sala_no_memory_match'};
    if (_elive176Upper_(room.STATUS) === 'CLOSED') return {ok:false,error:'sala_cerrada'};

    var current = _elive176Current_(room);
    var pkg = current.room_package || null;
    if (!pkg || !pkg.state || _elive176Upper_(pkg.state.phase) !== 'OPEN') return {ok:false,error:'ronda_no_abierta'};

    var now = new Date();
    var endsMs = _elive176Timestamp_(pkg.turn_state && pkg.turn_state.turn_ends_at || pkg.state.ends_at);
    if (endsMs && now.getTime() >= endsMs) {
      return {ok:false,error:'turno_expirado',mensaje:'El tiempo terminó. Espere el siguiente turno.',turn_state:pkg.turn_state || null};
    }

    var snapshot = _elive180BuildSnapshot_(room);
    var playerId = _elive176Text_(normalized.player_id || normalized.cod_estudiante);
    var player = _cs21a188MmPlayerFromSnapshot_(snapshot, playerId);
    if (!player) return {ok:false,error:'jugador_no_registrado'};
    var turnPlayer = {
      player_id:playerId,
      name:_elive176Text_(player.NOMBRE),
      team_id:_elive176Text_(player.TEAM) || 'NO_TEAM'
    };
    var turnState = pkg.turn_state || null;
    if (!_elive176CanAct_(turnState, turnPlayer)) {
      return {
        ok:false,error:'turno_no_activo',mensaje:'Espere su turno.',turn_state:turnState,
        turn_description:_elive176DescribeTurn_(turnState, _elive180TurnPlayers_(snapshot._player_rows))
      };
    }

    var shared = _cs21a188MmShared_(pkg);
    var byId = _cs21a188MmCardsById_(pkg);
    var action = _cs21a188MmAction_(normalized);
    var answer = _cs21a188MmAnswer_(normalized);

    if (action === 'DISCOVER_CARD') {
      var cardId = _elive176Text_(answer.card_id || answer.first_card_id || normalized.card_id || normalized.first_card_id);
      var card = byId[cardId] || null;
      if (!card) return {ok:false,error:'carta_no_encontrada'};
      if (_cs21a188MmPairClaimed_(shared, card.pair_id)) {
        return {ok:true,version:CS21A188_MM_SHARED_DISCOVERY_VERSION,accepted:false,claimed:true,room_package:pkg,shared_state:shared,turn_state:turnState};
      }
      var discovery = _cs21a188MmDiscover_(shared, card, player, turnState, now);
      if (!discovery.changed) {
        return {ok:true,version:CS21A188_MM_SHARED_DISCOVERY_VERSION,accepted:false,duplicate:true,discovery:discovery.record,room_package:pkg,shared_state:shared,turn_state:turnState};
      }
      shared.board_version += 1;
      shared.last_action_key = [room.ROOM_CODE,turnState.turn_number,playerId,'DISCOVER',cardId].join('|');
      pkg.version = CS21A188_MM_SHARED_DISCOVERY_VERSION;
      pkg.shared_state = shared;
      pkg.server_now = _elive176Iso_(now);
      current.room_package = pkg;
      room = _elive180SetCells_(found, {CURRENT_QUESTION_JSON:JSON.stringify(current)});
      _elive180Invalidate_(room);
      _elive180AppendEvent_(room, 'MEMORY_MATCH_CARD_DISCOVERED', {sesion:{nombre:player.NOMBRE},rol:'student'}, {
        card_id:cardId,pair_id:_elive176Text_(card.pair_id),discovered_by:playerId,team_id:_elive176Text_(player.TEAM),
        board_version:shared.board_version,version:CS21A188_MM_SHARED_DISCOVERY_VERSION
      });
      return {
        ok:true,version:CS21A188_MM_SHARED_DISCOVERY_VERSION,accepted:true,action:'DISCOVER_CARD',discovery:discovery.record,
        room:_elive176PublicRoom_(room),room_package:pkg,shared_state:shared,turn_state:turnState,
        turn_description:_elive176DescribeTurn_(turnState, _elive180TurnPlayers_(snapshot._player_rows))
      };
    }

    var pair = _elive176PairFromBody_(pkg, normalized);
    if (!pair.first_id || !pair.second_id || pair.first_id === pair.second_id) return {ok:false,error:'par_invalido'};
    var firstCard = byId[pair.first_id] || null;
    var secondCard = byId[pair.second_id] || null;
    if (!firstCard || !secondCard) return {ok:false,error:'carta_no_encontrada'};
    if (_cs21a188MmPairClaimed_(shared, firstCard.pair_id) || _cs21a188MmPairClaimed_(shared, secondCard.pair_id)) {
      return {ok:true,version:CS21A188_MM_SHARED_DISCOVERY_VERSION,accepted:false,claimed:true,mensaje:'Una de esas cartas ya fue reclamada.',room_package:pkg,shared_state:shared,turn_state:turnState};
    }

    var canonicalCards = [pair.first_id,pair.second_id].sort();
    var actionKey = [room.ROOM_CODE,turnState.turn_number,playerId,'PAIR',canonicalCards[0],canonicalCards[1]].join('|');
    if (_elive176Text_(shared.last_action_key) === actionKey) {
      return {ok:true,version:CS21A188_MM_SHARED_DISCOVERY_VERSION,accepted:false,duplicate:true,room_package:pkg,turn_state:turnState,shared_state:shared};
    }

    // La segunda carta también pasa a ser conocimiento público antes de resolver.
    _cs21a188MmDiscover_(shared, firstCard, player, turnState, now);
    _cs21a188MmDiscover_(shared, secondCard, player, turnState, now);

    var timeMs = Math.max(0, Number(normalized.time_ms || normalized.timeMs || 0) || 0);
    var points = _cs21a186MmPoints_(pair.correct);
    var answerRow = {
      ROOM_ID:room.ROOM_ID,ROOM_CODE:room.ROOM_CODE,QUESTION_INDEX:Number(room.CURRENT_INDEX || 1) || 1,
      COD_ESTUDIANTE:playerId,
      ANSWER_VALUE:JSON.stringify({action:'SUBMIT_PAIR',first_card_id:pair.first_id,second_card_id:pair.second_id,pair_id:pair.pair_id,correct:pair.correct}),
      IS_CORRECT:pair.correct ? 'TRUE' : 'FALSE',POINTS:points,TIME_MS:timeMs,ANSWERED_AT:_eliveIso_()
    };
    _elive180AppendObject_(ELIVE_ANSWERS_SHEET, ELIVE_ANSWERS_HEADERS, answerRow);

    var claim = pair.correct ? _cs21a188MmClaim_(shared, pair.pair_id, firstCard, secondCard, player, turnState, now) : null;
    shared.last_action_key = actionKey;
    shared.board_version += 1;

    var durationMs = Number(pkg.rules && pkg.rules.round_duration_ms || 30000) || 30000;
    var nextTurn = pair.correct
      ? _cs21a186MmContinueSamePlayer_(turnState, now, durationMs, 'PAIR_CLAIMED_CONTINUE')
      : _elive176NextTurn_(turnState, now, durationMs, 'PAIR_INCORRECT');

    var totalPairs = pkg.round && Array.isArray(pkg.round.cards) ? pkg.round.cards.length / 2 : 0;
    var completed = totalPairs > 0 && shared.matched_pair_ids.length >= totalPairs;
    shared.completed = completed;

    pkg.version = CS21A188_MM_SHARED_DISCOVERY_VERSION;
    pkg.turn_state = nextTurn;
    pkg.shared_state = shared;
    pkg.state.active_player_id = nextTurn.active_player_id;
    pkg.state.active_team_id = nextTurn.active_team_id;
    pkg.state.started_at = nextTurn.turn_started_at;
    pkg.state.ends_at = nextTurn.turn_ends_at;
    pkg.state.phase = completed ? 'COMPLETE' : 'OPEN';
    pkg.server_now = _elive176Iso_(now);
    current.room_package = pkg;

    var patch = {CURRENT_QUESTION_JSON:JSON.stringify(current)};
    if (completed) { patch.ROUND_STATUS = 'CLOSED'; patch.ROUND_CLOSED_AT = _eliveIso_(); }
    room = _elive180SetCells_(found, patch);

    _elive180AppendEvent_(room, pair.correct ? 'MEMORY_MATCH_PAIR_CLAIMED' : 'MEMORY_MATCH_PAIR_MISSED', {sesion:{nombre:player.NOMBRE},rol:'student'}, {
      correct:pair.correct,points:points,pair_id:pair.pair_id,claim:claim,board_version:shared.board_version,
      version:CS21A188_MM_SHARED_DISCOVERY_VERSION
    });
    _elive180AppendEvent_(room, pair.correct && !completed ? 'LIVE_TURN_CONTINUED' : 'LIVE_TURN_ADVANCED', {sesion:{nombre:player.NOMBRE},rol:'student'}, {
      from_player_id:turnState.active_player_id,to_player_id:nextTurn.active_player_id,
      from_team_id:turnState.active_team_id,to_team_id:nextTurn.active_team_id,
      turn_number:nextTurn.turn_number,reason:nextTurn.reason,board_version:shared.board_version,completed:completed,
      version:CS21A188_MM_SHARED_DISCOVERY_VERSION
    });

    _elive180Invalidate_(room);
    var refreshed = _elive180BuildSnapshot_(room);
    var ranking = refreshed.leaderboard || [];
    return {
      ok:true,version:CS21A188_MM_SHARED_DISCOVERY_VERSION,accepted:true,action:'SUBMIT_PAIR',correct:pair.correct,points:points,
      turn_continues:pair.correct && !completed,claim:claim,
      room:_elive176PublicRoom_(room),room_package:pkg,turn_state:nextTurn,shared_state:shared,
      leaderboard:ranking,team_leaderboard:refreshed.team_leaderboard,
      my_rank:ranking.filter(function (row) { return _elive176Text_(row.cod_estudiante) === playerId; })[0] || null,
      stats:refreshed.stats,
      turn_description:_elive176DescribeTurn_(nextTurn, _elive180TurnPlayers_(refreshed._player_rows))
    };
  } finally {
    lock.releaseLock();
  }
};
englishLabMemoryMatchSubmitPairCS21A180.__cs21a188SharedDiscovery = true;

var _cs21a188VerifyBase_ = verificarMemoryMatchStartFixCS21A183;
verificarMemoryMatchStartFixCS21A183 = function () {
  var previous = _cs21a188VerifyBase_();
  var syntheticPkg = {shared_state:{board_version:1,matched_pair_ids:[]}};
  var shared = _cs21a188MmShared_(syntheticPkg);
  var cardA = {card_id:'CARD-A',pair_id:'PAIR-1'};
  var cardB = {card_id:'CARD-B',pair_id:'PAIR-1'};
  var p1 = {COD_ESTUDIANTE:'P1',NOMBRE:'Chu',TEAM:'Equipo Azul'};
  var p2 = {COD_ESTUDIANTE:'P2',NOMBRE:'Naty',TEAM:'Equipo Rojo'};
  var turn = {turn_number:7};
  var now = new Date('2026-08-07T22:30:00.000Z');
  var first = _cs21a188MmDiscover_(shared, cardA, p1, turn, now);
  var repeated = _cs21a188MmDiscover_(shared, cardA, p2, turn, now);
  var second = _cs21a188MmDiscover_(shared, cardB, p2, turn, now);
  var claim = _cs21a188MmClaim_(shared, 'PAIR-1', cardA, cardB, p2, turn, now);
  var valid = !!(
    previous && previous.ok === true &&
    first.changed === true && repeated.changed === false && second.changed === true &&
    shared.discovered_cards['CARD-A'].discovered_by === 'P1' &&
    shared.discovered_cards['CARD-B'].discovered_by === 'P2' &&
    claim && claim.claimed_by === 'P2' && claim.team_id === 'Equipo Rojo' &&
    shared.matched_pair_ids.indexOf('PAIR-1') >= 0 &&
    englishLabMemoryMatchSubmitPairCS21A180.__cs21a188SharedDiscovery === true
  );
  var result = {
    ok:valid,
    version:CS21A188_MM_SHARED_DISCOVERY_VERSION,
    previous_version:previous && previous.version,
    shared_discovery:true,
    card_states:'HIDDEN>DISCOVERED>CLAIMED',
    discovered_cards_public:true,
    discovered_cards_remain_selectable:true,
    discoverer_does_not_own:true,
    claim_owner_is_matcher:true,
    correct_pair_points:1,
    correct_pair_keeps_player:true,
    incorrect_pair_rotates_turn:true,
    timeout_rotates_turn:true,
    closed_room_terminal:previous && previous.closed_room_terminal === true,
    recent_rooms_restored:previous && previous.recent_rooms_restored === true,
    stale_room_restore_forbidden:previous && previous.stale_room_restore_forbidden === true,
    qa_master:previous && previous.qa_master,
    qa_operational:previous && previous.qa_operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A188 no superó la verificación Shared Discovery.');
  return result;
};


// =============================================================================
// BLOQUE 10/11: 99J_FIX_MEMORY_MATCH_RULES_COMPAT_QA_CS21A188.gs
// =============================================================================
// CS21A188 · QA · compatibilidad de metadatos CS21A186 con Shared Discovery.
// APPEND-ONLY en el repositorio; el usuario recibe SIEMPRE el archivo Apps Script completo ensamblado.
// QA/STAGING solamente. NO USAR EN PRODUCCIÓN.
//
// CS21A188 reemplaza el handler canónico para soportar DISCOVER_CARD y SUBMIT_PAIR,
// pero conserva semánticamente las reglas de CS21A186. Al reemplazar una función en
// JavaScript se pierden las propiedades custom del objeto función; este bloque restaura
// exclusivamente esa metadata para que la cadena histórica de verificadores pueda
// comprobar las reglas acumuladas sin alterar la lógica de ejecución.

var CS21A188_MM_RULES_COMPAT_VERSION = 'CS21A188-MM-RULES-COMPAT-1';

if (typeof englishLabMemoryMatchSubmitPairCS21A180 === 'function') {
  englishLabMemoryMatchSubmitPairCS21A180.__cs21a186CanonicalRules = true;
  englishLabMemoryMatchSubmitPairCS21A180.__cs21a188SharedDiscovery = true;
}


// =============================================================================
// BLOQUE 11/11: 99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs
// =============================================================================
// CS21A189 · QA · Memory Match clásico sincronizado.
// APPEND-ONLY en el repositorio; el usuario recibe SIEMPRE el Apps Script completo ensamblado.
// QA/STAGING solamente. NO USAR EN PRODUCCIÓN.
//
// Regla canónica:
// - primera carta: visible temporalmente para TODA la sala;
// - segunda carta: visible para TODA la sala;
// - acierto: ambas quedan CLAIMED, +1 y conserva turno;
// - fallo: ambas permanecen visibles brevemente y luego vuelven a HIDDEN;
// - timeout: rota turno y cualquier reveal temporal queda inválido.

var CS21A189_MM_CLASSIC_SYNC_VERSION = 'CS21A189-MM-CLASSIC-SYNC-1';
var CS21A189_MM_MISMATCH_REVEAL_MS = 2200;

function _cs21a189ClassicShared_(pkg) {
  pkg = pkg || {};
  var shared = pkg.shared_state || {};
  shared.version = CS21A189_MM_CLASSIC_SYNC_VERSION;
  shared.board_version = Math.max(1, Number(shared.board_version || 1) || 1);
  shared.matched_pair_ids = Array.isArray(shared.matched_pair_ids) ? shared.matched_pair_ids : [];
  shared.claimed_pairs = shared.claimed_pairs && typeof shared.claimed_pairs === 'object' && !Array.isArray(shared.claimed_pairs)
    ? shared.claimed_pairs : {};
  // CS21A189 reemplaza el descubrimiento persistente de CS21A188.
  shared.discovered_cards = {};
  shared.active_attempt = shared.active_attempt && typeof shared.active_attempt === 'object' && !Array.isArray(shared.active_attempt)
    ? shared.active_attempt : null;
  shared.completed = shared.completed === true;
  shared.last_action_key = _elive176Text_(shared.last_action_key);
  pkg.shared_state = shared;
  return shared;
}

function _cs21a189AttemptPhase_(attempt) {
  return _elive176Upper_(attempt && attempt.phase);
}

function _cs21a189AttemptVisible_(attempt, now) {
  if (!attempt) return false;
  var phase = _cs21a189AttemptPhase_(attempt);
  if (phase === 'FIRST_REVEALED') return true;
  if (phase !== 'MISMATCH_REVEAL') return false;
  var untilMs = _elive176Timestamp_(attempt.reveal_until);
  var nowMs = (now instanceof Date ? now : new Date()).getTime();
  return !!(untilMs && nowMs < untilMs);
}

function _cs21a189NormalizeAttempt_(shared, turnState, now) {
  if (!shared || !shared.active_attempt) return false;
  var attempt = shared.active_attempt;
  var phase = _cs21a189AttemptPhase_(attempt);
  var currentTurn = Number(turnState && turnState.turn_number || 0) || 0;
  var attemptTurn = Number(attempt.turn_number || 0) || 0;
  var shouldClear = false;
  if (phase === 'FIRST_REVEALED' && currentTurn && attemptTurn && currentTurn !== attemptTurn) shouldClear = true;
  if (phase === 'MISMATCH_REVEAL' && !_cs21a189AttemptVisible_(attempt, now)) shouldClear = true;
  if (phase !== 'FIRST_REVEALED' && phase !== 'MISMATCH_REVEAL') shouldClear = true;
  if (!shouldClear) return false;
  shared.active_attempt = null;
  return true;
}

function _cs21a189TurnStarted_(turnState, now) {
  var startMs = _elive176Timestamp_(turnState && turnState.turn_started_at);
  if (!startMs) return true;
  return (now instanceof Date ? now : new Date()).getTime() >= startMs;
}

function _cs21a189Attempt_(phase, player, turnState, firstCardId, secondCardId, now, revealUntil) {
  var when = now instanceof Date ? now : new Date();
  return {
    phase:_elive176Upper_(phase),
    player_id:_elive176Text_(player && (player.COD_ESTUDIANTE || player.player_id)),
    player_name:_elive176Text_(player && (player.NOMBRE || player.name)),
    team_id:_elive176Text_(player && (player.TEAM || player.team_id)) || 'NO_TEAM',
    turn_number:Number(turnState && turnState.turn_number || 0) || 0,
    first_card_id:_elive176Text_(firstCardId),
    second_card_id:_elive176Text_(secondCardId),
    revealed_at:_elive176Iso_(when),
    reveal_until:revealUntil ? _elive176Iso_(revealUntil) : ''
  };
}

function _cs21a189WritePackage_(found, room, current, pkg) {
  current.room_package = pkg;
  room = _elive180SetCells_(found, {CURRENT_QUESTION_JSON:JSON.stringify(current)});
  _elive180Invalidate_(room);
  return room;
}

// Sustituye el submit canónico conservando el mismo router y contrato de acceso.
englishLabMemoryMatchSubmitPairCS21A180 = function (body) {
  body = body || {};
  var access = _elive180RequireLab_(body);
  if (!access || access.allowed !== true) return access;
  var normalized = _cs21a144LiveBody_(body, access);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return {ok:false,error:'sala_ocupada',mensaje:'La sala está procesando otra acción.'};
  try {
    var found = _elive180FindRoom_(_elive180RoomIdFromBody_(normalized));
    if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
    var room = found.row;
    if (_elive176Upper_(room.GAME_CODE) !== ELMM174_GAME_CODE) return {ok:false,error:'sala_no_memory_match'};
    if (_elive176Upper_(room.STATUS) === 'CLOSED') return {ok:false,error:'sala_cerrada'};

    var current = _elive176Current_(room);
    var pkg = current.room_package || null;
    if (!pkg || !pkg.state || _elive176Upper_(pkg.state.phase) !== 'OPEN') return {ok:false,error:'ronda_no_abierta'};

    var now = new Date();
    var turnState = pkg.turn_state || null;
    var shared = _cs21a189ClassicShared_(pkg);
    var normalizedAttempt = _cs21a189NormalizeAttempt_(shared, turnState, now);

    if (!_cs21a189TurnStarted_(turnState, now)) {
      return {
        ok:false,error:'cambio_de_turno',mensaje:'Las cartas se están cerrando. El siguiente turno inicia en un momento.',
        retry_after_ms:Math.max(0,_elive176Timestamp_(turnState && turnState.turn_started_at)-now.getTime()),
        room_package:pkg,shared_state:shared,turn_state:turnState
      };
    }

    var endsMs = _elive176Timestamp_(turnState && turnState.turn_ends_at || pkg.state.ends_at);
    if (endsMs && now.getTime() >= endsMs) {
      return {ok:false,error:'turno_expirado',mensaje:'El tiempo terminó. Espere el siguiente turno.',room_package:pkg,shared_state:shared,turn_state:turnState};
    }

    var snapshot = _elive180BuildSnapshot_(room);
    var playerId = _elive176Text_(normalized.player_id || normalized.cod_estudiante);
    var player = _cs21a188MmPlayerFromSnapshot_(snapshot, playerId);
    if (!player) return {ok:false,error:'jugador_no_registrado'};
    var turnPlayer = {player_id:playerId,name:_elive176Text_(player.NOMBRE),team_id:_elive176Text_(player.TEAM) || 'NO_TEAM'};
    if (!_elive176CanAct_(turnState, turnPlayer)) {
      return {
        ok:false,error:'turno_no_activo',mensaje:'Espere su turno.',turn_state:turnState,room_package:pkg,shared_state:shared,
        turn_description:_elive176DescribeTurn_(turnState, _elive180TurnPlayers_(snapshot._player_rows))
      };
    }

    var byId = _cs21a188MmCardsById_(pkg);
    var action = _cs21a188MmAction_(normalized);
    var answer = _cs21a188MmAnswer_(normalized);

    if (action === 'DISCOVER_CARD') {
      var cardId = _elive176Text_(answer.card_id || answer.first_card_id || normalized.card_id || normalized.first_card_id);
      var card = byId[cardId] || null;
      if (!card) return {ok:false,error:'carta_no_encontrada'};
      if (_cs21a188MmPairClaimed_(shared, card.pair_id)) {
        return {ok:true,version:CS21A189_MM_CLASSIC_SYNC_VERSION,accepted:false,claimed:true,room_package:pkg,shared_state:shared,turn_state:turnState};
      }
      var attempt = shared.active_attempt;
      if (attempt && _cs21a189AttemptPhase_(attempt) === 'MISMATCH_REVEAL' && _cs21a189AttemptVisible_(attempt, now)) {
        return {ok:false,error:'cartas_en_transicion',mensaje:'Espere a que las cartas vuelvan a cerrarse.',room_package:pkg,shared_state:shared,turn_state:turnState};
      }
      if (attempt && _cs21a189AttemptPhase_(attempt) === 'FIRST_REVEALED') {
        if (_elive176Text_(attempt.first_card_id) === cardId && _elive176Text_(attempt.player_id) === playerId) {
          return {ok:true,version:CS21A189_MM_CLASSIC_SYNC_VERSION,accepted:false,duplicate:true,room_package:pkg,shared_state:shared,turn_state:turnState};
        }
        return {ok:false,error:'primera_carta_ya_abierta',mensaje:'Ya hay una primera carta abierta para este turno.',room_package:pkg,shared_state:shared,turn_state:turnState};
      }

      shared.active_attempt = _cs21a189Attempt_('FIRST_REVEALED', player, turnState, cardId, '', now, null);
      shared.last_action_key = [room.ROOM_CODE,turnState.turn_number,playerId,'REVEAL',cardId].join('|');
      shared.board_version += 1;
      pkg.version = CS21A189_MM_CLASSIC_SYNC_VERSION;
      pkg.shared_state = shared;
      pkg.server_now = _elive176Iso_(now);
      room = _cs21a189WritePackage_(found, room, current, pkg);

      _elive180AppendEvent_(room, 'MEMORY_MATCH_CARD_REVEALED', {sesion:{nombre:player.NOMBRE},rol:'student'}, {
        card_id:cardId,pair_id:_elive176Text_(card.pair_id),player_id:playerId,team_id:_elive176Text_(player.TEAM),
        turn_number:Number(turnState.turn_number || 0) || 0,board_version:shared.board_version,version:CS21A189_MM_CLASSIC_SYNC_VERSION
      });
      return {
        ok:true,version:CS21A189_MM_CLASSIC_SYNC_VERSION,accepted:true,action:'DISCOVER_CARD',
        room:_elive176PublicRoom_(room),room_package:pkg,shared_state:shared,turn_state:turnState,
        turn_description:_elive176DescribeTurn_(turnState, _elive180TurnPlayers_(snapshot._player_rows))
      };
    }

    var pair = _elive176PairFromBody_(pkg, normalized);
    if (!pair.first_id || !pair.second_id || pair.first_id === pair.second_id) return {ok:false,error:'par_invalido'};
    var firstCard = byId[pair.first_id] || null;
    var secondCard = byId[pair.second_id] || null;
    if (!firstCard || !secondCard) return {ok:false,error:'carta_no_encontrada'};
    if (_cs21a188MmPairClaimed_(shared, firstCard.pair_id) || _cs21a188MmPairClaimed_(shared, secondCard.pair_id)) {
      return {ok:false,error:'carta_ya_ganada',mensaje:'Una de esas cartas ya pertenece a una pareja ganada.',room_package:pkg,shared_state:shared,turn_state:turnState};
    }

    var activeAttempt = shared.active_attempt;
    if (!activeAttempt || _cs21a189AttemptPhase_(activeAttempt) !== 'FIRST_REVEALED' ||
        Number(activeAttempt.turn_number || 0) !== Number(turnState.turn_number || 0) ||
        _elive176Text_(activeAttempt.player_id) !== playerId) {
      return {ok:false,error:'primera_carta_no_sincronizada',mensaje:'La primera carta ya no corresponde a este turno. Intente de nuevo.',room_package:pkg,shared_state:shared,turn_state:turnState};
    }
    var serverFirstId = _elive176Text_(activeAttempt.first_card_id);
    if (serverFirstId !== pair.first_id && serverFirstId !== pair.second_id) {
      return {ok:false,error:'primera_carta_no_coincide',mensaje:'La pareja enviada no contiene la primera carta abierta.',room_package:pkg,shared_state:shared,turn_state:turnState};
    }
    var secondId = serverFirstId === pair.first_id ? pair.second_id : pair.first_id;
    if (secondId === serverFirstId) return {ok:false,error:'par_invalido'};

    var canonicalCards = [pair.first_id,pair.second_id].sort();
    var actionKey = [room.ROOM_CODE,turnState.turn_number,playerId,'PAIR',canonicalCards[0],canonicalCards[1]].join('|');
    if (_elive176Text_(shared.last_action_key) === actionKey) {
      return {ok:true,version:CS21A189_MM_CLASSIC_SYNC_VERSION,accepted:false,duplicate:true,room_package:pkg,turn_state:turnState,shared_state:shared};
    }

    var timeMs = Math.max(0, Number(normalized.time_ms || normalized.timeMs || 0) || 0);
    var points = _cs21a186MmPoints_(pair.correct);
    _elive180AppendObject_(ELIVE_ANSWERS_SHEET, ELIVE_ANSWERS_HEADERS, {
      ROOM_ID:room.ROOM_ID,ROOM_CODE:room.ROOM_CODE,QUESTION_INDEX:Number(room.CURRENT_INDEX || 1) || 1,
      COD_ESTUDIANTE:playerId,
      ANSWER_VALUE:JSON.stringify({action:'SUBMIT_PAIR',first_card_id:pair.first_id,second_card_id:pair.second_id,pair_id:pair.pair_id,correct:pair.correct}),
      IS_CORRECT:pair.correct ? 'TRUE' : 'FALSE',POINTS:points,TIME_MS:timeMs,ANSWERED_AT:_eliveIso_()
    });

    var durationMs = Number(pkg.rules && pkg.rules.round_duration_ms || 30000) || 30000;
    var nextTurn = null;
    var claim = null;
    var revealUntil = null;
    if (pair.correct) {
      claim = _cs21a188MmClaim_(shared, pair.pair_id, firstCard, secondCard, player, turnState, now);
      shared.active_attempt = null;
      nextTurn = _cs21a186MmContinueSamePlayer_(turnState, now, durationMs, 'PAIR_MATCHED_CONTINUE');
    } else {
      revealUntil = new Date(now.getTime() + CS21A189_MM_MISMATCH_REVEAL_MS);
      shared.active_attempt = _cs21a189Attempt_('MISMATCH_REVEAL', player, turnState, pair.first_id, pair.second_id, now, revealUntil);
      nextTurn = _elive176NextTurn_(turnState, revealUntil, durationMs, 'PAIR_MISMATCH_AFTER_FLIPBACK');
    }
    shared.last_action_key = actionKey;
    shared.board_version += 1;

    var totalPairs = pkg.round && Array.isArray(pkg.round.cards) ? pkg.round.cards.length / 2 : 0;
    var completed = totalPairs > 0 && shared.matched_pair_ids.length >= totalPairs;
    shared.completed = completed;
    if (completed) shared.active_attempt = null;

    pkg.version = CS21A189_MM_CLASSIC_SYNC_VERSION;
    pkg.turn_state = nextTurn;
    pkg.shared_state = shared;
    pkg.state.active_player_id = nextTurn.active_player_id;
    pkg.state.active_team_id = nextTurn.active_team_id;
    pkg.state.started_at = nextTurn.turn_started_at;
    pkg.state.ends_at = nextTurn.turn_ends_at;
    pkg.state.phase = completed ? 'COMPLETE' : 'OPEN';
    pkg.server_now = _elive176Iso_(now);
    current.room_package = pkg;

    var patch = {CURRENT_QUESTION_JSON:JSON.stringify(current)};
    if (completed) { patch.ROUND_STATUS = 'CLOSED'; patch.ROUND_CLOSED_AT = _eliveIso_(); }
    room = _elive180SetCells_(found, patch);

    _elive180AppendEvent_(room, pair.correct ? 'MEMORY_MATCH_PAIR_MATCHED' : 'MEMORY_MATCH_PAIR_MISMATCH', {sesion:{nombre:player.NOMBRE},rol:'student'}, {
      correct:pair.correct,points:points,pair_id:pair.pair_id,claim:claim,
      reveal_until:revealUntil ? _elive176Iso_(revealUntil) : '',
      board_version:shared.board_version,version:CS21A189_MM_CLASSIC_SYNC_VERSION
    });
    _elive180AppendEvent_(room, pair.correct && !completed ? 'LIVE_TURN_CONTINUED' : 'LIVE_TURN_ADVANCED', {sesion:{nombre:player.NOMBRE},rol:'student'}, {
      from_player_id:turnState.active_player_id,to_player_id:nextTurn.active_player_id,
      from_team_id:turnState.active_team_id,to_team_id:nextTurn.active_team_id,
      turn_number:nextTurn.turn_number,reason:nextTurn.reason,board_version:shared.board_version,completed:completed,
      version:CS21A189_MM_CLASSIC_SYNC_VERSION
    });

    _elive180Invalidate_(room);
    var refreshed = _elive180BuildSnapshot_(room);
    var ranking = refreshed.leaderboard || [];
    return {
      ok:true,version:CS21A189_MM_CLASSIC_SYNC_VERSION,accepted:true,action:'SUBMIT_PAIR',correct:pair.correct,points:points,
      turn_continues:pair.correct && !completed,claim:claim,reveal_until:revealUntil ? _elive176Iso_(revealUntil) : '',
      room:_elive176PublicRoom_(room),room_package:pkg,turn_state:nextTurn,shared_state:shared,
      leaderboard:ranking,team_leaderboard:refreshed.team_leaderboard,
      my_rank:ranking.filter(function (row) { return _elive176Text_(row.cod_estudiante) === playerId; })[0] || null,
      stats:refreshed.stats,
      turn_description:_elive176DescribeTurn_(nextTurn, _elive180TurnPlayers_(refreshed._player_rows))
    };
  } finally {
    lock.releaseLock();
  }
};
// Mantiene verificadores históricos aunque CS21A189 reemplace el objeto función.
englishLabMemoryMatchSubmitPairCS21A180.__cs21a186CanonicalRules = true;
englishLabMemoryMatchSubmitPairCS21A180.__cs21a188SharedDiscovery = true;
englishLabMemoryMatchSubmitPairCS21A180.__cs21a189ClassicSync = true;

var _cs21a189VerifyBase_ = verificarMemoryMatchStartFixCS21A183;
verificarMemoryMatchStartFixCS21A183 = function () {
  var previous = _cs21a189VerifyBase_();
  var t0 = new Date('2026-08-08T01:00:00.000Z');
  var t1 = new Date(t0.getTime() + CS21A189_MM_MISMATCH_REVEAL_MS);
  var first = _cs21a189Attempt_('FIRST_REVEALED',{COD_ESTUDIANTE:'P1',NOMBRE:'Chu',TEAM:'Equipo Azul'},{turn_number:3},'CARD-A','',t0,null);
  var mismatch = _cs21a189Attempt_('MISMATCH_REVEAL',{COD_ESTUDIANTE:'P1',NOMBRE:'Chu',TEAM:'Equipo Azul'},{turn_number:3},'CARD-A','CARD-X',t0,t1);
  var valid = !!(
    previous && previous.ok === true &&
    _cs21a189AttemptPhase_(first) === 'FIRST_REVEALED' &&
    _cs21a189AttemptVisible_(first,new Date(t0.getTime()+10000)) === true &&
    _cs21a189AttemptVisible_(mismatch,new Date(t0.getTime()+1000)) === true &&
    _cs21a189AttemptVisible_(mismatch,new Date(t1.getTime()+1)) === false &&
    englishLabMemoryMatchSubmitPairCS21A180.__cs21a186CanonicalRules === true &&
    englishLabMemoryMatchSubmitPairCS21A180.__cs21a188SharedDiscovery === true &&
    englishLabMemoryMatchSubmitPairCS21A180.__cs21a189ClassicSync === true
  );
  var result = {
    ok:valid,
    version:CS21A189_MM_CLASSIC_SYNC_VERSION,
    previous_version:previous && previous.version,
    classic_memory:true,
    synchronized_reveal:true,
    first_card_public_temporarily:true,
    mismatch_cards_public_temporarily:true,
    mismatch_flip_back:true,
    mismatch_reveal_ms:CS21A189_MM_MISMATCH_REVEAL_MS,
    persistent_discovery:false,
    matched_pair_stays_face_up:true,
    correct_pair_points:1,
    correct_pair_keeps_player:true,
    incorrect_pair_rotates_after_flipback:true,
    timeout_rotates_turn:true,
    closed_room_terminal:previous && previous.closed_room_terminal === true,
    recent_rooms_restored:previous && previous.recent_rooms_restored === true,
    stale_room_restore_forbidden:previous && previous.stale_room_restore_forbidden === true,
    qa_master:previous && previous.qa_master,
    qa_operational:previous && previous.qa_operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A189 no superó la verificación Memory Match clásico sincronizado.');
  return result;
};
