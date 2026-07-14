// F98.4-Z6-CS21A88 · Calendar core A
(function () {
  'use strict';

  const core = window.__AN_CAL88 || {};
  core.version = 'F98.4-Z6-CS21A88';
  core.levelColors = {
    B1: '#E5A823',
    B2: '#E8372A',
    I1: '#2B7FC1',
    I2: '#4CAF50'
  };
  core.dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  core.monthLabels = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  core.text = function (value) {
    return String(value == null ? '' : value).trim();
  };

  core.isoDate = function (date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  };

  core.addDays = function (date, amount) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    next.setHours(0, 0, 0, 0);
    return next;
  };

  core.mondayOf = function (value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    const weekday = date.getDay();
    date.setDate(date.getDate() + (weekday === 0 ? -6 : 1 - weekday));
    return date;
  };

  window.__AN_CAL88 = core;
})();