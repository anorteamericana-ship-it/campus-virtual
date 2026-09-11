/** English LAB LIVE v2 · terminal round lifecycle operations kept isolated from plugin rules. */
function ELV2_createRoundLifecycleService(deps) {
  if (!deps || !deps.store || !deps.clock || !deps.concurrencyGuard) {
    throw new Error('ELV2_ROUND_LIFECYCLE_DEPS_INVALID');
  }

  function closeRound(actor, input) {
    return deps.concurrencyGuard.withRoomMutation(input.room_id, function () {
      var room = deps.store.getRoom(input.room_id);
      var round = deps.store.getRound(input.round_id);
      if (!room) throw new Error('ELV2_ROOM_NOT_AVAILABLE');
      if (!round || round.room_id !== room.room_id || room.current_round_id !== round.round_id) {
        throw new Error('ELV2_ROUND_NOT_AVAILABLE');
      }
      ELV2_assertRoomController(actor, room);
      if (input.expected_revision != null && input.expected_revision !== room.state_revision) {
        throw new Error('ELV2_STATE_CHANGED');
      }
      ELV2_assertRoundTransition(round.status, ELV2_ROUND_STATUS.CLOSED);

      var now = deps.clock.nowMs();
      round.status = ELV2_ROUND_STATUS.CLOSED;
      round.closed_at = now;
      round.close_reason = input.reason || 'CLOSED_BY_CONTROLLER';
      round.updated_at = now;
      round = deps.store.updateRound(round);

      room.current_round_id = null;
      room.state_revision = ELV2_nextRevision(room.state_revision);
      room.updated_at = now;
      room = deps.store.updateRoom(room);

      return Object.freeze({ room: room, round: round });
    });
  }

  return Object.freeze({ closeRound: closeRound });
}
