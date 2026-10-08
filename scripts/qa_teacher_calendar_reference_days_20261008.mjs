import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url), B=require('../vendor/babel.js');
const src=fs.readFileSync('src/teacher_views.jsx','utf8');
const start=src.indexOf('function TeacherAgendaMonthF82(');
const stop=src.indexOf('function CronogramaDocenteSeguroF82(',start);
assert(start>0&&stop>start);
const ctx={
  React:{createElement:(type,props,...children)=>({type,props:props||{},children})},
  tvPlanFuturaF52:iso=>iso>'2026-10-08',
  tvPlanSafeF52:()=>true,
  tvAgendaToneF96:()=>({dark:'#B77F00',light:'#FFF0CD'}),
  tvIsIcanEventF96:e=>e.tipo==='ICAN',
  tvAgendaEventLabelF96:()=> 'Clase'
};
vm.createContext(ctx);
vm.runInContext(B.transform(src.slice(start,stop),{presets:['react']}).code,ctx);
const events=[
  {fecha:'2026-10-13',cod_grupo:'0826',tipo:'CLASE',leccion:2,estado:'PROGRAMADA'},
  {fecha:'2026-10-14',cod_grupo:'0826',tipo:'ICAN',leccion:1,estado:'PROGRAMADA'},
  {fecha:'2026-10-15',cod_grupo:'0826',tipo:'CLASE',leccion:3,estado:'PROGRAMADA'}
];
const clicked=[];
const render=planMode=>ctx.TeacherAgendaMonthF82({
  month:new Date(2026,9,1),events,planMode,onSelect:()=>{},
  onDragStart:()=>{},onDragEnd:()=>{},onDropDay:()=>{},
  onEmptyDay:(iso,rail)=>clicked.push(iso+'|'+rail)
});
const flatten=n=>Array.isArray(n)?n.flatMap(flatten):n&&typeof n==='object'?[n,...(n.children||[]).flatMap(flatten)]:[];
const cell=(tree,day)=>flatten(tree).find(x=>x.props?.['data-date']==='2026-10-'+day);
const buttons=node=>flatten(node).filter(x=>x.type==='button');
const tree=render(true);
for(const day of ['12','16','17','18']){
  const list=buttons(cell(tree,day));
  assert.equal(list.length,2,'day '+day+' must show exactly 2 choices');
  assert.equal(list[0].children[0],'+ Lección');
  assert.equal(list[1].children[0],'+ I CAN');
  assert(list[0].props.style.border.includes('dashed #CA8914'));
  assert(list[1].props.style.border.includes('dashed #885CB0'));
  list[0].props.onClick();list[1].props.onClick();
}
for(const day of ['13','14','15'])assert.equal(buttons(cell(tree,day)).length,1,'occupied '+day);
assert.equal(buttons(cell(render(false),'12')).length,0,'readonly mode has no buttons');
assert.equal(clicked.length,8);
assert.equal(clicked[0],'2026-10-12|curso');
assert.equal(clicked[1],'2026-10-12|ican');
assert.equal(clicked[6],'2026-10-18|curso');
assert.equal(clicked[7],'2026-10-18|ican');
console.log('QA_REFERENCE_WEEK_12_18_PASS');
console.log('Empty dates 12,16,17,18: dual dashed buttons. 13,14,15: events only. Clicks: independent course/I CAN.');
