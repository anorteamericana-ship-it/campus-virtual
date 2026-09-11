/**
 * English LAB LIVE v2 · physical Sheets persistence boundary (E3).
 *
 * Runtime-ready but intentionally NOT wired to doPost/doGet. The domain Store uses an
 * injected driver so synthetic tests can prove persistence/reload semantics without
 * touching Apps Script QA. Every write path re-validates the complete V2 schema.
 */
var ELV2_PHYSICAL_JSON_FIELDS = Object.freeze({
  config_json: 'config',
  content_snapshot_json: 'content_snapshot',
  private_state_json: 'private_state',
  settings_json: 'settings',
  payload_json: 'payload',
  private_result_json: 'private_result',
  data_json: 'data'
});

var ELV2_PHYSICAL_NULLABLE_FIELDS = Object.freeze([
  'owner_teacher_id', 'current_round_id', 'started_at', 'closed_at',
  'opened_at', 'ends_at', 'locked_at', 'revealed_at', 'reveal_ends_at',
  'score_committed_at', 'client_seen_revision', 'committed_at',
  'revision_before', 'revision_after', 'duration_ms', 'expires_at'
]);

function ELV2_createSheetsStore(driver) {
  ELV2_assertSheetsDriver_(driver);

  function createRoom(room) {
    ELV2_assertAllV2TablesHealthy_(driver);
    var table = ELV2_readPhysicalTable_(driver, 'ROOMS');
    if (ELV2_findPhysicalRow_(table, function (item) {
      return item.room_id === room.room_id || item.room_code === room.room_code;
    })) throw new Error('ELV2_STORE_ROOM_CONFLICT');
    ELV2_appendPhysicalEntity_(driver, table, room);
    return ELV2_clonePhysical_(room);
  }

  function updateRoom(room) {
    ELV2_assertAllV2TablesHealthy_(driver);
    var table = ELV2_readPhysicalTable_(driver, 'ROOMS');
    var found = ELV2_findPhysicalRow_(table, function (item) { return item.room_id === room.room_id; });
    if (!found) throw new Error('ELV2_STORE_ROOM_NOT_FOUND');
    if (found.entity.room_code !== room.room_code) throw new Error('ELV2_STORE_ROOM_CODE_IMMUTABLE');
    var codeOwner = ELV2_findPhysicalRow_(table, function (item) {
      return item.room_code === room.room_code && item.room_id !== room.room_id;
    });
    if (codeOwner) throw new Error('ELV2_STORE_ROOM_CONFLICT');
    ELV2_updatePhysicalEntity_(driver, table, found.index, room);
    return ELV2_clonePhysical_(room);
  }

  function getRoom(roomId) {
    var table = ELV2_readPhysicalTable_(driver, 'ROOMS');
    var found = ELV2_findPhysicalRow_(table, function (item) { return item.room_id === roomId; });
    return found ? found.entity : null;
  }

  function findRoomByCode(roomCode) {
    var table = ELV2_readPhysicalTable_(driver, 'ROOMS');
    var found = ELV2_findPhysicalRow_(table, function (item) { return item.room_code === roomCode; });
    return found ? found.entity : null;
  }

  function createPlayer(player) {
    ELV2_assertAllV2TablesHealthy_(driver);
    ELV2_assertDerivedKey_(player.room_student_key, player.room_id + '|' + player.student_id, 'PLAYER');
    var table = ELV2_readPhysicalTable_(driver, 'PLAYERS');
    if (ELV2_findPhysicalRow_(table, function (item) {
      return item.player_id === player.player_id || item.room_student_key === player.room_student_key;
    })) throw new Error('ELV2_STORE_PLAYER_CONFLICT');
    ELV2_appendPhysicalEntity_(driver, table, player);
    return ELV2_clonePhysical_(player);
  }

  function updatePlayer(player) {
    ELV2_assertAllV2TablesHealthy_(driver);
    ELV2_assertDerivedKey_(player.room_student_key, player.room_id + '|' + player.student_id, 'PLAYER');
    var table = ELV2_readPhysicalTable_(driver, 'PLAYERS');
    var found = ELV2_findPhysicalRow_(table, function (item) { return item.player_id === player.player_id; });
    if (!found) throw new Error('ELV2_STORE_PLAYER_NOT_FOUND');
    if (found.entity.room_student_key !== player.room_student_key) throw new Error('ELV2_STATE_INTEGRITY_FAILED');
    ELV2_updatePhysicalEntity_(driver, table, found.index, player);
    return ELV2_clonePhysical_(player);
  }

  function getPlayer(playerId) {
    var table = ELV2_readPhysicalTable_(driver, 'PLAYERS');
    var found = ELV2_findPhysicalRow_(table, function (item) { return item.player_id === playerId; });
    return found ? found.entity : null;
  }

  function getPlayerByRoomStudent(roomId, studentId) {
    var key = roomId + '|' + studentId;
    var table = ELV2_readPhysicalTable_(driver, 'PLAYERS');
    var found = ELV2_findPhysicalRow_(table, function (item) { return item.room_student_key === key; });
    return found ? found.entity : null;
  }

  function listPlayersByRoom(roomId) {
    return ELV2_readPhysicalTable_(driver, 'PLAYERS').entities.filter(function (item) {
      return item.room_id === roomId;
    }).map(ELV2_clonePhysical_);
  }

  function createRound(round) {
    ELV2_assertAllV2TablesHealthy_(driver);
    var table = ELV2_readPhysicalTable_(driver, 'ROUNDS');
    if (ELV2_findPhysicalRow_(table, function (item) {
      return item.round_id === round.round_id ||
        (item.room_id === round.room_id && item.sequence_no === round.sequence_no);
    })) throw new Error('ELV2_STORE_ROUND_CONFLICT');
    ELV2_appendPhysicalEntity_(driver, table, round);
    return ELV2_clonePhysical_(round);
  }

  function updateRound(round) {
    ELV2_assertAllV2TablesHealthy_(driver);
    var table = ELV2_readPhysicalTable_(driver, 'ROUNDS');
    var found = ELV2_findPhysicalRow_(table, function (item) { return item.round_id === round.round_id; });
    if (!found) throw new Error('ELV2_STORE_ROUND_NOT_FOUND');
    if (found.entity.room_id !== round.room_id || found.entity.sequence_no !== round.sequence_no) {
      throw new Error('ELV2_STATE_INTEGRITY_FAILED');
    }
    ELV2_updatePhysicalEntity_(driver, table, found.index, round);
    return ELV2_clonePhysical_(round);
  }

  function getRound(roundId) {
    var table = ELV2_readPhysicalTable_(driver, 'ROUNDS');
    var found = ELV2_findPhysicalRow_(table, function (item) { return item.round_id === roundId; });
    return found ? found.entity : null;
  }

  function listRoundsByRoom(roomId) {
    return ELV2_readPhysicalTable_(driver, 'ROUNDS').entities.filter(function (item) {
      return item.room_id === roomId;
    }).sort(function (a, b) {
      return a.sequence_no - b.sequence_no;
    }).map(ELV2_clonePhysical_);
  }

  function createAttempt(attempt) {
    ELV2_assertAllV2TablesHealthy_(driver);
    var expectedKey = ELV2_attemptKeyMaterial(attempt.room_id, attempt.round_id, attempt.student_id, attempt.request_id);
    ELV2_assertDerivedKey_(attempt.attempt_key, expectedKey, 'ATTEMPT');
    if (typeof attempt.payload_hash !== 'string' || !attempt.payload_hash) {
      throw new Error('ELV2_STATE_INTEGRITY_FAILED');
    }
    var table = ELV2_readPhysicalTable_(driver, 'ATTEMPTS');
    if (ELV2_findPhysicalRow_(table, function (item) {
      return item.attempt_id === attempt.attempt_id || item.attempt_key === attempt.attempt_key;
    })) throw new Error('ELV2_STORE_ATTEMPT_CONFLICT');
    ELV2_appendPhysicalEntity_(driver, table, attempt);
    return ELV2_clonePhysical_(attempt);
  }

  function updateAttempt(attempt) {
    ELV2_assertAllV2TablesHealthy_(driver);
    var table = ELV2_readPhysicalTable_(driver, 'ATTEMPTS');
    var found = ELV2_findPhysicalRow_(table, function (item) { return item.attempt_id === attempt.attempt_id; });
    if (!found) throw new Error('ELV2_STORE_ATTEMPT_NOT_FOUND');
    if (found.entity.attempt_key !== attempt.attempt_key || found.entity.payload_hash !== attempt.payload_hash) {
      throw new Error('ELV2_STATE_INTEGRITY_FAILED');
    }
    ELV2_updatePhysicalEntity_(driver, table, found.index, attempt);
    return ELV2_clonePhysical_(attempt);
  }

  function getAttemptByKey(attemptKey) {
    var table = ELV2_readPhysicalTable_(driver, 'ATTEMPTS');
    var found = ELV2_findPhysicalRow_(table, function (item) { return item.attempt_key === attemptKey; });
    return found ? found.entity : null;
  }

  function listAttemptsByRound(roundId) {
    return ELV2_readPhysicalTable_(driver, 'ATTEMPTS').entities.filter(function (item) {
      return item.round_id === roundId;
    }).map(ELV2_clonePhysical_);
  }

  return Object.freeze({
    createRoom: createRoom,
    updateRoom: updateRoom,
    getRoom: getRoom,
    findRoomByCode: findRoomByCode,
    createPlayer: createPlayer,
    updatePlayer: updatePlayer,
    getPlayer: getPlayer,
    getPlayerByRoomStudent: getPlayerByRoomStudent,
    listPlayersByRoom: listPlayersByRoom,
    createRound: createRound,
    updateRound: updateRound,
    getRound: getRound,
    listRoundsByRoom: listRoundsByRoom,
    createAttempt: createAttempt,
    updateAttempt: updateAttempt,
    getAttemptByKey: getAttemptByKey,
    listAttemptsByRound: listAttemptsByRound
  });
}

