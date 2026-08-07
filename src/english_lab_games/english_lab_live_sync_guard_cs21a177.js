// CS21A177 + CS21A188 · Protección de sincronización, microcaché e instrumentación English LAB Live.
// No contiene contenido pedagógico ni URLs de deployment.
(function (global) {
  'use strict';

  const VERSION = 'CS21A177';
  const READ_CACHE_FIX_VERSION = 'CS21A188';
  const METRIC_EVENT = 'english-lab-live-metric';
  const MAX_METRICS = 120;
  const READ_CACHE_MS = 750;
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
  const recentReads = new Map();
  let cacheGeneration = 1;
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

  function readKey(endpoint, init) {
    const body = parseBody(init);
    // Las lecturas base y especializadas pueden traer campos inocuos distintos
    // (p.ej. player_name). La identidad canónica evita duplicar la misma consulta.
    return [
      endpoint,
      clean(body.token),
      upper(body.room_code || body.roomCode),
      clean(body.room_id || body.roomId),
      clean(body.player_id || body.playerId || body.cod_estudiante),
    ].join('|');
  }

  function invalidateReadCache(reason) {
    cacheGeneration += 1;
    recentReads.clear();
    // Una lectura en vuelo anterior a la jugada no debe coalescer una lectura nueva.
    inFlightReads.clear();
    recordMetric({
      endpoint:'CACHE_INVALIDATE',
      elapsed_ms:0,
      status:0,
      ok:true,
      cached:false,
      coalesced:false,
      reason:clean(reason || 'MUTATION'),
      cache_generation:cacheGeneration,
      recorded_at:new Date().toISOString(),
    });
    return cacheGeneration;
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
    const detail = Object.freeze({...metric, version:VERSION, cache_fix_version:READ_CACHE_FIX_VERSION});
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
    metric(JOIN_ENDPOINT, startedAt, response, {coalesced:false,cached:false});
    let data = null;
    try { data = await response.clone().json(); } catch (_) { return response; }
    if (!response.ok || !isMemoryMatchPayload(data)) return response;

    const payload = parseBody(init);
    const joinedPlayer = data.player && typeof data.player === 'object' ? data.player : {};
    const joinedId = clean(
      joinedPlayer.cod_estudiante || joinedPlayer.player_id ||
      joinedPlayer.codigo_estudiante || joinedPlayer.id
    );
    if (joinedId) {
      payload.player_id = joinedId;
      if (!clean(payload.cod_estudiante)) payload.cod_estudiante = joinedId;
    }
    payload.fn = MEMORY_PLAYER_ENDPOINT;
    const nextInit = {...(init || {}), body:JSON.stringify(payload)};
    const nextInput = replaceEndpoint(input, MEMORY_PLAYER_ENDPOINT);
    const upgradeStartedAt = nowMs();

    try {
      const upgraded = await originalFetch(nextInput, nextInit);
      metric(MEMORY_PLAYER_ENDPOINT, upgradeStartedAt, upgraded, {
        coalesced:false,
        cached:false,
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
        cached:false,
        join_upgrade:true,
        error:clean(error && error.message || error),
        recorded_at:new Date().toISOString(),
      });
      return response;
    }
  }

  async function runCoalescedRead(input, init, endpoint) {
    const key = readKey(endpoint, init);
    const startedAt = nowMs();
    const recent = recentReads.get(key);
    if (recent && recent.generation === cacheGeneration && startedAt - recent.stored_at_ms <= READ_CACHE_MS) {
      const response = responseFromSnapshot(recent.snapshot);
      metric(endpoint, startedAt, response, {coalesced:false,cached:true,cache_age_ms:Math.max(0,Math.round(startedAt-recent.stored_at_ms))});
      return response;
    }

    let shared = true;
    let entry = inFlightReads.get(key);
    if (!entry) {
      shared = false;
      const generation = cacheGeneration;
      const task = originalFetch(input, init).then(responseSnapshot);
      entry = {task,generation};
      inFlightReads.set(key, entry);
    }

    try {
      const snapshot = await entry.task;
      if (!shared && entry.generation === cacheGeneration) {
        recentReads.set(key, {snapshot,generation:entry.generation,stored_at_ms:nowMs()});
      }
      const response = responseFromSnapshot(snapshot);
      metric(endpoint, startedAt, response, {coalesced:shared,cached:false,cache_generation:entry.generation});
      return response;
    } catch (error) {
      recordMetric({
        endpoint,
        elapsed_ms:Math.max(0, Math.round(nowMs() - startedAt)),
        status:0,
        ok:false,
        coalesced:shared,
        cached:false,
        error:clean(error && error.message || error),
        recorded_at:new Date().toISOString(),
      });
      throw error;
    } finally {
      if (!shared && inFlightReads.get(key) === entry) inFlightReads.delete(key);
    }
  }

  async function runMeasured(input, init, endpoint) {
    const startedAt = nowMs();
    try {
      const response = await originalFetch(input, init);
      metric(endpoint, startedAt, response, {coalesced:false,cached:false});
      return response;
    } catch (error) {
      recordMetric({
        endpoint,
        elapsed_ms:Math.max(0, Math.round(nowMs() - startedAt)),
        status:0,
        ok:false,
        coalesced:false,
        cached:false,
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
    global.fetch = function englishLabLiveFetchCS21A188(input, init) {
      const endpoint = endpointFromRequest(input);
      if (endpoint.indexOf('englishLab') !== 0) {
        return originalFetch(input, init);
      }

      const method = upper(init && init.method || 'GET');
      if (method === 'POST' && endpoint === JOIN_ENDPOINT) {
        invalidateReadCache('JOIN_ROOM');
        const startedAt = nowMs();
        return originalFetch(input, init)
          .then(response => upgradeJoinIfNeeded(input, init, response, startedAt));
      }

      if (method === 'POST' && READ_ENDPOINTS.indexOf(endpoint) >= 0) {
        return runCoalescedRead(input, init, endpoint);
      }

      if (method === 'POST') invalidateReadCache(endpoint || 'ENGLISH_LAB_MUTATION');
      return runMeasured(input, init, endpoint);
    };
    installed = true;
    return true;
  }

  const api = Object.freeze({
    VERSION,
    READ_CACHE_FIX_VERSION,
    READ_CACHE_MS,
    JOIN_ENDPOINT,
    MEMORY_PLAYER_ENDPOINT,
    READ_ENDPOINTS,
    install,
    endpointFromRequest,
    isMemoryMatchPayload,
    readKey,
    invalidateReadCache,
    getMetrics:() => metricsStore().slice(),
    isInstalled:() => installed,
  });

  global.EnglishLabLiveSyncCS21A177 = api;
  install();
})(window);
