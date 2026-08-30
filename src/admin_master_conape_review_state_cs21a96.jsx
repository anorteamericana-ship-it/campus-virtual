// F98.4-Z6-CS21A105 · Semáforo colaborativo estable ante refrescos y lecturas en vivo.
(function(){
'use strict';
const N=window.ANMasterConape96;if(!N)throw Error('CS21A98 core no cargado');
const{clean,reviewStepValue,isAcademicDisbursement01,safeUserError,post}=N;
const LOCAL_GUARD_MS=18000,FULL_RECONCILE_MS=20000;
function eligible(row){return!!row&&row.followupEligible!==false&&isAcademicDisbursement01(row)}
function serverStep(row){return row?.appliedInSystem?0:reviewStepValue(row?.reviewStep)}
function shallowSame(a,b){const ak=Object.keys(a||{}),bk=Object.keys(b||{});return ak.length===bk.length&&ak.every(k=>Number(a[k]||0)===Number(b[k]||0))}
function useConapeReview(all,setMsg){
 const scoped=React.useMemo(()=>(Array.isArray(all)?all:[]).filter(eligible),[all]);
 const[reviewSteps,setReviewSteps]=React.useState({}),[reviewBusy,setReviewBusy]=React.useState('');
 const seqRef=React.useRef(0),allRef=React.useRef(scoped),localRef=React.useRef({}),pollRef=React.useRef(null);
 allRef.current=scoped;
 const signature=React.useMemo(()=>scoped.map(row=>`${clean(row?.id)}:${row?.appliedInSystem?'C':'P'}:${serverStep(row)}`).join('|'),[scoped]);
 React.useEffect(()=>{
  const now=Date.now();
  setReviewSteps(current=>{
   const next={};
   scoped.forEach(row=>{
    const id=clean(row?.id);if(!id)return;
    if(row?.appliedInSystem){next[id]=0;delete localRef.current[id];return}
    const local=localRef.current[id],fresh=local&&now-Number(local.at||0)<LOCAL_GUARD_MS;
    next[id]=fresh?reviewStepValue(local.step):serverStep(row);
   });
   return shallowSame(current,next)?current:next;
  });
 },[signature]);
 React.useEffect(()=>{let active=true,busy=false;
  async function poll(bootstrap){
   if(!active||busy||document.visibilityState==='hidden')return;
   busy=true;
   try{
    const result=await post('getConapeRevisionChanges',bootstrap?{bootstrap:true}:{since_seq:seqRef.current}),map={};
    allRef.current.forEach(row=>{if(row?.id)map[row.id]=row});
    const updates={},remote=[];const now=Date.now();
    (result.changes||[]).forEach(change=>{
     const id=clean(change?.id),row=map[id];if(!row||!eligible(row))return;
     const closed=String(change?.estado||'').toUpperCase()==='CERRADO_REINICIADO'||!!row.appliedInSystem;
     const step=closed?0:reviewStepValue(change?.paso),local=localRef.current[id],guarded=local&&!closed&&now-Number(local.at||0)<LOCAL_GUARD_MS;
     if(closed){delete localRef.current[id];updates[id]=0;return}
     if(guarded&&step!==reviewStepValue(local.step))return;
     updates[id]=step;
     if(local&&step===reviewStepValue(local.step)&&now-Number(local.at||0)>=LOCAL_GUARD_MS)delete localRef.current[id];
     if(!bootstrap&&(!local||step!==reviewStepValue(local.step)))remote.push({...change,row,step});
    });
    if(Object.keys(updates).length)setReviewSteps(current=>{const next={...current,...updates};return shallowSame(current,next)?current:next});
    if(remote.length){const last=remote[remote.length-1];setMsg(`${clean(last.actor)||'Otra persona'} ${last.step?`marcó revisión ${last.step}`:'reinició el seguimiento'} en ${clean(last.row?.name)||clean(last.row?.code)||'un estudiante'}.`)}
    seqRef.current=Math.max(seqRef.current,Number(result.server_seq)||0);
   }catch(_){}finally{busy=false}
  }
  pollRef.current=poll;poll(true);
  const deltaTimer=setInterval(()=>poll(false),4000),fullTimer=setInterval(()=>poll(true),FULL_RECONCILE_MS),wake=()=>poll(true);
  window.addEventListener('focus',wake);
  return()=>{active=false;pollRef.current=null;clearInterval(deltaTimer);clearInterval(fullTimer);window.removeEventListener('focus',wake)};
 },[]);
 async function saveReview(row,step){
  const id=clean(row?.id);if(!id||!eligible(row)||row?.appliedInSystem||reviewBusy){if(row&&!eligible(row))setMsg('Este movimiento es informativo y no requiere seguimiento de la Academia.');return}
  const next=reviewStepValue(step),previous=reviewStepValue(reviewSteps[id]??row?.reviewStep);
  setReviewBusy(id);setMsg('');localRef.current[id]={step:next,at:Date.now(),confirmed:false};
  setReviewSteps(current=>({...current,[id]:next}));
  try{
   const result=await post('setConapeRevisionSemaforo',{movimiento_id:id,paso:next}),saved=reviewStepValue(result.paso);
   localRef.current[id]={step:saved,at:Date.now(),confirmed:true};
   setReviewSteps(current=>({...current,[id]:saved}));
   setMsg(saved===4?'Revisión final marcada y guardada. Permanecerá así hasta que el desembolso académico 01 pase a cerrados.':`Revisión ${saved} de 4 guardada.`);
   setTimeout(()=>pollRef.current?.(true),2200);
  }catch(error){
   const rawError=error?.message||String(error);
   delete localRef.current[id];
   if(clean(rawError).toLowerCase().includes('cerrado'))setReviewSteps(current=>({...current,[id]:0}));else setReviewSteps(current=>({...current,[id]:previous}));
   setMsg(safeUserError(rawError,'No se pudo guardar la revisión. Intentá de nuevo.','guardar_revision'));
  }finally{setReviewBusy('')}
 }
 return{reviewSteps,reviewBusy,saveReview};
}
N.useConapeReview=useConapeReview;
N.__REVIEW_STATE_BUILD__='F98.4-Z6-CS21A105';
})();
