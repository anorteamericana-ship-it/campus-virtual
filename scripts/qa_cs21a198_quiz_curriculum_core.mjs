#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const context = vm.createContext({ console, Date, Math, Set, Map, Object, Array, String, Number, Boolean, Error, JSON });
context.window = context;

function load(relativePath) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  new vm.Script(source, { filename:relativePath }).runInContext(context);
}

load('src/english_lab_games/english_lab_quiz_curriculum_contract_cs21a198.js');
load('src/english_lab_games/english_lab_quiz_engine_cs21a198.js');

const Contract = context.EnglishLabQuizCurriculumContractCS21A198;
const Engine = context.EnglishLabQuizEngineCS21A198;
assert.ok(Contract, 'Falta contrato curricular CS21A198');
assert.ok(Engine, 'Falta motor Quiz Time CS21A198');
assert.equal(Contract.VERSION, 'CS21A198');
assert.equal(Engine.VERSION, 'CS21A198');
assert.equal(Contract.INITIAL_UNIT_ID, 'B1-U01');
assert.equal(Contract.isEnabledUnit('B1', 'U01'), true);
assert.equal(Contract.isEnabledUnit('B1', 'U02'), false, 'CS21A198 no debe habilitar U02 todavía');
assert.equal(Contract.isEnabledUnit('B2', 'U01'), false, 'CS21A198 no debe habilitar B2 todavía');

const specs = [
  ['VOCAB','VOCAB_01','MCQ','VOC'],
  ['GRAM','GRAM_01','MCQ','GRAM'],
  ['SPEAK','SPEAK_02','MCQ','PHR'],
  ['LISTEN','LISTEN_01','DIALOGUE_MCQ','LIS'],
  ['READ','READ_01','READING_MCQ','READ'],
];
const pool = [];
for (const [area, template, type, prefix] of specs) {
  for (let i = 1; i <= 5; i += 1) {
    pool.push({
      PLAY_ITEM_ID:`PLAY-B1-U01-${area}-${String(i).padStart(3,'0')}`,
      SOURCE_ITEM_ID:`${prefix}-B1-U01-${String(i).padStart(3,'0')}`,
      LEVEL_ID:'B1', UNIT_ID:'B1-U01', AREA_ID:area,
      TEMPLATE_ID:template, ITEM_TYPE:type, STATUS:'ACTIVE',
    });
  }
}

const validation = Contract.validateCanonicalPool(pool);
assert.equal(validation.ok, true, JSON.stringify(validation));
assert.equal(validation.poolSize, 25);
for (const [area] of specs) assert.equal(validation.counts[area], 5, `${area} debe aportar 5 ítems`);

const roundA = Contract.buildRoundBlueprint(pool, 'LAB-Q198-001');
const roundA2 = Contract.buildRoundBlueprint([...pool].reverse(), 'LAB-Q198-001');
const roundB = Contract.buildRoundBlueprint(pool, 'LAB-Q198-002');
assert.equal(roundA.length, 10);
assert.deepEqual(JSON.parse(JSON.stringify(roundA)), JSON.parse(JSON.stringify(roundA2)), 'La misma semilla debe producir la misma ronda aunque cambie el orden de Sheets');
assert.notDeepEqual(JSON.parse(JSON.stringify(roundA)), JSON.parse(JSON.stringify(roundB)), 'Semillas distintas deberían cambiar la selección/orden');
assert.equal(new Set(roundA.map(item => item.sourceItemId)).size, 10, 'No se permiten SOURCE_ITEM_ID repetidos');
for (const [area] of specs) assert.equal(roundA.filter(item => item.areaId === area).length, 2, `${area} debe aportar exactamente 2 preguntas`);

