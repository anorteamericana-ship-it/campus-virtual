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
  var requested = global.__CAMPUS_RUNTIME_CONFIG__ || {};
  var requestedUrl = String(requested.appsScriptUrl || global.APPS_SCRIPT_URL || '').trim();
  var requestedEnvironment = String(requested.environment || '').trim().toLowerCase();

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
  var appsScriptUrl = normalizedOverride || productionAppsScriptUrl;
  var allowedEnvironments = ['production', 'qa', 'staging', 'development'];
  var environment = allowedEnvironments.indexOf(requestedEnvironment) >= 0
    ? requestedEnvironment
    : (appsScriptUrl === productionAppsScriptUrl ? 'production' : 'qa');

  var config = Object.freeze({
    environment: environment,
    appsScriptUrl: appsScriptUrl,
    productionAppsScriptUrl: productionAppsScriptUrl,
    isProduction: environment === 'production' && appsScriptUrl === productionAppsScriptUrl,
  });

  global.CAMPUS_RUNTIME_CONFIG = config;
  global.APPS_SCRIPT_URL = appsScriptUrl;
  global.getCampusRuntimeConfig = function getCampusRuntimeConfig() { return config; };

  // Compatibilidad transitoria: varios módulos históricos todavía conservan
  // la URL productiva en constantes locales. En QA se reescribe únicamente
  // ese origen exacto; cualquier otro fetch permanece intacto.
  if (typeof global.fetch === 'function' && !global.__AN_RUNTIME_FETCH_ROUTER__) {
    var nativeFetch = global.fetch.bind(global);

    function rewriteUrl(rawUrl) {
      var value = String(rawUrl || '');
      if (appsScriptUrl === productionAppsScriptUrl) return value;
      if (value === productionAppsScriptUrl) return appsScriptUrl;
      if (value.indexOf(productionAppsScriptUrl + '?') === 0 || value.indexOf(productionAppsScriptUrl + '#') === 0) {
        return appsScriptUrl + value.slice(productionAppsScriptUrl.length);
      }
      return value;
    }

    global.fetch = function campusRuntimeFetch(input, init) {
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
      return nativeFetch(nextInput, init);
    };

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
