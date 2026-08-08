// CS21A191 · AHORCADO QA · English LAB Live
// APPEND-ONLY en el repositorio; el usuario recibe SIEMPRE el Apps Script completo ensamblado.
// QA/STAGING solamente. NO USAR EN PRODUCCIÓN.

var ELHANG191_VERSION = 'CS21A191-HANGMAN-1';
var ELHANG191_GAME_CODE = 'HANGMAN';
var ELHANG191_GAME_LABEL = 'Ahorcado';
var ELHANG191_DEFAULT_MAX_ERRORS = 6;
var ELHANG191_DEFAULT_TURN_MS = 15000;
var ELHANG191_MIN_ROUNDS = 3;
var ELHANG191_MAX_ROUNDS = 5;

function _elh191Text_(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}
function _elh191Upper_(value) {
  return _elh191Text_(value).toUpperCase();
}
function _elh191Json_(value, fallback) {
  if (value && typeof value === 'object') return value;
  try { return value ? JSON.parse(String(value)) : (fallback || {}); }
  catch (_) { return fallback || {}; }
}
function _elh191CanonicalAnswer_(value) {
  return _elh191Upper_(value).replace(/[’‘]/g, "'").replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
}
function _elh191IsLetter_(value) {
  return /^[A-Z]$/.test(_elh191Upper_(value));
}
function _elh191NormalizeLetters_(values) {
  var source = Array.isArray(values) ? values : [];
  var seen = {};
  return source.map(function (value) { return _elh191Upper_(value); }).filter(function (letter) {
    if (!_elh191IsLetter_(letter) || seen[letter]) return false;
    seen[letter] = true;
    return true;
  });
}
function _elh191UniqueLetters_(answer) {
  var seen = {};
  return _elh191CanonicalAnswer_(answer).split('').filter(function (char) {
    if (!_elh191IsLetter_(char) || seen[char]) return false;
    seen[char] = true;
    return true;
  });
}
function _elh191Occurrences_(answer, letter) {
  var wanted = _elh191Upper_(letter);
  if (!_elh191IsLetter_(wanted)) return 0;
  return _elh191CanonicalAnswer_(answer).split('').filter(function (char) { return char === wanted; }).length;
}
function _elh191Mask_(answer, guessedLetters) {
  var guessed = {};
  _elh191NormalizeLetters_(guessedLetters).forEach(function (letter) { guessed[letter] = true; });
  var cells = _elh191CanonicalAnswer_(answer).split('').map(function (char, index) {
    var isLetter = _elh191IsLetter_(char);
    if (isLetter) return {index:index,kind:'LETTER',value:guessed[char] ? char : '',revealed:!!guessed[char]};
    if (char === ' ') return {index:index,kind:'SPACE',value:' ',revealed:true};
    return {index:index,kind:'PUNCTUATION',value:char,revealed:true};
  });
  var display = cells.map(function (cell) {
    if (cell.kind === 'SPACE') return '  ';
    if (cell.kind === 'PUNCTUATION') return cell.value;
    return cell.revealed ? cell.value : '_';
  }).join(' ');
  return {cells:cells,display:display};
}
function _elh191SolvedByLetters_(answer, guessedLetters) {
  var required = _elh191UniqueLetters_(answer);
  var guessed = {};
  _elh191NormalizeLetters_(guessedLetters).forEach(function (letter) { guessed[letter] = true; });
  return required.length > 0 && required.every(function (letter) { return !!guessed[letter]; });
}
function _elh191ScoreSolve_(maxErrors, errorsUsed) {
  var max = Math.max(1, Number(maxErrors || ELHANG191_DEFAULT_MAX_ERRORS) || ELHANG191_DEFAULT_MAX_ERRORS);
  var used = Math.max(0, Math.min(max, Number(errorsUsed || 0) || 0));
  return 100 + (max - used) * 10;
}
function _elh191QaGuard_() {
  if (typeof _cs21a183MmStartQaGuard_ === 'function') return _cs21a183MmStartQaGuard_();
  var props = PropertiesService.getScriptProperties();
  var masterId = _elh191Text_(props.getProperty('QA_STAGING_MASTER_ID'));
  var operationalId = _elh191Text_(props.getProperty('QA_STAGING_OPERATIVO_ID'));
  if (!masterId || !operationalId) throw new Error('BLOQUEADO: faltan propiedades QA/STAGING.');
  var masterName = SpreadsheetApp.openById(masterId).getName();
  var operationalName = SpreadsheetApp.openById(operationalId).getName();
  if (!/QA|STAGING/i.test(masterName) || !/QA|STAGING/i.test(operationalName)) {
    throw new Error('BLOQUEADO: Ahorcado CS21A191 solo puede ejecutarse en QA/STAGING.');
  }
  return {master:masterName,operational:operationalName};
}
function _elh191Settings_(room) {
  return _elh191Json_(room && room.SETTINGS_JSON, {});
}
function _elh191Current_(room) {
  return _elh191Json_(room && room.CURRENT_QUESTION_JSON, {});
}
function _elh191RoomId_(body) {
  return _elive180RoomIdFromBody_(body || {}) || _elh191Text_(body && (body.room_code || body.roomCode || body.codigo));
}
function _elh191Find_(body) {
  var id = _elh191RoomId_(body || {});
  return id ? _elive180FindRoom_(id) : null;
}
function _elh191IsRoom_(body) {
  var found = _elh191Find_(body || {});
  return !!(found && found.row && _elh191Upper_(found.row.GAME_CODE) === ELHANG191_GAME_CODE);
}
function _elh191Managed_(body) {
  var auth = _eliveAuthTeacher_(body || {});
  if (!auth || auth.ok !== true) return {ok:false,response:auth || {ok:false,error:'sesion_invalida'}};
  var found = _elh191Find_(body || {});
  if (!found || !found.row) return {ok:false,response:{ok:false,error:'sala_no_encontrada'}};
  if (_elh191Upper_(found.row.GAME_CODE) !== ELHANG191_GAME_CODE) return {ok:false,response:{ok:false,error:'sala_no_ahorcado'}};
  if (!_elive180CanRoom_(auth, found.row)) return {ok:false,response:{ok:false,error:'docente_sin_permiso_grupo'}};
  return {ok:true,auth:auth,found:found,room:found.row};
}
function _elh191SameRoom_(row, room) {
  return _elive180SameRoom_(row, room);
}
function _elh191PlayerRows_(room) {
  var table = _elive180Table_(ELIVE_PLAYERS_SHEET, ELIVE_PLAYERS_HEADERS);
  return table.rows.filter(function (row) { return _elh191SameRoom_(row, room); });
}
function _elh191Player_(room, playerId) {
  return _elh191PlayerRows_(room).filter(function (row) {
    return _elh191Text_(row.COD_ESTUDIANTE) === _elh191Text_(playerId);
  })[0] || null;
}
function _elh191PresenceRows_(room, nowMs) {
  if (typeof _cs21a183MmPresenceRows_ === 'function') return _cs21a183MmPresenceRows_(room, nowMs);
  return _elh191PlayerRows_(room).filter(function (row) {
    var status = _elh191Upper_(row.STATUS || 'ACTIVE');
    if (status === 'LEFT' || status === 'INACTIVE' || status === 'CLOSED' || status === 'REMOVED') return false;
    var seenAt = _elive176Timestamp_(row.LAST_SEEN_AT || row.JOINED_AT);
    return !!seenAt && Math.max(0, Number(nowMs || Date.now()) - seenAt) <= 60000;
  });
}
function _elh191TurnPlayers_(rows) {
  if (typeof _cs21a183MmTurnPlayers_ === 'function') return _cs21a183MmTurnPlayers_(rows || []);
  return _elive180TurnPlayers_(rows || []);
}
function _elh191SourceRows_(level, unit) {
  var rows = _elive176PairRows_(_elh191Upper_(level), _elive176NormalizeUnit_(unit));
  var seen = {};
  return rows.filter(function (row) {
    var answer = _elh191CanonicalAnswer_(row.PAIR_LEFT || row.STEM);
    var clue = _elh191Text_(row.PAIR_RIGHT);
    if (!answer || !clue || !_elh191UniqueLetters_(answer).length || answer.length > 48 || seen[answer]) return false;
    seen[answer] = true;
    return true;
  });
}
function _elh191SourceId_(row, index) {
  return _elh191Text_(row && (row.CONTENT_ID || row.PLAY_ITEM_ID || row.QUESTION_ID || row.ID)) || ('MM-SOURCE-' + (Number(index || 0) + 1));
}
function _elh191ParseItems_(value) {
  var raw = value;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); }
    catch (_) {
      raw = raw.split(/\r?\n/).map(function (line) {
        var parts = String(line || '').split(/\s*(?:=|→|\|)\s*/);
        return {answer:parts.shift(),clue:parts.join(' = ')};
      });
    }
  }
  if (!Array.isArray(raw)) return [];
  var seen = {};
  return raw.map(function (item, index) {
    var source = typeof item === 'string' ? {answer:item} : (item || {});
    var answer = _elh191CanonicalAnswer_(source.answer || source.word || source.term || source.PAIR_LEFT);
    var clue = _elh191Text_(source.clue || source.hint || source.meaning || source.PAIR_RIGHT);
    var sourceId = _elh191Text_(source.source_item_id || source.sourceItemId || source.content_id || source.CONTENT_ID);
    if (!answer || !clue || !_elh191UniqueLetters_(answer).length || answer.length > 48 || seen[answer]) return null;
    seen[answer] = true;
    return {
      item_id:_elh191Text_(source.item_id || source.itemId) || ('HANG-' + (index + 1)),
      answer:answer,
      clue:clue,
      source_item_id:sourceId,
      source_answer:_elh191CanonicalAnswer_(source.source_answer || source.sourceAnswer || answer),
      source_clue:_elh191Text_(source.source_clue || source.sourceClue || clue),
      edited:source.edited === true
    };
  }).filter(function (item) { return !!item; }).slice(0, ELHANG191_MAX_ROUNDS);
}
function _elh191Curriculum_(level, unit) {
  return typeof _elso183CurriculumUnit_ === 'function'
    ? _elso183CurriculumUnit_(level, unit)
    : {level_id:_elh191Upper_(level),unit_id:_elh191Upper_(level) + '-' + _elive176NormalizeUnit_(unit)};
}
function _elh191SuggestedItems_(level, unit, seed) {
  var rows = _elive176Shuffle_(_elh191SourceRows_(level, unit), seed + '|HANGMAN-CS21A191');
  return rows.map(function (row, index) {
    var answer = _elh191CanonicalAnswer_(row.PAIR_LEFT || row.STEM);
    var clue = _elh191Text_(row.PAIR_RIGHT);
    return {
      item_id:'HANG-' + (index + 1),
      answer:answer,
      clue:clue,
      source_item_id:_elh191SourceId_(row, index),
      source_answer:answer,
      source_clue:clue,
      edited:false
    };
  });
}
function _elh191Evidence_(body, items) {
  body = body || {};
  var cod = _elh191Text_(body.cod_grupo || body.codGrupo || body.grupo);
  var level = _anF65_levelId_(body.nivel || '') || _elh191Upper_(cod.split('-')[0] || '');
  var unit = _elive176NormalizeUnit_(body.unit || body.unidad || '');
  var curriculum = _elh191Curriculum_(level, unit);
  if (!curriculum || unit === 'MIX') return {ok:false,response:{ok:false,version:ELHANG191_VERSION,error:'unidad_curricular_invalida',mensaje:'Ahorcado requiere una unidad U01–U16 activa del nivel del grupo.'}};
  var loaded = body.curriculum_source_loaded === true || _elh191Upper_(body.curriculum_source_loaded) === 'TRUE';
  var acknowledged = body.curriculum_acknowledged === true || _elh191Upper_(body.curriculum_acknowledged) === 'TRUE';
  if (!loaded) return {ok:false,response:{ok:false,version:ELHANG191_VERSION,error:'curriculum_source_required',mensaje:'Cargue primero las palabras sugeridas de la unidad.'}};
  if (!acknowledged) return {ok:false,response:{ok:false,version:ELHANG191_VERSION,error:'curriculum_acknowledgement_required',mensaje:'Confirme que revisó el tema oficial y las palabras antes de crear la sala.'}};
  var rows = _elh191SourceRows_(level, unit);
  var allowed = {};
  rows.forEach(function (row, index) { allowed[_elh191SourceId_(row, index)] = row; });
  var invalid = (items || []).filter(function (item) { return !item.source_item_id || !allowed[item.source_item_id]; });
  if (invalid.length) return {ok:false,response:{ok:false,version:ELHANG191_VERSION,error:'evidencia_curricular_invalida',mensaje:'Cada palabra debe conservar su referencia a la fuente curricular cargada.'}};
  var traced = items.map(function (item) {
    var row = allowed[item.source_item_id];
    var sourceAnswer = _elh191CanonicalAnswer_(row.PAIR_LEFT || row.STEM);
    var sourceClue = _elh191Text_(row.PAIR_RIGHT);
    return {
      item_id:item.item_id,
      answer:item.answer,
      clue:item.clue,
      source_item_id:item.source_item_id,
      source_answer:sourceAnswer,
      source_clue:sourceClue,
      edited:item.answer !== sourceAnswer || item.clue !== sourceClue
    };
  });
  return {ok:true,level:level,unit:unit,curriculum:curriculum,items:traced,source_rows:rows};
}
function _elh191AnswerForIndex_(room, index) {
  var settings = _elh191Settings_(room);
  var items = _elh191ParseItems_(settings.items || []);
  var item = items[Math.max(1, Number(index || room.CURRENT_INDEX || 1) || 1) - 1];
  return item ? item.answer : '';
}
function _elh191ItemForIndex_(room, index) {
  var settings = _elh191Settings_(room);
  var items = _elh191ParseItems_(settings.items || []);
  return items[Math.max(1, Number(index || room.CURRENT_INDEX || 1) || 1) - 1] || null;
}
function _elh191KeepTurn_(turnState, now, durationMs, reason) {
  var next = JSON.parse(JSON.stringify(turnState || {}));
  var duration = Math.max(5000, Number(durationMs || ELHANG191_DEFAULT_TURN_MS) || ELHANG191_DEFAULT_TURN_MS);
  next.turn_number = Math.max(1, Number(next.turn_number || 1) || 1) + 1;
  next.turn_started_at = _elive176Iso_(now);
  next.turn_ends_at = _elive176Iso_(new Date(now.getTime() + duration));
  next.reason = _elh191Text_(reason || 'CORRECT_LETTER');
  return next;
}
function _elh191BuildRound_(room, settings, index, players, now) {
  var items = _elh191ParseItems_(settings.items || []);
  var item = items[index - 1];
  if (!item) throw new Error('No existe la ronda ' + index + '.');
  var duration = Math.max(5000, Number(settings.turn_duration_ms || ELHANG191_DEFAULT_TURN_MS) || ELHANG191_DEFAULT_TURN_MS);
  var mode = _elh191Upper_(room.MODE || settings.mode || 'INDIVIDUAL');
  var policy = mode === 'TEAMS' ? ELIVE176_POLICY_TEAM_ALTERNATING : ELIVE176_POLICY_RANDOM_PLAYER;
  var roomForSeed = JSON.parse(JSON.stringify(room));
  roomForSeed.CURRENT_INDEX = index;
  var turnState = _elive176CreateTurnState_(roomForSeed, players, policy, now, duration);
  var mask = _elh191Mask_(item.answer, []);
  return {
    version:ELHANG191_VERSION,
    game_id:ELHANG191_GAME_CODE,
    round_id:_elh191Text_(room.ROOM_CODE) + '-H' + index,
    index:index,
    total:items.length,
    clue:item.clue,
    display_pattern:mask.display,
    pattern_cells:mask.cells,
    guessed_letters:[],
    wrong_letters:[],
    errors_used:0,
    max_errors:Math.max(3, Math.min(9, Number(settings.max_errors || ELHANG191_DEFAULT_MAX_ERRORS) || ELHANG191_DEFAULT_MAX_ERRORS)),
    phase:'OPEN',
    completed:false,
    won:false,
    turn_state:turnState,
    action_seq:0,
    recent_action_keys:[],
    last_action:null,
    ended_by_teacher:false
  };
}
function _elh191RoundState_(room) {
  var current = _elh191Current_(room);
  return current && current.hangman ? current.hangman : null;
}
function _elh191PublicState_(room, reveal) {
  var state = _elh191RoundState_(room);
  if (!state) return null;
  var output = JSON.parse(JSON.stringify(state));
  delete output.recent_action_keys;
  var mask = _elh191Mask_(_elh191AnswerForIndex_(room, state.index), output.guessed_letters || []);
  output.display_pattern = mask.display;
  output.pattern_cells = mask.cells;
  if (reveal || output.completed === true || _elh191Upper_(room.STATUS) === 'CLOSED') {
    output.answer = _elh191AnswerForIndex_(room, state.index);
  } else {
    delete output.answer;
  }
  return output;
}
function _elh191TurnExpired_(state, now) {
  var end = _elive176Timestamp_(state && state.turn_state && state.turn_state.turn_ends_at);
  return !!end && end <= (now instanceof Date ? now.getTime() : Date.now());
}
function _elh191SaveState_(found, state, patch) {
  var current = {type:'hangman',game_id:ELHANG191_GAME_CODE,index:state.index,hangman:state};
  var changes = {CURRENT_QUESTION_JSON:JSON.stringify(current)};
  Object.keys(patch || {}).forEach(function (key) { changes[key] = patch[key]; });
  var updated = _elive180SetCells_(found, changes);
  _elive180Invalidate_(updated);
  return updated;
}
function _elh191PresenceResponse_(response, room) {
  response = response || {};
  var registered = _elh191PlayerRows_(room);
  var online = _elh191PresenceRows_(room, Date.now());
  response.stats = response.stats || {};
  response.stats.players_registered = registered.length;
  response.stats.players_online = online.length;
  response.stats.players = online.length;
  response.online_players = online.map(_elive180PlayerPublic_);
  response.presence_ttl_seconds = 60;
  return response;
}
function _elh191Snapshot_(room, reveal) {
  var snapshot = _elive180BuildSnapshot_(room);
  var response = _elive180ResponseCopy_(snapshot);
  response.ok = true;
  response.version = ELHANG191_VERSION;
  response.hangman = true;
  response.hangman_state = _elh191PublicState_(room, reveal);
  return _elh191PresenceResponse_(response, room);
}
function _elh191PlayerStateResponse_(room, player, extra) {
  var reveal = _elh191Upper_(room.ROUND_STATUS) === 'CLOSED' || _elh191Upper_(room.STATUS) === 'CLOSED';
  var response = _elh191Snapshot_(room, reveal);
  response.player = _elive180PlayerPublic_(player);
  response.my_rank = (response.leaderboard || []).filter(function (row) {
    return _elh191Text_(row.cod_estudiante) === _elh191Text_(player.COD_ESTUDIANTE);
  })[0] || null;
  var state = response.hangman_state || {};
  response.can_act = _elh191Upper_(room.STATUS) === 'LIVE' && _elh191Upper_(room.ROUND_STATUS) === 'OPEN' &&
    typeof _elive176CanAct_ === 'function' && _elive176CanAct_(state.turn_state, {
      player_id:_elh191Text_(player.COD_ESTUDIANTE),
      team_id:_elh191Text_(player.TEAM) || 'NO_TEAM'
    });
  Object.keys(extra || {}).forEach(function (key) { response[key] = extra[key]; });
  return response;
}
function _elh191AdvanceTimeout_(found, room, authForEvent) {
  var state = _elh191RoundState_(room);
  if (!state || state.completed === true || state.phase !== 'OPEN' || !_elh191TurnExpired_(state, new Date())) return room;
  var settings = _elh191Settings_(room);
  var now = new Date();
  state.turn_state = _elive176NextTurn_(state.turn_state, now, settings.turn_duration_ms || ELHANG191_DEFAULT_TURN_MS, 'TIMEOUT');
  state.action_seq = Math.max(0, Number(state.action_seq || 0) || 0) + 1;
  state.last_action = {type:'TIMEOUT',at:_elive176Iso_(now),points:0};
  var updated = _elh191SaveState_(found, state, {});
  _elive180AppendEvent_(updated, 'HANGMAN_TURN_TIMEOUT', authForEvent || {sesion:{nombre:'SISTEMA'},rol:'system'}, {
    round_index:state.index,turn_number:state.turn_state.turn_number,version:ELHANG191_VERSION
  });
  return updated;
}
function _elh191MaybeAdvanceTimeout_(body) {
  var found = _elh191Find_(body || {});
  if (!found || !found.row || _elh191Upper_(found.row.GAME_CODE) !== ELHANG191_GAME_CODE) return found && found.row;
  var room = found.row;
  if (_elh191Upper_(room.STATUS) !== 'LIVE' || _elh191Upper_(room.ROUND_STATUS) !== 'OPEN') return room;
  var state = _elh191RoundState_(room);
  if (!state || !_elh191TurnExpired_(state, new Date())) return room;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(2500)) return room;
  try {
    var fresh = _elh191Find_(body || {});
    if (!fresh || !fresh.row) return room;
    return _elh191AdvanceTimeout_(fresh, fresh.row, {sesion:{nombre:'SISTEMA'},rol:'system'});
  } finally {
    lock.releaseLock();
  }
}

