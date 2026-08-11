// CS21A201 · ENGLISH LAB · ROUTER CURRICULAR QA
// Capa aditiva posterior a CS21A200. No duplica acceso a SpreadsheetApp.
// Reutiliza exclusivamente el lector Apollo QA ya validado por Sentence Order CS21A183.
// QA/STAGING SOLAMENTE. NO USAR EN PRODUCCION.

var ELCS201_VERSION = 'CS21A201-CURRICULUM-SOURCE-1';
var ELCS201_SOURCE = 'QA_STAGING_MASTER_ID';
var ELCS201_REUSED_SOURCE_FIX = 'CS21A183-APOLLO-QA-FIX';

function _elcs201ApolloRows_(sheetName) {
  if (typeof _elso183ApolloRows_ !== 'function') {
    throw new Error('Falta el lector curricular Apollo QA CS21A183.');
  }
  return _elso183ApolloRows_(sheetName);
}

// -----------------------------------------------------------------------------
// QUIZ TIME CS21A198
// Conserva exactamente sus filtros y contrato; cambia solo la fuente fisica.
// -----------------------------------------------------------------------------
_elq198CurriculumUnit_ = function () {
  return _elcs201ApolloRows_('CONFIG_UNIDADES').filter(function (row) {
    return _elq198Upper_(row.LEVEL_ID) === 'B1' &&
      _elq198Upper_(row.UNIT_ID) === ELQ198_UNIT_ID &&
      _elq198Upper_(row.STATUS || 'ACTIVE') === 'ACTIVE';
  })[0] || null;
};

_elq198PoolRows_ = function () {
  return _elcs201ApolloRows_('ACADEMIA_PLAY_BANK').filter(function (row) {
    var spec = _elq198Spec_(row.AREA_ID, row.TEMPLATE_ID);
    return !!(spec &&
      _elq198Upper_(row.LEVEL_ID) === 'B1' &&
      _elq198Upper_(row.UNIT_ID) === ELQ198_UNIT_ID &&
      _elq198Upper_(row.ITEM_TYPE) === spec.type &&
      _elq198Upper_(row.STATUS || 'ACTIVE') === 'ACTIVE' &&
      _elq198Text_(row.PLAY_ITEM_ID) && _elq198Text_(row.SOURCE_ITEM_ID) &&
      _elq198Text_(row.STEM) && _elq198Text_(row.OPTION_A) &&
      _elq198Text_(row.OPTION_B) && _elq198Text_(row.CORRECT_OPTION));
  });
};

// -----------------------------------------------------------------------------
// WORD SEARCH CS21A200
// Conserva exactamente su canonicalizacion; cambia solo la fuente fisica.
// -----------------------------------------------------------------------------
_elws200CurriculumUnit_ = function () {
  return _elcs201ApolloRows_('CONFIG_UNIDADES').filter(function (row) {
    return _elws200Upper_(row.LEVEL_ID) === ELWS200_LEVEL_ID &&
      _elws200Upper_(row.UNIT_ID) === ELWS200_UNIT_ID &&
      _elws200Upper_(row.STATUS) === 'ACTIVE';
  })[0] || null;
};

_elws200PoolWords_ = function () {
  var words = [];
  var seenSources = {};
  var seenTokens = {};
  _elcs201ApolloRows_('ACADEMIA_PLAY_BANK').forEach(function (row) {
    var item = _elws200CanonicalWord_(row);
    if (!item) return;
    if (seenSources[item.source_item_id] || seenTokens[item.grid_word]) return;
    seenSources[item.source_item_id] = true;
    seenTokens[item.grid_word] = true;
    words.push(item);
  });
  return words;
};

// Los verificadores conservan todas sus pruebas anteriores y agregan evidencia
// explicita de que la fuente curricular ya no depende del spreadsheet operativo.
var _elcs201QuizVerifierBase_ = verificarQuizTimeCS21A198;
verificarQuizTimeCS21A198 = function () {
  var previous = _elcs201QuizVerifierBase_();
  var result = {
    ok:previous && previous.ok === true,
    version:ELCS201_VERSION,
    previous_version:previous && previous.version,
    game_version:typeof ELQ198_OPTION_BALANCE_VERSION !== 'undefined' ? ELQ198_OPTION_BALANCE_VERSION : ELQ198_VERSION,
    quiz_time:true,
    enabled_unit:ELQ198_UNIT_ID,
    curriculum_source:ELCS201_SOURCE,
    curriculum_source_fix_reused:ELCS201_REUSED_SOURCE_FIX,
    config_unidades_via_apollo_qa:true,
    academia_play_bank_via_apollo_qa:true,
    operational_sheet_dependency_removed:true,
    canonical_pool:previous && previous.canonical_pool,
    option_positions_balanced:previous && previous.option_positions_balanced === true,
    answer_key_hidden_before_reveal:previous && previous.answer_key_hidden_before_reveal === true,
    official_grade:false
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A201 no supero el router curricular de Quiz Time.');
  return result;
};

var _elcs201WordSearchVerifierBase_ = verificarWordSearchCS21A200;
verificarWordSearchCS21A200 = function () {
  var previous = _elcs201WordSearchVerifierBase_();
  var result = {
    ok:previous && previous.ok === true,
    version:ELCS201_VERSION,
    previous_version:previous && previous.version,
    game_version:ELWS200_VERSION,
    word_search:true,
    enabled_unit:ELWS200_UNIT_ID,
    curriculum_source:ELCS201_SOURCE,
    curriculum_source_fix_reused:ELCS201_REUSED_SOURCE_FIX,
    config_unidades_via_apollo_qa:true,
    academia_play_bank_via_apollo_qa:true,
    operational_sheet_dependency_removed:true,
    canonical_words:previous && previous.canonical_words,
    unique_target_occurrences:previous && previous.unique_target_occurrences === true,
    public_puzzle_hides_solutions:previous && previous.public_puzzle_hides_solutions === true,
    first_claim_wins:previous && previous.first_claim_wins === true,
    official_grade:false
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A201 no supero el router curricular de Word Search.');
  return result;
};
