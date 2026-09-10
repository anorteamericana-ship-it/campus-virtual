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

  window.conapePortalRecruitPreviewVentasSeguro = function conapeRecruitPreviewLive(cedula){
    return postBridge('/v1/recruit/preview', { cedula:digits(cedula) });
  };

  window.conapePortalRecruitSubmitVentasSeguro = function conapeRecruitSubmitLive(args){
    const input = args || {};
    return postBridge('/v1/recruit/submit', {
      cedula:digits(input.cedula),
      source_version:String(input.sourceVersion || ''),
      prospecto:input.payload || {},
    });
  };

  window.CONAPE_BRIDGE_C36_ACTIVE = !!bridgeBase();
})();
