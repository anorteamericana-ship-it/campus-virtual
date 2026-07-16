// F98.4-Z6-CS21A101 · Panel CONAPE colaborativo con alcance académico 01
(function(){
'use strict';
const N=window.ANMasterConape96;if(!N)throw Error('CS21A98 core no cargado');
const BUILD='F98.4-Z6-CS21A101',SNAPSHOT_KEY='an_master_dashboard_snapshot_cs21a101',SYNC_KEY='an_master_conape_last_sync_cs21a98',SYNC_MS=30*60*1000;
const{clean,injectStyles,useConapePanelData,useConapeReview,PanelView}=N;
function MasterConapeMovementsTableCS21A101({data,onRefresh}){
 injectStyles();const d=useConapePanelData(data,onRefresh),r=useConapeReview(d.all,d.setMsg),scopedData={...data,conapeAutoSync:{...(data?.conapeAutoSync||{}),movimientos_registrados:d.originalPending.length,nuevos:d.originalPending.length,scope:'ACADEMIC_DISBURSEMENT_01_ONLY'}};
 const filterState={query:d.query,setQuery:d.setQuery,groupFilter:d.groupFilter,setGroupFilter:d.setGroupFilter,levelFilter:d.levelFilter,setLevelFilter:d.setLevelFilter,statusFilter:d.statusFilter,setStatusFilter:d.setStatusFilter,periodFilter:d.periodFilter,setPeriodFilter:d.setPeriodFilter,whatsappFilter:d.whatsappFilter,setWhatsappFilter:d.setWhatsappFilter,sort:d.sort,setSort:d.setSort,hasFilters:d.hasFilters,clearFilters:d.clearFilters};
 const tableProps={details:d.details,openDetail:d.openDetail,financeMap:d.financeMap,sort:d.sort,onSort:d.onSort,reviewSteps:r.reviewSteps,onReview:r.saveReview,reviewBusy:r.reviewBusy};
 return <PanelView BUILD={BUILD} data={scopedData} movements={d.movements} busy={d.busy} msg={d.msg} refresh={d.refresh} originalPending={d.originalPending} originalApplied={d.originalApplied} stats={d.stats} visible={d.visible} all={d.all} pending={d.pending} applied={d.applied} hasFilters={d.hasFilters} filterState={filterState} options={{groups:d.groupOptions,status:d.statusOptions,period:d.periodOptions}} tableProps={tableProps} editor={d.editor} setEditor={d.setEditor} saveDetail={d.saveDetail}/>;
}
function readSnapshot(){try{const x=JSON.parse(sessionStorage.getItem(SNAPSHOT_KEY)||'null');return x&&x.data?.ok&&Date.now()-Number(x.savedAt||0)<10*60*1000?x:null}catch(_){return null}}
function saveSnapshot(data){try{sessionStorage.setItem(SNAPSHOT_KEY,JSON.stringify({savedAt:Date.now(),data}))}catch(_){}}
function syncAge(){try{return Date.now()-Number(localStorage.getItem(SYNC_KEY)||0)}catch(_){return SYNC_MS}}
function markSync(){try{localStorage.setItem(SYNC_KEY,String(Date.now()))}catch(_){}}
function useMasterDataCS21A101(){
 const initial=React.useMemo(readSnapshot,[]),[state,setState]=React.useState({loading:!initial,error:'',data:initial?.data||null}),running=React.useRef(false),syncing=React.useRef(false),alive=React.useRef(true),timer=React.useRef(null);
 const load=React.useCallback(async({refresh=false,silent=false}={})=>{if(running.current)return;running.current=true;if(!silent)setState(x=>({...x,loading:true,error:''}));const started=performance.now();try{const dashboard=await window.masterPost({refresh});if(!dashboard?.ok)throw Error(dashboard?.mensaje||dashboard?.error||'No se pudo cargar');if(alive.current){saveSnapshot(dashboard);window.__AN_MASTER_LAST_LOAD__={ms:Math.round(performance.now()-started),source:dashboard?.performance?.source||dashboard?.cache_layer||(dashboard?.cache?'cache':'backend')};setState({loading:false,error:'',data:dashboard})}}catch(error){if(alive.current)setState(x=>({loading:false,error:error?.message||String(error),data:x.data}))}finally{running.current=false}},[]);
 const sync=React.useCallback(async(force=false)=>{if(syncing.current||(!force&&syncAge()<SYNC_MS))return;syncing.current=true;try{await window.masterAction('actualizarPanelConapeAhora');markSync();await load({refresh:true,silent:true})}catch(_){}finally{syncing.current=false}},[load]);
 React.useEffect(()=>{alive.current=true;load({refresh:false,silent:!!initial});const schedule=()=>{clearTimeout(timer.current);timer.current=setTimeout(async()=>{await sync(false);schedule()},Math.max(1200,SYNC_MS-Math.min(SYNC_MS,syncAge())))};schedule();const focus=()=>{if(syncAge()>=SYNC_MS)sync(false)};window.addEventListener('focus',focus);return()=>{alive.current=false;clearTimeout(timer.current);window.removeEventListener('focus',focus)}},[]);
 return{...state,refetch:async()=>{await sync(true);await load({refresh:true})}};
}
function install(){if(typeof window.MasterConapeMovementsTable==='function'){window.MasterConapeMovementsTable=MasterConapeMovementsTableCS21A101;window.__AN_MASTER_CONAPE_MOVEMENTS_BUILD__=BUILD}window.useMasterData=useMasterDataCS21A101;window.__AN_MASTER_PERFORMANCE_BUILD__=BUILD}
window.addEventListener('an:lazy-module-loaded',event=>{if(clean(event?.detail?.src).includes('admin_master_dashboard.jsx'))install()});setTimeout(install,0);
})();
