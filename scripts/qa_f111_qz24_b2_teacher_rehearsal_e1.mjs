// F111 QZ24 B2 PC01–PC04: ensayo docente REALMENTE rellenable,
// pero aislado: ningún token ni petición a Apps Script productivo.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const html=readFileSync(new URL('../modulos/quiz_progress.html',import.meta.url),'utf8');
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/qz24_b2_sections_e1.json',import.meta.url),'utf8'));
const base='https://f111-qz24-synthetic.invalid',api=base+'/api';
const lessons=[4,8,13,16,21,24,28,30];
const counts=[25,25,22,23,25,22,25,25],choiceCounts=[8,13,8,10,14,9,14,7];
const browser=await chromium.launch({headless:true});
let calls=[],preview=true,audioVerified=false;
try{
 const page=await browser.newPage({viewport:{width:440,height:880}});
 page.on('dialog',d=>d.accept());
 await page.route(base+'/modulos/quiz_progress.html*',route=>
  route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));
 await page.addInitScript(url=>{
  window.F111_QZ_QA_API_URL=url;
  sessionStorage.setItem('an_usuario',JSON.stringify({token:'SYNTHETIC_TEACHER_ONLY'}));
 },api);
 await page.route(api+'*',route=>{
  const fn=new URL(route.request().url()).searchParams.get('fn');
  const body=JSON.parse(route.request().postData()||'{}');
  assert.equal(body.token,'SYNTHETIC_TEACHER_ONLY');
  calls.push({fn,body});
  const i=lessons.indexOf(Number(body.leccion)),id='IC5_B2_WQ'+String(i+1).padStart(2,'0');
  let result={ok:false,error:'unhandled_synthetic'};
  if(fn==='qzProgressGet')result={ok:true,quiz_id:id,nivel:'B2',leccion:lessons[i],peso_oficial:0,
   disponible_hoy:true,fecha:'2026-11-14',secciones:fixtures[id],
   listening:{pista:i+2,grabacion_disponible:audioVerified}};
  if(fn==='qzProgressPaper')result={ok:true,quiz_id:id,mime:'application/pdf',peso_oficial:0,
   pdf_base64:Buffer.from('%PDF-1.4\n%%EOF').toString('base64')};
  if(fn==='qzProgressMyAttempt')result={ok:true,estado:'BORRADOR',respuestas:{}};
  if(fn==='qzProgressSaveDraft')result={ok:true,estado:'BORRADOR'};
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
 });
 for(let i=0;i<8;i++){
  calls=[];preview=true;audioVerified=false;
  await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-B2&nivel=B2&leccion='+lessons[i]+'&teacher_preview=1');
  await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
  const fields=page.locator('#answers textarea[data-section],#answers fieldset.f111-control');
  assert.equal(await fields.count(),counts[i],'B2 '+(i+1)+' field count');
  const choices=page.locator('#answers fieldset.f111-control');
  assert.equal(await choices.count(),choiceCounts[i],'B2 '+(i+1)+' choice controls');
  assert.equal(await page.locator('#answers textarea[data-section]').count(),counts[i]-choiceCounts[i]);
  assert.equal(await page.locator('#counter').innerText(),'0/'+counts[i]+' respuestas');
  assert.equal(await page.locator('#saveBtn').isDisabled(),true,'teacher rehearsal must not save');
  assert.equal(await page.locator('#submitBtn').isDisabled(),true,'teacher rehearsal must not submit');
  assert.equal(await page.locator('fieldset.f111-control input:not(:disabled)').count()>0,true,
    'teacher rehearsal must be interactive');
  assert.ok(calls.every(x=>['qzProgressGet','qzProgressPaper'].includes(x.fn)),
    'private rehearsal makes no attempt or write calls');
  console.log('QZ24_B2_BROWSER_PC'+String(i+1).padStart(2,'0')+'_PASS fields='+counts[i]);
 }
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-B2&nivel=B2&leccion=4&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 assert.equal(await page.locator('textarea[data-section="C1a"]').count(),1);
 assert.equal(await page.locator('textarea[data-section="C2b"]').count(),1);
 await page.locator('textarea[data-section="C1a"]').fill('respuesta sintética');
 assert.match(await page.locator('#counter').innerText(),/^1\/25/);
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-B2&nivel=B2&leccion=13&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 const g=page.locator('fieldset[data-key="G"] input');
 assert.equal(await g.count(),8);
 for(let i=0;i<4;i++)await g.nth(i).check();
 await g.nth(4).click();
 assert.equal(await g.nth(4).isChecked(),false,'fifth item beyond 4 disallowed');
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-B2&nivel=B2&leccion=16&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 const a2=page.locator('fieldset[data-key="A2"] input');
 assert.equal(await a2.count(),4);
 await a2.nth(0).check();await a2.nth(1).check();await a2.nth(2).click();
 assert.equal(await a2.nth(2).isChecked(),false,'weather pair cap 2');
 const e=page.locator('fieldset[data-key="E"] input');
 assert.equal(await e.count(),10);
 for(let i=0;i<4;i++)await e.nth(i).check();
 await e.nth(4).click();
 assert.equal(await e.nth(4).isChecked(),false,'reading cap 4');
 assert.ok(calls.every(x=>!['qzProgressSaveDraft','qzProgressSubmit','qzProgressMyAttempt'].includes(x.fn)),
  'teacher interaction never persists an attempt');

 // Verify the remaining four examinations' compound fields and choice limits.
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-B2&nivel=B2&leccion=21&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 assert.equal(await page.locator('textarea[data-section="E1a"]').count(),1);
 assert.equal(await page.locator('textarea[data-section="E2b"]').count(),1);
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-B2&nivel=B2&leccion=24&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 const g6=page.locator('fieldset[data-key="G"] input');
 assert.equal(await g6.count(),10,'PC06 four correct choices from ten');
 for(let k=0;k<4;k++)await g6.nth(k).check();
 await g6.nth(4).click();
 assert.equal(await g6.nth(4).isChecked(),false,'PC06 fifth choice blocked');
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-B2&nivel=B2&leccion=28&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 assert.equal(await page.locator('textarea[data-section="D4"]').count(),1,'PC07 fourth dialogue gap');
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-B2&nivel=B2&leccion=30&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 assert.equal(await page.locator('fieldset[data-key="A1a"] input').count(),4,'PC08 first invitation');
 assert.equal(await page.locator('textarea[data-section="B3b"]').count(),1,'PC08 third dialogue second answer');
 assert.equal(await page.locator('textarea[data-section="F2b"]').count(),1,'PC08 second future plan');
 assert.equal(await page.locator('fieldset.f111-control input:not(:disabled)').count()>0,true,'PC08 teacher preview interactive');
 assert.ok(calls.every(x=>!['qzProgressSubmit','qzProgressSaveDraft','qzProgressMyAttempt'].includes(x.fn)),
   'teacher rehearsal never writes student records even on PC08');

 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-B2&nivel=B2&leccion=4');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 await page.locator('textarea[data-section="C1a"]').fill('texto ficticio');
 assert.equal(await page.locator('#submitBtn').isDisabled(),true,'missing required quiz audio FAIL CLOSED');
 console.log('F111_QZ24_B2_BROWSER_E1_PASS 8/8; 192 fields; multi-choice caps; teacher rehearsal NO writes; absent audio blocks student submit');
}finally{await browser.close();}
