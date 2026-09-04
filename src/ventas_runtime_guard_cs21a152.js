// CS21A152 · Ventas runtime isolation guard
// Objetivo: datos DEMO/QA nunca sustituyen ni alteran el runtime real.
// No toca Apps Script ni amplía permisos.
(function ventasRuntimeGuardCS21A152(){
  if (typeof window.getGruposVentas === 'function') {
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
  }

  if (typeof window.generarDocumentoVentasSeguro === 'function') {
    const generarDocumentoReal = window.generarDocumentoVentasSeguro;
    window.generarDocumentoVentasSeguro = async function generarDocumentoVentasSinQAPersonal(payload){
      const tipo = String(payload && payload.tipo || '').toUpperCase();
      if (/_TEST$/.test(tipo)) {
        console.error('[Ventas CS21A152] Operación QA de documento bloqueada en runtime real.', tipo);
        return { ok:false, error:'Esta operación de prueba no está disponible en el panel operativo.' };
      }
      return generarDocumentoReal(payload);
    };
  }

  if (typeof window.subirMatriculaFirmadaVentasSeguro === 'function') {
    const subirFirmadaReal = window.subirMatriculaFirmadaVentasSeguro;
    window.subirMatriculaFirmadaVentasSeguro = async function subirFirmadaSinPreviewPersonal(payload){
      if (payload && payload.preview_test) {
        console.error('[Ventas CS21A152] preview_test bloqueado en subida de matrícula firmada.');
        return { ok:false, error:'Esta operación de prueba no está disponible en el panel operativo.' };
      }
      return subirFirmadaReal(payload);
    };
  }

  if (typeof window.notificarMatriculaFirmadaVentasSeguro === 'function') {
    const notificarFirmadaReal = window.notificarMatriculaFirmadaVentasSeguro;
    window.notificarMatriculaFirmadaVentasSeguro = async function notificarFirmadaSinPreviewPersonal(payload){
      if (payload && payload.preview_test) {
        console.error('[Ventas CS21A152] preview_test bloqueado en notificación de matrícula firmada.');
        return { ok:false, error:'Esta operación de prueba no está disponible en el panel operativo.' };
      }
      return notificarFirmadaReal(payload);
    };
  }
})();