function englishLabHangmanSuggestionsCS21A191(body) {
  body = body || {};
  _elh191QaGuard_();
  var auth = _eliveAuthTeacher_(body);
  if (!auth || auth.ok !== true) return auth || {ok:false,error:'sesion_invalida'};
  var cod = _elh191Text_(body.cod_grupo || body.codGrupo || body.grupo);
  if (!cod) return {ok:false,error:'cod_grupo requerido'};
  if (!_eliveCanGroup_(auth, cod)) return {ok:false,error:'docente_sin_permiso_grupo'};
  cod = _eliveCanonicalGroupForRoom_(auth, cod);
  var level = _anF65_levelId_(body.nivel || '') || _elh191Upper_(cod.split('-')[0] || 'B1');
  var unit = _elive176NormalizeUnit_(body.unit || body.unidad || '');
  var curriculum = _elh191Curriculum_(level, unit);
  if (!curriculum || unit === 'MIX') return {ok:false,version:ELHANG191_VERSION,error:'unidad_curricular_invalida',mensaje:'Seleccione una unidad U01–U16 activa.'};
  var suggestions = _elh191SuggestedItems_(level, unit, cod + '|' + unit + '|' + level);
  if (suggestions.length < ELHANG191_MIN_ROUNDS) {
    return {ok:false,version:ELHANG191_VERSION,error:'banco_insuficiente',mensaje:'La unidad tiene ' + suggestions.length + ' palabras válidas; Ahorcado requiere al menos ' + ELHANG191_MIN_ROUNDS + '.'};
  }
  return {
    ok:true,version:ELHANG191_VERSION,game_id:ELHANG191_GAME_CODE,
    level:level,unit:unit,curriculum:curriculum,
    source:{curriculum:'CONFIG_UNIDADES',content:'QUESTION_BANK',source_game:'MEMORY_MATCH',traceable:true},
    items:suggestions.slice(0, Math.min(ELHANG191_MAX_ROUNDS, suggestions.length)),
    available_items:suggestions.length,
    round_count_min:ELHANG191_MIN_ROUNDS,round_count_max:Math.min(ELHANG191_MAX_ROUNDS, suggestions.length)
  };
}

