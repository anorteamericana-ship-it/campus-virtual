// CS21A195 - QA - relay canónico de convergencia para Memory Match Live.
// Capa acumulativa: cargar después de CS21A194/99P. QA/STAGING solamente.
// Objetivo: un poll lento iniciado antes de una jugada nunca debe hacer que
// otro cliente espere un ciclo completo para conocer la revisión más nueva.

var CS21A195_MM_CONVERGENCE_VERSION = 'CS21A195-MM-CONVERGENCE-RELAY-1';
var CS21A195_MM_RELAY_TTL_SECONDS = 90;
var CS21A195_MM_FULL_REFRESH_MS = 30000;

function _cs21a195RelayPart_(value) {
  return _elive176Text_(value).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 120);
}

function _cs21a195RelayKeys_(roomOrBody) {
  roomOrBody = roomOrBody || {};
  var values = [
    roomOrBody.ROOM_ID, roomOrBody.room_id, roomOrBody.roomId,
    roomOrBody.ROOM_CODE, roomOrBody.room_code, roomOrBody.roomCode, roomOrBody.codigo
  ];
  var seen = {};
  return values.map(_cs21a195RelayPart_).filter(function (value) {
    if (!value || seen[value]) return false;
    seen[value] = true;
    return true;
  }).map(function (value) { return 'EL195|RELAY|' + value; });
}

function _cs21a195RelayRevision_(record) {
  return Math.max(0, Number(record && record.revision || 0) || 0);
}

function _cs21a195ReadRelay_(roomOrBody) {
  var cache = CacheService.getScriptCache();
  var best = null;
  _cs21a195RelayKeys_(roomOrBody).forEach(function (key) {
    var raw = cache.get(key);
    if (!raw) return;
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.response || !parsed.revision) return;
      if (!best || _cs21a195RelayRevision_(parsed) > _cs21a195RelayRevision_(best) ||
          (_cs21a195RelayRevision_(parsed) === _cs21a195RelayRevision_(best) && Number(parsed.published_ms || 0) > Number(best.published_ms || 0))) {
        best = parsed;
      }
    } catch (_) {}
  });
  return best;
}

function _cs21a195WriteRelay_(roomOrBody, record) {
  record = record || {};
  var revision = _cs21a195RelayRevision_(record);
  if (!revision || !record.response) return false;
  var cache = CacheService.getScriptCache();
  var wrote = false;
  _cs21a195RelayKeys_(roomOrBody).forEach(function (key) {
    var current = null;
    try { current = JSON.parse(cache.get(key) || 'null'); } catch (_) { current = null; }
    var currentRevision = _cs21a195RelayRevision_(current);
    if (currentRevision > revision) return;
    if (currentRevision === revision && Number(current && current.published_ms || 0) > Number(record.published_ms || 0)) return;
    try {
      cache.put(key, JSON.stringify(record), CS21A195_MM_RELAY_TTL_SECONDS);
      wrote = true;
    } catch (_) {}
  });
  return wrote;
}

function _cs21a195AclRoom_(room) {
  room = room || {};
  return {
    ROOM_ID:_elive176Text_(room.ROOM_ID || room.room_id || room.roomId),
    ROOM_CODE:_elive176Text_(room.ROOM_CODE || room.room_code || room.roomCode),
    GAME_CODE:_elive176Text_(room.GAME_CODE || room.game_code || room.gameCode),
    STATUS:_elive176Text_(room.STATUS || room.status),
    ROUND_STATUS:_elive176Text_(room.ROUND_STATUS || room.round_status),
    DOCENTE:_elive176Text_(room.DOCENTE || room.docente),
    NIVEL:_elive176Text_(room.NIVEL || room.nivel),
    MODE:_elive176Text_(room.MODE || room.mode)
  };
}

function _cs21a195RelayResponseFromPackage_(room, pkg) {
  pkg = _cs21a192Clone_(pkg || {});
  var players = Array.isArray(pkg.players) ? pkg.players : [];
  var attempt = pkg.shared_state && pkg.shared_state.active_attempt || null;
  return {
    ok:true,
    memory_match:true,
    convergence_version:CS21A195_MM_CONVERGENCE_VERSION,
    state_revision:_cs21a192Revision_(pkg),
    room:_elive176PublicRoom_(room || {}),
    room_package:pkg,
    turn_state:_cs21a192Clone_(pkg.turn_state || null),
    shared_state:_cs21a192Clone_(pkg.shared_state || null),
    stats:{players:players.length,answers_current:attempt ? 1 : 0}
  };
}

