// F111 B1 PC01 · QA E1 estática, sin Apps Script ni estudiantes reales.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const campus=read('campus.html');
const quiz=read('modulos/qz_b1_pc01_digital.html');
const teacher=read('src/teacher_quiz_review_f111.js');
const student=read('src/student_pc01_f111.js');
const teacherView=read('src/teacher_views.jsx');
const pageScript=quiz.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(pageScript,'quiz digital debe tener script');
new Function(pageScript[1]);new Function(teacher);new Function(student);
assert.ok(campus.includes('src/student_pc01_f111.js'),'script de estudiante cargado');
assert.ok(campus.includes('src/teacher_quiz_review_f111.js'),'script de docente cargado');
assert.ok(student.includes('qzProgressStudentActive'),'alumno consulta su matrícula y apertura desde servidor');
assert.ok(student.includes('r.disponible===true'),'solo mostrar quiz habilitado');
assert.ok(student.includes("url.searchParams.set('live','1')"),'link de alumno usa modo entrega real');
assert.ok(student.includes('window.getSessionToken'),'sin token de estudiante en URL');
assert.ok(!student.includes("url.searchParams.set('token'"),'prohibido poner token en enlace');
assert.ok(quiz.includes("get('live')==='1'"),'dos modos separados preview/live');
assert.ok(quiz.includes('window.parent.getSessionToken'),'formulario real obtiene sesión segura de Campus');
for(const fn of ['qzProgressGet','qzProgressMyAttempt','qzProgressSaveDraft','qzProgressSubmit'])
 assert.ok(quiz.includes("'"+fn+"'"),'API de estudiante '+fn);
assert.ok(quiz.includes('liveUncertain=true')&&quiz.includes('Verificar entrega'),'entrega sin confirmación se verifica, no se reenvía a ciegas');
assert.ok(quiz.includes('if(!liveMode)sessionStorage.setItem'),'respuestas reales no se guardan en almacenamiento de preview');
assert.ok(quiz.includes('Object.keys(allowed).length!==25'),'paridad de 25 campos con servidor');
assert.ok(quiz.includes('b1_pc01_listening_track01.mp3'),'audio autenticado original');
assert.ok(quiz.includes('b1_pc01_original_photo.png'),'foto aprobada intacta');
assert.ok(teacherView.includes('data-f111-lesson-quiz="B1-L4"'),'preview amarillo conservado');
assert.ok(teacher.includes('data-f111-quiz-activation'),'acción de apertura docente en drawer');
assert.ok(teacher.includes('GUARDAR Y CERRAR CLASE'),'apertura UI sólo en lección iniciada');
for(const fn of ['qzProgressTeacherAvailability','qzProgressTeacherSetAvailability',
  'qzProgressTeacherList','qzProgressTeacherReview'])
 assert.ok(teacher.includes("'"+fn+"'"),'API docente '+fn);
assert.ok(teacher.includes('Comentario de Progress Check (obligatorio, independiente de asistencia)'),'segundo comentario visible');
assert.ok(teacher.includes('comentario_progress_check:comment.value.trim()'),'comentario obligatorio se envía aparte');
assert.ok(teacher.includes("gradeInput.type='text'")&&teacher.includes("gradeInput.readOnly=true")&&
 teacher.includes("score.points+'/25 · '+score.percentage.toFixed(0)+'% · '+score.letter")&&
 teacher.includes("Number(result.nota)!==savedScore.percentage"),'equivalencia /25, porcentaje y letra visibles, nota validada en servidor 0–100');
