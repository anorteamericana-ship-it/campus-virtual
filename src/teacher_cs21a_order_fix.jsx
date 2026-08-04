// F98.4-Z6-CS21A152 · Compatibilidad de ruta para el módulo histórico CS21A58.
//
// La implementación activa de libros se encuentra en:
// - src/book_unit_starts_cs21a60.jsx (visor CS21A75)
// - src/book_unit_propagation_cs21a64.js (autoridad CS21A135/136)
//
// Este archivo ya no modifica MaterialesView ni instala eventos. Se conserva
// temporalmente en la ruta original para una transición reversible de caché.
(function teacherOrderFixCompatibilityCS21A152() {
  'use strict';

  window.__AN_TEACHER_ORDER_FIX_COMPATIBILITY__ = Object.freeze({
    version: 'F98.4-Z6-CS21A152',
    replacement: 'BookResourcesCS21A60',
  });
})();
