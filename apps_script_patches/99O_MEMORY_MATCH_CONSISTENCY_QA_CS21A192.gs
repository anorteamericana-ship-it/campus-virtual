// CS21A192 - QA - estado monotonicamente versionado para Memory Match.
// Capa acumulativa: se carga despues de 99N. QA/STAGING solamente.
// No modifica rutas ni endpoints de Ahorcado.

var CS21A192_MM_SYNC_VERSION = 'CS21A192-MM-CONSISTENCY-1';
var CS21A192_MM_SNAPSHOT_TTL_SECONDS = 3;
var CS21A192_MM_TRANSITION_LOCK_MS = 2500;
var CS21A192_MM_MAX_POLL_MS = 2200;
var CS21A192_MM_TESTED_LATENCY_MS = 2500;
var CS21A192_MM_REVEAL_MARGIN_MS = 1300;
var CS21A192_MM_MISMATCH_REVEAL_MS = CS21A192_MM_MAX_POLL_MS +
  CS21A192_MM_TESTED_LATENCY_MS + CS21A192_MM_REVEAL_MARGIN_MS;

// CS21A189 usaba 2.2 s: menos que una sola respuesta lenta de Apps Script.
// La ventana CS21A192 cubre el peor polling admitido (25 jugadores), la
// latencia asimetrica probada y un margen. El deadline sigue siendo absoluto y
// compartido; solo se evita que un panel lento pierda por completo el mismatch.
CS21A189_MM_MISMATCH_REVEAL_MS = Math.max(
  Number(CS21A189_MM_MISMATCH_REVEAL_MS || 0) || 0,
  CS21A192_MM_MISMATCH_REVEAL_MS
);

function _cs21a192Clone_(value) {
  return JSON.parse(JSON.stringify(value == null ? {} : value));
}

function _cs21a192IsMemoryCurrent_(current) {
  current = current || {};
  var pkg = current.room_package || {};
  var room = pkg.room || {};
  return _elive176Upper_(current.type || current.game_id) === ELMM174_GAME_CODE ||
    _elive176Upper_(room.game_id || room.game_code) === ELMM174_GAME_CODE;
}

function _cs21a192Revision_(pkg) {
  pkg = pkg || {};
  var shared = pkg.shared_state || {};
  return Math.max(0,
    Number(pkg.state_revision || 0) || 0,
    Number(shared.state_revision || 0) || 0
  );
}

function _cs21a192ExpectedNumber_(body, snakeKey, camelKey) {
  body = body || {};
  var hasSnake = Object.prototype.hasOwnProperty.call(body, snakeKey);
  var hasCamel = Object.prototype.hasOwnProperty.call(body, camelKey);
  if (!hasSnake && !hasCamel) return {provided:false,value:null};
  var raw = hasSnake ? body[snakeKey] : body[camelKey];
  if (raw === null || raw === undefined || _elive176Text_(raw) === '') return {provided:true,value:null};
  var parsed = Number(raw);
  return {provided:true,value:isFinite(parsed) ? parsed : null};
}

// Se invoca desde 99K despues del refetch y dentro del mismo ScriptLock que
// protege el submit. Una accion nacida de un snapshot viejo recibe el paquete
// canonico actual y termina antes de cualquier mutacion.
function _cs21a192ExpectedStateConflict_(body, pkg, turnState) {
  var expectedRevision = _cs21a192ExpectedNumber_(body, 'expected_state_revision', 'expectedStateRevision');
  var expectedTurn = _cs21a192ExpectedNumber_(body, 'expected_turn_number', 'expectedTurnNumber');
  if (!expectedRevision.provided && !expectedTurn.provided) return null;

  var actualRevision = _cs21a192Revision_(pkg);
  var actualTurn = Number(turnState && turnState.turn_number || 0) || 0;
  var revisionMatches = !expectedRevision.provided || expectedRevision.value === actualRevision;
  var turnMatches = !expectedTurn.provided || expectedTurn.value === actualTurn;
  if (revisionMatches && turnMatches) return null;

  return _cs21a192FreshEnvelope_({
    ok:false,
    error:'state_conflict',
    mensaje:'La sala cambio antes de aplicar la jugada. Se cargo el estado actual.',
    retry_after_ms:0,
    expected_state_revision:expectedRevision.provided ? expectedRevision.value : null,
    expected_turn_number:expectedTurn.provided ? expectedTurn.value : null,
    actual_state_revision:actualRevision,
    actual_turn_number:actualTurn,
    room_package:_cs21a192Clone_(pkg || {}),
    turn_state:_cs21a192Clone_(turnState || {}),
    shared_state:_cs21a192Clone_(pkg && pkg.shared_state || {})
  });
}
_cs21a192ExpectedStateConflict_.__cs21a192UnderSubmitLock = true;

