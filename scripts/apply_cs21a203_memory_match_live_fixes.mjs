import fs from 'node:fs';

function read(path){ return fs.readFileSync(path,'utf8'); }
function write(path,text){ fs.writeFileSync(path,text,'utf8'); }
function replaceExact(text, oldText, newText, label){
  const count=text.split(oldText).length-1;
  if(count!==1) throw new Error(`${label}: se esperaba 1 coincidencia y hubo ${count}`);
  return text.replace(oldText,newText);
}

// ---------------------------------------------------------------------------
// 1) English LAB Live: presencia pre-start, start inmediato y rejoin/F5 robusto
// ---------------------------------------------------------------------------
{
  const path='src/english_lab_live.jsx';
  let s=read(path);

  s=replaceExact(s,
`  function liveStudentCode(usuario){
    const u = liveSessionUser(usuario);
    return clean(u.codigo || u.CODIGO || u.cod_estudiante || u.COD_ESTUDIANTE || u.cedula || u.CEDULA || u.identificacion || '');
  }
  function publicCode(v){ return upper(v).replace(/[^A-Z0-9-]/g,'').slice(0,12); }`,
`  function liveStudentCode(usuario){
    const u = liveSessionUser(usuario);
    return clean(u.codigo || u.CODIGO || u.cod_estudiante || u.COD_ESTUDIANTE || u.cedula || u.CEDULA || u.identificacion || '');
  }
  function livePlayerId(player){
    return clean(player && (player.cod_estudiante || player.player_id || player.playerId || player.codigo_estudiante || player.COD_ESTUDIANTE || player.id));
  }
  function publicCode(v){ return upper(v).replace(/[^A-Z0-9-]/g,'').slice(0,12); }`,
  'livePlayerId');

  s=replaceExact(s,
`    const load=React.useCallback(async()=>{
      if(!roomId) return;
      setLoading(true); setError('');
      try{
        const endpoint = memoryMatch ? 'englishLabMemoryMatchGetRoomControl' : 'englishLabLiveGetRoomControl';
        const r=await postLive(endpoint,{room_id:roomId},45000);
        setData(currentState=>freshestLiveState(currentState,r));
      }
      catch(e){ setError(e.message || String(e)); }
      finally{ setLoading(false); }
    },[roomId,memoryMatch]);
    React.useEffect(()=>{ load(); },[load]);

    async function action(fn,payload={}){
      setBusy(true); setError('');
      try{
        await postLive(fn,{room_id:roomId,...payload},45000);
        await load();
        onChanged && onChanged();
      }catch(e){ setError(e.message || String(e)); }
      finally{ setBusy(false); }
    }`,
`    const load=React.useCallback(async(options={})=>{
      if(!roomId) return;
      const silent=!!(options && options.silent===true);
      if(!silent){ setLoading(true); setError(''); }
      try{
        const endpoint = memoryMatch ? 'englishLabMemoryMatchGetRoomControl' : 'englishLabLiveGetRoomControl';
        const r=await postLive(endpoint,{room_id:roomId,silent_poll:silent},45000);
        setData(currentState=>freshestLiveState(currentState,r));
        return r;
      }
      catch(e){ if(!silent) setError(e.message || String(e)); return null; }
      finally{ if(!silent) setLoading(false); }
    },[roomId,memoryMatch]);
    React.useEffect(()=>{ load(); },[load]);
    React.useEffect(()=>{
      // CS21A203: antes de existir room_package también debe haber un dueño de
      // presencia. Al aparecer el paquete, el adaptador CS192 toma el polling.
      if(!memoryMatch || memoryPackage || status!=='CREATED') return undefined;
      let disposed=false;
      let inFlight=false;
      async function pollLobby(){
        if(disposed || inFlight) return;
        inFlight=true;
        try{ await load({silent:true}); } finally{ inFlight=false; }
      }
      pollLobby();
      const id=setInterval(pollLobby,1000);
      return ()=>{ disposed=true; clearInterval(id); };
    },[memoryMatch,memoryPackage,status,load]);

    async function action(fn,payload={}){
      setBusy(true); setError('');
      try{
        const r=await postLive(fn,{room_id:roomId,...payload},45000);
        // StartRoom ya devuelve el paquete COUNTDOWN autoritativo. Adoptarlo
        // de inmediato conserva la mayor parte posible del 5-4-3-2-1.
        if(memoryMatch && r && r.room_package){
          setData(currentState=>freshestLiveState(currentState,r));
        }else{
          await load();
        }
        onChanged && onChanged();
      }catch(e){ setError(e.message || String(e)); }
      finally{ setBusy(false); }
    }`,
  'teacher lobby/start');

  s=replaceExact(s,
`    React.useEffect(()=>{ setSelected(''); setQuestionStartedAt(Date.now()); },[qIndex, answer?.answer_value]);
    const loadState=React.useCallback(async(pid=playerId, code=roomCode)=>{
      const rc=publicCode(code);
      if(!rc) return;
      setLoading(true); setError('');
      try{
        const payload={room_code:rc, player_id:pid || '', player_name:playerName || '', cod_estudiante:studentCode || ''};
        let r=await postLive(isMemoryMatch?'englishLabMemoryMatchGetPlayerState':'englishLabLiveGetPlayerState',payload,35000);
        if(!isMemoryMatch && window.EnglishLabMemoryMatchLiveCS21A174 && window.EnglishLabMemoryMatchLiveCS21A174.isMemoryMatchRoom(r?.room)){
          r=await postLive('englishLabMemoryMatchGetPlayerState',payload,35000);
        }
        setState(currentState=>freshestLiveState(currentState,r)); setJoined(!!(r.player && r.player.cod_estudiante));
        if(r.player && r.player.cod_estudiante){ setPlayerId(r.player.cod_estudiante); try{ localStorage.setItem('elive_player_'+rc, r.player.cod_estudiante); }catch(_){} }
      }catch(e){ setError(e.message || String(e)); }
      finally{ setLoading(false); }
    },[playerId,roomCode,playerName,studentCode,isMemoryMatch]);

    React.useEffect(()=>{
      const rc=publicCode(roomCode);
      if(!rc || playerId) return;
      try{ const saved=localStorage.getItem('elive_player_'+rc) || ''; if(saved) { setPlayerId(saved); setJoined(true); loadState(saved, rc); } }catch(_){}
    },[roomCode,playerId,loadState]);
    React.useEffect(()=>{
      // Memory Match CS21A192 tiene un solo dueño de polling dentro del adaptador.
      // Este ciclo histórico queda únicamente para los demás juegos live.
      if(!joined || !roomCode || isMemoryMatch) return;
      const id=setInterval(()=>loadState(),4000);
      return ()=>clearInterval(id);
    },[joined,roomCode,isMemoryMatch,loadState]);`,
`    React.useEffect(()=>{ setSelected(''); setQuestionStartedAt(Date.now()); },[qIndex, answer?.answer_value]);
    const loadState=React.useCallback(async(pid=playerId, code=roomCode, options={})=>{
      const rc=publicCode(code);
      if(!rc) return null;
      const silent=!!(options && options.silent===true);
      if(!silent){ setLoading(true); setError(''); }
      try{
        const payload={room_code:rc, player_id:pid || '', player_name:playerName || '', cod_estudiante:studentCode || '', silent_poll:silent};
        let r=await postLive(isMemoryMatch?'englishLabMemoryMatchGetPlayerState':'englishLabLiveGetPlayerState',payload,35000);
        if(!isMemoryMatch && window.EnglishLabMemoryMatchLiveCS21A174 && window.EnglishLabMemoryMatchLiveCS21A174.isMemoryMatchRoom(r?.room)){
          r=await postLive('englishLabMemoryMatchGetPlayerState',payload,35000);
        }
        setState(currentState=>freshestLiveState(currentState,r));
        const responsePid=livePlayerId(r && r.player);
        if(responsePid){
          setJoined(true); setPlayerId(responsePid);
          try{
            localStorage.setItem('elive_player_'+rc,responsePid);
            localStorage.setItem('elive_last_room',rc);
          }catch(_){}
        }
        return r;
      }catch(e){ if(!silent) setError(e.message || String(e)); return null; }
      finally{ if(!silent) setLoading(false); }
    },[playerId,roomCode,playerName,studentCode,isMemoryMatch]);

    React.useEffect(()=>{
      const rc=publicCode(roomCode);
      if(!rc || playerId) return;
      try{
        const saved=localStorage.getItem('elive_player_'+rc) || '';
        if(saved){ setPlayerId(saved); setJoined(true); loadState(saved,rc); }
      }catch(_){}
    },[roomCode,playerId,loadState]);
    React.useEffect(()=>{
      if(!joined || !roomCode) return undefined;
      const memoryPackageReady=!!(isMemoryMatch && state?.room_package);
      // CS192 es dueño único una vez existe room_package. Antes de StartRoom,
      // este lobby poll mantiene presencia y detecta automáticamente el inicio.
      if(memoryPackageReady) return undefined;
      let disposed=false;
      let inFlight=false;
      async function pollLobby(){
        if(disposed || inFlight) return;
        inFlight=true;
        try{ await loadState(playerId,roomCode,{silent:true}); } finally{ inFlight=false; }
      }
      if(isMemoryMatch) pollLobby();
      const id=setInterval(pollLobby,isMemoryMatch?1200:4000);
      return ()=>{ disposed=true; clearInterval(id); };
    },[joined,roomCode,isMemoryMatch,state?.room_package,playerId,loadState]);`,
  'student lobby/rejoin');

  s=replaceExact(s,
`        const r=await postLive('englishLabLiveJoinRoom',{room_code:rc, player_name:playerName, cod_estudiante:studentCode, player_id:saved || playerId},35000);
        setRoomCode(rc); setState(currentState=>freshestLiveState(currentState,r)); setJoined(true);
        const pid=clean(r.player?.cod_estudiante || saved || playerId);
        if(pid){ setPlayerId(pid); try{ localStorage.setItem('elive_player_'+rc,pid); localStorage.setItem('elive_last_room',rc); }catch(_){} }`,
`        const r=await postLive('englishLabLiveJoinRoom',{room_code:rc, player_name:playerName, cod_estudiante:studentCode, player_id:saved || playerId},35000);
        setRoomCode(rc); setState(currentState=>freshestLiveState(currentState,r));
        const pid=livePlayerId(r && r.player) || clean(saved || playerId || studentCode);
        setJoined(!!pid);
        if(pid){
          setPlayerId(pid);
          try{ localStorage.setItem('elive_player_'+rc,pid); localStorage.setItem('elive_last_room',rc); }catch(_){}
        }`,
  'join persistence');

  write(path,s);
}

