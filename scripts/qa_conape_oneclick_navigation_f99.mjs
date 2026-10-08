import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const Babel=require('../vendor/babel.js');
const server=fs.readFileSync('services/conape-bridge/server_v2.mjs','utf8').replace(/\r\n/g,'\n');
const front=fs.readFileSync('src/ventas_conape_reclutar_row_c3_5.jsx','utf8');
const dash=fs.readFileSync('src/ventas_dashboard.jsx','utf8');
const html=fs.readFileSync('ventas.html','utf8');
for(const f of ['src/ventas_conape_reclutar_row_c3_5.jsx','src/ventas_dashboard.jsx']){
  Babel.transform(fs.readFileSync(f,'utf8'),{presets:['react'],plugins:['transform-block-scoping']});
}
assert(!front.includes('comparison ? <React.Fragment>'),'No comparison shown');
assert(!front.includes('Tiempo total: {timing.total}'),'No internal timing shown');
assert(front.includes('bridge.execute(cedula)'),'Single bridge call');
assert(!front.includes('bridge.preview('),'No preview');
assert(front.includes('_conape_recruit_refresh:true'),'Refresh signal on success');
assert(dash.includes('if (_conape_recruit_refresh === true) setReloadTick(t => t + 1)'),'Dashboard reload after registration');
assert(html.includes('src/ventas_conape_reclutar_row_c3_5.jsx?v=F99-ONECLICK-NAV1'));
assert(html.includes('src/ventas_dashboard.jsx?v=F99-ONECLICK-NAV1'));
assert(server.includes("if (created.actionCount !== 1) throw new AppError("),'Final action count remains one');
assert(server.includes('assertIdentityMatch(comparison)'),'Identity safety gate preserved');
console.log('PASS UI: single action, no comparison or preview, new cache and background list reload');

const begin=server.indexOf('  async freshProspectoFromHome() {');
const end=server.indexOf('\n  },\n};',begin);
assert(begin>=0 && end>begin, 'navigation method found');
const method=server.slice(begin,end+5);
async function check(scenario) {
  let clicks=0, finalWrites=0, navDirect=0, logs=[];
  const pages=[];
  const ctx={pages:()=>pages};
  function page(id, initialForm=false) {
    return {
      id,form:initialForm,deadline:0,closed:false,context:()=>ctx,
      isClosed:()=>false,setDefaultTimeout:()=>{},
      waitForLoadState:async()=>{},
      frames:()=>[],
      goto:async(url)=>{if(url.includes('direct-prospect')){navDirect++;if(scenario!=='never')p.form=true;}},
    };
  }
  let p=page('home',false);pages.push(p);
  let popup=null;
  const session={
    page:p,state:'DISCONNECTED',
    browserPage:async()=>p,
    login:async()=>{},
    formReady:async pg=>pg.form,
    authState:async()=>({authenticated:false,password:false}),
    lastActivity:'',
  };
  class AppError extends Error{constructor(code,message,status,stage){super(message);this.code=code;this.status=status;this.stage=stage}}
  const sandbox={
    session,AppError,
    readApexSession:async()=> 'SESSION',
    urlWithSession:(base,id)=>base+'?session='+id,
    CONAPE_FRIENDLY_HOME:'https://conape.invalid/home',
    CONAPE_FRIENDLY_PROSPECTO:'https://conape.invalid/direct-prospect',
    waitForApexDynamicAction:async()=>true,
    clickProspectacionModuleLink:async()=>({found:true,clicked:true}),
    clickVisibleByLabel:async()=>{clicks++;if(scenario==='popup'){popup=page('popup',true);pages.push(popup);}return scenario!=='no-button';},
    sleep:async()=>{ if(scenario==='click-ready'&&clicks>0)p.form=true;},
    readSignedNavigationTelemetry:async()=>({}),
    nowIso:()=> '2026-10-07T21:00:00Z',
    console:{log:s=>logs.push(JSON.parse(s))},VERSION:'F99-TEST',
    Date:{now:(()=>{let t=0;return()=>t+=2000;})()},
  };
  vm.createContext(sandbox);
  vm.runInContext('globalThis.nav = { '+method+' };',sandbox);
  Object.assign(sandbox.nav,session);
  let result=null,error=null;
  try{ result=await sandbox.nav.freshProspectoFromHome(); }catch(e){error=e;}
  assert.equal(finalWrites,0);
  return {result,error,clicks,navDirect,logs,popup,current:sandbox.nav.page};
}
let x=await check('click-ready');
assert.equal(x.result.meta.entryPath,'HOME_CLICK_RECRUIT');
assert.equal(x.navDirect,0);assert.equal(x.clicks,1);
console.log('PASS direct menu click -> form ready');
x=await check('popup');
assert.equal(x.result.meta.entryPath,'RECRUIT_POPUP');
assert.equal(x.result.p.id,'popup');assert.equal(x.current.id,'popup');assert.equal(x.navDirect,0);
console.log('PASS recruit opens new tab: follow new form page');
x=await check('click-empty');
assert.equal(x.result.meta.entryPath,'DIRECT_URL_FALLBACK');
assert.equal(x.navDirect,1);
assert(x.logs.some(y=>y.event==='conape_recruit_navigation_fallback'));
console.log('PASS click without form -> direct navigation, no second CREATE');
x=await check('no-button');
assert.equal(x.result.meta.entryPath,'DIRECT_URL_FALLBACK');
assert.equal(x.navDirect,1);
console.log('PASS missing button -> direct form navigation');
x=await check('never');
assert.equal(x.error.code,'CONAPE_FORM_NOT_READY');
assert.equal(x.error.status,503);
assert(x.logs.some(y=>y.event==='conape_recruit_navigation_failed'&&y.pii===false));
console.log('PASS both routes invalid -> fail closed, no write');
console.log('CONAPE ONECLICK NAV F99 QA PASS (five navigation scenarios + UI contract and safety).');
