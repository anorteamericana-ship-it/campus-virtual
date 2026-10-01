/**
 * English LAB LIVE v2 · outer Campus POST bridge (E9).
 *
 * This helper is intentionally neutral about the concrete outer guard. The caller
 * remains responsible for running any environment preflight (for example QA-only
 * spreadsheet ID guards) before invoking this function.
 *
 * It receives an already-parsed request and a serializer compatible with the
 * surrounding Campus router. Exact v2 traffic is consumed by E8; non-v2 traffic
 * is left untouched so the existing legacy chain can continue.
 */
function ELV2_tryHandleCampusPostAtOuterGuard(rawRequest, serializer, options) {
  if (typeof serializer !== 'function') {
    throw new Error('ELV2_OUTER_SERIALIZER_REQUIRED');
  }
  var routed = ELV2_tryHandleCampusPost(rawRequest, options || {});
  if (!routed || routed.handled !== true) {
    return Object.freeze({ handled: false });
  }
  return Object.freeze({
    handled: true,
    output: serializer(routed.response)
  });
}