function englishLabHangmanCreateRoomCS21A191(body) {
  body = body || {};
  _elh191QaGuard_();
  var auth = _eliveAuthTeacher_(body);
  if (!auth || auth.ok !== true) return auth || {ok:false,error:'sesion_invalida'};
  var cod = _elh191Text_(body.cod_grupo || body.codGrupo || body.grupo);
  if (!cod) return {ok:false,error:'cod_grupo requerido'};
  if (!_eliveCanGroup_(auth, cod)) return {ok:false,error:'docente_sin_permiso_grupo'};
  cod = _eliveCanonicalGroupForRoom_(auth, cod);
  var items = _elh191ParseItems_(body.items || body.words || body.rounds || []);
  var requested = Math.max(ELHANG191_MIN_ROUNDS, Math.min(ELHANG191_MAX_ROUNDS, Number(body.round_count || body.question_count || items.length || ELHANG191_MAX_ROUNDS) || ELHANG191_MAX_ROUNDS));
  if (items.length !== requested) return {ok:false,version:ELHANG191_VERSION,error:'cantidad_palabras_invalida',mensaje:'La sala requiere exactamente ' + requested + ' palabras o frases válidas.'};
  var evidence = _elh191Evidence_(body, items);
  if (!evidence.ok) return evidence.response;
  var mode = _elh191Upper_(body.mode || body.modo || 'INDIVIDUAL');
  if (mode !== 'TEAMS') mode = 'INDIVIDUAL';
  var maxErrors = Math.max(3, Math.min(9, Number(body.max_errors || ELHANG191_DEFAULT_MAX_ERRORS) || ELHANG191_DEFAULT_MAX_ERRORS));
  var turnSeconds = Math.max(8, Math.min(30, Number(body.turn_seconds || 15) || 15));
  var roomSheet = _elive180SheetDirect_(ELIVE_ROOMS_SHEET, ELIVE_ROOMS_HEADERS);
  var now = _eliveIso_();
  var settings = {
    official_grade:false,affects_certificates:false,affects_payments:false,
    unit:evidence.unit,round_count:evidence.items.length,items:evidence.items,
    max_errors:maxErrors,turn_duration_ms:turnSeconds * 1000,
    mode:mode,engine:ELHANG191_GAME_CODE,version:ELHANG191_VERSION,
    curriculum_verified:true,curriculum:evidence.curriculum,
    curriculum_source:'CONFIG_UNIDADES',content_source:'QUESTION_BANK',source_game:'MEMORY_MATCH',
    curriculum_acknowledged:true
  };
  var room = {
    ROOM_ID:'ELIVE-' + Utilities.getUuid(),ROOM_CODE:_eliveRoomCode_(roomSheet),STATUS:'CREATED',
    COD_GRUPO:cod,NIVEL:evidence.level,
    DOCENTE:_elh191Text_(auth.sesion.nombre || auth.sesion.nombre_completo || auth.sesion.usuario || auth.sesion.cedula || 'DOCENTE'),
    GAME_CODE:ELHANG191_GAME_CODE,GAME_LABEL:ELHANG191_GAME_LABEL,QUESTION_COUNT:evidence.items.length,
    MODE:mode,CURRENT_INDEX:0,ROUND_STATUS:'READY',CURRENT_QUESTION_JSON:'',CREATED_AT:now,STARTED_AT:'',CLOSED_AT:'',
    ROUND_STARTED_AT:'',ROUND_CLOSED_AT:'',SETTINGS_JSON:JSON.stringify(settings),UNIT:evidence.unit,
    CONTENT_SOURCE:'CONFIG_UNIDADES|QUESTION_BANK|HANGMAN_CS21A191'
  };
  _elive180AppendObject_(ELIVE_ROOMS_SHEET, ELIVE_ROOMS_HEADERS, room);
  _elive180AppendEvent_(room, 'HANGMAN_ROOM_CREATED', auth, {
    level:evidence.level,unit:evidence.curriculum.unit_id || evidence.unit,rounds:evidence.items.length,mode:mode,max_errors:maxErrors,turn_seconds:turnSeconds,version:ELHANG191_VERSION
  });
  var publicRoom = _elive176PublicRoom_(room);
  publicRoom.unit = evidence.unit;
  return {ok:true,version:ELHANG191_VERSION,room:publicRoom,curriculum:evidence.curriculum,source_verified:true,message:'Sala de Ahorcado creada correctamente.'};
}

