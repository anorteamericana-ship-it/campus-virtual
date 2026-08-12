// CS21A212 · QA · Memory Match rápido pero tolerante a latencia real.
// Capa acumulativa sobre CS21A211. QA/STAGING solamente. NO PRODUCCION.
//
// Contrato corregido:
// - 15 s iniciales para que el jugador actúe/abra la primera carta;
// - cuando el servidor acepta FIRST_REVEALED, garantiza 15 s adicionales
//   desde revealed_at para completar la segunda carta;
// - el deadline NUNCA se reduce: Math.max(deadline actual, revealed_at + 15 s);
// - la protección solo aplica a FIRST_REVEALED del turno/jugador vigentes;
// - MATCH: conserva jugador y recibe un turno nuevo de 15 s;
// - MISMATCH: ambas cartas 3 s y luego rota inmediatamente;
// - si vence la ventana vigente, el timeout sí rota y limpia el intento.

var CS21A212_MM_VERSION = 'CS21A212-MM-LATENCY-SAFE-15S-ACK-1';
var CS21A212_MM_INITIAL_TURN_MS = 15000;
var CS21A212_MM_MIN_SECOND_PICK_MS = 15000;
var CS21A212_MM_PAIR_REVEAL_MS = 3000;

function _cs21a212Rules_(rules) {
  rules = rules && typeof rules === 'object' ? rules : {};
  rules.round_duration_ms = CS21A212_MM_INITIAL_TURN_MS;
  rules.turn_selection_ms = CS21A212_MM_INITIAL_TURN_MS;
  rules.first_reveal_min_second_ms = CS21A212_MM_MIN_SECOND_PICK_MS;
  rules.reveal_duration_ms = CS21A212_MM_PAIR_REVEAL_MS;
  rules.mismatch_reveal_ms = CS21A212_MM_PAIR_REVEAL_MS;
  rules.spectator_reveal_ms = CS21A212_MM_PAIR_REVEAL_MS;
  rules.pair_reveal_ms = CS21A212_MM_PAIR_REVEAL_MS;
  rules.fast_turn_version = CS21A212_MM_VERSION;
  rules.latency_safe_version = CS21A212_MM_VERSION;
  return rules;
}

// Las salas nuevas conservan 15 s iniciales y 3 s de mismatch.
var _cs21a212RulesBase_ = _elmm174Rules_;
_elmm174Rules_ = function (level, mode) {
  return _cs21a212Rules_(_cs21a212RulesBase_(level, mode));
};
_elmm174Rules_.__cs21a212LatencySafeFastTurn = true;
_elmm174Rules_.__base = _cs21a212RulesBase_;

// Reemplaza el clamp defectuoso de CS211. Este hook se invoca dentro de la
// escritura FIRST_REVEALED protegida por ScriptLock (wrapper histórico CS194).
var _cs21a212FirstRevealBase_ = _cs21a194FirstRevealWindow_;
_cs21a194FirstRevealWindow_ = function (pkg) {
  pkg = pkg || {};
  var shared = pkg.shared_state && typeof pkg.shared_state === 'object' ? pkg.shared_state : {};
  var attempt = shared.active_attempt && typeof shared.active_attempt === 'object' ? shared.active_attempt : null;
  var phase = _elive176Upper_(attempt && attempt.phase);
  if (phase !== 'FIRST_REVEALED') {
    return {extended:false,reason:'NO_FIRST_REVEAL',version:CS21A212_MM_VERSION};
  }

  var revealedMs = _elive176Timestamp_(attempt.revealed_at);
  if (!revealedMs) {
    return {extended:false,reason:'NO_REVEAL_TIMESTAMP',version:CS21A212_MM_VERSION};
  }

  pkg.rules = _cs21a212Rules_(pkg.rules || {});
  pkg.fast_turn_version = CS21A212_MM_VERSION;
  pkg.latency_safe_version = CS21A212_MM_VERSION;

  var turnState = pkg.turn_state && typeof pkg.turn_state === 'object' ? pkg.turn_state : {};
  var state = pkg.state && typeof pkg.state === 'object' ? pkg.state : {};
  var currentEndMs = _elive176Timestamp_(turnState.turn_ends_at || state.ends_at);
  var requiredEndMs = revealedMs + CS21A212_MM_MIN_SECOND_PICK_MS;
  var targetEndMs = Math.max(currentEndMs || 0, requiredEndMs);
  var extended = targetEndMs > (currentEndMs || 0);

  if (targetEndMs) {
    var targetIso = _elive176Iso_(new Date(targetEndMs));
    turnState.turn_ends_at = targetIso;
    state.ends_at = targetIso;
    attempt.turn_ends_at = targetIso;
  }

  pkg.turn_state = turnState;
  pkg.state = state;
  shared.active_attempt = attempt;
  pkg.shared_state = shared;

  return {
    extended:extended,
    previous_end_ms:currentEndMs,
    required_end_ms:requiredEndMs,
    turn_ends_at:turnState.turn_ends_at || state.ends_at || '',
    min_second_pick_ms:CS21A212_MM_MIN_SECOND_PICK_MS,
    deadline_never_reduced:true,
    version:CS21A212_MM_VERSION
  };
};
_cs21a194FirstRevealWindow_.__cs21a212LatencySafe = true;
_cs21a194FirstRevealWindow_.__base = _cs21a212FirstRevealBase_;

