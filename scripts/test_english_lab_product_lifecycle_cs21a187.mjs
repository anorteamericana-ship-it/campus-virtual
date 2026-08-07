#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function read(file){ return fs.readFileSync(file,'utf8'); }

// El lifecycle nació en CS21A187, pero CS21A188 eleva el cache epoch y el product
// guard sin perder ninguna de sus garantías. Este test acumulativo debe exigir la
// versión vigente y, al mismo tiempo, conservar explícitamente el contrato CS187.
const guard = read('src/english_lab_live_product_guard_cs21a187.js');
assert.match(guard,/F98\.4-Z6-CS21A188/);
assert.match(guard,/english_lab_runtime_cs21a173\.js\?v=CS21A188/);
assert.match(guard,/memory_match_engine_cs21a173\.jsx\?v=CS21A188/);
assert.match(guard,/memory_match_shared_discovery_cs21a188\.jsx\?v=CS21A188/);
assert.match(guard,/english_lab_live_memory_match_adapter_cs21a174\.jsx\?v=CS21A188/);
assert.match(guard,/currentLoadOne\.__cs21a184StudentDependencies/);
assert.match(guard,/clearLastRoom\(\)/);
assert.match(guard,/clearInitialResidue\(\)/);
assert.match(guard,/an:english-lab-detach-room/);
assert.match(guard,/an:english-lab-room-active/);
assert.match(guard,/ROOM_CLOSED/);
assert.match(guard,/CHANGE_ROOM/);
assert.match(guard,/MAX_MEMORY_PAIRS = 6/);
assert.match(guard,/option\.remove\(\)/);
assert.match(guard,/history\.replaceState/);
assert.match(guard,/global\.__ENGLISH_LAB_PRODUCT_GUARD_CS21A188__/);
assert.match(guard,/global\.__ENGLISH_LAB_PRODUCT_GUARD_CS21A187__/,'CS21A188 debe conservar alias lifecycle CS21A187.');

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

// Conservamos verificadas las primitivas del motor base, aunque CS21A188 sustituya
// la vista final por Shared Discovery antes de montar el adaptador Live.
const engine = read('src/english_lab_games/memory_match_engine_cs21a173.jsx');
assert.match(engine,/const canPlay = phase === 'OPEN' && isMyTurn && !locked && remainingMs > 0/);
assert.match(engine,/onClick=\{\(\) => onFlip\(card\)\}/);
assert.match(engine,/setOpenIds\(next\)/);
assert.match(engine,/if \(next\.length < 2\)/);

const shared = read('src/english_lab_games/memory_match_shared_discovery_cs21a188.jsx');
assert.match(shared,/HIDDEN/);
assert.match(shared,/DISCOVERED/);
assert.match(shared,/CLAIMED/);
assert.match(shared,/Descubierta por/);
assert.match(shared,/MemoryMatchGameCS21A173=MemoryMatchSharedDiscoveryCS21A188/);

const backend = read('apps_script_patches/99H_FIX_ENGLISH_LAB_LIFECYCLE_QA_CS21A187.gs');
assert.match(backend,/CS21A187-LIVE-LIFECYCLE-FIX1/);
assert.match(backend,/response\.rooms = _cs21a187RecentRooms_/);
assert.match(backend,/memory_match_pair_options = \[3,4,6\]/);
assert.match(backend,/memory_match_pair_count_exceeds_available/);
assert.match(backend,/pair_count_8_blocked_before_room_creation:true/);

const patcher = read('scripts/patch_qa_package_cs21a187.mjs');
assert.match(patcher,/english_lab_live_product_guard_cs21a187\.js\?v=F98\.4Z6CS21A188/);
assert.match(patcher,/MEMORY_MATCH_CACHE_EPOCH=CS21A188/);
assert.match(patcher,/ENGLISH_LAB_CLOSED_ROOM_AUTO_EXIT=true/);
assert.match(patcher,/ENGLISH_LAB_NO_STALE_ROOM_RESTORE=true/);
assert.match(patcher,/MEMORY_MATCH_SHARED_DISCOVERY=HIDDEN>DISCOVERED>CLAIMED/);

console.log(JSON.stringify({
  ok:true,
  version:'CS21A188',
  preserves_lifecycle_version:'CS21A187-LIVE-LIFECYCLE-FIX1',
  stale_cache_blocked:true,
  stale_room_restore_blocked:true,
  closed_room_auto_exit:true,
  timer_30s_from_fresh_receive:true,
  card_click_contract:true,
  recent_rooms:true,
  max_memory_pairs:6,
  shared_discovery_layered_on_lifecycle:true
},null,2));
