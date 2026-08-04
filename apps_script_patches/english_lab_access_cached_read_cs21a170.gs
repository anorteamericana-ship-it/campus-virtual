// F98.4-Z6-CS21A170 · English LAB con lectura financiera cacheada
// PARCHE APPEND-ONLY: cargar DESPUÉS de english_lab_access_cs21a144.gs.
// Conserva todas las reglas de CS21A144, pero evita getEstudianteFresh en cada
// apertura de English LAB. getEstudiante ya usa el motor financiero canónico y
// su caché se invalida después de pagos y cambios críticos mediante CS21A42.

var CS21A170_ENGLISH_LAB_ACCESS_VERSION = 'F98.4-Z6-CS21A170';

try {
  CS21A144_ENGLISH_LAB_ACCESS_VERSION = CS21A170_ENGLISH_LAB_ACCESS_VERSION;
} catch (_) {}

function _cs21a170BuildAccessFromFicha_(sesion, codigo, ficha) {
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

try {
  var _cs21a170AccessBase_ = _cs21a144AccessBySession_;
  _cs21a144AccessBySession_ = function(body) {
    body = body || {};
    var sesion = _cs21a144Session_(body);
    if (!sesion || sesion.ok !== true) return _cs21a170AccessBase_(body);

    var rol = _cs21a144Role_(sesion);
    if (rol !== 'student') return _cs21a170AccessBase_(body);

    var codigo = _cs21a144Code_(sesion);
    if (!codigo) return _cs21a170AccessBase_(body);

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
      // Lectura canónica con caché corto. CS21A42 la invalida después de pagos,
      // cambios de estatus, certificados y otras escrituras críticas.
      access = _cs21a170BuildAccessFromFicha_(sesion, codigo, getEstudiante(codigo) || {});
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
        CS21A144_ENGLISH_LAB_CACHE_SECONDS
      );
    } catch (_) {}
    return access;
  };
} catch (_) {}
