// F98.4-Z6-CS21A65 · Limpia la ruta interna al salir de Recursos Didácticos
(function () {
  'use strict';

  const OPEN_KEY = 'an_admin_resources_open';
  const EVENT_NAME = 'an:admin-resource-tab';
  const CURRENT_MENU_ID = 'an-resources-nav-cs21a65';

  document.addEventListener('click', event => {
    const button = event.target?.closest?.('aside.admin-sb button');
    if (!button || button.closest(`#${CURRENT_MENU_ID}`)) return;

    let wasOpen = false;
    try {
      wasOpen = sessionStorage.getItem(OPEN_KEY) === '1';
      sessionStorage.removeItem(OPEN_KEY);
    } catch (_) {}

    if (wasOpen) {
      try {
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { tab: 'libros', open: false } }));
      } catch (_) {}
    }
  }, true);

  window.__AN_RESOURCES_PANEL_STATE_VERSION__ = 'F98.4-Z6-CS21A65';
})();
