// CS21A183 · HOTFIX QA · FUENTE CURRICULAR APOLLO
// Agregar AL FINAL de 99_CS21A183_SENTENCE_ORDER_COMPLETO en Apps Script QA.
// No usar en produccion. Lee CONFIG_UNIDADES y ACADEMIA_PLAY_BANK exclusivamente
// desde QA_STAGING_MASTER_ID y falla cerrado si la configuracion QA no coincide.

var ELSO183_APOLLO_SOURCE_FIX_VERSION = 'CS21A183-APOLLO-QA-FIX';

function _elso183ApolloRows_(sheetName) {
  var props = PropertiesService.getScriptProperties();
  var masterId = _elso183Text_(props.getProperty('QA_STAGING_MASTER_ID'));
  if (!masterId) throw new Error('Falta la propiedad QA_STAGING_MASTER_ID.');
  if (typeof SHEET_ID !== 'undefined' && _elso183Text_(SHEET_ID) && _elso183Text_(SHEET_ID) !== masterId) {
    throw new Error('QA_STAGING_MASTER_ID no coincide con SHEET_ID del staging.');
  }
  var cache = CacheService.getScriptCache();
  var key = 'ELSO183_APOLLO_QA|' + masterId + '|' + _elso183Upper_(sheetName);
  var cached = cache.get(key);
  if (cached) {
    try { return JSON.parse(cached); } catch (_) {}
  }
  var sh = SpreadsheetApp.openById(masterId).getSheetByName(sheetName);
  if (!sh) throw new Error('Falta la hoja ' + sheetName + ' en Apollo QA staging.');
  var lastRow = sh.getLastRow();
  var lastColumn = sh.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) return [];
  var values = sh.getRange(1, 1, lastRow, lastColumn).getDisplayValues();
  var headers = values[0].map(function (header) { return _elso183Upper_(header); });
  var rows = values.slice(1).filter(function (row) {
    return row.some(function (cell) { return _elso183Text_(cell); });
  }).map(function (row) {
    var out = {};
    headers.forEach(function (header, index) { out[header] = row[index]; });
    return out;
  });
  try { cache.put(key, JSON.stringify(rows), 300); } catch (_) {}
  return rows;
}

// Sustituye solo las lecturas curriculares; el banco QUESTION_BANK de Memory Match
// continua usando _elive176Rows_ y ENGLISH_LAB_GAME_DB_ID.
_elso183CurriculumUnits_ = function () {
  var order = {B1:1,B2:2,I1:3,I2:4};
  var seen = {};
  return _elso183ApolloRows_('CONFIG_UNIDADES').map(function (row) {
    var level = _elso183Upper_(row.LEVEL_ID);
    var unitId = _elso183Upper_(row.UNIT_ID);
    var status = _elso183Upper_(row.STATUS || 'ACTIVE');
    if (!order[level] || !/^\w\d-U\d{2}$/.test(unitId) || status !== 'ACTIVE' || seen[unitId]) return null;
    seen[unitId] = true;
    return {
      level_id:level,
      unit_number:Number(row.UNIT_NUMBER || unitId.slice(-2)) || 0,
      unit_id:unitId,
      unit_name:_elso183Text_(row.UNIT_NAME),
      unit_objective_es:_elso183Text_(row.UNIT_OBJECTIVE_ES),
      program_topic:_elso183Text_(row.PROGRAM_TOPIC),
      source_reference:_elso183Text_(row.SOURCE_REFERENCE),
      difficulty_1_10:Number(row.DIFFICULTY_1_10 || 0) || 0,
      status:status
    };
  }).filter(function (item) { return !!item; }).sort(function (a, b) {
    return (order[a.level_id] - order[b.level_id]) || (a.unit_number - b.unit_number);
  });
};

_elso183CurriculumSourceRows_ = function (level, unit, gameId) {
  var wantedLevel = _elso183Upper_(level);
  var wantedUnit = wantedLevel + '-' + _elive176NormalizeUnit_(unit || '');
  var wantedGame = _elso183Upper_(gameId);
  return _elso183ApolloRows_('ACADEMIA_PLAY_BANK').filter(function (row) {
    return _elso183Upper_(row.LEVEL_ID) === wantedLevel &&
      _elso183Upper_(row.UNIT_ID) === wantedUnit &&
      _elso183Upper_(row.TEMPLATE_ID) === 'GRAM_02' &&
      _elso183Upper_(row.GAME_ID) === wantedGame &&
      _elso183Upper_(row.ITEM_TYPE) === 'ORDER' &&
      _elso183Upper_(row.STATUS || 'ACTIVE') === 'ACTIVE' &&
      _elso183Text_(row.PLAY_ITEM_ID) &&
      _elso183Text_(row.WORDS_TO_ORDER) &&
      _elso183Text_(row.CORRECT_SENTENCE);
  });
};

// El verificador final anterior intentaba leer ACADEMIA_PLAY_BANK desde la DB de juegos.
// Se reemplaza por el mismo contrato, pero usando Apollo QA de forma explicita.
verificarActualizacionQA = function () {
  var previous = _elso183CurriculumVerifyBase_();
  var units = _elso183CurriculumUnits_();
  var unitMap = {};
  units.forEach(function (unit) { unitMap[unit.unit_id] = unit; });
  var rows = _elso183ApolloRows_('ACADEMIA_PLAY_BANK').filter(function (row) {
    return _elso183Upper_(row.TEMPLATE_ID) === 'GRAM_02' &&
      _elso183Upper_(row.ITEM_TYPE) === 'ORDER' &&
      _elso183Upper_(row.STATUS || 'ACTIVE') === 'ACTIVE';
  });
  var byUnit = {};
  var completeRows = true;
  rows.forEach(function (row) {
    var unitId = _elso183Upper_(row.UNIT_ID);
    byUnit[unitId] = (byUnit[unitId] || 0) + 1;
    if (!unitMap[unitId] || !_elso183Text_(row.PLAY_ITEM_ID) || !_elso183Text_(row.GAME_ID) ||
        !_elso183Text_(row.WORDS_TO_ORDER) || !_elso183Text_(row.CORRECT_SENTENCE)) completeRows = false;
  });
  var exactFive = units.length === 64 && units.every(function (unit) { return byUnit[unit.unit_id] === 5; });
  var valid = previous && previous.ok === true && units.length === 64 && rows.length === 320 && exactFive && completeRows;
  var result = {
    ok:valid,
    version:ELSO183_VERSION,
    objective:ELSO183_CURRICULUM_OBJECTIVE,
    previous_version:previous && previous.version,
    sentence_order_live_supported:previous && previous.sentence_order_live_supported === true,
    curriculum_guard:true,
    curriculum_units:units.length,
    active_gram_02_items:rows.length,
    five_items_per_unit:exactFive,
    curriculum_rows_complete:completeRows,
    curriculum_source_required:true,
    curriculum_acknowledgement_required:true,
    duplicate_response_preserves_state:true,
    sentence_count_limits:'3-5',
    curriculum_source:'QA_STAGING_MASTER_ID',
    curriculum_source_fix:ELSO183_APOLLO_SOURCE_FIX_VERSION
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A183 no supero la validacion curricular Apollo QA.');
  return result;
};
