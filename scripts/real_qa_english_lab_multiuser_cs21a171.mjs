import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const API_VERSION = 'english_lab_live.v2';
const STAGING_MARKER = 'QA_STAGING_CS21A138';
const CONFIRMATION = 'CS21A171_STAGING_ONLY';

const required = [
  'QA_ENGLISH_LAB_APPS_SCRIPT_URL',
  'QA_LAB_TEACHER_USER',
  'QA_LAB_TEACHER_PASS',
  'QA_LAB_STUDENT_USER',
  'QA_LAB_STUDENT_PASS',
  'QA_LAB_GROUP_CODE',
  'QA_ENGLISH_LAB_WRITE_CONFIRMATION',
];
const missing = required.filter(name => !String(process.env[name] || '').trim());
if (missing.length) throw new Error(`Faltan variables QA English LAB: ${missing.join(', ')}`);
if (String(process.env.QA_ENGLISH_LAB_WRITE_CONFIRMATION).trim() !== CONFIRMATION) {
  throw new Error(`BLOQUEADO: QA_ENGLISH_LAB_WRITE_CONFIRMATION debe ser ${CONFIRMATION}.`);
}

const stagingUrl = String(process.env.QA_ENGLISH_LAB_APPS_SCRIPT_URL).trim();
const groupCode = String(process.env.QA_LAB_GROUP_CODE).trim();
const level = String(process.env.QA_LAB_LEVEL || 'B1').trim().toUpperCase();
const unit = String(process.env.QA_LAB_UNIT || '01').trim().padStart(2, '0');
if (!['B1', 'B2', 'I1', 'I2'].includes(level)) throw new Error('BLOQUEADO: QA_LAB_LEVEL inválido.');
if (!/^(0[1-9]|1[0-6])$/.test(unit)) throw new Error('BLOQUEADO: QA_LAB_UNIT debe estar entre 01 y 16.');

const productionSource = fs.readFileSync('src/data.jsx', 'utf8');
const prodMatch = productionSource.match(/const\s+APPS_SCRIPT_URL\s*=\s*['"]([^'"]+)['"]/);
if (!prodMatch) throw new Error('No se encontró APPS_SCRIPT_URL productiva para aplicar el bloqueo.');
if (stagingUrl === prodMatch[1]) throw new Error('BLOQUEADO: la URL English LAB QA coincide con producción.');

const outDir = path.join(process.cwd(), 'qa-output-english-lab-multiuser');
fs.mkdirSync(outDir, { recursive: true });
const checks = [];
const findings = [];
let teacherToken = '';
let studentToken = '';
let roomId = '';
let roomCode = '';
let cleanupAttempted = false;
let cleanupOk = null;
let fatal = null;

