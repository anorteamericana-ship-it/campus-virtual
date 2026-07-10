// F98.4-Z6-CS21A27B · Panel Maestro: gráficos de Cobranza colapsables; Seguimiento inmediato siempre visible.
(function(){
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A27B';
  const TITLE = 'cobros aplicados, cartera activa y morosidad';
  const STORAGE_KEY = 'an.master.cobranza.expanded.cs21a27';
  const TARGET_WORDS = [
    'grupos',
    'control financiero',
    'recencia de pago',
    'cartera',
    'cobranza aplicada',
    'cobrado 2026'
  ];

  function norm(value){
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function findTitle(){
    const nodes = document.querySelectorAll('h1,h2,h3,h4,p,strong,span');
    for(const node of nodes){
      if(norm(node.textContent).includes(TITLE)) return node;
    }
    return null;
  }

  function directChildContaining(parent, node){
    let current = node;
    while(current && current.parentElement !== parent) current = current.parentElement;
    return current && current.parentElement === parent ? current : null;
  }

  function scoreNode(node){
    const text = norm(node?.textContent);
    let score = TARGET_WORDS.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
    score += Math.min(6, node?.querySelectorAll?.('.master-card,.master-kpi,section,article,canvas,svg')?.length || 0);
    return score;
  }

  function resolveScope(title){
    let parent = title?.parentElement;
    let best = null;
    let bestScore = -1;

    for(let depth = 0; parent && parent !== document.body && depth < 9; depth++, parent = parent.parentElement){
      const anchor = directChildContaining(parent, title);
      if(!anchor) continue;
      const siblings = Array.from(parent.children).filter(child => child !== anchor);
      if(!siblings.length) continue;
      const score = siblings.reduce((sum, child) => sum + scoreNode(child), 0);
      if(score > bestScore){
        bestScore = score;
        best = { root: parent, anchor, content: siblings };
      }
      if(score >= 8) break;
    }

    return best;
  }

  function findSeguimientoSection(root){
    const byClass = root?.querySelector?.('.master-conape-month-card');
    if(byClass) return byClass;
    const sections = root?.querySelectorAll?.('section,article,.master-card') || [];
    for(const node of sections){
      const text = norm(node.textContent);
      if(text.includes('seguimiento inmediato') && text.includes('movimientos conape')) return node;
    }
    return null;
  }

  function ensureStyle(){
    if(document.getElementById('an-master-cobranza-collapse-style')) return;
    const style = document.createElement('style');
    style.id = 'an-master-cobranza-collapse-style';
    style.textContent = `
      .an-master-cobranza-toggle{
        display:inline-flex;align-items:center;justify-content:center;gap:8px;
        margin-left:auto;padding:9px 13px;border:1px solid rgba(0,47,108,.24);
        border-radius:10px;background:#fff;color:#002f6c;font:800 11px/1.1 Poppins,sans-serif;
        cursor:pointer;white-space:nowrap;box-shadow:0 2px 8px rgba(0,31,71,.06);
        transition:background .16s ease,border-color .16s ease,transform .16s ease;
      }
      .an-master-cobranza-toggle:hover{background:#f3f7fc;border-color:#002f6c;transform:translateY(-1px)}
      .an-master-cobranza-toggle:focus-visible{outline:3px solid rgba(0,47,108,.22);outline-offset:2px}
      .an-master-cobranza-toggle .an-arrow{font-size:13px;line-height:1}
      .an-master-cobranza-anchor{display:flex!important;align-items:flex-start!important;gap:12px!important;flex-wrap:wrap!important}
      .an-master-cobranza-anchor > div:first-child{min-width:0;flex:1 1 420px}
      .an-master-cobranza-anchor > .an-master-cobranza-toggle{margin-top:2px}
      .an-master-cobranza-hidden{display:none!important}
      .an-master-cobranza-collapsed-note{
        width:100%;margin-top:4px;padding:10px 13px;border:1px dashed #d8d0c3;border-radius:10px;
        background:#faf7f1;color:#766b5e;font:600 11px/1.45 Poppins,sans-serif;
      }
      @media(max-width:760px){
        .an-master-cobranza-toggle{width:100%;margin-left:0}
      }
    `;
    document.head.appendChild(style);
  }

  function readExpanded(){
    try { return sessionStorage.getItem(STORAGE_KEY) === '1'; }
    catch(_) { return false; }
  }

  function saveExpanded(value){
    try { sessionStorage.setItem(STORAGE_KEY, value ? '1' : '0'); }
    catch(_) {}
  }

  function apply(){
    const title = findTitle();
    if(!title) return false;

    const resolved = resolveScope(title);
    if(!resolved || !resolved.content.length) return false;

    const { root, anchor, content } = resolved;
    const seguimientoSection = findSeguimientoSection(root);
    const seguimientoNode = seguimientoSection ? directChildContaining(root, seguimientoSection) : null;

    // No se aplica el colapsado hasta localizar Seguimiento inmediato. Así nunca
    // puede quedar oculto por una carga diferida o por el reemplazo del componente.
    if(!seguimientoNode) return false;

    const collapsibleContent = content.filter(node => node !== seguimientoNode);
    if(!collapsibleContent.length) return false;

    const liveButton = anchor.querySelector('.an-master-cobranza-toggle');
    if(root.dataset.anCobranzaCollapseVersion === VERSION && liveButton?.isConnected) return true;

    root.removeAttribute('data-an-cobranza-collapse-version');
    anchor.querySelectorAll('.an-master-cobranza-toggle,.an-master-cobranza-collapsed-note').forEach(node => node.remove());

    // Limpia cualquier ocultamiento heredado de CS21A27A sobre Seguimiento inmediato.
    seguimientoNode.classList.remove('an-master-cobranza-hidden');
    seguimientoNode.style.display = seguimientoNode.dataset.anCobranzaOriginalDisplay || '';

    ensureStyle();
    root.dataset.anCobranzaCollapseVersion = VERSION;
    anchor.classList.add('an-master-cobranza-anchor');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'an-master-cobranza-toggle';
    button.setAttribute('aria-controls', 'an-master-cobranza-content');

    const note = document.createElement('div');
    note.className = 'an-master-cobranza-collapsed-note';
    note.textContent = 'Los gráficos financieros están ocultos. Seguimiento inmediato permanece visible abajo.';

    const contentId = 'an-master-cobranza-content';
    collapsibleContent.forEach((node, index) => {
      node.dataset.anCobranzaOriginalDisplay = node.style.display || '';
      if(index === 0) node.id = node.id || contentId;
    });

    let expanded = readExpanded();

    function render(){
      collapsibleContent.forEach(node => {
        if(expanded){
          node.classList.remove('an-master-cobranza-hidden');
          node.style.display = node.dataset.anCobranzaOriginalDisplay || '';
        }else{
          node.classList.add('an-master-cobranza-hidden');
        }
      });

      // Protección permanente: esta sección nunca participa del colapsado.
      seguimientoNode.classList.remove('an-master-cobranza-hidden');
      seguimientoNode.style.display = seguimientoNode.dataset.anCobranzaOriginalDisplay || '';

      button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      button.innerHTML = expanded
        ? '<span class="an-arrow">▲</span><span>Ocultar gráficos</span>'
        : '<span class="an-arrow">▼</span><span>Mostrar gráficos</span>';
      if(expanded){
        note.remove();
      }else if(!note.isConnected){
        anchor.appendChild(note);
      }
    }

    button.addEventListener('click', function(){
      expanded = !expanded;
      saveExpanded(expanded);
      render();
    });

    anchor.appendChild(button);
    render();
    return true;
  }

  let scheduled = false;
  function schedule(){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(function(){
      scheduled = false;
      apply();
    });
  }

  window.addEventListener('an:lazy-module-loaded', schedule);
  window.addEventListener('hashchange', schedule);
  new MutationObserver(schedule).observe(document.documentElement, { childList:true, subtree:true });
  setTimeout(schedule, 0);
  setTimeout(schedule, 600);
})();