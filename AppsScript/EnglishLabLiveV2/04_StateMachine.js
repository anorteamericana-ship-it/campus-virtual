/** English LAB LIVE v2 · pure room/round state machine and deadline semantics. */
var ELV2_ROOM_TRANSITIONS = Object.freeze({
  LOBBY: Object.freeze(['LIVE', 'CLOSED']),
  LIVE: Object.freeze(['CLOSED']),
  CLOSED: Object.freeze([])
});

var ELV2_ROUND_TRANSITIONS = Object.freeze({
  READY: Object.freeze(['OPEN', 'CLOSED']),
  OPEN: Object.freeze(['LOCKED', 'CLOSED']),
  LOCKED: Object.freeze(['REVEAL', 'CLOSED']),
  REVEAL: Object.freeze(['CLOSED']),
  CLOSED: Object.freeze([])
});

function ELV2_canRoomTransition(fromStatus, toStatus) {
  var allowed = ELV2_ROOM_TRANSITIONS[fromStatus];
  return Array.isArray(allowed) && allowed.indexOf(toStatus) !== -1;
}

function ELV2_canRoundTransition(fromStatus, toStatus) {
  var allowed = ELV2_ROUND_TRANSITIONS[fromStatus];
  return Array.isArray(allowed) && allowed.indexOf(toStatus) !== -1;
}

function ELV2_assertRoomTransition(fromStatus, toStatus) {
  if (!ELV2_canRoomTransition(fromStatus, toStatus)) {
    throw new Error('ELV2_INVALID_ROOM_TRANSITION:' + fromStatus + '->' + toStatus);
  }
}

function ELV2_assertRoundTransition(fromStatus, toStatus) {
  if (!ELV2_canRoundTransition(fromStatus, toStatus)) {
    throw new Error('ELV2_INVALID_ROUND_TRANSITION:' + fromStatus + '->' + toStatus);
  }
}

function ELV2_canAcceptAttempt(round, nowMs) {
  if (!round || round.status !== ELV2_ROUND_STATUS.OPEN) return false;
  if (typeof nowMs !== 'number' || !isFinite(nowMs)) throw new Error('ELV2_NOW_INVALID');
  if (typeof round.ends_at !== 'number' || !isFinite(round.ends_at)) throw new Error('ELV2_ROUND_ENDS_AT_INVALID');
  return nowMs < round.ends_at;
}

function ELV2_planTimedRoundCanonicalization(round, nowMs, policy) {
  if (!round || typeof round !== 'object') throw new Error('ELV2_ROUND_INVALID');
  if (typeof nowMs !== 'number' || !isFinite(nowMs)) throw new Error('ELV2_NOW_INVALID');

  var effectivePolicy = policy || {};
  var transitions = [];
  var status = round.status;

  if (status === ELV2_ROUND_STATUS.OPEN) {
    if (typeof round.ends_at !== 'number' || !isFinite(round.ends_at)) {
      throw new Error('ELV2_ROUND_ENDS_AT_INVALID');
    }
    if (nowMs >= round.ends_at) {
      transitions.push(ELV2_ROUND_STATUS.LOCKED);
      status = ELV2_ROUND_STATUS.LOCKED;
      if (effectivePolicy.auto_reveal === true) {
        transitions.push(ELV2_ROUND_STATUS.REVEAL);
        status = ELV2_ROUND_STATUS.REVEAL;
      }
    }
  }

  if (status === ELV2_ROUND_STATUS.REVEAL && round.reveal_ends_at != null) {
    if (typeof round.reveal_ends_at !== 'number' || !isFinite(round.reveal_ends_at)) {
      throw new Error('ELV2_ROUND_REVEAL_ENDS_AT_INVALID');
    }
    if (nowMs >= round.reveal_ends_at) {
      transitions.push(ELV2_ROUND_STATUS.CLOSED);
      status = ELV2_ROUND_STATUS.CLOSED;
    }
  }

  return Object.freeze({
    from_status: round.status,
    to_status: status,
    transitions: Object.freeze(transitions)
  });
}

function ELV2_nextRevision(currentRevision) {
  if (!Number.isInteger(currentRevision) || currentRevision < 0) {
    throw new Error('ELV2_REVISION_INVALID');
  }
  if (currentRevision >= Number.MAX_SAFE_INTEGER) {
    throw new Error('ELV2_REVISION_EXHAUSTED');
  }
  return currentRevision + 1;
}