assert.ok(teacher.includes("result.comentario_asistencia_modificado!==false"),'respuesta confirma que asistencia no se tocó');
assert.ok(!teacher.includes('docenteCerrarClaseConAsistenciaF87'),'revisión de quiz no escribe asistencia');
assert.ok(!teacher.includes('registrarNotaComponenteOficial'),'quiz no afecta ponderación INA');
assert.ok(!student.includes('registrarNotaComponenteOficial'),'alumno no escribe notas');
// Isolation contract: login remains on stable institutional Apps Script @462.
const login=read('src/login.jsx');
const qzUrl='https://script.google.com/macros/s/AKfycbwT4nYpH2MqxgP-ydwndWW7OdSkDXRCiI-l4qxBdsqq0IXuTNSKIvogvpj-1PgtsNjZhw/exec';
assert.ok(campus.includes("window.F111_QZ_API_URL='"+qzUrl+"'"),'sólo Campus define URL del Quiz B1 aislado');
assert.equal((campus.match(/F111_QZ_API_URL/g)||[]).length,1,'una única URL de quiz en HTML');
assert.ok(teacher.includes("isQuiz&&window.F111_QZ_API_URL"),'docente envía sólo qzProgress al QZ aislado');
assert.ok(teacher.includes("window.APPS_SCRIPT_URL||''"),'padrón docente permanece en servidor institucional');
assert.ok(student.includes("window.F111_QZ_API_URL||window.APPS_SCRIPT_URL"),'estudiante consulta apertura en QZ B1');
assert.ok(quiz.includes('window.parent.F111_QZ_API_URL||window.parent.APPS_SCRIPT_URL'),'iframe SAVE y SUBMIT usan QZ B1');
assert.ok(!login.includes('F111_QZ_API_URL'),'login independiente del motor de quiz');
assert.ok(login.includes('fn: \'iniciarSesion\''),'login intacto en servidor original');
assert.ok(campus.includes('src/student_pc01_f111.js?v=F111PC01G1EVAL20261023'),'cache student actualizado');
assert.ok(campus.includes('src/teacher_quiz_review_f111.js?v=F111B1R10GROUPONCE20261024'),'cache teacher actualizado');
assert.ok(student.includes("url.searchParams.set('v','F111PC01REVIEWCOLORS20261024')"),'iframe estudiante evita versión antigua en caché');

// Regresión de UX exigida tras la primera entrega de estudiante real.
assert.ok(quiz.includes("submit').textContent='ENTREGAR AHORA'"),'el alumno identifica claramente el envío final');
assert.ok(quiz.includes('PRUEBA ENTREGADA'),'acuse persistente de entrega para el estudiante');
assert.ok(quiz.includes("var confirmed=await call('qzProgressMyAttempt',context)"),'el acuse solo aparece después de leer el expediente real');
assert.ok(quiz.includes('markDelivered(confirmed)')&&quiz.includes('showDeliveryReceipt()'),'respuesta confirmada muestra recibo visible');
assert.ok(quiz.includes('liveUncertain=true')&&quiz.includes('Verificar entrega'),'corte de red nunca reenvía automáticamente una entrega incierta');
assert.ok(quiz.includes("params.get('review')==='1'"),'mismo banco original en modo docente de solo lectura');
assert.ok(quiz.includes("event.origin!==location.origin||event.source!==window.parent"),'mensajes de revisión solo desde la ventana Campus');
assert.ok(quiz.includes("var persist=function(){if(reviewMode)return;"),'revisión docente jamás persiste borradores locales');
assert.ok(teacher.includes('openReviewWorkspace'),'revisión amplia, no formulario incrustado en tarjeta estrecha');
assert.ok(teacher.includes('f111-tqr-workspace-columns')&&teacher.includes('f111-tqr-student-list'),'listado de alumnos a la izquierda y examen a la derecha');
assert.ok(teacher.includes("url.searchParams.set('review','1')"),'abrir banco de 25 preguntas del estudiante, sin duplicarlo');
assert.ok(teacher.includes("frame.contentWindow.postMessage(payload,location.origin)")&&teacher.includes("type:'F111_PC01_TEACHER_REVIEW'")&&teacher.includes("answers:parseAnswers(row),keys,nonce"),'respuestas y clave privada al iframe desde profesor autenticado, sin URL ni almacenamiento');
assert.ok(teacher.includes("'qzProgressTeacherMaterials'"),'profesor puede consultar clave PDF con autorización');
assert.ok(teacher.includes("const verified=await postQuiz('qzProgressTeacherList'"),'revisión académica valida readback');
assert.ok(!teacher.includes('buildReviewEditor(gradePanel)'),'no más formulario comprimido en tarjeta del catálogo');
console.log('PASS F111 PC01 E1 UX: apertura por docente, matrícula por servidor, entrega autenticada, revisión 0–100 con comentario separado, preview conservado');
