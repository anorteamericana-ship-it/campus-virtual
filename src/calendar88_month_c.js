// F98.4-Z6-CS21A88 · Month grid
(function () {
  const core = window.__AN_CAL88;
  core.renderMonthCell = function (React, cursor, date, items, todayIso, onSelect) {
    const h = React.createElement;
    const iso = core.isoDate(date);
    const inside = date.getMonth() === cursor.getMonth();
    const visible = items.slice(0, 6);
    return h('div', {
      key: iso,
      style: { background: inside ? '#FFF' : '#F8FAFC', minHeight: 118, padding: 7, opacity: inside ? 1 : 0.55 }
    },
      h('div', { style: { fontSize: 10, fontWeight: 900, marginBottom: 5, color: iso === todayIso ? '#0B1F3A' : '#64748B' } }, String(date.getDate())),
      visible.map(function (item) { return core.renderMonthPill(React, item, onSelect); }),
      items.length > visible.length ? h('div', { style: { fontSize: 8.5, color: '#64748B' } }, 'Más: ' + (items.length - visible.length)) : null
    );
  };
})();