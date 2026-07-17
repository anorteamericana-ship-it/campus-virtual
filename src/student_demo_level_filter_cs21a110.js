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
