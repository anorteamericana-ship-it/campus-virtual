#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path){
  assert.equal(fs.existsSync(path),true,`Falta ${path}`);
  return fs.readFileSync(path,'utf8');
}

const loader=read('src/english_lab_live_canonical_loader_cs21a193.js');
const live=read('src/english_lab_games/english_lab_quiz_time_live_cs21a198.jsx');
const gateway=read('src/english_lab_games/english_lab_quiz_time_gateway_cs21a198.jsx');
const style=read('styles/english_lab_quiz_time_cs21a198.css');
const gatewayStyle=read('styles/english_lab_quiz_time_gateway_cs21a198.css');
const backend=read('apps_script_patches/99T_QUIZ_TIME_CURRICULAR_QA_CS21A198.gs');

// CS21A204 no obliga a que el shell Live conserve el cache epoch histórico CS198.
// Exige que los módulos Quiz sigan versionados en CS198 y que el Live canónico
// actual (CS200+) cargue antes de sus gateways.
for(const marker of [
  'english_lab_quiz_curriculum_contract_cs21a198.js?v=CS21A198',
  'english_lab_quiz_engine_cs21a198.js?v=CS21A198',
  'english_lab_quiz_time_live_cs21a198.jsx?v=CS21A198',
  'english_lab_quiz_time_gateway_cs21a198.jsx?v=CS21A198',
  "global.EnglishLabQuizCurriculumContractCS21A198",
  "global.EnglishLabQuizEngineCS21A198",
  "global.EnglishLabQuizTimeCS21A198",
  "global.EnglishLabQuizTimeGatewayCS21A198"
]) assert.ok(loader.includes(marker),`Loader moderno sin ${marker}`);

const liveMatch=loader.match(/src\/english_lab_live\.jsx\?v=(CS21A\d+)/);
assert.ok(liveMatch,'Loader sin english_lab_live.jsx versionado.');
const liveEpoch=liveMatch[1];
assert.ok(Number(liveEpoch.replace('CS21A',''))>=198,`Epoch Live ${liveEpoch} anterior a Quiz Time.`);
const posLive=loader.indexOf(liveMatch[0]);
const posQuizGateway=loader.indexOf('english_lab_quiz_time_gateway_cs21a198.jsx?v=CS21A198');
const posWordGateway=loader.indexOf('english_lab_word_search_gateway_cs21a200.jsx?v=CS21A200');
assert.ok(posLive>0 && posQuizGateway>posLive,'Gateway Quiz debe cargar después del Live canónico.');
assert.ok(posWordGateway>posQuizGateway,'Gateway Word Search debe conservar la composición posterior a Quiz.');

for(const marker of ['StudentSession','TeacherRoom','useSerialPoll','Engine.buildAnswerAction','correctOption']){
  assert.ok(live.includes(marker),`Cliente Live sin ${marker}`);
}
for(const marker of ['LegacyTeacher','LegacyStudent','TeacherGateway','StudentGateway','Quiz Time · B1-U01','Otros juegos Live']){
  assert.ok(gateway.includes(marker),`Gateway sin ${marker}`);
}
for(const marker of ['.qt198-option','.qt198-layout','@media(max-width:620px)']){
  assert.ok(style.includes(marker),`CSS principal sin ${marker}`);
}
for(const marker of ['.qt198-gateway','.qt198-builder-grid','.qt198-student-entry','@media(max-width:820px)']){
  assert.ok(gatewayStyle.includes(marker),`CSS gateway sin ${marker}`);
}
for(const endpoint of [
  'englishLabQuizTimeTeacherData','englishLabQuizTimeCreateRoom','englishLabQuizTimeStartRoom',
  'englishLabQuizTimeGetRoomControl','englishLabQuizTimeJoinRoom','englishLabQuizTimeGetPlayerState',
  'englishLabQuizTimeAnswer','englishLabQuizTimeCloseRoom'
]) assert.ok(backend.toLowerCase().includes(endpoint.toLowerCase()),`Backend sin ${endpoint}`);

assert.ok(!gateway.includes('correct_option'),'Gateway no debe conocer correct_option.');
assert.ok(
  !live.includes("correct_option:'A'") &&
  !live.includes("correct_option:'B'") &&
  !live.includes("correct_option:'C'") &&
  !live.includes("correct_option:'D'"),
  'Cliente no debe embebir respuesta correcta.'
);

console.log(JSON.stringify({
  ok:true,
  version:'CS21A204-QUIZ-LIVE-COMPAT-1',
  quiz_module_epoch:'CS21A198',
  canonical_live_epoch:liveEpoch,
  gateway_after_live:true,
  word_search_after_quiz:true,
  serial_poll:true,
  student_teacher_gateways:true,
  responsive_css:true,
  backend_endpoints:8,
  embedded_answer_key:false,
  historical_cs198_loader_literal_not_required:true
},null,2));