function ELV2_createSheetsIdempotencyStore(driver) {
  ELV2_assertSheetsDriver_(driver);
  return Object.freeze({
    getByScopeKey: function (scopeKey) {
      var table = ELV2_readPhysicalTable_(driver, 'IDEMPOTENCY');
      var found = ELV2_findPhysicalRow_(table, function (item) { return item.scope_key === scopeKey; });
      return found ? found.entity : null;
    },
    create: function (record) {
      ELV2_assertAllV2TablesHealthy_(driver);
      var table = ELV2_readPhysicalTable_(driver, 'IDEMPOTENCY');
      if (ELV2_findPhysicalRow_(table, function (item) {
        return item.scope_key === record.scope_key || item.idempotency_id === record.idempotency_id;
      })) throw new Error('ELV2_IDEMPOTENCY_STORE_CONFLICT');
      ELV2_appendPhysicalEntity_(driver, table, record);
      return ELV2_clonePhysical_(record);
    },
    update: function (record) {
      ELV2_assertAllV2TablesHealthy_(driver);
      var table = ELV2_readPhysicalTable_(driver, 'IDEMPOTENCY');
      var found = ELV2_findPhysicalRow_(table, function (item) { return item.idempotency_id === record.idempotency_id; });
      if (!found || found.entity.scope_key !== record.scope_key) throw new Error('ELV2_IDEMPOTENCY_STORE_NOT_FOUND');
      ELV2_updatePhysicalEntity_(driver, table, found.index, record);
      return ELV2_clonePhysical_(record);
    }
  });
}

