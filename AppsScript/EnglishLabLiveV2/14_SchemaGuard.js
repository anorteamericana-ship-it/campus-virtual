/** English LAB LIVE v2 · pure schema health and initialization planning. */
function ELV2_schemaHealthFromSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new Error('ELV2_SCHEMA_SNAPSHOT_INVALID');
  }

  var tables = {};
  var healthy = true;
  Object.keys(ELV2_TABLES).forEach(function (tableKey) {
    var spec = ELV2_TABLES[tableKey];
    var actualHeaders = snapshot[spec.name];
    if (!Array.isArray(actualHeaders)) {
      healthy = false;
      tables[tableKey] = Object.freeze({
        table_name: spec.name,
        status: 'MISSING',
        health: null
      });
      return;
    }

    var headerHealth = ELV2_validateHeaderSet(spec.headers, actualHeaders);
    if (!headerHealth.ok) healthy = false;
    tables[tableKey] = Object.freeze({
      table_name: spec.name,
      status: headerHealth.ok ? 'HEALTHY' : 'UNHEALTHY',
      health: headerHealth
    });
  });

  return Object.freeze({
    ok: healthy,
    schema_version: ELV2_SCHEMA_VERSION,
    tables: Object.freeze(tables)
  });
}

function ELV2_buildInitializeSchemaPlan(snapshot) {
  var health = ELV2_schemaHealthFromSnapshot(snapshot || {});
  var actions = [];
  var blockers = [];

  Object.keys(health.tables).forEach(function (tableKey) {
    var tableHealth = health.tables[tableKey];
    if (tableHealth.status === 'MISSING') {
      var spec = ELV2_getTableSpec(tableKey);
      actions.push(Object.freeze({
        action: 'CREATE_TABLE',
        table_key: tableKey,
        table_name: spec.name,
        headers: spec.headers
      }));
      return;
    }
    if (tableHealth.status === 'UNHEALTHY') {
      blockers.push(Object.freeze({
        table_key: tableKey,
        table_name: tableHealth.table_name,
        health: tableHealth.health
      }));
    }
  });

  return Object.freeze({
    ok: blockers.length === 0,
    result: blockers.length ? 'SCHEMA_UNHEALTHY' : (actions.length ? 'CREATE_REQUIRED' : 'ALREADY_HEALTHY'),
    actions: Object.freeze(actions),
    blockers: Object.freeze(blockers)
  });
}
