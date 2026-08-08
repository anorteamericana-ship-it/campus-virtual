#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const sourcePath='apps_script_patches/99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs';
const classicPath='apps_script_patches/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs';
const assemblerPath='scripts/assemble_apps_script_cs21a183_complete.mjs';
const completePath='apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs';
const source=fs.readFileSync(sourcePath,'utf8');
const classicSource=fs.readFileSync(classicPath,'utf8');
const assembler=fs.readFileSync(assemblerPath,'utf8');
const complete=fs.readFileSync(completePath,'utf8');

for(const marker of [
  "CS21A192_MM_SYNC_VERSION = 'CS21A192-MM-CONSISTENCY-1'",
  '_cs21a192AdvanceAndNormalize_',
  '_cs21a192CanonicalSnapshot_',
  '_cs21a192SnapshotKeys_',
  '__cs21a192AtomicTransition',
  '__cs21a192RevisionKeyed',
  '__cs21a192CanonicalSnapshot',
  '__cs21a192RevisionedResponses',
  '_cs21a192ExpectedStateConflict_',
  '__cs21a192ExpectedStateGuard',
  'state_transition_busy',
  'state_conflict',
  'turn_remaining_ms',
  'CS21A192_MM_MISMATCH_REVEAL_MS',
]) assert.ok(source.includes(marker),`CS21A192 no contiene ${marker}`);

const classicSubmitStart=classicSource.indexOf('englishLabMemoryMatchSubmitPairCS21A180 = function');
const classicSubmitEnd=classicSource.indexOf('englishLabMemoryMatchSubmitPairCS21A180.__cs21a186CanonicalRules');
const classicSubmit=classicSource.slice(classicSubmitStart,classicSubmitEnd);
const lockIndex=classicSubmit.indexOf('if (!lock.tryLock(5000))');
const packageIndex=classicSubmit.indexOf('var pkg = current.room_package');
const turnIndex=classicSubmit.indexOf('var turnState = pkg.turn_state');
const expectedGuardIndex=classicSubmit.indexOf("typeof _cs21a192ExpectedStateConflict_ === 'function'");
const sharedMutationIndex=classicSubmit.indexOf('var shared = _cs21a189ClassicShared_(pkg)');
assert.ok(lockIndex>=0&&packageIndex>lockIndex&&turnIndex>packageIndex&&expectedGuardIndex>turnIndex&&sharedMutationIndex>expectedGuardIndex,
  'Las precondiciones CS21A192 deben comprobarse tras el refetch y bajo el mismo ScriptLock, antes de mutar shared_state.');

assert.equal(source.includes('doPost = function'),false,'CS21A192 no debe reemplazar el router');
assert.equal(source.includes('ELHANG191_'),false,'CS21A192 no debe reemplazar Ahorcado');
assert.ok(assembler.indexOf('99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs')>assembler.indexOf('99N_HANGMAN_ROBUSTNESS_QA_CS21A191.gs'));
assert.ok(complete.includes('// BLOQUE 15/15: 99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs'));
new vm.Script(complete,{filename:completePath});

const cacheValues=new Map();
const events=[];
let writes=0;
let builds=0;
let baseInvalidations=0;
let genericCloseCalls=0;
let lockAllowed=true;
let canonicalRow=null;

const clone=value=>JSON.parse(JSON.stringify(value));
const text=value=>String(value==null?'':value).trim();
const upper=value=>text(value).toUpperCase();
const iso=value=>(value instanceof Date?value:new Date(value)).toISOString();

