// ============================================================================
// SEC-004 · DEMO READ-ONLY GLOBAL FAIL-CLOSED GUARD · V3 · 2026-08-29
// ----------------------------------------------------------------------------
// SOURCE CANDIDATE ONLY. DO NOT INSTALL until Issue #111 is satisfied:
// 1) export/freeze the CURRENT modular Apps Script QA project;
// 2) port the generic identity adapter described below against that exact source;
// 3) prove this wrapper is the effective outermost doPost of the full project;
// 4) run QA with demo + real accounts on the existing QA deployment.
//
// V3 deliberately removes person-specific demo helper dependencies. The current
// modular backend must provide this adapter before installation:
//
//   _sec004DemoIdentityAdapter_(session) => {
//     is_demo: true|false,
//     kind: 'student'|'teacher',
//     scope: {
//       groups: [], student_codes: [], cedulas: [], teachers: []
//     }
//   }
//
// Optional synthetic-write adapter:
//   _sec004DemoSimulatedWriteAdapter_(fn, body, auth) => result|null
//
// If the identity adapter is absent or throws, authenticated POST/login traffic
// fails closed with sec004_policy_unbound. Public no-token routes keep delegating.
// ============================================================================

var SEC004_DEMO_READONLY_VERSION = 'SEC004-DEMO-READONLY-2';

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
  'getfechasgrupo': true
};

function _sec004Norm_(value) {
  return String(value == null ? '' : value).trim().toLowerCase();
}

function _sec004NormUpper_(value) {
  return String(value == null ? '' : value).trim().toUpperCase();
}

function _sec004UniqueUpper_(values) {
  var seen = {};
  var out = [];
  (values || []).forEach(function(value) {
    var key = _sec004NormUpper_(value);
    if (!key || seen[key]) return;
    seen[key] = true;
    out.push(key);
  });
  return out;
}

function _sec004Values_(body, keys) {
  var out = [];
  body = body || {};
  (keys || []).forEach(function(key) {
    var value = body[key];
    if (value == null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach(function(item) {
        if (item != null && item !== '') out.push(String(item).trim());
      });
    } else {
      out.push(String(value).trim());
    }
  });
  return out.filter(Boolean);
}

function _sec004PolicyUnbound_(fn, session) {
  return {
    ok: false,
    error: 'sec004_policy_unbound',
    read_only: true,
    version: SEC004_DEMO_READONLY_VERSION,
    fn: String(fn || ''),
    rol: String(session && session.rol || ''),
    mensaje: 'La política de seguridad de cuentas demo no está vinculada al backend QA actual.'
  };
}

function _sec004DemoDenied_(fn, session) {
  return {
    ok: false,
    error: 'demo_read_only',
    demo: true,
    read_only: true,
    version: SEC004_DEMO_READONLY_VERSION,
    fn: String(fn || ''),
    rol: String(session && session.rol || ''),
    mensaje: 'Esta cuenta es de demostración y no puede modificar datos reales.'
  };
}

