// F111 QZ32 · QA E1 de vista estudiante y docente (sin red, sin credenciales).
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const student=read('modulos/quiz_progress.html');
const teacher=read('modulos/quiz_progress_docente.html');
const view=read('src/vista_docente.jsx');
for(const [name,html] of [['student',student],['teacher',teacher]]){
 const m=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(m,'script present '+name);
 new Function(m[1]);
 assert.ok(html.includes('window.F111_QZ_QA_API_URL'),name+' requires explicit QA endpoint injection');
 assert.ok(!html.includes('AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ'),name+' does not target PROD URL');
 assert.ok(!html.includes('_Key.pdf')&&!html.includes('correct:'),name+' has no correct answers');
}
assert.ok(student.includes('0 %'),'student understands zero official weight');
for(const id of [4,8,13,16,21,24,28,30])assert.ok(student.includes(String(id)+':['),'progress lesson '+id);
for(const name of ['qzProgressGet','qzProgressPaper','qzProgressMyAttempt','qzProgressSaveDraft','qzProgressSubmit'])assert.ok(student.includes(name),'student API '+name);
for(const name of ['qzProgressTeacherList','qzProgressTeacherReview','qzProgressTeacherMaterials'])assert.ok(teacher.includes(name),'teacher API '+name);
assert.ok(view.includes('pcQuizReviewSuggestionsF111'),'existing classroom PC closure integrated');
assert.ok(view.includes("String(o.ESTADO||'').toUpperCase()!=='REVISADO'"),'only approved reviews prefill comments');
assert.ok(!teacher.includes('registrarNotaComponenteOficial'));
console.log('PASS F111 QZ32 client QA: parse, all 8 PC dates, student draft/submit, teacher feedback, no grade/keys/prod API hardcode, PC prefill reviewed only');