function packageFor({revision=1,turn=1,active='P1',endsAt=Date.now()+30000,attempt=null,board=1}={}){
  const other=active==='P1'?'P2':'P1';
  const turnState={
    participation_policy:'RANDOM_PLAYER',player_order:['P1','P2'],player_cursor:active==='P1'?0:1,
    team_order:[],team_cursor:0,team_player_orders:{},team_player_cursors:{},
    active_player_id:active,active_team_id:'',turn_number:turn,
    turn_started_at:iso(endsAt-5000),turn_ends_at:iso(endsAt),last_player_id:other,last_team_id:'',reason:'TEST'
  };
  return {
    room:{room_code:'LAB-192',game_id:'MEMORY_MATCH'},
    rules:{round_duration_ms:5000},
    state:{phase:'OPEN',active_player_id:active,active_team_id:'',started_at:turnState.turn_started_at,ends_at:turnState.turn_ends_at},
    turn_state:turnState,
    state_revision:revision,
    shared_state:{state_revision:revision,board_version:board,matched_pair_ids:[],claimed_pairs:{},discovered_cards:{},active_attempt:attempt,completed:false,last_action_key:''}
  };
}

function rowFor(pkg,{id='ELIVE-192',code='LAB-192',game='MEMORY_MATCH'}={}){
  return {
    ROOM_ID:id,ROOM_CODE:code,GAME_CODE:game,STATUS:'LIVE',CURRENT_INDEX:1,
    SETTINGS_JSON:'{"pair_count":3}',
    CURRENT_QUESTION_JSON:JSON.stringify({type:game==='MEMORY_MATCH'?'memory_match':'hangman',game_id:game,room_package:pkg})
  };
}

