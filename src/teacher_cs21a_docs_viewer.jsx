// F98.4-Z6-CS21A167 · Compatibilidad del visor documental docente CS21A6.
//
// Sus responsabilidades vigentes se encuentran en:
// - src/teacher_cs21a.jsx · TeacherHubCS21A (información y asistencia);
// - src/teacher_cs21a_planeamiento_grouped.jsx · PlaneamientoGroupedViewCS21A140.
//
// Este archivo conserva temporalmente la ruta para transición de caché, pero
// no redefine MaterialesView, no instala listeners y no publica una UI paralela.
(function teacherDocsViewerCompatibilityCS21A167() {
  'use strict';
  window.__AN_TEACHER_DOCS_VIEWER_COMPATIBILITY__ = Object.freeze({
    version: 'F98.4-Z6-CS21A167',
    replacements: Object.freeze([
      'TeacherHubCS21A',
      'PlaneamientoGroupedViewCS21A140',
    ]),
  });
})();
