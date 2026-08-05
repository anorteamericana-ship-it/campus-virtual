// CS21A175 · Hotfix QA para Memory Match Live
// Corrige U1/U01, reduce lecturas repetidas del banco y no contiene contenido pedagógico.

var ELMM175_VERSION = 'CS21A175';

function _elmm175NormalizeUnit_(value) {
  var text = _elmm174Upper_(value || 'MIX').replace(/[\s_-]+/g, '');
  if (!text || text === 'MIX' || text === 'MIXTO' || text === 'MIXED') return 'MIX';
  var match = text.match(/^(?:U|UNIT|UNIDAD)?0*(\d{1,2})$/);
  if (!match) return _elmm174Upper_(value || 'MIX');
  var number = Math.max(1, Math.min(99, Number(match[1]) || 1));
  return 'U' + (number < 10 ? '0' : '') + number;
}

function _elmm175Rows_(sheetName) {
  var cache = CacheService.getScriptCache();
  var dbId = _elmm174DbId_();
  var key = 'ELMM175|' + dbId + '|' + _elmm174Upper_(sheetName);
  var cached = cache.get(key);
  if (cached) {
    try { return JSON.parse(cached); } catch (_) {}
  }

  var sh = _elmm174Db_().getSheetByName(sheetName);
  if (!sh) throw new Error('Falta la hoja ' + sheetName + '.');
  var lastRow = sh.getLastRow();
  var lastColumn = sh.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) return [];

  var values = sh.getRange(1, 1, lastRow, lastColumn).getDisplayValues();
  var headers = values[0].map(function (header) { return _elmm174Upper_(header); });
  var rows = values.slice(1).filter(function (row) {
    return row.some(function (cell) { return _elmm174Text_(cell); });
  }).map(function (row) {
    var out = {};
    headers.forEach(function (header, index) { out[header] = row[index]; });
    return out;
  });

  try { cache.put(key, JSON.stringify(rows), 300); } catch (_) {}
  return rows;
}

function _elmm175PairRows_(level, unit) {
  var wantedLevel = _elmm174Upper_(level || 'B1');
  var wantedUnit = _elmm175NormalizeUnit_(unit || 'MIX');
  return _elmm175Rows_('QUESTION_BANK').filter(function (row) {
    var rowUnit = _elmm175NormalizeUnit_(row.UNIT_ID || 'MIX');
    return _elmm174Upper_(row.GAME_ID) === ELMM174_GAME_CODE &&
      _elmm174Upper_(row.STATUS) === 'ACTIVE' &&
      (_elmm174Upper_(row.LEVEL_ID) === wantedLevel || _elmm174Upper_(row.LEVEL_ID) === 'ALL') &&
      (wantedUnit === 'MIX' || rowUnit === wantedUnit || rowUnit === 'MIX') &&
      _elmm174Text_(row.PAIR_LEFT || row.STEM) &&
      _elmm174Text_(row.PAIR_RIGHT);
  });
}

function _elmm175Cards_(room, pairCount) {
  var settings = _elmm174Settings_(room);
  var level = _elmm174Upper_(room.NIVEL || settings.level || 'B1');
  var unit = _elmm175NormalizeUnit_(settings.unit || 'MIX');
  var count = Math.max(3, Math.min(12, Number(pairCount || settings.pair_count || 6) || 6));
  var rows = _elmm174Shuffle_(
    _elmm175PairRows_(level, unit),
    room.ROOM_CODE + '|' + unit + '|' + level
  ).slice(0, count);

  if (rows.length < count) {
    throw new Error('Banco insuficiente para ' + level + '/' + unit + ': ' + rows.length + ' pares; se requieren ' + count + '.');
  }

  var cards = [];
  rows.forEach(function (row, index) {
    var pairId = _elmm174Text_(row.CONTENT_ID) || ('PAIR-' + (index + 1));
    cards.push({
      card_id: pairId + '-L', pair_id: pairId, face_type: 'TEXT',
      label: _elmm174Text_(row.PAIR_LEFT || row.STEM), media_id: _elmm174Text_(row.MEDIA_ID)
    });
    cards.push({
      card_id: pairId + '-R', pair_id: pairId, face_type: 'TEXT',
      label: _elmm174Text_(row.PAIR_RIGHT), media_id: ''
    });
  });
  return _elmm174Shuffle_(cards, room.ROOM_CODE + '|CARDS');
}

