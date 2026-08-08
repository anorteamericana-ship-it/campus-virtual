#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  endpointAndBody,fulfillJson,launchBrowser,openPreview,responseFor,viewerFor,wait,writeEvidence,
} from './memory_match_cs21a192_browser_fixture.mjs';

const browser=await launchBrowser();
const clients={};
const errors=[];
const startedAt=Date.now();
// La carga de Babel/React en tres contextos es deliberadamente escalonada;
// 15 s deja una ventana visible real al tercer panel antes del mismo deadline.
const turnEndsAt=startedAt+15000;
const delays={P1:40,P2:240,teacher:520};
const attempt={
  phase:'FIRST_REVEALED',player_id:'P1',player_name:'Chu',team_id:'NO_TEAM',turn_number:1,
  first_card_id:'P1-L',second_card_id:'',revealed_at:new Date(startedAt).toISOString(),reveal_until:'',
};

async function routeHandler(route){
  const {endpoint,body}=endpointAndBody(route);
  assert.ok(['englishLabMemoryMatchGetPlayerState','englishLabMemoryMatchGetRoomControl'].includes(endpoint),`Endpoint inesperado: ${endpoint}`);
  const viewer=viewerFor(endpoint,body);
  await wait(delays[viewer]);
  await fulfillJson(route,responseFor({viewer,revision:2,boardVersion:2,turnStartedAt:startedAt,turnEndsAt,attempt}));
}

try{
  for(const viewer of ['P1','P2','teacher']){
    clients[viewer]=await openPreview(browser,viewer,routeHandler,viewer==='teacher'?{width:1200,height:850}:{width:520,height:850});
    clients[viewer].page.on('pageerror',error=>errors.push(`${viewer}: ${error.message}`));
    await clients[viewer].page.locator('[data-authoritative-sync="true"][data-state-revision="2"]').waitFor({state:'visible',timeout:4000});
    await clients[viewer].page.waitForFunction(()=>document.querySelector('.elmm-card')?.getAttribute('data-card-state')==='REVEALED');
    assert.ok(Date.now()<turnEndsAt,`${viewer}: la carta no llego visible antes del deadline.`);
    if(viewer!=='teacher')await wait(350);
  }

  const hiddenAt={};
  await Promise.all(Object.entries(clients).map(async([viewer,client])=>{
    await client.page.waitForFunction(()=>document.querySelector('.elmm-card')?.getAttribute('data-card-state')==='HIDDEN',null,{timeout:9000});
    hiddenAt[viewer]=Date.now();
    assert.equal(await client.page.locator('[data-authoritative-sync="true"]').getAttribute('data-state-revision'),'2',`${viewer}: el cierre local no debe inventar una revision.`);
    assert.equal(await client.page.locator('.elmm-card').first().getAttribute('data-card-state'),'HIDDEN',`${viewer}: FIRST_REVEALED sobrevivio al deadline.`);
  }));

  const hiddenTimes=Object.values(hiddenAt);
  assert.ok(Math.min(...hiddenTimes)>=turnEndsAt-850,`Algun panel oculto demasiado pronto: ${JSON.stringify(hiddenAt)}`);
  assert.ok(Math.max(...hiddenTimes)<=turnEndsAt+1000,`Algun panel conservo FIRST_REVEALED despues del margen: ${JSON.stringify(hiddenAt)}`);
  assert.ok(Math.max(...hiddenTimes)-Math.min(...hiddenTimes)<=900,`Los tres cierres locales quedaron escalonados: ${JSON.stringify(hiddenAt)}`);
  assert.deepEqual(errors,[],`Errores navegador: ${errors.join(' | ')}`);
  const result={
    verdict:'PASS_FIRST_REVEAL_DEADLINE_CS21A192',contexts:3,staggeredOpen:true,
    authoritativeDeadline:true,backendRevisionStayed:2,hiddenAt,skewMs:Math.max(...hiddenTimes)-Math.min(...hiddenTimes),
  };
  writeEvidence('first-reveal-deadline.json',result);
  console.log(JSON.stringify(result,null,2));
}finally{
  for(const client of Object.values(clients))await client.context.close();
  await browser.close();
}
