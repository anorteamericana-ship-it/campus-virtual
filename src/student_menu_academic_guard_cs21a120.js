// F98.4-Z6-CS21A130 · Conserva el menú final y carga recursos académicos del estudiante.
(function(){
  'use strict';
  let attempts=0;

  function appendCss(id,href){
    if(document.getElementById(id))return;
    const link=document.createElement('link');
    link.id=id;
    link.rel='stylesheet';
    link.href=href;
    document.head.appendChild(link);
  }

  function loadCss(){
    appendCss('an-student-books-audios-cs21a126-css','styles/student_books_audios_cs21a126.css?v=F98.4Z6CS21A127');
    appendCss('an-student-planeamiento-cs21a129-css','styles/student_planeamiento_pdfs_cs21a129.css?v=F98.4Z6CS21A129');
  }

  function loadStudentModules(){
    const loader=window.anLazyCampus;
    if(!loader||typeof loader.loadOne!=='function'){
      window.setTimeout(loadStudentModules,40);
      return;
    }
    loadCss();
    loader.loadOne('src/student_books_proxy_cs21a126.jsx?v=F98.4Z6CS21A127')
      .then(()=>loader.loadOne('src/student_planeamiento_pdf_catalog_cs21a129.js?v=F98.4Z6CS21A130'))
      .then(()=>loader.loadOne('src/student_content_access_cs21a125.jsx?v=F98.4Z6CS21A129'))
      .then(()=>loader.loadOne('src/student_tasks_menu_cs21a126.js?v=F98.4Z6CS21A127'))
      .then(()=>loader.loadOne('src/student_calendar_cleanup_cs21a126.js?v=F98.4Z6CS21A127'))
      .catch(error=>console.error('CS21A130',error));
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
      window.CS21A120_STUDENT_MENU_GUARD='F98.4-Z6-CS21A130';
      loadStudentModules();
      return;
    }
    attempts+=1;
    if(attempts<240)window.setTimeout(markFinalSidebar,25);
  }

  markFinalSidebar();
})();
