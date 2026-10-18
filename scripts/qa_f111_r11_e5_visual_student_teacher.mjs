// R11-E5 Visual QA: frontend ORIGINAL en browser con API ficticia LOCAL.
// No acceso Google ni notas reales ni clave Cambridge; artefactos solo QA.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=process.cwd();
const out=path.resolve(process.env.F111_E5_SCREENSHOT_DIR||path.join(os.tmpdir(),'f111-e5-screens'));
fs.mkdirSync(out,{recursive:true});
const id='B1_WRITTEN_L18_TEST1_A';
const exam={id,exam_id:id,nivel:'B1',titulo:'Examen Ficticio QA',leccion:18,
 payload_scope:'student_public_no_keys',public_payload_version:'V10H',
 sections:[{letter:'A',type:'multiple-choice',points:1,
 instruction:'Select one synthetic answer',
 questions:[{id:'A1',stem:'Choose the QA option',opts:[['a','Option A'],['b','Option B']]}]}]};
const activation={ACTIVATION_ID:'QA-ACT-18',EXAM_ID:id,NIVEL:'B1',TEST_CODE:'TEST1',
 LECCION:18,OPCION:'A',COD_GRUPO:'B1-LM69-QA-TEST',PLAN:'INA',TIME_LIMIT_MIN:90};