function _sec004Json_(value) {
  if (typeof _an4406_json_ === 'function') return _an4406_json_(value);
  try {
    return ContentService
      .createTextOutput(JSON.stringify(value))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (_) {
    return value;
  }
}

function _sec004ResolvePolicy_(session) {
  if (!session || session.ok !== true) {
    return { bound: true, is_demo: false, kind: '', scope: {} };
  }

  if (typeof _sec004DemoIdentityAdapter_ !== 'function') {
    return { bound: false, is_demo: false, kind: '', scope: {}, reason: 'identity_adapter_missing' };
  }

  var resolved;
  try {
    resolved = _sec004DemoIdentityAdapter_(session) || {};
  } catch (err) {
    return {
      bound: false,
      is_demo: false,
      kind: '',
      scope: {},
      reason: 'identity_adapter_error',
      detail: String(err && err.message || err || '')
    };
  }

  if (resolved.is_demo !== true) {
    return { bound: true, is_demo: false, kind: '', scope: {} };
  }

  var kind = _sec004Norm_(resolved.kind || session.rol || '');
  if (kind !== 'student' && kind !== 'teacher') {
    return { bound: false, is_demo: true, kind: kind, scope: {}, reason: 'demo_kind_invalid' };
  }

  var rawScope = resolved.scope || {};
  return {
    bound: true,
    is_demo: true,
    kind: kind,
    scope: {
      groups: _sec004UniqueUpper_(rawScope.groups || []),
      student_codes: _sec004UniqueUpper_(rawScope.student_codes || []),
      cedulas: _sec004UniqueUpper_(rawScope.cedulas || []),
      teachers: _sec004UniqueUpper_(rawScope.teachers || [])
    }
  };
}

function _sec004AnnotateSession_(session) {
  if (!session || session.ok !== true) return session;
  var policy = _sec004ResolvePolicy_(session);
  if (!policy.bound) {
    session.sec004_policy_unbound = true;
    session.sec004_policy_version = SEC004_DEMO_READONLY_VERSION;
    return session;
  }
  if (!policy.is_demo) return session;

  session.demo = true;
  session.read_only = true;
  session.demo_kind = policy.kind;
  session.demo_scope = policy.scope;
  session.demo_policy_version = SEC004_DEMO_READONLY_VERSION;
  return session;
}

function _sec004AllAllowed_(requested, allowed) {
  requested = _sec004UniqueUpper_(requested || []);
  allowed = _sec004UniqueUpper_(allowed || []);
  if (!requested.length) return true;
  if (!allowed.length) return false;
  var allow = {};
  allowed.forEach(function(value) { allow[value] = true; });
  for (var i = 0; i < requested.length; i++) {
    if (!allow[requested[i]]) return false;
  }
  return true;
}

function _sec004DemoScopeAllowed_(fn, body, session, policy) {
  body = body || {};
  policy = policy || _sec004ResolvePolicy_(session);
  if (!policy.bound || !policy.is_demo) return false;

  var key = _sec004Norm_(fn);
  var scope = policy.scope || {};
  var groups = _sec004Values_(body, ['cod_grupo','codGrupo','grupo','COD_GRUPO']);
  var codes = _sec004Values_(body, ['codigo','CODIGO','cod_estudiante','COD_ESTUDIANTE','code','rec_m','REC_M','estudiante_codigo']);
  var cedulas = _sec004Values_(body, ['cedula','CEDULA','num_cedula','NUM_CEDULA','estudiante_cedula']);
  var teachers = _sec004Values_(body, ['cod_docente','docente','teacher','nombre_docente']);

  if (!_sec004AllAllowed_(groups, scope.groups)) return false;
  if (!_sec004AllAllowed_(codes, scope.student_codes)) return false;
  if (!_sec004AllAllowed_(cedulas, scope.cedulas)) return false;
  if (!_sec004AllAllowed_(teachers, scope.teachers)) return false;

  var groupRequired = {
    getdocentegrupopanelf80: true,
    getdocentegrupopanelf79: true,
    getasistenciadetallegrupof77: true,
    getdocentesesionclasef77: true,
    getestudiantesparacierre: true,
    getleccioncerradadetalle: true,
    getgrupoinfo: true,
    getgrupoestudiantes: true,
    getasistenciagrupocompleta: true,
    getfechasgrupo: true
  };
  var codeRequired = {
    getevaluacionesestudiante: true,
    getretroalimentacionestudiante: true,
    getportalestudiantecompleto: true,
    getestudiante: true,
    getasistenciaestudiante: true,
    geticanestudiante: true
  };
  var teacherRequired = {
    getcalendariodocente: true,
    gettareaspendientesdocente: true
  };

  if (groupRequired[key] && !groups.length) return false;
  if (codeRequired[key] && !codes.length) return false;
  if (teacherRequired[key] && policy.kind === 'teacher' && !teachers.length) return false;
  return true;
}

function _sec004DemoSafeRead_(fn) {
  return SEC004_DEMO_SAFE_READS[_sec004Norm_(fn)] === true;
}

function _sec004ParsePost_(e) {
  var body = {};
  try {
    if (typeof _an4406_parseBody_ === 'function') {
      body = _an4406_parseBody_(e) || {};
    } else if (e && e.postData && e.postData.contents) {
      body = JSON.parse(String(e.postData.contents || '{}'));
    }
  } catch (_) {
    body = {};
  }
  var fn = '';
  try {
    fn = String((e && e.parameter && e.parameter.fn) || body.fn || '').trim();
  } catch (_) {
    fn = '';
  }
  return { body: body || {}, fn: fn };
}

function SEC004_DEMO_READONLY_STATUS() {
  return {
    ok: typeof _sec004DemoIdentityAdapter_ === 'function',
    version: SEC004_DEMO_READONLY_VERSION,
    identity_adapter_bound: typeof _sec004DemoIdentityAdapter_ === 'function',
    simulated_write_adapter_bound: typeof _sec004DemoSimulatedWriteAdapter_ === 'function',
    safe_read_count: Object.keys(SEC004_DEMO_SAFE_READS).length,
    note: 'La posición efectiva del doPost debe verificarse contra el proyecto Apps Script QA completo.'
  };
}

// Re-anota la sesión desde la identidad canónica del backend, no desde flags
// almacenados por el cliente o por una fila de SESIONES.
var _sec004ValidarSesionBase_ = validarSesion;
validarSesion = function(token) {
  var session = _sec004ValidarSesionBase_(token);
  return _sec004AnnotateSession_(session);
};

// Login fail-closed si el adaptador todavía no fue portado al backend modular.
var _sec004IniciarSesionBase_ = iniciarSesion;
iniciarSesion = function(body) {
  var out = _sec004IniciarSesionBase_(body);
  if (!out || out.ok !== true) return out;

  var probe = {
    ok: true,
    rol: out.rol,
    usuario: out.usuario || (body && body.usuario) || '',
    nombre: out.nombre,
    codigo: out.codigo,
    cedula: out.cedula,
    grupo: out.grupo,
    grupos: out.grupos || []
  };
  var policy = _sec004ResolvePolicy_(probe);
  if (!policy.bound) return _sec004PolicyUnbound_('iniciarSesion', probe);
  if (!policy.is_demo) return out;

  out.demo = true;
  out.read_only = true;
  out.demo_kind = policy.kind;
  out.demo_scope = policy.scope;
  out.demo_policy_version = SEC004_DEMO_READONLY_VERSION;
  return out;
};

// MUST be the effective OUTERMOST doPost of the complete Apps Script project.
// The file name is not proof of order. Installation requires a fresh manifest.
var _sec004DoPostBase_ = doPost;
doPost = function(e) {
  var parsed = _sec004ParsePost_(e);
  var body = parsed.body || {};
  var fn = parsed.fn || '';
  var token = String(body.token || body.session_token || '').trim();

  // Public enrollment / other public no-token traffic stays unchanged.
  if (!token) return _sec004DoPostBase_(e);

  var session;
  try {
    session = validarSesion(token);
  } catch (_) {
    session = null;
  }
  if (!session || session.ok !== true) return _sec004DoPostBase_(e);

  var policy = _sec004ResolvePolicy_(session);
  if (!policy.bound || session.sec004_policy_unbound === true) {
    return _sec004Json_(_sec004PolicyUnbound_(fn, session));
  }
  if (!policy.is_demo) return _sec004DoPostBase_(e);

  body._auth_session = session;
  var key = _sec004Norm_(fn);
  if (key === 'cerrarsesion') return _sec004DoPostBase_(e);

  if (!_sec004DemoScopeAllowed_(fn, body, session, policy)) {
    return _sec004Json_(_sec004DemoDenied_(fn, session));
  }

  // Only a backend-provided synthetic adapter may simulate writes. If it is
  // absent, all non-read routes remain blocked.
  if (typeof _sec004DemoSimulatedWriteAdapter_ === 'function') {
    try {
      var simulated = _sec004DemoSimulatedWriteAdapter_(fn, body, { ok: true, sesion: session });
      if (simulated) return _sec004Json_(simulated);
    } catch (_) {}
  }

  if (_sec004DemoSafeRead_(key)) return _sec004DoPostBase_(e);
  return _sec004Json_(_sec004DemoDenied_(fn, session));
};
