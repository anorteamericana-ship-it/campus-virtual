#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const base=process.env.QA_BASE_URL||'http://127.0.0.1:4197';
const output=path.resolve('qa-output/cs21a197-spectator-reveal');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const cards=[
  {card_id:'P1-L',pair_id:'PAIR-1',face_type:'TEXT',label:'teacher'},
  {card_id:'P2-L',pair_id:'PAIR-2',face_type:'TEXT',label:'student'},
  {card_id:'P1-R',pair_id:'PAIR-1',face_type:'TEXT',label:'profesor/a'},
  {card_id:'P2-R',pair_id:'PAIR-2',face_type:'TEXT',label:'estudiante'},
];
const players=[
  {player_id:'P1',cod_estudiante:'P1',name:'Chu',team_id:'NO_TEAM'},
  {player_id:'P2',cod_estudiante:'P2',name:'Naty',team_id:'NO_TEAM'},
];
const startedAt=Date.now();
const canonical={stateRevision:1,boardVersion:1,activeAttempt:null,turnNumber:1,activePlayer:'P1',turnStartedAt:startedAt,turnEndsAt:startedAt+30000};
let mismatchRevealUntil=0;
const readCalls={P2:0,teacher:0};
const browserErrors=[];

function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function clone(value){return JSON.parse(JSON.stringify(value));}
function turn(snapshot=canonical){
  const active=snapshot.activePlayer||'P1';
  return {version:'CS21A176',participation_policy:'ROUND_ROBIN',player_order:['P1','P2'],player_cursor:active==='P2'?1:0,team_order:[],team_cursor:0,team_player_orders:{},team_player_cursors:{},active_player_id:active,active_team_id:'',turn_number:snapshot.turnNumber||1,turn_started_at:new Date(snapshot.turnStartedAt).toISOString(),turn_ends_at:new Date(snapshot.turnEndsAt).toISOString(),last_player_id:active==='P2'?'P1':'',last_team_id:'',reason:snapshot.turnNumber>1?'PAIR_MISMATCH_AFTER_FLIPBACK':'ROUND_STARTED'};
}
function responseFor(snapshot,viewer){
  const now=Date.now();
  const currentTurn=turn(snapshot);
  const shared={version:'CS21A197',state_revision:snapshot.stateRevision,board_version:snapshot.boardVersion,claimed_pairs:{},matched_pair_ids:[],active_attempt:clone(snapshot.activeAttempt),completed:false};
  const player=players.find(item=>item.player_id===viewer)||null;
  const room={room_id:'ROOM-197',room_code:'LAB-197',game_code:'MEMORY_MATCH',game_id:'MEMORY_MATCH',game_label:'Memory Match',status:'LIVE',round_status:'OPEN',mode:'INDIVIDUAL',unit:'U01',nivel:'B1'};
  const pkg={version:'CS21A197',sync_version:'CS21A192-MM-CONSISTENCY-2',state_revision:snapshot.stateRevision,server_now:new Date(now).toISOString(),server_now_ms:now,room:{room_code:'LAB-197',game_id:'MEMORY_MATCH',mode:'INDIVIDUAL',level_id:'B1'},round:{round_id:'LAB-197-R1',index:1,title:'Memory Match · U01',cards},rules:{round_duration_ms:30000,auto_start_delay_ms:0,reveal_duration_ms:8500,mismatch_reveal_ms:8500,spectator_reveal_ms:8500,team_size:1},state:{phase:'OPEN',started_at:currentTurn.turn_started_at,ends_at:currentTurn.turn_ends_at,active_player_id:currentTurn.active_player_id,active_team_id:''},players,teams:[],player,turn_state:currentTurn,shared_state:shared};
  return {ok:true,sync_version:'CS21A192-MM-CONSISTENCY-2',state_revision:snapshot.stateRevision,server_now:new Date(now).toISOString(),server_now_ms:now,turn_remaining_ms:Math.max(0,Date.parse(currentTurn.turn_ends_at)-now),memory_match:true,room,player,room_package:pkg,turn_state:currentTurn,shared_state:shared,stats:{players:2,answers_current:snapshot.activeAttempt?1:0},leaderboard:[{rank:1,cod_estudiante:'P1',nombre:'Chu',points:0},{rank:2,cod_estudiante:'P2',nombre:'Naty',points:0}],team_leaderboard:[],events:[]};
}
function normalizeExpired(){
  if(!canonical.activeAttempt||canonical.activeAttempt.phase!=='MISMATCH_REVEAL'||!mismatchRevealUntil||Date.now()<mismatchRevealUntil)return;
  canonical.stateRevision=4;canonical.boardVersion=4;canonical.activeAttempt=null;
}
async function fulfillJson(route,data){await route.fulfill({status:200,contentType:'application/json;charset=utf-8',body:JSON.stringify(data)});}
async function backendRoute(route){
  const request=route.request();
  const url=new URL(request.url());
  const endpoint=url.searchParams.get('fn')||'';
  const body=request.postDataJSON()||{};
  assert.ok(['englishLabMemoryMatchGetPlayerState','englishLabMemoryMatchGetRoomControl'].includes(endpoint),`Endpoint inesperado: ${endpoint}`);
  const viewer=endpoint==='englishLabMemoryMatchGetRoomControl'?'teacher':String(body.player_id||body.cod_estudiante||'');
  assert.ok(viewer==='P2'||viewer==='teacher',`Viewer inesperado: ${viewer}`);
  readCalls[viewer]+=1;
  await wait(viewer==='teacher'?80:40);
  normalizeExpired();
  await fulfillJson(route,responseFor(canonical,viewer));
}

