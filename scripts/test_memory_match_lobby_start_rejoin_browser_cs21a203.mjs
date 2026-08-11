#!/usr/bin/env node
import assert from 'node:assert/strict';
import {baseUrl,endpointAndBody,fulfillJson,launchBrowser,wait,writeEvidence} from './memory_match_cs21a192_browser_fixture.mjs';

const browser=await launchBrowser();
const contexts=[];
const errors=[];
const ROOM_CODE='LAB-203';
const ROOM_ID='ROOM-203';
const GROUP='B1-LM69-C3-9926';
let studentReads=0;
let genericStudentReads=0;
let teacherReads=0;
let teacherStarted=false;
let startAtMs=0;

const players=[
  {player_id:'QA-STU-005',cod_estudiante:'QA-STU-005',name:'Chu',nombre:'Chu',team_id:'NO_TEAM'},
  {player_id:'QA-STU-007',cod_estudiante:'QA-STU-007',name:'Naty',nombre:'Naty',team_id:'NO_TEAM'},
];
const cards=[
  {card_id:'P1-L',pair_id:'PAIR-1',face_type:'TEXT',label:'teacher'},
  {card_id:'P2-L',pair_id:'PAIR-2',face_type:'TEXT',label:'student'},
  {card_id:'P1-R',pair_id:'PAIR-1',face_type:'TEXT',label:'profesor/a'},
  {card_id:'P2-R',pair_id:'PAIR-2',face_type:'TEXT',label:'estudiante'},
];

function room(status='CREATED'){
  return {room_id:ROOM_ID,room_code:ROOM_CODE,game_code:'MEMORY_MATCH',game_id:'MEMORY_MATCH',game_label:'Memory Match',status,round_status:status==='LIVE'?'OPEN':'',mode:'INDIVIDUAL',unit:'U01',nivel:'B1',cod_grupo:GROUP,question_count:1,current_index:status==='LIVE'?1:0,created_at:new Date().toISOString()};
}
function livePackage(viewer='QA-STU-005'){
  if(!startAtMs) startAtMs=Date.now()+5000;
  const now=Date.now();
  const endAt=startAtMs+30000;
  const phase=now>=startAtMs?'OPEN':'COUNTDOWN';
  const turn={version:'CS21A176',participation_policy:'ROUND_ROBIN',player_order:['QA-STU-005','QA-STU-007'],player_cursor:0,team_order:[],team_cursor:0,team_player_orders:{},team_player_cursors:{},active_player_id:'QA-STU-005',active_team_id:'',turn_number:1,turn_started_at:new Date(startAtMs).toISOString(),turn_ends_at:new Date(endAt).toISOString(),last_player_id:'',last_team_id:'',reason:'ROUND_STARTED'};
  const shared={version:'CS21A192',state_revision:1,board_version:1,claimed_pairs:{},matched_pair_ids:[],active_attempt:null,completed:false};
  const player=players.find(p=>p.player_id===viewer)||null;
  const pkg={version:'CS21A192',sync_version:'CS21A192-MM-CONSISTENCY-2',state_revision:1,server_now:new Date(now).toISOString(),server_now_ms:now,room:{room_code:ROOM_CODE,game_id:'MEMORY_MATCH',mode:'INDIVIDUAL',level_id:'B1'},round:{round_id:`${ROOM_CODE}-R1`,index:1,title:'Memory Match · U01',cards},rules:{round_duration_ms:30000,auto_start_delay_ms:5000,reveal_duration_ms:8500,team_size:1},state:{phase,started_at:new Date(startAtMs).toISOString(),ends_at:new Date(endAt).toISOString(),active_player_id:'QA-STU-005',active_team_id:''},players,teams:[],player,turn_state:turn,shared_state:shared};
  return {ok:true,memory_match:true,sync_version:'CS21A192-MM-CONSISTENCY-2',state_revision:1,server_now:new Date(now).toISOString(),server_now_ms:now,turn_remaining_ms:Math.max(0,endAt-now),room:room('LIVE'),player,room_package:pkg,turn_state:turn,shared_state:shared,stats:{players:2,answers_current:0},leaderboard:[{rank:1,cod_estudiante:'QA-STU-005',nombre:'Chu',points:0},{rank:2,cod_estudiante:'QA-STU-007',nombre:'Naty',points:0}],team_leaderboard:[],events:[],questions:[]};
}
function lobbyState(count,viewer='QA-STU-005'){
  return {ok:true,memory_match:true,room:room('CREATED'),player:players.find(p=>p.player_id===viewer)||players[0],stats:{players:count,answers_current:0},leaderboard:players.slice(0,count).map((p,i)=>({rank:i+1,cod_estudiante:p.player_id,nombre:p.name,points:0})),team_leaderboard:[],events:[],questions:[]};
}

