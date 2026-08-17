// ============================================================================
// SEC-004 · DEMO READ-ONLY GLOBAL FAIL-CLOSED GUARD · 2026-08-16
// ----------------------------------------------------------------------------
// Este archivo debe quedar deliberadamente al final del proyecto Apps Script QA
// para envolver todas las capas doPost anteriores, incluidas las capas 99_CS21A201+.
// No modifica motores: únicamente decide si una sesión demo puede delegar una
// ruta al dispatcher real.
// ============================================================================
var SEC004_DEMO_READONLY_VERSION = 'SEC004-DEMO-READONLY-1';
var SEC004_DEMO_SAFE_READS = {
  'validarsesion': true,
  'getinfogeneral': true,
  'getdocentegruposactuales': true,
  'getgruposdocenteactuales': true,
  'getdocentegrupopanelf80': true,
  'getdocentegrupopanelf79': true,
  'getasistenciadetallegrupof77': true,
  'getdocentesesionclasef77': true,
  'getdocentesesionactivaf87': true,
  'getcalendariodocente': true,
  'gettareaspendientesdocente': true,
  'getestudiantesparacierre': true,
  'getleccioncerradadetalle': true,
  'getgrupoinfo': true,
  'getgrupoestudiantes': true,
  'getasistenciagrupocompleta': true,
  'getevaluacionesestudiante': true,
  'getretroalimentacionestudiante': true,
  'getportalestudiantecompleto': true,
  'getestudiante': true,
  'getasistenciaestudiante': true,
  'geticanestudiante': true,
  'getfechasgrupo': true,
};

function _sec004Norm_(value) {
  return String(value == null ? '' : value).trim().toLowerCase();
}

function _sec004DemoKind_(session) {
  if (!session || session.ok !== true) return '';
  try {
    if (typeof _demoKeylorSesion_ === 'function' && _demoKeylorSesion_(session)) return 'teacher';
  } catch (_) {}
  try {
    if (typeof _demoKeylorStudentByCodeCS21A72_ === 'function' && _demoKeylorStudentByCodeCS21A72_(session.codigo)) return 'student';
  } catch (_) {}
  return '';
}

function _sec004MarkDemoSession_(session) {
  var kind = _sec004DemoKind_(session);
  if (!kind) return session;
  session.demo = true;
  session.read_only = true;
  session.demo_kind = kind;
  session.demo_policy_version = SEC004_DEMO_READONLY_VERSION;
  return session;
}

function _sec004DemoSafeRead_(fn) {
  return SEC004_DEMO_SAFE_READS[_sec004Norm_(fn)] === true;
}

function _sec004Values_(body, keys) {
  var out = [];
  body = body || {};
  (keys || []).forEach(function(key) {
    var value = body[key];
    if (value == null || value === '') return;
    if (Array.isArray(value)) value.forEach(function(x) { if (x != null && x !== '') out.push(String(x).trim()); });
    else out.push(String(value).trim());
  });
  return out.filter(Boolean);
}

function _sec004DemoStudentByCedula_(cedula) {
  var wanted = String(cedula || '').trim().toUpperCase();
  if (!wanted) return null;
  try {
    var groups = ['0626','0726'];
    for (var g = 0; g < groups.length; g++) {
      var students = _demoKeylorStudents_(groups[g]) || [];
      for (var i = 0; i < students.length; i++) {
        if (String(students[i].cedula || '').trim().toUpperCase() === wanted) return students[i];
      }
    }
  } catch (_) {}
  return null;
}

function _sec004DemoScopeAllowed_(fn, body, session) {
  var kind = _sec004DemoKind_(session);
  if (!kind) return true;
  body = body || {};
  var key = _sec004Norm_(fn);

  var groups = _sec004Values_(body, ['cod_grupo','codGrupo','grupo','COD_GRUPO']);
  var codes = _sec004Values_(body, ['codigo','CODIGO','cod_estudiante','COD_ESTUDIANTE','code','rec_m','REC_M','estudiante_codigo']);
  var cedulas = _sec004Values_(body, ['cedula','CEDULA','num_cedula','NUM_CEDULA','estudiante_cedula']);
  var teachers = _sec004Values_(body, ['cod_docente','docente','teacher','nombre_docente']);

  for (var g = 0; g < groups.length; g++) {
    if (typeof _demoKeylorIsGroup_ !== 'function' || !_demoKeylorIsGroup_(groups[g])) return false;
  }

  if (kind === 'student') {
    var ownCode = String(session.codigo || '').trim().toUpperCase();
    var ownCed = String(session.cedula || '').trim().toUpperCase();
    var ownGroup = '';
    try { ownGroup = String(_demoKeylorStudentGroup_(ownCode) || '').trim(); } catch (_) { ownGroup = ''; }
    for (var c = 0; c < codes.length; c++) if (String(codes[c]).toUpperCase() !== ownCode) return false;
    for (var d = 0; d < cedulas.length; d++) if (!ownCed || String(cedulas[d]).toUpperCase() !== ownCed) return false;
    for (var sg = 0; sg < groups.length; sg++) if (!ownGroup || String(groups[sg]).trim() !== ownGroup) return false;

    var studentCodeRequired = {
      getportalestudiantecompleto:true, getestudiante:true,
      getasistenciaestudiante:true, geticanestudiante:true
    };
    if (studentCodeRequired[key] && codes.length < 1) return false;
    if (key === 'getfechasgrupo' && groups.length < 1) return false;
    return true;
  }

  if (kind === 'teacher') {
    for (var tc = 0; tc < codes.length; tc++) {
      if (typeof _demoKeylorStudentByCodeCS21A72_ !== 'function' || !_demoKeylorStudentByCodeCS21A72_(codes[tc])) return false;
    }
    for (var td = 0; td < cedulas.length; td++) if (!_sec004DemoStudentByCedula_(cedulas[td])) return false;
    for (var t = 0; t < teachers.length; t++) {
      var demoTeacher = false;
      try { demoTeacher = typeof _demoKeylorInput_ === 'function' && _demoKeylorInput_(teachers[t]); } catch (_) { demoTeacher = false; }
      if (!demoTeacher) return false;
    }

    var teacherGroupRequired = {
      getdocentegrupopanelf80:true, getdocentegrupopanelf79:true,
      getasistenciadetallegrupof77:true, getdocentesesionclasef77:true,
      getestudiantesparacierre:true, getleccioncerradadetalle:true,
      getgrupoinfo:true, getgrupoestudiantes:true, getasistenciagrupocompleta:true
    };
    var teacherCodeRequired = { getevaluacionesestudiante:true, getretroalimentacionestudiante:true };
    var teacherIdentityRequired = { getcalendariodocente:true, gettareaspendientesdocente:true };
    if (teacherGroupRequired[key] && groups.length < 1) return false;
    if (teacherCodeRequired[key] && codes.length < 1) return false;
    if (teacherIdentityRequired[key] && teachers.length < 1) return false;
    return true;
  }
  return false;
}

