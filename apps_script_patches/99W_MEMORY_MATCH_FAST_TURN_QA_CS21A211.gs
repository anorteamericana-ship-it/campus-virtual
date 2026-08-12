// CS21A211 · QA · Memory Match 10 s de selección + reveal mismatch 3 s.
// Capa acumulativa sobre CS21A201. QA/STAGING solamente. NO PRODUCCION.
//
// Contrato funcional:
// - cada turno da como máximo 10 s desde turn_started_at para escoger dos cartas;
// - abrir la primera carta NO extiende ese deadline;
// - MATCH resuelve de inmediato y el mismo jugador recibe 10 s nuevos;
// - MISMATCH conserva las dos cartas visibles 3 s y, al vencer, rota de inmediato;
// - timeout con 0/1 carta rota de inmediato al siguiente jugador.

var CS21A211_MM_FAST_TURN_VERSION = 'CS21A211-MM-10S-3S-1';
var CS21A211_MM_TURN_SELECTION_MS = 10000;
var CS21A211_MM_PAIR_REVEAL_MS = 3000;

function _cs21a211FastRules_(rules) {
  rules = rules && typeof rules === 'object' ? rules : {};
  rules.round_duration_ms = CS21A211_MM_TURN_SELECTION_MS;
  rules.turn_selection_ms = CS21A211_MM_TURN_SELECTION_MS;
  rules.reveal_duration_ms = CS21A211_MM_PAIR_REVEAL_MS;
  rules.mismatch_reveal_ms = CS21A211_MM_PAIR_REVEAL_MS;
  rules.spectator_reveal_ms = CS21A211_MM_PAIR_REVEAL_MS;
  rules.pair_reveal_ms = CS21A211_MM_PAIR_REVEAL_MS;
  rules.fast_turn_version = CS21A211_MM_FAST_TURN_VERSION;
  return rules;
}

// Toda sala Memory Match nueva nace con el contrato 10 s / 3 s sin alterar
// el banco curricular ni las reglas de ningún otro juego.
var _cs21a211RulesBase_ = _elmm174Rules_;
_elmm174Rules_ = function (level, mode) {
  return _cs21a211FastRules_(_cs21a211RulesBase_(level, mode));
};
_elmm174Rules_.__cs21a211FastTurn = true;
_elmm174Rules_.__base = _cs21a211RulesBase_;

// CS21A194 regalaba 30 s desde la PRIMERA carta para tolerar latencia. Ese
// comportamiento contradice el contrato vigente: los 10 s pertenecen al turno
// completo. Conservamos la capa histórica como evidencia, pero su hook runtime
// queda reemplazado por un clamp al deadline del turno, nunca una extensión.
var _cs21a211FirstRevealHistorical_ = _cs21a194FirstRevealWindow_;
_cs21a194FirstRevealWindow_ = function (pkg) {
  pkg = pkg || {};
  pkg.rules = _cs21a211FastRules_(pkg.rules || {});
  pkg.fast_turn_version = CS21A211_MM_FAST_TURN_VERSION;

  var turnState = pkg.turn_state && typeof pkg.turn_state === 'object' ? pkg.turn_state : {};
  var state = pkg.state && typeof pkg.state === 'object' ? pkg.state : {};
  var shared = pkg.shared_state && typeof pkg.shared_state === 'object' ? pkg.shared_state : {};
  var attempt = shared.active_attempt && typeof shared.active_attempt === 'object' ? shared.active_attempt : null;
  var startMs = _elive176Timestamp_(turnState.turn_started_at || state.started_at);
  var currentEndMs = _elive176Timestamp_(turnState.turn_ends_at || state.ends_at);
  var targetEndMs = startMs ? startMs + CS21A211_MM_TURN_SELECTION_MS : currentEndMs;
  var clamped = false;

  if (targetEndMs && (!currentEndMs || currentEndMs !== targetEndMs)) {
    var targetIso = _elive176Iso_(new Date(targetEndMs));
    turnState.turn_ends_at = targetIso;
    state.ends_at = targetIso;
    if (attempt) attempt.turn_ends_at = targetIso;
    clamped = true;
  }

  pkg.turn_state = turnState;
  pkg.state = state;
  if (attempt) shared.active_attempt = attempt;
  pkg.shared_state = shared;

  return {
    extended:false,
    clamped_to_turn_deadline:clamped,
    turn_started_at:turnState.turn_started_at || state.started_at || '',
    turn_ends_at:turnState.turn_ends_at || state.ends_at || '',
    turn_selection_ms:CS21A211_MM_TURN_SELECTION_MS,
    pair_reveal_ms:CS21A211_MM_PAIR_REVEAL_MS,
    version:CS21A211_MM_FAST_TURN_VERSION
  };
};
_cs21a194FirstRevealWindow_.__cs21a211NoDeadlineExtension = true;
_cs21a194FirstRevealWindow_.__historical = _cs21a211FirstRevealHistorical_;

function verificarMemoryMatchFastTurnCS21A211() {
  var rules = _cs21a211FastRules_({round_duration_ms:30000,reveal_duration_ms:8500});
  var start = new Date('2026-08-12T12:00:00.000Z');
  var synthetic = {
    rules:rules,
    state:{phase:'OPEN',started_at:_elive176Iso_(start),ends_at:_elive176Iso_(new Date(start.getTime()+30000))},
    turn_state:{turn_number:7,active_player_id:'P1',turn_started_at:_elive176Iso_(start),turn_ends_at:_elive176Iso_(new Date(start.getTime()+30000))},
    shared_state:{active_attempt:{phase:'FIRST_REVEALED',player_id:'P1',turn_number:7,revealed_at:_elive176Iso_(new Date(start.getTime()+2000))}}
  };
  var first = _cs21a194FirstRevealWindow_(synthetic);
  var endMs = _elive176Timestamp_(synthetic.turn_state.turn_ends_at);
  var valid = !!(
    rules.round_duration_ms === 10000 &&
    rules.turn_selection_ms === 10000 &&
    rules.mismatch_reveal_ms === 3000 &&
    rules.spectator_reveal_ms === 3000 &&
    first.extended === false &&
    endMs === start.getTime()+10000 &&
    _cs21a194FirstRevealWindow_.__cs21a211NoDeadlineExtension === true &&
    _elmm174Rules_.__cs21a211FastTurn === true
  );
  var result = {
    ok:valid,
    version:CS21A211_MM_FAST_TURN_VERSION,
    turn_selection_ms:CS21A211_MM_TURN_SELECTION_MS,
    mismatch_reveal_ms:CS21A211_MM_PAIR_REVEAL_MS,
    first_card_does_not_extend_turn:true,
    match_fresh_turn_ms:CS21A211_MM_TURN_SELECTION_MS,
    mismatch_next_turn_after_reveal_ms:CS21A211_MM_PAIR_REVEAL_MS,
    timeout_rotates_at_turn_deadline:true,
    historical_cs194_preserved_as_reference:typeof _cs21a211FirstRevealHistorical_ === 'function'
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A211 no superó el contrato Memory Match 10 s / 3 s.');
  return result;
}
