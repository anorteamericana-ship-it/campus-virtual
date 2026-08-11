#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('apps_script_unified/english_lab_word_search_module_cs21a200.gs','utf8');
const players=[
  {ROOM_ID:'R1',ROOM_CODE:'LAB-2000',COD_ESTUDIANTE:'NATY',NOMBRE:'Naty',STATUS:'ACTIVE',JOINED_AT:new Date().toISOString(),LAST_SEEN_AT:new Date().toISOString()},
  {ROOM_ID:'R1',ROOM_CODE:'LAB-2000',COD_ESTUDIANTE:'CHU',NOMBRE:'Chu',STATUS:'ACTIVE',JOINED_AT:new Date().toISOString(),LAST_SEEN_AT:new Date().toISOString()},
];
const answers=[];
const events=[];
let room=null;

const fixture=[
  ['001','hello','hola','VOCAB_01','MCQ'],['002','goodbye','adiós','VOCAB_01','MCQ'],['003','name','nombre','VOCAB_01','MCQ'],['004','teacher','profesor/a','VOCAB_01','MCQ'],['005','student','estudiante','VOCAB_01','MCQ'],
  ['006','phone number','número de teléfono','VOCAB_02','MATCH'],['007','email','correo electrónico','VOCAB_02','MATCH'],['008','zero','cero','VOCAB_02','MATCH'],['009','please','por favor','VOCAB_02','MATCH'],['010','thanks','gracias','VOCAB_02','MATCH'],
].map(([id,word,hint,template,type])=>template==='VOCAB_01'?{LEVEL_ID:'B1',UNIT_ID:'B1-U01',AREA_ID:'VOCAB',TEMPLATE_ID:template,ITEM_TYPE:type,STATUS:'ACTIVE',PLAY_ITEM_ID:`P-${id}`,SOURCE_ITEM_ID:`VOC-${id}`,STEM:word,OPTION_A:hint,CORRECT_OPTION:'A'}:{LEVEL_ID:'B1',UNIT_ID:'B1-U01',AREA_ID:'VOCAB',TEMPLATE_ID:template,ITEM_TYPE:type,STATUS:'ACTIVE',PLAY_ITEM_ID:`P-${id}`,SOURCE_ITEM_ID:`VOC-${id}`,MATCH_LEFT:word,MATCH_RIGHT:hint});

const context={console,JSON,Date,Math,String,Number,Object,Array,RegExp,isFinite,parseInt,
  Utilities:{getUuid:()=> 'QA-UUID'},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
  doPost:()=>({}),_an4406_parseBody_:()=>({}),_an4406_json_:x=>x,
  _elive176Rows_:(name)=>name==='ACADEMIA_PLAY_BANK'?fixture:name==='CONFIG_UNIDADES'?[{LEVEL_ID:'B1',UNIT_ID:'B1-U01',STATUS:'ACTIVE'}]:[],
  _elive180RoomIdFromBody_:body=>body.room_id||body.room_code||'',
  _elive180FindRoom_:id=>id==='R1'||id==='LAB-2000'?{row:room,index:0,rowNumber:2,sheet:{},}:null,
  _elive180SameRoom_:(row,r)=>row.ROOM_ID===r.ROOM_ID,
  _elive180Table_:(name)=>({rows:name==='ELIVE_PLAYERS'?players:answers,sheet:{name},index:{}}),
  ELIVE_PLAYERS_SHEET:'ELIVE_PLAYERS',ELIVE_PLAYERS_HEADERS:[],ELIVE_ANSWERS_SHEET:'ELIVE_ANSWERS',ELIVE_ANSWERS_HEADERS:[],
  _elive180RequireLab_:body=>({allowed:true,sesion:{codigo:body.player_id,nombre:body.player_id}}),
  _cs21a144LiveBody_:(body)=>({...body,cod_estudiante:body.player_id}),
  _elive180PlayerPublic_:p=>({cod_estudiante:p.COD_ESTUDIANTE,nombre:p.NOMBRE}),
  _elive176PublicRoom_:r=>({room_id:r.ROOM_ID,room_code:r.ROOM_CODE,status:r.STATUS,game_code:r.GAME_CODE}),
  _elive180AppendObject_:(name,headers,obj)=>{if(name==='ELIVE_ANSWERS')answers.push({...obj});else if(name==='ELIVE_PLAYERS')players.push({...obj});return obj;},
  _elive180SetCells_:(found,patch)=>{if(found?.row===room||found?.row?.ROOM_ID==='R1'){Object.assign(room,patch);return room;}Object.assign(found.row,patch);return found.row;},
  _elive180AppendEvent_:(r,type,actor,payload)=>events.push({type,payload}),
  _elive180Invalidate_:()=>{},_elive180TouchPlayer_:()=>{},
  _cs21a171QaEnvironment_:()=>({ok:true}),ELQ198_OPTION_BALANCE_VERSION:'CS21A198-QUIZ-TIME-B1U01-2',
};
vm.createContext(context);vm.runInContext(source,context,{filename:'english_lab_word_search_module_cs21a200.gs'});

