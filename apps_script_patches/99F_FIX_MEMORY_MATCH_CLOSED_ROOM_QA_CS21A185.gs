// CS21A185 · QA · sala cerrada terminal + presencia detenida
// APPEND-ONLY en el repositorio; el usuario recibe SIEMPRE el archivo Apps Script completo ensamblado.
// No usar en producción. Una sala CLOSED no vuelve a avanzar turnos ni renueva presencia.

var CS21A185_MM_CLOSED_ROOM_FIX_VERSION = 'CS21A185-MM-CLOSED-ROOM-FIX1';

function _cs21a185MmRoomClosed_(room) {
  return _elive176Upper_(room && room.STATUS) === 'CLOSED';
}

// Reemplaza el avance histórico para hacer CLOSED un estado realmente terminal.
// Se repite la comprobación después del refetch bajo lock para cerrar la carrera
// entre una lectura LIVE y un cierre concurrente del docente.
var _cs21a185MmMaybeAdvanceLegacy_ = _elive180MaybeAdvanceTurn_;
_elive180MaybeAdvanceTurn_ = function (found) {
  if (!found || !found.row) return null;
  if (_cs21a185MmRoomClosed_(found.row)) return found.row;

  var firstPackage = _elive176Package_(found.row);
  if (!firstPackage || !firstPackage.state || !firstPackage.turn_state) return found.row;
  var firstNow = Date.now();
  var firstStarted = _elive176Timestamp_(firstPackage.turn_state.turn_started_at || firstPackage.state.started_at);
  var firstEnds = _elive176Timestamp_(firstPackage.turn_state.turn_ends_at || firstPackage.state.ends_at);
  var needsChange = (_elive176Upper_(firstPackage.state.phase) === 'COUNTDOWN' && firstStarted && firstNow >= firstStarted) ||
    (firstEnds && firstNow >= firstEnds);
  if (!needsChange) return found.row;

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(2500)) return found.row;
  try {
    var fresh = _elive180FindRoom_(found.row.ROOM_ID || found.row.ROOM_CODE);
    if (!fresh || !fresh.row) return found.row;
    var room = fresh.row;
    if (_cs21a185MmRoomClosed_(room)) return room;

    var current = _elive176Current_(room);
    var pkg = current.room_package || null;
    if (!pkg || !pkg.state || !pkg.turn_state || (pkg.shared_state && pkg.shared_state.completed === true)) return room;

    var now = new Date();
    var nowMs = now.getTime();
    var startedMs = _elive176Timestamp_(pkg.turn_state.turn_started_at || pkg.state.started_at);
    var endsMs = _elive176Timestamp_(pkg.turn_state.turn_ends_at || pkg.state.ends_at);
    var changed = false;
    var timedOut = false;

    if (_elive176Upper_(pkg.state.phase) === 'COUNTDOWN' && startedMs && nowMs >= startedMs) {
      pkg.state.phase = 'OPEN';
      changed = true;
    }
    if (endsMs && nowMs >= endsMs) {
      var durationMs = Number(pkg.rules && pkg.rules.round_duration_ms || 30000) || 30000;
      var next = _elive176NextTurn_(pkg.turn_state, now, durationMs, 'TURN_TIMEOUT');
      pkg.turn_state = next;
      pkg.state.phase = 'OPEN';
      pkg.state.active_player_id = next.active_player_id;
      pkg.state.active_team_id = next.active_team_id;
      pkg.state.started_at = next.turn_started_at;
      pkg.state.ends_at = next.turn_ends_at;
      pkg.server_now = _elive176Iso_(now);
      changed = true;
      timedOut = true;
    }
    if (!changed) return room;

    current.room_package = pkg;
    room = _elive180SetCells_(fresh, {CURRENT_QUESTION_JSON:JSON.stringify(current)});
    _elive180Invalidate_(room);
    if (timedOut) {
      _elive180AppendEvent_(room, 'LIVE_TURN_TIMEOUT', {sesion:{nombre:'SISTEMA'},rol:'system'}, {
        active_player_id:pkg.turn_state.active_player_id,
        active_team_id:pkg.turn_state.active_team_id,
        turn_number:pkg.turn_state.turn_number,
        version:CS21A185_MM_CLOSED_ROOM_FIX_VERSION
      });
    }
    return room;
  } finally {
    lock.releaseLock();
  }
};
_elive180MaybeAdvanceTurn_.__cs21a185ClosedTerminal = true;

// Una sala cerrada puede seguir mostrando resultados, pero no debe parecer
// conectada ni renovar LAST_SEEN_AT indefinidamente.
var _cs21a185MmTouchPlayerLegacy_ = _elive180TouchPlayer_;
_elive180TouchPlayer_ = function (room, player) {
  if (_cs21a185MmRoomClosed_(room)) return;
  return _cs21a185MmTouchPlayerLegacy_(room, player);
};
_elive180TouchPlayer_.__cs21a185ClosedTerminal = true;

var _cs21a185MmVerifyFix4Base_ = verificarMemoryMatchStartFixCS21A183;
verificarMemoryMatchStartFixCS21A183 = function () {
  var previous = _cs21a185MmVerifyFix4Base_();
  var syntheticRow = {
    ROOM_ID:'ELIVE-CS21A185-CLOSED',
    ROOM_CODE:'LAB-CS21A185-CLOSED',
    STATUS:'CLOSED',
    CURRENT_QUESTION_JSON:'{"room_package":{"turn_state":{"turn_number":74}}}'
  };
  var returned = _elive180MaybeAdvanceTurn_({row:syntheticRow});
  var valid = !!(
    previous && previous.ok === true &&
    _cs21a185MmRoomClosed_(syntheticRow) === true &&
    _cs21a185MmRoomClosed_({STATUS:'LIVE'}) === false &&
    returned === syntheticRow &&
    _elive180MaybeAdvanceTurn_.__cs21a185ClosedTerminal === true &&
    _elive180TouchPlayer_.__cs21a185ClosedTerminal === true
  );
  var result = {
    ok:valid,
    version:CS21A185_MM_CLOSED_ROOM_FIX_VERSION,
    previous_version:previous && previous.version,
    memory_match_start_guard:previous && previous.memory_match_start_guard === true,
    direct_start_no_legacy_delegate:previous && previous.direct_start_no_legacy_delegate === true,
    presence_ttl_seconds:previous && previous.presence_ttl_seconds,
    control_pair_metadata:previous && previous.control_pair_metadata === true,
    closed_room_terminal:true,
    closed_room_turns_frozen:true,
    closed_room_presence_frozen:true,
    refetch_closed_guard:true,
    preserves_curriculum_verifier:true,
    qa_master:previous && previous.qa_master,
    qa_operational:previous && previous.qa_operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A185 no superó la verificación de sala cerrada terminal.');
  return result;
};