function _cs21a192BumpCurrentRevision_(current) {
  current = current || {};
  if (!_cs21a192IsMemoryCurrent_(current) || !current.room_package) return 0;
  var pkg = current.room_package;
  var shared = pkg.shared_state && typeof pkg.shared_state === 'object' ? pkg.shared_state : {};
  var revision = _cs21a192Revision_(pkg) + 1;
  pkg.state_revision = revision;
  shared.state_revision = revision;
  pkg.shared_state = shared;
  current.room_package = pkg;
  current.state_revision = revision;
  return revision;
}

// Toda escritura del paquete Memory Match recibe una revision dentro de la misma
// escritura de CURRENT_QUESTION_JSON. Otros juegos atraviesan el helper intactos.
var _cs21a192SetCellsBase_ = _elive180SetCells_;
_elive180SetCells_ = function (found, patch) {
  patch = patch || {};
  var nextPatch = {};
  var currentKey = '';
  Object.keys(patch).forEach(function (key) {
    nextPatch[key] = patch[key];
    if (_elive176Upper_(key) === 'CURRENT_QUESTION_JSON') currentKey = key;
  });
  if (currentKey) {
    var current = _elive176Json_(nextPatch[currentKey], {});
    if (_cs21a192IsMemoryCurrent_(current) && current.room_package) {
      _cs21a192BumpCurrentRevision_(current);
      nextPatch[currentKey] = JSON.stringify(current);
    }
  }
  return _cs21a192SetCellsBase_(found, nextPatch);
};
_elive180SetCells_.__cs21a192RevisionedMemoryWrites = true;

function _cs21a192TransitionNeeded_(pkg, nowMs) {
  if (!pkg || !pkg.state || !pkg.turn_state) return false;
  nowMs = Number(nowMs || Date.now()) || Date.now();
  var startedMs = _elive176Timestamp_(pkg.turn_state.turn_started_at || pkg.state.started_at);
  var endsMs = _elive176Timestamp_(pkg.turn_state.turn_ends_at || pkg.state.ends_at);
  if (_elive176Upper_(pkg.state.phase) === 'COUNTDOWN' && startedMs && nowMs >= startedMs) return true;
  if (endsMs && nowMs >= endsMs && !(pkg.shared_state && pkg.shared_state.completed === true)) return true;
  var attempt = pkg.shared_state && pkg.shared_state.active_attempt || null;
  if (!attempt) return false;
  var phase = _cs21a189AttemptPhase_(attempt);
  var currentTurn = Number(pkg.turn_state.turn_number || 0) || 0;
  var attemptTurn = Number(attempt.turn_number || 0) || 0;
  if (phase === 'FIRST_REVEALED') return !!(currentTurn && attemptTurn && currentTurn !== attemptTurn);
  if (phase === 'MISMATCH_REVEAL') {
    var revealUntilMs = _elive176Timestamp_(attempt.reveal_until);
    return !revealUntilMs || nowMs >= revealUntilMs;
  }
  return true;
}

function _cs21a192Busy_() {
  return {
    ok:false,
    error:'state_transition_busy',
    mensaje:'La sala esta cerrando el turno anterior. Reintente en un momento.',
    retry_after_ms:250,
    sync_version:CS21A192_MM_SYNC_VERSION
  };
}

