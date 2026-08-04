// F98.4-Z6-CS21A156 · Cargador de apoyos independientes del Campus.
(function resourcesSupportLoaderCS21A156() {
  'use strict';

  const scripts = [
    ['an-prematricula-english-lab-ui-cs21a71', 'src/prematricula_english_lab_ui_cs21a71.js?v=F98.4Z6CS21A71'],
    ['an-student-book-pdf-cs21a65', 'src/student_book_pdf_cs21a65.js?v=F98.4Z6CS21A65'],
    ['an-sidebar-active-state-cs21a69', 'src/sidebar_active_state_cs21a69.js?v=F98.4Z6CS21A69'],
    ['an-teacher-lesson-book-link-cs21a142', 'src/teacher_lesson_book_link_cs21a142.js?v=F98.4Z6CS21A142'],
  ];

  function load(id, src) {
    if (document.getElementById(id)) return;
    if (document.readyState === 'loading') {
      document.write('<script id="' + id + '" src="' + src + '"><\\/script>');
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = false;
    document.head.appendChild(script);
  }

  scripts.forEach(([id, src]) => load(id, src));
  window.__AN_RESOURCES_PANEL_STATE_VERSION__ = 'F98.4-Z6-CS21A156';
})();
