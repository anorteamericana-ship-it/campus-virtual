/** English LAB LIVE v2 · strict dispatcher request envelope validation. */
var ELV2_ACTIONS = Object.freeze([
  'createRoom', 'joinRoom', 'getState', 'startRoom', 'prepareRound', 'openRound',
  'lockRound', 'revealRound', 'submitAttempt', 'closeRound', 'closeRoom'
]);

var ELV2_REQUEST_TOP_LEVEL_FIELDS = Object.freeze([
  'api_version', 'action', 'request_id', 'room_id', 'room_code', 'round_id',
  'client_seen_revision', 'payload'
]);

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

  if (request.client_seen_revision != null && (!Number.isInteger(request.client_seen_revision) || request.client_seen_revision < 0)) {
    throw new Error('ELV2_INVALID_CLIENT_REVISION');
  }

  var payload = request.payload == null ? {} : request.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('ELV2_INVALID_REQUEST_PAYLOAD');
  var reserved = ELV2_findReservedRequestField_(payload, '$.payload');
  if (reserved) throw new Error('ELV2_INVALID_RESERVED_FIELD:' + reserved.path + ':' + reserved.key);

  return Object.freeze({
    api_version: request.api_version,
    action: request.action,
    request_id: request.request_id || '',
    room_id: request.room_id || '',
    room_code: request.room_code || '',
    round_id: request.round_id || '',
    client_seen_revision: request.client_seen_revision == null ? null : request.client_seen_revision,
    payload: JSON.parse(JSON.stringify(payload))
  });
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
