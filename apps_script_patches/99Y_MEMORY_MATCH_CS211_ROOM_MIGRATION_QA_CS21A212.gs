// CS21A212 · QA · compatibilidad para salas Memory Match nacidas bajo CS211.
// Se carga DESPUES de 99X. No toca otros juegos ni produccion.
//
// Problema cubierto:
// una sala ya creada con CS211 puede traer rules.round_duration_ms=10000 y
// turn_ends_at=start+10s. CS212 no debe exigir crear una sala nueva para
// recuperar jugabilidad. Normalizamos el paquete al LEERLO, antes de que los
// endpoints/transition engine evalúen el deadline.

var CS21A212_MM_ROOM_MIGRATION_VERSION = 'CS21A212-MM-CS211-ROOM-MIGRATION-1';

function _cs21a212IsMemoryPackage_(pkg) {
  pkg = pkg && typeof pkg === 'object' ? pkg : null;
  if (!pkg) return false;
  var room = pkg.room && typeof pkg.room === 'object' ? pkg.room : {};
  return _elive176Upper_(room.game_id || room.game_code) === ELMM174_GAME_CODE;
}

function _cs21a212NormalizeLegacyRoomPackage_(pkg) {
  if (!_cs21a212IsMemoryPackage_(pkg)) return pkg;

  pkg.rules = _cs21a212Rules_(pkg.rules || {});
  pkg.fast_turn_version = CS21A212_MM_VERSION;
  pkg.latency_safe_version = CS21A212_MM_VERSION;
  pkg.room_migration_version = CS21A212_MM_ROOM_MIGRATION_VERSION;

  var state = pkg.state && typeof pkg.state === 'object' ? pkg.state : {};
  var turnState = pkg.turn_state && typeof pkg.turn_state === 'object' ? pkg.turn_state : {};
  var shared = pkg.shared_state && typeof pkg.shared_state === 'object' ? pkg.shared_state : {};
  var attempt = shared.active_attempt && typeof shared.active_attempt === 'object' ? shared.active_attempt : null;
  var statePhase = _elive176Upper_(state.phase);
  var attemptPhase = _cs21a189AttemptPhase_(attempt);

  // MISMATCH_REVEAL tiene su propio reveal_until de 3 s. No se toca el
  // turn_ends_at allí porque la rotación debe ocurrir al terminar el reveal.
  if (statePhase === 'OPEN' && attemptPhase !== 'MISMATCH_REVEAL') {
    var startedMs = _elive176Timestamp_(turnState.turn_started_at || state.started_at);
    var currentEndMs = _elive176Timestamp_(turnState.turn_ends_at || state.ends_at);
    var requiredEndMs = startedMs ? startedMs + CS21A212_MM_INITIAL_TURN_MS : 0;

    if (attemptPhase === 'FIRST_REVEALED') {
      var revealedMs = _elive176Timestamp_(attempt && attempt.revealed_at);
      if (revealedMs) requiredEndMs = Math.max(
        requiredEndMs || 0,
        revealedMs + CS21A212_MM_MIN_SECOND_PICK_MS
      );
    }

    var targetEndMs = Math.max(currentEndMs || 0, requiredEndMs || 0);
    if (targetEndMs) {
      var targetIso = _elive176Iso_(new Date(targetEndMs));
      turnState.turn_ends_at = targetIso;
      state.ends_at = targetIso;
      if (attemptPhase === 'FIRST_REVEALED') attempt.turn_ends_at = targetIso;
    }
  }

  pkg.state = state;
  pkg.turn_state = turnState;
  if (attempt) shared.active_attempt = attempt;
  pkg.shared_state = shared;
  return pkg;
}

// _elive176Current_ es la entrada común que usan tanto GET/poll como las
// mutaciones después de refetch. Normalizar aquí hace que un room CS211 vivo
// vea 15 s ANTES de que el motor evalúe timeout o valide DISCOVER/SUBMIT_PAIR.
var _cs21a212CurrentBase_ = _elive176Current_;
_elive176Current_ = function (row) {
  var current = _cs21a212CurrentBase_(row);
  if (current && current.room_package) {
    current.room_package = _cs21a212NormalizeLegacyRoomPackage_(current.room_package);
  }
  return current;
};
_elive176Current_.__cs21a212LegacyRoomMigration = true;
_elive176Current_.__base = _cs21a212CurrentBase_;

function verificarMemoryMatchRoomMigrationCS21A212() {
  var start = new Date('2026-08-12T12:00:00.000Z');
  var startMs = start.getTime();
  var legacyEndMs = startMs + 10000;
  var legacy = {
    room:{game_id:'MEMORY_MATCH',status:'LIVE'},
    rules:{round_duration_ms:10000,turn_selection_ms:10000,mismatch_reveal_ms:3000},
    state:{phase:'OPEN',started_at:_elive176Iso_(start),ends_at:_elive176Iso_(new Date(legacyEndMs))},
    turn_state:{turn_number:18,active_player_id:'P1',turn_started_at:_elive176Iso_(start),turn_ends_at:_elive176Iso_(new Date(legacyEndMs))},
    shared_state:{active_attempt:null,completed:false}
  };
  _cs21a212NormalizeLegacyRoomPackage_(legacy);
  var migratedInitialEnd = _elive176Timestamp_(legacy.turn_state.turn_ends_at);

  var revealMs = startMs + 10800;
  legacy.shared_state.active_attempt = {
    phase:'FIRST_REVEALED',player_id:'P1',turn_number:18,
    first_card_id:'A',revealed_at:_elive176Iso_(new Date(revealMs)),
    turn_ends_at:legacy.turn_state.turn_ends_at
  };
  _cs21a212NormalizeLegacyRoomPackage_(legacy);
  var migratedRevealEnd = _elive176Timestamp_(legacy.turn_state.turn_ends_at);

  var mismatch = JSON.parse(JSON.stringify(legacy));
  mismatch.shared_state.active_attempt.phase = 'MISMATCH_REVEAL';
  mismatch.shared_state.active_attempt.reveal_until = _elive176Iso_(new Date(startMs + 3000));
  var mismatchBeforeEnd = _elive176Timestamp_(mismatch.turn_state.turn_ends_at);
  _cs21a212NormalizeLegacyRoomPackage_(mismatch);
  var mismatchAfterEnd = _elive176Timestamp_(mismatch.turn_state.turn_ends_at);

  var valid = !!(
    migratedInitialEnd === startMs + 15000 &&
    migratedRevealEnd === revealMs + 15000 &&
    migratedRevealEnd >= migratedInitialEnd &&
    mismatchAfterEnd === mismatchBeforeEnd &&
    legacy.rules.round_duration_ms === 15000 &&
    legacy.rules.first_reveal_min_second_ms === 15000 &&
    legacy.rules.mismatch_reveal_ms === 3000 &&
    legacy.room_migration_version === CS21A212_MM_ROOM_MIGRATION_VERSION &&
    _elive176Current_.__cs21a212LegacyRoomMigration === true
  );

  var result = {
    ok:valid,
    version:CS21A212_MM_ROOM_MIGRATION_VERSION,
    legacy_initial_ms:10000,
    migrated_initial_ms:migratedInitialEnd-startMs,
    simulated_reveal_after_start_ms:revealMs-startMs,
    migrated_second_pick_ms:migratedRevealEnd-revealMs,
    deadline_never_reduced:migratedRevealEnd>=migratedInitialEnd,
    mismatch_deadline_untouched:mismatchAfterEnd===mismatchBeforeEnd,
    applies_on_current_read:true
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A212 no migró correctamente una sala CS211 abierta.');
  return result;
}
