// F98.4-Z6-CS21A65 · Estado de Recursos Didácticos + controles PDF estudiante
(function () {
  'use strict';

  const OPEN_KEY = 'an_admin_resources_open';
  const EVENT_NAME = 'an:admin-resource-tab';
  const CURRENT_MENU_ID = 'an-resources-nav-cs21a65';
  const STUDENT_PDF_SCRIPT_ID = 'an-student-book-pdf-cs21a65';

  function loadStudentPdfControls() {
    if (document.getElementById(STUDENT_PDF_SCRIPT_ID)) return;
    const script = document.createElement('script');
    script.id = STUDENT_PDF_SCRIPT_ID;
    script.src = 'src/student_book_pdf_cs21a65.js?v=F98.4Z6CS21A65';
    script.async = false;
    document.head.appendChild(script);
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
  window.__AN_RESOURCES_PANEL_STATE_VERSION__ = 'F98.4-Z6-CS21A65';
})();
