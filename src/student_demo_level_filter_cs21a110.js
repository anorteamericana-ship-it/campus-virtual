// F98.4-Z6-CS21A110 · Aísla comentarios y Club I CAN por nivel seleccionado.
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A110';

  function normalize(value) {
    return String(value || '').trim().toUpperCase();
  }

  function filterRows(rows, level, group) {
    const selectedLevel = normalize(level);
    const selectedGroup = normalize(group);
    return (Array.isArray(rows) ? rows : []).filter((row) => {
      const rowLevel = normalize(row && (row.nivel || row.NIVEL));
      const rowGroup = normalize(row && (row.cod_grupo || row.COD_GRUPO || row.grupo || row.GRUPO));
      const sameLevel = !selectedLevel || !rowLevel || rowLevel === selectedLevel;
      const sameGroup = !selectedGroup || !rowGroup || rowGroup === selectedGroup;
      return sameLevel && sameGroup;
    });
  }

  function install() {
    const original = window.buildRegistroAcademicoSD;
    if (typeof original !== 'function' || original.__cs21a110Wrapped) return false;

    function buildRegistroAcademicoCS21A110(args) {
      const input = args || {};
      const level = input.nivel || '';
      const group = input.codGrupo || '';
      const retroSource = input.retroData || {};
      const icanSource = input.icanData || {};

      const retroData = Object.assign({}, retroSource, {
        retroalimentacion: filterRows(retroSource.retroalimentacion, level, group)
      });

      const icanData = Object.assign({}, icanSource);
      ['sesiones', 'historial', 'registros'].forEach((key) => {
        if (Array.isArray(icanSource[key])) {
          icanData[key] = filterRows(icanSource[key], level, group);
        }
      });

      return original(Object.assign({}, input, { retroData, icanData }));
    }

    buildRegistroAcademicoCS21A110.__cs21a110Wrapped = true;
    buildRegistroAcademicoCS21A110.__cs21a110Version = VERSION;
    window.buildRegistroAcademicoSD = buildRegistroAcademicoCS21A110;
    window.CS21A110_STUDENT_DEMO_LEVEL_FILTER = VERSION;
    return true;
  }

  window.addEventListener('an:lazy-module-loaded', function (event) {
    const source = String(event && event.detail && event.detail.src || '');
    if (!source || source.indexOf('student_dashboard.jsx') >= 0) install();
  });

  if (!install()) setTimeout(install, 0);
})();

// CS21A111 · bootstrap temporal de navegación móvil. Se carga desde este archivo
// ya enlazado por campus.html para evitar tocar el router o el backend.
(function () {
  'use strict';
  const CSS_ID = 'an-mobile-navigation-cs21a111-css';
  const FIX_ID = 'an-mobile-navigation-cs21a111-fix';
  const JS_ID = 'an-mobile-navigation-cs21a111-js';

  if (!document.getElementById(CSS_ID)) {
    const link = document.createElement('link');
    link.id = CSS_ID;
    link.rel = 'stylesheet';
    link.href = 'styles/mobile_navigation_cs21a111.css?v=F98.4Z6CS21A111';
    document.head.appendChild(link);
  }

  if (!document.getElementById(FIX_ID)) {
    const style = document.createElement('style');
    style.id = FIX_ID;
    style.textContent = '@media(max-width:900px){.an-mobile-nav-close{position:fixed!important;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease}body.an-mobile-nav-open .an-mobile-nav-close{opacity:1;visibility:visible;pointer-events:auto}}';
    document.head.appendChild(style);
  }

  if (!document.getElementById(JS_ID)) {
    const script = document.createElement('script');
    script.id = JS_ID;
    script.src = 'src/mobile_navigation_cs21a111.js?v=F98.4Z6CS21A111';
    script.defer = true;
    document.head.appendChild(script);
  }
})();

// CS21A112 · carga el ajuste móvil del objetivo general de Mi Campus.
(function () {
  'use strict';
  const CSS_ID = 'an-student-objective-mobile-cs21a112-css';
  if (document.getElementById(CSS_ID)) return;
  const link = document.createElement('link');
  link.id = CSS_ID;
  link.rel = 'stylesheet';
  link.href = 'styles/student_objective_mobile_cs21a112.css?v=F98.4Z6CS21A112';
  document.head.appendChild(link);
})();
