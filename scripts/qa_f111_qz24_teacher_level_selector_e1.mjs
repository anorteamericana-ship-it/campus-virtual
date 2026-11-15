// F111 QZ24 · Mis exámenes: selector por grupo/nivel y ensayo privado de 8 PC.
// Prueba aislada del controlador real; ninguna sesión ni petición de producción.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../src/teacher_quiz_review_f111.js',import.meta.url),'utf8');
const start=src.indexOf('function createQz24RehearsalCard(');
const end=src.indexOf('function buildTeacherExamsF111(){',start);
assert.ok(start>0&&end>start,'QZ24 selector must exist');
assert.ok(src.includes('const rehearsal=createQz24RehearsalCard(select)'),'selector uses authorized group');
assert.ok(src.includes('summary.append(history,rehearsal.card)'),'selector appears in Mis exámenes');
const LEVELS=[['B1','Básico I'],['B2','Básico II'],['I1','Intermedio I'],['I2','Intermedio II']];
const LESSONS=[[4,'1–2'],[8,'3–4'],[13,'5–6'],[16,'7–8'],[21,'9–10'],[24,'11–12'],[28,'13–14'],[30,'15–16']];
function make(tag,text,className){
 const e={tag,textContent:text??'',className:className||'',dataset:{},children:[],disabled:false,events:{},
  append(...xs){this.children.push(...xs)},
  replaceChildren(...xs){this.children=xs},
  addEventListener(type,handler){this.events[type]=handler},
  setAttribute(){}};
 return e;
}
let permission=true,session=true,altered=false,calls=[],opened=[],pending=null,slow=false;
const scope={LEVELS,LESSONS,make,window:{getSessionToken:()=>session?'SYNTHETIC_TEACHER':''},
 postQuiz:async(fn,body)=>{
  calls.push({fn,body});
  if(slow)await new Promise(resolve=>{pending=resolve});
  if(!permission)throw Error('denied');
  const i=LESSONS.findIndex(x=>x[0]===body.leccion)+1;
  return {quiz_id:altered?'IC5_B1_WQ99':'IC5_'+body.nivel+'_WQ'+String(i).padStart(2,'0'),
   nivel:body.nivel,leccion:body.leccion,peso_oficial:0,vista_previa:true};
 },
 f111ExamPageUrl:(path,args)=>({path,args}),
 f111TeacherExamModal:(title,url)=>opened.push({title,url})};
vm.createContext(scope);
vm.runInContext(src.slice(start,end)+';this.build=createQz24RehearsalCard',scope);
let checks=0;
const check=(v,msg)=>{assert.ok(v,msg);checks++};
const sel={value:''},r=scope.build(sel);
check(r.card.dataset.f111Qz24Rehearsal==='true','card is unique');
const buttons=()=>r.card.children.at(-1).children;
check(buttons().length===0,'no group means no quiz links');
sel.value='B2-KJ18-C3-0826';r.render();
check(buttons().length===8,'eight B2 quizzes for assigned group');
check(buttons()[3].dataset.f111Qz24Lesson==='16','PC04 corresponds to L16');
await buttons()[3].events.click();
check(calls.length===1&&calls[0].fn==='qzProgressGet','only read-only source endpoint');
check(JSON.stringify(calls[0].body)===JSON.stringify({cod_grupo:'B2-KJ18-C3-0826',nivel:'B2',leccion:16}),
 'group, level, lesson exact');
check(opened.length===1&&opened[0].url.path==='modulos/quiz_progress.html','preview opens actual interactive form');
check(opened[0].url.args.teacher_preview===1&&opened[0].url.args.grupo==='B2-KJ18-C3-0826',
 'private teacher preview no submit');
for(const lev of ['I1','I2']){
 sel.value=lev+'-KJ18-C3-0826';r.render();
 check(buttons().length===8,'eight quizzes '+lev);
 await buttons()[7].events.click();
 check(opened.at(-1).url.args.nivel===lev&&opened.at(-1).url.args.leccion===30,'correct level/PC08 '+lev);
}
const valid=opened.length;sel.value='I1-KJ18-C3-0826';r.render();
permission=false;await buttons()[0].events.click();check(opened.length===valid,'server permission rejection denies preview');
permission=true;altered=true;await buttons()[0].events.click();check(opened.length===valid,'mismatched quiz metadata blocked');
altered=false;session=false;await buttons()[0].events.click();
check(opened.length===valid,'missing session token blocks preview');
session=true;sel.value='FOREIGN-KJ18';r.render();check(buttons().length===0,'unknown level blocked');
sel.value='I1-KJ18-C3-0826';r.render();slow=true;
const delayed=buttons()[0].events.click();
sel.value='I2-KJ18-C3-0826';r.render();
pending?.();await delayed;check(opened.length===valid,'stale read from previous group cannot open modal');
check(calls.every(c=>c.fn==='qzProgressGet'),'no opening, attempts, notes or student writes');
console.log('F111_QZ24_TEACHER_LEVEL_SELECTOR_E1_PASS '+checks+'/'+checks+
 ' checks; B2/I1/I2 × 8; backend group/level readback; no student actions');
