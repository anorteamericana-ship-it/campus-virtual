/**
 * English LAB LIVE v2 · core contracts.
 * Isolated E1 source: no router integration, no storage writes, no deployment hooks.
 */
var ELV2_API_VERSION = 'english_lab_live.v2';
var ELV2_SERVICE_VERSION = '0.1.0-dev';
var ELV2_SCHEMA_VERSION = '2.0.0';

var ELV2_ROOM_STATUS = Object.freeze({
  LOBBY: 'LOBBY',
  LIVE: 'LIVE',
  CLOSED: 'CLOSED'
});

var ELV2_ROUND_STATUS = Object.freeze({
  READY: 'READY',
  OPEN: 'OPEN',
  LOCKED: 'LOCKED',
  REVEAL: 'REVEAL',
  CLOSED: 'CLOSED'
});

var ELV2_VIEW_MODE = Object.freeze({
  STUDENT: 'STUDENT',
  CONTROLLER: 'CONTROLLER',
  PROJECTOR: 'PROJECTOR'
});

var ELV2_CAPABILITY = Object.freeze({
  LIVE_VIEW: 'LIVE_VIEW',
  LIVE_JOIN: 'LIVE_JOIN',
  LIVE_PLAY: 'LIVE_PLAY',
  LIVE_CREATE: 'LIVE_CREATE',
  LIVE_CONTROL_OWN: 'LIVE_CONTROL_OWN',
  LIVE_CONTROL_ANY: 'LIVE_CONTROL_ANY'
});

var ELV2_VISIBILITY_MODEL = Object.freeze({
  PRIVATE_RESPONSE: 'PRIVATE_RESPONSE',
  SHARED_BOARD: 'SHARED_BOARD'
});

var ELV2_SCORING_POLICY = Object.freeze({
  SCORE_ON_REVEAL: 'SCORE_ON_REVEAL',
  SCORE_IMMEDIATE_PUBLIC: 'SCORE_IMMEDIATE_PUBLIC',
  SCORE_ON_CLOSE: 'SCORE_ON_CLOSE'
});

var ELV2_SUBMISSION_POLICY = Object.freeze({
  SINGLE_FINAL: 'SINGLE_FINAL',
  MULTI_ACTION: 'MULTI_ACTION'
});

var ELV2_ERROR_CODE = Object.freeze({
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  ROOM_NOT_AVAILABLE: 'ROOM_NOT_AVAILABLE',
  ROOM_CLOSED: 'ROOM_CLOSED',
  ROUND_NOT_OPEN: 'ROUND_NOT_OPEN',
  DEADLINE_PASSED: 'DEADLINE_PASSED',
  STATE_CHANGED: 'STATE_CHANGED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_RESERVED_FIELD: 'INVALID_RESERVED_FIELD',
  REQUEST_ID_CONFLICT: 'REQUEST_ID_CONFLICT',
  GAME_NOT_AVAILABLE: 'GAME_NOT_AVAILABLE',
  CONTENT_INVALID: 'CONTENT_INVALID',
  CONTENT_NOT_COMPATIBLE: 'CONTENT_NOT_COMPATIBLE',
  SCHEMA_UNHEALTHY: 'SCHEMA_UNHEALTHY',
  STATE_INTEGRITY_FAILED: 'STATE_INTEGRITY_FAILED',
  SCORE_INTEGRITY_FAILED: 'SCORE_INTEGRITY_FAILED',
  PUBLIC_VIEW_SCHEMA_VIOLATION: 'PUBLIC_VIEW_SCHEMA_VIOLATION',
  ANSWER_LEAK_BLOCKED: 'ANSWER_LEAK_BLOCKED',
  BUSY_RETRY: 'BUSY_RETRY',
  ALREADY_SUBMITTED: 'ALREADY_SUBMITTED',
  ALREADY_GUESSED: 'ALREADY_GUESSED',
  ALREADY_CLAIMED: 'ALREADY_CLAIMED',
  INVALID_SELECTION: 'INVALID_SELECTION'
});

var ELV2_MUTATING_ACTIONS = Object.freeze([
  'createRoom',
  'joinRoom',
  'startRoom',
  'prepareRound',
  'openRound',
  'lockRound',
  'revealRound',
  'submitAttempt',
  'closeRound',
  'closeRoom'
]);

var ELV2_RESERVED_PAYLOAD_FIELDS = Object.freeze([
  'student_id',
  'teacher_id',
  'user_id',
  'role',
  'capabilities',
  'points',
  'points_delta',
  'score',
  'score_total',
  'is_correct',
  'correct',
  'correct_answer',
  'answer_key',
  'solution',
  'private_state',
  'private_result',
  'opened_at',
  'ends_at',
  'state_revision_authoritative',
  '__proto__',
  'constructor',
  'prototype'
]);
