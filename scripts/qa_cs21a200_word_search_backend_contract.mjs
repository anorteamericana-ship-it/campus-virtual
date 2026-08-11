#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const file='apps_script_unified/english_lab_word_search_module_cs21a200.gs';
const source=fs.readFileSync(file,'utf8');

const fixture=[
  ['001','hello','hola','VOCAB_01','MCQ'],['002','goodbye','adiós','VOCAB_01','MCQ'],['003','name','nombre','VOCAB_01','MCQ'],['004','teacher','profesor/a','VOCAB_01','MCQ'],['005','student','estudiante','VOCAB_01','MCQ'],
  ['006','phone number','número de teléfono','VOCAB_02','MATCH'],['007','email','correo electrónico','VOCAB_02','MATCH'],['008','zero','cero','VOCAB_02','MATCH'],['009','please','por favor','VOCAB_02','MATCH'],['010','thanks','gracias','VOCAB_02','MATCH'],
].map(([id,word,hint,template,type])=>template==='VOCAB_01'?{
  LEVEL_ID:'B1',UNIT_ID:'B1-U01',AREA_ID:'VOCAB',TEMPLATE_ID:template,ITEM_TYPE:type,STATUS:'ACTIVE',PLAY_ITEM_ID:`P-${id}`,SOURCE_ITEM_ID:`VOC-B1-U01-${id}`,STEM:word,OPTION_A:hint,CORRECT_OPTION:'A'
}:{
  LEVEL_ID:'B1',UNIT_ID:'B1-U01',AREA_ID:'VOCAB',TEMPLATE_ID:template,ITEM_TYPE:type,STATUS:'ACTIVE',PLAY_ITEM_ID:`P-${id}`,SOURCE_ITEM_ID:`VOC-B1-U01-${id}`,MATCH_LEFT:word,MATCH_RIGHT:hint
});

const context={
  console,JSON,Date,Math,String,Number,Object,Array,RegExp,isFinite,parseInt,
  Utilities:{getUuid:()=> 'QA-UUID'},
  doPost:()=>({}),
  _an4406_parseBody_:()=>({}),_an4406_json_:x=>x,
  _elive176Rows_:(name)=>name==='ACADEMIA_PLAY_BANK'?fixture:name==='CONFIG_UNIDADES'?[{LEVEL_ID:'B1',UNIT_ID:'B1-U01',STATUS:'ACTIVE',UNIT_NAME:"What's your name?"}]:[],
  _cs21a171QaEnvironment_:()=>({ok:true}),
  ELQ198_OPTION_BALANCE_VERSION:'CS21A198-QUIZ-TIME-B1U01-2',
};
vm.createContext(context);
vm.runInContext(source,context,{filename:file});

const words=context._elws200PoolWords_();
const validation=context._elws200ValidatePool_(words);
assert.equal(validation.ok,true,'pool B1-U01 debe ser canónico y completo');
assert.equal(words.length,10,'debe haber 10 vocablos');
assert.equal(words.find(w=>w.label==='phone number')?.grid_word,'PHONENUMBER','normaliza phone number');

for(let i=0;i<120;i+=1){
  const puzzle=context._elws200BuildPuzzle_(words,`QA-SEED-${i}`);
  assert.equal(puzzle.size,14,`seed ${i}: grid 14x14`);
  assert.equal(puzzle.words.length,10,`seed ${i}: 10 palabras`);
  for(const word of puzzle.words){
    assert.equal(context._elws200Occurrences_(puzzle.grid,word.grid_word).length,1,`seed ${i}: ${word.grid_word} debe aparecer exactamente una vez`);
  }
  const pub=context._elws200PublicPuzzle_(puzzle);
  assert.equal(Object.hasOwn(pub,'solutions'),false,'puzzle público no debe exponer solutions');
  assert.equal(JSON.stringify(pub).includes('"cells"'),false,'puzzle público no debe exponer coordenadas de solución');
}

const puzzle=context._elws200BuildPuzzle_(words,'CLAIM-QA');
const current={phase:'OPEN',round_id:'ROUND-QA',puzzle_id:puzzle.puzzle_id};
const word=puzzle.words[0],solution=puzzle.solutions[word.word_id];
const action={action_id:'ACT-1',round_id:'ROUND-QA',puzzle_id:puzzle.puzzle_id,word_id:word.word_id,start:solution.cells[0],end:solution.cells.at(-1)};
let decision=context._elws200ClaimDecision_(puzzle,current,{by_word:{},by_action:{}},action);
assert.equal(decision.ok,true,'claim válido debe aceptarse');
assert.equal(decision.duplicate,false,'primer claim no es duplicado');

const reverse={...action,action_id:'ACT-2',start:solution.cells.at(-1),end:solution.cells[0]};
decision=context._elws200ClaimDecision_(puzzle,current,{by_word:{},by_action:{}},reverse);
assert.equal(decision.ok,true,'trazo inverso del mismo path debe aceptarse');

assert.equal(context._elws200ClaimDecision_(puzzle,current,{by_word:{},by_action:{}},{...action,action_id:'A3',round_id:'OLD'}).error,'round_stale');
assert.equal(context._elws200ClaimDecision_(puzzle,current,{by_word:{},by_action:{}},{...action,action_id:'A4',puzzle_id:'WS-OLD'}).error,'puzzle_stale');
assert.equal(context._elws200ClaimDecision_(puzzle,current,{by_word:{[word.word_id]:{player_id:'P1'}},by_action:{}},{...action,action_id:'A5'}).error,'word_already_claimed');
assert.equal(context._elws200ClaimDecision_(puzzle,current,{by_word:{},by_action:{'ACT-1':{}}},action).duplicate,true,'mismo action_id debe ser idempotente');
assert.equal(context._elws200ClaimDecision_(puzzle,current,{by_word:{},by_action:{}},{...action,action_id:'A6',start:{row:0,col:0},end:{row:0,col:1}}).error,'seleccion_invalida');

const changedWords=words.map((w,i)=>i?{...w}:{...w,grid_word:'HELLOS'});
const p1=context._elws200BuildPuzzle_(words,'SAME-SEED');
const p2=context._elws200BuildPuzzle_(changedWords,'SAME-SEED');
assert.notEqual(p1.puzzle_id,p2.puzzle_id,'puzzle_id debe depender del contenido');
assert.notEqual(context._elws200BuildPuzzle_(words,'SEED-A').puzzle_id,context._elws200BuildPuzzle_(words,'SEED-B').puzzle_id,'puzzle_id debe depender de seed/sala');

for(const marker of [
  "LockService.getScriptLock()",
  "englishlabwordsearchclaimword",
  "retryable:true",
  "first_claim_wins:true",
  "public_puzzle_hides_solutions:noLeak",
  "QUESTION_INDEX:1"
]) assert.ok(source.includes(marker),`falta marcador: ${marker}`);

console.log(JSON.stringify({
  ok:true,
  version:context.ELWS200_VERSION,
  canonical_words:words.length,
  seeds_tested:120,
  unique_occurrences:true,
  public_puzzle_hides_solutions:true,
  round_and_puzzle_preconditions:true,
  reverse_trace_valid:true,
  first_claim_wins_contract:true,
  duplicate_action_idempotent:true,
  puzzle_identity_bound_to_content:true
},null,2));