function _sec004ParsePost_(e) {
  var body = {};
  try {
    if (typeof _an4406_parseBody_ === 'function') body = _an4406_parseBody_(e) || {};
    else if (e && e.postData && e.postData.contents) body = JSON.parse(String(e.postData.contents || '{}'));
  } catch (_) { body = {}; }
  var fn = '';
  try { fn = String((e && e.parameter && e.parameter.fn) || body.fn || '').trim(); } catch (_) { fn = ''; }
  return { body:body || {}, fn:fn };
}

function _sec004DemoDenied_(fn, session) {
  return {
    ok:false,
    error:'demo_read_only',
    demo:true,
    read_only:true,
    version:SEC004_DEMO_READONLY_VERSION,
    fn:String(fn || ''),
    rol:String(session && session.rol || ''),
    mensaje:'Esta cuenta es de demostración y no puede modificar datos reales.'
  };
}

// Reanota toda sesión demo después de validarla, incluso si SESIONES no guarda
// columnas demo/read_only. La identidad sintética canónica es la fuente de verdad.
var _sec004ValidarSesionBase_ = validarSesion;
validarSesion = function(token) {
  var session = _sec004ValidarSesionBase_(token);
  return _sec004MarkDemoSession_(session);
};

// La respuesta de login también expone el modo read-only al frontend para que
// la UI pueda deshabilitar controles, pero el bloqueo real permanece en servidor.
var _sec004IniciarSesionBase_ = iniciarSesion;
iniciarSesion = function(body) {
  var out = _sec004IniciarSesionBase_(body);
  if (!out || out.ok !== true) return out;
  var probe = {
    ok:true, rol:out.rol, usuario:out.usuario || (body && body.usuario) || '',
    nombre:out.nombre, codigo:out.codigo, cedula:out.cedula,
    grupo:out.grupo, grupos:out.grupos || []
  };
  if (_sec004DemoKind_(probe)) {
    out.demo = true;
    out.read_only = true;
    out.demo_policy_version = SEC004_DEMO_READONLY_VERSION;
  }
  return out;
};

// Debe ser el último doPost EFECTIVO del proyecto Apps Script. Para una sesión demo:
// 1) permite primero las mutaciones SIMULADAS ya existentes del docente demo,
//    porque _demoKeylorInterceptPost_ garantiza que no escriben datos reales;
// 2) permite únicamente lecturas explícitas;
// 3) permite cerrar sesión (solo escribe la bitácora de sesión, no negocio);
// 4) cualquier ruta nueva/no clasificada falla cerrada.
var _sec004DoPostBase_ = doPost;
doPost = function(e) {
  var parsed = _sec004ParsePost_(e);
  var body = parsed.body || {};
  var fn = parsed.fn || '';
  var token = String(body.token || body.session_token || '').trim();
  if (!token) return _sec004DoPostBase_(e);

  var session;
  try { session = validarSesion(token); } catch (_) { session = null; }
  if (!session || session.ok !== true || !_sec004DemoKind_(session)) return _sec004DoPostBase_(e);

  body._auth_session = session;
  var key = _sec004Norm_(fn);
  if (key === 'cerrarsesion') return _sec004DoPostBase_(e);
  if (!_sec004DemoScopeAllowed_(fn, body, session)) return _an4406_json_(_sec004DemoDenied_(fn, session));

  try {
    if (typeof _demoKeylorInterceptPost_ === 'function') {
      var simulated = _demoKeylorInterceptPost_(fn, body, {ok:true, sesion:session});
      if (simulated) return _an4406_json_(simulated);
    }
  } catch (_) {}

  if (_sec004DemoSafeRead_(key)) return _sec004DoPostBase_(e);
  return _an4406_json_(_sec004DemoDenied_(fn, session));
};
