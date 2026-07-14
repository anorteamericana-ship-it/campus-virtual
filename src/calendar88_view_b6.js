// F98.4-Z6-CS21A88 · Week navigation
(function () {
  const core = window.__AN_CAL88;
  core.renderWeekNavigation = function (React, week, setWeek, today, visible, total) {
    const h = React.createElement;
    return h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 9, flexWrap: 'wrap' } },
      h('div', { style: { display: 'flex', gap: 6 } },
        h('button', { type: 'button', onClick: function () { setWeek(core.addDays(week, -7)); }, style: core.navButtonStyle() }, '‹'),
        h('button', { type: 'button', onClick: function () { setWeek(core.mondayOf(today)); }, style: core.navButtonStyle() }, 'Hoy'),
        h('button', { type: 'button', onClick: function () { setWeek(core.addDays(week, 7)); }, style: core.navButtonStyle() }, '›')
      ),
      h('strong', null, 'Semana del ' + week.getDate() + ' al ' + core.addDays(week, 5).getDate() + ' de ' + core.monthLabels[week.getMonth()]),
      h('span', { style: { fontSize: 10.5, color: '#64748B' } }, visible + ' de ' + total + ' grupos')
    );
  };
})();