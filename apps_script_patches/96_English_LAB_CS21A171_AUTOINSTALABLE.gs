// 96_English_LAB_CS21A171_AUTOINSTALABLE.gs
// F98.4-Z6-CS21A171 · English LAB: lectura cacheada + mora exigible prioritaria
// APPEND-ONLY: crear como archivo NUEVO. No borrar ni modificar módulos existentes.
// Diseñado exclusivamente para el proyecto Apps Script QA.

var CS21A171_VERSION = 'F98.4-Z6-CS21A171';
var CS21A171_PATCH_READY = false;
var _cs21a171AccessBase_ = null;

function _cs21a171Text_(value) {
  return String(value == null ? '' : value).trim();
}

function _cs21a171QaEnvironment_() {
  var props = PropertiesService.getScriptProperties();
  var masterId = _cs21a171Text_(props.getProperty('QA_STAGING_MASTER_ID'));
  var operationalId = _cs21a171Text_(props.getProperty('QA_STAGING_OPERATIVO_ID'));
  var result = {
    ok:false,
    master_id_present:!!masterId,
    operational_id_present:!!operationalId,
    master_title:'',
    operational_title:''
  };

  if (!masterId || !operationalId) {
    result.error = 'Faltan QA_STAGING_MASTER_ID o QA_STAGING_OPERATIVO_ID.';
    return result;
  }

  try {
    result.master_title = SpreadsheetApp.openById(masterId).getName();
    result.operational_title = SpreadsheetApp.openById(operationalId).getName();
  } catch (error) {
    result.error = 'No fue posible abrir las hojas QA: ' + String(error && error.message || error);
    return result;
  }

  var masterQa = /QA|STAGING/i.test(result.master_title);
  var operationalQa = /QA|STAGING/i.test(result.operational_title);
  if (!masterQa || !operationalQa) {
    result.error = 'BLOQUEADO: las hojas configuradas no demuestran ser QA/STAGING.';
    return result;
  }

  result.ok = true;
  return result;
}

function _cs21a171RequiredBase_() {
  var required = {
    _cs21a144Session_: typeof _cs21a144Session_ === 'function',
    _cs21a144Role_: typeof _cs21a144Role_ === 'function',
    _cs21a144Code_: typeof _cs21a144Code_ === 'function',
    _cs21a144Upper_: typeof _cs21a144Upper_ === 'function',
    _cs21a144Own_: typeof _cs21a144Own_ === 'function',
    _cs21a144Num_: typeof _cs21a144Num_ === 'function',
    _cs21a144LevelFromFicha_: typeof _cs21a144LevelFromFicha_ === 'function',
    _cs21a144EligibleAcademic_: typeof _cs21a144EligibleAcademic_ === 'function',
    _cs21a144FinancialStatus_: typeof _cs21a144FinancialStatus_ === 'function',
    _cs21a144AccessBySession_: typeof _cs21a144AccessBySession_ === 'function',
    getEstudiante: typeof getEstudiante === 'function'
  };
  var missing = Object.keys(required).filter(function(key) { return !required[key]; });
  return { ok:missing.length === 0, required:required, missing:missing };
}

function _cs21a171DebtEvidence_(row) {
  row = row || {};
  var hasMoraExigible = _cs21a144Own_(row, 'mora_exigible');
  var hasDeudaExigible = _cs21a144Own_(row, 'deuda_exigible');

  // Fuente canónica: el monto actualmente exigible.
  // Obligaciones futuras no exigibles, como certificado, no bloquean English LAB.
  if (hasMoraExigible || hasDeudaExigible) {
    var amount = _cs21a144Num_(hasMoraExigible ? row.mora_exigible : row.deuda_exigible);
    return {
      known:true,
      debt:amount > 0.5,
      amount:amount,
      source:hasMoraExigible ? 'mora_exigible' : 'deuda_exigible'
    };
  }

  // Compatibilidad para expedientes históricos que aún no publican monto exigible.
  var moraFlag = _cs21a144Upper_(row.mora_calculada);
  var estado = _cs21a144Upper_(row.estado_financiero);
  if (moraFlag === 'SI' || row.moroso === true || estado === 'DEUDA') {
    return { known:true, debt:true, amount:null, source:'legacy_flag' };
  }
  if (moraFlag === 'NO' || row.moroso === false || estado === 'AL_DIA') {
    return { known:true, debt:false, amount:null, source:'legacy_flag' };
  }
  return { known:false, debt:false, amount:null, source:'unknown' };
}

