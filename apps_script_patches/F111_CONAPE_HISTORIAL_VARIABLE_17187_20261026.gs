/**
 * F111 · CONAPE 6-historial de cardinalidad variable · 26-oct-2026.
 *
 * Este parche es ADITIVO, no se instala por existir en GitHub.
 * Integrar sólo en la fuente Apps Script desplegada, tras revisión del HEAD real.
 * NO exponer estas funciones en doGet/doPost.
 *
 * 4-estudiantes: identidad única.
 * 5-plan_estudios: exactamente B1/B2/I1/I2 (4 materias únicas, intento más reciente).
 * 6-historial: N filas de intentos reales, SIN tope fijo de cuatro.
 * 7-morosidad: N períodos sin duplicar la pareja año/período.
 *
 * Reintento de 17187: NO llama aplicarPago, NO modifica recibos, NO inventa
 * aprobación CONAPE. Si no hay aprobación documentada, falla cerrado.
 */

var F111_CONAPE_CODIGOS_20261026 = ['17156', '17161', '17163', '17171', '17168', '17187'];
var F111_CONAPE_17187_OPERACION = 'PAGO-20261026-184626-8F10E89C';
var F111_CONAPE_17187_DOCUMENTO = '14404727';
var F111_CONAPE_17187_MONTO = 334200;

