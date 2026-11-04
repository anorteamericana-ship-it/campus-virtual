// F111 — Student Calendar EN/ES E1. Synthetic, read-only; no backend calls or student records.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = p => fs.readFileSync(p, 'utf8');
const calendar = read('src/cronograma_grupo.jsx');
const language = read('src/i18n_pilot_f111.js');
const html = read('campus.html');
const app = read('src/app.jsx');
const menu = read('src/student_menu_academic_cs21a120.jsx');
const summary = read('src/student_academic_summary_dom_cs21a113.js');
const d1 = read('scripts/qa_f111_superadmin_single_center_20261017.mjs');

const key = 'F111STUDENTCALEN20261104A';
assert.equal(html.split('&calendar=' + key).length - 1, 2, 'live app and dictionary refreshed');
assert.equal(app.split('&calendar=' + key).length - 1, 2, 'only student calendar and dashboard lazy views refreshed');
assert(app.includes("src/cronograma_grupo.jsx?v=F111ATTEND20261021&calendar=" + key), 'student course route selects refreshed calendar');
assert(d1.includes("replaceAll('&calendar=" + key + "','')"), 'historic admin D1 gate knows cache-only diff');
assert(menu.includes('F111_HIDE_UNREADY_STUDENT_MODULES ? []'), 'unfinished I CAN menu remains hidden');
assert(summary.includes("panel('Club I CAN'"), 'I CAN attendance panel remains visible');
assert(calendar.includes("onClick={() => setNivel('ICAN')}"), 'I CAN calendar tab remains available');
assert(calendar.includes("getSesionClaseEstudiante"), 'meeting session check preserved');
assert(calendar.includes('fetchMaterialLeccion'), 'protected PDF retrieval preserved');

for (const name of ['CronogramaGrupo','VistaTabsCrono','LeccionBloque','VistaProxima',
  'VistaSemana','VistaLista','Mes','ProgressBar32','PanelDetalle','DetalleLeccion',
  'AccionesClaseEstudiante','BotonMaterialPDF','Leyenda']) {
  assert(calendar.includes('function ' + name + '(') || calendar.includes('function ' + name + '({'),
    'calendar component still exists: ' + name);
}
assert(calendar.includes("cgStudentUiT(meta.label)"), 'student status badges translated in lesson cards');
assert(calendar.includes("cgStudentUiT(estadoLabel)"), 'detail status labels translated');
assert(calendar.includes("cgStudentUiT(t.label)"), 'calendar inner view tabs translated');
assert(calendar.includes("cgStudentUiT(it.l)"), 'calendar legend translated');
assert(calendar.includes("cgStudentShiftT(selLec.turno)"), 'morning and tomorrow distinct');
assert(calendar.includes("cgStudentMonthFull(month)"), 'month grid localized by role');
assert(calendar.includes('cgStudentScheduleT(grupoHorarioLabelCG(meta))'), 'derived group schedule localized');
assert(calendar.includes("{cgStudentUiT('Entrar a clase')}"), 'meeting action localized');
assert(calendar.includes("if (rol === 'student')"), 'student-only PDF path preserved');

function makeLanguage(role, selected = 'en') {
  const values = new Map([['an_usuario',JSON.stringify({rol:role})],['an_login_recent_at','calendar-e1']]);
  const sessionStorage = {
    getItem:k => values.has(k) ? values.get(k) : null,
    setItem:(k,v) => values.set(k,String(v)),
    removeItem:k => values.delete(k),
  };
  const win = {sessionStorage,location:{search:'',reload(){}},document:{documentElement:{lang:''},title:'Campus Virtual'}};
  vm.runInNewContext(language,{window:win,URLSearchParams});
  if (selected === 'es' && (role === 'student' || role === 'teacher')) assert.equal(win.AN_I18N.setLang('es'),true);
  return win;
}

const helperStart = calendar.indexOf('const cgStudentUiT =');
const helperEnd = calendar.indexOf('const CG_GRUPOS_CACHE_AN',helperStart);
assert(helperStart>=0&&helperEnd>helperStart,'student-only helpers bounded');
const helpersSource=calendar.slice(helperStart,helperEnd) +
  '\n({cgStudentUiT,cgStudentEnglish,cgStudentShiftT,cgStudentScheduleT,cgStudentMonthShort,cgStudentMonthFull})';

function getHelpers(role,lang) {
  const win=makeLanguage(role,lang);
  const monthsShort=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const monthsFull=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const api=vm.runInNewContext(helpersSource,{window:win,MES_CORTO:monthsShort,MESES_NOMBRES:monthsFull});
  return {...api, i18n:win.AN_I18N};
}
const studentEN=getHelpers('student','en');
const studentES=getHelpers('student','es');
const teacherEN=getHelpers('teacher','en');
const admin=getHelpers('superadmin','en');
assert.equal(studentEN.i18n.getLang(),'en','student defaults to EN');
assert.equal(studentES.i18n.getLang(),'es','student can select ES');
assert.equal(teacherEN.i18n.getLang(),'en','teacher language preference preserved');
assert.equal(admin.i18n.getLang(),'es','admin remains ES');
assert.equal(studentEN.cgStudentUiT('Próxima clase'),'Next Class');
assert.equal(studentES.cgStudentUiT('Próxima clase'),'Próxima clase');
assert.equal(teacherEN.cgStudentUiT('Próxima clase'),'Próxima clase','teacher shared calendar remains original');
assert.equal(studentEN.cgStudentShiftT('Mañana'),'Morning','class shift uses morning');
assert.equal(studentEN.cgStudentUiT('Mañana'),'Tomorrow','relative date uses tomorrow');
assert.equal(studentEN.cgStudentShiftT('mañana'),'Morning','lowercase shift supported');
assert.equal(studentEN.cgStudentShiftT('Tarde'),'Afternoon');
assert.equal(studentEN.cgStudentScheduleT('Lunes y miércoles de 6pm a 9pm'),
  'Monday and Wednesday from 6pm to 9pm','schedule is localized with lower-case weekdays');
assert.equal(studentES.cgStudentScheduleT('Lunes y miércoles de 6pm a 9pm'),'Lunes y miércoles de 6pm a 9pm');
assert.equal(teacherEN.cgStudentScheduleT('Lunes y miércoles de 6pm a 9pm'),'Lunes y miércoles de 6pm a 9pm');
assert.equal(studentEN.cgStudentMonthShort(10),'Nov');
assert.equal(studentEN.cgStudentMonthFull(10),'November');
assert.equal(studentES.cgStudentMonthFull(10),'Noviembre');
assert.equal(studentEN.cgStudentUiT('de 16 sesiones I CAN realizadas'),'of 16 I CAN Sessions Completed');
assert.equal(studentEN.cgStudentUiT('No se pudo cargar el detalle'),'Could Not Load Lesson Details');
assert.equal(studentEN.cgStudentUiT('Ver planeamiento PDF'),'View Lesson Plan PDF');

console.log('F111 STUDENT CALENDAR EN/ES E1 PASS: four views, lesson states, shift/weekday/date distinctions, I CAN records visible, teacher/admin unchanged, no writes.');
