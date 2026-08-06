// CS21A183 · GUARDIA CURRICULAR ADITIVA QA
// Instalar despues de 99_ACTUALIZACION_QA_CS21A183.gs. No usar en produccion.
// Valida CONFIG_UNIDADES y ACADEMIA_PLAY_BANK antes de crear una sala Sentence Order.

var ELSO183_CURRICULUM_VERSION = 'CS21A183-CURRICULUM';
var ELSO183_CURRICULUM_OBJECTIVE = 'Nivel, unidad, tema y fuente GRAM_02 verificados contra Apollo antes de crear la sala';

function _elso183CurriculumBool_(value) {
  if (value === true) return true;
  var text = _elso183Upper_(value);
  return text === 'TRUE' || text === '1' || text === 'YES' || text === 'SI' || text === 'SÍ';
}
function _elso183CurriculumItemIds_(value) {
  var raw = value;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); }
    catch (_) { raw = raw.split(/[\r\n,|]+/); }
  }
  if (!Array.isArray(raw)) return [];
  var seen = {};
  return raw.map(function (item) {
    var id = _elso183Text_(item && typeof item === 'object' ? (item.play_item_id || item.PLAY_ITEM_ID || item.id) : item);
    if (!id || seen[id]) return null;
    seen[id] = true;
    return id;
  }).filter(function (id) { return !!id; });
}
function _elso183CurriculumUnits_() {
  var order = {B1:1,B2:2,I1:3,I2:4};
  var seen = {};
  return _elive176Rows_('CONFIG_UNIDADES').map(function (row) {
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
}
function _elso183CurriculumUnit_(level, unit) {
  var wantedLevel = _elso183Upper_(level);
  var shortUnit = _elive176NormalizeUnit_(unit || '');
  var wantedUnit = wantedLevel + '-' + shortUnit;
  return _elso183CurriculumUnits_().filter(function (item) {
    return item.level_id === wantedLevel && item.unit_id === wantedUnit;
  })[0] || null;
}
function _elso183CurriculumSourceRows_(level, unit, gameId) {
  var wantedLevel = _elso183Upper_(level);
  var wantedUnit = wantedLevel + '-' + _elive176NormalizeUnit_(unit || '');
  var wantedGame = _elso183Upper_(gameId);
  return _elive176Rows_('ACADEMIA_PLAY_BANK').filter(function (row) {
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
}
function _elso183CurriculumEvidence_(body) {
  body = body || {};
  var cod = _elso183Text_(body.cod_grupo || body.codGrupo || body.grupo);
  var level = _anF65_levelId_(body.nivel || '') || _elso183Upper_(cod.split('-')[0] || '');
  var unit = _elive176NormalizeUnit_(body.unit || body.unidad || '');
  var fullUnit = level + '-' + unit;
  var requested = Math.max(3, Math.min(10, Number(body.sentence_count || body.question_count || 0) || 0));
  var sourceGameId = _elso183Upper_(body.source_game_id || body.sourceGameId);
  var expectedGameId = fullUnit + '-GRAM-02';
  var curriculum = _elso183CurriculumUnit_(level, unit);

  if (!curriculum) {
    return {ok:false,response:{ok:false,version:ELSO183_VERSION,error:'unidad_curricular_invalida',mensaje:'La unidad ' + fullUnit + ' no está activa en CONFIG_UNIDADES.'}};
  }
  if (!_elso183CurriculumBool_(body.curriculum_source_loaded)) {
    return {ok:false,response:{ok:false,version:ELSO183_VERSION,error:'curriculum_source_required',mensaje:'Cargue primero las sugerencias curriculares de la unidad seleccionada.'}};
  }
  if (!_elso183CurriculumBool_(body.curriculum_acknowledged)) {
    return {ok:false,response:{ok:false,version:ELSO183_VERSION,error:'curriculum_acknowledgement_required',mensaje:'Confirme que revisó el tema oficial de la unidad.'}};
  }
  if (!sourceGameId || sourceGameId !== expectedGameId) {
    return {ok:false,response:{ok:false,version:ELSO183_VERSION,error:'fuente_curricular_invalida',mensaje:'La fuente debe ser exactamente ' + expectedGameId + '.'}};
  }

  var sourceRows = _elso183CurriculumSourceRows_(level, unit, sourceGameId);
  if (sourceRows.length !== 5) {
    return {ok:false,response:{ok:false,version:ELSO183_VERSION,error:'cobertura_curricular_incompleta',mensaje:'Apollo debe contener exactamente 5 oraciones GRAM_02 activas para ' + fullUnit + '; se encontraron ' + sourceRows.length + '.'}};
  }
  if (requested < 3 || requested > sourceRows.length) {
    return {ok:false,response:{ok:false,version:ELSO183_VERSION,error:'cantidad_fuera_de_cobertura',mensaje:'Seleccione entre 3 y ' + sourceRows.length + ' oraciones para esta unidad.'}};
  }

  var providedIds = _elso183CurriculumItemIds_(body.source_item_ids || body.sourceItemIds);
  var allowed = {};
  sourceRows.forEach(function (row) { allowed[_elso183Text_(row.PLAY_ITEM_ID)] = true; });
  var invalidIds = providedIds.filter(function (id) { return !allowed[id]; });
  if (providedIds.length < requested || invalidIds.length) {
    return {ok:false,response:{ok:false,version:ELSO183_VERSION,error:'evidencia_curricular_invalida',mensaje:'La evidencia de la fuente no coincide con los ítems GRAM_02 de ' + fullUnit + '.'}};
  }

  return {
    ok:true,
    level:level,
    unit:unit,
    full_unit:fullUnit,
    source_game_id:sourceGameId,
    source_item_ids:providedIds,
    source_rows:sourceRows,
    curriculum:curriculum,
    requested:requested
  };
}

var _elso183CurriculumTeacherBase_ = englishLabSentenceOrderTeacherDataCS21A183;
englishLabSentenceOrderTeacherDataCS21A183 = function (body) {
  var response = _elso183CurriculumTeacherBase_(body || {});
  if (!response || response.ok !== true) return response;
  response.version = ELSO183_VERSION;
  response.curriculum_units = _elso183CurriculumUnits_();
  response.curriculum_contract = {
    version:ELSO183_CURRICULUM_VERSION,
    source_units:'CONFIG_UNIDADES',
    source_games:'ACADEMIA_PLAY_BANK',
    template_id:'GRAM_02',
    item_type:'ORDER',
    active_units_required:64,
    items_per_unit_required:5,
    sentence_count_min:3,
    sentence_count_max:5
  };
  return response;
};

var _elso183CurriculumCreateBase_ = englishLabSentenceOrderCreateRoomCS21A183;
englishLabSentenceOrderCreateRoomCS21A183 = function (body) {
  body = body || {};
  var evidence = _elso183CurriculumEvidence_(body);
  if (!evidence.ok) return evidence.response;
  var response = _elso183CurriculumCreateBase_(body);
  if (!response || response.ok !== true) return response;

  var roomRef = response.room || {};
  var found = _elso183Find_({room_id:roomRef.room_id || roomRef.ROOM_ID || roomRef.room_code || roomRef.ROOM_CODE});
  if (!found || !found.row) return {ok:false,version:ELSO183_VERSION,error:'sala_creada_sin_relectura'};
  var settings = _elso183Settings_(found.row);
  settings.curriculum_verified = true;
  settings.curriculum_guard_version = ELSO183_CURRICULUM_VERSION;
  settings.curriculum = evidence.curriculum;
  settings.source_game_id = evidence.source_game_id;
  settings.source_item_ids = evidence.source_item_ids;
  settings.source_template_id = 'GRAM_02';
  settings.source_item_type = 'ORDER';
  settings.curriculum_acknowledged = true;
  var updated = _elive180SetCells_(found, {
    SETTINGS_JSON:JSON.stringify(settings),
    CONTENT_SOURCE:'CONFIG_UNIDADES|ACADEMIA_PLAY_BANK|GRAM_02'
  });
  _elive180AppendEvent_(updated, 'SENTENCE_ORDER_CURRICULUM_VERIFIED', {sesion:{nombre:'SISTEMA'},rol:'system'}, {
    level:evidence.level,
    unit:evidence.full_unit,
    source_game_id:evidence.source_game_id,
    source_items:evidence.source_item_ids.length,
    requested:evidence.requested,
    version:ELSO183_CURRICULUM_VERSION
  });
  _elive180Invalidate_(updated);
  response.room = _elive176PublicRoom_(updated);
  response.curriculum_verified = true;
  response.curriculum = evidence.curriculum;
  response.source_game_id = evidence.source_game_id;
  return response;
};

var _elso183CurriculumControlBase_ = englishLabSentenceOrderGetRoomControlCS21A183;
englishLabSentenceOrderGetRoomControlCS21A183 = function (body) {
  var response = _elso183CurriculumControlBase_(body || {});
  if (!response || response.ok !== true) return response;
  var settings = response.settings || {};
  response.curriculum_verified = settings.curriculum_verified === true;
  response.curriculum = settings.curriculum || null;
  response.source_game_id = settings.source_game_id || '';
  response.curriculum_guard_version = settings.curriculum_guard_version || '';
  return response;
};

// Un reintento o doble clic no debe sustituir el tablero por una respuesta mínima.
// Ante duplicado se devuelve el estado completo del jugador con la marca duplicate.
var _elso183CurriculumSubmitBase_ = englishLabSentenceOrderSubmitCS21A183;
englishLabSentenceOrderSubmitCS21A183 = function (body) {
  body = body || {};
  var response = _elso183CurriculumSubmitBase_(body);
  if (!response || response.ok !== true || response.duplicate !== true || response.sentence_order === true) return response;
  var state = englishLabSentenceOrderGetPlayerStateCS21A183(body);
  if (!state || state.ok !== true) return response;
  state.accepted = false;
  state.duplicate = true;
  state.message = response.message || 'Respuesta ya procesada.';
  return state;
};

var _elso183CurriculumVerifyBase_ = verificarActualizacionQA;
verificarActualizacionQA = function () {
  var previous = _elso183CurriculumVerifyBase_();
  var units = _elso183CurriculumUnits_();
  var unitMap = {};
  units.forEach(function (unit) { unitMap[unit.unit_id] = unit; });
  var rows = _elive176Rows_('ACADEMIA_PLAY_BANK').filter(function (row) {
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
    sentence_count_limits:'3-5'
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A183 no supero la validacion curricular Apollo.');
  return result;
};
