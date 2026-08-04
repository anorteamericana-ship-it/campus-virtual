// F98.4-Z6-CS21A156 · Compatibilidad del agregado histórico CS21A59.
//
// La ruta administrativa ya no envuelve Sidebar, MaterialesView ni
// AdminMasterDashboard. La autoridad vigente es:
// - App/F96_LAZY.admin_resources;
// - Sidebar con data-nav-id="recursos_didacticos";
// - window.AdminResourcesView;
// - window.__AN_BOOK_RESOURCES_COMPONENT__.
(function adminResourcesCS21A59Compatibility() {
  'use strict';
  window.__AN_ADMIN_RESOURCES_CS21A59_COMPATIBILITY__ = Object.freeze({
    version:'F98.4-Z6-CS21A156',
    replacement:'AdminResourcesView',
  });
})();
