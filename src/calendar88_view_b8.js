// F98.4-Z6-CS21A88 · Selected lesson panel
(function () {
  const core = window.__AN_CAL88;
  core.renderSelectedLesson = function (React, selected, clear, onNavigate) {
    if (!selected) return null;
    const h = React.createElement;
    const openStudents = function () {
      if (typeof onNavigate === 'function') onNavigate('estudiantes', { grupo: selected.group.code });
      clear();
    };
    return h('div', {
      onClick: function (event) { if (event.target === event.currentTarget) clear(); },
      style: {
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(15,23,42,.42)',
        display: 'flex',
        justifyContent: 'flex-end'
      }
    },
      h('div', {
        style: {
          width: '100%',
          maxWidth: 390,
          height: '100%',
          background: '#FFF',
          boxShadow: '-16px 0 48px rgba(15,23,42,.25)',
          padding: 18
        }
      },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' } },
          h('div', null,
            h('div', { style: { fontFamily: 'var(--f-mono)', fontSize: 11, fontWeight: 900, color: '#64748B' } }, selected.group.code),
            h('div', { style: { marginTop: 5, fontFamily: 'var(--f-serif)', fontSize: 24, color: '#0F172A' } }, core.lessonLabel(selected.lesson))
          ),
          h('button', { type: 'button', onClick: clear, style: { border: 'none', background: '#F1F5F9', width: 30, height: 30, borderRadius: 999, cursor: 'pointer', fontSize: 18 } }, '×')
        ),
        h('div', { style: { marginTop: 18, display: 'grid', gap: 10, fontSize: 12, color: '#334155' } },
          h('div', null, 'Fecha: ', h('strong', null, selected.lesson.fecha)),
          h('div', null, 'Nivel: ', h('strong', null, selected.group.nivelId)),
          h('div', null, 'Horario: ', h('strong', null, [selected.group.dias, selected.group.hora].filter(Boolean).join(' · ') || '—')),
          h('div', null, 'Docente: ', h('strong', null, selected.group.docente)),
          h('div', null, 'Estado: ', h('strong', null, selected.lesson.estado))
        ),
        typeof onNavigate === 'function' ? h('button', {
          type: 'button',
          onClick: openStudents,
          style: { marginTop: 18, width: '100%', border: 'none', borderRadius: 9, padding: '10px 12px', background: '#0B1F3A', color: '#FFF', fontSize: 11, fontWeight: 800, cursor: 'pointer' }
        }, 'Ver estudiantes del grupo') : null
      )
    );
  };
})();