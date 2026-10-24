// F111 D5 B1 · Playwright aislado: ocho MP3 originales por endpoint ficticio.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const source=fs.readFileSync(new URL('../modulos/quiz_progress.html',import.meta.url),'utf8');
const preview=fs.readFileSync(new URL('../modulos/qz_b1_pc02_preview.html',import.meta.url),'utf8');
assert.match(source,/qzProgressAudio/,'backend protected audio endpoint');
assert.match(source,/audioRequired&&!audioReady/,'cannot submit without required listening');
assert.match(source,/teacherPreview/,'authenticated teacher read-only preview');
assert.match(preview,/Pista original 02 localizada/,'correct source track 02 (not 03)');
assert.doesNotMatch(source,/[a-zA-Z0-9_-]{30,}\.mp3/,'no Drive binary or direct MP3 links in frontend');
const base='https://b1-audio-synthetic.invalid';
const pdf=Buffer.from('%PDF-1.4\n%QZ-B1-SYNTHETIC\n'+('fake '.repeat(25))+'\n%%EOF').toString('base64');
const audio=Buffer.concat([Buffer.from('ID3','ascii'),Buffer.alloc(1600)]).toString('base64');
const browser=await chromium.launch({headless:true});
let badAudio=false, calls=[],apiUrl=base+'/api';
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 page.on('dialog',dlg=>dlg.dismiss());
 await page.route(base+'/modulos/quiz_progress.html*',r=>r.fulfill({status:200,contentType:'text/html',body:source}));
 await page.route(apiUrl+'*',route=>{
  const body=JSON.parse(route.request().postData()||'{}');
  const fn=new URL(route.request().url()).searchParams.get('fn');
  calls.push(fn);
  assert.equal(body.token,'SYNTHETIC_TOKEN_ONLY');
  const n=[4,8,13,16,21,24,28,30].indexOf(Number(body.leccion))+1;
  const id='IC5_B1_WQ'+String(n).padStart(2,'0');
  let data;
  if(fn==='qzProgressGet')data={ok:true,quiz_id:id,nivel:'B1',leccion:body.leccion,peso_oficial:0,
   fecha:'2026-10-24',disponible_hoy:true,secciones:[{id:'A',tipo_respuesta:'ITEMS_NUMERADOS',items:[1,2,3,4]},{id:'B',tipo_respuesta:'TEXTO_GUIADO',items:[]}],
   listening:{pista:n,grabacion_disponible:true}};
  else if(fn==='qzProgressMyAttempt')data={ok:true,estado:'SIN_INICIAR',respuestas:{}};
  else if(fn==='qzProgressPaper')data={ok:true,quiz_id:id,mime:'application/pdf',peso_oficial:0,pdf_base64:pdf};
  else if(fn==='qzProgressAudio')data={ok:true,quiz_id:id,mime:badAudio?'text/html':'audio/mpeg',peso_oficial:0,pista:n,audio_base64:audio};
  else data={ok:false,error:'write_forbidden_in_synthetic_qa'};
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.addInitScript(url=>{
  window.F111_QZ_QA_API_URL=url;
  sessionStorage.setItem('an_usuario',JSON.stringify({token:'SYNTHETIC_TOKEN_ONLY'}));
 },apiUrl);
 for(const leccion of [4,8,13,16,21,24,28,30]){
  calls=[];
  const i=[4,8,13,16,21,24,28,30].indexOf(leccion)+1;
  await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-SYNTH-GROUP&nivel=B1&leccion='+leccion);
  await page.waitForFunction(()=>!document.querySelector('#originalAudioBox').hidden);
  assert.equal(await page.locator('#originalAudioPlayer').count(),1);
  assert.match(await page.locator('#originalAudioPlayer').getAttribute('src'),/^blob:/);
  assert.match(await page.locator('#originalAudioTitle').innerText(),new RegExp('pista original '+i));
  assert.equal(await page.locator('#pdfBox iframe').count(),1,'private quiz PDF loaded');
  assert.deepEqual(calls,['qzProgressGet','qzProgressMyAttempt','qzProgressPaper','qzProgressAudio']);
  console.log('B1_AUDIO_PASS '+i+' L'+leccion);
 }
 calls=[];
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-SYNTH-GROUP&nivel=B1&leccion=8&teacher_preview=1');
 await page.waitForFunction(()=>!document.querySelector('#originalAudioBox').hidden);
 assert.equal(await page.locator('#saveBtn').isDisabled(),true);
 assert.equal(await page.locator('#submitBtn').isDisabled(),true);
 assert.equal(calls.includes('qzProgressMyAttempt'),false,'teacher preview cannot read student attempts');
 assert.equal(calls.includes('qzProgressSubmit'),false);
 assert.equal(calls.includes('qzProgressSaveDraft'),false);
 badAudio=true;calls=[];
 await page.goto(base+'/modulos/quiz_progress.html?grupo=QA-SYNTH-GROUP&nivel=B1&leccion=8');
 await page.waitForFunction(()=>document.querySelector('#listeningInfo').textContent.includes('No se pudo cargar'));
 assert.equal(await page.locator('#submitBtn').isDisabled(),true,'fail closed missing/corrupted listening');
 assert.equal(await page.locator('#pdfBox iframe').count(),1,'PDF remains available even when audio fails');
 console.log('F111_B1_AUDIO_UI_PASS 8 tracks + teacher-only preview + audio error fail-closed, synthetic only');
}finally{await browser.close();}
