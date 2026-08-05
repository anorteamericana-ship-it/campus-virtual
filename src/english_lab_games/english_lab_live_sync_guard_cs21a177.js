// CS21A177 · Protección acotada de sincronización y diagnóstico para English LAB Live.
// No contiene contenido pedagógico ni URLs de deployment.
(function (global) {
  'use strict';

  const VERSION = 'CS21A177';
  const METRIC_EVENT = 'english-lab-live-metric';
  const MAX_METRICS = 120;
  const MEMORY_GAME_ID = 'MEMORY_MATCH';
  const MEMORY_GAME_LABEL = 'MEMORY MATCH';
  const JOIN_ENDPOINT = 'englishLabLiveJoinRoom';
  const MEMORY_PLAYER_ENDPOINT = 'englishLabMemoryMatchGetPlayerState';
  const READ_ENDPOINTS = Object.freeze([
    'englishLabLiveGetPlayerState',
    'englishLabLiveGetRoomControl',
    MEMORY_PLAYER_ENDPOINT,
    'englishLabMemoryMatchGetRoomControl',
  ]);

  const inFlightReads = new Map();
  let installed = false;
  let originalFetch = null;

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function upper(value) {
    return clean(value).toUpperCase();
  }

  function nowMs() {
    return global.performance && typeof global.performance.now === 'function'
      ? global.performance.now()
      : Date.now();
  }

  function endpointFromRequest(input) {
    try {
      const raw = typeof input === 'string' ? input : input && input.url;
      if (!raw) return '';
      const base = global.location && global.location.href || 'https://local.invalid/';
      return clean(new URL(raw, base).searchParams.get('fn'));
    } catch (_) {
      return '';
    }
  }

  function replaceEndpoint(input, endpoint) {
    const raw = typeof input === 'string' ? input : input && input.url;
    const base = global.location && global.location.href || 'https://local.invalid/';
    const url = new URL(raw, base);
    url.searchParams.set('fn', endpoint);
    return url.toString();
  }

  function bodyText(init) {
    return clean(init && init.body);
  }

  function parseBody(init) {
    const text = bodyText(init);
    if (!text) return {};
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function isMemoryMatchPayload(data) {
    if (!data || typeof data !== 'object') return false;
    if (data.memory_match === true || data.memoryMatch === true) return true;
    const room = data.room && typeof data.room === 'object' ? data.room : data;
    const gameId = upper(
      room.game_id || room.gameId || room.game_code || room.gameCode ||
      room.GAME_ID || room.GAME_CODE
    );
    const gameLabel = upper(
      room.game_label || room.gameLabel || room.GAME_LABEL || room.label
    );
    return gameId === MEMORY_GAME_ID || gameLabel === MEMORY_GAME_LABEL;
  }

  function metricsStore() {
    if (!Array.isArray(global.__ENGLISH_LAB_LIVE_METRICS__)) {
      global.__ENGLISH_LAB_LIVE_METRICS__ = [];
    }
    return global.__ENGLISH_LAB_LIVE_METRICS__;
  }

  function recordMetric(metric) {
    const detail = Object.freeze({...metric, version:VERSION});
    const store = metricsStore();
    store.push(detail);
    if (store.length > MAX_METRICS) store.splice(0, store.length - MAX_METRICS);
    try {
      if (typeof global.CustomEvent === 'function' && typeof global.dispatchEvent === 'function') {
        global.dispatchEvent(new global.CustomEvent(METRIC_EVENT, {detail}));
      }
    } catch (_) {}
    return detail;
  }

  function metric(endpoint, startedAt, response, extra) {
    return recordMetric({
      endpoint,
      elapsed_ms:Math.max(0, Math.round(nowMs() - startedAt)),
      status:response ? Number(response.status || 0) : 0,
      ok:!!(response && response.ok),
      recorded_at:new Date().toISOString(),
      ...(extra || {}),
    });
  }

  async function responseSnapshot(response) {
    const copy = response.clone();
    const body = await copy.text();
    const headers = [];
    try { response.headers.forEach((value, name) => headers.push([name, value])); } catch (_) {}
    return {
      body,
      status:response.status,
      statusText:response.statusText,
      headers,
    };
  }

  function responseFromSnapshot(snapshot) {
    return new global.Response(snapshot.body, {
      status:snapshot.status,
      statusText:snapshot.statusText,
      headers:snapshot.headers,
    });
  }

  async function upgradeJoinIfNeeded(input, init, response, startedAt) {
    metric(JOIN_ENDPOINT, startedAt, response, {coalesced:false});
    let data = null;
    try { data = await response.clone().json(); } catch (_) { return response; }
    if (!response.ok || !isMemoryMatchPayload(data)) return response;

    const payload = parseBody(init);
    payload.fn = MEMORY_PLAYER_ENDPOINT;
    const nextInit = {...(init || {}), body:JSON.stringify(payload)};
    const nextInput = replaceEndpoint(input, MEMORY_PLAYER_ENDPOINT);
    const upgradeStartedAt = nowMs();

    try {
      const upgraded = await originalFetch(nextInput, nextInit);
      metric(MEMORY_PLAYER_ENDPOINT, upgradeStartedAt, upgraded, {
        coalesced:false,
        join_upgrade:true,
      });
      return upgraded.ok ? upgraded : response;
    } catch (error) {
      recordMetric({
        endpoint:MEMORY_PLAYER_ENDPOINT,
        elapsed_ms:Math.max(0, Math.round(nowMs() - upgradeStartedAt)),
        status:0,
        ok:false,
        coalesced:false,
        join_upgrade:true,
        error:clean(error && error.message || error),
        recorded_at:new Date().toISOString(),
      });
      return response;
    }
  }

  async function runCoalescedRead(input, init, endpoint) {
    const key = endpoint + '|' + bodyText(init);
    const startedAt = nowMs();
    let shared = true;
    let task = inFlightReads.get(key);

    if (!task) {
      shared = false;
      task = originalFetch(input, init).then(responseSnapshot);
      inFlightReads.set(key, task);
    }

    try {
      const snapshot = await task;
      const response = responseFromSnapshot(snapshot);
      metric(endpoint, startedAt, response, {coalesced:shared});
      return response;
    } catch (error) {
      recordMetric({
        endpoint,
        elapsed_ms:Math.max(0, Math.round(nowMs() - startedAt)),
        status:0,
        ok:false,
        coalesced:shared,
        error:clean(error && error.message || error),
        recorded_at:new Date().toISOString(),
      });
      throw error;
    } finally {
      if (!shared && inFlightReads.get(key) === task) inFlightReads.delete(key);
    }
  }

  async function runMeasured(input, init, endpoint) {
    const startedAt = nowMs();
    try {
      const response = await originalFetch(input, init);
      metric(endpoint, startedAt, response, {coalesced:false});
      return response;
    } catch (error) {
      recordMetric({
        endpoint,
        elapsed_ms:Math.max(0, Math.round(nowMs() - startedAt)),
        status:0,
        ok:false,
        coalesced:false,
        error:clean(error && error.message || error),
        recorded_at:new Date().toISOString(),
      });
      throw error;
    }
  }

  function install() {
    if (installed) return true;
    if (typeof global.fetch !== 'function' || typeof global.Response !== 'function') return false;

    originalFetch = global.fetch.bind(global);
    global.fetch = function englishLabLiveFetchCS21A177(input, init) {
      const endpoint = endpointFromRequest(input);
      if (endpoint.indexOf('englishLab') !== 0) {
        return originalFetch(input, init);
      }

      const method = upper(init && init.method || 'GET');
      if (method === 'POST' && endpoint === JOIN_ENDPOINT) {
        const startedAt = nowMs();
        return originalFetch(input, init)
          .then(response => upgradeJoinIfNeeded(input, init, response, startedAt));
      }

      if (method === 'POST' && READ_ENDPOINTS.indexOf(endpoint) >= 0) {
        return runCoalescedRead(input, init, endpoint);
      }

      return runMeasured(input, init, endpoint);
    };
    installed = true;
    return true;
  }

  const api = Object.freeze({
    VERSION,
    JOIN_ENDPOINT,
    MEMORY_PLAYER_ENDPOINT,
    READ_ENDPOINTS,
    install,
    endpointFromRequest,
    isMemoryMatchPayload,
    getMetrics:() => metricsStore().slice(),
    isInstalled:() => installed,
  });

  global.EnglishLabLiveSyncCS21A177 = api;
  install();
})(window);
