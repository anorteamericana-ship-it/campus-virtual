// F111 Student demo EN · source-contract QA. No network, production writes, or real student data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read = path => fs.readFileSync(path,'utf8');
const lang=read('src/i18n_pilot_f111.js');
const menu=read('src/student_menu_academic_cs21a120.jsx');
const guard=read('src/student_menu_academic_guard_cs21a120.js');
const tasks=read('src/student_tasks_menu_cs21a126.js');
const sidebar=read('src/sidebar.jsx');
const course=read('src/student_experience.jsx');
const dashboard=read('src/student_dashboard.jsx');
const content=read('src/student_content_access_cs21a125.jsx');
const summary=read('src/student_academic_summary_dom_cs21a113.js');
const html=read('campus.html');
const app=read('src/app.jsx');
assert(menu.includes('F111_HIDE_UNREADY_STUDENT_MODULES ? []'), 'I CAN student navigation hidden');
assert(tasks.includes('F111_HIDE_TASKS_FROM_DEMO = true')&&tasks.includes('if (!F111_HIDE_TASKS_FROM_DEMO) {'), 'Tasks menu insertion and observer disabled');
assert(sidebar.includes('false && mostrarICAN'), 'student fallback menu must hide I CAN');
assert(course.includes('const showTasksTabF111 = false')&&course.includes("showTasksTabF111 && <StudentTabButtonF984"), 'student course Tasks tab hidden');
assert(dashboard.includes('false && esINA && <ModICAN'), 'dashboard I CAN navigation tile hidden');
assert(!menu.includes("id:'ican',label:'Club I CAN',icon:'ican'},\n"), 'unconditional I CAN item');
assert(content.includes("studentContentT('Contenido académico autorizado')"), 'translated student content header');
assert(content.includes('studentContentT("Seleccioná una lección para verla directamente desde Drive.")'), 'translated lesson plan instructions');
assert(content.includes('studentContentT("Lección")'), 'translated lesson tiles');
assert(menu.includes('studentAcademicT(eyebrow)')&&menu.includes('studentAcademicT(title)'), 'general schedule and study plan titles translated');
assert(summary.includes('st113(title)')&&summary.includes('st113("Expediente académico consolidado")'), 'academic summary translated');
assert(summary.includes('esc(r?.comentario)'), 'authentic teacher feedback untouched');
for(const asset of [html,app,guard,menu])assert(asset.includes('F111STUDENTDEMO20261104'),'missing cache refresh marker');
const state=new Map([['an_usuario',JSON.stringify({rol:'student'})],['an_login_recent_at','demo-student']]);
const sessionStorage={getItem:k=>state.get(k)??null,setItem:(k,v)=>state.set(k,String(v)),removeItem:k=>state.delete(k)};
const window={location:{search:'',reload(){}},sessionStorage,document:{documentElement:{lang:''},title:''}};
vm.runInNewContext(lang,{window,URLSearchParams});
assert.equal(window.AN_I18N.getLang(),'en','student default English');
for(const [es,en] of [
 ['Planificación Académica','Academic Planning'],
 ['Cronograma general','General Schedule'],
 ['Cronograma general oficial del programa.','Official schedule for the full program.'],
 ['Contenido académico autorizado','Authorized Academic Content'],
 ['Plan de Estudio','Study Plan'],
 ['Planeamiento por lección','Lesson Plan'],
 ['Lección','Lesson']
]) assert.equal(window.AN_I18N.t(es),en,'English translation: '+es);
assert.equal(window.AN_I18N.setLang('es'),true);
assert.equal(window.AN_I18N.getLang(),'es','ES remains selectable');
state.set('an_usuario',JSON.stringify({rol:'teacher'}));
state.set('an_login_recent_at','demo-teacher');
assert.equal(window.AN_I18N.getLang(),'en','teacher default EN');
console.log('F111 STUDENT DEMO EN E1 PASS: hidden non-ready student routes, dictionary, course and academic documents, no data writes.');
