#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  baseUrl,endpointAndBody,fulfillJson,launchBrowser,responseFor,wait,writeEvidence,
} from './memory_match_cs21a192_browser_fixture.mjs';

const browser=await launchBrowser();
let actorContext=null;
let spectatorContext=null;
const errors=[];
const requests=[];
const startedAt=Date.now();
const initialTurnEnd=startedAt+10000;
let revision=1;
let boardVersion=1;
let turnNumber=1;
let activePlayer='P1';
let attempt=null;
let turnStartedAt=startedAt;
let turnEndsAt=initialTurnEnd;
let discoverCommittedAt=0;
let pairRequestStartedAt=0;
let pairCommittedAt=0;
let revealUntil=0;
let nextTurnObservedAt=0;
let resolveDiscover;
const discoverCommitted=new Promise(resolve=>{resolveDiscover=resolve;});

function actionFrom(body){
  return String(body&&(body.action||body.answer_value&&body.answer_value.action)||'').trim().toUpperCase();
}
function fastResponse(viewer){
  const out=responseFor({viewer,revision,boardVersion,turnNumber,activePlayer,attempt,turnStartedAt,turnEndsAt,serverNow:Date.now()});
  out.room_package.rules={
    round_duration_ms:10000,
    turn_selection_ms:10000,
    reveal_duration_ms:3000,
    mismatch_reveal_ms:3000,
    spectator_reveal_ms:3000,
    pair_reveal_ms:3000,
    auto_start_delay_ms:0,
    team_size:1,
    fast_turn_version:'CS21A211-MM-10S-3S-1',
  };
  return out;
}
function maybeAdvance(){
  if(attempt&&String(attempt.phase)==='MISMATCH_REVEAL'&&revealUntil&&Date.now()>=revealUntil){
    revision+=1;boardVersion+=1;turnNumber+=1;activePlayer='P2';attempt=null;
    turnStartedAt=revealUntil;turnEndsAt=revealUntil+10000;
    if(!nextTurnObservedAt)nextTurnObservedAt=Date.now();
  }
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
  requests.push({action,at:Date.now(),viewer,body:{...body}});
  if(action==='DISCOVER_CARD'){
    // Backend real puede tardar; la UI no debe usar este ACK como barrera para el segundo click.
    await wait(900);
    discoverCommittedAt=Date.now();
    revision=2;boardVersion=2;
    attempt={
      phase:'FIRST_REVEALED',player_id:'P1',player_name:'Chu',turn_number:1,
      first_card_id:'P1-L',second_card_id:'',revealed_at:new Date(discoverCommittedAt).toISOString(),reveal_until:'',
      turn_ends_at:new Date(initialTurnEnd).toISOString(),
    };
    resolveDiscover();
    await fulfillJson(route,{...fastResponse('P1'),accepted:true,action:'DISCOVER_CARD'});
    return;
  }
  if(action==='SUBMIT_PAIR'){
    if(!pairRequestStartedAt)pairRequestStartedAt=Date.now();
    // Modela ScriptLock: el segundo request puede llegar YA, pero la mutación se
    // serializa detrás de DISCOVER_CARD sin obligar al navegador a esperar su ACK.
    await discoverCommitted;
    pairCommittedAt=Date.now();
    revision=3;boardVersion=3;
    revealUntil=pairCommittedAt+3000;
    attempt={
      phase:'MISMATCH_REVEAL',player_id:'P1',player_name:'Chu',turn_number:1,
      first_card_id:'P1-L',second_card_id:'P2-L',revealed_at:new Date(pairCommittedAt).toISOString(),
      reveal_until:new Date(revealUntil).toISOString(),
    };
    turnStartedAt=revealUntil;
    turnEndsAt=revealUntil+10000;
    const response=fastResponse('P1');
    // Mientras dura reveal, el turno siguiente ya tiene deadline absoluto pero
    // turn_started_at queda en revealUntil; la UI bloquea hasta ese instante.
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
  const spectatorCards=spectator.locator('.elmm-card');
  const firstClickAt=Date.now();
  await actorCards.nth(0).click();
  await actor.waitForFunction(()=>document.querySelectorAll('.elmm-card')[0]?.getAttribute('data-card-state')==='REVEALED',null,{timeout:500});
  assert.equal(await actorCards.nth(1).isDisabled(),false,'La segunda carta quedó bloqueada esperando ACK de la primera.');

  const secondClickAt=Date.now();
  await actorCards.nth(1).click({timeout:500});
  await actor.waitForFunction(()=>document.querySelectorAll('.elmm-card')[1]?.getAttribute('data-card-state')==='REVEALED',null,{timeout:500});
  assert.ok(secondClickAt-firstClickAt<500,`La segunda selección local tardó ${secondClickAt-firstClickAt} ms.`);

  // El tercer click nunca puede habilitarse mientras el par está en vuelo/reveal.
  assert.equal(await actorCards.nth(2).isDisabled(),true,'Se habilitó una tercera carta inmediatamente después del segundo click.');

  await wait(120);
  assert.ok(pairRequestStartedAt>0,'SUBMIT_PAIR no salió a red antes del ACK de DISCOVER_CARD.');
  assert.ok(pairRequestStartedAt-secondClickAt<250,`SUBMIT_PAIR agregó ${pairRequestStartedAt-secondClickAt} ms de espera cliente.`);
  assert.equal(discoverCommittedAt,0,'El segundo request sólo salió después del ACK de la primera carta.');

  await discoverCommitted;
  await spectator.waitForFunction(()=>document.querySelectorAll('.elmm-card')[0]?.getAttribute('data-card-state')==='REVEALED',null,{timeout:1500});
  await spectator.waitForFunction(()=>document.querySelectorAll('.elmm-card')[1]?.getAttribute('data-card-state')==='REVEALED',null,{timeout:1500});
  const spectatorPairVisibleAt=Date.now();
  assert.ok(spectatorPairVisibleAt-pairCommittedAt<1200,`El espectador agregó ${spectatorPairVisibleAt-pairCommittedAt} ms después del commit del par.`);

  const revealAttr=Number(await spectator.locator('[data-spectator-reveal-ms]').getAttribute('data-spectator-reveal-ms'));
  assert.equal(revealAttr,3000,'La UI no expone reveal de 3000 ms.');
  const turnAttr=Number(await spectator.locator('[data-turn-selection-ms]').getAttribute('data-turn-selection-ms'));
  assert.equal(turnAttr,10000,'La UI no expone turno de 10000 ms.');

  // Debe seguir bloqueado durante los 3 s de exposición.
  await wait(1800);
  assert.equal(await actorCards.nth(2).isDisabled(),true,'La tercera carta se habilitó durante los 3 s de reveal.');

  // Al terminar reveal, no se espera el resto del turno original: rota ya a P2.
  await spectator.waitForFunction(()=>{
    const root=document.querySelector('[data-authoritative-sync="true"]');
    return root&&Number(root.getAttribute('data-turn-number'))>=2;
  },null,{timeout:2500});
  const nextTurnAt=Date.now();
  assert.ok(nextTurnAt-revealUntil<1200,`El siguiente turno agregó ${nextTurnAt-revealUntil} ms tras el deadline de reveal.`);
  assert.ok(nextTurnAt<initialTurnEnd+1000,'El sistema esperó hasta completar los 10 s originales después de un mismatch temprano.');

  const finalState=await spectator.evaluate(()=>window.__QA_PARENT_STATE__);
  const finalTurn=finalState?.room_package?.turn_state||finalState?.turn_state||{};
  const finalStart=Date.parse(finalTurn.turn_started_at||'');
  const finalEnd=Date.parse(finalTurn.turn_ends_at||'');
  assert.equal(finalTurn.active_player_id,'P2','El mismatch no rotó al siguiente jugador.');
  assert.equal(finalEnd-finalStart,10000,'El siguiente jugador no recibió 10 s completos nuevos.');
  assert.deepEqual(errors,[],`Errores navegador: ${errors.join(' | ')}`);

  const result={
    verdict:'PASS_MEMORY_MATCH_FAST_TURN_CS21A211',
    contract:{turnSelectionMs:10000,mismatchRevealMs:3000},
    firstCardLocalImmediate:true,
    secondCardLocalImmediate:true,
    pairRequestStartedBeforeFirstAck:true,
    pairRequestClientAddedDelayMs:pairRequestStartedAt-secondClickAt,
    simulatedDiscoverBackendMs:discoverCommittedAt-firstClickAt,
    spectatorPairAfterCommitMs:spectatorPairVisibleAt-pairCommittedAt,
    thirdCardBlockedDuringMutationAndReveal:true,
    mismatchRotatedAtRevealDeadline:true,
    nextTurnAfterRevealObservedDelayMs:nextTurnAt-revealUntil,
    nextPlayerFreshTurnMs:finalEnd-finalStart,
    originalTurnEndWasNotWaited:true,
    mutationRequests:requests.map(x=>x.action),
  };
  writeEvidence('fast-turn-cs21a211.json',result);
  console.log(JSON.stringify(result,null,2));
}finally{
  if(actorContext)await actorContext.close();
  if(spectatorContext)await spectatorContext.close();
  await browser.close();
}
