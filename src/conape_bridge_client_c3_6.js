/* global window, fetch */
(function conapeBridgeClientC38(){
  'use strict';

  function cleanBase(value){ return String(value || '').trim().replace(/\/+$/, ''); }
  function digits(value){ return String(value || '').replace(/\D/g, ''); }
  function bridgeBase(){ return cleanBase(window.CONAPE_PORTAL_BRIDGE_URL || ''); }

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
      console.error('[C3.8] Bridge CONAPE no disponible.', error);
      return { ok:false, error:'conape_bridge_unavailable' };
    }
  }

  async function sessionStatus(){ return postBridge('/v1/session/status', {}); }
  async function connect(){ return postBridge('/v1/session/connect', {}); }
  async function disconnect(){ return postBridge('/v1/session/disconnect', {}); }
  async function preview(cedula){ return postBridge('/v1/recruit/preview', { cedula:digits(cedula) }); }
  async function submit(args){
    const input = args || {};
    return postBridge('/v1/recruit/submit', {
      cedula:digits(input.cedula),
      source_version:String(input.sourceVersion || ''),
      prospecto:input.payload || {},
    });
  }
  async function tracking(cedulas){
    const normalized = Array.from(new Set((Array.isArray(cedulas) ? cedulas : []).map(digits).filter(Boolean))).slice(0,100);
    if (!normalized.length) return { ok:true, records:[], missing:[], ambiguous:[], metrics:{ requested:0, returned:0, missing:0, ambiguous:0 } };
    return postBridge('/v1/tracking/query', { cedulas:normalized });
  }

  const api = Object.freeze({
    status:sessionStatus,
    connect,
    disconnect,
    preview,
    submit,
    tracking,
    active:!!bridgeBase(),
    version:'C3.8',
  });

  window.CONAPE_PORTAL_BRIDGE_C38 = api;
  window.CONAPE_PORTAL_BRIDGE_C37 = api;
  /* Compatibilidad temporal: el botón por fila C3.5/C3.6 sigue consumiendo C36. */
  window.CONAPE_PORTAL_BRIDGE_C36 = api;
  window.conapePortalRecruitPreviewVentasSeguro = preview;
  window.conapePortalRecruitSubmitVentasSeguro = submit;
  window.conapePortalTrackingVentasSeguro = tracking;
  window.CONAPE_BRIDGE_C36_ACTIVE = !!bridgeBase();
  window.CONAPE_BRIDGE_C37_ACTIVE = !!bridgeBase();
  window.CONAPE_BRIDGE_C38_ACTIVE = !!bridgeBase();
})();
