// F98.4-Z6-CS21A88 · Calendar core C
(function () {
  'use strict';

  const core = window.__AN_CAL88;
  if (!core) throw new Error('CS21A88 core no está cargado.');

  core.enrichGroups = function (groups, todayIso) {
    const unique = new Map();
    (Array.isArray(groups) ? groups : []).forEach(function (item) {
      const group = core.normalizeGroup(item);
      if (group && !unique.has(group.code)) unique.set(group.code, group);
    });

    return Array.from(unique.values()).map(function (group) {
      const courseLessons = group.lecciones.filter(function (lesson) {
        return lesson.tipo !== 'ICAN' && lesson.leccion > 0;
      });
      let lastLesson = '';
      courseLessons.forEach(function (lesson) {
        if (lesson.fecha > lastLesson) lastLesson = lesson.fecha;
      });

      let visual = group.estadoFuente;
      if (group.estadoFuente === 'ACTIVO') {
        const hasCurrentOrFuture = courseLessons.some(function (lesson) {
          return lesson.fecha >= todayIso;
        });
        visual = hasCurrentOrFuture ? 'ACTIVO' : 'REVISAR';
      }

      return Object.assign({}, group, {
        estadoVisual: visual,
        ultimaLeccion: lastLesson || core.text(group.fechaUltimaLeccion)
      });
    });
  };

  core.countGroups = function (groups) {
    const result = { total: groups.length, ACTIVO: 0, REVISAR: 0, APERTURA: 0, CERRADO: 0 };
    groups.forEach(function (group) {
      result[group.estadoVisual] = (result[group.estadoVisual] || 0) + 1;
    });
    return result;
  };

  core.groupNumber = function (code) {
    const parts = core.text(code).split('-');
    const digits = (parts[parts.length - 1] || '').replace(/\D/g, '');
    const number = Number(digits);
    return Number.isFinite(number) && number > 0 ? number : 999999;
  };

  core.sortGroups = function (groups, mode) {
    const statusOrder = { ACTIVO: 1, REVISAR: 2, APERTURA: 3, CERRADO: 4 };
    return groups.slice().sort(function (a, b) {
      if (mode === 'ESTADO') {
        const diff = (statusOrder[a.estadoVisual] || 9) - (statusOrder[b.estadoVisual] || 9);
        if (diff) return diff;
      }
      if (mode === 'HORARIO') {
        const byHour = core.text(a.hora).localeCompare(core.text(b.hora));
        if (byHour) return byHour;
      }
      return core.groupNumber(a.code) - core.groupNumber(b.code) || a.code.localeCompare(b.code);
    });
  };

  core.lessonLabel = function (lesson) {
    if (lesson.tipo === 'APERTURA') return 'Apertura';
    if (lesson.tipo === 'ICAN') return 'I CAN ' + String(lesson.leccion || '').padStart(2, '0');
    return 'L' + String(lesson.leccion || 0).padStart(2, '0');
  };
})();