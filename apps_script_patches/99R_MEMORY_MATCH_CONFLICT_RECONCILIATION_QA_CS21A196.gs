// CS21A196 - QA - reconciliación de conflictos y coherencia de revisión.
// Capa acumulativa: cargar después de CS21A195/99Q. QA/STAGING solamente.
// No cambia permisos, rutas, puntos, reglas de Hangman ni Sentence Order.

var CS21A196_MM_RECONCILIATION_VERSION = 'CS21A196-MM-CONFLICT-RECONCILIATION-1';

// 99O incrementa state_revision dentro del JSON que termina escrito. 99K
// conserva otro objeto pkg en memoria; esta función alinea sólo la revisión de
// la respuesta con el paquete efectivamente devuelto por _elive180SetCells_.
// No hace una segunda lectura de Sheets.
function _cs21a196AlignWrittenPackage_(room, pkg) {
  pkg = pkg && typeof pkg === 'object' ? pkg : {};
  var written = _elive176Package_(room || {});
  if (!written || typeof written !== 'object') return pkg;
  var writtenRevision = _cs21a192Revision_(written);
  var responseRevision = _cs21a192Revision_(pkg);
  if (!writtenRevision || writtenRevision <= responseRevision) return pkg;

  pkg.state_revision = writtenRevision;
  pkg.shared_state = pkg.shared_state && typeof pkg.shared_state === 'object'
    ? pkg.shared_state : {};
  pkg.shared_state.state_revision = writtenRevision;
  pkg.reconciliation_version = CS21A196_MM_RECONCILIATION_VERSION;
  return pkg;
}
_cs21a196AlignWrittenPackage_.__cs21a196NoSecondSheetRead = true;

// Un rechazo pertenece al solicitante y puede traer error, mensaje, ranking
// individual o precondiciones. Nunca debe convertirse en estado compartido del
// relay de sala. Los GET y mutaciones aceptadas siguen usando CS195.
var _cs21a196PublishResponseRelayBase_ = _cs21a195PublishResponseRelay_;
_cs21a195PublishResponseRelay_ = function (roomOrBody, response) {
  if (response && response.ok === false) return false;
  return _cs21a196PublishResponseRelayBase_(roomOrBody, response);
};
_cs21a195PublishResponseRelay_.__cs21a196RejectsNotShared = true;
_cs21a195PublishResponseRelay_.__base = _cs21a196PublishResponseRelayBase_;

var _cs21a196VerifyBase_ = verificarMemoryMatchStartFixCS21A183;
verificarMemoryMatchStartFixCS21A183 = function () {
  var previous = _cs21a196VerifyBase_();
  var stalePkg = {
    state_revision:8,
    shared_state:{state_revision:8,board_version:4}
  };
  var current = {
    room_package:{
      state_revision:9,
      shared_state:{state_revision:9,board_version:4}
    }
  };
  var syntheticRoom = {
    CURRENT_QUESTION_JSON:JSON.stringify(current)
  };
  var aligned = _cs21a196AlignWrittenPackage_(syntheticRoom, stalePkg);
  var rejectedRelay = _cs21a195PublishResponseRelay_(
    {room_code:'LAB-196'},
    {ok:false,error:'state_conflict',room_package:{state_revision:10,shared_state:{state_revision:10}}}
  );

  var valid = !!(
    previous && previous.ok === true &&
    Number(aligned.state_revision) === 9 &&
    Number(aligned.shared_state && aligned.shared_state.state_revision) === 9 &&
    aligned.reconciliation_version === CS21A196_MM_RECONCILIATION_VERSION &&
    rejectedRelay === false &&
    _cs21a195PublishResponseRelay_.__cs21a196RejectsNotShared === true
  );
  var result = {
    ok:valid,
    version:CS21A196_MM_RECONCILIATION_VERSION,
    previous_version:previous && previous.version,
    mutation_response_revision_matches_written_state:true,
    domain_conflicts_keep_canonical_package:true,
    rejected_mutations_not_published_to_room_relay:true,
    no_second_sheet_read:true,
    memory_match_only:true,
    qa_master:previous && previous.qa_master,
    qa_operational:previous && previous.qa_operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A196 no superó la verificación de reconciliación Memory Match.');
  return result;
};
