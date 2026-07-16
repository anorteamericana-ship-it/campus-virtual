// F98.4-Z6-CS21A102 · Instalador robusto del asistente Poner al día.
(function(){
'use strict';
const BUILD='F98.4-Z6-CS21A102';
const N=window.ANQuickUpdate99;
let original=null;
function currentModal(){
  try{return window.ModalEstatus||ModalEstatus||null}catch(_){return window.ModalEstatus||null}
}
function apply(){
  if(!N||typeof N.QuickModal!=='function')return false;
  const current=currentModal();
  if(typeof current!=='function')return false;
  if(current===N.QuickModal){
    window.__AN_QUICK_UPDATE_BUILD__=BUILD;
    return true;
  }
  if(!original||current!==N.QuickModal)original=current;
  window.ModalEstatus=N.QuickModal;
  try{ModalEstatus=N.QuickModal}catch(_){}
  N.QuickModal.__anQuickUpdateBuild=BUILD;
  window.__AN_QUICK_UPDATE_BUILD__=BUILD;
  window.__AN_QUICK_UPDATE_ORIGINAL__=original;
  return currentModal()===N.QuickModal;
}
function reinforce(){[0,40,160,600].forEach(ms=>setTimeout(apply,ms))}
window.__AN_INSTALL_QUICK_UPDATE__=apply;
window.addEventListener('an:lazy-module-loaded',event=>{
  const src=String(event?.detail?.src||'');
  if(src.includes('admin_students.jsx')||src.includes('buscador.jsx'))reinforce();
});
window.addEventListener('focus',apply);
reinforce();
})();
