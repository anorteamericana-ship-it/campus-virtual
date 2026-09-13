/* CONAPE V4.4 · entrypoints para el HMAC de servicio YA EXISTENTE en el Campus LIVE.
 * Este archivo se concatena con conape_v44_live_mirror_core.js dentro del MISMO Script ID.
 * No implementa firma, doPost ni credenciales nuevas.
 */

function agentConapeMirrorReadV44(data) {
  data = data || {};
  var rows = _conapeMirrorV44ReadRows_().map(_conapeMirrorV44PublicRow_);
  var lastSync = '';
  rows.forEach(function(r) {
    if (r.ultimo_sync && r.ultimo_sync > lastSync) lastSync = r.ultimo_sync;
  });
  return {
    ok:true,
    code:'CONAPE_MIRROR_READY',
    source:'MIRROR',
    row_count:rows.length,
    ultimo_sync:lastSync,
    rows:rows
  };
}

function agentConapeMirrorApplySnapshotV44Service(data) {
  return agentConapeMirrorApplySnapshotV44(data || {});
}
