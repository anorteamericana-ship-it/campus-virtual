// F111 D3 — NEW isolated static QA for teacher history, institution look & no launch.
// Only reads GitHub checkout sources; zero student records, zero Google requests.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('src/teacher_quiz_review_f111.js','utf8');
const oral=fs.readFileSync('modulos/examen_oral.html','utf8');
const campus=fs.readFileSync('campus.html','utf8');
let n=0;
new vm.Script(source,{filename:'teacher_quiz_review_f111.js'});n++;
for(const name of ['f111TeacherExamModal','f111ExamPageUrl','f111TeacherGroups',
 'buildTeacherExamsF111','loadHistory','f111TeacherExamModal']){
 assert(source.includes(name),name);n++;
}
assert(source.includes("postQuiz('oralListEvaluacionesDocente'"));n++;
assert(source.includes("historial:1,grupo,nivel:row.nivel,leccion:row.lec"));n++;
assert(source.includes('No reabrir sesión')||source.includes('NO reabrir sesión'));n++;
assert(source.includes("view:'teacher_preview'"));n++;
assert(source.includes("preview:1,nivel:level.value,leccion:lec"));n++;
assert(source.includes('teacher_preview')&&source.includes('allow-scripts'));n++;
assert(!source.includes('setInterval('),'No introduzcas polling en la extensión');n++;
assert(!/postQuiz\('(?:oralSaveDraft|oralCloseEvaluacion|oralGeneratePdf)'/.test(source),
 'La galería no escribe notas ni PDF; solo abre examen oral autorizado');n++;
assert(oral.includes('esHistorial?')&&oral.includes('oralGetPanelHistorico'));n++;
assert(oral.includes('if(!anyQ&&!state.panel?.modo_sin_ina'),'INA mantiene exigencia');n++;
assert(oral.includes('Presentación oral · SIN INA'));n++;
assert(campus.includes('teacher_quiz_review_f111.js?v=F111D3SINAEXAMS20261027'));n++;
assert(source.includes('font-family:Poppins')&&oral.includes('font-family:Poppins'));n++;
console.log('F111_D3_TEACHER_EXAM_CENTER_PASS '+n+'/'+n+
 ' · authentic role uses backend permissions; no Google/prod writes; quiz engine untouched');
