// F98.4-Z6-CS21A88 · Month pill
(function () {
  const core = window.__AN_CAL88;
  core.renderMonthPill = function (React, item, onSelect) {
    const h = React.createElement;
    const group = item.group;
    const lesson = item.lesson;
    const color = core.levelColors[group.nivelId] || '#64748B';
    return h('button', {
      key: group.code + lesson.fecha + lesson.tipo + lesson.leccion,
      type: 'button',
      onClick: function () { onSelect(item); },
      title: group.code + ' · ' + core.lessonLabel(lesson),
      style: {
        width: '100%',
        display: 'block',
        marginBottom: 3,
        padding: '4px 5px',
        borderRadius: 5,
        border: '1px solid #D8DEE8',
        borderLeft: '3px solid ' + color,
        background: '#FFFFFF',
        textAlign: 'left',
        cursor: 'pointer',
        fontSize: 8.5,
        fontWeight: 800,
        color: '#334155',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, group.code.split('-').pop() + ' · ' + group.nivelId + ' · ' + core.lessonLabel(lesson));
  };
})();