/** English LAB LIVE v2 · positive public schema + recursive secret-key guard. */
var ELV2_HIDDEN_SOLUTION_PHASES = Object.freeze(['READY', 'OPEN', 'LOCKED']);
var ELV2_FORBIDDEN_PUBLIC_KEY_NORMALIZED = Object.freeze([
  'correct',
  'correctanswer',
  'answerkey',
  'solution',
  'solutions',
  'expectedanswer',
  'referenceanswer',
  'explanation',
  'rubricsecret',
  'targetsequence',
  'privatestate',
  'privateresult',
  'iscorrect',
  'pointsdelta'
]);

function ELV2_assertPublicViewSafe(view, phase, schema) {
  if (!view || typeof view !== 'object' || Array.isArray(view)) {
    throw new Error('ELV2_PUBLIC_VIEW_INVALID');
  }
  ELV2_assertPublicShape_(view, schema, '$');
  if (ELV2_HIDDEN_SOLUTION_PHASES.indexOf(phase) !== -1) {
    var leak = ELV2_findForbiddenPublicKey_(view, '$');
    if (leak) throw new Error('ELV2_ANSWER_LEAK_BLOCKED:' + leak.path + ':' + leak.key);
  }
  return true;
}

function ELV2_assertPublicShape_(value, schema, path) {
  if (schema === true) return;
  if (!schema || typeof schema !== 'object') throw new Error('ELV2_PUBLIC_SCHEMA_INVALID:' + path);

  if (Array.isArray(value)) {
    if (!Object.prototype.hasOwnProperty.call(schema, '$array')) {
      throw new Error('ELV2_PUBLIC_VIEW_SCHEMA_VIOLATION:' + path + ':array_not_allowed');
    }
    value.forEach(function (item, index) {
      ELV2_assertPublicShape_(item, schema.$array, path + '[' + index + ']');
    });
    return;
  }

  if (value == null || typeof value !== 'object') {
    throw new Error('ELV2_PUBLIC_VIEW_SCHEMA_VIOLATION:' + path + ':object_expected');
  }

  Object.keys(value).forEach(function (key) {
    if (!Object.prototype.hasOwnProperty.call(schema, key)) {
      throw new Error('ELV2_PUBLIC_VIEW_SCHEMA_VIOLATION:' + path + '.' + key + ':unexpected_key');
    }
    ELV2_assertPublicShape_(value[key], schema[key], path + '.' + key);
  });
}

function ELV2_findForbiddenPublicKey_(value, path) {
  if (Array.isArray(value)) {
    for (var i = 0; i < value.length; i += 1) {
      var arrayLeak = ELV2_findForbiddenPublicKey_(value[i], path + '[' + i + ']');
      if (arrayLeak) return arrayLeak;
    }
    return null;
  }

  if (!value || typeof value !== 'object') return null;

  var keys = Object.keys(value);
  for (var j = 0; j < keys.length; j += 1) {
    var key = keys[j];
    var normalized = ELV2_normalizePublicKey_(key);
    if (ELV2_FORBIDDEN_PUBLIC_KEY_NORMALIZED.indexOf(normalized) !== -1) {
      return { path: path + '.' + key, key: key };
    }
    var nestedLeak = ELV2_findForbiddenPublicKey_(value[key], path + '.' + key);
    if (nestedLeak) return nestedLeak;
  }
  return null;
}

function ELV2_normalizePublicKey_(key) {
  return String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
}
