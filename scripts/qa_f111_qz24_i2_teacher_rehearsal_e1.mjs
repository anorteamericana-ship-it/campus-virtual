// F111 QZ24 · Intermedio II: 8 quizzes en Chromium, 191 respuestas.
// Ensayo privado sin crear intentos ni permitir envíos a estudiantes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const html=readFileSync(new URL('../modulos/quiz_progress.html',import.meta.url),'utf8');
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/qz24_i2_sections_e1.json',import.meta.url),'utf8'));
const base='https://f111-i2-e1.invalid',api=base+'/api';
const lessons=[4,8,13,16,21,24,28,30];
const fields=[23,26,25,23,24,22,26,22];
const choices=[13,7,13,9,8,15,17,9];
const browser=await chromium.launch({headless:true});
let calls=[],audioVerified=true;
try{
 const page=await browser.newPage({viewport:{width:425,height:870}});
 page.on('dialog',d=>d.accept());
 await page.route(base+'/modulos/quiz_progress.html*',route=>
  route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));
 await page.addInitScript(url=>{
  window.F111_QZ_QA_API_URL=url;
  sessionStorage.setItem('an_usuario',JSON.stringify({token:'SYNTHETIC_I2_TEACHER'}));
 },api);
 await page.route(api+'*',route=>{
  const fn=new URL(route.request().url()).searchParams.get('fn');
  const body=JSON.parse(route.request().postData()||'{}');
  assert.equal(body.token,'SYNTHETIC_I2_TEACHER');
  calls.push(fn);
  const i=lessons.indexOf(Number(body.leccion)),id='IC5_I2_WQ'+String(i+1).padStart(2,'0');
  let result={ok:false,error:'not_available_in_synthetic_mode'};
  if(fn==='qzProgressGet')result={ok:true,quiz_id:id,nivel:'I2',leccion:lessons[i],peso_oficial:0,
   disponible_hoy:false,fecha:'',ensayo_sin_calendario:true,secciones:fixtures[id],
   listening:{pista:i+2,grabacion_disponible:audioVerified}};
  if(fn==='qzProgressPaper')result={ok:true,quiz_id:id,mime:'application/pdf',peso_oficial:0,
   pdf_base64:Buffer.from('%PDF-1.4\n%%EOF').toString('base64')};
  if(fn==='qzProgressAudio')result={ok:true,quiz_id:id,mime:'audio/mpeg',peso_oficial:0,
   pista:i+2,audio_base64:Buffer.concat([Buffer.from('ID3'),Buffer.alloc(1536)]).toString('base64')};
  if(fn==='qzProgressMyAttempt')result={ok:true,estado:'BORRADOR',respuestas:{}};
  if(fn==='qzProgressSaveDraft')result={ok:true,estado:'BORRADOR'};
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
 });
 for(let i=0;i<8;i++){
  calls=[];
  await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-I2&nivel=I2&leccion='+lessons[i]+'&teacher_preview=1');
  await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null && !document.querySelector('#originalAudioBox').hidden);
  const all=page.locator('#answers textarea[data-section],#answers fieldset.f111-control');
  assert.equal(await all.count(),fields[i],'I2 PC'+(i+1)+' all fields');
  assert.equal(await page.locator('#answers fieldset.f111-control').count(),choices[i],'I2 PC'+(i+1)+' option widgets');
  assert.equal(await page.locator('#answers textarea[data-section]').count(),fields[i]-choices[i]);
  assert.equal(await page.locator('#counter').innerText(),'0/'+fields[i]+' respuestas');
  assert.equal(await page.locator('#saveBtn').isDisabled(),true,'teacher preview never saves');
  assert.equal(await page.locator('#submitBtn').isDisabled(),true,'teacher preview never submits');
  assert.ok((await page.locator('fieldset.f111-control input:not(:disabled)').count())>0,'teacher can answer');
  assert.match(await page.locator('#originalAudioPlayer').getAttribute('src'),/^blob:/,'protected MP3 bound');
  assert.equal(calls.filter(fn=>fn==='qzProgressAudio').length,1,'one authenticated MP3 read per preview');
  assert.ok(calls.every(fn=>['qzProgressGet','qzProgressPaper','qzProgressAudio'].includes(fn)),
   'no student read/write endpoint requested by teacher');
  console.log('F111_QZ24_I2_BROWSER_PC'+String(i+1).padStart(2,'0')+'_PASS fields='+fields[i]);
 }
 // WQ01: each item is both one option and one written sentence, reading 3/6.
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-I2&nivel=I2&leccion=4&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 assert.equal(await page.locator('fieldset[data-key="B1a"] input').count(),3);
 assert.equal(await page.locator('textarea[data-section="B1b"]').count(),1);
 assert.equal(await page.locator('textarea[data-section="B4b"]').count(),1);
 const f1=page.locator('fieldset[data-key="F"] input');
 assert.equal(await f1.count(),6);
 for(let i=0;i<3;i++)await f1.nth(i).check();
 await f1.nth(3).click();assert.equal(await f1.nth(3).isChecked(),false);
 // WQ02: nine score points but TEN independent physical blanks.
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-I2&nivel=I2&leccion=8&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 assert.equal(await page.locator('textarea[data-section="E1"]').count(),1);
 assert.equal(await page.locator('textarea[data-section="E10"]').count(),1);
 await page.locator('textarea[data-section="E10"]').fill('texto de prueba');
 assert.match(await page.locator('#counter').innerText(),/^1\/26/);
 // WQ04: multi true statements in original three-page exam.
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-I2&nivel=I2&leccion=16&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 assert.equal(await page.locator('textarea[data-section="E4"]').count(),1);
 const f4=page.locator('fieldset[data-key="F"] input');assert.equal(await f4.count(),6);
 // WQ05: 5 source blanks with four printed points.
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-I2&nivel=I2&leccion=21&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 assert.equal(await page.locator('textarea[data-section="F5"]').count(),1);
 assert.equal(await page.locator('fieldset[data-key="G"] input').count(),6);
 // WQ06: four correct choices from eight in reading.
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-I2&nivel=I2&leccion=24&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 const b6=page.locator('fieldset[data-key="B"] input');assert.equal(await b6.count(),8);
 for(let i=0;i<4;i++)await b6.nth(i).check();
 await b6.nth(4).click();assert.equal(await b6.nth(4).isChecked(),false);
 // WQ07: four passive-form gaps, source prints three points.
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-I2&nivel=I2&leccion=28&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 assert.equal(await page.locator('textarea[data-section="D4"]').count(),1);
 assert.equal(await page.locator('fieldset[data-key="C5"] input').count(),5);
 // WQ08: 4 correct statements among seven.
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-I2&nivel=I2&leccion=30&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 const b8=page.locator('fieldset[data-key="B"] input');assert.equal(await b8.count(),7);
 for(let i=0;i<4;i++)await b8.nth(i).check();
 await b8.nth(4).click();assert.equal(await b8.nth(4).isChecked(),false);
 assert.ok(calls.every(fn=>!['qzProgressSaveDraft','qzProgressSubmit','qzProgressMyAttempt'].includes(fn)),
  'teacher preview does not create student attempts on all I2 levels');
 // Student blocked from submitting when the assessment MP3 is unavailable.
 audioVerified=false; // student route must not submit without verified audio
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-I2&nivel=I2&leccion=4');
 await page.waitForFunction(()=>document.querySelector('#answers textarea, #answers fieldset.f111-control')!==null);
 assert.equal(await page.locator('#pdfBox iframe').count(),0,'future student cannot access protected PDF');
 assert.equal(await page.locator('textarea[data-section="B1b"]').isEditable(),false,'future student cannot enter responses');
 assert.equal(await page.locator('#submitBtn').isDisabled(),true,'missing audio blocks submission');
 console.log('F111_QZ24_I2_BROWSER_E1_PASS 8/8; 191 response fields; 91 choice controls; no real writes');
}finally{await browser.close();}
