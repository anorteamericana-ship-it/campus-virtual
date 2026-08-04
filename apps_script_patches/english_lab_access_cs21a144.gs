// F98.4-Z6-CS21A144 · English LAB solo para estudiantes al día
// PARCHE APPEND-ONLY: instalar al final del Code.gs vigente únicamente en staging
// o en una entrega backend autorizada. No sustituye ni recorta el backend maestro.
//
// Regla funcional:
// 1) el estudiante necesita sesión válida, matrícula académica activa y cuenta al día;
// 2) una vez autorizado, puede entrar a CUALQUIER sala con el código correcto;
// 3) no se compara el grupo de la sala, para permitir Club I CAN y grupos mixtos;
// 4) nombre y código de jugador se toman de la sesión, nunca del formulario cliente.

var CS21A144_ENGLISH_LAB_ACCESS_VERSION = 'F98.4-Z6-CS21A144';
var CS21A144_ENGLISH_LAB_CACHE_SECONDS = 60;

function _cs21a144Text_(value) {
  return String(value == null ? '' : value).trim();
}
function _cs21a144Upper_(value) {
  return _cs21a144Text_(value).toUpperCase();
}
function _cs21a144Num_(value) {
  var n = Number(value || 0);
  return isFinite(n) ? n : 0;
}
function _cs21a144Own_(obj, key) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}
function _cs21a144Role_(sesion) {
  return _cs21a144Text_(sesion && sesion.rol).toLowerCase();
}
function _cs21a144Session_(body) {
  body = body || {};
  return body._auth_session || validarSesion(body.token || body.session_token || '');
}
function _cs21a144Code_(sesion) {
  return _cs21a144Text_(sesion && (sesion.codigo || sesion.CODIGO || sesion.CODIGO_ESTUDIANTE));
}
function _cs21a144Name_(sesion) {
  return _cs21a144Text_(sesion && (sesion.nombre || sesion.nombre_completo || sesion.NOMBRE || sesion.usuario)) || _cs21a144Code_(sesion) || 'Estudiante';
}
function _cs21a144EligibleAcademic_(status) {
  status = _cs21a144Upper_(status);
  return status === 'CA' || status === 'APR' || status === 'CNV';
}
function _cs21a144LevelFromFicha_(ficha, sesion, porNivel) {
  ficha = ficha || {};
  porNivel = porNivel || {};
  var direct = _cs21a144Upper_(
    (ficha.pendientes && ficha.pendientes.nivel_activo) ||
    ficha.nivel_activo || ficha.NIVEL_ACTIVO || ficha.nivel ||
    (sesion && (sesion.nivel_activo || sesion.NIVEL_ACTIVO || sesion.nivel)) || ''
  );
  if (porNivel[direct] && _cs21a144EligibleAcademic_(porNivel[direct].estatus)) return direct;

  var order = ['B1','B2','I1','I2'];
  var found = '';
  order.forEach(function(level) {
    var row = porNivel[level] || {};
    if (_cs21a144EligibleAcademic_(row.estatus)) found = level;
  });
  return found;
}
function _cs21a144DebtEvidence_(row) {
  row = row || {};
  var moraFlag = _cs21a144Upper_(row.mora_calculada);
  var estado = _cs21a144Upper_(row.estado_financiero);
  var hasMoraAmount = _cs21a144Own_(row, 'mora_exigible') || _cs21a144Own_(row, 'deuda_exigible');
  var moraAmount = _cs21a144Num_(_cs21a144Own_(row, 'mora_exigible') ? row.mora_exigible : row.deuda_exigible);

  if (moraFlag === 'SI' || row.moroso === true || estado === 'DEUDA' || (hasMoraAmount && moraAmount > 0.5)) {
    return { known:true, debt:true };
  }
  if (moraFlag === 'NO' || row.moroso === false || estado === 'AL_DIA' || (hasMoraAmount && moraAmount <= 0.5)) {
    return { known:true, debt:false };
  }
  return { known:false, debt:false };
}
function _cs21a144FinancialStatus_(porNivel) {
  porNivel = porNivel || {};
  var known = false;
  var debtLevels = [];
  ['B1','B2','I1','I2'].forEach(function(level) {
    var row = porNivel[level];
    if (!row) return;
    var status = _cs21a144Upper_(row.estatus);
    if (!status || status === 'PE') return;
    var evidence = _cs21a144DebtEvidence_(row);
    if (evidence.known) known = true;
    if (evidence.debt) debtLevels.push(level);
  });
  return { known:known, debt:debtLevels.length > 0, debt_levels:debtLevels };
}
function _cs21a144PublicAccess_(access) {
  access = access || {};
  return {
    ok:access.ok === true,
    version:CS21A144_ENGLISH_LAB_ACCESS_VERSION,
    allowed:access.allowed === true,
    autorizado:access.allowed === true,
    estado:_cs21a144Text_(access.estado),
    nivel:_cs21a144Text_(access.nivel),
    estatus_academico:_cs21a144Text_(access.estatus_academico),
    mensaje:_cs21a144Text_(access.mensaje),
    error:_cs21a144Text_(access.error)
  };
}
function _cs21a144AccessBySession_(body) {
  body = body || {};
  var sesion = _cs21a144Session_(body);
  if (!sesion || sesion.ok !== true) {
    return { ok:false, allowed:false, estado:'SESION_REQUERIDA', error:'sesion_requerida', mensaje:'Debés iniciar sesión para entrar a English LAB.' };
  }

  var rol = _cs21a144Role_(sesion);
  if (['teacher','admin','superadmin','ventas'].indexOf(rol) >= 0) {
    return { ok:true, allowed:true, estado:'ROL_AUTORIZADO', mensaje:'Acceso autorizado por rol.', _session:sesion };
  }
  if (rol !== 'student') {
    return { ok:false, allowed:false, estado:'NO_AUTORIZADO', error:'no_autorizado', mensaje:'Este perfil no puede acceder a English LAB.', _session:sesion };
  }

  var codigo = _cs21a144Code_(sesion);
  if (!codigo) {
    return { ok:true, allowed:false, estado:'MATRICULA_REQUERIDA', mensaje:'English LAB está disponible únicamente para estudiantes matriculados y al día.', _session:sesion };
  }

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
    var ficha = (typeof getEstudianteFresh === 'function'
      ? getEstudianteFresh({ codigo:codigo })
      : getEstudiante(codigo)) || {};
    if (ficha.ok === false) {
      access = { ok:true, allowed:false, estado:'EXPEDIENTE_NO_DISPONIBLE', mensaje:'No fue posible confirmar tu expediente académico.', _session:sesion };
    } else {
      var porNivel = ficha.pendientes && ficha.pendientes.por_nivel || {};
      var nivel = _cs21a144LevelFromFicha_(ficha, sesion, porNivel);
      var active = nivel && porNivel[nivel] || {};
      var academic = _cs21a144Upper_(active.estatus);
      var financial = _cs21a144FinancialStatus_(porNivel);

      if (!nivel || !_cs21a144EligibleAcademic_(academic)) {
        access = { ok:true, allowed:false, estado:'MATRICULA_NO_ACTIVA', nivel:nivel, estatus_academico:academic, mensaje:'English LAB requiere una matrícula académica activa.', _session:sesion };
      } else if (!financial.known) {
        access = { ok:true, allowed:false, estado:'ESTADO_FINANCIERO_NO_CONFIRMADO', nivel:nivel, estatus_academico:academic, mensaje:'No fue posible confirmar que tu cuenta esté al día.', _session:sesion };
      } else if (financial.debt) {
        access = { ok:true, allowed:false, estado:'CUENTA_PENDIENTE', nivel:nivel, estatus_academico:academic, mensaje:'English LAB está disponible cuando tu cuenta se encuentre al día.', _session:sesion };
      } else {
        access = { ok:true, allowed:true, estado:'AL_DIA', nivel:nivel, estatus_academico:academic, mensaje:'Acceso habilitado. Podés entrar a cualquier sala con el código correcto.', _session:sesion };
      }
    }
  } catch (error) {
    access = { ok:true, allowed:false, estado:'ERROR_VERIFICACION', mensaje:'No fue posible confirmar que tu cuenta esté al día.', error:String(error && error.message || error), _session:sesion };
  }

  try {
    var cacheCopy = {};
    Object.keys(access).forEach(function(key) { if (key !== '_session') cacheCopy[key] = access[key]; });
    CacheService.getScriptCache().put(cacheKey, JSON.stringify(cacheCopy), CS21A144_ENGLISH_LAB_CACHE_SECONDS);
  } catch (_) {}
  return access;
}