const sandbox={
  console:{log(){}},
  Date,JSON,Object,Math,String,Number,Array,Error,
  ELMM174_GAME_CODE:'MEMORY_MATCH',
  CS21A189_MM_MISMATCH_REVEAL_MS:2200,
  ELIVE_PLAYERS_SHEET:'PLAYERS',ELIVE_PLAYERS_HEADERS:[],
  _elive176Text_:text,
  _elive176Upper_:upper,
  _elive176Iso_:iso,
  _elive176Timestamp_:value=>{const parsed=Date.parse(value);return Number.isFinite(parsed)?parsed:0;},
  _elive176Json_:(value,fallback={})=>{try{return value&&typeof value==='object'?value:(value?JSON.parse(String(value)):fallback);}catch{return fallback;}},
  _elive176Current_:room=>{try{return JSON.parse(room?.CURRENT_QUESTION_JSON||'{}');}catch{return {}; }},
  _elive176Package_:room=>{try{return JSON.parse(room?.CURRENT_QUESTION_JSON||'{}').room_package||null;}catch{return null;}},
  _elive176NextTurn_:(current,now,duration,reason)=>{
    const next=clone(current||{});
    next.turn_number=Number(current?.turn_number||0)+1;
    next.player_cursor=(Number(current?.player_cursor||0)+1)%Math.max(1,current?.player_order?.length||1);
    next.active_player_id=current?.player_order?.[next.player_cursor]||'';
    next.turn_started_at=iso(now);
    next.turn_ends_at=iso(now.getTime()+duration);
    next.reason=reason;
    return next;
  },
  _elive176CanAct_:(turn,player)=>text(turn?.active_player_id)===text(player?.player_id),
  _elive180CacheKey_:(prefix,value)=>`EL180|${prefix}|${text(value)}`,
  _elive180Invalidate_:()=>{baseInvalidations+=1;},
  _elive180SetCells_:(found,patch)=>{
    writes+=1;
    for(const [key,value] of Object.entries(patch||{})) found.row[upper(key)]=value;
    return found.row;
  },
  _elive180FindRoom_:id=>{
    if(!canonicalRow) return null;
    if(text(id)!==text(canonicalRow.ROOM_ID)&&text(id)!==text(canonicalRow.ROOM_CODE)) return null;
    return {row:canonicalRow,index:{CURRENT_QUESTION_JSON:0},sheet:{},rowNumber:2};
  },
  _elive180BuildSnapshot_:room=>{
    builds+=1;
    const pkg=clone(sandbox._elive176Package_(room));
    return {ok:true,memory_match:true,room:{room_id:room.ROOM_ID,room_code:room.ROOM_CODE,game_code:room.GAME_CODE},room_package:pkg,turn_state:pkg?.turn_state||null,shared_state:pkg?.shared_state||null,leaderboard:[],team_leaderboard:[],events:[],stats:{players:2},_player_rows:[{COD_ESTUDIANTE:'P1',NOMBRE:'Chu',TEAM:'',_row:2},{COD_ESTUDIANTE:'P2',NOMBRE:'Naty',TEAM:'',_row:3}]};
  },
  _elive180ResponseCopy_:snapshot=>{const copy=clone(snapshot);delete copy._player_rows;return copy;},
  _elive180AppendEvent_:(room,type,auth,detail)=>events.push({type,detail:clone(detail)}),
  _elive176PublicRoom_:room=>({room_id:room.ROOM_ID,room_code:room.ROOM_CODE,status:room.STATUS,round_status:room.ROUND_STATUS,game_code:room.GAME_CODE}),
  _cs21a185MmRoomClosed_:room=>upper(room?.STATUS)==='CLOSED',
  _cs21a189AttemptPhase_:attempt=>upper(attempt?.phase),
  _cs21a189ClassicShared_:pkg=>{
    const shared=pkg.shared_state||{};
    shared.board_version=Math.max(1,Number(shared.board_version||1));
    shared.matched_pair_ids=Array.isArray(shared.matched_pair_ids)?shared.matched_pair_ids:[];
    shared.claimed_pairs=shared.claimed_pairs&&typeof shared.claimed_pairs==='object'?shared.claimed_pairs:{};
    shared.active_attempt=shared.active_attempt&&typeof shared.active_attempt==='object'?shared.active_attempt:null;
    pkg.shared_state=shared;
    return shared;
  },
  _cs21a189NormalizeAttempt_:(shared,turnState,now)=>{
    const attempt=shared?.active_attempt;
    if(!attempt) return false;
    const phase=upper(attempt.phase);
    const turnMismatch=Number(attempt.turn_number||0)!==Number(turnState?.turn_number||0);
    const revealExpired=phase==='MISMATCH_REVEAL'&&Date.parse(attempt.reveal_until)<=now.getTime();
    if((phase==='FIRST_REVEALED'&&turnMismatch)||revealExpired||(phase!=='FIRST_REVEALED'&&phase!=='MISMATCH_REVEAL')){
      shared.active_attempt=null;return true;
    }
    return false;
  },
  CacheService:{getScriptCache:()=>({
    get:key=>cacheValues.get(key)||null,
    put:(key,value)=>cacheValues.set(key,value),
    remove:key=>cacheValues.delete(key),
  })},
  LockService:{getScriptLock:()=>({tryLock:()=>lockAllowed,releaseLock(){}})},
  _eliveAuthTeacher_:()=>({ok:true,rol:'teacher',sesion:{nombre:'QA'}}),
  _elive180RoomIdFromBody_:body=>text(body?.room_id||body?.room_code),
  _elive180CanRoom_:()=>true,
  _cs21a183MmPresenceResponse_:(response)=>response,
  _cs21a183MmApplyPairMetadata_:(response)=>response,
  _elive180RequireLab_:()=>({allowed:true}),
  _cs21a144LiveBody_:body=>body,
  _elive180TouchPlayer_:()=>{},
  _elive180PlayerPublic_:row=>({cod_estudiante:row.COD_ESTUDIANTE,nombre:row.NOMBRE}),
  englishLabMemoryMatchGetRoomControlCS21A180:()=>({ok:true}),
  englishLabMemoryMatchGetPlayerStateCS21A180:()=>({ok:true}),
  englishLabMemoryMatchSubmitPairCS21A180:body=>sandbox.__submitImpl(body),
  englishLabLiveCloseRoom:()=>{genericCloseCalls+=1;return {ok:true,closed:true,base:true};},
  verificarMemoryMatchStartFixCS21A183:()=>({ok:true,version:'CS21A190',qa_master:'QA',qa_operational:'QA'}),
};
sandbox.global=sandbox;
sandbox.__submitImpl=()=>({ok:false,error:'not_configured'});

