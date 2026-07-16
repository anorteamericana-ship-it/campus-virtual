// F98.4-Z6-CS21A107 · Guardia de montaje del Panel CONAPE completo.
(function(){
'use strict';
const VERSION='F98.4-Z6-CS21A107',RECOVERY_URL='src/admin_master_conape_panel_cs21a96.jsx?v=F98.4Z6CS21A107R';
let loading=null;
function depsReady(N){return N&&typeof N.PanelView==='function'&&typeof N.useConapeReview==='function'&&typeof N.useConapePanelData==='function'}
async function ensure(){
 window.__AN_MASTER_COBRANZA_GROUP_FILTER_VERSION__=VERSION;
 window.__AN_MASTER_COBRANZA_GROUP_FILTER_RETIRED__=true;
 const N=window.ANMasterConape96;
 if(!depsReady(N))return false;
 if(typeof N.installMasterConapePanelCS21A107!=='function'&&window.anLazyCampus?.loadOne){
  if(!loading)loading=window.anLazyCampus.loadOne(RECOVERY_URL).catch(error=>{window.__AN_MASTER_CONAPE_RECOVERY_ERROR__=error?.message||String(error);loading=null;return false});
  await loading;
 }
 if(typeof N.installMasterConapePanelCS21A107==='function'){
  const ok=N.installMasterConapePanelCS21A107();
  window.__AN_MASTER_CONAPE_RECOVERY_OK__=!!ok;
  return !!ok;
 }
 return false;
}
function burst(){[0,40,120,300,700,1500,3000].forEach(delay=>setTimeout(ensure,delay))}
window.addEventListener('an:lazy-module-loaded',burst);
window.addEventListener('focus',burst);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')burst()});
burst();
const probe=setInterval(ensure,250);setTimeout(()=>clearInterval(probe),120000);
})();
