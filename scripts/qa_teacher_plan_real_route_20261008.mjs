import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),B=require('../vendor/babel.js');
const tv=fs.readFileSync('src/teacher_views.jsx','utf8'),
  app=fs.readFileSync('src/app.jsx','utf8'),
  admin=fs.readFileSync('src/panel_suspensiones.jsx','utf8'),
  page=fs.readFileSync('campus.html','utf8'),
  bridge=fs.readFileSync('src/att77_bridge.js','utf8');
for(const [path,src] of [['teacher_views.jsx',tv],['panel_suspensiones.jsx',admin],['app.jsx',app]]){
  B.transform(src,{presets:['react'],plugins:['transform-block-scoping']});
}
assert(app.includes('cronograma_grupo: <LazyRoute title="Cronograma Inglés Conversacional" component="CronogramaDocenteSeguroF82"'));
assert(app.includes('teacher_views.jsx?v=F99TEACHERPLAN20261008'));
assert(bridge.includes('teacher_views.jsx?v=F99TEACHERPLAN20261008'));
assert(page.includes('src/app.jsx?v=F99TEACHERPLAN20261008'));
assert(page.includes('src/att77_bridge.js?v=F99TEACHERPLAN20261008'));
assert(tv.includes('Organizar cronograma'));
assert(tv.includes('onEmptyDay={insertarPlanDia}'));
assert(tv.includes('onDropDay={dropPlanDia}'));
assert(tv.includes('enviarPlanCronogramaInicial'));
assert(tv.includes("setPlanState('PENDIENTE')"));
assert(admin.includes('PlanesInicialesAdminF52'));
assert(admin.includes('resolverPlanCronogramaInicial'));
const first=tv.indexOf('function tvPlanISOF52('),last=tv.indexOf('function TeacherAgendaMonthF82(',first);
const sandbox={tvIsIcanEventF96:e=>e.tipo==='ICAN'};
vm.createContext(sandbox);vm.runInContext(tv.slice(first,last),sandbox);
const base=[],d=new Date('2026-10-08T12:00:00Z');
while(base.length<32){
  if([2,4].includes(d.getUTCDay())&&d.toISOString().slice(0,10)!=='2026-12-01'){
    base.push({leccion:base.length+1,riel:'curso',tipo:'CLASE',fecha:d.toISOString().slice(0,10),
      estado:'PROGRAMADA',hora_inicio:'18:00',hora_fin:'21:00'});
  }
  d.setUTCDate(d.getUTCDate()+1);
}
let w=new Date('2026-10-14T12:00:00Z');
for(let n=1;n<=16;n++){base.push({leccion:n,riel:'ican',tipo:'ICAN',fecha:w.toISOString().slice(0,10),
    estado:'PROGRAMADA',hora_inicio:'18:00',hora_fin:'20:00'});w.setUTCDate(w.getUTCDate()+7);}
const candidate=base.map(e=>({...e})),regular=candidate.filter(e=>e.riel==='curso'),tail=regular.filter(e=>e.leccion>=21);
tail.forEach((e,i)=>e.fecha=i===0?'2026-12-21':base.find(b=>b.tipo==='CLASE'&&b.leccion===e.leccion-1).fecha);
let result=sandbox.tvPlanValidateF52(base,candidate,['2026-12-01','2026-12-25','2027-01-01']);
assert(result.ok,result.error);
assert.equal(result.cambios.length,12);
candidate.find(e=>e.tipo==='CLASE'&&e.leccion===25).fecha='2026-12-25';
assert.equal(sandbox.tvPlanValidateF52(base,candidate,['2026-12-25']).ok,false);
console.log('QA_TEACHER_REAL_ROUTE_PLAN_PASS');
console.log('PASS: real teacher route, 32+16, drag/drop, advance preview, admin handoff, cache bust, JSX transpile');