function englishLabHangmanStartRoomCS21A191(body) {
  body = body || {};
  _elh191QaGuard_();
  var managed = _elh191Managed_(body);
  if (!managed.ok) return managed.response;
  var room = managed.room;
  if (_elh191Upper_(room.STATUS) === 'LIVE') {
    var existing = _elh191Snapshot_(room, false); existing.already_started = true; return existing;
  }
  if (_elh191Upper_(room.STATUS) !== 'CREATED') return {ok:false,error:'sala_no_disponible_para_inicio'};
  var settings = _elh191Settings_(room);
  var items = _elh191ParseItems_(settings.items || []);
  if (items.length < ELHANG191_MIN_ROUNDS) return {ok:false,error:'palabras_insuficientes'};
  var presentRows = _elh191PresenceRows_(room, Date.now());
  var players = _elh191TurnPlayers_(presentRows);
  if (!players.length) return {ok:false,version:ELHANG191_VERSION,error:'sin_participantes_presentes',mensaje:'No hay estudiantes conectados en los últimos 60 segundos.'};
  if (_elh191Upper_(room.MODE) === 'TEAMS' && players.length < 2) return {ok:false,version:ELHANG191_VERSION,error:'equipos_requieren_dos_participantes',mensaje:'Modo Equipos requiere al menos dos estudiantes conectados.'};
  players = _elive176EnsureTeams_(room, players, {team_size:5});
  var now = new Date();
  var state = _elh191BuildRound_(room, settings, 1, players, now);
  var updated = _elh191SaveState_(managed.found, state, {
    STATUS:'LIVE',STARTED_AT:room.STARTED_AT || _elive176Iso_(now),CURRENT_INDEX:1,ROUND_STATUS:'OPEN',ROUND_STARTED_AT:_elive176Iso_(now),ROUND_CLOSED_AT:''
  });
  _elive180AppendEvent_(updated, 'HANGMAN_STARTED', managed.auth, {round_index:1,players:players.length,mode:room.MODE,version:ELHANG191_VERSION});
  return _elh191Snapshot_(updated, false);
}

