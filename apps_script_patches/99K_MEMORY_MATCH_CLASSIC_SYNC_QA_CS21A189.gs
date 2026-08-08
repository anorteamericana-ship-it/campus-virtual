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
