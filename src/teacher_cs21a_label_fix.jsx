// F98.4-Z6-CS21A7 · Renombre visual de etiquetas docentes
// Frontend-only: no toca Apps Script ni datos; ajusta nombres visibles solicitados.
(function(){
  const VERSION = 'F98.4-Z6-CS21A7';
  const REPLACEMENTS = [
    ['Planeamiento didáctico', 'Planeamiento por lección'],
    ['Planeamientos oficiales por nivel con visor interno y descarga.', 'Planeamientos por lección oficiales con visor interno y descarga.'],
    ['Planeamientos oficiales por nivel', 'Planeamientos por lección oficiales'],
    ['Cronograma del módulo', 'Plan de Estudio'],
    ['Cronogramas institucionales por módulo con visor interno y descarga.', 'Planes de estudio institucionales por nivel con visor interno y descarga.'],
    ['Cronogramas institucionales por módulo', 'Planes de estudio institucionales por nivel']
  ];

  function fixText(value){
    let out = String(value || '');
    REPLACEMENTS.forEach(pair => { out = out.split(pair[0]).join(pair[1]); });
    return out;
  }

  function fixNode(node){
    if (!node || node.nodeType !== 3) return;
    const next = fixText(node.nodeValue);
    if (next !== node.nodeValue) node.nodeValue = next;
  }

  function scan(root){
    const base = root || document.body;
    if (!base || !document.createTreeWalker) return;
    try {
      const walker = document.createTreeWalker(base, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walker.nextNode())) fixNode(node);
    } catch(_) {}
  }

  function run(){ scan(document.body); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  window.addEventListener('an:lazy-module-loaded', () => setTimeout(run, 30));
  window.addEventListener('an:teacher-material-tab', () => setTimeout(run, 30));

  try {
    const obs = new MutationObserver(muts => {
      muts.forEach(m => {
        if (m.type === 'characterData') fixNode(m.target);
        if (m.addedNodes) Array.from(m.addedNodes).forEach(n => scan(n));
      });
    });
    obs.observe(document.documentElement, { childList:true, subtree:true, characterData:true });
  } catch(_) {}

  window.__AN_TEACHER_LABEL_FIX_VERSION__ = VERSION;
})();
