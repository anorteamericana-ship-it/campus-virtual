// CS21A183 · hotfix QA Memory Match start
// APPEND-ONLY. No usar en producción.
// Corrige compatibilidad con helpers históricos que pueden leer SETTINGS_JSON
// sobre un room indefinido y añade diagnóstico por etapa al iniciar la sala.

var CS21A183_MM_START_FIX_VERSION = 'CS21A183-MM-START-FIX';

function _cs21a183MmStartText_(value) {
  return String(value == null ? '' : value).trim();
}

function _cs21a183MmStartQaGuard_() {
  var props = PropertiesService.getScriptProperties();
  var masterId = _cs21a183MmStartText_(props.getProperty('QA_STAGING_MASTER_ID'));
  var operationalId = _cs21a183MmStartText_(props.getProperty('QA_STAGING_OPERATIVO_ID'));
  if (!masterId || !operationalId) {
    throw new Error('BLOQUEADO: faltan QA_STAGING_MASTER_ID o QA_STAGING_OPERATIVO_ID.');
  }
  var masterName = SpreadsheetApp.openById(masterId).getName();
  var operationalName = SpreadsheetApp.openById(operationalId).getName();
  if (!/QA|STAGING/i.test(masterName) || !/QA|STAGING/i.test(operationalName)) {
    throw new Error('BLOQUEADO: CS21A183 Memory Match start fix solo puede ejecutarse en QA/STAGING.');
  }
  return { master:masterName, operational:operationalName };
}

// Sobrescribe el helper global con una variante null-safe. 97/CS21A176 usa
// este nombre dinámicamente al iniciar Memory Match.
function _elmm174Settings_(room) {
  var raw = room && room.SETTINGS_JSON;
  try {
    if (typeof _elmm174Json_ === 'function') return _elmm174Json_(raw, {});
  } catch (_) {}
  try {
    if (typeof _elive176Json_ === 'function') return _elive176Json_(raw, {});
  } catch (_) {}
  try { return raw ? JSON.parse(String(raw)) : {}; }
  catch (_) { return {}; }
}

// Reemplazo compatible del package builder. Evita depender de una versión
// histórica de CS21A174 que pudiera hacer room.SETTINGS_JSON sin guardia.
function _elmm174Package_(room, cards, rules, now) {
  room = room || {};
  rules = rules || {};
  cards = Array.isArray(cards) ? cards : [];
  now = now instanceof Date ? now : new Date();
  var settings = _elmm174Settings_(room);
  var autoStart = Math.max(0, Number(rules.auto_start_delay_ms || 0) || 0);
  var duration = Math.max(5000, Number(rules.round_duration_ms || 30000) || 30000);
  var startAt = new Date(now.getTime() + autoStart);
  var endAt = new Date(startAt.getTime() + duration);
  var iso = typeof _elmm174Iso_ === 'function'
    ? _elmm174Iso_
    : function(date) { return (date instanceof Date ? date : new Date()).toISOString(); };
  var text = typeof _elmm174Text_ === 'function'
    ? _elmm174Text_
    : function(value) { return String(value == null ? '' : value).trim(); };
  var upper = typeof _elmm174Upper_ === 'function'
    ? _elmm174Upper_
    : function(value) { return text(value).toUpperCase(); };
  var teams = [];
  try {
    teams = typeof _elmm174Teams_ === 'function' ? (_elmm174Teams_(room) || []) : [];
  } catch (_) { teams = []; }
  return {
    version:typeof ELMM174_VERSION !== 'undefined' ? ELMM174_VERSION : CS21A183_MM_START_FIX_VERSION,
    server_now:iso(now),
    received_at_ms:now.getTime(),
    room:{
      room_code:text(room.ROOM_CODE),
      game_id:typeof ELMM174_GAME_CODE !== 'undefined' ? ELMM174_GAME_CODE : 'MEMORY_MATCH',
      mode:upper(room.MODE || 'INDIVIDUAL'),
      level_id:upper(room.NIVEL || 'B1')
    },
    round:{
      round_id:text(room.ROOM_CODE) + '-R1',
      index:1,
      title:(typeof ELMM174_GAME_LABEL !== 'undefined' ? ELMM174_GAME_LABEL : 'Memory Match') + ' · ' + upper(settings.unit || 'MIX'),
      cards:cards
    },
    rules:rules,
    state:{
      phase:autoStart > 0 ? 'COUNTDOWN' : 'OPEN',
      started_at:iso(startAt),
      ends_at:iso(endAt),
      active_team_id:''
    },
    teams:teams
  };
}

var _cs21a183MmStartBase_ = typeof englishLabMemoryMatchStartRoomCS21A176 === 'function'
  ? englishLabMemoryMatchStartRoomCS21A176
  : null;

if (_cs21a183MmStartBase_) {
  englishLabMemoryMatchStartRoomCS21A176 = function(body) {
    _cs21a183MmStartQaGuard_();
    var stage = 'START';
    try {
      stage = 'BASE_START';
      var result = _cs21a183MmStartBase_(body || {});
      if (result && result.ok === true) {
        result.memory_match_start_fix = CS21A183_MM_START_FIX_VERSION;
      }
      return result;
    } catch (error) {
      return {
        ok:false,
        version:CS21A183_MM_START_FIX_VERSION,
        error:'memory_match_start_guard_error',
        stage:stage,
        mensaje:String(error && error.message ? error.message : error)
      };
    }
  };
}

var _cs21a183MmVerifyBase_ = typeof verificarActualizacionQA === 'function'
  ? verificarActualizacionQA
  : null;

if (_cs21a183MmVerifyBase_) {
  verificarActualizacionQA = function() {
    var previous = _cs21a183MmVerifyBase_();
    var qa = _cs21a183MmStartQaGuard_();
    var undefinedSettings = _elmm174Settings_(undefined);
    var createdRoom = {
      ROOM_CODE:'LAB-TEST-CS21A183D',
      STATUS:'CREATED',
      GAME_CODE:'MEMORY_MATCH',
      NIVEL:'B1',
      MODE:'TEAMS',
      SETTINGS_JSON:'{"unit":"U01","pair_count":4}'
    };
    var createdSettings = _elmm174Settings_(createdRoom);
    var syntheticRules = {auto_start_delay_ms:0,round_duration_ms:30000};
    var syntheticPackage = _elmm174Package_(createdRoom, [], syntheticRules, new Date());
    var result = {
      ok:!!(previous && previous.ok === true && undefinedSettings && createdSettings.unit === 'U01' && syntheticPackage && syntheticPackage.room && syntheticPackage.room.room_code === createdRoom.ROOM_CODE && _cs21a183MmStartBase_),
      version:CS21A183_MM_START_FIX_VERSION,
      previous_version:previous && previous.version,
      memory_match_start_guard:true,
      settings_undefined_safe:!!undefinedSettings,
      created_room_settings_safe:createdSettings.unit === 'U01',
      created_room_package_safe:!!(syntheticPackage && syntheticPackage.room && syntheticPackage.room.room_code === createdRoom.ROOM_CODE),
      start_wrapper_installed:!!_cs21a183MmStartBase_,
      qa_master:qa.master,
      qa_operational:qa.operational
    };
    console.log(JSON.stringify(result));
    if (!result.ok) throw new Error('CS21A183 Memory Match start fix no superó la verificación QA.');
    return result;
  };
}
