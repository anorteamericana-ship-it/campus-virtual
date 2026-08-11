#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backendPath = path.join(root, 'apps_script_patches/99T_QUIZ_TIME_CURRICULAR_QA_CS21A198.gs');
const source = fs.readFileSync(backendPath, 'utf8');

// El submit de alumnos no debe tomar el lock global: Quiz Time recibe respuestas simultáneas.
const answerStart = source.indexOf('function englishLabQuizTimeAnswerCS21A198');
const closeStart = source.indexOf('function englishLabQuizTimeCloseRoomCS21A198');
assert.ok(answerStart >= 0 && closeStart > answerStart, 'No se localizó el endpoint de respuesta Quiz Time');
const answerSource = source.slice(answerStart, closeStart);
assert.equal(/LockService\s*\.\s*getScriptLock/.test(answerSource), false, 'El submit Quiz Time no debe serializar a todos los alumnos con ScriptLock');
assert.ok(/_elive180AppendObject_\(ELIVE_ANSWERS_SHEET/.test(answerSource), 'La respuesta debe persistirse append-only');
assert.ok(/action_id_requerido/.test(answerSource), 'Toda respuesta debe requerir action_id');

const context = vm.createContext({console, Date, Math, JSON, Object, Array, String, Number, Boolean, Error, isFinite});
context.doPost = () => ({ok:true});
context._elive176Shuffle_ = (values, seedText) => {
  // Fisher-Yates determinista equivalente al helper del Campus.
  const output = values.slice();
  let hash = 2166136261;
  const text = String(seedText || '').trim();
  for (let i=0;i<text.length;i+=1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash,16777619); }
  let seed = hash >>> 0 || 1;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i=output.length-1;i>0;i-=1) { const j=Math.floor(random()*(i+1)); [output[i],output[j]]=[output[j],output[i]]; }
  return output;
};
vm.runInContext(source, context, {filename:'99T_QUIZ_TIME_CURRICULAR_QA_CS21A198.gs'});

const specs = [
  ['VOCAB','VOCAB_01','MCQ','VOC'],
  ['GRAM','GRAM_01','MCQ','GRAM'],
  ['SPEAK','SPEAK_02','MCQ','PHR'],
  ['LISTEN','LISTEN_01','DIALOGUE_MCQ','LIS'],
  ['READ','READ_01','READING_MCQ','READ'],
];
const rows = [];
for (const [area,template,type,prefix] of specs) {
  for (let i=1;i<=5;i+=1) rows.push({
    LEVEL_ID:'B1',UNIT_ID:'B1-U01',AREA_ID:area,TEMPLATE_ID:template,ITEM_TYPE:type,STATUS:'ACTIVE',
    PLAY_ITEM_ID:`PLAY-${area}-${i}`,SOURCE_ITEM_ID:`${prefix}-B1-U01-${String(i).padStart(3,'0')}`,
    PROMPT_ES:'Instrucción',PROMPT_EN:'Instruction',STEM:`${area} ${i}`,
    OPTION_A:'A',OPTION_B:'B',OPTION_C:'C',OPTION_D:'D',CORRECT_OPTION:'C',
    EXPLANATION_ES:'Explicación secreta',MINI_TEXT_OR_DIALOGUE:area==='LISTEN'||area==='READ'?'Texto de apoyo':'',DIFFICULTY_1_10:'1'
  });
}
const validation = context._elq198ValidatePool_(rows);
assert.equal(validation.ok, true, JSON.stringify(validation));
const deck = context._elq198SelectDeck_('LAB-Q198-TEST', rows);
assert.equal(deck.length, 10);
assert.equal(new Set(deck.map(item => item.source_item_id)).size, 10);
for (const [area] of specs) assert.equal(deck.filter(item => item.area_id===area).length,2,`${area} debe aportar 2 preguntas`);

for (const secret of deck) {
  assert.ok(['A','B','C','D'].includes(secret.correct_option));
  const pub = context._elq198PublicQuestion_(secret);
  const json = JSON.stringify(pub).toLowerCase();
  assert.equal(json.includes('correct_option'), false, 'La pregunta pública filtró correct_option');
  assert.equal(json.includes('explanation_es'), false, 'La explicación no debe viajar antes del reveal');
  assert.equal(Object.prototype.hasOwnProperty.call(pub,'correct_option'), false);
}

// El endpoint sólo expone correct/points a través de my_answer cuando el estado ya está en reveal/complete.
assert.ok(/phase === 'REVEAL' \|\| phase === 'COMPLETE'/.test(source));
assert.ok(/response\.my_answer\.correct/.test(source));
assert.ok(/No publicar correct\/points mientras OPEN/.test(source));

console.log(JSON.stringify({
  ok:true,
  version:'CS21A198-QUIZ-BACKEND-CONTRACT-1',
  pool:validation.pool_size,
  deck:deck.length,
  balanced:true,
  unique_sources:true,
  public_answer_key_hidden:true,
  global_submit_lock:false,
  append_only_answers:true,
  action_id_required:true,
},null,2));
