#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=fs.readFileSync(path.join(root,'apps_script_patches/99T_QUIZ_TIME_CURRICULAR_QA_CS21A198.gs'),'utf8');
const patch=fs.readFileSync(path.join(root,'apps_script_patches/99U_QUIZ_TIME_OPTION_BALANCE_QA_CS21A198.gs'),'utf8');

const context=vm.createContext({console,Date,Math,JSON,Object,Array,String,Number,Boolean,Error,isFinite});
context.doPost=()=>({ok:true});
context._elive176Shuffle_=(values,seedText)=>{
  const output=values.slice();
  let hash=2166136261;
  const text=String(seedText||'').trim();
  for(let i=0;i<text.length;i+=1){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
  let seed=hash>>>0||1;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=output.length-1;i>0;i-=1){const j=Math.floor(random()*(i+1));[output[i],output[j]]=[output[j],output[i]];}
  return output;
};
vm.runInContext(base,context,{filename:'99T_QUIZ_TIME_CURRICULAR_QA_CS21A198.gs'});
vm.runInContext(patch,context,{filename:'99U_QUIZ_TIME_OPTION_BALANCE_QA_CS21A198.gs'});

const specs=[
  ['VOCAB','VOCAB_01','MCQ','VOC'],
  ['GRAM','GRAM_01','MCQ','GRAM'],
  ['SPEAK','SPEAK_02','MCQ','PHR'],
  ['LISTEN','LISTEN_01','DIALOGUE_MCQ','LIS'],
  ['READ','READ_01','READING_MCQ','READ'],
];
const rows=[];
for(const [area,template,type,prefix] of specs){
  for(let i=1;i<=5;i+=1)rows.push({
    LEVEL_ID:'B1',UNIT_ID:'B1-U01',AREA_ID:area,TEMPLATE_ID:template,ITEM_TYPE:type,STATUS:'ACTIVE',
    PLAY_ITEM_ID:`PLAY-${area}-${i}`,SOURCE_ITEM_ID:`${prefix}-B1-U01-${String(i).padStart(3,'0')}`,
    PROMPT_ES:'Instrucción',PROMPT_EN:'Instruction',STEM:`${area} ${i}`,
    OPTION_A:`correct-${area}-${i}`,OPTION_B:`distractor-b-${area}-${i}`,OPTION_C:`distractor-c-${area}-${i}`,OPTION_D:`distractor-d-${area}-${i}`,
    CORRECT_OPTION:'A',EXPLANATION_ES:'Secreto',MINI_TEXT_OR_DIALOGUE:area==='LISTEN'||area==='READ'?'Texto de apoyo':'',DIFFICULTY_1_10:'1'
  });
}
const original=JSON.stringify(rows);
const deck=context._elq198SelectDeck_('LAB-Q198-BALANCE',rows);
assert.equal(deck.length,10);
assert.equal(JSON.stringify(rows),original,'El balance no debe mutar la fuente curricular');

const counts={A:0,B:0,C:0,D:0};
for(const item of deck){
  assert.ok(Object.hasOwn(counts,item.correct_option),`Clave correcta invalida ${item.correct_option}`);
  counts[item.correct_option]+=1;
  const chosen=item.options.find(option=>option.id===item.correct_option);
  assert.ok(chosen && chosen.label.startsWith('correct-'),'La clave remapeada debe seguir apuntando al contenido correcto');
  const pub=context._elq198PublicQuestion_(item);
  assert.equal(Object.hasOwn(pub,'correct_option'),false,'La pregunta publica no puede exponer correct_option');
}
const values=Object.values(counts);
assert.equal(values.every(value=>value>0),true,`Deben usarse A/B/C/D: ${JSON.stringify(counts)}`);
assert.ok(Math.max(...values)-Math.min(...values)<=1,`Distribucion no balanceada: ${JSON.stringify(counts)}`);

const deckAgain=context._elq198SelectDeck_('LAB-Q198-BALANCE',rows);
assert.deepEqual(deckAgain.map(x=>[x.question_id,x.correct_option,x.options.map(o=>o.label)]),deck.map(x=>[x.question_id,x.correct_option,x.options.map(o=>o.label)]),'La misma sala debe producir el mismo orden de opciones');

console.log(JSON.stringify({
  ok:true,
  version:'CS21A198-QUIZ-TIME-B1U01-2',
  source_correct_option:'A x 25 (fixture replica el patron real B1-U01)',
  correct_option_counts:counts,
  all_four_positions_used:true,
  spread:Math.max(...values)-Math.min(...values),
  deterministic_per_room:true,
  source_rows_unchanged:true,
  public_answer_key_hidden:true,
  listening_delivery_mode:context.ELQ198_LISTENING_DELIVERY_MODE,
},null,2));
