#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const patchFile='apps_script_patches/99R_MEMORY_MATCH_CONFLICT_RECONCILIATION_QA_CS21A196.gs';
const completeFile='apps_script_patches/99_CS21A196_MEMORY_MATCH_CONFLICT_RECONCILIATION_COMPLETO.gs';
for(const file of [patchFile,completeFile]) assert.equal(fs.existsSync(file),true,`Falta ${file}`);

const source=fs.readFileSync(patchFile,'utf8');
const complete=fs.readFileSync(completeFile,'utf8');
assert.ok((complete.match(/_cs21a196AlignWrittenPackage_\(room, pkg\)/g)||[]).length>=2,'DISCOVER_CARD y SUBMIT_PAIR deben alinear revisión.');

let relayBaseCalls=0;
const context={
  console:{log(){}},JSON,Object,Math,String,Number,Array,Error,Date,isFinite,
  _elive176Package_:room=>{try{return JSON.parse(String(room?.CURRENT_QUESTION_JSON||'{}')).room_package||null;}catch{return null;}},
  _cs21a192Revision_:pkg=>Math.max(Number(pkg?.state_revision||0)||0,Number(pkg?.shared_state?.state_revision||0)||0),
  _cs21a195PublishResponseRelay_:(room,response)=>{relayBaseCalls+=1;return true;},
  verificarMemoryMatchStartFixCS21A183:()=>({ok:true,version:'CS21A195-MM-CONVERGENCE-RELAY-1',qa_master:'QA',qa_operational:'QA'}),
};
vm.createContext(context);
new vm.Script(source,{filename:patchFile}).runInContext(context);

const stale={state_revision:8,shared_state:{state_revision:8,board_version:4}};
const room={CURRENT_QUESTION_JSON:JSON.stringify({room_package:{state_revision:9,shared_state:{state_revision:9,board_version:4}}})};
const aligned=context._cs21a196AlignWrittenPackage_(room,stale);
assert.equal(aligned.state_revision,9);
assert.equal(aligned.shared_state.state_revision,9);

assert.equal(context._cs21a195PublishResponseRelay_({room_code:'LAB-X'},{ok:false,error:'state_conflict',room_package:{state_revision:10}}),false);
assert.equal(relayBaseCalls,0,'Un rechazo no debe llegar al relay compartido.');
assert.equal(context._cs21a195PublishResponseRelay_({room_code:'LAB-X'},{ok:true,room_package:{state_revision:10}}),true);
assert.equal(relayBaseCalls,1,'Una respuesta aceptada sí debe conservar el relay CS195.');

console.log(JSON.stringify({
  ok:true,
  contract:'CS21A196_MUTATION_RESPONSE_COHERENCE',
  aligned_revision:aligned.state_revision,
  rejected_relay_blocked:true,
  accepted_relay_preserved:true,
  embedded_call_sites:2,
},null,2));