function ELV2_createSheetsEventStore(driver) {
  ELV2_assertSheetsDriver_(driver);
  return Object.freeze({
    append: function (event) {
      ELV2_assertAllV2TablesHealthy_(driver);
      var table = ELV2_readPhysicalTable_(driver, 'EVENTS');
      if (ELV2_findPhysicalRow_(table, function (item) { return item.event_id === event.event_id; })) {
        throw new Error('ELV2_EVENT_STORE_CONFLICT');
      }
      ELV2_appendPhysicalEntity_(driver, table, event);
      return ELV2_clonePhysical_(event);
    }
  });
}

function ELV2_captureSheetsSchemaSnapshot(driver) {
  ELV2_assertSheetsDriver_(driver);
  var snapshot = {};
  Object.keys(ELV2_TABLES).forEach(function (tableKey) {
    var spec = ELV2_TABLES[tableKey];
    var headers = driver.getHeaders(spec.name);
    if (Array.isArray(headers)) snapshot[spec.name] = headers.slice();
  });
  return snapshot;
}

function ELV2_initializeSheetsSchema(driver, options) {
  ELV2_assertSheetsDriver_(driver);
  if (typeof driver.createTable !== 'function') throw new Error('ELV2_SHEETS_DRIVER_INIT_UNAVAILABLE');
  var plan = ELV2_buildInitializeSchemaPlan(ELV2_captureSheetsSchemaSnapshot(driver));
  if (!plan.ok) throw new Error('ELV2_SCHEMA_UNHEALTHY');

  var created = [];
  plan.actions.forEach(function (action) {
    driver.createTable(action.table_name, action.headers.slice());
    created.push(action.table_name);
  });

  if (created.indexOf(ELV2_TABLES.META.name) !== -1) {
    var now = options && options.now_ms != null ? options.now_ms : new Date().getTime();
    var environment = options && typeof options.environment === 'string' && options.environment.trim()
      ? options.environment.trim()
      : 'UNSPECIFIED';
    var meta = {
      schema_version: ELV2_SCHEMA_VERSION,
      service_version: ELV2_SERVICE_VERSION,
      environment: environment,
      initialized_at: now,
      last_health_check_at: now,
      last_health_check_status: 'HEALTHY'
    };
    var metaTable = ELV2_readPhysicalTable_(driver, 'META');
    ELV2_appendPhysicalEntity_(driver, metaTable, meta);
  }

  var health = ELV2_schemaHealthFromSnapshot(ELV2_captureSheetsSchemaSnapshot(driver));
  if (!health.ok) throw new Error('ELV2_SCHEMA_UNHEALTHY');
  return Object.freeze({
    result: created.length ? 'CREATED' : 'ALREADY_HEALTHY',
    created_tables: Object.freeze(created.slice()),
    schema_version: ELV2_SCHEMA_VERSION
  });
}