function englishLabAccessStatus(body) {
  return _cs21a144PublicAccess_(_cs21a144AccessBySession_(body));
}
function _cs21a144Denied_(access) {
  var out = _cs21a144PublicAccess_(access || {});
  out.ok = false;
  out.error = out.error || 'english_lab_access_denied';
  return out;
}

try {
  freeUserEnglishLabAccess = function(body) {
    return englishLabAccessStatus(body);
  };
} catch (_) {}

function _cs21a144RequireLab_(body) {
  var access = _cs21a144AccessBySession_(body || {});
  if (access.ok !== true || access.allowed !== true) return _cs21a144Denied_(access);
  return access;
}
function _cs21a144LiveBody_(body, access) {
  body = body || {};
  var out = {};
  Object.keys(body).forEach(function(key) { out[key] = body[key]; });
  var sesion = access && access._session || {};
  var codigo = _cs21a144Code_(sesion);
  var nombre = _cs21a144Name_(sesion);
  out._auth_session = sesion;
  out.player_id = codigo;
  out.playerId = codigo;
  out.cod_estudiante = codigo;
  out.codigo_estudiante = codigo;
  out.player_name = nombre;
  out.nombre = nombre;
  return out;
}

try {
  var _cs21a144AplayAuthBase_ = _aplayAuth_;
  _aplayAuth_ = function(body) {
    var sesion = _cs21a144AplayAuthBase_(body || {});
    if (!sesion || sesion.ok !== true) return sesion;
    if (_cs21a144Role_(sesion) !== 'student') return sesion;
    var nextBody = {};
    Object.keys(body || {}).forEach(function(key) { nextBody[key] = body[key]; });
    nextBody._auth_session = sesion;
    var access = _cs21a144AccessBySession_(nextBody);
    if (access.allowed !== true) return _cs21a144Denied_(access);
    return sesion;
  };
} catch (_) {}

