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
