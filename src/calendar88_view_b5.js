// F98.4-Z6-CS21A88 · Control panel
(function () {
  const core = window.__AN_CAL88;
  core.renderControls = function (React, filter, setFilter, counts, order, setOrder) {
    const h = React.createElement;
    const buttons = [
      ['Todos', 'TODOS', counts.total],
      ['En curso', 'ACTIVO', counts.ACTIVO],
      ['Revisar', 'REVISAR', counts.REVISAR],
      ['Aperturas', 'APERTURA', counts.APERTURA],
      ['Completados', 'CERRADO', counts.CERRADO]
    ].map(function (item) {
      return core.renderFilterButton(React, item[0], item[1], item[2], filter === item[1], setFilter);
    });
    const select = h('select', { value: order, onChange: function (event) { setOrder(event.target.value); } },
      h('option', { value: 'NUMERO' }, 'por Nº'),
      h('option', { value: 'ESTADO' }, 'por estado'),
      h('option', { value: 'HORARIO' }, 'por horario')
    );
    return h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' } },
      h('div', { style: { display: 'flex', gap: 7, flexWrap: 'wrap' } }, buttons),
      h('label', { style: { fontSize: 11, fontWeight: 800 } }, 'Ordenar ', select)
    );
  };
})();