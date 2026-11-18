// ORAL-APPROVAL-02 · focal contract, no sessions, grades or Drive writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('modulos/examen_oral.html','utf8');
const start=html.indexOf('function oralApprovedBankF111(');
const end=html.indexOf('function renderQBank()',start);
assert.ok(start>=0&&end>start,'approval guard in oral module');
const js=html.slice(start,end);
const context={state:{panel:{nivel:'B2'},bank:null},QB:{1:{qs:['legacy']}}};
vm.createContext(context);vm.runInContext(js,context);
const catalog=Object.fromEntries(Array.from({length:16},(_,i)=>[
 i+1,{title:'Unit '+(i+1),qs:['A','B','C','D']}]));
const approved={aprobado:true,estado:'APROBADO_DOCUMENTADO',
 id:'IC5-L1-ACADEMIA-B2',version:'AN-ORAL-B2-CANDIDATO-R5-20261018',
 unidades:catalog};
assert.equal(context.oralApprovedBankF111(context.state.panel,approved),catalog);
context.state.bank=approved;
assert.equal(context.questionBankForLevelF111(),catalog);
for(const level of ['I1','I2']){
 context.state.panel={nivel:level};
 assert.equal(Object.keys(context.questionBankForLevelF111()).length,0,
  'no official indices before backend write guard supports '+level);
}
context.state.panel={nivel:'B1'};
assert.equal(context.questionBankForLevelF111(),context.QB,'legacy B1 retained');
context.state.panel={nivel:'B2'};
for(const variant of [
 {...approved,aprobado:false},
 {...approved,estado:'PENDIENTE_APROBACION'},
 {...approved,version:'unknown'},
 {...approved,id:'wrong'},
 {...approved,unidades:{...catalog,1:{title:'Unit 1',qs:['A']}}},
 {...approved,unidades:{...catalog,16:null}},
 {...approved,unidades:[]}
]){
 assert.equal(context.oralApprovedBankF111(context.state.panel,variant),null,
  'reject unsigned, partial or unsupported bank');
}
assert.ok(html.includes('Material fuente transcrito · NO es banco aprobado por backend'));
assert.ok(html.includes('state.bank=oralApprovedBankF111(j.panel,j.banco_oral)?j.banco_oral:null;'));
console.log('ORAL-APPROVAL-02 E1 PASS: B1 legacy, B2 documented, I1/I2 source only, malformed banks rejected');
