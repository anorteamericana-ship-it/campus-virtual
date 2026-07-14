// F98.4-Z6-CS21A88 · Professional superadmin calendar component
(function () {
  const core = window.__AN_CAL88;
  core.CalendarView = function (props) {
    const React = window.React;
    const h = React.createElement;
    const state = core.useCalendarState(React, props && props.gruposReales);
    const hasGroups = state.visible.length > 0;
    const navigation = state.view[0] === 'SEMANA'
      ? core.renderWeekNavigation(React, state.week[0], state.week[1], state.today, state.visible.length, state.counts.total)
      : core.renderMonthNavigation(React, state.month[0], state.month[1], state.today, state.visible.length, state.counts.total);
    const calendar = !hasGroups
      ? h('div', { style: { padding: 30, textAlign: 'center', border: '1px solid #E1E7EF', borderRadius: 12, color: '#64748B', background: '#FFF' } }, 'No hay grupos en este filtro.')
      : state.view[0] === 'SEMANA'
        ? core.renderWeekGrid(React, state.visible, state.days, state.weekMap, state.todayIso, state.selected[1])
        : core.renderMonthGrid(React, state.month[0], state.monthCells, state.monthMap, state.todayIso, state.selected[1]);
    return h('div', { 'data-cs21a88-calendar': 'true', style: { marginTop: 14 } },
      core.renderTopCard(React, state),
      navigation,
      calendar,
      core.renderSelectedLesson(
        React,
        state.selected[0],
        function () { state.selected[1](null); },
        props && props.onNavigate
      )
    );
  };
})();