function _cs21a171BuildAccessFromFicha_(sesion, codigo, ficha) {
  ficha = ficha || {};
  if (ficha.ok === false) {
    return {
      ok:true,
      allowed:false,
      estado:'EXPEDIENTE_NO_DISPONIBLE',
      mensaje:'No fue posible confirmar tu expediente académico.',
      _session:sesion
    };
  }

  var porNivel = ficha.pendientes && ficha.pendientes.por_nivel || {};
  var nivel = _cs21a144LevelFromFicha_(ficha, sesion, porNivel);
  var active = nivel && porNivel[nivel] || {};
  var academic = _cs21a144Upper_(active.estatus);
  var financial = _cs21a144FinancialStatus_(porNivel);

  if (!nivel || !_cs21a144EligibleAcademic_(academic)) {
    return {
      ok:true,
      allowed:false,
      estado:'MATRICULA_NO_ACTIVA',
      nivel:nivel,
      estatus_academico:academic,
      mensaje:'English LAB requiere una matrícula académica activa.',
      _session:sesion
    };
  }
  if (!financial.known) {
    return {
      ok:true,
      allowed:false,
      estado:'ESTADO_FINANCIERO_NO_CONFIRMADO',
      nivel:nivel,
      estatus_academico:academic,
      mensaje:'No fue posible confirmar que tu cuenta esté al día.',
      _session:sesion
    };
  }
  if (financial.debt) {
    return {
      ok:true,
      allowed:false,
      estado:'CUENTA_PENDIENTE',
      nivel:nivel,
      estatus_academico:academic,
      mensaje:'English LAB está disponible cuando tu cuenta se encuentre al día.',
      _session:sesion
    };
  }
  return {
    ok:true,
    allowed:true,
    estado:'AL_DIA',
    nivel:nivel,
    estatus_academico:academic,
    mensaje:'Acceso habilitado. Podés entrar a cualquier sala con el código correcto.',
    _session:sesion
  };
}

function _cs21a171ApplyPatch_() {
  if (CS21A171_PATCH_READY === true) return true;

  var base = _cs21a171RequiredBase_();
  if (!base.ok) return false;

  try {
    CS21A144_ENGLISH_LAB_ACCESS_VERSION = CS21A171_VERSION;
  } catch (_) {}

  // Reemplaza únicamente el evaluador financiero usado por CS21A144.
  _cs21a144DebtEvidence_ = _cs21a171DebtEvidence_;

  if (!_cs21a171AccessBase_) _cs21a171AccessBase_ = _cs21a144AccessBySession_;

  _cs21a144AccessBySession_ = function(body) {
    body = body || {};
    var sesion = _cs21a144Session_(body);
    if (!sesion || sesion.ok !== true) return _cs21a171AccessBase_(body);

    var rol = _cs21a144Role_(sesion);
    if (rol !== 'student') return _cs21a171AccessBase_(body);

    var codigo = _cs21a144Code_(sesion);
    if (!codigo) return _cs21a171AccessBase_(body);

    var force = body.force === true || _cs21a144Upper_(body.force) === 'TRUE';
    var cacheKey = 'CS21A144_ELAB_ACCESS_' + codigo;
    if (!force) {
      try {
        var cached = CacheService.getScriptCache().get(cacheKey);
        if (cached) {
          var parsed = JSON.parse(cached);
          parsed._session = sesion;
          return parsed;
        }
      } catch (_) {}
    }

    var access;
    try {
      // Usa la ficha canónica con caché; evita reconstruir todo el expediente
      // financiero con getEstudianteFresh en cada apertura de English LAB.
      access = _cs21a171BuildAccessFromFicha_(sesion, codigo, getEstudiante(codigo) || {});
    } catch (error) {
      access = {
        ok:true,
        allowed:false,
        estado:'ERROR_VERIFICACION',
        mensaje:'No fue posible confirmar que tu cuenta esté al día.',
        error:String(error && error.message || error),
        _session:sesion
      };
    }

    try {
      var cacheCopy = {};
      Object.keys(access).forEach(function(key) {
        if (key !== '_session') cacheCopy[key] = access[key];
      });
      CacheService.getScriptCache().put(
        cacheKey,
        JSON.stringify(cacheCopy),
        Number(CS21A144_ENGLISH_LAB_CACHE_SECONDS || 60)
      );
    } catch (_) {}
    return access;
  };

  CS21A171_PATCH_READY = true;
  return true;
}

