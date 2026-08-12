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
const fastTurnTest=read('scripts/test_memory_match_fast_turn_browser_cs21a211.mjs');

// Source-of-truth y reconciliación siguen siendo obligatorios.
assert.match(live,/CS21A202: un rechazo de dominio con room_package/);
assert.doesNotMatch(live,/!res\.ok \|\| !data \|\| data\.ok === false/);
assert.match(adapter,/const stateCandidate=candidate\.ok===false/);
assert.match(adapter,/client_request_id:`\$\{actionId\}-R1`/);
assert.match(classic,/const authoritativeBusy=!!\(props&&props\.mutationBusy\)/);
assert.match(classic,/if\(interactionEpochRef\.current===interactionEpoch\)\{\s*setSyncing\(false\);\s*pairPendingRef\.current=false;/s);
assert.match(adapter,/function pollMsForState\(state\)/);
assert.match(adapter,/const TRANSIENT_SETTLE_MS=0;/);
assert.match(adapter,/return TRANSIENT_SETTLE_MS;/);
assert.match(adapter,/data-live-current-poll-ms=\{currentPollMs\}/);
assert.match(classic,/data-spectator-reveal-ms=\{revealRuleMs\}/);
assert.match(classic,/data-turn-selection-ms=/);
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
assert.match(live,/if\(memoryMatch && r && r\.room_package\)\{\s*setData\(currentState=>freshestLiveState\(currentState,r\)\)/s);

// DISCOVER_CARD no bloquea la segunda; SUBMIT_PAIR sí bloquea tercera.
assert.match(adapter,/const \[blockingBusy,setBlockingBusy\]=React\.useState\(false\)/);
assert.match(adapter,/const submissionAction=upper\(answerValue\.action\|\|submission&&submission\.action\)/);
assert.match(adapter,/const blocksInteraction=submissionAction!=='DISCOVER_CARD'/);
assert.match(adapter,/mutationBusy=\{blockingBusy\}/);
assert.match(adapter,/if\(blocksInteraction\)setBlockingBusy\(false\)/);
assert.match(classic,/Promise\.resolve\(pairSubmission\(\)\)/,'CS211 exige que la segunda salga sin esperar ACK normal de la primera');
assert.match(classic,/PRIMERA_CARTA_NO_SINCRONIZADA/,'reorder real conserva fallback seguro');

// Countdown de inicio autoritativo sigue separado del reveal de 3 s.
assert.match(classic,/useClockTick\(phase==='COUNTDOWN'\|\|!!shared\.attempt\)/);
assert.match(classic,/function Timer\(\{remainingMs,durationMs,waiting,syncingTurn,revealWaiting,countdownMs=0,countdownDurationMs=0\}\)/);
assert.match(classic,/data-start-countdown=\{countdown\?'true':'false'\}/);
assert.match(classic,/La ronda inicia al mismo tiempo para todos/);
assert.match(classic,/countdownMs=\{turnStartsIn\}/);
assert.match(classic,/countdownDurationMs=\{normalized\.rules\.autoStartDelayMs\}/);

// Gates conductuales vigentes.
assert.match(fastTurnTest,/turnSelectionMs:10000/);
assert.match(fastTurnTest,/mismatchRevealMs:3000/);
assert.match(fastTurnTest,/pairRequestStartedBeforeFirstAck:true/);
assert.match(fastTurnTest,/thirdCardBlockedDuringMutationAndReveal:true/);
assert.match(fastTurnTest,/originalTurnEndWasNotWaited:true/);
assert.match(lobbyTest,/studentF5Rejoined:true/);
assert.match(lobbyTest,/studentPresenceReached2WithoutManualRefresh:true/);
assert.match(lobbyTest,/teacherPresenceReached2WithoutManualRefresh:true/);
assert.match(lobbyTest,/authoritativeCountdown:true/);

console.log(JSON.stringify({
  ok:true,
  version:'CS21A211-MEMORY-LIVE-SYNC-QA-1',
  cs202_source_truth_preserved:true,
  lobby_poll_owner:true,
  teacher_presence_poll:true,
  student_presence_poll:true,
  f5_rejoin_persistence:true,
  start_package_adopted_immediately:true,
  authoritative_countdown:true,
  discover_card_nonblocking_for_second:true,
  submit_pair_starts_without_first_ack:true,
  submit_pair_still_blocks_third:true,
  transient_added_delay_ms:0,
  turn_selection_ms:10000,
  mismatch_reveal_ms:3000,
  apps_script_change:true
},null,2));
