// CS21A174 · English LAB Memory Match Live
// Módulo append-only para QA. No contiene vocabulario ni preguntas.
// Fuente editable: Google Sheet configurada en ScriptProperties.

var ELMM174_VERSION = 'CS21A174';
var ELMM174_DB_PROPERTY = 'ENGLISH_LAB_GAME_DB_ID';
var ELMM174_QA_DB_ID = '1MhPACxXkx3C9D9VvXcor8UUsGOGfBzCOI8rQf3jl8Mc';
var ELMM174_GAME_CODE = 'MEMORY_MATCH';
var ELMM174_GAME_LABEL = 'Memory Match';

function _elmm174Text_(value) {
  return String(value == null ? '' : value).trim();
}

function _elmm174Upper_(value) {
  return _elmm174Text_(value).toUpperCase();
}

function _elmm174Json_(value, fallback) {
  try { return value ? JSON.parse(_elmm174Text_(value)) : (fallback || {}); }
  catch (_) { return fallback || {}; }
}

function _elmm174Iso_(date) {
  return (date instanceof Date ? date : new Date()).toISOString();
}

function _elmm174AssertDependencies_() {
  var required = [
    '_eliveAuthTeacher_', '_eliveFindRoom_', '_eliveSetCells_', '_eliveAppendEvent_',
    '_eliveRoomPublic_', '_eliveSheet_', '_eliveFindPlayer_', '_eliveStats_',
    '_eliveCs20dLeaderboard_', '_eliveCs20dMyRank_', 'englishLabLiveCreateRoom',
    'englishLabLiveGetPlayerState', 'englishLabLiveGetRoomControl'
  ];
  var missing = required.filter(function (name) { return typeof this[name] !== 'function'; }, this);
  if (missing.length) throw new Error('CS21A174 depende de: ' + missing.join(', '));
}

function _elmm174DbId_() {
  var id = PropertiesService.getScriptProperties().getProperty(ELMM174_DB_PROPERTY);
  if (!id) throw new Error('Falta ScriptProperty ' + ELMM174_DB_PROPERTY + '.');
  return id;
}

function _elmm174Db_() {
  var ss = SpreadsheetApp.openById(_elmm174DbId_());
  if (_elmm174Text_(ss.getName()) !== 'ENGLISH_LAB_GAME_DB_CS21A173') {
    throw new Error('La base configurada no corresponde a ENGLISH_LAB_GAME_DB_CS21A173.');
  }
  return ss;
}

function _elmm174Rows_(sheetName) {
  var sh = _elmm174Db_().getSheetByName(sheetName);
  if (!sh) throw new Error('Falta la hoja ' + sheetName + '.');
  var values = sh.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function (h) { return _elmm174Upper_(h); });
  return values.slice(1).filter(function (row) {
    return row.some(function (cell) { return _elmm174Text_(cell); });
  }).map(function (row) {
    var out = {};
    headers.forEach(function (h, index) { out[h] = row[index]; });
    return out;
  });
}