function _cs21a212FirstRevealEffectiveDeadlineMs_(pkg) {
  pkg = pkg || {};
  var turnState = pkg.turn_state || {};
  var shared = pkg.shared_state || {};
  var attempt = shared.active_attempt || null;
  if (_cs21a189AttemptPhase_(attempt) !== 'FIRST_REVEALED') return 0;

  var currentTurn = Number(turnState.turn_number || 0) || 0;
  var attemptTurn = Number(attempt && attempt.turn_number || 0) || 0;
  var currentPlayer = _elive176Text_(turnState.active_player_id);
  var attemptPlayer = _elive176Text_(attempt && attempt.player_id);
  if (!currentTurn || !attemptTurn || currentTurn !== attemptTurn || !currentPlayer || currentPlayer !== attemptPlayer) return 0;

  var canonicalEndMs = _elive176Timestamp_(turnState.turn_ends_at || pkg.state && pkg.state.ends_at);
  var attemptEndMs = _elive176Timestamp_(attempt.turn_ends_at);
  var revealedMs = _elive176Timestamp_(attempt.revealed_at);
  var requiredEndMs = revealedMs ? revealedMs + CS21A212_MM_MIN_SECOND_PICK_MS : 0;
  return Math.max(canonicalEndMs || 0, attemptEndMs || 0, requiredEndMs || 0);
}

// CS192 evaluaba endsMs antes de FIRST_REVEALED. Si el deadline viejo ya había
// vencido, podía rotar el turno aunque la primera carta acabara de ser aceptada.
// CS212 protege ese intento hasta su deadline efectivo propio; después de él,
// vuelve a delegar en el comportamiento canónico de CS192.
var _cs21a212TransitionNeededBase_ = _cs21a192TransitionNeeded_;
_cs21a192TransitionNeeded_ = function (pkg, nowMs) {
  nowMs = Number(nowMs || Date.now()) || Date.now();
  var protectedUntil = _cs21a212FirstRevealEffectiveDeadlineMs_(pkg);
  if (protectedUntil && nowMs < protectedUntil) return false;
  return _cs21a212TransitionNeededBase_(pkg, nowMs);
};
_cs21a192TransitionNeeded_.__cs21a212FirstRevealProtected = true;
_cs21a192TransitionNeeded_.__base = _cs21a212TransitionNeededBase_;

function verificarMemoryMatchFastTurnCS21A212() {
  var start = new Date('2026-08-12T12:00:00.000Z');
  var startMs = start.getTime();
  var revealedMs = startMs + 10000;
  var initialEndMs = startMs + CS21A212_MM_INITIAL_TURN_MS;
  var synthetic = {
    rules:{round_duration_ms:CS21A212_MM_INITIAL_TURN_MS},
    state:{phase:'OPEN',started_at:_elive176Iso_(start),ends_at:_elive176Iso_(new Date(initialEndMs))},
    turn_state:{turn_number:7,active_player_id:'P1',turn_started_at:_elive176Iso_(start),turn_ends_at:_elive176Iso_(new Date(initialEndMs))},
    shared_state:{active_attempt:{phase:'FIRST_REVEALED',player_id:'P1',turn_number:7,revealed_at:_elive176Iso_(new Date(revealedMs)),turn_ends_at:_elive176Iso_(new Date(initialEndMs))}}
  };

  var first = _cs21a194FirstRevealWindow_(synthetic);
  var second = _cs21a194FirstRevealWindow_(synthetic);
  var expectedEndMs = revealedMs + CS21A212_MM_MIN_SECOND_PICK_MS;
  var actualEndMs = _elive176Timestamp_(synthetic.turn_state.turn_ends_at);
  var protectedBefore = _cs21a192TransitionNeeded_(synthetic, expectedEndMs - 1);
  var transitionAfter = _cs21a192TransitionNeeded_(synthetic, expectedEndMs + 1);

  var mismatch = JSON.parse(JSON.stringify(synthetic));
  mismatch.shared_state.active_attempt.phase = 'MISMATCH_REVEAL';
  mismatch.shared_state.active_attempt.reveal_until = _elive176Iso_(new Date(startMs + 3000));
  var mismatchBefore = _cs21a194FirstRevealWindow_(mismatch);

  var valid = !!(
    first.extended === true &&
    second.extended === false &&
    actualEndMs === expectedEndMs &&
    expectedEndMs > initialEndMs &&
    protectedBefore === false &&
    transitionAfter === true &&
    mismatchBefore.reason === 'NO_FIRST_REVEAL' &&
    synthetic.rules.round_duration_ms === 15000 &&
    synthetic.rules.first_reveal_min_second_ms === 15000 &&
    synthetic.rules.mismatch_reveal_ms === 3000 &&
    _cs21a194FirstRevealWindow_.__cs21a212LatencySafe === true &&
    _cs21a192TransitionNeeded_.__cs21a212FirstRevealProtected === true
  );

  var result = {
    ok:valid,
    version:CS21A212_MM_VERSION,
    initial_turn_ms:CS21A212_MM_INITIAL_TURN_MS,
    second_pick_window_from_server_reveal_ms:CS21A212_MM_MIN_SECOND_PICK_MS,
    mismatch_reveal_ms:CS21A212_MM_PAIR_REVEAL_MS,
    simulated_first_server_ack_ms:10000,
    deadline_never_reduced:true,
    first_reveal_only:true,
    first_reveal_protected_from_timeout:true,
    mismatch_not_extended:true,
    expected_turn_end_ms:expectedEndMs,
    actual_turn_end_ms:actualEndMs
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A212 no superó el contrato Memory Match latency-safe.');
  return result;
}
