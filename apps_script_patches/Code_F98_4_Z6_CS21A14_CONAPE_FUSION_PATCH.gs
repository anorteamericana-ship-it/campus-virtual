// F98.4-Z6-CS21A14 · CONAPE FUSION PARA CAMBIOS PENDIENTES
// Pegar AL FINAL del Code.gs vigente en Apps Script y publicar nueva versión.
// Objetivo:
// - No maquilla la auditoría.
// - Si un estudiante tiene cambio de grupo/plan pendiente de aprobación CONAPE,
//   CONAPE recibe una proyección fusionada/congelada basada en lo último aprobado.
// - Mantiene 5-plan_estudios y 7-morosidad consistentes para n8n.
// - No publica el nuevo plan/periodo mientras CONAPE no apruebe el expediente.

var CONAPE_FUSION_CS21A14_VERSION = 'F98.4-Z6-CS21A14';

function _cs21a14Txt_(v) {
  return String(v == null ? '' : v).trim();
}
function _cs21a14Upper_(v) {
  return _cs21a14Txt_(v).toUpperCase();
}
function _cs21a14Ced_(v) {
  if (typeof _conapeAxCed_ === 'function') return _conapeAxCed_(v);
  if (typeof _limpiarCedula === 'function') return _limpiarCedula(v);
  return _cs21a14Txt_(v).replace(/[^0-9A-Za-z]/g, '');
}
function _cs21a14CloneRow_(r) {
  return (r || []).slice();
}
function _cs21a14KeyMora_(r) {
  return _cs21a14Ced_(r && r[1]) + '|' + _cs21a14Txt_(r && r[2]) + '|' + _cs21a14Txt_(r && r[3]);
}
function _cs21a14IsPendingConape_(pend) {
  if (!pend) return false;
  var estado = _cs21a14Upper_(pend.ESTADO || pend.estado || pend.CONAPE_EXPEDIENTE_ESTADO || pend.conape_expediente_estado || pend.CONAPE_SYNC || pend.conape_sync);
  var applied = ['APLICADO_CONAPE', 'APROBADO_CONAPE', 'APROBADO', 'APLICADO', 'CERRADO', 'FINALIZADO', 'REVERSADO', 'RECHAZADO', 'ANULADO'];
  return applied.indexOf(estado) < 0;
}
function _cs21a14PendingForCode_(codigo) {
  try {
    if (typeof _biConapePendingForCode_ === 'function') {
      var p = _biConapePendingForCode_(codigo);
      if (_cs21a14IsPendingConape_(p)) return p;
    }
  } catch (_) {}
  return null;
}
function _cs21a14ParseJson_(v, fallback) {
  if (!v) return fallback || null;
  if (typeof v === 'object') return v;
  try {
    if (typeof _akParseJson_ === 'function') return _akParseJson_(v, fallback || null);
  } catch (_) {}
  try { return JSON.parse(String(v)); } catch (_) { return fallback || null; }
}
function _cs21a14SnapshotFromPending_(pend) {
  pend = pend || {};
  var raw = pend.SNAPSHOT_JSON || pend.snapshot_json || pend.SNAPSHOT || pend.snapshot || '';
  return _cs21a14ParseJson_(raw, null) || {};
}
function _cs21a14MateriaNivelMap_() {
  var out = {};
  try {
    Object.keys(CONAPE_COD_MATERIA || {}).forEach(function(niv) {
      out[_cs21a14Upper_(CONAPE_COD_MATERIA[niv])] = _cs21a14Upper_(niv);
    });
  } catch (_) {}
  return out;
}
function _cs21a14RowsForCed_(rows, ced, colIndex) {
  var clean = _cs21a14Ced_(ced), out = [];
  (rows || []).forEach(function(r, i) {
    if (i === 0) return;
    if (_cs21a14Ced_(r[colIndex]) === clean) out.push(_cs21a14CloneRow_(r));
  });
  return out;
}
function _cs21a14DedupBy_(rows, keyFn) {
  var seen = {}, out = [];
  (rows || []).forEach(function(r) {
    var k = keyFn(r);
    if (!k || seen[k]) return;
    seen[k] = true;
    out.push(_cs21a14CloneRow_(r));
  });
  return out;
}
function _cs21a14SafePlanRows_(extRows5, ced, datos) {
  var existing = _cs21a14RowsForCed_(extRows5, ced, 0);
  var byMateria = _cs21a14DedupBy_(existing, function(r) { return _cs21a14Ced_(r[0]) + '|' + _cs21a14Upper_(r[6]); });
  if (byMateria.length === 4) {
    return { rows:byMateria, source:'CONAPE_EXISTENTE_APROBADO' };
  }
  var fallback = buildFilas_5([datos]);
  return { rows:fallback, source:'FALLBACK_APOLLO_ACTUAL', warning:'5-plan_estudios externo no tenía cuatro materias únicas; se usó construcción actual como contención.' };
}
function _cs21a14SafeHistoryRows_(ss, extRows6, ced, codigo, datos, pend) {
  var snap = _cs21a14SnapshotFromPending_(pend);
  var snapHist = Array.isArray(snap.conape_historial) ? snap.conape_historial.map(_cs21a14CloneRow_) : [];
  if (snapHist.length) return { rows:snapHist, source:'SNAPSHOT_CONAPE_PRE_CAMBIO' };

  var existing = _cs21a14RowsForCed_(extRows6, ced, 2);
  if (existing.length) return { rows:existing, source:'CONAPE_EXISTENTE_APROBADO' };

  var desired = _conapeAxHistoryDesired_(ss, String(codigo), datos);
  if (desired && desired.conflicts && desired.conflicts.length) {
    throw new Error('El historial tiene más de un intento de la misma materia en el mismo año/periodo: ' + desired.conflicts.slice(0, 4).join(', ') + '. Debe resolverse el periodo antes de sincronizar.');
  }
  return { rows:(desired && desired.rows) || [], source:'FALLBACK_HISTORIAL_APOLLO' };
}
function _cs21a14MoraForHist_(histRow, datos, materiaNivel) {
  var materia = _cs21a14Upper_(histRow && histRow[4]);
  var nivel = materiaNivel[materia] || '';
  var estatus = _cs21a14Upper_(histRow && histRow[8]);
  var moraDatos = datos && datos.morosidad && nivel ? _cs21a14Upper_(datos.morosidad[nivel]) : '';
  if (moraDatos === 'SI' || moraDatos === 'NO' || moraDatos === 'PE') return moraDatos;
  if (!estatus || estatus === 'PE' || estatus === 'CNV') return 'NO';
  return 'NO';
}
function _cs21a14SafeMoraRows_(extRows7, ced, histRows, datos) {
  var existing = _cs21a14RowsForCed_(extRows7, ced, 1);
  var out = existing.map(_cs21a14CloneRow_);
  var byKey = {};
  out.forEach(function(r) { byKey[_cs21a14KeyMora_(r)] = true; });

  var materiaNivel = _cs21a14MateriaNivelMap_();
  (histRows || []).forEach(function(h) {
    var anio = _cs21a14Txt_(h[5]);
    var periodo = _cs21a14Txt_(h[6]);
    if (!anio || !periodo) return;
    var key = _cs21a14Ced_(ced) + '|' + anio + '|' + periodo;
    if (byKey[key]) return;
    var estado = _cs21a14MoraForHist_(h, datos, materiaNivel);
    out.push(['SJ01', _cs21a14Ced_(ced), anio, periodo, estado]);
    byKey[key] = true;
  });

  return _conapeAxConsolidateMora_(out);
}
function _cs21a14BuildPendingFusion_(ss, codigo, datos, pend) {
  var ced = _cs21a14Ced_(datos && datos.cedula);
  if (!ced) throw new Error('El estudiante ' + codigo + ' no tiene cédula válida.');

  var ext = {};
  Object.keys(CONAPE_AX_SHEET_IDS).forEach(function(name) {
    ext[name] = _conapeAxRows_(CONAPE_AX_SHEET_IDS[name]);
  });

  var plan = _cs21a14SafePlanRows_(ext['5-plan_estudios'].rows, ced, datos);
  var hist = _cs21a14SafeHistoryRows_(ss, ext['6-historial'].rows, ced, codigo, datos, pend);
  var mora = _cs21a14SafeMoraRows_(ext['7-morosidad'].rows, ced, hist.rows, datos);

  return {
    ext:ext,
    desired:{
      '4-estudiantes': buildFilas_4([datos]),
      '5-plan_estudios': plan.rows,
      '6-historial': hist.rows,
      '7-morosidad': mora
    },
    meta:{
      pending:true,
      fusion:true,
      plan_source:plan.source,
      history_source:hist.source,
      plan_warning:plan.warning || '',
      solicitud_id:_cs21a14Txt_(pend && (pend.SOLICITUD_ID || pend.solicitud_id || pend.CAMBIO_ID || pend.cambio_id)),
      estado:_cs21a14Txt_(pend && (pend.ESTADO || pend.estado || pend.CONAPE_EXPEDIENTE_ESTADO || pend.CONAPE_SYNC))
    }
  };
}
function _cs21a14ApplyDesired_(bundle, datos, codigo) {
  var desired = bundle.desired || {};
  if ((desired['5-plan_estudios'] || []).length !== 4) {
    throw new Error('La proyección CONAPE de ' + codigo + ' no produjo cuatro materias en 5-plan_estudios. No se escribió nada.');
  }
  var ext = bundle.ext || {}, writes = [];
  writes = writes.concat(_conapeAxPlanWrites_(ext['4-estudiantes'].ws, ext['4-estudiantes'].rows, desired['4-estudiantes'], function(r){ return _conapeAxCed_(r[1]); }, '4-estudiantes'));
  writes = writes.concat(_conapeAxPlanWrites_(ext['5-plan_estudios'].ws, ext['5-plan_estudios'].rows, desired['5-plan_estudios'], function(r){ return _conapeAxCed_(r[0]) + '|' + _conapeAxUpper_(r[6]); }, '5-plan_estudios'));
  writes = writes.concat(_conapeAxPlanWrites_(ext['6-historial'].ws, ext['6-historial'].rows, desired['6-historial'], function(r){ return _conapeAxCed_(r[2]) + '|' + _conapeAxUpper_(r[4]) + '|' + _conapeAxText_(r[5]) + '|' + _conapeAxText_(r[6]) + '|' + _conapeAxUpper_(r[7]); }, '6-historial'));
  writes = writes.concat(_conapeAxPlanWrites_(ext['7-morosidad'].ws, ext['7-morosidad'].rows, desired['7-morosidad'], function(r){ return _conapeAxCed_(r[1]) + '|' + _conapeAxText_(r[2]) + '|' + _conapeAxText_(r[3]); }, '7-morosidad'));
  _conapeAxApplyWrites_(writes);

  var out = {
    ok:true,
    version:CONAPE_FUSION_CS21A14_VERSION,
    codigo:String(codigo),
    cedula:_cs21a14Ced_(datos.cedula),
    nombre:datos.nombre,
    filas_actualizadas:writes.filter(function(w){ return !w.append; }).length,
    filas_agregadas:writes.filter(function(w){ return w.append; }).length,
    historial_intentos:(desired['6-historial'] || []).length,
    morosidad_filas:(desired['7-morosidad'] || []).length,
    mensaje: bundle.meta && bundle.meta.fusion
      ? 'CONAPE fusionado para cambio pendiente: se conserva la proyección aprobada y se completan filas faltantes para n8n.'
      : 'CONAPE actualizado sin eliminar ni reescribir tablas completas.'
  };
  if (bundle.meta) {
    Object.keys(bundle.meta).forEach(function(k){ out[k] = bundle.meta[k]; });
  }
  return out;
}

