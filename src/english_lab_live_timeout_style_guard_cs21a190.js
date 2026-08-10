// F98.4-Z6-CS21A190 · Memory Match timeout + style sync guard.
// Garantiza que profesor y estudiantes rendericen el MISMO tablero visual:
// CSS base CS21A173 + CSS clásico CS21A189, con cache epoch CS21A190.
(function installEnglishLabTimeoutStyleGuardCS21A190(global){
  'use strict';
  if(!global || global.__ENGLISH_LAB_TIMEOUT_STYLE_GUARD_CS21A190__) return;

  const VERSION='F98.4-Z6-CS21A190';
  const BASE_STYLE_ID='english-lab-memory-match-base-cs21a190';
  const CLASSIC_STYLE_ID='english-lab-memory-match-classic-cs21a190';
  const BASE_STYLE_HREF='/styles/english_lab_memory_match_cs21a173.css?v=CS21A190';
  const CLASSIC_STYLE_HREF='/styles/english_lab_memory_match_classic_sync_cs21a189.css?v=CS21A190';

  function stylePath(doc,href){
    try { return new global.URL(href,doc.baseURI || global.location?.href || '/').pathname; }
    catch(_) { return String(href || '').split('?')[0].replace(/^\.?\//,'/'); }
  }

  function findLinkByPath(doc,href){
    const target=stylePath(doc,href);
    return Array.from(doc.querySelectorAll('link[rel~="stylesheet"][href]'))
      .find(link=>stylePath(doc,link.getAttribute('href'))===target) || null;
  }

  function ensureLink(id,href){
    const doc=global.document;
    if(!doc || !doc.head) return false;
    let link=doc.getElementById(id);
    if(!link){
      link=findLinkByPath(doc,href);
      if(link) link.id=id;
    }
    if(!link){
      link=doc.createElement('link');
      link.id=id;
      link.rel='stylesheet';
      link.setAttribute('href',href);
      doc.head.appendChild(link);
    }
    // Preserve the active package epoch when the same stylesheet was preloaded.
    // The CS21A190 URL remains only as a backward-compatible fallback.
    if(stylePath(doc,link.getAttribute('href'))!==stylePath(doc,href)) link.setAttribute('href',href);
    return true;
  }

  function ensureStyles(){
    const base=ensureLink(BASE_STYLE_ID,BASE_STYLE_HREF);
    const classic=ensureLink(CLASSIC_STYLE_ID,CLASSIC_STYLE_HREF);
    return !!(base && classic);
  }

  function markRuntime(){
    if(typeof global.MemoryMatchGameCS21A173==='function'){
      global.MemoryMatchGameCS21A173.__cs21a190TimeoutStyleSync=true;
    }
    if(global.EnglishLabMemoryMatchLiveCS21A174 && typeof global.EnglishLabMemoryMatchLiveCS21A174==='object'){
      try { global.EnglishLabMemoryMatchLiveCS21A174.__cs21a190TimeoutStyleSync=true; } catch(_) {}
    }
  }

  function install(){
    const styled=ensureStyles();
    markRuntime();
    return styled;
  }

  const api=Object.freeze({
    version:VERSION,
    cacheEpoch:'CS21A190',
    baseStyleHref:BASE_STYLE_HREF,
    classicStyleHref:CLASSIC_STYLE_HREF,
    ensureStyles,
    install,
    stylesReady:()=>!!(
      global.document &&
      global.document.getElementById(BASE_STYLE_ID) &&
      global.document.getElementById(CLASSIC_STYLE_ID)
    ),
  });

  global.__ENGLISH_LAB_TIMEOUT_STYLE_GUARD_CS21A190__=api;
  install();
  let attempts=0;
  const timer=global.setInterval(()=>{
    attempts+=1;
    install();
    if((api.stylesReady() && typeof global.MemoryMatchGameCS21A173==='function') || attempts>300) global.clearInterval(timer);
  },50);
  if(global.addEventListener){
    global.addEventListener('an:lazy-module-loaded',install);
    global.addEventListener('DOMContentLoaded',install,{once:true});
  }
})(window);
