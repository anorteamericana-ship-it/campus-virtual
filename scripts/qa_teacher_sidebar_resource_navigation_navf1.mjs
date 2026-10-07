import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const Babel=require('../vendor/babel.js');
const load=path=>fs.readFileSync(path,'utf8');
const panel=load('src/additional_resources_panel_cs21a68.jsx');
const teacher=load('src/teacher_cs21a.jsx');
const sidebar=load('src/sidebar.jsx');
const html=load('campus.html');

for(const file of ['src/additional_resources_panel_cs21a68.jsx','src/teacher_cs21a.jsx','src/sidebar.jsx']){
  Babel.transform(load(file),{presets:['react'],plugins:['transform-block-scoping']});
}
assert(teacher.includes("const [intent, setIntent] = React.useState("));
assert(teacher.includes("window.addEventListener('an:teacher-material-tab', sync)"));
assert(panel.includes("sessionStorage.setItem('an_teacher_materiales_tab', 'libros')"));
assert(!teacher.includes("{ id:'english_lab_live'"));
assert(html.includes('aside[data-role="student"] button[data-nav-id="english_lab_live"]'));
assert(html.includes('src/teacher_cs21a.jsx?v=F98.4Z6NAVF1'));
assert(html.includes('src/sidebar.jsx?v=F98.4Z6CS13'));
assert(html.includes('src/additional_resources_panel_cs21a68.jsx?v=F98.4Z6NAVF1'));

const eventCode=panel.match(/document\.addEventListener\('click', event => \{([\s\S]*?)\n  \}, true\);/);
assert(eventCode,'navigation click handler found');
let listener, mode='additional';
const windowMock={__AN_ADDITIONAL_RESOURCES_OPENING_CS21A68__:true};
const eventContext={
 document:{addEventListener:(name,fn,opts)=>{if(name==='click'&&opts===true)listener=fn}},
 menuLabel:button=>button.label,readMode:()=>mode,setMode:newMode=>{mode=newMode},
 window:windowMock
};
vm.runInNewContext("document.addEventListener('click', event => {"+eventCode[1]+"\n  }, true);",eventContext);
function click(label,trusted=true){
 listener({isTrusted:trusted,target:{closest:()=>({label})}});
 return mode;
}
for(const label of ['Plan de Estudio','Syllabus','Planeamiento por lección','Libros y Audios','Mis grupos']){
 mode='additional';windowMock.__AN_ADDITIONAL_RESOURCES_OPENING_CS21A68__=true;
 assert.equal(click(label),'books',label+' clears additional mode');
 assert.equal(windowMock.__AN_ADDITIONAL_RESOURCES_OPENING_CS21A68__,false,label+' clears opening state');
}
mode='additional';
assert.equal(click('Recursos adicionales'),'additional','additional stays open');
assert.equal(click('Plan de Estudio',false),'additional','synthetic click ignored');

const fnStart=panel.indexOf('  function syncSidebar(aside) {');
const fnEnd=panel.indexOf('\n  let scanScheduled',fnStart);
assert(fnStart>0&&fnEnd>fnStart,'active sync function found');
function makeButton(label,active=false){
 const attrs={};const classes=new Set(['sb-item',...(active?['active']:[])]);
 return {label,dataset:{},attrs,
   classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k)},
   hasAttribute:k=>attrs[k]!==undefined,setAttribute:(k,v)=>{attrs[k]=v},removeAttribute:k=>delete attrs[k]
 };
}
const book=makeButton('Libros y Audios',true),plan=makeButton('Plan de Estudio',true),extra=makeButton('Recursos adicionales',false);
const buttons=[book,plan,extra];
const aside={dataset:{role:'teacher'},classList:{contains:()=>false},querySelectorAll:()=>buttons};
const syncContext={
 document:{querySelector:()=>({})},window:windowMock,
 clean:v=>String(v).trim(),menuLabel:button=>button.label,readMode:()=>mode,
 makeNavButton:()=>extra
};
vm.runInNewContext(panel.slice(fnStart,fnEnd)+'\nsyncSidebar(aside);',{...syncContext,aside});
mode='additional';
vm.runInNewContext(panel.slice(fnStart,fnEnd)+'\nsyncSidebar(aside);',{...syncContext,aside});
assert.deepEqual(buttons.filter(b=>b.classList.contains('active')).map(b=>b.label),['Recursos adicionales'],'one active with additional');
assert.equal(extra.attrs['aria-current'],'page');
mode='books';plan.classList.add('active');
vm.runInNewContext(panel.slice(fnStart,fnEnd)+'\nsyncSidebar(aside);',{...syncContext,aside});
assert.deepEqual(buttons.filter(b=>b.classList.contains('active')).map(b=>b.label),['Plan de Estudio'],'one active after exiting additional');
console.log('PASS: Babel 3 files, Live menu hidden, reactivity, cache busters, 7 navigation cases, unique active menu both directions.');
