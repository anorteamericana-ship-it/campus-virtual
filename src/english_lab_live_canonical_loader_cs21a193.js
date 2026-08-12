// F98.4-Z6-CS21A205 - canonical, single-owner loader for English LAB Live.
// CS21A211 conserva el shell de cinco juegos y actualiza únicamente la compatibilidad Memory Match vigente.
(function installEnglishLabCanonicalLoaderCS21A193(global) {
  'use strict';

  if (!global || global.EnglishLabCanonicalLoaderCS21A193) return;

  const VERSION = 'F98.4-Z6-CS21A205';
  const CACHE_EPOCH = 'CS21A205';
  const LATENCY_SAFE_EPOCH = 'CS21A211';
  const LIVE_PATH = 'src/english_lab_live.jsx';
  const BASE_ADAPTER_PATH = 'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx';
  const MANIFEST = Object.freeze([
    'src/english_lab_games/english_lab_runtime_cs21a173.js?v=CS21A193',
    'src/english_lab_games/memory_match_engine_cs21a173.jsx?v=CS21A193',
    'src/english_lab_games/memory_match_shared_discovery_cs21a188.jsx?v=CS21A193',
    'src/english_lab_games/english_lab_live_sync_guard_cs21a177.js?v=CS21A193',
    'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx?v=CS21A193',
    'src/english_lab_games/english_lab_game_registry_cs21a191.js?v=CS21A193',
    'src/english_lab_games/hangman_engine_cs21a191.js?v=CS21A193',
    'src/english_lab_games/english_lab_hangman_live_cs21a191.jsx?v=CS21A193',
    'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx?v=CS21A194',
    'src/english_lab_games/english_lab_live_memory_match_classic_sync_adapter_cs21a189.jsx?v=CS21A193',
    'src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx?v=CS21A193',
    'src/english_lab_games/english_lab_quiz_curriculum_contract_cs21a198.js?v=CS21A198',
    'src/english_lab_games/english_lab_quiz_engine_cs21a198.js?v=CS21A198',
    'src/english_lab_games/english_lab_quiz_time_style_cs21a198.js?v=CS21A198',
    'src/english_lab_games/english_lab_quiz_time_live_cs21a198.jsx?v=CS21A198',
    'src/english_lab_games/word_search_curriculum_contract_cs21a199.js?v=CS21A200',
    'src/english_lab_games/word_search_engine_cs21a199.js?v=CS21A200',
    'src/english_lab_games/word_search_game_cs21a199.jsx?v=CS21A200',
    'src/english_lab_games/english_lab_word_search_style_cs21a200.js?v=CS21A200',
    'src/english_lab_games/english_lab_word_search_live_cs21a200.jsx?v=CS21A200',
    'src/english_lab_live.jsx?v=CS21A200',
    'src/english_lab_sentence_order_cs21a183.js?v=CS21A205',
    'src/english_lab_games/english_lab_quiz_time_gateway_cs21a198.jsx?v=CS21A198',
    'src/english_lab_games/english_lab_word_search_gateway_cs21a200.jsx?v=CS21A200',
    'src/english_lab_games/english_lab_unified_shell_cs21a205.jsx?v=CS21A205',
  ]);
  const MANIFEST_BY_PATH = new Map(MANIFEST.map(src => [pathOf(src), src]));
  const LEGACY_LOAD_ONE_MARKERS = Object.freeze([
    '__cs21a184StudentDependencies',
    '__cs21a188ProductGuard',
  ]);
  const LEGACY_LOAD_MANY_MARKERS = Object.freeze([
    '__cs21a189ClassicSyncGuard',
    '__cs21a192AuthoritativeSyncGuard',
  ]);

  let installTimer = 0;
  let installed = false;
  let ready = false;
  let loadPromise = null;
  let rawLoadOne = null;
  let rawLoadMany = null;
  let canonicalLoadOne = null;
  let canonicalLoadMany = null;
  let pollOwner = null;
  let installDepth = Object.freeze({loadOne:0, loadMany:0});

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function pathOf(value) {
    return clean(value).replace(/^\.\//, '').split('?')[0].toLowerCase();
  }

  function isLiveFile(value) {
    return pathOf(value) === LIVE_PATH;
  }

  function isBaseAdapter(value) {
    return pathOf(value) === BASE_ADAPTER_PATH;
  }

  function canonicalSource(value) {
    return MANIFEST_BY_PATH.get(pathOf(value)) || clean(value);
  }

  function listNeedsCanonical(values) {
    const list = Array.isArray(values) ? values : [];
    return list.some(value => isLiveFile(value) || isBaseAdapter(value));
  }

  function unwrap(loader, markers) {
    let current = loader;
    let depth = 0;
    const seen = new Set();
    while (typeof current === 'function' && !seen.has(current)) {
      seen.add(current);
      const legacy = markers.some(marker => current[marker] === true);
      if (!legacy || typeof current.__base !== 'function') break;
      current = current.__base;
      depth += 1;
    }
    return {loader:current, depth};
  }

  function reassertAuthoritativeOwner() {
    const authoritative = global.EnglishLabMemoryMatchAuthoritativeSyncCS21A192;
    const component = authoritative && authoritative.component;
    if (!authoritative || typeof component !== 'function') return false;
    component.__cs21a189ClassicSyncAdapter = true;
    component.__cs21a192AuthoritativeSyncAdapter = true;
    global.MemoryMatchLiveRoundCS21A174 = component;
    global.EnglishLabMemoryMatchLiveCS21A174 = authoritative;
    if (!pollOwner || pollOwner.component !== component) {
      pollOwner = Object.freeze({
        version:VERSION,
        adapter:'CS21A192',
        component,
      });
    }
    global.__ENGLISH_LAB_MEMORY_MATCH_POLL_OWNER__ = pollOwner;
    return true;
  }

  function compatibility() {
    return !!(
      global.EnglishLabRuntimeCS21A173 &&
      typeof global.MemoryMatchGameCS21A173 === 'function' &&
      global.MemoryMatchGameCS21A173.__cs21a194LatencySafe === true &&
      global.MemoryMatchSharedDiscoveryCS21A188 &&
      global.EnglishLabLiveSyncCS21A177 &&
      global.EnglishLabMemoryMatchLiveCS21A174 &&
      global.EnglishLabGameRegistryCS21A191 &&
      global.EnglishLabHangmanEngineCS21A191 &&
      global.EnglishLabHangmanCS21A191 &&
      global.EnglishLabMemoryMatchClassicSyncCS21A189 &&
      global.EnglishLabMemoryMatchClassicSyncCS21A189.latencySafeVersion === LATENCY_SAFE_EPOCH &&
      global.EnglishLabMemoryMatchClassicSyncAdapterCS21A189 &&
      global.EnglishLabMemoryMatchAuthoritativeSyncCS21A192 &&
      typeof global.MemoryMatchLiveRoundCS21A174 === 'function' &&
      global.MemoryMatchLiveRoundCS21A174.__cs21a192AuthoritativeSyncAdapter === true &&
      global.EnglishLabMemoryMatchLiveCS21A174 === global.EnglishLabMemoryMatchAuthoritativeSyncCS21A192 &&
      global.EnglishLabSentenceOrderCS21A183 &&
      global.EnglishLabQuizCurriculumContractCS21A198 &&
      global.EnglishLabQuizEngineCS21A198 &&
      global.EnglishLabQuizTimeCS21A198 &&
      global.EnglishLabQuizTimeGatewayCS21A198 &&
      global.EnglishLabWordSearchCurriculumCS21A199 &&
      global.EnglishLabWordSearchEngineCS21A199 &&
      global.EnglishLabWordSearchGameCS21A199 &&
      global.EnglishLabWordSearchStyleCS21A200 &&
      global.EnglishLabWordSearchLiveCS21A200 &&
      global.EnglishLabWordSearchGatewayCS21A200 &&
      global.EnglishLabUnifiedShellCS21A205 &&
      typeof global.EnglishLabLiveStudentView === 'function' &&
      typeof global.EnglishLabLiveTeacherView === 'function'
    );
  }

  function finalizeStack() {
    if (!reassertAuthoritativeOwner()) return false;
    try { global.__ENGLISH_LAB_CLASSIC_SYNC_GUARD_CS21A189__ && global.__ENGLISH_LAB_CLASSIC_SYNC_GUARD_CS21A189__.install(); } catch (_) {}
    try { global.__ENGLISH_LAB_AUTHORITATIVE_SYNC_GUARD_CS21A192__ && global.__ENGLISH_LAB_AUTHORITATIVE_SYNC_GUARD_CS21A192__.install(); } catch (_) {}
    try { global.EnglishLabHangmanCS21A191 && global.EnglishLabHangmanCS21A191.install(); } catch (_) {}
    try { global.__ENGLISH_LAB_PRODUCT_GUARD_CS21A188__ && global.__ENGLISH_LAB_PRODUCT_GUARD_CS21A188__.install(); } catch (_) {}
    try { global.__ENGLISH_LAB_STUDENT_DEP_GUARD_CS21A184__ && global.__ENGLISH_LAB_STUDENT_DEP_GUARD_CS21A184__.install(); } catch (_) {}
    reassertAuthoritativeOwner();
    ready = compatibility();
    return ready;
  }

  function ensureCanonicalStack() {
    if (ready) {
      reassertAuthoritativeOwner();
      if (compatibility()) return Promise.resolve(api);
      ready = false;
      loadPromise = null;
    }
    if (loadPromise) return loadPromise;
    if (typeof rawLoadOne !== 'function') {
      return Promise.reject(new Error('El cargador canonico CS21A205 no esta instalado.'));
    }
    loadPromise = (async () => {
      for (const source of MANIFEST) await rawLoadOne(source);
      if (!finalizeStack()) {
        throw new Error('English LAB Live no cargo el stack canonico CS21A205 completo.');
      }
      return api;
    })().catch(error => {
      ready = false;
      loadPromise = null;
      throw error;
    });
    return loadPromise;
  }

  async function loadStudent() {
    await ensureCanonicalStack();
    if (typeof global.EnglishLabLiveStudentView !== 'function') {
      throw new Error('English LAB Live no publico la pantalla del estudiante.');
    }
    return global.EnglishLabLiveStudentView;
  }

  async function loadTeacher() {
    await ensureCanonicalStack();
    if (typeof global.EnglishLabLiveTeacherView !== 'function') {
      throw new Error('English LAB Live no publico la pantalla docente.');
    }
    return global.EnglishLabLiveTeacherView;
  }

  function install() {
    const lazy = global.anLazyCampus;
    if (!lazy || typeof lazy.loadOne !== 'function' || typeof lazy.loadMany !== 'function') return false;
    if (lazy.loadOne.__cs21a193CanonicalOwner === true && lazy.loadMany.__cs21a193CanonicalOwner === true) {
      installed = true;
      return true;
    }

    const one = unwrap(lazy.loadOne, LEGACY_LOAD_ONE_MARKERS);
    const many = unwrap(lazy.loadMany, LEGACY_LOAD_MANY_MARKERS);
    rawLoadOne = one.loader;
    rawLoadMany = many.loader;
    installDepth = Object.freeze({loadOne:one.depth, loadMany:many.depth});
    if (typeof rawLoadOne !== 'function' || typeof rawLoadMany !== 'function') return false;

    canonicalLoadOne = async function loadOneCS21A193(source) {
      if (isLiveFile(source)) return ensureCanonicalStack();
      return rawLoadOne(canonicalSource(source));
    };
    canonicalLoadOne.__cs21a193CanonicalOwner = true;
    canonicalLoadOne.__cs21a184StudentDependencies = true;
    canonicalLoadOne.__cs21a188ProductGuard = true;
    canonicalLoadOne.__base = rawLoadOne;

    canonicalLoadMany = async function loadManyCS21A193(values) {
      const source = Array.isArray(values) ? values.slice() : [];
      if (listNeedsCanonical(source)) return ensureCanonicalStack();
      return rawLoadMany(source.map(canonicalSource));
    };
    canonicalLoadMany.__cs21a193CanonicalOwner = true;
    canonicalLoadMany.__cs21a189ClassicSyncGuard = true;
    canonicalLoadMany.__cs21a192AuthoritativeSyncGuard = true;
    canonicalLoadMany.__base = rawLoadMany;

    lazy.loadOne = canonicalLoadOne;
    lazy.loadMany = canonicalLoadMany;
    installed = true;
    if (installTimer) {
      global.clearInterval(installTimer);
      installTimer = 0;
    }
    return true;
  }

  const api = Object.freeze({
    version:VERSION,
    cacheEpoch:CACHE_EPOCH,
    latencySafeEpoch:LATENCY_SAFE_EPOCH,
    manifest:MANIFEST,
    liveFile:MANIFEST_BY_PATH.get(LIVE_PATH),
    quizTime:true,
    quizTimeEpoch:'CS21A198',
    wordSearch:true,
    wordSearchEpoch:'CS21A200',
    sentenceOrder:true,
    sentenceOrderEpoch:'CS21A183',
    unifiedShell:true,
    unifiedShellEpoch:'CS21A205',
    singleManifest:true,
    singlePollOwner:true,
    install,
    load:ensureCanonicalStack,
    loadStudent,
    loadTeacher,
    compatibility,
    reassertAuthoritativeOwner,
    canonicalSource,
    isLiveFile,
    isInstalled:() => installed,
    isReady:() => ready && compatibility(),
    getOwner:() => pollOwner,
    getLoaderState:() => ({
      installed,
      ready:ready && compatibility(),
      loadOne:global.anLazyCampus && global.anLazyCampus.loadOne,
      loadMany:global.anLazyCampus && global.anLazyCampus.loadMany,
      canonicalLoadOne,
      canonicalLoadMany,
      installDepth,
    }),
  });

  global.EnglishLabCanonicalLoaderCS21A193 = api;
  global.EnglishLabLiveCanonicalLoaderCS21A193 = api;
  global.__ENGLISH_LAB_CANONICAL_LOADER_CS21A193__ = api;
  if (!install()) {
    installTimer = global.setInterval(install, 25);
    global.setTimeout(() => {
      if (installTimer) {
        global.clearInterval(installTimer);
        installTimer = 0;
      }
    }, 15000);
  }
})(window);
