// F98.4-Z6-CS21A98 · Semáforo colaborativo en vivo sin recargar
(function(){
'use strict';
const N=window.ANMasterConape96;if(!N)throw Error('CS21A98 core no cargado');
const{clean,reviewStepValue,post}=N;
function useConapeReview(all,setMsg){
 const[reviewSteps,setReviewSteps]=React.useState({}),[reviewBusy,setReviewBusy]=React.useState(''),[liveStatus,setLiveStatus]=React.useState('Conectando…');
 const seqRef=React.useRef(0),timerRef=React.useRef(null),runningRef=React.useRef(false),liveRef=React.useRef(true),allRef=React.useRef(all),localRef=React.useRef({});
 React.useEffect(()=>{allRef.current=all;const next={};all.forEach(row=>{if(row?.id)next[row.id]=row.appliedInSystem?0:reviewStepValue(row.reviewStep)});setReviewSteps(next)},[all]);
 function applyChanges(changes,bootstrap){
  if(!Array.isArray(changes)||!changes.length)return;
  const map={};allRef.current.forEach(row=>{if(row?.id)map[row.id]=row});
  const updates={},remote=[];
  changes.forEach(change=>{const id=clean(change?.id),row=map[id];if(!id||!row)return;const step=String(change?.estado||'').toUpperCase()==='CERRADO_REINICIADO'?0:reviewStepValue(change?.paso);updates[id]=step;const localKey=`${id}|${step}`,localAt=Number(localRef.current[localKey]||0);if(!bootstrap&&Date.now()-localAt>15000)remote.push({...change,row,step})});
  if(Object.keys(updates).length)setReviewSteps(current=>({...current,...updates}));
  if(remote.length){const last=remote[remote.length-1],actor=clean(last.actor)||'Otra persona',name=clean(last.row?.name)||clean(last.row?.code)||'un estudiante',detail=last.step?`marcó revisión ${last.step}`:'reinició el seguimiento';setMsg(`${actor} ${detail} en ${name}.`)}
 }
 async function poll(bootstrap=false){
  if(!liveRef.current||runningRef.current||document.visibilityState==='hidden')return;
  runningRef.current=true;
  try{const result=await post('getConapeRevisionChanges',bootstrap?{bootstrap:true}:{since_seq:seqRef.current});applyChanges(result.changes,bootstrap);seqRef.current=Math.max(seqRef.current,Number(result.server_seq)||0);setLiveStatus('En vivo · 4 s')}catch(_){setLiveStatus('Reconectando…')}finally{runningRef.current=false}
 }
 React.useEffect(()=>{
  liveRef.current=true;
  const schedule=()=>{if(!liveRef.current)return;clearTimeout(timerRef.current);timerRef.current=setTimeout(async()=>{await poll(false);schedule()},4000)};
  poll(true).finally(schedule);
  const wake=()=>{if(document.visibilityState!=='hidden')poll(false)};
  window.addEventListener('focus',wake);document.addEventListener('visibilitychange',wake);
  return()=>{liveRef.current=false;clearTimeout(timerRef.current);window.removeEventListener('focus',wake);document.removeEventListener('visibilitychange',wake)};
 },[]);
 async function saveReview(row,step){const id=clean(row?.id);if(!id||row?.appliedInSystem||reviewBusy)return;const next=reviewStepValue(step);setReviewBusy(id);setMsg('');localRef.current[`${id}|${next}`]=Date.now();try{const result=await post('setConapeRevisionSemaforo',{movimiento_id:id,paso:next});setReviewSteps(current=>({...current,[id]:reviewStepValue(result.paso)}));setMsg(next===4?'Revisión final marcada. Permanecerá así hasta que el desembolso pase a cerrados.':`Revisión ${next} de 4 guardada.`);setTimeout(()=>poll(false),180)}catch(error){if(clean(error?.message).toLowerCase().includes('cerrado'))setReviewSteps(current=>({...current,[id]:0}));setMsg(error?.message||String(error))}finally{setReviewBusy('')}}
 return{reviewSteps,reviewBusy,saveReview,liveStatus};
}
N.useConapeReview=useConapeReview;
})();
