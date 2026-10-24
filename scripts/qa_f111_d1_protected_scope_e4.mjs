// F111 PR-D2 E2 · Strict change scope against deployed Campus 9a63461.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const BASE='9a63461feb6622a73d6ef5b90a1dc5900a93f8ad';
const read=n=>fs.readFileSync('src/'+n,'utf8');
const previous=n=>execFileSync('git',['show',BASE+':src/'+n],{encoding:'utf8',maxBuffer:32*1024*1024});
const protectedFiles=['examenes_css.jsx','examenes_appcss.jsx','examenes_modes.jsx'];
for(const n of protectedFiles)assert.equal(read(n),previous(n),'Protected exam renderer, motor student, style or administration changed: '+n);
// E4: se permite UNICAMENTE el alias de 2 formatos en ReadingTF; sin alterar el motor restante.
let expectedRenderer=previous('examenes_render.jsx');
const replacements=[
  ["function ReadingTF({ sec, answers, onAnswer, ro, mode, showKey, review }) {\n  return (",
   "function ReadingTF({ sec, answers, onAnswer, ro, mode, showKey, review }) {\n  // F111 E4 · Compatibilidad de lectura Cambridge: los 16 bancos V10G pueden usar\n  // passageTitle/passage o title/paragraphs. No asumir que sec.passage existe.\n  const passageTitle = sec.passageTitle || sec.title || '';\n  const paragraphs = Array.isArray(sec.passage) ? sec.passage : (Array.isArray(sec.paragraphs) ? sec.paragraphs : []);\n  return ("],
  ['<h3 className="expass-title">{sec.passageTitle}</h3>','<h3 className="expass-title">{passageTitle}</h3>'],
  ['{sec.passage.map((p, i) => <p key={i}>{p}</p>)}','{paragraphs.map((p, i) => <p key={i}>{p}</p>)}']
];
for(const [old,newValue] of replacements){
 assert.equal(expectedRenderer.split(old).length-1,1,'Renderer E4 anchor unique');
 expectedRenderer=expectedRenderer.replace(old,newValue);
}
assert.equal(read('examenes_render.jsx'),expectedRenderer,'ReadingTF E4 delta only: engine outside this alias is protected');
const before=previous('examenes_data.jsx'),after=read('examenes_data.jsx');
const markOld='// CONTENIDO REAL — I2_WRITTEN_L18_TEST1_A';
const beginOld=before.lastIndexOf('// ──',before.indexOf(markOld));
const beginNew=after.indexOf('// F111 EX-04 E2 · Proyección pública');
const endLabel='// Registro de exámenes con contenido real/oficial (lookup por id).';
const endOld=before.indexOf(endLabel),endNew=after.indexOf(endLabel);
assert(beginOld>0&&beginNew>0&&endOld>beginOld&&endNew>beginNew,'Data bank replacement boundaries');
assert.equal(after.slice(0,beginNew),before.slice(0,beginOld),'Data metadata prefix mutated');
// E3 · retirar todas las respuestas de los 16 fixtures históricos públicos sin cambiar sus metadatos.
const originalTail=before.slice(endOld);
const fixtureRe=/respuestas:\s*\{[\s\S]*?\n  \}(?=,?\s*\n\};)/g;
const fixtureMatches=[...originalTail.matchAll(fixtureRe)];
assert.equal(fixtureMatches.length,16,'Fixtures públicos esperados: 16');
const safeTail=originalTail.replace(fixtureRe,'respuestas: {}');
assert.equal(after.slice(endNew),safeTail,'Registry o metadatos de demos cambiados fuera de E3');
const evalData=s=>{
 const sandbox={window:{}};vm.runInNewContext(s,sandbox,{timeout:6000});return sandbox.window.EXAMS;
};
const oldBank=evalData(before),newBank=evalData(after);
assert.equal(Object.keys(oldBank).length,16);
assert.deepEqual(Object.keys(newBank).sort(),Object.keys(oldBank).sort(),'16 IDs correctos, sin cambios de formulario');
const sensitive=new Set(['correct','accepted','answer','answers','answerkey','answerkeys','answerskey','audioscript','audioscripts','transcript','script','solution','solutions','markscheme','key','teacherkey','privatekey','rubricprivate','gradingkey','correctanswer','correctanswers','acceptedanswers','correctoption','correctchoice','answerkeyfuente','audioscriptfuente','fuenteoriginal','atribucion','teachernotes','note']);
function scanNoKey(node,p='root'){
 if(!node||typeof node!=='object')return;
 for(const [key,value] of Object.entries(node)){
  const canon=key.toLowerCase().replace(/[\s_-]/g,'');
  assert(!sensitive.has(canon),'EX-04 contenido confidencial en payload público, propiedad '+p+'.'+key);
  scanNoKey(value,p+'.'+key);
 }
}
const shape=x=>x.sections.map(sec=>({letter:sec.letter,type:sec.type,points:sec.points,ids:(sec.questions||[]).map(q=>q.id)}));
for(const id of Object.keys(oldBank)){
 assert.equal(newBank[id].id,id,'ID público '+id);
 assert.deepEqual(JSON.parse(JSON.stringify(shape(newBank[id]))),JSON.parse(JSON.stringify(shape(oldBank[id]))),'Estructura de preguntas modificada '+id);
 scanNoKey(newBank[id],id);
}
assert(!/\b(correct|accepted|audioScript)\s*:/.test(after.slice(beginNew,endNew)),'Marcas privadas en archivo distribuido');
const app=read('examenes_app.jsx'),old=previous('examenes_app.jsx');
const helperStart=app.indexOf('// F111 PR-D2 E1 · contrato estricto'),helperEnd=app.indexOf('function StudentLiveExamApp()',helperStart);
const addedGuard=app.indexOf('  if (!f111ExamPublicContractSafe(publicExam, activation))'),startStudentMode=app.indexOf('  return <StudentMode\n',addedGuard);
assert(helperStart>0&&helperEnd>helperStart&&addedGuard>helperEnd&&startStudentMode>addedGuard,'Student guard anchored before runtime');
let restored=app.slice(0,addedGuard)+app.slice(startStudentMode);
restored=restored.slice(0,helperStart)+restored.slice(helperEnd);
const boundA='function ControlBar(',boundB='class ExamRuntimeBoundaryF950';
const cutNew=restored.indexOf(boundA),cutOld=old.indexOf(boundA);
const tailNew=restored.indexOf(boundB),tailOld=old.indexOf(boundB);
const appNewStart=restored.indexOf('function App()'),appOldStart=old.indexOf('function App()');
const accessNew=restored.indexOf('function AccessBlockedView'),accessOld=old.indexOf('function AccessBlockedView');
assert(appNewStart>0&&accessNew>appNewStart&&cutNew>accessNew&&tailNew>cutNew,'Component order in E2 guard');
assert.equal(restored.slice(0,appNewStart),old.slice(0,appOldStart),'Student or teacher program changed outside E2');
assert.equal(restored.slice(accessNew,cutNew),old.slice(accessOld,cutOld),'Shared access and runtime changed outside E2');
assert.equal(restored.slice(tailNew),old.slice(tailOld),'Protected React bootstrap/runtime changed outside E2');
const preview=restored.slice(cutNew,tailNew),appSection=restored.slice(appNewStart,accessNew);
for(const marker of ['Practicar este examen (sin guardar)','examGetPrivatePreviewF111','superadmin_private_preview','privateExam && privateExam.id === requestedId']){
 assert(app.includes(marker),'Mandatory E2 guard/UX absent '+marker);
}
assert(!/\bexam(?:PushReviewToNotas|CloseReview|SubmitAttempt|SaveAttemptDraft)\b/.test(preview),'Admin preview must never save grade/attempt');
assert(appSection.includes("setPreviewKey(false);")&&appSection.includes("setPreviewKey(true);"),'Preview key needs secure gating');
assert(app.slice(helperStart,helperEnd).includes('f111ExamPublicContractSafe'),'Student backend payload guard missing');
const names=['examenes_css.jsx','examenes_appcss.jsx','examenes_data.jsx','examenes_render.jsx','examenes_modes.jsx','examenes_app.jsx'];
const bundle=read('examenes_bundle.jsx'),prefix=bundle.slice(0,bundle.indexOf('// ===== '+names[0]+' ====='));
assert(prefix.includes('Generado desde:'),'Effective bundle header');
assert.equal(bundle,prefix+names.map(n=>'// ===== '+n+' =====\n\n'+read(n)+'\n').join(''),'Effective bundle 6/6 drift');
console.log('F111 E2 STRICT SCOPE PASS: 16/16 same structure, zero private keys in public forms, student+teacher runtime protected, 6/6 bundle.');
console.log('HISTORICAL EX-04 remains NO-GO until deployed production verified and exposed forms reviewed.');
