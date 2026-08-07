// F98.4-Z6-CS21A184/CS21A185 · Dependencias canónicas + sala cerrada no restaurable.
// CS21A184 corrige la entrada desde #academia_play cargando el stack Memory Match completo.
// CS21A185 evita que una sala CLOSED quede pegada en localStorage o se restaure al volver al Campus.
(function installEnglishLabStudentDependencyGuardCS21A184(global) {
  'use strict';

  if (!global || global.__ENGLISH_LAB_STUDENT_DEP_GUARD_CS21A184__) return;

  const VERSION = 'F98.4-Z6-CS21A184';
  const CLOSED_ROOM_VERSION = 'F98.4-Z6-CS21A185';
  const LIVE_FILE_RE = /^src\/english_lab_live\.jsx(?:\?.*)?$/i;
  const PREREQUISITES = Object.freeze([
    'src/english_lab_games/english_lab_runtime_cs21a173.js?v=CS21A173',
    'src/english_lab_games/memory_match_engine_cs21a173.jsx?v=CS21A174',
    'src/english_lab_games/english_lab_live_sync_guard_cs21a177.js?v=CS21A178',
    'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx?v=CS21A178',
  ]);
  const STATE_ENDPOINTS = Object.freeze([
    'englishLabLiveGetPlayerState',
    'englishLabMemoryMatchGetPlayerState',
    'englishLabLiveJoinRoom',
    'englishLabMemoryMatchJoinRoom',
  ]);
  const LAST_ROOM_KEY = 'elive_last_room';
  const PLAYER_PREFIX = 'elive_player_';
  const CLOSED_ROOMS_KEY = 'elive_closed_rooms_cs21a185';

  let timer = null;
  let activeRoomCode = '';
  let fetchGuardInstalled = false;
  let clickGuardInstalled = false;

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function publicCode(value) {
    return clean(value).toUpperCase().replace(/[^A-Z0-9-]/g, '');
  }

  function isLiveFile(src) {
    return LIVE_FILE_RE.test(clean(src));
  }

  function memoryRuntimeReady() {
    return !!(
      global.EnglishLabMemoryMatchLiveCS21A174 &&
      typeof global.MemoryMatchLiveRoundCS21A174 === 'function'
    );
  }

  function storage() {
    try { return global.localStorage || null; } catch (_) { return null; }
  }

  function readClosedRooms() {
    const store = storage();
    if (!store) return {};
    try {
      const parsed = JSON.parse(store.getItem(CLOSED_ROOMS_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function writeClosedRooms(value) {
    const store = storage();
    if (!store) return;
    try { store.setItem(CLOSED_ROOMS_KEY, JSON.stringify(value || {})); } catch (_) {}
  }

  function markClosedRoom(code) {
    const normalized = publicCode(code);
    if (!normalized) return;
    const closed = readClosedRooms();
    closed[normalized] = Date.now();
    const entries = Object.keys(closed).sort((a, b) => Number(closed[b] || 0) - Number(closed[a] || 0)).slice(0, 30);
    const compact = {};
    entries.forEach(key => { compact[key] = closed[key]; });
    writeClosedRooms(compact);
  }

  function isKnownClosedRoom(code) {
    const normalized = publicCode(code);
    return !!(normalized && readClosedRooms()[normalized]);
  }

  function clearRoomPersistence(code, markClosed) {
    const store = storage();
    const normalized = publicCode(code);
    if (!store) return normalized;
    try {
      const persisted = publicCode(store.getItem(LAST_ROOM_KEY));
      if (!normalized || persisted === normalized) store.removeItem(LAST_ROOM_KEY);
      if (normalized) store.removeItem(PLAYER_PREFIX + normalized);
      if (markClosed === true && normalized) markClosedRoom(normalized);
    } catch (_) {}
    return normalized;
  }

  function sanitizePersistedLastRoom() {
    const store = storage();
    if (!store) return '';
    try {
      const persisted = publicCode(store.getItem(LAST_ROOM_KEY));
      if (persisted && isKnownClosedRoom(persisted)) {
        clearRoomPersistence(persisted, false);
        return '';
      }
      return persisted;
    } catch (_) {
      return '';
    }
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

  function inspectStatePayload(data) {
    if (!data || typeof data !== 'object') return;
    const room = data.room && typeof data.room === 'object' ? data.room : null;
    if (!room) return;
    const code = publicCode(room.room_code || room.ROOM_CODE || room.room_id || room.ROOM_ID);
    if (code) activeRoomCode = code;
    const status = clean(room.status || room.STATUS).toUpperCase();
    if (code && status === 'CLOSED') {
      clearRoomPersistence(code, true);
      try {
        global.dispatchEvent(new global.CustomEvent('an:english-lab-room-closed', {
          detail:{room_code:code, version:CLOSED_ROOM_VERSION}
        }));
      } catch (_) {}
    }
  }

  function installFetchClosedRoomGuard() {
    if (fetchGuardInstalled || typeof global.fetch !== 'function') return fetchGuardInstalled;
    const baseFetch = global.fetch.bind(global);
    global.fetch = async function englishLabClosedRoomFetchCS21A185(input, init) {
      const response = await baseFetch(input, init);
      const endpoint = endpointFromRequest(input);
      if (STATE_ENDPOINTS.indexOf(endpoint) >= 0) {
        try {
          const copy = response.clone();
          const data = await copy.json();
          inspectStatePayload(data);
        } catch (_) {}
      }
      return response;
    };
    global.fetch.__cs21a185ClosedRoomGuard = true;
    fetchGuardInstalled = true;
    return true;
  }

  function installChangeRoomGuard() {
    if (clickGuardInstalled || !global.document || typeof global.document.addEventListener !== 'function') return clickGuardInstalled;
    global.document.addEventListener('click', function (event) {
      const target = event && event.target;
      const button = target && typeof target.closest === 'function' ? target.closest('button') : null;
      if (!button) return;
      const label = clean(button.textContent).toLowerCase();
      if (label.indexOf('cambiar sala') < 0) return;
      const store = storage();
      let persisted = '';
      try { persisted = store ? publicCode(store.getItem(LAST_ROOM_KEY)) : ''; } catch (_) {}
      clearRoomPersistence(activeRoomCode || persisted, false);
      try { if (store) store.removeItem(LAST_ROOM_KEY); } catch (_) {}
    }, true);
    clickGuardInstalled = true;
    return true;
  }

  function patchLazyLoader() {
    const api = global.anLazyCampus;
    if (!api || typeof api.loadOne !== 'function' || typeof api.loadMany !== 'function') return false;
    if (api.loadOne.__cs21a184StudentDependencies === true) return true;

    const baseLoadOne = api.loadOne.bind(api);
    async function loadOneWithEnglishLabDependencies(src) {
      if (!isLiveFile(src)) return baseLoadOne(src);

      await api.loadMany(PREREQUISITES);
      const result = await baseLoadOne(src);
      if (!memoryRuntimeReady()) {
        throw new Error('English LAB Live no terminó de cargar el adaptador Memory Match para el estudiante.');
      }
      return result;
    }

    loadOneWithEnglishLabDependencies.__cs21a184StudentDependencies = true;
    loadOneWithEnglishLabDependencies.__base = baseLoadOne;
    api.loadOne = loadOneWithEnglishLabDependencies;
    return true;
  }

  function ensureInstalled() {
    sanitizePersistedLastRoom();
    installFetchClosedRoomGuard();
    installChangeRoomGuard();
    if (patchLazyLoader()) {
      if (timer) {
        global.clearInterval(timer);
        timer = null;
      }
      return true;
    }
    return false;
  }

  global.__ENGLISH_LAB_STUDENT_DEP_GUARD_CS21A184__ = Object.freeze({
    version:VERSION,
    closedRoomVersion:CLOSED_ROOM_VERSION,
    prerequisites:PREREQUISITES.slice(),
    stateEndpoints:STATE_ENDPOINTS.slice(),
    isLiveFile,
    memoryRuntimeReady,
    install:ensureInstalled,
    clearRoomPersistence,
    markClosedRoom,
    isKnownClosedRoom,
    sanitizePersistedLastRoom,
    inspectStatePayload,
    getActiveRoomCode:() => activeRoomCode,
  });

  if (!ensureInstalled()) {
    timer = global.setInterval(ensureInstalled, 50);
    global.setTimeout(function () {
      if (timer) {
        global.clearInterval(timer);
        timer = null;
      }
    }, 15000);
  }

  if (typeof global.addEventListener === 'function') {
    global.addEventListener('an:lazy-module-loaded', ensureInstalled);
  }
})(window);
