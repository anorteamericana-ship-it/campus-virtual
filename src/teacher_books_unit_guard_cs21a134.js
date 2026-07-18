// F98.4-Z6-CS21A134 · Botonera U01–U16 estable para libros del docente.
// Corrige únicamente la respuesta de lectura del visor cuando el backend no
// entrega una secuencia completa, y restaura la secuencia histórica válida de
// B1 · SB si aparece la calibración conocida que desplaza cada unidad.
(function(){
  'use strict';

  var VERSION = 'F98.4-Z6-CS21A134';
  var ENDPOINT = 'teacherBooksOpenImageBook';
  var ORIGINAL_FETCH = window.fetch.bind(window);

  var UNIT_STARTS = {
    'B1|SB': [8,14,22,28,36,42,50,56,64,70,78,84,92,98,106,112],
    'B1|TB': [25,33,43,51,61,69,79,87,97,105,115,123,133,141,151,159],
    'B1|WB': [5,11,17,23,29,35,41,47,53,59,65,71,77,83,89,95],
    'B2|TB': [27,35,45,53,63,71,81,89,99,107,117,125,135,143,153,161],
    'B2|WB': [6,12,18,24,30,36,42,48,54,60,66,72,78,84,90,96],
    'I1|TB': [27,35,45,53,63,71,81,89,99,107,117,125,135,143,153,161],
    'I1|WB': [6,12,18,24,30,36,42,48,54,60,66,72,78,84,90,96],
    'I2|TB': [27,35,45,53,63,71,81,89,99,107,117,125,135,143,153,161],
    'I2|WB': [5,11,17,23,29,35,41,47,53,59,65,71,77,83,89,95]
  };

  var KNOWN_BAD_B1_SB = [9,15,23,29,37,43,51,57,65,71,79,85,93,99,107,113];

  function text(value){ return String(value == null ? '' : value).trim(); }
  function upper(value){ return text(value).toUpperCase(); }
  function validPage(value){
    var number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  }
  function normalized(values){
    return Array.from({ length:16 }, function(_, index){ return validPage(values && values[index]); });
  }
  function complete(values){
    return Array.isArray(values) && values.length >= 16 && normalized(values).every(function(value){ return value != null; });
  }
  function same(values, expected){
    var left = normalized(values);
    var right = normalized(expected);
    return left.every(function(value, index){ return value === right[index]; });
  }
  function currentRole(){
    try {
      var session = typeof window.getSesion === 'function'
        ? window.getSesion()
        : JSON.parse(sessionStorage.getItem('an_usuario') || 'null');
      return upper(session && (session.rol || session.role));
    } catch (_) { return ''; }
  }
  function teacherSurface(){
    var role = currentRole();
    return role === 'TEACHER' || role === 'DOCENTE';
  }
  function keyOf(data){
    return upper(data && (data.level || data.nivel)) + '|' + upper(data && (data.book_type || data.type || data.tipo));
  }

  function repairPayload(data){
    if (!data || data.ok !== true || !teacherSurface()) return data;
    var key = keyOf(data);
    var fallback = UNIT_STARTS[key];
    if (!fallback) return data;

    var raw = Array.isArray(data.unit_starts) ? data.unit_starts : [];
    var shouldRepairKnownB1 = key === 'B1|SB' && same(raw, KNOWN_BAD_B1_SB);
    var shouldFillMissing = !complete(raw);
    if (!shouldRepairKnownB1 && !shouldFillMissing) return data;

    var next = shouldRepairKnownB1
      ? fallback.slice()
      : fallback.map(function(value, index){ return validPage(raw[index]) || value; });

    return Object.assign({}, data, {
      unit_starts: next,
      unit_starts_configured: 16,
      unit_starts_source: text(data.unit_starts_source)
        ? data.unit_starts_source + '|CS21A134_TEACHER_REPAIR'
        : 'CS21A134_TEACHER_REPAIR',
      unit_starts_repaired_frontend: true,
      unit_starts_repair_version: VERSION
    });
  }

  function isTarget(input){
    var url = typeof input === 'string' ? input : text(input && input.url);
    try {
      var parsed = new URL(url, window.location.href);
      return upper(parsed.searchParams.get('fn')) === upper(ENDPOINT);
    } catch (_) {
      return url.toLowerCase().indexOf('fn=' + ENDPOINT.toLowerCase()) >= 0;
    }
  }

  function rebuiltResponse(response, data){
    if (typeof Response !== 'function' || typeof Headers !== 'function') return response;
    var headers = new Headers(response.headers || undefined);
    headers.delete('content-length');
    headers.delete('content-encoding');
    if (!headers.has('content-type')) headers.set('content-type', 'application/json;charset=utf-8');
    return new Response(JSON.stringify(data), {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });
  }

  function guardedFetch(input, init){
    return ORIGINAL_FETCH(input, init).then(function(response){
      if (!isTarget(input) || !response || !response.ok || typeof response.clone !== 'function') return response;
      return response.clone().json().then(function(data){
        var repaired = repairPayload(data);
        return repaired === data ? response : rebuiltResponse(response, repaired);
      }).catch(function(){ return response; });
    });
  }
  guardedFetch.__cs21a134 = true;
  guardedFetch.__base = ORIGINAL_FETCH;
  window.fetch = guardedFetch;

  window.__AN_TEACHER_BOOK_UNIT_GUARD_CS21A134 = {
    version: VERSION,
    endpoint: ENDPOINT,
    maps: UNIT_STARTS,
    known_bad_b1_sb: KNOWN_BAD_B1_SB,
    repairPayload: repairPayload,
    complete: complete
  };
})();