function _cs21a171ClearQaCaches_() {
  var cache = CacheService.getScriptCache();
  ['QA-STU-001','QA-STU-002','QA-STU-003','QA-STU-004'].forEach(function(code) {
    try { cache.remove('CS21A144_ELAB_ACCESS_' + code); } catch (_) {}
  });
}

function instalarCS21A171() {
  var qa = _cs21a171QaEnvironment_();
  if (!qa.ok) throw new Error(qa.error || 'Ambiente QA no confirmado.');

  var base = _cs21a171RequiredBase_();
  if (!base.ok) {
    throw new Error('Faltan funciones base CS21A144: ' + base.missing.join(', '));
  }

  var applied = _cs21a171ApplyPatch_();
  if (!applied) throw new Error('No fue posible aplicar CS21A171.');

  _cs21a171ClearQaCaches_();
  PropertiesService.getScriptProperties().setProperties({
    CS21A171_INSTALLED:'YES',
    CS21A171_VERSION:CS21A171_VERSION,
    CS21A171_INSTALLED_AT:new Date().toISOString()
  }, false);

  return {
    ok:true,
    version:CS21A171_VERSION,
    patch_ready:CS21A171_PATCH_READY,
    master_title:qa.master_title,
    operational_title:qa.operational_title,
    caches_cleared:['QA-STU-001','QA-STU-002','QA-STU-003','QA-STU-004'],
    next:'Ejecutar verificarCS21A171 y luego crear una nueva versión del deployment QA.'
  };
}

function verificarCS21A171() {
  var qa = _cs21a171QaEnvironment_();
  if (!qa.ok) throw new Error(qa.error || 'Ambiente QA no confirmado.');

  if (!_cs21a171ApplyPatch_()) {
    var base = _cs21a171RequiredBase_();
    throw new Error('CS21A171 no pudo cargarse. Faltantes: ' + base.missing.join(', '));
  }

  _cs21a171ClearQaCaches_();

  var codigo = 'QA-STU-001';
  var ficha = getEstudiante(codigo) || {};
  var porNivel = ficha.pendientes && ficha.pendientes.por_nivel || {};
  var nivel = _cs21a144LevelFromFicha_(ficha, { codigo:codigo, rol:'student' }, porNivel);
  var active = nivel && porNivel[nivel] || {};
  var evidence = _cs21a171DebtEvidence_(active);
  var financial = _cs21a144FinancialStatus_(porNivel);

  var result = {
    ok:true,
    version:CS21A171_VERSION,
    codigo:codigo,
    nivel:nivel,
    estatus:_cs21a144Upper_(active.estatus),
    mora_exigible:active.mora_exigible,
    deuda_exigible:active.deuda_exigible,
    moroso:active.moroso,
    mora_calculada:active.mora_calculada,
    evidence:evidence,
    financial:financial,
    expected:'AL_DIA'
  };

  result.pass = result.estatus === 'CA' && financial.known === true && financial.debt === false;
  if (!result.pass) {
    result.error = 'QA-STU-001 todavía no calcula AL_DIA. Revisar el resultado antes de desplegar.';
  }
  return result;
}

// Se aplica automáticamente en cada ejecución del backend.
// El instalador vuelve a validarlo y limpia cachés de forma idempotente.
try { _cs21a171ApplyPatch_(); } catch (_) {}