async function routeHandler(route){
  const {endpoint,body}=endpointAndBody(route);
  if(endpoint==='englishLabLiveJoinRoom'){
    // A propósito sólo player_id: valida que CS203 no dependa de cod_estudiante.
    await fulfillJson(route,{...lobbyState(1),player:{player_id:'QA-STU-005',name:'Chu'}});
    return;
  }
  if(endpoint==='englishLabLiveGetPlayerState'){
    // Antes del primer snapshot el frontend aún no sabe que la sala es Memory Match.
    // Esta lectura genérica descubre game_code y loadState encadena de inmediato
    // el endpoint especializado. Es parte de la ruta real, especialmente tras F5.
    genericStudentReads+=1;
    const viewer=String(body.player_id||body.cod_estudiante||'QA-STU-005');
    await fulfillJson(route,lobbyState(1,viewer));
    return;
  }
  if(endpoint==='englishLabMemoryMatchGetPlayerState'){
    studentReads+=1;
    const viewer=String(body.player_id||body.cod_estudiante||'QA-STU-005');
    if(studentReads<3){await fulfillJson(route,lobbyState(studentReads>=2?2:1,viewer));return;}
    await fulfillJson(route,livePackage(viewer));
    return;
  }
  if(endpoint==='englishLabLiveGetTeacherData'){
    await fulfillJson(route,{ok:true,grupos:[{code:GROUP,cod_grupo:GROUP,nivel:'B1',dias_label:'Lunes y miércoles'}],rooms:[room('CREATED')],recent_rooms:[room('CREATED')],question_bank:{total:320,coverage:{ready:320,expected:320},missing_exact_combos:0,quality_warnings:0}});
    return;
  }
  if(endpoint==='englishLabMemoryMatchGetRoomControl'){
    teacherReads+=1;
    if(teacherStarted){await fulfillJson(route,livePackage('teacher'));return;}
    await fulfillJson(route,{...lobbyState(teacherReads>=2?2:1,null),player:null,room:room('CREATED')});
    return;
  }
  if(endpoint==='englishLabMemoryMatchStartRoom'){
    teacherStarted=true;
    startAtMs=Date.now()+5000;
    await fulfillJson(route,livePackage('teacher'));
    return;
  }
  throw new Error(`Endpoint inesperado CS203: ${endpoint}`);
}

function participantNumber(page){
  return page.getByText('Participantes',{exact:true}).first().locator('..').locator('div').nth(1);
}

