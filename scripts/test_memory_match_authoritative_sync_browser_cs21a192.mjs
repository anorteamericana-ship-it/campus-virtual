#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const base=process.env.QA_BASE_URL||'http://127.0.0.1:4192';
const output=path.resolve('qa-output/cs21a192-authoritative-sync');
fs.mkdirSync(output,{recursive:true});
const launchOptions={headless:true};
if(process.env.PLAYWRIGHT_EXECUTABLE_PATH)launchOptions.executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const browser=await chromium.launch(launchOptions);
const startedAt=Date.now();
const turnEndsAt=startedAt+30000;
const MISMATCH_REVEAL_MS=6000;
const players=[
  {player_id:'P1',cod_estudiante:'P1',name:'Chu',team_id:'NO_TEAM'},
  {player_id:'P2',cod_estudiante:'P2',name:'Naty',team_id:'NO_TEAM'},
];
const cards=[
  {card_id:'P1-L',pair_id:'PAIR-1',face_type:'TEXT',label:'teacher'},
  {card_id:'P2-L',pair_id:'PAIR-2',face_type:'TEXT',label:'student'},
  {card_id:'P1-R',pair_id:'PAIR-1',face_type:'TEXT',label:'profesor/a'},
  {card_id:'P2-R',pair_id:'PAIR-2',face_type:'TEXT',label:'estudiante'},
];
const canonical={
  stateRevision:1,
  boardVersion:1,
  activeAttempt:null,
  turnNumber:1,
  activePlayer:'P1',
  turnStartedAt:startedAt,
  turnEndsAt,
};
const inFlight={P1:0,P2:0,teacher:0};
const maxInFlight={P1:0,P2:0,teacher:0};
const readCalls={P1:0,P2:0,teacher:0};
const delays={P1:0,P2:800,teacher:2500};
const packageClockStaleBy={P1:0,P2:3500,teacher:7000};
let staleReadCaptured=false;
let mismatchRevealUntil=0;
let releaseStale;
let signalStaleStarted;
const staleGate=new Promise(resolve=>{releaseStale=resolve;});
const staleStarted=new Promise(resolve=>{signalStaleStarted=resolve;});

