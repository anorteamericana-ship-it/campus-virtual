// EXUI-05A: regresión de contexto docente; sin tráfico a producción.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const catalog=read('src/teacher_quiz_review_f111.js');
const view=read('src/teacher_views.jsx');
const campus=read('campus.html');
const quiz=read('modulos/qz_b1_pc01_digital.html');
const audio=readFileSync(new URL('../media/qz32/b1_pc01_listening_track01.mp3',import.meta.url));
new Function(catalog);
assert.ok(campus.includes('src/teacher_quiz_review_f111.js?v='),'Campus sigue cargando el motor protegido');
assert.ok(campus.includes('teacherexams=F111EXUI05B20261111'),'caché actualizado para código nuevo');
assert.ok(!catalog.includes("QZ_GROUP"),'ningún grupo constante del docente en controlador');
assert.ok(!catalog.includes("const qzContext={cod_grupo:'B1-KJ18-C3-0826'"),'sin contexto fijo');
assert.ok(!catalog.includes('function buildQuizOpenControls('),'sin segundo activador legacy');
assert.ok(!catalog.includes('function attachLessonAction('),'sin activación inyectada al drawer');
assert.ok(!catalog.includes('function renderGrid('),'sin segundo grid de 8 quizzes');
assert.ok(!catalog.includes('function build(){'),'sin catálogo duplicado');
assert.ok(catalog.includes('function openReviewWorkspace(group)'),'PC01 recibe el grupo concreto');
assert.ok(catalog.includes("const qzContext={cod_grupo:groupCode,nivel:'B1',leccion:4}"),
 'revisión e invitación PC01 tienen grupo contextual');
assert.ok(catalog.includes("qzProgressTeacherB1Groups"),'lista autorizada proveniente del backend');
assert.ok(catalog.includes("groups.some(x=>String(x.cod_grupo)"),'grupo seleccionado debe pertenecer a lista autorizada');
assert.ok(catalog.includes("Number(lesson)===4)openReviewWorkspace(select.value)"),'PC01 revisa grupo seleccionado');
assert.ok(catalog.includes("confirmGroupQuizInvitation(select.value"),'PC01 apertura ligada al grupo del modal');
assert.ok(catalog.includes("gate.puede_abrir!==true"),'segunda validación de elegibilidad antes de activar PC01');
assert.ok(catalog.includes("gate.grupo!==groupCode"),'respuesta debe pertenecer al grupo');
assert.ok(catalog.includes("if(number<1||number>8"),'modal único PC01–PC08');
assert.ok(catalog.includes("!slot.querySelector('[data-f111-teacher-exam-center]')"),'historial avanzado se monta una sola vez');
assert.ok(!catalog.includes('modern.append(buildTeacherExamsF111(),build())'),'ningún duplicado de catálogo en extras');
assert.ok(view.includes('launch(lesson,groupCode)'),'una sola acción por quiz del grupo actual');
assert.ok(!view.includes('i>=1\n                   ?<button'),'Quiz1 ya no apunta a extras');
assert.ok(view.includes("Banco digital no habilitado para este nivel"),'B2/I1/I2 sin falsa disponibilidad');
assert.ok(!view.includes('data-f111-lesson-quiz="B1-L4"'),'sin botón adicional de Quiz1 en el drawer');
assert.ok(catalog.includes("window.getSessionToken"),'QUiZ exige sesión docente');
assert.ok(catalog.includes("isQuiz&&window.F111_QZ_API_URL"),'QUIZ separado del CORE');
assert.ok(catalog.includes("'qzProgressTeacherReview'"),'revisión histórica preservada');
assert.ok(catalog.includes("'qzProgressTeacherSetAvailability'"),'apertura con confirmación preservada');
assert.ok(catalog.includes("comentario_progress_check:comment.value.trim()"),'comentario diagnóstico aparte de asistencia');
for(const op of ['registrarNotaComponenteOficial','docenteCerrarClaseConAsistenciaF87','qzProgressSaveDraft','qzProgressSubmit'])
 assert.ok(!catalog.includes(op),'control docente no escribe calificaciones/asistencia/entregas: '+op);
assert.ok(quiz.includes('b1_pc01_listening_track01.mp3'),'audio original intacto');
assert.ok(audio.byteLength>100000,'audio real retenido');
console.log('PASS EXUI-05A: PC01–PC08 contextual, grupo autorizado, sin duplicados ni activación fija');

 // EXUI-05B: el botón único depende del estado real de CORE+QUIZ, no del calendario.
