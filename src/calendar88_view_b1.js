// F98.4-Z6-CS21A88 · Filter button
(function () {
  const core = window.__AN_CAL88;
  core.renderFilterButton = function (React, label, value, count, active, setFilter) {
    return React.createElement('button', {
      key: value,
      type: 'button',
      onClick: function () { setFilter(value); },
      style: {
        border: active ? '1px solid #0B1F3A' : '1px solid #D8DEE8',
        background: active ? '#0B1F3A' : '#FFF',
        color: active ? '#FFF' : '#334155',
        borderRadius: 999,
        padding: '7px 11px',
        fontSize: 11,
        fontWeight: 800,
        cursor: 'pointer'
      }
    }, label + ' ' + count);
  };
})();