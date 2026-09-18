/** English LAB LIVE v2 · pure idempotency classification and key material. */
var ELV2_IDEMPOTENCY_STATUS = Object.freeze({
  STARTED: 'STARTED',
  COMMITTED: 'COMMITTED',
  FAILED: 'FAILED'
});

var ELV2_IDEMPOTENCY_DECISION = Object.freeze({
  NEW: 'NEW',
  REPLAY_COMMITTED: 'REPLAY_COMMITTED',
  IN_PROGRESS: 'IN_PROGRESS',
  RETRY_FAILED: 'RETRY_FAILED',
  CONFLICT: 'CONFLICT'
});

function ELV2_requireRequestId(action, requestId) {
  if (ELV2_MUTATING_ACTIONS.indexOf(action) === -1) return null;
  if (typeof requestId !== 'string') throw new Error('ELV2_REQUEST_ID_REQUIRED');
  var normalized = requestId.trim();
  if (!normalized || normalized.length > 128) throw new Error('ELV2_REQUEST_ID_INVALID');
  return normalized;
}

function ELV2_idempotencyScopeMaterial(action, actorUserId, requestId) {
  return ELV2_canonicalJson({
    action: ELV2_requireNonEmptyString_(action, 'action'),
    actor_user_id: ELV2_requireNonEmptyString_(actorUserId, 'actor_user_id'),
    request_id: ELV2_requireNonEmptyString_(requestId, 'request_id')
  });
}

function ELV2_attemptKeyMaterial(roomId, roundId, studentId, requestId) {
  return ELV2_canonicalJson({
    request_id: ELV2_requireNonEmptyString_(requestId, 'request_id'),
    room_id: ELV2_requireNonEmptyString_(roomId, 'room_id'),
    round_id: ELV2_requireNonEmptyString_(roundId, 'round_id'),
    student_id: ELV2_requireNonEmptyString_(studentId, 'student_id')
  });
}

function ELV2_classifyIdempotency(existingRecord, payloadHash) {
  if (existingRecord == null) return ELV2_IDEMPOTENCY_DECISION.NEW;
  if (!existingRecord || typeof existingRecord !== 'object') throw new Error('ELV2_IDEMPOTENCY_RECORD_INVALID');
  var normalizedHash = ELV2_requireNonEmptyString_(payloadHash, 'payload_hash');
  if (existingRecord.payload_hash !== normalizedHash) return ELV2_IDEMPOTENCY_DECISION.CONFLICT;

  if (existingRecord.status === ELV2_IDEMPOTENCY_STATUS.COMMITTED) {
    return ELV2_IDEMPOTENCY_DECISION.REPLAY_COMMITTED;
  }
  if (existingRecord.status === ELV2_IDEMPOTENCY_STATUS.STARTED) {
    return ELV2_IDEMPOTENCY_DECISION.IN_PROGRESS;
  }
  if (existingRecord.status === ELV2_IDEMPOTENCY_STATUS.FAILED) {
    return ELV2_IDEMPOTENCY_DECISION.RETRY_FAILED;
  }
  throw new Error('ELV2_IDEMPOTENCY_STATUS_INVALID');
}

function ELV2_requireNonEmptyString_(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('ELV2_REQUIRED_STRING_INVALID:' + fieldName);
  }
  return value.trim();
}
