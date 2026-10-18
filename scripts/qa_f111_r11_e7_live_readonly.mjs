// F111 E7: interfaz real vs QA @3 SOLO LECTURA. --mock en CI, --live local.
// Sin escrituras, claves Cambridge, ni tokens QA enviados al navegador.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {chromium} from 'playwright';
const mode=process.argv[2];
if(!['--mock','--live'].includes(mode))throw Error('E7_STOP: usar --mock o --live');
const root=process.cwd(),group='B1-QA-E6',code='QA-001';
const QA_DEPLOY='AKfycbwWd0aukbBe0a_-Tz6GOzys_VSihNtMxzj0gSX9lpI8lY4q8khHKqTaWNuXXWe3e1OP';
const QA_SCRIPT='1gI-ymzM_WqA15McAQFr2WZOc650mf28L6vFDZ93oOFYzkVcItzU0Qp_5';
const endpoint='https://script.google.com/macros/s/'+QA_DEPLOY+'/exec';
const roles=['student','teacher'];
const localTokens=Object.fromEntries(roles.map(r=>[r,'E7_LOCAL_'+randomBytes(24).toString('hex')]));
const realTokens={};
if(mode==='--live'){
 const saved=JSON.parse(fs.readFileSync(path.join(os.tmpdir(),'F111_EX04_R10_TOKENS_LOCAL_PRIVATE.json'),'utf8'));
 if(saved.qa_script_id!==QA_SCRIPT||Date.now()>=Date.parse(saved.expires_at))
   throw Error('E7_STOP: tokens QA caducados o proyecto incorrecto');
 for(const role of roles){
  const v=saved['F111_R8_QA_'+role.toUpperCase()+'_TOKEN'];
  if(typeof v!=='string'||v.length<32)throw Error('E7_STOP: token QA faltante '+role);
  realTokens[role]=v;
 }
}
const allowed={student:new Set(['examGetStudentLivePanel','getResumenNotasOficialesEstudiante']),
 teacher:new Set(['examReviewInbox','examGetAttempt','examGetReview'])};
const act={ACTIVATION_ID:'E6-L18',COD_GRUPO:group,NIVEL:'B1',
 EXAM_ID:'B1_WRITTEN_L18_TEST1_A',LECCION:18,PLAN:'INA',OPCION:'A',TIME_LIMIT_MIN:90};
const publicExam={exam_id:act.EXAM_ID,id:act.EXAM_ID,nivel:'B1',
 titulo:'Examen sintético E7',payload_scope:'student_public_no_keys',
 public_payload_version:'V10H',sections:[{letter:'A',type:'multiple-choice',points:1,
 instruction:'Pregunta de ensayo',questions:[{id:'QA1',stem:'QA: Choose test option.',
 opts:[['A','Option A'],['B','Option B']]}]}]};
