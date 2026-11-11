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
assert.ok(campus.includes('teacherexams=F111EXUI05C20261111'),'caché actualizado para código nuevo');
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
assert.ok(view.includes('la disponibilidad de estudiantes continúa sin verificación de lectura pura'),
 'la consulta de entregas no auto-activa el escrito ni promete disponibilidad');
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
// EXUI-05C: navegación contextual sin exponer datos ni conceder permisos.
const modes=read('src/examenes_modes.jsx');
const bundle=read('src/examenes_bundle.jsx');
const examHTML=read('modulos/examenes.html');
assert.ok(app.includes("const top=onWrittenFocus=><>"),'el mismo centro docente ofrece acceso contextual');
assert.ok(app.includes('onWrittenFocus={onWrittenFocus}'),'LazyRoute transmite contexto sin segundo selector');
assert.ok(app.includes("type:'F111_EXUI05C_WRITTEN_FOCUS'"),'mensaje de contexto al iframe, sin token');
assert.ok(app.includes("e.origin!==window.location.origin||e.source!==writtenFrameRef.current?.contentWindow"),
 'respuesta del iframe validada por origen y ventana');
assert.ok(app.includes('setTeacherBankOpen(true)'),'la bandeja escrita se abre desde la tarjeta de examen');
assert.ok(app.includes('F111EXUI05C20261111'),'caché de JSX docente actualizado');
assert.ok(examHTML.includes("F111R57WRITTENPDF20261109B-EXUI05C20261111"),
 'paquete escrito invalidado conservando versión R57');
assert.ok(bundle.includes(modes),'bundle efectivo incluye la bandeja contextual actualizada');
assert.ok(modes.includes("e.origin!==window.location.origin||e.source!==window.parent"),
 'el iframe ignora mensajes de otros orígenes y otras ventanas');
assert.ok(modes.includes("const r = await postExamBackend('examReviewInbox', { cod_grupo:g, queue:'NEEDS_ACTION', limit:120 });"),
 'bandeja solo lee entregas pendientes del grupo autenticado');
assert.ok(modes.includes("const scoped=r.rows.filter(row=>String(row.COD_GRUPO||'').trim().toUpperCase()===g)"),
 'un grupo ajeno o sin código verificable jamás se mezcla en la bandeja');
assert.ok(modes.includes('if(seq!==requestSeq.current)return;'),'resultados asíncronos vencidos no contaminan el grupo nuevo');
assert.ok(modes.includes('if(selectedRef.current)'),'nunca descartar una revisión en curso por cambiar de grupo');
assert.ok(view.includes('data-f111-student-assessment-record="true"'),
 'ficha R57/F91 y nota oficial dentro del mismo estudiante');
assert.ok(view.includes("r.source==='F91'"),'historial F91 no se oculta bajo Extras');
assert.ok(view.includes("openStudentOralHistory(selected,s.code)"),'botón real de rúbrica/PDF por estudiante');
assert.ok(view.includes("openWrittenInbox(selected.lesson,s.code)"),'escrito enfoca estudiante y lección');
const teacherArea=view.split('function TeacherExamsWorkspaceF111(')[1]?.split('function GruposView(')[0]||'';
assert.ok(!teacherArea.includes("onClick={()=>onNavigate&&onNavigate('grupos')"),
 'no hay falsa acción Ver expediente que salte a otro menú');
assert.ok(!view.includes("onClick={openExtra}>{tr('Abrir control de escrito'"),
 'el acceso escrito principal ya no abre módulos de reposición genéricos');
assert.ok(catalog.includes('window.F111_QZ_openSavedOral=openSavedOralForStudent'),
 'historial oral usa el motor institucional existente');
