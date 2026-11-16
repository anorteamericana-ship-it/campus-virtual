// F111 R30 · synthetic browser acceptance of superadmin-only admin quiz entry.
// No real accounts, no login tokens, no Google API calls, no real quiz data writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
const base=process.cwd();
const html=fs.readFileSync('modulos/examenes.html','utf8');
const script=fs.readFileSync('src/f111_qz24_superadmin_preview.js','utf8');
assert.match(html,/src\/f111_qz24_superadmin_preview\.js\?v=F111R30ADMINPREVIEW20261116/);
assert.match(script,/data\.vista_previa!==true\|\|data\.peso_oficial!==0/);
assert.match(script,/parentSuperadmin/);
assert.match(script,/sesion|session/i);
assert.match(script,/qzProgressGet/);
assert.match(script,/qz24_preview/);
assert.match(script,/teacher_preview/);
assert.doesNotMatch(script,/fn:'(?:qzProgressSubmit|qzProgressSaveDraft|examCreateActivation)'/);
assert.doesNotMatch(script,/url\.searchParams\.set\('token'/);
console.log('F111_R30_ADMIN_QZ24_STATIC_PASS 9/9; admin-only, preview GET, no writes');
if(process.env.F111_BROWSER!=='1')process.exit(0);
const {chromium}=await import('playwright');
const mime={'.html':'text/html; charset=utf-8','.jsx':'text/plain; charset=utf-8',
 '.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const fixture=(role)=>'<!doctype html><html lang="es"><meta charset="utf-8"><body>'+
 '<script src="/vendor/react.js"></script>'+
 '<script src="/vendor/react-dom.js"></script>'+
 '<script src="/vendor/babel.js"></script>'+
 '<script>window.getSesion=()=>({rol:'+JSON.stringify(role)+'});window.getSessionToken=()=>'+
 JSON.stringify('SYNTHETIC_QA_TOKEN')+';window.APPS_SCRIPT_URL="";</script>'+
 '<iframe id="exam" style="width:100%;height:1700px;border:0" src="/modulos/examenes.html?view=admin"></iframe></body></html>';
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1');
 if(u.pathname==='/__qa/admin'){
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end(fixture(u.searchParams.get('role')==='superadmin'?'superadmin':'admin'));return;
 }
 const relative=decodeURIComponent(u.pathname).replace(/^\/+/,'');
 const filename=path.resolve(base,relative);
 if(!filename.startsWith(base+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){
  res.writeHead(404);res.end('Not found');return;
 }
 res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream'});
 fs.createReadStream(filename).pipe(res);
});
await new Promise((ok)=>server.listen(0,'127.0.0.1',ok));
const port=server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const calls=[];
 await page.route('https://script.google.com/macros/s/**',async route=>{
  const data=JSON.parse(route.request().postData()||'{}');
  calls.push({fn:data.fn,nivel:data.nivel,grupo:data.cod_grupo,
   method:route.request().method(),safe:!route.request().url().includes('SYNTHETIC_QA_TOKEN')});
  if(data.fn==='qzProgressGet'){
   await route.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify({ok:true,quiz_id:'IC5_B2_WQ01',nivel:'B2',leccion:4,
     peso_oficial:0,vista_previa:true,disponible_hoy:false,
     secciones:[{id:'A',tipo_respuesta:'TEXTO_GUIADO',items:[]}],fecha:'',
     listening:{pista:1,grabacion_disponible:true}})});return;
  }
  await route.fulfill({status:200,contentType:'application/json',
   body:JSON.stringify({ok:false,error:'SYNTHETIC_NO_REAL_MEDIA'})});
 });
 await page.goto('http://127.0.0.1:'+port+'/__qa/admin?role=superadmin');
 const frame=page.frameLocator('#exam');
 await frame.getByRole('heading',{name:'Centro de exámenes'}).waitFor({timeout:60000});
 assert.equal(await frame.locator('[data-f111-qz24-superadmin-preview]').count(),0,'not in Escritos tab');
 await frame.getByRole('tab',{name:/Progress Check/}).click();
 await frame.locator('[data-f111-qz24-superadmin-preview]').waitFor({timeout:10000});
 assert.equal(await frame.getByRole('heading',{name:'Ensayo interactivo · Progress Checks'}).count(),1,
  'superadmin sees the rehearsal INSIDE their own center');
 await frame.locator('[data-f111-qz24-group]').fill('B2-LM69-C2-0526');
 await frame.getByRole('button',{name:'Abrir ensayo docente'}).click();
 assert.match(await frame.locator('[data-f111-qz24-superadmin-preview] [role=status]').innerText(),
  /Básico I|B1|B2, I1 e I2/,'B1 remains separate');
 assert.equal(calls.length,0,'B1 preview does not call new API');
 await frame.locator('.d1-pc .d1-level-select').nth(1).click();
 await frame.getByRole('button',{name:'Abrir ensayo docente'}).click();
 await page.locator('[data-f111-qz24-superadmin-modal]').waitFor({timeout:10000});
 assert.equal(calls[0].fn,'qzProgressGet','only read-only endpoint before opening');
 assert.equal(calls[0].nivel,'B2');
 assert.equal(calls[0].grupo,'B2-LM69-C2-0526');
 assert.equal(calls[0].method,'POST');
 assert.ok(calls.every(x=>x.safe),'token never inserted in URL');
 assert.equal(await page.locator('[data-f111-qz24-superadmin-modal] iframe').count(),1);
 const url=await page.locator('[data-f111-qz24-superadmin-modal] iframe').getAttribute('src');
 assert.match(url,/teacher_preview=1/);
 assert.match(url,/qz24_preview=1/);
 assert.doesNotMatch(url,/SYNTHETIC_QA_TOKEN/);
 assert.ok(!calls.some(x=>/SaveDraft|Submit|CreateActivation/.test(x.fn)),'no mutations');
 await page.locator('[data-f111-qz24-superadmin-modal] button').click();
 assert.equal(await page.locator('[data-f111-qz24-superadmin-modal]').count(),0);
 await frame.getByRole('tab',{name:/Escritos/}).click();
 assert.equal(await frame.locator('[data-f111-qz24-superadmin-preview]').count(),0,'not in Escritos');
 assert.deepEqual(errors,[],'no browser JavaScript errors');
 await page.close();
 const ordinary=await browser.newPage({viewport:{width:1280,height:900}});
 await ordinary.goto('http://127.0.0.1:'+port+'/__qa/admin?role=admin');
 const normalFrame=ordinary.frameLocator('#exam');
 await normalFrame.locator('.ad-head').waitFor({timeout:60000});
 assert.equal(await normalFrame.locator('[data-f111-qz24-superadmin-preview]').count(),0,
  'ordinary admin cannot see the new superadmin panel');
 await ordinary.close();
 console.log('F111_R30_ADMIN_QZ24_BROWSER_PASS; superadmin sees button, B1 blocked, B2 opens, no writes, admin hidden');
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
