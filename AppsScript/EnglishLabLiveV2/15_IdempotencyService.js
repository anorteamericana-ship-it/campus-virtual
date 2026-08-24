/** English LAB LIVE v2 · global mutation idempotency service with injected Store. */
function ELV2_createIdempotencyService(deps) {
  if (!deps || !deps.store || !deps.clock || typeof deps.idFactory !== 'function' || typeof deps.payloadHasher !== 'function' || typeof deps.keyHasher !== 'function') {
    throw new Error('ELV2_IDEMPOTENCY_SERVICE_DEPS_INVALID');
  }

  function begin(input) {
    var requestId = ELV2_requireRequestId(input.action, input.request_id);
    if (requestId == null) return Object.freeze({ decision: 'NOT_REQUIRED', record: null });

    var actorUserId = ELV2_requireNonEmptyString_(input.actor_user_id, 'actor_user_id');
    var payloadHash = deps.payloadHasher(input.payload == null ? {} : input.payload);
    var scopeMaterial = ELV2_idempotencyScopeMaterial(input.action, actorUserId, requestId);
    var scopeKey = deps.keyHasher(scopeMaterial);
    var existing = deps.store.getByScopeKey(scopeKey);
    var decision = ELV2_classifyIdempotency(existing, payloadHash);

    if (decision !== ELV2_IDEMPOTENCY_DECISION.NEW && decision !== ELV2_IDEMPOTENCY_DECISION.RETRY_FAILED) {
      return Object.freeze({ decision: decision, record: existing });
    }

    var now = deps.clock.nowMs();
    var record = existing || {
      idempotency_id: deps.idFactory('idempotency'),
      scope_key: scopeKey,
      request_id: requestId,
      action: input.action,
      actor_user_id: actorUserId,
      room_id: input.room_id || '',
      round_id: input.round_id || '',
      payload_hash: payloadHash,
      status: ELV2_IDEMPOTENCY_STATUS.STARTED,
      effect_type: '',
      effect_id: '',
      revision_after: null,
      result_code: '',
      created_at: now,
      updated_at: now,
      expires_at: null
    };

    if (existing) {
      record.status = ELV2_IDEMPOTENCY_STATUS.STARTED;
      record.updated_at = now;
      record.result_code = '';
    }
    record = existing ? deps.store.update(record) : deps.store.create(record);
    return Object.freeze({ decision: decision, record: record });
  }

  function commit(record, effect) {
    if (!record || record.status !== ELV2_IDEMPOTENCY_STATUS.STARTED) {
      throw new Error('ELV2_IDEMPOTENCY_COMMIT_INVALID');
    }
    var next = JSON.parse(JSON.stringify(record));
    next.status = ELV2_IDEMPOTENCY_STATUS.COMMITTED;
    next.effect_type = effect && effect.effect_type ? effect.effect_type : '';
    next.effect_id = effect && effect.effect_id ? effect.effect_id : '';
    next.revision_after = effect && effect.revision_after != null ? effect.revision_after : null;
    next.result_code = effect && effect.result_code ? effect.result_code : 'OK';
    next.updated_at = deps.clock.nowMs();
    return deps.store.update(next);
  }

  function fail(record, resultCode) {
    if (!record || record.status !== ELV2_IDEMPOTENCY_STATUS.STARTED) {
      throw new Error('ELV2_IDEMPOTENCY_FAIL_INVALID');
    }
    var next = JSON.parse(JSON.stringify(record));
    next.status = ELV2_IDEMPOTENCY_STATUS.FAILED;
    next.result_code = resultCode || 'FAILED';
    next.updated_at = deps.clock.nowMs();
    return deps.store.update(next);
  }

  return Object.freeze({ begin: begin, commit: commit, fail: fail });
}

function ELV2_createInMemoryIdempotencyStore() {
  var byScopeKey = {};
  var byId = {};
  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  return Object.freeze({
    getByScopeKey: function (scopeKey) {
      return clone(byScopeKey[scopeKey] || null);
    },
    create: function (record) {
      if (byScopeKey[record.scope_key] || byId[record.idempotency_id]) throw new Error('ELV2_IDEMPOTENCY_STORE_CONFLICT');
      byScopeKey[record.scope_key] = clone(record);
      byId[record.idempotency_id] = record.scope_key;
      return clone(record);
    },
    update: function (record) {
      if (!byScopeKey[record.scope_key] || byId[record.idempotency_id] !== record.scope_key) {
        throw new Error('ELV2_IDEMPOTENCY_STORE_NOT_FOUND');
      }
      byScopeKey[record.scope_key] = clone(record);
      return clone(record);
    }
  });
}
