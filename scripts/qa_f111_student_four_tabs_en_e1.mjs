// F111 · Four student-facing EN/ES tabs regression — isolated, read-only E1.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read = name => fs.readFileSync(name,'utf8');
const app = read('src/app.jsx');
const modules = read('src/student_modules.jsx');
const books = read('src/student_books_proxy_cs21a126.jsx');
const viewer = read('src/book_unit_starts_cs21a60.jsx');
const pdf = read('src/student_book_pdf_cs21a65.js');
const guard = read('src/student_menu_academic_guard_cs21a120.js');
const loader = read('src/resources_panel_state_cs21a65.js');
const langSrc = read('src/i18n_pilot_f111.js');
const html = read('campus.html');
const d1 = read('scripts/qa_f111_superadmin_single_center_20261017.mjs');
const token = '&four=F111FOURTABSEN20261104A';
const dictionary = langSrc.slice(langSrc.indexOf('const DICTIONARY = Object.freeze({'),langSrc.indexOf('  });',langSrc.indexOf('const DICTIONARY = Object.freeze({')));
const known = new Set([...dictionary.matchAll(/(?:^|[\s,{])(['"])((?:\\.|(?!\1).)*?)\1\s*:/gm)].map(m=>m[2]));
for(const file of [app,modules,books,viewer]) {
  const used = [...file.matchAll(/(?:f111StudentExamT|studentGradesT|bookProxyT|bookViewerT)\(\s*(['"])((?:\\.|(?!\1).)*?)\1\s*\)/gs)].map(m=>m[2]);
  assert.deepEqual([...new Set(used.filter(k=>!known.has(k)))],[], 'all explicitly translated UI labels must exist in dictionary');
}
const store = new Map([['an_usuario',JSON.stringify({rol:'student'})],['an_login_recent_at','four-tabs-e1']]);
const sessionStorage = {getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const root = {sessionStorage,location:{search:'',reload(){}},document:{documentElement:{lang:''},title:'Campus Virtual'}};
vm.runInNewContext(langSrc,{window:root,URLSearchParams});
assert.equal(root.AN_I18N.getLang(),'en');
for(const [source,expected] of [
 ['EVALUACIONES ORALES','ORAL ASSESSMENTS'], ['Exámenes orales','Oral Exams'],
 ['1.er Examen Oral','1st Oral Exam'], ['EVALUACIONES ESCRITAS','WRITTEN ASSESSMENTS'],
 ['Programado:','Scheduled:'], ['Pagos y','Payments &'], ['estado de cuenta','Account Statement'],
 ['Tu estado global','Your Overall Account Status'], ['Sin saldo contractual ✓','No Outstanding Contractual Balance ✓'],
 ['Historial de pagos','Payment History'], ['Comprobante','Receipt'], ['Cuota','Installment'],
 ['Matrícula','Enrollment Fee'], ['Certificado','Certificate'], ['Básico I','Basic I'],
 ['Cursando Actualmente','Currently Enrolled'], ['Estado académico','Academic Status'],
 ['Morosidad','Overdue Status'], ['Al Día','Up to Date'],
 ['Pago de certificado','Certificate Payment'], ['Número oficial','Official Certificate Number'],
 ['Sin dato verificable','No verified data'], ['Sin asignar','Not assigned'],
 ['Libro del nivel actual','Current Level Book'], ['hojas','pages'],
 ['Abrir PDF','Open PDF'], ['Descargar PDF','Download PDF']
]) assert.equal(root.AN_I18N.t(source),expected,'EN translation: '+source);
store.set('an_i18n_pilot_lang','es');
for(const src of ['Tu estado global','Exámenes orales','Libro del nivel actual','Cursando Actualmente'])
  assert.equal(root.AN_I18N.t(src),src,'ES remains unchanged: '+src);
store.set('an_i18n_pilot_lang','en');

const start=app.indexOf('function f111StudentExamDate(value) {'),end=app.indexOf('\nconst APP_ORAL_DEFS_F927',start);
assert(start>=0&&end>start,'student-only date helper bounds');
const formatDate=vm.runInNewContext(app.slice(start,end)+'\nf111StudentExamDate',{window:root,Date,fechaF91:()=> '10 nov 2026'});
assert.equal(formatDate('2026-11-10'),'Nov 10, 2026');
store.set('an_i18n_pilot_lang','es');
assert.equal(formatDate('2026-11-10'),'10 nov 2026');
store.set('an_i18n_pilot_lang','en');

assert(app.includes("appPostF91('getMisNotasF921'"), 'same assessment endpoint');
assert(app.includes('f111StudentExamT(r.titulo)'), 'exam titles localize without changing keys');
assert(app.includes("f111StudentExamT('Lección')"), 'assessment lesson number label');
assert(modules.includes('function agruparPagosPorModuloSM('), 'receipt grouping remains unchanged');
assert(modules.includes('studentGradesT(mov.concepto)'), 'render-only payment movement translation');
assert(modules.includes('row.estatus ||'), 'official academic status code is preserved');
assert(modules.includes("postStudentModules('descargarMiCertificadoPrivado'"),'certificate authenticated endpoint preserved');
assert(modules.includes("window.crypto.subtle.digest('SHA-256', bytes)"),'private PDF integrity check preserved');
assert(books.includes('studentBooksProxyCS21A126') === false && books.includes('window.StudentBooksProxyCS21A126=StudentBooksProxyCS21A126'),
  'student book proxy retains original export');
assert(books.includes("const FILES={"),'official book file map untouched');
assert(viewer.includes("studentMode ? (window.AN_I18N?.t(value) || value) : value"),'teacher/admin labels stay Spanish');
assert(viewer.includes("studentMode ? bookViewerT('Libro del nivel actual') : 'Recursos Didácticos'"),'shared title remains role-isolated');
assert(pdf.includes("window.AN_I18N?.t('Abrir PDF')"),'student-only toolbar localized');
assert.equal(app.split(token).length-1,3,'three student module lazy bundles refreshed');
assert.equal(html.split(token).length-1,5,'five entry scripts refreshed');
assert.equal(guard.split(token).length-1,1,'student book proxy refreshed');
assert.equal(loader.split(token).length-1,1,'student PDF toolbar refreshed');
assert(d1.includes("replaceAll('&four=F111FOURTABSEN20261104A','')"),'D1 comparison normalizes only approved cache marker');
assert.equal((d1.match(/replaceAll\('&four=F111FOURTABSEN20261104A',''\)/g)||[]).length,3,
  'D1 normalizes work and main reference symmetrically');

console.log('F111 FOUR STUDENT TABS EN/ES E1 PASS: assessments, books, payments, certificates, dates, 4 coded statuses, scoped cache, no data writes.');
