/** English LAB LIVE v2 · isolated room domain engine with injected dependencies. */
function ELV2_createRoomEngine(deps) {
  if (!deps || !deps.store || !deps.clock || typeof deps.idFactory !== 'function' || typeof deps.roomCodeFactory !== 'function') {
    throw new Error('ELV2_ROOM_ENGINE_DEPS_INVALID');
  }

  function nowMs() {
    return deps.clock.nowMs();
  }

  function createRoom(actor, input) {
    ELV2_assertCapability(actor, ELV2_CAPABILITY.LIVE_CREATE);
    var roomId = deps.idFactory('room');
    var roomCode = deps.roomCodeFactory();
    var now = nowMs();
    var room = {
      room_id: roomId,
      room_code: roomCode,
      status: ELV2_ROOM_STATUS.LOBBY,
      owner_user_id: actor.user_id,
      owner_teacher_id: actor.teacher_id || null,
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
    return deps.store.createRoom(room);
  }

  function joinRoom(actor, input) {
    ELV2_assertStudentJoinActor(actor);
    var room = input && input.room_id ? deps.store.getRoom(input.room_id) : deps.store.findRoomByCode(input && input.room_code);
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
  }

  function startRoom(actor, roomId, expectedRevision) {
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
  }

  return Object.freeze({
    createRoom: createRoom,
    joinRoom: joinRoom,
    startRoom: startRoom
  });
}
