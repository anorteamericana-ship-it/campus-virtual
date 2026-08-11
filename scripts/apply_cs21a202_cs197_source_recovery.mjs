#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const write=(relative,content)=>fs.writeFileSync(path.join(root,relative),content,'utf8');
function replaceExact(relative,oldText,newText,label){
  const source=read(relative);
  if(source.includes(newText)){console.log(`SKIP ${label}: ya aplicado`);return false;}
  assert.ok(source.includes(oldText),`No se encontró ${label} en ${relative}`);
  write(relative,source.replace(oldText,newText));
  console.log(`PATCH ${label}: ${relative}`);
  return true;
}
let changed=false;

const adapter='src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx';
changed=replaceExact(adapter,
`  function pollBackoffMs(baseMs,failures){`,
`  function transientAttemptPhase(state){
    const source=state&&typeof state==='object'?state:{};
    const pkg=packageFrom(source)||{};
    const attempt=pkg.shared_state&&pkg.shared_state.active_attempt||source.shared_state&&source.shared_state.active_attempt||null;
    return upper(attempt&&attempt.phase);
  }
  function pollMsForState(state){
    const source=state&&typeof state==='object'?state:{};
    const normal=pollMsForPlayers(base.participantCount(source,packageFrom(source)));
    const phase=transientAttemptPhase(source);
    if(phase==='FIRST_REVEALED'||phase==='MISMATCH_REVEAL') return Math.max(250,Math.round(normal/2));
    return normal;
  }
  function pollBackoffMs(baseMs,failures){`,'CS197 transient poll helper')||changed;
changed=replaceExact(adapter,
`      function delayForCurrent(){const current=stateRef.current||{};return pollMsForPlayers(base.participantCount(current,packageFrom(current)));}`,
`      function delayForCurrent(){const current=stateRef.current||{};return pollMsForState(current);}`,'CS197 transient poll scheduling')||changed;
changed=replaceExact(adapter,
`    const pollMs=pollMsForPlayers(playersOnline);`,
`    const pollMs=pollMsForPlayers(playersOnline);
    const currentPollMs=pollMsForState(state);`,'CS197 current poll metric')||changed;
changed=replaceExact(adapter,
`      data-live-poll-ms={pollMs}
      data-live-poll-timeout-ms={POLL_TIMEOUT_MS}`,
`      data-live-poll-ms={pollMs}
      data-live-current-poll-ms={currentPollMs}
      data-live-poll-timeout-ms={POLL_TIMEOUT_MS}`,'CS197 current poll data attribute')||changed;
changed=replaceExact(adapter,
`    livePollMsForPlayers:pollMsForPlayers,
    pollBackoffMs,`,
`    livePollMsForPlayers:pollMsForPlayers,
    livePollMsForState:pollMsForState,
    pollBackoffMs,`,'CS197 poll state API')||changed;

const classic='src/english_lab_games/memory_match_classic_sync_cs21a189.jsx';
changed=replaceExact(classic,
`    const transitionText=waitingForFlipback ? 'No coinciden · memorízalas antes de que se cierren' : '';`,
`    const revealSeconds=waitingForFlipback?Math.max(1,Math.ceil(Number(reveal.remainingMs||0)/1000)):0;
    const revealRuleMs=Math.max(1,Number(packageInput&&packageInput.rules&&(packageInput.rules.spectator_reveal_ms||packageInput.rules.mismatch_reveal_ms)||8500)||8500);
    const timerRemainingMs=waitingForFlipback?Math.max(0,Number(reveal.remainingMs||0)):remainingMs;
    const timerDurationMs=waitingForFlipback?revealRuleMs:normalized.rules.roundDurationMs;
    const transitionText=waitingForFlipback ? \`No coinciden · memorízalas · se cierran en \${revealSeconds}s\` : '';`,'CS197 readable reveal countdown')||changed;
changed=replaceExact(classic,
`      <Timer remainingMs={remainingMs} durationMs={normalized.rules.roundDurationMs} waiting={waitingForFlipback || turnStartsIn>0} syncingTurn={syncingTurn}/>`,
`      <Timer remainingMs={timerRemainingMs} durationMs={timerDurationMs} waiting={waitingForFlipback || turnStartsIn>0} syncingTurn={syncingTurn}/>`,'CS197 reveal timer source')||changed;
changed=replaceExact(classic,
`    return <section className="elmm-shell elmm-classic-sync" data-game-engine="MEMORY_MATCH" data-classic-sync="true" data-version={VERSION} data-latency-safe-version={LATENCY_SAFE_VERSION}>`,
`    return <section className="elmm-shell elmm-classic-sync" data-game-engine="MEMORY_MATCH" data-classic-sync="true" data-version={VERSION} data-latency-safe-version={LATENCY_SAFE_VERSION} data-spectator-reveal-ms={revealRuleMs}>`,'CS197 spectator reveal data')||changed;

const css='styles/english_lab_memory_match_classic_sync_cs21a189.css';
let cssSource=read(css);
const cssMarker='/* CS21A202 recovery · CS21A197 giro visual rápido. */';
if(!cssSource.includes(cssMarker)){
  cssSource=cssSource.replace(/\s*$/,'')+`\n${cssMarker}\n.elmm-classic-sync .elmm-card-inner{transition:transform .20s cubic-bezier(.2,.75,.25,1)}\n`;
  write(css,cssSource);
  changed=true;
  console.log(`PATCH CS197 card flip 200ms: ${css}`);
}

const adapterSource=read(adapter),classicSource=read(classic),finalCss=read(css);
assert.match(adapterSource,/function pollMsForState\(state\)/);
assert.match(adapterSource,/return Math\.max\(250,Math\.round\(normal\/2\)\)/);
assert.match(adapterSource,/data-live-current-poll-ms=\{currentPollMs\}/);
assert.match(adapterSource,/livePollMsForState:pollMsForState/);
assert.match(classicSource,/data-spectator-reveal-ms=\{revealRuleMs\}/);
assert.match(classicSource,/se cierran en \$\{revealSeconds\}s/);
assert.match(classicSource,/remainingMs=\{timerRemainingMs\}/);
assert.match(finalCss,/transition:transform \.20s cubic-bezier\(\.2,\.75,\.25,1\)/);
console.log(JSON.stringify({ok:true,version:'CS21A202-CS197-SOURCE-RECOVERY-1',changed,transient_poll_floor_ms:250,spectator_reveal_ms:8500,flip_animation_ms:200},null,2));
