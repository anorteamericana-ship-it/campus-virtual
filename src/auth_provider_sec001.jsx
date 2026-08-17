// SEC-001 · Managed identity adapter · SOURCE ONLY · NOT LOADED BY login.html
// Este archivo no cambia el login por sí solo. Sin configuración DEV/QA
// explícita y SDK presente, permanece deshabilitado y sin side effects.
/* global window */

(function installSec001AuthProviderAdapter(global) {
  'use strict';

  const DEFAULT_CONFIG = Object.freeze({
    enabled: false,
    provider: 'auth0',
    environment: 'dev',
    domain: '',
    clientId: '',
    audience: '',
    redirectUri: '',
    cacheLocation: 'memory',
    useRefreshTokens: false,
  });

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function readRuntimeConfig() {
    const source = global.SEC001_MANAGED_AUTH_CONFIG;
    if (!source || typeof source !== 'object') return { ...DEFAULT_CONFIG };
    return {
      ...DEFAULT_CONFIG,
      enabled: source.enabled === true,
      provider: clean(source.provider || DEFAULT_CONFIG.provider).toLowerCase(),
      environment: clean(source.environment || DEFAULT_CONFIG.environment).toLowerCase(),
      domain: clean(source.domain),
      clientId: clean(source.clientId),
      audience: clean(source.audience),
      redirectUri: clean(source.redirectUri),
      cacheLocation: source.cacheLocation === 'localstorage' ? 'localstorage' : 'memory',
      useRefreshTokens: source.useRefreshTokens === true,
    };
  }

  function configStatus() {
    const cfg = readRuntimeConfig();
    const errors = [];
    if (!cfg.enabled) errors.push('disabled');
    if (cfg.provider !== 'auth0') errors.push('unsupported_provider');
    if (!['dev', 'qa'].includes(cfg.environment)) errors.push('non_qa_environment');
    if (!cfg.domain) errors.push('missing_domain');
    if (!cfg.clientId) errors.push('missing_client_id');
    if (!cfg.redirectUri) errors.push('missing_redirect_uri');
    if (/localhost/i.test(cfg.domain)) errors.push('invalid_domain');
    return { enabled: cfg.enabled, ready: errors.length === 0, errors, config: cfg };
  }

  function isManagedAuthEnabled() {
    return configStatus().ready === true;
  }

  function sdkAvailable() {
    return !!(global.auth0 && typeof global.auth0.createAuth0Client === 'function');
  }

  function buildClientOptions() {
    const status = configStatus();
    if (!status.ready) throw new Error(`managed_auth_not_ready:${status.errors.join(',')}`);
    const cfg = status.config;
    const authorizationParams = { redirect_uri: cfg.redirectUri };
    if (cfg.audience) authorizationParams.audience = cfg.audience;
    return {
      domain: cfg.domain,
      clientId: cfg.clientId,
      cacheLocation: cfg.cacheLocation,
      useRefreshTokens: cfg.useRefreshTokens,
      authorizationParams,
    };
  }

  async function createClient() {
    if (!isManagedAuthEnabled()) throw new Error('managed_auth_disabled');
    if (!sdkAvailable()) throw new Error('managed_auth_sdk_missing');
    return await global.auth0.createAuth0Client(buildClientOptions());
  }

  async function beginLogin({ usernameHint = '' } = {}) {
    const client = await createClient();
    const authorizationParams = {};
    const hint = clean(usernameHint);
    if (hint) authorizationParams.login_hint = hint;
    await client.loginWithRedirect({ authorizationParams });
  }

  async function resolveCallback() {
    const client = await createClient();
    const query = new URLSearchParams(global.location ? global.location.search : '');
    if (!query.has('code') || !query.has('state')) {
      return { handled: false, authenticated: await client.isAuthenticated(), client };
    }
    await client.handleRedirectCallback();
    const authenticated = await client.isAuthenticated();
    const user = authenticated ? await client.getUser() : null;
    return { handled: true, authenticated, user, client };
  }

  async function getProviderProof(client) {
    if (!client || typeof client.getTokenSilently !== 'function') {
      throw new Error('managed_auth_client_required');
    }
    const accessToken = await client.getTokenSilently();
    if (!accessToken) throw new Error('managed_auth_proof_missing');
    return accessToken;
  }

  const api = Object.freeze({
    getConfig: readRuntimeConfig,
    getStatus: configStatus,
    isEnabled: isManagedAuthEnabled,
    sdkAvailable,
    buildClientOptions,
    beginLogin,
    resolveCallback,
    getProviderProof,
  });

  // Exposición controlada para pruebas. No llama login, no toca sesión y no
  // modifica navegación hasta que un futuro integrador lo invoque explícitamente.
  global.SEC001_AUTH_PROVIDER = api;
})(window);
