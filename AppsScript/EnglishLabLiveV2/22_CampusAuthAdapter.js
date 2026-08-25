/**
 * English LAB LIVE v2 · Campus AuthAdapter E2.
 *
 * Isolated integration boundary. This file does NOT own doPost/doGet and performs no
 * writes. Browser identity/role/capabilities are never inputs to actor construction.
 */
function ELV2_createCampusAuthAdapter(deps) {
  if (!deps || typeof deps.validateSession !== 'function' ||
      typeof deps.getStrictStudentEnrollments !== 'function' ||
      typeof deps.getTeacherGroupsForSession !== 'function' ||
      typeof deps.stableUserIdForSession !== 'function') {
    throw new Error('ELV2_AUTH_ADAPTER_DEPS_INVALID');
  }

  function authenticateToken(token) {
    var normalizedToken = ELV2_authNorm_(token);
    if (!normalizedToken) throw new Error('ELV2_AUTH_REQUIRED');

    var session = deps.validateSession(normalizedToken);
    if (!session || session.ok !== true) throw new Error('ELV2_AUTH_REQUIRED');
    return buildActorFromSession(session);
  }

  function buildActorFromSession(session) {
    if (!session || session.ok !== true) throw new Error('ELV2_AUTH_REQUIRED');
    var role = ELV2_authNorm_(session.rol || session.role).toLowerCase();
    if (role === 'student') return buildStudentActor_(session);
    if (role === 'teacher') return buildTeacherActor_(session);
    if (role === 'admin' || role === 'superadmin') return buildAdminActor_(session, role);
    throw new Error('ELV2_FORBIDDEN:role');
  }

  function stableUserId_(session, role) {
    var value = ELV2_authNorm_(deps.stableUserIdForSession(session, role));
    if (!value) throw new Error('ELV2_AUTH_REQUIRED');
    return value;
  }

  function buildStudentActor_(session) {
    var studentId = ELV2_authNorm_(session.codigo);
    if (!studentId) throw new Error('ELV2_AUTH_REQUIRED');

    var enrollments = deps.getStrictStudentEnrollments(studentId);
    if (!Array.isArray(enrollments)) throw new Error('ELV2_SCHEMA_UNHEALTHY:student_enrollments');
    var canonical = ELV2_normalizeEnrollmentList_(enrollments);
    var eligible = canonical.length > 0;
    var homeGroupId = ELV2_chooseHomeGroup_(session, canonical);

    return Object.freeze({
      user_id: stableUserId_(session, 'student'),
      role: 'student',
      student_id: studentId,
      display_name: ELV2_authNorm_(session.nombre),
      home_group_id: homeGroupId,
      live_eligible: eligible,
      active_enrollments: Object.freeze(canonical),
      capabilities: Object.freeze(eligible
        ? [ELV2_CAPABILITY.LIVE_VIEW, ELV2_CAPABILITY.LIVE_JOIN, ELV2_CAPABILITY.LIVE_PLAY]
        : [ELV2_CAPABILITY.LIVE_JOIN])
    });
  }

  function buildTeacherActor_(session) {
    var groups = deps.getTeacherGroupsForSession(session);
    if (!Array.isArray(groups)) throw new Error('ELV2_SCHEMA_UNHEALTHY:teacher_groups');
    var groupIds = ELV2_normalizeTeacherGroupIds_(groups);
    var enabled = groupIds.length > 0;
    var userId = stableUserId_(session, 'teacher');

    return Object.freeze({
      user_id: userId,
      teacher_id: userId,
      role: 'teacher',
      display_name: ELV2_authNorm_(session.nombre),
      authorized_group_ids: Object.freeze(groupIds),
      capabilities: Object.freeze(enabled
        ? [ELV2_CAPABILITY.LIVE_VIEW, ELV2_CAPABILITY.LIVE_CREATE, ELV2_CAPABILITY.LIVE_CONTROL_OWN]
        : [])
    });
  }

  function buildAdminActor_(session, role) {
    return Object.freeze({
      user_id: stableUserId_(session, role),
      role: role,
      display_name: ELV2_authNorm_(session.nombre),
      capabilities: Object.freeze([
        ELV2_CAPABILITY.LIVE_VIEW,
        ELV2_CAPABILITY.LIVE_CREATE,
        ELV2_CAPABILITY.LIVE_CONTROL_ANY
      ])
    });
  }

  return Object.freeze({
    authenticateToken: authenticateToken,
    buildActorFromSession: buildActorFromSession
  });
}

