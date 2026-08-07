// CS21A188 · Memory Match Shared Discovery para English LAB Live.
// Un solo tablero autoritativo: HIDDEN -> DISCOVERED -> CLAIMED.
// Las cartas descubiertas son públicas y siguen disponibles; el matcher reclama la pareja.
/* global React */
(function (global) {
  'use strict';

  const VERSION = 'CS21A188';
  const Runtime = global.EnglishLabRuntimeCS21A173;
  const STYLE_ID = 'english-lab-memory-match-cs21a174';
  const STYLE_HREF = 'styles/english_lab_memory_match_cs21a173.css?v=CS21A188';

  function clean(value) { return String(value == null ? '' : value).trim(); }
  function upper(value) { return clean(value).toUpperCase(); }
  function playerId(player) {
    return clean(player && (player.player_id || player.playerId || player.cod_estudiante || player.codigo_estudiante || player.COD_ESTUDIANTE || player.id));
  }
  function ensureRuntime() {
    if (!Runtime) throw new Error('EnglishLabRuntimeCS21A173 no está disponible.');
    return Runtime;
  }
  function ensureStyleEpoch() {
    const doc = global.document;
    if (!doc || !doc.head) return;
    const existing = doc.getElementById(STYLE_ID);
    if (existing) {
      if (existing.getAttribute('href') !== STYLE_HREF) existing.setAttribute('href', STYLE_HREF);
      return;
    }
    const link = doc.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = STYLE_HREF;
    doc.head.appendChild(link);
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
      discovered: shared.discovered_cards && typeof shared.discovered_cards === 'object' ? shared.discovered_cards : {},
      claimed: shared.claimed_pairs && typeof shared.claimed_pairs === 'object' ? shared.claimed_pairs : {},
      matchedPairs: new Set((Array.isArray(shared.matched_pair_ids) ? shared.matched_pair_ids : []).map(clean)),
      completed: shared.completed === true,
    };
  }
  function discoveryFor(shared, card) { return shared.discovered[card.id] || null; }
  function claimFor(shared, card) { return shared.claimed[card.pairId] || null; }
  function isClaimed(shared, card) { return !!claimFor(shared, card) || shared.matchedPairs.has(card.pairId); }

  function CardFace({card}) {
    if (card.faceType === 'IMAGE' && card.imageUrl) return <img src={card.imageUrl} alt={card.alt || card.label || 'Tarjeta visual'} loading="eager" decoding="async"/>;
    if (card.faceType === 'AUDIO' && card.audioUrl) return <div className="elmm-audio-face"><span aria-hidden="true">🔊</span><span>{card.label || 'Escuchar'}</span></div>;
    return <span className="elmm-text-face">{card.label}</span>;
  }

  function SharedCard({card,index,visible,selected,claimed,discovery,claim,disabled,onSelect}) {
    const stateLabel = claimed ? 'ganada' : visible ? 'descubierta' : 'oculta';
    const owner = claim && clean(claim.claimed_name || claim.claimed_by);
    const discoverer = discovery && clean(discovery.discovered_name || discovery.discovered_by);
    return <button
      type="button"
      className={`elmm-card ${visible?'is-open':''} ${selected?'is-selected':''} ${claimed?'is-matched is-claimed':''} ${visible&&!claimed?'is-discovered':''}`}
      data-card-state={claimed?'CLAIMED':visible?'DISCOVERED':'HIDDEN'}
      aria-label={`Tarjeta ${index + 1}, ${stateLabel}`}
      aria-pressed={visible}
      disabled={disabled || claimed}
      onClick={()=>onSelect(card)}>
      <span className="elmm-card-inner">
        <span className="elmm-card-back" aria-hidden={visible}><span>AN</span></span>
        <span className="elmm-card-front" aria-hidden={!visible}>
          <CardFace card={card}/>
          {claimed && <span className="elmm-card-badge is-claimed-badge">✓ {owner || 'Pareja ganada'} · +1</span>}
          {!claimed && visible && <span className="elmm-card-badge is-discovered-badge">👁 {discoverer ? `Descubierta por ${discoverer}` : 'Descubierta'}</span>}
        </span>
      </span>
    </button>;
  }

  function useServerTimer(clock, endsAt, active) {
    const [remainingMs,setRemainingMs] = React.useState(()=>active ? clock.remainingMs(endsAt) : 0);
    React.useEffect(()=>{
      if (!active || !endsAt) { setRemainingMs(0); return undefined; }
      let frame=0; let disposed=false;
      const tick=()=>{ if(disposed) return; const next=clock.remainingMs(endsAt); setRemainingMs(next); if(next>0) frame=global.requestAnimationFrame(tick); };
      tick();
      return ()=>{ disposed=true; if(frame) global.cancelAnimationFrame(frame); };
    },[clock,endsAt,active]);
    return remainingMs;
  }

  function Timer({remainingMs,durationMs}) {
    const duration=Math.max(1,Number(durationMs)||1);
    const pct=Math.max(0,Math.min(100,(remainingMs/duration)*100));
    const seconds=Math.max(0,Math.ceil(remainingMs/1000));
    return <div className="elmm-timer" role="timer" aria-label={`${seconds} segundos restantes`}>
      <div className="elmm-timer-copy"><span>Tiempo</span><strong>{seconds}s</strong></div>
      <div className="elmm-timer-track"><div className="elmm-timer-fill" style={{width:`${pct}%`}}/></div>
    </div>;
  }

  function TurnPanel({turnState,players,currentPlayer,turnEngine,readOnly}) {
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
    return <section className="elmm-shared-turn" aria-label="Turno actual">
      <div><span>Turno {Number(turnState.turn_number||1)||1}</span><strong>{readOnly?'Jugando ahora':activeId===mine?'Tu turno':'Esperando turno'}: {activeName}</strong><small>Siguiente: {nextName}</small></div>
      <b>{readOnly?'Vista de control':activeId===mine?'Podés jugar':'Observando'}</b>
    </section>;
  }

  function MemoryMatchSharedDiscoveryCS21A188(props) {
    ensureStyleEpoch();
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
    const isMyTurn=turnState && turnEngine && typeof turnEngine.canPlayerAct==='function'
      ? turnEngine.canPlayerAct(turnState,currentPlayer,{readOnly:!!(props&&props.readOnly)})
      : !(props&&props.readOnly);
    const phase=upper(normalized.state.phase);
    const remainingMs=useServerTimer(normalized.clock, normalized.state.endsAt, phase==='OPEN');
    const canPlay=phase==='OPEN' && isMyTurn && remainingMs>0 && !(props&&props.readOnly);
    const turnNumber=Number(turnState && turnState.turn_number || 0)||0;
    const [selected,setSelected]=React.useState([]);
    const [syncing,setSyncing]=React.useState(false);
    const [locked,setLocked]=React.useState(false);
    const [announcement,setAnnouncement]=React.useState('');
    const revealPromiseRef=React.useRef(Promise.resolve());
    const localStartRef=React.useRef(Date.now());

    React.useEffect(()=>{ setSelected([]); setLocked(false); setSyncing(false); setAnnouncement(''); revealPromiseRef.current=Promise.resolve(); localStartRef.current=Date.now(); },[turnNumber, normalized.round.roundId]);
    React.useEffect(()=>{
      setSelected(ids=>ids.filter(id=>{
        const card=cards.find(item=>item.id===id);
        return card && !isClaimed(shared,card);
      }));
    },[shared.boardVersion]);

    const buildAction=React.useCallback((action,value)=>runtime.buildSubmission({
      roomCode:normalized.room.roomCode,
      roundId:normalized.round.roundId,
      playerId:currentId,
      teamId:clean(currentPlayer && (currentPlayer.team_id || currentPlayer.teamId)),
      answerType:action==='DISCOVER_CARD'?'CARD_DISCOVERY':'PAIR',
      answerValue:{action,...value},
      timeMs:Math.max(0,Date.now()-localStartRef.current),
    }),[runtime,normalized.room.roomCode,normalized.round.roundId,currentId,currentPlayer]);

    const send=React.useCallback(async submission=>{
      if(!props || typeof props.onSubmit!=='function') return {ok:true,accepted:true};
      return props.onSubmit(submission);
    },[props]);

    const selectCard=React.useCallback(card=>{
      if(!canPlay || locked || isClaimed(shared,card) || selected.includes(card.id)) return;
      if(selected.length===0){
        setSelected([card.id]);
        setAnnouncement(discoveryFor(shared,card)?'Carta pública seleccionada. Buscá su pareja.':'Carta descubierta para toda la sala.');
        if(!discoveryFor(shared,card)){
          setSyncing(true);
          const promise=Promise.resolve(send(buildAction('DISCOVER_CARD',{card_id:card.id})))
            .then(result=>{ if(result && result.ok===false) throw new Error(result.mensaje||result.message||result.error||'No se pudo descubrir la carta.'); return result; })
            .catch(error=>{ setAnnouncement(error&&error.message?error.message:'No se pudo sincronizar la carta.'); setSelected([]); throw error; })
            .finally(()=>setSyncing(false));
          revealPromiseRef.current=promise.catch(()=>null);
        } else {
          revealPromiseRef.current=Promise.resolve();
        }
        return;
      }

      const first=cards.find(item=>item.id===selected[0]);
      if(!first) { setSelected([]); return; }
      setSelected([first.id,card.id]);
      setLocked(true);
      setAnnouncement('Comprobando asociación…');
      const correct=first.pairId===card.pairId;
      Promise.resolve(revealPromiseRef.current)
        .then(()=>send(buildAction('SUBMIT_PAIR',{first_card_id:first.id,second_card_id:card.id,pair_id:correct?first.pairId:'',correct})))
        .then(result=>{
          if(result && result.ok===false) throw new Error(result.mensaje||result.message||result.error||'El intento no fue aceptado.');
          setAnnouncement(correct?'¡Pareja reclamada! +1 · seguís jugando.':'No coinciden. Ambas quedan descubiertas para la sala.');
          global.setTimeout(()=>{setSelected([]);setLocked(false);},correct?650:850);
          return result;
        })
        .catch(error=>{setAnnouncement(error&&error.message?error.message:'No se pudo guardar el intento.');setSelected([]);setLocked(false);});
    },[canPlay,locked,selected,cards,shared,send,buildAction]);

    const claimedCount=Object.keys(shared.claimed).length || shared.matchedPairs.size;
    const discoveredCount=Object.keys(shared.discovered).filter(id=>{
      const card=cards.find(item=>item.id===id); return card && !isClaimed(shared,card);
    }).length;
    const completed=shared.completed || claimedCount>=cards.length/2;

    return <section className="elmm-shell elmm-shared-discovery" data-game-engine="MEMORY_MATCH" data-shared-discovery="true" data-version={VERSION}>
      <header className="elmm-header">
        <div><div className="elmm-kicker">English LAB · Shared Discovery</div><h2>{clean(packageInput && packageInput.round && packageInput.round.title)||'Memory Match'}</h2><p>Lo que alguien descubre queda visible para todos. Quien completa la pareja la reclama y continúa jugando.</p></div>
        <div className="elmm-room-chip">{normalized.room.roomCode||'SALA'}</div>
      </header>
      <Timer remainingMs={remainingMs} durationMs={normalized.rules.roundDurationMs}/>
      <TurnPanel turnState={turnState} players={players} currentPlayer={currentPlayer} turnEngine={turnEngine} readOnly={!!(props&&props.readOnly)}/>
      <div className="elmm-status-row"><span>{claimedCount} / {cards.length/2} parejas ganadas · {discoveredCount} cartas públicas</span><span>{completed?'Completado':canPlay?'Tu jugada':activeId?`Turno de ${clean((players.find(p=>playerId(p)===activeId)||{}).name)||activeId}`:'Esperando'}</span></div>
      <div className={`elmm-grid elmm-grid-${Math.min(cards.length,16)}`} role="grid" aria-label="Tablero compartido de memoria">
        {cards.map((card,index)=>{
          const discovery=discoveryFor(shared,card);
          const claim=claimFor(shared,card);
          const claimed=!!claim || shared.matchedPairs.has(card.pairId);
          const selectedNow=selected.includes(card.id);
          const visible=claimed || !!discovery || selectedNow;
          return <SharedCard key={card.id} card={card} index={index} visible={visible} selected={selectedNow} claimed={claimed} discovery={discovery} claim={claim} disabled={!canPlay||locked} onSelect={selectCard}/>;
        })}
      </div>
      <div className="elmm-live-announcement" aria-live="polite">{syncing?'Sincronizando descubrimiento… ':''}{announcement}</div>
      {completed && <div className="elmm-complete" role="status">Tablero completado</div>}
    </section>;
  }

  MemoryMatchSharedDiscoveryCS21A188.__cs21a188SharedDiscovery=true;
  global.MemoryMatchGameCS21A173=MemoryMatchSharedDiscoveryCS21A188;
  global.MemoryMatchSharedDiscoveryCS21A188=Object.freeze({VERSION,component:MemoryMatchSharedDiscoveryCS21A188,states:['HIDDEN','DISCOVERED','CLAIMED']});
})(window);
