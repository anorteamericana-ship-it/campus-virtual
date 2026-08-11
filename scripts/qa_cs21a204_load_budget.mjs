#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const adapter=fs.readFileSync('src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx','utf8');
const live=fs.readFileSync('src/english_lab_live.jsx','utf8');
const phases=[2,5,10,15,25];
const durationMs=60000;
const maxModeledRequestsPerSecond=20;
const tiers=[
  {maxPlayers:5,ms:550},
  {maxPlayers:10,ms:900},
  {maxPlayers:15,ms:1400},
  {maxPlayers:25,ms:2200},
];

function pollMsForPlayers(players){return tiers.find(t=>players<=t.maxPlayers)?.ms||3000;}
function modelLiveRound(players){
  const pollMs=pollMsForPlayers(players);
  const clients=players+1; // alumnos + proyector/control docente
  const pollsPerClient=Math.floor((durationMs-1)/pollMs)+1;
  const requestsPerMinute=clients*pollsPerClient;
  const requestsPerSecond=Number((requestsPerMinute/60).toFixed(2));
  return {
    phase:'LIVE_ROOM_PACKAGE',players,clients,pollMs,pollsPerClient,
    requestsPerMinute,requestsPerSecond,
    maxConcurrentPollsPerClient:1,
    withinNetworkBudget:requestsPerSecond<maxModeledRequestsPerSecond,
    headroomRequestsPerSecond:Number((maxModeledRequestsPerSecond-requestsPerSecond).toFixed(2)),
  };
}
function modelCreatedLobby(players){
  // CS203 lobby: estudiante 1200 ms; una vista docente 1000 ms.
  const studentRpm=players*Math.floor((durationMs-1)/1200+1);
  const teacherRpm=Math.floor((durationMs-1)/1000+1);
  const rpm=studentRpm+teacherRpm;
  return {
    phase:'CREATED_BEFORE_ROOM_PACKAGE',players,
    studentPollMs:1200,teacherPollMs:1000,
    requestsPerMinute:rpm,
    requestsPerSecond:Number((rpm/60).toFixed(2)),
    maxConcurrentPollsPerClient:1,
  };
}

for(const {maxPlayers,ms} of tiers){
  assert.match(adapter,new RegExp(`Object\\.freeze\\(\\{maxPlayers:${maxPlayers},ms:${ms}\\}\\)`));
}
assert.match(adapter,/let inFlight=false;/);
assert.match(adapter,/if\(inFlight\)\{wakeRequested=true;return;\}/);
assert.doesNotMatch(adapter,/setInterval\s*\(\s*poll/,'El poll CS192 Live no debe superponerse con setInterval.');
assert.match(adapter,/const POLL_TIMEOUT_MS=8000;/);
assert.match(adapter,/const MUTATION_TIMEOUT_MS=45000;/);

// CS203 añade el dueño de lobby sólo mientras todavía no existe room_package.
assert.match(live,/if\(!memoryMatch \|\| memoryPackage \|\| status!=='CREATED'\) return undefined;/);
assert.match(live,/const id=setInterval\(pollLobby,1000\);/);
assert.match(live,/const memoryPackageReady=!!\(isMemoryMatch && state\?\.room_package\);/);
assert.match(live,/if\(memoryPackageReady\) return undefined;/);
assert.match(live,/const id=setInterval\(pollLobby,isMemoryMatch\?1200:4000\);/);
assert.match(live,/let inFlight=false;/,'Los lobby pollers deben bloquear requests superpuestas.');

const liveModels=phases.map(modelLiveRound);
const lobbyModels=phases.map(modelCreatedLobby);
for(const item of liveModels){
  assert.equal(item.maxConcurrentPollsPerClient,1);
  assert.equal(item.withinNetworkBudget,true,`${item.players} jugadores exceden ${maxModeledRequestsPerSecond} req/s en modelo Live.`);
}
for(const item of lobbyModels){
  assert.equal(item.maxConcurrentPollsPerClient,1);
}

const output={
  ok:true,
  version:'CS21A204-LOAD-BUDGET-1',
  verdict:'PASS_MODEL_ONLY_NOT_AUTHENTICATED_LOAD',
  assumptions:{
    phases,
    oneTeacherView:true,
    cs203LobbyPollStopsAtRoomPackage:true,
    cs192RecursivePollOwnsLiveRound:true,
    networkLatencyMs:0,
    sheetAndLockCapacityNotProven:true,
  },
  warning:'Este presupuesto valida tráfico/polling del cliente. NO demuestra capacidad real de Apps Script/Sheets con 5/10/15/25 sesiones autenticadas.',
  maxModeledRequestsPerSecond,
  lobbyModels,
  liveModels,
  authenticatedLoad:{players2:'PASS manual Profe + Chu + Naty (CS203 base)',players5_10_15_25:'PENDING unique QA sessions'},
};
const out=path.resolve('qa-output/cs21a204-load-budget');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