/**
 * Transport-only projection. It removes ONLY token/session_token. Every other key,
 * including forged identity or unknown fields, is preserved so RequestValidation can
 * reject it instead of silently sanitizing an attack.
 */
function ELV2_extractCampusTransportRequest(rawRequest) {
  if (!rawRequest || typeof rawRequest !== 'object' || Array.isArray(rawRequest)) {
    throw new Error('ELV2_INVALID_REQUEST');
  }

  var token = ELV2_authNorm_(rawRequest.token);
  var sessionToken = ELV2_authNorm_(rawRequest.session_token);
  if (token && sessionToken && token !== sessionToken) {
    throw new Error('ELV2_INVALID_REQUEST:session_token_mismatch');
  }
  var effectiveToken = token || sessionToken;
  if (!effectiveToken) throw new Error('ELV2_AUTH_REQUIRED');

  var coreRequest = {};
  Object.keys(rawRequest).forEach(function (key) {
    if (key === 'token' || key === 'session_token') return;
    Object.defineProperty(coreRequest, key, {
      value: rawRequest[key],
      enumerable: true,
      configurable: true,
      writable: true
    });
  });

  return Object.freeze({
    token: effectiveToken,
    core_request: Object.freeze(coreRequest)
  });
}

/**
 * Strict, read-only eligibility projection from the existing ESTATUS matrix.
 * Security-critical columns must exist exactly once. Missing/duplicate columns fail
 * closed instead of treating an unknown status as active.
 */
function ELV2_resolveStrictStudentEnrollmentsFromMatrix(values, studentCode) {
  if (!Array.isArray(values) || values.length < 1 || !Array.isArray(values[0])) {
    throw new Error('ELV2_SCHEMA_UNHEALTHY:ESTATUS');
  }
  var code = ELV2_authNorm_(studentCode);
  if (!code) throw new Error('ELV2_AUTH_REQUIRED');

  var headers = values[0].map(ELV2_authHeader_);
  var columns = ELV2_authColumnMap_(headers);
  var codeHeader = ELV2_pickIdentityHeader_(columns);
  ELV2_requireUniqueAuthHeader_(columns, 'GRUPO');
  ELV2_requireUniqueAuthHeader_(columns, 'NIVEL');
  ELV2_requireUniqueAuthHeader_(columns, 'ESTATUS');

  var out = [];
  var seen = {};
  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var row = Array.isArray(values[rowIndex]) ? values[rowIndex] : [];
    if (ELV2_authNorm_(row[columns[codeHeader][0]]) !== code) continue;
    if (ELV2_authNorm_(row[columns.ESTATUS[0]]).toUpperCase() !== 'CA') continue;

    var groupId = ELV2_authNorm_(row[columns.GRUPO[0]]);
    var level = ELV2_authNorm_(row[columns.NIVEL[0]]).toUpperCase();
    if (!groupId || !level) continue;
    var dedupeKey = groupId + '|' + level;
    if (seen[dedupeKey]) continue;
    seen[dedupeKey] = true;
    out.push(Object.freeze({ group_id: groupId, level: level }));
  }
  return Object.freeze(out);
}

function ELV2_createAppsScriptCampusAuthAdapter() {
  return ELV2_createCampusAuthAdapter({
    validateSession: function (token) {
      if (typeof validarSesion !== 'function') throw new Error('ELV2_AUTH_RUNTIME_UNAVAILABLE');
      return validarSesion(token);
    },
    getStrictStudentEnrollments: ELV2_readAppsScriptStudentEnrollmentsStrict_,
    getTeacherGroupsForSession: ELV2_readAppsScriptTeacherGroupsStrict_,
    stableUserIdForSession: ELV2_appsScriptStableUserId_
  });
}

