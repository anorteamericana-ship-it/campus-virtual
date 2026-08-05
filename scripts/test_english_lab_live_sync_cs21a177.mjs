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
assert.match(source, /join_upgrade:true/);
assert.match(source, /gameLabel === MEMORY_GAME_LABEL/);
assert.doesNotMatch(source, /script\.google\.com\/macros|AKfycb/i);

assert.match(adapter, /const VERSION = 'CS21A177'/);
assert.match(adapter, /roomGameLabel\(room\) === GAME_LABEL/);
assert.match(adapter, /memory_match === true/);
assert.match(adapter, /english_lab_live_sync_guard_cs21a177\.js\?v=CS21A177/);
assert.match(adapter, /ensureSyncGuard/);
assert.doesNotMatch(adapter, /global\.fetch\s*=/);
assert.match(live, /EnglishLabMemoryMatchLiveCS21A174\.isMemoryMatchRoom\(room\)/);
assert.match(live, /englishLabMemoryMatchGetPlayerState/);

let underlyingCalls = 0;
let releaseRead;
const pendingRead = new Promise(resolve => { releaseRead = resolve; });

const fakeFetch = async (input, init = {}) => {
  underlyingCalls += 1;
  const endpoint = new URL(String(input), 'https://qa.local/').searchParams.get('fn');
  if (endpoint === 'englishLabMemoryMatchGetPlayerState') {
    await pendingRead;
    return new Response(JSON.stringify({
      ok:true,
      memory_match:true,
      room:{game_label:'Memory Match'},
      room_package:{cards:[{card_id:'A'},{card_id:'B'}]},
    }), {status:200, headers:{'content-type':'application/json'}});
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
  performance:{now:() => Date.now()},
  location:{href:'https://qa.local/campus.html'},
  CustomEvent:function CustomEvent(type, init){ this.type=type; this.detail=init && init.detail; },
  dispatchEvent:() => true,
};
context.window = context;
vm.createContext(context);
new vm.Script(source, {filename:guardPath}).runInContext(context);

assert.equal(context.EnglishLabLiveSyncCS21A177.isInstalled(), true);
assert.equal(context.EnglishLabLiveSyncCS21A177.isMemoryMatchPayload({room:{game_label:'Memory Match'}}), true);
assert.equal(context.EnglishLabLiveSyncCS21A177.isMemoryMatchPayload({room:{game_code:'VOCAB_SPRINT'}}), false);

const readUrl = 'https://qa.local/exec?fn=englishLabMemoryMatchGetPlayerState';
const readInit = {method:'POST', body:JSON.stringify({fn:'englishLabMemoryMatchGetPlayerState', room_code:'LAB-177', player_id:'P1'})};
const firstRead = context.fetch(readUrl, readInit);
const secondRead = context.fetch(readUrl, readInit);
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(underlyingCalls, 1, 'Dos lecturas idénticas simultáneas deben compartir una sola llamada');
releaseRead();
const [firstResponse, secondResponse] = await Promise.all([firstRead, secondRead]);
assert.deepEqual(await firstResponse.json(), await secondResponse.json());

const beforePlain = underlyingCalls;
const plainResponse = await context.fetch('https://qa.local/file.json');
assert.equal(await plainResponse.text(), 'plain');
assert.equal(underlyingCalls, beforePlain + 1, 'Fetch ajeno a English LAB debe pasar directo');

let joinCalls = 0;
context.fetch = async (input, init = {}) => {
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

// Reinstalar en un contexto limpio para validar el ascenso inmediato tras entrar.
const joinContext = {...context, window:null, fetch:context.fetch, __ENGLISH_LAB_LIVE_METRICS__:[]};
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

const metrics = joinContext.EnglishLabLiveSyncCS21A177.getMetrics();
assert.ok(metrics.some(item => item.endpoint === 'englishLabLiveJoinRoom'));
assert.ok(metrics.some(item => item.join_upgrade === true));

console.log(JSON.stringify({
  verdict:'APTO',
  detectedByLabel:true,
  coalescedReads:true,
  unrelatedFetchBypassed:true,
  immediateJoinUpgrade:true,
  metrics:metrics.length,
}, null, 2));
