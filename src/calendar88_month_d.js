// F98.4-Z6-CS21A88 · Month grid shell
(function () {
  const core = window.__AN_CAL88;
  core.renderMonthGrid = function (React, cursor, cells, monthMap, todayIso, onSelect) {
    const h = React.createElement;
    const content = [];
    ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach(function (label) {
      content.push(h('div', { key: label, style: { background: '#F8FAFC', padding: 8, textAlign: 'center', fontSize: 9.5, fontWeight: 900, color: '#64748B' } }, label));
    });
    cells.forEach(function (date) {
      const iso = core.isoDate(date);
      content.push(core.renderMonthCell(React, cursor, date, monthMap.get(iso) || [], todayIso, onSelect));
    });
    return h('div', { style: { border: '1px solid #D9E0EA', borderRadius: 12, overflow: 'hidden', background: '#D9E0EA' } },
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 } }, content)
    );
  };
})();