// ---------------------------------------------------------------------------
// 2) CS192: DISCOVER_CARD no bloquea la segunda selección local.
//    SUBMIT_PAIR sí bloquea. La pareja continúa esperando el ACK de la primera.
// ---------------------------------------------------------------------------
{
  const path='src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx';
  let s=read(path);

  s=replaceExact(s,
`    const [error,setError]=React.useState('');
    const [busy,setBusy]=React.useState(false);
    const [lastResult,setLastResult]=React.useState(null);`,
`    const [error,setError]=React.useState('');
    const [busy,setBusy]=React.useState(false);
    const [blockingBusy,setBlockingBusy]=React.useState(false);
    const [lastResult,setLastResult]=React.useState(null);`,
  'blocking busy state');

  s=replaceExact(s,
`    async function handleSubmit(submission){
      if(typeof postLive!=='function')throw new Error('postLive no está disponible.');
      setBusy(true);setError('');
      const mutationEpoch=mutationEpochRef.current+1;`,
`    async function handleSubmit(submission){
      if(typeof postLive!=='function')throw new Error('postLive no está disponible.');
      const answerValue=submission&&submission.answer_value&&typeof submission.answer_value==='object'?submission.answer_value:{};
      const submissionAction=upper(answerValue.action||submission&&submission.action);
      const blocksInteraction=submissionAction!=='DISCOVER_CARD';
      setBusy(true);if(blocksInteraction)setBlockingBusy(true);setError('');
      const mutationEpoch=mutationEpochRef.current+1;`,
  'mutation action classification');

  s=replaceExact(s,
`      }finally{setBusy(false);}
    }`,
`      }finally{setBusy(false);if(blocksInteraction)setBlockingBusy(false);}
    }`,
  'blocking busy release');

  s=replaceExact(s,
`        mutationBusy={busy}
        onReady={props.onReady}`,
`        mutationBusy={blockingBusy}
        onReady={props.onReady}`,
  'blocking busy prop');

  write(path,s);
}

