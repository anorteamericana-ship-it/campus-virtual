// F111 D5-R3 · browser QA: B1 PC02–08 148 canonical fields, zero real writes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const html=readFileSync(new URL('../modulos/quiz_progress.html',import.meta.url),'utf8');
assert.ok(html.includes('B1_CONTROL_MODES'),'one B1 response-mode map');
assert.ok(!html.includes('_Key.pdf'),'private answer keys never published');
const fixtures={
 8:[4,5,5,4,6],13:[4,3,3,3,7,6],16:[3,2,3,3,3,3,1],
 21:[3,1,4,3,3,3],24:[3,6,1,4,1,4],
 28:[4,4,3,5,3,3],30:[4,4,4,3,4,3]
};
const typed={8:10,13:16,16:11,21:14,24:10,28:10,30:15};
const letters='ABCDEFG';
const base='https://f111-b1-qa.invalid',api=base+'/api';
const browser=await chromium.launch({headless:true});
let calls=[],attempt={},returnDelivered=false;
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route(base+'/modulos/quiz_progress.html*',r=>r.fulfill({status:200,contentType:'text/html',body:html}));
 await page.addInitScript(url=>{
  window.F111_QZ_QA_API_URL=url;
  sessionStorage.setItem('an_usuario',JSON.stringify({token:'ONLY_SYNTHETIC_QA'}));
 },api);
 await page.route(api+'*',r=>{
  const body=JSON.parse(r.request().postData()||'{}'),fn=new URL(r.request().url()).searchParams.get('fn');
  assert.equal(body.token,'ONLY_SYNTHETIC_QA');
  calls.push({fn,body});
  const lesson=Number(body.leccion),n=[4,8,13,16,21,24,28,30].indexOf(lesson)+1;
  const quiz_id='IC5_B1_WQ'+String(n).padStart(2,'0');
  const counts=fixtures[lesson]||[4,3,4,4,6,4];
  const secciones=counts.map((len,i)=>({id:letters[i],tipo_respuesta:len===1?'TEXTO_GUIADO':'ITEMS_NUMERADOS',items:len===1?[]:Array.from({length:len},(_,j)=>j+1)}));
  let data;
  if(fn==='qzProgressGet')data={ok:true,quiz_id,nivel:'B1',leccion:lesson,peso_oficial:0,disponible_hoy:true,fecha:'2026-10-24',secciones};
  else if(fn==='qzProgressMyAttempt')data={ok:true,estado:returnDelivered?'ENTREGADO':'BORRADOR',respuestas:attempt};
  else if(fn==='qzProgressPaper')data={ok:true,quiz_id,mime:'application/pdf',peso_oficial:0,pdf_base64:Buffer.from('%PDF-1.4\n%%EOF').toString('base64')};
  else if(fn==='qzProgressSaveDraft')data={ok:true,estado:'BORRADOR'};
  else data={ok:false,error:'synthetic_only'};
  return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 let sum=0;
 for(const [str,counts] of Object.entries(fixtures)){
  const lesson=Number(str);calls=[];attempt={};returnDelivered=false;
  await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-B1&nivel=B1&leccion='+lesson);
  await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
  const fields=counts.reduce((a,b)=>a+b,0),choice=fields-typed[lesson];
  assert.equal(await page.locator('#answers fieldset.f111-control').count(),choice,'choice widgets '+lesson);
  assert.equal(await page.locator('#answers textarea').count(),typed[lesson],'free-text widgets '+lesson);
  assert.equal(await page.locator('#answers [data-section],#answers fieldset.f111-control').count(),fields,'all fields '+lesson);
  assert.equal(await page.locator('#counter').innerText(),'0/'+fields+' respuestas');
  assert.ok(calls.every(c=>!['qzProgressSubmit','qzProgressSaveDraft'].includes(c.fn)),'no synthetic writes on open');
  sum+=fields;console.log('D5_B1_FIELDS_PASS L'+lesson+' fields='+fields+' choices='+choice);
 }
 assert.equal(sum,148,'exactly 148 response fields across seven quizzes');
 // Multiple-answer ceiling and serialized draft, with one field = one canonical backend key.
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-B1&nivel=B1&leccion=13');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 const check=page.locator('fieldset[data-key=C1] input');
 assert.equal(await check.count(),4);
 await check.nth(0).check();await check.nth(1).check();await check.nth(2).check();
 assert.equal(await check.nth(2).isChecked(),false,'third selection blocked in two-choice exercise');
 await page.locator('#saveBtn').click();
 await page.waitForFunction(()=>document.querySelector('#saveState').textContent.includes('guardado'));
 const saves=calls.filter(x=>x.fn==='qzProgressSaveDraft');
 assert.ok(saves.length>=1,'synthetic save');
 assert.equal(saves.at(-1).body.respuestas.C1,'1,2');
 // Existing saved draft restores selections; delivered attempt locks controls.
 attempt={C1:'1,2'};returnDelivered=true;
 await page.reload();
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 assert.equal(await page.locator('fieldset[data-key=C1] input:checked').count(),2);
 assert.equal(await page.locator('fieldset[data-key=C1] input:disabled').count(),4);
 assert.equal(await page.locator('#submitBtn').isDisabled(),true);
 // Teacher preview never queries student attempts or writes.
 calls=[];returnDelivered=false;
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-B1&nivel=B1&leccion=13&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 assert.equal(await page.locator('#answers fieldset.f111-control input:not(:disabled)').count(),0);
 assert.equal(await page.locator('#saveBtn').isDisabled(),true);
 assert.equal(calls.some(c=>/MyAttempt|SaveDraft|Submit/.test(c.fn)),false);
 console.log('D5_B1_INTERACTIVE_QA_PASS 148 fields; 2-choice ceiling; save/restore; lock; teacher preview');
}finally{await browser.close();}
