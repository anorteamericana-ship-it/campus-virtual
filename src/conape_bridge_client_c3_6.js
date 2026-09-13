/* global window, fetch */
(function conapeBridgeClientV44(){
  'use strict';

  function cleanBase(value){ return String(value || '').trim().replace(/\/+$/, ''); }
  function digits(value){ return String(value || '').replace(/\D/g, ''); }
  function bridgeBase(){ return cleanBase(window.CONAPE_PORTAL_BRIDGE_URL || ''); }
  let lastSalesAsesor = '';

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
      console.error('[CONAPE V4.4] Bridge no disponible.', error);
      return { ok:false, error:'conape_bridge_unavailable' };
    }
  }

  async function getBridge(path){
    const base = bridgeBase();
    if (!base) return { ok:false, error:'conape_bridge_not_configured' };
    const token = window.getSessionToken ? window.getSessionToken() : '';
    if (!token) return { ok:false, error:'campus_session_required' };
    try {
      const response = await fetch(base + path, {
        method:'GET', mode:'cors', credentials:'omit',
        headers:{ 'Authorization':'Bearer ' + token },
        cache:'no-store',
      });
      const raw = await response.text();
      let data;
      try { data = JSON.parse(raw || '{}'); }
      catch { return { ok:false, error:'conape_bridge_invalid_response' }; }
      return data && typeof data === 'object' ? data : { ok:false, error:'conape_bridge_invalid_response' };
    } catch (error) {
      console.error('[CONAPE V4.4] Bridge no disponible.', error);
      return { ok:false, error:'conape_bridge_unavailable' };
    }
  }

  async function listProspects(options){
    const summary = options?.summary === true ? '?summary=1' : '';
    return getBridge('/v1/prospects/list' + summary);
  }

  // Entrada a Ventas: solo lee el espejo existente. No dispara lectura viva de CONAPE.
  async function salesStatuses(asesor){
    lastSalesAsesor = String(asesor || lastSalesAsesor || '').trim();
    return postBridge('/v1/prospects/sales-status', { asesor:lastSalesAsesor });
  }

  // Botón manual y post CREATE/UPDATE: sí fuerzan lectura viva + validación + persistencia.
  async function refreshMirror(asesor){
    lastSalesAsesor = String(asesor || lastSalesAsesor || '').trim();
    return postBridge('/v1/prospects/refresh', { asesor:lastSalesAsesor });
  }

  async function sessionStatus(){ return postBridge('/v1/session/status', {}); }
  async function connect(){ return postBridge('/v1/session/connect', {}); }
  async function disconnect(){ return postBridge('/v1/session/disconnect', {}); }
  async function execute(cedula){ return postBridge('/v1/recruit/execute', { cedula:digits(cedula) }); }
  async function preview(cedula){ return postBridge('/v1/recruit/preview', { cedula:digits(cedula) }); }
  async function submit(args){
    const input = args || {};
    return postBridge('/v1/recruit/submit', {
      cedula:digits(input.cedula),
      source_version:String(input.sourceVersion || ''),
      prospecto:input.payload || {},
    });
  }

  const api = Object.freeze({
    status:sessionStatus,
    connect,
    disconnect,
    execute,
    preview,
    submit,
    listProspects,
    salesStatuses,
    refreshMirror,
    active:!!bridgeBase(),
    version:'V4.4.1',
  });

  window.CONAPE_PORTAL_BRIDGE_V3 = api;
  window.CONAPE_PORTAL_BRIDGE_C37 = api;
  window.CONAPE_PORTAL_BRIDGE_C36 = api;
  window.conapePortalRecruitExecuteVentasSeguro = execute;
  window.conapePortalRecruitPreviewVentasSeguro = preview;
  window.conapePortalRecruitSubmitVentasSeguro = submit;
  window.CONAPE_BRIDGE_V3_ACTIVE = !!bridgeBase();
  window.CONAPE_BRIDGE_C36_ACTIVE = !!bridgeBase();
  window.CONAPE_BRIDGE_C37_ACTIVE = !!bridgeBase();

  // El componente base llama onChanged solo cuando CREATE/UPDATE terminó bien.
  // Se envuelve ese callback para refrescar CONAPE en ese mismo momento.
  function installImmediatePostRecruitRefresh(){
    const Base = window.ConapeRecruitRowButtonC35;
    if (typeof Base !== 'function' || Base.__conapeMirrorV44Wrapped) return;
    function Wrapped(props){
      const originalChanged = props && props.onChanged;
      const afterRecruit = async change => {
        if (typeof originalChanged === 'function') originalChanged(change);
        const ced = digits(change?.cedula || props?.prospecto?.cedula);
        if (!ced) return;
        try {
          const fresh = await refreshMirror(lastSalesAsesor);
          if (!fresh?.ok || !Array.isArray(fresh.rows)) return;
          const row = fresh.rows.find(item => digits(item?.cedula) === ced);
          if (!row || typeof originalChanged !== 'function') return;
          const merged = typeof window.mergeConapeStatusVentas === 'function'
            ? window.mergeConapeStatusVentas(props?.prospecto || { cedula:ced, financiamiento:'CONAPE' }, row)
            : { cedula:ced, estado_conape_raw:String(row.estado || '') };
          originalChanged({ ...merged, cedula:ced });
        } catch (error) {
          console.warn('[Ventas CONAPE V4.4] Reclutamiento confirmado; refresco del espejo no disponible.', {
            code:String(error?.code || 'UNAVAILABLE')
          });
        }
      };
      return window.React.createElement(Base, { ...props, onChanged:afterRecruit });
    }
    Wrapped.__conapeMirrorV44Wrapped = true;
    window.ConapeRecruitRowButtonC35 = Wrapped;
  }
  installImmediatePostRecruitRefresh();
})();