function _elmm174Hash_(text) {
  var value = _elmm174Text_(text);
  var hash = 2166136261;
  for (var i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function _elmm174Shuffle_(rows, seedText) {
  var out = rows.slice();
  var seed = _elmm174Hash_(seedText) || 1;
  function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (var i = out.length - 1; i > 0; i -= 1) {
    var j = Math.floor(random() * (i + 1));
    var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  }
  return out;
}

function _elmm174Settings_(room) {
  return _elmm174Json_(room && room.SETTINGS_JSON, {});
}

function _elmm174CanManage_(auth, room) {
  var role = _elmm174Text_(auth && auth.rol).toLowerCase();
  if (role === 'admin' || role === 'superadmin') return true;
  var session = auth && auth.sesion || {};
  var teacher = _elmm174Text_(session.nombre || session.nombre_completo || session.usuario);
  var roomTeacher = _elmm174Text_(room && room.DOCENTE);
  if (teacher && roomTeacher && teacher === roomTeacher) return true;
  if (typeof _eliveCanGroup_ === 'function') {
    try { return !!_eliveCanGroup_(auth, _elmm174Text_(room && room.COD_GRUPO)); }
    catch (_) {}
  }
  return false;
}

function _elmm174FindManagedRoom_(body) {
  var auth = _eliveAuthTeacher_(body || {});
  if (!auth || auth.ok !== true) return { ok:false, response:auth || {ok:false,error:'sesion_invalida'} };
  var id = body.room_id || body.roomId || body.room_code || body.roomCode || body.codigo;
  var found = _eliveFindRoom_(id);
  if (!found || !found.row) return { ok:false, response:{ok:false,error:'sala_no_encontrada'} };
  if (!_elmm174CanManage_(auth, found.row)) return { ok:false, response:{ok:false,error:'sin_permiso_sala'} };
  return { ok:true, auth:auth, found:found, room:found.row };
}

function _elmm174Rules_(level, mode) {
  var rows = _elmm174Rows_('ROUND_RULES');
  var wantedLevel = _elmm174Upper_(level || 'B1');
  var wantedMode = _elmm174Upper_(mode || 'INDIVIDUAL');
  var row = rows.filter(function (item) {
    return _elmm174Upper_(item.GAME_ID) === ELMM174_GAME_CODE &&
      _elmm174Upper_(item.LEVEL_ID) === wantedLevel &&
      _elmm174Upper_(item.MODE_TYPE) === wantedMode;
  })[0] || {};
  var fallback = {
    B1:{INDIVIDUAL:30,TEAMS:45}, B2:{INDIVIDUAL:25,TEAMS:35},
    I1:{INDIVIDUAL:20,TEAMS:30}, I2:{INDIVIDUAL:15,TEAMS:25}
  };
  var seconds = Number(row.TIMER_SECONDS || (fallback[wantedLevel] && fallback[wantedLevel][wantedMode]) || 30) || 30;
  return {
    auto_start_delay_ms: Math.max(0, Number(row.AUTO_START_DELAY || 5) * 1000),
    round_duration_ms: Math.max(5000, seconds * 1000),
    reveal_duration_ms: Math.max(0, Number(row.REVEAL_SECONDS || 3) * 1000),
    auto_next_delay_ms: Math.max(0, Number(row.AUTO_NEXT_DELAY || 2) * 1000),
    discussion_duration_ms: Math.max(0, Number(row.DISCUSSION_SECONDS || 0) * 1000),
    team_size: Math.max(1, Number(row.TEAM_SIZE || (wantedMode === 'TEAMS' ? 5 : 1)) || 1),
    pause_allowed: _elmm174Upper_(row.PAUSE_ALLOWED || 'SI') !== 'NO',
    teacher_override: _elmm174Upper_(row.TEACHER_OVERRIDE || 'SI') !== 'NO'
  };
}

function _elmm174PairRows_(level, unit) {
  var wantedLevel = _elmm174Upper_(level || 'B1');
  var wantedUnit = _elmm174Upper_(unit || 'MIX');
  return _elmm174Rows_('QUESTION_BANK').filter(function (row) {
    var rowUnit = _elmm174Upper_(row.UNIT_ID || 'MIX');
    return _elmm174Upper_(row.GAME_ID) === ELMM174_GAME_CODE &&
      _elmm174Upper_(row.STATUS) === 'ACTIVE' &&
      (_elmm174Upper_(row.LEVEL_ID) === wantedLevel || _elmm174Upper_(row.LEVEL_ID) === 'ALL') &&
      (wantedUnit === 'MIX' || rowUnit === wantedUnit || rowUnit === 'MIX') &&
      _elmm174Text_(row.PAIR_LEFT || row.STEM) && _elmm174Text_(row.PAIR_RIGHT);
  });
}

function _elmm174Cards_(room, pairCount) {
  var settings = _elmm174Settings_(room);
  var level = _elmm174Upper_(room.NIVEL || settings.level || 'B1');
  var unit = _elmm174Upper_(settings.unit || 'MIX');
  var count = Math.max(3, Math.min(12, Number(pairCount || settings.pair_count || 6) || 6));
  var rows = _elmm174Shuffle_(_elmm174PairRows_(level, unit), room.ROOM_CODE + '|' + unit + '|' + level).slice(0, count);
  if (rows.length < count) {
    throw new Error('Banco insuficiente para ' + level + '/' + unit + ': ' + rows.length + ' pares; se requieren ' + count + '.');
  }
  var cards = [];
  rows.forEach(function (row, index) {
    var pairId = _elmm174Text_(row.CONTENT_ID) || ('PAIR-' + (index + 1));
    var left = _elmm174Text_(row.PAIR_LEFT || row.STEM);
    var right = _elmm174Text_(row.PAIR_RIGHT);
    var mediaId = _elmm174Text_(row.MEDIA_ID);
    cards.push({card_id:pairId + '-L', pair_id:pairId, face_type:'TEXT', label:left, media_id:mediaId});
    cards.push({card_id:pairId + '-R', pair_id:pairId, face_type:'TEXT', label:right, media_id:''});
  });
  return _elmm174Shuffle_(cards, room.ROOM_CODE + '|CARDS');
}

function _elmm174Teams_(room) {
  var playersSheet = _eliveSheet_(ELIVE_PLAYERS_SHEET, ELIVE_PLAYERS_HEADERS);
  var values = playersSheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var idx = {}; headers.forEach(function (h, i) { idx[_elmm174Upper_(h)] = i; });
  var byTeam = {};
  values.slice(1).forEach(function (row) {
    if (_elmm174Text_(row[idx.ROOM_CODE]) !== _elmm174Text_(room.ROOM_CODE)) return;
    var team = _elmm174Text_(row[idx.TEAM]) || 'Sin equipo';
    var code = _elmm174Text_(row[idx.COD_ESTUDIANTE]);
    var name = _elmm174Text_(row[idx.NOMBRE]) || code;
    if (!byTeam[team]) byTeam[team] = {team_id:team, name:team, points:0, members:[]};
    byTeam[team].members.push({player_id:code,name:name});
  });
  return Object.keys(byTeam).map(function (key) { return byTeam[key]; });
}

function _elmm174Package_(room, cards, rules, now) {
  var startAt = new Date(now.getTime() + Number(rules.auto_start_delay_ms || 0));
  var endAt = new Date(startAt.getTime() + Number(rules.round_duration_ms || 30000));
  return {
    version:ELMM174_VERSION,
    server_now:_elmm174Iso_(now),
    received_at_ms:now.getTime(),
    room:{
      room_code:_elmm174Text_(room.ROOM_CODE), game_id:ELMM174_GAME_CODE,
      mode:_elmm174Upper_(room.MODE || 'INDIVIDUAL'), level_id:_elmm174Upper_(room.NIVEL || 'B1')
    },
    round:{
      round_id:_elmm174Text_(room.ROOM_CODE) + '-R1', index:1,
      title:ELMM174_GAME_LABEL + ' · ' + _elmm174Upper_((_elmm174Settings_(room).unit || 'MIX')),
      cards:cards
    },
    rules:rules,
    state:{
      phase:rules.auto_start_delay_ms > 0 ? 'COUNTDOWN' : 'OPEN',
      started_at:_elmm174Iso_(startAt), ends_at:_elmm174Iso_(endAt), active_team_id:''
    },
    teams:_elmm174Teams_(room)
  };
}

function _elmm174CurrentPackage_(room) {
  var current = _elmm174Json_(room && room.CURRENT_QUESTION_JSON, {});
  return current && current.room_package ? current.room_package : null;
}

function _elmm174MaybeAdvancePhase_(found) {
  var room = found.row;
  var pkg = _elmm174CurrentPackage_(room);
  if (!pkg || !pkg.state) return room;
  var now = new Date();
  var started = new Date(pkg.state.started_at || 0);
  var ends = new Date(pkg.state.ends_at || 0);
  var changed = false;
  if (pkg.state.phase === 'COUNTDOWN' && started.getTime() && now.getTime() >= started.getTime()) {
    pkg.state.phase = 'OPEN'; changed = true;
  }
  if ((pkg.state.phase === 'OPEN' || pkg.state.phase === 'COUNTDOWN') && ends.getTime() && now.getTime() >= ends.getTime()) {
    pkg.state.phase = 'COMPLETE'; changed = true;
  }
  pkg.server_now = _elmm174Iso_(now);
  if (!changed) return room;
  var current = _elmm174Json_(room.CURRENT_QUESTION_JSON, {});
  current.room_package = pkg;
  var patch = {CURRENT_QUESTION_JSON:JSON.stringify(current)};
  if (pkg.state.phase === 'COMPLETE') {
    patch.ROUND_STATUS = 'CLOSED'; patch.ROUND_CLOSED_AT = _elmm174Iso_(now);
  }
  return _eliveSetCells_(found, patch);
}

function instalarEnglishLabMemoryMatchCS21A174() {
  _elmm174AssertDependencies_();
  var db = SpreadsheetApp.openById(ELMM174_QA_DB_ID);
  if (_elmm174Text_(db.getName()) !== 'ENGLISH_LAB_GAME_DB_CS21A173') throw new Error('Base QA inesperada.');
  PropertiesService.getScriptProperties().setProperty(ELMM174_DB_PROPERTY, ELMM174_QA_DB_ID);
  return verificarEnglishLabMemoryMatchCS21A174();
}

function verificarEnglishLabMemoryMatchCS21A174() {
  _elmm174AssertDependencies_();
  var pairs = _elmm174PairRows_('B1', 'U01');
  var result = {ok:pairs.length >= 6, version:ELMM174_VERSION, database:_elmm174Db_().getName(), b1_u01_pairs:pairs.length};
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('Se requieren al menos seis pares B1/U01.');
  return result;
}

function englishLabMemoryMatchCreateRoom(body) {
  body = body || {};
  _elmm174AssertDependencies_();
  var auth = _eliveAuthTeacher_(body); if (!auth || auth.ok !== true) return auth || {ok:false,error:'sesion_invalida'};
  var baseBody = {};
  Object.keys(body).forEach(function (key) { baseBody[key] = body[key]; });
  baseBody.game_code = 'WORD_MATCH';
  baseBody.game = 'WORD_MATCH';
  baseBody.question_count = 1;
  var out = englishLabLiveCreateRoom(baseBody);
  if (!out || out.ok !== true || !out.room) return out;
  var found = _eliveFindRoom_(out.room.room_id || out.room.ROOM_ID || out.room.room_code || out.room.ROOM_CODE);
  if (!found || !found.row) return {ok:false,error:'sala_creada_no_localizada'};
  var settings = _elmm174Settings_(found.row);
  settings.unit = _elmm174Upper_(body.unit || body.unidad || 'MIX');
  settings.pair_count = Math.max(3, Math.min(12, Number(body.pair_count || body.cantidad || 6) || 6));
  settings.content_database_property = ELMM174_DB_PROPERTY;
  settings.engine = ELMM174_GAME_CODE;
  settings.version = ELMM174_VERSION;
  var row = _eliveSetCells_(found, {
    GAME_CODE:ELMM174_GAME_CODE, GAME_LABEL:ELMM174_GAME_LABEL,
    QUESTION_COUNT:1, CURRENT_INDEX:0, ROUND_STATUS:'', CURRENT_QUESTION_JSON:'',
    SETTINGS_JSON:JSON.stringify(settings)
  });
  _eliveAppendEvent_(row, 'MEMORY_MATCH_ROOM_CREATED', auth, {unit:settings.unit,pair_count:settings.pair_count});
  return {ok:true,version:ELMM174_VERSION,room:_eliveRoomPublic_(row),message:'Sala Memory Match creada.'};
}

function englishLabMemoryMatchStartRoom(body) {
  body = body || {};
  var managed = _elmm174FindManagedRoom_(body); if (!managed.ok) return managed.response;
  var room = managed.room;
  if (_elmm174Upper_(room.GAME_CODE) !== ELMM174_GAME_CODE) return {ok:false,error:'sala_no_memory_match'};
  if (_elmm174Upper_(room.STATUS) === 'CLOSED') return {ok:false,error:'sala_cerrada'};
  var settings = _elmm174Settings_(room);
  var cards = _elmm174Cards_(room, settings.pair_count);
  var rules = _elmm174Rules_(room.NIVEL, room.MODE);
  var now = new Date();
  var pkg = _elmm174Package_(room, cards, rules, now);
  var current = {type:'memory_match',game_id:ELMM174_GAME_CODE,index:1,room_package:pkg};
  var row = _eliveSetCells_(managed.found, {
    STATUS:'LIVE', STARTED_AT:room.STARTED_AT || _elmm174Iso_(now), CURRENT_INDEX:1,
    ROUND_STATUS:'OPEN', ROUND_STARTED_AT:_elmm174Iso_(now), ROUND_CLOSED_AT:'',
    CURRENT_QUESTION_JSON:JSON.stringify(current)
  });
  _eliveAppendEvent_(row, 'MEMORY_MATCH_STARTED', managed.auth, {cards:cards.length,pairs:cards.length/2,rules:rules});
  return {ok:true,version:ELMM174_VERSION,room:_eliveRoomPublic_(row),room_package:pkg};
}

function englishLabMemoryMatchGetPlayerState(body) {
  body = body || {};
  var base = englishLabLiveGetPlayerState(body);
  if (!base || base.ok !== true || !base.room) return base;
  if (_elmm174Upper_(base.room.game_code || base.room.GAME_CODE) !== ELMM174_GAME_CODE) return base;
  var found = _eliveFindRoom_(base.room.room_id || base.room.ROOM_ID || base.room.room_code || base.room.ROOM_CODE);
  if (!found || !found.row) return base;
  var room = _elmm174MaybeAdvancePhase_(found);
  var pkg = _elmm174CurrentPackage_(room);
  if (pkg) {
    pkg.server_now = _elmm174Iso_(new Date());
    pkg.teams = _elmm174Teams_(room);
    pkg.player = base.player || null;
  }
  base.version = ELMM174_VERSION;
  base.memory_match = true;
  base.room = _eliveRoomPublic_(room);
  base.room_package = pkg;
  return base;
}

function _elmm174AnswerRows_(roomCode, studentCode, questionIndex) {
  var sh = _eliveSheet_(ELIVE_ANSWERS_SHEET, ELIVE_ANSWERS_HEADERS);
  var values = sh.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var idx = {}; headers.forEach(function (h, i) { idx[_elmm174Upper_(h)] = i; });
  return values.slice(1).filter(function (row) {
    return _elmm174Text_(row[idx.ROOM_CODE]) === _elmm174Text_(roomCode) &&
      _elmm174Text_(row[idx.COD_ESTUDIANTE]) === _elmm174Text_(studentCode) &&
      Number(row[idx.QUESTION_INDEX] || 0) === Number(questionIndex || 0);
  }).map(function (row) {
    var out = {}; headers.forEach(function (h, i) { out[_elmm174Upper_(h)] = row[i]; }); return out;
  });
}

function englishLabMemoryMatchSubmitPair(body) {
  body = body || {};
  var code = _elmm174Upper_(body.room_code || body.roomCode || body.codigo).replace(/[^A-Z0-9-]/g, '');
  if (!code) return {ok:false,error:'room_code requerido'};
  var found = _eliveFindRoom_(code); if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
  var room = _elmm174MaybeAdvancePhase_(found);
  if (_elmm174Upper_(room.GAME_CODE) !== ELMM174_GAME_CODE) return {ok:false,error:'sala_no_memory_match'};
  var pkg = _elmm174CurrentPackage_(room);
  if (!pkg || !pkg.state || pkg.state.phase !== 'OPEN') return {ok:false,error:'ronda_no_abierta'};
  var playerId = _elmm174Text_(body.player_id || body.playerId || body.cod_estudiante || body.codigo_estudiante);
  var playerFound = _eliveFindPlayer_(room, playerId);
  if (!playerFound || !playerFound.row) return {ok:false,error:'jugador_no_registrado'};
  var answer = body.answer_value || body.answerValue || {};
  if (typeof answer === 'string') answer = _elmm174Json_(answer, {});
  var firstId = _elmm174Text_(answer.first_card_id || body.first_card_id);
  var secondId = _elmm174Text_(answer.second_card_id || body.second_card_id);
  if (!firstId || !secondId || firstId === secondId) return {ok:false,error:'par_invalido'};
  var cards = pkg.round && Array.isArray(pkg.round.cards) ? pkg.round.cards : [];
  var byId = {}; cards.forEach(function (card) { byId[_elmm174Text_(card.card_id)] = card; });
  var first = byId[firstId], second = byId[secondId];
  if (!first || !second) return {ok:false,error:'tarjeta_no_pertenece_ronda'};
  var correct = _elmm174Text_(first.pair_id) && _elmm174Text_(first.pair_id) === _elmm174Text_(second.pair_id);
  var pairId = correct ? _elmm174Text_(first.pair_id) : '';
  var previous = _elmm174AnswerRows_(room.ROOM_CODE, playerFound.row.COD_ESTUDIANTE, room.CURRENT_INDEX);
  var duplicate = correct && previous.some(function (row) {
    if (_elmm174Upper_(row.IS_CORRECT) !== 'TRUE') return false;
    var parsed = _elmm174Json_(row.ANSWER_VALUE, {});
    return _elmm174Text_(parsed.pair_id) === pairId;
  });
  if (duplicate) return {ok:true,accepted:false,duplicate:true,correct:true,points:0,message:'Par ya contabilizado.'};
  var timeMs = Math.max(0, Number(body.time_ms || body.timeMs || 0) || 0);
  var points = correct ? Math.max(100, 150 - Math.floor(timeMs / 1000)) : 0;
  var payload = {first_card_id:firstId,second_card_id:secondId,pair_id:pairId,correct:correct};
  var row = {
    ROOM_ID:_elmm174Text_(room.ROOM_ID), ROOM_CODE:_elmm174Text_(room.ROOM_CODE),
    QUESTION_INDEX:Number(room.CURRENT_INDEX || 1) || 1,
    COD_ESTUDIANTE:_elmm174Text_(playerFound.row.COD_ESTUDIANTE),
    ANSWER_VALUE:JSON.stringify(payload), IS_CORRECT:correct ? 'TRUE' : 'FALSE',
    POINTS:points, TIME_MS:timeMs, ANSWERED_AT:_elmm174Iso_(new Date())
  };
  var sh = _eliveSheet_(ELIVE_ANSWERS_SHEET, ELIVE_ANSWERS_HEADERS);
  sh.appendRow(ELIVE_ANSWERS_HEADERS.map(function (header) { return row[header] !== undefined ? row[header] : ''; }));
  _eliveAppendEvent_(room, 'MEMORY_MATCH_PAIR_SUBMITTED', {sesion:{nombre:playerFound.row.NOMBRE},rol:'student'}, {correct:correct,points:points,pair_id:pairId});
  var lb = _eliveCs20dLeaderboard_(room);
  return {
    ok:true,version:ELMM174_VERSION,accepted:true,correct:correct,points:points,
    leaderboard:lb.players,team_leaderboard:lb.teams,
    my_rank:_eliveCs20dMyRank_(lb, playerFound.row.COD_ESTUDIANTE),
    stats:_eliveStats_(room),message:correct ? 'Par correcto.' : 'No forman un par.'
  };
}

function englishLabMemoryMatchGetRoomControl(body) {
  body = body || {};
  var managed = _elmm174FindManagedRoom_(body); if (!managed.ok) return managed.response;
  var base = englishLabLiveGetRoomControl(body);
  if (!base || base.ok !== true) return base;
  if (_elmm174Upper_(managed.room.GAME_CODE) !== ELMM174_GAME_CODE) return base;
  var room = _elmm174MaybeAdvancePhase_(managed.found);
  base.version = ELMM174_VERSION;
  base.memory_match = true;
  base.room = _eliveRoomPublic_(room);
  base.room_package = _elmm174CurrentPackage_(room);
  return base;
}

function englishLabMemoryMatchCloseRound(body) {
  body = body || {};
  var managed = _elmm174FindManagedRoom_(body); if (!managed.ok) return managed.response;
  if (_elmm174Upper_(managed.room.GAME_CODE) !== ELMM174_GAME_CODE) return {ok:false,error:'sala_no_memory_match'};
  var current = _elmm174Json_(managed.room.CURRENT_QUESTION_JSON, {});
  if (current.room_package && current.room_package.state) current.room_package.state.phase = 'COMPLETE';
  var now = _elmm174Iso_(new Date());
  var row = _eliveSetCells_(managed.found, {
    ROUND_STATUS:'CLOSED', ROUND_CLOSED_AT:now, CURRENT_QUESTION_JSON:JSON.stringify(current)
  });
  _eliveAppendEvent_(row, 'MEMORY_MATCH_ROUND_CLOSED', managed.auth, {});
  var lb = _eliveCs20dLeaderboard_(row);
  return {ok:true,version:ELMM174_VERSION,room:_eliveRoomPublic_(row),leaderboard:lb.players,team_leaderboard:lb.teams};
}

// Router append-only. Las funciones Live existentes siguen delegándose al router anterior.
var _elmm174DoPostBase_ = doPost;
doPost = function (e) {
  try {
    var body = {}; try { body = _an4406_parseBody_(e) || {}; } catch (_) { body = {}; }
    var fn = _elmm174Text_((e && e.parameter && e.parameter.fn) || body.fn).toLowerCase();
    if (fn === 'englishlabmemorymatchcreateroom') return _an4406_json_(englishLabMemoryMatchCreateRoom(body));
    if (fn === 'englishlabmemorymatchstartroom') return _an4406_json_(englishLabMemoryMatchStartRoom(body));
    if (fn === 'englishlabmemorymatchgetplayerstate') return _an4406_json_(englishLabMemoryMatchGetPlayerState(body));
    if (fn === 'englishlabmemorymatchsubmitpair') return _an4406_json_(englishLabMemoryMatchSubmitPair(body));
    if (fn === 'englishlabmemorymatchgetroomcontrol') return _an4406_json_(englishLabMemoryMatchGetRoomControl(body));
    if (fn === 'englishlabmemorymatchcloseround') return _an4406_json_(englishLabMemoryMatchCloseRound(body));
    if (fn === 'verificarenglishlabmemorymatchcs21a174') return _an4406_json_(verificarEnglishLabMemoryMatchCS21A174());
    return _elmm174DoPostBase_(e);
  } catch (err) {
    return _an4406_json_({ok:false,version:ELMM174_VERSION,error:'memory_match_live_error',mensaje:String(err && err.message ? err.message : err)});
  }
};
