/**
 * English LAB LIVE v2 · isolated Campus POST ownership boundary (E8).
 *
 * This file deliberately does NOT patch doPost or the legacy Router. It only defines
 * the exact ownership contract that a future release-controlled router integration
 * may call after parsing a POST body.
 */
var ELV2_ROUTE_BOUNDARY_TRACE_SEQ_ = 0;

function ELV2_isExactCampusV2Request(rawRequest) {
  return !!(
    rawRequest &&
    typeof rawRequest === 'object' &&
    !Array.isArray(rawRequest) &&
    Object.prototype.hasOwnProperty.call(rawRequest, 'api_version') &&
    rawRequest.api_version === ELV2_API_VERSION
  );
}

function ELV2_tryHandleCampusPost(rawRequest, options) {
  if (!ELV2_isExactCampusV2Request(rawRequest)) {
    return Object.freeze({ handled: false });
  }

  options = options || {};
  try {
    var runtimeFactory = typeof options.runtime_factory === 'function'
      ? options.runtime_factory
      : function () {
          return ELV2_createAppsScriptRuntime(options.runtime_options || {});
        };
    var runtime = runtimeFactory();
    if (!runtime || typeof runtime.dispatchTransport !== 'function') {
      throw new Error('ELV2_RUNTIME_DEPS_INVALID');
    }
    return Object.freeze({
      handled: true,
      response: runtime.dispatchTransport(rawRequest)
    });
  } catch (error) {
    return Object.freeze({
      handled: true,
      response: ELV2_routeBoundaryErrorEnvelope_(rawRequest, error, options)
    });
  }
}

function ELV2_routeBoundaryErrorEnvelope_(rawRequest, error, options) {
  options = options || {};
  var clock = options.clock && typeof options.clock.nowMs === 'function'
    ? options.clock
    : Object.freeze({ nowMs: function () { return Date.now(); } });
  var traceIdFactory = typeof options.trace_id_factory === 'function'
    ? options.trace_id_factory
    : function () {
        ELV2_ROUTE_BOUNDARY_TRACE_SEQ_ += 1;
        return 'trace:route-boundary:' + String(clock.nowMs()) + ':' + String(ELV2_ROUTE_BOUNDARY_TRACE_SEQ_);
      };
  return ELV2_runtimeErrorEnvelope_(rawRequest, error, clock, traceIdFactory);
}
