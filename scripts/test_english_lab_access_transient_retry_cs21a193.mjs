#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const sourcePath = 'src/english_lab_free_access_cs21a66.js';
const source = fs.readFileSync(sourcePath, 'utf8');

function storage() {
  const values = new Map();
  return {
    values,
    getItem:key => values.has(key) ? values.get(key) : null,
    setItem:(key, value) => values.set(key, String(value)),
    removeItem:key => values.delete(key),
  };
}

function jsonResponse(data, status = 200) {
  return {
    ok:status >= 200 && status < 300,
    status,
    text:async () => JSON.stringify(data),
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return {promise, resolve, reject};
}

function createHarness({sessionStorage, fetchImpl, timeoutMs = 0}) {
  const listeners = new Map();
  let fetchCalls = 0;
  let currentUser = {rol:'student', codigo:'QA-STU-CHU', cedula:'QA-CED-CHU'};
  const scheduled = new Set();
  const testHooks = timeoutMs > 0 ? {englishLabAccessTimeoutMs:timeoutMs} : {};

  function addEventListener(name, listener) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(listener);
  }
  function removeEventListener(name, listener) {
    listeners.get(name)?.delete(listener);
  }
  function dispatchEvent(event) {
    for (const listener of listeners.get(event.type) || []) listener(event);
    return true;
  }
  function controlledSetTimeout(callback, delay) {
    if (timeoutMs > 0 && Number(delay) === timeoutMs) {
      const timer = setTimeout(callback, delay);
      scheduled.add(timer);
      return timer;
    }
    return 1;
  }
  function controlledClearTimeout(timer) {
    if (!scheduled.has(timer)) return;
    clearTimeout(timer);
    scheduled.delete(timer);
  }

  const window = {
    __CAMPUS_TEST_HOOKS__:testHooks,
    APPS_SCRIPT_URL:'https://script.google.com/macros/s/QA_TEST/exec',
    getSesion:() => currentUser,
    getSessionToken:() => 'qa-token',
    sessionStorage,
    document:{documentElement:{}, querySelectorAll:() => []},
    addEventListener,
    removeEventListener,
    dispatchEvent,
    requestAnimationFrame:() => 1,
    setInterval:() => 1,
    clearInterval:() => {},
    setTimeout:controlledSetTimeout,
    clearTimeout:controlledClearTimeout,
    MutationObserver:class MutationObserver { observe() {} },
    CustomEvent:class CustomEvent {
      constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
    },
    AbortController,
    URL,
    console,
  };
  const wrappedFetch = (...args) => {
    fetchCalls += 1;
    return fetchImpl(...args);
  };
  window.fetch = wrappedFetch;
  window.window = window;

  const context = {
    window,
    document:window.document,
    sessionStorage,
    MutationObserver:window.MutationObserver,
    CustomEvent:window.CustomEvent,
    AbortController,
    URL,
    fetch:wrappedFetch,
    setTimeout:controlledSetTimeout,
    clearTimeout:controlledClearTimeout,
    setInterval:window.setInterval,
    clearInterval:window.clearInterval,
    requestAnimationFrame:window.requestAnimationFrame,
    console,
  };
  vm.runInNewContext(source, context, {filename:sourcePath});
  return {
    api:window.anEnglishLabFreeAccess,
    fetchCalls:() => fetchCalls,
    changeUser:user => {
      currentUser = {...user};
      dispatchEvent(new window.CustomEvent('an:session-changed'));
    },
    close:() => {
      for (const timer of scheduled) clearTimeout(timer);
      scheduled.clear();
    },
  };
}

const transientStorage = storage();
const abortHarness = createHarness({
  sessionStorage:transientStorage,
  fetchImpl:async () => {
    throw new DOMException('signal is aborted without reason', 'AbortError');
  },
});
const aborted = await abortHarness.api.check(false);
assert.equal(abortHarness.api.timeoutMs, 60000, 'El timeout normal debe dar 60 segundos al backend.');
assert.equal(aborted.checked, false, 'AbortError no puede presentarse como verificación concluida.');
assert.equal(aborted.allowed, false, 'AbortError siempre debe fallar cerrado.');
assert.equal(aborted.retryable, true, 'AbortError debe permitir reintento.');
assert.equal(aborted.estado, 'NO_CONFIRMADO');
assert.equal(aborted.errorCode, 'ENGLISH_LAB_ACCESS_TIMEOUT');
assert.doesNotMatch(aborted.message, /signal is aborted|aborterror|no disponible/i);
assert.equal(transientStorage.values.size, 0, 'AbortError no debe persistirse durante dos minutos.');
abortHarness.close();

