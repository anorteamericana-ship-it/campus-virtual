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
assert(app.includes('teacher_views.jsx?v=F99DUALADVANCE20261008'));
assert(bridge.includes('teacher_views.jsx?v=F99DUALADVANCE20261008'));
assert(page.includes('src/app.jsx?v=F99DUALADVANCE20261008'));
assert(page.includes('src/att77_bridge.js?v=F99DUALADVANCE20261008'));
assert(tv.includes('Organizar cronograma'));
assert(!tv.includes("onClick={comenzarPlan} style={{marginLeft:'auto'"),'Organizar must not be pushed beyond the right edge on narrow screens');
assert(!tv.includes("gap:6,marginLeft:'auto'"),'Actions must wrap on narrow screens');
// Regression: this undefined helper crashed the teacher's entire Calendar section in PROD.
const monthStart=tv.indexOf('function TeacherAgendaMonthF82(');
const monthEnd=tv.indexOf('function CronogramaDocenteSeguroF82(',monthStart);
assert(monthStart>=0&&monthEnd>monthStart,'Teacher month component exists');
const monthComponent=tv.slice(monthStart,monthEnd);
for(const hit of monthComponent.matchAll(/\b(tv[A-Za-z0-9_]+)\s*\(/g)) {
  const name=hit[1];
  assert(new RegExp('function\\s+'+name+'\\s*\\(').test(tv),'Undefined calendar helper: '+name);
}
assert(!monthComponent.includes('tvGroupLabel'),'Removed undefined helper tvGroupLabel');
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
assert(tv.includes('＋ Adelantar lección'),'Yellow advance lesson button');
assert(tv.includes('＋ Adelantar I CAN'),'Purple advance I CAN button');
assert(tv.includes("setAdvanceRail('curso')")&&tv.includes("setAdvanceRail('ican')"),'Distinct advance rails');
assert(tv.includes('advanceRail={advanceRail} targetGroup={codGrupo}'),'Mode reaches real teacher month');
assert(tv.includes('onClick={event=>{event.stopPropagation();onEmptyDay(iso);}}'),'Advance possible on days with other rail events');
const advanceCourse=sandbox.tvPlanAdvanceF52(base,base,'curso','2026-12-21');
assert(advanceCourse.ok,advanceCourse.error);
assert.equal(advanceCourse.numero,21);
assert.equal(advanceCourse.afectadas,12);
assert.equal(advanceCourse.cambios['curso|21'],'2026-12-21');
assert.equal(advanceCourse.cambios['curso|32'],'2027-01-26');
assert.equal(Object.keys(advanceCourse.cambios).filter(k=>k.startsWith('ican|')).length,0,'Course does not touch I CAN');
const afterCourse=base.map(e=>({...e,fecha:advanceCourse.cambios[sandbox.tvPlanKeyF52(e)]||e.fecha}));
assert(sandbox.tvPlanValidateF52(base,afterCourse,['2026-12-01','2026-12-25','2027-01-01']).ok);
const advanceIcan=sandbox.tvPlanAdvanceF52(afterCourse,base,'ican','2026-12-04');
assert(advanceIcan.ok,advanceIcan.error);
assert.equal(advanceIcan.numero,9);
assert.equal(advanceIcan.afectadas,8);
assert.equal(advanceIcan.cambios['ican|09'],undefined);
assert.equal(advanceIcan.cambios['ican|9'],'2026-12-04');
assert.equal(advanceIcan.cambios['ican|16'],'2027-01-20');
assert.equal(Object.keys(advanceIcan.cambios).filter(k=>k.startsWith('curso|')).length,0,'I CAN does not touch lessons');
const afterBoth=afterCourse.map(e=>({...e,fecha:advanceIcan.cambios[sandbox.tvPlanKeyF52(e)]||e.fecha}));
assert(sandbox.tvPlanValidateF52(base,afterBoth,['2026-12-01','2026-12-25','2027-01-01']).ok);
assert.equal(afterBoth.filter(e=>e.tipo==='CLASE').length,32);
assert.equal(afterBoth.filter(e=>e.tipo==='ICAN').length,16);
assert.equal(base.find(e=>e.tipo==='ICAN'&&e.leccion===9).fecha,'2026-12-09','Original baseline unchanged');
const clash=sandbox.tvPlanAdvanceF52(base,base,'ican','2026-12-03');
assert(clash.ok);
const clashDraft=base.map(e=>({...e,fecha:clash.cambios[sandbox.tvPlanKeyF52(e)]||e.fecha}));
assert.equal(sandbox.tvPlanValidateF52(base,clashDraft,['2026-12-01','2026-12-25','2027-01-01']).ok,false,'Must block same-hour regular class overlap');
assert.equal(sandbox.tvPlanAdvanceF52(base,base,'ican','2026-12-09').ok,false,'Cannot insert on existing I CAN date');
assert.equal(sandbox.tvPlanAdvanceF52(base,base,null,'2026-12-04').ok,false,'Must select a mode');
console.log('QA_TEACHER_DUAL_ADVANCE_PASS (curso 12 dates; I CAN 8 dates; combined 32+16; collision blocked)');
console.log('QA_TEACHER_REAL_ROUTE_PLAN_PASS');
console.log('PASS: real teacher route, 32+16, drag/drop, advance preview, admin handoff, cache bust, JSX transpile');
