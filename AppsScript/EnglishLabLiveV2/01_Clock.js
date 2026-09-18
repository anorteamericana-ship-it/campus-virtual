/** English LAB LIVE v2 · server clock abstraction. */
function ELV2_nowMs() {
  return Date.now();
}

function ELV2_makeClock(nowProvider) {
  if (nowProvider != null && typeof nowProvider !== 'function') {
    throw new Error('ELV2_CLOCK_PROVIDER_INVALID');
  }
  var provider = nowProvider || ELV2_nowMs;
  return Object.freeze({
    nowMs: function () {
      var value = provider();
      if (typeof value !== 'number' || !isFinite(value)) {
        throw new Error('ELV2_CLOCK_VALUE_INVALID');
      }
      return value;
    }
  });
}
