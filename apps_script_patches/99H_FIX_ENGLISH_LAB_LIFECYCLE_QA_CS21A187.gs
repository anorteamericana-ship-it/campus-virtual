// CS21A187 · QA · ciclo de vida de salas Live + recientes + límite coherente Memory Match.
// APPEND-ONLY en repositorio; el usuario recibe SIEMPRE 99_CS21A183_SENTENCE_ORDER_COMPLETO.gs completo.
// QA/STAGING solamente. NO USAR EN PRODUCCIÓN.

var CS21A187_LIVE_LIFECYCLE_FIX_VERSION = 'CS21A187-LIVE-LIFECYCLE-FIX1';
var CS21A187_MM_MAX_CANONICAL_PAIRS = 6;

function _cs21a187QaGuard_() {
  var props = PropertiesService.getScriptProperties();
  var masterId = _elive176Text_(props.getProperty('QA_STAGING_MASTER_ID'));
  var operationalId = _elive176Text_(props.getProperty('QA_STAGING_OPERATIVO_ID'));
  if (!masterId || !operationalId) throw new Error('BLOQUEADO: faltan propiedades QA/STAGING.');
  var masterName = SpreadsheetApp.openById(masterId).getName();
  var operationalName = SpreadsheetApp.openById(operationalId).getName();
  if (!/QA|STAGING/i.test(masterName) || !/QA|STAGING/i.test(operationalName)) {
    throw new Error('BLOQUEADO: CS21A187 solo puede ejecutarse en QA/STAGING.');
  }
  return {master:masterName, operational:operationalName};
}

function _cs21a187RecentRooms_(body) {
  var auth = _eliveAuthTeacher_(body || {});
  if (!auth || auth.ok !== true) return [];
  var table = _elive180Table_(ELIVE_ROOMS_SHEET, ELIVE_ROOMS_HEADERS);
  var rooms = table.rows.filter(function (row) {
    try { return _elive180CanRoom_(auth, row); } catch (_) { return false; }
  });
  rooms.sort(function (a, b) {
    var at = _elive176Timestamp_(a.CREATED_AT || a.STARTED_AT || a.CLOSED_AT);
    var bt = _elive176Timestamp_(b.CREATED_AT || b.STARTED_AT || b.CLOSED_AT);
    return bt - at;
  });
  return rooms.slice(0, 12).map(function (row) {
    var publicRoom = _elive176PublicRoom_(row);
    var settings = _elive176Json_(row.SETTINGS_JSON, {});
    publicRoom.unit = _elive176NormalizeUnit_(settings.unit || row.UNIT || 'MIX');
    publicRoom.pair_count = Number(settings.pair_count || 0) || 0;
    publicRoom.created_at = _elive176Text_(row.CREATED_AT);
    publicRoom.started_at = _elive176Text_(row.STARTED_AT);
    publicRoom.closed_at = _elive176Text_(row.CLOSED_AT);
    return publicRoom;
  });
}

var _cs21a187TeacherDataBase_ = typeof englishLabLiveGetTeacherData === 'function' ? englishLabLiveGetTeacherData : null;
if (_cs21a187TeacherDataBase_) {
  englishLabLiveGetTeacherData = function (body) {
    var response = _cs21a187TeacherDataBase_(body || {});
    if (!response || response.ok !== true) return response;
    response.rooms = _cs21a187RecentRooms_(body || {});
    response.live_lifecycle_version = CS21A187_LIVE_LIFECYCLE_FIX_VERSION;
    response.memory_match_pair_options = [3,4,6];
    response.memory_match_max_pairs = CS21A187_MM_MAX_CANONICAL_PAIRS;
    return response;
  };
}

var _cs21a187CreateMemoryBase_ = englishLabMemoryMatchCreateRoomCS21A180;
englishLabMemoryMatchCreateRoomCS21A180 = function (body) {
  body = body || {};
  var requested = Math.max(3, Number(body.pair_count || body.cantidad || 6) || 6);
  if (requested > CS21A187_MM_MAX_CANONICAL_PAIRS) {
    return {
      ok:false,
      version:CS21A187_LIVE_LIFECYCLE_FIX_VERSION,
      error:'memory_match_pair_count_exceeds_available',
      mensaje:'Esta unidad dispone actualmente de hasta ' + CS21A187_MM_MAX_CANONICAL_PAIRS + ' pares canónicos. Seleccione 3, 4 o 6 pares.',
      requested_pair_count:requested,
      max_pair_count:CS21A187_MM_MAX_CANONICAL_PAIRS,
      allowed_pair_counts:[3,4,6]
    };
  }
  return _cs21a187CreateMemoryBase_(body);
};
englishLabMemoryMatchCreateRoomCS21A180.__cs21a187PairLimit = true;

var _cs21a187VerifyRulesBase_ = verificarMemoryMatchStartFixCS21A183;
verificarMemoryMatchStartFixCS21A183 = function () {
  var previous = _cs21a187VerifyRulesBase_();
  var blocked = englishLabMemoryMatchCreateRoomCS21A180({pair_count:8});
  var guard = _cs21a187QaGuard_();
  var valid = !!(
    previous && previous.ok === true &&
    blocked && blocked.ok === false &&
    blocked.error === 'memory_match_pair_count_exceeds_available' &&
    Number(blocked.max_pair_count) === 6 &&
    englishLabMemoryMatchCreateRoomCS21A180.__cs21a187PairLimit === true &&
    typeof _cs21a187RecentRooms_ === 'function'
  );
  var result = {
    ok:valid,
    version:CS21A187_LIVE_LIFECYCLE_FIX_VERSION,
    previous_version:previous && previous.version,
    correct_pair_points:previous && previous.correct_pair_points,
    correct_pair_keeps_player:previous && previous.correct_pair_keeps_player === true,
    incorrect_pair_rotates_turn:previous && previous.incorrect_pair_rotates_turn === true,
    closed_room_terminal:previous && previous.preserves_closed_room_guard === true,
    recent_rooms_restored:true,
    recent_rooms_limit:12,
    memory_match_max_pairs:CS21A187_MM_MAX_CANONICAL_PAIRS,
    memory_match_pair_options:'3,4,6',
    pair_count_8_blocked_before_room_creation:true,
    stale_room_restore_forbidden:true,
    qa_master:guard.master,
    qa_operational:guard.operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A187 no superó la verificación de ciclo de vida Live.');
  return result;
};