function ELV2_readAppsScriptStudentEnrollmentsStrict_(studentCode) {
  if (typeof SpreadsheetApp === 'undefined' || typeof SHEET_ID === 'undefined' || !SHEET_ID) {
    throw new Error('ELV2_AUTH_RUNTIME_UNAVAILABLE');
  }
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheetName = (typeof SH !== 'undefined' && SH && SH.ESTATUS) ? SH.ESTATUS : 'ESTATUS';
  var ws = ss.getSheetByName(sheetName);
  if (!ws || ws.getLastRow() < 1 || ws.getLastColumn() < 1) {
    throw new Error('ELV2_SCHEMA_UNHEALTHY:ESTATUS');
  }
  var values = ws.getRange(1, 1, ws.getLastRow(), ws.getLastColumn()).getValues();
  return ELV2_resolveStrictStudentEnrollmentsFromMatrix(values, studentCode);
}

function ELV2_readAppsScriptTeacherGroupsStrict_(session) {
  if (typeof f984z6iTeacherGroupsForSession !== 'function') {
    throw new Error('ELV2_AUTH_RUNTIME_UNAVAILABLE');
  }
  var groups = f984z6iTeacherGroupsForSession(session);
  if (!Array.isArray(groups)) throw new Error('ELV2_SCHEMA_UNHEALTHY:teacher_groups');
  return groups;
}

function ELV2_appsScriptStableUserId_(session, role) {
  if (typeof Utilities === 'undefined' || !Utilities.computeDigest || !Utilities.base64EncodeWebSafe) {
    throw new Error('ELV2_AUTH_RUNTIME_UNAVAILABLE');
  }
  var stableKey;
  if (role === 'student') {
    stableKey = ELV2_authNorm_(session && session.codigo);
  } else {
    stableKey = ELV2_authNorm_(session && session.cedula) ||
      ELV2_authNorm_(session && session.codigo) ||
      ELV2_authNorm_(session && session.usuario);
  }
  if (!stableKey) throw new Error('ELV2_AUTH_REQUIRED');

  var input = role + '|' + stableKey;
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  var digest = Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, '');
  return role + ':' + digest;
}

function ELV2_normalizeEnrollmentList_(items) {
  var out = [];
  var seen = {};
  items.forEach(function (item) {
    if (!item || typeof item !== 'object') return;
    var groupId = ELV2_authNorm_(item.group_id || item.grupo || item.cod_grupo || item.code);
    var level = ELV2_authNorm_(item.level || item.nivel).toUpperCase();
    if (!groupId || !level) return;
    var key = groupId + '|' + level;
    if (seen[key]) return;
    seen[key] = true;
    out.push(Object.freeze({ group_id: groupId, level: level }));
  });
  return out;
}

function ELV2_chooseHomeGroup_(session, enrollments) {
  if (!enrollments.length) return '';
  var preferred = ELV2_authNorm_(session && session.grupo);
  if (preferred) {
    for (var i = 0; i < enrollments.length; i += 1) {
      if (enrollments[i].group_id === preferred) return preferred;
    }
  }
  return enrollments[0].group_id;
}

function ELV2_normalizeTeacherGroupIds_(groups) {
  var out = [];
  var seen = {};
  groups.forEach(function (item) {
    var groupId = typeof item === 'string'
      ? ELV2_authNorm_(item)
      : ELV2_authNorm_(item && (item.grupo || item.cod_grupo || item.code));
    if (!groupId || seen[groupId]) return;
    seen[groupId] = true;
    out.push(groupId);
  });
  return out;
}

function ELV2_authColumnMap_(headers) {
  var out = {};
  headers.forEach(function (header, index) {
    if (!out[header]) out[header] = [];
    out[header].push(index);
  });
  return out;
}

function ELV2_pickIdentityHeader_(columns) {
  if (columns.CODIGO && columns.CODIGO.length === 1) return 'CODIGO';
  if (columns.CODIGO && columns.CODIGO.length !== 1) throw new Error('ELV2_SCHEMA_UNHEALTHY:ESTATUS:CODIGO');
  if (columns.REC_M && columns.REC_M.length === 1) return 'REC_M';
  throw new Error('ELV2_SCHEMA_UNHEALTHY:ESTATUS:student_code');
}

function ELV2_requireUniqueAuthHeader_(columns, header) {
  if (!columns[header] || columns[header].length !== 1) {
    throw new Error('ELV2_SCHEMA_UNHEALTHY:ESTATUS:' + header);
  }
}

function ELV2_authHeader_(value) {
  return ELV2_authNorm_(value).toUpperCase();
}

function ELV2_authNorm_(value) {
  return String(value == null ? '' : value).trim();
}
