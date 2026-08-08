#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  endpointAndBody,fulfillJson,launchBrowser,openPreview,responseFor,viewerFor,wait,writeEvidence,
} from './memory_match_cs21a192_browser_fixture.mjs';

const browser=await launchBrowser();
const clients={};
const calls={roomClosed:0,roundClosed:0,phaseComplete:0,sharedCompleted:0};
const cases={
  roomClosed:{status:'CLOSED'},
  roundClosed:{roundStatus:'CLOSED'},
  phaseComplete:{phase:'COMPLETE'},
  sharedCompleted:{completed:true},
};

try{
  for(const [name,terminal] of Object.entries(cases)){
    const handler=async route=>{
      const {endpoint,body}=endpointAndBody(route);
      assert.equal(endpoint,'englishLabMemoryMatchGetPlayerState');
      calls[name]+=1;
      await fulfillJson(route,responseFor({viewer:viewerFor(endpoint,body),revision:2,boardVersion:2,...terminal}));
    };
    clients[name]=await openPreview(browser,'P1',handler,{width:500,height:820});
    await clients[name].page.locator('[data-authoritative-sync="true"][data-live-terminal="true"][data-state-revision="2"]').waitFor({state:'visible',timeout:5000});
  }

  await wait(2600);
  for(const name of Object.keys(cases)){
    assert.equal(calls[name],1,`${name}: continuo polling despues del estado terminal (${calls[name]} lecturas).`);
    assert.equal(await clients[name].page.locator('[data-authoritative-sync="true"]').getAttribute('data-live-terminal'),'true');
  }
  const result={
    verdict:'PASS_TERMINAL_POLL_STOP_CS21A192',terminalContracts:Object.keys(cases),calls,pollsAfterTerminal:0,
  };
  writeEvidence('terminal-poll-stop.json',result);
  console.log(JSON.stringify(result,null,2));
}finally{
  for(const client of Object.values(clients))await client.context.close();
  await browser.close();
}
