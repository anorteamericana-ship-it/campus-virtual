// F98.4-Z6-CS21A126 · Tareas sale del Calendario y vive debajo de Evaluaciones.
(function(){
  'use strict';
  const VERSION='F98.4-Z6-CS21A126';
  const ROUTE='tareas_estudiante';
  let queued=false;

  function ensureCss(){
    if(document.getElementById('an-student-tasks-cs21a126-css'))return;
    const link=document.createElement('link');
    link.id='an-student-tasks-cs21a126-css';
    link.rel='stylesheet';
    link.href='styles/student_tasks_menu_cs21a126.css?v=F98.4Z6CS21A126';
    document.head.appendChild(link);
  }

  function close(push=false){
    document.body.classList.remove('an-student-tasks-open');
    document.getElementById('an-student-tasks-host-cs21a126')?.remove();
    document.querySelector('[data-nav-id="tareas_estudiante"]')?.classList.remove('active');
    if(push&&location.hash==='#'+ROUTE){try{history.replaceState({},'','#dashboard');}catch(_){}}
  }

  function host(){
    let node=document.getElementById('an-student-tasks-host-cs21a126');
    if(node)return node;
    const app=document.querySelector('.app');
    if(!app)return null;
    node=document.createElement('main');
    node.id='an-student-tasks-host-cs21a126';
    node.className='main an-student-tasks-host-cs21a126';
    const current=app.querySelector(':scope > .main:not(.an-student-tasks-host-cs21a126)');
    if(current)current.insertAdjacentElement('afterend',node);else app.appendChild(node);
    return node;
  }

  function open(push=true){
    ensureCss();
    try{window.StudentContentAccessCS21A125?.close?.(true);}catch(_){}
    try{window.CS21A120_STUDENT_MENU?.close?.(true);}catch(_){}
    const node=host();
    if(!node)return;
    document.body.classList.add('an-student-tasks-open');
    document.body.classList.remove('an-mobile-nav-open');
    const aside=document.querySelector('.student-sb');
    aside?.querySelectorAll('.sb-item.active').forEach(item=>item.classList.remove('active'));
    aside?.querySelector('[data-nav-id="tareas_estudiante"]')?.classList.add('active');
    node.innerHTML='<section class="st126-page" data-screen-label="Estudiante · Tareas"><div class="st126-header"><span>Gestión Académica</span><h1>Tareas</h1><p>Este espacio queda separado del Calendario académico y será la ruta oficial para publicación, entrega y revisión de tareas.</p></div><section class="st126-card"><div class="st126-badge">Próximamente</div><h2>Flujo académico de tareas</h2><p>No se muestran tareas ficticias mientras no exista el flujo completo de publicación, entrega y revisión.</p><div class="st126-grid"><article><b>1</b><span>Grupo, nivel y lección vinculados</span></article><article><b>2</b><span>Fecha de publicación y fecha límite</span></article><article><b>3</b><span>Instrucciones y archivos adjuntos</span></article><article><b>4</b><span>Entrega del estudiante</span></article><article><b>5</b><span>Revisión docente y retroalimentación</span></article><article><b>6</b><span>Estados: pendiente, entregada, atrasada y revisada</span></article></div></section></section>';
    if(push&&location.hash!=='#'+ROUTE){try{history.pushState({studentTasks:true},'','#'+ROUTE);}catch(_){location.hash=ROUTE;}}
    try{window.scrollTo({top:0,left:0,behavior:'auto'});}catch(_){window.scrollTo(0,0);}
  }

  function buildButton(){
    const button=document.createElement('button');
    button.type='button';
    button.dataset.navId=ROUTE;
    button.dataset.cs21a126='student-tasks';
    button.className='sb-item teacher-sb-item student-sb-item';
    button.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sb-icon" aria-hidden="true"><path d="M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"></path></svg><span class="sb-label" style="font-size:13px;font-weight:850">Tareas</span>';
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();open(true);});
    return button;
  }

  function installMenu(){
    const aside=document.querySelector('aside.student-sb');
    const evaluations=aside?.querySelector('[data-nav-id="evaluaciones"]');
    if(!aside||!evaluations)return;
    let button=aside.querySelector('[data-nav-id="tareas_estudiante"]');
    if(!button)button=buildButton();
    if(evaluations.nextElementSibling!==button)evaluations.insertAdjacentElement('afterend',button);
    if(location.hash==='#'+ROUTE&&!document.body.classList.contains('an-student-tasks-open'))open(false);
  }

  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;installMenu();});}

  document.addEventListener('click',event=>{
    const item=event.target?.closest?.('.student-sb [data-nav-id]');
    if(!item||item.dataset.navId===ROUTE)return;
    if(document.body.classList.contains('an-student-tasks-open'))close(false);
  },true);
  window.addEventListener('popstate',()=>{if(location.hash==='#'+ROUTE)open(false);else if(document.body.classList.contains('an-student-tasks-open'))close(false);});
  window.addEventListener('an:session-changed',()=>close(false));
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
  ensureCss();queue();
  window.StudentTasksMenuCS21A126={version:VERSION,open,close};
})();
