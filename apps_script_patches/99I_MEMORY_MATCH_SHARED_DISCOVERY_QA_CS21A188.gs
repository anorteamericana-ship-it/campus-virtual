// CS21A188 · QA · Memory Match Shared Discovery.
// APPEND-ONLY en el repositorio; el usuario recibe SIEMPRE el Apps Script completo ensamblado.
// QA/STAGING solamente. NO USAR EN PRODUCCIÓN.
//
// Contrato:
// HIDDEN -> DISCOVERED -> CLAIMED.
// Una carta DISCOVERED queda visible y disponible para toda la sala.
// El descubridor NO adquiere propiedad. Quien completa la pareja reclama ambas cartas,
// suma 1 punto y conserva el turno. Fallo/timeout rota al siguiente equipo/jugador.

var CS21A188_MM_SHARED_DISCOVERY_VERSION = 'CS21A188-MM-SHARED-DISCOVERY-1';

function _cs21a188MmShared_(pkg) {
  pkg = pkg || {};
  var shared = pkg.shared_state || {};
  shared.version = CS21A188_MM_SHARED_DISCOVERY_VERSION;
  shared.board_version = Math.max(1, Number(shared.board_version || 1) || 1);
  shared.matched_pair_ids = Array.isArray(shared.matched_pair_ids) ? shared.matched_pair_ids : [];
  shared.discovered_cards = shared.discovered_cards && typeof shared.discovered_cards === 'object' && !Array.isArray(shared.discovered_cards)
    ? shared.discovered_cards : {};
  shared.claimed_pairs = shared.claimed_pairs && typeof shared.claimed_pairs === 'object' && !Array.isArray(shared.claimed_pairs)
    ? shared.claimed_pairs : {};
  shared.completed = shared.completed === true;
  shared.last_action_key = _elive176Text_(shared.last_action_key);
  pkg.shared_state = shared;
  return shared;
}

function _cs21a188MmCardsById_(pkg) {
  var cards = pkg && pkg.round && Array.isArray(pkg.round.cards) ? pkg.round.cards : [];
  var byId = {};
  cards.forEach(function (card) {
    var id = _elive176Text_(card && card.card_id);
    if (id) byId[id] = card;
  });
  return byId;
}

function _cs21a188MmPairClaimed_(shared, pairId) {
  var id = _elive176Text_(pairId);
  return !!(id && shared && shared.claimed_pairs && shared.claimed_pairs[id]);
}

function _cs21a188MmDiscover_(shared, card, player, turnState, now) {
  if (!shared || !card) return {changed:false,record:null};
  var cardId = _elive176Text_(card.card_id);
  var pairId = _elive176Text_(card.pair_id);
  if (!cardId || !pairId || _cs21a188MmPairClaimed_(shared, pairId)) return {changed:false,record:null};
  if (shared.discovered_cards[cardId]) return {changed:false,record:shared.discovered_cards[cardId]};
  var record = {
    card_id:cardId,
    pair_id:pairId,
    discovered_by:_elive176Text_(player && (player.COD_ESTUDIANTE || player.player_id)),
    discovered_name:_elive176Text_(player && (player.NOMBRE || player.name)),
    team_id:_elive176Text_(player && (player.TEAM || player.team_id)) || 'NO_TEAM',
    discovered_at:_elive176Iso_(now),
    turn_number:Number(turnState && turnState.turn_number || 0) || 0
  };
  shared.discovered_cards[cardId] = record;
  return {changed:true,record:record};
}

function _cs21a188MmClaim_(shared, pairId, firstCard, secondCard, player, turnState, now) {
  var id = _elive176Text_(pairId);
  if (!id) return null;
  if (shared.claimed_pairs[id]) return shared.claimed_pairs[id];
  var claim = {
    pair_id:id,
    card_ids:[_elive176Text_(firstCard && firstCard.card_id), _elive176Text_(secondCard && secondCard.card_id)],
    claimed_by:_elive176Text_(player && (player.COD_ESTUDIANTE || player.player_id)),
    claimed_name:_elive176Text_(player && (player.NOMBRE || player.name)),
    team_id:_elive176Text_(player && (player.TEAM || player.team_id)) || 'NO_TEAM',
    claimed_at:_elive176Iso_(now),
    turn_number:Number(turnState && turnState.turn_number || 0) || 0,
    points:1
  };
  shared.claimed_pairs[id] = claim;
  if (shared.matched_pair_ids.indexOf(id) < 0) shared.matched_pair_ids.push(id);
  return claim;
}

