// F98.4-Z6-CS21A88 · Week / month switch
(function () {
  const core = window.__AN_CAL88;
  core.renderViewSwitch = function (React, view, setView) {
    const h = React.createElement;
    return h('div', { style: { display: 'flex', padding: 3, background: '#F1F5F9', borderRadius: 9, gap: 2 } },
      ['SEMANA', 'MES'].map(function (value) {
        const active = view === value;
        return h('button', {
          key: value,
          type: 'button',
          onClick: function () { setView(value); },
          style: {
            border: 'none',
            borderRadius: 7,
            padding: '6px 10px',
            background: active ? '#FFF' : 'transparent',
            boxShadow: active ? '0 1px 4px rgba(15,23,42,.12)' : 'none',
            fontSize: 10.5,
            fontWeight: 800,
            color: '#334155',
            cursor: 'pointer'
          }
        }, value === 'SEMANA' ? 'Semana' : 'Mes');
      })
    );
  };
})();