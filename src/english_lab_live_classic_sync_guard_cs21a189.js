// F98.4-Z6-CS21A189 · English LAB Live Classic Sync guard.
// Complementa el product guard CS21A188 sin romper lifecycle ni rutas históricas.
(function installClassicSyncGuardCS21A189(global){
  'use strict';
  if(!global || global.__ENGLISH_LAB_CLASSIC_SYNC_GUARD_CS21A189__) return;

  const VERSION='F98.4-Z6-CS21A189';
  const CLASSIC_ENGINE='src/english_lab_games/memory_match_classic_sync_cs21a189.jsx?v=CS21A189';
  const CLASSIC_ADAPTER='src/english_lab_games/english_lab_live_memory_match_classic_sync_adapter_cs21a189.jsx?v=CS21A189';
  const BASE_ADAPTER_TOKEN='english_lab_live_memory_match_adapter_cs21a174.jsx';
  let installed=false;

  function clean(value){return String(value==null?'':value).trim();}
  function unique(values){return Array.from(new Set(values.filter(Boolean)));}
  function shouldExtend(values){return (Array.isArray(values)?values:[]).some(value=>clean(value).indexOf(BASE_ADAPTER_TOKEN)>=0);}
  function compatibility(){
    if(typeof global.MemoryMatchGameCS21A173==='function'){
      global.MemoryMatchGameCS21A173.__cs21a188SharedDiscovery=true;
      global.MemoryMatchGameCS21A173.__cs21a189ClassicSync=true;
    }
    return !!(
      global.EnglishLabMemoryMatchClassicSyncCS21A189 &&
      global.EnglishLabMemoryMatchClassicSyncAdapterCS21A189 &&
      typeof global.MemoryMatchGameCS21A173==='function' &&
      global.MemoryMatchGameCS21A173.__cs21a189ClassicSync===true
    );
  }

  function install(){
    const api=global.anLazyCampus;
    if(!api || typeof api.loadMany!=='function') return false;
    if(api.loadMany.__cs21a189ClassicSyncGuard){installed=true;compatibility();return true;}
    const baseLoadMany=api.loadMany.bind(api);
    async function loadManyCS21A189(values){
      const source=Array.isArray(values)?values.slice():[];
      const expanded=shouldExtend(source)?unique([...source,CLASSIC_ENGINE,CLASSIC_ADAPTER]):source;
      const result=await baseLoadMany(expanded);
      if(shouldExtend(source) && !compatibility()) throw new Error('English LAB Live no cargó el stack CS21A189 Memory Match clásico completo.');
      return result;
    }
    loadManyCS21A189.__cs21a189ClassicSyncGuard=true;
    loadManyCS21A189.__base=baseLoadMany;
    api.loadMany=loadManyCS21A189;
    installed=true;
    compatibility();
    return true;
  }

  const guard=Object.freeze({
    version:VERSION,
    cacheEpoch:'CS21A189',
    classicMemory:true,
    synchronizedReveal:true,
    mismatchFlipBack:true,
    prerequisites:[CLASSIC_ENGINE,CLASSIC_ADAPTER],
    install,
    compatibility,
    isInstalled:()=>installed,
  });
  global.__ENGLISH_LAB_CLASSIC_SYNC_GUARD_CS21A189__=guard;
  install();
  let attempts=0;
  const timer=global.setInterval(()=>{
    attempts+=1;
    if(install() || attempts>300) global.clearInterval(timer);
  },50);
  global.addEventListener && global.addEventListener('an:lazy-module-loaded',install);
})(window);
