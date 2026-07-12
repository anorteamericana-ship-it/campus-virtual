// F98.4-Z6-CS21A69 · Estado Recursos Didácticos + carga segura de controles globales
(function () {
  'use strict';

  const OPEN_KEY = 'an_admin_resources_open';
  const EVENT_NAME = 'an:admin-resource-tab';
  const CURRENT_MENU_ID = 'an-resources-nav-cs21a65';
  const STUDENT_PDF_SCRIPT_ID = 'an-student-book-pdf-cs21a65';
  const SIDEBAR_STATE_SCRIPT_ID = 'an-sidebar-active-state-cs21a69';

  function loadScript(id, src) {
    if (document.getElementById(id)) return;
    if (document.readyState === 'loading') {
      document.write('<script id="' + id + '" src="' + src + '"><\/script>');
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = false;
    document.head.appendChild(script);
  }

  function loadStudentPdfControls() {
    loadScript(STUDENT_PDF_SCRIPT_ID, 'src/student_book_pdf_cs21a65.js?v=F98.4Z6CS21A65');
  }

  function loadSidebarActiveState() {
    loadScript(SIDEBAR_STATE_SCRIPT_ID, 'src/sidebar_active_state_cs21a69.js?v=F98.4Z6CS21A69');
  }

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

  loadStudentPdfControls();
  loadSidebarActiveState();
  window.__AN_RESOURCES_PANEL_STATE_VERSION__ = 'F98.4-Z6-CS21A69';
})();