function ELV2_createAppsScriptSheetsDriver(spreadsheetId) {
  if (typeof SpreadsheetApp === 'undefined') throw new Error('ELV2_SHEETS_RUNTIME_UNAVAILABLE');
  var id = String(spreadsheetId || '').trim();
  if (!id) throw new Error('ELV2_SHEETS_ID_REQUIRED');
  var spreadsheet = SpreadsheetApp.openById(id);

  function sheet_(name) { return spreadsheet.getSheetByName(name); }

  return Object.freeze({
    getHeaders: function (tableName) {
      var sheet = sheet_(tableName);
      if (!sheet) return null;
      var lastColumn = sheet.getLastColumn();
      if (lastColumn < 1 || sheet.getLastRow() < 1) return [];
      return sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    },
    readRows: function (tableName) {
      var sheet = sheet_(tableName);
      if (!sheet) return null;
      var lastColumn = sheet.getLastColumn();
      var lastRow = sheet.getLastRow();
      if (lastColumn < 1 || lastRow < 2) return [];
      return sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
    },
    appendRow: function (tableName, values) {
      var sheet = sheet_(tableName);
      if (!sheet) throw new Error('ELV2_SCHEMA_UNHEALTHY');
      var row = Math.max(2, sheet.getLastRow() + 1);
      sheet.getRange(row, 1, 1, values.length).setValues([values]);
    },
    updateRow: function (tableName, dataIndex, values) {
      var sheet = sheet_(tableName);
      if (!sheet) throw new Error('ELV2_SCHEMA_UNHEALTHY');
      sheet.getRange(dataIndex + 2, 1, 1, values.length).setValues([values]);
    },
    createTable: function (tableName, headers) {
      if (sheet_(tableName)) throw new Error('ELV2_SCHEMA_TABLE_EXISTS:' + tableName);
      var sheet = spreadsheet.insertSheet(tableName);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
  });
}

function ELV2_assertAllV2TablesHealthy_(driver) {
  var health = ELV2_schemaHealthFromSnapshot(ELV2_captureSheetsSchemaSnapshot(driver));
  if (!health.ok) throw new Error('ELV2_SCHEMA_UNHEALTHY');
  return health;
}

function ELV2_readPhysicalTable_(driver, tableKey) {
  var spec = ELV2_getTableSpec(tableKey);
  var headers = driver.getHeaders(spec.name);
  if (!Array.isArray(headers)) throw new Error('ELV2_SCHEMA_UNHEALTHY');
  var headerHealth = ELV2_validateHeaderSet(spec.headers, headers);
  if (!headerHealth.ok) throw new Error('ELV2_SCHEMA_UNHEALTHY');
  var rows = driver.readRows(spec.name);
  if (!Array.isArray(rows)) throw new Error('ELV2_SCHEMA_UNHEALTHY');
  var entities = rows.map(function (row) {
    if (!Array.isArray(row)) throw new Error('ELV2_STATE_INTEGRITY_FAILED');
    return ELV2_physicalRowToEntity_(headers, row);
  });
  return {
    table_key: tableKey,
    table_name: spec.name,
    headers: headers.slice(),
    rows: rows,
    entities: entities
  };
}

function ELV2_physicalRowToEntity_(headers, row) {
  var entity = {};
  headers.forEach(function (header, index) {
    var domainKey = ELV2_PHYSICAL_JSON_FIELDS[header] || header;
    var value = row[index];
    if (Object.prototype.hasOwnProperty.call(ELV2_PHYSICAL_JSON_FIELDS, header)) {
      if (typeof value !== 'string' || !value) throw new Error('ELV2_STATE_INTEGRITY_FAILED');
      try {
        entity[domainKey] = JSON.parse(ELV2_decodeSheetText_(value));
      } catch (_) {
        throw new Error('ELV2_STATE_INTEGRITY_FAILED');
      }
      return;
    }
    if ((value === '' || value == null) && ELV2_PHYSICAL_NULLABLE_FIELDS.indexOf(header) !== -1) {
      entity[domainKey] = null;
      return;
    }
    entity[domainKey] = typeof value === 'string' ? ELV2_decodeSheetText_(value) : value;
  });
  return entity;
}

function ELV2_entityToPhysicalRow_(headers, entity) {
  return headers.map(function (header) {
    var domainKey = ELV2_PHYSICAL_JSON_FIELDS[header] || header;
    var value = entity[domainKey];
    if (Object.prototype.hasOwnProperty.call(ELV2_PHYSICAL_JSON_FIELDS, header)) {
      var serialized;
      try { serialized = JSON.stringify(value); } catch (_) { throw new Error('ELV2_STATE_INTEGRITY_FAILED'); }
      if (typeof serialized !== 'string') throw new Error('ELV2_STATE_INTEGRITY_FAILED');
      return ELV2_encodeSheetText_(serialized);
    }
    if (value == null) return '';
    return typeof value === 'string' ? ELV2_encodeSheetText_(value) : value;
  });
}

function ELV2_appendPhysicalEntity_(driver, table, entity) {
  driver.appendRow(table.table_name, ELV2_entityToPhysicalRow_(table.headers, entity));
}

function ELV2_updatePhysicalEntity_(driver, table, dataIndex, entity) {
  driver.updateRow(table.table_name, dataIndex, ELV2_entityToPhysicalRow_(table.headers, entity));
}

function ELV2_findPhysicalRow_(table, predicate) {
  for (var i = 0; i < table.entities.length; i += 1) {
    if (predicate(table.entities[i])) return { index: i, entity: ELV2_clonePhysical_(table.entities[i]) };
  }
  return null;
}

function ELV2_assertDerivedKey_(actual, expected, kind) {
  if (typeof actual !== 'string' || actual !== expected) {
    throw new Error('ELV2_STATE_INTEGRITY_FAILED:' + kind + '_KEY');
  }
}

function ELV2_encodeSheetText_(value) {
  var text = String(value);
  if (!text) return text;
  if (text.charAt(0) === "'" || /^[=+\-@]/.test(text)) return "'" + text;
  return text;
}

function ELV2_decodeSheetText_(value) {
  var text = String(value);
  if (text.length < 2 || text.charAt(0) !== "'") return text;
  var second = text.charAt(1);
  if (second === "'" || /^[=+\-@]$/.test(second)) return text.slice(1);
  return text;
}

function ELV2_clonePhysical_(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function ELV2_assertSheetsDriver_(driver) {
  if (!driver || typeof driver.getHeaders !== 'function' || typeof driver.readRows !== 'function' ||
      typeof driver.appendRow !== 'function' || typeof driver.updateRow !== 'function') {
    throw new Error('ELV2_SHEETS_DRIVER_INVALID');
  }
}
