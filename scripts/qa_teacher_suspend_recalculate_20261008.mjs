import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),B=require('../vendor/babel.js');
const source=fs.readFileSync('src/teacher_views.jsx','utf8');
B.transform(source,{presets:['react'],plugins:['transform-block-scoping']});
const start=source.indexOf('function tvPlanISOF52('),end=source.indexOf('function TeacherAgendaMonthF82(',start);
const v={tvIsIcanEventF96:x=>x.riel==='ican'};
vm.createContext(v);vm.runInContext(source.slice(start,end),v);
const group='B1-KJ18-C3-0826',base=[],date=new Date('2026-10-08T12:00:00Z');
const feriados=['2026-12-01','2026-12-25','2027-01-01'];
while(base.filter(e=>e.riel==='curso').length<32){
  const iso=date.toISOString().slice(0,10),w=date.getUTCDay();
  if([2,4].includes(w)&&!feriados.includes(iso)){
    const n=base.filter(e=>e.riel==='curso').length+1;
    base.push({cod_grupo:group,riel:'curso',leccion:n,fecha:iso,estado:'PROGRAMADA',
      hora_inicio:'18:00',hora_fin:'21:00'});
  }
  date.setUTCDate(date.getUTCDate()+1);
}
const w=new Date('2026-10-14T12:00:00Z');
for(let n=1;n<=16;n++){
  base.push({cod_grupo:group,riel:'ican',leccion:n,fecha:w.toISOString().slice(0,10),
    estado:'PROGRAMADA',hora_inicio:'18:00',hora_fin:'20:00'});
  w.setUTCDate(w.getUTCDate()+7);
}
const target=base.find(e=>e.riel==='curso'&&e.fecha==='2026-12-24');
assert(target,'Example lesson 24 Dec must exist');
const beforeCourse=base.filter(e=>e.riel==='curso').at(-1).fecha;
const result=v.tvPlanSuspenderF52(base,base,target,feriados);
assert(result.ok,result.error);
assert.equal(result.fechaLiberada,'2026-12-24');
assert(result.afectadas>=1);
assert(result.nuevoFinal>beforeCourse,'Last lesson extends into the next valid school date');
assert(!feriados.includes(result.nuevoFinal),'Do not use listed holidays');
assert.equal(Object.keys(result.cambios).filter(k=>k.startsWith('ican|')).length,0);
const revised=base.map(e=>({...e,fecha:result.cambios[v.tvPlanKeyF52(e)]||e.fecha}));
assert.equal(revised.filter(e=>e.fecha==='2026-12-24').length,0,'Suspended day is free');
assert.equal(revised.filter(e=>e.riel==='curso').length,32);
assert.equal(revised.filter(e=>e.riel==='ican').length,16);
assert.equal(new Set(revised.map(e=>e.fecha)).size,48,'One activity per day');
assert(v.tvPlanValidateF52(base,revised,feriados).ok);
for(const a of base.filter(e=>e.riel==='ican')){
  assert.equal(revised.find(e=>e.riel==='ican'&&e.leccion===a.leccion).fecha,a.fecha);
}
const ican=base.find(e=>e.riel==='ican'&&e.fecha==='2026-12-23');
assert(ican);
const ic=v.tvPlanSuspenderF52(base,base,ican,feriados);
assert(ic.ok,ic.error);
assert.equal(Object.keys(ic.cambios).filter(k=>k.startsWith('curso|')).length,0);
const revisedIC=base.map(e=>({...e,fecha:ic.cambios[v.tvPlanKeyF52(e)]||e.fecha}));
assert.equal(revisedIC.some(e=>e.fecha==='2026-12-23'),false);
assert(v.tvPlanValidateF52(base,revisedIC,feriados).ok);
const last=base.filter(e=>e.riel==='curso').at(-1);
assert(v.tvPlanSuspenderF52(base,base,last,feriados).ok,'Last lesson also can move to a new valid date');
const locked={...target,estado:'CERRADA'};
assert.equal(v.tvPlanSuspenderF52(base.map(e=>e===target?locked:e),base.map(e=>e===target?locked:e),locked,feriados).ok,false);
const collision=base.map(e=>({...e}));
const ican9=collision.find(e=>e.riel==='ican'&&e.leccion===9);
ican9.fecha=collision.find(e=>e.riel==='curso'&&e.fecha==='2026-12-10').fecha;
ican9.hora_inicio='21:00';ican9.hora_fin='23:00';
assert.equal(v.tvPlanValidateF52(base,collision,feriados).ok,false,'Even nonoverlapping hours cannot share day');
assert(source.includes('Suspender fecha y recalcular'));
assert(source.includes('onSelect={e=>{if(planMode){abrirSuspensionPlan(e);return;}'));
assert(source.includes('suspensionPreview'));
console.log('QA_TEACHER_SUSPEND_RECALC_PASS');
console.log('PASS: 24-Dec date free, 32+16 preserved, one/day, distinct I CAN rail, last-session shift, historical locked, modal wired');
