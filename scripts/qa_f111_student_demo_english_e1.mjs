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
const summaryCss=read('styles/student_academic_summary_cs21a113.css');
const html=read('campus.html');
const app=read('src/app.jsx');
const grades=read('src/student_modules.jsx');
const syllabus=read('src/syllabus_views.jsx');
const requests=read('src/solicitudes_unificadas.jsx');

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
assert(summary.includes("lessonFeedbackSection(courseFeedbackRows,32,'L')"), 'lesson comments placed below 32 attendance tiles');
assert(summary.includes("lessonFeedbackSection(icanFeedbackRows,16,'I')"), 'I CAN session comments only in I CAN attendance panel');
assert(summary.includes("panel('Club I CAN'"), 'I CAN attendance matrix remains visible in academic summary');
assert(!summary.includes("d.isINA?'ican':''"), 'no button navigates to unfinished standalone I CAN screen');
assert(summary.includes("esc(r?.comentario)"), 'teacher comments escaped, never translated or modified');
assert(summaryCss.includes('.as113-lesson-comments-grid')&&summaryCss.includes('@media(max-width:620px)'), 'lesson feedback responsive');
assert(html.includes('fb=F111STUDENTFEEDBACK20261104A'), 'student UI cache-bust applied');
assert(lang.includes('"Comentarios por lección": "Feedback by Lesson"'), 'new feedback labels translated');
assert(menu.includes('studentAcademicT(label)')&&menu.includes('studentAcademicT("No hay planeamientos publicados para este nivel.")'),'lesson detail captions localize; original material values remain unchanged');
assert(course.includes('contactActionLabelsF111')&&course.includes('studentExperienceT(contactActionLabelsF111[tipo]'),'help contact buttons localize');
assert(grades.includes('studentGradesT')&&grades.includes("studentGradesT('Detalle de evaluaciones')"),'grades inner table localizes');
assert(grades.includes("studentGradesT(_smStatusLabel_(row))"),'grades status badges localized without modifying status codes');
assert(syllabus.includes('catalogoT')&&syllabus.includes('studentInfoT')&&syllabus.includes("catalogoT('Asignatura')")===false,'materials and program screen localize without translating actual lesson values');
assert(requests.includes('studentRequestsT')&&requests.includes('studentRequestsDate')&&requests.includes("f92Post('reposEnviarSolicitudF92'"),'make-up exam UI translated while request endpoint unchanged');
assert(requests.includes('function ReposicionesAdminSolicitudesF92'),'admin make-up requests still exist');
assert.equal(app.split('&deep=F111STUDENTDEEPTABS20261104A').length-1,8,'eight targeted student lazy assets refresh');
assert.equal(html.split('&deep=F111STUDENTDEEPTABS20261104A').length-1,3,'dictionary, menu and app scripts refresh');
assert(menu.includes("F111_HIDE_UNREADY_STUDENT_MODULES ? []"),'standalone I CAN student navigation stays hidden');
assert(summary.includes("panel('Club I CAN'"),'I CAN attendance unchanged');


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
 ['Lección','Lesson'],
 ['Comentarios por lección','Feedback by Lesson'],
 ['Comentarios por sesión I CAN','I CAN Session Feedback'],
 ['Reposiciones','Make-up Exams'],
 ['Biblioteca del curso','Course Library'],
 ['Notas','Grades'],
 ['Detalle de evaluaciones','Assessment Details'],
 ['Ayuda y contactos','Help & Contacts'],
 ['Contactar al área académica','Contact Academic Office'],
 ['No hay planeamientos publicados para este nivel.','No lesson plans have been published for this level.'],
 ['Reportar pago de ₡10.000','Report ₡10,000 Payment'],
 ['Comentarios por lección','Feedback by Lesson']
]) assert.equal(window.AN_I18N.t(es),en,'English translation: '+es);
assert.equal(window.AN_I18N.setLang('es'),true);
assert.equal(window.AN_I18N.getLang(),'es','ES remains selectable');
state.set('an_usuario',JSON.stringify({rol:'teacher'}));
state.set('an_login_recent_at','demo-teacher');
assert.equal(window.AN_I18N.getLang(),'en','teacher default EN');
console.log('F111 STUDENT DEMO EN E1 PASS: hidden non-ready student routes, dictionary, course and academic documents, no data writes.');
