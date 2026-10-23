// F111 QZ32: contrato de revisión docente independiente y sin mutaciones.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const catalog=read('src/teacher_quiz_review_f111.js');
const lesson=read('src/teacher_views.jsx');
const campus=read('campus.html');
const quiz=read('modulos/qz_b1_pc01_digital.html');
const audio=readFileSync(new URL('../media/qz32/b1_pc01_listening_track01.mp3',import.meta.url));
new Function(catalog);
assert.ok(campus.includes('src/teacher_quiz_review_f111.js?v='),'se carga en Campus independientemente del código de caché');
assert.ok(catalog.includes('buildQuizOpenControls'),'cierre desde Exámenes al terminar clase');
assert.ok(!catalog.includes("text.includes('B1-KJ18-C3-0826')"),'no exigir código largo ausente del encabezado');
assert.ok(catalog.includes("drawer.querySelector('[data-f111-lesson-quiz=\"B1-L4\"]')"),'el botón autorizado en JSX delimita grupo real');
assert.ok(catalog.includes('Servidor: '),'error explícito cuando la configuración bloquea la apertura');
assert.ok(catalog.includes('Revisión de material de quizzes'),'existe la sección docente');
assert.ok(catalog.includes('section[data-screen-label="Docente · Exámenes"]'),'solo se monta en Exámenes docente');
for(const code of ['B1','B2','I1','I2'])assert.ok(catalog.includes("['"+code+"'"),'nivel '+code);
for(const lessonNumber of [4,8,13,16,21,24,28,30])assert.ok(new RegExp('\\['+lessonNumber+',').test(catalog),'PC '+lessonNumber);
assert.ok(catalog.includes("level==='B1'&&lesson===4"),'solo 1/32 quiz digital disponible');
assert.ok(catalog.includes('Pendiente de digitalizar'),'31 no fingen estar publicados');
assert.ok(catalog.includes('data-f111-quiz-preview'),'botón de catálogo identificado');
assert.ok(lesson.includes('data-f111-lesson-quiz="B1-L4"'),'botón contextual del drawer');
assert.ok(lesson.includes("tvUpper(code)==='B1-KJ18-C3-0826'"),'grupo Diego 0826');
assert.ok(lesson.includes("rielLeccion==='curso'")&&lesson.includes("Number(lesson?.leccion)===4"),'solo PC01 y riel curso');
assert.ok(lesson.includes('canOperateRail&&!closed&&!sesionCerrada'),'respetar permisos del profesor');
for(const source of [catalog,lesson]){
 assert.ok(source.includes("url.searchParams.set('preview','1')"),'abrir modo preview');
 assert.ok(source.includes("url.searchParams.set('rol','docente')"),'marcar vista docente');
}
assert.ok(quiz.includes('b1_pc01_listening_track01.mp3'),'audio original enlazado');
assert.ok(quiz.includes('b1_pc01_original_photo.png'),'foto aprobada');
assert.ok(audio.byteLength>100000,'asset MP3 binario existe');
for(const operation of ['qzProgressSubmit','qzProgressSaveDraft','registrarNotaComponenteOficial','docenteCerrarClaseConAsistenciaF87']){
 assert.ok(!catalog.includes(operation),'docente no entrega quiz del alumno ni altera asistencia: '+operation);
}
assert.ok(catalog.includes("'qzProgressTeacherReview'"),'revisión con nota y comentario de PC');
assert.ok(catalog.includes("'qzProgressTeacherSetAvailability'"),'apertura explícita por docente');
assert.ok(catalog.includes('window.getSessionToken'),'acciones por sesión autenticada, sin token en URL');
assert.ok(catalog.includes('comentario_progress_check:comment.value.trim()'),'comentario PC independiente de asistencia');
assert.ok(catalog.includes("grade.min='0'")&&catalog.includes("grade.max='100'"),'nota por 100');
assert.ok(catalog.includes("GUARDAR Y CERRAR CLASE"),'botón habilitador solo al iniciar lección');
console.log('PASS F111 QZ32 docente: revisión previa, apertura clase, nota PC 0-100, comentario separado de asistencia');
