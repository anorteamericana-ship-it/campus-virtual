/**
 * English LAB LIVE v2 · Apps Script concurrency adapters (E3).
 *
 * Apps Script exposes a script-wide lock, not a real keyed lock. We deliberately use
 * that global lock for correctness. This serializes V2 mutations more than necessary,
 * but avoids pretending that room-key isolation exists when the platform cannot
 * guarantee it. Performance can be revisited only after runtime evidence.
 */
function ELV2_createExclusiveMutationGuard(lockAdapter) {
  if (!lockAdapter || typeof lockAdapter.tryAcquire !== 'function' || typeof lockAdapter.release !== 'function') {
    throw new Error('ELV2_EXCLUSIVE_MUTATION_ADAPTER_INVALID');
  }

  return Object.freeze({
    withMutation: function (scopeKey, callback) {
      if (typeof scopeKey !== 'string' || !scopeKey) throw new Error('ELV2_MUTATION_SCOPE_INVALID');
      if (typeof callback !== 'function') throw new Error('ELV2_MUTATION_CALLBACK_INVALID');
      if (!lockAdapter.tryAcquire(scopeKey)) throw new Error('ELV2_BUSY_RETRY');
      try {
        return callback();
      } finally {
        lockAdapter.release(scopeKey);
      }
    }
  });
}

function ELV2_createAppsScriptGlobalLockAdapter(options) {
  if (typeof LockService === 'undefined' || !LockService || typeof LockService.getScriptLock !== 'function') {
    throw new Error('ELV2_LOCK_RUNTIME_UNAVAILABLE');
  }
  var timeoutMs = options && options.timeout_ms != null ? Number(options.timeout_ms) : 250;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0 || timeoutMs > 5000) {
    throw new Error('ELV2_LOCK_TIMEOUT_INVALID');
  }
  timeoutMs = Math.floor(timeoutMs);
  var heldLock = null;

  return Object.freeze({
    scope: 'SCRIPT_GLOBAL',
    timeout_ms: timeoutMs,
    tryAcquire: function (_) {
      if (heldLock) return false;
      var lock = LockService.getScriptLock();
      if (!lock || typeof lock.tryLock !== 'function' || typeof lock.releaseLock !== 'function') {
        throw new Error('ELV2_LOCK_RUNTIME_UNAVAILABLE');
      }
      if (lock.tryLock(timeoutMs) !== true) return false;
      heldLock = lock;
      return true;
    },
    release: function (_) {
      if (!heldLock) return;
      var lock = heldLock;
      heldLock = null;
      lock.releaseLock();
    }
  });
}

function ELV2_createAppsScriptRoomConcurrencyGuard(options) {
  return ELV2_createConcurrencyGuard(ELV2_createAppsScriptGlobalLockAdapter(options));
}

function ELV2_createAppsScriptIdempotencyMutationGuard(options) {
  return ELV2_createExclusiveMutationGuard(ELV2_createAppsScriptGlobalLockAdapter(options));
}

function ELV2_createAppsScriptSchemaMutationGuard(options) {
  return ELV2_createExclusiveMutationGuard(ELV2_createAppsScriptGlobalLockAdapter(options));
}
