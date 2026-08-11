// CS21A192 · Adaptador autoritativo de sincronización para Memory Match Live.
// Debe cargarse después del stack clásico CS21A189 y del guard visual CS21A190.
/* global React */
(function installMemoryMatchAuthoritativeSyncCS21A192(global){
  'use strict';

  const base=global.EnglishLabMemoryMatchLiveCS21A174;
  if(!base) throw new Error('Falta EnglishLabMemoryMatchLiveCS21A174 antes de CS21A192.');

  const VERSION='CS21A192';
  const SYNC_VERSION='CS21A192-MM-CONSISTENCY-2';
  const POLL_TIMEOUT_MS=8000;
  const MUTATION_TIMEOUT_MS=45000;
  const POLL_BACKOFF_CAP_MS=8000;
  const ENDPOINTS=base.ENDPOINTS;
  const POLL_TIERS=Object.freeze([
    Object.freeze({maxPlayers:5,ms:550}),
    Object.freeze({maxPlayers:10,ms:900}),
    Object.freeze({maxPlayers:15,ms:1400}),
    Object.freeze({maxPlayers:25,ms:2200}),
  ]);

  function clean(value){return String(value==null?'':value).trim();}
  function upper(value){return clean(value).toUpperCase();}
  function finite(value,fallback){const parsed=Number(value);return Number.isFinite(parsed)?parsed:Number(fallback||0);}
  function monoNow(){return global.performance&&typeof global.performance.now==='function'?global.performance.now():Date.now();}
  function timestamp(value){const parsed=typeof value==='number'?value:Date.parse(value);return Number.isFinite(parsed)?parsed:0;}
  function playerId(player){return clean(player&&(player.player_id||player.playerId||player.cod_estudiante||player.codigo_estudiante||player.COD_ESTUDIANTE||player.id));}
  function roomCode(room,pkg){return clean(pkg&&pkg.room&&(pkg.room.room_code||pkg.room.roomCode)||room&&(room.room_code||room.roomCode||room.ROOM_CODE)).toUpperCase();}
  function roomStatus(room){return upper(room&&(room.status||room.STATUS));}
  function packageFrom(state){return base.packageFromLiveState(state)||null;}
  function isTerminalState(state){
    const source=state&&typeof state==='object'?state:{};
    const pkg=packageFrom(source)||{};
    const sourceRoom=source.room||{};
    const packageRoom=pkg.room||{};
    const roomClosed=[sourceRoom,packageRoom].some(room=>roomStatus(room)==='CLOSED');
    const roundClosed=[
      source.round_status,source.ROUND_STATUS,sourceRoom.round_status,sourceRoom.ROUND_STATUS,
      pkg.round_status,pkg.roundStatus,packageRoom.round_status,packageRoom.ROUND_STATUS,pkg.round&&pkg.round.status,
    ].some(value=>upper(value)==='CLOSED');
    const phaseComplete=[source.phase,source.state&&source.state.phase,pkg.state&&pkg.state.phase].some(value=>upper(value)==='COMPLETE');
    const sharedCompleted=[source.shared_state,pkg.shared_state].some(shared=>shared&&shared.completed===true);
    return roomClosed||roundClosed||phaseComplete||sharedCompleted;
  }
  function pollMsForPlayers(count){
    const players=Math.max(1,finite(count,1));
    for(const tier of POLL_TIERS) if(players<=tier.maxPlayers) return tier.ms;
    return 3000;
  }
  function transientAttemptPhase(state){
    const source=state&&typeof state==='object'?state:{};
    const pkg=packageFrom(source)||{};
    const attempt=pkg.shared_state&&pkg.shared_state.active_attempt||source.shared_state&&source.shared_state.active_attempt||null;
    return upper(attempt&&attempt.phase);
  }
  function pollMsForState(state){
    const source=state&&typeof state==='object'?state:{};
    const normal=pollMsForPlayers(base.participantCount(source,packageFrom(source)));
    const phase=transientAttemptPhase(source);
    if(phase==='FIRST_REVEALED'||phase==='MISMATCH_REVEAL') return Math.max(250,Math.round(normal/2));
    return normal;
  }
  function pollBackoffMs(baseMs,failures){
    const baseDelay=Math.max(1,finite(baseMs,550));
    const count=Math.max(0,Math.floor(finite(failures,0)));
    if(!count) return baseDelay;
    return Math.min(POLL_BACKOFF_CAP_MS,baseDelay*Math.pow(2,Math.min(4,count-1)));
  }
  function withDeadline(factory,timeoutMs,label){
    const limit=Math.max(1,finite(timeoutMs,POLL_TIMEOUT_MS));
    let timer=0;
    const timeout=new Promise((resolve,reject)=>{
      timer=global.setTimeout(()=>{
        const error=new Error(label||`La lectura excedio ${limit} ms.`);
        error.code='CS21A192_POLL_TIMEOUT';
        reject(error);
      },limit);
    });
    const task=Promise.resolve().then(factory);
    return Promise.race([task,timeout]).finally(()=>{if(timer)global.clearTimeout(timer);});
  }
  function serverStamp(state){
    const source=state&&typeof state==='object'?state:{};
    return finite(source.server_now_ms,0)||timestamp(source.server_now);
  }
  function stateRevision(state){
    const source=state&&typeof state==='object'?state:{};
    const pkg=packageFrom(source)||{};
    const shared=pkg.shared_state||source.shared_state||{};
    return Math.max(0,finite(source.state_revision||pkg.state_revision||shared.state_revision,0));
  }
  function revisionOf(state){
    const source=state&&typeof state==='object'?state:{};
    const pkg=packageFrom(source)||{};
    const turn=pkg.turn_state||source.turn_state||{};
    const shared=pkg.shared_state||source.shared_state||{};
    const room=source.room||pkg.room||{};
    return Object.freeze({
      stateRevision:stateRevision(source),
      turnNumber:Math.max(0,finite(turn.turn_number||turn.turnNumber,0)),
      boardVersion:Math.max(0,finite(shared.board_version||shared.boardVersion,0)),
      terminal:isTerminalState(source)?1:0,
    });
  }
  function compareRevision(left,right){
    const a=left&&left.stateRevision!=null?left:revisionOf(left);
    const b=right&&right.stateRevision!=null?right:revisionOf(right);
    if(a.stateRevision!==b.stateRevision) return a.stateRevision>b.stateRevision?1:-1;
    if(a.terminal!==b.terminal) return a.terminal>b.terminal?1:-1;
    if(a.turnNumber!==b.turnNumber) return a.turnNumber>b.turnNumber?1:-1;
    if(a.boardVersion!==b.boardVersion) return a.boardVersion>b.boardVersion?1:-1;
    return 0;
  }
  function revisionKey(state){
    const value=revisionOf(state);
    return `${value.stateRevision}:${value.terminal}:${value.turnNumber}:${value.boardVersion}`;
  }
  function mergeState(current,result){
    if(!result||typeof result!=='object') return current;
    const previous=current&&typeof current==='object'?current:{};
    const merged=base.mergeLiveState(previous,result,previous.room,previous.player);
    const pkg=packageFrom(merged);
    return pkg?{
      ...merged,
      state_revision:stateRevision(merged),
      turn_state:pkg.turn_state||merged.turn_state||null,
      shared_state:pkg.shared_state||merged.shared_state||null,
    }:merged;
  }
  function chooseFreshestState(current,candidate){
    if(!current) return candidate||current;
    if(!candidate) return current;
    return compareRevision(candidate,current)<0?current:mergeState(current,candidate);
  }
  function decorateResponse(result,timing){
    if(!result||typeof result!=='object') return result;
    return {
      ...result,
      __cs21a192_received_monotonic_ms:finite(timing&&timing.receivedMono,monoNow()),
      __cs21a192_received_wall_ms:finite(timing&&timing.receivedWall,Date.now()),
      __cs21a192_request_started_monotonic_ms:finite(timing&&timing.startedMono,0),
    };
  }
  function authoritativeClock(state,pkg){
    const source=state&&typeof state==='object'?state:{};
    const roomPackage=pkg||packageFrom(source)||{};
    const turn=roomPackage.turn_state||source.turn_state||{};
    const end=timestamp(turn.turn_ends_at||roomPackage.state&&roomPackage.state.ends_at);
    const receivedMono=finite(source.__cs21a192_received_monotonic_ms,monoNow());
    const startedMono=finite(source.__cs21a192_request_started_monotonic_ms,receivedMono);
    const roundTripMs=Math.max(0,receivedMono-startedMono);
    // Con una sola marca del servidor no existe T2/T3 completo. RTT/2 es la
    // mejor aproximación disponible y se acota para que una ejecución lenta de
    // Apps Script no se confunda con latencia de regreso.
    const returnPathEstimateMs=Math.min(750,roundTripMs/2);
    const freshContract=clean(source.sync_version||roomPackage.sync_version)===SYNC_VERSION||stateRevision(source)>0;
    const rootServerNow=finite(source.server_now_ms,0)||timestamp(source.server_now);
    const remainingRaw=Number(source.turn_remaining_ms);
    const remaining=Number.isFinite(remainingRaw)?Math.max(0,remainingRaw):null;
    let serverAtAnchor=0;
    if(freshContract&&rootServerNow) serverAtAnchor=rootServerNow+returnPathEstimateMs;
    else if(freshContract&&remaining!=null&&end) serverAtAnchor=end-remaining+returnPathEstimateMs;
    else serverAtAnchor=Date.now();
    function now(){return serverAtAnchor+Math.max(0,monoNow()-receivedMono);}
    return Object.freeze({
      source:freshContract?'AUTHORITATIVE_CS21A192':'LOCAL_ABSOLUTE_FALLBACK',
      roundTripMs,
      returnPathEstimateMs,
      now,
      remainingMs(value){const target=timestamp(value);return target?Math.max(0,target-now()):0;},
      elapsedMs(value){const target=timestamp(value);return target?Math.max(0,now()-target):0;},
    });
  }
  function invalidateClientReadCache(reason){
    try{
      const sync=global.EnglishLabLiveSyncCS21A177;
      if(sync&&typeof sync.invalidateReadCache==='function') sync.invalidateReadCache(reason||'CS21A192_AUTHORITATIVE');
    }catch(_){}
  }
  function resultLabel(result){
    if(!result||typeof result!=='object') return '';
    const action=upper(result.action||result.answer_type);
    if(action==='DISCOVER_CARD') return result.accepted===false?'Primera carta ya sincronizada.':'Primera carta abierta para toda la sala.';
    if(result.correct===true) return `¡Pareja correcta! +${Number(result.points||0)} · seguís jugando`;
    if(result.correct===false) return 'No coinciden · se muestran un momento, se vuelven a tapar y cambia el turno.';
    return result.message||result.mensaje||'';
  }

  function MemoryMatchAuthoritativeLiveRoundCS21A192(props){
    const incomingState=props&&props.state||{};
    const postLive=props&&props.postLive;
    const readOnly=!!(props&&props.readOnly);
    const [liveState,setLiveState]=React.useState(incomingState);
    const [error,setError]=React.useState('');
    const [busy,setBusy]=React.useState(false);
    const [lastResult,setLastResult]=React.useState(null);
    const [turnReady,setTurnReady]=React.useState(!!global.EnglishLabTurnEngineCS21A176);
    const stateRef=React.useRef(incomingState);
    const requestSeqRef=React.useRef(0);
    const appliedSeqRef=React.useRef(0);
    const mutationEpochRef=React.useRef(0);
    const wakePollRef=React.useRef(()=>{});
    const onStateChangeRef=React.useRef(props&&props.onStateChange);
    onStateChangeRef.current=props&&props.onStateChange;

    const state=liveState&&typeof liveState==='object'?liveState:incomingState;
    const room=state.room||props.room||{};
    const player=state.player||props.player||null;
    const pkg=packageFrom(state)||props.roomPackage||null;
    const code=roomCode(room,pkg);
    const status=roomStatus(room);
    const pid=playerId(player);
    const playersOnline=base.participantCount(state,pkg);
    const pollMs=pollMsForPlayers(playersOnline);
    const currentPollMs=pollMsForState(state);
    const rev=revisionOf(state);
    const clock=React.useMemo(()=>authoritativeClock(state,pkg),[pkg,state&&state.state_revision,state&&state.server_now_ms,state&&state.turn_remaining_ms,state&&state.__cs21a192_received_monotonic_ms]);

    const applyCandidate=React.useCallback((candidate,meta)=>{
      if(!candidate||typeof candidate!=='object') return {accepted:false,reason:'INVALID'};
      if(candidate.ok===false&&!(candidate.room_package&&typeof candidate.room_package==='object')) return {accepted:false,reason:'INVALID'};
      const stateCandidate=candidate.ok===false?(()=>{
        const copy={...candidate,ok:true};
        delete copy.error;delete copy.mensaje;delete copy.retry_after_ms;
        return copy;
      })():candidate;
      const details=meta||{};
      if(details.source==='poll'&&finite(details.issuedMutationEpoch,0)<mutationEpochRef.current){
        return {accepted:false,reason:'PREDATES_MUTATION'};
      }
      const current=stateRef.current||{};
      const compared=compareRevision(stateCandidate,current);
      if(compared<0) return {accepted:false,reason:'STALE_REVISION'};
      const seq=Math.max(0,finite(details.requestSeq,0));
      if(compared===0&&seq<appliedSeqRef.current) return {accepted:false,reason:'STALE_REQUEST'};
      if(compared===0&&serverStamp(stateCandidate)&&serverStamp(current)&&serverStamp(stateCandidate)<serverStamp(current)){
        return {accepted:false,reason:'STALE_SERVER_TIME'};
      }
      const merged=mergeState(current,stateCandidate);
      stateRef.current=merged;
      appliedSeqRef.current=Math.max(appliedSeqRef.current,seq);
      setLiveState(merged);
      if(typeof onStateChangeRef.current==='function') onStateChangeRef.current(merged,{source:details.source||'unknown',revision:revisionOf(merged)});
      return {accepted:true,reason:'APPLIED',state:merged};
    },[]);

    React.useEffect(()=>{
      if(!incomingState||incomingState===stateRef.current) return;
      const currentCode=roomCode(stateRef.current&&stateRef.current.room,packageFrom(stateRef.current));
      const nextCode=roomCode(incomingState.room,packageFrom(incomingState));
      if(currentCode&&nextCode&&currentCode!==nextCode){
        stateRef.current=incomingState;
        appliedSeqRef.current=0;
        mutationEpochRef.current=0;
        setLiveState(incomingState);
        return;
      }
      if(compareRevision(incomingState,stateRef.current)>0) applyCandidate(incomingState,{source:'incoming',requestSeq:0,issuedMutationEpoch:mutationEpochRef.current});
    },[incomingState,applyCandidate]);

    React.useEffect(()=>{
      let active=true;
      Promise.all([base.ensureTurnEngine(),base.ensureSyncGuard()]).then(()=>{if(active)setTurnReady(true);}).catch(err=>{if(active)setError(err&&err.message?err.message:String(err));});
      return()=>{active=false;};
    },[]);

    React.useEffect(()=>{
      if(typeof postLive!=='function'||!code||(!readOnly&&!pid)) return undefined;
      let disposed=false;
      let timer=0;
      let inFlight=false;
      let wakeRequested=false;
      let consecutiveFailures=0;

      function clearTimer(){if(timer){global.clearTimeout(timer);timer=0;}}
      function delayForCurrent(){const current=stateRef.current||{};return pollMsForState(current);}
      function schedule(delay){
        if(disposed||isTerminalState(stateRef.current)) return;
        clearTimer();
        timer=global.setTimeout(poll,Math.max(0,finite(delay,0)));
      }
      async function poll(){
        clearTimer();
        if(disposed) return;
        if(isTerminalState(stateRef.current)) return;
        if(global.document&&global.document.visibilityState==='hidden'){schedule(500);return;}
        if(inFlight){wakeRequested=true;return;}
        inFlight=true;
        const requestSeq=++requestSeqRef.current;
        const issuedMutationEpoch=mutationEpochRef.current;
        const startedMono=monoNow();
        try{
          invalidateClientReadCache('CS21A192_AUTHORITATIVE_POLL');
          const endpoint=readOnly?ENDPOINTS.getRoomControl:ENDPOINTS.getPlayerState;
          const payload=readOnly
            ? {room_id:code,room_code:code,silent_poll:true,sync_policy:SYNC_VERSION,client_request_id:`POLL-${requestSeq}`,known_state_revision:stateRevision(stateRef.current)}
            : {room_code:code,player_id:pid,cod_estudiante:pid,silent_poll:true,sync_policy:SYNC_VERSION,client_request_id:`POLL-${requestSeq}`,known_state_revision:stateRevision(stateRef.current)};
          const result=await withDeadline(
            ()=>postLive(endpoint,payload,POLL_TIMEOUT_MS),
            POLL_TIMEOUT_MS,
            `La lectura de sala excedio ${POLL_TIMEOUT_MS} ms.`,
          );
          const received=decorateResponse(result,{startedMono,receivedMono:monoNow(),receivedWall:Date.now()});
          if(!disposed){
            applyCandidate(received,{source:'poll',requestSeq,issuedMutationEpoch});
            consecutiveFailures=0;
            setError('');
          }
        }catch(err){
          // Una lectura silenciosa fallida no ensucia la vista ni convierte un
          // snapshot anterior en nuevo. El siguiente intento usa backoff y la
          // mutacion/manual conserva su error visible independiente.
          if(!disposed)consecutiveFailures+=1;
        }finally{
          inFlight=false;
          if(!disposed&&!isTerminalState(stateRef.current)){
            const delay=wakeRequested?0:pollBackoffMs(delayForCurrent(),consecutiveFailures);
            wakeRequested=false;
            schedule(delay);
          }
        }
      }
      function wake(){
        if(disposed||isTerminalState(stateRef.current))return;
        wakeRequested=true;
        if(!inFlight){wakeRequested=false;schedule(0);}
      }
      function onVisibility(){if(!global.document||global.document.visibilityState!=='hidden')wake();}
      wakePollRef.current=wake;
      schedule(0);
      if(global.document&&typeof global.document.addEventListener==='function')global.document.addEventListener('visibilitychange',onVisibility);
      return()=>{
        disposed=true;
        clearTimer();
        wakePollRef.current=()=>{};
        if(global.document&&typeof global.document.removeEventListener==='function')global.document.removeEventListener('visibilitychange',onVisibility);
      };
    },[readOnly,postLive,code,pid,applyCandidate]);

    if(!pkg)return <div role="status" style={{padding:16,border:'1px solid #FFD88A',background:'#FFF7E6',borderRadius:14,color:'#7A4B00',fontWeight:800}}>Esperando el paquete de tarjetas de la sala…</div>;
    if(typeof global.MemoryMatchGameCS21A173!=='function')return <div role="alert" style={{padding:16,border:'1px solid #F5B5B5',background:'#FDECEA',borderRadius:14,color:'#8B1F1F',fontWeight:800}}>El motor Memory Match no terminó de cargar.</div>;
    if(pkg.turn_state&&!turnReady)return <div role="status" style={{padding:16,border:'1px solid #B7D5FF',background:'#EEF4FF',borderRadius:14,color:'#073B7A',fontWeight:800}}>Cargando turnos de la sala…</div>;

    async function handleSubmit(submission){
      if(typeof postLive!=='function')throw new Error('postLive no está disponible.');
      setBusy(true);setError('');
      const mutationEpoch=mutationEpochRef.current+1;
      mutationEpochRef.current=mutationEpoch;
      const initialSeq=++requestSeqRef.current;
      const currentRevision=revisionOf(stateRef.current);
      const actionId=`MM-${code}-${pid}-${currentRevision.turnNumber}-${initialSeq}-${Date.now()}`;
      const initialPayload={
        ...base.submitPayload(submission,room,pkg,player),
        action_id:actionId,
        client_request_id:actionId,
        expected_state_revision:currentRevision.stateRevision,
        expected_turn_number:currentRevision.turnNumber,
        sync_policy:SYNC_VERSION,
      };
      async function executeMutation(payload,requestSeq){
        invalidateClientReadCache('CS21A192_AUTHORITATIVE_MUTATION');
        const startedMono=monoNow();
        const result=await postLive(ENDPOINTS.submitPair,payload,MUTATION_TIMEOUT_MS);
        const received=decorateResponse(result,{startedMono,receivedMono:monoNow(),receivedWall:Date.now()});
        applyCandidate(received,{source:'mutation',requestSeq,issuedMutationEpoch:mutationEpoch});
        return received;
      }
      try{
        let received=await executeMutation(initialPayload,initialSeq);
        if(received&&received.ok===false&&upper(received.error)==='STATE_CONFLICT'&&received.room_package){
          const fresh=revisionOf(received);
          if(fresh.stateRevision>0){
            const retrySeq=++requestSeqRef.current;
            received=await executeMutation({
              ...initialPayload,
              client_request_id:`${actionId}-R1`,
              expected_state_revision:fresh.stateRevision,
              expected_turn_number:fresh.turnNumber,
            },retrySeq);
          }
        }
        setLastResult(received||null);
        if(received&&received.ok===false)setError(received.mensaje||received.message||received.error||'La jugada no fue aceptada.');
        else setError('');
        wakePollRef.current();
        return received;
      }catch(err){
        const message=err&&err.message?err.message:String(err);
        setError(message);wakePollRef.current();throw err;
      }finally{setBusy(false);}
    }

    return <div
      data-live-game="MEMORY_MATCH"
      data-authoritative-sync="true"
      data-version={VERSION}
      data-state-revision={rev.stateRevision}
      data-turn-number={rev.turnNumber}
      data-board-version={rev.boardVersion}
      data-live-poll-ms={pollMs}
      data-live-current-poll-ms={currentPollMs}
      data-live-poll-timeout-ms={POLL_TIMEOUT_MS}
      data-live-players={playersOnline}
      data-live-terminal={isTerminalState(state)?'true':'false'}
      data-clock-source={clock.source}
      style={{display:'grid',gap:12}}>
      {error&&<div role="alert" style={{padding:'10px 12px',border:'1px solid #F5B5B5',background:'#FDECEA',borderRadius:12,color:'#8B1F1F',fontWeight:800}}>{error}</div>}
      {busy&&<div role="status" style={{fontSize:12,fontWeight:900,color:'#073B7A'}}>Sincronizando jugada…</div>}
      {lastResult&&resultLabel(lastResult)&&<div aria-live="polite" style={{fontSize:12,fontWeight:900,color:lastResult.correct?'#145C38':'#073B7A'}}>{resultLabel(lastResult)}</div>}
      <global.MemoryMatchGameCS21A173
        roomPackage={pkg}
        player={player}
        turnEngine={global.EnglishLabTurnEngineCS21A176||null}
        authoritativeClock={clock}
        authoritativeOnly={true}
        mutationBusy={busy}
        onReady={props.onReady}
        onSubmit={handleSubmit}
        onTimeout={props.onTimeout}
        onComplete={props.onComplete}
        readOnly={readOnly}/>
    </div>;
  }

  MemoryMatchAuthoritativeLiveRoundCS21A192.__cs21a189ClassicSyncAdapter=true;
  MemoryMatchAuthoritativeLiveRoundCS21A192.__cs21a192AuthoritativeSyncAdapter=true;
  const api=Object.freeze({
    ...base,
    VERSION,
    SYNC_VERSION,
    POLL_TIERS,
    POLL_TIMEOUT_MS,
    MUTATION_TIMEOUT_MS,
    POLL_BACKOFF_CAP_MS,
    LIVE_POLL_MS:550,
    READ_ONLY_POLL_MS:550,
    livePollMsForPlayers:pollMsForPlayers,
    livePollMsForState:pollMsForState,
    pollBackoffMs,
    isTerminalState,
    stateRevision,
    revisionOf,
    revisionKey,
    compareRevision,
    mergeState,
    chooseFreshestState,
    authoritativeClock,
    component:MemoryMatchAuthoritativeLiveRoundCS21A192,
    authoritativeSync:true,
  });
  global.MemoryMatchLiveRoundCS21A174=MemoryMatchAuthoritativeLiveRoundCS21A192;
  global.EnglishLabMemoryMatchLiveCS21A174=api;
  global.EnglishLabMemoryMatchAuthoritativeSyncCS21A192=api;
})(window);
