// F98.4-Z6-CS21A184 · Dependencias canónicas de English LAB Live para estudiantes.
// Corrige la entrada desde #academia_play: antes cargaba solo english_lab_live.jsx
// y dejaba fuera runtime, motor, sync guard y adaptador Memory Match.
(function installEnglishLabStudentDependencyGuardCS21A184(global) {
  'use strict';

  if (!global || global.__ENGLISH_LAB_STUDENT_DEP_GUARD_CS21A184__) return;

  const VERSION = 'F98.4-Z6-CS21A184';
  const LIVE_FILE_RE = /^src\/english_lab_live\.jsx(?:\?.*)?$/i;
  const PREREQUISITES = Object.freeze([
    'src/english_lab_games/english_lab_runtime_cs21a173.js?v=CS21A173',
    'src/english_lab_games/memory_match_engine_cs21a173.jsx?v=CS21A174',
    'src/english_lab_games/english_lab_live_sync_guard_cs21a177.js?v=CS21A178',
    'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx?v=CS21A178',
  ]);

  let timer = null;

  function clean(value) {
    return String(value == null ? '' : value).trim();
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
    prerequisites:PREREQUISITES.slice(),
    isLiveFile,
    memoryRuntimeReady,
    install:ensureInstalled,
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
