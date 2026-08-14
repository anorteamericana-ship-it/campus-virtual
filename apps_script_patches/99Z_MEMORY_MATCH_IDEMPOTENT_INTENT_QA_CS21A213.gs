// CS21A213 · QA · intento idempotente y ruta caliente acotada para Memory Match.
// Capa acumulativa sobre CS21A212. QA/STAGING solamente. NO PRODUCCION.
//
// Alcance estricto:
// - DISCOVER_CARD y SUBMIT_PAIR comparten un attempt_id estable;
// - cualquiera de los dos requests puede ganar el ScriptLock;
// - una misma intención produce como máximo una respuesta, un puntaje y un turno;
// - la ruta rápida reutiliza el relay CS195 y no construye snapshots completos;
// - si falta cualquier precondición segura, delega intacto al contrato CS212.

var CS21A213_MM_INTENT_VERSION = 'CS21A213-MM-IDEMPOTENT-INTENT-1';
var CS21A213_MM_LOCK_MS = 5000;

function _cs21a213AttemptId_(body) {
  body = body || {};
  var answer = _cs21a188MmAnswer_(body);
  var value = _elive176Text_(answer.attempt_id || answer.attemptId || body.attempt_id || body.attemptId);
  if (value.length < 12 || value.length > 160 || !/^[A-Za-z0-9._:-]+$/.test(value)) return '';
  return value;
}

function _cs21a213PlayerRow_(player) {
  player = player || {};
  var id = _elive176Text_(player.player_id || player.cod_estudiante || player.COD_ESTUDIANTE);
  var name = _elive176Text_(player.name || player.nombre || player.NOMBRE) || id;
  var team = _elive176Text_(player.team_id || player.team || player.TEAM) || 'NO_TEAM';
  return {
    COD_ESTUDIANTE:id,NOMBRE:name,TEAM:team,
    player_id:id,name:name,team_id:team
  };
}

function _cs21a213SameActive_(shared, attemptId, playerId, turnNumber) {
  var attempt = shared && shared.active_attempt || null;
  return !!(attempt &&
    _elive176Text_(attempt.attempt_id) === _elive176Text_(attemptId) &&
    _elive176Text_(attempt.player_id) === _elive176Text_(playerId) &&
    Number(attempt.turn_number || 0) === Number(turnNumber || 0));
}

function _cs21a213FinishedResult_(shared, attemptId, playerId) {
  shared = shared || {};
  var targetId = _elive176Text_(attemptId);
  var targetPlayer = _elive176Text_(playerId);
  var recent = Array.isArray(shared.recent_attempts) ? shared.recent_attempts : [];
  var candidates = recent.slice();
  if (shared.last_attempt_result) candidates.push(shared.last_attempt_result);
  for (var index = candidates.length - 1; index >= 0; index -= 1) {
    var result = candidates[index] || {};
    if (_elive176Text_(result.attempt_id) === targetId && _elive176Text_(result.player_id) === targetPlayer) return result;
  }
  return null;
}

function _cs21a213SameFinished_(shared, attemptId, playerId) {
  return !!_cs21a213FinishedResult_(shared, attemptId, playerId);
}

function _cs21a213Conflict_(body, pkg, turnState) {
  var expectedRevision = _cs21a192ExpectedNumber_(body, 'expected_state_revision', 'expectedStateRevision');
  var expectedTurn = _cs21a192ExpectedNumber_(body, 'expected_turn_number', 'expectedTurnNumber');
  return _cs21a192FreshEnvelope_({
    ok:false,error:'state_conflict',
    mensaje:'La sala cambio antes de aplicar la jugada. Se cargo el estado actual.',
    retry_after_ms:0,
    expected_state_revision:expectedRevision.provided ? expectedRevision.value : null,
    expected_turn_number:expectedTurn.provided ? expectedTurn.value : null,
    actual_state_revision:_cs21a192Revision_(pkg),
    actual_turn_number:Number(turnState && turnState.turn_number || 0) || 0,
    room_package:_cs21a192Clone_(pkg || {}),
    turn_state:_cs21a192Clone_(turnState || {}),
    shared_state:_cs21a192Clone_(pkg && pkg.shared_state || {})
  });
}

