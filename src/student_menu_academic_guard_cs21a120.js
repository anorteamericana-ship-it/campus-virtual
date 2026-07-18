// F98.4-Z6-CS21A127 · Conserva el menú final y carga recursos académicos del estudiante.
(function(){
  'use strict';
  let attempts=0;

  function loadCss(){
    if(document.getElementById('an-student-books-audios-cs21a126-css'))return;
    const link=document.createElement('link');
    link.id='an-student-books-audios-cs21a126-css';
    link.rel='stylesheet';
    link.href='styles/student_books_audios_cs21a126.css?v=F98.4Z6CS21A127';
    document.head.appendChild(link);
  }

  function loadStudentModules(){
    const loader=window.anLazyCampus;
    if(!loader||typeof loader.loadOne!=='function'){
      window.setTimeout(loadStudentModules,40);
      return;
    }
    loadCss();
    loader.loadOne('src/student_books_proxy_cs21a126.jsx?v=F98.4Z6CS21A127')
      .then(()=>loader.loadOne('src/student_content_access_cs21a125.jsx?v=F98.4Z6CS21A127'))
      .then(()=>loader.loadOne('src/student_tasks_menu_cs21a126.js?v=F98.4Z6CS21A127'))
      .then(()=>loader.loadOne('src/student_calendar_cleanup_cs21a126.js?v=F98.4Z6CS21A127'))
      .catch(error=>console.error('CS21A127',error));
  }

  function markFinalSidebar(){
    const Current=window.Sidebar;
    const installed=!!window.CS21A120_STUDENT_MENU;
    if(installed&&typeof Current==='function'){
      Current.__cs21a65UnifiedResources=true;
      Current.__cs21a59AdminResources=true;
      Current.__cs21a60SuperResources=true;
      Current.__cs21a69ActiveState=true;
      Current.__cs21a120StudentMenu=true;
      window.CS21A120_STUDENT_MENU_GUARD='F98.4-Z6-CS21A127';
      loadStudentModules();
      return;
    }
    attempts+=1;
    if(attempts<240)window.setTimeout(markFinalSidebar,25);
  }

  markFinalSidebar();
})();
