/* global window, fetch */
(function conapeBridgeClientC36(){
  'use strict';

  function cleanBase(value){
    return String(value || '').trim().replace(/\/+$/, '');
  }
  function digits(value){
    return String(value || '').replace(/\D/g, '');
  }
  function bridgeBase(){
    return cleanBase(window.CONAPE_PORTAL_BRIDGE_URL || '');
  }

  async function postBridge(path, body){
    const base = bridgeBase();
    if (!base) return { ok:false, error:'conape_bridge_not_configured' };
    const token = window.getSessionToken ? window.getSessionToken() : '';
    if (!token) return { ok:false, error:'campus_session_required' };
    try {
      const response = await fetch(base + path, {
        method:'POST',
        mode:'cors',
        credentials:'omit',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ token, ...body }),
      });
      const raw = await response.text();
      let data;
      try { data = JSON.parse(raw || '{}'); }
      catch { return { ok:false, error:'conape_bridge_invalid_response' }; }
      return data && typeof data === 'object' ? data : { ok:false, error:'conape_bridge_invalid_response' };
    } catch (error) {
      console.error('[C3.6] Bridge CONAPE no disponible.', error);
      return { ok:false, error:'conape_bridge_unavailable' };
    }
  }

  async function preview(cedula){
    return postBridge('/v1/recruit/preview', { cedula:digits(cedula) });
  }

  async function submit(args){
    const input = args || {};
    return postBridge('/v1/recruit/submit', {
      cedula:digits(input.cedula),
      source_version:String(input.sourceVersion || ''),
      prospecto:input.payload || {},
    });
  }

  /*
   * Namespace canónico C3.6.1. El modal por fila consume este objeto y no
   * depende de globals legacy que módulos Babel anteriores pueden redefinir.
   */
  window.CONAPE_PORTAL_BRIDGE_C36 = Object.freeze({
    preview,
    submit,
    active:!!bridgeBase(),
  });

  /* Compatibilidad para superficies históricas; no es el contrato del botón por fila. */
  window.conapePortalRecruitPreviewVentasSeguro = preview;
  window.conapePortalRecruitSubmitVentasSeguro = submit;
  window.CONAPE_BRIDGE_C36_ACTIVE = !!bridgeBase();
})();
