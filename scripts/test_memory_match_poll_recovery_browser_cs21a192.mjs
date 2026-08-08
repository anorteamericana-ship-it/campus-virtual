#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  endpointAndBody,fulfillJson,launchBrowser,openPreview,responseFor,viewerFor,wait,writeEvidence,
} from './memory_match_cs21a192_browser_fixture.mjs';

const browser=await launchBrowser();
let client=null;
let calls=0;
let releaseHung;
const hungGate=new Promise(resolve=>{releaseHung=resolve;});
const callTimes=[];
const errors=[];

async function routeHandler(route){
  const {endpoint,body}=endpointAndBody(route);
  assert.equal(endpoint,'englishLabMemoryMatchGetPlayerState');
  assert.equal(viewerFor(endpoint,body),'P1');
  calls+=1;
  callTimes.push(Date.now());
  if(calls===1){
    await hungGate;
    try{await fulfillJson(route,responseFor({viewer:'P1',revision:1,boardVersion:1,serverNow:callTimes[0]}));}catch(_){}
    return;
  }
  await fulfillJson(route,responseFor({viewer:'P1',revision:2,boardVersion:2}));
}

try{
  client=await openPreview(browser,'P1',routeHandler,{width:600,height:850});
  client.page.on('pageerror',error=>errors.push(error.message));
  assert.equal(await client.page.locator('[data-authoritative-sync="true"]').getAttribute('data-live-poll-timeout-ms'),'8000');
  await client.page.locator('[data-authoritative-sync="true"][data-state-revision="2"]').waitFor({state:'visible',timeout:14000});
  assert.ok(calls>=2,'El poll no se recupero despues de la lectura colgada.');
  const retryDelayMs=callTimes[1]-callTimes[0];
  assert.ok(retryDelayMs>=7900,`El timeout fue menor al contrato: ${retryDelayMs} ms.`);
  assert.ok(retryDelayMs<=10000,`El retry no se recupero con backoff acotado: ${retryDelayMs} ms.`);
  assert.equal(await client.page.locator('[role="alert"]').count(),0,'El fallo de polling silencioso no debe mostrar una alerta roja.');

  // La respuesta r1 nacio antes, queda liberada despues de adoptar r2 y no
  // puede regresar la UI ni refrescar el reloj como si fuera nueva.
  releaseHung();
  await wait(900);
  assert.equal(await client.page.locator('[data-authoritative-sync="true"]').getAttribute('data-state-revision'),'2','La respuesta colgada r1 resucito estado viejo.');
  assert.deepEqual(errors,[],`Errores navegador: ${errors.join(' | ')}`);
  const result={
    verdict:'PASS_POLL_RECOVERY_CS21A192',pollTimeoutMs:8000,retryDelayMs,silentFailure:true,
    recoveredRevision:2,lateRevisionOneRejected:true,calls,
  };
  writeEvidence('poll-recovery.json',result);
  console.log(JSON.stringify(result,null,2));
}finally{
  releaseHung();
  if(client)await client.context.close();
  await browser.close();
}
