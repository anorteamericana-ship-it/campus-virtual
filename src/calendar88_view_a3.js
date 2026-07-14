// F98.4-Z6-CS21A88 · Group header
(function () {
  const core = window.__AN_CAL88;
  core.renderGroupHeader = function (React, group) {
    const h = React.createElement;
    const color = core.levelColors[group.nivelId] || '#64748B';
    const top = h('div', { style: { display: 'flex', gap: 7, flexWrap: 'wrap' } },
      h('strong', null, group.code),
      h('span', { style: { color: color } }, group.nivelId),
      core.renderStatusBadge(React, group)
    );
    const schedule = h('div', { style: { fontSize: 10, color: '#475569' } },
      [group.dias, group.hora].filter(Boolean).join(' · ')
    );
    const teacher = h('div', { style: { fontSize: 9, color: '#64748B' } }, group.docente);
    return h('div', {
      style: { background: '#FFF', padding: 10, borderLeft: '4px solid ' + color }
    }, top, schedule, teacher);
  };
})();