function englishLabHangmanGetRoomControlCS21A191(body) {
  body = body || {};
  var managed = _elh191Managed_(body);
  if (!managed.ok) return managed.response;
  var room = _elh191MaybeAdvanceTimeout_(body) || managed.room;
  var response = _elh191Snapshot_(room, _elh191Upper_(room.ROUND_STATUS) === 'CLOSED');
  var settings = _elh191Settings_(room);
  response.curriculum = settings.curriculum || null;
  response.source = {curriculum:settings.curriculum_source || '',content:settings.content_source || '',source_game:settings.source_game || ''};
  response.rules = {max_errors:settings.max_errors || ELHANG191_DEFAULT_MAX_ERRORS,turn_duration_ms:settings.turn_duration_ms || ELHANG191_DEFAULT_TURN_MS,round_count:settings.round_count || room.QUESTION_COUNT};
  if (_elh191Upper_(room.STATUS) === 'CREATED') response.editable_items = _elh191ParseItems_(settings.items || []);
  return response;
}

function englishLabHangmanJoinRoomCS21A191(body) {
  body = body || {};
  var access = _elive180RequireLab_(body);
  if (!access || access.allowed !== true) return access;
  var normalized = _cs21a144LiveBody_(body, access);
  var found = _elh191Find_(normalized);
  if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
  if (_elh191Upper_(found.row.GAME_CODE) !== ELHANG191_GAME_CODE) return {ok:false,error:'sala_no_ahorcado'};
  if (_elh191Upper_(found.row.STATUS) === 'CLOSED') return {ok:false,error:'sala_cerrada'};
  var playerId = _elh191Text_(normalized.player_id || normalized.cod_estudiante);
  var playerName = _elh191Text_(normalized.player_name || normalized.nombre) || playerId;
  if (!playerId) return {ok:false,error:'estudiante_sin_codigo'};
  var table = _elive180Table_(ELIVE_PLAYERS_SHEET, ELIVE_PLAYERS_HEADERS);
  var player = table.rows.filter(function (row) { return _elh191SameRoom_(row, found.row) && _elh191Text_(row.COD_ESTUDIANTE) === playerId; })[0] || null;
  var now = _eliveIso_();
  if (player) {
    player = _elive180SetCells_({sheet:table.sheet,index:table.index,row:player,rowNumber:player._row}, {NOMBRE:playerName,LAST_SEEN_AT:now,STATUS:'ACTIVE'});
  } else {
    player = {ROOM_ID:found.row.ROOM_ID,ROOM_CODE:found.row.ROOM_CODE,COD_ESTUDIANTE:playerId,NOMBRE:playerName,TEAM:_elh191Text_(normalized.team || normalized.equipo),JOINED_AT:now,LAST_SEEN_AT:now,STATUS:'ACTIVE'};
    _elive180AppendObject_(ELIVE_PLAYERS_SHEET, ELIVE_PLAYERS_HEADERS, player);
    _elive180AppendEvent_(found.row, 'PLAYER_JOINED', {sesion:{nombre:playerName},rol:'student'}, {cod_estudiante:playerId,game:ELHANG191_GAME_CODE,version:ELHANG191_VERSION});
  }
  _elive180Invalidate_(found.row);
  return englishLabHangmanGetPlayerStateCS21A191(normalized);
}

