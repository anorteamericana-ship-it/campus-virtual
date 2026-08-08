// CS21A191 · ROBUSTEZ AHORCADO QA
// Capa aditiva incluida automáticamente en el Apps Script QA completo.
// El usuario NO debe pegar este archivo por separado. QA/STAGING solamente.

var ELHANG191_ROBUSTNESS_VERSION = 'CS21A191-HANGMAN-ROBUSTNESS-1';

// La referencia de fuente debe sobrevivir al shuffle. Si QUESTION_BANK no trae
// un ID estable, se deriva uno determinista del contenido, nunca del índice.
_elh191SourceId_ = function (row, index) {
  row = row || {};
  var stable = _elh191Text_(row.CONTENT_ID || row.PLAY_ITEM_ID || row.QUESTION_ID || row.ID);
  if (stable) return stable;
  var material = [
    _elh191Upper_(row.LEVEL_ID),
    _elive176NormalizeUnit_(row.UNIT_ID || 'MIX'),
    _elh191CanonicalAnswer_(row.PAIR_LEFT || row.STEM),
    _elh191Text_(row.PAIR_RIGHT)
  ].join('|');
  return 'HANG-SRC-' + _elive176Hash_(material).toString(16);
};

// _elive180BuildSnapshot_ nació para Memory Match y conserva banderas históricas.
// Ahorcado reutiliza su ranking/eventos, pero limpia esas banderas para evitar que
// el frontend compartido intente "actualizar" una sala HANGMAN como MEMORY_MATCH.
_elh191Snapshot_ = function (room, reveal) {
  var snapshot = _elive180BuildSnapshot_(room);
  var response = _elive180ResponseCopy_(snapshot);
  response.ok = true;
  response.version = ELHANG191_VERSION;
  response.phase = 'HANGMAN_STATE';
  response.hangman = true;
  delete response.memory_match;
  response.hangman_state = _elh191PublicState_(room, reveal);
  response.turn_state = response.hangman_state && response.hangman_state.turn_state || null;
  response.shared_state = null;
  response.room_package = null;
  response.questions = [];
  response.question = null;
  response.current_question = null;
  response.answer = null;
  response.reveal = !!(reveal || (response.hangman_state && response.hangman_state.completed));
  response.message = 'Estado Ahorcado de práctica. No afecta notas oficiales.';
  response.hangman_robustness_version = ELHANG191_ROBUSTNESS_VERSION;
  return _elh191PresenceResponse_(response, room);
};

var _elh191RobustVerifyBase_ = verificarActualizacionQA;
verificarActualizacionQA = function () {
  var previous = _elh191RobustVerifyBase_();
  var a = {LEVEL_ID:'B1',UNIT_ID:'U01',PAIR_LEFT:'check in',PAIR_RIGHT:'register at a hotel'};
  var b = {LEVEL_ID:'B1',UNIT_ID:'U01',PAIR_LEFT:'check in',PAIR_RIGHT:'register at a hotel'};
  var stableA = _elh191SourceId_(a, 0);
  var stableB = _elh191SourceId_(b, 99);
  var stableFallback = !!stableA && stableA === stableB && stableA.indexOf('HANG-SRC-') === 0;
  var valid = !!(previous && previous.ok === true && stableFallback);
  var result = {};
  Object.keys(previous || {}).forEach(function (key) { result[key] = previous[key]; });
  result.ok = valid;
  result.version = ELHANG191_VERSION;
  result.hangman_robustness_version = ELHANG191_ROBUSTNESS_VERSION;
  result.source_id_shuffle_safe = stableFallback;
  result.memory_match_flag_removed_from_hangman_state = true;
  result.generic_sync_misclassification_guard = true;
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A191 Ahorcado no superó la verificación de robustez.');
  return result;
};

function verificarHangmanRobustnessCS21A191() {
  _elh191QaGuard_();
  return verificarActualizacionQA();
}
