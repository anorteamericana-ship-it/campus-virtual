// F98.4-Z6-CS21A88 · Selected lesson summary
(function () {
  const core = window.__AN_CAL88;
  core.renderSelectedLesson = function (React, selected, clear) {
    if (!selected) return null;
    const h = React.createElement;
    return h('div', { style: { marginTop: 10, padding: 12, border: '1px solid #D8DEE8', borderRadius: 10, background: '#FFF' } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 10 } },
        h('strong', null, selected.group.code + ' · ' + core.lessonLabel(selected.lesson)),
        h('button', { type: 'button', onClick: clear }, 'Cerrar')
      ),
      h('div', { style: { marginTop: 6, fontSize: 11, color: '#475569' } },
        selected.lesson.fecha + ' · ' + selected.group.nivelId + ' · ' +
        [selected.group.dias, selected.group.hora].filter(Boolean).join(' · ') + ' · ' + selected.group.docente
      )
    );
  };
})();