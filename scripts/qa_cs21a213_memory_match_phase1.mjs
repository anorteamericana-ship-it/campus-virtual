#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const patchPath=path.join(root,'apps_script_patches/99Z_MEMORY_MATCH_IDEMPOTENT_INTENT_QA_CS21A213.gs');
const classicPath=path.join(root,'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx');
const adapterPath=path.join(root,'src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx');
for(const file of [patchPath,classicPath,adapterPath]) assert.equal(fs.existsSync(file),true,`Falta ${path.relative(root,file)}`);

const patch=fs.readFileSync(patchPath,'utf8');
const classic=fs.readFileSync(classicPath,'utf8');
const adapter=fs.readFileSync(adapterPath,'utf8');

assert.match(classic,/attempt_id:currentAttemptId/,'DISCOVER_CARD no transporta attempt_id.');
assert.match(classic,/attempt_id:currentAttemptId,first_card_id:first\.id/,'SUBMIT_PAIR no comparte attempt_id.');
assert.match(adapter,/attempt_id:clean\(answerValue\.attempt_id\|\|answerValue\.attemptId\)/,'El adaptador no eleva attempt_id al payload.');
assert.match(patch,/var lock = LockService\.getScriptLock\(\)/,'La ruta rápida debe conservar ScriptLock.');
assert.doesNotMatch(patch,/function _cs21a213TryFastSubmit_[\s\S]*?_elive180BuildSnapshot_\(/,'La ruta rápida no puede construir un snapshot completo.');
assert.match(patch,/_elive180AppendObject_\(ELIVE_ANSWERS_SHEET/,'La respuesta debe persistirse en Answers.');
assert.match(patch,/sheet\.getRange\(sheet\.getLastRow\(\) \+ 1, 1, rows\.length, headers\.length\)\.setValues\(rows\)/,'Los eventos deben persistirse en lote.');

function clone(value){return JSON.parse(JSON.stringify(value));}
function text(value){return String(value??'').trim();}
function upper(value){return text(value).toUpperCase();}
function iso(value=new Date()){return new Date(value).toISOString();}

function createHarness(){
  const counters={legacy:0,snapshots:0,answers:0,roomWrites:0,eventWrites:0,lockAttempts:0};
  let uuid=0;
  let answerRows=[];
  let eventRows=[];
  let relay=null;
  const lock={tryLock(){counters.lockAttempts+=1;return true;},releaseLock(){}};
  const room={
    _row:2,ROOM_ID:'ROOM-213',ROOM_CODE:'LAB-213',GAME_CODE:'MEMORY_MATCH',STATUS:'LIVE',ROUND_STATUS:'OPEN',CURRENT_INDEX:1,
    CURRENT_QUESTION_JSON:''
  };
  const players=[
    {player_id:'P1',name:'NATY',team_id:'AZUL',cod_estudiante:'P1'},
    {player_id:'P2',name:'CHU',team_id:'ROJO',cod_estudiante:'P2'},
  ];
  const cards=[
    {card_id:'C1',pair_id:'PAIR-A'},{card_id:'C2',pair_id:'PAIR-A'},
    {card_id:'C3',pair_id:'PAIR-B'},{card_id:'C4',pair_id:'PAIR-B'},
  ];

  function freshPackage(revision=12){
    const now=Date.now();
    return {
      version:'CS21A212-MM-LATENCY-SAFE-15S-ACK-1',state_revision:revision,
      latency_safe_version:'CS21A212-MM-LATENCY-SAFE-15S-ACK-1',
      rules:{round_duration_ms:15000,first_reveal_min_second_ms:15000,mismatch_reveal_ms:3000,latency_safe_version:'CS21A212-MM-LATENCY-SAFE-15S-ACK-1'},
      room:{room_code:'LAB-213',game_id:'MEMORY_MATCH'},
      round:{round_id:'ROUND-1',cards:clone(cards)},
      state:{phase:'OPEN',active_player_id:'P1',started_at:iso(now-1000),ends_at:iso(now+60000)},
      turn_state:{turn_number:7,active_player_id:'P1',active_team_id:'AZUL',player_order:['P1','P2'],player_cursor:0,participation_policy:'RANDOM_PLAYER',turn_started_at:iso(now-1000),turn_ends_at:iso(now+60000)},
      shared_state:{version:'CS21A212',state_revision:revision,board_version:1,matched_pair_ids:[],claimed_pairs:{},active_attempt:null,completed:false,last_action_key:''},
      players:clone(players)
    };
  }

  function current(){return JSON.parse(room.CURRENT_QUESTION_JSON);}
  function pkg(){return current().room_package;}
  function setPackage(next){room.CURRENT_QUESTION_JSON=JSON.stringify({type:'memory_match',game_id:'MEMORY_MATCH',room_package:next});publishPackage(next);}
  function publishPackage(next){
    relay={
      revision:Number(next.state_revision||next.shared_state?.state_revision||0),published_ms:Date.now(),
      acl:{ROOM_ID:room.ROOM_ID,ROOM_CODE:room.ROOM_CODE,GAME_CODE:room.GAME_CODE,STATUS:room.STATUS},
      response:{ok:true,memory_match:true,room:{room_code:room.ROOM_CODE},room_package:clone(next),turn_state:clone(next.turn_state),shared_state:clone(next.shared_state),leaderboard:[
        {cod_estudiante:'P1',nombre:'NATY',team:'AZUL',points:0,answered:0,correct:0,rank:1},
        {cod_estudiante:'P2',nombre:'CHU',team:'ROJO',points:0,answered:0,correct:0,rank:2},
      ],team_leaderboard:[
        {team:'AZUL',points:0,answered:0,correct:0,rank:1},
        {team:'ROJO',points:0,answered:0,correct:0,rank:2},
      ],stats:{players:2,answers_total:answerRows.length,answers_current:answerRows.length}}
    };
  }
  function reset(revision=12){
    answerRows=[];eventRows=[];
    counters.answers=0;counters.roomWrites=0;counters.eventWrites=0;counters.snapshots=0;
    setPackage(freshPackage(revision));
  }
  reset();

  const context={
    console,Date,JSON,Math,Object,Array,Number,String,RegExp,isFinite,
    ELIVE_ANSWERS_SHEET:'Answers',ELIVE_ANSWERS_HEADERS:['ROOM_ID','ROOM_CODE','QUESTION_INDEX','COD_ESTUDIANTE','ANSWER_VALUE','IS_CORRECT','POINTS','TIME_MS','ANSWERED_AT'],
    ELIVE_EVENTS_SHEET:'Events',ELIVE_EVENTS_HEADERS:['EVENT_ID','ROOM_ID','ROOM_CODE','EVENT_TYPE','ACTOR','ROLE','CREATED_AT','DETAIL_JSON'],
    ELMM174_GAME_CODE:'MEMORY_MATCH',CS21A212_MM_VERSION:'CS21A212-MM-LATENCY-SAFE-15S-ACK-1',
    CS21A212_MM_INITIAL_TURN_MS:15000,CS21A212_MM_MIN_SECOND_PICK_MS:15000,CS21A212_MM_PAIR_REVEAL_MS:3000,
    Utilities:{getUuid(){uuid+=1;return `UUID-${uuid}`;}},
    LockService:{getScriptLock(){return lock;}},
    englishLabMemoryMatchSubmitPairCS21A180(body){counters.legacy+=1;return {ok:true,legacy:true,body};},
    _elive176Text_:text,_elive176Upper_:upper,_elive176Iso_:iso,_eliveIso_:()=>iso(),
    _elive176Timestamp_(value){const parsed=Date.parse(value);return Number.isFinite(parsed)?parsed:0;},
    _elive176Json_(value,fallback){try{return typeof value==='string'?JSON.parse(value):value;}catch{return fallback;}},
    _cs21a192Clone_:clone,
    _cs21a192Revision_(value){return Math.max(0,Number(value?.state_revision||0),Number(value?.shared_state?.state_revision||0));},
    _cs21a192ExpectedNumber_(body,snake,camel){
      const provided=Object.prototype.hasOwnProperty.call(body,snake)||Object.prototype.hasOwnProperty.call(body,camel);
      if(!provided)return {provided:false,value:null};
      const raw=Object.prototype.hasOwnProperty.call(body,snake)?body[snake]:body[camel];
      const parsed=Number(raw);return {provided:true,value:Number.isFinite(parsed)?parsed:null};
    },
    _cs21a192FreshEnvelope_(response){
      const out=clone(response||{});const next=out.room_package;
      if(next){out.state_revision=Math.max(Number(next.state_revision||0),Number(next.shared_state?.state_revision||0));out.turn_state=clone(next.turn_state);out.shared_state=clone(next.shared_state);}
      out.server_now=iso();out.server_now_ms=Date.now();return out;
    },
    _cs21a192ExpectedStateConflict_(body,next,turn){
      const expectedRevision=context._cs21a192ExpectedNumber_(body,'expected_state_revision','expectedStateRevision');
      const expectedTurn=context._cs21a192ExpectedNumber_(body,'expected_turn_number','expectedTurnNumber');
      const sameRevision=!expectedRevision.provided||expectedRevision.value===context._cs21a192Revision_(next);
      const sameTurn=!expectedTurn.provided||expectedTurn.value===Number(turn?.turn_number||0);
      return sameRevision&&sameTurn?null:{ok:false,error:'state_conflict',room_package:clone(next),turn_state:clone(turn)};
    },
    _elive180RequireLab_(body){return body.token==='TOKEN-P1'?{allowed:true,student_id:'P1'}:{ok:false,error:'sesion_requerida'};},
    _cs21a144LiveBody_(body){return clone(body);},
    _elive180RoomIdFromBody_(body){return text(body.room_id||body.room_code||body.roomCode);},
    _cs21a195ReadRelay_(){return clone(relay);},
    _cs21a195RelayRevision_(record){return Number(record?.revision||0);},
    _cs21a195TransitionDue_(){return false;},
    _cs21a195PlayerInRelay_(record,id){return record?.response?.room_package?.players?.find(player=>text(player.player_id||player.cod_estudiante)===text(id))||null;},
    _cs21a195PublishResponseRelay_(unused,response){
      relay.response={...relay.response,...clone(response)};relay.revision=Number(response.state_revision||response.room_package?.state_revision||relay.revision);return true;
    },
    _elive180FindRoom_(){return {row:room,rowNumber:2,index:{CURRENT_QUESTION_JSON:0,ROUND_STATUS:1,ROUND_CLOSED_AT:2},sheet:{}};},
    _elive176Current_:()=>current(),
    _elive176Package_:source=>JSON.parse(source.CURRENT_QUESTION_JSON).room_package,
    _elive176PublicRoom_:source=>({room_id:source.ROOM_ID,room_code:source.ROOM_CODE,status:source.STATUS,game_code:source.GAME_CODE}),
    _elive180PlayerPublic_:row=>({cod_estudiante:row.COD_ESTUDIANTE,nombre:row.NOMBRE,team:row.TEAM,player_id:row.COD_ESTUDIANTE,name:row.NOMBRE,team_id:row.TEAM}),
    _elive180SetCells_(found,values){
      const parsed=JSON.parse(values.CURRENT_QUESTION_JSON);const next=parsed.room_package;
      const revision=Math.max(Number(next.state_revision||0),Number(next.shared_state?.state_revision||0))+1;
      next.state_revision=revision;next.shared_state.state_revision=revision;parsed.state_revision=revision;
      room.CURRENT_QUESTION_JSON=JSON.stringify(parsed);
      if(values.ROUND_STATUS)room.ROUND_STATUS=values.ROUND_STATUS;
      counters.roomWrites+=1;publishPackage(next);return room;
    },
    _cs21a196AlignWrittenPackage_(source,next){
      const written=JSON.parse(source.CURRENT_QUESTION_JSON).room_package;next.state_revision=written.state_revision;next.shared_state.state_revision=written.shared_state.state_revision;return next;
    },
    _elive180Invalidate_(){},
    _cs21a189WritePackage_(found,source,container,next){
      context._cs21a194FirstRevealWindow_(next);container.room_package=next;return context._elive180SetCells_(found,{CURRENT_QUESTION_JSON:JSON.stringify(container)});
    },
    _cs21a194FirstRevealWindow_(next){
      const attempt=next.shared_state?.active_attempt;if(!attempt||upper(attempt.phase)!=='FIRST_REVEALED')return {extended:false};
      const required=Date.parse(attempt.revealed_at)+15000;const currentEnd=Date.parse(next.turn_state.turn_ends_at);const target=Math.max(currentEnd,required);
      next.turn_state.turn_ends_at=iso(target);next.state.ends_at=iso(target);attempt.turn_ends_at=iso(target);return {extended:target>currentEnd};
    },
    _cs21a189ClassicShared_(next){
      const shared=next.shared_state||{};shared.board_version=Math.max(1,Number(shared.board_version||1));shared.matched_pair_ids=Array.isArray(shared.matched_pair_ids)?shared.matched_pair_ids:[];shared.claimed_pairs=shared.claimed_pairs||{};shared.active_attempt=shared.active_attempt||null;next.shared_state=shared;return shared;
    },
    _cs21a189NormalizeAttempt_(){return false;},
    _cs21a189TurnStarted_(turn,now){return Date.parse(turn.turn_started_at)<=now.getTime();},
    _cs21a189AttemptPhase_:attempt=>upper(attempt?.phase),
    _cs21a189AttemptVisible_:attempt=>upper(attempt?.phase)==='FIRST_REVEALED'||Date.parse(attempt?.reveal_until)>Date.now(),
    _cs21a189Attempt_(phase,player,turn,first,second,now,revealUntil){return {phase:upper(phase),player_id:text(player.COD_ESTUDIANTE),player_name:text(player.NOMBRE),team_id:text(player.TEAM)||'NO_TEAM',turn_number:Number(turn.turn_number||0),first_card_id:text(first),second_card_id:text(second),revealed_at:iso(now),reveal_until:revealUntil?iso(revealUntil):''};},
    _elive176CanAct_:(turn,player)=>text(turn.active_player_id)===text(player.player_id),
    _cs21a188MmAction_(body){const answer=context._cs21a188MmAnswer_(body);return upper(answer.action||body.action||'SUBMIT_PAIR');},
    _cs21a188MmAnswer_(body){const answer=body?.answer_value||body?.answerValue||{};return typeof answer==='string'?JSON.parse(answer):answer;},
    _cs21a188MmCardsById_(next){return Object.fromEntries(next.round.cards.map(card=>[card.card_id,card]));},
    _cs21a188MmPairClaimed_:(shared,pairId)=>Boolean(shared.claimed_pairs?.[pairId]),
    _elive176PairFromBody_(next,body){const answer=context._cs21a188MmAnswer_(body);const first=next.round.cards.find(card=>card.card_id===answer.first_card_id);const second=next.round.cards.find(card=>card.card_id===answer.second_card_id);const correct=Boolean(first&&second&&first.pair_id===second.pair_id);return {first_id:text(answer.first_card_id),second_id:text(answer.second_card_id),correct,pair_id:correct?first.pair_id:''};},
    _cs21a186MmPoints_:correct=>correct?1:0,
    _cs21a188MmClaim_(shared,pairId,first,second,player,turn,now){const claim={pair_id:pairId,card_ids:[first.card_id,second.card_id],claimed_by:player.COD_ESTUDIANTE,claimed_name:player.NOMBRE,team_id:player.TEAM,claimed_at:iso(now),turn_number:turn.turn_number,points:1};shared.claimed_pairs[pairId]=claim;if(!shared.matched_pair_ids.includes(pairId))shared.matched_pair_ids.push(pairId);return claim;},
    _cs21a186MmContinueSamePlayer_(turn,now,duration,reason){const next=clone(turn);next.turn_number+=1;next.turn_started_at=iso(now);next.turn_ends_at=iso(now.getTime()+duration);next.last_player_id=turn.active_player_id;next.reason=reason;return next;},
    _elive176NextTurn_(turn,now,duration,reason){const next=clone(turn);next.turn_number+=1;next.player_cursor=(Number(turn.player_cursor||0)+1)%turn.player_order.length;next.active_player_id=turn.player_order[next.player_cursor];next.active_team_id=next.active_player_id==='P1'?'AZUL':'ROJO';next.turn_started_at=iso(now);next.turn_ends_at=iso(now.getTime()+duration);next.last_player_id=turn.active_player_id;next.reason=reason;return next;},
    _cs21a212Rules_(rules){return {...rules,round_duration_ms:15000,first_reveal_min_second_ms:15000,mismatch_reveal_ms:3000,latency_safe_version:'CS21A212-MM-LATENCY-SAFE-15S-ACK-1'};},
    _elive180AppendObject_(sheet,headers,value){if(sheet==='Answers'){answerRows.push(clone(value));counters.answers+=1;}else eventRows.push(clone(value));return value;},
    _elive180ValuesForHeaders_:(headers,value)=>headers.map(header=>value[header]??''),
    _elive180SheetDirect_(){return {
      getLastColumn:()=>8,getLastRow:()=>eventRows.length+1,
      getRange(row,column,rowCount,columnCount){return {
        getValues:()=>[['EVENT_ID','ROOM_ID','ROOM_CODE','EVENT_TYPE','ACTOR','ROLE','CREATED_AT','DETAIL_JSON']],
        setValues(rows){rows.forEach(cells=>eventRows.push(Object.fromEntries(['EVENT_ID','ROOM_ID','ROOM_CODE','EVENT_TYPE','ACTOR','ROLE','CREATED_AT','DETAIL_JSON'].map((header,index)=>[header,cells[index]]))));counters.eventWrites+=1;}
      };}
    };},
    _elive180BuildSnapshot_(){counters.snapshots+=1;throw new Error('La ruta rápida llamó un snapshot completo.');},
  };
  vm.createContext(context);
  vm.runInContext(patch,context,{filename:path.basename(patchPath)});

  function body(action,attemptId,revision,first='C1',second='C2'){
    return {token:'TOKEN-P1',room_code:'LAB-213',player_id:'P1',cod_estudiante:'P1',expected_state_revision:revision,expected_turn_number:7,
      answer_value:{action,attempt_id:attemptId,card_id:first,first_card_id:first,second_card_id:second},time_ms:250};
  }
  return {context,counters,reset,body,pkg:()=>clone(pkg()),answers:()=>clone(answerRows),events:()=>clone(eventRows)};
}

const h=createHarness();

// Orden A: DISCOVER gana; SUBMIT conserva la revisión base y continúa el mismo intento.
const intentA='ATTEMPT-CS213-DISCOVER-FIRST';
const discover=h.context.englishLabMemoryMatchSubmitPairCS21A180(h.body('DISCOVER_CARD',intentA,12));
assert.equal(discover.ok,true);assert.equal(discover.accepted,true);assert.equal(discover.state_revision,13);
assert.equal(h.pkg().shared_state.active_attempt.attempt_id,intentA);
assert.equal(h.pkg().shared_state.active_attempt.base_state_revision,12);
const pairAfterDiscover=h.context.englishLabMemoryMatchSubmitPairCS21A180(h.body('SUBMIT_PAIR',intentA,12));
assert.equal(pairAfterDiscover.ok,true);assert.equal(pairAfterDiscover.accepted,true);assert.equal(pairAfterDiscover.correct,true);assert.equal(pairAfterDiscover.state_revision,14);
assert.equal(h.answers().length,1);assert.equal(h.events().length,3);assert.equal(h.counters.snapshots,0);
const repeatPair=h.context.englishLabMemoryMatchSubmitPairCS21A180(h.body('SUBMIT_PAIR',intentA,12));
assert.equal(repeatPair.ok,true);assert.equal(repeatPair.accepted,false);assert.equal(repeatPair.duplicate,true);assert.equal(h.answers().length,1);

// Orden B: SUBMIT gana; DISCOVER tardío se reconoce como duplicado sin segunda escritura.
h.reset(20);
const intentB='ATTEMPT-CS213-SUBMIT-FIRST';
const pairFirst=h.context.englishLabMemoryMatchSubmitPairCS21A180(h.body('SUBMIT_PAIR',intentB,20));
assert.equal(pairFirst.ok,true);assert.equal(pairFirst.accepted,true);assert.equal(pairFirst.state_revision,21);
const writesAfterPair=h.counters.roomWrites;
const discoverLate=h.context.englishLabMemoryMatchSubmitPairCS21A180(h.body('DISCOVER_CARD',intentB,20));
assert.equal(discoverLate.ok,true);assert.equal(discoverLate.accepted,false);assert.equal(discoverLate.duplicate,true);
assert.equal(h.answers().length,1);assert.equal(h.counters.roomWrites,writesAfterPair);assert.equal(h.events().length,2);

// Un intento distinto y obsoleto conserva STATE_CONFLICT; no contamina la intención terminada.
const stale=h.context.englishLabMemoryMatchSubmitPairCS21A180(h.body('SUBMIT_PAIR','ATTEMPT-CS213-STALE-0001',20));
assert.equal(stale.ok,false);assert.equal(stale.error,'state_conflict');assert.equal(h.answers().length,1);

// El ledger persistente también bloquea un retry tardío después de otra intención.
const currentAfterB=h.pkg();
currentAfterB.shared_state.last_attempt_id='ATTEMPT-CS213-OTHER-0001';
currentAfterB.shared_state.last_attempt_result={attempt_id:'ATTEMPT-CS213-OTHER-0001',player_id:'P1',action:'SUBMIT_PAIR',correct:false,points:0};
currentAfterB.shared_state.recent_attempts.push(currentAfterB.shared_state.last_attempt_result);
h.context._elive180SetCells_({},{CURRENT_QUESTION_JSON:JSON.stringify({type:'memory_match',game_id:'MEMORY_MATCH',room_package:currentAfterB})});
const oldLate=h.context.englishLabMemoryMatchSubmitPairCS21A180(h.body('SUBMIT_PAIR',intentB,20));
assert.equal(oldLate.ok,true);assert.equal(oldLate.duplicate,true);assert.equal(h.answers().length,1);

// Mismatch conserva exactamente 3 s visibles y rota al siguiente jugador una sola vez.
h.reset(30);
const mismatchStart=Date.now();
const mismatch=h.context.englishLabMemoryMatchSubmitPairCS21A180(h.body('SUBMIT_PAIR','ATTEMPT-CS213-MISMATCH-01',30,'C1','C3'));
assert.equal(mismatch.ok,true);assert.equal(mismatch.correct,false);assert.equal(mismatch.points,0);
const revealMs=Date.parse(mismatch.reveal_until)-mismatchStart;
assert.ok(revealMs>=2900&&revealMs<=3200,`Mismatch fuera de 3 s: ${revealMs} ms`);
assert.equal(mismatch.turn_state.active_player_id,'P2');assert.equal(h.answers().length,1);

// Compatibilidad: sin attempt_id la capa CS213 delega íntegramente al contrato CS212.
const legacy=h.context.englishLabMemoryMatchSubmitPairCS21A180({token:'TOKEN-P1',room_code:'LAB-213',player_id:'P1',answer_value:{action:'DISCOVER_CARD',card_id:'C1'}});
assert.equal(legacy.legacy,true);assert.equal(h.counters.legacy,1);

assert.equal(h.context.verificarMemoryMatchIntentCS21A213().ok,true);
assert.equal(h.counters.snapshots,0);

console.log(JSON.stringify({
  ok:true,version:'CS21A213-MM-IDEMPOTENT-INTENT-1',
  cases:{discover_first:true,submit_first:true,late_discover_duplicate:true,repeat_submit_duplicate:true,persistent_recent_attempt_ledger:true,legitimate_stale_conflict:true,mismatch_3000ms:true,legacy_fallback:true},
  invariants:{answers_per_attempt:1,points_per_match:1,turn_transitions_per_attempt:1,script_lock:true,persistent_events:true,fast_path_full_snapshot_reads:h.counters.snapshots},
  frontend:{shared_attempt_id:true,separate_http_action_ids:true},
},null,2));
