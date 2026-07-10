// F98.4-Z6-CS21A8 · Orden visual Planificación Académica docente
// Frontend-only: reordena Plan de Estudio antes de Planeamiento por lección, sin tocar Apps Script.
(function(){
  const VERSION = 'F98.4-Z6-CS21A8';

  function norm(s){
    return String(s || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function labelOf(btn){
    const lbl = btn && btn.querySelector ? btn.querySelector('.sb-label') : null;
    return norm(lbl ? lbl.textContent : (btn ? btn.textContent : ''));
  }

  function rank(btn){
    const t = labelOf(btn);
    if (t.includes('syllabus')) return 1;
    if (t.includes('plan de estudio') || t.includes('cronograma del modulo')) return 2;
    if (t.includes('planeamiento por leccion') || t.includes('planeamiento didactico')) return 3;
    if (t.includes('cronograma general')) return 4;
    return 99;
  }

  function fixPlanningOrder(){
    const sections = Array.from(document.querySelectorAll('.teacher-sb-section, .sb-section'));
    const section = sections.find(el => norm(el.textContent).includes('planificacion academica'));
    if (!section || !section.parentNode) return;

    const parent = section.parentNode;
    const items = [];
    let node = section.nextElementSibling;
    while (node && !(node.classList && node.classList.contains('sb-section')) && !(node.classList && node.classList.contains('teacher-sb-section'))) {
      if (node.classList && node.classList.contains('sb-item')) items.push(node);
      node = node.nextElementSibling;
    }
    if (items.length < 3) return;

    const sorted = items.slice().sort((a,b)=>rank(a)-rank(b));
    const changed = sorted.some((el,i)=>el !== items[i]);
    if (!changed) return;

    sorted.forEach(el => parent.insertBefore(el, node || null));
  }

  function run(){
    try { fixPlanningOrder(); } catch(_) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  window.addEventListener('an:lazy-module-loaded', () => setTimeout(run, 30));
  window.addEventListener('an:teacher-material-tab', () => setTimeout(run, 30));
  window.addEventListener('resize', () => setTimeout(run, 30));

  try {
    const obs = new MutationObserver(() => run());
    obs.observe(document.documentElement, { childList:true, subtree:true, characterData:true });
  } catch(_) {}

  window.__AN_TEACHER_ORDER_FIX_VERSION__ = VERSION;
})();
