// F98.4-Z6-CS21A88 · Week map
(function () {
  const core = window.__AN_CAL88;
  core.buildWeekMap = function (groups, weekStart) {
    const result = new Map();
    groups.forEach(function (group) {
      const byDate = new Map();
      const lessons = (group.lecciones || []).concat(core.openingMarkers(group, weekStart));
      lessons.forEach(function (lesson) {
        if (!byDate.has(lesson.fecha)) byDate.set(lesson.fecha, []);
        byDate.get(lesson.fecha).push(lesson);
      });
      result.set(group.code, byDate);
    });
    return result;
  };
})();