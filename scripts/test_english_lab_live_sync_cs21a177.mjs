#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const guardPath = 'src/english_lab_games/english_lab_live_sync_guard_cs21a177.js';
const adapterPath = 'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx';
const livePath = 'src/english_lab_live.jsx';

for (const path of [guardPath, adapterPath, livePath]) {
  assert.equal(fs.existsSync(path), true, `Falta ${path}`);
}

const source = fs.readFileSync(guardPath, 'utf8');
const adapter = fs.readFileSync(adapterPath, 'utf8');
const live = fs.readFileSync(livePath, 'utf8');

assert.match(source, /endpoint\.indexOf\('englishLab'\) !== 0/);
assert.match(source, /return originalFetch\(input, init\)/);
assert.match(source, /READ_ENDPOINTS/);
assert.match(source, /inFlightReads/);
assert.match(source, /recentReads/);
assert.match(source, /READ_CACHE_FIX_VERSION = 'CS21A188'/);
assert.match(source, /READ_CACHE_MS = 750/);
assert.match(source, /cacheGeneration/);
assert.match(source, /invalidateReadCache/);
assert.match(source, /entry\.generation === cacheGeneration/);
assert.match(source, /join_upgrade:true/);
assert.match(source, /gameLabel === MEMORY_GAME_LABEL/);
assert.doesNotMatch(source, /script\.google\.com\/macros|AKfycb/i);

assert.match(adapter, /const VERSION = 'CS21A188'/);
assert.match(adapter, /const LIVE_POLL_MS = 1500/);
assert.match(adapter, /roomGameLabel\(room\) === GAME_LABEL/);
assert.match(adapter, /memory_match === true/);
assert.match(adapter, /english_lab_live_sync_guard_cs21a177\.js\?v=CS21A188/);
assert.match(adapter, /ensureSyncGuard/);
assert.match(adapter, /visibilityState === 'hidden'/);
assert.match(adapter, /pollingRef\.current/);
assert.doesNotMatch(adapter, /global\.fetch\s*=/);
assert.match(live, /EnglishLabMemoryMatchLiveCS21A174\.isMemoryMatchRoom\(room\)/);
assert.match(live, /englishLabMemoryMatchGetPlayerState/);

let clock = 1000;
let underlyingCalls = 0;
let releaseRead;
const pendingRead = new Promise(resolve => { releaseRead = resolve; });

const fakeFetch = async (input, init = {}) => {
  underlyingCalls += 1;
  const endpoint = new URL(String(input), 'https://qa.local/').searchParams.get('fn');
  if (endpoint === 'englishLabMemoryMatchGetPlayerState') {
    if (underlyingCalls === 1) await pendingRead;
    return new Response(JSON.stringify({
      ok:true,
      memory_match:true,
      room:{game_label:'Memory Match',room_code:'LAB-177'},
      room_package:{shared_state:{board_version:underlyingCalls},cards:[{card_id:'A'},{card_id:'B'}]},
    }), {status:200, headers:{'content-type':'application/json'}});
  }
  if (endpoint === 'englishLabMemoryMatchSubmitPair') {
    return new Response(JSON.stringify({ok:true,accepted:true}), {status:200, headers:{'content-type':'application/json'}});
  }
  if (endpoint === 'englishLabLiveJoinRoom') {
    return new Response(JSON.stringify({
      ok:true,
      room:{game_label:'Memory Match', room_code:'LAB-177'},
      player:{cod_estudiante:'P1'},
      question:{prompt:'LEGACY SHOULD NOT RENDER'},
    }), {status:200, headers:{'content-type':'application/json'}});
  }
  return new Response('plain', {status:200});
};

const context = {
  window:null,
  fetch:fakeFetch,
  Response,
  URL,
  Date,
  JSON,
  Object,
  Array,
  Map,
  String,
  Number,
  Math,
  Promise,
  setTimeout,
  clearTimeout,
  performance:{now:() => clock},
  location:{href:'https://qa.local/campus.html'},
  CustomEvent:function CustomEvent(type, init){ this.type=type; this.detail=init && init.detail; },
  dispatchEvent:() => true,
};
context.window = context;
vm.createContext(context);
new vm.Script(source, {filename:guardPath}).runInContext(context);

const sync = context.EnglishLabLiveSyncCS21A177;
assert.equal(sync.isInstalled(), true);
assert.equal(sync.VERSION,'CS21A177','Se conserva la API histórica CS21A177.');
assert.equal(sync.READ_CACHE_FIX_VERSION,'CS21A188');
assert.equal(sync.READ_CACHE_MS,750);
assert.equal(sync.isMemoryMatchPayload({room:{game_label:'Memory Match'}}), true);
assert.equal(sync.isMemoryMatchPayload({room:{game_code:'VOCAB_SPRINT'}}), false);

const readUrl = 'https://qa.local/exec?fn=englishLabMemoryMatchGetPlayerState';
const readInit = {method:'POST', body:JSON.stringify({fn:'englishLabMemoryMatchGetPlayerState',token:'T1',room_code:'LAB-177',player_id:'P1',player_name:'Chu'})};
const readInitSpecialized = {method:'POST', body:JSON.stringify({fn:'englishLabMemoryMatchGetPlayerState',token:'T1',room_code:'LAB-177',player_id:'P1',cod_estudiante:'P1'})};

