/** English LAB LIVE v2 · injected concurrency boundary. */
function ELV2_createConcurrencyGuard(lockAdapter) {
  if (!lockAdapter || typeof lockAdapter.tryAcquire !== 'function' || typeof lockAdapter.release !== 'function') {
    throw new Error('ELV2_CONCURRENCY_ADAPTER_INVALID');
  }

  return Object.freeze({
    withRoomMutation: function (roomId, callback) {
      if (typeof roomId !== 'string' || !roomId) throw new Error('ELV2_ROOM_ID_INVALID');
      if (typeof callback !== 'function') throw new Error('ELV2_MUTATION_CALLBACK_INVALID');
      if (!lockAdapter.tryAcquire(roomId)) throw new Error('ELV2_BUSY_RETRY');
      try {
        return callback();
      } finally {
        lockAdapter.release(roomId);
      }
    }
  });
}

function ELV2_createSynchronousTestLockAdapter() {
  var held = {};
  return Object.freeze({
    tryAcquire: function (roomId) {
      if (held[roomId]) return false;
      held[roomId] = true;
      return true;
    },
    release: function (roomId) {
      delete held[roomId];
    }
  });
}
