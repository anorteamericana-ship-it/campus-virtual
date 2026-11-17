// F111 QZ24 · Mis exámenes: selector B2/I1/I2 sin grupo, vista digital protegida.
// Verifica controlador auténtico en VM aislado sin API Google ni alumnos.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../src/teacher_quiz_review_f111.js',import.meta.url),'utf8');
const start=src.indexOf('function createQz24RehearsalCard(');
const end=src.indexOf('function buildTeacherExamsF111(){',start);
assert.ok(start>0&&end>start);
assert.ok(src.includes('const rehearsal=createQz24RehearsalCard(select)'));
assert.ok(src.includes('summary.append(history,rehearsal.card)'));
const LEVELS=[['B1','Básico I'],['B2','Básico II'],['I1','Intermedio I'],['I2','Intermedio II']];
const LESSONS=[[4,'1–2'],[8,'3–4'],[13,'5–6'],[16,'7–8'],[21,'9–10'],[24,'11–12'],[28,'13–14'],[30,'15–16']];
function make(tag,text,className){
 return {tag,textContent:text??'',className:className||'',value:'',dataset:{},children:[],disabled:false,events:{},
  append(...xs){this.children.push(...xs);if(this.tag==='select'&&!this.value&&xs.length)this.value=xs[0].value||''},
  replaceChildren(...xs){this.children=xs},
  addEventListener(type,handler){this.events[type]=handler},setAttribute(){}};
}
let permission=true,session=true,altered=false,calls=[],opened=[],pending=null,slow=false,denyReason='denied';
const scope={LEVELS,LESSONS,make,window:{getSessionToken:()=>session?'SYNTHETIC_TEACHER':''},
 postQuiz:async(fn,body)=>{
  calls.push({fn,body});
  if(slow)await new Promise(resolve=>{pending=resolve});
  if(!permission)throw Error(denyReason);
  const i=Number(body.pc);
  return {ok:true,quiz_id:altered?'IC5_B1_WQ99':'IC5_'+body.nivel+'_WQ'+String(i).padStart(2,'0'),
   nivel:body.nivel,leccion:LESSONS[i-1][0],peso_oficial:0,vista_previa:true,
   requiere_grupo:false,admite_envio:false,secciones:[{id:'A',preguntas:[{id:'A1'}]}]};
 },
 f111ExamPageUrl:(path,args)=>({path,args}),
 f111TeacherExamModal:(title,url)=>opened.push({title,url})};
vm.createContext(scope);
vm.runInContext(src.slice(start,end)+';this.build=createQz24RehearsalCard',scope);
let checks=0;
function check(ok,msg){assert.ok(ok,msg);checks++}
const legacyGroup={value:''},r=scope.build(legacyGroup);
check(r.card.dataset.f111Qz24Rehearsal==='true','card loaded');
check(r.levelPicker.children.map(x=>x.value).join(',')==='B2,I1,I2','only 24 future quizzes; B1 separate');
check(r.levelPicker.value==='B2','B2 default');
const buttons=()=>r.card.children.at(-1).children;
check(buttons().length===8,'eight buttons without group');
check(buttons()[3].dataset.f111Qz24Lesson==='16','PC04 = L16');
await buttons()[3].events.click();
check(calls.length===1&&calls[0].fn==='qzProgressGet','read-only endpoint');
check(JSON.stringify(calls[0].body)===JSON.stringify({solo_preview_sin_grupo:true,nivel:'B2',pc:4}),
 'no group or calendar sent');
check(opened.length===1&&opened[0].url.path==='modulos/qz24_preview_digital.html',
 'opens independent authentic HTML');
check(opened[0].url.args.nivel==='B2'&&opened[0].url.args.pc===4&&
 !Object.hasOwn(opened[0].url.args,'grupo'),'no group in iframe');
for(const level of ['I1','I2']){
 r.levelPicker.value=level;r.render();
 check(buttons().length===8,'eight quizzes '+level);
 await buttons()[7].events.click();
 check(opened.at(-1).url.args.nivel===level&&opened.at(-1).url.args.pc===8,'PC08 '+level);
}
const valid=opened.length;
permission=false;await buttons()[0].events.click();
check(opened.length===valid,'403 blocks preview');
permission=true;altered=true;await buttons()[0].events.click();
check(opened.length===valid,'cross-level mismatch blocks');
altered=false;session=false;await buttons()[0].events.click();
check(opened.length===valid,'missing session blocks');
session=true;slow=true;
const delayed=buttons()[0].events.click();
r.levelPicker.value='B2';r.render();
pending?.();await delayed;
check(opened.length===valid,'stale server response cannot open');
check(calls.every(c=>c.fn==='qzProgressGet'&&c.body.solo_preview_sin_grupo===true),
 'no attempts, no opens, no student writes');
console.log('F111_QZ24_TEACHER_LEVEL_SELECTOR_E1_PASS '+checks+'/'+checks+
 ' B2/I1/I2 × 8; no group, protected content, zero student writes');