const record = (area, name, ok, extra = {}) => checks.push({ area, name, ok: Boolean(ok), ...extra });
const finding = (severity, area, title, evidence = '') => findings.push({ severity, area, title, evidence });
function requireCheck(area, name, ok, severity = 'P1', evidence = '') {
  record(area, name, ok);
  if (!ok) {
    finding(severity, area, name, evidence);
    throw new Error(`${severity}:${area}:${name}`);
  }
}
function uniqueRequestId(action) {
  return `${action}:QA-CS21A171:${randomUUID()}`.slice(0, 128);
}
async function fetchJson(url, options, label) {
  const response = await fetch(url, options);
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); }
  catch (_) { throw new Error(`${label} devolvió una respuesta no JSON.`); }
  return { response, data };
}
async function legacyGet(fn) {
  const url = new URL(stagingUrl);
  url.searchParams.set('fn', fn);
  return fetchJson(url, { redirect: 'follow' }, fn);
}
async function legacyPost(fn, payload = {}) {
  const url = new URL(stagingUrl);
  url.searchParams.set('fn', fn);
  return fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, ...payload }),
    redirect: 'follow',
  }, fn);
}
async function v2(token, action, spec = {}) {
  const body = {
    api_version: API_VERSION,
    action,
    token,
    payload: spec.payload || {},
  };
  if (action !== 'getState') body.request_id = spec.request_id || uniqueRequestId(action);
  for (const key of ['room_id', 'room_code', 'round_id', 'client_seen_revision']) {
    if (spec[key] !== undefined && spec[key] !== null && spec[key] !== '') body[key] = spec[key];
  }
  return fetchJson(stagingUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
    redirect: 'follow',
  }, `ELV2 ${action}`);
}
function expectV2Ok(result, action) {
  const ok = result.response.ok && result.data && result.data.ok === true && result.data.api_version === API_VERSION;
  requireCheck('transport', `${action}_ok`, ok, 'P1', result.data && result.data.error ? String(result.data.error.code || '') : '');
  return result.data;
}
async function state(token, room, mode) {
  const data = expectV2Ok(await v2(token, 'getState', {
    room_id: room,
    payload: { view_mode: mode },
  }), `getState_${mode}`);
  return data.view;
}
function hasOwn(obj, key) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}
function assertNoSentenceAnswerLeak(game, label) {
  const forbidden = ['answer_sentence', 'answer_token_ids', 'solution_token_ids', 'correct_sentence', 'private_state', 'viewer_result'];
  const leaked = forbidden.filter(key => hasOwn(game, key));
  requireCheck('privacy', `${label}_no_answer_leak`, leaked.length === 0, 'P0', leaked.join(','));
}
async function safeCleanup() {
  if (!teacherToken || !roomId) return;
  cleanupAttempted = true;
  try {
    const current = await state(teacherToken, roomId, 'CONTROLLER');
    if (current && current.room && current.room.status !== 'CLOSED') {
      const close = await v2(teacherToken, 'closeRoom', {
        room_id: roomId,
        payload: {
          expected_revision: current.state_revision,
          reason: 'QA_CS21A171_CLEANUP',
        },
      });
      cleanupOk = Boolean(close.response.ok && close.data && close.data.ok === true);
    } else {
      cleanupOk = true;
    }
  } catch (_) {
    cleanupOk = false;
  }
}