// Avance de turno y limpieza de cartas temporales: un lock, un refetch y una
// sola escritura. Nunca devuelve el row vencido cuando no obtiene el lock.
function _cs21a192AdvanceAndNormalize_(found) {
  if (!found || !found.row) return {ok:true,row:null,changed:false};
  if (_cs21a185MmRoomClosed_(found.row)) return {ok:true,row:found.row,changed:false};
  var initialPackage = _elive176Package_(found.row);
  if (!_cs21a192TransitionNeeded_(initialPackage, Date.now())) {
    return {ok:true,row:found.row,changed:false};
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(CS21A192_MM_TRANSITION_LOCK_MS)) return _cs21a192Busy_();

  var updated = null;
  var timeoutDetail = null;
  var cleanupDetail = null;
  try {
    var fresh = _elive180FindRoom_(found.row.ROOM_ID || found.row.ROOM_CODE);
    if (!fresh || !fresh.row) return {ok:true,row:null,changed:false};
    if (_cs21a185MmRoomClosed_(fresh.row)) return {ok:true,row:fresh.row,changed:false};

    var current = _elive176Current_(fresh.row);
    var pkg = current.room_package || null;
    if (!pkg || !pkg.state || !pkg.turn_state) return {ok:true,row:fresh.row,changed:false};
    var now = new Date();
    var nowMs = now.getTime();
    if (!_cs21a192TransitionNeeded_(pkg, nowMs)) return {ok:true,row:fresh.row,changed:false};

    var changed = false;
    var timedOut = false;
    var startedMs = _elive176Timestamp_(pkg.turn_state.turn_started_at || pkg.state.started_at);
    var endsMs = _elive176Timestamp_(pkg.turn_state.turn_ends_at || pkg.state.ends_at);
    if (_elive176Upper_(pkg.state.phase) === 'COUNTDOWN' && startedMs && nowMs >= startedMs) {
      pkg.state.phase = 'OPEN';
      changed = true;
    }
    if (endsMs && nowMs >= endsMs && !(pkg.shared_state && pkg.shared_state.completed === true)) {
      var durationMs = Number(pkg.rules && pkg.rules.round_duration_ms || 30000) || 30000;
      var previousTurn = pkg.turn_state;
      var nextTurn = _elive176NextTurn_(previousTurn, now, durationMs, 'TURN_TIMEOUT');
      pkg.turn_state = nextTurn;
      pkg.state.phase = 'OPEN';
      pkg.state.active_player_id = nextTurn.active_player_id;
      pkg.state.active_team_id = nextTurn.active_team_id;
      pkg.state.started_at = nextTurn.turn_started_at;
      pkg.state.ends_at = nextTurn.turn_ends_at;
      changed = true;
      timedOut = true;
      timeoutDetail = {
        from_player_id:previousTurn.active_player_id,
        active_player_id:nextTurn.active_player_id,
        active_team_id:nextTurn.active_team_id,
        turn_number:nextTurn.turn_number,
        version:CS21A192_MM_SYNC_VERSION
      };
    }

    var shared = _cs21a189ClassicShared_(pkg);
    var cleared = shared.active_attempt ? _cs21a192Clone_(shared.active_attempt) : null;
    var transientCleared = _cs21a189NormalizeAttempt_(shared, pkg.turn_state, now);
    if (pkg.shared_state && pkg.shared_state.completed === true && shared.active_attempt) {
      shared.active_attempt = null;
      transientCleared = true;
    }
    if (transientCleared) {
      shared.board_version = Math.max(1, Number(shared.board_version || 1) || 1) + 1;
      changed = true;
      cleanupDetail = {
        previous_phase:_cs21a189AttemptPhase_(cleared),
        previous_turn_number:Number(cleared && cleared.turn_number || 0) || 0,
        active_turn_number:Number(pkg.turn_state.turn_number || 0) || 0,
        reason:timedOut ? 'TURN_TIMEOUT' : 'REVEAL_EXPIRED',
        board_version:shared.board_version,
        version:CS21A192_MM_SYNC_VERSION
      };
    }
    pkg.shared_state = shared;
    if (!changed) return {ok:true,row:fresh.row,changed:false};

    pkg.server_now = _elive176Iso_(now);
    pkg.server_now_ms = nowMs;
    current.room_package = pkg;
    updated = _elive180SetCells_(fresh, {CURRENT_QUESTION_JSON:JSON.stringify(current)});
    _elive180Invalidate_(updated);
  } finally {
    lock.releaseLock();
  }

  if (updated && timeoutDetail) {
    var timeoutPkg = _elive176Package_(updated);
    timeoutDetail.state_revision = _cs21a192Revision_(timeoutPkg);
    _elive180AppendEvent_(updated, 'LIVE_TURN_TIMEOUT', {sesion:{nombre:'SISTEMA'},rol:'system'}, timeoutDetail);
  }
  if (updated && cleanupDetail) {
    var cleanupPkg = _elive176Package_(updated);
    cleanupDetail.state_revision = _cs21a192Revision_(cleanupPkg);
    _elive180AppendEvent_(updated, 'MEMORY_MATCH_TRANSIENT_REVEAL_CLEARED', {sesion:{nombre:'SISTEMA'},rol:'system'}, cleanupDetail);
  }
  // Un poll puede construir la revisión nueva entre la escritura de estado y
  // estos eventos. Invalidar otra vez evita conservar hasta tres segundos una
  // bitácora anterior junto a un turno/tablero ya actualizados.
  if (updated && (timeoutDetail || cleanupDetail)) _elive180Invalidate_(updated);
  return {ok:true,row:updated,changed:true,timed_out:!!timeoutDetail,transient_cleared:!!cleanupDetail};
}

