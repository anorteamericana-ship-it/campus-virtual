// F98.4-Z6-CS21A192-R2 · carga final del adaptador autoritativo Memory Match.
// Se instala después de CS21A190 para que CS21A192 sea el último dueño del polling.
(function installEnglishLabAuthoritativeSyncGuardCS21A192(global){
  'use strict';
  if(!global||global.__ENGLISH_LAB_AUTHORITATIVE_SYNC_GUARD_CS21A192__)return;

  const VERSION='F98.4-Z6-CS21A192-R2';
  const ADAPTER='src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx?v=CS21A192R2';
  const BASE_ADAPTER_TOKEN='english_lab_live_memory_match_adapter_cs21a174.jsx';
  let installed=false;

  function clean(value){return String(value==null?'':value).trim();}
  function shouldExtend(values){return(Array.isArray(values)?values:[]).some(value=>clean(value).indexOf(BASE_ADAPTER_TOKEN)>=0);}
  function compatibility(){
    return!!(
      global.EnglishLabMemoryMatchAuthoritativeSyncCS21A192&&
      typeof global.MemoryMatchLiveRoundCS21A174==='function'&&
      global.MemoryMatchLiveRoundCS21A174.__cs21a192AuthoritativeSyncAdapter===true
    );
  }
  function install(){
    const api=global.anLazyCampus;
    if(!api||typeof api.loadMany!=='function')return false;
    if(api.loadMany.__cs21a192AuthoritativeSyncGuard){installed=true;return true;}
    const baseLoadMany=api.loadMany.bind(api);
    async function loadManyCS21A192(values){
      const source=Array.isArray(values)?values.slice():[];
      const result=await baseLoadMany(source);
      // La carga separada es intencional: los guards CS21A188/189 primero terminan
      // su stack histórico y CS21A192 queda como el adaptador global definitivo.
      if(shouldExtend(source)){
        await baseLoadMany([ADAPTER]);
        if(!compatibility())throw new Error('English LAB Live no cargó el adaptador autoritativo CS21A192.');
      }
      return result;
    }
    loadManyCS21A192.__cs21a192AuthoritativeSyncGuard=true;
    loadManyCS21A192.__base=baseLoadMany;
    api.loadMany=loadManyCS21A192;
    installed=true;
    return true;
  }

  const guard=Object.freeze({
    version:VERSION,
    cacheEpoch:'CS21A192R2',
    adapter:ADAPTER,
    singlePollOwner:true,
    rejectsOutOfOrder:true,
    install,
    compatibility,
    isInstalled:()=>installed,
  });
  global.__ENGLISH_LAB_AUTHORITATIVE_SYNC_GUARD_CS21A192__=guard;
  install();
  let attempts=0;
  const timer=global.setInterval(()=>{
    attempts+=1;
    if(install()||attempts>300)global.clearInterval(timer);
  },50);
  global.addEventListener&&global.addEventListener('an:lazy-module-loaded',install);
})(window);