try {
  var _cs21a144JoinRoomBase_ = englishLabLiveJoinRoom;
  englishLabLiveJoinRoom = function(body) {
    var access = _cs21a144RequireLab_(body);
    if (!access || access.allowed !== true) return access;
    return _cs21a144JoinRoomBase_(_cs21a144LiveBody_(body, access));
  };
} catch (_) {}
try {
  var _cs21a144GetPlayerStateBase_ = englishLabLiveGetPlayerState;
  englishLabLiveGetPlayerState = function(body) {
    var access = _cs21a144RequireLab_(body);
    if (!access || access.allowed !== true) return access;
    return _cs21a144GetPlayerStateBase_(_cs21a144LiveBody_(body, access));
  };
} catch (_) {}
try {
  var _cs21a144SubmitAnswerBase_ = englishLabLiveSubmitAnswer;
  englishLabLiveSubmitAnswer = function(body) {
    var access = _cs21a144RequireLab_(body);
    if (!access || access.allowed !== true) return access;
    return _cs21a144SubmitAnswerBase_(_cs21a144LiveBody_(body, access));
  };
} catch (_) {}
try {
  var _cs21a144GetLeaderboardBase_ = englishLabLiveGetLeaderboard;
  englishLabLiveGetLeaderboard = function(body) {
    var access = _cs21a144RequireLab_(body);
    if (!access || access.allowed !== true) return access;
    return _cs21a144GetLeaderboardBase_(_cs21a144LiveBody_(body, access));
  };
} catch (_) {}

var _cs21a144DoPostBase_ = doPost;
doPost = function(e) {
  try {
    var body = {};
    try { body = _an4406_parseBody_(e) || {}; } catch (_) { body = {}; }
    var fn = '';
    try { fn = String((e && e.parameter && e.parameter.fn) || body.fn || '').trim().toLowerCase(); } catch (_) { fn = ''; }
    if (fn === 'englishlabaccessstatus') return _an4406_json_(englishLabAccessStatus(body));
    return _cs21a144DoPostBase_(e);
  } catch (error) {
    return _an4406_json_({
      ok:false,
      version:CS21A144_ENGLISH_LAB_ACCESS_VERSION,
      error:'doPost_cs21a144_error',
      mensaje:String(error && error.message || error)
    });
  }
};
