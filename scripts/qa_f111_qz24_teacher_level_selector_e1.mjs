// F111 QZ24 · UX docente: una selección de nivel + PC y una única acción de lectura.
// Se ejecuta sobre el controlador real en VM; sin credenciales ni escrituras.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../src/teacher_quiz_review_f111.js',import.meta.url),'utf8');
const start=src.indexOf('function createQz24RehearsalCard(');
const end=src.indexOf('function buildTeacherExamsF111(){',start);
assert.ok(start>0&&end>start);
assert.ok(src.includes('const rehearsal=createQz24RehearsalCard(select)'));
assert.ok(src.includes('summary.append(rehearsal.card,history)'));
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
const check=(value,why)=>{assert.ok(value,why);checks++};
const legacyGroup={value:''},r=scope.build(legacyGroup);
check(r.card.dataset.f111Qz24Rehearsal==='true','card loaded');
check(r.levelPicker.children.map(x=>x.value).join(',')==='B2,I1,I2','B1 keeps historic flow');
check(r.levelPicker.value==='B2','B2 default');
check(r.pcPicker.children.length===8,'8 checks in a select, not a wall of buttons');
check(r.card.children[2].children.filter(x=>x.tag==='button').length===1,'only one CTA');
check(r.openButton.textContent==='Ver Progress Check','single primary action');
r.pcPicker.value='4';r.render();
check(r.openButton.dataset.f111Qz24Lesson==='16','PC04 = L16');
await r.openButton.events.click();
check(calls.length===1&&calls[0].fn==='qzProgressGet','read-only endpoint');
check(JSON.stringify(calls[0].body)===JSON.stringify({solo_preview_sin_grupo:true,nivel:'B2',pc:4}),
 'no group or calendar sent');
check(opened.length===1&&opened[0].url.path==='modulos/qz24_preview_digital.html',
 'opens private HTML');
check(opened[0].url.args.nivel==='B2'&&opened[0].url.args.pc===4&&
 !Object.hasOwn(opened[0].url.args,'grupo'),'no group in iframe');
for(const level of ['I1','I2']){
 r.levelPicker.value=level;r.pcPicker.value='8';r.render();
 check(r.pcPicker.children.length===8,'selector retained at '+level);
 await r.openButton.events.click();
 check(opened.at(-1).url.args.nivel===level&&opened.at(-1).url.args.pc===8,'PC08 '+level);
}
const valid=opened.length;
permission=false;await r.openButton.events.click();
check(opened.length===valid,'denied role cannot open');
permission=true;altered=true;await r.openButton.events.click();
check(opened.length===valid,'cross-level mismatch blocked');
altered=false;session=false;await r.openButton.events.click();
check(opened.length===valid,'missing session blocked');
session=true;slow=true;
const delayed=r.openButton.events.click();
r.pcPicker.value='7';r.render();
pending?.();await delayed;
check(opened.length===valid,'stale response after changing PC cannot open');
slow=false;
check(calls.every(c=>c.fn==='qzProgressGet'&&c.body.solo_preview_sin_grupo===true),
 'only read calls; no student writes');
console.log('F111_QZ24_TEACHER_UX_E1_PASS '+checks+'/'+checks+
 ' single action, 3 levels, 8 PCs, no groups, no writes');