vm.createContext(sandbox);
new vm.Script(source,{filename:sourcePath}).runInContext(sandbox);
assert.equal(sandbox.CS21A192_MM_MISMATCH_REVEAL_MS,6000);
assert.equal(sandbox.CS21A189_MM_MISMATCH_REVEAL_MS,6000);
const verifier=sandbox.verificarMemoryMatchStartFixCS21A183();
assert.equal(verifier.ok,true);
assert.equal(verifier.expected_state_revision_guard,true);
assert.equal(verifier.expected_turn_number_guard,true);
assert.equal(verifier.preconditions_checked_under_submit_lock,true);
assert.equal(verifier.stale_action_rejected_without_mutation,true);
assert.equal(verifier.state_conflict_returns_current_package,true);
assert.equal(verifier.timeout_event_cache_invalidated,true);

// Ejecuta el submit real de 99K con 99O cargado encima. El helper se instrumenta
// para demostrar que revision y turno se comparan mientras el ScriptLock sigue
// tomado, antes de construir snapshot o escribir una celda.
let hookLockHeld=false;
let hookWrites=0;
let hookBuilds=0;
let hookRow=rowFor(packageFor({revision:70,turn:4,active:'P1',endsAt:Date.now()+4000}));
const hookSandbox={
  console:{log(){}},Date,JSON,Object,Math,String,Number,Array,Error,isFinite,
  ELMM174_GAME_CODE:'MEMORY_MATCH',
  ELIVE_PLAYERS_SHEET:'PLAYERS',ELIVE_PLAYERS_HEADERS:[],
  _elive176Text_:text,_elive176Upper_:upper,_elive176Iso_:iso,
  _elive176Timestamp_:value=>{const parsed=Date.parse(value);return Number.isFinite(parsed)?parsed:0;},
  _elive176Json_:(value,fallback={})=>{try{return value&&typeof value==='object'?value:(value?JSON.parse(String(value)):fallback);}catch{return fallback;}},
  _elive176Current_:room=>{try{return JSON.parse(room?.CURRENT_QUESTION_JSON||'{}');}catch{return {}; }},
  _elive176Package_:room=>{try{return JSON.parse(room?.CURRENT_QUESTION_JSON||'{}').room_package||null;}catch{return null;}},
  _elive176NextTurn_:(current,now,duration,reason)=>({...clone(current||{}),turn_number:Number(current?.turn_number||0)+1,turn_started_at:iso(now),turn_ends_at:iso(now.getTime()+duration),reason}),
  _elive176CanAct_:(turn,player)=>text(turn?.active_player_id)===text(player?.player_id),
  _elive180RequireLab_:()=>({allowed:true}),
  _cs21a144LiveBody_:body=>body,
  _elive180RoomIdFromBody_:body=>text(body?.room_id||body?.room_code),
  _elive180FindRoom_:id=>(text(id)===text(hookRow.ROOM_ID)||text(id)===text(hookRow.ROOM_CODE))
    ? {row:hookRow,index:{CURRENT_QUESTION_JSON:0},sheet:{},rowNumber:2}:null,
  _elive180BuildSnapshot_:()=>{hookBuilds+=1;return {_player_rows:[]};},
  _cs21a188MmPlayerFromSnapshot_:()=>null,
  _elive180SetCells_:(found,patch)=>{hookWrites+=1;Object.assign(found.row,patch);return found.row;},
  _elive180Invalidate_:()=>{},
  _elive180CacheKey_:(prefix,value)=>`EL180|${prefix}|${text(value)}`,
  _cs21a185MmRoomClosed_:room=>upper(room?.STATUS)==='CLOSED',
  _elive180AppendEvent_:()=>{},
  CacheService:{getScriptCache:()=>({get:()=>null,put(){},remove(){}})},
  LockService:{getScriptLock:()=>({
    tryLock(){hookLockHeld=true;return true;},
    releaseLock(){hookLockHeld=false;},
  })},
  englishLabLiveCloseRoom:()=>({ok:true}),
  verificarMemoryMatchStartFixCS21A183:()=>({ok:true,version:'CS21A190'}),
};
hookSandbox.global=hookSandbox;
vm.createContext(hookSandbox);
new vm.Script(classicSource,{filename:classicPath}).runInContext(hookSandbox);
new vm.Script(source,{filename:sourcePath}).runInContext(hookSandbox);
const expectedGuardBase=hookSandbox._cs21a192ExpectedStateConflict_;
const expectedGuardLockSamples=[];
hookSandbox._cs21a192ExpectedStateConflict_=function (...args){
  expectedGuardLockSamples.push(hookLockHeld);
  return expectedGuardBase.apply(hookSandbox,args);
};