// Override seguro del core CONAPE AX.
// Esta función reemplaza el bloqueo anterior que abortaba cuando existía
// _biConapePendingForCode_(codigo). En lugar de abortar, fusiona la salida
// CONAPE aprobada para que n8n reciba hojas consistentes.
function _conapeAxSyncStudentCore_(codigo) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var datos = leerDatosEstudiante_CONAPE(ss, String(codigo));
  if (!datos) throw new Error('Estudiante no encontrado: ' + codigo);
  var ced = _conapeAxCed_(datos.cedula);
  if (!ced) throw new Error('El estudiante ' + codigo + ' no tiene cédula válida.');

  var pendienteBI = _cs21a14PendingForCode_(codigo);
  if (pendienteBI) {
    var fused = _cs21a14BuildPendingFusion_(ss, String(codigo), datos, pendienteBI);
    return _cs21a14ApplyDesired_(fused, datos, codigo);
  }

  var hDesired = _conapeAxHistoryDesired_(ss, String(codigo), datos);
  if (hDesired.conflicts.length) {
    throw new Error('El historial tiene más de un intento de la misma materia en el mismo año/periodo: ' + hDesired.conflicts.slice(0, 4).join(', ') + '. Debe resolverse el periodo antes de sincronizar.');
  }
  var desired = {
    '4-estudiantes': buildFilas_4([datos]),
    '5-plan_estudios': buildFilas_5([datos]),
    '6-historial': hDesired.rows,
    '7-morosidad': _conapeAxConsolidateMora_(buildFilas_7([datos]))
  };
  var ext = {}, writes = [];
  Object.keys(desired).forEach(function(name) { ext[name] = _conapeAxRows_(CONAPE_AX_SHEET_IDS[name]); });
  return _cs21a14ApplyDesired_({ ext:ext, desired:desired, meta:{ pending:false, fusion:false } }, datos, codigo);
}
