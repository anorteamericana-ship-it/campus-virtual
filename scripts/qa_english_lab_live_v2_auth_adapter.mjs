import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'AppsScript', 'EnglishLabLiveV2');
const files = ['00_Constants.js', '19_RequestValidation.js', '22_CampusAuthAdapter.js'];
const context = vm.createContext({ console, Object, Array, JSON, String, Error, Number });
for (const name of files) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

const estatus = [
  ['CODIGO', 'GRUPO', 'NIVEL', 'ESTATUS', 'OTRO'],
  ['STU-A', 'GROUP-A', 'B1', 'CA', 'x'],
  ['STU-A', 'GROUP-OLD', 'B1', 'APR', 'x'],
  ['STU-B', 'GROUP-B', 'B2', 'CA', 'x'],
  ['STU-B', 'GROUP-B', 'B2', 'CA', 'duplicate'],
  ['STU-X', 'GROUP-X', 'I1', 'APR', 'x']
];

const sessions = {
  'tok-a': { ok: true, rol: 'student', codigo: 'STU-A', nombre: 'Ana M.', grupo: 'GROUP-A' },
  'tok-b': { ok: true, rol: 'student', codigo: 'STU-B', nombre: 'Bruno R.', grupo: 'FORGED-NOT-ACTIVE' },
  'tok-x': { ok: true, rol: 'student', codigo: 'STU-X', nombre: 'Inactive', grupo: 'GROUP-X' },
  'tok-teacher': {
    ok: true, rol: 'teacher', usuario: 'teacher@example.invalid', nombre: 'Teacher One',
    grupo: 'SESSION-FALLBACK', grupos: ['SESSION-FALLBACK']
  },
  'tok-teacher-empty': {
    ok: true, rol: 'teacher', usuario: 'teacher-empty@example.invalid', nombre: 'Teacher Empty',
    grupo: 'FORGED-SESSION-GROUP', grupos: ['FORGED-SESSION-GROUP']
  },
  'tok-admin': { ok: true, rol: 'admin', usuario: 'admin-1', nombre: 'Admin' },
  'tok-super': { ok: true, rol: 'superadmin', usuario: 'super-1', nombre: 'Super' },
  'tok-sales': { ok: true, rol: 'ventas', usuario: 'sales-1', nombre: 'Sales' },
  'tok-bad': { ok: false, error: 'sesion_invalida' }
};

const adapter = context.ELV2_createCampusAuthAdapter({
  validateSession: (token) => sessions[token] || null,
  getStrictStudentEnrollments: (code) => context.ELV2_resolveStrictStudentEnrollmentsFromMatrix(estatus, code),
  getTeacherGroupsForSession: (session) => {
    if (session.usuario === 'teacher@example.invalid') {
      return [{ grupo: 'GROUP-A' }, { cod_grupo: 'GROUP-B' }, { grupo: 'GROUP-A' }];
    }
    return [];
  },
  stableUserIdForSession: (session, role) => `${role}:opaque:${session.codigo || session.usuario}`
});

// Student identity and eligibility come only from the validated Campus session + ESTATUS.
let actor = adapter.authenticateToken('tok-a');
assert.equal(actor.user_id, 'student:opaque:STU-A');
assert.equal(actor.student_id, 'STU-A');
assert.equal(actor.role, 'student');
assert.equal(actor.display_name, 'Ana M.');
assert.equal(actor.home_group_id, 'GROUP-A');
assert.equal(actor.live_eligible, true);
assert.deepEqual(Array.from(actor.capabilities), ['LIVE_VIEW', 'LIVE_JOIN', 'LIVE_PLAY']);
assert.deepEqual(JSON.parse(JSON.stringify(actor.active_enrollments)), [{ group_id: 'GROUP-A', level: 'B1' }]);

// SALA_MIXTA: the home group is only a canonical snapshot. It is not a join-room gate.
actor = adapter.authenticateToken('tok-b');
assert.equal(actor.live_eligible, true);
assert.equal(actor.home_group_id, 'GROUP-B', 'non-active session group must not override canonical CA enrollment');

// An authenticated but non-CA student can probe join generically, but cannot view/play.
actor = adapter.authenticateToken('tok-x');
assert.equal(actor.live_eligible, false);
assert.equal(actor.home_group_id, '');
assert.deepEqual(Array.from(actor.capabilities), ['LIVE_JOIN']);

