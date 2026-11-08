'use strict';
// Browser QA on the real R57 React components mounted in a minimal harness.
// Uses real GAS QA @3 and synthetic credentials only. Not a full Campus E2.
const fs=require('node:fs'),path=require('node:path');
const [privateDir,evidenceDir]=process.argv.slice(2);
if(!privateDir||!evidenceDir)throw Error('Usage: node browser_probe.cjs <private QA path> <evidence dir>');
const {chromium}=require(path.join(privateDir,'node_modules','playwright-core'));
const data=JSON.parse(fs.readFileSync(path.join(privateDir,'credentials.json'),'utf8'));
if(!data.qa_only)throw Error('QA credentials flag missing');
fs.mkdirSync(evidenceDir,{recursive:true});
const result={scope:'F111_R57_E2_VISUAL_QA_GAS',date_utc:new Date().toISOString(),
 browser:'headless Chrome local',backend:'Apps Script QA @4',source:'frontend PR #744',
 real_students_used:false,production_writes:0,full_campus_navigation_verified:false,
 scenarios:[]};
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function testRole(browser,key,viewport){
 const roleUser='qa-r57-e2-'+key;
 const context=await browser.newContext({viewport,acceptDownloads:false});
 const page=await context.newPage(),errors=[],failed=[];
 page.on('pageerror',err=>errors.push(String(err?.message||'pageerror').slice(0,120)));
 page.on('requestfailed',req=>{
  if(req.url().includes('script.google.com'))failed.push({method:req.method(),reason:String(req.failure()?.errorText||'NETWORK_ERROR').slice(0,100)});
 });
 const item={role:key,viewport,login:false,screen:false,requests:[],errors,failed,screenshot:null,passed:false};
 try{
  await page.goto('http://127.0.0.1:8765/qa/f111_r57_e2_http_browser.html',{waitUntil:'networkidle',timeout:45000});
  await page.locator('[data-e2-login]').waitFor({timeout:20000});
  await page.getByLabel('Usuario QA').fill(roleUser);
  await page.getByLabel('Contraseña QA').fill(data.users[roleUser]);
  await page.getByRole('button',{name:'Ingresar',exact:true}).click();
  if(await page.locator('#e2-error').count()){
    const err=await page.locator('#e2-error').textContent();
    if(err)throw Error('login error: '+err.slice(0,90));
  }
  await page.locator('[data-e2-session-role]').waitFor({timeout:60000});
  item.login=true;
  const expected={'s1':'student','t1':'teacher','super':'superadmin','ican':'teacher','ventas':'ventas'}[key];
  item.role_match=(await page.locator('[data-e2-session-role]').getAttribute('data-e2-session-role'))===expected;
  if(key==='s1'){
    await page.locator('[data-r57-student-requests]').waitFor({timeout:45000});
    item.screen=true;
  }else if(key==='t1'){
    await page.locator('[data-r57-teacher-invitations]').waitFor({timeout:60000});
    item.screen=true;
  }else if(key==='super'){
    await page.locator('[data-r57-admin-requests]').waitFor({timeout:45000});
    item.screen=true;
  }else if(key==='ventas'){
    item.screen=await page.locator('[data-e2-sales-no-access]').isVisible();
  }else if(key==='ican'){
    await sleep(4000);
    item.screen=(await page.locator('[data-r57-teacher-invitations]').count())===0;
  }
  await sleep(key==='t1'||key==='s1'?5500:2000);
  item.requests=await page.evaluate(()=>window.__e2BrowserRequests||[]);
  item.browser_errors=await page.evaluate(()=>window.__e2BrowserErrors||[]);
  const isDesktop=viewport.width>1000,suffix=(isDesktop?'desktop':'mobile');
  item.screenshot='F111_R57_E2_'+key+'_'+suffix+'.png';
  await page.screenshot({path:path.join(evidenceDir,item.screenshot),fullPage:true});
  item.passed=item.login&&item.role_match&&item.screen&&errors.length===0&&
   !item.requests.some(r=>r.status==='NETWORK_ERROR');
 }catch(e){item.error=String(e.message||e).slice(0,200);}
 try{if(item.login)await page.getByRole('button',{name:'Cerrar sesión QA'}).click({timeout:8000});}
 catch(_){item.logout_unverified=true;}
 await context.close();result.scenarios.push(item);
}
(async()=>{
 const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,args:['--no-sandbox','--disable-extensions']});
 try{
  const only=String(process.argv[4]||'all');
  if(only!=='student'){
   await testRole(browser,'t1',{width:1440,height:900});
   await testRole(browser,'super',{width:1440,height:900});
   await testRole(browser,'ican',{width:1440,height:900});
   await testRole(browser,'ventas',{width:1440,height:900});
  }
  if(only!=='others'){
   await testRole(browser,'s1',{width:1440,height:900});
   await testRole(browser,'s1',{width:390,height:844});
  }
 }finally{await browser.close();}
 result.pass=result.scenarios.filter(x=>x.passed).length;
 result.fail=result.scenarios.length-result.pass;
 fs.writeFileSync(path.join(evidenceDir,'F111_R57_E2_BROWSER_RESULTS.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({scope:result.scope,pass:result.pass,fail:result.fail,
  scenario_summary:result.scenarios.map(x=>({role:x.role,viewport:x.viewport.width,passed:x.passed,error:x.error||null,
   req:x.requests.map(r=>({fn:r.fn,status:r.status}))}))}));
 if(result.fail)process.exitCode=1;
})().catch(e=>{console.error('BROWSER_QA_FAILED',String(e.message||e).slice(0,200));process.exitCode=1;});
