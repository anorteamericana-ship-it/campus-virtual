/** English LAB LIVE v2 · deterministic JSON for idempotency/integrity hashing. */
function ELV2_canonicalJson(value) {
  return JSON.stringify(ELV2_canonicalizeValue_(value, '$'));
}

function ELV2_canonicalizeValue_(value, path) {
  if (value === null) return null;

  var type = typeof value;
  if (type === 'string' || type === 'boolean') return value;

  if (type === 'number') {
    if (!isFinite(value)) throw new Error('ELV2_CANONICAL_JSON_NON_FINITE_NUMBER:' + path);
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(function (item, index) {
      return ELV2_canonicalizeValue_(item, path + '[' + index + ']');
    });
  }

  if (type === 'object' && Object.prototype.toString.call(value) === '[object Object]') {
    var output = {};
    Object.keys(value).sort().forEach(function (key) {
      output[key] = ELV2_canonicalizeValue_(value[key], path + '.' + key);
    });
    return output;
  }

  throw new Error('ELV2_CANONICAL_JSON_UNSUPPORTED_TYPE:' + path);
}
