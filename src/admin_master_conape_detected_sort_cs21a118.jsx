// F98.4-Z6-CS21A118 · Detectado abre con el registro más reciente primero.
(function(){
'use strict';
const N=window.ANMasterConape96;
if(!N||typeof N.useConapePanelData!=='function')throw Error('CS21A118 requiere data CS21A96');
const baseUseConapePanelData=N.useConapePanelData;
function useConapePanelDataCS21A118(data,onRefresh){
 const state=baseUseConapePanelData(data,onRefresh);
 const baseOnSort=state.onSort;
 function onSort(key){
  if(key!=='detected')return baseOnSort(key);
  state.setSortStack(current=>{
   const normalized=N.normalizeSortStack(current);
   const first=normalized[0]||{key:'disbursement',dir:'asc'};
   const dir=first.key==='detected'?(first.dir==='desc'?'asc':'desc'):'desc';
   return[{key:'detected',dir},...normalized.filter(item=>item.key!=='detected')].slice(0,3);
  });
 }
 return{...state,onSort};
}
useConapePanelDataCS21A118.__anBase=baseUseConapePanelData;
useConapePanelDataCS21A118.__anBuild='F98.4-Z6-CS21A118';
N.useConapePanelData=useConapePanelDataCS21A118;
window.__AN_MASTER_CONAPE_DETECTED_SORT__='F98.4-Z6-CS21A118';
})();