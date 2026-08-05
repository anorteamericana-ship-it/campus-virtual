// CS21A176 · ACTUALIZACION QA REUTILIZABLE
// Sustituye por completo el contenido temporal de 97_ACTUALIZACION_QA.gs.
// No contiene preguntas ni vocabulario. No usar en producción.

var ELIVE176_VERSION = 'CS21A176';
var ELIVE176_UPDATE_OBJECTIVE = 'Turnos compartidos, equipos balanceados, tablero sincronizado y acceso estudiante Memory Match';
var ELIVE176_POLICY_EVERYONE = 'EVERYONE';
var ELIVE176_POLICY_RANDOM_PLAYER = 'RANDOM_PLAYER';
var ELIVE176_POLICY_TEAM_ALTERNATING = 'TEAM_ALTERNATING';

function _elive176Text_(value) {
  return String(value == null ? '' : value).trim();
}
function _elive176Upper_(value) {
  return _elive176Text_(value).toUpperCase();
}
function _elive176Iso_(value) {
  return (value instanceof Date ? value : new Date()).toISOString();
}
function _elive176Json_(value, fallback) {
  try { return value ? JSON.parse(_elive176Text_(value)) : (fallback || {}); }
  catch (_) { return fallback || {}; }
}
function _elive176Timestamp_(value) {
  if (value instanceof Date) return value.getTime();
  var parsed = Date.parse(_elive176Text_(value));
  return isFinite(parsed) ? parsed : 0;
}
function _elive176NormalizeUnit_(value) {
  var text = _elive176Upper_(value || 'MIX').replace(/[\s_-]+/g, '');
  if (!text || text === 'MIX' || text === 'MIXTO' || text === 'MIXED') return 'MIX';
  var match = text.match(/^(?:U|UNIT|UNIDAD)?0*(\d{1,2})$/);
  if (!match) return _elive176Upper_(value || 'MIX');
  var number = Math.max(1, Math.min(99, Number(match[1]) || 1));
  return 'U' + (number < 10 ? '0' : '') + number;
}
function _elive176Rows_(sheetName) {
  var cache = CacheService.getScriptCache();
  var dbId = _elmm174DbId_();
  var key = 'ELIVE176|' + dbId + '|' + _elive176Upper_(sheetName);
  var cached = cache.get(key);
  if (cached) {
    try { return JSON.parse(cached); } catch (_) {}
  }
  var sh = _elmm174Db_().getSheetByName(sheetName);
  if (!sh) throw new Error('Falta la hoja ' + sheetName + '.');
  var lastRow = sh.getLastRow();
  var lastColumn = sh.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) return [];
  var values = sh.getRange(1, 1, lastRow, lastColumn).getDisplayValues();
  var headers = values[0].map(function (header) { return _elive176Upper_(header); });
  var rows = values.slice(1).filter(function (row) {
    return row.some(function (cell) { return _elive176Text_(cell); });
  }).map(function (row) {
    var out = {};
    headers.forEach(function (header, index) { out[header] = row[index]; });
    return out;
  });
  try { cache.put(key, JSON.stringify(rows), 300); } catch (_) {}
  return rows;
}
function _elive176PairRows_(level, unit) {
  var wantedLevel = _elive176Upper_(level || 'B1');
  var wantedUnit = _elive176NormalizeUnit_(unit || 'MIX');
  return _elive176Rows_('QUESTION_BANK').filter(function (row) {
    var rowUnit = _elive176NormalizeUnit_(row.UNIT_ID || 'MIX');
    return _elive176Upper_(row.GAME_ID) === ELMM174_GAME_CODE &&
      _elive176Upper_(row.STATUS) === 'ACTIVE' &&
      (_elive176Upper_(row.LEVEL_ID) === wantedLevel || _elive176Upper_(row.LEVEL_ID) === 'ALL') &&
      (wantedUnit === 'MIX' || rowUnit === wantedUnit || rowUnit === 'MIX') &&
      _elive176Text_(row.PAIR_LEFT || row.STEM) && _elive176Text_(row.PAIR_RIGHT);
  });
}
function _elive176Cards_(room, pairCount) {
  var settings = _elmm174Settings_(room);
  var level = _elive176Upper_(room.NIVEL || settings.level || 'B1');
  var unit = _elive176NormalizeUnit_(settings.unit || 'MIX');
  var count = Math.max(3, Math.min(12, Number(pairCount || settings.pair_count || 6) || 6));
  var rows = _elmm174Shuffle_(_elive176PairRows_(level, unit), room.ROOM_CODE + '|' + unit + '|' + level).slice(0, count);
  if (rows.length < count) {
    throw new Error('Banco insuficiente para ' + level + '/' + unit + ': ' + rows.length + ' pares; se requieren ' + count + '.');
  }
  var cards = [];
  rows.forEach(function (row, index) {
    var pairId = _elive176Text_(row.CONTENT_ID) || ('PAIR-' + (index + 1));
    cards.push({card_id:pairId + '-L',pair_id:pairId,face_type:'TEXT',label:_elive176Text_(row.PAIR_LEFT || row.STEM),media_id:_elive176Text_(row.MEDIA_ID)});
    cards.push({card_id:pairId + '-R',pair_id:pairId,face_type:'TEXT',label:_elive176Text_(row.PAIR_RIGHT),media_id:''});
  });
  return _elmm174Shuffle_(cards, room.ROOM_CODE + '|CARDS');
}
function _elive176Hash_(text) {
  var value = _elive176Text_(text);
  var hash = 2166136261;
  for (var index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function _elive176Shuffle_(values, seedText) {
  var output = values.slice();
  var seed = _elive176Hash_(seedText) || 1;
  function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (var index = output.length - 1; index > 0; index -= 1) {
    var target = Math.floor(random() * (index + 1));
    var temp = output[index];
    output[index] = output[target];
    output[target] = temp;
  }
  return output;
}
function _elive176PlayerTable_() {
  var sh = _eliveSheet_(ELIVE_PLAYERS_SHEET, ELIVE_PLAYERS_HEADERS);
  var values = sh.getDataRange().getDisplayValues();
  var headers = values.length ? values[0] : ELIVE_PLAYERS_HEADERS.slice();
  var index = {};
  headers.forEach(function (header, position) { index[_elive176Upper_(header)] = position; });
  return {sheet:sh,values:values,headers:headers,index:index};
}
function _elive176PlayerRows_(room) {
  var table = _elive176PlayerTable_();
  if (table.values.length < 2) return [];
  return table.values.slice(1).map(function (row, offset) {
    if (_elive176Text_(row[table.index.ROOM_CODE]) !== _elive176Text_(room.ROOM_CODE)) return null;
    var playerId = _elive176Text_(row[table.index.COD_ESTUDIANTE] || row[table.index.PLAYER_ID]);
    return {player_id:playerId,name:_elive176Text_(row[table.index.NOMBRE]) || playerId,team_id:_elive176Text_(row[table.index.TEAM]) || 'NO_TEAM',joined_at:_elive176Text_(row[table.index.JOINED_AT] || row[table.index.CREATED_AT]),row_number:offset + 2};
  }).filter(function (player) { return player && player.player_id; });
}
function _elive176TeamPlan_(players, roomCode, teamSize) {
  var ordered = _elive176Shuffle_(players, _elive176Text_(roomCode) + '|TEAM-ASSIGNMENT');
  var size = Math.max(1, Number(teamSize || 5) || 5);
  var teamCount = ordered.length <= 1 ? 1 : Math.max(2, Math.ceil(ordered.length / size));
  teamCount = Math.min(Math.max(1, ordered.length), teamCount);
  var names = ['Equipo Azul','Equipo Rojo','Equipo Verde','Equipo Dorado','Equipo Morado','Equipo Naranja'];
  var assignments = {};
  ordered.forEach(function (player, index) {
    assignments[player.player_id] = names[index % teamCount] || ('Equipo ' + ((index % teamCount) + 1));
  });
  return assignments;
}
function _elive176EnsureTeams_(room, players, rules) {
  if (_elive176Upper_(room.MODE) !== 'TEAMS' || !players.length) return players;
  var explicit = players.filter(function (player) { return player.team_id && player.team_id !== 'NO_TEAM'; });
  var explicitTeams = {};
  explicit.forEach(function (player) { explicitTeams[player.team_id] = true; });
  if (explicit.length === players.length && (players.length === 1 || Object.keys(explicitTeams).length >= 2)) return players;
  var assignments = _elive176TeamPlan_(players, room.ROOM_CODE, rules && rules.team_size);
  var table = _elive176PlayerTable_();
  var teamColumn = Number(table.index.TEAM);
  if (!isFinite(teamColumn)) throw new Error('La hoja de jugadores no tiene columna TEAM.');
  players.forEach(function (player) {
    var team = assignments[player.player_id] || 'Equipo Azul';
    table.sheet.getRange(player.row_number, teamColumn + 1).setValue(team);
    player.team_id = team;
  });
  return players;
}
function _elive176GroupTeams_(players) {
  var grouped = {};
  players.forEach(function (player) {
    var teamId = _elive176Text_(player.team_id) || 'NO_TEAM';
    if (!grouped[teamId]) grouped[teamId] = [];
    grouped[teamId].push(player);
  });
  return Object.keys(grouped).map(function (teamId) { return {team_id:teamId,name:teamId === 'NO_TEAM' ? 'Sin equipo' : teamId,members:grouped[teamId]}; });
}
function _elive176ActiveForTeam_(turnState, teamId) {
  var order = turnState.team_player_orders[teamId] || [];
  if (!order.length) return '';
  var cursor = Number((turnState.team_player_cursors || {})[teamId] || 0) || 0;
  return order[Math.max(0, cursor) % order.length] || '';
}
function _elive176CreateTurnState_(room, players, policy, startAt, durationMs) {
  var seed = _elive176Text_(room.ROOM_CODE) + '|R' + (Number(room.CURRENT_INDEX || 1) || 1);
  var playerOrder = _elive176Shuffle_(players.map(function (player) { return player.player_id; }), seed + '|PLAYERS');
  var state = {version:ELIVE176_VERSION,participation_policy:policy,player_order:playerOrder,player_cursor:0,team_order:[],team_cursor:0,team_player_orders:{},team_player_cursors:{},active_player_id:'',active_team_id:'',turn_number:1,turn_started_at:_elive176Iso_(startAt),turn_ends_at:_elive176Iso_(new Date(startAt.getTime() + Math.max(5000, Number(durationMs || 30000) || 30000))),last_player_id:'',last_team_id:'',reason:'ROUND_STARTED'};
  if (policy === ELIVE176_POLICY_EVERYONE) return state;
  if (policy === ELIVE176_POLICY_TEAM_ALTERNATING) {
    var teams = _elive176GroupTeams_(players).filter(function (team) { return team.team_id !== 'NO_TEAM'; });
    state.team_order = _elive176Shuffle_(teams.map(function (team) { return team.team_id; }), seed + '|TEAMS');
    teams.forEach(function (team) {
      state.team_player_orders[team.team_id] = _elive176Shuffle_(team.members.map(function (member) { return member.player_id; }), seed + '|TEAM|' + team.team_id);
      state.team_player_cursors[team.team_id] = 0;
    });
    state.active_team_id = state.team_order[0] || '';
    state.active_player_id = _elive176ActiveForTeam_(state, state.active_team_id);
    return state;
  }
  state.active_player_id = state.player_order[0] || '';
  return state;
}
function _elive176NextTurn_(turnState, now, durationMs, reason) {
  var current = turnState || {};
  var next = JSON.parse(JSON.stringify(current));
  next.turn_number = Math.max(1, Number(current.turn_number || 1) || 1) + 1;
  next.turn_started_at = _elive176Iso_(now);
  next.turn_ends_at = _elive176Iso_(new Date(now.getTime() + Math.max(5000, Number(durationMs || 30000) || 30000)));
  next.last_player_id = _elive176Text_(current.active_player_id);
  next.last_team_id = _elive176Text_(current.active_team_id);
  next.reason = _elive176Text_(reason || 'ACTION_COMPLETED');
  if (current.participation_policy === ELIVE176_POLICY_EVERYONE) {
    next.active_player_id = '';
    next.active_team_id = '';
    return next;
  }
  if (current.participation_policy === ELIVE176_POLICY_TEAM_ALTERNATING) {
    if (!current.team_order || !current.team_order.length) return next;
    var previousTeam = _elive176Text_(current.active_team_id || current.team_order[current.team_cursor || 0]);
    var previousMembers = (current.team_player_orders || {})[previousTeam] || [];
    next.team_player_cursors = next.team_player_cursors || {};
    if (previousMembers.length) next.team_player_cursors[previousTeam] = (Number(next.team_player_cursors[previousTeam] || 0) + 1) % previousMembers.length;
    next.team_cursor = (Number(current.team_cursor || 0) + 1) % current.team_order.length;
    next.active_team_id = current.team_order[next.team_cursor] || '';
    next.active_player_id = _elive176ActiveForTeam_(next, next.active_team_id);
    return next;
  }
  if (!current.player_order || !current.player_order.length) return next;
  next.player_cursor = (Number(current.player_cursor || 0) + 1) % current.player_order.length;
  next.active_player_id = current.player_order[next.player_cursor] || '';
  next.active_team_id = '';
  return next;
}
function _elive176CanAct_(turnState, player) {
  if (!turnState || !player) return false;
  if (turnState.participation_policy === ELIVE176_POLICY_EVERYONE) return true;
  if (_elive176Text_(turnState.active_player_id) !== _elive176Text_(player.player_id)) return false;
  if (turnState.participation_policy === ELIVE176_POLICY_TEAM_ALTERNATING) return !_elive176Text_(turnState.active_team_id) || _elive176Text_(turnState.active_team_id) === _elive176Text_(player.team_id);
  return true;
}
function _elive176DescribeTurn_(turnState, players) {
  var byId = {};
  players.forEach(function (player) { byId[player.player_id] = player; });
  var nextPlayerId = '';
  if (turnState.participation_policy === ELIVE176_POLICY_TEAM_ALTERNATING && turnState.team_order.length) {
    var nextTeamCursor = (Number(turnState.team_cursor || 0) + 1) % turnState.team_order.length;
    var nextTeamId = turnState.team_order[nextTeamCursor] || '';
    nextPlayerId = _elive176ActiveForTeam_(turnState, nextTeamId);
  } else if (turnState.player_order && turnState.player_order.length) {
    nextPlayerId = turnState.player_order[(Number(turnState.player_cursor || 0) + 1) % turnState.player_order.length] || '';
  }
  return {active_player:byId[turnState.active_player_id] || null,next_player:byId[nextPlayerId] || null,active_team_id:_elive176Text_(turnState.active_team_id),turn_number:Number(turnState.turn_number || 1) || 1,participation_policy:_elive176Text_(turnState.participation_policy)};
}
function _elive176FindRoom_(body, publicRoom) {
  var id = body && (body.room_id || body.roomId || body.room_code || body.roomCode || body.codigo);
  if (!id && publicRoom) id = publicRoom.room_id || publicRoom.ROOM_ID || publicRoom.room_code || publicRoom.ROOM_CODE;
  return id ? _eliveFindRoom_(id) : null;
}
function _elive176IsMemoryRoom_(body) {
  var found = _elive176FindRoom_(body || {}, null);
  return !!(found && found.row && _elive176Upper_(found.row.GAME_CODE) === ELMM174_GAME_CODE);
}
function _elive176Current_(room) {
  return _elive176Json_(room && room.CURRENT_QUESTION_JSON, {});
}
function _elive176Package_(room) {
  var current = _elive176Current_(room);
  return current && current.room_package ? current.room_package : null;
}
function _elive176SavePackage_(found, current, pkg, patch) {
  current.room_package = pkg;
  var values = patch || {};
  values.CURRENT_QUESTION_JSON = JSON.stringify(current);
  return _eliveSetCells_(found, values);
}
function _elive176PublicRoom_(room) {
  var out = _eliveRoomPublic_(room) || {};
  out.game_code = _elive176Upper_(room.GAME_CODE || out.game_code || out.GAME_CODE);
  out.game_id = out.game_code;
  out.game_label = _elive176Text_(room.GAME_LABEL || out.game_label || out.GAME_LABEL);
  return out;
}
function _elive176MaybeAdvanceTurn_(found, lockAlreadyHeld) {
  if (!found || !found.row) return null;
  var lock = null;
  if (!lockAlreadyHeld) {
    lock = LockService.getScriptLock();
    if (!lock.tryLock(2500)) return found.row;
  }
  try {
    if (!lockAlreadyHeld) {
      var refreshed = _eliveFindRoom_(found.row.ROOM_ID || found.row.ROOM_CODE);
      if (refreshed && refreshed.row) found = refreshed;
    }
    var room = found.row;
    var current = _elive176Current_(room);
    var pkg = current.room_package || null;
    if (!pkg || !pkg.state || !pkg.turn_state) return room;
    if (pkg.shared_state && pkg.shared_state.completed === true) return room;
    if (_elive176Upper_(pkg.state.phase) === 'COMPLETE') return room;
    var now = new Date();
    var nowMs = now.getTime();
    var startedMs = _elive176Timestamp_(pkg.turn_state.turn_started_at || pkg.state.started_at);
    var endsMs = _elive176Timestamp_(pkg.turn_state.turn_ends_at || pkg.state.ends_at);
    var changed = false;
    var timeoutAdvanced = false;
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
      timeoutAdvanced = true;
    }
    if (!changed) return room;
    var updated = _elive176SavePackage_(found, current, pkg, {});
    if (timeoutAdvanced) _eliveAppendEvent_(updated, 'LIVE_TURN_TIMEOUT', {sesion:{nombre:'SISTEMA'},rol:'system'}, {active_player_id:pkg.turn_state.active_player_id,active_team_id:pkg.turn_state.active_team_id,turn_number:pkg.turn_state.turn_number,version:ELIVE176_VERSION});
    return updated;
  } finally {
    if (lock) lock.releaseLock();
  }
}
function englishLabMemoryMatchCreateRoomCS21A176(body) {
  body = body || {};
  var normalized = {};
  Object.keys(body).forEach(function (key) { normalized[key] = body[key]; });
  var unit = _elive176NormalizeUnit_(body.unit || body.unidad || 'MIX');
  normalized.unit = unit;
  normalized.unidad = unit;
  var result = englishLabMemoryMatchCreateRoom(normalized);
  if (result && result.ok === true) { result.version = ELIVE176_VERSION; result.update_objective = ELIVE176_UPDATE_OBJECTIVE; }
  return result;
}
function englishLabMemoryMatchStartRoomCS21A176(body) {
  body = body || {};
  var managed = _elmm174FindManagedRoom_(body);
  if (!managed.ok) return managed.response;
  var room = managed.room;
  if (_elive176Upper_(room.GAME_CODE) !== ELMM174_GAME_CODE) return {ok:false,error:'sala_no_memory_match'};
  if (_elive176Upper_(room.STATUS) === 'CLOSED') return {ok:false,error:'sala_cerrada'};
  var rules = _elmm174Rules_(room.NIVEL, room.MODE);
  var players = _elive176PlayerRows_(room);
  if (!players.length) return {ok:false,error:'sin_participantes',mensaje:'Debe ingresar al menos un estudiante antes de iniciar.'};
  players = _elive176EnsureTeams_(room, players, rules);
  var settings = _elmm174Settings_(room);
  settings.unit = _elive176NormalizeUnit_(settings.unit || 'MIX');
  var cards = _elive176Cards_(room, settings.pair_count);
  var now = new Date();
  var pkg = _elmm174Package_(room, cards, rules, now);
  var startAt = new Date(pkg.state.started_at || now);
  var durationMs = Number(rules.round_duration_ms || 30000) || 30000;
  var policy = _elive176Upper_(room.MODE) === 'TEAMS' ? ELIVE176_POLICY_TEAM_ALTERNATING : ELIVE176_POLICY_RANDOM_PLAYER;
  var turnState = _elive176CreateTurnState_(room, players, policy, startAt, durationMs);
  var sharedState = {version:ELIVE176_VERSION,board_version:1,matched_pair_ids:[],completed:false,last_action_key:''};
  pkg.version = ELIVE176_VERSION;
  pkg.turn_state = turnState;
  pkg.shared_state = sharedState;
  pkg.players = players;
  pkg.state.active_player_id = turnState.active_player_id;
  pkg.state.active_team_id = turnState.active_team_id;
  pkg.state.started_at = turnState.turn_started_at;
  pkg.state.ends_at = turnState.turn_ends_at;
  var current = {type:'memory_match',game_id:ELMM174_GAME_CODE,index:1,room_package:pkg};
  var row = _eliveSetCells_(managed.found, {STATUS:'LIVE',STARTED_AT:room.STARTED_AT || _elive176Iso_(now),CURRENT_INDEX:1,ROUND_STATUS:'OPEN',ROUND_STARTED_AT:_elive176Iso_(now),ROUND_CLOSED_AT:'',SETTINGS_JSON:JSON.stringify(settings),CURRENT_QUESTION_JSON:JSON.stringify(current)});
  _eliveAppendEvent_(row, 'MEMORY_MATCH_STARTED', managed.auth, {cards:cards.length,pairs:cards.length / 2,participation_policy:policy,active_player_id:turnState.active_player_id,active_team_id:turnState.active_team_id,teams:_elive176GroupTeams_(players).map(function (team) { return team.team_id; }),version:ELIVE176_VERSION});
  return {ok:true,version:ELIVE176_VERSION,room:_elive176PublicRoom_(row),room_package:pkg,turn_description:_elive176DescribeTurn_(turnState, players)};
}
function englishLabMemoryMatchGetPlayerStateCS21A176(body) {
  body = body || {};
  var base = englishLabLiveGetPlayerState(body);
  if (!base || base.ok !== true) return base;
  var found = _elive176FindRoom_(body, base.room);
  if (!found || !found.row || _elive176Upper_(found.row.GAME_CODE) !== ELMM174_GAME_CODE) return base;
  var room = _elive176MaybeAdvanceTurn_(found, false) || found.row;
  var pkg = _elive176Package_(room);
  var players = _elive176PlayerRows_(room);
  if (pkg) {
    pkg.server_now = _elive176Iso_(new Date());
    pkg.players = players;
    pkg.teams = _elmm174Teams_(room);
    pkg.player = base.player || null;
  }
  var currentPlayerId = _elive176Text_(base.player && (base.player.cod_estudiante || base.player.player_id));
  var currentPlayer = players.filter(function (player) { return player.player_id === currentPlayerId; })[0] || null;
  var turnState = pkg && pkg.turn_state || null;
  base.version = ELIVE176_VERSION;
  base.memory_match = true;
  base.room = _elive176PublicRoom_(room);
  base.room_package = pkg;
  base.turn_state = turnState;
  base.shared_state = pkg && pkg.shared_state || null;
  base.turn_description = turnState ? _elive176DescribeTurn_(turnState, players) : null;
  base.can_answer = !!(pkg && pkg.state && _elive176Upper_(pkg.state.phase) === 'OPEN' && _elive176CanAct_(turnState, currentPlayer));
  return base;
}
function englishLabMemoryMatchGetRoomControlCS21A176(body) {
  body = body || {};
  var managed = _elmm174FindManagedRoom_(body);
  if (!managed.ok) return managed.response;
  var base = englishLabLiveGetRoomControl(body);
  if (!base || base.ok !== true) return base;
  if (_elive176Upper_(managed.room.GAME_CODE) !== ELMM174_GAME_CODE) return base;
  var room = _elive176MaybeAdvanceTurn_(managed.found, false) || managed.room;
  var pkg = _elive176Package_(room);
  var players = _elive176PlayerRows_(room);
  if (pkg) {
    pkg.server_now = _elive176Iso_(new Date());
    pkg.players = players;
    pkg.teams = _elmm174Teams_(room);
  }
  base.version = ELIVE176_VERSION;
  base.memory_match = true;
  base.room = _elive176PublicRoom_(room);
  base.room_package = pkg;
  base.turn_state = pkg && pkg.turn_state || null;
  base.shared_state = pkg && pkg.shared_state || null;
  base.turn_description = pkg && pkg.turn_state ? _elive176DescribeTurn_(pkg.turn_state, players) : null;
  return base;
}
function _elive176PairFromBody_(pkg, body) {
  var answer = body.answer_value || body.answerValue || {};
  if (typeof answer === 'string') answer = _elive176Json_(answer, {});
  var firstId = _elive176Text_(answer.first_card_id || body.first_card_id);
  var secondId = _elive176Text_(answer.second_card_id || body.second_card_id);
  var cards = pkg && pkg.round && Array.isArray(pkg.round.cards) ? pkg.round.cards : [];
  var byId = {};
  cards.forEach(function (card) { byId[_elive176Text_(card.card_id)] = card; });
  var first = byId[firstId] || null;
  var second = byId[secondId] || null;
  var correct = !!(first && second && _elive176Text_(first.pair_id) && _elive176Text_(first.pair_id) === _elive176Text_(second.pair_id));
  return {first_id:firstId,second_id:secondId,correct:correct,pair_id:correct ? _elive176Text_(first.pair_id) : ''};
}
function _elive176AuthenticatedPlayerId_(body) {
  try {
    var state = englishLabLiveGetPlayerState(body || {});
    var player = state && state.player || null;
    return _elive176Text_(player && (player.cod_estudiante || player.player_id || player.COD_ESTUDIANTE));
  } catch (_) { return ''; }
}
function englishLabMemoryMatchSubmitPairCS21A176(body) {
  body = body || {};
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return {ok:false,error:'sala_ocupada',mensaje:'La sala está procesando otro intento. Actualice y pruebe de nuevo.'};
  try {
    var found = _elive176FindRoom_(body, null);
    if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
    var room = _elive176MaybeAdvanceTurn_(found, true) || found.row;
    if (_elive176Upper_(room.GAME_CODE) !== ELMM174_GAME_CODE) return {ok:false,error:'sala_no_memory_match'};
    var current = _elive176Current_(room);
    var pkg = current.room_package || null;
    if (!pkg || !pkg.state || _elive176Upper_(pkg.state.phase) !== 'OPEN') return {ok:false,error:'ronda_no_abierta'};
    var players = _elive176PlayerRows_(room);
    var authenticatedId = _elive176AuthenticatedPlayerId_(body);
    var requestedId = _elive176Text_(body.player_id || body.playerId || body.cod_estudiante || body.codigo_estudiante);
    var playerId = authenticatedId || requestedId;
    body.player_id = playerId;
    body.cod_estudiante = playerId;
    var player = players.filter(function (item) { return item.player_id === playerId; })[0] || null;
    var turnState = pkg.turn_state || null;
    if (!_elive176CanAct_(turnState, player)) return {ok:false,error:'turno_no_activo',mensaje:'Espere su turno.',turn_state:turnState,turn_description:turnState ? _elive176DescribeTurn_(turnState, players) : null};
    var pair = _elive176PairFromBody_(pkg, body);
    if (!pair.first_id || !pair.second_id || pair.first_id === pair.second_id) return {ok:false,error:'par_invalido'};
    var shared = pkg.shared_state || {version:ELIVE176_VERSION,board_version:1,matched_pair_ids:[],completed:false,last_action_key:''};
    shared.matched_pair_ids = Array.isArray(shared.matched_pair_ids) ? shared.matched_pair_ids : [];
    var canonicalCards = [pair.first_id, pair.second_id].sort();
    var actionKey = [room.ROOM_CODE, turnState.turn_number, playerId, canonicalCards[0], canonicalCards[1]].join('|');
    if (_elive176Text_(shared.last_action_key) === actionKey) return {ok:true,accepted:false,duplicate:true,message:'Intento ya procesado.',room_package:pkg,turn_state:turnState,shared_state:shared};
    if (pair.correct && shared.matched_pair_ids.indexOf(pair.pair_id) >= 0) return {ok:true,accepted:false,duplicate:true,correct:true,points:0,message:'Par ya encontrado.',room_package:pkg,turn_state:turnState,shared_state:shared};
    var result = englishLabMemoryMatchSubmitPair(body);
    if (!result || result.ok !== true || result.accepted !== true) return result;
    if (pair.correct) shared.matched_pair_ids.push(pair.pair_id);
    shared.last_action_key = actionKey;
    shared.board_version = Math.max(1, Number(shared.board_version || 1) || 1) + 1;
    var now = new Date();
    var durationMs = Number(pkg.rules && pkg.rules.round_duration_ms || 30000) || 30000;
    var nextTurn = _elive176NextTurn_(turnState, now, durationMs, pair.correct ? 'PAIR_CORRECT' : 'PAIR_INCORRECT');
    var totalPairs = pkg.round && Array.isArray(pkg.round.cards) ? pkg.round.cards.length / 2 : 0;
    var completed = totalPairs > 0 && shared.matched_pair_ids.length >= totalPairs;
    shared.completed = completed;
    pkg.version = ELIVE176_VERSION;
    pkg.turn_state = nextTurn;
    pkg.shared_state = shared;
    pkg.players = players;
    pkg.state.active_player_id = nextTurn.active_player_id;
    pkg.state.active_team_id = nextTurn.active_team_id;
    pkg.state.started_at = nextTurn.turn_started_at;
    pkg.state.ends_at = nextTurn.turn_ends_at;
    pkg.state.phase = completed ? 'COMPLETE' : 'OPEN';
    pkg.server_now = _elive176Iso_(now);
    var patch = {};
    if (completed) { patch.ROUND_STATUS = 'CLOSED'; patch.ROUND_CLOSED_AT = _elive176Iso_(now); }
    var updatedRoom = _elive176SavePackage_(found, current, pkg, patch);
    _eliveAppendEvent_(updatedRoom, 'LIVE_TURN_ADVANCED', {sesion:{nombre:player.name},rol:'student'}, {from_player_id:turnState.active_player_id,to_player_id:nextTurn.active_player_id,from_team_id:turnState.active_team_id,to_team_id:nextTurn.active_team_id,turn_number:nextTurn.turn_number,reason:nextTurn.reason,board_version:shared.board_version,completed:completed});
    result.version = ELIVE176_VERSION;
    result.room = _elive176PublicRoom_(updatedRoom);
    result.room_package = pkg;
    result.turn_state = nextTurn;
    result.shared_state = shared;
    result.turn_description = _elive176DescribeTurn_(nextTurn, players);
    return result;
  } finally { lock.releaseLock(); }
}
function verificarActualizacionQA() {
  CacheService.getScriptCache().remove('ELIVE176|' + _elmm174DbId_() + '|QUESTION_BANK');
  var pairsU1 = _elive176PairRows_('B1', 'U1');
  var pairsU01 = _elive176PairRows_('B1', 'U01');
  var syntheticPlayers = [{player_id:'P1',name:'Jugador 1',team_id:'NO_TEAM'},{player_id:'P2',name:'Jugador 2',team_id:'NO_TEAM'},{player_id:'P3',name:'Jugador 3',team_id:'NO_TEAM'},{player_id:'P4',name:'Jugador 4',team_id:'NO_TEAM'}];
  var plan = _elive176TeamPlan_(syntheticPlayers, 'LAB-TEST', 5);
  var plannedPlayers = syntheticPlayers.map(function (player) { return {player_id:player.player_id,name:player.name,team_id:plan[player.player_id]}; });
  var syntheticRoom = {ROOM_CODE:'LAB-TEST',CURRENT_INDEX:1};
  var individual = _elive176CreateTurnState_(syntheticRoom, plannedPlayers, ELIVE176_POLICY_RANDOM_PLAYER, new Date(), 30000);
  var teams = _elive176CreateTurnState_(syntheticRoom, plannedPlayers, ELIVE176_POLICY_TEAM_ALTERNATING, new Date(), 30000);
  var teamsNext = _elive176NextTurn_(teams, new Date(), 30000, 'TEST');
  var distinctTeams = {};
  plannedPlayers.forEach(function (player) { distinctTeams[player.team_id] = true; });
  var result = {ok:pairsU1.length >= 6 && pairsU01.length >= 6 && individual.player_order.length === 4 && !!individual.active_player_id && Object.keys(distinctTeams).length === 2 && teams.team_order.length === 2 && teams.active_team_id !== teamsNext.active_team_id,version:ELIVE176_VERSION,objective:ELIVE176_UPDATE_OBJECTIVE,normalize_u1:_elive176NormalizeUnit_('U1'),b1_u1_pairs:pairsU1.length,b1_u01_pairs:pairsU01.length,individual_active_player:individual.active_player_id,planned_teams:Object.keys(distinctTeams),team_active:teams.active_team_id,team_next:teamsNext.active_team_id,timeout_policy:'ADVANCE_TURN_NOT_CLOSE_ROUND'};
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A176 no superó la verificación de banco, equipos y turnos.');
  return result;
}
var _elive176DoPostBase_ = doPost;
doPost = function (e) {
  try {
    var body = {};
    try { body = _an4406_parseBody_(e) || {}; } catch (_) { body = {}; }
    var fn = _elive176Text_((e && e.parameter && e.parameter.fn) || body.fn).toLowerCase();
    if (fn === 'englishlabmemorymatchcreateroom') return _an4406_json_(englishLabMemoryMatchCreateRoomCS21A176(body));
    if (fn === 'englishlabmemorymatchstartroom') return _an4406_json_(englishLabMemoryMatchStartRoomCS21A176(body));
    if (fn === 'englishlabmemorymatchgetplayerstate') return _an4406_json_(englishLabMemoryMatchGetPlayerStateCS21A176(body));
    if (fn === 'englishlablivegetplayerstate' && _elive176IsMemoryRoom_(body)) return _an4406_json_(englishLabMemoryMatchGetPlayerStateCS21A176(body));
    if (fn === 'englishlabmemorymatchgetroomcontrol') return _an4406_json_(englishLabMemoryMatchGetRoomControlCS21A176(body));
    if (fn === 'englishlabmemorymatchsubmitpair') return _an4406_json_(englishLabMemoryMatchSubmitPairCS21A176(body));
    if (fn === 'verificaractualizacionqa') return _an4406_json_(verificarActualizacionQA());
    return _elive176DoPostBase_(e);
  } catch (err) {
    return _an4406_json_({ok:false,version:ELIVE176_VERSION,error:'actualizacion_qa_error',mensaje:String(err && err.message ? err.message : err)});
  }
};
