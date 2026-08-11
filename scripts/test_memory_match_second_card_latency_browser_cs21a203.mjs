#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  baseUrl,endpointAndBody,fulfillJson,launchBrowser,responseFor,wait,writeEvidence,
} from './memory_match_cs21a192_browser_fixture.mjs';

const browser=await launchBrowser();
let context=null;
const errors=[];
const mutations=[];
let snapshot={revision:1,boardVersion:1,turnNumber:1,activePlayer:'P1',attempt:null};
let secondClickedAt=0;
let pairReceivedAt=0;

function actionFrom(body){
  return String(body&&(body.action||body.answer_value&&body.answer_value.action)||'').trim().toUpperCase();
}

async function routeHandler(route){
  const {endpoint,body}=endpointAndBody(route);
  if(endpoint==='englishLabMemoryMatchGetPlayerState'){
    await fulfillJson(route,responseFor({viewer:'P1',...snapshot}));
    return;
  }
  assert.equal(endpoint,'englishLabMemoryMatchSubmitPair');
  const action=actionFrom(body);
  mutations.push({action,at:Date.now(),body:{...body}});
  if(action==='DISCOVER_CARD'){
    // Reproduce la latencia observada por el usuario: Apps Script tarda ~4s.
    await wait(4000);
    snapshot={revision:2,boardVersion:2,turnNumber:1,activePlayer:'P1',attempt:{phase:'FIRST_REVEALED',player_id:'P1',player_name:'Chu',turn_number:1,first_card_id:'P1-L',second_card_id:'',revealed_at:new Date().toISOString(),reveal_until:''}};
    await fulfillJson(route,{...responseFor({viewer:'P1',...snapshot}),accepted:true,action:'DISCOVER_CARD'});
    return;
  }
  if(action==='SUBMIT_PAIR'){
    pairReceivedAt=Date.now();
    const revealUntil=Date.now()+6500;
    snapshot={revision:3,boardVersion:3,turnNumber:1,activePlayer:'P1',attempt:{phase:'MISMATCH_REVEAL',player_id:'P1',player_name:'Chu',turn_number:1,first_card_id:'P1-L',second_card_id:'P2-L',revealed_at:new Date().toISOString(),reveal_until:new Date(revealUntil).toISOString()}};
    await fulfillJson(route,{...responseFor({viewer:'P1',...snapshot}),accepted:true,action:'SUBMIT_PAIR',correct:false,points:0,reveal_until:new Date(revealUntil).toISOString()});
    return;
  }
  throw new Error(`Acción inesperada: ${action}`);
}

try{
  context=await browser.newContext({viewport:{width:620,height:860}});
  await context.route('**/__cs21a192_live?*',routeHandler);
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${baseUrl}/src/english_lab_games/memory_match_authoritative_sync_preview_cs21a192.html?viewer=P1`,{waitUntil:'domcontentloaded'});
  await page.locator('[data-authoritative-sync="true"]').waitFor({state:'visible',timeout:15000});
  const cards=page.locator('.elmm-card');

  const firstClickAt=Date.now();
  await cards.nth(0).click();
  await page.waitForFunction(()=>document.querySelectorAll('.elmm-card')[0]?.getAttribute('data-card-state')==='REVEALED',null,{timeout:700});

  // CS21A203: el ACK de DISCOVER_CARD puede seguir en vuelo; la segunda debe
  // permanecer disponible porque queda en cola detrás del ACK de la primera.
  assert.equal(await cards.nth(1).isDisabled(),false,'La segunda carta quedó bloqueada por la latencia del primer ACK.');
  secondClickedAt=Date.now();
  await cards.nth(1).click({timeout:700});
  const secondSelectionDelayMs=secondClickedAt-firstClickAt;
  assert.ok(secondSelectionDelayMs<700,`La segunda carta tardó ${secondSelectionDelayMs} ms en poder elegirse.`);

  // En cuanto existe segunda selección local, una tercera sí queda bloqueada.
  for(let i=0;i<12;i+=1){
    await wait(250);
    assert.equal(await cards.nth(2).isDisabled(),true,`La tercera carta se habilitó mientras esperaba el ACK (${i}).`);
  }

  await page.waitForFunction(()=>window.__QA_PARENT_STATE__&&Number(window.__QA_PARENT_STATE__.state_revision)>=3,null,{timeout:8000});
  assert.ok(pairReceivedAt>0,'SUBMIT_PAIR nunca salió después del ACK de la primera carta.');
  assert.ok(pairReceivedAt-secondClickedAt>=3000,'SUBMIT_PAIR salió antes de que terminara el ACK lento de DISCOVER_CARD.');
  assert.deepEqual(mutations.map(x=>x.action),['DISCOVER_CARD','SUBMIT_PAIR']);
  assert.deepEqual(errors,[],`Errores navegador: ${errors.join(' | ')}`);

  const result={
    verdict:'PASS_MEMORY_MATCH_SECOND_CARD_LATENCY_CS21A203',
    simulatedDiscoverLatencyMs:4000,
    secondSelectionDelayMs,
    pairQueuedBehindDiscoverAck:true,
    thirdCardBlockedWhileQueued:true,
    mutationSequence:mutations.map(x=>x.action),
  };
  writeEvidence('second-card-latency-cs21a203.json',result);
  console.log(JSON.stringify(result,null,2));
}finally{
  if(context)await context.close();
  await browser.close();
}
