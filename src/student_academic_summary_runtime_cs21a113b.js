// F98.4-Z6-CS21A113B · Integra Resumen Académico al menú del estudiante.
(function(){
  'use strict';
  const ROUTE='resumen_academico',CSS='styles/student_academic_summary_cs21a113.css?v=F98.4Z6CS21A113';
  const DEPS=['src/student_portal.jsx?v=F98.4Z6CS21A113','src/student_academic_summary_core_cs21a113.js?v=F98.4Z6CS21A113','src/student_academic_summary_dom_cs21a113.js?v=F98.4Z6CS21A113'];
  let opening=false,cleanup=null,queued=false;
  const sidebar=()=>document.querySelector('.student-sb');
  const eligible=()=>!!sidebar()?.querySelector('[data-nav-id="mi_curso"]');
  function ensureCss(){if(document.getElementById('an-student-academic-summary-cs21a113-css'))return;const l=document.createElement('link');l.id='an-student-academic-summary-cs21a113-css';l.rel='stylesheet';l.href=CSS;document.head.appendChild(l);}
  function ensureMenu(){const sb=sidebar();if(!sb||!eligible())return null;let b=sb.querySelector(`[data-nav-id="${ROUTE}"]`);if(b)return b;b=document.createElement('button');b.type='button';b.className='sb-item student-sb-item';b.dataset.navId=ROUTE;b.innerHTML='<svg class="sb-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19V3"/><path d="M2 19h22"/></svg><span class="sb-label">Resumen Académico</span>';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open(true);});const home=sb.querySelector('[data-nav-id="dashboard"]');home?.parentNode?.insertBefore(b,home.nextSibling);return b;}
  function host(){let n=document.getElementById('an-academic-summary-host');if(n)return n;const app=document.querySelector('.app');if(!app)return null;n=document.createElement('main');n.id='an-academic-summary-host';n.className='main an-academic-summary-host';const current=app.querySelector(':scope > .main:not(.an-academic-summary-host)');current?.after(n);if(!n.parentNode)app.appendChild(n);return n;}
  function mark(){const sb=sidebar();sb?.querySelectorAll('.sb-item.active').forEach(x=>x.classList.remove('active'));ensureMenu()?.classList.add('active');}
  function loadDeps(){if(typeof window.mountStudentAcademicSummaryCS21A113==='function')return Promise.resolve();if(!window.anLazyCampus?.loadMany)throw new Error('El cargador del Campus no está disponible.');return window.anLazyCampus.loadMany(DEPS).then(()=>{if(typeof window.mountStudentAcademicSummaryCS21A113!=='function')throw new Error('La vista no terminó de cargar.');});}
  function navigate(target){close(true);const b=sidebar()?.querySelector(`[data-nav-id="${target}"]`);if(b)setTimeout(()=>b.click(),0);else location.hash='#'+target;}
  function open(push){if(opening||!eligible())return;opening=true;ensureCss();ensureMenu();loadDeps().then(()=>{const n=host();if(!n)throw new Error('No se encontró el contenedor principal.');document.body.classList.add('an-academic-summary-open');mark();cleanup=window.mountStudentAcademicSummaryCS21A113(n,{onNavigate:navigate});if(push&&location.hash!==`#${ROUTE}`)history.pushState({anAcademicSummary:true},'',`#${ROUTE}`);window.scrollTo(0,0);}).catch(err=>{const n=host();if(n)n.innerHTML='<div class="as113-error"><h1>No se pudo abrir Resumen Académico</h1><p>'+String(err.message||err)+'</p></div>';document.body.classList.add('an-academic-summary-open');mark();}).finally(()=>{opening=false;});}
  function close(keepHistory){document.body.classList.remove('an-academic-summary-open');try{cleanup?.();}catch(_){}cleanup=null;document.getElementById('an-academic-summary-host')?.remove();if(!keepHistory&&location.hash===`#${ROUTE}`)history.replaceState({},'','#dashboard');}
  function ensure(){ensureCss();ensureMenu();if(location.hash===`#${ROUTE}`&&!document.body.classList.contains('an-academic-summary-open'))open(false);}
  document.addEventListener('click',e=>{const item=e.target.closest?.('.student-sb .sb-item');if(item&&item.dataset.navId!==ROUTE&&document.body.classList.contains('an-academic-summary-open'))close(true);},true);
  window.addEventListener('popstate',()=>location.hash===`#${ROUTE}`?open(false):close(true));window.addEventListener('an:session-changed',()=>{close(true);queue();});
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;ensure();});}
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-role']});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
  window.CS21A113_ACADEMIC_SUMMARY_RUNTIME={version:'F98.4-Z6-CS21A113B',open:()=>open(true),close:()=>close(false),refresh:ensure};
})();

// F98.4-Z6-CS21A114 · carga la corrección del importador BCR.
(function(){
  'use strict';
  if(document.getElementById('an-importador-banco-loader-cs21a114'))return;
  const script=document.createElement('script');
  script.id='an-importador-banco-loader-cs21a114';
  script.src='src/importador_banco_loader_cs21a114.js?v=F98.4Z6CS21A114';
  script.defer=true;
  document.head.appendChild(script);
})();
