#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  endpointAndBody,fulfillJson,launchBrowser,openPreview,responseFor,wait,writeEvidence,
} from './memory_match_cs21a192_browser_fixture.mjs';

const browser=await launchBrowser();
let client=null;
const errors=[];
const mutations=[];
const FIRST_ACK_DELAY_MS=3200;
const PAIR_ACK_DELAY_MS=3200;
const startedAt=Date.now();
let snapshot={
  revision:1,
  boardVersion:1,
  turnStartedAt:startedAt,
  turnEndsAt:startedAt+60000,
  attempt:null,
  activePlayer:'P1',
  turnNumber:1,
};
let firstRequestAt=0;
let firstResponseAt=0;
let pairRequestAt=0;
let pairResponseAt=0;

function actionFrom(body){
  const value=body&&(
    body.action ||
    body.answer_value&&body.answer_value.action ||
    body.answerValue&&body.answerValue.action
  );
  return String(value||'').trim().toUpperCase();
}

async function routeHandler(route){
  const {endpoint,body}=endpointAndBody(route);
  if(endpoint==='englishLabMemoryMatchGetPlayerState'){
    await wait(40);
    await fulfillJson(route,responseFor({viewer:'P1',...snapshot}));
    return;
  }
  if(endpoint!=='englishLabMemoryMatchSubmitPair'){
    throw new Error(`Endpoint inesperado: ${endpoint}`);
  }

  const action=actionFrom(body);
  mutations.push({action,at:Date.now(),body});
  if(action==='DISCOVER_CARD'){
    assert.equal(firstRequestAt,0,'DISCOVER_CARD se envió más de una vez.');
    firstRequestAt=Date.now();
    await wait(FIRST_ACK_DELAY_MS);
    const revealedAt=Date.now();
    const turnEndsAt=revealedAt+30000;
    snapshot={
      revision:2,
      boardVersion:2,
      turnStartedAt:startedAt,
      turnEndsAt,
      attempt:{
        phase:'FIRST_REVEALED',player_id:'P1',player_name:'Chu',team_id:'NO_TEAM',turn_number:1,
        first_card_id:'P1-L',second_card_id:'',revealed_at:new Date(revealedAt).toISOString(),
        turn_ends_at:new Date(turnEndsAt).toISOString(),reveal_until:'',
      },
      activePlayer:'P1',
      turnNumber:1,
    };
    firstResponseAt=Date.now();
    await fulfillJson(route,{...responseFor({viewer:'P1',...snapshot}),accepted:true,action:'DISCOVER_CARD'});
    return;
  }

  if(action==='SUBMIT_PAIR'){
    pairRequestAt=Date.now();
    assert.ok(firstResponseAt>0,'SUBMIT_PAIR llegó antes del ACK real de DISCOVER_CARD.');
    assert.ok(pairRequestAt>=firstResponseAt,'SUBMIT_PAIR no respetó la cola de la primera carta.');
    await wait(PAIR_ACK_DELAY_MS);
    const revealUntil=Date.now()+6000;
    snapshot={
      revision:3,
      boardVersion:3,
      turnStartedAt:startedAt,
      turnEndsAt:revealUntil+30000,
      attempt:{
        phase:'MISMATCH_REVEAL',player_id:'P1',player_name:'Chu',team_id:'NO_TEAM',turn_number:1,
        first_card_id:'P1-L',second_card_id:'P2-L',revealed_at:new Date(firstResponseAt).toISOString(),
        reveal_until:new Date(revealUntil).toISOString(),
      },
      activePlayer:'P1',
      turnNumber:1,
    };
    pairResponseAt=Date.now();
    await fulfillJson(route,{...responseFor({viewer:'P1',...snapshot}),accepted:true,correct:false,action:'SUBMIT_PAIR'});
    return;
  }

  throw new Error(`Acción inesperada: ${action}`);
}