const focusStart=modes.indexOf('const scopedFocus=focus&&focus.grupo===grupo?focus:null;');
const focusEnd=modes.indexOf('const panelGroups=',focusStart);
assert.ok(focusStart>0&&focusEnd>focusStart,'filtro de bandeja contextual presente');
function selectRows(focus,grupo,rows){
 const scope={focus,grupo,rows};
 vm.runInNewContext(modes.slice(focusStart,focusEnd)+';this.exuiRows=visibleRows;',scope);
 return Array.from(scope.exuiRows,x=>x.ATTEMPT_ID);
}
const sample=[
 {ATTEMPT_ID:'correct',COD_GRUPO:'QA-GRUPO-0826',NIVEL:'B1',LECCION:18,COD_ESTUDIANTE:'ST-001'},
 {ATTEMPT_ID:'different-student',COD_GRUPO:'QA-GRUPO-0826',NIVEL:'B1',LECCION:18,COD_ESTUDIANTE:'ST-002'},
 {ATTEMPT_ID:'different-level',COD_GRUPO:'QA-GRUPO-0826',NIVEL:'B2',LECCION:18,COD_ESTUDIANTE:'ST-001'},
 {ATTEMPT_ID:'different-lesson',COD_GRUPO:'QA-GRUPO-0826',NIVEL:'B1',LECCION:32,COD_ESTUDIANTE:'ST-001'},
 {ATTEMPT_ID:'foreign-group',COD_GRUPO:'OTRO-0826',NIVEL:'B1',LECCION:18,COD_ESTUDIANTE:'ST-001'}
];
assert.deepEqual(selectRows({grupo:'QA-GRUPO-0826',nivel:'B1',leccion:18,cod_estudiante:'ST-001'},
 'QA-GRUPO-0826',sample),['correct'],'solo entrega exacta grupo+nivel+lección+estudiante');
assert.equal(selectRows({grupo:'OTRO-GRUPO',nivel:'B1',leccion:18,cod_estudiante:'ST-001'},
 'QA-GRUPO-0826',sample).length,sample.length,
 'foco de otro grupo no tiene efecto sobre bandeja actual');
const oralStart=catalog.indexOf('async function openSavedOralForStudent(context){');
const oralEnd=catalog.indexOf('window.F111_QZ_openSavedOral=',oralStart);
assert.ok(oralStart>0&&oralEnd>oralStart,'historial oral contextual aislado');
async function openOralCase(allowed,records,student='ST-001'){
 const calls=[],modal=[];
 const scope={
  postQuiz:async(fn,payload)=>{
   calls.push(fn);
   return fn==='getDocenteGruposActuales'?{ok:true,todos:allowed.map(code=>({code}))}:{ok:true,rows:records};
  },
  f111AuthorizedCourseGroups:reply=>reply.todos.map(x=>x.code),
  f111TeacherExamModal:(title,url)=>modal.push({title,url}),
  f111ExamPageUrl:(url,ctx)=>({url,ctx}),
 };
 vm.runInNewContext(catalog.slice(oralStart,oralEnd)+';this.openOral=openSavedOralForStudent;',scope);
 const reply=await scope.openOral({grupo:'QA-GRUPO-0826',nivel:'B1',leccion:9,cod_estudiante:student});
 return {reply,calls,modal};
}
const real=[{nivel:'B1',leccion:9,cod_estudiante:'ST-001',fecha:'2026-11-11',cod_grupo:'QA-GRUPO-0826'}];
const ok=await openOralCase(['QA-GRUPO-0826'],real);
assert.equal(ok.reply.ok,true,'rúbrica protegida para un único estudiante válido');
assert.deepEqual(ok.calls,['getDocenteGruposActuales','oralListEvaluacionesDocente'],
 'historial oral solo usa lecturas autorizadas');
assert.equal(ok.modal.length,1,'muestra rúbrica/PDF existente solo tras readback');
const foreign=await openOralCase(['OTRO-0826'],real);
assert.equal(foreign.reply.reason,'grupo_no_asignado','grupo no asignado bloqueado antes del historial');
assert.equal(foreign.calls.length,1,'grupo ajeno no consulta expedientes');
assert.equal((await openOralCase(['QA-GRUPO-0826'],[])).reply.reason,'sin_expediente',
 'sin expediente no se inventa PDF');
assert.equal((await openOralCase(['QA-GRUPO-0826'],[...real,...real])).reply.reason,'historial_ambiguo',
 'duplicados sin identidad unívoca exigen reconciliación, no selección arbitraria');
console.log('PASS EXUI-05C: historial oral contextual, bandeja escrita filtrada, errores cerrados, 0 activaciones');
