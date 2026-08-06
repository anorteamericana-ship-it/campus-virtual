// CS21A181 · CAPA ADITIVA QA PARA ENGLISH LAB
// Instalar despues de 97_ACTUALIZACION_QA.gs. No usar en produccion.
// Mantiene intacto CS21A180 y agrega sugerencias editables para Memory Match.

var ELIVE181_VERSION = 'CS21A181';
var ELIVE181_OBJECTIVE = 'Carga visible y parejas sugeridas editables antes de iniciar Memory Match';

function _elive181CustomPairs_(value) {
  var raw = value;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); }
    catch (_) {
      raw = raw.split(/\r?\n/).map(function (line) {
        var parts = String(line || '').split(/\s*(?:=|→|\|)\s*/);
        return {
          left:_elive176Text_(parts.shift()),
          right:_elive176Text_(parts.join(' = '))
        };
      });
    }
  }
  if (!Array.isArray(raw)) return [];
  var seen = {};
  return raw.map(function (pair) {
    var left = _elive176Text_(pair && (pair.left || pair.word || pair.PAIR_LEFT));
    var right = _elive176Text_(pair && (pair.right || pair.meaning || pair.PAIR_RIGHT));
    var key = _elive176Upper_(left);
    if (!left || !right || seen[key]) return null;
    seen[key] = true;
    return {left:left,right:right};
  }).filter(function (pair) { return !!pair; }).slice(0, 12);
}

function _elive181CardsFromPairs_(room, pairs) {
  var cards = [];
  pairs.forEach(function (pair, index) {
    var pairId = 'CUSTOM-' + (index + 1);
    cards.push({
      card_id:pairId + '-L', pair_id:pairId, face_type:'TEXT',
      label:pair.left, media_id:''
    });
    cards.push({
      card_id:pairId + '-R', pair_id:pairId, face_type:'TEXT',
      label:pair.right, media_id:''
    });
  });
  return _elmm174Shuffle_(cards, room.ROOM_CODE + '|CUSTOM-CARDS-CS21A181');
}

function _elive181SuggestedPairs_(room, settings) {
  var count = Math.max(3, Math.min(12, Number(settings.pair_count || 6) || 6));
  var level = _elive176Upper_(room.NIVEL || settings.level || 'B1');
  var unit = _elive176NormalizeUnit_(settings.unit || room.UNIT || 'MIX');
  var rows = _elmm174Shuffle_(
    _elive176PairRows_(level, unit),
    room.ROOM_CODE + '|SUGGESTIONS-CS21A181|' + unit + '|' + level
  ).slice(0, count);
  return rows.map(function (row) {
    return {
      left:_elive176Text_(row.PAIR_LEFT || row.STEM),
      right:_elive176Text_(row.PAIR_RIGHT)
    };
  });
}

var _elive181CardsBase_ = _elive176Cards_;
_elive176Cards_ = function (room, pairCount) {
  var settings = _elmm174Settings_(room);
  var customPairs = _elive181CustomPairs_(settings.custom_pairs);
  if (!customPairs.length) return _elive181CardsBase_(room, pairCount);
  var expected = Math.max(3, Math.min(12, Number(pairCount || settings.pair_count || 6) || 6));
  if (customPairs.length !== expected) {
    throw new Error('La sala requiere exactamente ' + expected + ' parejas personalizadas.');
  }
  return _elive181CardsFromPairs_(room, customPairs);
};

var _elive181StartBase_ = englishLabMemoryMatchStartRoomCS21A176;
englishLabMemoryMatchStartRoomCS21A176 = function (body) {
  body = body || {};
  var rawCustom = body.custom_pairs || body.customPairs || '';
  if (rawCustom) {
    var pairs = _elive181CustomPairs_(rawCustom);
    var managed = _elmm174FindManagedRoom_(body);
    if (!managed.ok) return managed.response;
    var settings = _elmm174Settings_(managed.room);
    var expected = Math.max(3, Math.min(12, Number(settings.pair_count || 6) || 6));
    if (pairs.length !== expected) {
      return {
        ok:false,
        version:ELIVE181_VERSION,
        error:'cantidad_parejas_invalida',
        mensaje:'La sala requiere exactamente ' + expected + ' parejas con el formato palabra = significado.'
      };
    }
    settings.custom_pairs = pairs;
    _elive180SetCells_(managed.found, {SETTINGS_JSON:JSON.stringify(settings)});
  }
  var response = _elive181StartBase_(body);
  if (response && response.ok === true) {
    response.version = ELIVE181_VERSION;
    response.custom_pairs = !!rawCustom;
  }
  return response;
};

var _elive181ControlBase_ = englishLabMemoryMatchGetRoomControlCS21A180;
englishLabMemoryMatchGetRoomControlCS21A180 = function (body) {
  var response = _elive181ControlBase_(body || {});
  if (!response || response.ok !== true) return response;
  response.version = ELIVE181_VERSION;
  var id = _elive180RoomIdFromBody_(body || {});
  var found = id ? _elive180FindRoom_(id) : null;
  if (!found || !found.row || _elive176Upper_(found.row.GAME_CODE) !== ELMM174_GAME_CODE) return response;
  var settings = _elive176Json_(found.row.SETTINGS_JSON, {});
  response.settings = settings;
  response.pair_count = Math.max(3, Math.min(12, Number(settings.pair_count || 6) || 6));
  if (_elive176Upper_(found.row.STATUS) === 'CREATED') {
    response.suggested_pairs = _elive181SuggestedPairs_(found.row, settings);
  }
  return response;
};

function _elive181VersionResponse_(baseFunction) {
  return function (body) {
    var response = baseFunction(body || {});
    if (response && response.ok === true) response.version = ELIVE181_VERSION;
    return response;
  };
}

englishLabMemoryMatchCreateRoomCS21A180 = _elive181VersionResponse_(englishLabMemoryMatchCreateRoomCS21A180);
englishLabMemoryMatchGetPlayerStateCS21A180 = _elive181VersionResponse_(englishLabMemoryMatchGetPlayerStateCS21A180);
englishLabMemoryMatchJoinRoomCS21A180 = _elive181VersionResponse_(englishLabMemoryMatchJoinRoomCS21A180);
englishLabMemoryMatchSubmitPairCS21A180 = _elive181VersionResponse_(englishLabMemoryMatchSubmitPairCS21A180);

var _elive181VerifyBase_ = verificarActualizacionQA;
verificarActualizacionQA = function () {
  var previous = _elive181VerifyBase_();
  var parsed = _elive181CustomPairs_([
    {left:'hello',right:'hola'},
    {left:'book',right:'libro'}
  ]);
  var valid = previous && previous.ok === true && parsed.length === 2;
  var result = {
    ok:valid,
    version:ELIVE181_VERSION,
    objective:ELIVE181_OBJECTIVE,
    previous_version:previous && previous.version,
    header_aligned:previous && previous.header_aligned === true,
    generic_questions_in_memory_state:previous && previous.generic_questions_in_memory_state,
    custom_pairs_supported:true,
    suggested_pairs_editable:true,
    custom_pair_format:'palabra = significado'
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A181 no supero la verificacion aditiva.');
  return result;
};