const leakyQuestion = {
  question_id:'Q-B1U01-001', source_item_id:'GRAM-B1-U01-001', level_id:'B1', unit_id:'B1-U01',
  area_id:'GRAM', template_id:'GRAM_01', item_type:'MCQ', prompt_es:'Elegí la oración correcta.',
  stem:'Presentación', option_a:'My name is Ana.', option_b:'My name Ana.', option_c:'I name is Ana.', option_d:'My names Ana.',
  correct_option:'A', correct_answer:'My name is Ana.', answer_key:'A', solution:'A', difficulty_1_10:1,
};
const publicQuestion = Engine.sanitizePublicQuestion(leakyQuestion);
const publicJson = JSON.stringify(publicQuestion).toLowerCase();
for (const forbidden of ['correct_option','correctanswer','correct_answer','answer_key','solution']) {
  assert.equal(publicJson.includes(forbidden), false, `Fuga de clave prohibida: ${forbidden}`);
}
assert.equal(publicQuestion.options.length, 4);
assert.equal(publicQuestion.questionId, 'Q-B1U01-001');
assert.equal(publicQuestion.sourceItemId, 'GRAM-B1-U01-001');

const now = Date.now();
const openState = Engine.normalizePublicState({
  room_code:'LAB-0198', state_revision:7, phase:'OPEN',
  question:leakyQuestion,
  turn_state:{ participation_policy:'EVERYONE', turn_started_at:new Date(now - 1000).toISOString(), turn_ends_at:new Date(now + 15000).toISOString() },
  answered_player_ids:[], question_index:1, question_total:10,
});
assert.equal(Engine.canPlayerAnswer(openState, {player_id:'QA-STU-001'}, now), true);
const action = Engine.buildAnswerAction(openState, {player_id:'QA-STU-001'}, 'B', 'ACT-Q198-001');
assert.equal(action.question_id, 'Q-B1U01-001');
assert.equal(action.expected_state_revision, 7);
assert.equal(Object.prototype.hasOwnProperty.call(action, 'correct_option'), false);

const answeredState = Engine.normalizePublicState({
  ...JSON.parse(JSON.stringify(openState)), phase:'OPEN', answered_player_ids:['QA-STU-001'],
});
assert.equal(Engine.canPlayerAnswer(answeredState, {player_id:'QA-STU-001'}, now), false, 'Un alumno no puede responder dos veces la misma pregunta');

assert.throws(() => Engine.normalizePublicState({
  room_code:'LAB-0198', phase:'OPEN', question:leakyQuestion,
  reveal:{visible:true,correct_option:'A',explanation_es:'Explicación'},
  turn_state:{turn_ends_at:new Date(now + 5000).toISOString()},
}), /fuera de la fase REVEAL/, 'La clave correcta solo puede aparecer durante REVEAL');

const revealState = Engine.normalizePublicState({
  room_code:'LAB-0198', phase:'REVEAL', question:leakyQuestion,
  reveal:{visible:true,correct_option:'A',explanation_es:"Usa 'My name is' para decir tu nombre.",closes_at:new Date(now + 6000).toISOString()},
  turn_state:{turn_ends_at:new Date(now + 20000).toISOString()},
});
assert.equal(revealState.reveal.correctOption, 'A');
assert.ok(Engine.remainingMs(revealState, now) >= 5900 && Engine.remainingMs(revealState, now) <= 6100, 'REVEAL debe usar su propio deadline');
assert.equal(Engine.canPlayerAnswer(revealState, {player_id:'QA-STU-001'}, now), false);

console.log(JSON.stringify({
  ok:true,
  version:'CS21A198-QUIZ-CURRICULUM-CORE-1',
  unit:'B1-U01',
  canonical_pool:validation.poolSize,
  round_questions:roundA.length,
  balance:Object.fromEntries(specs.map(([area]) => [area, roundA.filter(item => item.areaId === area).length])),
  unique_source_items:new Set(roundA.map(item => item.sourceItemId)).size,
  deterministic_seed:true,
  correct_answer_hidden_before_reveal:true,
  reveal_only_answer_key:true,
  double_answer_blocked_client_contract:true,
  enabled_units:['B1-U01'],
}, null, 2));
