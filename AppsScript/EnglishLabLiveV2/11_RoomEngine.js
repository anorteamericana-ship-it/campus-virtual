/** English LAB LIVE v2 · isolated room domain engine with injected dependencies. */
function ELV2_createRoomEngine(deps) {
  if (!deps || !deps.store || !deps.clock || !deps.concurrencyGuard || typeof deps.idFactory !== 'function' || typeof deps.roomCodeFactory !== 'function') {
    throw new Error('ELV2_ROOM_ENGINE_DEPS_INVALID');
  }

  var maxRoomCodeAttempts = Number.isInteger(deps.maxRoomCodeAttempts) && deps.maxRoomCodeAttempts > 0
    ? deps.maxRoomCodeAttempts
    : 5;

  function nowMs() {
    return deps.clock.nowMs();
  }

  function createRoom(actor, input) {
    var hostGroupId = ELV2_assertRoomCreateGroup(actor, input && input.group_id);
    return deps.concurrencyGuard.withRoomMutation('__ELV2_CREATE_ROOM__', function () {
      var roomId = deps.idFactory('room');
      var now = nowMs();
      var lastConflict = null;

      for (var attempt = 0; attempt < maxRoomCodeAttempts; attempt += 1) {
        var roomCode = deps.roomCodeFactory(attempt);
        var room = {
          room_id: roomId,
          room_code: roomCode,
          status: ELV2_ROOM_STATUS.LOBBY,
          owner_user_id: actor.user_id,
          owner_teacher_id: actor.teacher_id || null,
          host_group_id: hostGroupId,
          join_policy: 'MIXED_AUTHORIZED',
          current_round_id: null,
          state_revision: 0,
          title: input && typeof input.title === 'string' ? input.title.trim() : '',
          config: input && input.config && typeof input.config === 'object' ? input.config : {},
          created_at: now,
          started_at: null,
          closed_at: null,
          close_reason: null,
          created_by_user_id: actor.user_id,
          created_service_version: ELV2_SERVICE_VERSION,
          updated_at: now
        };
        try {
          return deps.store.createRoom(room);
        } catch (error) {
          if (!error || String(error.message) !== 'ELV2_STORE_ROOM_CONFLICT') throw error;
          lastConflict = error;
        }
      }
      throw lastConflict || new Error('ELV2_STORE_ROOM_CONFLICT');
    });
  }

  function joinRoom(actor, input) {
    ELV2_assertStudentJoinActor(actor);
    var locatedRoom = input && input.room_id ? deps.store.getRoom(input.room_id) : deps.store.findRoomByCode(input && input.room_code);
    if (!locatedRoom || locatedRoom.status === ELV2_ROOM_STATUS.CLOSED) throw new Error('ELV2_ROOM_NOT_AVAILABLE');

    return deps.concurrencyGuard.withRoomMutation(locatedRoom.room_id, function () {
      var room = deps.store.getRoom(locatedRoom.room_id);
      if (!room || room.status === ELV2_ROOM_STATUS.CLOSED) throw new Error('ELV2_ROOM_NOT_AVAILABLE');

      var existing = deps.store.getPlayerByRoomStudent(room.room_id, actor.student_id);
      if (existing) {
        existing.last_seen_at = nowMs();
        existing.updated_at = existing.last_seen_at;
        return Object.freeze({ room: room, player: deps.store.updatePlayer(existing), reconnected: true });
      }

      var now = nowMs();
      var player = {
        player_id: deps.idFactory('player'),
        room_id: room.room_id,
        student_id: actor.student_id,
        room_student_key: room.room_id + '|' + actor.student_id,
        display_name_snapshot: actor.display_name || '',
        home_group_id_snapshot: actor.home_group_id || '',
        status: 'ACTIVE',
        score_total: 0,
        joined_at: now,
        last_seen_at: now,
        updated_at: now
      };
      var savedPlayer = deps.store.createPlayer(player);
      room.state_revision = ELV2_nextRevision(room.state_revision);
      room.updated_at = now;
      room = deps.store.updateRoom(room);
      return Object.freeze({ room: room, player: savedPlayer, reconnected: false });
    });
  }

  function startRoom(actor, roomId, expectedRevision) {
    return deps.concurrencyGuard.withRoomMutation(roomId, function () {
      var room = deps.store.getRoom(roomId);
      if (!room) throw new Error('ELV2_ROOM_NOT_AVAILABLE');
      ELV2_assertRoomController(actor, room);
      if (expectedRevision != null && expectedRevision !== room.state_revision) throw new Error('ELV2_STATE_CHANGED');
      ELV2_assertRoomTransition(room.status, ELV2_ROOM_STATUS.LIVE);
      var now = nowMs();
      room.status = ELV2_ROOM_STATUS.LIVE;
      room.started_at = now;
      room.updated_at = now;
      room.state_revision = ELV2_nextRevision(room.state_revision);
      return deps.store.updateRoom(room);
    });
  }

  function closeRoom(actor, input) {
    return deps.concurrencyGuard.withRoomMutation(input.room_id, function () {
      var room = deps.store.getRoom(input.room_id);
      if (!room) throw new Error('ELV2_ROOM_NOT_AVAILABLE');
      ELV2_assertRoomController(actor, room);
      if (input.expected_revision != null && input.expected_revision !== room.state_revision) throw new Error('ELV2_STATE_CHANGED');
      ELV2_assertRoomTransition(room.status, ELV2_ROOM_STATUS.CLOSED);

      var now = nowMs();
      var closedRound = null;
      if (room.current_round_id) {
        var round = deps.store.getRound(room.current_round_id);
        if (!round || round.room_id !== room.room_id) throw new Error('ELV2_STATE_INTEGRITY_FAILED');
        if (round.status !== ELV2_ROUND_STATUS.CLOSED) {
          ELV2_assertRoundTransition(round.status, ELV2_ROUND_STATUS.CLOSED);
          round.status = ELV2_ROUND_STATUS.CLOSED;
          round.closed_at = now;
          round.close_reason = input.reason || 'ROOM_CLOSED';
          round.updated_at = now;
          closedRound = deps.store.updateRound(round);
        }
      }

      room.status = ELV2_ROOM_STATUS.CLOSED;
      room.closed_at = now;
      room.close_reason = input.reason || 'CLOSED_BY_CONTROLLER';
      room.updated_at = now;
      room.state_revision = ELV2_nextRevision(room.state_revision);
      room = deps.store.updateRoom(room);
      return Object.freeze({ room: room, round: closedRound });
    });
  }

  return Object.freeze({
    createRoom: createRoom,
    joinRoom: joinRoom,
    startRoom: startRoom,
    closeRoom: closeRoom
  });
}