function englishLabHangmanGetPlayerStateCS21A191(body) {
  body = body || {};
  var access = _elive180RequireLab_(body);
  if (!access || access.allowed !== true) return access;
  var normalized = _cs21a144LiveBody_(body, access);
  var found = _elh191Find_(normalized);
  if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
  var room = found.row;
  if (_elh191Upper_(room.GAME_CODE) !== ELHANG191_GAME_CODE) return {ok:false,error:'sala_no_ahorcado'};
  room = _elh191MaybeAdvanceTimeout_(normalized) || room;
  var playerId = _elh191Text_(normalized.player_id || normalized.cod_estudiante);
  var player = _elh191Player_(room, playerId);
  if (!player) return {ok:false,error:'jugador_no_registrado'};
  _elive180TouchPlayer_(room, player);
  return _elh191PlayerStateResponse_(room, player, {});
}

function englishLabHangmanActionCS21A191(body) {
  body = body || {};
  var access = _elive180RequireLab_(body);
  if (!access || access.allowed !== true) return access;
  var normalized = _cs21a144LiveBody_(body, access);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return {ok:false,error:'sala_ocupada',mensaje:'La sala está procesando otra jugada.'};
  try {
    var found = _elh191Find_(normalized);
    if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
    var room = found.row;
    if (_elh191Upper_(room.GAME_CODE) !== ELHANG191_GAME_CODE) return {ok:false,error:'sala_no_ahorcado'};
    if (_elh191Upper_(room.STATUS) !== 'LIVE' || _elh191Upper_(room.ROUND_STATUS) !== 'OPEN') return {ok:false,error:'ronda_no_abierta'};
    var state = _elh191RoundState_(room);
    if (!state || state.completed === true) return {ok:false,error:'ronda_completa'};
    var playerId = _elh191Text_(normalized.player_id || normalized.cod_estudiante);
    var player = _elh191Player_(room, playerId);
    if (!player) return {ok:false,error:'jugador_no_registrado'};

    var now = new Date();
    if (_elh191TurnExpired_(state, now)) {
      room = _elh191AdvanceTimeout_(found, room, {sesion:{nombre:'SISTEMA'},rol:'system'});
      player = _elh191Player_(room, playerId) || player;
      return _elh191PlayerStateResponse_(room, player, {accepted:false,timeout:true,message:'El turno terminó; la vida del equipo no se reduce.'});
    }

    var turnPlayer = {player_id:playerId,team_id:_elh191Text_(player.TEAM) || 'NO_TEAM'};
    if (!_elive176CanAct_(state.turn_state, turnPlayer)) return _elh191PlayerStateResponse_(room, player, {accepted:false,out_of_turn:true,message:'Esperá tu turno.'});

    var actionType = _elh191Upper_(normalized.action_type || normalized.action || 'LETTER');
    if (actionType !== 'SOLVE') actionType = 'LETTER';
    var actionKey = _elh191Text_(normalized.action_key || normalized.actionKey || normalized.request_id || normalized.requestId);
    if (!actionKey) actionKey = [room.ROOM_CODE,state.index,playerId,actionType,_elh191Text_(normalized.letter || normalized.value || normalized.solve),_elh191Text_(normalized.client_sent_at || '')].join('|');
    state.recent_action_keys = Array.isArray(state.recent_action_keys) ? state.recent_action_keys : [];
    if (state.recent_action_keys.indexOf(actionKey) >= 0) return _elh191PlayerStateResponse_(room, player, {accepted:false,duplicate:true,message:'Esta jugada ya fue procesada.'});

    var settings = _elh191Settings_(room);
    var answer = _elh191AnswerForIndex_(room, state.index);
    var maxErrors = Math.max(3, Math.min(9, Number(state.max_errors || settings.max_errors || ELHANG191_DEFAULT_MAX_ERRORS) || ELHANG191_DEFAULT_MAX_ERRORS));
    var duration = Math.max(5000, Number(settings.turn_duration_ms || ELHANG191_DEFAULT_TURN_MS) || ELHANG191_DEFAULT_TURN_MS);
    var correct = false;
    var repeated = false;
    var points = 0;
    var answerValue = {};

    state.guessed_letters = _elh191NormalizeLetters_(state.guessed_letters || []);
    state.wrong_letters = _elh191NormalizeLetters_(state.wrong_letters || []);

    if (actionType === 'LETTER') {
      var letter = _elh191Upper_(normalized.letter || normalized.value || normalized.answer_value);
      if (!_elh191IsLetter_(letter)) return _elh191PlayerStateResponse_(room, player, {accepted:false,error:'letra_invalida',message:'Elegí una letra de A a Z.'});
      if (state.guessed_letters.indexOf(letter) >= 0) {
        repeated = true;
        return _elh191PlayerStateResponse_(room, player, {accepted:false,repeated:true,message:'La letra ' + letter + ' ya fue utilizada; no pierde vida.'});
      }
      state.guessed_letters.push(letter);
      var occurrences = _elh191Occurrences_(answer, letter);
      correct = occurrences > 0;
      points = correct ? occurrences * 10 : 0;
      answerValue = {action_type:'LETTER',letter:letter,occurrences:occurrences};
      if (!correct) {
        state.wrong_letters.push(letter);
        state.errors_used = Math.max(0, Number(state.errors_used || 0) || 0) + 1;
      }
    } else {
      var solve = _elh191CanonicalAnswer_(normalized.solve || normalized.value || normalized.answer_value);
      if (!solve) return _elh191PlayerStateResponse_(room, player, {accepted:false,error:'solucion_vacia',message:'Escribí una solución antes de enviar.'});
      correct = solve === answer;
      points = correct ? _elh191ScoreSolve_(maxErrors, state.errors_used) : 0;
      answerValue = {action_type:'SOLVE',solve:solve};
      if (!correct) state.errors_used = Math.max(0, Number(state.errors_used || 0) || 0) + 1;
    }

    var solved = correct && (actionType === 'SOLVE' || _elh191SolvedByLetters_(answer, state.guessed_letters));
    var lost = Number(state.errors_used || 0) >= maxErrors;
    state.max_errors = maxErrors;
    state.action_seq = Math.max(0, Number(state.action_seq || 0) || 0) + 1;
    state.recent_action_keys.push(actionKey);
    state.recent_action_keys = state.recent_action_keys.slice(-20);
    state.last_action = {type:actionType,player_id:playerId,team:_elh191Text_(player.TEAM),correct:correct,points:points,at:_elive176Iso_(now)};

    var closePatch = {};
    if (solved || lost) {
      state.completed = true;
      state.won = !!solved;
      state.phase = 'COMPLETE';
      closePatch.ROUND_STATUS = 'CLOSED';
      closePatch.ROUND_CLOSED_AT = _elive176Iso_(now);
    } else if (correct) {
      state.turn_state = _elh191KeepTurn_(state.turn_state, now, duration, actionType === 'SOLVE' ? 'SOLVE_CORRECT' : 'CORRECT_LETTER');
    } else {
      state.turn_state = _elive176NextTurn_(state.turn_state, now, duration, actionType === 'SOLVE' ? 'WRONG_SOLVE' : 'WRONG_LETTER');
    }

    var updated = _elh191SaveState_(found, state, closePatch);
    var answerRow = {
      ROOM_ID:updated.ROOM_ID,ROOM_CODE:updated.ROOM_CODE,QUESTION_INDEX:state.index,COD_ESTUDIANTE:playerId,
      ANSWER_VALUE:JSON.stringify(answerValue),IS_CORRECT:correct ? 'TRUE' : 'FALSE',POINTS:points,
      TIME_MS:Math.max(0, Number(normalized.time_ms || 0) || 0),ANSWERED_AT:_eliveIso_()
    };
    _elive180AppendObject_(ELIVE_ANSWERS_SHEET, ELIVE_ANSWERS_HEADERS, answerRow);
    _elive180AppendEvent_(updated, actionType === 'SOLVE' ? 'HANGMAN_SOLVE' : 'HANGMAN_LETTER', {sesion:{nombre:_elh191Text_(player.NOMBRE)},rol:'student'}, {
      cod_estudiante:playerId,round_index:state.index,correct:correct,points:points,errors_used:state.errors_used,completed:state.completed,won:state.won,version:ELHANG191_VERSION
    });
    player = _elh191Player_(updated, playerId) || player;
    return _elh191PlayerStateResponse_(updated, player, {accepted:true,correct:correct,repeated:repeated,points:points,completed:state.completed,won:state.won});
  } finally {
    lock.releaseLock();
  }
}

