// F98.4-Z6-CS21A88 · Month data
(function () {
  const core = window.__AN_CAL88;
  core.monthCells = function (cursor) {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = core.addDays(first, -offset);
    return Array.from({ length: 42 }, function (_, index) {
      return core.addDays(start, index);
    });
  };
  core.buildMonthMap = function (groups, cells) {
    const result = new Map();
    if (!cells.length) return result;
    const start = cells[0];
    groups.forEach(function (group) {
      const lessons = (group.lecciones || []).concat(core.openingMarkersRange(group, start, cells.length));
      lessons.forEach(function (lesson) {
        if (!lesson || !lesson.fecha) return;
        if (!result.has(lesson.fecha)) result.set(lesson.fecha, []);
        result.get(lesson.fecha).push({ group: group, lesson: lesson });
      });
    });
    return result;
  };
})();