// F111 · Teacher roster mini attendance + EN/ES source-contract E1.
// Synthetic-only checks; NOT a claim of a live authenticated browser test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const teacher=fs.readFileSync('src/teacher_views.jsx','utf8');
const core=fs.readFileSync('src/f111_attendance_limit_hotfix.js','utf8');
const dict=fs.readFileSync('src/i18n_pilot_f111.js','utf8');
const css=fs.readFileSync('styles/f111_attendance_limit.css','utf8');
const html=fs.readFileSync('campus.html','utf8');
const app=fs.readFileSync('src/app.jsx','utf8');
const bridge=fs.readFileSync('src/att77_bridge.js','utf8');
for (const needle of [
  "window.F111AttendanceLimit.Panel", "rows:allLessons.map(l=>", "tvLessonKeyF97(l)",
  "rail==='curso'?asistenciaDetalle", "program:meta?.programa",
  "compact:true", "ROW_H=168", "tvF111Translate(day.label)",
  "tvF111Translate('Cronograma del grupo')",
  "tvF111Translate('Elegí el grupo que querés visualizar.')",
  "tvF111Translate('Cumplen asistencia')"
]) assert(teacher.includes(needle),'missing teacher integration: '+needle);
assert(css.includes('teacher-roster-identity .f111-al-compact .f111-al-top{display:none}'),'compact layout');
assert(css.includes('teacher-roster-identity .f111-al-compact .f111-al-rails'),'rails visible');
for (const key of ['Gestión académica','Grupos','Elegí el grupo que querés visualizar.','LUNES',
  'MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO','DOMINGO','Cumplen asistencia',
  'Cronograma del grupo','TOTAL','SOLO LECCIONES','SOLO I CAN','Estado de asistencia'])
  assert(dict.includes(JSON.stringify(key)+':'),'missing English dictionary key: '+key);
for (const text of [html,app,bridge])assert(text.includes('F111ROSTER20261104'),'cache bust missing');
const window={React:{createElement:(type,props,...children)=>({type,props,children})},
  AN_I18N:{getLang:()=> 'en'}};
vm.runInNewContext(core,{window});
const A=window.F111AttendanceLimit;
const course=(n)=>Array.from({length:n},(_,i)=>({riel:'curso',leccion:i+1,p:false,duracion_horas:3}));
const ican=(n)=>Array.from({length:n},(_,i)=>({riel:'ican',leccion:i+1,p:false,duracion_horas:2}));
const baseline=A.summarize({rows:course(3).concat(ican(1)),program:'INA'});
assert.equal(baseline.status,'near');
assert.equal(baseline.by.course.absent,3);
assert.equal(baseline.by.ican.absent,1);
assert.equal(baseline.by.course.hours+baseline.by.ican.hours,11);
const unknown=A.summarize({rows:[{riel:'curso',leccion:1,p:null}],program:'INA'});
assert.equal(unknown.by.course.absent,0);
assert.equal(unknown.status,'unknown');
const render=JSON.stringify(A.Panel({rows:course(3).concat(ican(1)),program:'INA',compact:true}));
assert(render.includes('Approaching limit'),'English runtime status missing');
assert(render.includes('Lessons'),'English runtime rail label missing');
console.log('F111 ROSTER + EN/ES E1 PASS: scoped rails, compact placement, dictionary and 11h reference QA, no data writes.');
