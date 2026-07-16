// F98.4-Z6-CS21A107 · Prueba aislada del instalador final.
const fs=require('fs'),vm=require('vm');
const listeners={};
global.window=global;
global.document={visibilityState:'visible',addEventListener:(name,fn)=>{(listeners[name]??=[]).push(fn)},getElementById:()=>null,head:{appendChild(){}}};
global.addEventListener=(name,fn)=>{(listeners[name]??=[]).push(fn)};
global.MasterConapeMovementsTable=function LegacyPanel(){};
global.useMasterData=function LegacyData(){};
global.ANMasterConape96={clean:value=>String(value??'').trim(),levelId:row=>String(row?.level||''),injectStyles(){},useConapePanelData(){return{}},useConapeReview(){return{}},PanelView:function PanelView(){},filterRows:rows=>rows,compareRows:()=>0,uniqueSorted:values=>values};
const source=fs.readFileSync(require('path').join(__dirname,'../src/admin_master_conape_panel_cs21a96.jsx'),'utf8');
const start=source.indexOf('return <PanelView');
const end=source.indexOf('/>}',start)+2;
if(start<0||end<2)throw Error('No se encontró el JSX principal del panel.');
vm.runInThisContext(source.slice(0,start)+'return null'+source.slice(end));
setTimeout(()=>{
 const result={ok:global.__AN_MASTER_CONAPE_MOVEMENTS_BUILD__==='F98.4-Z6-CS21A107'&&global.MasterConapeMovementsTable.__anFullConapePanel===true&&global.__AN_MASTER_CONAPE_FULL_PANEL_ACTIVE__===true,build:global.__AN_MASTER_CONAPE_MOVEMENTS_BUILD__,active:global.__AN_MASTER_CONAPE_FULL_PANEL_ACTIVE__,component:global.MasterConapeMovementsTable.name};
 console.log(JSON.stringify(result,null,2));
 process.exit(result.ok?0:1);
},80);