// Dos lecturas equivalentes simultáneas, aunque el body tenga campos inocuos
// distintos, deben compartir una sola llamada física.
const firstRead = context.fetch(readUrl, readInit);
const secondRead = context.fetch(readUrl, readInitSpecialized);
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(underlyingCalls, 1, 'Polling base + especializado simultáneo deben compartir una sola llamada');
releaseRead();
const [firstResponse, secondResponse] = await Promise.all([firstRead, secondRead]);
assert.deepEqual(await firstResponse.json(), await secondResponse.json());

// Dentro de 750 ms debe reutilizar el snapshot ya resuelto sin tocar backend.
clock += 500;
const cachedResponse = await context.fetch(readUrl, readInitSpecialized);
assert.equal((await cachedResponse.json()).ok,true);
assert.equal(underlyingCalls,1,'Lectura equivalente dentro del microcaché no debe golpear Apps Script.');

// Vencido el TTL sí debe refrescar.
clock += 751;
const refreshedResponse = await context.fetch(readUrl, readInitSpecialized);
assert.equal((await refreshedResponse.json()).ok,true);
assert.equal(underlyingCalls,2,'Al vencer el microcaché se requiere una lectura física nueva.');

// Una mutación invalida la generación de caché inmediatamente.
clock += 100;
const writeResponse = await context.fetch('https://qa.local/exec?fn=englishLabMemoryMatchSubmitPair', {
  method:'POST',body:JSON.stringify({fn:'englishLabMemoryMatchSubmitPair',token:'T1',room_code:'LAB-177',player_id:'P1',answer_value:{action:'DISCOVER_CARD',card_id:'A'}})
});
assert.equal((await writeResponse.json()).ok,true);
assert.equal(underlyingCalls,3);
clock += 50;
const afterWrite = await context.fetch(readUrl, readInitSpecialized);
assert.equal((await afterWrite.json()).ok,true);
assert.equal(underlyingCalls,4,'Después de una jugada la lectura no puede reutilizar snapshot anterior.');

const beforePlain = underlyingCalls;
const plainResponse = await context.fetch('https://qa.local/file.json');
assert.equal(await plainResponse.text(), 'plain');
assert.equal(underlyingCalls, beforePlain + 1, 'Fetch ajeno a English LAB debe pasar directo');

let joinCalls = 0;
const joinFetch = async (input, init = {}) => {
  joinCalls += 1;
  const endpoint = new URL(String(input), 'https://qa.local/').searchParams.get('fn');
  if (endpoint === 'englishLabLiveJoinRoom') {
    return new Response(JSON.stringify({ok:true,room:{game_label:'Memory Match'},player:{cod_estudiante:'P1'}}), {status:200});
  }
  if (endpoint === 'englishLabMemoryMatchGetPlayerState') {
    return new Response(JSON.stringify({ok:true,memory_match:true,room:{game_label:'Memory Match'},room_package:{cards:[1,2]}}), {status:200});
  }
  return new Response('{}', {status:200});
};

// Reinstalar en un contexto limpio para validar ascenso inmediato tras entrar.
let joinClock=2000;
const joinContext = {
  ...context,
  window:null,
  fetch:joinFetch,
  performance:{now:()=>joinClock},
  __ENGLISH_LAB_LIVE_METRICS__:[],
};
joinContext.window = joinContext;
vm.createContext(joinContext);
new vm.Script(source, {filename:guardPath}).runInContext(joinContext);
const joinResponse = await joinContext.fetch('https://qa.local/exec?fn=englishLabLiveJoinRoom', {
  method:'POST',
  body:JSON.stringify({fn:'englishLabLiveJoinRoom', room_code:'LAB-177', player_id:'P1'}),
});
const joined = await joinResponse.json();
assert.equal(joined.memory_match, true);
assert.ok(joined.room_package, 'El ingreso Memory Match debe devolver el paquete sin esperar el siguiente polling');
assert.equal(joinCalls, 2, 'Ingreso Memory Match debe hacer join y una lectura especializada');

const metrics = context.EnglishLabLiveSyncCS21A177.getMetrics();
assert.ok(metrics.some(item => item.cached === true),'Debe registrar reutilización del microcaché.');
assert.ok(metrics.some(item => item.endpoint === 'CACHE_INVALIDATE'),'Debe registrar invalidación ante mutaciones.');
const joinMetrics = joinContext.EnglishLabLiveSyncCS21A177.getMetrics();
assert.ok(joinMetrics.some(item => item.endpoint === 'englishLabLiveJoinRoom'));
assert.ok(joinMetrics.some(item => item.join_upgrade === true));

console.log(JSON.stringify({
  verdict:'APTO',
  version:'CS21A188-SYNC-CACHE',
  detectedByLabel:true,
  coalescedReads:true,
  equivalentPayloadsCoalesced:true,
  recentReadCacheMs:750,
  recentReadsReused:true,
  mutationsInvalidateCache:true,
  staleInflightCannotRepopulateCache:true,
  unrelatedFetchBypassed:true,
  immediateJoinUpgrade:true,
  adapterLivePollMs:1500,
  hiddenTabPaused:true,
  metrics:metrics.length + joinMetrics.length,
}, null, 2));
