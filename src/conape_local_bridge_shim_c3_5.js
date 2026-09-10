/* global window, fetch */
(function conapeLocalBridgeShimC35(){
  'use strict';
  const host = String(window.location.hostname || '').toLowerCase();
  if (host !== '127.0.0.1' && host !== 'localhost') return;

  const originalFetch = window.fetch.bind(window);
  const campusUrl = String(window.APPS_SCRIPT_URL || window.SCRIPT_URL_V || '');
  if (!campusUrl) return;

  window.fetch = async function c35Fetch(input, init = {}) {
    try {
      const target = typeof input === 'string' ? input : String(input?.url || '');
      const method = String(init?.method || 'GET').toUpperCase();
      if (method === 'POST' && target === campusUrl && typeof init?.body === 'string') {
        const body = JSON.parse(init.body);
        if (body?.fn === 'conapePortalRecruitPreview' || body?.fn === 'conapePortalRecruitSubmit') {
          const safeBody = { ...body };
          delete safeBody.token;
          return originalFetch('/api/conape-recruit', {
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            credentials:'same-origin',
            body:JSON.stringify(safeBody),
          });
        }
      }
    } catch (_) {}
    return originalFetch(input, init);
  };

  window.CONAPE_LOCAL_BRIDGE_ACTIVE = true;
  console.info('[C3.5] CONAPE loopback bridge activo para QA local.');
})();
