import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const m=read('src/student_modules.jsx'),d=read('src/student_dashboard.jsx'),app=read('src/app.jsx'),html=read('campus.html');
function extract(text,start,end){const a=text.indexOf(start),b=text.indexOf(end,a);assert(a>=0&&b>a);return text.slice(a,b)}
const financeFn=extract(m,'  const certEstado = ','  const alDia = ');
const tileFn=extract(d,'  const certNivel = ','  const alDia = ');
function calc(group,status,flag){
 const niveles=status===null?{}:{[group]:{estatus:status}};
 const pendientes={nivel_activo:group,por_nivel:{[group]:{certificado_exigible:flag}}};
 const a=vm.runInNewContext(financeFn+'\ncertExigible;', {niveles,pendientes,nivelActivo:group});
 const b=vm.runInNewContext(tileFn+'\ncertExigible;', {niveles,pendientes});
 assert.equal(a,b,'Dashboard/detail disagree');
 return a;
}
assert.equal(calc('B1','CA',true),false,'B1 in progress must not show due certificate, even if inconsistent backend flag');
assert.equal(calc('B1','APR',false),true,'B1 approved: certificate exigible');
assert.equal(calc('B2','CA',true),false,'B2 in progress: future certificate');
assert.equal(calc('I1','CA',false),false,'I1 in progress: future');
assert.equal(calc('I2','CA',true),true,'I2 in progress follows program-full special rule');
assert.equal(calc('B1',null,true),true,'Unknown academic status defers to finance flag');
assert.equal(calc('B1',null,false),false,'Unknown academic status without flag is not due');
assert(m.includes('Certificado futuro · aún no exigible'),'Detailed label does not disclose future status');
assert(d.includes('(futuro; aún no exigible)'),'Dashboard label does not disclose future status');
assert(html.includes('src/app.jsx?v=F109AINAGRADES20261010'),'HTML entry does not force fresh app');
assert(app.includes('student_dashboard.jsx?v=F1064CERTIFICATE20261010'),'Dashboard script not refreshed');
assert(app.includes('student_modules.jsx?v=F109AINAGRADES20261010'),'Details script not refreshed');
assert(m.includes('background:')&&m.includes('lineHeight:1.55'),'Readable notice missing');
console.log('QA_F1064_ACADEMIC_CERTIFICATE_EXIGIBILITY_PASS');
