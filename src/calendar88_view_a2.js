// F98.4-Z6-CS21A88 · Lesson chip
(function () {
  const core = window.__AN_CAL88;
  core.renderLessonChip = function (React, group, lesson, onSelect) {
    const color = core.levelColors[group.nivelId] || '#64748B';
    return React.createElement('button', {
      type: 'button',
      onClick: function () { onSelect({ group: group, lesson: lesson }); },
      style: {
        width: '100%',
        border: '1px solid #D8DEE8',
        borderLeft: '4px solid ' + color,
        background: '#FFFFFF',
        borderRadius: 7,
        padding: '5px 7px',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: 10,
        fontWeight: 900
      }
    }, core.lessonLabel(lesson));
  };
})();