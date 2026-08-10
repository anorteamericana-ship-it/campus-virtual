#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const sourceFiles=[
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
for(const file of sourceFiles) assert.equal(fs.existsSync(file),true,`Falta fuente acumulativa: ${file}`);

const source=sourceFiles.map(file=>fs.readFileSync(file,'utf8')).join('\n');
const logLines=[];
const noop=()=>({ok:true});
const properties={QA_STAGING_MASTER_ID:'QA-MASTER',QA_STAGING_OPERATIVO_ID:'QA-OPER',ENGLISH_LAB_GAME_DB_ID:'QA-DB'};
const questionRows=Array.from({length:6},(_,index)=>({GAME_ID:'MEMORY_MATCH',STATUS:'ACTIVE',LEVEL_ID:'B1',UNIT_ID:'U01',CONTENT_ID:`PAIR-${index+1}`,PAIR_LEFT:`word-${index+1}`,PAIR_RIGHT:`meaning-${index+1}`}));
const cacheMap=new Map();
const cache={
  get(key){
    if(key==='ELIVE176|QA-DB|QUESTION_BANK') return JSON.stringify(questionRows);
    return cacheMap.get(String(key))||null;
  },
  put(key,value){cacheMap.set(String(key),String(value));},
  remove(key){cacheMap.delete(String(key));},
};
const context={
  console:{log:value=>logLines.push(String(value))},
  Date,JSON,Object,Math,String,Number,Array,Error,RegExp,Boolean,isFinite,parseInt,parseFloat,
  verificarActualizacionQA:noop,doPost:noop,_aplayAuth_:noop,getEstudiante:noop,
  englishLabLiveCloseRoom:noop,englishLabLiveGetLeaderboard:noop,englishLabLiveGetPlayerState:noop,
  englishLabLiveGetTeacherData:noop,englishLabLiveJoinRoom:noop,englishLabLiveSubmitAnswer:noop,
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties[key]||''})},
  SpreadsheetApp:{openById:id=>({getName:()=>id==='QA-MASTER'?'QA_APOLLO_G3_STAGING_2026-07-19':'QA_CAMPUS_OPERATIVO_STAGING_2026-07-19'})},
  CacheService:{getScriptCache:()=>cache},
};
vm.createContext(context);
new vm.Script(source,{filename:'CS21A144-CS21A195-QA-CUMULATIVE.gs'}).runInContext(context);

const result=context.verificarMemoryMatchStartFixCS21A183();
const versions=logLines.map(line=>{try{return JSON.parse(line);}catch{return null;}}).filter(value=>value&&value.version&&/^CS21A/.test(value.version));
const expected=[
  'CS21A183-MM-START-FIX3','CS21A183-MM-PAIR-METADATA-FIX4','CS21A185-MM-CLOSED-ROOM-FIX1',
  'CS21A186-MM-RULES-FIX1','CS21A187-LIVE-LIFECYCLE-FIX1','CS21A188-MM-SHARED-DISCOVERY-1',
  'CS21A189-MM-CLASSIC-SYNC-1','CS21A190-MM-TIMEOUT-CLEANUP-1','CS21A192-MM-CONSISTENCY-2',
  'CS21A194-MM-LATENCY-SAFE-1','CS21A195-MM-CONVERGENCE-RELAY-1',
];
assert.deepEqual(versions.map(item=>item.version),expected);
for(const item of versions) assert.equal(item.ok,true,`${item.version} devolvió ok=false.`);
assert.equal(result.version,'CS21A195-MM-CONVERGENCE-RELAY-1');
assert.equal(result.previous_version,'CS21A194-MM-LATENCY-SAFE-1');
assert.equal(result.fast_relay,true);
assert.equal(result.stale_inflight_read_shield,true);
assert.equal(result.relay_never_downgrades_revision,true);
assert.equal(context._elive180SetCells_.__cs21a195ConvergenceRelay,true);
assert.equal(context._cs21a192CanonicalSnapshot_.__cs21a195StaleReadShield,true);
assert.equal(context.englishLabMemoryMatchGetPlayerStateCS21A180.__cs21a195FastRelay,true);
assert.equal(context.englishLabMemoryMatchGetRoomControlCS21A180.__cs21a195FastRelay,true);
assert.equal(context.englishLabMemoryMatchSubmitPairCS21A180.__cs21a195RelayPublished,true);

console.log(JSON.stringify({
  ok:true,
  contract:'CS21A195_APPS_SCRIPT_CUMULATIVE_RUNTIME_VERIFIER',
  sources:sourceFiles.length,
  versions:expected,
  final_version:result.version,
  relay_ttl_seconds:result.relay_ttl_seconds,
  full_refresh_ms:result.full_refresh_ms,
  stale_inflight_read_shield:true,
  fast_relay:true,
},null,2));