const attempts=['E6-L18','E6-L32'].map((a,i)=>({
 ATTEMPT_ID:'QA-E7-ATT-'+(i+1),ACTIVATION_ID:a,CODIGO:code,
 COD_GRUPO:group,NOMBRE:'Estudiante QA Ficticio',NIVEL:'B1',
 EXAM_ID:'B1_WRITTEN_L'+(i?'32_TEST2':'18_TEST1')+'_A',
 STATUS:'REVIEWED',ANSWERS_JSON:'{"QA1":"A"}',SUBMITTED_AT:'2026-10-17T18:10:00Z',
 STARTED_AT:'2026-10-17T18:00:00Z',TIME_SPENT_SEC:75
}));
const reviews=attempts.map((a,i)=>({
 REVIEW_ID:'QA-E7-REV-'+(i+1),ATTEMPT_ID:a.ATTEMPT_ID,REVIEW_STATUS:'CLOSED',
 LOCKED:'SI',PUSHED_TO_NOTAS:'SI',FINAL_SCORE_100:i?60:80,WEIGHT_PERCENT:5,
 WEIGHTED_SCORE:i?3:4,MANUAL_ADJUSTMENTS_JSON:'{}',STUDENT_FEEDBACK:'Feedback QA'
}));
function mock(role,fn,body){
 if(role==='student'){
  if(fn==='getResumenNotasOficialesEstudiante')
   return {ok:true,codigo:code,grupo:group,programa:'INA',nota_total:87,
    componentes:{ESCRITO_1:{puntos:4,max:5},ESCRITO_2:{puntos:3,max:5}}};
  return {ok:true,enabled:true,assigned:true,activation:act,public_exam:publicExam,
   current_attempt:attempts[0],student:{nombre:'Estudiante QA Ficticio',codigo:code,grupo}};
 }
 if(fn==='examReviewInbox'){
  return {ok:true,total:2,rows:attempts.map((a,i)=>({...a,
    REVIEW_ID:reviews[i].REVIEW_ID,REVIEW_STATUS:'CLOSED',bucket:'PUSHED'})),
   summary:{needs_action:0,pushed_to_notas:2}};
 }
 if(fn==='examGetAttempt'){
  const a=attempts.find(x=>x.ATTEMPT_ID===body.attempt_id);
  return a?{ok:true,attempt:a}:{ok:false,error:'not_found'};
 }
 const i=reviews.findIndex(x=>x.REVIEW_ID===body.review_id);
 return i<0?{ok:false,error:'not_found'}:{ok:true,review:reviews[i],attempt:attempts[i]};
}
async function qaRequest(role,fn,body){
 if(!allowed[role]?.has(fn))throw Error('E7_DENIED_WRITE');
 if(role==='student'&&body.codigo&&body.codigo!==code)throw Error('E7_DENIED_IDOR');
 if(role==='teacher'&&fn==='examReviewInbox'&&body.cod_grupo!==group)
  throw Error('E7_DENIED_GROUP');
 if(mode==='--mock')return mock(role,fn,body);
 const response=await fetch(endpoint,{method:'POST',redirect:'manual',
  headers:{'Content-Type':'text/plain;charset=utf-8'},
  body:JSON.stringify({...body,fn,token:realTokens[role]}),
  signal:AbortSignal.timeout(25000)});
 let final=response;
 if([301,302,303].includes(response.status)){
  const url=new URL(response.headers.get('location')||'',endpoint);
  if(url.protocol!=='https:'||url.hostname!=='script.googleusercontent.com'||
    url.username||url.password||url.port)throw Error('E7_REDIRECT_BLOCKED');
  final=await fetch(url,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(25000)});
 }else if([307,308].includes(response.status))throw Error('E7_REDIRECT_UNSAFE');
 if(!final.ok||!['script.google.com','script.googleusercontent.com'].includes(new URL(final.url).hostname))
  throw Error('E7_BAD_HTTP');
 const txt=await final.text();if(txt.length>100000)throw Error('E7_TOO_LARGE');
 try{return JSON.parse(txt);}catch{throw Error('E7_BAD_JSON');}
}
function html(role){
 return '<!doctype html><html><head><meta charset="utf-8"><title>F111 E7 QA</title>'+
 '<style>body{margin:0;background:#eef2f6}iframe{width:100%;height:100vh;border:0}</style>'+
 '</head><body><script src="/vendor/react.js"></script><script src="/vendor/react-dom.js"></script>'+
 '<script src="/vendor/babel.js"></script><script>'+
 'window.getSesion=()=>({rol:'+JSON.stringify(role)+',grupo:'+JSON.stringify(group)+
 ',codigo:'+JSON.stringify(code)+'});window.getSessionToken=()=>'+JSON.stringify(localTokens[role])+
 ';window.APPS_SCRIPT_URL=location.origin+"/qa-api";</script>'+
 '<iframe id="exam" src="/modulos/examenes.html?view='+role+'"></iframe></body></html>';
}
const mime={'.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8',
 '.js':'application/javascript;charset=utf-8','.jsx':'text/plain;charset=utf-8'};
