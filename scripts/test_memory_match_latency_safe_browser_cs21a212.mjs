#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  baseUrl,endpointAndBody,fulfillJson,launchBrowser,responseFor,wait,writeEvidence,
} from './memory_match_cs21a192_browser_fixture.mjs';

function actionFrom(body){
  return String(body&&(body.action||body.answer_value&&body.answer_value.action)||'').trim().toUpperCase();
}

async function runScenario(browser,{name,backendDelayMs,mode}){
  let actorContext=null;
  let spectatorContext=null;
  const errors=[];
  const requests=[];
  const pollAgeMs=2200;
  const scenarioStartedAt=Date.now();
  let turnStartedAt=scenarioStartedAt-pollAgeMs;
  let turnEndsAt=turnStartedAt+15000;
  const originalInitialEnd=turnEndsAt;
  let revision=1;
  let boardVersion=1;
  let turnNumber=1;
  let activePlayer='P1';
  let attempt=null;
  let matchedPairs=[];
  let claimedPairs={};
  let timeoutCount=0;
  let discoverRequestAt=0;
  let serverRevealAt=0;
  let secondClickAt=0;
  let pairRequestAt=0;
  let pairServerAcceptedAt=0;
  let revealUntil=0;
  let nextTurnObservedAt=0;
  let resolveDiscover;
  const discoverCommitted=new Promise(resolve=>{resolveDiscover=resolve;});

  function fastResponse(viewer){
    const out=responseFor({viewer,revision,boardVersion,turnNumber,activePlayer,attempt,turnStartedAt,turnEndsAt,serverNow:Date.now()});
    const rules={
      round_duration_ms:15000,
      turn_selection_ms:15000,
      first_reveal_min_second_ms:15000,
      reveal_duration_ms:3000,
      mismatch_reveal_ms:3000,
      spectator_reveal_ms:3000,
      pair_reveal_ms:3000,
      auto_start_delay_ms:0,
      team_size:1,
      fast_turn_version:'CS21A212-MM-LATENCY-SAFE-15S-ACK-1',
      latency_safe_version:'CS21A212-MM-LATENCY-SAFE-15S-ACK-1',
    };
    out.room_package.rules=rules;
    out.room_package.shared_state.matched_pair_ids=matchedPairs.slice();
    out.room_package.shared_state.claimed_pairs={...claimedPairs};
    out.shared_state.matched_pair_ids=matchedPairs.slice();
    out.shared_state.claimed_pairs={...claimedPairs};
    return out;
  }

  function rotateTimeout(now){
    timeoutCount+=1;
    revision+=1;boardVersion+=1;turnNumber+=1;activePlayer='P2';attempt=null;
    turnStartedAt=now;turnEndsAt=now+15000;
  }

  function maybeAdvance(){
    const now=Date.now();
    if(attempt&&String(attempt.phase)==='FIRST_REVEALED'){
      const revealed=Date.parse(attempt.revealed_at||'')||0;
      const attemptEnd=Date.parse(attempt.turn_ends_at||'')||0;
      const effectiveEnd=Math.max(turnEndsAt||0,attemptEnd||0,revealed?revealed+15000:0);
      if(now>=effectiveEnd) rotateTimeout(now);
      return;
    }
    if(attempt&&String(attempt.phase)==='MISMATCH_REVEAL'){
      const until=Date.parse(attempt.reveal_until||'')||0;
      if(until&&now>=until){
        revision+=1;boardVersion+=1;turnNumber+=1;activePlayer='P2';attempt=null;
        turnStartedAt=until;turnEndsAt=until+15000;
        if(!nextTurnObservedAt)nextTurnObservedAt=now;
      }
      return;
    }
    if(now>=turnEndsAt) rotateTimeout(now);
  }

  async function routeHandler(route){
    const {endpoint,body}=endpointAndBody(route);
    const viewer=endpoint==='englishLabMemoryMatchGetRoomControl'?'teacher':String(body.player_id||body.cod_estudiante||'P1');
    if(endpoint==='englishLabMemoryMatchGetPlayerState'||endpoint==='englishLabMemoryMatchGetRoomControl'){
      maybeAdvance();
      await fulfillJson(route,fastResponse(viewer));
      return;
    }
    assert.equal(endpoint,'englishLabMemoryMatchSubmitPair');
    const action=actionFrom(body);
    requests.push({action,at:Date.now(),viewer});

    if(action==='DISCOVER_CARD'){
      discoverRequestAt=Date.now();
      await wait(backendDelayMs);
      maybeAdvance();
      if(turnNumber!==1||activePlayer!=='P1'){
        await fulfillJson(route,{...fastResponse('P1'),ok:false,error:'turno_expirado'});
        resolveDiscover();
        return;
      }
      serverRevealAt=Date.now();
      const requiredEnd=serverRevealAt+15000;
      turnEndsAt=Math.max(turnEndsAt,requiredEnd);
      revision+=1;boardVersion+=1;
      attempt={
        phase:'FIRST_REVEALED',player_id:'P1',player_name:'Chu',turn_number:1,
        first_card_id:'P1-L',second_card_id:'',revealed_at:new Date(serverRevealAt).toISOString(),reveal_until:'',
        turn_ends_at:new Date(turnEndsAt).toISOString(),
      };
      resolveDiscover();
      await fulfillJson(route,{...fastResponse('P1'),accepted:true,action:'DISCOVER_CARD'});
      return;
    }

    if(action==='SUBMIT_PAIR'){
      pairRequestAt=Date.now();
      await discoverCommitted;
      await wait(backendDelayMs);
      maybeAdvance();
      if(turnNumber!==1||!attempt||String(attempt.phase)!=='FIRST_REVEALED'){
        await fulfillJson(route,{...fastResponse('P1'),ok:false,error:'primera_carta_no_sincronizada'});
        return;
      }
      pairServerAcceptedAt=Date.now();
      assert.ok(pairServerAcceptedAt<turnEndsAt,`${name}: SUBMIT_PAIR llegó fuera de la ventana protegida.`);
      revision+=1;boardVersion+=1;

      if(mode==='MATCH'){
        matchedPairs=['PAIR-1'];
        claimedPairs={'PAIR-1':{pair_id:'PAIR-1',claimed_by:'P1',claimed_name:'Chu',points:1}};
        attempt=null;
        activePlayer='P1';
        turnNumber+=1;
        turnStartedAt=pairServerAcceptedAt;
        turnEndsAt=pairServerAcceptedAt+15000;
        const response=fastResponse('P1');
        response.correct=true;response.points=1;response.accepted=true;response.action='SUBMIT_PAIR';
        await fulfillJson(route,response);
        return;
      }

      revealUntil=pairServerAcceptedAt+3000;
      attempt={
        phase:'MISMATCH_REVEAL',player_id:'P1',player_name:'Chu',turn_number:1,
        first_card_id:'P1-L',second_card_id:'P2-L',revealed_at:new Date(pairServerAcceptedAt).toISOString(),
        reveal_until:new Date(revealUntil).toISOString(),turn_ends_at:new Date(turnEndsAt).toISOString(),
      };
      const response=fastResponse('P1');
      response.correct=false;response.points=0;response.accepted=true;response.action='SUBMIT_PAIR';
      await fulfillJson(route,response);
      return;
    }
    throw new Error(`Acción inesperada: ${action}`);
  }

  try{
    actorContext=await browser.newContext({viewport:{width:620,height:860}});
    spectatorContext=await browser.newContext({viewport:{width:390,height:844}});
    await actorContext.route('**/__cs21a192_live?*',routeHandler);
    await spectatorContext.route('**/__cs21a192_live?*',routeHandler);
    const actor=await actorContext.newPage();
    const spectator=await spectatorContext.newPage();
    for(const page of [actor,spectator]) page.on('pageerror',e=>errors.push(e.message));

    await Promise.all([
      actor.goto(`${baseUrl}/src/english_lab_games/memory_match_authoritative_sync_preview_cs21a192.html?viewer=P1`,{waitUntil:'domcontentloaded'}),
      spectator.goto(`${baseUrl}/src/english_lab_games/memory_match_authoritative_sync_preview_cs21a192.html?viewer=P2`,{waitUntil:'domcontentloaded'}),
    ]);
    await Promise.all([
      actor.locator('[data-authoritative-sync="true"]').waitFor({state:'visible',timeout:15000}),
      spectator.locator('[data-authoritative-sync="true"]').waitFor({state:'visible',timeout:15000}),
    ]);

    const actorCards=actor.locator('.elmm-card');
    await wait(600);
    await actorCards.nth(0).click();
    await actor.waitForFunction(()=>document.querySelectorAll('.elmm-card')[0]?.getAttribute('data-card-state')==='REVEALED',null,{timeout:1000});

    // En el escenario lento esperamos el ACK autoritativo para reproducir el caso
    // más conservador: el alumno ve la primera carta confirmada y recién entonces
    // elige la segunda.
    await discoverCommitted;
    assert.ok(serverRevealAt>0,`${name}: nunca se aceptó la primera carta.`);
    assert.equal(timeoutCount,0,`${name}: hubo timeout antes de FIRST_REVEALED.`);
    assert.ok(serverRevealAt<originalInitialEnd,`${name}: 15 s iniciales no alcanzaron para DISCOVER_CARD.`);
    assert.ok(turnEndsAt>=serverRevealAt+15000,`${name}: FIRST_REVEALED no recibió 15 s propios.`);
    assert.ok(serverRevealAt-turnStartedAt>10000,`${name}: el escenario lento no demuestra el fallo del contrato viejo de 10 s.`);

    // Forzar un poll pasado el viejo deadline inicial; el turno debe seguir siendo P1.
    const waitPastInitial=Math.max(0,originalInitialEnd-Date.now()+350);
    if(waitPastInitial) await wait(waitPastInitial);
    await spectator.evaluate(()=>window.dispatchEvent(new CustomEvent('an:memory-match-sync-request'))).catch(()=>{});
    await wait(350);
    assert.equal(timeoutCount,0,`${name}: cascada de timeout mientras FIRST_REVEALED seguía vigente.`);
    const beforeSecond=await spectator.evaluate(()=>window.__QA_PARENT_STATE__);
    assert.equal(Number(beforeSecond?.room_package?.turn_state?.turn_number||beforeSecond?.turn_state?.turn_number||0),1,`${name}: el turno rotó antes de la segunda carta.`);

    await wait(250);
    secondClickAt=Date.now();
    const secondIndex=mode==='MATCH'?2:1;
    await actorCards.nth(secondIndex).click({timeout:1500});
    await actor.waitForFunction(index=>document.querySelectorAll('.elmm-card')[index]?.getAttribute('data-card-state')==='REVEALED',secondIndex,{timeout:1000});

    const pairDeadline=Date.now()+backendDelayMs+5000;
    while(!pairServerAcceptedAt&&Date.now()<pairDeadline) await wait(100);
    assert.ok(pairRequestAt>=secondClickAt,`${name}: SUBMIT_PAIR no salió después del segundo click.`);
    assert.ok(pairServerAcceptedAt>0,`${name}: SUBMIT_PAIR no fue aceptado.`);
    assert.equal(timeoutCount,0,`${name}: hubo timeout con el par en vuelo.`);

    if(mode==='MATCH'){
      await actor.waitForFunction(()=>{
        const cards=[...document.querySelectorAll('.elmm-card')];
        return cards[0]?.getAttribute('data-card-state')==='CLAIMED'&&cards[2]?.getAttribute('data-card-state')==='CLAIMED';
      },null,{timeout:4000});
      const final=await actor.evaluate(()=>window.__QA_PARENT_STATE__);
      const finalTurn=final?.room_package?.turn_state||final?.turn_state||{};
      assert.equal(finalTurn.active_player_id,'P1',`${name}: MATCH no conservó al jugador.`);
      const finalStart=Date.parse(finalTurn.turn_started_at||'');
      const finalEnd=Date.parse(finalTurn.turn_ends_at||'');
      assert.equal(finalEnd-finalStart,15000,`${name}: MATCH no dio turno nuevo de 15 s.`);
    } else {
      await spectator.waitForFunction(()=>{
        const root=document.querySelector('[data-authoritative-sync="true"]');
        return root&&Number(root.getAttribute('data-turn-number'))>=2;
      },null,{timeout:6000});
      nextTurnObservedAt=nextTurnObservedAt||Date.now();
      assert.ok(nextTurnObservedAt-revealUntil<1500,`${name}: mismatch agregó espera tras los 3 s.`);
      const final=await spectator.evaluate(()=>window.__QA_PARENT_STATE__);
      const finalTurn=final?.room_package?.turn_state||final?.turn_state||{};
      assert.equal(finalTurn.active_player_id,'P2',`${name}: MISMATCH no rotó a P2.`);
      const finalStart=Date.parse(finalTurn.turn_started_at||'');
      const finalEnd=Date.parse(finalTurn.turn_ends_at||'');
      assert.equal(finalEnd-finalStart,15000,`${name}: siguiente jugador no recibió 15 s.`);
    }

    assert.deepEqual(errors,[],`${name}: errores navegador ${errors.join(' | ')}`);
    return {
      name,backendDelayMs,mode,pollAgeMs,
      originalInitialWindowMs:15000,
      serverRevealAfterTurnStartMs:serverRevealAt-turnStartedAt,
      protectedSecondWindowMs:turnEndsAt-serverRevealAt,
      pairRequestAfterSecondClickMs:pairRequestAt-secondClickAt,
      pairServerAcceptedAfterSecondClickMs:pairServerAcceptedAt-secondClickAt,
      timeoutCount,
      noTimeoutCascade:timeoutCount===0,
      requests:requests.map(x=>x.action),
    };
  }finally{
    if(actorContext)await actorContext.close();
    if(spectatorContext)await spectatorContext.close();
  }
}

const browser=await launchBrowser();
try{
  const latency3=await runScenario(browser,{name:'latency-3s-mismatch',backendDelayMs:3000,mode:'MISMATCH'});
  const latency8=await runScenario(browser,{name:'latency-8s-match',backendDelayMs:8000,mode:'MATCH'});
  const result={
    verdict:'PASS_MEMORY_MATCH_LATENCY_SAFE_CS21A212',
    contract:{initialTurnMs:15000,secondPickFromServerRevealMs:15000,mismatchRevealMs:3000},
    scenarios:[latency3,latency8],
    oldStrict10sRejected:true,
    deadlineNeverReduced:true,
    firstRevealProtectedFromTimeout:true,
    correctPairSurvives8sBackend:true,
    timeoutCascadeObserved:false,
  };
  writeEvidence('latency-safe-cs21a212.json',result);
  console.log(JSON.stringify(result,null,2));
}finally{
  await browser.close();
}
