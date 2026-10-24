// F111 R9 · QA sintético Chromium, sin Apps Script ni datos productivos.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
const teacher=read('src/teacher_quiz_review_f111.js'),student=read('src/student_b1_pc02_08_f111.js'),campus=read('campus.html');
assert(campus.includes('src/student_pc01_f111.js?v=F111PC01G1EVAL20261023'),'PC01 historic student app unchanged');
assert(campus.includes('src/student_b1_pc02_08_f111.js?v=F111R9B1STUDENT20261024'),'R9 student loaded');
assert(campus.includes('src/teacher_quiz_review_f111.js?v=F111R9B1TEACHER20261024'),'R9 teacher loaded');
assert(teacher.includes("const QZ_GROUP='B1-KJ18-C3-0826'"),'PC01 keeps historic group');
assert(student.includes("qzProgressStudentB1Active"),'new student discovery');
assert(student.includes("qzProgressMyAttempt"),'never assumes student attempt absent');
const browser=await chromium.launch({headless:true});
let opened=false,writes=[],teacherCalls=[];
const host='https://campus.synthetic.invalid';
const api='https://quiz.synthetic.invalid/exec';
try{
 const page=await browser.newPage({viewport:{width:1100,height:900}});
 page.on('dialog',async dlg=>dlg.accept());
 page.on('pageerror',err=>console.error('R9_SYNTH_BROWSER_PAGEERROR '+String(err.message||err)));
 page.on('console',message=>{if(message.type()==='error')console.error('R9_SYNTH_BROWSER_CONSOLE '+message.text());});
 await page.route(host+'/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<html><head></head><body><div id="root"><section data-screen-label="Docente · Exámenes"><h1>EXÁMENES DEL DOCENTE</h1></section></div></body></html>'}));
 await page.route(api+'**',route=>{
  const fn=new URL(route.request().url()).searchParams.get('fn');
  const body=JSON.parse(route.request().postData()||'{}');
  assert.equal(body.token,'SYNTHETIC');
  teacherCalls.push(fn);
  let out;
  if(fn==='qzProgressTeacherB1Groups')out={ok:true,grupos:[{cod_grupo:'B1-QA-TEST',nivel:'B1'}]};
  else if(fn==='qzProgressTeacherAvailability')out={ok:true,digital_disponible:true,
    estado:body.leccion===8&&opened?'ABIERTO':'CERRADO',
    puede_abrir:body.leccion===8};
  else if(fn==='qzProgressTeacherSetAvailability'){
    writes.push(body);
    out={ok:true,estado:body.estado};opened=body.estado==='ABIERTO';
  }else out={ok:false,error:'synthetic_fn_not_allowed'};
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(out)});
 });
 await page.goto(host+'/campus.html');
 await page.evaluate(u=>{window.F111_QZ_API_URL=u;window.APPS_SCRIPT_URL=u;window.getSessionToken=()=> 'SYNTHETIC';},api);
 await page.addScriptTag({content:teacher});
 console.log('R9_SYNTH_TEACHER_DOM '+JSON.stringify(await page.evaluate(()=>({
  teacherScreen:!!document.querySelector('section[data-screen-label="Docente · Exámenes"]'),
  dashboard:!!document.querySelector('[data-f111-teacher-quizzes]'),
  picker:!!document.querySelector('select[aria-label="Grupo B1 autorizado"]'),
  cards:document.querySelectorAll('.f111-tqr-card').length
 }))));
 const picker=page.locator('select[aria-label="Grupo B1 autorizado"]');
 await picker.waitFor({timeout:7000});await page.waitForFunction(()=>document.querySelector('select[aria-label="Grupo B1 autorizado"]')?.options.length===2);
 await picker.selectOption('B1-QA-TEST');
 const l8=page.locator('.f111-tqr-card').nth(1);
 const l13=page.locator('.f111-tqr-card').nth(2);
 await page.waitForFunction(()=>{const cards=document.querySelectorAll('.f111-tqr-card');return cards[1]?.querySelector('[data-r9-state]')?.disabled===false;});
 assert.equal(await l13.locator('.f111-tqr-r9-controls button').isDisabled(),true,'future lesson cannot open');
 await l8.locator('.f111-tqr-r9-controls button').click();
 await page.waitForFunction(()=>document.querySelectorAll('.f111-tqr-card')[1]?.querySelector('[data-r9-state]')?.dataset.r9State==='ABIERTO');
 assert.equal(writes.length,1);assert.equal(writes[0].cod_grupo,'B1-QA-TEST');
 assert.equal(writes[0].leccion,8);assert.equal(writes[0].estado,'ABIERTO');
 assert.equal(teacherCalls.includes('qzProgressTeacherB1Groups'),true);
 await page.close();
 const pupil=await browser.newPage({viewport:{width:390,height:844}});
 await pupil.route(host+'/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<html><head></head><body><div id="root"><section data-screen-label="Estudiante · Evaluaciones"><h1>Evaluaciones</h1></section></div></body></html>'}));
 let listActive=true;
 await pupil.route(api+'**',route=>{
  const fn=new URL(route.request().url()).searchParams.get('fn');
  const body=JSON.parse(route.request().postData()||'{}');
  assert.equal(body.token,'SYNTHETIC');
  const out=fn==='qzProgressStudentB1Active'?{ok:true,quizzes:listActive?[{
    quiz_id:'IC5_B1_WQ02',grupo:'B1-QA-TEST',nivel:'B1',leccion:8,peso_oficial:0
  }]:[],peso_oficial:0}:
  fn==='qzProgressMyAttempt'?{ok:true,quiz_id:'IC5_B1_WQ02',estado:'SIN_INICIAR'}:
  {ok:false,error:'synthetic_no_writes'};
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(out)});
 });
 await pupil.goto(host+'/campus.html');
 await pupil.evaluate(u=>{window.F111_QZ_API_URL=u;window.getSessionToken=()=> 'SYNTHETIC';},api);
 await pupil.addScriptTag({content:student});
 await pupil.locator('[data-f111-b1-followup]:visible button').waitFor();
 assert.match(await pupil.locator('[data-f111-b1-followup]').innerText(),/Quiz 2/);
 await pupil.locator('[data-f111-b1-followup] button').click();
 await pupil.locator('[data-f111-b1-followup-modal] iframe').waitFor();
 const src=await pupil.locator('[data-f111-b1-followup-modal] iframe').getAttribute('src');
 assert(src.includes('leccion=8')&&src.includes('grupo=B1-QA-TEST'));
 assert.equal(await pupil.locator('[data-f111-b1-followup-modal] iframe').count(),1);
 console.log('F111_R9_FRONTEND_E1_PASS teacher group, future gate, manual opening + readback, student B1 discovery, PC01 untouched; synthetic only');
}finally{await browser.close();}
