#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/runtime_config.js', 'utf8');

function makeRuntime(environment='qa') {
  const calls = Object.create(null);
  const failFirst = new Set();
  const failAlways = new Set();

  function nativeFetch(input) {
    const url = String(input && input.url || input || '');
    const fn = String(new URL(url).searchParams.get('fn') || '');
    calls[fn] = (calls[fn] || 0) + 1;
    if (failAlways.has(fn) || (failFirst.has(fn) && calls[fn] === 1)) {
      return Promise.reject(new TypeError('Failed to fetch'));
    }
    return Promise.resolve({ok:true,status:200,url});
  }

  const appended = [];
  const document = {
    documentElement:{dataset:{},appendChild(node){ appended.push(node); }},
    head:{appendChild(node){ appended.push(node); }},
    createElement(){ return {src:'',async:false,defer:false,setAttribute(){}}; },
  };
  const window = {
    fetch:nativeFetch,
    __CAMPUS_RUNTIME_CONFIG__:{
      environment,
      appsScriptUrl: environment === 'production'
        ? ''
        : 'https://script.google.com/macros/s/QA_CS21A183_TEST/exec',
    },
    dispatchEvent(){},
  };
  const context = {
    window,
    document,
    URL,
    Request:globalThis.Request,
    CustomEvent:function CustomEvent(type, init){ this.type=type; this.detail=init && init.detail; },
    Promise,
    Date,
    Error,
    TypeError,
    String,
    Object,
    Array,
    RegExp,
    decodeURIComponent,
    setTimeout,
    clearTimeout,
  };
  vm.createContext(context);
  vm.runInContext(source, context, {filename:'runtime_config.js'});
  return {window,calls,failFirst,failAlways,appended};
}

const qa = makeRuntime('qa');
const qaBase = qa.window.APPS_SCRIPT_URL;

qa.failFirst.add('englishLabMemoryMatchGetRoomControl');
await qa.window.fetch(`${qaBase}?fn=englishLabMemoryMatchGetRoomControl`, {method:'POST',body:'{}'});
assert.equal(qa.calls.englishLabMemoryMatchGetRoomControl, 2, 'lectura segura debe reintentar una vez');
assert.equal(qa.window.__AN_ENGLISH_LAB_FETCH_METRICS__.retries, 1);
assert.equal(qa.window.__AN_ENGLISH_LAB_FETCH_METRICS__.recovered, 1);

qa.failFirst.add('englishLabMemoryMatchStartRoom');
await qa.window.fetch(`${qaBase}?fn=englishLabMemoryMatchStartRoom`, {method:'POST',body:'{}'});
assert.equal(qa.calls.englishLabMemoryMatchStartRoom, 2, 'StartRoom FIX3 es idempotente y reintenta una vez solo en QA');

qa.failFirst.add('englishLabLiveCloseRoom');
await assert.rejects(
  qa.window.fetch(`${qaBase}?fn=englishLabLiveCloseRoom`, {method:'POST',body:'{}'}),
  /Failed to fetch/
);
assert.equal(qa.calls.englishLabLiveCloseRoom, 1, 'mutaciones no declaradas idempotentes no deben reintentarse');

qa.failAlways.add('englishLabMemoryMatchGetPlayerState');
await assert.rejects(
  qa.window.fetch(`${qaBase}?fn=englishLabMemoryMatchGetPlayerState`, {method:'POST',body:'{}'}),
  error => error && error.code === 'ENGLISH_LAB_FETCH_FAILED' && /No se pudo conectar con English LAB/.test(error.message)
);
assert.equal(qa.calls.englishLabMemoryMatchGetPlayerState, 2, 'fallo persistente hace exactamente un reintento');
assert.equal(qa.window.__AN_ENGLISH_LAB_FETCH_METRICS__.failures, 1);

const prod = makeRuntime('production');
const prodBase = prod.window.APPS_SCRIPT_URL;
prod.failFirst.add('englishLabMemoryMatchStartRoom');
await assert.rejects(
  prod.window.fetch(`${prodBase}?fn=englishLabMemoryMatchStartRoom`, {method:'POST',body:'{}'}),
  /Failed to fetch/
);
assert.equal(prod.calls.englishLabMemoryMatchStartRoom, 1, 'StartRoom no recibe retry especial en producción');

console.log(JSON.stringify({
  ok:true,
  contract:'CS21A183_ENGLISH_LAB_FETCH_RESILIENCE',
  safe_read_retry_once:true,
  qa_idempotent_start_retry_once:true,
  unsafe_mutation_no_retry:true,
  persistent_failure_friendly_error:true,
  production_start_no_retry:true,
}, null, 2));