// ---------------------------------------------------------------------------
// 3) Memory Match clásico: countdown 5-4-3 autoritativo y visible.
// ---------------------------------------------------------------------------
{
  const path='src/english_lab_games/memory_match_classic_sync_cs21a189.jsx';
  let s=read(path);

  s=replaceExact(s,
`  function Timer({remainingMs,durationMs,waiting,syncingTurn,revealWaiting}) {
    const duration=Math.max(1,Number(durationMs)||1);
    const pct=Math.max(0,Math.min(100,(remainingMs/duration)*100));
    const seconds=Math.max(0,Math.ceil(remainingMs/1000));
    const transition=!!(waiting||syncingTurn||revealWaiting);
    const label=revealWaiting?'Cartas':syncingTurn?'Sincronizando turno':waiting?'Cambio de turno':'Tiempo';
    const aria=revealWaiting?\`Pareja visible, \${seconds} segundos para memorizar\`:syncingTurn?'Sincronizando cambio de turno':waiting?'Cambio de turno':\`\${seconds} segundos restantes\`;
    const value=revealWaiting?\`\${seconds}s\`:(syncingTurn||waiting)?'…':\`\${seconds}s\`;
    const fillWidth=syncingTurn?'0%':revealWaiting?\`\${pct}%\`:waiting?'100%':\`\${pct}%\`;
    return <div className={\`elmm-timer \${transition?'is-transition':''}\`} role="timer" aria-label={aria} data-reveal-waiting={revealWaiting?'true':'false'}>
      <div className="elmm-timer-copy"><span>{label}</span><strong>{value}</strong></div>
      <div className="elmm-timer-track"><div className="elmm-timer-fill" style={{width:fillWidth}}/></div>
    </div>;
  }`,
`  function Timer({remainingMs,durationMs,waiting,syncingTurn,revealWaiting,countdownMs=0,countdownDurationMs=0}) {
    const countdown=!!(waiting&&Number(countdownMs)>0&&!revealWaiting&&!syncingTurn);
    const displayMs=countdown?Math.max(0,Number(countdownMs)||0):Math.max(0,Number(remainingMs)||0);
    const duration=countdown?Math.max(1,Number(countdownDurationMs)||displayMs||1):Math.max(1,Number(durationMs)||1);
    const pct=Math.max(0,Math.min(100,(displayMs/duration)*100));
    const seconds=Math.max(0,Math.ceil(displayMs/1000));
    const transition=!!(waiting||syncingTurn||revealWaiting);
    const label=countdown?'Empieza en':revealWaiting?'Cartas':syncingTurn?'Sincronizando turno':waiting?'Cambio de turno':'Tiempo';
    const aria=countdown?\`La ronda inicia en \${seconds} segundos\`:revealWaiting?\`Pareja visible, \${seconds} segundos para memorizar\`:syncingTurn?'Sincronizando cambio de turno':waiting?'Cambio de turno':\`\${seconds} segundos restantes\`;
    const value=countdown?String(seconds):revealWaiting?\`\${seconds}s\`:(syncingTurn||waiting)?'…':\`\${seconds}s\`;
    const fillWidth=syncingTurn?'0%':countdown||revealWaiting?\`\${pct}%\`:waiting?'100%':\`\${pct}%\`;
    return <div className={\`elmm-timer \${transition?'is-transition':''}\`} role="timer" aria-label={aria} data-start-countdown={countdown?'true':'false'} data-reveal-waiting={revealWaiting?'true':'false'}>
      <div className="elmm-timer-copy"><span>{label}</span><strong>{value}</strong></div>
      <div className="elmm-timer-track"><div className="elmm-timer-fill" style={{width:fillWidth}}/></div>
    </div>;
  }`,
  'countdown timer');

  s=replaceExact(s,
`    useClockTick(!!shared.attempt);`,
`    useClockTick(phase==='COUNTDOWN'||!!shared.attempt);`,
  'countdown repaint');

  s=replaceExact(s,
`      <Timer remainingMs={timerRemainingMs} durationMs={timerDurationMs} waiting={turnStartsIn>0} revealWaiting={waitingForFlipback} syncingTurn={syncingTurn}/>
      <TurnPanel`,
`      {phase==='COUNTDOWN'&&turnStartsIn>0&&<div className="elmm-start-countdown" role="status" aria-live="polite" style={{display:'grid',placeItems:'center',gap:4,padding:'14px 18px',borderRadius:18,background:'linear-gradient(135deg,#001E47,#073B7A)',color:'#fff',boxShadow:'0 14px 30px rgba(0,30,71,.18)'}}><span style={{fontSize:11,fontWeight:950,letterSpacing:'.15em',textTransform:'uppercase'}}>Todos listos</span><strong style={{fontSize:54,lineHeight:1,fontWeight:950}}>{Math.max(1,Math.ceil(turnStartsIn/1000))}</strong><small style={{fontWeight:800,opacity:.9}}>La ronda inicia al mismo tiempo para todos</small></div>}
      <Timer remainingMs={timerRemainingMs} durationMs={timerDurationMs} waiting={turnStartsIn>0} countdownMs={turnStartsIn} countdownDurationMs={normalized.rules.autoStartDelayMs} revealWaiting={waitingForFlipback} syncingTurn={syncingTurn}/>
      <TurnPanel`,
  'countdown render');

  write(path,s);
}

console.log(JSON.stringify({
  ok:true,
  version:'CS21A203-MEMORY-LIVE-START-1',
  source_files:[
    'src/english_lab_live.jsx',
    'src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx',
    'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx'
  ],
  lobby_poll:true,
  authoritative_countdown:true,
  f5_rejoin_persistence:true,
  second_card_latency_safe:true,
  third_card_guard_preserved:true,
  apps_script_change:false
},null,2));
