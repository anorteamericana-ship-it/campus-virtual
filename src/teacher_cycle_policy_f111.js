// F111 · Regla canónica de visibilidad operativa docente.
// Actividades fechadas antes de septiembre de 2026: fuera del panel vigente.
// NO modifica, elimina ni da por cerrada ninguna fila del backend.
// Los expedientes históricos permanecen para conciliación administrativa.
(function (w) {
  'use strict';
  const FIRST_OPERATIONAL_CYCLE = 202609;
  const FIRST_OPERATIONAL_DATE = '2026-09-01';
  const groupCode = value => String(value || '').trim().toUpperCase();
  function isLegacyGroup(value) {
    const code = groupCode(typeof value === 'object' && value
      ? (value.cod_grupo || value.COD_GRUPO || value.codigo_grupo || value.CODIGO_GRUPO || value.grupo || value.GRUPO || value.code)
      : value);
    const match = code.match(/-(\d{2})(\d{2})$/);
    if (!match) return false;
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    if (month < 1 || month > 12) return false;
    return year * 100 + month < FIRST_OPERATIONAL_CYCLE;
  }
  function isLegacyLesson(lesson) {
    if (!lesson || typeof lesson !== 'object') return false;
    const code = lesson.cod_grupo || lesson.COD_GRUPO || lesson.codigo_grupo ||
      lesson.CODIGO_GRUPO || lesson.grupo || lesson.GRUPO || '';
    // F111: la fecha de la ACTIVIDAD manda, nunca el ciclo de ingreso.
    // Un grupo 0826 puede seguir activo hasta enero de 2027; ocultarlo solo
    // por el sufijo borraría clases y evaluaciones válidas del docente.
    // Registros sin fecha comprobable se conservan hasta conciliación.
    const date = String(lesson.fecha || lesson.FECHA || lesson.fecha_leccion || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && date < FIRST_OPERATIONAL_DATE;
  }
  const current = item => !isLegacyLesson(item);
  function filterCalendar(raw) {
    if (!raw || typeof raw !== 'object') return raw;
    const programadas = Array.isArray(raw.programadas) ? raw.programadas.filter(current) : [];
    return { ...raw, programadas, total_programadas: programadas.length };
  }
  function filterPending(raw) {
    if (!raw || typeof raw !== 'object') return raw;
    const keys = ['sin_cerrar', 'sin_retro', 'sin_pc'];
    const clean = { ...raw, totales: { ...(raw.totales || {}) } };
    let count = 0;
    for (const key of keys) {
      if (Array.isArray(raw[key])) {
        clean[key] = raw[key].filter(current);
        clean.totales[key] = clean[key].length;
      } else {
        // Si el backend no entrega el detalle, no anunciar cifras antiguas
        // como pendientes que el docente pueda cerrar desde esta pantalla.
        clean[key] = [];
        clean.totales[key] = 0;
      }
      count += clean.totales[key];
    }
    clean.totales.total_pendientes = count;
    return clean;
  }
  w.ANTeacherCyclePolicyF111 = Object.freeze({
    firstCycle: FIRST_OPERATIONAL_CYCLE,
    isLegacyGroup, isLegacyLesson, filterCalendar, filterPending
  });
})(window);
