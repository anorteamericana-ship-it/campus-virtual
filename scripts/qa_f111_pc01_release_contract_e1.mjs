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
assert.ok(teacher.includes("grade.min='0'")&&teacher.includes("grade.max='100'"),'nota 0–100 validada');
assert.ok(teacher.includes("result.comentario_asistencia_modificado!==false"),'respuesta confirma que asistencia no se tocó');
assert.ok(!teacher.includes('docenteCerrarClaseConAsistenciaF87'),'revisión de quiz no escribe asistencia');
assert.ok(!teacher.includes('registrarNotaComponenteOficial'),'quiz no afecta ponderación INA');
assert.ok(!student.includes('registrarNotaComponenteOficial'),'alumno no escribe notas');
console.log('PASS F111 PC01 E1: apertura por docente, matrícula por servidor, entrega autenticada, revisión 0–100 con comentario separado, preview conservado');
