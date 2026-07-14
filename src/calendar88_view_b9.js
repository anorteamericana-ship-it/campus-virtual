// F98.4-Z6-CS21A88 · Review warning
(function () {
  const core = window.__AN_CAL88;
  core.renderReviewWarning = function (React, count) {
    if (!count) return null;
    return React.createElement('div', {
      style: {
        marginTop: 10,
        padding: '8px 10px',
        borderRadius: 9,
        background: '#FFF7ED',
        border: '1px solid #FED7AA',
        color: '#92400E',
        fontSize: 10.5,
        fontWeight: 700
      }
    }, count + ' grupo' + (count === 1 ? '' : 's') +
      ' requieren revisión: GRUPOS dice “En curso”, pero el calendario ya terminó. No se modifica el dato automáticamente.');
  };
})();