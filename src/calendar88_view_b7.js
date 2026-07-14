// F98.4-Z6-CS21A88 · Week grid
(function () {
  const core = window.__AN_CAL88;
  core.renderWeekGrid = function (React, groups, days, weekMap, todayIso, onSelect) {
    const h = React.createElement;
    const cells = core.renderWeekHeader(React, days, todayIso);
    groups.forEach(function (group) {
      const groupMap = weekMap.get(group.code) || new Map();
      core.renderWeekRow(React, group, days, groupMap, onSelect).forEach(function (cell) {
        cells.push(cell);
      });
    });
    return h('div', { style: { border: '1px solid #D9E0EA', borderRadius: 12, overflow: 'auto', background: '#D9E0EA' } },
      h('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(240px,320px) repeat(6,minmax(118px,1fr))', gap: 1, minWidth: 980 } }, cells)
    );
  };
})();