// F111 bilingual preview source gate. Does not connect to CAMPUS or mutate production.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const core=fs.readFileSync('src/i18n_pilot_f111.js','utf8');
const shell=fs.readFileSync('src/sidebar.jsx','utf8');
const nav=fs.readFileSync('src/sidebar_active_state_cs21a69.js','utf8');
const html=fs.readFileSync('campus.html','utf8');
const student=fs.readFileSync('src/student_dashboard.jsx','utf8');
const teacherMenu=fs.readFileSync('src/teacher_cs21a.jsx','utf8');
const studentMenu=fs.readFileSync('src/student_menu_academic_cs21a120.jsx','utf8');
const additional=fs.readFileSync('src/additional_resources_panel_cs21a68.jsx','utf8');
new Function(core);
const create=(role,search,stamp='100')=>{
  const map=new Map([['an_usuario',JSON.stringify({rol:role})],['an_login_recent_at',stamp]]);
  const s={getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
  const window={sessionStorage:s,document:{documentElement:{lang:''},title:'Campus Virtual'},location:{search,reloads:0,reload(){this.reloads++;}},AN_I18N_FORCE_ES:false};
  vm.runInNewContext(core,{window,URLSearchParams});
  return{window,api:window.AN_I18N,map};
};
let x=create('student','');
assert.equal(x.api.available,true,'selector disponible en URL habitual');
assert.equal(x.api.getLang(),'en','EN default for academic roles in production');
assert.equal(x.api.t('Mi Campus'),'My Campus');
assert.equal(x.api.setLang('en'),true,'el selector funciona sin query');
assert.equal(x.api.getLang(),'en');
assert.equal(x.api.t('Mi Campus'),'My Campus');
assert.equal(x.window.location.reloads,1);
assert.equal(x.api.setLang('es'),true);
assert.equal(x.api.getLang(),'es');
assert.equal(x.window.location.reloads,2);
x.map.set('an_login_recent_at','200');
assert.equal(x.api.getLang(),'en','new login always starts in EN, never remembers ES');
x=create('student','?i18n=preview');
assert.equal(x.api.getLang(),'en','enlace preview activa EN');
assert.equal(x.api.t('Básico I'),'Basic I');
assert.equal(x.api.t('17189B1-KJ18-C3-0826'),'17189B1-KJ18-C3-0826','códigos intactos');
x.window.AN_I18N_FORCE_ES=true;
assert.equal(x.api.getLang(),'es','interruptor de emergencia');
// The login redirect strips ?i18n=preview; the request must survive in the same tab.
const loggedOut=create('missing','?i18n=preview');
assert.equal(loggedOut.api.getLang(),'es');
assert.equal(loggedOut.map.get('an_i18n_pilot_intent'),'en');
loggedOut.map.set('an_usuario',JSON.stringify({rol:'teacher'}));
const resumedWindow={sessionStorage:loggedOut.window.sessionStorage,
 document:{documentElement:{lang:''},title:'Campus Virtual'},
 location:{search:'',reloads:0,reload(){this.reloads++;}},AN_I18N_FORCE_ES:false};
vm.runInNewContext(core,{window:resumedWindow,URLSearchParams});
assert.equal(resumedWindow.AN_I18N.getLang(),'en','redirect al campus normal conserva solicitud EN');
assert.equal(loggedOut.map.has('an_i18n_pilot_intent'),false,'intención consumida');
x=create('teacher','');
assert.equal(x.api.getLang(),'en');
assert.equal(x.api.setLang('en'),true);
assert.equal(x.api.getLang(),'en','docente puede usar selector desde campus normal');
x=create('admin','?i18n=preview');
assert.equal(x.api.available,true,'admin ve selector aunque EN no esté desarrollado');
assert.equal(x.api.getLang(),'es','admin no se traduce');
assert.equal(x.api.setLang('en'),false,'admin no activa traducción incompleta');
x=create('superadmin','');
assert.equal(x.api.available,true,'superadmin también ve selector');
assert.equal(x.api.getLang(),'es','superadmin no se traduce');
assert.ok(html.includes('src/i18n_pilot_f111.js?v=F111HERO20261103B'));
assert.ok(html.indexOf('src/i18n_pilot_f111.js')<html.indexOf('src/data.jsx'));
assert.ok(html.includes('src/sidebar.jsx?v=F111ATTEND20261021&i18n=F111VISIBLE20261103'),'sidebar cache invalidated');
assert.ok(shell.includes('data-an-nav-label={item.label}'),'nav key estable');
assert.ok(shell.includes('data-nav-id={item.id}'),'ruta estable');
assert.ok(shell.includes('window.AN_I18N?.available'),'selector en campus normal');
assert.ok(shell.indexOf('aria-label="Language / Idioma"')<shell.indexOf('{esSuperadmin && <ModoPruebaPanel />}'),'selector visible encima del menú');
assert.ok(nav.includes("button.getAttribute('data-an-nav-label')"),'ruteo usa texto original');
for (const [label,menu,asset] of [
 ['teacher',teacherMenu,'src/teacher_cs21a.jsx'],
 ['student',studentMenu,'src/student_menu_academic_cs21a120.jsx']
]) {
 assert.ok(menu.includes('aria-label="Language / Idioma"'),label+' real sidebar has selector');
 assert.ok(menu.includes('window.AN_I18N.setLang(lang)'),label+' actual buttons change language');
 assert.ok(menu.indexOf('aria-label="Language / Idioma"')<menu.indexOf('{nav.map(group='),label+' selector is directly below logo');
 assert.ok(menu.includes('data-an-nav-label={item.label}'),label+' stable original routing label');
 assert.ok(menu.includes('>{tr(group.section)}</div>'),label+' translated section');
 assert.ok(menu.includes('>{tr(item.label)}</span>'),label+' translated item');
 assert.ok(html.includes(asset+'?v='+(label==='teacher'?'F111REALMENUI18N20261103':'F111ENPROFILE20261103')),label+' cache bust on actual runtime asset');
}
assert.ok(additional.includes("button?.getAttribute?.('data-an-nav-label')"),'auxiliary resource handler preserves Spanish original label');
assert.ok(html.includes('src/additional_resources_panel_cs21a68.jsx?v=F111REALMENUI18N20261103'),'additional resources cache bust');
assert.equal(create('teacher','').api.t('Principal'),'Home');
const translatedTeacher=create('teacher','');
translatedTeacher.api.setLang('en');
assert.equal(translatedTeacher.api.t('Principal'),'Home');
assert.equal(translatedTeacher.api.t('Planificación Académica'),'Academic Planning');
assert.equal(translatedTeacher.api.t('Información General del Programa'),'Program Information');
const appSource=fs.readFileSync('src/app.jsx','utf8');
assert.ok(appSource.includes("if (role === 'teacher') return 'perfil'"),'real teacher profile starts every entry');
assert.ok(appSource.includes("if (role === 'student') return 'dashboard'"),'student profile starts every entry');
assert.ok(appSource.includes("if (role === 'student' || role === 'teacher') return;"),'academic last route is not persisted');
assert.ok(html.includes('entry=F111ENPROFILE20261103'),'active App code cache bust');
assert.ok(studentMenu.includes("props.active==='dashboard'?'dashboard':readRoute()"),'student sidebar highlights actual profile after prior stale hash');
assert.ok(student.includes('window.AN_I18N?.t(value) || value'),'accesos directos sin DOM overwrite');
for(const bad of ['MutationObserver','createTreeWalker','innerHTML =','eval('])
 assert.equal(core.includes(bad),false,'sin reescritura peligrosa '+bad);
for(const sensitive of ['script.google.com','googleapis','APPS_SCRIPT_URL','fetch(','getSessionToken'])
 assert.equal(core.includes(sensitive),false,'no backend/auth in i18n runtime: '+sensitive);
console.log('F111 academic EN profile entry E1 PASS: academic EN by default, profile per load, ES opt-in reset on relogin, stable routes, admin ES');
