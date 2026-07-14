// F98.4-Z6-CS21A87 · Calendario Superadmin — parche de fuente antes del lazy loader
// Corrige el problema real de CS21A80: las funciones internas de cronograma_todos.jsx
// son referencias léxicas y no cambian al reemplazar window.TodosVistaSemana/window.todosShortCode.
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A87';
  const TARGET = /(?:^|\/)src\/cronograma_todos\.jsx(?:[?#]|$)/i;
  const SOURCE_MARKER = '/* CS21A87_SOURCE_PATCH_APPLIED */';

  const ORIGINAL_WEEK_RULE = "if (alcance === 'completados') return true;";
  const FIXED_WEEK_RULE = "if (alcance === 'completo' || alcance === 'completados') return true;";

  const ORIGINAL_SHORT_CODE = [
    'function todosShortCode(code) {',
    "  const parts = String(code || '').split('-').filter(Boolean);",
    '  if (parts.length >= 3) return `${parts[0]}-${parts[1]}-${parts[parts.length - 1]}`;',
    "  return String(code || '—');",
    '}'
  ].join('\n');

  const FIXED_SHORT_CODE = [
    'function todosShortCode(code) {',
    "  const full = String(code || '').trim();",
    "  return full || '—';",
    '}'
  ].join('\n');

  function targetUrl(input) {
    const raw = typeof input === 'string'
      ? input
      : (input && typeof input.url === 'string' ? input.url : '');
    return TARGET.test(String(raw || ''));
  }

  function patchSource(source) {
    let code = String(source == null ? '' : source);
    const changes = [];

    if (!code) throw new Error('cronograma_todos.jsx llegó vacío.');

    // 1) Cronograma completo = inventario completo. No depende de que el grupo
    // tenga una lección dentro de los seis días de la semana visible.
    if (code.includes(FIXED_WEEK_RULE)) {
      changes.push('week_visibility_already_fixed');
    } else if (code.includes(ORIGINAL_WEEK_RULE)) {
      code = code.replace(ORIGINAL_WEEK_RULE, FIXED_WEEK_RULE);
      changes.push('week_visibility_fixed');
    } else {
      throw new Error('No se encontró la regla semanal esperada; se evita aplicar un parche parcial.');
    }

    // 2) El código de cohorte debe mostrarse completo. El nivel actual ya tiene
    // una insignia separada; recortar C1/B2/etc. hacía ambiguos los grupos.
    if (code.includes(FIXED_SHORT_CODE)) {
      changes.push('full_group_code_already_fixed');
    } else if (code.includes(ORIGINAL_SHORT_CODE)) {
      code = code.replace(ORIGINAL_SHORT_CODE, FIXED_SHORT_CODE);
      changes.push('full_group_code_fixed');
    } else {
      throw new Error('No se encontró todosShortCode con la forma esperada; se evita aplicar un parche parcial.');
    }

    if (!code.includes(SOURCE_MARKER)) code = SOURCE_MARKER + '\n' + code;

    return {
      source: code,
      changes,
      completeWeekInventory: code.includes(FIXED_WEEK_RULE),
      fullGroupCode: code.includes(FIXED_SHORT_CODE)
    };
  }

  function publishStatus(status) {
    window.__AN_CALENDAR_SOURCEFIX_VERSION__ = VERSION;
    window.__AN_CALENDAR_SOURCEFIX_STATUS__ = Object.assign({
      version: VERSION,
      at: new Date().toISOString()
    }, status || {});
  }

  const originalFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : null;
  if (!originalFetch) {
    publishStatus({ ok:false, error:'window.fetch no disponible' });
    return;
  }

  let patched = false;

  window.fetch = async function calendarSourceFixFetch(input, init) {
    const response = await originalFetch(input, init);
    if (patched || !targetUrl(input) || !response || !response.ok) return response;

    const originalText = await response.text();
    try {
      const result = patchSource(originalText);
      patched = true;
      publishStatus({
        ok:true,
        target: typeof input === 'string' ? input : (input && input.url) || '',
        changes: result.changes,
        completeWeekInventory: result.completeWeekInventory,
        fullGroupCode: result.fullGroupCode
      });

      // El lazy loader solo usa ok + text(). Se conserva status/headers y se
      // devuelve la fuente corregida para que Babel compile las funciones locales.
      const headers = typeof Headers === 'function' ? new Headers(response.headers || undefined) : response.headers;
      const patchedResponse = new Response(result.source, {
        status: response.status,
        statusText: response.statusText,
        headers
      });

      // Ya se corrigió el único recurso objetivo: retiramos el interceptor para
      // no añadir costo ni alterar otras llamadas del Campus.
      window.fetch = originalFetch;
      return patchedResponse;
    } catch (error) {
      publishStatus({
        ok:false,
        target: typeof input === 'string' ? input : (input && input.url) || '',
        error: error && error.message ? error.message : String(error)
      });
      console.error('[CS21A87] No se aplicó el parche del Calendario académico:', error);
      // Fallo cerrado: no inventa datos ni modifica una fuente que no reconoce.
      return new Response(originalText, {
        status: response.status,
        statusText: response.statusText,
        headers: typeof Headers === 'function' ? new Headers(response.headers || undefined) : response.headers
      });
    }
  };

  // API de diagnóstico y pruebas. No contiene datos académicos.
  window.__AN_CALENDAR_SOURCEFIX_TEST__ = {
    version: VERSION,
    targetUrl,
    patchSource
  };

  publishStatus({ ok:null, state:'ARMED', target:'src/cronograma_todos.jsx' });
})();
