/** English LAB LIVE v2 · authoritative getState projection and timed canonicalization. */
function ELV2_createStateService(deps) {
  if (!deps || !deps.store || !deps.clock || !deps.concurrencyGuard) {
    throw new Error('ELV2_STATE_SERVICE_DEPS_INVALID');
  }

  var allowTestOnlyGames = deps.allowTestOnlyGames === true;

  function resolveViewer_(actor, room, requestedMode) {
    ELV2_assertCapability(actor, ELV2_CAPABILITY.LIVE_VIEW);
    var mode = requestedMode || (actor.role === 'student' ? ELV2_VIEW_MODE.STUDENT : ELV2_VIEW_MODE.CONTROLLER);

    if (actor.role === 'student') {
      if (mode !== ELV2_VIEW_MODE.STUDENT) throw new Error('ELV2_FORBIDDEN:view_mode');
      var player = deps.store.getPlayerByRoomStudent(room.room_id, actor.student_id);
      if (!player) throw new Error('ELV2_FORBIDDEN:player_not_joined');
      return { mode: mode, player: player };
    }

    if (mode !== ELV2_VIEW_MODE.CONTROLLER && mode !== ELV2_VIEW_MODE.PROJECTOR) {
      throw new Error('ELV2_FORBIDDEN:view_mode');
    }
    ELV2_assertRoomController(actor, room);
    return { mode: mode, player: null };
  }

  function projectTimedCanonicalization_(room, round, now) {
    if (!round) return { room: room, round: null, changed: false, persisted: true };
    var plan = ELV2_planTimedRoundCanonicalization(round, now, {});
    if (plan.transitions.length === 0) return { room: room, round: round, changed: false, persisted: true };

    var projectedRoom = JSON.parse(JSON.stringify(room));
    var projectedRound = JSON.parse(JSON.stringify(round));
    plan.transitions.forEach(function (nextStatus) {
      ELV2_assertRoundTransition(projectedRound.status, nextStatus);
      projectedRound.status = nextStatus;
      if (nextStatus === ELV2_ROUND_STATUS.LOCKED) projectedRound.locked_at = now;
      if (nextStatus === ELV2_ROUND_STATUS.CLOSED) {
        projectedRound.closed_at = now;
        projectedRound.close_reason = 'REVEAL_DEADLINE';
        projectedRoom.current_round_id = null;
      }
    });
    projectedRound.updated_at = now;
    projectedRoom.state_revision = ELV2_nextRevision(projectedRoom.state_revision);
    projectedRoom.updated_at = now;
    return { room: projectedRoom, round: projectedRound, changed: true, persisted: false };
  }

  function applyTimedCanonicalization_(room, round) {
    if (!round) return { room: room, round: null, changed: false, persisted: true };
    var now = deps.clock.nowMs();
    var plan = ELV2_planTimedRoundCanonicalization(round, now, {});
    if (plan.transitions.length === 0) return { room: room, round: round, changed: false, persisted: true };

    try {
      return deps.concurrencyGuard.withRoomMutation(room.room_id, function () {
        var currentRoom = deps.store.getRoom(room.room_id);
        if (!currentRoom) throw new Error('ELV2_ROOM_NOT_AVAILABLE');
        if (!currentRoom.current_round_id) return { room: currentRoom, round: null, changed: false, persisted: true };
        var currentRound = deps.store.getRound(currentRoom.current_round_id);
        if (!currentRound || currentRound.room_id !== currentRoom.room_id) throw new Error('ELV2_STATE_INTEGRITY_FAILED');

        var currentNow = deps.clock.nowMs();
        var currentPlan = ELV2_planTimedRoundCanonicalization(currentRound, currentNow, {});
        if (currentPlan.transitions.length === 0) return { room: currentRoom, round: currentRound, changed: false, persisted: true };

        currentPlan.transitions.forEach(function (nextStatus) {
          ELV2_assertRoundTransition(currentRound.status, nextStatus);
          currentRound.status = nextStatus;
          if (nextStatus === ELV2_ROUND_STATUS.LOCKED) currentRound.locked_at = currentNow;
          if (nextStatus === ELV2_ROUND_STATUS.CLOSED) {
            currentRound.closed_at = currentNow;
            currentRound.close_reason = 'REVEAL_DEADLINE';
            currentRoom.current_round_id = null;
          }
        });
        currentRound.updated_at = currentNow;
        currentRound = deps.store.updateRound(currentRound);
        currentRoom.state_revision = ELV2_nextRevision(currentRoom.state_revision);
        currentRoom.updated_at = currentNow;
        currentRoom = deps.store.updateRoom(currentRoom);
        return { room: currentRoom, round: currentRound, changed: true, persisted: true };
      });
    } catch (error) {
      if (!error || String(error.message) !== 'ELV2_BUSY_RETRY') throw error;
      return projectTimedCanonicalization_(room, round, now);
    }
  }

  function leaderboard_(roomId) {
    var players = deps.store.listPlayersByRoom(roomId).filter(function (player) {
      return player.status === 'ACTIVE';
    });
    players.sort(function (a, b) {
      if (b.score_total !== a.score_total) return b.score_total - a.score_total;
      return String(a.display_name_snapshot).localeCompare(String(b.display_name_snapshot));
    });

    var previousScore = null;
    var previousRank = 0;
    return players.map(function (player, index) {
      var rank = player.score_total === previousScore ? previousRank : index + 1;
      previousScore = player.score_total;
      previousRank = rank;
      return Object.freeze({
        display_name: player.display_name_snapshot,
        score: player.score_total,
        rank: rank
      });
    });
  }

  function gameView_(round, actor, viewerMode) {
    if (!round) return null;
    var plugin = ELV2_getGamePlugin(round.game_id, { include_test_only: allowTestOnlyGames });
    var viewer = {
      student_id: viewerMode === ELV2_VIEW_MODE.STUDENT ? actor.student_id : null,
      view_mode: viewerMode
    };
    var context = { round_id: round.round_id, server_now: deps.clock.nowMs() };
    var view = plugin.publicView(round.private_state, viewer, round.status, context);
    var schema = plugin.publicSchema(viewer, round.status, context);
    ELV2_assertPublicViewSafe(view, round.status, schema);
    return view;
  }

  function getState(actor, input) {
    if (!input || typeof input.room_id !== 'string' || !input.room_id) throw new Error('ELV2_ROOM_NOT_AVAILABLE');
    var room = deps.store.getRoom(input.room_id);
    if (!room) throw new Error('ELV2_ROOM_NOT_AVAILABLE');
    var viewer = resolveViewer_(actor, room, input.view_mode);

    var round = room.current_round_id ? deps.store.getRound(room.current_round_id) : null;
    if (round && round.room_id !== room.room_id) throw new Error('ELV2_STATE_INTEGRITY_FAILED');
    var canonical = applyTimedCanonicalization_(room, round);
    room = canonical.room;
    round = canonical.round;

    var serverNow = deps.clock.nowMs();
    if (input.known_revision != null && input.known_revision === room.state_revision) {
      return Object.freeze({
        unchanged: true,
        server_now: serverNow,
        state_revision: room.state_revision,
        view_mode: viewer.mode
      });
    }

    var player = viewer.mode === ELV2_VIEW_MODE.STUDENT
      ? deps.store.getPlayerByRoomStudent(room.room_id, actor.student_id)
      : null;

    var state = {
      unchanged: false,
      server_now: serverNow,
      state_revision: room.state_revision,
      view_mode: viewer.mode,
      room: Object.freeze({
        room_id: room.room_id,
        room_code: room.room_code,
        status: room.status,
        title: room.title,
        state_revision: room.state_revision
      }),
      round: round ? Object.freeze({
        round_id: round.round_id,
        sequence_no: round.sequence_no,
        game_id: round.game_id,
        game_version: round.game_version,
        phase: round.status,
        opened_at: round.opened_at,
        ends_at: round.ends_at,
        locked_at: round.locked_at,
        revealed_at: round.revealed_at,
        reveal_ends_at: round.reveal_ends_at,
        closed_at: round.closed_at
      }) : null,
      player: player ? Object.freeze({
        player_id: player.player_id,
        display_name: player.display_name_snapshot,
        score: player.score_total,
        joined_at: player.joined_at
      }) : null,
      participant_count: deps.store.listPlayersByRoom(room.room_id).length,
      leaderboard: Object.freeze(leaderboard_(room.room_id)),
      game: gameView_(round, actor, viewer.mode)
    };

    ELV2_assertNoForbiddenPublicKeys(state, round ? round.status : '');
    return Object.freeze(state);
  }

  return Object.freeze({ getState: getState });
}
