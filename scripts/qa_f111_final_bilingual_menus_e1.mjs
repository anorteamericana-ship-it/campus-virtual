// F111 FINAL menus EN/ES — source-backed, no network, no real student data.
// Not an authenticated E2 certification.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const dictSource=read('src/i18n_pilot_f111.js');
const student=read('src/student_menu_academic_cs21a120.jsx');
const teacher=read('src/teacher_cs21a.jsx');
const teacherDocs=read('src/teacher_cs21a_docs_viewer.jsx');
const studentTabs=read('src/student_experience.jsx');
const groups=read('src/vista_docente.jsx');
const roster=read('src/teacher_views.jsx');
const app=read('src/app.jsx'),html=read('campus.html');
const key='&menus=F111MENUSENFINAL20261104A';
function make(role) {
  const cache=new Map([['an_usuario',JSON.stringify({rol:role})],['an_login_recent_at','last-pass']]);
  const storage={getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,String(v)),removeItem:k=>cache.delete(k)};
  const window={sessionStorage:storage,document:{documentElement:{lang:''},title:''},location:{search:'',reload(){}},AN_I18N_FORCE_ES:false};
  vm.runInNewContext(dictSource,{window,URLSearchParams});
  return {api:window.AN_I18N,cache};
}
const studentApi=make('student').api,teacherApi=make('teacher').api;
assert.equal(studentApi.getLang(),'en');
assert.equal(teacherApi.getLang(),'en');
assert.equal(make('admin').api.getLang(),'es','admin is outside bilingual pilot');
const studentMenu=student.slice(student.indexOf('    const nav=['),student.indexOf('    const name=clean(user?',student.indexOf('    const nav=[')));
const teacherMenu=teacher.slice(teacher.indexOf('    const nav = ['),teacher.indexOf('    const isActive =',teacher.indexOf('    const nav = [')));
assert(!teacherMenu.includes("id:'asistencia_docente'"),'Attendance is hidden from teacher sidebar');
assert(teacher.includes("screen === 'asistencia' && <AsistenciaResumenCS21A"),'attendance summary implementation remains intact');
assert(teacherMenu.includes("id:'grupos'")&&teacherMenu.includes("id:'cronograma_grupo'"),'groups and academic calendar navigation remain');
assert(html.includes('src/teacher_cs21a.jsx?v=F111REALMENUI18N20261103&menus=F111MENUSENFINAL20261104A&attnav=F111HIDEATT20261104A'),'teacher sidebar bundle cache refreshed');
function labels(source) {return [...new Set([...source.matchAll(/(?:\bsection|\blabel)\s*:\s*'([^']+)'/g)].map(m=>m[1]))];}
const noTranslationNeeded=new Set(['Syllabus','English LAB','I CAN Conversation Club','Club I CAN','']);
let tested=0;
for (const [kind,source,api] of [['student',studentMenu,studentApi],['teacher',teacherMenu,teacherApi]]) {
  const found=labels(source);
  assert(found.length>=19,kind+' full menu unexpected size '+found.length);
  for(const label of found) {
    const actual=api.t(label);
    assert(actual && !/(?:Básico|Intermedio|Gestión|Académica|Docente|Estudiante|Pagos|Certificados|Cronograma|Información|Perfil|Menú|Planificación|Recursos|Exámenes|Comunicados|Mis pendientes)/i.test(actual),
      kind+' Spanish left in EN menu: '+label+' → '+actual);
    if(!noTranslationNeeded.has(label))
      assert.notEqual(actual,label,kind+' untranslated label: '+label);
    tested++;
  }
}
for(const [label,expected] of [
 ['Mi Perfil','My Profile'],['Gestión Académica','Academic Management'],
 ['Planificación Académica','Academic Planning'],['Recursos Didácticos','Learning Resources'],
 ['Mis grupos','My Groups'],['Pagos y estado de cuenta','Payments & Account Statement'],
 ['Libros y Audios','Books & Audio'],['Calendario académico','Academic Calendar'],
 ['Comun icados','Communications']
].filter(([x])=>x!=='Comun icados')) {
  assert.equal(studentApi.t(label),expected,'canonical shared navigation terminology '+label);
}
assert(student.includes('>{tr(group.section)}</div>')&&student.includes('>{tr(item.label)}</span>'),
 'actual student sidebar uses the dictionary at display time');
assert(teacher.includes('>{tr(group.section)}</div>')&&teacher.includes('>{tr(item.label)}</span>'),
 'actual teacher sidebar uses the dictionary at display time');
assert(teacher.includes("teacherMenuT('Docente')")&&teacher.includes("title={teacherMenuT('Cerrar sesión')}"),
 'teacher footer and logout are bilingual');
for (const [label,expected] of [
 ['Programa y documentos','Program & Documents'],['Avisos','Announcements'],['Ayuda y contactos','Help & Contacts'],
 ['Próximas','Upcoming'],['Histórico','History'],['Lecciones sin cerrar','Lessons Awaiting Closure'],
 ['Lecciones sin retroalimentación','Lessons Missing Feedback'],['Lecciones sin Progress Check','Lessons Missing Progress Check'],
 ['Editar en Mis grupos','Edit in My Groups'],['Lecciones cerradas','Closed Lessons'],
 ['Cargando resumen real de asistencia…','Loading actual attendance summary…'],
 ['Filtrar asistencia','Filter Attendance']
]) assert.equal(studentApi.t(label),expected,'nested EN label '+label);
for(const label of ['Programa y documentos','Avisos','Ayuda y contactos'])
  assert(studentTabs.includes("studentExperienceT('"+label+"')"),'student nested tab renders translated: '+label);
assert(groups.includes('{vdF111MenuT(t.label)}')&&groups.includes('{vdF111MenuT(cat.label)}'),
 'teacher group history/pending subnavigation translated at render');
assert(groups.includes('{vdF111MenuT(accion)}'),
 'teacher pending action button localized');
assert(roster.includes("aria-label={tvF111Translate(\"Filtrar asistencia\")}"),
 'teacher attendance filter aria translated');
assert(roster.includes('{tvF111Translate(opt.label)}'),
 'teacher attendance filters render bilingual');
assert(teacher.includes('teacherMenuT(config.desc)')&&teacher.includes('teacherMenuT(config.button)')&&teacher.includes('teacherMenuT(l.name)'),
 'teacher planning submenu cards localize');
assert(teacher.includes('teacherMenuT(eyebrow)')&&teacher.includes('teacherMenuT(title)')&&teacher.includes('teacherMenuT(desc)'),
 'teacher planning submenu headers localize');
assert(teacherDocs.includes('const docTitle = doc => isEnglish()')&&teacherDocs.includes('{t(data[2])}'),
 'teacher official documents localize only UI titles/descriptions');
assert(student.includes('F111_HIDE_UNREADY_STUDENT_MODULES ? []'),
 'unfinished I CAN standalone navigation stays hidden; I CAN academic data remains');
assert.equal((app.match(/&menus=F111MENUSENFINAL20261104A/g)||[]).length,12,
 'exact 12 routed lazy assets refreshed (7 teacher scene + 2 teacher views + 3 student tabs)');
assert.equal((html.match(/&menus=F111MENUSENFINAL20261104A/g)||[]).length,3,
 'entry refreshes i18n, teacher menu and app manifest');
const es=make('teacher');es.cache.set('an_i18n_pilot_lang','es');
assert.equal(es.api.t('Mi Perfil'),'Mi Perfil','ES toggle preserves Spanish');
assert.equal(es.api.t('Lecciones cerradas'),'Lecciones cerradas','ES remains unchanged');
console.log('F111 MENU EN/ES E1 PASS: '+tested+' student+teacher menu labels audited, student and teacher nested tabs, teacher planning, attendance filter, logout and cache; no backend writes.');
