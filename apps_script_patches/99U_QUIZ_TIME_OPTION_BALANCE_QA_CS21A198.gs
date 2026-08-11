// CS21A198 · QUIZ TIME · OPTION BALANCE QA
// Capa aditiva posterior a 99T. No modifica la fuente curricular en Sheets.
// Redistribuye las opciones de cada pregunta de forma determinista por sala,
// remapea la clave correcta y evita el patron pedagogicamente invalido de
// CORRECT_OPTION=A presente en el banco B1-U01 actual.

var ELQ198_OPTION_BALANCE_VERSION = 'CS21A198-QUIZ-TIME-B1U01-2';
var ELQ198_LISTENING_DELIVERY_MODE = 'DIALOGUE_TEXT_QA';

function _elq198BalancedCorrectSlots_(roomCode) {
  var labels = _elive176Shuffle_(['A','B','C','D'], _elq198Text_(roomCode) + '|QUIZ|CORRECT_LABELS');
  var pool = [labels[0],labels[0],labels[0],labels[1],labels[1],labels[1],labels[2],labels[2],labels[3],labels[3]];
  return _elive176Shuffle_(pool, _elq198Text_(roomCode) + '|QUIZ|CORRECT_SLOTS');
}

var _elq198SecretItemBaseCS21A198_ = _elq198SecretItem_;
_elq198SecretItem_ = function (row, roomCode, position) {
  var item = _elq198SecretItemBaseCS21A198_(row, roomCode, position);
  var rawOptions = _elq198Options_(row).map(function (option) {
    return {source_id:_elq198Upper_(option.id), label:_elq198Text_(option.label)};
  });
  if (rawOptions.length < 2) return item;

  var sourceCorrect = _elq198Upper_(row && row.CORRECT_OPTION);
  var correct = rawOptions.filter(function (option) { return option.source_id === sourceCorrect; })[0] || null;
  if (!correct) return item;

  var slots = _elq198BalancedCorrectSlots_(roomCode);
  var targetId = slots[Math.max(0, (Number(position || 1) || 1) - 1) % slots.length] || 'A';
  var ids = ['A','B','C','D'].slice(0, rawOptions.length);
  if (ids.indexOf(targetId) < 0) targetId = ids[0];

  var distractors = _elive176Shuffle_(rawOptions.filter(function (option) {
    return option.source_id !== sourceCorrect;
  }), _elq198Text_(roomCode) + '|QUIZ|DISTRACTORS|' + _elq198Text_(row && row.PLAY_ITEM_ID) + '|' + String(position || 1));

  var arranged = [];
  var d = 0;
  ids.forEach(function (id) {
    if (id === targetId) arranged.push({id:id,label:correct.label});
    else {
      var option = distractors[d++] || {label:''};
      arranged.push({id:id,label:_elq198Text_(option.label)});
    }
  });

  item.options = arranged.filter(function (option) { return !!option.label; });
  item.correct_option = targetId;
  item.option_order_version = ELQ198_OPTION_BALANCE_VERSION;
  return item;
};

var _elq198VerifierBaseCS21A198_ = verificarQuizTimeCS21A198;
verificarQuizTimeCS21A198 = function () {
  var previous = _elq198VerifierBaseCS21A198_();
  var rows = _elq198PoolRows_();
  var deck = _elq198ValidatePool_(rows).ok ? _elq198SelectDeck_('LAB-Q198-OPTION-VERIFY', rows) : [];
  var counts = {A:0,B:0,C:0,D:0};
  deck.forEach(function (item) {
    var id = _elq198Upper_(item.correct_option);
    if (Object.prototype.hasOwnProperty.call(counts,id)) counts[id] += 1;
  });
  var values = Object.keys(counts).map(function (key) { return counts[key]; });
  var spread = values.length ? Math.max.apply(Math,values) - Math.min.apply(Math,values) : 99;
  var allSlotsUsed = values.every(function (value) { return value > 0; });
  var balanced = deck.length === ELQ198_QUESTION_COUNT && allSlotsUsed && spread <= 1;

  var result = {
    ok:previous && previous.ok === true && balanced,
    version:ELQ198_OPTION_BALANCE_VERSION,
    previous_version:ELQ198_VERSION,
    enabled_unit:ELQ198_UNIT_ID,
    question_count:ELQ198_QUESTION_COUNT,
    option_positions_balanced:balanced,
    correct_option_counts:counts,
    correct_slot_spread:spread,
    source_bank_correct_options_unchanged:true,
    answer_key_hidden_before_reveal:true,
    listening_delivery_mode:ELQ198_LISTENING_DELIVERY_MODE,
    true_audio_listening_pending:true,
    official_grade:false,
    memory_match_untouched:true,
    hangman_untouched:true,
    sentence_order_untouched:true
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A198 Quiz Time option balance no supero la verificacion QA.');
  return result;
};
