// F98.4-Z6-CS21A88 · Install professional superadmin calendar
(function () {
  'use strict';
  const VERSION = 'F98.4-Z6-CS21A88';

  function install() {
    const core = window.__AN_CAL88;
    if (!window.React || !core || typeof core.CalendarView !== 'function') return false;
    core.CalendarView.__cs21a88CalendarGrid = true;
    window.TodosLosGruposView = core.CalendarView;
    window.__AN_CALENDAR_SUPERADMIN_VERSION__ = VERSION;
    return true;
  }

  window.addEventListener('an:lazy-module-loaded', function (event) {
    const source = String(event && event.detail && event.detail.src || '');
    if (/cronograma_todos\.jsx/i.test(source)) install();
  });

  [0, 50, 180, 500, 1200].forEach(function (delay) {
    window.setTimeout(install, delay);
  });

  window.__AN_CALENDAR88_INSTALL__ = { version: VERSION, install: install };
})();