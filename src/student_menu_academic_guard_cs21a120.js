// F98.4-Z6-CS21A120 · Conserva el menú final frente a wrappers anteriores.
(function(){
  'use strict';
  let attempts = 0;

  function markFinalSidebar(){
    const Current = window.Sidebar;
    const installed = !!window.CS21A120_STUDENT_MENU;

    if (installed && typeof Current === 'function') {
      Current.__cs21a65UnifiedResources = true;
      Current.__cs21a59AdminResources = true;
      Current.__cs21a60SuperResources = true;
      Current.__cs21a69ActiveState = true;
      Current.__cs21a120StudentMenu = true;
      window.CS21A120_STUDENT_MENU_GUARD = 'F98.4-Z6-CS21A120';
      return;
    }

    attempts += 1;
    if (attempts < 240) window.setTimeout(markFinalSidebar, 25);
  }

  markFinalSidebar();
})();
