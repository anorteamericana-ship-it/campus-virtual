// F98.4-Z6-CS21A88 · Calendar state
(function () {
  const core = window.__AN_CAL88;
  core.useCalendarState = function (React, groups) {
    const today = React.useMemo(function () {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      return date;
    }, []);
    const todayIso = core.isoDate(today);
    const filterState = React.useState('TODOS');
    const orderState = React.useState('NUMERO');
    const weekState = React.useState(function () { return core.mondayOf(today); });
    const selectedState = React.useState(null);
    const all = React.useMemo(function () {
      return core.enrichGroups(groups, todayIso);
    }, [groups, todayIso]);
    const counts = React.useMemo(function () { return core.countGroups(all); }, [all]);
    const visible = React.useMemo(function () {
      const filtered = filterState[0] === 'TODOS' ? all : all.filter(function (group) {
        return group.estadoVisual === filterState[0];
      });
      return core.sortGroups(filtered, orderState[0]);
    }, [all, filterState[0], orderState[0]]);
    const days = React.useMemo(function () {
      return Array.from({ length: 6 }, function (_, index) { return core.addDays(weekState[0], index); });
    }, [weekState[0]]);
    const weekMap = React.useMemo(function () {
      return core.buildWeekMap(visible, weekState[0]);
    }, [visible, weekState[0]]);
    return {
      today: today,
      todayIso: todayIso,
      filter: filterState,
      order: orderState,
      week: weekState,
      selected: selectedState,
      all: all,
      counts: counts,
      visible: visible,
      days: days,
      weekMap: weekMap
    };
  };
})();