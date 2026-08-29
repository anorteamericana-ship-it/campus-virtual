// CS21A152 · Ventas runtime isolation guard
// Objetivo: datos DEMO nunca sustituyen una falla del runtime real.
// No toca Apps Script ni cambia el contrato del endpoint.
(function ventasRuntimeGuardCS21A152(){
  if (typeof window.getGruposVentas !== 'function') return;

  const getGruposVentasReal = window.getGruposVentas;
  window.getGruposVentas = async function getGruposVentasSinFallbackDemo(programa){
    try {
      const r = await getGruposVentasReal(programa);
      if (Array.isArray(r)) return r;
      if (r && Array.isArray(r.grupos)) return r;
      console.error('[Ventas CS21A152] Respuesta inválida de grupos disponibles.', r);
      return { ok:false, grupos:[], error:'No se pudieron cargar los grupos disponibles.' };
    } catch (err) {
      console.error('[Ventas CS21A152] Falló la carga real de grupos disponibles.', err);
      return { ok:false, grupos:[], error:'No se pudieron cargar los grupos disponibles.' };
    }
  };
})();
