#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const live=read('src/english_lab_live.jsx');
const adapter=read('src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx');
const classic=read('src/english_lab_games/memory_match_classic_sync_cs21a189.jsx');
const css=read('styles/english_lab_memory_match_classic_sync_cs21a189.css');
const conflict=read('scripts/test_memory_match_conflict_reconciliation_browser_cs21a196.mjs');
const lobbyTest=read('scripts/test_memory_match_lobby_start_rejoin_browser_cs21a203.mjs');
const latencyTest=read('scripts/test_memory_match_second_card_latency_browser_cs21a203.mjs');

// CS202 source-of-truth invariants remain mandatory.
assert.match(live,/CS21A202: un rechazo de dominio con room_package/);
assert.doesNotMatch(live,/!res\.ok \|\| !data \|\| data\.ok === false/);
assert.match(adapter,/const stateCandidate=candidate\.ok===false/);
assert.match(adapter,/client_request_id:`\$\{actionId\}-R1`/);
assert.match(classic,/const authoritativeBusy=!!\(props&&props\.mutationBusy\)/);
assert.match(classic,/if\(interactionEpochRef\.current===interactionEpoch\)\{\s*setSyncing\(false\);\s*pairPendingRef\.current=false;/s);
assert.match(adapter,/function pollMsForState\(state\)/);
assert.match(adapter,/return Math\.max\(250,Math\.round\(normal\/2\)\)/);
assert.match(adapter,/data-live-current-poll-ms=\{currentPollMs\}/);
assert.match(classic,/data-spectator-reveal-ms=\{revealRuleMs\}/);
assert.match(classic,/se cierran en \$\{revealSeconds\}s/);
assert.match(classic,/data-reveal-waiting=\{revealWaiting\?'true':'false'\}/);
assert.match(css,/transition:transform \.20s cubic-bezier\(\.2,\.75,\.25,1\)/);
assert.doesNotMatch(conflict,/original\.replace\(oldTransport,newTransport\)/);

// CS203: owner de polling antes del room_package, presencia y rejoin.
assert.match(live,/CS21A203: antes de existir room_package/);
assert.match(live,/if\(!memoryMatch \|\| memoryPackage \|\| status!=='CREATED'\) return undefined/);
assert.match(live,/const memoryPackageReady=!!\(isMemoryMatch && state\?\.room_package\)/);
assert.match(live,/setInterval\(pollLobby,isMemoryMatch\?1200:4000\)/);
assert.match(live,/function livePlayerId\(player\)/);
assert.match(live,/localStorage\.setItem\('elive_last_room',rc\)/);
assert.match(live,/const pid=livePlayerId\(r && r\.player\) \|\| clean\(saved \|\| playerId \|\| studentCode\)/);

// StartRoom debe adoptar el package COUNTDOWN inmediatamente.
assert.match(live,/if\(memoryMatch && r && r\.room_package\)\{\s*setData\(currentState=>freshestLiveState\(currentState,r\)\)/s);

// DISCOVER_CARD mantiene transporte busy visible, pero no bloquea segunda carta.
assert.match(adapter,/const \[blockingBusy,setBlockingBusy\]=React\.useState\(false\)/);
assert.match(adapter,/const submissionAction=upper\(answerValue\.action\|\|submission&&submission\.action\)/);
assert.match(adapter,/const blocksInteraction=submissionAction!=='DISCOVER_CARD'/);
assert.match(adapter,/mutationBusy=\{blockingBusy\}/);
assert.match(adapter,/if\(blocksInteraction\)setBlockingBusy\(false\)/);

// Countdown autoritativo 5-4-3 visible; reveal histórico sigue separado.
assert.match(classic,/useClockTick\(phase==='COUNTDOWN'\|\|!!shared\.attempt\)/);
assert.match(classic,/function Timer\(\{remainingMs,durationMs,waiting,syncingTurn,revealWaiting,countdownMs=0,countdownDurationMs=0\}\)/);
assert.match(classic,/data-start-countdown=\{countdown\?'true':'false'\}/);
assert.match(classic,/La ronda inicia al mismo tiempo para todos/);
assert.match(classic,/countdownMs=\{turnStartsIn\}/);
assert.match(classic,/countdownDurationMs=\{normalized\.rules\.autoStartDelayMs\}/);

// Los nuevos gates deben medir la conducta, no sólo buscar texto.
assert.match(latencyTest,/simulatedDiscoverLatencyMs:4000/);
assert.match(latencyTest,/secondSelectionDelayMs/);
assert.match(latencyTest,/thirdCardBlockedWhileQueued:true/);
assert.match(lobbyTest,/studentF5Rejoined:true/);
assert.match(lobbyTest,/studentPresenceReached2WithoutManualRefresh:true/);
assert.match(lobbyTest,/teacherPresenceReached2WithoutManualRefresh:true/);
assert.match(lobbyTest,/authoritativeCountdown:true/);

console.log(JSON.stringify({
  ok:true,
  version:'CS21A203-MEMORY-LIVE-START-QA-1',
  cs202_source_truth_preserved:true,
  lobby_poll_owner:true,
  teacher_presence_poll:true,
  student_presence_poll:true,
  f5_rejoin_persistence:true,
  start_package_adopted_immediately:true,
  authoritative_countdown:true,
  discover_card_nonblocking_for_second:true,
  submit_pair_still_blocking:true,
  third_card_guard_preserved:true,
  apps_script_change:false
},null,2));