const calls=[],state={attempt:null,review:null};
const token='LOCAL_QA_TOKEN_NEVER_GOOGLE';
function fixture(role){
 return ['<!doctype html><html lang="es"><head><meta charset="utf-8">',
 '<title>F111 E5 Visual QA</title><style>body{margin:0;background:#eef2f6}iframe{width:100%;height:100vh;border:0}</style>',
 '</head><body><script src="/vendor/react.js"></script>',
 '<script src="/vendor/react-dom.js"></script><script src="/vendor/babel.js"></script>',
 '<script>window.getSesion=function(){return {rol:',JSON.stringify(role),
 ',grupo:',JSON.stringify(activation.COD_GRUPO),',codigo:"QA-001"};};',
 'window.getSessionToken=function(){return ',JSON.stringify(token),';};',
 'window.APPS_SCRIPT_URL=location.origin+"/qa-api";</script>',
 '<iframe title="Exámenes QA" id="exam" src="/modulos/examenes.html?view=',role,'"></iframe></body></html>'].join('');
}
function api(fn,body){
 if(body.token!==token)return{ok:false,error:'sesion_invalida'};
 if(fn==='examGetStudentLivePanel'||fn==='examGetStudentAssignment')
  return{ok:true,assigned:true,enabled:true,activation,public_exam:exam,
    current_attempt:state.attempt,
    student:{nombre:'Estudiante ficticio QA',grupo:activation.COD_GRUPO}};
 if(fn==='examStartAttempt'){
  state.attempt={ATTEMPT_ID:'QA-ATT-1',EXAM_ID:id,STATUS:'STARTED',
   STARTED_AT:new Date().toISOString(),ANSWERS_JSON:'{}',
   NOMBRE:'Estudiante ficticio QA',CODIGO:'QA-001',COD_GRUPO:activation.COD_GRUPO};
  return{ok:true,attempt_id:state.attempt.ATTEMPT_ID,started_at:state.attempt.STARTED_AT,
   activation,public_exam:exam};
 }
 if(fn==='examHeartbeatAttempt')return{ok:true,status:'STARTED',remaining_sec:5100,can_submit:true};
 if(fn==='examSaveAttemptDraft')return{ok:true,saved:true,attempt_id:'QA-ATT-1'};
 if(fn==='examSubmitAttempt'){if(state.attempt)state.attempt.STATUS='SUBMITTED';
  return{ok:true,status:'SUBMITTED',attempt_id:'QA-ATT-1'};}
 if(fn==='examReviewInbox')return{ok:true,total:1,summary:{needs_action:1,pushed_to_notas:0},
  rows:[{ATTEMPT_ID:'QA-ATT-1',COD_GRUPO:activation.COD_GRUPO,
  NOMBRE:'Estudiante ficticio QA',CODIGO:'QA-001',NIVEL:'B1',EXAM_ID:id,
  ATTEMPT_STATUS:'SUBMITTED',REVIEW_STATUS:'PENDING',bucket:'SUBMITTED_WITHOUT_REVIEW'}]};
 if(fn==='examGetAttempt')return{ok:true,attempt:state.attempt||{
  ATTEMPT_ID:'QA-ATT-1',EXAM_ID:id,STATUS:'SUBMITTED',
  NOMBRE:'Estudiante ficticio QA',COD_GRUPO:activation.COD_GRUPO,
  CODIGO:'QA-001',ANSWERS_JSON:'{"A1":"a"}'}};
 if(fn==='examCreateReviewDraft'){state.review={REVIEW_ID:'QA-REV-1',
  ATTEMPT_ID:'QA-ATT-1',REVIEW_STATUS:'IN_REVIEW',LOCKED:'NO',
  PUSHED_TO_NOTAS:'NO',STUDENT_FEEDBACK:'',MANUAL_ADJUSTMENTS_JSON:'{}'};
  return{ok:true,review_id:'QA-REV-1'};}
 if(fn==='examGetReview')return{ok:true,review:state.review||{
  REVIEW_ID:'QA-REV-1',REVIEW_STATUS:'IN_REVIEW',LOCKED:'NO',
  PUSHED_TO_NOTAS:'NO',MANUAL_ADJUSTMENTS_JSON:'{}'},attempt:state.attempt};
 if(fn==='examCloseReview'){
  if(!body.student_feedback)return{ok:false,error:'student_feedback_requerido'};
  if(state.review)Object.assign(state.review,{REVIEW_STATUS:'CLOSED',LOCKED:'SI',
   FINAL_SCORE_100:body.final_score_100,STUDENT_FEEDBACK:body.student_feedback});
  return{ok:true,status:'CLOSED',pushed_to_notas:'NO',review_id:'QA-REV-1'};
 }
 if(fn==='examPushReviewToNotas'){
  if(!state.review||state.review.REVIEW_STATUS!=='CLOSED')
   return{ok:false,error:'review_no_cerrada'};
  state.review.PUSHED_TO_NOTAS='SI';
  return{ok:true,pushed_to_notas:'SI',nota_componente:4,nota_total:87};
 }
 return {ok:false,error:'qa_endpoint_no_soportado'};
}
const mime={'.html':'text/html;charset=utf-8','.jsx':'text/plain;charset=utf-8',
 '.css':'text/css;charset=utf-8','.js':'application/javascript;charset=utf-8'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1');
 if(u.pathname==='/fixture'){
  res.writeHead(200,{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store'});
  res.end(fixture(u.searchParams.get('role')==='teacher'?'teacher':'student'));return;
 }
 if(u.pathname==='/qa-api'){
  let b='';req.on('data',c=>b+=c);req.on('end',()=>{
   try{const request=JSON.parse(b),fn=request.fn||u.searchParams.get('fn');
    calls.push(fn);res.writeHead(200,{'Content-Type':'application/json'});
    res.end(JSON.stringify(api(fn,request)));
   }catch(_){res.writeHead(400);res.end('{}');}
  });return;
 }
 const file=path.resolve(root,'.'+decodeURIComponent(u.pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
  res.writeHead(404);res.end('Not found');return;
 }
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});
 fs.createReadStream(file).pipe(res);
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const port=server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 const student=await browser.newPage({viewport:{width:1280,height:850}});
 student.on('pageerror',e=>errors.push(e.message));
 await student.goto('http://127.0.0.1:'+port+'/fixture?role=student');
 const sf=student.frameLocator('#exam');
 await sf.locator('.ascard').waitFor({timeout:60000});
 await student.screenshot({path:path.join(out,'student-assignment.png')});
 assert.equal(await sf.locator('.ex-shell.show-key').count(),0);
 await sf.getByRole('button',{name:/iniciar/i}).first().click();
 await sf.locator('.sttake').waitFor({timeout:30000});
 await student.screenshot({path:path.join(out,'student-in-progress.png')});
 assert(calls.includes('examStartAttempt'));
 student.on('dialog',async d=>{await d.accept();});
 await sf.getByRole('button',{name:'Enviar examen'}).click();
 await sf.getByRole('button',{name:'Enviar de todos modos'}).waitFor({timeout:12000});
 await sf.getByRole('button',{name:'Enviar de todos modos'}).click();
 await sf.getByRole('heading',{name:'Examen enviado'}).waitFor({timeout:30000});
 assert(calls.includes('examSubmitAttempt'));
 assert.equal(await sf.locator('.ex-shell.show-key').count(),0);
 await student.screenshot({path:path.join(out,'student-submitted.png')});
 await student.close();
 const teacher=await browser.newPage({viewport:{width:1280,height:850}});
 teacher.on('pageerror',e=>errors.push(e.message));
 await teacher.goto('http://127.0.0.1:'+port+'/fixture?role=teacher');
 const tf=teacher.frameLocator('#exam');
 await tf.locator('.tchwrap').waitFor({timeout:60000});
 await tf.getByText('Exámenes escritos entregados').waitFor({timeout:20000});
 await tf.getByText('Estudiante ficticio QA').first().waitFor({timeout:20000});
 await teacher.screenshot({path:path.join(out,'teacher-inbox.png')});
 assert(calls.includes('examReviewInbox'));
 await tf.getByRole('button',{name:/Revisar examen/i}).first().click();
 await tf.locator('.tchrev-live').waitFor({timeout:30000});
 await teacher.screenshot({path:path.join(out,'teacher-review.png')});
 assert(calls.includes('examGetReview'));
 const reviewButton=tf.getByRole('button',{name:'Enviar Nota'});
 await reviewButton.waitFor({timeout:10000});
 await reviewButton.click();
 await tf.getByText(/retroalimentación.*obligatoria/i).first().waitFor({timeout:10000});
 assert(!calls.includes('examCloseReview'),'Feedback vacío no debe cerrar revisión');
 await tf.locator('textarea.rev-fb').fill('Retroalimentación docente sintética.');
 await tf.getByRole('button',{name:'Enviar Nota'}).click();
 await tf.getByText('Nota enviada correctamente a Mis Notas.').waitFor({timeout:25000});
 assert(calls.includes('examCloseReview'));
 assert(calls.includes('examPushReviewToNotas'));
 await teacher.screenshot({path:path.join(out,'teacher-note-sent.png')});
 assert(!calls.includes('examGetPrivatePreviewF111'));
 await teacher.close();
 assert.deepEqual(errors,[],'Errores de JavaScript en navegador');
 console.log('F111_R11_E5_VISUAL_QA_PASS: 6 screenshots; student submit + teacher feedback+push; renderer real; API localhost sintética; 0 PROD.');
}finally{
 await browser.close();
 await new Promise(done=>server.close(done));
}
