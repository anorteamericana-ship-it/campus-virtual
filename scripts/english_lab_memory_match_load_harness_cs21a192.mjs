#!/usr/bin/env node
// CS21A206: el modelo activo sigue perteneciendo a CS192, pero CS203 añadió
// polling de lobby antes de room_package. Este guard exige el handoff explícito:
// lobby/presencia antes de StartRoom -> CS192 como dueño único con room_package.
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

// Dueño autoritativo durante COUNTDOWN/LIVE.
assert.match(adapter,/Object\.freeze\(\{maxPlayers:5,ms:550\}\)/);
assert.match(adapter,/Object\.freeze\(\{maxPlayers:10,ms:900\}\)/);
assert.match(adapter,/Object\.freeze\(\{maxPlayers:15,ms:1400\}\)/);
assert.match(adapter,/Object\.freeze\(\{maxPlayers:25,ms:2200\}\)/);
assert.match(adapter,/const POLL_TIMEOUT_MS=8000;/);
assert.match(adapter,/const MUTATION_TIMEOUT_MS=45000;/);
assert.match(adapter,/let inFlight=false;/);
assert.match(adapter,/if\(inFlight\)\{wakeRequested=true;return;\}/);
assert.doesNotMatch(adapter,/setInterval\s*\(\s*poll/,'CS21A192 no debe reintroducir polling superpuesto con setInterval.');
assert.match(adapter,/invalidateClientReadCache\('CS21A192_AUTHORITATIVE_POLL'\)/,'Cada poll autoritativo debe invalidar el recent-cache anterior.');

// CS203: el polling exterior ya no está prohibido de forma absoluta. Puede existir
// sólo como lobby/presencia antes de room_package y debe autoapagarse al recibirlo.
assert.match(live,/const memoryPackageReady=!!\(isMemoryMatch && state\?\.room_package\);/,'El estudiante debe detectar cuándo CS192 puede tomar propiedad.');
assert.match(live,/if\(memoryPackageReady\) return undefined;/,'El lobby estudiante debe apagarse en cuanto existe room_package.');
assert.match(live,/if\(isMemoryMatch\) pollLobby\(\);/,'Memory Match debe consultar el lobby inmediatamente antes del Start.');
assert.match(live,/setInterval\(pollLobby,isMemoryMatch\?1200:4000\)/,'El lobby estudiante Memory debe mantenerse en 1200 ms antes del paquete.');
assert.match(live,/if\(!memoryMatch \|\| memoryPackage \|\| status!==['"]CREATED['"]\) return undefined;/,'El lobby docente debe existir sólo en CREATED y sin room_package.');
assert.match(live,/setInterval\(pollLobby,1000\)/,'El docente debe refrescar presencia cada 1000 ms antes del Start.');
assert.match(live,/if\(disposed \|\| inFlight\) return;/,'Los lobby polls también deben impedir solicitudes superpuestas.');
assert.match(live,/isMemoryMatch && state\?\.room_package && typeof MemoryMatchLiveRoundCS21A174 === ['"]function['"]/,'El estudiante debe montar el round autoritativo al recibir room_package.');
assert.match(live,/memoryMatch && memoryPackage && typeof MemoryMatchLiveRoundCS21A174 === ['"]function['"]/,'El docente debe montar el round autoritativo al recibir room_package.');

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
  verdict:'PASS_MEMORY_MATCH_LOAD_MODEL_CS21A192',
  contract_revision:'CS21A206-CS203-LOBBY-HANDOFF',
  durationMs,
  assumptions:{
    phase:'COUNTDOWN_OR_LIVE_WITH_ROOM_PACKAGE',
    authoritativeSingleRecursivePollOwner:true,
    preStartLobbyPollingExcludedFromActiveModel:true,
    preStartStudentLobbyMs:1200,
    preStartTeacherLobbyMs:1000,
    lobbyStopsWhenRoomPackageArrives:true,
    nextPollAfterCompletion:true,
    teacherViews:1,
    recentCache:false,
    networkLatencyMs:0,
  },
  note:'Es un presupuesto determinista de red del cliente durante la fase activa con room_package; no sustituye carga autenticada contra Apps Script QA.',
  maxModeledRequestsPerSecond,models,
};
const outputDir=path.resolve('qa-output/cs21a192-load-budget');
fs.mkdirSync(outputDir,{recursive:true});
fs.writeFileSync(path.join(outputDir,'result.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
