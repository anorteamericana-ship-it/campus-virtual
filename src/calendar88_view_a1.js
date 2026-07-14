// F98.4-Z6-CS21A88 · Calendar view status helpers
(function () {
  'use strict';
  const core = window.__AN_CAL88;
  if (!core) throw new Error('CS21A88 core no está cargado.');

  core.statusMeta = function (status) {
    if (status === 'ACTIVO') return { label: 'EN CURSO', fg: '#166534', bg: '#ECFDF3', border: '#BBF7D0' };
    if (status === 'REVISAR') return { label: 'REVISAR', fg: '#92400E', bg: '#FFF7ED', border: '#FED7AA' };
    if (status === 'APERTURA') return { label: 'APERTURA', fg: '#9A3412', bg: '#FFF4E6', border: '#FDBA74' };
    return { label: 'CERRADO', fg: '#475569', bg: '#F1F5F9', border: '#CBD5E1' };
  };

  core.navButtonStyle = function () {
    return {
      border: '1px solid #D8DEE8',
      background: '#FFFFFF',
      borderRadius: 8,
      minWidth: 34,
      height: 32,
      cursor: 'pointer',
      fontSize: 18,
      fontWeight: 800,
      color: '#334155'
    };
  };

  core.renderStatusBadge = function (React, group) {
    const h = React.createElement;
    const meta = core.statusMeta(group.estadoVisual);
    return h('span', {
      style: {
        background: meta.bg,
        color: meta.fg,
        border: '1px solid ' + meta.border,
        borderRadius: 999,
        padding: '2px 7px',
        fontSize: 9,
        fontWeight: 900
      }
    }, meta.label);
  };
})();