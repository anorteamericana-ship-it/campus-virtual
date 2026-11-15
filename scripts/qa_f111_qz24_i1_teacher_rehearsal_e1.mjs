// F111 QZ24 — Intermedio I: 8 quizzes completos renderizados en Chromium,
// con un ensayo docente que NO crea intentos ni abre el quiz a estudiantes.
// Datos sintéticos: no sesión real, no preguntas Cambridge ni claves.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const html=readFileSync(new URL('../modulos/quiz_progress.html',import.meta.url),'utf8');
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/qz24_i1_sections_e1.json',import.meta.url),'utf8'));
const base='https://f111-i1-e1.invalid',api=base+'/api';
const lessons=[4,8,13,16,21,24,28,30];
const fields=[25,25,25,26,25,29,25,29];
const choices=[11,9,14,17,25,12,15,8];
const browser=await chromium.launch({headless:true});
let calls=[],audioVerified=true;
try{
 const page=await browser.newPage({viewport:{width:425,height:870}});
 page.on('dialog',d=>d.accept());
 await page.route(base+'/modulos/quiz_progress.html*',route=>
   route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));
 await page.addInitScript(url=>{
  window.F111_QZ_QA_API_URL=url;
  sessionStorage.setItem('an_usuario',JSON.stringify({token:'SYNTHETIC_I1_TEACHER'}));
 },api);
 await page.route(api+'*',route=>{
  const fn=new URL(route.request().url()).searchParams.get('fn');
  const body=JSON.parse(route.request().postData()||'{}');
  assert.equal(body.token,'SYNTHETIC_I1_TEACHER');
  calls.push(fn);
  const i=lessons.indexOf(Number(body.leccion)),id='IC5_I1_WQ'+String(i+1).padStart(2,'0');
  let result={ok:false,error:'unhandled_synthetic'};
  if(fn==='qzProgressGet')result={ok:true,quiz_id:id,nivel:'I1',leccion:lessons[i],peso_oficial:0,
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
  await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-I1&nivel=I1&leccion='+lessons[i]+'&teacher_preview=1');
  await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null && !document.querySelector('#originalAudioBox').hidden);
  const inputs=page.locator('#answers textarea[data-section],#answers fieldset.f111-control');
  const choice=page.locator('#answers fieldset.f111-control');
  assert.equal(await inputs.count(),fields[i],'I1 PC'+(i+1)+' exact fields');
  assert.equal(await choice.count(),choices[i],'I1 PC'+(i+1)+' choice widgets');
  assert.equal(await page.locator('#answers textarea[data-section]').count(),fields[i]-choices[i]);
  assert.equal(await page.locator('#counter').innerText(),'0/'+fields[i]+' respuestas');
  assert.equal(await page.locator('#saveBtn').isDisabled(),true,'rehearsal must never save');
  assert.equal(await page.locator('#submitBtn').isDisabled(),true,'rehearsal must never submit');
  assert.ok((await page.locator('fieldset.f111-control input:not(:disabled)').count())>0,
    'teacher must be able to answer');
  assert.match(await page.locator('#originalAudioPlayer').getAttribute('src'),/^blob:/,'protected MP3 bound');
  assert.equal(calls.filter(fn=>fn==='qzProgressAudio').length,1,'one authenticated MP3 read per preview');
  assert.ok(calls.every(fn=>['qzProgressGet','qzProgressPaper','qzProgressAudio'].includes(fn)),
    'teacher preview is read-only on the server');
  console.log('F111_QZ24_I1_BROWSER_PC'+String(i+1).padStart(2,'0')+'_PASS fields='+fields[i]);
 }
 // PC02: four true statements in eight candidates; fifth must be blocked.
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-I1&nivel=I1&leccion=8&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 const g2=page.locator('fieldset[data-key="G"] input');
 assert.equal(await g2.count(),8);
 for(let i=0;i<4;i++)await g2.nth(i).check();
 await g2.nth(4).click();
 assert.equal(await g2.nth(4).isChecked(),false,'fifth reading option blocked');
 // PC03: double dialog responses are independently editable.
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-I1&nivel=I1&leccion=13&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 assert.equal(await page.locator('textarea[data-section="B1a"]').count(),1);
 assert.equal(await page.locator('textarea[data-section="B2b"]').count(),1);
 await page.locator('textarea[data-section="B1a"]').fill('respuesta ficticia');
 assert.match(await page.locator('#counter').innerText(),/^1\/25/);
 // PC04: four matching fields + four free-response sentences.
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-I1&nivel=I1&leccion=16&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 assert.equal(await page.locator('fieldset[data-key="E1a"] input').count(),4);
 assert.equal(await page.locator('textarea[data-section="E1b"]').count(),1);
 assert.equal(await page.locator('fieldset[data-key="E4a"] input').count(),4);
 assert.equal(await page.locator('textarea[data-section="E4b"]').count(),1);
 const f4=page.locator('fieldset[data-key="F"] input');
 assert.equal(await f4.count(),8);
 for(let i=0;i<4;i++)await f4.nth(i).check();
 await f4.nth(4).click();assert.equal(await f4.nth(4).isChecked(),false);
 // PC06: six gaps in three clauses; 26 points, not silently normalized to 25.
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-I1&nivel=I1&leccion=24&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 assert.equal(await page.locator('textarea[data-section="E1a"]').count(),1);
 assert.equal(await page.locator('textarea[data-section="E3b"]').count(),1);
 // PC08: seven reported-speech statements, 6 printed source points.
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-I1&nivel=I1&leccion=30&teacher_preview=1');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 assert.equal(await page.locator('textarea[data-section="E1"]').count(),1);
 assert.equal(await page.locator('textarea[data-section="E7"]').count(),1);
 await page.locator('textarea[data-section="E7"]').fill('ensayo docente sin envío');
 assert.match(await page.locator('#counter').innerText(),/^1\/29/);
 assert.ok(calls.every(fn=>!['qzProgressSaveDraft','qzProgressSubmit','qzProgressMyAttempt'].includes(fn)),
   'no real quiz attempts or student writes in teacher rehearsal');
 // Without authorized assessment audio, a student may draft but never submit.
 audioVerified=false; // student route must not submit without verified audio
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-I1&nivel=I1&leccion=4');
 await page.waitForFunction(()=>document.querySelector('#pdfBox iframe')!==null);
 await page.locator('textarea[data-section="B1"]').fill('respuesta sintética');
 assert.equal(await page.locator('#submitBtn').isDisabled(),true,'audio absent: fail closed');
 console.log('F111_QZ24_I1_BROWSER_E1_PASS 8/8; 209 response fields; 111 choice widgets; teacher rehearsal zero writes');
}finally{await browser.close();}
