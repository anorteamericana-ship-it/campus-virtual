#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const adapterPath='src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx';
const livePath='src/english_lab_live.jsx';
const adapter=fs.readFileSync(adapterPath,'utf8');
const live=fs.readFileSync(livePath,'utf8');
const durationMs=60000;
const maxModeledRequestsPerSecond=20;
const phases=[2,5,10,15,25];
const tiers=[
  {maxPlayers:5,ms:550},
  {maxPlayers:10,ms:900},
  {maxPlayers:15,ms:1400},
  {maxPlayers:25,ms:2200},
];

function pollMsForPlayers(players){return tiers.find(tier=>players<=tier.maxPlayers)?.ms||3000;}

function model(players){
  const pollMs=pollMsForPlayers(players);
  const clients=players+1; // estudiantes mas una vista docente
  const pollsPerClient=Math.floor((durationMs-1)/pollMs)+1; // incluye t=0
  const requestsPerMinute=clients*pollsPerClient;
  const requestsPerSecond=Number((requestsPerMinute/60).toFixed(2));
  return {
    players,teacherViews:1,clients,pollMs,pollsPerClient,
    requestsPerMinute,requestsPerSecond,
    maxConcurrentPollsPerClient:1,recentCacheReads:0,
    budgetRequestsPerSecond:maxModeledRequestsPerSecond,
    headroomRequestsPerSecond:Number((maxModeledRequestsPerSecond-requestsPerSecond).toFixed(2)),
    withinBudget:requestsPerSecond<maxModeledRequestsPerSecond,
  };
}

assert.match(adapter,/Object\.freeze\(\{maxPlayers:5,ms:550\}\)/);
assert.match(adapter,/Object\.freeze\(\{maxPlayers:10,ms:900\}\)/);
assert.match(adapter,/Object\.freeze\(\{maxPlayers:15,ms:1400\}\)/);
assert.match(adapter,/Object\.freeze\(\{maxPlayers:25,ms:2200\}\)/);
assert.match(adapter,/const POLL_TIMEOUT_MS=8000;/);
assert.match(adapter,/const MUTATION_TIMEOUT_MS=45000;/);
assert.match(adapter,/let inFlight=false;/);
assert.match(adapter,/if\(inFlight\)\{wakeRequested=true;return;\}/);
assert.doesNotMatch(adapter,/setInterval\s*\(\s*poll/,'CS21A192 no debe reintroducir polling superpuesto con setInterval.');
assert.match(adapter,/invalidateClientReadCache\('CS21A192_AUTHORITATIVE_POLL'\)/,'Cada poll debe invalidar el recent-cache anterior.');
assert.match(live,/if\(!joined \|\| !roomCode \|\| isMemoryMatch\) return;/,'El polling exterior historico debe permanecer apagado para Memory Match.');

assert.equal(pollMsForPlayers(2),550);
assert.equal(pollMsForPlayers(5),550);
assert.equal(pollMsForPlayers(10),900);
assert.equal(pollMsForPlayers(15),1400);
assert.equal(pollMsForPlayers(25),2200);
const models=phases.map(model);
for(const item of models){
  assert.equal(item.maxConcurrentPollsPerClient,1);
  assert.equal(item.recentCacheReads,0);
  assert.equal(item.withinBudget,true,`${item.players} participantes exceden el presupuesto: ${item.requestsPerSecond} req/s.`);
}

const output={
  verdict:'PASS_MEMORY_MATCH_LOAD_MODEL_CS21A192',durationMs,
  assumptions:{singleRecursivePollOwner:true,nextPollAfterCompletion:true,teacherViews:1,recentCache:false,networkLatencyMs:0},
  note:'Es un presupuesto determinista de red del cliente; no sustituye carga autenticada contra Apps Script QA.',
  maxModeledRequestsPerSecond,models,
};
const outputDir=path.resolve('qa-output/cs21a192-load-budget');
fs.mkdirSync(outputDir,{recursive:true});
fs.writeFileSync(path.join(outputDir,'result.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
