// F98.4-Z6-CS21A126 · Calendario académico sin Materiales ni Tareas.
(function(){
  'use strict';
  const VERSION='F98.4-Z6-CS21A126';
  let queued=false;

  function text(node){return String(node&&node.textContent||'').replace(/\s+/g,' ').trim();}

  function patch(){
    const page=document.querySelector('.student-page-course');
    if(!page)return;

    const tabs=page.querySelector('.student-tabs');
    const panel=page.querySelector('[role="tabpanel"]');
    const buttons=tabs?Array.from(tabs.querySelectorAll('button')):[];
    const cronograma=buttons.find(button=>/^cronograma$/i.test(text(button)));
    const active=buttons.find(button=>button.getAttribute('aria-pressed')==='true'||button.classList.contains('active'));

    if(active&&active!==cronograma&&cronograma)cronograma.click();
    if(tabs)tabs.remove();

    const header=page.querySelector('.student-section-header');
    const title=header&&header.querySelector('.student-section-title,h1');
    if(title)title.textContent='Calendario académico';
    page.setAttribute('data-screen-label','Estudiante · Calendario académico');
    page.classList.add('student-page-calendar-cs21a126');

    if(panel){
      Array.from(panel.children).forEach(child=>{
        const label=text(child).toLowerCase();
        const isLegacyMaterial=/libros de texto|biblioteca del curso|materiales no disponibles/.test(label);
        const isLegacyTasks=/tareas · próximamente|flujo completo de publicación/.test(label);
        if(isLegacyMaterial||isLegacyTasks)child.remove();
      });
    }

    window.CS21A126_STUDENT_CALENDAR_CLEANUP=VERSION;
  }

  function queue(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;patch();});
  }

  window.addEventListener('an:lazy-module-loaded',queue);
  window.addEventListener('an:session-changed',queue);
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});
  else queue();
})();