function englishLabHangmanCloseRoundCS21A191(body) {
  var managed = _elh191Managed_(body || {});
  if (!managed.ok) return managed.response;
  var room = managed.room;
  if (_elh191Upper_(room.STATUS) !== 'LIVE' || _elh191Upper_(room.ROUND_STATUS) !== 'OPEN') return {ok:false,error:'ronda_no_abierta'};
  var state = _elh191RoundState_(room);
  if (!state) return {ok:false,error:'estado_ahorcado_ausente'};
  var now = new Date();
  state.completed = true; state.won = false; state.phase = 'COMPLETE'; state.ended_by_teacher = true;
  var updated = _elh191SaveState_(managed.found, state, {ROUND_STATUS:'CLOSED',ROUND_CLOSED_AT:_elive176Iso_(now)});
  _elive180AppendEvent_(updated, 'HANGMAN_ROUND_CLOSED', managed.auth, {round_index:state.index,reason:'TEACHER',version:ELHANG191_VERSION});
  return _elh191Snapshot_(updated, true);
}

function englishLabHangmanNextRoundCS21A191(body) {
  var managed = _elh191Managed_(body || {});
  if (!managed.ok) return managed.response;
  var room = managed.room;
  if (_elh191Upper_(room.STATUS) !== 'LIVE') return {ok:false,error:'sala_no_activa'};
  if (_elh191Upper_(room.ROUND_STATUS) !== 'CLOSED') return {ok:false,error:'ronda_actual_no_cerrada',mensaje:'Termine o cierre la ronda actual antes de continuar.'};
  var settings = _elh191Settings_(room);
  var items = _elh191ParseItems_(settings.items || []);
  var currentIndex = Math.max(1, Number(room.CURRENT_INDEX || 1) || 1);
  if (currentIndex >= items.length) return {ok:false,version:ELHANG191_VERSION,error:'sin_mas_rondas',complete:true,mensaje:'Ya se jugaron todas las palabras. Cierre la sala para ver el resultado final.'};
  var presentRows = _elh191PresenceRows_(room, Date.now());
  var players = _elh191TurnPlayers_(presentRows);
  if (!players.length) return {ok:false,error:'sin_participantes_presentes'};
  if (_elh191Upper_(room.MODE) === 'TEAMS' && players.length < 2) return {ok:false,error:'equipos_requieren_dos_participantes'};
  players = _elive176EnsureTeams_(room, players, {team_size:5});
  var nextIndex = currentIndex + 1;
  var now = new Date();
  var state = _elh191BuildRound_(room, settings, nextIndex, players, now);
  var updated = _elh191SaveState_(managed.found, state, {CURRENT_INDEX:nextIndex,ROUND_STATUS:'OPEN',ROUND_STARTED_AT:_elive176Iso_(now),ROUND_CLOSED_AT:''});
  _elive180AppendEvent_(updated, 'HANGMAN_NEXT_ROUND', managed.auth, {round_index:nextIndex,players:players.length,version:ELHANG191_VERSION});
  return _elh191Snapshot_(updated, false);
}

