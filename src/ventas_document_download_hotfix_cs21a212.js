(function ventasDocumentDownloadHotfixCS21A212() {
  'use strict';

  if (window.__VENTAS_DOC_DOWNLOAD_CS21A212__) return;

  const originalGenerate = window.generarDocumentoVentasSeguro;
  const originalOpen = window.open;
  if (typeof originalGenerate !== 'function' || typeof originalOpen !== 'function') {
    console.error('[Ventas CS21A212] No se pudo instalar el hotfix de descarga.');
    return;
  }

  let pendingEnrollmentDownload = null;

  function safePart(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_-]+/gi, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64);
  }

  function enrollmentFileName(payload) {
    const ref = safePart(payload && (payload.codigo || payload.cedula)) || 'ESTUDIANTE';
    return `HOJA_MATRICULA_${ref}.pdf`;
  }

  function driveFileId(url) {
    try {
      const u = new URL(String(url || ''), window.location.href);
      const host = u.hostname.toLowerCase();
      const pathMatch = u.pathname.match(/\/file\/d\/([^/]+)/i)
        || u.pathname.match(/\/d\/([^/]+)/i);
      if (pathMatch && /(^|\.)drive\.google\.com$|(^|\.)googleusercontent\.com$|(^|\.)lh3\.googleusercontent\.com$/.test(host)) {
        return pathMatch[1];
      }
      if (/drive\.google\.com$/.test(host)) {
        return u.searchParams.get('id') || '';
      }
    } catch (_) {}
    return '';
  }

  function downloadHref(rawUrl) {
    const id = driveFileId(rawUrl);
    if (id) return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
    return String(rawUrl || '');
  }

  function triggerDownload(rawUrl, fileName) {
    const href = downloadHref(rawUrl);
    if (!href) throw new Error('download_url_vacia');

    const a = document.createElement('a');
    a.href = href;
    a.download = fileName || 'HOJA_MATRICULA.pdf';
    a.target = '_blank';
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  window.generarDocumentoVentasSeguro = async function generarDocumentoVentasConDescarga(payload) {
    const response = await originalGenerate.apply(this, arguments);
    const tipo = String(payload && payload.tipo || '').toUpperCase();
    pendingEnrollmentDownload = tipo === 'CERTIFICADO' && response && response.ok && response.url
      ? { url: String(response.url), fileName: enrollmentFileName(payload) }
      : null;
    return response;
  };

  window.open = function openWithEnrollmentDownload(url, target, features) {
    const pending = pendingEnrollmentDownload;
    if (pending && String(url || '') === pending.url) {
      pendingEnrollmentDownload = null;
      try {
        triggerDownload(pending.url, pending.fileName);
        return null;
      } catch (error) {
        console.warn('[Ventas CS21A212] Descarga directa falló; se usa apertura normal.', error);
      }
    }
    return originalOpen.call(window, url, target, features);
  };

  window.__VENTAS_DOC_DOWNLOAD_CS21A212__ = true;
})();
