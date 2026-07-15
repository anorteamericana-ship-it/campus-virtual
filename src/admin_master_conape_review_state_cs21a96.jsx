// F98.4-Z6-CS21A96 · Estado persistente del semáforo CONAPE
(function(){
'use strict';
const N=window.ANMasterConape96;if(!N)throw Error('CS21A96 core no cargado');
const{clean,reviewStepValue,post}=N;
function useConapeReview(all,setMsg){
 const[reviewSteps,setReviewSteps]=React.useState({}),[reviewBusy,setReviewBusy]=React.useState('');
 React.useEffect(()=>{const next={};all.forEach(row=>{if(row?.id)next[row.id]=row.appliedInSystem?0:reviewStepValue(row.reviewStep)});setReviewSteps(next)},[all]);
 async function saveReview(row,step){const id=clean(row?.id);if(!id||row?.appliedInSystem||reviewBusy)return;const next=reviewStepValue(step);setReviewBusy(id);setMsg('');try{const result=await post('setConapeRevisionSemaforo',{movimiento_id:id,paso:next});setReviewSteps(current=>({...current,[id]:reviewStepValue(result.paso)}));setMsg(next===4?'Revisión final marcada. Permanecerá así hasta que el desembolso pase a cerrados.':`Revisión ${next} de 4 guardada.`)}catch(error){if(clean(error?.message).toLowerCase().includes('cerrado'))setReviewSteps(current=>({...current,[id]:0}));setMsg(error?.message||String(error))}finally{setReviewBusy('')}}
 return{reviewSteps,reviewBusy,saveReview};
}
N.useConapeReview=useConapeReview;
})();