try {
  const status = await legacyGet('getInfoGeneral');
  const qa = status.data && status.data.qa;
  const safeStaging = status.response.ok
    && status.data && status.data.ok === true
    && qa && qa.marker === STAGING_MARKER
    && qa.qa_staging === true
    && qa.master_match === true
    && qa.operational_match === true
    && qa.writes_guarded === true;
  requireCheck('staging_guard', 'qa_marker_and_write_guard', safeStaging, 'P0');

  const teacherLogin = await legacyPost('iniciarSesion', {
    usuario: process.env.QA_LAB_TEACHER_USER,
    clave: process.env.QA_LAB_TEACHER_PASS,
  });
  const teacherRole = String(teacherLogin.data && teacherLogin.data.rol || '').toLowerCase();
  const teacherOk = teacherLogin.response.ok && teacherLogin.data && teacherLogin.data.ok === true
    && teacherLogin.data.token && teacherRole === 'teacher';
  requireCheck('auth', 'teacher_login', teacherOk, 'P1');
  teacherToken = teacherLogin.data.token;

  const studentLogin = await legacyPost('iniciarSesion', {
    usuario: process.env.QA_LAB_STUDENT_USER,
    clave: process.env.QA_LAB_STUDENT_PASS,
  });
  const studentRole = String(studentLogin.data && studentLogin.data.rol || '').toLowerCase();
  const studentOk = studentLogin.response.ok && studentLogin.data && studentLogin.data.ok === true
    && studentLogin.data.token && studentRole === 'student';
  requireCheck('auth', 'student_login', studentOk, 'P1');
  studentToken = studentLogin.data.token;

  const create = expectV2Ok(await v2(teacherToken, 'createRoom', {
    payload: {
      group_id: groupCode,
      title: `QA English LAB CS21A171 ${new Date().toISOString()}`,
      config: { qa_marker: 'CS21A171' },
    },
  }), 'createRoom');
  roomId = create.view && create.view.room && create.view.room.room_id || '';
  roomCode = create.view && create.view.room && create.view.room.room_code || '';
  requireCheck('room', 'room_created', Boolean(roomId && roomCode), 'P1');
  requireCheck('room', 'initial_participant_count_zero', create.view.participant_count === 0, 'P1');

  const joinRequestId = uniqueRequestId('joinRoom');
  expectV2Ok(await v2(studentToken, 'joinRoom', {
    room_code: roomCode,
    request_id: joinRequestId,
    payload: {},
  }), 'joinRoom');

  let teacherState = await state(teacherToken, roomId, 'CONTROLLER');
  let studentState = await state(studentToken, roomId, 'STUDENT');
  requireCheck('room', 'participant_count_teacher_is_one', teacherState.participant_count === 1, 'P1');
  requireCheck('room', 'participant_count_student_is_one', studentState.participant_count === 1, 'P1');
  requireCheck('sync', 'revision_matches_after_join', teacherState.state_revision === studentState.state_revision, 'P1');
  requireCheck('room', 'student_player_projection_present', Boolean(studentState.player && studentState.player.player_id), 'P1');

  expectV2Ok(await v2(teacherToken, 'startRoom', {
    room_id: roomId,
    payload: { expected_revision: teacherState.state_revision },
  }), 'startRoom');
  teacherState = await state(teacherToken, roomId, 'CONTROLLER');
  requireCheck('room', 'room_live', teacherState.room && teacherState.room.status === 'LIVE', 'P1');

  const contentRef = `APOLLO_PLAY_V1:${level}:${level}-U${unit}:SENTENCE_ORDER`;
  expectV2Ok(await v2(teacherToken, 'prepareRound', {
    room_id: roomId,
    payload: {
      expected_revision: teacherState.state_revision,
      game_id: 'SENTENCE_ORDER',
      content_ref: contentRef,
      settings: { item_index: 1 },
    },
  }), 'prepareRound');
  teacherState = await state(teacherToken, roomId, 'CONTROLLER');
  const roundId = teacherState.round && teacherState.round.round_id || '';
  requireCheck('round', 'sentence_order_ready', Boolean(roundId) && teacherState.round.game_id === 'SENTENCE_ORDER' && teacherState.round.phase === 'READY', 'P1');

  expectV2Ok(await v2(teacherToken, 'openRound', {
    room_id: roomId,
    round_id: roundId,
    payload: { expected_revision: teacherState.state_revision, duration_ms: 120000 },
  }), 'openRound');

  teacherState = await state(teacherToken, roomId, 'CONTROLLER');
  studentState = await state(studentToken, roomId, 'STUDENT');
  requireCheck('round', 'student_sees_open_round', studentState.round && studentState.round.phase === 'OPEN', 'P1');
  requireCheck('sync', 'revision_matches_open', teacherState.state_revision === studentState.state_revision, 'P1');
  requireCheck('room', 'participant_count_still_one', studentState.participant_count === 1, 'P1');
  assertNoSentenceAnswerLeak(studentState.game, 'student_open');
  assertNoSentenceAnswerLeak(teacherState.game, 'controller_open');

  const visibleTokenIds = Array.isArray(studentState.game && studentState.game.tokens)
    ? studentState.game.tokens.map(item => String(item && item.token_id || '')).filter(Boolean)
    : [];
  requireCheck('round', 'visible_token_ids_valid', visibleTokenIds.length >= 3 && new Set(visibleTokenIds).size === visibleTokenIds.length, 'P1');

  const submitRequestId = uniqueRequestId('submitAttempt');
  const submitSpec = {
    room_id: roomId,
    round_id: roundId,
    client_seen_revision: studentState.state_revision,
    request_id: submitRequestId,
    payload: { action_type: 'SUBMIT_ORDER', token_ids: visibleTokenIds },
  };
  const firstSubmit = expectV2Ok(await v2(studentToken, 'submitAttempt', submitSpec), 'submitAttempt');
  requireCheck('idempotency', 'first_submit_not_replayed', firstSubmit.data && firstSubmit.data.replayed === false, 'P1');
  const replaySubmit = expectV2Ok(await v2(studentToken, 'submitAttempt', submitSpec), 'submitAttempt_replay');
  requireCheck('idempotency', 'same_request_replayed', replaySubmit.data && replaySubmit.data.replayed === true, 'P1');

  studentState = await state(studentToken, roomId, 'STUDENT');
  teacherState = await state(teacherToken, roomId, 'CONTROLLER');
  requireCheck('attempt', 'student_has_submitted', studentState.game && studentState.game.has_submitted === true, 'P1');
  requireCheck('attempt', 'response_count_one', studentState.game && studentState.game.response_count === 1, 'P1');
  requireCheck('attempt', 'controller_response_count_one', teacherState.game && teacherState.game.response_count === 1, 'P1');
  assertNoSentenceAnswerLeak(studentState.game, 'student_after_submit_before_reveal');
  requireCheck('sync', 'revision_matches_after_submit', teacherState.state_revision === studentState.state_revision, 'P1');

  expectV2Ok(await v2(teacherToken, 'lockRound', {
    room_id: roomId,
    round_id: roundId,
    payload: { expected_revision: teacherState.state_revision },
  }), 'lockRound');
  teacherState = await state(teacherToken, roomId, 'CONTROLLER');
  requireCheck('round', 'round_locked', teacherState.round && teacherState.round.phase === 'LOCKED', 'P1');

  expectV2Ok(await v2(teacherToken, 'revealRound', {
    room_id: roomId,
    round_id: roundId,
    payload: { expected_revision: teacherState.state_revision },
  }), 'revealRound');
  teacherState = await state(teacherToken, roomId, 'CONTROLLER');
  studentState = await state(studentToken, roomId, 'STUDENT');
  requireCheck('round', 'round_reveal', studentState.round && studentState.round.phase === 'REVEAL', 'P1');
  requireCheck('privacy', 'answer_available_only_after_reveal', Boolean(studentState.game && studentState.game.answer_sentence && Array.isArray(studentState.game.answer_token_ids)), 'P1');
  requireCheck('score', 'viewer_result_available_after_reveal', Boolean(studentState.game && studentState.game.viewer_result), 'P1');
  requireCheck('score', 'visible_order_attempt_is_incorrect', studentState.game.viewer_result && studentState.game.viewer_result.is_correct === false, 'P1');
  requireCheck('score', 'zero_points_committed_for_wrong_attempt', studentState.game.viewer_result && studentState.game.viewer_result.points_awarded === 0 && studentState.player && studentState.player.score === 0, 'P1');
  requireCheck('ranking', 'leaderboard_contains_single_student', Array.isArray(studentState.leaderboard) && studentState.leaderboard.length === 1 && studentState.leaderboard[0].rank === 1 && studentState.leaderboard[0].score === 0, 'P1');
  requireCheck('sync', 'revision_matches_reveal', teacherState.state_revision === studentState.state_revision, 'P1');

  expectV2Ok(await v2(teacherToken, 'closeRound', {
    room_id: roomId,
    round_id: roundId,
    payload: { expected_revision: teacherState.state_revision, reason: 'QA_CS21A171_COMPLETE' },
  }), 'closeRound');
  teacherState = await state(teacherToken, roomId, 'CONTROLLER');
  requireCheck('persistence', 'round_closed_and_detached', teacherState.round === null && teacherState.room && teacherState.room.status === 'LIVE', 'P1');

  expectV2Ok(await v2(teacherToken, 'closeRoom', {
    room_id: roomId,
    payload: { expected_revision: teacherState.state_revision, reason: 'QA_CS21A171_COMPLETE' },
  }), 'closeRoom');
  teacherState = await state(teacherToken, roomId, 'CONTROLLER');
  studentState = await state(studentToken, roomId, 'STUDENT');
  requireCheck('persistence', 'teacher_sees_closed_room', teacherState.room && teacherState.room.status === 'CLOSED', 'P1');
  requireCheck('persistence', 'student_sees_closed_room', studentState.room && studentState.room.status === 'CLOSED', 'P1');
  requireCheck('persistence', 'participant_persists_after_close', studentState.participant_count === 1 && studentState.player && studentState.player.player_id, 'P1');
  requireCheck('sync', 'revision_matches_final', teacherState.state_revision === studentState.state_revision, 'P1');
} catch (error) {
  fatal = error;
  if (!findings.some(item => item.evidence === error.message)) {
    finding('P1', 'runtime', 'Flujo multiusuario interrumpido', String(error && error.message || 'unknown'));
  }
} finally {
  if (fatal) await safeCleanup();
}

