import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const student=fs.readFileSync(new URL('../src/student_pc01_f111.js',import.meta.url),'utf8');
const academic=fs.readFileSync(new URL('../src/student_academic_summary_dom_cs21a113.js',import.meta.url),'utf8');
const menu=fs.readFileSync(new URL('../src/student_menu_academic_cs21a120.jsx',import.meta.url),'utf8');
const campus=fs.readFileSync(new URL('../campus.html',import.meta.url),'utf8');
new vm.Script(student);new vm.Script(academic);
assert(student.includes("api('qzProgressMyAttempt',GROUP)"),'check own attempt before invitation');
assert(student.includes("attemptState!=='SIN_INICIAR'"),'only SIN_INICIAR may receive a new invite');
assert(student.includes("attemptState==='ENTREGADO'||attemptState==='REVISADO'"),'delivered / reviewed suppress modal and button');
assert(student.includes('Prueba entregada. Pendiente de revisión docente'),'delivery status not invite');
assert(student.includes('Prueba entregada y revisada'),'review status shown');
assert(student.includes("attemptState='DESCONOCIDO'"),'fail-closed when attempt cannot be read');
assert(student.includes('if(!active||attemptState===\'ENTREGADO\'||attemptState===\'REVISADO\'||attemptState===\'DESCONOCIDO\')return;'),'no reopen after delivery, review or unknown');
assert(academic.includes("fn='qzProgressMyAttempt'"),'personal authenticated readback in summary');
assert(academic.includes("window.getSessionToken?.()"),'session comes from current authenticated viewer');
assert(academic.includes("group!==pc01Target||!token||!url"),'only active B1 group');
assert(academic.includes("v.quiz_id!=='IC5_B1_WQ01'"),'only authentic PC01 response');
assert(academic.includes("Number(v.peso_oficial)!==0"),'no grade official weight');
assert(academic.includes("['ENTREGADO','REVISADO']"),'only meaningful attempt states');
assert(academic.includes("v.estado==='REVISADO'&&v.nota!=null"),'do not show diagnostic F before teacher review');
assert(academic.includes("q.estado==='REVISADO'"),'reviewed only with its teacher comment');
assert(academic.includes("const quizRetro=d.pc01?.estado==='REVISADO'"),'recent feedback only after teacher review');
assert(academic.includes("pc01Points(score)"),'25-point conversion');
assert(academic.includes('Ponderación oficial 0%'),'explicit formative weight');
assert(academic.includes("return null;} //".split(' //')[0]),'backend failure is never treated as successful review');
assert(academic.includes('esc(q.comentario'),'teacher comments HTML escaped');
assert(campus.includes('student_pc01_f111.js?v=F111PC01G1EVAL20261023'),'student cache bust');
assert(campus.includes('student_menu_academic_cs21a120.jsx?v=F111PC01G1EVAL20261023'),'menu cache bust');
assert(menu.includes('student_academic_summary_dom_cs21a113.js?v=F111PC01G1EVAL20261023'),'summary cache bust');
assert(!student.includes('localStorage')&&!student.includes('sessionStorage'),'no locally forged state');
const begin=academic.indexOf('  async function ownPc01(portal){');
const end=academic.indexOf('  function read(codigo){',begin);
assert(begin>0&&end>begin,'isolated own review readback');
async function mock(state,group='B1-KJ18-C3-0826',note=24){
 const calls=[];
 const ctx={pc01Target:'B1-KJ18-C3-0826',window:{getSessionToken:()=> 'SYNTHETIC_TOKEN',F111_QZ_API_URL:'https://qa.invalid/qz'},fetch:async(url,opt)=>{
  calls.push(JSON.parse(opt.body));
  return {ok:true,json:async()=>({ok:true,quiz_id:'IC5_B1_WQ01',estado:state,nota:note,comentario_docente:'Improve questions one through four',peso_oficial:0})};
 }};
 vm.createContext(ctx);vm.runInContext(academic.slice(begin,end)+'\nthis.fn=ownPc01;',ctx);
 const data=await ctx.fn({cod_grupo:group});
 return {data,calls};
}
let x=await mock('REVISADO');assert.equal(x.data.nota,24);assert.equal(x.data.comentario,'Improve questions one through four');assert.equal(x.calls.length,1);
x=await mock('ENTREGADO');assert.equal(x.data.nota,null);assert.equal(x.data.comentario,'');
x=await mock('SIN_INICIAR');assert.equal(x.data,null);
x=await mock('REVISADO','B1-OTHER');assert.equal(x.data,null);assert.equal(x.calls.length,0);
for(const missing of ['', '   ', false, null, 'invalid', 101, -1]){
  const invalid=await mock('REVISADO','B1-KJ18-C3-0826',missing);
  assert.equal(invalid.data.nota,null,'No inventar 0% con nota vacía/inválida: '+String(missing));
}
for(const valid of [0,'0',' 0 ',24,100]){
  const result=await mock('REVISADO','B1-KJ18-C3-0826',valid);
  assert.equal(result.data.nota,Number(valid),'Nota válida, incluyendo 0 real');
}
console.log('PASS F111 PC01 student receipt: personal authenticated state, no reinvite, 24% F only after review, teacher comment in summary, official 0%, no writes');