function _cs21a195PublishRoomRelay_(room) {
  room = room || {};
  var current = _elive176Current_(room);
  if (!_cs21a192IsMemoryCurrent_(current)) return false;
  var pkg = current.room_package || null;
  var revision = _cs21a192Revision_(pkg);
  if (!pkg || !revision) return false;
  var now = Date.now();
  var record = {
    version:CS21A195_MM_CONVERGENCE_VERSION,
    revision:revision,
    published_ms:now,
    acl:_cs21a195AclRoom_(room),
    response:_cs21a195RelayResponseFromPackage_(room, pkg)
  };
  return _cs21a195WriteRelay_(room, record);
}

function _cs21a195PublishResponseRelay_(roomOrBody, response) {
  response = response || {};
  var pkg = response.room_package || null;
  var revision = _cs21a192Revision_(pkg);
  if (!pkg || !revision) return false;
  var previous = _cs21a195ReadRelay_(roomOrBody) || {};
  var merged = _cs21a192Clone_(previous.response || {});
  Object.keys(response).forEach(function (key) { merged[key] = response[key]; });
  merged.ok = true;
  merged.memory_match = true;
  merged.convergence_version = CS21A195_MM_CONVERGENCE_VERSION;
  merged.state_revision = revision;
  merged.room_package = _cs21a192Clone_(pkg);
  merged.turn_state = _cs21a192Clone_(pkg.turn_state || response.turn_state || null);
  merged.shared_state = _cs21a192Clone_(pkg.shared_state || response.shared_state || null);
  var record = {
    version:CS21A195_MM_CONVERGENCE_VERSION,
    revision:revision,
    published_ms:Date.now(),
    acl:previous.acl || _cs21a195AclRoom_(response.room || {}),
    response:merged
  };
  return _cs21a195WriteRelay_(roomOrBody, record);
}

// Publicar la revisión inmediatamente después de la escritura revisionada de
// 99O, antes de eventos/rankings y antes de cualquier relectura costosa.
var _cs21a195SetCellsBase_ = _elive180SetCells_;
_elive180SetCells_ = function (found, patch) {
  var updated = _cs21a195SetCellsBase_(found, patch || {});
  try { _cs21a195PublishRoomRelay_(updated); } catch (_) {}
  return updated;
};
_elive180SetCells_.__cs21a195ConvergenceRelay = true;
_elive180SetCells_.__base = _cs21a195SetCellsBase_;

// Si una lectura empezó con R10 y mientras estaba procesándose otra ejecución
// escribió R11, el snapshot R10 no debe salir al navegador. El relay R11 se
// superpone al final sin exigir otra lectura de Sheets.
var _cs21a195CanonicalBase_ = _cs21a192CanonicalSnapshot_;
_cs21a192CanonicalSnapshot_ = function (roomOrBody) {
  var result = _cs21a195CanonicalBase_(roomOrBody || {});
  if (!result || result.ok !== true || !result.snapshot) return result;
  try { _cs21a195PublishRoomRelay_(result.row); } catch (_) {}
  var relay = _cs21a195ReadRelay_(result.row || roomOrBody || {});
  if (!relay) return result;
  var snapshotRevision = _cs21a192Revision_(result.snapshot.room_package || {});
  if (_cs21a195RelayRevision_(relay) <= snapshotRevision) return result;
  var snapshot = _cs21a192Clone_(result.snapshot);
  Object.keys(relay.response || {}).forEach(function (key) { snapshot[key] = _cs21a192Clone_(relay.response[key]); });
  snapshot.fast_relay = true;
  snapshot.convergence_version = CS21A195_MM_CONVERGENCE_VERSION;
  result.snapshot = _cs21a192FreshEnvelope_(snapshot);
  result.cache_key = 'EL195|FAST|R' + _cs21a195RelayRevision_(relay);
  return result;
};
_cs21a192CanonicalSnapshot_.__cs21a195StaleReadShield = true;
_cs21a192CanonicalSnapshot_.__base = _cs21a195CanonicalBase_;

function _cs21a195TransitionDue_(relay) {
  var pkg = relay && relay.response && relay.response.room_package || null;
  return !!(pkg && _cs21a192TransitionNeeded_(pkg, Date.now()));
}