function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function clone(value){return JSON.parse(JSON.stringify(value));}
function turn(snapshot=canonical){
  const active=snapshot.activePlayer||'P1';
  return {version:'CS21A176',participation_policy:'ROUND_ROBIN',player_order:['P1','P2'],player_cursor:active==='P2'?1:0,team_order:[],team_cursor:0,team_player_orders:{},team_player_cursors:{},active_player_id:active,active_team_id:'',turn_number:snapshot.turnNumber||1,turn_started_at:new Date(snapshot.turnStartedAt||startedAt).toISOString(),turn_ends_at:new Date(snapshot.turnEndsAt||turnEndsAt).toISOString(),last_player_id:active==='P2'?'P1':'',last_team_id:'',reason:snapshot.turnNumber>1?'PAIR_MISMATCH_AFTER_FLIPBACK':'ROUND_STARTED'};
}
function sharedFrom(snapshot){
  return {version:'CS21A192',state_revision:snapshot.stateRevision,board_version:snapshot.boardVersion,claimed_pairs:{},matched_pair_ids:[],active_attempt:clone(snapshot.activeAttempt),completed:false};
}
function responseFor(snapshot,viewer){
  const now=Date.now();
  const currentTurn=turn(snapshot);
  const shared=sharedFrom(snapshot);
  const player=players.find(item=>item.player_id===viewer)||null;
  const room={room_id:'ROOM-192',room_code:'LAB-192',game_code:'MEMORY_MATCH',game_id:'MEMORY_MATCH',game_label:'Memory Match',status:'LIVE',round_status:'OPEN',mode:'INDIVIDUAL',unit:'U01',nivel:'B1'};
  // El package simula el server_now viejo que CS21A180 guardaba en caché. El
  // contrato CS192 fresco vive en la raíz y debe ser el único reloj aceptado.
  const stalePackageNow=now-packageClockStaleBy[viewer];
  const pkg={version:'CS21A192',sync_version:'CS21A192-MM-CONSISTENCY-1',state_revision:snapshot.stateRevision,server_now:new Date(stalePackageNow).toISOString(),server_now_ms:stalePackageNow,room:{room_code:'LAB-192',game_id:'MEMORY_MATCH',mode:'INDIVIDUAL',level_id:'B1'},round:{round_id:'LAB-192-R1',index:1,title:'Memory Match · U01',cards},rules:{round_duration_ms:30000,auto_start_delay_ms:0,reveal_duration_ms:MISMATCH_REVEAL_MS,team_size:1},state:{phase:'OPEN',started_at:currentTurn.turn_started_at,ends_at:currentTurn.turn_ends_at,active_player_id:currentTurn.active_player_id,active_team_id:''},players,teams:[],player,turn_state:currentTurn,shared_state:shared};
  return {ok:true,sync_version:'CS21A192-MM-CONSISTENCY-1',state_revision:snapshot.stateRevision,server_now:new Date(now).toISOString(),server_now_ms:now,turn_remaining_ms:Math.max(0,currentTurn.turn_ends_at?Date.parse(currentTurn.turn_ends_at)-now:0),memory_match:true,room,player,room_package:pkg,turn_state:currentTurn,shared_state:shared,stats:{players:25,answers_current:snapshot.activeAttempt?1:0},leaderboard:[{rank:1,cod_estudiante:'P1',nombre:'Chu',points:0},{rank:2,cod_estudiante:'P2',nombre:'Naty',points:0}],team_leaderboard:[],events:snapshot.activeAttempt?[{event_type:'CARD_REVEALED',created_at:new Date(now).toISOString()}]:[]};
}
function viewerFor(endpoint,body){return endpoint==='englishLabMemoryMatchGetRoomControl'?'teacher':String(body.player_id||body.cod_estudiante||'');}
async function fulfillJson(route,data){await route.fulfill({status:200,contentType:'application/json;charset=utf-8',body:JSON.stringify(data)});}
function normalizeExpiredMismatch(){
  if(!canonical.activeAttempt||canonical.activeAttempt.phase!=='MISMATCH_REVEAL'||Date.now()<mismatchRevealUntil)return;
  canonical.stateRevision=4;
  canonical.boardVersion=4;
  canonical.activeAttempt=null;
}
async function backendRoute(route){
  const request=route.request();
  const url=new URL(request.url());
  const endpoint=url.searchParams.get('fn')||'';
  const body=request.postDataJSON()||{};
  if(endpoint==='englishLabMemoryMatchSubmitPair'){
    const answer=body.answer_value||{};
    if(answer.action==='DISCOVER_CARD'){
      canonical.stateRevision=2;
      canonical.boardVersion=2;
      canonical.activeAttempt={phase:'FIRST_REVEALED',player_id:'P1',player_name:'Chu',team_id:'NO_TEAM',turn_number:1,first_card_id:answer.card_id,second_card_id:'',revealed_at:new Date().toISOString(),reveal_until:''};
      await fulfillJson(route,{...responseFor(canonical,'P1'),accepted:true,action:'DISCOVER_CARD'});
      return;
    }
    assert.equal(answer.action,'SUBMIT_PAIR','La segunda mutación debe comprobar una pareja.');
    assert.equal(answer.first_card_id,'P1-L');
    assert.equal(answer.second_card_id,'P2-L');
    mismatchRevealUntil=Date.now()+MISMATCH_REVEAL_MS;
    canonical.stateRevision=3;
    canonical.boardVersion=3;
    canonical.activeAttempt={phase:'MISMATCH_REVEAL',player_id:'P1',player_name:'Chu',team_id:'NO_TEAM',turn_number:1,first_card_id:answer.first_card_id,second_card_id:answer.second_card_id,revealed_at:new Date().toISOString(),reveal_until:new Date(mismatchRevealUntil).toISOString()};
    canonical.turnNumber=2;
    canonical.activePlayer='P2';
    canonical.turnStartedAt=mismatchRevealUntil;
    canonical.turnEndsAt=mismatchRevealUntil+30000;
    await fulfillJson(route,{...responseFor(canonical,'P1'),accepted:true,action:'SUBMIT_PAIR',correct:false,points:0});
    return;
  }
  assert.ok(['englishLabMemoryMatchGetPlayerState','englishLabMemoryMatchGetRoomControl'].includes(endpoint),`Endpoint inesperado: ${endpoint}`);
  const viewer=viewerFor(endpoint,body);
  readCalls[viewer]+=1;
  inFlight[viewer]+=1;
  maxInFlight[viewer]=Math.max(maxInFlight[viewer],inFlight[viewer]);
  try{
    if(viewer==='P1'&&!staleReadCaptured){
      staleReadCaptured=true;
      const stale=clone(canonical);
      signalStaleStarted();
      await staleGate;
      await fulfillJson(route,responseFor(stale,viewer));
      return;
    }
    await wait(delays[viewer]);
    normalizeExpiredMismatch();
    await fulfillJson(route,responseFor(canonical,viewer));
  }finally{
    inFlight[viewer]-=1;
  }
}