var _elmm175CreateRoomBase_ = englishLabMemoryMatchCreateRoom;
function englishLabMemoryMatchCreateRoomCS21A175(body) {
  body = body || {};
  var normalized = {};
  Object.keys(body).forEach(function (key) { normalized[key] = body[key]; });
  var unit = _elmm175NormalizeUnit_(body.unit || body.unidad || 'MIX');
  normalized.unit = unit;
  normalized.unidad = unit;
  var result = _elmm175CreateRoomBase_(normalized);
  if (result && result.ok === true) result.hotfix_version = ELMM175_VERSION;
  return result;
}

function englishLabMemoryMatchStartRoomCS21A175(body) {
  body = body || {};
  var managed = _elmm174FindManagedRoom_(body);
  if (!managed.ok) return managed.response;
  var room = managed.room;
  if (_elmm174Upper_(room.GAME_CODE) !== ELMM174_GAME_CODE) return {ok:false,error:'sala_no_memory_match'};
  if (_elmm174Upper_(room.STATUS) === 'CLOSED') return {ok:false,error:'sala_cerrada'};

  var settings = _elmm174Settings_(room);
  var normalizedUnit = _elmm175NormalizeUnit_(settings.unit || 'MIX');
  if (_elmm174Text_(settings.unit) !== normalizedUnit) {
    settings.unit = normalizedUnit;
    room = _eliveSetCells_(managed.found, {SETTINGS_JSON:JSON.stringify(settings)});
    managed.found = _eliveFindRoom_(room.ROOM_ID || room.ROOM_CODE);
    managed.room = room;
  }

  var cards = _elmm175Cards_(room, settings.pair_count);
  var rules = _elmm174Rules_(room.NIVEL, room.MODE);
  var now = new Date();
  var pkg = _elmm174Package_(room, cards, rules, now);
  var current = {type:'memory_match',game_id:ELMM174_GAME_CODE,index:1,room_package:pkg};
  var row = _eliveSetCells_(managed.found, {
    STATUS:'LIVE', STARTED_AT:room.STARTED_AT || _elmm174Iso_(now), CURRENT_INDEX:1,
    ROUND_STATUS:'OPEN', ROUND_STARTED_AT:_elmm174Iso_(now), ROUND_CLOSED_AT:'',
    CURRENT_QUESTION_JSON:JSON.stringify(current)
  });
  _eliveAppendEvent_(row, 'MEMORY_MATCH_STARTED', managed.auth, {
    cards:cards.length, pairs:cards.length / 2, rules:rules, hotfix_version:ELMM175_VERSION
  });
  return {
    ok:true, version:ELMM174_VERSION, hotfix_version:ELMM175_VERSION,
    room:_eliveRoomPublic_(row), room_package:pkg
  };
}

function verificarEnglishLabMemoryMatchCS21A175() {
  CacheService.getScriptCache().remove('ELMM175|' + _elmm174DbId_() + '|QUESTION_BANK');
  var pairsU1 = _elmm175PairRows_('B1', 'U1');
  var pairsU01 = _elmm175PairRows_('B1', 'U01');
  var result = {
    ok:pairsU1.length >= 6 && pairsU01.length >= 6,
    version:ELMM175_VERSION,
    normalize_u1:_elmm175NormalizeUnit_('U1'),
    b1_u1_pairs:pairsU1.length,
    b1_u01_pairs:pairsU01.length
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A175 no pudo resolver los seis pares B1/U1.');
  return result;
}

var _elmm175DoPostBase_ = doPost;
doPost = function (e) {
  try {
    var body = {};
    try { body = _an4406_parseBody_(e) || {}; } catch (_) { body = {}; }
    var fn = _elmm174Text_((e && e.parameter && e.parameter.fn) || body.fn).toLowerCase();
    if (fn === 'englishlabmemorymatchcreateroom') {
      return _an4406_json_(englishLabMemoryMatchCreateRoomCS21A175(body));
    }
    if (fn === 'englishlabmemorymatchstartroom') {
      return _an4406_json_(englishLabMemoryMatchStartRoomCS21A175(body));
    }
    if (fn === 'verificarenglishlabmemorymatchcs21a175') {
      return _an4406_json_(verificarEnglishLabMemoryMatchCS21A175());
    }
    return _elmm175DoPostBase_(e);
  } catch (err) {
    return _an4406_json_({
      ok:false, version:ELMM174_VERSION, hotfix_version:ELMM175_VERSION,
      error:'memory_match_hotfix_error',
      mensaje:String(err && err.message ? err.message : err)
    });
  }
};