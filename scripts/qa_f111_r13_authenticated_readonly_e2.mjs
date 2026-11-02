/**
 * F111-R13 — controlled, non-mutating E2 readback on existing stable deployments.
 * No browser cookies or Google Drive operations. Never log tokens, IDs or
 * real response bodies. No endpoint capable of modifying academic records.
 *
 * Offline self-test: node scripts/qa_f111_r13_authenticated_readonly_e2.mjs --self-test
 * Real negative:    node scripts/qa_f111_r13_authenticated_readonly_e2.mjs --live-negative
 * Real positive:    set F111_R13_TEACHER_TOKEN and F111_R13_TEACHER_ID
 *                   and F111_R13_STUDENT_TOKEN using secure environment only;
 *                   node scripts/qa_f111_r13_authenticated_readonly_e2.mjs --authenticated
 *
 * Never put credentials in CLI args, PRs, logs or test fixtures.
 * --authenticated is read-only and requires a conscious local invocation.
 */
import assert from 'node:assert/strict';
const CORE_DEPLOY='AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ';
const QUIZ_DEPLOY='AKfycbwT4nYpH2MqxgP-ydwndWW7OdSkDXRCiI-l4qxBdsqq0IXuTNSKIvogvpj-1PgtsNjZhw';
const ENDPOINTS=Object.freeze({
 core:Object.freeze({deployment:CORE_DEPLOY,fn:'getCalendarioDocente'}),
 quiz:Object.freeze({deployment:QUIZ_DEPLOY,fn:'qzProgressStudentB1Active'})
});
const NEGATIVE_QUIZ=Object.freeze({deployment:QUIZ_DEPLOY,fn:'qzProgressGet'});
const SAFE_FNS=new Set(['getCalendarioDocente','qzProgressStudentB1Active','qzProgressGet']);
function requestSpec(item,token,params={}){
 if(!Object.values(ENDPOINTS).includes(item)&&item!==NEGATIVE_QUIZ)throw Error('R13_ENDPOINT_NOT_ALLOWLISTED');
 if(!SAFE_FNS.has(item.fn))throw Error('R13_WRITE_FUNCTION_NOT_ALLOWED');
 if(typeof token!=='string'||typeof params!=='object'||Array.isArray(params))throw Error('R13_ARGUMENT_TYPE_INVALID');
 if(Object.keys(params).some(k=>!['cod_docente'].includes(k)))throw Error('R13_UNEXPECTED_READ_PARAMETER');
 const url='https://script.google.com/macros/s/'+item.deployment+'/exec?fn='+encodeURIComponent(item.fn);
 return {url,options:{
  method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
  body:JSON.stringify({fn:item.fn,token,...params}),redirect:'follow'
 }};
}
async function read(item,token,params={}){
 const {url,options}=requestSpec(item,token,params);
 const response=await fetch(url,{...options,signal:AbortSignal.timeout(20000)});
 if(response.status!==200)throw Error('R13_HTTP_STATUS_'+response.status);
 if(!/application\/json/i.test(response.headers.get('content-type')||''))throw Error('R13_RESPONSE_NOT_JSON');
 const body=await response.text();
 if(body.length>250000)throw Error('R13_RESPONSE_TOO_LARGE');
 let data;try{data=JSON.parse(body)}catch{throw Error('R13_INVALID_JSON')}
 if(!data||typeof data!=='object'||typeof data.ok!=='boolean')throw Error('R13_INVALID_RESPONSE_CONTRACT');
 return data; // only used in process; NEVER printed.
}
async function negative(){
 const results=[];
 for(const [channel,ep] of [['CORE486',ENDPOINTS.core],['QUIZ477',NEGATIVE_QUIZ]]){
  const data=await read(ep,'');
  if(data.ok!==false||data.error!=='sesion_requerida')
    throw Error('R13_ANONYMOUS_AUTH_GUARD_FAIL_'+channel);
  results.push({channel,guard:'PASS',error_type:'sesion_requerida'});
 }
 console.log(JSON.stringify({ok:true,mode:'LIVE_NEGATIVE_READONLY',results,real_data_writes:0}));
}
async function authenticated(){
 const teacher=process.env.F111_R13_TEACHER_TOKEN||'';
 const teacherId=process.env.F111_R13_TEACHER_ID||'';
 const student=process.env.F111_R13_STUDENT_TOKEN||'';
 if(!teacher||!student||!teacherId)throw Error('R13_AUTHENTICATED_SESSION_MISSING');
 if(teacher.length>8192||student.length>8192||teacherId.length>256)
   throw Error('R13_AUTH_INPUT_TOO_LONG');
 const docente=await read(ENDPOINTS.core,teacher,{cod_docente:teacherId});
 if(docente.ok!==true||!('programadas' in docente||'calendario' in docente||'cerradas' in docente))
   throw Error('R13_TEACHER_READBACK_FAILED');
 const estudiante=await read(ENDPOINTS.quiz,student);
 if(estudiante.ok!==true||typeof estudiante.disponible!=='boolean')
   throw Error('R13_STUDENT_READBACK_FAILED');
 console.log(JSON.stringify({ok:true,mode:'LIVE_AUTHENTICATED_READONLY',
    core_teacher:'PASS',quiz_student:'PASS',role_verified_by_server:true,
    changes_to_student_data:0,academic_record_writes:0,drive_writes:0,
    secret_values_logged:false,quiz_is_available:estudiante.disponible}));
}
function selfTest(){
 assert.equal(SAFE_FNS.size,3);
 assert.equal(new Set([ENDPOINTS.core.deployment,ENDPOINTS.quiz.deployment]).size,2);
 let x=requestSpec(ENDPOINTS.core,'QA_DUMMY_TOKEN',{cod_docente:'QA_DUMMY'});
 assert.equal(new URL(x.url).hostname,'script.google.com');
 assert.equal(x.options.method,'POST');
 assert.equal(x.options.headers['Content-Type'],'text/plain;charset=utf-8');
 assert.equal(JSON.parse(x.options.body).fn,'getCalendarioDocente');
 assert.equal(JSON.parse(x.options.body).token,'QA_DUMMY_TOKEN');
 assert.throws(()=>requestSpec({deployment:CORE_DEPLOY,fn:'solicitarSuspension'},''),/NOT_ALLOWLISTED/);
 assert.throws(()=>requestSpec(ENDPOINTS.quiz,'',{grupo:'B1'}),/UNEXPECTED_READ_PARAMETER/);
 assert.throws(()=>requestSpec(ENDPOINTS.quiz,42),/ARGUMENT_TYPE_INVALID/);
 assert.equal(requestSpec(NEGATIVE_QUIZ,'').options.method,'POST');
 console.log(JSON.stringify({ok:true,mode:'E1_OFFLINE',checks:10,network_calls:0,write_endpoints_allowed:0}));
}
const argv=process.argv.slice(2);
if(argv.length!==1||!['--self-test','--live-negative','--authenticated'].includes(argv[0]))
 throw Error('R13_ONLY_EXPLICIT_READONLY_MODES_ALLOWED');
try{
 if(argv[0]==='--self-test')selfTest();
 else if(argv[0]==='--live-negative')await negative();
 else await authenticated();
}catch(e){
 // Never output request arguments or response data.
 console.error('F111_R13_E2_FAIL '+(String(e.message||'UNEXPECTED').startsWith('R13_')?e.message:'R13_UNEXPECTED_ERROR'));
 process.exitCode=1;
}
