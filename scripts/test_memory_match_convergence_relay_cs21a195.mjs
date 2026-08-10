#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const files=[
  'apps_script_patches/english_lab_access_cs21a144.gs',
  'apps_script_patches/english_lab_access_cached_read_cs21a170.gs',
  'apps_script_patches/english_lab_access_financial_priority_cs21a171.gs',
  'apps_script_patches/96_English_LAB_CS21A171_AUTOINSTALABLE.gs',
  'apps_script_patches/english_lab_memory_match_live_cs21a174.gs',
  'apps_script_patches/english_lab_memory_match_hotfix_cs21a175.gs',
  'apps_script_patches/97_ACTUALIZACION_QA.gs',
  'apps_script_patches/98_ACTUALIZACION_QA_CS21A181.gs',
  'apps_script_patches/99_CS21A195_MEMORY_MATCH_CONVERGENCE_COMPLETO.gs',
];
for(const file of files) assert.ok(fs.existsSync(file),`Falta ${file}`);
const source=files.map(file=>fs.readFileSync(file,'utf8')).join('\n');
const questionRows=Array.from({length:6},(_,i)=>({GAME_ID:'MEMORY_MATCH',STATUS:'ACTIVE',LEVEL_ID:'B1',UNIT_ID:'U01',CONTENT_ID:`P${i}`,PAIR_LEFT:`w${i}`,PAIR_RIGHT:`m${i}`}));
const map=new Map();
const cache={get:key=>key==='ELIVE176|QA-DB|QUESTION_BANK'?JSON.stringify(questionRows):(map.get(String(key))||null),put:(k,v)=>map.set(String(k),String(v)),remove:k=>map.delete(String(k))};
const noop=()=>({ok:true});
const publicRoom=room=>({
  room_id:String(room?.ROOM_ID||room?.room_id||''),
  room_code:String(room?.ROOM_CODE||room?.room_code||''),
  game_code:String(room?.GAME_CODE||room?.game_code||''),
  status:String(room?.STATUS||room?.status||''),
  round_status:String(room?.ROUND_STATUS||room?.round_status||''),
  mode:String(room?.MODE||room?.mode||''),
  nivel:String(room?.NIVEL||room?.nivel||''),
});
const context={console:{log(){}},Date,JSON,Object,Math,String,Number,Array,Error,RegExp,Boolean,isFinite,parseInt,parseFloat,
  verificarActualizacionQA:noop,doPost:noop,_aplayAuth_:noop,getEstudiante:noop,
  _eliveRoomPublic_:publicRoom,
  englishLabLiveCloseRoom:noop,englishLabLiveGetLeaderboard:noop,englishLabLiveGetPlayerState:noop,englishLabLiveGetTeacherData:noop,englishLabLiveJoinRoom:noop,englishLabLiveSubmitAnswer:noop,
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>({QA_STAGING_MASTER_ID:'QA-MASTER',QA_STAGING_OPERATIVO_ID:'QA-OPER',ENGLISH_LAB_GAME_DB_ID:'QA-DB'}[key]||'')})},
  SpreadsheetApp:{openById:id=>({getName:()=>id==='QA-MASTER'?'QA_APOLLO_G3_STAGING_2026-07-19':'QA_CAMPUS_OPERATIVO_STAGING_2026-07-19'})},
  CacheService:{getScriptCache:()=>cache},
};
vm.createContext(context);
new vm.Script(source,{filename:'CS21A195-relay-test.gs'}).runInContext(context);

const room={ROOM_ID:'RID-195',ROOM_CODE:'LAB-195',GAME_CODE:'MEMORY_MATCH',STATUS:'LIVE',ROUND_STATUS:'OPEN',DOCENTE:'Docente QA'};
const oldPkg={state_revision:20,room:{room_code:'LAB-195',game_id:'MEMORY_MATCH'},state:{phase:'OPEN',ends_at:'2099-01-01T00:00:00.000Z'},turn_state:{turn_number:7,turn_started_at:'2098-12-31T23:59:00.000Z',turn_ends_at:'2099-01-01T00:00:00.000Z'},shared_state:{state_revision:20,board_version:30,active_attempt:null},players:[{player_id:'P1',name:'Naty'},{player_id:'P2',name:'Chu'}]};
const newPkg=JSON.parse(JSON.stringify(oldPkg));
newPkg.state_revision=21;newPkg.shared_state.state_revision=21;newPkg.shared_state.board_version=31;newPkg.shared_state.active_attempt={phase:'FIRST_REVEALED',player_id:'P1',turn_number:7,first_card_id:'CARD-X',revealed_at:new Date().toISOString(),reveal_until:''};
const relay={version:context.CS21A195_MM_CONVERGENCE_VERSION,revision:21,published_ms:Date.now(),acl:context._cs21a195AclRoom_(room),response:context._cs21a195RelayResponseFromPackage_(room,newPkg)};
assert.equal(context._cs21a195WriteRelay_(room,relay),true);

// Simula una lectura que empezó antes de la mutación y termina después con R20.
context._cs21a195CanonicalBase_=()=>({ok:true,row:room,snapshot:{ok:true,memory_match:true,state_revision:20,room:{room_code:'LAB-195',game_code:'MEMORY_MATCH',status:'LIVE'},room_package:JSON.parse(JSON.stringify(oldPkg)),turn_state:JSON.parse(JSON.stringify(oldPkg.turn_state)),shared_state:JSON.parse(JSON.stringify(oldPkg.shared_state))},cache_key:'STALE-R20'});
const repaired=context._cs21a192CanonicalSnapshot_({room_code:'LAB-195'});
assert.equal(repaired.ok,true);
assert.equal(repaired.snapshot.state_revision,21,'La respuesta debe adoptar la revisión relay R21.');
assert.equal(repaired.snapshot.room_package.state_revision,21);
assert.equal(repaired.snapshot.shared_state.board_version,31);
assert.equal(repaired.snapshot.shared_state.active_attempt.first_card_id,'CARD-X');
assert.equal(repaired.snapshot.fast_relay,true);
assert.match(repaired.cache_key,/EL195\|FAST\|R21/);

// Un relay viejo nunca puede reemplazar R21.
const staleRelay={...relay,revision:19,published_ms:Date.now()+1000,response:context._cs21a195RelayResponseFromPackage_(room,{...oldPkg,state_revision:19,shared_state:{...oldPkg.shared_state,state_revision:19}})};
context._cs21a195WriteRelay_(room,staleRelay);
assert.equal(context._cs21a195ReadRelay_(room).revision,21);

console.log(JSON.stringify({ok:true,contract:'CS21A195_STALE_INFLIGHT_READ_SHIELD',stale_revision:20,relay_revision:21,repaired_revision:repaired.snapshot.state_revision,fast_relay:true,relay_never_downgrades:true},null,2));
