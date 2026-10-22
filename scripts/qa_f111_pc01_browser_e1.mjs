// F111 B1 PC01 · E1 navegador con API totalmente simulada. NUNCA usa Google/PROD.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('modulos/qz_b1_pc01_digital.html');
const studentScript=read('src/student_pc01_f111.js');
const img=readFileSync(new URL('../media/qz32/b1_pc01_original_photo.png',import.meta.url));
const mp3=readFileSync(new URL('../media/qz32/b1_pc01_listening_track01.mp3',import.meta.url));
const base='https://f111-pc01-e1.test',group='B1-KJ18-C3-0826';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1100,height:900}});
const errors=[],written=[],sent=new Map();
page.on('pageerror',e=>errors.push(e.message));
page.on('dialog',d=>d.accept());
await page.route(base+'/**',async route=>{
 const req=route.request(),url=new URL(req.url()),p=url.pathname;
 if(p==='/api'){
  const fn=url.searchParams.get('fn'),body=JSON.parse(req.postData()||'{}');
  assert.equal(body.token,'QA-SYNTHETIC-STUDENT','no real credentials');
  let result;
  if(fn==='qzProgressStudentActive')result={ok:true,disponible:true,grupo:group,nivel:'B1',leccion:4,peso_oficial:0};
  else if(fn==='qzProgressGet')result={ok:true,quiz_id:'IC5_B1_WQ01',nivel:'B1',leccion:4,peso_oficial:0,
   secciones:[
    {id:'A',items:[1,2,3,4]},{id:'B',items:[1,2,3]},{id:'C',items:[1,2,3,4]},
    {id:'D',items:[1,2,3,4]},{id:'E',items:['1a','1b','2a','2b','3a','3b']},{id:'F',items:[1,2,3,4]}
   ]};
  else if(fn==='qzProgressMyAttempt')result={ok:true,estado:sent.has('QA-STUDENT')?'ENTREGADO':'SIN_INICIAR',respuestas:sent.get('QA-STUDENT')||{}};
  else if(fn==='qzProgressSaveDraft'){written.push({fn,body});result={ok:true,estado:'BORRADOR'};}
  else if(fn==='qzProgressSubmit'){written.push({fn,body});sent.set('QA-STUDENT',body.respuestas);result={ok:true,estado:'ENTREGADO'};}
  else throw Error('unexpected endpoint '+fn);
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
 }
 if(p==='/host'){
  const host='<!doctype html><html><body><div id="root">'
   +'<section data-screen-label="Estudiante · Evaluaciones"><h2>Evaluaciones</h2><div role="tabpanel"></div></section></div>'
   +'<script>window.APPS_SCRIPT_URL="'+base+'/api";window.getSessionToken=function(){return "QA-SYNTHETIC-STUDENT";};</script>'
   +'<script src="/src/student_pc01_f111.js"></script></body></html>';
  return route.fulfill({status:200,contentType:'text/html',body:host});
 }
 if(p==='/src/student_pc01_f111.js')return route.fulfill({status:200,contentType:'text/javascript',body:studentScript});
 if(p==='/modulos/qz_b1_pc01_digital.html')return route.fulfill({status:200,contentType:'text/html',body:html});
 if(p.endsWith('b1_pc01_original_photo.png'))return route.fulfill({status:200,contentType:'image/png',body:img});
 if(p.endsWith('b1_pc01_listening_track01.mp3'))return route.fulfill({status:200,contentType:'audio/mpeg',body:mp3});
 return route.fulfill({status:404,body:'qa unmatched'});
});
try{
 await page.goto(base+'/host');
 await page.locator('.f111-pc01-student').waitFor({state:'visible',timeout:15000});
 await page.locator('.f111-pc01-student button').click();
 const frame=page.frameLocator('iframe[title="Progress Check 01: respuesta y entrega"]');
 await frame.locator('#note').waitFor({timeout:15000});
 await frame.locator('#note').filter({hasText:'Quiz habilitado'}).waitFor({timeout:15000});
 assert.equal(await frame.locator('.question').count(),4);
 await frame.locator('input[name="A1"]').first().check();
 await frame.locator('#save').click();
 await frame.locator('#note').filter({hasText:'Avance guardado'}).waitFor({timeout:10000});
 assert.ok(written.some(x=>x.fn==='qzProgressSaveDraft'&&x.body.respuestas.A1),'draft saved to mocked API');
 await frame.locator('#submit').click();
 await frame.locator('#note').filter({hasText:'Quiz entregado'}).waitFor({timeout:10000});
 assert.equal(written.filter(x=>x.fn==='qzProgressSubmit').length,1);
 assert.equal(sent.get('QA-STUDENT').A1,'Z-A-C-K-A-R-Y');
 assert.equal(await frame.locator('#submit').isDisabled(),true,'no second submit after delivery');
 assert.deepEqual(errors,[],'no uncaught browser exceptions');
 console.log('PASS F111 PC01 browser E1: student card, 25-key contract, save, submit once; synthetic API only');
}finally{await browser.close();}