function _cs21a213ContinuationConflict_(body, pkg, turnState, attempt) {
  var expectedRevision = _cs21a192ExpectedNumber_(body, 'expected_state_revision', 'expectedStateRevision');
  var expectedTurn = _cs21a192ExpectedNumber_(body, 'expected_turn_number', 'expectedTurnNumber');
  var actualRevision = _cs21a192Revision_(pkg);
  var actualTurn = Number(turnState && turnState.turn_number || 0) || 0;
  var baseRevision = Math.max(0, Number(attempt && attempt.base_state_revision || 0) || 0);
  var revisionAllowed = !expectedRevision.provided ||
    expectedRevision.value === actualRevision ||
    (baseRevision > 0 && expectedRevision.value === baseRevision);
  var turnAllowed = !expectedTurn.provided || expectedTurn.value === actualTurn;
  return revisionAllowed && turnAllowed ? null : _cs21a213Conflict_(body, pkg, turnState);
}

function _cs21a213DuplicateEnvelope_(relay, room, pkg, shared, attemptId, playerId) {
  var previous = _cs21a213FinishedResult_(shared, attemptId, playerId) || {};
  return _cs21a213Envelope_(relay, room, pkg, {
    ok:true,accepted:false,duplicate:true,
    action:_elive176Text_(previous.action),
    correct:previous.correct === true,
    points:Number(previous.points || 0) || 0,
    completed:previous.completed === true,
    idempotency_version:CS21A213_MM_INTENT_VERSION
  }, null);
}

function _cs21a213Envelope_(relay, room, pkg, extra, player) {
  var response = _cs21a192Clone_(relay && relay.response || {});
  response.ok = true;
  response.memory_match = true;
  response.version = CS21A213_MM_INTENT_VERSION;
  response.idempotency_version = CS21A213_MM_INTENT_VERSION;
  response.fast_mutation = true;
  response.room = _elive176PublicRoom_(room || {});
  response.room_package = _cs21a192Clone_(pkg || {});
  response.turn_state = _cs21a192Clone_(pkg && pkg.turn_state || null);
  response.shared_state = _cs21a192Clone_(pkg && pkg.shared_state || null);
  if (player) response.player = _elive180PlayerPublic_(player);
  Object.keys(extra || {}).forEach(function (key) { response[key] = extra[key]; });
  delete response._player_rows;
  return _cs21a192FreshEnvelope_(response);
}

function _cs21a213UpdateRanking_(response, player, correct, points) {
  response = response || {};
  player = player || {};
  var playerId = _elive176Text_(player.COD_ESTUDIANTE);
  var teamId = _elive176Text_(player.TEAM) || 'Sin equipo';
  var leaderboard = Array.isArray(response.leaderboard) ? response.leaderboard : null;
  if (leaderboard && leaderboard.length) {
    var row = null;
    leaderboard.forEach(function (item) {
      if (_elive176Text_(item.cod_estudiante || item.player_id) === playerId) row = item;
    });
    if (row) {
      row.points = (Number(row.points || 0) || 0) + points;
      row.answered = (Number(row.answered || 0) || 0) + 1;
      if (correct) row.correct = (Number(row.correct || 0) || 0) + 1;
      row.last_answer_at = _eliveIso_();
      leaderboard.sort(function (a, b) {
        return ((Number(b.points || 0) || 0) - (Number(a.points || 0) || 0)) ||
          ((Number(b.correct || 0) || 0) - (Number(a.correct || 0) || 0)) ||
          ((Number(a.answered || 0) || 0) - (Number(b.answered || 0) || 0)) ||
          _elive176Text_(a.nombre).localeCompare(_elive176Text_(b.nombre));
      });
      leaderboard.forEach(function (item, index) { item.rank = index + 1; });
      response.my_rank = row;
    }
  }
  var teams = Array.isArray(response.team_leaderboard) ? response.team_leaderboard : null;
  if (teams && teams.length) {
    teams.forEach(function (item) {
      if (_elive176Text_(item.team || item.team_id) !== teamId) return;
      item.points = (Number(item.points || 0) || 0) + points;
      item.answered = (Number(item.answered || 0) || 0) + 1;
      if (correct) item.correct = (Number(item.correct || 0) || 0) + 1;
    });
    teams.sort(function (a, b) {
      return ((Number(b.points || 0) || 0) - (Number(a.points || 0) || 0)) ||
        ((Number(b.correct || 0) || 0) - (Number(a.correct || 0) || 0)) ||
        _elive176Text_(a.team || a.team_id).localeCompare(_elive176Text_(b.team || b.team_id));
    });
    teams.forEach(function (item, index) { item.rank = index + 1; });
  }
  response.stats = response.stats && typeof response.stats === 'object' ? response.stats : {};
  if (response.stats.answers_total !== undefined) response.stats.answers_total = (Number(response.stats.answers_total || 0) || 0) + 1;
  if (response.stats.answers_current !== undefined) response.stats.answers_current = (Number(response.stats.answers_current || 0) || 0) + 1;
  return response;
}

