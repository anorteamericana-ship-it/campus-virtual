/** English LAB LIVE v2 · safe event construction with no secret payloads. */
var ELV2_EVENT_SEVERITY = Object.freeze({
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SECURITY: 'SECURITY'
});

var ELV2_EVENT_FORBIDDEN_KEY_NORMALIZED = Object.freeze([
  'password', 'clave', 'sessiontoken', 'accesstoken', 'refreshtoken', 'oauthtoken',
  'apikey', 'authorization', 'cookie', 'correctanswer', 'answerkey', 'solution',
  'privatestate', 'privateresult'
]);

function ELV2_buildEvent(input, deps) {
  if (!input || !deps || !deps.clock || typeof deps.idFactory !== 'function') {
    throw new Error('ELV2_EVENT_INPUT_INVALID');
  }
  if (typeof input.event_type !== 'string' || !/^[A-Z0-9_]+$/.test(input.event_type)) {
    throw new Error('ELV2_EVENT_TYPE_INVALID');
  }
  var severity = input.severity || ELV2_EVENT_SEVERITY.INFO;
  if (!Object.prototype.hasOwnProperty.call(ELV2_EVENT_SEVERITY, severity)) {
    throw new Error('ELV2_EVENT_SEVERITY_INVALID');
  }
  var data = input.data == null ? {} : input.data;
  var leak = ELV2_findForbiddenEventKey_(data, '$');
  if (leak) throw new Error('ELV2_EVENT_SECRET_BLOCKED:' + leak.path + ':' + leak.key);

  return Object.freeze({
    event_id: deps.idFactory('event'),
    event_type: input.event_type,
    severity: severity,
    server_at: deps.clock.nowMs(),
    trace_id: input.trace_id || '',
    actor_user_id: input.actor_user_id || '',
    actor_role: input.actor_role || '',
    room_id: input.room_id || '',
    round_id: input.round_id || '',
    player_id: input.player_id || '',
    request_id: input.request_id || '',
    revision_before: input.revision_before == null ? null : input.revision_before,
    revision_after: input.revision_after == null ? null : input.revision_after,
    code: input.code || '',
    duration_ms: input.duration_ms == null ? null : input.duration_ms,
    data: JSON.parse(JSON.stringify(data)),
    service_version: ELV2_SERVICE_VERSION
  });
}

function ELV2_findForbiddenEventKey_(value, path) {
  if (Array.isArray(value)) {
    for (var i = 0; i < value.length; i += 1) {
      var arrayLeak = ELV2_findForbiddenEventKey_(value[i], path + '[' + i + ']');
      if (arrayLeak) return arrayLeak;
    }
    return null;
  }
  if (!value || typeof value !== 'object') return null;

  var keys = Object.keys(value);
  for (var j = 0; j < keys.length; j += 1) {
    var key = keys[j];
    var normalized = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (ELV2_EVENT_FORBIDDEN_KEY_NORMALIZED.indexOf(normalized) !== -1) {
      return { path: path + '.' + key, key: key };
    }
    var nested = ELV2_findForbiddenEventKey_(value[key], path + '.' + key);
    if (nested) return nested;
  }
  return null;
}
