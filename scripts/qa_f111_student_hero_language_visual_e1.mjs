// F111 hero contrast and reviewed-material language E1: source-only, no user state writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const css=fs.readFileSync('styles/academy_identity_card.css','utf8');
const baseCss=fs.readFileSync('styles/campus_d_compact.css','utf8');
const student=fs.readFileSync('src/student_dashboard.jsx','utf8');
const html=fs.readFileSync('campus.html','utf8');
const app=fs.readFileSync('src/app.jsx','utf8');
const dictionary=fs.readFileSync('src/i18n_pilot_f111.js','utf8');
const mark=fs.readFileSync('src/academy_mark.js','utf8');

assert(baseCss.includes('color: var(--d-navy) !important;'),'legacy dark name declaration identified');
assert(css.includes('#panel-actualizar-datos .academy-id-header .campus-d-welcome-name{'),'actual student cover scoped');
assert(css.includes('color:#FFFFFF!important;'),'specific white overrides legacy important navy');
assert(css.includes('text-shadow:0 2px 6px'),'white name remains readable on blue gradient');
assert(css.includes('academy-a-interactive-retrace'),'distinct hover animation from original mount reveal');
assert(css.includes('.academy-id-header:is(:hover,:focus-within) .academy-id-mark .academy-a__swoosh'),'mouse/focus retrigger scoped to institutional ribbon');
assert(css.includes('@media(prefers-reduced-motion:reduce)'),'motion respects user preference');
assert(mark.includes("className:'academy-id-mark'"),'real shared mark is interactive target');
assert(mark.includes("variant:'watermark'"),'do not change logo or its source');
assert(!css.includes('pointer-events:auto'),'interactive animation does not intercept camera/photo actions');

assert(student.includes("const textForRequired = label => studentDashT(label);"), 'mandatory onboarding UI follows selected language immediately');
assert(!student.includes('reviewedBeforeEntry'), 'no Spanish-first override while EN is selected');
assert(student.includes("localStorage.getItem(KEY) === '1'"), 'existing local hide marker remains on device only');
assert(student.includes("textForRequired('Material obligatorio')"),'mandatory material heading uses selected language');
assert(student.includes("textForRequired('Antes de empezar tu programa')"),'mandatory welcome heading uses selected language');
assert(student.includes("textForRequired(oculto ? 'Ver material' : 'Marcar revisado en este equipo')"),'review button translates on first entry');
assert(student.includes("onClick={abrirInscripcionFirmada}"),'official enrollment document handler unchanged');
assert(student.includes("item.title")&&student.includes("item.desc"),'original documentary cards intact');

function i18n() {
 const map=new Map([['an_usuario',JSON.stringify({rol:'student'})],['an_login_recent_at','20261103']]);
 const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
 const window={sessionStorage:storage,document:{documentElement:{lang:''},title:'Campus Virtual'},location:{search:'',reload(){}},AN_I18N_FORCE_ES:false};
 vm.runInNewContext(dictionary,{window,URLSearchParams});
 return window.AN_I18N;
}
const en=i18n();
assert.equal(en.getLang(),'en');
for(const [spanish,english] of [
 ['Material obligatorio','Required Materials'],
 ['Antes de empezar tu programa','Before You Begin Your Program'],
 ['Inscripción firmada','Signed Enrollment Form'],
 ['Tu matrícula vigente.','Your current enrollment.'],
 ['Marcar revisado en este equipo','Mark as Reviewed on This Device'],
 ['Ver material','View Materials'],
 ['REQUERIDO','REQUIRED'],['RECOMENDADO','RECOMMENDED']
]) assert.equal(en.t(spanish),english,spanish+' translated on first entry');

assert(html.includes('styles/academy_identity_card.css?v=F111HERO20261103B'),'hero css cache invalidated');
assert(html.includes('src/i18n_pilot_f111.js?v=F111HERO20261103B'),'dictionary cache invalidated');
assert(html.includes('&hero=F111HERO20261103B'),'actual app script reloaded');
assert(app.includes('src/student_dashboard.jsx?v=F111HERO20261103B'),'actual student dashboard lazy script reloaded');
console.log('F111 HERO VISUAL / REVIEWED MATERIAL E1 PASS: white name, replayable decorative A, reduced-motion and EN/ES from first entry, official PDF intact');
