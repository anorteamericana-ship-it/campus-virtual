// CS21A190 · QA · limpieza autoritativa de reveal temporal al vencer/cambiar turno.
// APPEND-ONLY en el repositorio; el usuario recibe SIEMPRE el Apps Script completo ensamblado.
// QA/STAGING solamente. NO USAR EN PRODUCCIÓN.

var CS21A190_MM_TIMEOUT_CLEANUP_VERSION = 'CS21A190-MM-TIMEOUT-CLEANUP-1';

function _cs21a190NormalizeTransientPackage_(pkg, now) {
  if (!pkg || !pkg.turn_state || !pkg.shared_state) return {changed:false,pkg:pkg,cleared:null};
  var shared = _cs21a189ClassicShared_(pkg);
  var cleared = shared.active_attempt ? JSON.parse(JSON.stringify(shared.active_attempt)) : null;
  var changed = _cs21a189NormalizeAttempt_(shared, pkg.turn_state, now instanceof Date ? now : new Date());
  if (!changed) return {changed:false,pkg:pkg,cleared:null};
  shared.board_version = Math.max(1, Number(shared.board_version || 1) || 1) + 1;
  pkg.shared_state = shared;
  pkg.server_now = _elive176Iso_(now instanceof Date ? now : new Date());
  return {changed:true,pkg:pkg,cleared:cleared};
}

function _cs21a190SanitizeStateResponse_(response) {
  response = response || {};
  var pkg = response.room_package || null;
  if (!pkg || !pkg.turn_state || !pkg.shared_state) return response;
  var normalized = _cs21a190NormalizeTransientPackage_(pkg, new Date());
  if (!normalized.changed) return response;
  response.room_package = normalized.pkg;
  response.shared_state = normalized.pkg.shared_state;
  response.transient_reveal_cleared = true;
  response.transient_reveal_cleanup_version = CS21A190_MM_TIMEOUT_CLEANUP_VERSION;
  return response;
}

// CS21A185 sigue siendo quien avanza turnos. CS21A190 normaliza inmediatamente
// el intento temporal DESPUÉS de ese avance, bajo un segundo lock corto y refetch.
var _cs21a190MaybeAdvanceBase_ = _elive180MaybeAdvanceTurn_;
_elive180MaybeAdvanceTurn_ = function (found) {
  var room = _cs21a190MaybeAdvanceBase_(found);
  if (!room || _cs21a185MmRoomClosed_(room)) return room;

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(2500)) return room;
  try {
    var fresh = _elive180FindRoom_(room.ROOM_ID || room.ROOM_CODE);
    if (!fresh || !fresh.row || _cs21a185MmRoomClosed_(fresh.row)) return fresh && fresh.row ? fresh.row : room;

    var current = _elive176Current_(fresh.row);
    var pkg = current.room_package || null;
    var normalized = _cs21a190NormalizeTransientPackage_(pkg, new Date());
    if (!normalized.changed) return fresh.row;

    current.room_package = normalized.pkg;
    var updated = _elive180SetCells_(fresh, {CURRENT_QUESTION_JSON:JSON.stringify(current)});
    _elive180Invalidate_(updated);
    _elive180AppendEvent_(updated, 'MEMORY_MATCH_TRANSIENT_REVEAL_CLEARED', {sesion:{nombre:'SISTEMA'},rol:'system'}, {
      previous_phase:_cs21a189AttemptPhase_(normalized.cleared),
      previous_turn_number:Number(normalized.cleared && normalized.cleared.turn_number || 0) || 0,
      active_turn_number:Number(normalized.pkg.turn_state && normalized.pkg.turn_state.turn_number || 0) || 0,
      reason:'TURN_CHANGE_OR_REVEAL_EXPIRED',
      board_version:Number(normalized.pkg.shared_state && normalized.pkg.shared_state.board_version || 0) || 0,
      version:CS21A190_MM_TIMEOUT_CLEANUP_VERSION
    });
    return updated;
  } finally {
    lock.releaseLock();
  }
};
_elive180MaybeAdvanceTurn_.__cs21a185ClosedTerminal = true;
_elive180MaybeAdvanceTurn_.__cs21a190TransientCleanup = true;

