// F98.4-Z6-CS21A88 · Week header
(function () {
  const core = window.__AN_CAL88;
  core.renderWeekHeader = function (React, days, today) {
    const h = React.createElement;
    const out = [h('div', { key: 'g', style: { background: '#F8FAFC', padding: 10, fontWeight: 900 } }, 'GRUPO')];
    days.forEach(function (date, index) {
      const iso = core.isoDate(date);
      out.push(h('div', { key: iso, style: { background: iso === today ? '#EEF4FF' : '#F8FAFC', padding: 8, textAlign: 'center' } },
        h('div', { style: { fontSize: 9, color: '#64748B' } }, core.dayLabels[index]),
        h('strong', null, String(date.getDate()))
      ));
    });
    return out;
  };
})();