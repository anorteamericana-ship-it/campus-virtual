// F98.4-Z6-CS21A157 · Compatibilidad del normalizador docente CS21A65.
//
// El menú docente publica directamente `Libros y Audios` y el visor canónico
// incorpora audios y recursos por unidad mediante `book_inline_audio_cs21a63.js`.
// Este archivo ya no redefine Sidebar ni observa el DOM.
(function teacherResourcesCompatibilityCS21A157() {
  'use strict';
  window.__AN_RESOURCES_PANEL_COMPATIBILITY__ = Object.freeze({
    version: 'F98.4-Z6-CS21A157',
    replacement: 'TeacherSidebarCS21A + BookResourcesCS21A60',
  });
})();