let hookResult=hookSandbox.englishLabMemoryMatchSubmitPairCS21A180({
  room_code:'LAB-192',player_id:'P1',expected_state_revision:69,expected_turn_number:4,
});
assert.equal(hookResult.ok,false);
assert.equal(hookResult.error,'state_conflict');
assert.equal(hookResult.actual_state_revision,70);
assert.equal(hookResult.actual_turn_number,4);
assert.equal(hookResult.room_package.state_revision,70);
assert.equal(hookWrites,0,'revision vieja no debe mutar la sala');
assert.equal(hookBuilds,0,'revision vieja debe terminar antes de construir el snapshot de accion');

hookResult=hookSandbox.englishLabMemoryMatchSubmitPairCS21A180({
  room_code:'LAB-192',player_id:'P1',expected_state_revision:70,expected_turn_number:3,
});
assert.equal(hookResult.ok,false);
assert.equal(hookResult.error,'state_conflict');
assert.equal(hookResult.actual_state_revision,70);
assert.equal(hookResult.actual_turn_number,4);
assert.equal(hookWrites,0,'turno viejo no debe mutar la sala');
assert.equal(hookBuilds,0,'turno viejo debe terminar antes de construir el snapshot de accion');

hookResult=hookSandbox.englishLabMemoryMatchSubmitPairCS21A180({
  room_code:'LAB-192',player_id:'P1',expected_state_revision:70,expected_turn_number:4,
});
assert.equal(hookResult.error,'jugador_no_registrado','precondiciones vigentes deben dejar continuar el submit real');
assert.equal(hookBuilds,1);
assert.equal(hookWrites,0);
assert.deepEqual(expectedGuardLockSamples,[true,true,true],'toda precondicion debe comprobarse dentro del ScriptLock del submit');
assert.equal(hookLockHeld,false,'el submit debe liberar el ScriptLock en todos los retornos');

// Revision monotónica y aislamiento de Ahorcado en el helper global de escritura.
canonicalRow=rowFor(packageFor({revision:7}));
let found=sandbox._elive180FindRoom_('LAB-192');
let current=sandbox._elive176Current_(canonicalRow);
sandbox._elive180SetCells_(found,{CURRENT_QUESTION_JSON:JSON.stringify(current)});
assert.equal(sandbox._elive176Package_(canonicalRow).state_revision,8);
assert.equal(sandbox._elive176Package_(canonicalRow).shared_state.state_revision,8);

const hangPkg={state_revision:4,shared_state:{state_revision:4}};
const hangRow=rowFor(hangPkg,{id:'ELIVE-HANG',code:'LAB-HANG',game:'HANGMAN'});
const hangFound={row:hangRow,index:{CURRENT_QUESTION_JSON:0},sheet:{},rowNumber:2};
sandbox._elive180SetCells_(hangFound,{CURRENT_QUESTION_JSON:hangRow.CURRENT_QUESTION_JSON});
assert.equal(sandbox._elive176Package_(hangRow).state_revision,4,'Ahorcado no debe recibir revisiones Memory Match');

