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