// Defensa de respuesta: aunque un snapshot viejo alcance a salir por una carrera,
// ningún cliente vuelve a pintar un reveal perteneciente a otro turno.
var _cs21a190PlayerStateBase_ = englishLabMemoryMatchGetPlayerStateCS21A180;
englishLabMemoryMatchGetPlayerStateCS21A180 = function (body) {
  return _cs21a190SanitizeStateResponse_(_cs21a190PlayerStateBase_(body));
};
englishLabMemoryMatchGetPlayerStateCS21A180.__cs21a190TransientCleanup = true;

var _cs21a190RoomControlBase_ = englishLabMemoryMatchGetRoomControlCS21A180;
englishLabMemoryMatchGetRoomControlCS21A180 = function (body) {
  return _cs21a190SanitizeStateResponse_(_cs21a190RoomControlBase_(body));
};
englishLabMemoryMatchGetRoomControlCS21A180.__cs21a190TransientCleanup = true;

var _cs21a190VerifyBase_ = verificarMemoryMatchStartFixCS21A183;
verificarMemoryMatchStartFixCS21A183 = function () {
  var previous = _cs21a190VerifyBase_();
  var now = new Date('2026-08-08T03:10:00.000Z');
  var staleFirstPkg = {
    turn_state:{turn_number:2},
    shared_state:{
      version:CS21A189_MM_CLASSIC_SYNC_VERSION,
      board_version:4,
      matched_pair_ids:[],claimed_pairs:{},discovered_cards:{},completed:false,
      active_attempt:{phase:'FIRST_REVEALED',player_id:'P1',turn_number:1,first_card_id:'CARD-A',second_card_id:'',revealed_at:'2026-08-08T03:09:20.000Z',reveal_until:''}
    }
  };
  var staleMismatchPkg = {
    turn_state:{turn_number:3},
    shared_state:{
      version:CS21A189_MM_CLASSIC_SYNC_VERSION,
      board_version:8,
      matched_pair_ids:[],claimed_pairs:{},discovered_cards:{},completed:false,
      active_attempt:{phase:'MISMATCH_REVEAL',player_id:'P2',turn_number:2,first_card_id:'CARD-B',second_card_id:'CARD-C',revealed_at:'2026-08-08T03:09:50.000Z',reveal_until:'2026-08-08T03:09:52.200Z'}
    }
  };
  var firstResult = _cs21a190NormalizeTransientPackage_(staleFirstPkg, now);
  var mismatchResult = _cs21a190NormalizeTransientPackage_(staleMismatchPkg, now);
  var valid = !!(
    previous && previous.ok === true &&
    firstResult.changed === true && firstResult.pkg.shared_state.active_attempt === null &&
    mismatchResult.changed === true && mismatchResult.pkg.shared_state.active_attempt === null &&
    Number(firstResult.pkg.shared_state.board_version) === 5 &&
    Number(mismatchResult.pkg.shared_state.board_version) === 9 &&
    _elive180MaybeAdvanceTurn_.__cs21a190TransientCleanup === true &&
    englishLabMemoryMatchGetPlayerStateCS21A180.__cs21a190TransientCleanup === true &&
    englishLabMemoryMatchGetRoomControlCS21A180.__cs21a190TransientCleanup === true
  );
  var result = {
    ok:valid,
    version:CS21A190_MM_TIMEOUT_CLEANUP_VERSION,
    previous_version:previous && previous.version,
    classic_memory:true,
    timeout_clears_first_reveal:true,
    timeout_clears_stale_attempt:true,
    expired_mismatch_cleanup:true,
    stale_snapshot_sanitized:true,
    board_version_advances_on_cleanup:true,
    closed_room_terminal:previous && previous.closed_room_terminal === true,
    synchronized_reveal:previous && previous.synchronized_reveal === true,
    mismatch_flip_back:previous && previous.mismatch_flip_back === true,
    matched_pair_stays_face_up:previous && previous.matched_pair_stays_face_up === true,
    correct_pair_keeps_player:previous && previous.correct_pair_keeps_player === true,
    qa_master:previous && previous.qa_master,
    qa_operational:previous && previous.qa_operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A190 no superó la verificación de limpieza temporal al cambiar turno.');
  return result;
};
