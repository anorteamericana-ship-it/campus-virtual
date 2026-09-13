/* CONAPE V4.4 · entrypoints para el HMAC de servicio YA EXISTENTE en el Campus LIVE.
 * Este archivo se concatena con conape_v44_live_mirror_core.js dentro del MISMO Script ID.
 * No implementa firma, doPost ni credenciales nuevas.
 */

function _conapeMirrorV44RejectUnknownData_(data, allowed) {
  data = data || {};
  if (Object.prototype.toString.call(data) !== '[object Object]') throw new Error('CONAPE_SERVICE_DATA_INVALID');
  var allow = {};
  (allowed || []).forEach(function(k) { allow[k] = true; });
  Object.keys(data).forEach(function(k) {
    if (!allow[k]) throw new Error('CONAPE_SERVICE_UNKNOWN_FIELD');
  });
  return data;
}

function agentConapeMirrorReadV44(data) {
  _conapeMirrorV44RejectUnknownData_(data || {}, []);
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
  data = _conapeMirrorV44RejectUnknownData_(data || {}, [
    'method','columns_ok','counts_match','rows_csv','rows_html_all','captured_at','rows'
  ]);
  return agentConapeMirrorApplySnapshotV44(data);
}