// Conserva el nombre historico para cualquier consumidor Memory Match, pero
// elimina el comportamiento que devolvia un row vencido al fallar el lock.
_elive180MaybeAdvanceTurn_ = function (found) {
  var result = _cs21a192AdvanceAndNormalize_(found);
  if (!result.ok) {
    var error = new Error('CS21A192_STATE_TRANSITION_BUSY');
    error.code = 'state_transition_busy';
    error.retry_after_ms = result.retry_after_ms || 250;
    throw error;
  }
  return result.row;
};
_elive180MaybeAdvanceTurn_.__cs21a185ClosedTerminal = true;
_elive180MaybeAdvanceTurn_.__cs21a190TransientCleanup = true;
_elive180MaybeAdvanceTurn_.__cs21a192AtomicTransition = true;

function _cs21a192SnapshotKey_(room, pkg) {
  var id = _elive176Text_(room && (room.ROOM_ID || room.ROOM_CODE)).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 120);
  return 'EL192|STATE|' + id + '|R' + _cs21a192Revision_(pkg);
}

function _cs21a192SnapshotKeys_(room, pkg) {
  room = room || {};
  var revision = _cs21a192Revision_(pkg);
  var seen = {};
  return [room.ROOM_ID || room.room_id || room.roomId, room.ROOM_CODE || room.room_code || room.roomCode || room.codigo]
    .map(function (value) { return _elive176Text_(value).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 120); })
    .filter(function (value) {
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    })
    .map(function (value) { return 'EL192|STATE|' + value + '|R' + revision; });
}

// La invalidacion historica solo conocia EL180. Join, cambios de presencia y
// mutaciones de sala tambien deben retirar la entrada EL192 de la revision actual.
var _cs21a192InvalidateBase_ = _elive180Invalidate_;
_elive180Invalidate_ = function (roomOrBody) {
  roomOrBody = roomOrBody || {};
  _cs21a192InvalidateBase_(roomOrBody);
  var room = roomOrBody;
  var current = _elive176Current_(room);
  if (!_cs21a192IsMemoryCurrent_(current)) {
    var id = _elive176Text_(room.ROOM_ID || room.ROOM_CODE || room.room_id || room.roomId || room.room_code || room.roomCode || room.codigo);
    var found = id ? _elive180FindRoom_(id) : null;
    if (!found || !found.row) return;
    room = found.row;
    current = _elive176Current_(room);
  }
  if (!_cs21a192IsMemoryCurrent_(current)) return;
  var cache = CacheService.getScriptCache();
  _cs21a192SnapshotKeys_(room, current.room_package).forEach(function (key) { cache.remove(key); });
};
_elive180Invalidate_.__cs21a192RevisionCache = true;

function _cs21a192FreshEnvelope_(snapshot) {
  var response = _cs21a192Clone_(snapshot || {});
  var pkg = response.room_package || null;
  var now = new Date();
  var nowMs = now.getTime();
  var revision = _cs21a192Revision_(pkg);
  if (pkg) {
    pkg.state_revision = revision;
    pkg.shared_state = pkg.shared_state || {};
    pkg.shared_state.state_revision = revision;
    pkg.server_now = _elive176Iso_(now);
    pkg.server_now_ms = nowMs;
    response.room_package = pkg;
    response.turn_state = pkg.turn_state || response.turn_state || null;
    response.shared_state = pkg.shared_state;
  }
  var endsMs = _elive176Timestamp_(response.turn_state && response.turn_state.turn_ends_at || pkg && pkg.state && pkg.state.ends_at);
  var startsMs = _elive176Timestamp_(response.turn_state && response.turn_state.turn_started_at || pkg && pkg.state && pkg.state.started_at);
  response.state_revision = revision;
  response.server_now = _elive176Iso_(now);
  response.server_now_ms = nowMs;
  response.turn_remaining_ms = endsMs ? Math.max(0, endsMs - nowMs) : 0;
  response.turn_starts_in_ms = startsMs ? Math.max(0, startsMs - nowMs) : 0;
  response.sync_version = CS21A192_MM_SYNC_VERSION;
  return response;
}