// ESTATUS security columns fail closed when missing or duplicated.
assert.throws(
  () => context.ELV2_resolveStrictStudentEnrollmentsFromMatrix([
    ['CODIGO', 'GRUPO', 'NIVEL'], ['STU-A', 'GROUP-A', 'B1']
  ], 'STU-A'),
  /ELV2_SCHEMA_UNHEALTHY:ESTATUS:ESTATUS/
);
assert.throws(
  () => context.ELV2_resolveStrictStudentEnrollmentsFromMatrix([
    ['CODIGO', 'GRUPO', 'NIVEL', 'ESTATUS', 'ESTATUS'], ['STU-A', 'GROUP-A', 'B1', 'CA', 'CA']
  ], 'STU-A'),
  /ELV2_SCHEMA_UNHEALTHY:ESTATUS:ESTATUS/
);
assert.deepEqual(
  JSON.parse(JSON.stringify(context.ELV2_resolveStrictStudentEnrollmentsFromMatrix([
    ['REC_M', 'GRUPO', 'NIVEL', 'ESTATUS'], ['STU-R', 'GROUP-R', 'I2', 'CA']
  ], 'STU-R'))),
  [{ group_id: 'GROUP-R', level: 'I2' }]
);

// Teacher authority comes from the canonical server resolver, never session group fallbacks.
actor = adapter.authenticateToken('tok-teacher');
assert.equal(actor.user_id, 'teacher:opaque:teacher@example.invalid');
assert.equal(actor.teacher_id, actor.user_id);
assert.deepEqual(Array.from(actor.authorized_group_ids), ['GROUP-A', 'GROUP-B']);
assert.deepEqual(Array.from(actor.capabilities), ['LIVE_VIEW', 'LIVE_CREATE', 'LIVE_CONTROL_OWN']);
actor = adapter.authenticateToken('tok-teacher-empty');
assert.deepEqual(Array.from(actor.authorized_group_ids), []);
assert.deepEqual(Array.from(actor.capabilities), [], 'session grupos must not grant v2 authority');

// Admin control-any is explicit; non-LIVE Campus roles are rejected.
actor = adapter.authenticateToken('tok-admin');
assert.deepEqual(Array.from(actor.capabilities), ['LIVE_VIEW', 'LIVE_CREATE', 'LIVE_CONTROL_ANY']);
actor = adapter.authenticateToken('tok-super');
assert.deepEqual(Array.from(actor.capabilities), ['LIVE_VIEW', 'LIVE_CREATE', 'LIVE_CONTROL_ANY']);
assert.throws(() => adapter.authenticateToken('tok-sales'), /ELV2_FORBIDDEN:role/);
assert.throws(() => adapter.authenticateToken('tok-bad'), /ELV2_AUTH_REQUIRED/);
assert.throws(() => adapter.authenticateToken(''), /ELV2_AUTH_REQUIRED/);

// Transport removes only the session secret. It must NOT hide arbitrary or forged fields.
let transport = context.ELV2_extractCampusTransportRequest({
  token: 'tok-a',
  api_version: 'english_lab_live.v2',
  action: 'joinRoom',
  request_id: 'REQ-1',
  room_code: 'LAB-1',
  payload: {},
  user_id: 'FORGED-USER'
});
assert.equal(transport.token, 'tok-a');
assert.equal(Object.prototype.hasOwnProperty.call(transport.core_request, 'token'), false);
assert.equal(transport.core_request.user_id, 'FORGED-USER');
assert.throws(() => context.ELV2_validateRequestEnvelope(transport.core_request), /ELV2_INVALID_REQUEST_FIELD:user_id/);

transport = context.ELV2_extractCampusTransportRequest({
  session_token: 'tok-a',
  api_version: 'english_lab_live.v2',
  action: 'joinRoom',
  request_id: 'REQ-2',
  room_code: 'LAB-1',
  payload: { student_id: 'FORGED-STUDENT' }
});
assert.equal(transport.token, 'tok-a');
assert.throws(() => context.ELV2_validateRequestEnvelope(transport.core_request), /ELV2_INVALID_RESERVED_FIELD/);

assert.throws(
  () => context.ELV2_extractCampusTransportRequest({ token: 'A', session_token: 'B' }),
  /ELV2_INVALID_REQUEST:session_token_mismatch/
);
assert.throws(
  () => context.ELV2_extractCampusTransportRequest({ api_version: 'english_lab_live.v2' }),
  /ELV2_AUTH_REQUIRED/
);

console.log('ELV2 CAMPUS AUTH ADAPTER E2 PASS');
