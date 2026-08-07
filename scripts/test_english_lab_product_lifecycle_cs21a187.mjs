#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function read(file){ return fs.readFileSync(file,'utf8'); }

const guard = read('src/english_lab_live_product_guard_cs21a187.js');
assert.match(guard,/F98\.4-Z6-CS21A187/);
assert.match(guard,/english_lab_runtime_cs21a173\.js\?v=CS21A187/);
assert.match(guard,/memory_match_engine_cs21a173\.jsx\?v=CS21A187/);
assert.match(guard,/currentLoadOne\.__cs21a184StudentDependencies/);
assert.match(guard,/clearLastRoom\(\)/);
assert.match(guard,/an:english-lab-detach-room/);
assert.match(guard,/ROOM_CLOSED/);
assert.match(guard,/CHANGE_ROOM/);
assert.match(guard,/MAX_MEMORY_PAIRS = 6/);
assert.match(guard,/option\.remove\(\)/);
assert.match(guard,/history\.replaceState/);

const runtimeSource = read('src/english_lab_games/english_lab_runtime_cs21a173.js');
const fixedNow = Date.parse('2026-08-07T22:00:00.000Z');
const context = {Date:class extends Date {
  constructor(...args){ super(...(args.length ? args : [fixedNow])); }
  static now(){ return fixedNow; }
  static parse(value){ return Date.parse(value); }
}, console};
context.window = context;
vm.createContext(context);
vm.runInContext(runtimeSource,context);
const runtime = context.EnglishLabRuntimeCS21A173;
assert.ok(runtime);
assert.equal(runtime.CLOCK_FIX_VERSION,'CS21A186-MEMORY-CLOCK-FIX1');
const normalized = runtime.normalizeRoomPackage({
  received_at_ms: fixedNow - 10*60*1000,
  server_now:'2026-08-07T22:00:00.000Z',
  client_received_at_ms:fixedNow,
  room:{room_code:'LAB-TEST',game_id:'MEMORY_MATCH',mode:'TEAMS',level_id:'B1'},
  round:{round_id:'LAB-TEST-R1',cards:[]},
  state:{phase:'OPEN',started_at:'2026-08-07T22:00:00.000Z',ends_at:'2026-08-07T22:00:30.000Z'},
  rules:{round_duration_ms:30000}
});
assert.equal(normalized.clock.remainingMs('2026-08-07T22:00:30.000Z',fixedNow),30000,'un received_at_ms histórico no puede convertir un turno nuevo en 0s');

const engine = read('src/english_lab_games/memory_match_engine_cs21a173.jsx');
assert.match(engine,/const canPlay = phase === 'OPEN' && isMyTurn && !locked && remainingMs > 0/);
assert.match(engine,/onClick=\{\(\) => onFlip\(card\)\}/);
assert.match(engine,/setOpenIds\(next\)/);
assert.match(engine,/if \(next\.length < 2\)/);

const backend = read('apps_script_patches/99H_FIX_ENGLISH_LAB_LIFECYCLE_QA_CS21A187.gs');
assert.match(backend,/CS21A187-LIVE-LIFECYCLE-FIX1/);
assert.match(backend,/response\.rooms = _cs21a187RecentRooms_/);
assert.match(backend,/memory_match_pair_options = \[3,4,6\]/);
assert.match(backend,/memory_match_pair_count_exceeds_available/);
assert.match(backend,/pair_count_8_blocked_before_room_creation:true/);

const patcher = read('scripts/patch_qa_package_cs21a187.mjs');
assert.match(patcher,/english_lab_live_product_guard_cs21a187\.js\?v=F98\.4Z6CS21A187/);
assert.match(patcher,/MEMORY_MATCH_CACHE_EPOCH=CS21A187/);

console.log(JSON.stringify({
  ok:true,
  version:'CS21A187',
  stale_cache_blocked:true,
  stale_room_restore_blocked:true,
  closed_room_auto_exit:true,
  timer_30s_from_fresh_receive:true,
  card_click_contract:true,
  recent_rooms:true,
  max_memory_pairs:6
},null,2));