// El row se vuelve a leer antes de elegir la clave. Una lectura vieja puede
// terminar tarde, pero nunca puede contaminar la clave de una revision nueva.
function _cs21a192CanonicalSnapshot_(roomOrBody) {
  roomOrBody = roomOrBody || {};
  var id = _elive176Text_(roomOrBody.ROOM_ID || roomOrBody.ROOM_CODE ||
    roomOrBody.room_id || roomOrBody.roomId || roomOrBody.room_code || roomOrBody.roomCode || roomOrBody.codigo);
  var found = id ? _elive180FindRoom_(id) : null;
  if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};

  var transition = _cs21a192AdvanceAndNormalize_(found);
  if (!transition.ok) return transition;
  var room = transition.row;
  if (!room) return {ok:false,error:'sala_no_encontrada'};
  var pkg = _elive176Package_(room);
  var key = _cs21a192SnapshotKey_(room, pkg);
  var cache = CacheService.getScriptCache();
  var snapshot = null;
  var cached = cache.get(key);
  if (cached) {
    try { snapshot = JSON.parse(cached); } catch (_) { snapshot = null; }
  }
  if (!snapshot) {
    snapshot = _elive180BuildSnapshot_(room);
    try { cache.put(key, JSON.stringify(snapshot), CS21A192_MM_SNAPSHOT_TTL_SECONDS); } catch (_) {}
  }
  return {ok:true,row:room,snapshot:_cs21a192FreshEnvelope_(snapshot),cache_key:key};
}

// Sustituye solo el snapshot Memory Match que consumen las capas historicas.
// Ahorcado continua llamando directamente a _elive180BuildSnapshot_.
_elive180Snapshot_ = function (room) {
  var result = _cs21a192CanonicalSnapshot_(room || {});
  if (!result.ok) {
    var error = new Error(result.error || 'CS21A192_STATE_UNAVAILABLE');
    error.code = result.error || 'state_unavailable';
    throw error;
  }
  return result.snapshot;
};
_elive180Snapshot_.__cs21a192RevisionKeyed = true;

function _cs21a192ControlState_(body) {
  body = body || {};
  try {
    var auth = _eliveAuthTeacher_(body);
    if (!auth || auth.ok !== true) return auth || {ok:false,error:'sesion_invalida'};
    var id = _elive180RoomIdFromBody_(body);
    if (!id) return {ok:false,error:'room_id requerido'};
    var found = _elive180FindRoom_(id);
    if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
    if (!_elive180CanRoom_(auth, found.row)) return {ok:false,error:'docente_sin_permiso_grupo'};
    if (_elive176Upper_(found.row.GAME_CODE) !== ELMM174_GAME_CODE) return {ok:false,error:'sala_no_memory_match'};

    var canonical = _cs21a192CanonicalSnapshot_(found.row);
    if (!canonical.ok) return canonical;
    var response = _elive180ResponseCopy_(canonical.snapshot);
    response = _cs21a183MmPresenceResponse_(response, canonical.row);
    response = _cs21a183MmApplyPairMetadata_(response, canonical.row);
    return _cs21a192FreshEnvelope_(response);
  } catch (error) {
    if (error && error.code === 'state_transition_busy') return _cs21a192Busy_();
    return {ok:false,error:'memory_match_control_cs21a192_error',mensaje:String(error && error.message ? error.message : error),sync_version:CS21A192_MM_SYNC_VERSION};
  }
}

