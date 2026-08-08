// CS21A189 · Adaptador Live para Memory Match clásico sincronizado.
// Se carga DESPUÉS del adaptador CS21A174/188 y reemplaza únicamente su componente/API global.
/* global React */
(function (global) {
  'use strict';

  const base = global.EnglishLabMemoryMatchLiveCS21A174;
  if (!base) throw new Error('Falta EnglishLabMemoryMatchLiveCS21A174 antes de CS21A189.');

  const VERSION = 'CS21A189';
  const ENDPOINTS = base.ENDPOINTS;
  const POLL_TIERS = Object.freeze([
    Object.freeze({maxPlayers:5,ms:550}),
    Object.freeze({maxPlayers:10,ms:900}),
    Object.freeze({maxPlayers:15,ms:1400}),
    Object.freeze({maxPlayers:25,ms:2200}),
  ]);

  function clean(value){ return String(value == null ? '' : value).trim(); }
  function upper(value){ return clean(value).toUpperCase(); }
  function playerId(player){
    return clean(player && (player.player_id || player.playerId || player.cod_estudiante || player.codigo_estudiante || player.COD_ESTUDIANTE || player.id));
  }
  function roomCode(room,pkg){
    return clean(pkg && pkg.room && (pkg.room.room_code || pkg.room.roomCode) || room && (room.room_code || room.roomCode || room.ROOM_CODE)).toUpperCase();
  }
  function roomStatus(room){ return upper(room && (room.status || room.STATUS)); }
  function pollMsForPlayers(count){
    const players=Math.max(1,Number(count||0)||1);
    for(const tier of POLL_TIERS) if(players<=tier.maxPlayers) return tier.ms;
    return 3000;
  }
  function resultLabel(result){
    if(!result || typeof result!=='object') return '';
    const action=upper(result.action || result.answer_type);
    if(action==='DISCOVER_CARD') return result.accepted===false?'Primera carta ya sincronizada.':'Primera carta abierta para toda la sala.';
    if(result.correct===true) return `¡Pareja correcta! +${Number(result.points||0)} · seguís jugando`;
    if(result.correct===false) return 'No coinciden · se muestran un momento, se vuelven a tapar y cambia el turno.';
    return result.message || result.mensaje || '';
  }

  function MemoryMatchClassicLiveRoundCS21A189(props){
    const incomingState=props && props.state || {};
    const postLive=props && props.postLive;
    const onRefresh=props && props.onRefresh;
    const readOnly=!!(props && props.readOnly);
    const [liveState,setLiveState]=React.useState(incomingState);
    const [error,setError]=React.useState('');
    const [busy,setBusy]=React.useState(false);
    const [lastResult,setLastResult]=React.useState(null);
    const [turnReady,setTurnReady]=React.useState(!!global.EnglishLabTurnEngineCS21A176);
    const pollingRef=React.useRef(false);

    React.useEffect(()=>{ setLiveState(incomingState); },[incomingState]);

    const state=liveState && typeof liveState==='object' ? liveState : incomingState;
    const room=state.room || props.room || {};
    const player=state.player || props.player || null;
    const pkg=base.packageFromLiveState(state) || props.roomPackage || null;
    const code=roomCode(room,pkg);
    const status=roomStatus(room);
    const pid=playerId(player);
    const playersOnline=base.participantCount(state,pkg);
    const pollMs=pollMsForPlayers(playersOnline);

    React.useEffect(()=>{
      let active=true;
      Promise.all([base.ensureTurnEngine(),base.ensureSyncGuard()]).then(()=>{ if(active) setTurnReady(true); }).catch(err=>{
        if(active) setError(err && err.message ? err.message : String(err));
      });
      return ()=>{active=false;};
    },[]);

    React.useEffect(()=>{
      if(typeof postLive!=='function' || !code || status==='CLOSED') return undefined;
      if(!readOnly && !pid) return undefined;
      let disposed=false;
      let timer=0;

      async function poll(){
        if(disposed || pollingRef.current) return;
        if(global.document && global.document.visibilityState==='hidden') return;
        pollingRef.current=true;
        try{
          const endpoint=readOnly ? ENDPOINTS.getRoomControl : ENDPOINTS.getPlayerState;
          const payload=readOnly ? {room_id:code,room_code:code} : {room_code:code,player_id:pid,cod_estudiante:pid};
          const result=await postLive(endpoint,payload,45000);
          if(!disposed && result && result.ok!==false){
            setLiveState(current=>base.mergeLiveState(current,result,room,player));
            setError('');
          }
        }catch(err){
          if(!disposed) setError(err && err.message ? err.message : String(err));
        }finally{
          pollingRef.current=false;
        }
      }

      function onVisibility(){
        if(global.document && global.document.visibilityState!=='hidden') poll();
      }

      // Primera lectura inmediata: no esperamos al primer intervalo para converger.
      poll();
      timer=global.setInterval(poll,pollMs);
      if(global.document && typeof global.document.addEventListener==='function') global.document.addEventListener('visibilitychange',onVisibility);
      return ()=>{
        disposed=true;
        if(timer) global.clearInterval(timer);
        if(global.document && typeof global.document.removeEventListener==='function') global.document.removeEventListener('visibilitychange',onVisibility);
      };
    },[readOnly,postLive,code,status,pid,pollMs]);

    if(!pkg){
      return <div role="status" style={{padding:16,border:'1px solid #FFD88A',background:'#FFF7E6',borderRadius:14,color:'#7A4B00',fontWeight:800}}>Esperando el paquete de tarjetas de la sala…</div>;
    }
    if(typeof global.MemoryMatchGameCS21A173!=='function'){
      return <div role="alert" style={{padding:16,border:'1px solid #F5B5B5',background:'#FDECEA',borderRadius:14,color:'#8B1F1F',fontWeight:800}}>El motor Memory Match no terminó de cargar.</div>;
    }
    if(pkg.turn_state && !turnReady){
      return <div role="status" style={{padding:16,border:'1px solid #B7D5FF',background:'#EEF4FF',borderRadius:14,color:'#073B7A',fontWeight:800}}>Cargando turnos de la sala…</div>;
    }

    async function handleSubmit(submission){
      if(typeof postLive!=='function') throw new Error('postLive no está disponible.');
      setBusy(true); setError('');
      try{
        const result=await postLive(ENDPOINTS.submitPair,base.submitPayload(submission,room,pkg,player),45000);
        setLastResult(result||null);
        if(result && result.room_package){
          setLiveState(current=>base.mergeLiveState(current,result,room,player));
        }else if(typeof onRefresh==='function'){
          await onRefresh();
        }
        return result;
      }catch(err){
        const message=err && err.message ? err.message : String(err);
        setError(message); throw err;
      }finally{ setBusy(false); }
    }

    return <div data-live-game="MEMORY_MATCH" data-classic-sync-adapter="true" data-version={VERSION} data-live-poll-ms={pollMs} data-live-players={playersOnline} style={{display:'grid',gap:12}}>
      {error && <div role="alert" style={{padding:'10px 12px',border:'1px solid #F5B5B5',background:'#FDECEA',borderRadius:12,color:'#8B1F1F',fontWeight:800}}>{error}</div>}
      {busy && <div role="status" style={{fontSize:12,fontWeight:900,color:'#073B7A'}}>Sincronizando jugada…</div>}
      {lastResult && resultLabel(lastResult) && <div aria-live="polite" style={{fontSize:12,fontWeight:900,color:lastResult.correct?'#145C38':'#073B7A'}}>{resultLabel(lastResult)}</div>}
      <global.MemoryMatchGameCS21A173
        roomPackage={pkg}
        player={player}
        turnEngine={global.EnglishLabTurnEngineCS21A176 || null}
        onReady={props.onReady}
        onSubmit={handleSubmit}
        onTimeout={props.onTimeout}
        onComplete={props.onComplete}
        readOnly={readOnly}/>
    </div>;
  }

  MemoryMatchClassicLiveRoundCS21A189.__cs21a189ClassicSyncAdapter=true;
  const api=Object.freeze({
    ...base,
    VERSION,
    POLL_TIERS,
    LIVE_POLL_MS:550,
    READ_ONLY_POLL_MS:550,
    livePollMsForPlayers:pollMsForPlayers,
    resultLabel,
    component:MemoryMatchClassicLiveRoundCS21A189,
    classicSync:true,
  });
  global.MemoryMatchLiveRoundCS21A174=MemoryMatchClassicLiveRoundCS21A189;
  global.EnglishLabMemoryMatchLiveCS21A174=api;
  global.EnglishLabMemoryMatchClassicSyncAdapterCS21A189=api;
})(window);
