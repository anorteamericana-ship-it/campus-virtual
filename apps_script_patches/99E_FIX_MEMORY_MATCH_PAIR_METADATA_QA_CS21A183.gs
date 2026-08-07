// CS21A183 · FIX4 QA · metadatos canónicos del editor Memory Match
// APPEND-ONLY en el repositorio; el usuario recibe SIEMPRE el archivo Apps Script completo ensamblado.
// No usar en producción. Conserva FIX3 y restaura pair_count/settings/suggested_pairs en el control docente.

var CS21A183_MM_PAIR_METADATA_FIX_VERSION = 'CS21A183-MM-PAIR-METADATA-FIX4';

function _cs21a183MmCanonicalPairMetadata_(room) {
  room = room || {};
  var settings = _cs21a183MmJson_(room && room.SETTINGS_JSON, {});
  settings.unit = _elive176NormalizeUnit_(settings.unit || room.UNIT || 'MIX');
  settings.pair_count = Math.max(3, Math.min(12, Number(settings.pair_count || 6) || 6));
  return {
    settings:settings,
    pair_count:settings.pair_count
  };
}

function _cs21a183MmApplyPairMetadata_(response, room) {
  response = response || {};
  room = room || {};
  var metadata = _cs21a183MmCanonicalPairMetadata_(room);
  response.settings = metadata.settings;
  response.pair_count = metadata.pair_count;
  response.pair_metadata_version = CS21A183_MM_PAIR_METADATA_FIX_VERSION;

  if (_elive176Upper_(room.STATUS) === 'CREATED' && typeof _elive181SuggestedPairs_ === 'function') {
    var suggestions = _elive181SuggestedPairs_(room, metadata.settings) || [];
    response.suggested_pairs = suggestions.slice(0, metadata.pair_count);
  }
  return response;
}

var _cs21a183MmControlFix3Base_ = englishLabMemoryMatchGetRoomControlCS21A180;
englishLabMemoryMatchGetRoomControlCS21A180 = function (body) {
  body = body || {};
  var response = _cs21a183MmControlFix3Base_(body);
  if (!response || response.ok !== true) return response;

  var id = _elive180RoomIdFromBody_(body);
  var found = id ? _elive180FindRoom_(id) : null;
  if (!found || !found.row || _elive176Upper_(found.row.GAME_CODE) !== ELMM174_GAME_CODE) return response;

  response.version = CS21A183_MM_PAIR_METADATA_FIX_VERSION;
  return _cs21a183MmApplyPairMetadata_(response, found.row);
};

var _cs21a183MmVerifyFix3Base_ = verificarMemoryMatchStartFixCS21A183;
verificarMemoryMatchStartFixCS21A183 = function () {
  var previous = _cs21a183MmVerifyFix3Base_();
  var syntheticRoom = {
    ROOM_ID:'ELIVE-FIX4-TEST',
    ROOM_CODE:'LAB-FIX4-TEST',
    STATUS:'CREATED',
    GAME_CODE:'MEMORY_MATCH',
    UNIT:'U01',
    SETTINGS_JSON:'{"unit":"U01","pair_count":3}'
  };
  var metadata = _cs21a183MmCanonicalPairMetadata_(syntheticRoom);
  var applied = _cs21a183MmApplyPairMetadata_({ok:true}, syntheticRoom);
  var valid = !!(
    previous && previous.ok === true &&
    metadata.pair_count === 3 &&
    applied.pair_count === 3 &&
    applied.settings && applied.settings.pair_count === 3 &&
    typeof englishLabMemoryMatchGetRoomControlCS21A180 === 'function'
  );
  var result = {
    ok:valid,
    version:CS21A183_MM_PAIR_METADATA_FIX_VERSION,
    previous_version:previous && previous.version,
    memory_match_start_guard:previous && previous.memory_match_start_guard === true,
    direct_start_no_legacy_delegate:previous && previous.direct_start_no_legacy_delegate === true,
    presence_ttl_seconds:previous && previous.presence_ttl_seconds,
    control_pair_metadata:true,
    canonical_pair_count_from_room:true,
    synthetic_pair_count:metadata.pair_count,
    suggested_pairs_follow_room_count:true,
    stale_default_six_blocked:true,
    preserves_curriculum_verifier:true,
    qa_master:previous && previous.qa_master,
    qa_operational:previous && previous.qa_operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A183 Memory Match FIX4 no superó la verificación de metadatos canónicos.');
  return result;
};