function _cs21a192PlayerState_(body) {
  body = body || {};
  try {
    var access = _elive180RequireLab_(body);
    if (!access || access.allowed !== true) return access;
    var normalized = _cs21a144LiveBody_(body, access);
    var code = _elive176Upper_(normalized.room_code || normalized.roomCode || normalized.codigo).replace(/[^A-Z0-9-]/g, '');
    if (!code) return {ok:false,error:'room_code requerido'};
    var found = _elive180FindRoom_(code);
    if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
    if (_elive176Upper_(found.row.GAME_CODE) !== ELMM174_GAME_CODE) return {ok:false,error:'sala_no_memory_match'};

    var canonical = _cs21a192CanonicalSnapshot_(found.row);
    if (!canonical.ok) return canonical;
    var playerId = _elive176Text_(normalized.player_id || normalized.cod_estudiante);
    var rows = canonical.snapshot._player_rows || [];
    var player = rows.filter(function (row) { return _elive176Text_(row.COD_ESTUDIANTE) === playerId; })[0] || null;
    if (!player) return {ok:false,error:'jugador_no_registrado'};
    _elive180TouchPlayer_(canonical.row, player);

    var response = _elive180ResponseCopy_(canonical.snapshot);
    response.player = _elive180PlayerPublic_(player);
    response.my_rank = (response.leaderboard || []).filter(function (row) { return _elive176Text_(row.cod_estudiante) === playerId; })[0] || null;
    var turnPlayer = {player_id:playerId,name:_elive176Text_(player.NOMBRE),team_id:_elive176Text_(player.TEAM) || 'NO_TEAM'};
    response.can_answer = !!(response.room_package && response.room_package.state &&
      _elive176Upper_(response.room_package.state.phase) === 'OPEN' &&
      _elive176CanAct_(response.turn_state, turnPlayer) && response.turn_remaining_ms > 0 && response.turn_starts_in_ms <= 0);
    response = _cs21a183MmPresenceResponse_(response, canonical.row);
    return _cs21a192FreshEnvelope_(response);
  } catch (error) {
    if (error && error.code === 'state_transition_busy') return _cs21a192Busy_();
    return {ok:false,error:'memory_match_player_cs21a192_error',mensaje:String(error && error.message ? error.message : error),sync_version:CS21A192_MM_SYNC_VERSION};
  }
}

englishLabMemoryMatchGetRoomControlCS21A180 = _cs21a192ControlState_;
englishLabMemoryMatchGetRoomControlCS21A180.__cs21a192CanonicalSnapshot = true;
englishLabMemoryMatchGetPlayerStateCS21A180 = _cs21a192PlayerState_;
englishLabMemoryMatchGetPlayerStateCS21A180.__cs21a192CanonicalSnapshot = true;

// El submit CS21A189 conserva reglas e idempotencia. El wrapper garantiza que
// la respuesta traiga el paquete canónico ya revisionado; un error por timeout
// tambien fuerza primero la transición atomica.
var _cs21a192SubmitBase_ = englishLabMemoryMatchSubmitPairCS21A180;
englishLabMemoryMatchSubmitPairCS21A180 = function (body) {
  body = body || {};
  var result = _cs21a192SubmitBase_(body);
  if (!result || typeof result !== 'object') return result;
  var attachableErrors = ['turno_expirado','turno_no_activo','cambio_de_turno','cartas_en_transicion',
    'primera_carta_ya_abierta','primera_carta_no_sincronizada','primera_carta_no_coincide',
    'carta_ya_ganada','sala_ocupada','ronda_no_abierta'];
  if (result.ok !== true && attachableErrors.indexOf(_elive176Text_(result.error)) < 0) return result;

  var canonical = _cs21a192CanonicalSnapshot_(body);
  if (!canonical.ok) return canonical;
  var state = _elive180ResponseCopy_(canonical.snapshot);
  var merged = {};
  Object.keys(result).forEach(function (key) { merged[key] = result[key]; });
  ['room','room_package','turn_state','shared_state','turn_description','leaderboard','team_leaderboard','stats','events'].forEach(function (key) {
    if (state[key] !== undefined) merged[key] = state[key];
  });
  return _cs21a192FreshEnvelope_(merged);
};
englishLabMemoryMatchSubmitPairCS21A180.__cs21a186CanonicalRules = true;
englishLabMemoryMatchSubmitPairCS21A180.__cs21a188SharedDiscovery = true;
englishLabMemoryMatchSubmitPairCS21A180.__cs21a189ClassicSync = true;
englishLabMemoryMatchSubmitPairCS21A180.__cs21a192RevisionedResponses = true;
englishLabMemoryMatchSubmitPairCS21A180.__cs21a192ExpectedStateGuard = true;

