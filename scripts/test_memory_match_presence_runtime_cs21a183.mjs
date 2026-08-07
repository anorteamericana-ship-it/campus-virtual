#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('apps_script_patches/99D_FIX_MEMORY_MATCH_START_QA_CS21A183.gs', 'utf8');
const now = Date.parse('2026-08-07T03:30:00.000Z');

const context = {
  console,
  Date,
  JSON,
  Math,
  Number,
  String,
  Array,
  Object,
  isFinite,
};
vm.createContext(context);
vm.runInContext(source, context, {filename:'99D_FIX_MEMORY_MATCH_START_QA_CS21A183.gs'});

context.ELIVE_PLAYERS_SHEET = 'ENGLISH_LAB_LIVE_PLAYERS';
context.ELIVE_PLAYERS_HEADERS = [];
context._elive176Text_ = value => String(value == null ? '' : value).trim();
context._elive176Upper_ = value => context._elive176Text_(value).toUpperCase();
context._elive176Timestamp_ = value => {
  if (value instanceof Date) return value.getTime();
  const parsed = Date.parse(context._elive176Text_(value));
  return Number.isFinite(parsed) ? parsed : 0;
};
context._elive180PlayerPublic_ = row => ({cod_estudiante:row.COD_ESTUDIANTE, nombre:row.NOMBRE});
context._elive180Teams_ = rows => rows.length ? [{team_id:'Equipo Azul', members:rows.length}] : [];

const room = {ROOM_ID:'ROOM-1', ROOM_CODE:'LAB-TEST'};
let rows = [];
context._elive180Table_ = () => ({rows});

function row(code, ageSeconds, status='ACTIVE', useJoined=false) {
  const seen = new Date(now - ageSeconds * 1000).toISOString();
  return {
    ROOM_ID:'ROOM-1',
    ROOM_CODE:'LAB-TEST',
    COD_ESTUDIANTE:code,
    NOMBRE:code,
    STATUS:status,
    LAST_SEEN_AT:useJoined ? '' : seen,
    JOINED_AT:seen,
    TEAM:'',
    _row:2,
  };
}

rows = [
  row('P59', 59),
  row('P60', 60),
  row('P61', 61),
  row('LEFT', 1, 'LEFT'),
  row('INACTIVE', 1, 'INACTIVE'),
  row('JOINED_FALLBACK', 30, 'ACTIVE', true),
  {...row('OTHER_ROOM', 1), ROOM_ID:'ROOM-2', ROOM_CODE:'LAB-OTHER'},
];

const present = context._cs21a183MmPresenceRows_(room, now);
const ids = present.map(item => item.COD_ESTUDIANTE).sort();
assert.deepEqual(ids, ['JOINED_FALLBACK','P59','P60']);
assert.equal(context.CS21A183_MM_PRESENCE_TTL_MS, 60000);

const response = context._cs21a183MmPresenceResponse_({ok:true, stats:{}}, room);
assert.equal(response.stats.players_registered, 6, 'registrados conserva historial de la sala, incluso stale/LEFT');
assert.equal(response.stats.players_online, 3, 'online debe contar solo presencia reciente y activa');
assert.equal(response.stats.players, 3, 'contador visible debe usar presencia online');
assert.equal(response.presence_ttl_seconds, 60);
assert.equal(response.presence_version, 'CS21A183-MM-START-FIX3');
assert.equal(response.online_players.length, 3);

rows = [row('PRESENT', 5), row('STALE', 75)];
const afterClose = context._cs21a183MmPresenceRows_(room, now);
assert.deepEqual(afterClose.map(item => item.COD_ESTUDIANTE), ['PRESENT']);

console.log(JSON.stringify({
  ok:true,
  contract:'CS21A183_MEMORY_MATCH_REAL_PRESENCE_RUNTIME',
  ttl_seconds:60,
  boundary_59s:true,
  boundary_60s:true,
  stale_61s_excluded:true,
  left_excluded:true,
  inactive_excluded:true,
  joined_fallback:true,
  registered_vs_online:true,
}, null, 2));
