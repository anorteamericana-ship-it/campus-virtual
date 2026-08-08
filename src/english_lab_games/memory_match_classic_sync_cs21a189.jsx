// CS21A189 · Memory Match clásico sincronizado para English LAB Live.
// Un solo tablero autoritativo para docente y estudiantes.
// Primera carta pública temporal -> segunda pública -> MATCH queda abierto / MISMATCH vuelve a ocultarse.
/* global React */
(function (global) {
  'use strict';

  const VERSION = 'CS21A189';
  const Runtime = global.EnglishLabRuntimeCS21A173;
  const STYLE_ID = 'english-lab-memory-match-cs21a189';
  const STYLE_HREF = '/styles/english_lab_memory_match_classic_sync_cs21a189.css?v=CS21A189';

  function clean(value) { return String(value == null ? '' : value).trim(); }
  function upper(value) { return clean(value).toUpperCase(); }
  function playerId(player) {
    return clean(player && (player.player_id || player.playerId || player.cod_estudiante || player.codigo_estudiante || player.COD_ESTUDIANTE || player.id));
  }
  function ensureRuntime() {
    if (!Runtime) throw new Error('EnglishLabRuntimeCS21A173 no está disponible.');
    return Runtime;
  }
  function ensureStyle() {
    const doc = global.document;
    if (!doc || !doc.head) return;
    let link = doc.getElementById(STYLE_ID);
    if (!link) {
      link = doc.createElement('link');
      link.id = STYLE_ID;
      link.rel = 'stylesheet';
      doc.head.appendChild(link);
    }
    if (link.getAttribute('href') !== STYLE_HREF) link.setAttribute('href', STYLE_HREF);
  }
  function normalizeCards(raw) {
    const seen = new Set();
    const pairs = new Map();
    const cards = (Array.isArray(raw) ? raw : []).map((card, index) => {
      const id = clean(card && (card.card_id || card.cardId || card.id)) || `card-${index + 1}`;
      const pair = clean(card && (card.pair_id || card.pairId || card.match_id || card.matchId));
      if (!pair) throw new Error(`La tarjeta ${id} no tiene pair_id.`);
      if (seen.has(id)) throw new Error(`El card_id ${id} está duplicado.`);
      seen.add(id);
      pairs.set(pair, (pairs.get(pair) || 0) + 1);
      return Object.freeze({
        id,
        pairId: pair,
        faceType: upper(card && (card.face_type || card.faceType || card.type || 'TEXT')),
        label: clean(card && (card.label || card.text || card.value)),
        imageUrl: clean(card && (card.image_url || card.imageUrl)),
        audioUrl: clean(card && (card.audio_url || card.audioUrl)),
        alt: clean(card && (card.alt || card.alt_text || card.altText)),
      });
    });
    pairs.forEach((count, pair) => { if (count !== 2) throw new Error(`El par ${pair} debe tener exactamente dos tarjetas.`); });
    return cards;
  }
  function sharedState(pkg) {
    const shared = pkg && (pkg.shared_state || pkg.sharedState) || {};
    return {
      boardVersion: Number(shared.board_version || shared.boardVersion || 0) || 0,
      matchedPairs: new Set((Array.isArray(shared.matched_pair_ids) ? shared.matched_pair_ids : []).map(clean)),
      claimed: shared.claimed_pairs && typeof shared.claimed_pairs === 'object' ? shared.claimed_pairs : {},
      attempt: shared.active_attempt && typeof shared.active_attempt === 'object' ? shared.active_attempt : null,
      completed: shared.completed === true,
    };
  }
  function claimFor(shared, card) { return shared.claimed[card.pairId] || null; }
  function isClaimed(shared, card) { return !!claimFor(shared, card) || shared.matchedPairs.has(card.pairId); }
  function attemptPhase(attempt) { return upper(attempt && attempt.phase); }

  function useClockTick(active) {
    const [, setTick] = React.useState(0);
    React.useEffect(() => {
      if (!active) return undefined;
      const timer = global.setInterval(() => setTick(value => value + 1), 100);
      return () => global.clearInterval(timer);
    }, [active]);
  }

  function attemptVisible(shared, clock, turnState) {
    const attempt = shared.attempt;
    if (!attempt) return {active:false,phase:'',ids:new Set(),transition:false};
    const phase = attemptPhase(attempt);
    if (phase === 'FIRST_REVEALED') {
      const currentTurn = Number(turnState && turnState.turn_number || 0) || 0;
      const attemptTurn = Number(attempt.turn_number || 0) || 0;
      if (currentTurn && attemptTurn && currentTurn !== attemptTurn) return {active:false,phase,ids:new Set(),transition:false};
      // El snapshot puede tardar en persistir la limpieza del timeout. La carta
      // temporal nunca debe sobrevivir localmente al deadline autoritativo del
      // turno, aunque un poll vuelva a traer FIRST_REVEALED por unos segundos.
      const turnEndsAt = clean(turnState && (turnState.turn_ends_at || turnState.turnEndsAt) || attempt.turn_ends_at || attempt.turnEndsAt);
      const remaining = turnEndsAt && clock && typeof clock.remainingMs === 'function'
        ? clock.remainingMs(turnEndsAt)
        : turnEndsAt ? Math.max(0, Date.parse(turnEndsAt) - Date.now()) : null;
      if (remaining !== null && remaining <= 0) return {active:false,phase,ids:new Set(),transition:false,remainingMs:0};
      return {active:true,phase,ids:new Set([clean(attempt.first_card_id)]),transition:false,remainingMs:remaining};
    }
    if (phase === 'MISMATCH_REVEAL') {
      const until = clean(attempt.reveal_until);
      const remaining = until && clock && typeof clock.remainingMs === 'function' ? clock.remainingMs(until) : Math.max(0, Date.parse(until) - Date.now());
      if (remaining <= 0) return {active:false,phase,ids:new Set(),transition:false};
      return {
        active:true,
        phase,
        ids:new Set([clean(attempt.first_card_id), clean(attempt.second_card_id)].filter(Boolean)),
        transition:true,
        remainingMs:remaining,
      };
    }
    return {active:false,phase,ids:new Set(),transition:false};
  }

  function CardFace({card}) {
    if (card.faceType === 'IMAGE' && card.imageUrl) return <img src={card.imageUrl} alt={card.alt || card.label || 'Tarjeta visual'} loading="eager" decoding="async"/>;
    if (card.faceType === 'AUDIO' && card.audioUrl) return <div className="elmm-audio-face"><span aria-hidden="true">🔊</span><span>{card.label || 'Escuchar'}</span></div>;
    return <span className="elmm-text-face">{card.label}</span>;
  }

  function ClassicCard({card,index,visible,selected,claimed,mismatch,claim,disabled,onSelect}) {
    const owner = claim && clean(claim.claimed_name || claim.claimed_by);
    const state = claimed ? 'CLAIMED' : visible ? 'REVEALED' : 'HIDDEN';
    const label = claimed ? 'pareja ganada' : visible ? 'carta volteada' : 'carta oculta';
    return <button
      type="button"
      className={`elmm-card elmm-classic-card ${visible?'is-open':''} ${selected?'is-selected':''} ${claimed?'is-matched is-claimed':''} ${mismatch?'is-mismatch':''}`}
      data-card-state={state}
      data-face-up={visible?'true':'false'}
      aria-label={`Tarjeta ${index + 1}, ${label}`}
      aria-pressed={visible}
      disabled={disabled || claimed}
      onClick={() => onSelect(card)}>
      <span className="elmm-card-inner">
        <span className="elmm-card-back" aria-hidden={visible}><span>AN</span></span>
        <span className="elmm-card-front" aria-hidden={!visible}>
          <CardFace card={card}/>
          {claimed && <span className="elmm-card-badge is-claimed-badge">✓ {owner || 'Pareja ganada'} · +1</span>}
          {!claimed && mismatch && <span className="elmm-card-badge elmm-mismatch-badge">No coinciden · memorízalas</span>}
          {!claimed && visible && !mismatch && <span className="elmm-card-badge elmm-reveal-badge">Carta abierta</span>}
        </span>
      </span>
    </button>;
  }

  function useServerTimer(clock, endsAt, active) {
    const [remainingMs,setRemainingMs] = React.useState(() => active ? clock.remainingMs(endsAt) : 0);
    React.useEffect(() => {
      if (!active || !endsAt) { setRemainingMs(0); return undefined; }
      let frame=0; let disposed=false;
      const tick=()=>{ if(disposed) return; const next=clock.remainingMs(endsAt); setRemainingMs(next); if(next>0) frame=global.requestAnimationFrame(tick); };
      tick();
      return ()=>{ disposed=true; if(frame) global.cancelAnimationFrame(frame); };
    },[clock,endsAt,active]);
    return remainingMs;
  }

  function Timer({remainingMs,durationMs,waiting,syncingTurn}) {
    const duration=Math.max(1,Number(durationMs)||1);
    const pct=Math.max(0,Math.min(100,(remainingMs/duration)*100));
    const seconds=Math.max(0,Math.ceil(remainingMs/1000));
    const label=syncingTurn?'Sincronizando turno':waiting?'Cambio de turno':'Tiempo';
    return <div className={`elmm-timer ${(waiting||syncingTurn)?'is-transition':''}`} role="timer" aria-label={syncingTurn?'Sincronizando cambio de turno':waiting?'Cambio de turno':`${seconds} segundos restantes`}>
      <div className="elmm-timer-copy"><span>{label}</span><strong>{(waiting||syncingTurn)?'…':`${seconds}s`}</strong></div>
      <div className="elmm-timer-track"><div className="elmm-timer-fill" style={{width:syncingTurn?'0%':waiting?'100%':`${pct}%`}}/></div>
    </div>;
  }

  function TurnPanel({turnState,players,currentPlayer,turnEngine,readOnly,waiting,syncingTurn}) {
    if (!turnState) return null;
    const activeId=clean(turnState.active_player_id || turnState.activePlayerId);
    const mine=playerId(currentPlayer);
    const byId={};
    (Array.isArray(players)?players:[]).forEach(p=>{byId[playerId(p)]=p;});
    const active=byId[activeId]||{};
    const activeName=clean(active.name || active.nombre)||activeId||'—';
    let nextName='—';
    try {
      if(turnEngine && typeof turnEngine.describeTurn==='function'){
        const d=turnEngine.describeTurn(turnState,players)||{};
        nextName=clean(d.next_player && d.next_player.name)||nextName;
      }
    } catch(_) {}
    const heading = syncingTurn ? 'Sincronizando cambio' : waiting ? 'Memorizá las dos cartas' : readOnly ? 'Jugando ahora' : activeId===mine ? 'Tu turno' : 'Esperando turno';
    return <section className={`elmm-shared-turn ${(waiting||syncingTurn)?'is-transition':''}`} aria-label="Turno actual">
      <div><span>Turno {Number(turnState.turn_number||1)||1}</span><strong>{heading}: {activeName}</strong><small>{syncingTurn?'El servidor confirmará el siguiente turno.':waiting?'Se cerrarán juntas antes del próximo turno.':`Siguiente: ${nextName}`}</small></div>
      <b>{syncingTurn?'Esperando servidor':waiting?'Tablero bloqueado':readOnly?'Vista de control':activeId===mine?'Podés jugar':'Observando'}</b>
    </section>;
  }

  function MemoryMatchClassicSyncCS21A189(props) {
    ensureStyle();
    const runtime=ensureRuntime();
    const packageInput=props && (props.roomPackage || props.package || props.data) || {};
    const normalized=React.useMemo(()=>runtime.normalizeRoomPackage(packageInput),[packageInput]);
    const cards=React.useMemo(()=>normalizeCards(normalized.round.cards),[normalized.round.cards]);
    const shared=React.useMemo(()=>sharedState(packageInput),[packageInput, packageInput.shared_state && packageInput.shared_state.board_version]);
    const turnEngine=props && props.turnEngine || null;
    const turnState=packageInput.turn_state || packageInput.turnState || null;
    const players=Array.isArray(packageInput.players)?packageInput.players:[];
    const currentPlayer=props && props.player || normalized.player || null;
    const currentId=playerId(currentPlayer);
    const activeId=clean(turnState && (turnState.active_player_id || turnState.activePlayerId));
    const phase=upper(normalized.state.phase);
    const activeClock=props && props.authoritativeClock || normalized.clock;
    const remainingMs=useServerTimer(activeClock, normalized.state.endsAt, phase==='OPEN');
    useClockTick(!!shared.attempt);
    const reveal=attemptVisible(shared, activeClock, turnState);
    const turnStartsIn=turnState && clean(turnState.turn_started_at) && activeClock && typeof activeClock.remainingMs==='function'
      ? activeClock.remainingMs(turnState.turn_started_at) : 0;
    const waitingForFlipback=reveal.phase==='MISMATCH_REVEAL' && reveal.active;
    const syncingTurn=phase==='OPEN' && remainingMs<=0 && !waitingForFlipback;
    const turnReady=turnStartsIn<=0 && !waitingForFlipback;
    const isMyTurn=turnState && turnEngine && typeof turnEngine.canPlayerAct==='function'
      ? turnEngine.canPlayerAct(turnState,currentPlayer,{readOnly:!!(props&&props.readOnly)})
      : !(props&&props.readOnly);
    const canPlay=phase==='OPEN' && isMyTurn && remainingMs>0 && turnReady && !(props&&props.readOnly);
    const turnNumber=Number(turnState && turnState.turn_number || 0)||0;
    const [optimistic,setOptimistic]=React.useState([]);
    const [syncing,setSyncing]=React.useState(false);
    const [announcement,setAnnouncement]=React.useState('');
    const authoritativeOnly=!!(props&&props.authoritativeOnly);
    const revealPromiseRef=React.useRef(Promise.resolve());
    const localStartRef=React.useRef(Date.now());

    React.useEffect(()=>{
      setOptimistic([]);
      setSyncing(false);
      setAnnouncement('');
      revealPromiseRef.current=Promise.resolve();
      localStartRef.current=Date.now();
    },[turnNumber, normalized.round.roundId]);
    React.useEffect(()=>{
      if(shared.boardVersion) setOptimistic(ids=>ids.filter(id=>{
        const card=cards.find(item=>item.id===id);
        return card && !isClaimed(shared,card) && !reveal.ids.has(id);
      }));
    },[shared.boardVersion]);

    const buildAction=React.useCallback((action,value)=>runtime.buildSubmission({
      roomCode:normalized.room.roomCode,
      roundId:normalized.round.roundId,
      playerId:currentId,
      teamId:clean(currentPlayer && (currentPlayer.team_id || currentPlayer.teamId)),
      answerType:action==='DISCOVER_CARD'?'CARD_REVEAL':'PAIR',
      answerValue:{action,...value},
      timeMs:Math.max(0,Date.now()-localStartRef.current),
    }),[runtime,normalized.room.roomCode,normalized.round.roundId,currentId,currentPlayer]);

    const send=React.useCallback(async submission=>{
      if(!props || typeof props.onSubmit!=='function') return {ok:true,accepted:true};
      return props.onSubmit(submission);
    },[props]);

    const serverFirstId = reveal.phase==='FIRST_REVEALED' && reveal.active ? clean(shared.attempt && shared.attempt.first_card_id) : '';
    const localFirstId = serverFirstId || optimistic[0] || '';

    const selectCard=React.useCallback(card=>{
      if(!canPlay || syncing || isClaimed(shared,card) || waitingForFlipback) return;
      if(!localFirstId){
        if(!authoritativeOnly) setOptimistic([card.id]);
        setSyncing(true);
        setAnnouncement('Primera carta abierta para toda la sala. Elegí una segunda.');
        const promise=Promise.resolve(send(buildAction('DISCOVER_CARD',{card_id:card.id})))
          .then(result=>{
            if(result && result.ok===false) throw new Error(result.mensaje||result.message||result.error||'No se pudo abrir la carta.');
            setOptimistic([]);
            return result;
          })
          .catch(error=>{
            setAnnouncement(error&&error.message?error.message:'No se pudo sincronizar la carta.');
            setOptimistic([]);
            throw error;
          })
          .finally(()=>setSyncing(false));
        revealPromiseRef.current=promise.catch(()=>null);
        return;
      }
      if(card.id===localFirstId) return;
      const first=cards.find(item=>item.id===localFirstId);
      if(!first) { setOptimistic([]); return; }
      if(!authoritativeOnly) setOptimistic([first.id,card.id]);
      setSyncing(true);
      const correct=first.pairId===card.pairId;
      setAnnouncement(correct?'Comprobando pareja…':'Comparando cartas…');
      Promise.resolve(revealPromiseRef.current)
        .then(()=>send(buildAction('SUBMIT_PAIR',{first_card_id:first.id,second_card_id:card.id,pair_id:correct?first.pairId:'',correct})))
        .then(result=>{
          if(result && result.ok===false) throw new Error(result.mensaje||result.message||result.error||'El intento no fue aceptado.');
          setOptimistic([]);
          setAnnouncement(correct?'¡Pareja correcta! +1 · seguís jugando.':'No coinciden. Miralas bien: se volverán a tapar y cambia el turno.');
          return result;
        })
        .catch(error=>{
          setAnnouncement(error&&error.message?error.message:'No se pudo guardar el intento.');
          setOptimistic([]);
        })
        .finally(()=>setSyncing(false));
    },[canPlay,syncing,waitingForFlipback,localFirstId,cards,shared,send,buildAction,authoritativeOnly]);

    const claimedCount=Object.keys(shared.claimed).length || shared.matchedPairs.size;
    const completed=shared.completed || claimedCount>=cards.length/2;
    const visibleIds=new Set([...reveal.ids,...optimistic]);
    const transitionText=waitingForFlipback ? 'No coinciden · memorízalas antes de que se cierren' : '';

    return <section className="elmm-shell elmm-classic-sync" data-game-engine="MEMORY_MATCH" data-classic-sync="true" data-version={VERSION}>
      <header className="elmm-header">
        <div><div className="elmm-kicker">English LAB · Memory Match Live</div><h2>{clean(packageInput && packageInput.round && packageInput.round.title)||'Memory Match'}</h2><p>Volteá dos cartas. Si coinciden, ganás el par y seguís jugando. Si no coinciden, todos las ven un momento y vuelven a taparse.</p></div>
        <div className="elmm-room-chip">{normalized.room.roomCode||'SALA'}</div>
      </header>
      <Timer remainingMs={remainingMs} durationMs={normalized.rules.roundDurationMs} waiting={waitingForFlipback || turnStartsIn>0} syncingTurn={syncingTurn}/>
      <TurnPanel turnState={turnState} players={players} currentPlayer={currentPlayer} turnEngine={turnEngine} readOnly={!!(props&&props.readOnly)} waiting={waitingForFlipback} syncingTurn={syncingTurn}/>
      {transitionText && <div className="elmm-flipback-banner" role="status">{transitionText}</div>}
      <div className="elmm-status-row"><span>{claimedCount} / {cards.length/2} parejas ganadas</span><span>{completed?'Completado':waitingForFlipback?'Cerrando cartas…':canPlay?'Tu jugada':activeId?`Turno de ${clean((players.find(p=>playerId(p)===activeId)||{}).name)||activeId}`:'Esperando'}</span></div>
      <div className={`elmm-grid elmm-grid-${Math.min(cards.length,16)}`} role="grid" aria-label="Tablero único sincronizado de Memory Match">
        {cards.map((card,index)=>{
          const claim=claimFor(shared,card);
          const claimed=!!claim || shared.matchedPairs.has(card.pairId);
          const temporary=visibleIds.has(card.id);
          const visible=claimed || temporary;
          const selected=temporary && !waitingForFlipback;
          return <ClassicCard key={card.id} card={card} index={index} visible={visible} selected={selected} claimed={claimed} mismatch={waitingForFlipback && temporary} claim={claim} disabled={!canPlay||syncing||waitingForFlipback||(serverFirstId===card.id)} onSelect={selectCard}/>;
        })}
      </div>
      <div className="elmm-live-announcement" role="status" aria-live="polite">{syncing?'Sincronizando jugada…':announcement}</div>
      {completed && <div className="elmm-complete">¡Tablero completado!</div>}
    </section>;
  }

  MemoryMatchClassicSyncCS21A189.__cs21a189ClassicSync=true;
  MemoryMatchClassicSyncCS21A189.__version=VERSION;
  global.MemoryMatchGameCS21A173=MemoryMatchClassicSyncCS21A189;
  global.EnglishLabMemoryMatchClassicSyncCS21A189={
    version:VERSION,
    Component:MemoryMatchClassicSyncCS21A189,
    attemptVisible,
    sharedState,
  };
})(window);
