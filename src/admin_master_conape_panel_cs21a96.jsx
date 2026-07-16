// F98.4-Z6-CS21A97 · Instalador del panel CONAPE con filtro de grupos
(function(){
'use strict';
const N=window.ANMasterConape96;if(!N)throw Error('CS21A96 core no cargado');
const BUILD='F98.4-Z6-CS21A97';
const{clean,injectStyles,useConapePanelData,useConapeReview,PanelView}=N;
function MasterConapeMovementsTableCS21A97({data,onRefresh}){
 injectStyles();
 const d=useConapePanelData(data,onRefresh),r=useConapeReview(d.all,d.setMsg);
 const filterState={query:d.query,setQuery:d.setQuery,groupFilter:d.groupFilter,setGroupFilter:d.setGroupFilter,levelFilter:d.levelFilter,setLevelFilter:d.setLevelFilter,statusFilter:d.statusFilter,setStatusFilter:d.setStatusFilter,periodFilter:d.periodFilter,setPeriodFilter:d.setPeriodFilter,whatsappFilter:d.whatsappFilter,setWhatsappFilter:d.setWhatsappFilter,sort:d.sort,setSort:d.setSort,hasFilters:d.hasFilters,clearFilters:d.clearFilters};
 const tableProps={details:d.details,openDetail:d.openDetail,financeMap:d.financeMap,sort:d.sort,onSort:d.onSort,reviewSteps:r.reviewSteps,onReview:r.saveReview,reviewBusy:r.reviewBusy};
 return <PanelView BUILD={BUILD} data={data} movements={d.movements} busy={d.busy} msg={d.msg} refresh={d.refresh} originalPending={d.originalPending} originalApplied={d.originalApplied} stats={d.stats} visible={d.visible} all={d.all} pending={d.pending} applied={d.applied} hasFilters={d.hasFilters} filterState={filterState} options={{groups:d.groupOptions,status:d.statusOptions,period:d.periodOptions}} tableProps={tableProps} editor={d.editor} setEditor={d.setEditor} saveDetail={d.saveDetail}/>;
}
function apply(){if(typeof window.MasterConapeMovementsTable!=='function')return;window.MasterConapeMovementsTable=MasterConapeMovementsTableCS21A97;window.__AN_MASTER_CONAPE_MOVEMENTS_BUILD__=BUILD}
window.addEventListener('an:lazy-module-loaded',event=>{if(clean(event?.detail?.src).includes('admin_master_dashboard.jsx'))apply()});setTimeout(apply,0);
})();
