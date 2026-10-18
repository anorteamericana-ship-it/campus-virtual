// F111 D3 - regresión estática/VM del frontend de oral sin navegador, red ni datos reales.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync('modulos/examen_oral.html','utf8');
function extract(name){
 const start=html.indexOf('function '+name+'(');
 assert(start>=0,'Función frontend ausente '+name);
 const brace=html.indexOf('{',start);
 let depth=0;
 for(let i=brace;i<html.length;i++){
  if(html[i]==='{')depth++;
  else if(html[i]==='}'&&--depth===0)return html.slice(start,i+1);
 }
 throw Error('Función sin cierre '+name);
}
const criteria=['COMPREHENSION','FLUENCY','GRAMMAR','VOCABULARY','PRONUNCIATION'];
const context=vm.createContext({
 state:{panel:{nivel:'B2'},scores:{}},QB:{1:{title:'Intro fixture ONLY'}},
 CRITERIA:criteria.map(k=>[k]),
 examWeightF90:()=>15,
 Number,Object,String
});
vm.runInContext(extract('examWeightF90'),context);
vm.runInContext(extract('calc'),context);
vm.runInContext(extract('questionBankForLevelF111'),context);
vm.runInContext(extract('stateTag'),context);
let checks=0;
function verify(cond,msg){assert(cond,msg);checks++;}
context.state.panel.peso_porcentaje=95;
verify(context.examWeightF90()===15,'El panel no puede alterar ponderación oral');
verify(context.calc().complete===false,'No evalúa vacío como cero');
for(const name of criteria)context.state.scores[name]=null;
verify(context.calc().complete===false,'No califica cinco criterios nulos');
for(const name of criteria)context.state.scores[name]='';
verify(context.calc().complete===false,'No califica cinco criterios en blanco');
for(const name of criteria)context.state.scores[name]=0;
let score=context.calc();
verify(score.complete===true&&score.total===0&&score.nota100===0,'Cinco ceros voluntarios sí son válidos');
criteria.forEach((k,i)=>context.state.scores[k]=i+1);
score=context.calc();
verify(score.complete===true&&score.total===15&&score.nota100===60&&score.pond===9,'5 criterios válidos, nota 60, aporte 9');
verify(Object.keys(context.questionBankForLevelF111()).length===0,'Banco Intro no se presenta en B2');
context.state.panel.nivel='I1';
verify(Object.keys(context.questionBankForLevelF111()).length===0,'Banco Intro no se presenta en I1');
context.state.panel.nivel='I2';
verify(Object.keys(context.questionBankForLevelF111()).length===0,'Banco Intro no se presenta en I2');
context.state.panel.nivel='B1';
verify(Object.keys(context.questionBankForLevelF111()).length===1,'Banco existente se preserva solo en B1');
verify(html.includes('b.dataset.crit]!=null')&&html.includes("trim()!==''"),'Marcado visual 0 no se activa por defecto');
verify(html.includes('El banco de preguntas de este nivel aún no está validado.'),'Aviso explícito en niveles sin banco');
verify(!html.includes('const data=QB[u]'),'No usar el banco sin nivel en UI');
verify(context.stateTag('CIERRE_PENDIENTE_NOTA','CONCILIACION_REQUERIDA')[1].includes('Conciliar'), 'Cierre incierto nunca aparece cerrado');
verify(context.stateTag('CIERRE_PENDIENTE_NOTA','ERROR')[1].includes('pendiente'), 'Fallo previo aparece pendiente');
verify(html.includes("e.evaluacion=j?.evaluacion||null"),'Error del servidor preserva evaluación pendiente');
verify(html.includes('oralSyncWarningF111(ev);renderStudents()'),'Mensaje de conciliación visible al seleccionar estudiante');
verify(html.includes('function oralNeedsReviewF111(')&&html.includes('if(oralNeedsReviewF111(state.evaluations[state.selected.codigo]))'),'No permitir cierre/PDF de nota incierta o parcial');
verify(html.includes('if(oralLockedF111(prev))')&&html.includes('if(oralLockedF111(state.evaluations[state.selected.codigo]))'),'No editar ni guardar borrador sobre cierre parcial o nota incierta');
verify(html.includes('id="btn-draft"')&&html.includes("getElementById('btn-draft').onclick=saveDraft"),'El borrador tiene control visible y enlazado');
verify(html.includes('state.dirty=true')&&html.includes('if(!interno&&state.dirty'),'No descartar cambios al alternar estudiantes');
verify(html.includes('oralCompletedF111(ev)?evaluados:pendientes'),'Conteo cerrado solo con nota sincronizada');
verify(html.includes('oralNeedsReviewF111(ev)||!!state.panel?.preview'),'Bloqueo visual de cierres parciales y vista previa');
console.log('F111_D3_ORAL_FRONTEND_LEVEL_GUARD_PASS checks='+checks+' ; B2 banco bloqueado, rubric missing protected, browser=0 PROD=0');