// Timeout + limpieza de primera carta ocurren en una única escritura.
const expiredAttempt={phase:'FIRST_REVEALED',player_id:'P1',turn_number:1,first_card_id:'CARD-A',second_card_id:'',revealed_at:iso(Date.now()-3000),reveal_until:''};
canonicalRow=rowFor(packageFor({revision:20,turn:1,active:'P1',endsAt:Date.now()-10,attempt:expiredAttempt,board:4}));
const writesBeforeTimeout=writes;
const invalidationsBeforeTimeout=baseInvalidations;
const transition=sandbox._cs21a192AdvanceAndNormalize_(sandbox._elive180FindRoom_('ELIVE-192'));
assert.equal(transition.ok,true);
assert.equal(transition.changed,true);
assert.equal(writes-writesBeforeTimeout,1,'timeout+cleanup debe escribir CURRENT_QUESTION_JSON una sola vez');
const transitionedPkg=sandbox._elive176Package_(canonicalRow);
assert.equal(transitionedPkg.turn_state.turn_number,2);
assert.equal(transitionedPkg.turn_state.active_player_id,'P2');
assert.equal(transitionedPkg.shared_state.active_attempt,null);
assert.equal(transitionedPkg.shared_state.board_version,5);
assert.equal(transitionedPkg.state_revision,21);
assert.deepEqual(events.slice(-2).map(event=>event.type),['LIVE_TURN_TIMEOUT','MEMORY_MATCH_TRANSIENT_REVEAL_CLEARED']);
assert.equal(baseInvalidations-invalidationsBeforeTimeout,2,'debe invalidar al escribir estado y otra vez tras anexar bitácora');

// Fallar el lock devuelve retry tipado y jamás entrega el row vencido.
canonicalRow=rowFor(packageFor({revision:30,endsAt:Date.now()-10}));
lockAllowed=false;
const writesBeforeBusy=writes;
const busy=sandbox._cs21a192AdvanceAndNormalize_(sandbox._elive180FindRoom_('LAB-192'));
assert.equal(busy.ok,false);
assert.equal(busy.error,'state_transition_busy');
assert.equal('row' in busy,false);
assert.equal(writes,writesBeforeBusy);
assert.throws(()=>sandbox._elive180MaybeAdvanceTurn_(sandbox._elive180FindRoom_('LAB-192')),/CS21A192_STATE_TRANSITION_BUSY/);
lockAllowed=true;

// Refetch canónico + clave por revisión: un caller rev31 no puede poblar rev32.
canonicalRow=rowFor(packageFor({revision:32,endsAt:Date.now()+30000}));
const staleRow=rowFor(packageFor({revision:31,endsAt:Date.now()+30000}));
cacheValues.clear();
const canonical=sandbox._cs21a192CanonicalSnapshot_(staleRow);
assert.equal(canonical.ok,true);
assert.equal(canonical.snapshot.state_revision,32);
assert.match(canonical.cache_key,/ELIVE-192\|R32$/);
assert.equal(canonical.snapshot.room_package.state_revision,32);
assert.equal(canonical.snapshot.shared_state.state_revision,32);
assert.ok(canonical.snapshot.server_now_ms>0);
assert.ok(canonical.snapshot.turn_remaining_ms>0);

// server_now se genera fuera del cache, incluso si la copia cacheada es antigua.
const cached=JSON.parse(cacheValues.get(canonical.cache_key));
cached.room_package.server_now='2000-01-01T00:00:00.000Z';
cached.room_package.server_now_ms=1;
cacheValues.set(canonical.cache_key,JSON.stringify(cached));
const freshClock=sandbox._cs21a192CanonicalSnapshot_(staleRow);
assert.ok(freshClock.snapshot.server_now_ms>1);
assert.notEqual(freshClock.snapshot.room_package.server_now,'2000-01-01T00:00:00.000Z');

// Invalidación canónica cubre ROOM_ID y ROOM_CODE sin tocar entradas Hangman.
const revisionKeys=sandbox._cs21a192SnapshotKeys_(canonicalRow,sandbox._elive176Package_(canonicalRow));
assert.equal(revisionKeys.length,2);
assert.ok(revisionKeys.some(key=>key.includes('ELIVE-192')));
assert.ok(revisionKeys.some(key=>key.includes('LAB-192')));
for(const key of revisionKeys) cacheValues.set(key,'stale');
sandbox._elive180Invalidate_(canonicalRow);
for(const key of revisionKeys) assert.equal(cacheValues.has(key),false);
const hangKey='EL192|STATE|ELIVE-HANG|R4';
cacheValues.set(hangKey,'hangman');
sandbox._elive180Invalidate_(hangRow);
assert.equal(cacheValues.get(hangKey),'hangman');
assert.ok(baseInvalidations>=2);