try{
  client=await openPreview(browser,'P1',routeHandler,{width:520,height:850});
  const {page}=client;
  page.on('pageerror',error=>errors.push(error.message));

  await page.locator('[data-latency-safe-version="CS21A194"]').waitFor({state:'visible',timeout:5000});
  const cards=page.locator('.elmm-card');
  assert.equal(await cards.nth(0).getAttribute('data-card-state'),'HIDDEN');
  assert.equal(await cards.nth(1).getAttribute('data-card-state'),'HIDDEN');

  const firstClickAt=Date.now();
  await cards.nth(0).click();
  await page.waitForFunction(()=>document.querySelectorAll('.elmm-card')[0]?.getAttribute('data-card-state')==='REVEALED',null,{timeout:500});
  const firstVisibleAt=Date.now();
  assert.ok(firstVisibleAt-firstClickAt<500,'La primera carta esperó el ACK del backend para abrirse.');

  // El ACK de la primera carta sigue deliberadamente retenido. La segunda debe
  // poder elegirse ya y quedar visualmente abierta mientras su submit espera la cola.
  assert.ok(firstResponseAt===0,'El ACK de la primera carta llegó antes de probar el segundo click.');
  const secondClickAt=Date.now();
  await cards.nth(1).click();
  await page.waitForFunction(()=>{
    const list=document.querySelectorAll('.elmm-card');
    return list[0]?.getAttribute('data-card-state')==='REVEALED' && list[1]?.getAttribute('data-card-state')==='REVEALED';
  },null,{timeout:500});
  const secondVisibleAt=Date.now();
  assert.ok(secondVisibleAt-secondClickAt<500,'La segunda carta quedó bloqueada esperando el primer ACK.');
  assert.equal(pairRequestAt,0,'La pareja salió al backend antes de confirmar DISCOVER_CARD.');

  // Durante el primer viaje lento ambas cartas deben seguir visibles localmente.
  await wait(900);
  assert.equal(await cards.nth(0).getAttribute('data-card-state'),'REVEALED');
  assert.equal(await cards.nth(1).getAttribute('data-card-state'),'REVEALED');
  assert.equal(firstResponseAt,0,'El fixture dejó de simular un primer ACK lento.');

  for(let i=0;i<80 && !pairRequestAt;i+=1) await wait(100);
  assert.ok(firstResponseAt>0,'Nunca llegó el ACK DISCOVER_CARD.');
  assert.ok(pairRequestAt>0,'La segunda selección no se envió después del primer ACK.');
  assert.ok(pairRequestAt>=firstResponseAt,'SUBMIT_PAIR se adelantó al ACK de la primera carta.');

  // También durante el segundo viaje lento el jugador no debe perder lo que eligió.
  await wait(700);
  assert.equal(await cards.nth(0).getAttribute('data-card-state'),'REVEALED');
  assert.equal(await cards.nth(1).getAttribute('data-card-state'),'REVEALED');

  for(let i=0;i<80 && !pairResponseAt;i+=1) await wait(100);
  assert.ok(pairResponseAt>0,'Nunca llegó la respuesta de SUBMIT_PAIR.');
  await page.locator('[data-authoritative-sync="true"][data-state-revision="3"]').waitFor({state:'visible',timeout:5000});
  assert.deepEqual(errors,[],`Errores navegador: ${errors.join(' | ')}`);

  const result={
    verdict:'PASS_MEMORY_MATCH_LATENCY_SAFE_CS21A194',
    firstAckDelayMs:FIRST_ACK_DELAY_MS,
    pairAckDelayMs:PAIR_ACK_DELAY_MS,
    firstLocalOpenMs:firstVisibleAt-firstClickAt,
    secondLocalOpenMs:secondVisibleAt-secondClickAt,
    firstRequestAt,firstResponseAt,pairRequestAt,pairResponseAt,
    secondSelectedBeforeFirstAck:secondVisibleAt<firstResponseAt,
    pairQueuedBehindFirstAck:pairRequestAt>=firstResponseAt,
    mutations:mutations.map(item=>item.action),
  };
  assert.equal(result.secondSelectedBeforeFirstAck,true);
  assert.equal(result.pairQueuedBehindFirstAck,true);
  writeEvidence('latency-safe-cs21a194.json',result);
  console.log(JSON.stringify(result,null,2));
}finally{
  if(client) await client.context.close();
  await browser.close();
}