const app=read('src/app.jsx');
assert.equal((view.match(/data-f111-today-action="true"/g)||[]).length,1,'un bloque de acción hoy');
assert.ok(app.includes('activeSessionReady={activeTeacherCheck.ready} activeSessionError={activeTeacherCheck.error}'),
 'pasar el estado verificado del poll CORE, no la última sesión en caché');
assert.ok(view.includes('activeSessionReady===true&&activeSessionError!==true'),'sesión stale jamás autoriza');
assert.ok(view.includes('activeCode===groupCode'),'sesión debe coincidir con grupo seleccionado');
assert.ok(view.includes("tvUpper(activeSession?.RIEL||activeSession?.riel||'curso')!=='ICAN'"),
 'sesión I CAN no habilita evaluación ordinaria');
assert.ok(view.includes('todayQuiz.eligible===true'),'servidor QUIZ decide si existe acción');
assert.ok(view.includes("if(error||activeSessionError===true)"),'error visible distinto de no elegible');
assert.ok(view.includes("todayStatus.kind!=='oral'"),'no duplicar CTA oral en la tarjeta');
assert.ok(view.includes("todayStatus.kind==='quiz'&&todayStatus.lesson===lesson"),'no duplicar CTA quiz activo');
assert.ok(view.includes("La sesión está activa, pero no hay una consulta de disponibilidad escrita sin efectos secundarios verificada"),
 'no auto-activar escritos en un supuesto GET sin efectos');
assert.ok(!view.includes("postTeacher('examGetCronogramaExamAvailability'"),
 'la acción hoy nunca consulta endpoints escritos con efectos secundarios');
const start=catalog.indexOf('async function readB1TeacherAvailabilityForToday(');
const stop=catalog.indexOf('window.F111_QZ_readTeacherAvailability=',start);
assert.ok(start>0&&stop>start,'helper aislado de lectura QUIZ');
const snippet=catalog.slice(start,stop);
async function probe(groups,availability,lesson=8,group='QA-F111-B1'){
 const calls=[];
 const scope={
  LESSONS:[[4],[8],[13],[16],[21],[24],[28],[30]],
  authorizedB1Groups:async()=>({grupos:groups}),
  postQuiz:async(fn,payload)=>{calls.push({fn,payload});return availability;},
 };
 vm.runInNewContext(snippet+';this.EXUI05B=readB1TeacherAvailabilityForToday',scope);
 return {result:await scope.EXUI05B(lesson,group),calls};
}
const assigned=[{cod_grupo:'QA-F111-B1',nivel:'B1'}];
const eligible=await probe(assigned,{ok:true,grupo:'QA-F111-B1',nivel:'B1',leccion:8,digital_disponible:true,estado:'CERRADO',puede_abrir:true});
assert.equal(eligible.result.eligible,true,'QUIZ permite gestionar lección autorizada');
assert.deepEqual(eligible.calls.map(x=>x.fn),['qzProgressTeacherAvailability'],'solo lectura; jamás POST mutante');
assert.deepEqual(Object.keys(eligible.calls[0].payload).sort(),['cod_grupo','leccion','nivel'],'contexto exacto');
const open=await probe(assigned,{ok:true,grupo:'QA-F111-B1',leccion:8,digital_disponible:true,estado:'ABIERTO',puede_abrir:false});
assert.equal(open.result.alreadyOpen,true,'quiz ya abierto: permite revisar, sin reabrir');
const denied=await probe(assigned,{ok:true,grupo:'QA-F111-B1',leccion:8,digital_disponible:true,estado:'CERRADO',puede_abrir:false});
assert.equal(denied.result.eligible,false,'no elegible aun con fecha/sesión');
const other=await probe([{cod_grupo:'OTRO-GRUPO',nivel:'B1'}],{ok:true,grupo:'QA-F111-B1',leccion:8,digital_disponible:true,estado:'CERRADO',puede_abrir:true});
assert.equal(other.result.ok,false,'grupo extranjero denegado');
assert.equal(other.calls.length,0,'sin consultar disponibilidad de grupo no autorizado');
const mismatch=await probe(assigned,{ok:true,grupo:'OTRO-GRUPO',leccion:8,digital_disponible:true,estado:'CERRADO',puede_abrir:true});
assert.equal(mismatch.result.ok,false,'readback de grupo ajeno bloqueado');
const unsupported=await probe(assigned,{ok:true,grupo:'QA-F111-B1',leccion:18,digital_disponible:true,estado:'CERRADO',puede_abrir:true},18);
assert.equal(unsupported.result.ok,false,'el control no intenta abrir examen escrito como Quiz');
assert.equal(unsupported.calls.length,0,'lección escrita sin consulta QUIZ');
console.log('PASS EXUI-05B: Acción de hoy, sesión CORE vigente, permisos QUIZ read-only y bloqueos negativos');
