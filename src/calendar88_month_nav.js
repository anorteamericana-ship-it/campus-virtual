// F98.4-Z6-CS21A88 · Month navigation
(function () {
  const core = window.__AN_CAL88;
  core.renderMonthNavigation = function (React, cursor, setCursor, today, visible, total) {
    const h = React.createElement;
    function move(amount) {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + amount, 1));
    }
    return h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 9, flexWrap: 'wrap' } },
      h('div', { style: { display: 'flex', gap: 6 } },
        h('button', { type: 'button', onClick: function () { move(-1); }, style: core.navButtonStyle() }, '‹'),
        h('button', { type: 'button', onClick: function () { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); }, style: core.navButtonStyle() }, 'Hoy'),
        h('button', { type: 'button', onClick: function () { move(1); }, style: core.navButtonStyle() }, '›')
      ),
      h('strong', null, core.monthLabels[cursor.getMonth()] + ' ' + cursor.getFullYear()),
      h('span', { style: { fontSize: 10.5, color: '#64748B' } }, visible + ' de ' + total + ' grupos')
    );
  };
})();