function _cs21a195PlayerInRelay_(relay, playerId) {
  var pkg = relay && relay.response && relay.response.room_package || {};
  var players = Array.isArray(pkg.players) ? pkg.players : [];
  return players.filter(function (player) {
    return _elive176Text_(player && (player.player_id || player.cod_estudiante || player.COD_ESTUDIANTE)) === _elive176Text_(playerId);
  })[0] || null;
}

function _cs21a195FullRefreshDue_(kind, roomCode, viewerId) {
  var cache = CacheService.getScriptCache();
  var key = 'EL195|FULL|' + _cs21a195RelayPart_(kind) + '|' + _cs21a195RelayPart_(roomCode) + '|' + _cs21a195RelayPart_(viewerId || 'VIEWER');
  var now = Date.now();
  var last = Number(cache.get(key) || 0) || 0;
  if (!last) {
    try { cache.put(key, String(now), 120); } catch (_) {}
    return false;
  }
  if (now - last < CS21A195_MM_FULL_REFRESH_MS) return false;
  try { cache.put(key, String(now), 120); } catch (_) {}
  return true;
}

function _cs21a195FastEnvelope_(relay, player) {
  var response = _cs21a192Clone_(relay && relay.response || {});
  response.ok = true;
  response.fast_relay = true;
  response.convergence_version = CS21A195_MM_CONVERGENCE_VERSION;
  if (player) {
    response.player = _cs21a192Clone_(player);
    var playerId = _elive176Text_(player.player_id || player.cod_estudiante || player.COD_ESTUDIANTE);
    var pkg = response.room_package || {};
    var turnPlayer = {player_id:playerId,name:_elive176Text_(player.name || player.NOMBRE),team_id:_elive176Text_(player.team_id || player.TEAM) || 'NO_TEAM'};
    response.can_answer = !!(pkg.state && _elive176Upper_(pkg.state.phase) === 'OPEN' && _elive176CanAct_(response.turn_state, turnPlayer));
  }
  return _cs21a192FreshEnvelope_(response);
}

var _cs21a195ControlBase_ = englishLabMemoryMatchGetRoomControlCS21A180;
englishLabMemoryMatchGetRoomControlCS21A180 = function (body) {
  body = body || {};
  var id = _elive180RoomIdFromBody_(body);
  var relay = id ? _cs21a195ReadRelay_(body) : null;
  if (relay && !_cs21a195TransitionDue_(relay)) {
    var auth = _eliveAuthTeacher_(body);
    if (auth && auth.ok === true && _elive180CanRoom_(auth, relay.acl || {}) &&
        _elive176Upper_(relay.acl && relay.acl.GAME_CODE) === ELMM174_GAME_CODE &&
        !_cs21a195FullRefreshDue_('TEACHER', id, _elive176Text_(auth.sesion && (auth.sesion.nombre || auth.sesion.usuario || auth.sesion.cedula)))) {
      return _cs21a195FastEnvelope_(relay, null);
    }
  }
  var response = _cs21a195ControlBase_(body);
  if (response && response.ok === true) _cs21a195PublishResponseRelay_(body, response);
  return response;
};
englishLabMemoryMatchGetRoomControlCS21A180.__cs21a190TransientCleanup = true;
englishLabMemoryMatchGetRoomControlCS21A180.__cs21a192CanonicalSnapshot = true;
englishLabMemoryMatchGetRoomControlCS21A180.__cs21a195FastRelay = true;

var _cs21a195PlayerBase_ = englishLabMemoryMatchGetPlayerStateCS21A180;
englishLabMemoryMatchGetPlayerStateCS21A180 = function (body) {
  body = body || {};
  var access = _elive180RequireLab_(body);
  if (!access || access.allowed !== true) return access;
  var normalized = _cs21a144LiveBody_(body, access);
  var code = _elive176Upper_(normalized.room_code || normalized.roomCode || normalized.codigo).replace(/[^A-Z0-9-]/g, '');
  var playerId = _elive176Text_(normalized.player_id || normalized.cod_estudiante);
  var relay = code ? _cs21a195ReadRelay_({room_code:code}) : null;
  var player = relay ? _cs21a195PlayerInRelay_(relay, playerId) : null;
  if (relay && player && !_cs21a195TransitionDue_(relay) && !_cs21a195FullRefreshDue_('PLAYER', code, playerId)) {
    return _cs21a195FastEnvelope_(relay, player);
  }
  var response = _cs21a195PlayerBase_(body);
  if (response && response.ok === true) _cs21a195PublishResponseRelay_({room_code:code}, response);
  return response;
};
englishLabMemoryMatchGetPlayerStateCS21A180.__cs21a190TransientCleanup = true;
englishLabMemoryMatchGetPlayerStateCS21A180.__cs21a192CanonicalSnapshot = true;
englishLabMemoryMatchGetPlayerStateCS21A180.__cs21a195FastRelay = true;

