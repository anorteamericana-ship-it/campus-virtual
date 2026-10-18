// F111 QZ32 · QA E1 de vista estudiante y docente (sin red, sin credenciales).
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const student=read('modulos/quiz_progress.html');
const teacher=read('modulos/quiz_progress_docente.html');
const view=read('src/vista_docente.jsx');
for(const [name,html] of [['student',student],['teacher',teacher]]){
 const m=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(m,'script present '+name);
 new Function(m[1]);
 assert.ok(html.includes('window.F111_QZ_QA_API_URL'),name+' requires explicit QA endpoint injection');
 assert.ok(!html.includes('AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ'),name+' does not target PROD URL');
 assert.ok(!html.includes('_Key.pdf')&&!html.includes('correct:'),name+' has no correct answers');
}
assert.ok(student.includes('0 %'),'student understands zero official weight');
// Los mismos 8 PC por nivel alimentan las 32 rutas del mismo módulo,
// sin 32 copias HTML ni preguntas/soluciones distribuidas en Pages.
const schedule=student.match(/const STEPS=(\{[^;]+\});/);
assert.ok(schedule,'calendar schedule for eight quizzes');
const mapping=JSON.parse(schedule[1].replace(/([0-9]+):/g,'"$1":'));
assert.equal(Object.keys(mapping).length,8,'eight lesson slots');
const routes=[];
for(const nivel of ['B1','B2','I1','I2'])
 for(const leccion of Object.keys(mapping)){
  const quiz=String(Object.keys(mapping).indexOf(leccion)+1).padStart(2,'0');
  routes.push('IC5_'+nivel+'_WQ'+quiz);
  assert.ok(mapping[leccion].length===2,'two units per PC');
 }
assert.equal(routes.length,32);
assert.equal(new Set(routes).size,32);
assert.ok(student.includes("meta.peso_oficial!==0"),'never accept weighted official quiz');
assert.ok(student.includes('el.readOnly=submitted||uncertainSubmit||expired'),'lock answered form after submit/date');
assert.ok(student.includes("async function verifySubmit()"),'uncertain submit can reconcile by read');
assert.ok(student.includes('!uncertainSubmit')&&student.includes("qzProgressMyAttempt"),'do not resend unknown submit');
assert.ok(student.includes('id="verifyBtn"'),'teacher may help after read-only verification');
for(const id of [4,8,13,16,21,24,28,30])assert.ok(student.includes(String(id)+':['),'progress lesson '+id);
for(const name of ['qzProgressGet','qzProgressPaper','qzProgressMyAttempt','qzProgressSaveDraft','qzProgressSubmit'])assert.ok(student.includes(name),'student API '+name);
for(const name of ['qzProgressTeacherList','qzProgressTeacherReview','qzProgressTeacherMaterials'])assert.ok(teacher.includes(name),'teacher API '+name);
assert.ok(!view.includes('pcQuizReviewSuggestionsF111'),'protected classroom closure unchanged');
assert.ok(teacher.includes('navigator.clipboard.writeText'),'teacher can transfer reviewed observation to Progress Check');
assert.ok(!teacher.includes('registrarNotaComponenteOficial'));
console.log('PASS F111 QZ32 client QA: 32/32 level/lesson routes, guarded submit/verification, teacher feedback, no grades/keys/PROD, no duplicate HTML');

if(process.env.F111_QZ_BROWSER==='1'){
 const {chromium}=await import('playwright');
 const {resolve}=await import('node:path');
 const {pathToFileURL}=await import('node:url');
 const {mkdirSync}=await import('node:fs');
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:850}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  for(const nivel of ['B1','B2','I1','I2']){
   for(const leccion of Object.keys(mapping).map(Number)){
    const query='?preview=1&nivel='+nivel+'&leccion='+leccion+'&grupo=QA_SYNTHETIC';
    const studentUrl=pathToFileURL(resolve('modulos/quiz_progress.html')).href+query;
    const teacherUrl=pathToFileURL(resolve('modulos/quiz_progress_docente.html')).href+query;
    await page.goto(studentUrl);
    await page.waitForFunction(()=>document.querySelector('#badge')?.textContent.includes('Vista previa QA'));
    assert.equal((await page.locator('#lessonTag').textContent()).includes('L'+leccion),true);
    assert.equal((await page.locator('#unitsTag').textContent()).includes(mapping[leccion].join('–')),true);
    assert.equal(await page.locator('#submitBtn').isDisabled(),true,'preview cannot submit');
    if(nivel==='B1'&&leccion===4){
     mkdirSync('qa-capturas',{recursive:true});
     await page.screenshot({path:'qa-capturas/QZ32_estudiante_B1_WQ01_1280.png',fullPage:true});
    }
    await page.goto(teacherUrl);
    await page.waitForFunction(()=>document.querySelector('#people')?.textContent.includes('Estudiante de muestra'));
    if(nivel==='I2'&&leccion===30){
     await page.setViewportSize({width:390,height:844});
     await page.screenshot({path:'qa-capturas/QZ32_docente_I2_WQ08_390.png',fullPage:true});
     await page.setViewportSize({width:1280,height:850});
    }
   }
  }
  assert.deepEqual(errors,[],'No frontend uncaught errors across 64 QA route previews');
  console.log('F111_QZ32_BROWSER_PASS: 32/32 estudiante + 32/32 docente, escritorio/móvil; solo fixture vista previa sin red');
 }finally{await browser.close();}
}

