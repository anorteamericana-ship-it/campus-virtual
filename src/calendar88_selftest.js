// F98.4-Z6-CS21A88 · Runtime self-test
(function () {
  'use strict';
  const core = window.__AN_CAL88;
  const required = [
    'enrichGroups', 'countGroups', 'sortGroups', 'openingMarkers',
    'buildWeekMap', 'monthCells', 'buildMonthMap', 'useCalendarState',
    'renderWeekGrid', 'renderMonthGrid', 'renderTopCard', 'CalendarView',
    'renderControls', 'renderViewSwitch', 'renderWeekNavigation',
    'renderMonthNavigation', 'renderSelectedLesson', 'renderReviewWarning'
  ];
  const missing = required.filter(function (name) {
    return !core || typeof core[name] !== 'function';
  });
  let ok = missing.length === 0;
  let fixtureCounts = null;
  try {
    if (ok) {
      const fixture = [
        { code: 'G-1', nivelId: 'B1', estadoCategoria: 'ACTIVO', lecciones: [{ leccion: 1, fecha: '2026-07-15', tipo: 'CLASE' }] },
        { code: 'G-2', nivelId: 'B1', estadoCategoria: 'ACTIVO', lecciones: [{ leccion: 32, fecha: '2026-07-01', tipo: 'CLASE' }] },
        { code: 'G-3', nivelId: 'B1', estadoCategoria: 'PROYECTADO', esApertura: true, lecciones: [] },
        { code: 'G-4', nivelId: 'B2', estadoCategoria: 'COMPLETADO', lecciones: [{ leccion: 32, fecha: '2026-03-12', tipo: 'CLASE' }] }
      ];
      fixtureCounts = core.countGroups(core.enrichGroups(fixture, '2026-07-14'));
      ok = fixtureCounts.total === 4 && fixtureCounts.ACTIVO === 1 && fixtureCounts.REVISAR === 1 && fixtureCounts.APERTURA === 1 && fixtureCounts.CERRADO === 1;
    }
  } catch (error) {
    ok = false;
  }
  window.__AN_CALENDAR88_SELFTEST__ = {
    version: 'F98.4-Z6-CS21A88',
    ok: ok,
    missing: missing,
    fixtureCounts: fixtureCounts
  };
  if (!ok) console.error('[CS21A88] Falló la autoprueba del Calendario académico.', window.__AN_CALENDAR88_SELFTEST__);
})();