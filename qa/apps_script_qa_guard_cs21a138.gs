// CS21A138 · Añadir AL FINAL del Code.gs exclusivo de staging.
// No usar en producción. Las últimas definiciones envuelven escrituras críticas.
var QA_STAGING_MARKER_CS21A138 = 'QA_STAGING_CS21A138';

function _qaStagingStatusCS21A138_() {
  var props = PropertiesService.getScriptProperties();
  var masterExpected = String(props.getProperty('QA_STAGING_MASTER_ID') || '').trim();
  var operationalExpected = String(props.getProperty('QA_STAGING_OPERATIVO_ID') || '').trim();
  return {
    marker: QA_STAGING_MARKER_CS21A138,
    qa_staging: true,
    master_match: !!masterExpected && masterExpected === String(SHEET_ID),
    operational_match: !!operationalExpected && operationalExpected === String(OPERATIVO_ID),
    writes_guarded: true
  };
}

function _qaRequireWriteCS21A138_(body, options) {
  body = body || {};
  options = options || {};
  var status = _qaStagingStatusCS21A138_();
  if (!status.master_match || !status.operational_match) {
    return { ok:false, error:'QA staging no coincide con las hojas autorizadas.', qa_blocked:true };
  }
  if (String(body.qa_confirmation || '') !== QA_STAGING_MARKER_CS21A138) {
    return { ok:false, error:'Falta confirmación explícita de QA staging.', qa_blocked:true };
  }
  var code = String(body.cod_estudiante || body.codigo || body.code || '').trim().toUpperCase();
  var group = String(body.cod_grupo || body.grupo || '').trim().toUpperCase();
  if (options.student !== false && code.indexOf('QA-') !== 0) {
    return { ok:false, error:'Solo se permiten estudiantes con prefijo QA-.', qa_blocked:true };
  }
  if (options.group && !/-99\d\d$/.test(group)) {
    return { ok:false, error:'Solo se permiten grupos QA terminados en -99XX.', qa_blocked:true };
  }
  return { ok:true, status:status };
}

// El marcador viaja en una lectura pública ya existente, evitando modificar routers.
try {
  var _qaGetInfoGeneralBaseCS21A138_ = getInfoGeneral;
  getInfoGeneral = function() {
    var result = _qaGetInfoGeneralBaseCS21A138_();
    result = result && typeof result === 'object' ? result : { ok:false, error:'Respuesta inválida.' };
    result.qa = _qaStagingStatusCS21A138_();
    return result;
  };
} catch (_) {}

try {
  var _qaAplicarPagoBaseCS21A138_ = aplicarPago;
  aplicarPago = function(body) {
    var guard = _qaRequireWriteCS21A138_(body, { student:true });
    if (!guard.ok) return guard;
    if (String(body.doc || body.documento || '').trim().toUpperCase().indexOf('QA') !== 0) {
      return { ok:false, error:'El documento bancario debe iniciar con QA.', qa_blocked:true };
    }
    return _qaAplicarPagoBaseCS21A138_(body);
  };
} catch (_) {}

try {
  var _qaRegistrarNotaBaseCS21A138_ = registrarNotaEstatus;
  registrarNotaEstatus = function(body) {
    var guard = _qaRequireWriteCS21A138_(body, { student:true, group:true });
    return guard.ok ? _qaRegistrarNotaBaseCS21A138_(body) : guard;
  };
} catch (_) {}

try {
  var _qaRegistrarEvaluacionBaseCS21A138_ = registrarEvaluacion;
  registrarEvaluacion = function(body) {
    var guard = _qaRequireWriteCS21A138_(body, { student:true, group:true });
    return guard.ok ? _qaRegistrarEvaluacionBaseCS21A138_(body) : guard;
  };
} catch (_) {}

try {
  var _qaRegistrarAsistenciaBaseCS21A138_ = registrarAsistencia;
  registrarAsistencia = function(body) {
    var guard = _qaRequireWriteCS21A138_(body, { student:false, group:true });
    return guard.ok ? _qaRegistrarAsistenciaBaseCS21A138_(body) : guard;
  };
} catch (_) {}

try {
  var _qaCerrarLeccionBaseCS21A138_ = cerrarLeccionCompleta;
  cerrarLeccionCompleta = function(body) {
    var guard = _qaRequireWriteCS21A138_(body, { student:false, group:true });
    if (!guard.ok) return guard;
    var asistencia = body && body.asistencias || {};
    var codes = Object.keys(asistencia);
    if (codes.some(function(code){ return String(code).toUpperCase().indexOf('QA-') !== 0; })) {
      return { ok:false, error:'La asistencia contiene un estudiante que no es QA.', qa_blocked:true };
    }
    return _qaCerrarLeccionBaseCS21A138_(body);
  };
} catch (_) {}