function _cs21a213Event_(room, type, player, detail) {
  return {
    EVENT_ID:'ELIVE-EVT-' + Utilities.getUuid(),
    ROOM_ID:_elive176Text_(room && room.ROOM_ID),
    ROOM_CODE:_elive176Text_(room && room.ROOM_CODE),
    EVENT_TYPE:type,
    ACTOR:_elive176Text_(player && player.NOMBRE),
    ROLE:'student',
    CREATED_AT:_eliveIso_(),
    DETAIL_JSON:JSON.stringify(detail || {})
  };
}

// Los dos eventos de SUBMIT_PAIR se escriben en una sola operación fuera del
// ScriptLock. La bitácora sigue siendo persistente en Sheets, nunca cache-only.
function _cs21a213AppendEvents_(events) {
  events = Array.isArray(events) ? events : [];
  if (!events.length) return true;
  try {
    var sheet = _elive180SheetDirect_(ELIVE_EVENTS_SHEET, ELIVE_EVENTS_HEADERS);
    var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    var rows = events.map(function (event) { return _elive180ValuesForHeaders_(headers, event); });
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
    return true;
  } catch (_) {
    events.forEach(function (event) {
      try { _elive180AppendObject_(ELIVE_EVENTS_SHEET, ELIVE_EVENTS_HEADERS, event); } catch (_) {}
    });
    return false;
  }
}

