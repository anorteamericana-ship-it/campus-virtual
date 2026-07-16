// F98.4-Z6-CS21A98 · Semáforo colaborativo sin recargar
(function(){
'use strict';
const N=window.ANMasterConape96;if(!N)throw Error('CS21A98 core no cargado');
const{clean,reviewStepValue,post}=N;
function useConapeReview(all,setMsg){
 const[reviewSteps,setReviewSteps]=React.useState({}),[reviewBusy,setReviewBusy]=React.useState('');
 const seqRef=React.useRef(0),allRef=React.useRef(all),localRef=React.useRef({});
 React.useEffect(()=>{allRef.current=all;const next={};all.forEach(row=>{if(row?.id)next[row.id]=row.appliedInSystem?0:reviewStepValue(row.reviewStep)});setReviewSteps(next)},[all]);
 React.useEffect(()=>{let active=true,busy=false;
  async function poll(bootstrap){if(!active||busy||document.visibilityState==='hidden')return;busy=true;try{const result=await post('getConapeRevisionChanges',bootstrap?{bootstrap:true}:{since_seq:seqRef.current}),map={};allRef.current.forEach(row=>{if(row?.id)map[row.id]=row});const updates={},remote=[];(result.changes||[]).forEach(change=>{const id=clean(change?.id),row=map[id];if(!row)return;const step=String(change?.estado||'').toUpperCase()==='CERRADO_REINICIADO'?0:reviewStepValue(change?.paso);updates[id]=step;if(!bootstrap&&Date.now()-Number(localRef.current[`${id}|${step}`]||0)>15000)remote.push({...change,row,step})});if(Object.keys(updates).length)setReviewSteps(current=>({...current,...updates}));if(remote.length){const last=remote[remote.length-1];setMsg(`${clean(last.actor)||'Otra persona'} ${last.step?`marcó revisión ${last.step}`:'reinició el seguimiento'} en ${clean(last.row?.name)||clean(last.row?.code)||'un estudiante'}.`)}seqRef.current=Math.max(seqRef.current,Number(result.server_seq)||0)}catch(_){}finally{busy=false}}
  poll(true);const timer=setInterval(()=>poll(false),4000),wake=()=>poll(false);window.addEventListener('focus',wake);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',wake)};
 },[]);
 async function saveReview(row,step){const id=clean(row?.id);if(!id||row?.appliedInSystem||reviewBusy)return;const next=reviewStepValue(step);setReviewBusy(id);setMsg('');localRef.current[`${id}|${next}`]=Date.now();try{const result=await post('setConapeRevisionSemaforo',{movimiento_id:id,paso:next});setReviewSteps(current=>({...current,[id]:reviewStepValue(result.paso)}));setMsg(next===4?'Revisión final marcada. Permanecerá así hasta que el desembolso pase a cerrados.':`Revisión ${next} de 4 guardada.`)}catch(error){if(clean(error?.message).toLowerCase().includes('cerrado'))setReviewSteps(current=>({...current,[id]:0}));setMsg(error?.message||String(error))}finally{setReviewBusy('')}}
 return{reviewSteps,reviewBusy,saveReview};
}
N.useConapeReview=useConapeReview;
})();
