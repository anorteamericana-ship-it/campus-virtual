// F98.4-Z6-CS21A125 · Conserva el menú final y carga acceso académico acumulativo.
(function(){
  'use strict';
  let attempts = 0;

  function loadContentAccess(){
    if (window.StudentContentAccessCS21A125) return;
    if (window.anLazyCampus && typeof window.anLazyCampus.loadOne === 'function') {
      window.anLazyCampus.loadOne('src/student_content_access_cs21a125.jsx?v=F98.4Z6CS21A125')
        .catch(function(error){ console.error('CS21A125', error); });
      return;
    }
    window.setTimeout(loadContentAccess, 40);
  }

  function markFinalSidebar(){
    const Current = window.Sidebar;
    const installed = !!window.CS21A120_STUDENT_MENU;

    if (installed && typeof Current === 'function') {
      Current.__cs21a65UnifiedResources = true;
      Current.__cs21a59AdminResources = true;
      Current.__cs21a60SuperResources = true;
      Current.__cs21a69ActiveState = true;
      Current.__cs21a120StudentMenu = true;
      window.CS21A120_STUDENT_MENU_GUARD = 'F98.4-Z6-CS21A125';
      loadContentAccess();
      return;
    }

    attempts += 1;
    if (attempts < 240) window.setTimeout(markFinalSidebar, 25);
  }

  markFinalSidebar();
})();
