#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const loader=fs.readFileSync('src/english_lab_live_canonical_loader_cs21a193.js','utf8');
const memoryClassic=fs.readFileSync('src/english_lab_games/memory_match_classic_sync_cs21a189.jsx','utf8');
const live=fs.readFileSync('src/english_lab_games/english_lab_word_search_live_cs21a200.jsx','utf8');
const gateway=fs.readFileSync('src/english_lab_games/english_lab_word_search_gateway_cs21a200.jsx','utf8');
const module=fs.readFileSync('apps_script_unified/english_lab_word_search_module_cs21a200.gs','utf8');

const order=[
  'word_search_curriculum_contract_cs21a199.js?v=CS21A200',
  'word_search_engine_cs21a199.js?v=CS21A200',
  'word_search_game_cs21a199.jsx?v=CS21A200',
  'english_lab_word_search_style_cs21a200.js?v=CS21A200',
  'english_lab_word_search_live_cs21a200.jsx?v=CS21A200',
  'english_lab_live.jsx?v=CS21A200',
  'english_lab_quiz_time_gateway_cs21a198.jsx?v=CS21A198',
  'english_lab_word_search_gateway_cs21a200.jsx?v=CS21A200',
];
let last=-1;for(const marker of order){const pos=loader.indexOf(marker);assert.ok(pos>last,`orden canónico inválido: ${marker}`);last=pos;}
for(const marker of ['EnglishLabWordSearchCurriculumCS21A199','EnglishLabWordSearchEngineCS21A199','EnglishLabWordSearchGameCS21A199','EnglishLabWordSearchLiveCS21A200','EnglishLabWordSearchGatewayCS21A200'])assert.ok(loader.includes(marker),`compatibility debe exigir ${marker}`);
assert.ok(loader.includes("wordSearchEpoch:'CS21A200'"));

// Este gate es de Word Search: no debe congelar Memory Match a un epoch histórico.
// Comprueba que el loader canónico siga exactamente el epoch que declara el motor vigente.
const currentMemoryEpoch=memoryClassic.match(/const LATENCY_SAFE_VERSION = '([^']+)'/)?.[1]||'';
assert.ok(currentMemoryEpoch,'Memory Match debe declarar LATENCY_SAFE_VERSION');
assert.ok(loader.includes(`LATENCY_SAFE_EPOCH = '${currentMemoryEpoch}'`),`El loader debe seguir el epoch Memory Match vigente (${currentMemoryEpoch}), no uno histórico.`);
assert.ok(loader.includes('reassertAuthoritativeOwner'),'Memory Match conserva dueño autoritativo');

for(const endpoint of ['englishLabWordSearchTeacherData','englishLabWordSearchCreateRoom','englishLabWordSearchStartRoom','englishLabWordSearchGetRoomControl','englishLabWordSearchJoinRoom','englishLabWordSearchGetPlayerState','englishLabWordSearchClaimWord','englishLabWordSearchCloseRoom']){
  assert.ok(live.includes(endpoint),`cliente Live debe declarar ${endpoint}`);
  assert.ok(module.toLowerCase().includes(endpoint.toLowerCase()),`backend debe rutear ${endpoint}`);
}
assert.ok(live.includes('error.data=data'),'errores de dominio conservan snapshot');
assert.ok(live.includes('if(data?.room_state)setResponse(data.room_state)'),'cliente reconcilia room_state');
assert.ok(live.includes('if(data?.retryable)'), 'errores transitorios conservan acción para retry R2');
assert.ok(gateway.includes("mode==='wordsearch'"));
assert.ok(gateway.includes("mode==='quiz'"));
assert.ok(gateway.includes('LegacyTeacher'));
assert.ok(gateway.includes('readOnly'),'código de estudiante se presenta de solo lectura');
assert.equal(live.includes('solutions'),false,'cliente Live no debe conocer solutions');
assert.equal(gateway.includes('solutions'),false,'gateway no debe conocer solutions');

console.log(JSON.stringify({ok:true,version:'CS21A200',contract_revision:'CS21A211_MEMORY_EPOCH_TOLERANT',canonical_order:true,memory_match_epoch:currentMemoryEpoch,memory_match_owner_preserved:true,quiz_gateway_preserved:true,word_search_endpoints:8,domain_reconciliation:true,retryable_actions_preserved:true,client_solution_leak:false},null,2));