const clients={};
try{
  for(const viewer of ['P2','teacher']){
    const context=await browser.newContext({viewport:viewer==='teacher'?{width:1440,height:900}:{width:390,height:844}});
    await context.route('**/__cs21a192_live?*',backendRoute);
    const page=await context.newPage();
    page.on('pageerror',error=>browserErrors.push(`${viewer}: ${error.message}`));
    page.on('response',response=>{if(response.status()>=400)browserErrors.push(`${viewer}: HTTP ${response.status()} ${response.url()}`);});
    await page.goto(`${base}/src/english_lab_games/memory_match_authoritative_sync_preview_cs21a192.html?viewer=${viewer}`,{waitUntil:'domcontentloaded'});
    await page.locator('[data-authoritative-sync="true"]').waitFor({state:'visible',timeout:15000});
    clients[viewer]={context,page};
  }

  canonical.stateRevision=2;canonical.boardVersion=2;
  canonical.activeAttempt={phase:'FIRST_REVEALED',player_id:'P1',player_name:'Chu',team_id:'NO_TEAM',turn_number:1,first_card_id:'P1-L',second_card_id:'',revealed_at:new Date().toISOString(),reveal_until:''};

  for(const viewer of ['P2','teacher']){
    const page=clients[viewer].page;
    await page.locator('[data-authoritative-sync="true"][data-state-revision="2"]').waitFor({state:'visible',timeout:5000});
    await page.waitForFunction(()=>document.querySelector('.elmm-card')?.getAttribute('data-card-state')==='REVEALED');
    assert.equal(await page.locator('[data-authoritative-sync="true"]').getAttribute('data-live-poll-ms'),'550',`${viewer}: tier normal para 2 jugadores.`);
    assert.equal(await page.locator('[data-authoritative-sync="true"]').getAttribute('data-live-current-poll-ms'),'275',`${viewer}: FIRST_REVEALED debe activar rafaga 275 ms.`);
  }

  const mismatchPublishedAt=Date.now();
  mismatchRevealUntil=mismatchPublishedAt+8500;
  canonical.stateRevision=3;canonical.boardVersion=3;
  canonical.activeAttempt={phase:'MISMATCH_REVEAL',player_id:'P1',player_name:'Chu',team_id:'NO_TEAM',turn_number:1,first_card_id:'P1-L',second_card_id:'P2-L',revealed_at:new Date(mismatchPublishedAt).toISOString(),reveal_until:new Date(mismatchRevealUntil).toISOString()};
  canonical.turnNumber=2;canonical.activePlayer='P2';canonical.turnStartedAt=mismatchRevealUntil;canonical.turnEndsAt=mismatchRevealUntil+30000;

  const seenAt={};
  for(const viewer of ['P2','teacher']){
    const page=clients[viewer].page;
    await page.locator('[data-authoritative-sync="true"][data-state-revision="3"]').waitFor({state:'visible',timeout:4000});
    await page.waitForFunction(()=>[...document.querySelectorAll('.elmm-card')].slice(0,2).every(node=>node.getAttribute('data-card-state')==='REVEALED'));
    seenAt[viewer]=Date.now();
    assert.ok(seenAt[viewer]-mismatchPublishedAt<2500,`${viewer}: la segunda carta debe llegar en menos de 2.5 s con relay+rafaga.`);
    assert.equal(await page.locator('.elmm-shell').getAttribute('data-spectator-reveal-ms'),'8500');
    assert.equal(await page.locator('[data-authoritative-sync="true"]').getAttribute('data-live-current-poll-ms'),'275');
    const timerSeconds=Number.parseInt((await page.locator('.elmm-timer strong').textContent())||'0',10);
    assert.ok(timerSeconds>=5&&timerSeconds<=9,`${viewer}: el timer visible debe representar el reveal, no los 30 s del turno siguiente. Valor=${timerSeconds}`);
    assert.match((await page.locator('.elmm-flipback-banner').textContent())||'',/se cierran en \d+s/);
    const transition=await page.locator('.elmm-card-inner').first().evaluate(node=>getComputedStyle(node).transitionDuration);
    assert.ok(transition.split(',').some(value=>value.trim()==='0.2s'),`${viewer}: el giro debe usar 200 ms. transitionDuration=${transition}`);
  }

  await wait(1800);
  for(const viewer of ['P2','teacher']){
    const states=await clients[viewer].page.locator('.elmm-card').evaluateAll(nodes=>nodes.slice(0,2).map(node=>node.getAttribute('data-card-state')));
    assert.deepEqual(states,['REVEALED','REVEALED'],`${viewer}: las dos cartas deben seguir legibles antes del deadline.`);
  }

  for(const viewer of ['P2','teacher']){
    const page=clients[viewer].page;
    await page.locator('[data-authoritative-sync="true"][data-state-revision="4"]').waitFor({state:'visible',timeout:12000});
    await page.waitForFunction(()=>[...document.querySelectorAll('.elmm-card')].every(node=>node.getAttribute('data-card-state')==='HIDDEN'));
  }

  assert.equal(browserErrors.length,0,browserErrors.join('\n'));
  assert.ok(readCalls.P2>=3&&readCalls.teacher>=3,'Ambos espectadores deben haber polleado varias revisiones.');
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({ok:true,contract:'CS21A197_SPECTATOR_REVEAL_BROWSER',seenLatencyMs:{P2:seenAt.P2-mismatchPublishedAt,teacher:seenAt.teacher-mismatchPublishedAt},readCalls,browserErrors},null,2));
  console.log(JSON.stringify({ok:true,contract:'CS21A197_SPECTATOR_REVEAL_BROWSER',seenLatencyMs:{P2:seenAt.P2-mismatchPublishedAt,teacher:seenAt.teacher-mismatchPublishedAt},readCalls},null,2));
}finally{
  for(const value of Object.values(clients)){await value.context.close().catch(()=>{});}
  await browser.close();
}