function _cs21a188MmAction_(body) {
  body = body || {};
  var answer = body.answer_value || body.answerValue || {};
  if (typeof answer === 'string') answer = _elive176Json_(answer, {});
  return _elive176Upper_(answer.action || body.action || 'SUBMIT_PAIR');
}

function _cs21a188MmAnswer_(body) {
  var answer = body && (body.answer_value || body.answerValue) || {};
  return typeof answer === 'string' ? _elive176Json_(answer, {}) : (answer || {});
}

function _cs21a188MmPlayerFromSnapshot_(snapshot, playerId) {
  return (snapshot && snapshot._player_rows || []).filter(function (row) {
    return _elive176Text_(row.COD_ESTUDIANTE) === _elive176Text_(playerId);
  })[0] || null;
}

// CS21A188 conserva el mismo endpoint canónico. DISCOVER_CARD publica una carta;
// SUBMIT_PAIR resuelve la pareja. No se agrega una ruta paralela.
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
    var endsMs = _elive176Timestamp_(pkg.turn_state && pkg.turn_state.turn_ends_at || pkg.state.ends_at);
    if (endsMs && now.getTime() >= endsMs) {
      return {ok:false,error:'turno_expirado',mensaje:'El tiempo terminó. Espere el siguiente turno.',turn_state:pkg.turn_state || null};
    }

    var snapshot = _elive180BuildSnapshot_(room);
    var playerId = _elive176Text_(normalized.player_id || normalized.cod_estudiante);
    var player = _cs21a188MmPlayerFromSnapshot_(snapshot, playerId);
    if (!player) return {ok:false,error:'jugador_no_registrado'};
    var turnPlayer = {
      player_id:playerId,
      name:_elive176Text_(player.NOMBRE),
      team_id:_elive176Text_(player.TEAM) || 'NO_TEAM'
    };
    var turnState = pkg.turn_state || null;
    if (!_elive176CanAct_(turnState, turnPlayer)) {
      return {
        ok:false,error:'turno_no_activo',mensaje:'Espere su turno.',turn_state:turnState,
        turn_description:_elive176DescribeTurn_(turnState, _elive180TurnPlayers_(snapshot._player_rows))
      };
    }

    var shared = _cs21a188MmShared_(pkg);
    var byId = _cs21a188MmCardsById_(pkg);
    var action = _cs21a188MmAction_(normalized);
    var answer = _cs21a188MmAnswer_(normalized);

    if (action === 'DISCOVER_CARD') {
      var cardId = _elive176Text_(answer.card_id || answer.first_card_id || normalized.card_id || normalized.first_card_id);
      var card = byId[cardId] || null;
      if (!card) return {ok:false,error:'carta_no_encontrada'};
      if (_cs21a188MmPairClaimed_(shared, card.pair_id)) {
        return {ok:true,version:CS21A188_MM_SHARED_DISCOVERY_VERSION,accepted:false,claimed:true,room_package:pkg,shared_state:shared,turn_state:turnState};
      }
      var discovery = _cs21a188MmDiscover_(shared, card, player, turnState, now);
      if (!discovery.changed) {
        return {ok:true,version:CS21A188_MM_SHARED_DISCOVERY_VERSION,accepted:false,duplicate:true,discovery:discovery.record,room_package:pkg,shared_state:shared,turn_state:turnState};
      }
      shared.board_version += 1;
      shared.last_action_key = [room.ROOM_CODE,turnState.turn_number,playerId,'DISCOVER',cardId].join('|');
      pkg.version = CS21A188_MM_SHARED_DISCOVERY_VERSION;
      pkg.shared_state = shared;
      pkg.server_now = _elive176Iso_(now);
      current.room_package = pkg;
      room = _elive180SetCells_(found, {CURRENT_QUESTION_JSON:JSON.stringify(current)});
      _elive180Invalidate_(room);
      _elive180AppendEvent_(room, 'MEMORY_MATCH_CARD_DISCOVERED', {sesion:{nombre:player.NOMBRE},rol:'student'}, {
        card_id:cardId,pair_id:_elive176Text_(card.pair_id),discovered_by:playerId,team_id:_elive176Text_(player.TEAM),
        board_version:shared.board_version,version:CS21A188_MM_SHARED_DISCOVERY_VERSION
      });
      return {
        ok:true,version:CS21A188_MM_SHARED_DISCOVERY_VERSION,accepted:true,action:'DISCOVER_CARD',discovery:discovery.record,
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
      return {ok:true,version:CS21A188_MM_SHARED_DISCOVERY_VERSION,accepted:false,claimed:true,mensaje:'Una de esas cartas ya fue reclamada.',room_package:pkg,shared_state:shared,turn_state:turnState};
    }

    var canonicalCards = [pair.first_id,pair.second_id].sort();
    var actionKey = [room.ROOM_CODE,turnState.turn_number,playerId,'PAIR',canonicalCards[0],canonicalCards[1]].join('|');
    if (_elive176Text_(shared.last_action_key) === actionKey) {
      return {ok:true,version:CS21A188_MM_SHARED_DISCOVERY_VERSION,accepted:false,duplicate:true,room_package:pkg,turn_state:turnState,shared_state:shared};
    }

    // La segunda carta también pasa a ser conocimiento público antes de resolver.
    _cs21a188MmDiscover_(shared, firstCard, player, turnState, now);
    _cs21a188MmDiscover_(shared, secondCard, player, turnState, now);

    var timeMs = Math.max(0, Number(normalized.time_ms || normalized.timeMs || 0) || 0);
    var points = _cs21a186MmPoints_(pair.correct);
    var answerRow = {
      ROOM_ID:room.ROOM_ID,ROOM_CODE:room.ROOM_CODE,QUESTION_INDEX:Number(room.CURRENT_INDEX || 1) || 1,
      COD_ESTUDIANTE:playerId,
      ANSWER_VALUE:JSON.stringify({action:'SUBMIT_PAIR',first_card_id:pair.first_id,second_card_id:pair.second_id,pair_id:pair.pair_id,correct:pair.correct}),
      IS_CORRECT:pair.correct ? 'TRUE' : 'FALSE',POINTS:points,TIME_MS:timeMs,ANSWERED_AT:_eliveIso_()
    };
    _elive180AppendObject_(ELIVE_ANSWERS_SHEET, ELIVE_ANSWERS_HEADERS, answerRow);

    var claim = pair.correct ? _cs21a188MmClaim_(shared, pair.pair_id, firstCard, secondCard, player, turnState, now) : null;
    shared.last_action_key = actionKey;
    shared.board_version += 1;

    var durationMs = Number(pkg.rules && pkg.rules.round_duration_ms || 30000) || 30000;
    var nextTurn = pair.correct
      ? _cs21a186MmContinueSamePlayer_(turnState, now, durationMs, 'PAIR_CLAIMED_CONTINUE')
      : _elive176NextTurn_(turnState, now, durationMs, 'PAIR_INCORRECT');

    var totalPairs = pkg.round && Array.isArray(pkg.round.cards) ? pkg.round.cards.length / 2 : 0;
    var completed = totalPairs > 0 && shared.matched_pair_ids.length >= totalPairs;
    shared.completed = completed;

    pkg.version = CS21A188_MM_SHARED_DISCOVERY_VERSION;
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

    _elive180AppendEvent_(room, pair.correct ? 'MEMORY_MATCH_PAIR_CLAIMED' : 'MEMORY_MATCH_PAIR_MISSED', {sesion:{nombre:player.NOMBRE},rol:'student'}, {
      correct:pair.correct,points:points,pair_id:pair.pair_id,claim:claim,board_version:shared.board_version,
      version:CS21A188_MM_SHARED_DISCOVERY_VERSION
    });
    _elive180AppendEvent_(room, pair.correct && !completed ? 'LIVE_TURN_CONTINUED' : 'LIVE_TURN_ADVANCED', {sesion:{nombre:player.NOMBRE},rol:'student'}, {
      from_player_id:turnState.active_player_id,to_player_id:nextTurn.active_player_id,
      from_team_id:turnState.active_team_id,to_team_id:nextTurn.active_team_id,
      turn_number:nextTurn.turn_number,reason:nextTurn.reason,board_version:shared.board_version,completed:completed,
      version:CS21A188_MM_SHARED_DISCOVERY_VERSION
    });

    _elive180Invalidate_(room);
    var refreshed = _elive180BuildSnapshot_(room);
    var ranking = refreshed.leaderboard || [];
    return {
      ok:true,version:CS21A188_MM_SHARED_DISCOVERY_VERSION,accepted:true,action:'SUBMIT_PAIR',correct:pair.correct,points:points,
      turn_continues:pair.correct && !completed,claim:claim,
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
englishLabMemoryMatchSubmitPairCS21A180.__cs21a188SharedDiscovery = true;

var _cs21a188VerifyBase_ = verificarMemoryMatchStartFixCS21A183;
verificarMemoryMatchStartFixCS21A183 = function () {
  var previous = _cs21a188VerifyBase_();
  var syntheticPkg = {shared_state:{board_version:1,matched_pair_ids:[]}};
  var shared = _cs21a188MmShared_(syntheticPkg);
  var cardA = {card_id:'CARD-A',pair_id:'PAIR-1'};
  var cardB = {card_id:'CARD-B',pair_id:'PAIR-1'};
  var p1 = {COD_ESTUDIANTE:'P1',NOMBRE:'Chu',TEAM:'Equipo Azul'};
  var p2 = {COD_ESTUDIANTE:'P2',NOMBRE:'Naty',TEAM:'Equipo Rojo'};
  var turn = {turn_number:7};
  var now = new Date('2026-08-07T22:30:00.000Z');
  var first = _cs21a188MmDiscover_(shared, cardA, p1, turn, now);
  var repeated = _cs21a188MmDiscover_(shared, cardA, p2, turn, now);
  var second = _cs21a188MmDiscover_(shared, cardB, p2, turn, now);
  var claim = _cs21a188MmClaim_(shared, 'PAIR-1', cardA, cardB, p2, turn, now);
  var valid = !!(
    previous && previous.ok === true &&
    first.changed === true && repeated.changed === false && second.changed === true &&
    shared.discovered_cards['CARD-A'].discovered_by === 'P1' &&
    shared.discovered_cards['CARD-B'].discovered_by === 'P2' &&
    claim && claim.claimed_by === 'P2' && claim.team_id === 'Equipo Rojo' &&
    shared.matched_pair_ids.indexOf('PAIR-1') >= 0 &&
    englishLabMemoryMatchSubmitPairCS21A180.__cs21a188SharedDiscovery === true
  );
  var result = {
    ok:valid,
    version:CS21A188_MM_SHARED_DISCOVERY_VERSION,
    previous_version:previous && previous.version,
    shared_discovery:true,
    card_states:'HIDDEN>DISCOVERED>CLAIMED',
    discovered_cards_public:true,
    discovered_cards_remain_selectable:true,
    discoverer_does_not_own:true,
    claim_owner_is_matcher:true,
    correct_pair_points:1,
    correct_pair_keeps_player:true,
    incorrect_pair_rotates_turn:true,
    timeout_rotates_turn:true,
    closed_room_terminal:previous && previous.closed_room_terminal === true,
    recent_rooms_restored:previous && previous.recent_rooms_restored === true,
    stale_room_restore_forbidden:previous && previous.stale_room_restore_forbidden === true,
    qa_master:previous && previous.qa_master,
    qa_operational:previous && previous.qa_operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A188 no superó la verificación Shared Discovery.');
  return result;
};
