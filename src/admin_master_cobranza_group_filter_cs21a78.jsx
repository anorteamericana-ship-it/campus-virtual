// F98.4-Z6-CS21A109 · Guardia de montaje y recuperación ordenada del Panel CONAPE.
(function(){
'use strict';
const VERSION='F98.4-Z6-CS21A109';
const URLS={
 sort:'src/admin_master_conape_multisort_cs21a109.jsx?v=F98.4Z6CS21A109R',
 data:'src/admin_master_conape_data_cs21a96.jsx?v=F98.4Z6CS21A109R',
 panel:'src/admin_master_conape_panel_cs21a96.jsx?v=F98.4Z6CS21A109R'
};
let loading=null;
async function load(url){if(!window.anLazyCampus?.loadOne)return false;await window.anLazyCampus.loadOne(url);return true}
async function ensure(){
 window.__AN_MASTER_COBRANZA_GROUP_FILTER_VERSION__=VERSION;
 window.__AN_MASTER_COBRANZA_GROUP_FILTER_RETIRED__=true;
 if(loading)return loading;
 loading=(async()=>{
  try{
   let N=window.ANMasterConape96;if(!N)return false;
   if(typeof N.compareRowsMulti!=='function'||typeof N.normalizeSortStack!=='function')await load(URLS.sort);
   N=window.ANMasterConape96;if(typeof N.periodForType!=='function'||typeof N.historyPeriodCandidates!=='function')await load(URLS.data);
   N=window.ANMasterConape96;if(typeof N.installMasterConapePanelCS21A109!=='function')await load(URLS.panel);
   N=window.ANMasterConape96;const install=N?.installMasterConapePanelCS21A109;
   const ok=typeof install==='function'?install():false;
   window.__AN_MASTER_CONAPE_RECOVERY_OK__=!!ok;
   return !!ok;
  }catch(error){window.__AN_MASTER_CONAPE_RECOVERY_ERROR__=error?.message||String(error);return false}
  finally{loading=null}
 })();
 return loading;
}
function burst(){[0,40,120,300,700,1500,3000].forEach(delay=>setTimeout(ensure,delay))}
window.addEventListener('an:lazy-module-loaded',burst);
window.addEventListener('focus',burst);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')burst()});
burst();
const probe=setInterval(ensure,250);setTimeout(()=>clearInterval(probe),120000);
})();
