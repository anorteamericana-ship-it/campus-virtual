// F111 — Real teacher Program Information + additive professional record E1 (read-only).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('campus.html','utf8');
const doc=fs.readFileSync('src/teacher_cs21a_docs_viewer.jsx','utf8');
const profile=fs.readFileSync('src/teacher_profile_cs21a76.jsx','utf8');
const i18n=fs.readFileSync('src/i18n_pilot_f111.js','utf8');

const requiredAssets=[
 'src/teacher_cs21a_docs_viewer.jsx?v=F111REALDOCSEN20261103',
 'src/teacher_profile_cs21a76.jsx?v=F111PROFILECANONICAL20261020&docs=F111DIEGOEXPEDIENTE20261103&i18n=F111ENPROFILE20261103&record=F111ADDRECORD20261103',
 'src/i18n_pilot_f111.js?v=F111REALDOCSEN20261103',
];
for(const file of requiredAssets)assert(html.includes(file),'exact production resource '+file);
assert(html.indexOf('src/i18n_pilot_f111.js')<html.indexOf('src/teacher_cs21a_docs_viewer.jsx'),'language runtime loaded before real teacher viewer');

assert(doc.includes('function TeacherDocsHubCS21A6'),'real teacher view, not alternate ProgramInfo component');
assert(doc.includes('window.MaterialesView = Wrapped;'),'auth teacher MaterialsView replaced with actual teacher doc viewer');
assert(doc.includes('{t(data[0])}')&&doc.includes('{t(data[1])}')&&doc.includes('{t(data[2])}'),'real header translatable');
assert(doc.includes('{docTitle(doc)}')&&doc.includes('{docDesc(doc)}'),'real document labels translatable');
assert(doc.includes("t('Descargar')"),'real download action translated');
assert(doc.includes('enTitle:englishLevel'), 'lesson plan labels can be translated without touching official file IDs');

assert(!profile.includes('Reemplazar PDF'),'fixed teacher documents cannot be overwritten by the profile UI');
assert(profile.includes("{tp76t(busy ? 'Cargando…' : 'Cargar PDF')}"),'first PDF upload still possible when missing');
assert(profile.includes('available ? ('),'available fixed slots are read-only');
assert(profile.includes("post('uploadDocumentoDocenteCS21A76'"),'existing first upload protected backend preserved');
assert(profile.includes('data.carpeta_docente?.url'),'teacher record folder is provided only by authenticated backend');
assert(profile.includes('drive\\.google\\.com\\/drive\\/folders'),'record link uses restricted Drive hostname only');
assert(profile.includes("tp76t('Agregar al expediente profesional')"),'user sees requested additive action');
assert(profile.includes('rel="noopener noreferrer"'),'private folder opens without opener');
assert(!profile.includes('1GN1g-vB6Pr71vi_kXQE4NeoZr8KVxTPO'),'private folder ID is not hardcoded');

function language(role,lang){
 const state=new Map([['an_usuario',JSON.stringify({rol:role})],['an_login_recent_at','1']]);
 const storage={getItem:k=>state.get(k)||null,setItem:(k,v)=>state.set(k,String(v)),removeItem:k=>state.delete(k)};
 const window={sessionStorage:storage,document:{documentElement:{lang:''},title:'Campus Virtual'},location:{search:'',reload(){}},AN_I18N_FORCE_ES:false};
 vm.runInNewContext(i18n,{window,URLSearchParams});
 if(lang==='es')window.AN_I18N.setLang('es');
 return window.AN_I18N;
}
const en=language('teacher','en'),es=language('teacher','es');
const labels=[
 ['Principal','Home'],['Información General del Programa','Program Information'],
 ['Reglamento estudiantil','Student Regulations'],['Reglamento de netiqueta','Netiquette Guidelines'],
 ['Video de bienvenida al Programa','Program Welcome Video'],
 ['Guía — Uso de Zoom y Google Meet','Zoom and Google Meet Guide'],
 ['Guía — Contingencias','Contingency Guide'],['Descargar','Download'],
 ['Agregar al expediente profesional','Add to Professional Record'],
 ['Planeamiento didáctico','Lesson Planning']
];
for(const [spanish,english] of labels){
 assert.equal(en.t(spanish),english,'EN '+spanish);
 assert.equal(es.t(spanish),spanish,'ES '+spanish);
}
assert.equal(en.t('1K_yZjUpiPF6MtXgapeFq7J314qqPQ-Ei'),'1K_yZjUpiPF6MtXgapeFq7J314qqPQ-Ei','Drive ID untouched');
console.log('F111 REAL DOCS EN/ES E1 PASS: actual teacher viewer title/cards/download, additive private record, immutable PDFs/backend, ES restored.');
