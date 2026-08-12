#!/usr/bin/env node
// CS21A206: conserva el contrato propio de Quiz CS198 sin congelar el epoch global de english_lab_live.
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path){assert.equal(fs.existsSync(path),true,`Falta ${path}`);return fs.readFileSync(path,'utf8');}
const loader=read('src/english_lab_live_canonical_loader_cs21a193.js');
const live=read('src/english_lab_games/english_lab_quiz_time_live_cs21a198.jsx');
const gateway=read('src/english_lab_games/english_lab_quiz_time_gateway_cs21a198.jsx');
const style=read('styles/english_lab_quiz_time_cs21a198.css');
const gatewayStyle=read('styles/english_lab_quiz_time_gateway_cs21a198.css');
const backend=read('apps_script_patches/99T_QUIZ_TIME_CURRICULAR_QA_CS21A198.gs');

// Las piezas propias de Quiz deben continuar ancladas a CS198.
for(const marker of [
  'english_lab_quiz_curriculum_contract_cs21a198.js?v=CS21A198',
  'english_lab_quiz_engine_cs21a198.js?v=CS21A198',
  'english_lab_quiz_time_live_cs21a198.jsx?v=CS21A198',
  'english_lab_quiz_time_gateway_cs21a198.jsx?v=CS21A198',
  "quizTimeEpoch:'CS21A198'"
]) assert.ok(loader.includes(marker),`Loader sin ${marker}`);

// english_lab_live.jsx es una superficie compartida y puede avanzar de epoch al
// integrar otros juegos. Lo que Quiz necesita es que exista exactamente una ruta
// Live canónica y que su gateway se cargue después de ella.
const liveRouteMatches=loader.match(/src\/english_lab_live\.jsx\?v=CS21A\d+/g)||[];
assert.equal(liveRouteMatches.length,1,`Se esperaba una sola ruta english_lab_live; encontradas ${liveRouteMatches.length}.`);
const liveRoute=liveRouteMatches[0];
const posLive=loader.indexOf(liveRoute);
const posGateway=loader.indexOf('english_lab_quiz_time_gateway_cs21a198.jsx?v=CS21A198');
assert.ok(posLive>0 && posGateway>posLive,'Gateway debe cargar despues de english_lab_live.jsx.');

for(const marker of ['StudentSession','TeacherRoom','useSerialPoll','Engine.buildAnswerAction','correctOption']) assert.ok(live.includes(marker),`Cliente Live sin ${marker}`);
for(const marker of ['LegacyTeacher','LegacyStudent','TeacherGateway','StudentGateway','Quiz Time · B1-U01','Otros juegos Live']) assert.ok(gateway.includes(marker),`Gateway sin ${marker}`);
for(const marker of ['.qt198-option','.qt198-layout','@media(max-width:620px)']) assert.ok(style.includes(marker),`CSS principal sin ${marker}`);
for(const marker of ['.qt198-gateway','.qt198-builder-grid','.qt198-student-entry','@media(max-width:820px)']) assert.ok(gatewayStyle.includes(marker),`CSS gateway sin ${marker}`);
for(const endpoint of ['englishLabQuizTimeTeacherData','englishLabQuizTimeCreateRoom','englishLabQuizTimeStartRoom','englishLabQuizTimeGetRoomControl','englishLabQuizTimeJoinRoom','englishLabQuizTimeGetPlayerState','englishLabQuizTimeAnswer','englishLabQuizTimeCloseRoom']) assert.ok(backend.toLowerCase().includes(endpoint.toLowerCase()),`Backend sin ${endpoint}`);
assert.ok(!gateway.includes('correct_option'),'Gateway no debe conocer correct_option.');
assert.ok(!live.includes("correct_option:'A'") && !live.includes("correct_option:'B'") && !live.includes("correct_option:'C'") && !live.includes("correct_option:'D'"),'Cliente no debe embebir respuesta correcta.');
console.log(JSON.stringify({
  ok:true,
  version:'CS21A198',
  contract_revision:'CS21A206-SHARED-LIVE-EPOCH',
  canonical_loader:true,
  quiz_epoch_preserved:true,
  shared_live_route:liveRoute,
  single_shared_live_route:true,
  gateway_after_live:true,
  serial_poll:true,
  student_teacher_gateways:true,
  responsive_css:true,
  backend_endpoints:8,
  embedded_answer_key:false
},null,2));