function _f111HxText_(value) {
  return String(value === undefined || value === null ? '' : value).trim();
}
function _f111HxCed_(value) {
  return _f111HxText_(value).replace(/\D/g, '');
}
function _f111HxLevel_(materia) {
  var s = _f111HxText_(materia).toUpperCase();
  var m = s.match(/-(B1|B2|I1|I2)-/);
  return m ? m[1] : '';
}
function _f111HxDuplicateKeys_(rows, makeKey) {
  var seen = {}, duplicates = [];
  (rows || []).forEach(function(row) {
    var key = makeKey(row);
    if (!key) return;
    if (seen[key]) duplicates.push(key);
    seen[key] = true;
  });
  return duplicates;
}
function _f111HxEvaluate_(cedula, planRows, historyRows, moraRows) {
  var ced = _f111HxCed_(cedula);
  var plan = (planRows || []).filter(function(r) { return _f111HxCed_(r[0]) === ced; });
  var hist = (historyRows || []).filter(function(r) { return _f111HxCed_(r[2]) === ced; });
  var mora = (moraRows || []).filter(function(r) { return _f111HxCed_(r[1]) === ced; });
  var levels = plan.map(function(r) { return _f111HxLevel_(r[6]); });
  var want = ['B1', 'B2', 'I1', 'I2'];
  var planOk = plan.length === 4 && want.every(function(n) {
    return levels.filter(function(v) { return v === n; }).length === 1;
  });
  // 6-historial no tiene INTENTO_ID. Clave académica identificable en el
  // exportado: materia + año + período + tipo. Permite 3, 4, 5, N intentos.
  var duplicadosHist = _f111HxDuplicateKeys_(hist, function(r) {
    return [_f111HxCed_(r[2]), _f111HxText_(r[4]).toUpperCase(),
      _f111HxText_(r[5]), _f111HxText_(r[6]),
      _f111HxText_(r[7]).toUpperCase()].join('|');
  });
  // Morosidad puede tener más de 4 períodos; no puede duplicar el mismo.
  var duplicadosMora = _f111HxDuplicateKeys_(mora, function(r) {
    return [_f111HxCed_(r[1]), _f111HxText_(r[2]), _f111HxText_(r[3])].join('|');
  });
  return {
    ok:planOk && !duplicadosHist.length && !duplicadosMora.length,
    plan_cuatro_niveles:planOk,
    plan_filas:plan.length,
    historial_filas:hist.length,
    morosidad_periodos:mora.length,
    historial_duplicados:duplicadosHist,
    morosidad_duplicados:duplicadosMora
  };
}
function _f111HxReads_(codigo) {
  var code = _f111HxText_(codigo);
  if (F111_CONAPE_CODIGOS_20261026.indexOf(code) < 0) {
    throw new Error('F111: código fuera del padrón de los seis traslados.');
  }
  if (typeof CONAPE_AX_SHEET_IDS === 'undefined' ||
      typeof _conapeAxRows_ !== 'function' ||
      typeof _conapeAxHistoryDesired_ !== 'function' ||
      typeof leerDatosEstudiante_CONAPE !== 'function') {
    throw new Error('F111: backend modular vigente incompatible; no ejecutar cambios.');
  }
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var alumno = leerDatosEstudiante_CONAPE(ss, code);
  if (!alumno || !_f111HxCed_(alumno.cedula)) {
    throw new Error('F111: no se encontró expediente académico con cédula.');
  }
  var p = _conapeAxRows_(CONAPE_AX_SHEET_IDS['5-plan_estudios']);
  var h = _conapeAxRows_(CONAPE_AX_SHEET_IDS['6-historial']);
  var m = _conapeAxRows_(CONAPE_AX_SHEET_IDS['7-morosidad']);
  var evaluacion = _f111HxEvaluate_(alumno.cedula, p.rows.slice(1),
    h.rows.slice(1), m.rows.slice(1));
  var derivado = _conapeAxHistoryDesired_(ss, code, alumno);
  var ced = _f111HxCed_(alumno.cedula);
  var existingHistory = h.rows.slice(1).filter(function(row) {
    return _f111HxCed_(row[2]) === ced;
  });
  function k(r) {
    return [_f111HxCed_(r[2]), _f111HxText_(r[4]).toUpperCase(),
      _f111HxText_(r[5]), _f111HxText_(r[6]),
      _f111HxText_(r[7]).toUpperCase()].join('|');
  }
  var have = {};
  existingHistory.forEach(function(r) { have[k(r)] = true; });
  var ausentes = (derivado.rows || []).filter(function(r) { return !have[k(r)]; })
    .map(function(r) { return {materia:r[4], anio:r[5], periodo:r[6], tipo:r[7]}; });
  return {
    codigo:code,
    cedula:ced,
    cardinalidad:evaluacion,
    esperado_historial:(derivado.rows || []).length,
    filas_historial_observadas:existingHistory.length,
    faltantes:ausentes,
    conflictos_origen:(derivado.conflicts || []).slice(0, 10),
    // Un histórico adicional válido no es un error de cardinalidad.
    preparado:evaluacion.ok && !(derivado.conflicts || []).length
  };
}
function F111_CONAPE_PREVISUALIZAR_SEIS() {
  return F111_CONAPE_CODIGOS_20261026.map(function(code) {
    try { return _f111HxReads_(code); }
    catch (e) { return {codigo:code, ok:false, error:String(e.message || e)}; }
  });
}
function _f111HxFindReview_(codigo) {
  var sh = SpreadsheetApp.openById(OPERATIVO_ID).getSheetByName('CONAPE_PLAN_CAMBIOS');
  if (!sh) return null;
  var rows = _akReadObjects_(sh);
  for (var i = rows.length - 1; i >= 0; i--) {
    var r = rows[i];
    if (_f111HxText_(r.CODIGO) !== codigo) continue;
    if (_f111HxText_(r.CAMBIO_ID) === 'F111-ADM-20261026-' + codigo) return r;
  }
  return null;
}
function _f111HxFindOperation_() {
  var sh = SpreadsheetApp.openById(OPERATIVO_ID).getSheetByName('PAGOS_OPERACIONES');
  if (!sh) throw new Error('F111: falta PAGOS_OPERACIONES');
  var rows = _akReadObjects_(sh);
  var hits = rows.filter(function(r) {
    return _f111HxText_(r.OPERACION_ID) === F111_CONAPE_17187_OPERACION;
  });
  if (hits.length !== 1) throw new Error('F111: operación ausente o duplicada; no reintentar.');
  var x = hits[0];
  if (_f111HxText_(x.CODIGO_ESTUDIANTE) !== '17187' ||
      _f111HxText_(x.DOC_BANCARIO) !== F111_CONAPE_17187_DOCUMENTO ||
      Number(x.MONTO_TOTAL) !== F111_CONAPE_17187_MONTO ||
      ['CONFIRMADO_LOCAL','CONFIRMADO'].indexOf(_f111HxText_(x.ESTADO)) < 0) {
    throw new Error('F111: operación bancaria no coincide; no reintentar.');
  }
  var recibos = JSON.parse(_f111HxText_(x.RECIBOS_JSON) || '[]');
  if (recibos.length !== 3 ||
      ['258331','258332','258333'].some(function(r) {
        return recibos.map(String).indexOf(r) < 0;
      })) throw new Error('F111: recibos existentes no coinciden; no reintentar.');
  return {sh:sh,row:x};
}
function _f111HxBanco_() {
  var sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName('BDBANCARIO');
  if (!sh) throw new Error('F111: no está BDBANCARIO.');
  var v = sh.getDataRange().getValues();
  var matches = v.slice(1).filter(function(r) {
    return _f111HxText_(r[0]) === '17187' &&
      _f111HxText_(r[4]).replace(/\.0$/, '') === F111_CONAPE_17187_DOCUMENTO;
  });
  if (matches.length !== 1 ||
      Number(matches[0][8]) !== F111_CONAPE_17187_MONTO ||
      Number(matches[0][9]) !== F111_CONAPE_17187_MONTO) {
    throw new Error('F111: comprobante no coincide con crédito y aplicado 334200; no reintentar.');
  }
}
function F111_CONAPE_17187_REINTENTO_SOLO_SYNC() {
  // SOLO para ejecución consciente por editor en Apps Script. No exponer como
  // endpoint público. Se usa el lock de la sincronización una sola vez.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return {ok:false, error:'CONAPE ocupado; no hubo reintento.'};
  try {
    var op = _f111HxFindOperation_();
    _f111HxBanco_();
    var previo = _f111HxReads_('17187');
    if (!previo.preparado) return {ok:false, bloqueado:'PREVALIDACION',
      detalle:previo, pago_conservado:true};
    if (_f111HxText_(op.row.ESTADO) === 'CONFIRMADO' &&
        _f111HxText_(op.row.CONAPE_SYNC) === 'OK') {
      return {ok:true, ya_sincronizado:true, pago_conservado:true};
    }
    var expediente = _f111HxFindReview_('17187');
    if (!expediente ||
        !_f111HxText_(expediente.APROBADO_CONAPE_EN) ||
        !_f111HxText_(expediente.REFERENCIA_APROBACION) ||
        ['APROBADO_CONAPE','APLICADO_CONAPE'].indexOf(
          _f111HxText_(expediente.ESTADO).toUpperCase()) < 0) {
      return {ok:false, bloqueado:'APROBACION_CONAPE_NO_REGISTRADA',
        mensaje:'No se publicó ningún cambio. Mantener el pago CONFIRMADO_LOCAL.',
        pago_conservado:true, prevalidacion:previo};
    }
    if (typeof _conapeAxSyncStudentCore_ !== 'function') {
      throw new Error('F111: falta el núcleo de sincronización de backend vigente.');
    }
    // Importante: invocar SOLO el núcleo CONAPE bajo el lock ya tomado.
    // NUNCA invocar aplicarPago ni sincronizarCONAPE_estudiante (doble lock).
    var sync = _conapeAxSyncStudentCore_('17187');
    if (!sync || sync.ok !== true) return {ok:false, bloqueado:'SYNC_NO_CONFIRMADO',
      error:String(sync && sync.error || 'Error de sincronización'),
      pago_conservado:true};
    var posterior = _f111HxReads_('17187');
    if (!posterior.preparado || posterior.faltantes.length) {
      return {ok:false, bloqueado:'READBACK_CONFLICTO', detalle:posterior,
        pago_conservado:true};
    }
    var journalRow = op.row.__row;
    var h = op.sh.getRange(1,1,1,op.sh.getLastColumn()).getValues()[0];
    var ixEstado = h.indexOf('ESTADO')+1, ixSync = h.indexOf('CONAPE_SYNC')+1,
        ixError = h.indexOf('ERROR')+1, ixFecha = h.indexOf('ACTUALIZADO_EN')+1;
    if (!ixEstado || !ixSync || !ixError || !ixFecha) {
      throw new Error('F111: estructura de PAGOS_OPERACIONES cambió; no marcar OK.');
    }
    op.sh.getRange(journalRow,ixEstado).setValue('CONFIRMADO');
    op.sh.getRange(journalRow,ixSync).setValue('OK');
    op.sh.getRange(journalRow,ixError).clearContent();
    op.sh.getRange(journalRow,ixFecha).setValue(new Date());
    SpreadsheetApp.flush();
    return {ok:true, sincronizado:true, operacion:F111_CONAPE_17187_OPERACION,
      sin_nuevo_pago:true, historial_filas:posterior.filas_historial_observadas};
  } catch (e) {
    return {ok:false, error:String(e.message || e), sin_nuevo_pago:true};
  } finally {
    lock.releaseLock();
  }
}
