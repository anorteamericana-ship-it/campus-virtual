'use strict';
// Inject only one failed READ endpoint per browser scenario.
// All logins and remaining reads are real QA Apps Script sessions.
// This is E1 fault injection in browser, not evidence of a deployed failure.
const fs=require('node:fs'),path=require('node:path');
const [privateDir,evidenceDir]=process.argv.slice(2);
if(!privateDir||!evidenceDir)throw Error('Provide private QA directory and evidence directory');
const {chromium}=require(path.join(privateDir,'node_modules','playwright-core'));
const pass=JSON.parse(fs.readFileSync(path.join(privateDir,'credentials.json'),'utf8')).users['qa-r57-e2-s1'];
if(!pass)throw Error('QA private credential missing');
const result={scope:'F111_R57_E2_VISUAL_READ_FAILURE_E1',source:'real R57 component',
 real_students_used:false,production_writes:0,tests:[]};
(async()=>{
 const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,args:['--no-sandbox']});
 fs.mkdirSync(evidenceDir,{recursive:true});
 try{
 for(const [endpoint,expected] of [
  ['reposListarOpcionesR57','readonly_history'],
  ['reposListarCiclosR57','failclosed_no_form']
 ]){
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e.message||'error')));
  await page.route('**/macros/s/**/exec',async route=>{
   const req=route.request();let fn='';
   try{fn=JSON.parse(req.postData()||'{}').fn||'';}catch(_){}
   if(fn===endpoint){
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:false,error:'qa_read_missing_on_purpose'})});
   }else await route.continue();
  });
  const row={endpoint,expected,ok:false};
  try{
   await page.goto('http://127.0.0.1:8765/qa/f111_r57_e2_http_browser.html',{waitUntil:'networkidle',timeout:45000});
   await page.getByLabel('Usuario QA').fill('qa-r57-e2-s1');
   await page.getByLabel('Contraseña QA').fill(pass);
   await page.getByRole('button',{name:'Ingresar',exact:true}).click();
   await page.locator('[data-e2-session-role]').waitFor({timeout:45000});
   if(expected==='readonly_history'){
    const warning=page.locator('[data-r57-partial-readonly]');
    await warning.waitFor({timeout:45000});
    row.warning_visible=await warning.isVisible();
    row.history_visible=await page.getByText(/Ver historial de solicitudes/).isVisible();
    row.new_application_buttons=await page.getByRole('button',{name:/SOLICITAR REPOSICIÓN/i}).count();
    row.ok=row.warning_visible&&row.history_visible&&row.new_application_buttons===0&&errors.length===0;
    row.screenshot='F111_R57_E2_OPTIONS_FAILED_HISTORY_READONLY.png';
    await page.screenshot({path:path.join(evidenceDir,row.screenshot),fullPage:true});
   }else{
    await page.waitForTimeout(3500);
    row.requests_component_mounted=await page.locator('[data-r57-student-requests]').count()>0;
    row.new_application_buttons=await page.getByRole('button',{name:/SOLICITAR REPOSICIÓN/i}).count();
    row.ok=!row.requests_component_mounted&&row.new_application_buttons===0&&errors.length===0;
   }
  }catch(e){row.error=String(e.message||e).slice(0,200);}
  try{await page.getByRole('button',{name:'Cerrar sesión QA'}).click({timeout:12000});}
  catch(_){row.logout_unverified=true;}
  result.tests.push(row);await ctx.close();
 }
 }finally{await browser.close();}
 result.pass=result.tests.filter(x=>x.ok).length;result.fail=result.tests.length-result.pass;
 fs.writeFileSync(path.join(evidenceDir,'F111_R57_E2_NEGATIVE_UI_RESULTS.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({scope:result.scope,pass:result.pass,fail:result.fail,details:result.tests.map(x=>({endpoint:x.endpoint,ok:x.ok,error:x.error||null}))}));
 if(result.fail)process.exitCode=1;
})().catch(e=>{console.error('FAULT_INJECTION_ABORTED',String(e.message||e).slice(0,240));process.exitCode=1;});