const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
for (const item of findings) counts[item.severity] += 1;
if (cleanupAttempted) {
  record('cleanup', 'failed_run_room_cleanup', cleanupOk === true);
  if (cleanupOk === false) finding('P1', 'cleanup', 'No se pudo cerrar automáticamente la sala QA tras el fallo');
}
const verdict = counts.P0 || counts.P1 ? 'BLOQUEADO' : counts.P2 ? 'APTO CON RESERVAS' : 'APTO';
const report = {
  version: 'CS21A171',
  generated_at: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || 'local',
  mode: 'ENGLISH_LAB_MULTIUSER_STAGING_CONTROLLED_WRITES',
  verdict,
  counts,
  checks,
  findings,
  test_scope: {
    actors: ['teacher', 'student'],
    game: 'SENTENCE_ORDER',
    level,
    unit,
    participant_target: 1,
  },
  safety: [
    'La URL QA se compara contra APPS_SCRIPT_URL productiva y se rechaza si coincide.',
    `Se exige el marcador ${STAGING_MARKER} y writes_guarded=true antes de autenticar.`,
    `Se exige confirmación separada ${CONFIRMATION}.`,
    'No se serializan credenciales, tokens, códigos de estudiante ni código de sala.',
    'Si el flujo falla después de crear la sala, se intenta closeRoom de limpieza.',
  ],
};
fs.writeFileSync(path.join(outDir, 'english-lab-multiuser-report.json'), JSON.stringify(report, null, 2));
const markdown = [
  '# English LAB LIVE v2 · E2 multiusuario · CS21A171', '',
  `- Veredicto: **${verdict}**`,
  `- Checks: ${checks.length}`,
  `- Hallazgos: P0 ${counts.P0} · P1 ${counts.P1} · P2 ${counts.P2} · P3 ${counts.P3}`,
  `- Juego: SENTENCE_ORDER · ${level} · U${unit}`, '',
  '## Checks', '',
  ...checks.map(item => `- ${item.ok ? 'OK' : 'FALLÓ'} · ${item.area} · ${item.name}`), '',
  '## Hallazgos', '',
  ...(findings.length ? findings.map(item => `- **${item.severity} · ${item.area} · ${item.title}**`) : ['No se detectaron hallazgos.']), '',
  '## Seguridad', '',
  ...report.safety.map(item => `- ${item}`), '',
].join('\n');
fs.writeFileSync(path.join(outDir, 'english-lab-multiuser-report.md'), markdown);
console.log(`ENGLISH LAB MULTIUSER CS21A171: ${verdict}; checks=${checks.length}; P0=${counts.P0}; P1=${counts.P1}`);
if (counts.P0 || counts.P1) process.exit(1);
