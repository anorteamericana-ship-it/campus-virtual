// F98.4-Z6-CS21A88 · Calendar shell
(function () {
  const core = window.__AN_CAL88;
  core.renderTopCard = function (React, state) {
    const h = React.createElement;
    return h('div', {
      style: { background: '#FFF', border: '1px solid #E1E7EF', borderRadius: 14, padding: '13px 14px', marginBottom: 12 }
    },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' } },
        core.renderControls(React, state.filter[0], state.filter[1], state.counts, state.order[0], state.order[1]),
        core.renderViewSwitch(React, state.view[0], state.view[1])
      ),
      core.renderReviewWarning(React, state.counts.REVISAR)
    );
  };
})();