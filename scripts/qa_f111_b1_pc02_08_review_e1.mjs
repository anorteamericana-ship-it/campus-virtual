// F111 B1 PC02–08: review authenticated GUI using synthetic API; no PROD writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const source=fs.readFileSync(new URL('../src/teacher_quiz_review_f111.js',import.meta.url),'utf8');
new Function(source);
assert.ok(source.includes('function openB1TeacherReview(lesson,group)'));
assert.ok(source.includes("postQuiz('qzProgressTeacherList',context)"));
assert.ok(source.includes("postQuiz('qzProgressTeacherReview',{...context,cod_estudiante:id,"));
assert.ok(source.includes("postQuiz('qzProgressTeacherMaterials',{...context,material:'clave'})"));
for(const banned of ['registrarNotaComponenteOficial','docenteCerrarClaseConAsistenciaF87','qzProgressSaveDraft','qzProgressSubmit'])
 assert.equal(source.includes(banned),false,'no changes to academic scores, class attendance, or student quiz submissions');
const ROOT='https://f111-b1-review-synth.invalid',API=ROOT+'/api';
const calls=[],errors=[],students=[
 {QUIZ_ID:'IC5_B1_WQ02',COD_GRUPO:'QA-F111-B1',NIVEL:'B1',LECCION:8,
 COD_ESTUDIANTE:'QA01',ESTADO:'ENTREGADO',RESPUESTAS_JSON:JSON.stringify({A1:'Answer',B1:'Other'}),
 RESULTADO:'',COMENTARIO_DOCENTE:''},
 {QUIZ_ID:'IC5_B1_WQ02',COD_GRUPO:'QA-F111-B1',NIVEL:'B1',LECCION:8,
 COD_ESTUDIANTE:'QA02',ESTADO:'REVISADO',RESPUESTAS_JSON:JSON.stringify({A1:'Other'}),
 RESULTADO:'88',COMENTARIO_DOCENTE:'Sugerencia de práctica adicional.'}];
const browser=await chromium.launch({headless:true,...(process.env.F111_QZ_CHROME_PATH?{executablePath:process.env.F111_QZ_CHROME_PATH}:{})});
try{
 const page=await browser.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',d=>d.accept());
 await page.route(ROOT+'/teacher.js',r=>r.fulfill({status:200,contentType:'application/javascript; charset=utf-8',body:source}));
 await page.route(API+'**',route=>{
  const fn=new URL(route.request().url()).searchParams.get('fn');
  const body=JSON.parse(route.request().postData()||'{}');
  assert.equal(body.token,'QA_AUTORIZADO_DOCENTE');
  calls.push({fn,...body});
  let reply={ok:false,error:'unexpected_fixture'};
  if(fn==='qzProgressTeacherB1Groups')reply={ok:true,grupos:[{cod_grupo:'QA-F111-B1',nivel:'B1'}]};
  if(fn==='qzProgressTeacherAvailability')reply={ok:true,grupo:'QA-F111-B1',nivel:'B1',leccion:body.leccion,
   digital_disponible:true,estado:'CERRADO',puede_abrir:Number(body.leccion)===8};
  if(fn==='qzProgressTeacherList')reply={ok:true,quiz_id:'IC5_B1_WQ02',leccion:8,peso_oficial:0,
   intentos:students.map(x=>({...x}))};
  if(fn==='qzProgressTeacherReview'){
   assert.equal(body.cod_grupo,'QA-F111-B1');assert.equal(Number(body.leccion),8);
   assert.equal(body.cod_estudiante,'QA01');assert.equal(Number(body.nota),92);
   assert.ok(body.comentario_progress_check.length>=5);
   students[0].ESTADO='REVISADO';students[0].RESULTADO='92';
   students[0].COMENTARIO_DOCENTE=body.comentario_progress_check;
   reply={ok:true,estado:'REVISADO',nota:92,peso_oficial:0};
  }
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(reply)});
 });
 const markup='<html><head><meta charset="utf-8"></head><body><div id="root"><section data-screen-label="Docente · Exámenes"><h2>EXÁMENES DEL DOCENTE</h2></section></div>'+
 '<script>window.getSessionToken=()=>\'QA_AUTORIZADO_DOCENTE\';window.F111_QZ_API_URL=\''+API+'\';</script>'+
 '<script src="/teacher.js"></script></body></html>';
 await page.route(ROOT+'/teacher',r=>r.fulfill({status:200,contentType:'text/html',body:markup}));
 await page.goto(ROOT+'/teacher');
 await page.evaluate(()=>window.F111_QZ_openTeacherControls(8,'QA-F111-B1'));
 const first=page.locator('[data-f111-b1-focus-control] .f111-tqr-r9-controls');
 await first.waitFor();
 await page.waitForFunction(()=>document.querySelector('.f111-tqr-r9-group')?.value==='QA-F111-B1');
 assert.equal(await page.locator('.f111-tqr-grid').count(),0,'no segundo catálogo de quizzes');
 assert.equal(await first.locator('select').isHidden(),true,'sin segundo selector visible');
 await first.getByRole('button',{name:'REVISAR ENTREGAS'}).click();
 const modal=page.locator('[data-f111-b1-review]');
 await modal.waitFor();
 await modal.getByText('Estudiante QA01').first().click();
 await modal.locator('[aria-label="Nota del Quiz"]').fill('92');
 await modal.locator('[aria-label="Comentario de mejora"]').fill('Trabajar las preguntas de Listening.');
 const reviewSubmit=modal.locator('.f111-tqr-grade-form button[type=submit]');
 assert.equal(await reviewSubmit.count(),1,'botón de revisión presente');
 await reviewSubmit.click();
 await modal.getByText('REVISADO · 92 / 100').first().waitFor({timeout:4500});
 assert.equal(calls.filter(x=>x.fn==='qzProgressTeacherReview').length,1);
 assert.ok(calls.filter(x=>x.fn==='qzProgressTeacherList').length>=2,'readback requeridó');
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('F111 EXUI-05A B1 PC02–08 TEACHER REVIEW PASS: one contextual card, protected group, numeric diagnostic, required comment, readback, 0 official-grade writes');
}finally{await browser.close();}