const timeoutStorage = storage();
const timeoutHarness = createHarness({
  sessionStorage:timeoutStorage,
  timeoutMs:10,
  fetchImpl:(_url, init = {}) => new Promise((_resolve, reject) => {
    init.signal?.addEventListener('abort', () => {
      reject(new DOMException('signal is aborted without reason', 'AbortError'));
    }, {once:true});
  }),
});
const timedOut = await timeoutHarness.api.check(false);
timeoutHarness.close();
assert.equal(timeoutHarness.api.timeoutMs, 10, 'El hook sintético no redujo el timeout de la prueba.');
assert.equal(timedOut.checked, false, 'Un timeout no puede presentarse como verificación concluida.');
assert.equal(timedOut.allowed, false, 'El cliente nunca puede autorizar acceso tras un timeout.');
assert.equal(timedOut.retryable, true, 'El timeout debe permitir reintento.');
assert.equal(timedOut.estado, 'NO_CONFIRMADO');
assert.equal(timedOut.errorCode, 'ENGLISH_LAB_ACCESS_TIMEOUT');
assert.doesNotMatch(timedOut.message, /signal is aborted|aborterror|no disponible/i);
assert.equal(timeoutStorage.values.size, 0, 'El timeout no debe persistirse durante dos minutos.');

const retryGate = deferred();
const retryHarness = createHarness({
  sessionStorage:transientStorage,
  fetchImpl:() => retryGate.promise,
});
assert.equal(retryHarness.api.get().estado, 'SIN_VERIFICAR', 'Una nueva carga no debe restaurar el timeout.');
const retryOne = retryHarness.api.check(true);
const retryTwo = retryHarness.api.check(true);
assert.equal(retryHarness.fetchCalls(), 1, 'Dos reintentos simultáneos deben compartir una sola solicitud.');
assert.deepEqual(
  {
    loading:retryHarness.api.get().loading,
    checked:retryHarness.api.get().checked,
    allowed:retryHarness.api.get().allowed,
    estado:retryHarness.api.get().estado,
  },
  {loading:true, checked:false, allowed:false, estado:'VERIFICANDO'},
  'El reintento debe mostrar una verificación real y seguir fail-closed.',
);
retryGate.resolve(jsonResponse({
  ok:true,
  allowed:true,
  autorizado:true,
  estado:'AL_DIA',
  mensaje:'Acceso habilitado.',
  version:'F98.4-Z6-CS21A193',
}));
await Promise.all([retryOne, retryTwo]);
assert.equal(retryHarness.api.get().loading, false);
assert.equal(retryHarness.api.get().checked, true);
assert.equal(retryHarness.api.get().allowed, true);
assert.equal(retryHarness.api.get().estado, 'AL_DIA');
assert.equal(transientStorage.values.size, 1, 'Una autorización confirmada sí debe quedar en caché.');
retryHarness.close();

const inconclusiveStorage = storage();
const inconclusiveHarness = createHarness({
  sessionStorage:inconclusiveStorage,
  fetchImpl:async () => jsonResponse({
    ok:true,
    allowed:false,
    autorizado:false,
    estado:'ESTADO_FINANCIERO_NO_CONFIRMADO',
    mensaje:'No fue posible confirmar que tu cuenta esté al día.',
  }),
});
const inconclusive = await inconclusiveHarness.api.check(false);
assert.equal(inconclusive.checked, false);
assert.equal(inconclusive.allowed, false);
assert.equal(inconclusive.retryable, true);
assert.equal(inconclusive.estado, 'ESTADO_FINANCIERO_NO_CONFIRMADO');
assert.doesNotMatch(inconclusive.message, /no disponible/i);
assert.equal(inconclusiveStorage.values.size, 0, 'Un estado backend inconcluso no debe persistirse.');
inconclusiveHarness.close();

const contradictoryStorage = storage();
const contradictoryHarness = createHarness({
  sessionStorage:contradictoryStorage,
  fetchImpl:async () => jsonResponse({
    ok:true,
    allowed:true,
    autorizado:true,
    estado:'ESTADO_FINANCIERO_NO_CONFIRMADO',
    mensaje:'No fue posible confirmar que tu cuenta esté al día.',
  }),
});
const contradictory = await contradictoryHarness.api.check(false);
assert.equal(contradictory.checked, false);
assert.equal(contradictory.allowed, false, 'Un estado inconcluso prevalece sobre cualquier allowed cliente contradictorio.');
assert.equal(contradictory.retryable, true);
assert.equal(contradictoryStorage.values.size, 0);
contradictoryHarness.close();

