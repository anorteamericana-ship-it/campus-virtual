#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  endpointAndBody,fulfillJson,launchBrowser,openPreview,responseFor,wait,writeEvidence,
} from './memory_match_cs21a192_browser_fixture.mjs';

const browser=await launchBrowser();
let client=null;
const errors=[];
const mutations=[];
let snapshot={revision:1,boardVersion:1,turnNumber:1,activePlayer:'P1',attempt:null};
let pairAttempts=0;
let thirdClickRejected=false;

function actionFrom(body){
  const value=body&&(body.action || body.answer_value&&body.answer_value.action || body.answerValue&&body.answerValue.action);
  return String(value||'').trim().toUpperCase();
}

async function routeHandler(route){
  const {endpoint,body}=endpointAndBody(route);
  if(endpoint==='englishLabMemoryMatchGetPlayerState'){
    await wait(30);
    await fulfillJson(route,responseFor({viewer:'P1',...snapshot}));
    return;
  }
  if(endpoint!=='englishLabMemoryMatchSubmitPair')throw new Error(`Endpoint inesperado: ${endpoint}`);

  const action=actionFrom(body);
  mutations.push({action,body:{...body},at:Date.now()});
  if(action==='DISCOVER_CARD'){
    snapshot={
      revision:2,boardVersion:2,turnNumber:1,activePlayer:'P1',
      attempt:{phase:'FIRST_REVEALED',player_id:'P1',player_name:'Chu',team_id:'NO_TEAM',turn_number:1,first_card_id:'P1-L',second_card_id:'',revealed_at:new Date().toISOString(),reveal_until:''},
    };
    await wait(200);
    await fulfillJson(route,{...responseFor({viewer:'P1',...snapshot}),accepted:true,action:'DISCOVER_CARD'});
    return;
  }

  if(action==='SUBMIT_PAIR'){
    pairAttempts+=1;
    if(pairAttempts===1){
      assert.equal(Number(body.expected_state_revision),2,'El primer SUBMIT_PAIR debe salir desde R2.');
      snapshot={...snapshot,revision:3,boardVersion:3};
      await wait(450);
      await fulfillJson(route,{
        ...responseFor({viewer:'P1',...snapshot}),ok:false,error:'state_conflict',
        mensaje:'La sala cambió antes de aplicar la jugada. Se cargó el estado actual.',
        expected_state_revision:2,actual_state_revision:3,
      });
      return;
    }

    assert.equal(pairAttempts,2,'El adaptador debe reintentar como máximo una vez.');
    assert.equal(Number(body.expected_state_revision),3,'El reintento debe usar la revisión canónica R3.');
    const firstSubmit=mutations.find(item=>item.action==='SUBMIT_PAIR');
    assert.equal(String(body.action_id||''),String(firstSubmit?.body?.action_id||''),'El retry debe conservar action_id.');
    const revealUntil=Date.now()+7000;
    snapshot={
      revision:4,boardVersion:4,turnNumber:1,activePlayer:'P1',
      attempt:{phase:'MISMATCH_REVEAL',player_id:'P1',player_name:'Chu',team_id:'NO_TEAM',turn_number:1,first_card_id:'P1-L',second_card_id:'P2-L',revealed_at:new Date().toISOString(),reveal_until:new Date(revealUntil).toISOString()},
    };
    await wait(1200);
    await fulfillJson(route,{...responseFor({viewer:'P1',...snapshot}),accepted:true,action:'SUBMIT_PAIR',correct:false,points:0,reveal_until:new Date(revealUntil).toISOString()});
    return;
  }
  throw new Error(`Acción inesperada: ${action}`);
}

try{
  client=await openPreview(browser,'P1',routeHandler,{width:520,height:850});
  const {page}=client;
  page.on('pageerror',error=>errors.push(error.message));
  const cards=page.locator('.elmm-card');

  await cards.nth(0).click();
  await page.waitForFunction(()=>document.querySelectorAll('.elmm-card')[0]?.getAttribute('data-card-state')==='REVEALED',null,{timeout:1000});
  await cards.nth(1).click();

  // LAB-6254: durante conflicto + retry la tercera carta jamás puede habilitarse.
  for(let i=0;i<12;i+=1){
    await wait(100);
    assert.equal(await cards.nth(2).isDisabled(),true,`La tercera carta se habilitó durante reconciliación en muestra ${i}.`);
  }
  try{await cards.nth(2).click({timeout:250});}catch(_){thirdClickRejected=true;}
  assert.equal(thirdClickRejected,true,'Playwright logró clickear una tercera carta durante reconciliación.');

  await page.locator('[data-authoritative-sync="true"][data-state-revision="4"]').waitFor({state:'visible',timeout:7000});
  assert.equal(pairAttempts,2,'Debe existir un submit original y un único retry.');
  assert.deepEqual(mutations.map(item=>item.action),['DISCOVER_CARD','SUBMIT_PAIR','SUBMIT_PAIR']);
  assert.deepEqual(errors,[],`Errores navegador: ${errors.join(' | ')}`);

  const result={verdict:'PASS_MEMORY_MATCH_CONFLICT_RECONCILIATION_CS21A196',pairAttempts,mutationSequence:mutations.map(item=>item.action),thirdCardBlockedDuringConflict:true,retryExpectedRevision:mutations[2]?.body?.expected_state_revision,finalRevision:4};
  writeEvidence('conflict-reconciliation-cs21a196.json',result);
  console.log(JSON.stringify(result,null,2));
}finally{
  if(client)await client.context.close();
  await browser.close();
}
