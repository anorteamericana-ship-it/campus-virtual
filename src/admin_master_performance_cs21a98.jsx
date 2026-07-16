// F98.4-Z6-CS21A98 · Apertura inmediata y sincronización pesada en segundo plano
(function(){
'use strict';
const SNAPSHOT_KEY='an_master_dashboard_snapshot_cs21a98';
const SYNC_KEY='an_master_conape_last_sync_cs21a98';
const SNAPSHOT_TTL=10*60*1000;
const SYNC_INTERVAL=30*60*1000;
function readSnapshot(){try{const x=JSON.parse(sessionStorage.getItem(SNAPSHOT_KEY)||'null');return x&&x.data?.ok&&Date.now()-Number(x.savedAt||0)<SNAPSHOT_TTL?x:null}catch(_){return null}}
function saveSnapshot(data){try{sessionStorage.setItem(SNAPSHOT_KEY,JSON.stringify({savedAt:Date.now(),data}))}catch(_){}}
function syncAge(){try{return Date.now()-Number(localStorage.getItem(SYNC_KEY)||0)}catch(_){return SYNC_INTERVAL}}
function markSync(){try{localStorage.setItem(SYNC_KEY,String(Date.now()))}catch(_){}}
function useMasterDataCS21A98(){
 const initial=React.useMemo(readSnapshot,[]);
 const[state,setState]=React.useState({loading:!initial,error:'',data:initial?.data||null});
 const runningRef=React.useRef(false),syncRef=React.useRef(false),aliveRef=React.useRef(true),timerRef=React.useRef(null);
 const load=React.useCallback(async({refresh=false,silent=false}={})=>{
  if(runningRef.current)return null;runningRef.current=true;const started=performance.now();
  if(!silent)setState(current=>({...current,loading:true,error:''}));
  try{const dashboard=await window.masterPost({refresh});if(!dashboard?.ok)throw new Error(dashboard?.mensaje||dashboard?.error||'No se pudo cargar');if(!aliveRef.current)return dashboard;saveSnapshot(dashboard);window.__AN_MASTER_LAST_LOAD__={ms:Math.round(performance.now()-started),source:dashboard?.performance?.source||dashboard?.cache_layer||(dashboard?.cache?'cache':'backend'),at:Date.now()};setState({loading:false,error:'',data:dashboard});return dashboard}catch(error){if(aliveRef.current)setState(current=>({loading:false,error:error?.message||String(error),data:current.data}));return null}finally{runningRef.current=false}
 },[]);
 const syncConape=React.useCallback(async({force=false}={})=>{
  if(syncRef.current||(!force&&syncAge()<SYNC_INTERVAL))return;syncRef.current=true;
  try{await window.masterAction('actualizarPanelConapeAhora');markSync();await load({refresh:true,silent:true})}catch(error){if(aliveRef.current)setState(current=>({...current,error:current.data?'':(error?.message||String(error))}))}finally{syncRef.current=false}
 },[load]);
 React.useEffect(()=>{
  aliveRef.current=true;
  load({refresh:false,silent:!!initial});
  const schedule=()=>{clearTimeout(timerRef.current);const wait=Math.max(1200,SYNC_INTERVAL-Math.min(SYNC_INTERVAL,syncAge()));timerRef.current=setTimeout(async()=>{await syncConape();schedule()},wait)};
  schedule();
  const onFocus=()=>{if(syncAge()>=SYNC_INTERVAL)syncConape()};window.addEventListener('focus',onFocus);
  return()=>{aliveRef.current=false;clearTimeout(timerRef.current);window.removeEventListener('focus',onFocus)};
 },[]);
 return{...state,refetch:async()=>{await syncConape({force:true});return load({refresh:true})}};
}
function install(){window.useMasterData=useMasterDataCS21A98;window.__AN_MASTER_PERFORMANCE_BUILD__='F98.4-Z6-CS21A98'}
window.addEventListener('an:lazy-module-loaded',event=>{if(String(event?.detail?.src||'').includes('admin_master_dashboard.jsx'))install()});
if(typeof window.MasterDashboard==='function')install();
})();