let port=0,readCalls=[],denyCount=0;
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1');
 const send=(v,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(v))};
 if(u.pathname==='/fixture'){
  const role=u.searchParams.get('role');
  if(!roles.includes(role)){res.writeHead(403);res.end();return;}
  res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
  res.end(html(role));return;
 }
 if(u.pathname==='/qa-api'){
  (async()=>{
   if(req.method!=='POST'||req.headers.origin!=='http://127.0.0.1:'+port){
    denyCount++;return send({ok:false,error:'no_autorizado'},403);
   }
   let raw='';for await(const buf of req){raw+=buf;if(raw.length>12000)throw Error('body too large');}
   const b=JSON.parse(raw),role=roles.find(r=>localTokens[r]===b.token);
   if(!role||!allowed[role]?.has(b.fn)){
    denyCount++;return send({ok:false,error:'solo_lectura'},403);
   }
   const {token:ignored,fn,...data}=b;
   const result=await qaRequest(role,fn,data);
   readCalls.push({role,fn,ok:result.ok===true});
   return send(result);
  })().catch(()=>send({ok:false,error:'qa_read_fail_cerrado'},502));
  return;
 }
 const file=path.resolve(root,'.'+decodeURIComponent(u.pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
  res.writeHead(404);res.end('Not found');return;
 }
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});
 fs.createReadStream(file).pipe(res);
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
port=server.address().port;
const origin='http://127.0.0.1:'+port;
let browser;
try{
 const denied=await fetch(origin+'/qa-api',{method:'POST',
  headers:{'Content-Type':'application/json','Origin':origin},
  body:JSON.stringify({fn:'examCloseReview',token:localTokens.teacher})});
 assert.equal(denied.status,403);
 const grades=await qaRequest('student','getResumenNotasOficialesEstudiante',{codigo:code});
 assert.equal(grades.ok,true);assert.equal(grades.codigo,code);assert.equal(grades.grupo,group);
 assert.equal(grades.programa,'INA');assert.equal(Number(grades.nota_total),87);
 assert.equal(Number(grades.componentes?.ESCRITO_1?.puntos),4);
 assert.equal(Number(grades.componentes?.ESCRITO_2?.puntos),3);
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const errors=[];
 const stu=await browser.newPage({viewport:{width:1280,height:820}});
 stu.on('pageerror',e=>errors.push(e.message));
 await stu.goto(origin+'/fixture?role=student');
 const sf=stu.frameLocator('#exam');
 await sf.getByRole('heading',{name:'Examen enviado'}).waitFor({timeout:60000});
 assert.equal(await sf.locator('.ex-shell.show-key').count(),0);
 assert.equal(await sf.getByRole('button',{name:/Iniciar examen|Enviar examen/i}).count(),0);
 await stu.close();
 const teach=await browser.newPage({viewport:{width:1280,height:820}});
 teach.on('pageerror',e=>errors.push(e.message));
 await teach.goto(origin+'/fixture?role=teacher');
 const tf=teach.frameLocator('#exam');
 await tf.getByText('Exámenes escritos entregados').waitFor({timeout:60000});
 await tf.getByText('Estudiante QA Ficticio').first().waitFor({timeout:30000});
 await tf.getByText('En Mis Notas').first().waitFor({timeout:30000});
 await tf.getByRole('button',{name:/Revisar examen/i}).first().click();
 await tf.locator('.tchrev-live').waitFor({timeout:30000});
 await tf.getByText(/Revisión cerrada y nota registrada/i).waitFor({timeout:30000});
 assert.equal(await tf.getByRole('button',{name:'Enviar Nota'}).count(),0);
 await teach.close();
 assert.deepEqual(errors,[]);
 assert(readCalls.some(x=>x.fn==='examGetStudentLivePanel'&&x.ok));
 assert(readCalls.some(x=>x.fn==='examReviewInbox'&&x.ok));
 assert(readCalls.some(x=>x.fn==='examGetReview'&&x.ok));
 assert(readCalls.every(x=>allowed[x.role]?.has(x.fn)));
 console.log(JSON.stringify({verdict:mode==='--mock'?'PASS_R11_E7_VISUAL_MOCK_READONLY':'PASS_R11_E7_VISUAL_QA_AUTH_READONLY',
  e1:4,e2:3,ina_total:87,student:'REVIEWED',teacher:'CLOSED/PUSHED',
  requests:readCalls.length,blocked_write:denyCount,write_endpoints_invoked:false,
  production_accessed:false,live_backend:mode==='--live'}));
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
