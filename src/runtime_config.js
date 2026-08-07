/* global window, document, CustomEvent, URL, Request */
// CS21A146 · Configuración central de ambiente para frontend estático.
//
// Producción no necesita configuración previa. Para QA, definir ANTES de cargar
// este archivo:
// window.__CAMPUS_RUNTIME_CONFIG__ = {
//   environment: 'qa',
//   appsScriptUrl: 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec'
// };
(function installCampusRuntimeConfig(global) {
  'use strict';

  if (!global || global.__AN_RUNTIME_CONFIG_INSTALLED__) return;

  var productionAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';
  var invalidBackendUrl = 'about:blank#campus-backend-invalid';
  var requested = global.__CAMPUS_RUNTIME_CONFIG__ || {};
  var requestedUrl = String(requested.appsScriptUrl || global.APPS_SCRIPT_URL || '').trim();
  var requestedEnvironment = String(requested.environment || '').trim().toLowerCase();
  var nonProductionEnvironments = ['qa', 'staging', 'development'];

  function normalizeAppsScriptUrl(value) {
    if (!value) return '';
    try {
      var parsed = new URL(value);
      var validHost = parsed.protocol === 'https:' && parsed.hostname === 'script.google.com';
      var validPath = /^\/macros\/s\/[^/]+\/(?:exec|dev)\/?$/.test(parsed.pathname);
      if (!validHost || !validPath) return '';
      parsed.search = '';
      parsed.hash = '';
      return parsed.href.replace(/\/$/, '');
    } catch (_) {
      return '';
    }
  }

  var normalizedOverride = normalizeAppsScriptUrl(requestedUrl);
  var requestedNonProduction = nonProductionEnvironments.indexOf(requestedEnvironment) >= 0;
  var invalidConfiguration = false;
  var configurationError = '';

  if (requestedUrl && !normalizedOverride) {
    invalidConfiguration = true;
    configurationError = 'invalid_apps_script_url';
  } else if (requestedNonProduction && !normalizedOverride) {
    invalidConfiguration = true;
    configurationError = 'non_production_url_required';
  } else if (requestedNonProduction && normalizedOverride === productionAppsScriptUrl) {
    invalidConfiguration = true;
    configurationError = 'production_url_for_non_production_environment';
  }

  var appsScriptUrl = invalidConfiguration
    ? invalidBackendUrl
    : (normalizedOverride || productionAppsScriptUrl);
  var environment = invalidConfiguration
    ? 'invalid'
    : (appsScriptUrl === productionAppsScriptUrl
      ? 'production'
      : (requestedNonProduction ? requestedEnvironment : 'qa'));

  var config = Object.freeze({
    environment: environment,
    appsScriptUrl: appsScriptUrl,
    productionAppsScriptUrl: productionAppsScriptUrl,
    isProduction: !invalidConfiguration && appsScriptUrl === productionAppsScriptUrl,
    valid: !invalidConfiguration,
    error: configurationError,
  });

  global.CAMPUS_RUNTIME_CONFIG = config;
  global.APPS_SCRIPT_URL = appsScriptUrl;
  global.getCampusRuntimeConfig = function getCampusRuntimeConfig() { return config; };

  // Compatibilidad transitoria: varios módulos históricos todavía conservan
  // la URL productiva en constantes locales. En QA se reescribe únicamente
  // ese origen exacto; cualquier otro fetch permanece intacto. Si la
  // configuración QA es inválida, se bloquean los fetch para evitar una caída
  // silenciosa hacia producción.
  if (typeof global.fetch === 'function' && !global.__AN_RUNTIME_FETCH_ROUTER__) {
    var nativeFetch = global.fetch.bind(global);
    var englishLabRetryDelayMs = 350;
    var englishLabReadFns = {
      englishlabaccessstatus:true,
      englishlabmemorymatchgetroomcontrol:true,
      englishlabmemorymatchgetplayerstate:true,
      englishlablivegetroomcontrol:true,
      englishlablivegetplayerstate:true,
      englishlabsentenceordergetroomcontrol:true,
      englishlabsentenceordergetplayerstate:true,
      englishlabsentenceorderteacherdata:true,
    };
    // FIX3 hace StartRoom idempotente: si el primer request alcanzó el backend
    // pero la respuesta se perdió, el segundo devuelve la sala ya iniciada.
    // Se habilita solo fuera de producción hasta cerrar QA autenticada.
    var englishLabQaIdempotentFns = {
      englishlabmemorymatchstartroom:true,
    };
    var fetchMetrics = {
      retries:0,
      recovered:0,
      failures:0,
      last_fn:'',
      last_at:'',
    };

    function rewriteUrl(rawUrl) {
      var value = String(rawUrl || '');
      if (appsScriptUrl === productionAppsScriptUrl) return value;
      if (value === productionAppsScriptUrl) return appsScriptUrl;
      if (value.indexOf(productionAppsScriptUrl + '?') === 0 || value.indexOf(productionAppsScriptUrl + '#') === 0) {
        return appsScriptUrl + value.slice(productionAppsScriptUrl.length);
      }
      return value;
    }

    function requestUrl(input) {
      try {
        if (typeof input === 'string') return input;
        if (typeof URL !== 'undefined' && input instanceof URL) return input.href;
        if (typeof Request !== 'undefined' && input instanceof Request) return input.url;
      } catch (_) {}
      return '';
    }

    function englishLabFn(input) {
      var value = requestUrl(input);
      if (!value || value.indexOf('script.google.com') < 0) return '';
      try {
        return String(new URL(value).searchParams.get('fn') || '').trim().toLowerCase();
      } catch (_) {
        var match = value.match(/[?&]fn=([^&#]+)/i);
        try { return match ? decodeURIComponent(match[1]).trim().toLowerCase() : ''; }
        catch (_) { return match ? String(match[1]).trim().toLowerCase() : ''; }
      }
    }

    function isRetryableEnglishLabRequest(input) {
      // El frontend actual usa string + init. No reintentamos Request objects con
      // body potencialmente consumible.
      if (typeof input !== 'string') return false;
      var fn = englishLabFn(input);
      if (!fn) return false;
      if (englishLabReadFns[fn]) return true;
      return environment !== 'production' && englishLabQaIdempotentFns[fn] === true;
    }

    function isNetworkFetchError(error) {
      var message = String(error && error.message || error || '');
      return !!(error && error.name === 'TypeError') || /failed to fetch|networkerror|network request failed|load failed/i.test(message);
    }

    function wait(ms) {
      return new Promise(function(resolve) { setTimeout(resolve, ms); });
    }

    function friendlyFetchError(error, fn) {
      var wrapped = new Error('No se pudo conectar con English LAB. Verificá la conexión y reintentá.');
      wrapped.name = 'EnglishLabNetworkError';
      wrapped.code = 'ENGLISH_LAB_FETCH_FAILED';
      wrapped.fn = fn || '';
      try { wrapped.cause = error; } catch (_) {}
      return wrapped;
    }

    global.fetch = function campusRuntimeFetch(input, init) {
      if (invalidConfiguration) {
        return Promise.reject(new Error('CAMPUS_RUNTIME_CONFIG_INVALID:' + configurationError));
      }

      var nextInput = input;
      try {
        if (typeof input === 'string') {
          nextInput = rewriteUrl(input);
        } else if (typeof URL !== 'undefined' && input instanceof URL) {
          var rewrittenUrl = rewriteUrl(input.href);
          nextInput = rewrittenUrl === input.href ? input : new URL(rewrittenUrl);
        } else if (typeof Request !== 'undefined' && input instanceof Request) {
          var rewrittenRequestUrl = rewriteUrl(input.url);
          nextInput = rewrittenRequestUrl === input.url ? input : new Request(rewrittenRequestUrl, input);
        }
      } catch (_) {
        nextInput = input;
      }

      var retryable = isRetryableEnglishLabRequest(nextInput);
      var fn = englishLabFn(nextInput);
      return nativeFetch(nextInput, init).catch(function(firstError) {
        if (!retryable || !isNetworkFetchError(firstError)) throw firstError;
        fetchMetrics.retries += 1;
        fetchMetrics.last_fn = fn;
        fetchMetrics.last_at = new Date().toISOString();
        return wait(englishLabRetryDelayMs).then(function() {
          return nativeFetch(nextInput, init);
        }).then(function(response) {
          fetchMetrics.recovered += 1;
          return response;
        }).catch(function(secondError) {
          fetchMetrics.failures += 1;
          throw friendlyFetchError(secondError, fn);
        });
      });
    };

    Object.defineProperty(global, '__AN_ENGLISH_LAB_FETCH_METRICS__', {
      value: fetchMetrics,
      configurable: false,
      enumerable: false,
      writable: false,
    });

    Object.defineProperty(global, '__AN_RUNTIME_FETCH_ROUTER__', {
      value: true,
      configurable: false,
      enumerable: false,
      writable: false,
    });
  }

  Object.defineProperty(global, '__AN_RUNTIME_CONFIG_INSTALLED__', {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false,
  });

  try {
    if (document && document.documentElement) {
      document.documentElement.dataset.campusEnvironment = environment;
    }
    if (typeof global.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
      global.dispatchEvent(new CustomEvent('an:runtime-config-ready', { detail: config }));
    }
  } catch (_) {}
})(window);

// CS21A181 · Capa aditiva exclusiva de English LAB.
// Se carga como JavaScript plano y se instala antes de que el módulo lazy publique
// sus vistas; no sustituye el motor CS21A180 ni altera otras rutas del Campus.
(function loadEnglishLabUxCS21A181(global, doc) {
  'use strict';
  if (!global || !doc || global.__ENGLISH_LAB_UX_CS21A181_LOADER__) return;
  global.__ENGLISH_LAB_UX_CS21A181_LOADER__ = true;
  var script = doc.createElement('script');
  script.src = 'src/english_lab_ux_cs21a181.js?v=F98.4Z6CS21A181';
  script.async = false;
  script.defer = false;
  script.setAttribute('data-campus-module', 'english-lab-ux-cs21a181');
  (doc.head || doc.documentElement).appendChild(script);
})(window, document);

// CS21A182 · Limpieza visual aditiva de las vistas English LAB.
// No intercepta solicitudes ni cambia reglas de acceso; solo simplifica la presentación.
(function loadEnglishLabVisualCleanupCS21A182(global, doc) {
  'use strict';
  if (!global || !doc || global.__ENGLISH_LAB_VISUAL_CLEANUP_CS21A182_LOADER__) return;
  global.__ENGLISH_LAB_VISUAL_CLEANUP_CS21A182_LOADER__ = true;
  var script = doc.createElement('script');
  script.src = 'src/english_lab_visual_cleanup_cs21a182.js?v=F98.4Z6CS21A182';
  script.async = false;
  script.defer = false;
  script.setAttribute('data-campus-module', 'english-lab-visual-cleanup-cs21a182');
  (doc.head || doc.documentElement).appendChild(script);
})(window, document);

// CS21A183 · Ordena la oración en English LAB Live.
// Se instala después de la UX y limpieza anteriores; reutiliza las vistas lazy oficiales.
(function loadEnglishLabSentenceOrderCS21A183(global, doc) {
  'use strict';
  if (!global || !doc || global.__ENGLISH_LAB_SENTENCE_ORDER_CS21A183_LOADER__) return;
  global.__ENGLISH_LAB_SENTENCE_ORDER_CS21A183_LOADER__ = true;
  var script = doc.createElement('script');
  script.src = 'src/english_lab_sentence_order_cs21a183.js?v=F98.4Z6CS21A183';
  script.async = false;
  script.defer = false;
  script.setAttribute('data-campus-module', 'english-lab-sentence-order-cs21a183');
  (doc.head || doc.documentElement).appendChild(script);
})(window, document);

// CS21A183 · Guardia curricular de nivel, unidad y fuente Apollo.
// Se carga después del juego y bloquea la creación sin evidencia GRAM_02 coincidente.
(function loadEnglishLabSentenceCurriculumGuardCS21A183(global, doc) {
  'use strict';
  if (!global || !doc || global.__ENGLISH_LAB_SENTENCE_CURRICULUM_GUARD_CS21A183_LOADER__) return;
  global.__ENGLISH_LAB_SENTENCE_CURRICULUM_GUARD_CS21A183_LOADER__ = true;
  var script = doc.createElement('script');
  script.src = 'src/english_lab_sentence_order_curriculum_guard_cs21a183.js?v=F98.4Z6CS21A183CURRICULUM';
  script.async = false;
  script.defer = false;
  script.setAttribute('data-campus-module', 'english-lab-sentence-curriculum-guard-cs21a183');
  (doc.head || doc.documentElement).appendChild(script);
})(window, document);

// CS21A183 · Pulido visual mínimo de la tarjeta final.
// Se limita a normalizar una clase CSS dentro del contenedor Sentence Order.
(function loadEnglishLabSentenceOrderPolishCS21A183(global, doc) {
  'use strict';
  if (!global || !doc || global.__ENGLISH_LAB_SENTENCE_ORDER_POLISH_CS21A183_LOADER__) return;
  global.__ENGLISH_LAB_SENTENCE_ORDER_POLISH_CS21A183_LOADER__ = true;
  var script = doc.createElement('script');
  script.src = 'src/english_lab_sentence_order_polish_cs21a183.js?v=F98.4Z6CS21A183POLISH';
  script.async = false;
  script.defer = false;
  script.setAttribute('data-campus-module', 'english-lab-sentence-order-polish-cs21a183');
  (doc.head || doc.documentElement).appendChild(script);
})(window, document);
