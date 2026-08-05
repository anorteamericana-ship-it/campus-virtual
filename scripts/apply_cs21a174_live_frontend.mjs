#!/usr/bin/env node
import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`CS21A174: no se encontró ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`CS21A174: ${label} aparece más de una vez`);
  return source.slice(0, first) + after + source.slice(first + before.length);
}

function update(path, transform) {
  const before = fs.readFileSync(path, 'utf8');
  const after = transform(before);
  if (after === before) {
    console.log(`CS21A174: ${path} ya estaba actualizado.`);
    return false;
  }
  fs.writeFileSync(path, after, 'utf8');
  console.log(`CS21A174: actualizado ${path}.`);
  return true;
}

update('src/app.jsx', source => replaceOnce(
  source,
  "  english_lab_live: ['src/english_lab_live.jsx?v=F98.4Z6CS20H'],",
  `  english_lab_live: [
    'src/english_lab_games/english_lab_runtime_cs21a173.js?v=CS21A173',
    'src/english_lab_games/memory_match_engine_cs21a173.jsx?v=CS21A174',
    'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx?v=CS21A174',
    'src/english_lab_live.jsx?v=F98.4Z6CS21A174'
  ],`,
  'F96_LAZY.english_lab_live'
));

update('src/english_lab_games/memory_match_engine_cs21a173.jsx', source => {
  source = replaceOnce(
    source,
    "    const phase = normalized.state.phase;\n    const active = phase === 'OPEN' || phase === 'COUNTDOWN';\n    const remainingMs = useServerTimer(normalized.clock, normalized.state.endsAt, active);",
    `    const configuredPhase = normalized.state.phase;
    const countdownRemainingMs = configuredPhase === 'COUNTDOWN'
      ? normalized.clock.remainingMs(normalized.state.startedAt)
      : 0;
    const phase = configuredPhase === 'COUNTDOWN' && countdownRemainingMs <= 0 ? 'OPEN' : configuredPhase;
    const timerTarget = phase === 'COUNTDOWN' ? normalized.state.startedAt : normalized.state.endsAt;
    const active = phase === 'OPEN' || phase === 'COUNTDOWN';
    const remainingMs = useServerTimer(normalized.clock, timerTarget, active);`,
    'fase efectiva del motor'
  );
  source = replaceOnce(
    source,
    "    const canPlay = phase === 'OPEN' && !locked && remainingMs > 0;",
    "    const canPlay = phase === 'OPEN' && !(props && props.readOnly) && !locked && remainingMs > 0;",
    'modo lectura del motor'
  );
  source = replaceOnce(
    source,
    "      <TimerBar remainingMs={remainingMs} durationMs={normalized.rules.roundDurationMs}/>",
    "      <TimerBar remainingMs={remainingMs} durationMs={phase==='COUNTDOWN'?normalized.rules.autoStartDelayMs:normalized.rules.roundDurationMs}/>",
    'duración visual de countdown'
  );
  return source;
});

update('src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx', source => replaceOnce(
  source,
  "        onComplete={props.onComplete}/>",
  "        onComplete={props.onComplete}\n        readOnly={!!props.readOnly}/>",
  'prop readOnly del adapter'
));

update('src/english_lab_live.jsx', source => {
  source = replaceOnce(source, "  const VERSION = 'F98.4-Z6-CS20H';", "  const VERSION = 'F98.4-Z6-CS21A174';", 'versión Live');
  source = replaceOnce(
    source,
    "  const GAME_TYPES = [\n    { code:'VOCAB_SPRINT', label:'Vocabulary Sprint', area:'Vocabulario', note:'Rondas rápidas de vocabulario.' },",
    "  const GAME_TYPES = [\n    { code:'MEMORY_MATCH', label:'Memory Match', area:'Vocabulario visual', note:'Tarjetas palabra, imagen o audio; individual o por equipos.' },\n    { code:'VOCAB_SPRINT', label:'Vocabulary Sprint', area:'Vocabulario', note:'Rondas rápidas de vocabulario.' },",
    'catálogo Memory Match'
  );

  source = replaceOnce(
    source,
    "    const currentIndex=Number(room.current_index || room.CURRENT_INDEX || 0) || 0;\n\n    const load=React.useCallback(async()=>{\n      if(!roomId) return;\n      setLoading(true); setError('');\n      try{ const r=await postLive('englishLabLiveGetRoomControl',{room_id:roomId},45000); setData(r); }\n      catch(e){ setError(e.message || String(e)); }\n      finally{ setLoading(false); }\n    },[roomId]);",
    `    const currentIndex=Number(room.current_index || room.CURRENT_INDEX || 0) || 0;
    const memoryMatch = !!(window.EnglishLabMemoryMatchLiveCS21A174 && window.EnglishLabMemoryMatchLiveCS21A174.isMemoryMatchRoom(room));
    const memoryPackage = data?.room_package || null;

    const load=React.useCallback(async()=>{
      if(!roomId) return;
      setLoading(true); setError('');
      try{
        const endpoint = memoryMatch ? 'englishLabMemoryMatchGetRoomControl' : 'englishLabLiveGetRoomControl';
        const r=await postLive(endpoint,{room_id:roomId},45000);
        setData(r);
      }
      catch(e){ setError(e.message || String(e)); }
      finally{ setLoading(false); }
    },[roomId,memoryMatch]);`,
    'carga de control Memory Match'
  );

  source = replaceOnce(
    source,
    "    if(projector){\n      return <LiveProjectionView room={room} question={current || questions[Math.max(0,nextIndex-1)]} leaderboard={leaderboard} teamLeaderboard={teamLeaderboard} stats={data?.stats || {}} onExit={()=>setProjector(false)} onRefresh={load} loading={loading}/>;\n    }",
    `    if(projector){
      if(memoryMatch && memoryPackage && typeof MemoryMatchLiveRoundCS21A174 === 'function'){
        return <div style={{minHeight:'calc(100vh - 40px)',padding:18,background:'#EAF0F7',borderRadius:24}}>
          <div style={{display:'flex',justifyContent:'space-between',gap:10,marginBottom:12,flexWrap:'wrap'}}>
            <button className="btn btn-primary" type="button" onClick={()=>setProjector(false)}>Volver al control</button>
            <button className="btn btn-ghost" type="button" onClick={load}>Actualizar</button>
          </div>
          <MemoryMatchLiveRoundCS21A174 state={{...data,room,room_package:memoryPackage}} postLive={postLive} onRefresh={load} readOnly={true}/>
        </div>;
      }
      return <LiveProjectionView room={room} question={current || questions[Math.max(0,nextIndex-1)]} leaderboard={leaderboard} teamLeaderboard={teamLeaderboard} stats={data?.stats || {}} onExit={()=>setProjector(false)} onRefresh={load} loading={loading}/>;
    }`,
    'proyector Memory Match'
  );

  source = replaceOnce(
    source,
    "          {loading ? <Alert>Cargando control de ronda…</Alert> : <QuestionCard question={current || questions[Math.max(0,nextIndex-1)]} showAnswer={round==='CLOSED' || status==='CLOSED'}/>} ",
    "          {loading ? <Alert>Cargando control de ronda…</Alert> : memoryMatch && memoryPackage && typeof MemoryMatchLiveRoundCS21A174 === 'function' ? <MemoryMatchLiveRoundCS21A174 state={{...data,room,room_package:memoryPackage}} postLive={postLive} onRefresh={load} readOnly={true}/> : <QuestionCard question={current || questions[Math.max(0,nextIndex-1)]} showAnswer={round==='CLOSED' || status==='CLOSED'}/>} ",
    'tablero docente Memory Match'
  );

  source = replaceOnce(
    source,
    "              {canStart && <button className=\"btn btn-primary\" type=\"button\" disabled={busy} onClick={()=>action('englishLabLiveStartRoom')}>Iniciar sala</button>}\n              {canLaunch && <button className=\"btn btn-primary\" type=\"button\" disabled={busy||!total} onClick={()=>action('englishLabLiveLaunchQuestion',{question_index:nextIndex})}>{closedOrStarted?'Lanzar siguiente pregunta':'Lanzar pregunta 1'}</button>}\n              {canCloseRound && <button className=\"btn btn-primary\" type=\"button\" disabled={busy} onClick={()=>action('englishLabLiveCloseRound')}>Cerrar pregunta</button>}",
    "              {canStart && <button className=\"btn btn-primary\" type=\"button\" disabled={busy} onClick={()=>action(memoryMatch?'englishLabMemoryMatchStartRoom':'englishLabLiveStartRoom')}>{memoryMatch?'Iniciar Memory Match':'Iniciar sala'}</button>}\n              {!memoryMatch && canLaunch && <button className=\"btn btn-primary\" type=\"button\" disabled={busy||!total} onClick={()=>action('englishLabLiveLaunchQuestion',{question_index:nextIndex})}>{closedOrStarted?'Lanzar siguiente pregunta':'Lanzar pregunta 1'}</button>}\n              {canCloseRound && <button className=\"btn btn-primary\" type=\"button\" disabled={busy} onClick={()=>action(memoryMatch?'englishLabMemoryMatchCloseRound':'englishLabLiveCloseRound')}>{memoryMatch?'Cerrar ronda':'Cerrar pregunta'}</button>}",
    'controles de ronda Memory Match'
  );

  source = replaceOnce(
    source,
    "    const qIndex=Number(question?.index || room.current_index || 0) || 0;",
    "    const qIndex=Number(question?.index || room.current_index || 0) || 0;\n    const isMemoryMatch=!!(window.EnglishLabMemoryMatchLiveCS21A174 && window.EnglishLabMemoryMatchLiveCS21A174.isMemoryMatchRoom(room));",
    'detección estudiante Memory Match'
  );

  source = replaceOnce(
    source,
    "        const r=await postLive('englishLabLiveGetPlayerState',{room_code:rc, player_id:pid || '', player_name:playerName || '', cod_estudiante:studentCode || ''},35000);\n        setState(r);",
    `        const payload={room_code:rc, player_id:pid || '', player_name:playerName || '', cod_estudiante:studentCode || ''};
        let r=await postLive(isMemoryMatch?'englishLabMemoryMatchGetPlayerState':'englishLabLiveGetPlayerState',payload,35000);
        if(!isMemoryMatch && window.EnglishLabMemoryMatchLiveCS21A174 && window.EnglishLabMemoryMatchLiveCS21A174.isMemoryMatchRoom(r?.room)){
          r=await postLive('englishLabMemoryMatchGetPlayerState',payload,35000);
        }
        setState(r);`,
    'polling estudiante Memory Match'
  );

  source = replaceOnce(
    source,
    "    },[playerId,roomCode,playerName,studentCode]);",
    "    },[playerId,roomCode,playerName,studentCode,isMemoryMatch]);",
    'dependencia polling Memory Match'
  );

  source = replaceOnce(
    source,
    "      {upper(room.status)==='CLOSED' ? <FinalResultsCard room={room} rows={leaderboard} teams={teamLeaderboard} myRank={myRank} compact={false}/> : !question ? <Alert tone=\"warn\">Esperando que el docente lance una pregunta…</Alert> : <PlayerQuestionCard question={question} answer={answer} selected={selected} onSelect={setSelected} onSubmit={submitAnswer} busy={busy} reveal={reveal} />}\n      {question && !canAnswer && !answer && upper(room.round_status)==='OPEN' && <div style={{marginTop:12}}><Alert tone=\"warn\">Esta pregunta ya no acepta respuestas para tu usuario o está siendo actualizada.</Alert></div>}",
    "      {upper(room.status)==='CLOSED' ? <FinalResultsCard room={room} rows={leaderboard} teams={teamLeaderboard} myRank={myRank} compact={false}/> : isMemoryMatch && state?.room_package && typeof MemoryMatchLiveRoundCS21A174 === 'function' ? <MemoryMatchLiveRoundCS21A174 state={state} postLive={postLive} onRefresh={()=>loadState()} /> : !question ? <Alert tone=\"warn\">Esperando que el docente lance una pregunta…</Alert> : <PlayerQuestionCard question={question} answer={answer} selected={selected} onSelect={setSelected} onSubmit={submitAnswer} busy={busy} reveal={reveal} />}\n      {!isMemoryMatch && question && !canAnswer && !answer && upper(room.round_status)==='OPEN' && <div style={{marginTop:12}}><Alert tone=\"warn\">Esta pregunta ya no acepta respuestas para tu usuario o está siendo actualizada.</Alert></div>}",
    'render estudiante Memory Match'
  );

  source = replaceOnce(
    source,
    "        const r = await postLive('englishLabLiveCreateRoom', { cod_grupo:codGrupo, nivel:levelId(selectedGroup), game_code:selectedGame.code, question_count:Number(count)||8, mode, unit }, 45000);",
    "        const endpoint = selectedGame.code==='MEMORY_MATCH' ? 'englishLabMemoryMatchCreateRoom' : 'englishLabLiveCreateRoom';\n        const payload = { cod_grupo:codGrupo, nivel:levelId(selectedGroup), game_code:selectedGame.code, question_count:selectedGame.code==='MEMORY_MATCH'?1:(Number(count)||8), pair_count:selectedGame.code==='MEMORY_MATCH'?(Number(count)||6):undefined, mode, unit };\n        const r = await postLive(endpoint, payload, 45000);",
    'creación docente Memory Match'
  );

  source = replaceOnce(
    source,
    "                <label style={{display:'grid',gap:6,fontSize:12,fontWeight:850,color:'#344054'}}>Cantidad de preguntas\n                  <select value={count} onChange={e=>setCount(Number(e.target.value)||8)} style={{height:42,border:'1px solid var(--line,#D0D5DD)',borderRadius:12,padding:'0 12px',fontWeight:800,background:'#FFF'}}>\n                    {[5,8,10,12,15].map(n=><option key={n} value={n}>{n} preguntas</option>)}\n                  </select>\n                </label>",
    "                <label style={{display:'grid',gap:6,fontSize:12,fontWeight:850,color:'#344054'}}>{selectedGame.code==='MEMORY_MATCH'?'Cantidad de pares':'Cantidad de preguntas'}\n                  <select value={count} onChange={e=>setCount(Number(e.target.value)||8)} style={{height:42,border:'1px solid var(--line,#D0D5DD)',borderRadius:12,padding:'0 12px',fontWeight:800,background:'#FFF'}}>\n                    {(selectedGame.code==='MEMORY_MATCH'?[3,4,6,8,10,12]:[5,8,10,12,15]).map(n=><option key={n} value={n}>{n} {selectedGame.code==='MEMORY_MATCH'?'pares':'preguntas'}</option>)}\n                  </select>\n                </label>",
    'selector cantidad Memory Match'
  );

  return source;
});

console.log('CS21A174 FRONTEND LIVE: TRANSFORMACIÓN COMPLETA');
