// F98.4-Z6-CS21A113 · Integra Resumen Académico al menú sin alterar el backend.
(function(){
  'use strict';
  const VERSION='F98.4-Z6-CS21A113';
  const ROUTE='resumen_academico';
  const COMPONENT_SRC='src/student_academic_summary_cs21a113.jsx?v=F98.4Z6CS21A113';
  const CSS_SRC='styles/student_academic_summary_cs21a113.css?v=F98.4Z6CS21A113';
  let root=null;
  let opening=false;
  let observerQueued=false;

  function ensureCss(){
    if(document.getElementById('an-student-academic-summary-cs21a113-css'))return;
    const link=document.createElement('link');
    link.id='an-student-academic-summary-cs21a113-css';link.rel='stylesheet';link.href=CSS_SRC;
    document.head.appendChild(link);
  }
  function studentSidebar(){return document.querySelector('.student-sb');}
  function isEligible(){
    const sb=studentSidebar();
    return !!(sb&&sb.querySelector('[data-nav-id="mi_curso"]'));
  }
  function iconSvg(){
    return '<svg class="sb-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19V3"/><path d="M2 19h22"/></svg>';
  }
  function ensureMenu(){
    const sb=studentSidebar();if(!sb||!isEligible())return null;
    let btn=sb.querySelector('[data-nav-id="'+ROUTE+'"]');
    if(btn)return btn;
    btn=document.createElement('button');btn.type='button';btn.className='sb-item student-sb-item';btn.dataset.navId=ROUTE;
    btn.innerHTML=iconSvg()+'<span class="sb-label">Resumen Académico</span>';
    btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();openSummary(true);});
    const dashboard=sb.querySelector('[data-nav-id="dashboard"]');
    if(dashboard&&dashboard.parentNode)dashboard.parentNode.insertBefore(btn,dashboard.nextSibling);else sb.appendChild(btn);
    if(document.body.classList.contains('an-academic-summary-open'))markActive();
    return btn;
  }
  function loadComponent(){
    if(typeof window.StudentAcademicSummaryView==='function')return Promise.resolve(true);
    if(window.anLazyCampus&&typeof window.anLazyCampus.loadOne==='function')return window.anLazyCampus.loadOne(COMPONENT_SRC).then(function(){return typeof window.StudentAcademicSummaryView==='function';});
    return fetch(COMPONENT_SRC,{cache:'no-cache'}).then(function(r){if(!r.ok)throw new Error('No se pudo cargar Resumen Académico.');return r.text();}).then(function(code){
      if(!window.Babel||typeof window.Babel.transform!=='function')throw new Error('Babel no está disponible.');
      const js=window.Babel.transform(code,{presets:['react'],plugins:['transform-block-scoping']}).code;
      const s=document.createElement('script');s.type='text/javascript';s.text=js+'\n//# sourceURL='+COMPONENT_SRC;document.head.appendChild(s);
      return typeof window.StudentAcademicSummaryView==='function';
    });
  }
  function host(){
    let node=document.getElementById('an-academic-summary-host');
    if(node)return node;
    const app=document.querySelector('.app');if(!app)return null;
    node=document.createElement('main');node.id='an-academic-summary-host';node.className='main an-academic-summary-host';node.setAttribute('aria-live','polite');
    const current=app.querySelector(':scope > .main:not(.an-academic-summary-host)');
    if(current&&current.nextSibling)app.insertBefore(node,current.nextSibling);else app.appendChild(node);
    return node;
  }
  function markActive(){
    const sb=studentSidebar();if(!sb)return;
    sb.querySelectorAll('.sb-item.active').forEach(function(item){item.classList.remove('active');});
    const btn=ensureMenu();if(btn)btn.classList.add('active');
  }
  function navigateFromSummary(target,opts){
    closeSummary({keepHistory:true});
    const sb=studentSidebar();
    const normalized=target==='mi_curso'?'mi_curso':target==='evaluaciones'?'evaluaciones':target;
    const btn=sb&&sb.querySelector('[data-nav-id="'+normalized+'"]');
    if(btn){window.setTimeout(function(){btn.click();},0);return;}
    try{window.location.hash='#'+normalized;}catch(_){}
  }
  function openSummary(pushHistory){
    if(opening||!isEligible())return;
    opening=true;ensureCss();ensureMenu();
    loadComponent().then(function(ok){
      if(!ok)throw new Error('El componente no se publicó correctamente.');
      const node=host();if(!node)throw new Error('No se encontró el contenedor del Campus.');
      document.body.classList.add('an-academic-summary-open');markActive();
      if(!root)root=ReactDOM.createRoot(node);
      root.render(React.createElement(window.StudentAcademicSummaryView,{onNavigate:navigateFromSummary}));
      if(pushHistory&&location.hash!=='#'+ROUTE){try{history.pushState({anAcademicSummary:true},'', '#'+ROUTE);}catch(_){location.hash=ROUTE;}}
      window.scrollTo({top:0,behavior:'auto'});
      try{window.dispatchEvent(new CustomEvent('an:academic-summary-open',{detail:{version:VERSION}}));}catch(_){}
    }).catch(function(error){
      console.error('CS21A113',error);
      const node=host();if(node)node.innerHTML='<div style="max-width:680px;margin:70px auto;padding:28px;background:#fff;border:1px solid #e5e0d8;border-radius:18px;text-align:center;font-family:system-ui"><strong style="color:#001e47">No se pudo abrir Resumen Académico</strong><p style="font-size:13px;color:#6b7280">'+String(error&&error.message||error)+'</p></div>';
      document.body.classList.add('an-academic-summary-open');markActive();
    }).finally(function(){opening=false;});
  }
  function closeSummary(options){
    options=options||{};
    document.body.classList.remove('an-academic-summary-open');
    if(root){try{root.unmount();}catch(_){}root=null;}
    const node=document.getElementById('an-academic-summary-host');if(node)node.remove();
    if(!options.keepHistory&&location.hash==='#'+ROUTE){try{history.replaceState({},'', '#dashboard');}catch(_){} }
  }
  function onAnySidebarClick(ev){
    const item=ev.target&&ev.target.closest?ev.target.closest('.student-sb .sb-item'):null;
    if(!item)return;
    if(item.dataset.navId===ROUTE)return;
    if(document.body.classList.contains('an-academic-summary-open'))closeSummary({keepHistory:true});
  }
  function ensure(){ensureCss();ensureMenu();if(location.hash==='#'+ROUTE&&!document.body.classList.contains('an-academic-summary-open'))openSummary(false);}
  function queueEnsure(){if(observerQueued)return;observerQueued=true;requestAnimationFrame(function(){observerQueued=false;ensure();});}
  document.addEventListener('click',onAnySidebarClick,true);
  window.addEventListener('popstate',function(){if(location.hash==='#'+ROUTE)openSummary(false);else if(document.body.classList.contains('an-academic-summary-open'))closeSummary({keepHistory:true});});
  window.addEventListener('an:session-changed',function(){closeSummary({keepHistory:true});queueEnsure();});
  const observer=new MutationObserver(queueEnsure);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-role']});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
  window.CS21A113_ACADEMIC_SUMMARY_RUNTIME={version:VERSION,open:function(){openSummary(true);},close:closeSummary,refresh:ensure};
})();
