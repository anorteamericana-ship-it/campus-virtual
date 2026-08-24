/** English LAB LIVE v2 · strict dispatcher request envelope validation. */
var ELV2_ACTIONS = Object.freeze([
  'createRoom', 'joinRoom', 'getState', 'startRoom', 'prepareRound', 'openRound',
  'lockRound', 'revealRound', 'submitAttempt', 'closeRound', 'closeRoom'
]);

var ELV2_REQUEST_TOP_LEVEL_FIELDS = Object.freeze([
  'api_version', 'action', 'request_id', 'room_id', 'room_code', 'round_id',
  'client_seen_revision', 'payload'
]);

var ELV2_ACTION_PAYLOAD_FIELDS = Object.freeze({
  createRoom: Object.freeze(['title', 'config']),
  joinRoom: Object.freeze([]),
  getState: Object.freeze(['view_mode']),
  startRoom: Object.freeze(['expected_revision']),
  prepareRound: Object.freeze(['expected_revision', 'game_id', 'content_ref', 'settings']),
  openRound: Object.freeze(['expected_revision', 'duration_ms']),
  lockRound: Object.freeze(['expected_revision']),
  revealRound: Object.freeze(['expected_revision', 'reveal_duration_ms']),
  submitAttempt: null,
  closeRound: Object.freeze(['expected_revision', 'reason']),
  closeRoom: Object.freeze(['expected_revision', 'reason'])
});

var ELV2_REQUEST_LIMITS = Object.freeze({
  max_payload_chars: 16384,
  max_depth: 8,
  max_object_keys: 128,
  max_array_items: 256,
  max_string_chars: 4096,
  max_request_id_chars: 128,
  max_resource_id_chars: 128,
  max_room_code_chars: 32
});

function ELV2_validateRequestEnvelope(request) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) throw new Error('ELV2_INVALID_REQUEST');
  if (request.api_version !== ELV2_API_VERSION) throw new Error('ELV2_INVALID_API_VERSION');
  if (ELV2_ACTIONS.indexOf(request.action) === -1) throw new Error('ELV2_INVALID_ACTION');

  Object.keys(request).forEach(function (key) {
    if (ELV2_REQUEST_TOP_LEVEL_FIELDS.indexOf(key) === -1) {
      throw new Error('ELV2_INVALID_REQUEST_FIELD:' + key);
    }
  });

  if (ELV2_MUTATING_ACTIONS.indexOf(request.action) !== -1) {
    ELV2_requireRequestId(request.action, request.request_id);
  }
  ELV2_validateOptionalString_(request.request_id, ELV2_REQUEST_LIMITS.max_request_id_chars, 'REQUEST_ID');
  ELV2_validateOptionalString_(request.room_id, ELV2_REQUEST_LIMITS.max_resource_id_chars, 'ROOM_ID');
  ELV2_validateOptionalString_(request.round_id, ELV2_REQUEST_LIMITS.max_resource_id_chars, 'ROUND_ID');
  ELV2_validateOptionalString_(request.room_code, ELV2_REQUEST_LIMITS.max_room_code_chars, 'ROOM_CODE');

  if (request.client_seen_revision != null && (!Number.isInteger(request.client_seen_revision) || request.client_seen_revision < 0)) {
    throw new Error('ELV2_INVALID_CLIENT_REVISION');
  }

  var payload = request.payload == null ? {} : request.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('ELV2_INVALID_REQUEST_PAYLOAD');

  ELV2_validateRequestComplexity_(payload, '$.payload', 0, { keys: 0 });
  var serializedPayload = JSON.stringify(payload);
  if (typeof serializedPayload !== 'string' || serializedPayload.length > ELV2_REQUEST_LIMITS.max_payload_chars) {
    throw new Error('ELV2_INVALID_REQUEST_PAYLOAD_SIZE');
  }

  var reserved = ELV2_findReservedRequestField_(payload, '$.payload');
  if (reserved) throw new Error('ELV2_INVALID_RESERVED_FIELD:' + reserved.path + ':' + reserved.key);

  ELV2_assertActionPayloadFields_(request.action, payload);

  return Object.freeze({
    api_version: request.api_version,
    action: request.action,
    request_id: request.request_id || '',
    room_id: request.room_id || '',
    room_code: request.room_code || '',
    round_id: request.round_id || '',
    client_seen_revision: request.client_seen_revision == null ? null : request.client_seen_revision,
    payload: JSON.parse(serializedPayload)
  });
}

function ELV2_assertActionPayloadFields_(action, payload) {
  var allowed = ELV2_ACTION_PAYLOAD_FIELDS[action];
  if (allowed == null) return true; // submitAttempt is closed by the selected GamePlugin schema.
  Object.keys(payload).forEach(function (key) {
    if (allowed.indexOf(key) === -1) throw new Error('ELV2_INVALID_ACTION_FIELD:' + action + ':' + key);
  });
  return true;
}

function ELV2_assertExactObjectFields_(value, allowedFields, errorCode) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(errorCode || 'ELV2_INVALID_REQUEST');
  var allowed = allowedFields || [];
  Object.keys(value).forEach(function (key) {
    if (allowed.indexOf(key) === -1) throw new Error(errorCode || 'ELV2_INVALID_REQUEST');
  });
  return true;
}

function ELV2_validateOptionalString_(value, maxChars, label) {
  if (value == null || value === '') return true;
  if (typeof value !== 'string' || value.length > maxChars) throw new Error('ELV2_INVALID_' + label);
  return true;
}

function ELV2_validateRequestComplexity_(value, path, depth, counter) {
  if (depth > ELV2_REQUEST_LIMITS.max_depth) throw new Error('ELV2_INVALID_REQUEST_DEPTH:' + path);
  if (typeof value === 'string') {
    if (value.length > ELV2_REQUEST_LIMITS.max_string_chars) throw new Error('ELV2_INVALID_REQUEST_STRING:' + path);
    return;
  }
  if (value == null || typeof value !== 'object') return;

  if (Array.isArray(value)) {
    if (value.length > ELV2_REQUEST_LIMITS.max_array_items) throw new Error('ELV2_INVALID_REQUEST_ARRAY:' + path);
    for (var i = 0; i < value.length; i += 1) {
      ELV2_validateRequestComplexity_(value[i], path + '[' + i + ']', depth + 1, counter);
    }
    return;
  }

  var keys = Object.keys(value);
  counter.keys += keys.length;
  if (counter.keys > ELV2_REQUEST_LIMITS.max_object_keys) throw new Error('ELV2_INVALID_REQUEST_KEYS:' + path);
  for (var j = 0; j < keys.length; j += 1) {
    ELV2_validateRequestComplexity_(value[keys[j]], path + '.' + keys[j], depth + 1, counter);
  }
}

function ELV2_findReservedRequestField_(value, path) {
  if (Array.isArray(value)) {
    for (var i = 0; i < value.length; i += 1) {
      var arrayHit = ELV2_findReservedRequestField_(value[i], path + '[' + i + ']');
      if (arrayHit) return arrayHit;
    }
    return null;
  }
  if (!value || typeof value !== 'object') return null;

  var reservedNormalized = ELV2_RESERVED_PAYLOAD_FIELDS.map(function (key) {
    return String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
  });
  var keys = Object.keys(value);
  for (var j = 0; j < keys.length; j += 1) {
    var key = keys[j];
    var normalized = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (reservedNormalized.indexOf(normalized) !== -1) return { path: path + '.' + key, key: key };
    var nested = ELV2_findReservedRequestField_(value[key], path + '.' + key);
    if (nested) return nested;
  }
  return null;
}
