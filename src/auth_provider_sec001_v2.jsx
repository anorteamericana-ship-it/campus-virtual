// SEC-001 · Provider-neutral managed identity adapter V2
// SOURCE ONLY · NOT LOADED BY login.html · NO SIDE EFFECTS ON LOAD
//
// This module intentionally does not import or initialize any vendor SDK.
// A future DEV/QA integrator may provide window.SEC001_OIDC_DRIVER with:
//   beginLogin({ config, usernameHint })
//   resolveCallback({ config })
//   getProof({ config, callbackResult })
// The driver is invoked only after explicit calls and only when config is ready.
/* global window */

(function installSec001OidcAdapter(global) {
  'use strict';

  const DEFAULT_CONFIG = Object.freeze({
    enabled: false,
    environment: 'dev',
    providerId: '',
    issuer: '',
    clientId: '',
    redirectUri: '',
    scope: 'openid profile',
  });

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function normalizeIssuer(value) {
    const raw = clean(value).replace(/\/+$/, '');
    return raw;
  }

  function readRuntimeConfig() {
    const source = global.SEC001_MANAGED_AUTH_CONFIG_V2;
    if (!source || typeof source !== 'object') return { ...DEFAULT_CONFIG };
    return {
      ...DEFAULT_CONFIG,
      enabled: source.enabled === true,
      environment: clean(source.environment || DEFAULT_CONFIG.environment).toLowerCase(),
      providerId: clean(source.providerId).toLowerCase(),
      issuer: normalizeIssuer(source.issuer),
      clientId: clean(source.clientId),
      redirectUri: clean(source.redirectUri),
      scope: clean(source.scope || DEFAULT_CONFIG.scope),
    };
  }

  function isHttpsUrl(value) {
    try {
      const u = new URL(value);
      return u.protocol === 'https:' && !!u.hostname;
    } catch (_) {
      return false;
    }
  }

  function configStatus() {
    const cfg = readRuntimeConfig();
    const errors = [];
    if (!cfg.enabled) errors.push('disabled');
    if (!['dev', 'qa'].includes(cfg.environment)) errors.push('non_qa_environment');
    if (!cfg.providerId) errors.push('missing_provider_id');
    if (!isHttpsUrl(cfg.issuer)) errors.push('invalid_issuer');
    if (!cfg.clientId) errors.push('missing_client_id');
    if (!isHttpsUrl(cfg.redirectUri)) errors.push('invalid_redirect_uri');
    if (!/(^|\s)openid(\s|$)/.test(cfg.scope)) errors.push('openid_scope_required');
    return {
      enabled: cfg.enabled,
      ready: errors.length === 0,
      errors,
      config: cfg,
    };
  }

  function getDriver() {
    const driver = global.SEC001_OIDC_DRIVER;
    if (!driver || typeof driver !== 'object') return null;
    return driver;
  }

  function driverStatus() {
    const driver = getDriver();
    const errors = [];
    if (!driver) errors.push('driver_missing');
    else {
      if (typeof driver.beginLogin !== 'function') errors.push('begin_login_missing');
      if (typeof driver.resolveCallback !== 'function') errors.push('resolve_callback_missing');
      if (typeof driver.getProof !== 'function') errors.push('get_proof_missing');
    }
    return { ready: errors.length === 0, errors, driver };
  }

  function readiness() {
    const config = configStatus();
    const driver = driverStatus();
    return {
      ready: config.ready && driver.ready,
      config,
      driver: { ready: driver.ready, errors: driver.errors },
    };
  }

  function assertReady() {
    const status = readiness();
    if (!status.ready) {
      const errors = [...status.config.errors, ...status.driver.errors];
      throw new Error(`managed_auth_not_ready:${errors.join(',')}`);
    }
    return { config: status.config.config, driver: getDriver() };
  }

  async function beginLogin({ usernameHint = '' } = {}) {
    const { config, driver } = assertReady();
    return await driver.beginLogin({
      config: { ...config },
      usernameHint: clean(usernameHint),
    });
  }

  async function resolveCallback() {
    const { config, driver } = assertReady();
    return await driver.resolveCallback({ config: { ...config } });
  }

  async function getProviderProof(callbackResult) {
    const { config, driver } = assertReady();
    const proof = await driver.getProof({
      config: { ...config },
      callbackResult: callbackResult || null,
    });
    const token = clean(proof);
    if (!token) throw new Error('managed_auth_proof_missing');
    return token;
  }

  const api = Object.freeze({
    getConfig: readRuntimeConfig,
    getConfigStatus: configStatus,
    getDriverStatus: () => {
      const status = driverStatus();
      return { ready: status.ready, errors: status.errors.slice() };
    },
    getReadiness: readiness,
    beginLogin,
    resolveCallback,
    getProviderProof,
  });

  // Controlled test/integration surface only. No fetch, redirect, storage write,
  // SDK initialization or Campus session mutation happens while loading this file.
  global.SEC001_AUTH_PROVIDER_V2 = api;
})(window);