const words=context._elws200PoolWords_();
const secret=context._elws200BuildPuzzle_(words,'LAB-2000|WORD_SEARCH|B1-U01');
const now=Date.now();
const current={version:context.ELWS200_VERSION,type:'word_search',game_id:'WORD_SEARCH',phase:'OPEN',state_revision:1,round_id:'ROUND-2000',puzzle_id:secret.puzzle_id,public_puzzle:context._elws200PublicPuzzle_(secret),round_started_at:new Date(now-1000).toISOString(),round_ends_at:new Date(now+120000).toISOString()};
room={ROOM_ID:'R1',ROOM_CODE:'LAB-2000',STATUS:'LIVE',GAME_CODE:'WORD_SEARCH',CURRENT_INDEX:1,ROUND_STATUS:'OPEN',CURRENT_QUESTION_JSON:JSON.stringify(current),SETTINGS_JSON:JSON.stringify({word_search_secret:secret}),COD_GRUPO:'B1-QA'};

const word=secret.words[0],solution=secret.solutions[word.word_id];
function body(player,actionId){return {room_code:'LAB-2000',player_id:player,action_id:actionId,round_id:'ROUND-2000',puzzle_id:secret.puzzle_id,word_id:word.word_id,start:solution.cells[0],end:solution.cells.at(-1)};}

const first=context.englishLabWordSearchClaimWordCS21A200(body('NATY','ACT-NATY-1'));
assert.equal(first.ok,true,'primer claim debe responder ok');
assert.equal(first.accepted,true,'primer claim aceptado');
assert.equal(first.claim_count,1,'primer claim produce 1 palabra');
assert.equal(first.claimed_words[0].player_id,'NATY','Naty debe ser la ganadora');
assert.equal(answers.length,1,'solo una fila append-only tras primer claim');

const second=context.englishLabWordSearchClaimWordCS21A200(body('CHU','ACT-CHU-1'));
assert.equal(second.ok,false,'segundo jugador no puede ganar la misma palabra');
assert.equal(second.error,'word_already_claimed');
assert.equal(second.winner,'NATY');
assert.equal(second.room_state.claim_count,1,'rechazo trae snapshot autoritativo');
assert.equal(second.room_state.claimed_words[0].player_id,'NATY');
assert.equal(answers.length,1,'segundo claim no escribe otra respuesta');

const replay=context.englishLabWordSearchClaimWordCS21A200(body('NATY','ACT-NATY-1'));
assert.equal(replay.ok,true,'replay del mismo action_id es ok');
assert.equal(replay.duplicate,true,'replay marcado duplicate');
assert.equal(answers.length,1,'replay idempotente no duplica fila');
assert.equal(events.filter(e=>e.type==='WORD_SEARCH_CLAIM').length,1,'solo un evento de claim');

console.log(JSON.stringify({ok:true,version:context.ELWS200_VERSION,first_claim_wins:true,winner:'NATY',loser_reconciles:true,duplicate_action_idempotent:true,answer_rows:answers.length,claim_events:events.filter(e=>e.type==='WORD_SEARCH_CLAIM').length},null,2));