// Reveal/pair: la escritura base sube revisión y el wrapper responde el paquete canónico.
canonicalRow=rowFor(packageFor({revision:40,endsAt:Date.now()+30000}));
cacheValues.clear();
sandbox.__submitImpl=body=>{
  const localFound=sandbox._elive180FindRoom_(body.room_code);
  const localCurrent=sandbox._elive176Current_(localFound.row);
  const localPkg=localCurrent.room_package;
  localPkg.shared_state.board_version+=1;
  localPkg.shared_state.active_attempt={phase:'FIRST_REVEALED',player_id:'P1',turn_number:1,first_card_id:'CARD-A',second_card_id:'',revealed_at:iso(Date.now()),reveal_until:''};
  localCurrent.room_package=localPkg;
  sandbox._elive180SetCells_(localFound,{CURRENT_QUESTION_JSON:JSON.stringify(localCurrent)});
  return {ok:true,accepted:true,action:'DISCOVER_CARD',room_package:localPkg,turn_state:localPkg.turn_state,shared_state:localPkg.shared_state};
};
const submit=sandbox.englishLabMemoryMatchSubmitPairCS21A180({room_code:'LAB-192'});
assert.equal(submit.ok,true);
assert.equal(submit.accepted,true);
assert.equal(submit.state_revision,41);
assert.equal(submit.room_package.state_revision,41);
assert.equal(submit.shared_state.state_revision,41);

// Cerrar ronda y cerrar sala también son mutaciones revisionadas de una sola escritura.
canonicalRow=rowFor(packageFor({revision:50,endsAt:Date.now()+30000}));
canonicalRow.ROUND_STATUS='OPEN';
let writesBeforeClose=writes;
const roundClose=sandbox.englishLabMemoryMatchCloseRound({room_id:'ELIVE-192'});
assert.equal(roundClose.ok,true);
assert.equal(writes-writesBeforeClose,1);
assert.equal(canonicalRow.STATUS,'LIVE');
assert.equal(canonicalRow.ROUND_STATUS,'CLOSED');
assert.equal(sandbox._elive176Package_(canonicalRow).state.phase,'COMPLETE');
assert.equal(sandbox._elive176Package_(canonicalRow).state_revision,51);

canonicalRow=rowFor(packageFor({revision:60,endsAt:Date.now()+30000}));
canonicalRow.ROUND_STATUS='OPEN';
writesBeforeClose=writes;
const roomClose=sandbox.englishLabLiveCloseRoom({room_id:'ELIVE-192'});
assert.equal(roomClose.ok,true);
assert.equal(writes-writesBeforeClose,1);
assert.equal(canonicalRow.STATUS,'CLOSED');
assert.equal(canonicalRow.ROUND_STATUS,'CLOSED');
assert.equal(sandbox._elive176Package_(canonicalRow).state_revision,61);

canonicalRow=hangRow;
const hangClose=sandbox.englishLabLiveCloseRoom({room_id:'ELIVE-HANG'});
assert.equal(hangClose.base,true);
assert.equal(genericCloseCalls,1,'el cierre genérico no Memory Match debe conservar su base');

console.log(JSON.stringify({
  verdict:'PASS_MEMORY_MATCH_SYNC_CONSISTENCY_CS21A192',
  atomic_timeout_cleanup:true,
  timeout_state_writes:1,
  lock_failure_returns_retry:true,
  stale_snapshot_resurrection_blocked:true,
  revision_keyed_snapshot:true,
  canonical_room_id_and_code:true,
  fresh_server_now_outside_cache:true,
  mismatch_reveal_ms:sandbox.CS21A192_MM_MISMATCH_REVEAL_MS,
  monotonic_state_revision:true,
  submit_response_revisioned:true,
  stale_revision_action_rejected:true,
  stale_turn_action_rejected:true,
  matching_preconditions_continue:true,
  preconditions_checked_under_submit_lock:true,
  state_conflict_returns_current_package:true,
  timeout_event_cache_invalidated:true,
  revisioned_round_close:true,
  revisioned_room_close:true,
  hangman_router_untouched:true,
  snapshot_builds:builds,
},null,2));
