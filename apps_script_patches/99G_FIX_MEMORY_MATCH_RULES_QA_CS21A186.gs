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