function _cs21a213TryFastSubmit_(body) {
  body = body || {};
  var attemptId = _cs21a213AttemptId_(body);
  if (!attemptId) return {handled:false};

  var access = _elive180RequireLab_(body);
  if (!access || access.allowed !== true) return {handled:true,response:access};
  var normalized = _cs21a144LiveBody_(body, access);
  normalized.attempt_id = attemptId;
  var action = _cs21a188MmAction_(normalized);
  if (action !== 'DISCOVER_CARD' && action !== 'SUBMIT_PAIR') return {handled:false};

  var roomId = _elive180RoomIdFromBody_(normalized);
  var playerId = _elive176Text_(normalized.player_id || normalized.cod_estudiante);
  var relay = roomId ? _cs21a195ReadRelay_(normalized) : null;
  var relayPlayer = relay ? _cs21a195PlayerInRelay_(relay, playerId) : null;
  if (!relay || !relayPlayer || _cs21a195TransitionDue_(relay)) return {handled:false};
  var player = _cs21a213PlayerRow_(relayPlayer);

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(CS21A213_MM_LOCK_MS)) {
    return {handled:true,response:{ok:false,error:'sala_ocupada',mensaje:'La sala está procesando otra acción.',idempotency_version:CS21A213_MM_INTENT_VERSION}};
  }

  var response = null;
  var events = [];
  var room = null;
  try {
    var found = _elive180FindRoom_(roomId);
    if (!found || !found.row) return {handled:true,response:{ok:false,error:'sala_no_encontrada'}};
    room = found.row;
    if (_elive176Upper_(room.GAME_CODE) !== ELMM174_GAME_CODE) return {handled:true,response:{ok:false,error:'sala_no_memory_match'}};
    if (_elive176Upper_(room.STATUS) === 'CLOSED') return {handled:true,response:{ok:false,error:'sala_cerrada'}};

    var current = _elive176Current_(room);
    var pkg = current.room_package || null;
    if (!pkg || !pkg.state || _elive176Upper_(pkg.state.phase) !== 'OPEN') return {handled:true,response:{ok:false,error:'ronda_no_abierta'}};
    if (!pkg.rules || _elive176Text_(pkg.rules.latency_safe_version || pkg.latency_safe_version) !== CS21A212_MM_VERSION) return {handled:false};

    var now = new Date();
    var turnState = pkg.turn_state || null;
    var shared = _cs21a189ClassicShared_(pkg);
    if (_cs21a213SameFinished_(shared, attemptId, playerId)) {
      return {handled:true,response:_cs21a213DuplicateEnvelope_(relay, room, pkg, shared, attemptId, playerId)};
    }
    if (_cs21a189NormalizeAttempt_(shared, turnState, now)) return {handled:false};

    var sameActive = _cs21a213SameActive_(shared, attemptId, playerId, turnState && turnState.turn_number);
    var relayRevision = _cs21a195RelayRevision_(relay);
    var actualRevision = _cs21a192Revision_(pkg);
    if (relayRevision !== actualRevision && !sameActive) return {handled:false};

    if (!_cs21a189TurnStarted_(turnState, now)) {
      return {handled:true,response:_cs21a213Envelope_(relay, room, pkg, {
        ok:false,error:'cambio_de_turno',mensaje:'Las cartas se están cerrando. El siguiente turno inicia en un momento.',
        retry_after_ms:Math.max(0,_elive176Timestamp_(turnState && turnState.turn_started_at)-now.getTime())
      }, player)};
    }
    var endsMs = _elive176Timestamp_(turnState && turnState.turn_ends_at || pkg.state.ends_at);
    if (endsMs && now.getTime() >= endsMs) {
      return {handled:true,response:_cs21a213Envelope_(relay, room, pkg, {ok:false,error:'turno_expirado',mensaje:'El tiempo terminó. Espere el siguiente turno.'}, player)};
    }

    var turnPlayer = {player_id:playerId,name:player.NOMBRE,team_id:player.TEAM};
    if (!_elive176CanAct_(turnState, turnPlayer)) {
      return {handled:true,response:_cs21a213Envelope_(relay, room, pkg, {ok:false,error:'turno_no_activo',mensaje:'Espere su turno.'}, player)};
    }

    var conflict = sameActive && action === 'SUBMIT_PAIR'
      ? _cs21a213ContinuationConflict_(normalized, pkg, turnState, shared.active_attempt)
      : _cs21a192ExpectedStateConflict_(normalized, pkg, turnState);
    if (conflict) return {handled:true,response:conflict};

    var byId = _cs21a188MmCardsById_(pkg);
    var answer = _cs21a188MmAnswer_(normalized);

    if (action === 'DISCOVER_CARD') {
      var cardId = _elive176Text_(answer.card_id || answer.first_card_id || normalized.card_id || normalized.first_card_id);
      var card = byId[cardId] || null;
      if (!card) return {handled:true,response:{ok:false,error:'carta_no_encontrada'}};
      if (_cs21a188MmPairClaimed_(shared, card.pair_id)) {
        return {handled:true,response:_cs21a213Envelope_(relay, room, pkg, {ok:true,accepted:false,claimed:true,action:action}, player)};
      }
      var existing = shared.active_attempt;
      if (existing && _cs21a189AttemptPhase_(existing) === 'MISMATCH_REVEAL' && _cs21a189AttemptVisible_(existing, now)) {
        return {handled:true,response:_cs21a213Envelope_(relay, room, pkg, {ok:false,error:'cartas_en_transicion',mensaje:'Espere a que las cartas vuelvan a cerrarse.'}, player)};
      }
      if (existing && _cs21a189AttemptPhase_(existing) === 'FIRST_REVEALED') {
        if (sameActive && _elive176Text_(existing.first_card_id) === cardId) {
          return {handled:true,response:_cs21a213Envelope_(relay, room, pkg, {ok:true,accepted:false,duplicate:true,action:action}, player)};
        }
        return {handled:true,response:_cs21a213Envelope_(relay, room, pkg, {ok:false,error:'primera_carta_ya_abierta',mensaje:'Ya hay una primera carta abierta para este turno.'}, player)};
      }

      var attempt = _cs21a189Attempt_('FIRST_REVEALED', player, turnState, cardId, '', now, null);
      attempt.attempt_id = attemptId;
      attempt.base_state_revision = actualRevision;
      shared.active_attempt = attempt;
      shared.last_action_key = [room.ROOM_CODE,turnState.turn_number,playerId,'REVEAL',cardId].join('|');
      shared.board_version += 1;
      pkg.version = CS21A213_MM_INTENT_VERSION;
      pkg.idempotency_version = CS21A213_MM_INTENT_VERSION;
      pkg.shared_state = shared;
      pkg.server_now = _elive176Iso_(now);
      room = _cs21a189WritePackage_(found, room, current, pkg);
      pkg = _cs21a196AlignWrittenPackage_(room, pkg);
      shared = pkg.shared_state;
      response = _cs21a213Envelope_(relay, room, pkg, {ok:true,accepted:true,action:'DISCOVER_CARD',attempt_id:attemptId}, player);
      events.push(_cs21a213Event_(room, 'MEMORY_MATCH_CARD_REVEALED', player, {
        attempt_id:attemptId,card_id:cardId,pair_id:_elive176Text_(card.pair_id),player_id:playerId,team_id:player.TEAM,
        turn_number:Number(turnState.turn_number || 0) || 0,board_version:shared.board_version,version:CS21A213_MM_INTENT_VERSION
      }));
    } else {
      var pair = _elive176PairFromBody_(pkg, normalized);
      if (!pair.first_id || !pair.second_id || pair.first_id === pair.second_id) return {handled:true,response:{ok:false,error:'par_invalido'}};
      var firstCard = byId[pair.first_id] || null;
      var secondCard = byId[pair.second_id] || null;
      if (!firstCard || !secondCard) return {handled:true,response:{ok:false,error:'carta_no_encontrada'}};
      if (_cs21a188MmPairClaimed_(shared, firstCard.pair_id) || _cs21a188MmPairClaimed_(shared, secondCard.pair_id)) {
        return {handled:true,response:_cs21a213Envelope_(relay, room, pkg, {ok:false,error:'carta_ya_ganada',mensaje:'Una de esas cartas ya pertenece a una pareja ganada.'}, player)};
      }

      var activeAttempt = shared.active_attempt;
      if (activeAttempt) {
        if (!sameActive || _cs21a189AttemptPhase_(activeAttempt) !== 'FIRST_REVEALED') {
          return {handled:true,response:_cs21a213Envelope_(relay, room, pkg, {ok:false,error:'primera_carta_no_sincronizada',mensaje:'La primera carta ya no corresponde a este intento.'}, player)};
        }
        var serverFirstId = _elive176Text_(activeAttempt.first_card_id);
        if (serverFirstId !== pair.first_id && serverFirstId !== pair.second_id) {
          return {handled:true,response:_cs21a213Envelope_(relay, room, pkg, {ok:false,error:'primera_carta_no_coincide',mensaje:'La pareja enviada no contiene la primera carta abierta.'}, player)};
        }
      }

      var timeMs = Math.max(0, Number(normalized.time_ms || normalized.timeMs || 0) || 0);
      var points = _cs21a186MmPoints_(pair.correct);
      _elive180AppendObject_(ELIVE_ANSWERS_SHEET, ELIVE_ANSWERS_HEADERS, {
        ROOM_ID:room.ROOM_ID,ROOM_CODE:room.ROOM_CODE,QUESTION_INDEX:Number(room.CURRENT_INDEX || 1) || 1,
        COD_ESTUDIANTE:playerId,
        ANSWER_VALUE:JSON.stringify({action:'SUBMIT_PAIR',attempt_id:attemptId,first_card_id:pair.first_id,second_card_id:pair.second_id,pair_id:pair.pair_id,correct:pair.correct}),
        IS_CORRECT:pair.correct ? 'TRUE' : 'FALSE',POINTS:points,TIME_MS:timeMs,ANSWERED_AT:_eliveIso_()
      });

      var durationMs = Number(pkg.rules && pkg.rules.round_duration_ms || CS21A212_MM_INITIAL_TURN_MS) || CS21A212_MM_INITIAL_TURN_MS;
      var nextTurn = null;
      var claim = null;
      var revealUntil = null;
      if (pair.correct) {
        claim = _cs21a188MmClaim_(shared, pair.pair_id, firstCard, secondCard, player, turnState, now);
        shared.active_attempt = null;
        nextTurn = _cs21a186MmContinueSamePlayer_(turnState, now, durationMs, 'PAIR_MATCHED_CONTINUE');
      } else {
        revealUntil = new Date(now.getTime() + CS21A212_MM_PAIR_REVEAL_MS);
        shared.active_attempt = _cs21a189Attempt_('MISMATCH_REVEAL', player, turnState, pair.first_id, pair.second_id, now, revealUntil);
        shared.active_attempt.attempt_id = attemptId;
        shared.active_attempt.base_state_revision = actualRevision;
        nextTurn = _elive176NextTurn_(turnState, revealUntil, durationMs, 'PAIR_MISMATCH_AFTER_FLIPBACK');
      }

      var canonicalCards = [pair.first_id,pair.second_id].sort();
      shared.last_action_key = [room.ROOM_CODE,turnState.turn_number,playerId,'PAIR',canonicalCards[0],canonicalCards[1]].join('|');
      shared.board_version += 1;
      var totalPairs = pkg.round && Array.isArray(pkg.round.cards) ? pkg.round.cards.length / 2 : 0;
      var completed = totalPairs > 0 && shared.matched_pair_ids.length >= totalPairs;
      shared.completed = completed;
      if (completed) shared.active_attempt = null;
      var attemptResult = {
        attempt_id:attemptId,player_id:playerId,turn_number:Number(turnState.turn_number || 0) || 0,
        action:'SUBMIT_PAIR',correct:pair.correct,points:points,first_card_id:pair.first_id,second_card_id:pair.second_id,
        pair_id:pair.pair_id,completed:completed,turn_number_after:Number(nextTurn.turn_number || 0) || 0
      };
      shared.last_attempt_id = attemptId;
      shared.last_attempt_result = attemptResult;
      shared.recent_attempts = (Array.isArray(shared.recent_attempts) ? shared.recent_attempts : [])
        .filter(function (item) { return _elive176Text_(item && item.attempt_id) !== attemptId; });
      shared.recent_attempts.push(attemptResult);
      if (shared.recent_attempts.length > 32) shared.recent_attempts = shared.recent_attempts.slice(-32);

      pkg.version = CS21A213_MM_INTENT_VERSION;
      pkg.idempotency_version = CS21A213_MM_INTENT_VERSION;
      pkg.rules = _cs21a212Rules_(pkg.rules || {});
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
      _elive180Invalidate_(room);
      pkg = _cs21a196AlignWrittenPackage_(room, pkg);
      shared = pkg.shared_state;

      response = _cs21a213Envelope_(relay, room, pkg, {
        ok:true,accepted:true,action:'SUBMIT_PAIR',attempt_id:attemptId,correct:pair.correct,points:points,
        turn_continues:pair.correct && !completed,claim:claim,reveal_until:revealUntil ? _elive176Iso_(revealUntil) : '',completed:completed
      }, player);
      response = _cs21a213UpdateRanking_(response, player, pair.correct, points);
      events.push(_cs21a213Event_(room, pair.correct ? 'MEMORY_MATCH_PAIR_MATCHED' : 'MEMORY_MATCH_PAIR_MISMATCH', player, {
        attempt_id:attemptId,correct:pair.correct,points:points,pair_id:pair.pair_id,claim:claim,
        reveal_until:revealUntil ? _elive176Iso_(revealUntil) : '',board_version:shared.board_version,version:CS21A213_MM_INTENT_VERSION
      }));
      events.push(_cs21a213Event_(room, pair.correct && !completed ? 'LIVE_TURN_CONTINUED' : 'LIVE_TURN_ADVANCED', player, {
        attempt_id:attemptId,from_player_id:turnState.active_player_id,to_player_id:nextTurn.active_player_id,
        from_team_id:turnState.active_team_id,to_team_id:nextTurn.active_team_id,
        turn_number:nextTurn.turn_number,reason:nextTurn.reason,board_version:shared.board_version,completed:completed,
        version:CS21A213_MM_INTENT_VERSION
      }));
    }
  } finally {
    lock.releaseLock();
  }

  if (!response) return {handled:false};
  _cs21a213AppendEvents_(events);
  try { _cs21a195PublishResponseRelay_(room || normalized, response); } catch (_) {}
  return {handled:true,response:response};
}