const failedResponseStorage = storage();
const failedResponseHarness = createHarness({
  sessionStorage:failedResponseStorage,
  fetchImpl:async () => jsonResponse({
    ok:false,
    allowed:false,
    autorizado:false,
    estado:'SESION_REQUERIDA',
    mensaje:'Debés iniciar sesión para entrar a English LAB.',
  }),
});
const failedResponse = await failedResponseHarness.api.check(false);
assert.equal(failedResponse.checked, false, 'data.ok=false no debe convertirse en una decisión cliente.');
assert.equal(failedResponse.allowed, false);
assert.equal(failedResponse.retryable, true);
assert.equal(failedResponse.estado, 'NO_CONFIRMADO');
assert.equal(failedResponseStorage.values.size, 0, 'data.ok=false debe permanecer temporal y sin caché.');
failedResponseHarness.close();

const deniedStorage = storage();
const deniedHarness = createHarness({
  sessionStorage:deniedStorage,
  fetchImpl:async () => jsonResponse({
    ok:true,
    allowed:false,
    autorizado:false,
    estado:'CUENTA_PENDIENTE',
    mensaje:'English LAB está disponible cuando tu cuenta se encuentre al día.',
  }),
});
const denied = await deniedHarness.api.check(false);
assert.equal(denied.checked, true);
assert.equal(denied.allowed, false);
assert.equal(denied.retryable, false);
assert.equal(denied.estado, 'CUENTA_PENDIENTE');
assert.equal(deniedStorage.values.size, 1, 'Una denegación real debe conservar el caché vigente.');
deniedHarness.close();

const cachedDenialHarness = createHarness({
  sessionStorage:deniedStorage,
  fetchImpl:async () => { throw new Error('No debió consultar la red.'); },
});
const cachedDenial = await cachedDenialHarness.api.check(false);
assert.equal(cachedDenial.estado, 'CUENTA_PENDIENTE');
assert.equal(cachedDenialHarness.fetchCalls(), 0, 'La denegación concluyente debe reutilizar su caché.');
cachedDenialHarness.close();

const sessionRaceStorage = storage();
const previousUserResponse = deferred();
let sessionRaceCalls = 0;
const sessionRaceHarness = createHarness({
  sessionStorage:sessionRaceStorage,
  fetchImpl:async () => {
    sessionRaceCalls += 1;
    if (sessionRaceCalls === 1) return previousUserResponse.promise;
    return jsonResponse({
      ok:true,
      allowed:false,
      autorizado:false,
      estado:'CUENTA_PENDIENTE',
      mensaje:'La cuenta del usuario actual está pendiente.',
      version:'F98.4-Z6-CS21A193',
    });
  },
});
const previousRequest = sessionRaceHarness.api.check(true);
sessionRaceHarness.changeUser({rol:'student', codigo:'QA-STU-NATY', cedula:'QA-CED-NATY'});
const currentRequest = sessionRaceHarness.api.check(true);
await currentRequest;
assert.equal(sessionRaceHarness.fetchCalls(), 2, 'La sesión nueva debe iniciar una verificación propia.');
assert.equal(sessionRaceHarness.api.get().allowed, false);
assert.equal(sessionRaceHarness.api.get().estado, 'CUENTA_PENDIENTE');
previousUserResponse.resolve(jsonResponse({
  ok:true,
  allowed:true,
  autorizado:true,
  estado:'AL_DIA',
  mensaje:'Respuesta tardía del usuario anterior.',
  version:'OLD-SESSION',
}));
await previousRequest;
assert.equal(sessionRaceHarness.api.get().allowed, false, 'La respuesta tardía de otra sesión no puede autorizar al usuario actual.');
assert.equal(sessionRaceHarness.api.get().estado, 'CUENTA_PENDIENTE');
assert.match(sessionRaceHarness.api.get().signature,/QA-STU-NATY/,'El estado final debe pertenecer a la sesión vigente.');
assert.doesNotMatch(sessionRaceHarness.api.get().version,/OLD-SESSION/,'La respuesta antigua no debe publicarse.');
sessionRaceHarness.close();

console.log(JSON.stringify({
  ok:true,
  version:'CS21A193',
  defaultTimeoutMs:60000,
  syntheticTimeoutMs:10,
  abortErrorIsTemporary:true,
  timeoutIsTemporary:true,
  transientCache:false,
  inconclusiveBackendCache:false,
  failedBackendResponseCache:false,
  retryLoading:true,
  duplicateRetryRequests:0,
  retryRecoveredTo:'AL_DIA',
  conclusiveDenialCache:true,
  clientAuthorization:false,
  staleSessionResponseDiscarded:true,
}, null, 2));
