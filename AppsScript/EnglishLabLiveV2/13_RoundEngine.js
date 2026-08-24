/** English LAB LIVE v2 · isolated round domain engine with injected dependencies. */
function ELV2_createRoundEngine(deps) {
  if (!deps || !deps.store || !deps.clock || !deps.concurrencyGuard || typeof deps.idFactory !== 'function' || typeof deps.payloadHasher !== 'function') {
    throw new Error('ELV2_ROUND_ENGINE_DEPS_INVALID');
  }

  var allowTestOnlyGames = deps.allowTestOnlyGames === true;

  function nowMs() {
    return deps.clock.nowMs();
  }

  function gamePlugin_(gameId) {
    return ELV2_getGamePlugin(gameId, { include_test_only: allowTestOnlyGames });
  }

  function getRoomAndRound_(roomId, roundId) {
    var room = deps.store.getRoom(roomId);
    var round = deps.store.getRound(roundId);
    if (!room) throw new Error('ELV2_ROOM_NOT_AVAILABLE');
    if (!round || round.room_id !== room.room_id) throw new Error('ELV2_ROUND_NOT_AVAILABLE');
    if (room.current_round_id !== round.round_id) throw new Error('ELV2_ROUND_NOT_CURRENT');
    return { room: room, round: round };
  }

  function assertExpectedRevision_(room, expectedRevision) {
    if (expectedRevision != null && expectedRevision !== room.state_revision) {
      throw new Error('ELV2_STATE_CHANGED');
    }
  }

  function prepareRound(actor, input) {
    var roomId = input && input.room_id;
    if (typeof roomId !== 'string' || !roomId) throw new Error('ELV2_ROOM_NOT_AVAILABLE');
    return deps.concurrencyGuard.withRoomMutation(roomId, function () {
      var room = deps.store.getRoom(roomId);
      if (!room) throw new Error('ELV2_ROOM_NOT_AVAILABLE');
      ELV2_assertRoomController(actor, room);
      if (room.status !== ELV2_ROOM_STATUS.LIVE) throw new Error('ELV2_ROOM_NOT_LIVE');
      assertExpectedRevision_(room, input.expected_revision);

      var activeRounds = deps.store.listRoundsByRoom(room.room_id).filter(function (item) {
        return item.status !== ELV2_ROUND_STATUS.CLOSED;
      });
      if (activeRounds.length > 0 || room.current_round_id) throw new Error('ELV2_ACTIVE_ROUND_EXISTS');

      var plugin = gamePlugin_(input.game_id);
      var resolvedContent = input.resolved_content;
      plugin.validateContent(resolvedContent);
      plugin.validateSettings(input.settings || {});
      var created = plugin.createRound(resolvedContent, input.settings || {}, {
        room_id: room.room_id,
        server_now: nowMs()
      });
      ELV2_validateCreatedRoundContract(created);

      var sequenceNo = deps.store.listRoundsByRoom(room.room_id).length + 1;
      var now = nowMs();
      var round = {
        round_id: deps.idFactory('round'),
        room_id: room.room_id,
        sequence_no: sequenceNo,
        game_id: plugin.gameId(),
        game_version: plugin.gameVersion(),
        status: ELV2_ROUND_STATUS.READY,
        content_ref: input.content_ref || '',
        content_version: input.content_version || '',
        content_hash: deps.payloadHasher(resolvedContent),
        content_snapshot: JSON.parse(JSON.stringify(resolvedContent)),
        private_state: JSON.parse(JSON.stringify(created.private_state)),
        settings: JSON.parse(JSON.stringify(input.settings || {})),
        scoring_policy: created.scoring_policy,
        visibility_model: created.visibility_model,
        submission_policy: created.submission_policy,
        created_at: now,
        opened_at: null,
        ends_at: null,
        locked_at: null,
        revealed_at: null,
        reveal_ends_at: null,
        closed_at: null,
        close_reason: null,
        score_committed_at: null,
        updated_at: now
      };

      round = deps.store.createRound(round);
      room.current_round_id = round.round_id;
      room.state_revision = ELV2_nextRevision(room.state_revision);
      room.updated_at = now;
      room = deps.store.updateRoom(room);
      return Object.freeze({ room: room, round: round });
    });
  }

  function openRound(actor, input) {
    return deps.concurrencyGuard.withRoomMutation(input.room_id, function () {
      var entities = getRoomAndRound_(input.room_id, input.round_id);
      var room = entities.room;
      var round = entities.round;
      ELV2_assertRoomController(actor, room);
      assertExpectedRevision_(room, input.expected_revision);
      ELV2_assertRoundTransition(round.status, ELV2_ROUND_STATUS.OPEN);
      if (!Number.isInteger(input.duration_ms) || input.duration_ms <= 0) throw new Error('ELV2_DURATION_INVALID');

      var now = nowMs();
      round.status = ELV2_ROUND_STATUS.OPEN;
      round.opened_at = now;
      round.ends_at = now + input.duration_ms;
      round.updated_at = now;
      round = deps.store.updateRound(round);

      room.state_revision = ELV2_nextRevision(room.state_revision);
      room.updated_at = now;
      room = deps.store.updateRoom(room);
      return Object.freeze({ room: room, round: round });
    });
  }

  function canonicalizeExpiredOpenRound_(room, round, now) {
    var plan = ELV2_planTimedRoundCanonicalization(round, now, {});
    if (plan.transitions.length === 0) return { room: room, round: round, changed: false };

    for (var i = 0; i < plan.transitions.length; i += 1) {
      var nextStatus = plan.transitions[i];
      ELV2_assertRoundTransition(round.status, nextStatus);
      round.status = nextStatus;
      if (nextStatus === ELV2_ROUND_STATUS.LOCKED) round.locked_at = now;
    }
    round.updated_at = now;
    round = deps.store.updateRound(round);
    room.state_revision = ELV2_nextRevision(room.state_revision);
    room.updated_at = now;
    room = deps.store.updateRoom(room);
    return { room: room, round: round, changed: true };
  }

  function submitAttempt(actor, input) {
    ELV2_assertCapability(actor, ELV2_CAPABILITY.LIVE_PLAY);
    var requestId = ELV2_requireRequestId('submitAttempt', input && input.request_id);

    return deps.concurrencyGuard.withRoomMutation(input.room_id, function () {
      var entities = getRoomAndRound_(input.room_id, input.round_id);
      var room = entities.room;
      var round = entities.round;
      if (room.status !== ELV2_ROOM_STATUS.LIVE) throw new Error('ELV2_ROOM_NOT_LIVE');
      if (!actor || typeof actor.student_id !== 'string' || !actor.student_id) throw new Error('ELV2_ACTOR_STUDENT_ID_REQUIRED');

      var player = deps.store.getPlayerByRoomStudent(room.room_id, actor.student_id);
      if (!player) throw new Error('ELV2_FORBIDDEN:player_not_joined');

      var now = nowMs();
      var canonicalized = canonicalizeExpiredOpenRound_(room, round, now);
      room = canonicalized.room;
      round = canonicalized.round;
      if (!ELV2_canAcceptAttempt(round, now)) {
        if (round.status === ELV2_ROUND_STATUS.LOCKED && round.ends_at != null && now >= round.ends_at) {
          throw new Error('ELV2_DEADLINE_PASSED');
        }
        throw new Error('ELV2_ROUND_NOT_OPEN');
      }

      var plugin = gamePlugin_(round.game_id);
      plugin.validateAttempt(input.attempt);
      var payloadHash = deps.payloadHasher(input.attempt);
      var attemptKey = ELV2_attemptKeyMaterial(room.room_id, round.round_id, actor.student_id, requestId);
      var existing = deps.store.getAttemptByKey(attemptKey);
      if (existing) {
        if (existing.payload_hash !== payloadHash) throw new Error('ELV2_REQUEST_ID_CONFLICT');
        return Object.freeze({
          room: room,
          round: round,
          player: player,
          attempt: existing,
          replayed: true,
          view: buildStudentGameView_(round, actor)
        });
      }

      var result = plugin.applyAttempt(round.private_state, input.attempt, {
        student_id: actor.student_id,
        player_id: player.player_id
      }, {
        room_id: room.room_id,
        round_id: round.round_id,
        server_now: now
      });

      round.private_state = JSON.parse(JSON.stringify(result.next_private_state));
      round.updated_at = now;
      round = deps.store.updateRound(round);

      var scoreStatus = round.scoring_policy === ELV2_SCORING_POLICY.SCORE_ON_REVEAL ? 'HIDDEN' : 'COMMITTED';
      var nextRevision = ELV2_nextRevision(room.state_revision);
      var attempt = {
        attempt_id: deps.idFactory('attempt'),
        room_id: room.room_id,
        round_id: round.round_id,
        player_id: player.player_id,
        student_id: actor.student_id,
        request_id: requestId,
        attempt_key: attemptKey,
        payload_hash: payloadHash,
        game_id: round.game_id,
        action_type: input.attempt.action_type,
        payload: JSON.parse(JSON.stringify(input.attempt)),
        private_result: JSON.parse(JSON.stringify(result.attempt_result_private)),
        points_delta: result.points_delta,
        score_status: scoreStatus,
        client_seen_revision: input.client_seen_revision == null ? null : input.client_seen_revision,
        received_at: now,
        recorded_at: now,
        committed_at: scoreStatus === 'COMMITTED' ? now : null,
        created_revision: nextRevision
      };
      attempt = deps.store.createAttempt(attempt);

      if (scoreStatus === 'COMMITTED') {
        player.score_total += attempt.points_delta;
        player.updated_at = now;
        player = deps.store.updatePlayer(player);
      }

      room.state_revision = nextRevision;
      room.updated_at = now;
      room = deps.store.updateRoom(room);

      return Object.freeze({
        room: room,
        round: round,
        player: player,
        attempt: attempt,
        replayed: false,
        view: buildStudentGameView_(round, actor)
      });
    });
  }

  function lockRound(actor, input) {
    return deps.concurrencyGuard.withRoomMutation(input.room_id, function () {
      var entities = getRoomAndRound_(input.room_id, input.round_id);
      var room = entities.room;
      var round = entities.round;
      ELV2_assertRoomController(actor, room);
      assertExpectedRevision_(room, input.expected_revision);
      ELV2_assertRoundTransition(round.status, ELV2_ROUND_STATUS.LOCKED);
      var now = nowMs();
      round.status = ELV2_ROUND_STATUS.LOCKED;
      round.locked_at = now;
      round.updated_at = now;
      round = deps.store.updateRound(round);
      room.state_revision = ELV2_nextRevision(room.state_revision);
      room.updated_at = now;
      room = deps.store.updateRoom(room);
      return Object.freeze({ room: room, round: round });
    });
  }

  function revealRound(actor, input) {
    return deps.concurrencyGuard.withRoomMutation(input.room_id, function () {
      var entities = getRoomAndRound_(input.room_id, input.round_id);
      var room = entities.room;
      var round = entities.round;
      ELV2_assertRoomController(actor, room);
      assertExpectedRevision_(room, input.expected_revision);
      ELV2_assertRoundTransition(round.status, ELV2_ROUND_STATUS.REVEAL);
      var now = nowMs();

      if (round.scoring_policy === ELV2_SCORING_POLICY.SCORE_ON_REVEAL && round.score_committed_at == null) {
        deps.store.listAttemptsByRound(round.round_id).forEach(function (attempt) {
          if (attempt.score_status !== 'HIDDEN') return;
          var player = deps.store.getPlayer(attempt.player_id);
          if (!player || player.room_id !== room.room_id || player.student_id !== attempt.student_id) {
            throw new Error('ELV2_STATE_INTEGRITY_FAILED');
          }
          player.score_total += attempt.points_delta;
          player.updated_at = now;
          deps.store.updatePlayer(player);
          attempt.score_status = 'COMMITTED';
          attempt.committed_at = now;
          deps.store.updateAttempt(attempt);
        });
        round.score_committed_at = now;
      }

      round.status = ELV2_ROUND_STATUS.REVEAL;
      round.revealed_at = now;
      round.reveal_ends_at = input.reveal_duration_ms == null ? null : now + input.reveal_duration_ms;
      round.updated_at = now;
      round = deps.store.updateRound(round);

      room.state_revision = ELV2_nextRevision(room.state_revision);
      room.updated_at = now;
      room = deps.store.updateRoom(room);
      return Object.freeze({ room: room, round: round });
    });
  }

  function buildStudentGameView_(round, actor) {
    var plugin = gamePlugin_(round.game_id);
    var viewer = { student_id: actor.student_id, view_mode: ELV2_VIEW_MODE.STUDENT };
    var view = plugin.publicView(round.private_state, viewer, round.status, {
      round_id: round.round_id,
      server_now: nowMs()
    });
    var schema = plugin.publicSchema(viewer, round.status, { round_id: round.round_id });
    ELV2_assertPublicViewSafe(view, round.status, schema);
    return view;
  }

  return Object.freeze({
    prepareRound: prepareRound,
    openRound: openRound,
    submitAttempt: submitAttempt,
    lockRound: lockRound,
    revealRound: revealRound,
    buildStudentGameView: buildStudentGameView_
  });
}
