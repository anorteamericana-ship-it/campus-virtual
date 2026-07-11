// F98.4-Z6-CS21A31 · Panel Maestro abre Cobranza y cartera como primera sección.
(function(){
  'use strict';

  const BUILD='F98.4-Z6-CS21A31';
  const initializedRoots=new WeakSet();
  let scheduled=false;

  function normalize(value){
    return String(value||'')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/\s+/g,' ')
      .trim()
      .toLowerCase();
  }

  function ensureStyle(){
    if(document.getElementById('an-master-cobranza-first-style'))return;
    const style=document.createElement('style');
    style.id='an-master-cobranza-first-style';
    style.textContent='.master-section-nav>.an-master-cobranza-first{order:-999!important;}';
    document.head.appendChild(style);
  }

  function applyToRoot(root){
    const nav=root.querySelector('.master-section-nav');
    if(!nav)return false;
    const buttons=Array.from(nav.querySelectorAll(':scope > button'));
    const cobranza=buttons.find(button=>normalize(button.textContent).includes('cobranza y cartera'));
    if(!cobranza)return false;

    ensureStyle();
    buttons.forEach(button=>button.classList.remove('an-master-cobranza-first'));
    cobranza.classList.add('an-master-cobranza-first');
    cobranza.dataset.anMasterOrderBuild=BUILD;

    if(!initializedRoots.has(root)){
      initializedRoots.add(root);
      root.dataset.anMasterDefaultSection=BUILD;
      if(!cobranza.classList.contains('active'))cobranza.click();
    }
    return true;
  }

  function apply(){
    document.querySelectorAll('.master-admin').forEach(applyToRoot);
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      apply();
    });
  }

  window.addEventListener('an:lazy-module-loaded',schedule);
  window.addEventListener('hashchange',schedule);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.__AN_MASTER_COBRANZA_FIRST__={build:BUILD,apply:schedule};
  setTimeout(schedule,0);
  setTimeout(schedule,600);
})();