function englishLabHangmanCloseRoomCS21A191(body) {
  var managed = _elh191Managed_(body || {});
  if (!managed.ok) return managed.response;
  var response = englishLabLiveCloseRoom(body || {});
  if (response && response.ok === true) {
    response.version = ELHANG191_VERSION;
    response.hangman = true;
  }
  return response;
}

var _elh191VerifyBase_ = verificarActualizacionQA;
verificarActualizacionQA = function () {
  var previous = _elh191VerifyBase_();
  var answer = "CHECK IN";
  var mask0 = _elh191Mask_(answer, []);
  var maskC = _elh191Mask_(answer, ['C']);
  var source = _elh191SourceRows_('B1', 'U01');
  var curriculum = _elh191Curriculum_('B1', 'U01');
  var valid = !!(
    previous && previous.ok === true &&
    mask0.display.indexOf('C') < 0 && maskC.display.indexOf('C') >= 0 &&
    _elh191Occurrences_('BOOK', 'O') === 2 &&
    _elh191SolvedByLetters_('A-A', ['A']) === true &&
    _elh191ScoreSolve_(6, 2) === 140 &&
    source.length >= ELHANG191_MIN_ROUNDS && curriculum
  );
  var result = {
    ok:valid,version:ELHANG191_VERSION,previous_version:previous && previous.version,
    hangman_live_supported:true,server_authoritative_answer_hidden:true,
    generic_game_registry_ready:true,curriculum_guard:true,curriculum_source:'CONFIG_UNIDADES',
    content_source:'QUESTION_BANK',source_game:'MEMORY_MATCH',b1_u01_source_items:source.length,
    round_count_limits:'3-5',max_errors_default:ELHANG191_DEFAULT_MAX_ERRORS,turn_seconds_default:15,
    repeated_letter_no_penalty:true,timeout_no_life_penalty:true,
    correct_letter_keeps_turn:true,wrong_letter_rotates_turn:true,
    solve_bonus:'100 + 10 * vidas_restantes',individual_and_teams:true
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A191 Ahorcado no superó la verificación aditiva.');
  return result;
};
function verificarHangmanCS21A191() {
  _elh191QaGuard_();
  return verificarActualizacionQA();
}

var _elh191DoPostBase_ = doPost;
doPost = function (e) {
  try {
    var body = {};
    try { body = _an4406_parseBody_(e) || {}; } catch (_) { body = {}; }
    var fn = _elh191Text_((e && e.parameter && e.parameter.fn) || body.fn).toLowerCase();
    if (fn === 'englishlabhangmansuggestions') return _an4406_json_(englishLabHangmanSuggestionsCS21A191(body));
    if (fn === 'englishlabhangmancreateroom') return _an4406_json_(englishLabHangmanCreateRoomCS21A191(body));
    if (fn === 'englishlabhangmanstartroom') return _an4406_json_(englishLabHangmanStartRoomCS21A191(body));
    if (fn === 'englishlabhangmangetroomcontrol') return _an4406_json_(englishLabHangmanGetRoomControlCS21A191(body));
    if (fn === 'englishlabhangmanjoinroom') return _an4406_json_(englishLabHangmanJoinRoomCS21A191(body));
    if (fn === 'englishlabhangmangetplayerstate') return _an4406_json_(englishLabHangmanGetPlayerStateCS21A191(body));
    if (fn === 'englishlabhangmanaction') return _an4406_json_(englishLabHangmanActionCS21A191(body));
    if (fn === 'englishlabhangmancloseround') return _an4406_json_(englishLabHangmanCloseRoundCS21A191(body));
    if (fn === 'englishlabhangmannextround') return _an4406_json_(englishLabHangmanNextRoundCS21A191(body));
    if (fn === 'englishlabhangmancloseroom') return _an4406_json_(englishLabHangmanCloseRoomCS21A191(body));
    if (fn === 'englishlablivejoinroom' && _elh191IsRoom_(body)) return _an4406_json_(englishLabHangmanJoinRoomCS21A191(body));
    if (fn === 'englishlablivegetplayerstate' && _elh191IsRoom_(body)) return _an4406_json_(englishLabHangmanGetPlayerStateCS21A191(body));
    if (fn === 'verificarhangmancs21a191') return _an4406_json_(verificarHangmanCS21A191());
    if (fn === 'verificaractualizacionqa') return _an4406_json_(verificarActualizacionQA());
    return _elh191DoPostBase_(e);
  } catch (error) {
    return _an4406_json_({ok:false,version:ELHANG191_VERSION,error:'hangman_error',mensaje:String(error && error.message ? error.message : error)});
  }
};