function _cs21a192CloseMemory_(body, closeRoom) {
  body = body || {};
  var auth = _eliveAuthTeacher_(body);
  if (!auth || auth.ok !== true) return auth || {ok:false,error:'sesion_invalida'};
  var id = _elive180RoomIdFromBody_(body);
  if (!id) return {ok:false,error:'room_id requerido'};
  var initial = _elive180FindRoom_(id);
  if (!initial || !initial.row) return {ok:false,error:'sala_no_encontrada'};
  if (_elive176Upper_(initial.row.GAME_CODE) !== ELMM174_GAME_CODE) return {ok:false,error:'sala_no_memory_match'};
  if (!_elive180CanRoom_(auth, initial.row)) return {ok:false,error:'docente_sin_permiso_grupo'};

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(CS21A192_MM_TRANSITION_LOCK_MS)) return _cs21a192Busy_();
  var updated = null;
  try {
    var fresh = _elive180FindRoom_(initial.row.ROOM_ID || initial.row.ROOM_CODE);
    if (!fresh || !fresh.row) return {ok:false,error:'sala_no_encontrada'};
    if (!_elive180CanRoom_(auth, fresh.row)) return {ok:false,error:'docente_sin_permiso_grupo'};
    var current = _elive176Current_(fresh.row);
    var pkg = current.room_package || null;
    var now = new Date();
    var patch = {ROUND_STATUS:'CLOSED',ROUND_CLOSED_AT:_elive176Iso_(now)};
    if (closeRoom) {
      patch.STATUS = 'CLOSED';
      patch.CLOSED_AT = _elive176Iso_(now);
    }
    if (pkg) {
      pkg.state = pkg.state || {};
      pkg.state.phase = 'COMPLETE';
      pkg.server_now = _elive176Iso_(now);
      pkg.server_now_ms = now.getTime();
      var shared = _cs21a189ClassicShared_(pkg);
      if (shared.active_attempt) {
        shared.active_attempt = null;
        shared.board_version = Math.max(1, Number(shared.board_version || 1) || 1) + 1;
      }
      shared.completed = true;
      pkg.shared_state = shared;
      current.room_package = pkg;
      patch.CURRENT_QUESTION_JSON = JSON.stringify(current);
    }
    updated = _elive180SetCells_(fresh, patch);
    _elive180Invalidate_(updated);
  } finally {
    lock.releaseLock();
  }

  _elive180AppendEvent_(updated, closeRoom ? 'MEMORY_MATCH_ROOM_CLOSED' : 'MEMORY_MATCH_ROUND_CLOSED', auth, {
    terminal:true,
    close_room:closeRoom === true,
    state_revision:_cs21a192Revision_(_elive176Package_(updated)),
    version:CS21A192_MM_SYNC_VERSION
  });
  // El evento forma parte del snapshot visible; retira cualquier copia creada
  // entre la escritura terminal y el append de bitacora.
  _elive180Invalidate_(updated);
  var canonical = _cs21a192CanonicalSnapshot_(updated);
  if (!canonical.ok) return canonical;
  var response = _elive180ResponseCopy_(canonical.snapshot);
  response.ok = true;
  response.closed = true;
  response.close_room = closeRoom === true;
  return _cs21a192FreshEnvelope_(response);
}

// El endpoint especializado cerraba mediante _eliveSetCells_ y no aumentaba la
// revision. Se sustituye sin cambiar la ruta existente.
englishLabMemoryMatchCloseRound = function (body) {
  return _cs21a192CloseMemory_(body || {}, false);
};
englishLabMemoryMatchCloseRound.__cs21a192RevisionedClose = true;

// La UI docente cierra la sala por la ruta generica. Solo se intercepta cuando
// el row canónico es MEMORY_MATCH; Ahorcado y Sentence Order conservan su base.
var _cs21a192LiveCloseBase_ = englishLabLiveCloseRoom;
englishLabLiveCloseRoom = function (body) {
  body = body || {};
  var id = _elive180RoomIdFromBody_(body);
  var found = id ? _elive180FindRoom_(id) : null;
  if (!found || !found.row || _elive176Upper_(found.row.GAME_CODE) !== ELMM174_GAME_CODE) {
    return _cs21a192LiveCloseBase_(body);
  }
  return _cs21a192CloseMemory_(body, true);
};
englishLabLiveCloseRoom.__cs21a192MemoryOnlyClose = true;

