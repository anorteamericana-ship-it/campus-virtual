// F98.4-Z6-CS21A102 · Guardia de montaje posterior a módulos diferidos.
(function(){
'use strict';
const BUILD='F98.4-Z6-CS21A102';
function install(){
  const N=window.ANQuickUpdate99;
  if(!N||typeof N.QuickModal!=='function')return false;
  let current=null;
  try{current=window.ModalEstatus||ModalEstatus}catch(_){current=window.ModalEstatus}
  if(typeof current!=='function')return false;
  if(current!==N.QuickModal){
    window.ModalEstatus=N.QuickModal;
    try{ModalEstatus=N.QuickModal}catch(_){}
  }
  window.__AN_QUICK_UPDATE_BUILD__=BUILD;
  window.__AN_QUICK_UPDATE_ACTIVE__=window.ModalEstatus===N.QuickModal;
  return window.__AN_QUICK_UPDATE_ACTIVE__;
}
function reinforce(){[0,50,200,800].forEach(ms=>setTimeout(install,ms))}
window.addEventListener('an:lazy-module-loaded',event=>{
  const src=String(event?.detail?.src||'');
  if(src.includes('admin_students.jsx')||src.includes('buscador.jsx'))reinforce();
});
window.addEventListener('focus',install);
window.__AN_QUICK_UPDATE_REINSTALL__=reinforce;
reinforce();
})();
