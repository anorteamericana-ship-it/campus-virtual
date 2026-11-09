'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const [privateDir,reportDir]=process.argv.slice(2);
if(!privateDir||!reportDir)throw Error('NEED_PRIVATE_PLAYWRIGHT_DIRECTORY_AND_EVIDENCE');
const {chromium}=require(path.join(privateDir,'node_modules','playwright-core'));
fs.mkdirSync(reportDir,{recursive:true});
const scenarios=[
 {name:'pending',response:{ok:true,status:'SUBMITTED',reposicion_sync_pending:true},
  expected:'sent',pending:true},
 {name:'normal',response:{ok:true,status:'SUBMITTED'},expected:'sent',pending:false},
 {name:'failed',response:{ok:false,error:'SERVER_TIMEOUT'},expected:'taking',pending:false}
];
const cases=[],output={scope:'F111_R57_WRITTEN_UI_SYNC_WARNING_REAL_REACT_CHROME',
  date:'2026-11-08',production_writes:0,backend_requests:0,
  full_campus_or_api_verified:false,cases};
(async()=>{
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
 headless:true,args:['--no-sandbox','--disable-extensions']});
try{
 for(const s of scenarios){
  const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  p.on('pageerror',e=>errors.push(String(e.message||e)));
  const item={scenario:s.name,result:'FAIL'};
  try{
   await p.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:8773/')?
    route.continue():route.abort());
   await p.goto('http://127.0.0.1:8773/qa/f111_r57_exam_sync_harness.html',
    {waitUntil:'load',timeout:45000});
   await p.waitForFunction('window.__qaReady||window.__syncQaErrors.length>0',{timeout:40000});
   assert.deepEqual(await p.evaluate(()=>window.__syncQaErrors),[]);
   await p.evaluate(value=>{window.__qaResponse=value;},s.response);
   await p.getByRole('button',{name:'Enviar examen',exact:true}).click({timeout:10000});
   await p.waitForTimeout(600);
   const sent=await p.getByText('Examen enviado',{exact:true}).count();
   const banner=await p.locator('[data-r57-sync-pending]').count();
   const error=await p.getByText('No se pudo enviar el examen. Intentá nuevamente.',{exact:false}).count();
   item.sent=sent;item.pending_banner=banner;item.submit_error=error;
   item.no_page_errors=errors.length===0;
   assert.equal(sent,s.expected==='sent'?1:0);
   assert.equal(banner,s.pending?1:0);
   assert.equal(error,s.expected==='taking'?1:0);
   assert.equal(errors.length,0);
   const body=await p.locator('body').innerText();
   if(s.pending){
    assert(body.includes('Entrega confirmada. Actualización de reposición pendiente.'));
    assert(body.includes('No volvás a contestarlo'));
   }
   if(s.name==='normal')assert(!body.includes('Actualización de reposición pendiente.'));
   item.result='PASS';
   item.screenshot='F111_R57_exam_sync_'+s.name+'.png';
   await p.screenshot({path:path.join(reportDir,item.screenshot),fullPage:true});
  }catch(err){item.error=String(err.message||err).slice(0,260);}
  cases.push(item);console.log(item.result+' '+s.name);
  await p.close();
 }
}finally{await browser.close();}
output.pass=cases.filter(c=>c.result==='PASS').length;
output.fail=cases.filter(c=>c.result!=='PASS').length;
fs.writeFileSync(path.join(reportDir,'F111_R57_EXAM_SYNC_UI_BROWSER.json'),JSON.stringify(output,null,2)+'\n');
console.log('F111_R57_EXAM_SYNC_UI_BROWSER '+output.pass+'/'+cases.length);
if(output.fail)process.exitCode=1;
})().catch(e=>{console.log('FATAL_QA_BROWSER_ERROR',String(e.message||e));process.exitCode=1;});
