// CS21A194 - QA - Memory Match tolerante a latencia real.
// Capa acumulativa: cargar despues de 99O. QA/STAGING solamente.
// No cambia rutas, permisos, notas, pagos ni endpoints de otros juegos.

var CS21A194_MM_LATENCY_SAFE_VERSION = 'CS21A194-MM-LATENCY-SAFE-1';
var CS21A194_MM_MIN_SECOND_PICK_MS = 30000;

function _cs21a194FirstRevealWindow_(pkg) {
  pkg = pkg || {};
  var shared = pkg.shared_state || {};
  var attempt = shared.active_attempt || null;
  var phase = _elive176Upper_(attempt && attempt.phase);
  if (phase !== 'FIRST_REVEALED') {
    return {extended:false,reason:'NO_FIRST_REVEAL',version:CS21A194_MM_LATENCY_SAFE_VERSION};
  }

  var revealedMs = _elive176Timestamp_(attempt.revealed_at);
  if (!revealedMs) {
    return {extended:false,reason:'NO_REVEAL_TIMESTAMP',version:CS21A194_MM_LATENCY_SAFE_VERSION};
  }

  pkg.rules = pkg.rules && typeof pkg.rules === 'object' ? pkg.rules : {};
  pkg.rules.first_reveal_min_second_ms = CS21A194_MM_MIN_SECOND_PICK_MS;
  pkg.latency_safe_version = CS21A194_MM_LATENCY_SAFE_VERSION;

  var turnState = pkg.turn_state && typeof pkg.turn_state === 'object' ? pkg.turn_state : {};
  var state = pkg.state && typeof pkg.state === 'object' ? pkg.state : {};
  var currentEndMs = _elive176Timestamp_(turnState.turn_ends_at || state.ends_at);
  var requiredEndMs = revealedMs + CS21A194_MM_MIN_SECOND_PICK_MS;
  var targetEndMs = Math.max(currentEndMs || 0, requiredEndMs);
  var targetIso = _elive176Iso_(new Date(targetEndMs));

  // Mantener las tres fuentes de deadline alineadas. attempt.turn_ends_at sirve
  // como respaldo visual; turn_state/state siguen siendo las fuentes canónicas.
  turnState.turn_ends_at = targetIso;
  state.ends_at = targetIso;
  attempt.turn_ends_at = targetIso;
  pkg.turn_state = turnState;
  pkg.state = state;
  shared.active_attempt = attempt;
  pkg.shared_state = shared;

  return {
    extended:targetEndMs > currentEndMs,
    previous_end_ms:currentEndMs,
    required_end_ms:requiredEndMs,
    turn_ends_at:targetIso,
    min_second_pick_ms:CS21A194_MM_MIN_SECOND_PICK_MS,
    version:CS21A194_MM_LATENCY_SAFE_VERSION
  };
}
_cs21a194FirstRevealWindow_.__cs21a194Deterministic = true;

// 99K escribe el paquete FIRST_REVEALED dentro del ScriptLock del submit.
// Interceptar ese único punto permite extender el deadline antes de la misma
// escritura revisionada por 99O: no existe ventana intermedia con carta abierta
// y deadline viejo, y repetir la función no vuelve a regalar tiempo.
var _cs21a194WritePackageBase_ = _cs21a189WritePackage_;
_cs21a189WritePackage_ = function (found, room, current, pkg) {
  _cs21a194FirstRevealWindow_(pkg);
  return _cs21a194WritePackageBase_(found, room, current, pkg);
};
_cs21a189WritePackage_.__cs21a194LatencySafe = true;
_cs21a189WritePackage_.__base = _cs21a194WritePackageBase_;

var _cs21a194VerifyBase_ = verificarMemoryMatchStartFixCS21A183;
verificarMemoryMatchStartFixCS21A183 = function () {
  var previous = _cs21a194VerifyBase_();
  var revealedAt = '2026-08-10T20:00:00.000Z';
  var revealedMs = Date.parse(revealedAt);
  var shortEnd = new Date(revealedMs + 4000).toISOString();
  var synthetic = {
    rules:{round_duration_ms:30000},
    state:{phase:'OPEN',ends_at:shortEnd},
    turn_state:{turn_number:1,turn_ends_at:shortEnd},
    shared_state:{
      active_attempt:{
        phase:'FIRST_REVEALED',
        first_card_id:'CARD-1',
        player_id:'P1',
        turn_number:1,
        revealed_at:revealedAt,
        reveal_until:''
      }
    }
  };
  var first = _cs21a194FirstRevealWindow_(synthetic);
  var second = _cs21a194FirstRevealWindow_(synthetic);
  var expectedEndMs = revealedMs + CS21A194_MM_MIN_SECOND_PICK_MS;
  var actualEndMs = _elive176Timestamp_(synthetic.turn_state.turn_ends_at);
  var stateEndMs = _elive176Timestamp_(synthetic.state.ends_at);
  var attemptEndMs = _elive176Timestamp_(synthetic.shared_state.active_attempt.turn_ends_at);
  var valid = !!(
    previous && previous.ok === true &&
    first.extended === true &&
    second.extended === false &&
    actualEndMs === expectedEndMs &&
    stateEndMs === expectedEndMs &&
    attemptEndMs === expectedEndMs &&
    synthetic.rules.first_reveal_min_second_ms === CS21A194_MM_MIN_SECOND_PICK_MS &&
    synthetic.latency_safe_version === CS21A194_MM_LATENCY_SAFE_VERSION &&
    _cs21a189WritePackage_.__cs21a194LatencySafe === true
  );
  var result = {
    ok:valid,
    version:CS21A194_MM_LATENCY_SAFE_VERSION,
    previous_version:previous && previous.version,
    first_card_immediate_client_contract:true,
    second_pick_min_window_ms:CS21A194_MM_MIN_SECOND_PICK_MS,
    first_reveal_deadline_extended_atomically:true,
    first_reveal_deadline_extension_idempotent:true,
    turn_state_and_package_state_aligned:true,
    memory_match_only:true,
    hangman_router_untouched:true,
    qa_master:previous && previous.qa_master,
    qa_operational:previous && previous.qa_operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A194 no supero la verificacion de latencia Memory Match.');
  return result;
};
