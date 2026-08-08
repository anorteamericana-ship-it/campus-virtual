import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

export const baseUrl=process.env.QA_BASE_URL||'http://127.0.0.1:4192';
export const players=Object.freeze([
  Object.freeze({player_id:'P1',cod_estudiante:'P1',name:'Chu',team_id:'NO_TEAM'}),
  Object.freeze({player_id:'P2',cod_estudiante:'P2',name:'Naty',team_id:'NO_TEAM'}),
]);
export const cards=Object.freeze([
  Object.freeze({card_id:'P1-L',pair_id:'PAIR-1',face_type:'TEXT',label:'teacher'}),
  Object.freeze({card_id:'P2-L',pair_id:'PAIR-2',face_type:'TEXT',label:'student'}),
  Object.freeze({card_id:'P1-R',pair_id:'PAIR-1',face_type:'TEXT',label:'profesor/a'}),
  Object.freeze({card_id:'P2-R',pair_id:'PAIR-2',face_type:'TEXT',label:'estudiante'}),
]);

export function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

export function writeEvidence(fileName,result){
  const output=path.resolve('qa-output/cs21a192-authoritative-sync');
  fs.mkdirSync(output,{recursive:true});
  fs.writeFileSync(path.join(output,fileName),JSON.stringify(result,null,2)+'\n');
}

export async function launchBrowser(){
  const options={headless:true};
  if(process.env.PLAYWRIGHT_EXECUTABLE_PATH)options.executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  return chromium.launch(options);
}

export function viewerFor(endpoint,body){
  return endpoint==='englishLabMemoryMatchGetRoomControl'?'teacher':String(body.player_id||body.cod_estudiante||'P1');
}

export function endpointAndBody(route){
  const request=route.request();
  const endpoint=new URL(request.url()).searchParams.get('fn')||'';
  return {endpoint,body:request.postDataJSON()||{}};
}

export async function fulfillJson(route,data){
  await route.fulfill({status:200,contentType:'application/json;charset=utf-8',body:JSON.stringify(data)});
}

export function responseFor(options={}){
  const now=Number(options.serverNow||Date.now());
  const revision=Number(options.revision||2);
  const boardVersion=Number(options.boardVersion||revision);
  const turnNumber=Number(options.turnNumber||1);
  const turnStartedAt=Number(options.turnStartedAt||now-1000);
  const turnEndsAt=Number(options.turnEndsAt||now+30000);
  const activePlayer=String(options.activePlayer||'P1');
  const viewer=String(options.viewer||'P1');
  const status=String(options.status||'LIVE');
  const roundStatus=String(options.roundStatus||'OPEN');
  const phase=String(options.phase||'OPEN');
  const completed=options.completed===true;
  const attempt=options.attempt===undefined?null:options.attempt;
  const participantCount=Number(options.participantCount||2);
  const player=players.find(item=>item.player_id===viewer)||null;
  const turn={
    version:'CS21A176',participation_policy:'ROUND_ROBIN',player_order:['P1','P2'],player_cursor:activePlayer==='P2'?1:0,
    team_order:[],team_cursor:0,team_player_orders:{},team_player_cursors:{},active_player_id:activePlayer,active_team_id:'',
    turn_number:turnNumber,turn_started_at:new Date(turnStartedAt).toISOString(),turn_ends_at:new Date(turnEndsAt).toISOString(),
    last_player_id:activePlayer==='P2'?'P1':'',last_team_id:'',reason:turnNumber>1?'TIMEOUT':'ROUND_STARTED',
  };
  const shared={version:'CS21A192',state_revision:revision,board_version:boardVersion,claimed_pairs:{},matched_pair_ids:[],active_attempt:attempt,completed};
  const room={room_id:'ROOM-192-LIVE',room_code:'LAB-192',game_code:'MEMORY_MATCH',game_id:'MEMORY_MATCH',game_label:'Memory Match',status,round_status:roundStatus,mode:'INDIVIDUAL',unit:'U01',nivel:'B1'};
  const pkg={
    version:'CS21A192',sync_version:'CS21A192-MM-CONSISTENCY-1',state_revision:revision,
    room:{room_code:'LAB-192',game_id:'MEMORY_MATCH',mode:'INDIVIDUAL',level_id:'B1',status,round_status:roundStatus},
    round:{round_id:'LAB-192-R1',index:1,title:'Memory Match - U01',cards},
    rules:{round_duration_ms:30000,auto_start_delay_ms:0,reveal_duration_ms:6000,team_size:1},
    state:{phase,started_at:turn.turn_started_at,ends_at:turn.turn_ends_at,active_player_id:activePlayer,active_team_id:''},
    players,teams:[],player,turn_state:turn,shared_state:shared,
  };
  return {
    ok:true,sync_version:'CS21A192-MM-CONSISTENCY-1',state_revision:revision,
    server_now:new Date(now).toISOString(),server_now_ms:now,turn_remaining_ms:Math.max(0,turnEndsAt-now),
    memory_match:true,room,player,room_package:pkg,turn_state:turn,shared_state:shared,
    stats:{players:participantCount,answers_current:attempt?1:0},leaderboard:[],team_leaderboard:[],events:[],
  };
}

export async function openPreview(browser,viewer,routeHandler,viewport){
  const context=await browser.newContext({viewport:viewport||{width:720,height:900}});
  await context.route('**/__cs21a192_live?*',routeHandler);
  const page=await context.newPage();
  await page.goto(`${baseUrl}/src/english_lab_games/memory_match_authoritative_sync_preview_cs21a192.html?viewer=${viewer}`,{waitUntil:'domcontentloaded'});
  await page.locator('[data-authoritative-sync="true"]').waitFor({state:'visible',timeout:15000});
  return {context,page};
}
