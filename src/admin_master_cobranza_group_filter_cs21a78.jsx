// F98.4-Z6-CS21A107 · Compatibilidad histórica A78 retirada.
(function(){
'use strict';
const VERSION='F98.4-Z6-CS21A107';
function mark(){
 window.__AN_MASTER_COBRANZA_GROUP_FILTER_VERSION__=VERSION;
 window.__AN_MASTER_COBRANZA_GROUP_FILTER_RETIRED__=true;
 const N=window.ANMasterConape96;
 if(N&&typeof N.installMasterConapePanelCS21A107==='function')N.installMasterConapePanelCS21A107();
}
window.addEventListener('an:lazy-module-loaded',mark);
window.addEventListener('focus',mark);
setTimeout(mark,0);
})();
