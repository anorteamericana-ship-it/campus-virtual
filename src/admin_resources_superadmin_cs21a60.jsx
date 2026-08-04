// F98.4-Z6-CS21A155 · Compatibilidad del portal histórico CS21A60.
//
// App normaliza admin y superadmin bajo `role="admin"` y conserva el rol real
// en `rolReal`. Por ello, la condición histórica `props.role === "superadmin"`
// nunca montaba el portal. Recursos Didácticos administrativos se resuelven en
// `src/resources_panel_cs21a65.jsx`, que sí usa la sesión y `rolReal`.
//
// Se conserva temporalmente la ruta para trazabilidad y reversión de caché.
(function adminResourcesSuperadminCompatibilityCS21A155() {
  'use strict';
  window.__AN_ADMIN_RESOURCES_SUPERADMIN_COMPATIBILITY__ = Object.freeze({
    version: 'F98.4-Z6-CS21A155',
    replacement: 'ResourcesPanelCS21A65',
  });
})();
