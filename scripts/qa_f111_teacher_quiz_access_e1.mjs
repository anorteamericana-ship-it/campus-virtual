// F111 QZ32 — contrato teacher-only de revisión de PC01, sin operaciones académicas.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('src/app.jsx');
const lesson=read('src/teacher_views.jsx');
const quiz=read('modulos/qz_b1_pc01_digital.html');
const data=readFileSync(new URL('../media/qz32/b1_pc01_listening_track01.mp3',import.meta.url));
assert.ok(app.includes("function TeacherQuizReviewF111()"),'teacher quiz catalog exists');
assert.ok(app.includes("<TeacherQuizReviewF111 />{activeExamCard}"),'catalog appears above existing exam cards');
assert.ok(app.includes('Revisión de material de quizzes'),'teacher-facing material title');
assert.ok(app.includes("['B1','Básico I'")&&app.includes("['I2','Intermedio II'"),'all four academic levels');
for(const n of [4,8,13,16,21,24,28,30])assert.ok(new RegExp('\\['+n+',').test(app),'progress lesson '+n);
assert.ok(app.includes("level==='B1'&&lesson===4"),'only first digitized quiz is enabled');
assert.ok(app.includes('Pendiente de digitalizar'),'other lessons remain inactive, not fake links');
assert.ok(lesson.includes('data-f111-lesson-quiz="B1-L4"'),'lesson drawer has dedicated button');
assert.ok(lesson.includes("tvUpper(code)==='B1-KJ18-C3-0826'"),'lesson CTA limited to Diego group');
assert.ok(lesson.includes("rielLeccion==='curso'")&&lesson.includes("Number(lesson?.leccion)===4"),'PC CTA not on I CAN or wrong lesson');
assert.ok(lesson.includes('canOperateRail&&!closed&&!sesionCerrada'),'teacher CTA respects rail and closed lesson');
assert.ok(app.includes("url.searchParams.set('preview','1')")&&lesson.includes("url.searchParams.set('preview','1')"),'preview only');
assert.ok(app.includes("url.searchParams.set('rol','docente')")&&lesson.includes("url.searchParams.set('rol','docente')"),'teacher flow is identified');
assert.ok(quiz.includes("b1_pc01_listening_track01.mp3"),'first quiz has approved original audio');
assert.ok(quiz.includes("b1_pc01_original_photo.png"),'first quiz has approved photo');
assert.ok(data.byteLength>100000,'audio asset exists');
for(const prohibited of ['qzProgressSubmit','qzProgressSaveDraft','qzProgressTeacherReview','registrarNota','habilitarQuiz','fetch('])
  assert.ok(!app.slice(app.indexOf('function TeacherQuizReviewF111()'),app.indexOf('function ExamenesTeacherPanel')).includes(prohibited),'preview widget must not write backend: '+prohibited);
console.log('PASS F111 teacher PC01: independent catalog 4 levels/8 lesson slots, yellow B1 L4 action, Diego-only, preview no production mutations');