try{
  // -------- Student: join -> persist -> F5 -> presence 1->2 -> auto start --------
  const studentContext=await browser.newContext({viewport:{width:520,height:880}});
  contexts.push(studentContext);
  await studentContext.route('**/__cs21a203_live?*',routeHandler);
  const student=await studentContext.newPage();
  student.on('pageerror',e=>errors.push(`student:${e.message}`));
  await student.goto(`${baseUrl}/src/english_lab_games/memory_match_live_lobby_preview_cs21a203.html?mode=student&room=${ROOM_CODE}`,{waitUntil:'domcontentloaded'});
  await student.getByRole('button',{name:'Entrar a sala'}).waitFor({state:'visible',timeout:15000});
  await student.getByRole('button',{name:'Entrar a sala'}).click();
  await student.getByRole('button',{name:'← Cambiar sala'}).waitFor({state:'visible',timeout:5000});
  const stored=await student.evaluate(code=>({player:localStorage.getItem('elive_player_'+code),room:localStorage.getItem('elive_last_room')}),ROOM_CODE);
  assert.equal(stored.player,'QA-STU-005','Join no persistió player_id alternativo.');
  assert.equal(stored.room,ROOM_CODE,'Join no persistió la sala activa.');

  // F5 real: no debe volver al formulario de ingreso.
  await student.reload({waitUntil:'domcontentloaded'});
  await student.getByRole('button',{name:'← Cambiar sala'}).waitFor({state:'visible',timeout:6000});
  assert.equal(await student.getByRole('button',{name:'Entrar a sala'}).count(),0,'F5 devolvió al selector de sala.');

  await participantNumber(student).waitFor({state:'visible',timeout:5000});
  await student.waitForFunction(()=>{
    const label=[...document.querySelectorAll('div')].find(el=>el.textContent==='Participantes');
    return label&&label.parentElement&&label.parentElement.children[1]&&label.parentElement.children[1].textContent==='2';
  },null,{timeout:5000});
  await student.locator('[data-authoritative-sync="true"]').waitFor({state:'visible',timeout:7000});
  await student.locator('[data-start-countdown="true"]').waitFor({state:'visible',timeout:3000});
  const studentCountdown=Number(await student.locator('[data-start-countdown="true"] strong').textContent());
  assert.ok(studentCountdown>=1&&studentCountdown<=5,`Countdown estudiante inválido: ${studentCountdown}`);

  // -------- Teacher: participant count updates without clicking Actualizar --------
  teacherReads=0;teacherStarted=false;startAtMs=0;
  const teacherContext=await browser.newContext({viewport:{width:1200,height:900}});
  contexts.push(teacherContext);
  await teacherContext.route('**/__cs21a203_live?*',routeHandler);
  const teacher=await teacherContext.newPage();
  teacher.on('pageerror',e=>errors.push(`teacher:${e.message}`));
  await teacher.goto(`${baseUrl}/src/english_lab_games/memory_match_live_lobby_preview_cs21a203.html?mode=teacher`,{waitUntil:'domcontentloaded'});
  await teacher.getByRole('button',{name:'Abrir control de ronda'}).waitFor({state:'visible',timeout:15000});
  await teacher.getByRole('button',{name:'Abrir control de ronda'}).click();
  await teacher.getByRole('button',{name:'Iniciar Memory Match'}).waitFor({state:'visible',timeout:5000});
  await teacher.waitForFunction(()=>{
    const labels=[...document.querySelectorAll('div')].filter(el=>el.textContent==='Participantes');
    return labels.some(label=>label.parentElement&&label.parentElement.children[1]&&label.parentElement.children[1].textContent==='2');
  },null,{timeout:4500});
  assert.ok(teacherReads>=2,'El control docente no hizo polling pre-start.');

  const startClickAt=Date.now();
  await teacher.getByRole('button',{name:'Iniciar Memory Match'}).click();
  await teacher.locator('[data-authoritative-sync="true"]').waitFor({state:'visible',timeout:2500});
  await teacher.locator('[data-start-countdown="true"]').waitFor({state:'visible',timeout:2500});
  const startVisibleDelayMs=Date.now()-startClickAt;
  assert.ok(startVisibleDelayMs<1800,`El Start tardó ${startVisibleDelayMs} ms en reflejar el countdown.`);
  const teacherCountdown=Number(await teacher.locator('[data-start-countdown="true"] strong').textContent());
  assert.ok(teacherCountdown>=1&&teacherCountdown<=5,`Countdown docente inválido: ${teacherCountdown}`);

  assert.ok(genericStudentReads>=1,'El fixture no ejercitó la detección genérica inicial de Memory Match.');
  assert.deepEqual(errors,[],`Errores navegador: ${errors.join(' | ')}`);
  const result={
    verdict:'PASS_MEMORY_MATCH_LOBBY_START_REJOIN_CS21A203',
    studentF5Rejoined:true,
    genericDiscoveryAfterReload:true,
    studentPresenceReached2WithoutManualRefresh:true,
    studentDetectedStartAutomatically:true,
    teacherPresenceReached2WithoutManualRefresh:true,
    authoritativeCountdown:true,
    studentCountdown,
    teacherCountdown,
    teacherStartVisibleDelayMs:startVisibleDelayMs,
    genericStudentStateReads:genericStudentReads,
    studentStateReads:studentReads,
    teacherControlReads:teacherReads,
  };
  writeEvidence('lobby-start-rejoin-cs21a203.json',result);
  console.log(JSON.stringify(result,null,2));
}finally{
  for(const context of contexts){try{await context.close();}catch(_){}}
  await browser.close();
}