const clients={};
const browserErrors=[];
try{
  for(const viewer of ['P1','P2','teacher']){
    const viewport=viewer==='teacher'?{width:1440,height:900}:viewer==='P2'?{width:390,height:844}:{width:720,height:900};
    const context=await browser.newContext({viewport});
    await context.route('**/__cs21a192_live?*',backendRoute);
    const page=await context.newPage();
    page.on('pageerror',error=>browserErrors.push(`${viewer}: ${error.message}`));
    page.on('response',response=>{if(response.status()>=400)browserErrors.push(`${viewer}: HTTP ${response.status()} ${response.url()}`);});
    await page.goto(`${base}/src/english_lab_games/memory_match_authoritative_sync_preview_cs21a192.html?viewer=${viewer}`,{waitUntil:'domcontentloaded'});
    await page.locator('[data-authoritative-sync="true"]').waitFor({state:'visible',timeout:15000});
    clients[viewer]={context,page};
  }

  await staleStarted;
  await wait(450);
  assert.equal(await clients.P1.page.locator('#elive-cs21a181-loading[data-visible="true"]').count(),0,'El polling silencioso no debe mostrar “Actualizando la sala…”.');

  const chuCard=clients.P1.page.locator('.elmm-card').first();
  await chuCard.click();
  await clients.P1.page.locator('[data-authoritative-sync="true"][data-state-revision="2"]').waitFor({state:'visible',timeout:5000});
  await clients.P1.page.waitForFunction(()=>document.querySelector('.elmm-card')?.getAttribute('data-card-state')==='REVEALED');

  // La lectura r1 salió antes de la jugada y llega después de la respuesta r2.
  // El código anterior la aplicaba y volvía a ocultar la carta.
  releaseStale();
  await wait(1200);
  assert.equal(await clients.P1.page.locator('[data-authoritative-sync="true"]').getAttribute('data-state-revision'),'2','Una lectura vieja no puede reemplazar la respuesta de la jugada.');
  assert.equal(await chuCard.getAttribute('data-card-state'),'REVEALED','La carta autoritativa no puede volver a ocultarse por una respuesta r1.');

  for(const viewer of ['P1','P2','teacher']){
    await clients[viewer].page.locator('[data-authoritative-sync="true"][data-state-revision="2"][data-turn-number="1"][data-board-version="2"]').waitFor({state:'visible',timeout:8000});
    assert.equal(await clients[viewer].page.locator('[data-authoritative-sync="true"]').getAttribute('data-live-poll-ms'),'2200',`${viewer}: debe probar el peor polling soportado.`);
    await clients[viewer].page.waitForFunction(()=>document.querySelector('.elmm-card')?.getAttribute('data-card-state')==='REVEALED');
  }

  // La ventana autoritativa debe sobrevivir el peor polling admitido (2.2 s),
  // la latencia docente simulada (2.5 s) y un margen. En un mismo instante los
  // tres paneles tienen que mostrar ambas cartas del mismatch.
  await clients.P1.page.locator('.elmm-card').nth(1).click();
  for(const viewer of ['P1','P2','teacher']){
    await clients[viewer].page.locator('[data-authoritative-sync="true"][data-state-revision="3"][data-turn-number="2"][data-board-version="3"]').waitFor({state:'visible',timeout:8000});
    await clients[viewer].page.waitForFunction(()=>[...document.querySelectorAll('.elmm-card')].slice(0,2).every(node=>node.getAttribute('data-card-state')==='REVEALED'));
  }
  const mismatchStates={};
  for(const viewer of ['P1','P2','teacher'])mismatchStates[viewer]=await clients[viewer].page.locator('.elmm-card').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-card-state')));
  assert.deepEqual(mismatchStates.P1,['REVEALED','REVEALED','HIDDEN','HIDDEN']);
  assert.deepEqual(mismatchStates.P1,mismatchStates.P2);
  assert.deepEqual(mismatchStates.P1,mismatchStates.teacher);
  assert.ok(Date.now()<mismatchRevealUntil,'La ventana autoritativa debe seguir abierta cuando el panel más lento converge.');

  // Al vencer la misma marca absoluta, el mock emite una sola revisión de
  // limpieza. Los tres paneles deben cerrar cartas y converger al turno de P2.
  for(const viewer of ['P1','P2','teacher']){
    await clients[viewer].page.locator('[data-authoritative-sync="true"][data-state-revision="4"][data-turn-number="2"][data-board-version="4"]').waitFor({state:'visible',timeout:14000});
    await clients[viewer].page.waitForFunction(()=>[...document.querySelectorAll('.elmm-card')].every(node=>node.getAttribute('data-card-state')==='HIDDEN'));
  }

  const snapshots={};
  for(const viewer of ['P1','P2','teacher']){
    const page=clients[viewer].page;
    snapshots[viewer]=await page.evaluate(()=>({
      adapter:{
        revision:Number(document.querySelector('[data-authoritative-sync]')?.getAttribute('data-state-revision')||0),
        turn:Number(document.querySelector('[data-authoritative-sync]')?.getAttribute('data-turn-number')||0),
        board:Number(document.querySelector('[data-authoritative-sync]')?.getAttribute('data-board-version')||0),
        clock:document.querySelector('[data-authoritative-sync]')?.getAttribute('data-clock-source')||'',
      },
      parent:{
        revision:Number(document.querySelector('[data-parent-revision]')?.getAttribute('data-parent-revision')||0),
        turn:Number(document.querySelector('[data-parent-revision]')?.getAttribute('data-parent-turn')||0),
        board:Number(document.querySelector('[data-parent-revision]')?.getAttribute('data-parent-board')||0),
      },
      cards:[...document.querySelectorAll('.elmm-card')].map(node=>node.getAttribute('data-card-state')),
      timer:Number.parseInt(document.querySelector('.elmm-timer strong')?.textContent||'0',10),
      history:(window.__QA_REVISION_HISTORY__||[]).map(item=>[item.stateRevision,item.turnNumber,item.boardVersion]),
      cachedStateReads:(window.EnglishLabLiveSyncCS21A177?.getMetrics?.()||[]).filter(item=>item.cached===true&&/MemoryMatchGet(PlayerState|RoomControl)/.test(item.endpoint)).length,
      horizontalOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
    }));
    assert.deepEqual(
      {revision:snapshots[viewer].adapter.revision,turn:snapshots[viewer].adapter.turn,board:snapshots[viewer].adapter.board},
      snapshots[viewer].parent,
      `${viewer}: tablero y panel padre deben usar la misma revisión.`,
    );
    assert.equal(snapshots[viewer].adapter.clock,'AUTHORITATIVE_CS21A192');
    assert.equal(snapshots[viewer].cachedStateReads,0,`${viewer}: el estado Memory no debe venir del recent-cache cliente.`);
    assert.equal(snapshots[viewer].horizontalOverflow,false,`${viewer}: no debe existir overflow horizontal.`);
    for(let index=1;index<snapshots[viewer].history.length;index+=1){
      const previous=snapshots[viewer].history[index-1];
      const current=snapshots[viewer].history[index];
      assert.ok(current[0]>previous[0]||(current[0]===previous[0]&&(current[1]>previous[1]||(current[1]===previous[1]&&current[2]>=previous[2]))),`${viewer}: revisión regresiva ${JSON.stringify(snapshots[viewer].history)}`);
    }
  }
  assert.deepEqual(snapshots.P1.adapter,snapshots.P2.adapter);
  assert.deepEqual(snapshots.P1.adapter,snapshots.teacher.adapter);
  assert.deepEqual(snapshots.P1.cards,snapshots.P2.cards);
  assert.deepEqual(snapshots.P1.cards,snapshots.teacher.cards);
  assert.deepEqual(snapshots.P1.cards,['HIDDEN','HIDDEN','HIDDEN','HIDDEN']);
  const timerValues=Object.values(snapshots).map(item=>item.timer);
  assert.ok(Math.max(...timerValues)-Math.min(...timerValues)<=1,`Relojes fuera de tolerancia: ${JSON.stringify(timerValues)}`);
  for(const viewer of ['P1','P2','teacher'])assert.ok(maxInFlight[viewer]<=1,`${viewer}: hubo ${maxInFlight[viewer]} lecturas simultáneas.`);
  assert.deepEqual(browserErrors,[],`Errores navegador: ${browserErrors.join(' | ')}`);

  await clients.teacher.page.screenshot({path:path.join(output,'teacher-authoritative.png'),fullPage:true});
  await clients.P1.page.screenshot({path:path.join(output,'chu-authoritative.png'),fullPage:true});
  await clients.P2.page.screenshot({path:path.join(output,'naty-authoritative.png'),fullPage:true});
  const result={verdict:'PASS_BROWSER_CS21A192',independentBrowserContexts:3,mobile390:true,horizontalOverflow:false,outOfOrderReadRejected:true,singleReadOwner:true,silentPolling:true,recentMemoryReadCache:false,mismatchRevealMs:MISMATCH_REVEAL_MS,mismatchVisibleSimultaneously:true,mismatchFlipbackConverged:true,revision:4,turn:2,boardVersion:4,allCardsEqual:true,timerSkewSeconds:Math.max(...timerValues)-Math.min(...timerValues),latencyMs:delays,maxInFlight,readCalls};
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}finally{
  for(const client of Object.values(clients))await client.context.close();
  await browser.close();
}