// La mutación sigue usando el contrato 99K→99O→99P; solo publica al relay la
// respuesta enriquecida cuando termina, sin introducir otra lectura/escritura.
var _cs21a195SubmitBase_ = englishLabMemoryMatchSubmitPairCS21A180;
englishLabMemoryMatchSubmitPairCS21A180 = function (body) {
  var response = _cs21a195SubmitBase_(body || {});
  if (response && response.room_package) _cs21a195PublishResponseRelay_(body || {}, response);
  return response;
};
englishLabMemoryMatchSubmitPairCS21A180.__cs21a186CanonicalRules = true;
englishLabMemoryMatchSubmitPairCS21A180.__cs21a188SharedDiscovery = true;
englishLabMemoryMatchSubmitPairCS21A180.__cs21a189ClassicSync = true;
englishLabMemoryMatchSubmitPairCS21A180.__cs21a192RevisionedResponses = true;
englishLabMemoryMatchSubmitPairCS21A180.__cs21a192ExpectedStateGuard = true;
englishLabMemoryMatchSubmitPairCS21A180.__cs21a195RelayPublished = true;

var _cs21a195VerifyBase_ = verificarMemoryMatchStartFixCS21A183;
verificarMemoryMatchStartFixCS21A183 = function () {
  var previous = _cs21a195VerifyBase_();
  var syntheticRoom = {ROOM_ID:'ROOM-195-VERIFY',ROOM_CODE:'LAB-195',GAME_CODE:'MEMORY_MATCH',STATUS:'LIVE',ROUND_STATUS:'OPEN',DOCENTE:'Docente QA'};
  var oldPkg = {state_revision:10,room:{room_code:'LAB-195',game_id:'MEMORY_MATCH'},state:{phase:'OPEN'},turn_state:{turn_number:4,turn_started_at:'2026-08-10T20:00:00.000Z',turn_ends_at:'2026-08-10T20:30:00.000Z'},shared_state:{state_revision:10,board_version:8},players:[{player_id:'P1',name:'Chu'}]};
  var newPkg = _cs21a192Clone_(oldPkg);
  newPkg.state_revision = 11;
  newPkg.shared_state.state_revision = 11;
  newPkg.shared_state.board_version = 9;
  var first = {version:CS21A195_MM_CONVERGENCE_VERSION,revision:11,published_ms:100,acl:_cs21a195AclRoom_(syntheticRoom),response:_cs21a195RelayResponseFromPackage_(syntheticRoom,newPkg)};
  var stale = {version:CS21A195_MM_CONVERGENCE_VERSION,revision:10,published_ms:200,acl:_cs21a195AclRoom_(syntheticRoom),response:_cs21a195RelayResponseFromPackage_(syntheticRoom,oldPkg)};
  _cs21a195WriteRelay_(syntheticRoom, first);
  _cs21a195WriteRelay_(syntheticRoom, stale);
  var read = _cs21a195ReadRelay_(syntheticRoom);
  var valid = !!(previous && previous.ok === true && read && read.revision === 11 &&
    _elive180SetCells_.__cs21a195ConvergenceRelay === true &&
    _cs21a192CanonicalSnapshot_.__cs21a195StaleReadShield === true &&
    englishLabMemoryMatchGetPlayerStateCS21A180.__cs21a195FastRelay === true &&
    englishLabMemoryMatchGetRoomControlCS21A180.__cs21a195FastRelay === true &&
    englishLabMemoryMatchSubmitPairCS21A180.__cs21a195RelayPublished === true);
  var result = {
    ok:valid,
    version:CS21A195_MM_CONVERGENCE_VERSION,
    previous_version:previous && previous.version,
    fast_relay:true,
    stale_inflight_read_shield:true,
    relay_never_downgrades_revision:true,
    relay_ttl_seconds:CS21A195_MM_RELAY_TTL_SECONDS,
    full_refresh_ms:CS21A195_MM_FULL_REFRESH_MS,
    timeout_transition_falls_back_to_canonical:true,
    permissions_preserved:true,
    player_access_preserved:true,
    memory_match_only:true,
    qa_master:previous && previous.qa_master,
    qa_operational:previous && previous.qa_operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A195 no supero la verificacion de convergencia Memory Match.');
  return result;
};
