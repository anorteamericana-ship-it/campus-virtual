// F98.4-Z6-CS21A88 · Opening markers
(function () {
  const core = window.__AN_CAL88;
  core.scheduleDays = function (group) {
    const text = core.normalizeText((group.dias || '') + ' ' + (group.diasCode || '') + ' ' + group.code);
    if (/\bL4\b|\bLJ\b|LUN[^A-Z]*JUE/.test(text)) return [1, 2, 3, 4];
    if (/\bSA\b|SAB/.test(text)) return [6];
    if (/\bKJ\b|MAR[^A-Z]*JUE/.test(text)) return [2, 4];
    if (/\bLM\b|LUN[^A-Z]*MIE/.test(text)) return [1, 3];
    return [];
  };
  core.openingMarkersRange = function (group, startDate, dayCount) {
    if (group.estadoVisual !== 'APERTURA') return [];
    const end = new Date((group.aperturaFechaInicio || group.fechaInicioNivel || '') + 'T00:00:00');
    if (Number.isNaN(end.getTime())) return [];
    const allowed = core.scheduleDays(group);
    const result = [];
    for (let i = 0; i < dayCount; i += 1) {
      const date = core.addDays(startDate, i);
      if (date <= end && allowed.includes(date.getDay())) {
        result.push({ leccion: 0, fecha: core.isoDate(date), tipo: 'APERTURA', estado: 'PROYECTADO' });
      }
    }
    return result;
  };
  core.openingMarkers = function (group, weekStart) {
    return core.openingMarkersRange(group, weekStart, 6);
  };
})();