// F111 student bilingual slice: read-only synthetic E1, no real student access.
// This certifies the specific changed UI labels, not complete bilingual coverage.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('campus.html','utf8');
const app=fs.readFileSync('src/app.jsx','utf8');
const student=fs.readFileSync('src/student_dashboard.jsx','utf8');
const tabs=fs.readFileSync('src/student_experience.jsx','utf8');
const source=fs.readFileSync('src/i18n_pilot_f111.js','utf8');

assert(html.includes('src/i18n_pilot_f111.js?v=F111STUDENTPROFILEEN20261103'),'live dictionary version');
assert(html.includes('&i18nstudent=F111STUDENTTABS20261103'),'live app router cache invalidation');
assert(app.includes("src/student_dashboard.jsx?v=F111STUDENTPROFILEEN20261103"),'native student profile lazy asset');
assert.equal(app.split("src/student_experience.jsx?v=F111STUDENTTABSEN20261103").length-1,3,'all three student tab routes updated');
assert(app.includes("if (role === 'student') return 'dashboard'"),'profile is first student route every login');

assert(student.includes('const studentDashT = value => window.AN_I18N?.t(value) || value;'),'profile translates presentation only');
assert(student.includes("studentDashT('ACTUALIZAR DATOS')"),'profile account editor');
assert(student.includes("studentDashT('DATOS DEL PROGRAMA')"),'profile program tab');
assert(student.includes('studentDashT(label)'), 'program field captions without translating data values');
assert(student.includes("studentDashT('Elegir como correo principal.')"),'profile primary email label');
assert(student.includes("studentDashT('Elegir como teléfono principal.')"),'profile primary phone label');
assert(student.includes("studentDashT(estadoReal)"),'profile status label');
assert(student.includes('postStudentDash(\'actualizarDatosPersonalesEstudiante\''),'contact update endpoint unchanged');
assert(student.includes('postStudentDash(\'uploadFotoPerfilEstudiante\''),'photo endpoint unchanged');
assert(!student.includes("studentDashT(codigoVisible)"),'never translate student code');

assert(tabs.includes('const studentExperienceT = value => window.AN_I18N?.t(value) || value;'),'tabs translate static presentation');
assert(tabs.includes("studentExperienceT(children)"),'tab names translate');
assert(tabs.includes("studentExperienceT(title)"),'screen headings translate');
assert(tabs.includes("studentExperienceT('Matrícula firmada')"),'private enrollment heading translated');
assert(tabs.includes("studentExperienceT(error)"),'known localized errors displayed');
assert(tabs.includes("body:JSON.stringify({ fn:'descargarMatriculaFirmadaPrivada', token })"),'private signed PDF auth transport preserved');
assert(tabs.includes("window.crypto.subtle.digest('SHA-256', bytes)"),'private signed PDF integrity preserved');
assert(tabs.includes("new Blob([bytes], { type:'application/pdf' })"),'private PDF Blob unchanged');
assert(tabs.includes('URL.revokeObjectURL(objectUrl)'), 'private Blob cleanup unchanged');
assert(tabs.includes('data-screen-label="Estudiante · Evaluaciones"'),'PC01 DOM identity unchanged');
assert(!source.includes('MutationObserver'),'no risky global DOM rewrites');

function select(role,selectLanguage){
 const map=new Map([['an_usuario',JSON.stringify({rol:role})],['an_login_recent_at','300']]);
 const store={getItem:key=>map.has(key)?map.get(key):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
 const window={sessionStorage:store,document:{documentElement:{lang:''},title:'Campus Virtual'},location:{search:'',reload(){}},AN_I18N_FORCE_ES:false};
 vm.runInNewContext(source,{window,URLSearchParams});
 if(selectLanguage==='es') window.AN_I18N.setLang('es');
 return window.AN_I18N;
}
const en=select('student','en'),es=select('student','es'),admin=select('superadmin','en');
assert.equal(en.getLang(),'en','student default English');
assert.equal(es.getLang(),'es','Spanish manual selection survives current session');
assert.equal(admin.getLang(),'es','superadmin remains Spanish');
const pairs=[
 ['ACTUALIZAR DATOS','UPDATE INFORMATION'],['DATOS DEL PROGRAMA','PROGRAM DETAILS'],
 ['Nombre completo','Full Name'],['Correo','Email'],['Cédula','ID Number'],
 ['Datos personales','Personal Information'],['Editar contacto','Edit Contact'],
 ['Estado de matrícula','Enrollment Status'],['Avance del nivel','Level Progress'],
 ['Próximas y activas','Upcoming & Active'],['Resultados','Results'],
 ['Tareas','Assignments'],['Reposiciones','Make-up Exams'],
 ['Documentos y ayuda','Documents & Help'],['Matrícula firmada','Signed Enrollment Form'],
 ['Verificando…','Verifying…'],['Abrir matrícula firmada','Open Signed Enrollment Form'],
 ['No hay sesión activa','No Active Session']
];
for(const [esLabel,enLabel] of pairs){
 assert.equal(en.t(esLabel),enLabel,'EN string '+esLabel);
 assert.equal(es.t(esLabel),esLabel,'ES preserves original '+esLabel);
}
assert.equal(en.t('B1-KJ18-C3-0826'),'B1-KJ18-C3-0826','group identifier unchanged');
console.log('F111 STUDENT PROFILE/TABS EN-ES E1 PASS: targeted labels, lazy assets, default EN, ES toggle, private PDF and PC01 contracts intact.');
