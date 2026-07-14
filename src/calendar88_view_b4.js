// F98.4-Z6-CS21A88 · Week row
(function () {
  const core = window.__AN_CAL88;
  core.renderWeekRow = function (React, group, days, map, onSelect) {
    const h = React.createElement;
    const out = [core.renderGroupHeader(React, group)];
    days.forEach(function (date) {
      const iso = core.isoDate(date);
      const lessons = map.get(iso) || [];
      out.push(h('div', {
        key: group.code + iso,
        style: { background: '#FFF', minHeight: 76, padding: 6, display: 'flex', flexDirection: 'column', gap: 5 }
      }, lessons.map(function (lesson) {
        return core.renderLessonChip(React, group, lesson, onSelect);
      })));
    });
    return out;
  };
})();