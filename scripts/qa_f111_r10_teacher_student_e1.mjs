// F111 R10: real teacher/student DOM logic, synthetic isolated API. No PROD calls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const teacher=fs.readFileSync(new URL('../src/teacher_quiz_review_f111.js',import.meta.url),'utf8');
const student=fs.readFileSync(new URL('../src/student_b1_progress_f111.js',import.meta.url),'utf8');
const campus=fs.readFileSync(new URL('../campus.html',import.meta.url),'utf8');
new Function(teacher);new Function(student);
assert.match(teacher,/\^qzProgress\[A-Za-z0-9\]\+\$/,'B1 numeric endpoints must use dedicated Quiz API');
assert.match(campus,/student_b1_progress_f111\.js\?v=F111B1R10STUDENT20261024/);
assert.match(campus,/teacher_quiz_review_f111\.js\?v=F111R46KEYLORHIST20261028/);
const ROOT='https://f111-r10-synthetic.invalid',API=ROOT+'/api';
const browser=await chromium.launch({headless:true});
const requests=[],states=new Map(),errors=[];
async function wire(page,type){
 page.on('pageerror',e=>errors.push(e.message));
 await page.route(ROOT+'/src/'+type+'.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:type==='teacher'?teacher:student}));
 await page.route(ROOT+'/modulos/quiz_progress.html*',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><p>R10 iframe placeholder · no real evaluation</p>'}));
 await page.route(API+'**',route=>{
  const fn=new URL(route.request().url()).searchParams.get('fn');
  const body=JSON.parse(route.request().postData()||'{}');
  assert.equal(body.token,'SYNTHETIC_R10_TOKEN');
  requests.push({fn,lesson:body.leccion,group:body.cod_grupo});
  const key=String(body.cod_grupo||'')+'-'+String(body.leccion||'');
  let result={ok:false,error:'fixture_unrecognized_fn'};
  if(fn==='qzProgressTeacherB1Groups')result={ok:true,grupos:[{cod_grupo:'QA-F111-B1',nivel:'B1'}]};
  if(fn==='qzProgressTeacherAvailability')result={ok:true,digital_disponible:true,grupo:body.cod_grupo,nivel:'B1',leccion:body.leccion,
    estado:states.get(key)||'CERRADO',puede_abrir:Number(body.leccion)===8,peso_oficial:0};
  if(fn==='qzProgressTeacherSetAvailability'){states.set(key,body.estado);result={ok:true,estado:body.estado,peso_oficial:0};}
  if(fn==='qzProgressStudentB1Active')result={ok:true,peso_oficial:0,quizzes:[
    {quiz_id:'IC5_B1_WQ02',grupo:'QA-F111-B1',nivel:'B1',leccion:8,peso_oficial:0},
    {quiz_id:'IC5_B1_WQ03',grupo:'QA-F111-B1',nivel:'B1',leccion:13,peso_oficial:0}
  ]};
  if(fn==='qzProgressMyAttempt')result={ok:true,quiz_id:Number(body.leccion)===8?'IC5_B1_WQ02':'IC5_B1_WQ03',
    estado:Number(body.leccion)===8?'SIN_INICIAR':'ENTREGADO'};
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
 });
 const section=type==='teacher'
  ?'<section data-screen-label="Docente · Exámenes"><h2>EXÁMENES DEL DOCENTE</h2></section>'
  :'<section data-screen-label="Estudiante · Evaluaciones"><h2>Evaluaciones del estudiante</h2></section>';
 const body='<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body>'+
  '<div id="root">'+section+'</div><script>window.getSessionToken=()=>window.__r10Token===undefined?"SYNTHETIC_R10_TOKEN":window.__r10Token;window.F111_QZ_API_URL="'+API+'";</script>'+
  '<script src="'+ROOT+'/src/'+type+'.js"></script></body></html>';
 await page.route(ROOT+'/'+type,r=>r.fulfill({status:200,contentType:'text/html',body}));
}
try {
 const page=await browser.newPage({viewport:{width:1366,height:768}});
 await wire(page,'teacher');
 page.on('dialog',d=>d.dismiss());
 await page.goto(ROOT+'/teacher');
 await page.waitForSelector('[data-f111-teacher-quizzes]');
 assert.equal(await page.locator('.f111-tqr-card').count(),8);
 assert.equal(await page.locator('.f111-tqr-r9-controls').count(),7);
 await page.waitForFunction(()=>document.querySelectorAll('.f111-tqr-r9-group option').length===14);
 assert.equal(requests.filter(x=>x.fn==='qzProgressTeacherB1Groups').length,1,'seven cards share one authenticated B1 groups lookup');
 const controls=page.locator('.f111-tqr-r9-controls');
 const first=controls.first();
 assert.equal(await first.locator('.f111-tqr-activate').isDisabled(),true,'no group auto selected');
 await first.locator('select').selectOption('QA-F111-B1');
 await page.waitForFunction(()=>document.querySelector('.f111-tqr-r9-controls .f111-tqr-activate')?.disabled===false);
 const before=requests.filter(r=>r.fn==='qzProgressTeacherSetAvailability').length;
 await first.locator('.f111-tqr-activate').click();
 assert.equal(requests.filter(r=>r.fn==='qzProgressTeacherSetAvailability').length,before,'cancel is no-op');
 page.removeAllListeners('dialog');
 page.on('dialog',d=>d.accept());
 await first.locator('.f111-tqr-activate').click();
 await page.waitForFunction(()=>document.querySelector('.f111-tqr-r9-controls .f111-tqr-activate')?.textContent?.includes('CERRAR'));
 assert.equal(states.get('QA-F111-B1-8'),'ABIERTO');
 await first.locator('.f111-tqr-activate').click();
 await page.waitForFunction(()=>document.querySelector('.f111-tqr-r9-controls .f111-tqr-activate')?.textContent?.includes('ACTIVAR'));
 assert.equal(states.get('QA-F111-B1-8'),'CERRADO');
 const future=controls.nth(1);
 await future.locator('select').selectOption('QA-F111-B1');
 await page.waitForFunction(()=>document.querySelectorAll('.f111-tqr-r9-controls')[1]?.textContent?.includes('No elegible'));
 assert.equal(await future.locator('.f111-tqr-activate').isDisabled(),true,'future lesson fail-closed');
 await first.locator('.f111-tqr-open').click();
 await page.waitForSelector('[data-f111-b1-private-preview] iframe');
 const iframe=await page.locator('[data-f111-b1-private-preview] iframe').getAttribute('src');
 assert.match(iframe,/grupo=QA-F111-B1/);
 assert.doesNotMatch(iframe,/token=/i);
 await page.locator('.f111-tqr-close').click();
 fs.mkdirSync(new URL('../qa-capturas/',import.meta.url),{recursive:true});
 await page.screenshot({path:new URL('../qa-capturas/QZ32_R10_TEACHER_DESKTOP.png',import.meta.url).pathname,fullPage:true});
 const studentPage=await browser.newPage({viewport:{width:390,height:844}});
 await wire(studentPage,'student');
 await studentPage.goto(ROOT+'/student');
 await studentPage.waitForFunction(()=>document.querySelectorAll('.f111-b1-extra-card').length===2);
 assert.equal(await studentPage.locator('.f111-b1-extra-card button').count(),1,'delivered quiz cannot restart');
 assert.equal(await studentPage.locator('.f111-b1-extra-card').nth(1).locator('button').count(),0);
 await studentPage.locator('.f111-b1-extra-card button').click();
 await studentPage.waitForSelector('.f111-b1-extra-modal iframe');
 const target=await studentPage.locator('.f111-b1-extra-modal iframe').getAttribute('src');
 assert.match(target,/leccion=8/);assert.match(target,/grupo=QA-F111-B1/);assert.doesNotMatch(target,/token=/);
 await studentPage.locator('.f111-b1-extra-bar button').click();
 await studentPage.screenshot({path:new URL('../qa-capturas/QZ32_R10_STUDENT_MOBILE.png',import.meta.url).pathname,fullPage:true});
 await studentPage.evaluate(()=>{window.__r10Token='';window.dispatchEvent(new Event('an:session-changed'))});
 await studentPage.waitForFunction(()=>document.querySelector('[data-f111-student-b1-pc-extra]')?.hidden===true);
 assert.equal(errors.length,0,errors.join(' | '));
 assert.ok(requests.every(x=>['qzProgressTeacherAvailability','qzProgressTeacherB1Groups','qzProgressTeacherSetAvailability','qzProgressStudentB1Active','qzProgressMyAttempt'].includes(x.fn)));
 console.log('F111_R10_DOM_PASS 8 teacher quizzes, 7 group selectors, gated synthetic open/close, future blocked, student enrollment/attempt safety and logout; no real endpoint calls');
}finally {await browser.close()}