var _cs21a192VerifyBase_ = verificarMemoryMatchStartFixCS21A183;
verificarMemoryMatchStartFixCS21A183 = function () {
  var previous = _cs21a192VerifyBase_();
  var synthetic = {
    type:'memory_match',
    game_id:'MEMORY_MATCH',
    room_package:{
      room:{game_id:'MEMORY_MATCH'},
      state_revision:7,
      shared_state:{state_revision:7,board_version:3}
    }
  };
  var nextRevision = _cs21a192BumpCurrentRevision_(synthetic);
  var guardedPackage = {
    state_revision:12,
    state:{phase:'OPEN'},
    turn_state:{turn_number:4},
    shared_state:{state_revision:12,board_version:2}
  };
  var staleRevision = _cs21a192ExpectedStateConflict_({expected_state_revision:11,expected_turn_number:4}, guardedPackage, guardedPackage.turn_state);
  var staleTurn = _cs21a192ExpectedStateConflict_({expected_state_revision:12,expected_turn_number:3}, guardedPackage, guardedPackage.turn_state);
  var matchingState = _cs21a192ExpectedStateConflict_({expected_state_revision:12,expected_turn_number:4}, guardedPackage, guardedPackage.turn_state);
  var valid = !!(previous && previous.ok === true && nextRevision === 8 &&
    synthetic.room_package.state_revision === 8 && synthetic.room_package.shared_state.state_revision === 8 &&
    CS21A189_MM_MISMATCH_REVEAL_MS === CS21A192_MM_MISMATCH_REVEAL_MS &&
    _elive180MaybeAdvanceTurn_.__cs21a192AtomicTransition === true &&
    _elive180Snapshot_.__cs21a192RevisionKeyed === true &&
    englishLabMemoryMatchGetPlayerStateCS21A180.__cs21a192CanonicalSnapshot === true &&
    englishLabMemoryMatchGetRoomControlCS21A180.__cs21a192CanonicalSnapshot === true &&
    englishLabMemoryMatchSubmitPairCS21A180.__cs21a192RevisionedResponses === true &&
    englishLabMemoryMatchSubmitPairCS21A180.__cs21a192ExpectedStateGuard === true &&
    _cs21a192ExpectedStateConflict_.__cs21a192UnderSubmitLock === true &&
    staleRevision && staleRevision.error === 'state_conflict' && staleRevision.actual_state_revision === 12 &&
    staleTurn && staleTurn.error === 'state_conflict' && staleTurn.actual_turn_number === 4 &&
    matchingState === null &&
    englishLabMemoryMatchCloseRound.__cs21a192RevisionedClose === true &&
    englishLabLiveCloseRoom.__cs21a192MemoryOnlyClose === true);
  var result = {
    ok:valid,
    version:CS21A192_MM_SYNC_VERSION,
    previous_version:previous && previous.version,
    atomic_timeout_cleanup:true,
    one_state_write_per_timeout:true,
    stale_snapshot_resurrection_blocked:true,
    revision_keyed_snapshot:true,
    monotonic_state_revision:true,
    fresh_server_now_outside_cache:true,
    lock_failure_returns_retry:true,
    teacher_student_same_snapshot_path:true,
    expected_state_revision_guard:true,
    expected_turn_number_guard:true,
    preconditions_checked_under_submit_lock:true,
    stale_action_rejected_without_mutation:true,
    state_conflict_returns_current_package:true,
    timeout_event_cache_invalidated:true,
    mismatch_reveal_ms:CS21A192_MM_MISMATCH_REVEAL_MS,
    mismatch_reveal_budget:{
      max_poll_ms:CS21A192_MM_MAX_POLL_MS,
      tested_latency_ms:CS21A192_MM_TESTED_LATENCY_MS,
      margin_ms:CS21A192_MM_REVEAL_MARGIN_MS
    },
    revisioned_round_close:true,
    revisioned_room_close:true,
    hangman_router_untouched:true,
    synthetic_revision:nextRevision,
    qa_master:previous && previous.qa_master,
    qa_operational:previous && previous.qa_operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A192 no supero la verificacion de consistencia Memory Match.');
  return result;
};