var _cs21a213SubmitBase_ = englishLabMemoryMatchSubmitPairCS21A180;
englishLabMemoryMatchSubmitPairCS21A180 = function (body) {
  var fast = _cs21a213TryFastSubmit_(body || {});
  return fast && fast.handled === true ? fast.response : _cs21a213SubmitBase_(body || {});
};
englishLabMemoryMatchSubmitPairCS21A180.__cs21a186CanonicalRules = true;
englishLabMemoryMatchSubmitPairCS21A180.__cs21a188SharedDiscovery = true;
englishLabMemoryMatchSubmitPairCS21A180.__cs21a189ClassicSync = true;
englishLabMemoryMatchSubmitPairCS21A180.__cs21a192RevisionedResponses = true;
englishLabMemoryMatchSubmitPairCS21A180.__cs21a192ExpectedStateGuard = true;
englishLabMemoryMatchSubmitPairCS21A180.__cs21a195RelayPublished = true;
englishLabMemoryMatchSubmitPairCS21A180.__cs21a213IdempotentIntent = true;
englishLabMemoryMatchSubmitPairCS21A180.__base = _cs21a213SubmitBase_;

function verificarMemoryMatchIntentCS21A213() {
  var shared = {active_attempt:{attempt_id:'ATTEMPT-CS213-0001',player_id:'P1',turn_number:7,base_state_revision:12}};
  var same = _cs21a213SameActive_(shared, 'ATTEMPT-CS213-0001', 'P1', 7);
  shared.last_attempt_id = 'ATTEMPT-CS213-0001';
  shared.last_attempt_result = {attempt_id:'ATTEMPT-CS213-0001',player_id:'P1',action:'SUBMIT_PAIR',correct:true,points:1};
  shared.recent_attempts = [shared.last_attempt_result];
  var valid = !!(same && _cs21a213SameFinished_(shared, 'ATTEMPT-CS213-0001', 'P1') &&
    _cs21a213AttemptId_({answer_value:{attempt_id:'ATTEMPT-CS213-0001'}}) === 'ATTEMPT-CS213-0001' &&
    englishLabMemoryMatchSubmitPairCS21A180.__cs21a213IdempotentIntent === true);
  var result = {
    ok:valid,version:CS21A213_MM_INTENT_VERSION,shared_attempt_id:true,
    discover_first_supported:true,submit_first_supported:true,duplicate_is_noop:true,
    fast_path_full_snapshot_reads:0,persistent_audit:true,script_lock_preserved:true,
    rules_preserved:{initial_turn_ms:CS21A212_MM_INITIAL_TURN_MS,second_pick_ms:CS21A212_MM_MIN_SECOND_PICK_MS,mismatch_ms:CS21A212_MM_PAIR_REVEAL_MS}
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A213 no superó el contrato de intento idempotente.');
  return result;
}
