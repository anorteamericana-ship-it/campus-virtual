/** English LAB LIVE v2 · strict isolated physical schema. */
var ELV2_TABLES = Object.freeze({
  ROOMS: Object.freeze({
    name: 'ENGLISH_LAB_LIVE_V2_ROOMS',
    headers: Object.freeze([
      'room_id', 'room_code', 'status', 'owner_user_id', 'owner_teacher_id', 'host_group_id',
      'join_policy', 'current_round_id', 'state_revision', 'title', 'config_json',
      'created_at', 'started_at', 'closed_at', 'close_reason', 'created_by_user_id',
      'created_service_version', 'updated_at'
    ])
  }),
  PLAYERS: Object.freeze({
    name: 'ENGLISH_LAB_LIVE_V2_PLAYERS',
    headers: Object.freeze([
      'player_id', 'room_id', 'student_id', 'room_student_key', 'display_name_snapshot',
      'home_group_id_snapshot', 'status', 'score_total', 'joined_at', 'last_seen_at', 'updated_at'
    ])
  }),
  ROUNDS: Object.freeze({
    name: 'ENGLISH_LAB_LIVE_V2_ROUNDS',
    headers: Object.freeze([
      'round_id', 'room_id', 'sequence_no', 'game_id', 'game_version', 'status',
      'content_ref', 'content_version', 'content_hash', 'content_snapshot_json',
      'private_state_json', 'settings_json', 'scoring_policy', 'visibility_model',
      'submission_policy', 'created_at', 'opened_at', 'ends_at', 'locked_at',
      'revealed_at', 'reveal_ends_at', 'closed_at', 'close_reason',
      'score_committed_at', 'updated_at'
    ])
  }),
  ATTEMPTS: Object.freeze({
    name: 'ENGLISH_LAB_LIVE_V2_ATTEMPTS',
    headers: Object.freeze([
      'attempt_id', 'room_id', 'round_id', 'player_id', 'student_id', 'request_id',
      'attempt_key', 'payload_hash', 'game_id', 'action_type', 'payload_json',
      'private_result_json', 'points_delta', 'score_status', 'client_seen_revision',
      'received_at', 'recorded_at', 'committed_at', 'created_revision'
    ])
  }),
  EVENTS: Object.freeze({
    name: 'ENGLISH_LAB_LIVE_V2_EVENTS',
    headers: Object.freeze([
      'event_id', 'event_type', 'severity', 'server_at', 'trace_id', 'actor_user_id',
      'actor_role', 'room_id', 'round_id', 'player_id', 'request_id', 'revision_before',
      'revision_after', 'code', 'duration_ms', 'data_json', 'service_version'
    ])
  }),
  IDEMPOTENCY: Object.freeze({
    name: 'ENGLISH_LAB_LIVE_V2_IDEMPOTENCY',
    headers: Object.freeze([
      'idempotency_id', 'scope_key', 'request_id', 'action', 'actor_user_id', 'room_id',
      'round_id', 'payload_hash', 'status', 'effect_type', 'effect_id', 'revision_after',
      'result_code', 'created_at', 'updated_at', 'expires_at'
    ])
  }),
  META: Object.freeze({
    name: 'ENGLISH_LAB_LIVE_V2_META',
    headers: Object.freeze([
      'schema_version', 'service_version', 'environment', 'initialized_at',
      'last_health_check_at', 'last_health_check_status'
    ])
  })
});

function ELV2_getTableSpec(tableKey) {
  var spec = ELV2_TABLES[tableKey];
  if (!spec) throw new Error('ELV2_SCHEMA_UNKNOWN_TABLE:' + tableKey);
  return spec;
}

function ELV2_validateHeaderSet(expectedHeaders, actualHeaders) {
  if (!Array.isArray(expectedHeaders) || !Array.isArray(actualHeaders)) {
    throw new Error('ELV2_SCHEMA_HEADERS_INVALID');
  }

  var expected = expectedHeaders.map(ELV2_normalizeHeader_);
  var actual = actualHeaders.map(ELV2_normalizeHeader_);
  var expectedSet = ELV2_countValues_(expected);
  var actualSet = ELV2_countValues_(actual);

  var duplicates = Object.keys(actualSet).filter(function (key) {
    return actualSet[key] > 1;
  }).sort();

  var missing = expected.filter(function (header) {
    return !Object.prototype.hasOwnProperty.call(actualSet, header);
  }).sort();

  var extra = actual.filter(function (header) {
    return !Object.prototype.hasOwnProperty.call(expectedSet, header);
  }).sort();

  var columnMap = {};
  actual.forEach(function (header, index) {
    if (header && !Object.prototype.hasOwnProperty.call(columnMap, header)) {
      columnMap[header] = index;
    }
  });

  return Object.freeze({
    ok: duplicates.length === 0 && missing.length === 0 && extra.length === 0 && actual.length === expected.length,
    duplicates: Object.freeze(duplicates),
    missing: Object.freeze(missing),
    extra: Object.freeze(extra),
    column_map: Object.freeze(columnMap)
  });
}

function ELV2_normalizeHeader_(value) {
  if (typeof value !== 'string') return String(value == null ? '' : value).trim();
  return value.trim();
}

function ELV2_countValues_(items) {
  var counts = {};
  items.forEach(function (item) {
    counts[item] = (counts[item] || 0) + 1;
  });
  return counts;
}
