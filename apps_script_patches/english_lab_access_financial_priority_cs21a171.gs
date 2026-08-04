// F98.4-Z6-CS21A171 · English LAB con lectura cacheada y mora exigible prioritaria
// PARCHE APPEND-ONLY: cargar DESPUÉS de english_lab_access_cs21a144.gs.
// Conserva todas las reglas de CS21A144, evita getEstudianteFresh en cada apertura
// y prioriza mora_exigible/deuda_exigible sobre banderas amplias como moroso.
// Una obligación futura no exigible (por ejemplo, certificado) no bloquea English LAB.

var CS21A171_ENGLISH_LAB_ACCESS_VERSION = 'F98.4-Z6-CS21A171';

try {
  CS21A144_ENGLISH_LAB_ACCESS_VERSION = CS21A171_ENGLISH_LAB_ACCESS_VERSION;
} catch (_) {}

try {
  _cs21a144DebtEvidence_ = function(row) {
    row = row || {};
    var hasMoraExigible = _cs21a144Own_(row, 'mora_exigible');
    var hasDeudaExigible = _cs21a144Own_(row, 'deuda_exigible');
    if (hasMoraExigible || hasDeudaExigible) {
      var amount = _cs21a144Num_(hasMoraExigible ? row.mora_exigible : row.deuda_exigible);
      return { known:true, debt:amount > 0.5, amount:amount, source:hasMoraExigible ? 'mora_exigible' : 'deuda_exigible' };
    }
    var moraFlag = _cs21a144Upper_(row.mora_calculada);
    var estado = _cs21a144Upper_(row.estado_financiero);
    if (moraFlag === 'SI' || row.moroso === true || estado === 'DEUDA') return { known:true, debt:true, source:'legacy_flag' };
    if (moraFlag === 'NO' || row.moroso === false || estado === 'AL_DIA') return { known:true, debt:false, source:'legacy_flag' };
    return { known:false, debt:false, source:'unknown' };
  };
} catch (_) {}

function _cs21a171BuildAccessFromFicha_(sesion, codigo, ficha) {
  ficha = ficha || {};
  if (ficha.ok === false) return { ok:true, allowed:false, estado:'EXPEDIENTE_NO_DISPONIBLE', mensaje:'No fue posible confirmar tu expediente académico.', _session:sesion };
  var porNivel = ficha.pendientes && ficha.pendientes.por_nivel || {};
  var nivel = _cs21a144LevelFromFicha_(ficha, sesion, porNivel);
  var active = nivel && porNivel[nivel] || {};
  var academic = _cs21a144Upper_(active.estatus);
  var financial = _cs21a144FinancialStatus_(porNivel);
  if (!nivel || !_cs21a144EligibleAcademic_(academic)) return { ok:true, allowed:false, estado:'MATRICULA_NO_ACTIVA', nivel:nivel, estatus_academico:academic, mensaje:'English LAB requiere una matrícula académica activa.', _session:sesion };
  if (!financial.known) return { ok:true, allowed:false, estado:'ESTADO_FINANCIERO_NO_CONFIRMADO', nivel:nivel, estatus_academico:academic, mensaje:'No fue posible confirmar que tu cuenta esté al día.', _session:sesion };
  if (financial.debt) return { ok:true, allowed:false, estado:'CUENTA_PENDIENTE', nivel:nivel, estatus_academico:academic, mensaje:'English LAB está disponible cuando tu cuenta se encuentre al día.', _session:sesion };
  return { ok:true, allowed:true, estado:'AL_DIA', nivel:nivel, estatus_academico:academic, mensaje:'Acceso habilitado. Podés entrar a cualquier sala con el código correcto.', _session:sesion };
}

try {
  var _cs21a171AccessBase_ = _cs21a144AccessBySession_;
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
      access = _cs21a171BuildAccessFromFicha_(sesion, codigo, getEstudiante(codigo) || {});
    } catch (error) {
      access = { ok:true, allowed:false, estado:'ERROR_VERIFICACION', mensaje:'No fue posible confirmar que tu cuenta esté al día.', error:String(error && error.message || error), _session:sesion };
    }
    try {
      var cacheCopy = {};
      Object.keys(access).forEach(function(key) { if (key !== '_session') cacheCopy[key] = access[key]; });
      CacheService.getScriptCache().put(cacheKey, JSON.stringify(cacheCopy), CS21A144_ENGLISH_LAB_CACHE_SECONDS);
    } catch (_) {}
    return access;
  };
} catch (_) {}
