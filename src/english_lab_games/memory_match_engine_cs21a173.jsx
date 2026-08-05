// CS21A173/CS21A176 · Motor visual Memory Match para English LAB.
// Componente puro: recibe room package compacto; no consulta backend ni contiene banco de preguntas.
/* global React */
(function (global) {
  'use strict';

  const Runtime = global.EnglishLabRuntimeCS21A173;
  const VERSION = 'CS21A176';

  function ensureRuntime() {
    if (!Runtime) throw new Error('EnglishLabRuntimeCS21A173 no está disponible.');
    return Runtime;
  }

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function cardId(card, index) {
    return clean(card && (card.card_id || card.cardId || card.id)) || `card-${index + 1}`;
  }

  function pairId(card) {
    return clean(card && (card.pair_id || card.pairId || card.match_id || card.matchId));
  }

  function cardFace(card) {
    return clean(card && (card.face_type || card.faceType || card.type || 'TEXT')).toUpperCase();
  }

  function normalizedPlayerId(player) {
    return clean(player && (
      player.player_id || player.playerId || player.cod_estudiante ||
      player.codigo_estudiante || player.COD_ESTUDIANTE || player.id
    ));
  }

  function validateCards(cards) {
    const seen = new Set();
    const pairs = new Map();
    const normalized = (Array.isArray(cards) ? cards : []).map((card, index) => {
      const id = cardId(card, index);
      const pair = pairId(card);
      if (!pair) throw new Error(`La tarjeta ${id} no tiene pair_id.`);
      if (seen.has(id)) throw new Error(`El card_id ${id} está duplicado.`);
      seen.add(id);
      pairs.set(pair, (pairs.get(pair) || 0) + 1);
      return Object.freeze({
        id,
        pairId: pair,
        faceType: cardFace(card),
        label: clean(card && (card.label || card.text || card.value)),
        imageUrl: clean(card && (card.image_url || card.imageUrl)),
        audioUrl: clean(card && (card.audio_url || card.audioUrl)),
        alt: clean(card && (card.alt || card.alt_text || card.altText)),
        metadata: card && card.metadata ? card.metadata : null,
      });
    });

    if (normalized.length < 4 || normalized.length % 2 !== 0) {
      throw new Error('Memory Match requiere un número par de al menos cuatro tarjetas.');
    }
    pairs.forEach((count, pair) => {
      if (count !== 2) throw new Error(`El par ${pair} debe tener exactamente dos tarjetas.`);
    });
    return normalized;
  }

  function useServerTimer(clock, endsAt, active) {
    const [remainingMs, setRemainingMs] = React.useState(() => active ? clock.remainingMs(endsAt) : 0);
    React.useEffect(() => {
      if (!active || !endsAt) {
        setRemainingMs(0);
        return undefined;
      }
      let frame = 0;
      let disposed = false;
      const tick = () => {
        if (disposed) return;
        const next = clock.remainingMs(endsAt);
        setRemainingMs(next);
        if (next > 0) frame = window.requestAnimationFrame(tick);
      };
      tick();
      return () => {
        disposed = true;
        if (frame) window.cancelAnimationFrame(frame);
      };
    }, [clock, endsAt, active]);
    return remainingMs;
  }

  function TimerBar({ remainingMs, durationMs }) {
    const duration = Math.max(1, Number(durationMs) || 1);
    const pct = Math.max(0, Math.min(100, (remainingMs / duration) * 100));
    const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
    return <div className="elmm-timer" role="timer" aria-live="polite" aria-label={`${seconds} segundos restantes`}>
      <div className="elmm-timer-copy"><span>Tiempo</span><strong>{seconds}s</strong></div>
      <div className="elmm-timer-track"><div className="elmm-timer-fill" style={{width:`${pct}%`}} /></div>
    </div>;
  }

  function TeamPanel({ teams, activeTeamId, player }) {
    if (!Array.isArray(teams) || !teams.length) return null;
    const playerTeamId = clean(player && (player.team_id || player.teamId));
    return <section className="elmm-teams" aria-label="Equipos">
      {teams.map((team, index) => {
        const id = clean(team && (team.team_id || team.teamId || team.id)) || `team-${index + 1}`;
        const active = id === activeTeamId;
        const mine = id === playerTeamId;
        const members = Array.isArray(team && team.members) ? team.members : [];
        return <article key={id} className={`elmm-team ${active?'is-active':''} ${mine?'is-mine':''}`}>
          <div className="elmm-team-head">
            <strong>{clean(team && (team.name || team.label)) || `Equipo ${index + 1}`}</strong>
            <span>{Number(team && team.points) || 0} pts</span>
          </div>
          <div className="elmm-team-meta">{members.length} integrante{members.length===1?'':'s'}{active?' · turno actual':''}{mine?' · tu equipo':''}</div>
        </article>;
      })}
    </section>;
  }

  function TurnRoster({ players, turnState, turnDescription, currentPlayer, readOnly }) {
    if (!turnState) return null;
    const list = Array.isArray(players) ? players : [];
    const activeId = clean(turnState.active_player_id || turnState.activePlayerId);
    const currentId = normalizedPlayerId(currentPlayer);
    const activeName = clean(turnDescription && turnDescription.active_player && turnDescription.active_player.name) || activeId || 'Todos';
    const nextName = clean(turnDescription && turnDescription.next_player && turnDescription.next_player.name) || '—';
    const policy = clean(turnState.participation_policy || turnState.participationPolicy);
    const grouped = {};
    list.forEach((player) => {
      const team = clean(player.team_id || player.teamId) || 'Sin equipo';
      if (!grouped[team]) grouped[team] = [];
      grouped[team].push(player);
    });
    const teams = Object.keys(grouped);
    return <section style={{border:'1px solid #B7D5FF',background:'linear-gradient(135deg,#EEF4FF,#FFFFFF)',borderRadius:18,padding:14,display:'grid',gap:12}} aria-label="Turno de jugadores">
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <div>
          <div style={{fontSize:10,fontWeight:950,letterSpacing:'.13em',color:'#7A1E2C',textTransform:'uppercase'}}>Turno {Number(turnState.turn_number || 1) || 1}</div>
          <div style={{fontSize:20,fontWeight:950,color:'#001E47'}}>{readOnly ? 'Jugando ahora' : activeId === currentId ? 'Tu turno' : 'Esperando turno'}: {activeName}</div>
          <div style={{fontSize:12,color:'#667085',marginTop:3}}>Siguiente: <b>{nextName}</b> · {policy === 'TEAM_ALTERNATING' ? 'equipos alternados' : policy === 'EVERYONE' ? 'todos contra todos' : 'orden aleatorio'}</div>
        </div>
        <span style={{padding:'7px 10px',borderRadius:999,background:activeId===currentId&&!readOnly?'#EAF8EF':'#FFF7E6',border:`1px solid ${activeId===currentId&&!readOnly?'#BDE8CD':'#FFD88A'}`,color:activeId===currentId&&!readOnly?'#145C38':'#7A4B00',fontSize:11,fontWeight:950}}>
          {readOnly ? 'Vista de control' : activeId === currentId ? 'Podés jugar' : 'Tablero bloqueado'}
        </span>
      </div>
      {!!teams.length && <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(teams.length,3)},minmax(0,1fr))`,gap:9}}>
        {teams.map((team) => <div key={team} style={{border:`1px solid ${clean(turnState.active_team_id)===team?'#073B7A':'#E4E7EC'}`,borderRadius:13,padding:10,background:clean(turnState.active_team_id)===team?'#EEF4FF':'#FFF'}}>
          <div style={{fontSize:11,fontWeight:950,color:'#001E47',marginBottom:7}}>{team === 'NO_TEAM' ? 'Sin equipo' : team}</div>
          <div style={{display:'grid',gap:5}}>{grouped[team].map((player) => {
            const id = normalizedPlayerId(player);
            const active = id === activeId;
            return <div key={id} style={{display:'flex',justifyContent:'space-between',gap:8,padding:'6px 8px',borderRadius:9,background:active?'#EAF8EF':'#F8FAFC',color:active?'#145C38':'#475467',fontSize:11.5,fontWeight:active?900:700}}>
              <span>{clean(player.name || player.nombre) || id}</span><span>{active?'Ahora':id===currentId?'Vos':''}</span>
            </div>;
          })}</div>
        </div>)}
      </div>}
    </section>;
  }

  function CardFace({ card }) {
    if (card.faceType === 'IMAGE' && card.imageUrl) {
      return <img src={card.imageUrl} alt={card.alt || card.label || 'Tarjeta visual'} loading="eager" decoding="async" />;
    }
    if (card.faceType === 'AUDIO' && card.audioUrl) {
      return <div className="elmm-audio-face"><span aria-hidden="true">🔊</span><span>{card.label || 'Escuchar'}</span></div>;
    }
    return <span className="elmm-text-face">{card.label}</span>;
  }

  function MemoryCard({ card, index, open, matched, disabled, onFlip }) {
    const stateLabel = matched ? 'encontrada' : open ? 'abierta' : 'cerrada';
    return <button
      type="button"
      className={`elmm-card ${open?'is-open':''} ${matched?'is-matched':''}`}
      aria-label={`Tarjeta ${index + 1}, ${stateLabel}`}
      aria-pressed={open || matched}
      disabled={disabled || matched}
      onClick={() => onFlip(card)}>
      <span className="elmm-card-inner">
        <span className="elmm-card-back" aria-hidden={open || matched}><span>AN</span></span>
        <span className="elmm-card-front" aria-hidden={!open && !matched}><CardFace card={card}/></span>
      </span>
    </button>;
  }

  function MemoryMatchGameCS21A173(props) {
    const runtime = ensureRuntime();
    const packageInput = props && (props.roomPackage || props.package || props.data) || {};
    const normalized = React.useMemo(() => runtime.normalizeRoomPackage(packageInput), [packageInput]);
    const cards = React.useMemo(() => validateCards(normalized.round.cards), [normalized.round.cards]);
    const turnEngine = props && props.turnEngine || null;
    const rawTurnState = packageInput.turn_state || packageInput.turnState || null;
    const turnState = React.useMemo(() => {
      if (!rawTurnState || !turnEngine || typeof turnEngine.normalizeTurnState !== 'function') return rawTurnState;
      return turnEngine.normalizeTurnState(rawTurnState);
    }, [rawTurnState, turnEngine]);
    const players = Array.isArray(packageInput.players) ? packageInput.players : [];
    const sharedState = packageInput.shared_state || packageInput.sharedState || {};
    const boardVersion = Number(sharedState.board_version || sharedState.boardVersion || 0) || 0;
    const serverMatchedPairs = React.useMemo(() => new Set(
      (Array.isArray(sharedState.matched_pair_ids) ? sharedState.matched_pair_ids : []).map(clean)
    ), [boardVersion, sharedState.matched_pair_ids]);
    const serverMatchedCardIds = React.useMemo(() => cards.filter((card) => serverMatchedPairs.has(card.pairId)).map((card) => card.id), [cards, serverMatchedPairs]);
    const [openIds, setOpenIds] = React.useState([]);
    const [matchedIds, setMatchedIds] = React.useState(serverMatchedCardIds);
    const [locked, setLocked] = React.useState(false);
    const [announcement, setAnnouncement] = React.useState('');
    const timeoutSentRef = React.useRef(false);
    const completionSentRef = React.useRef('');
    const readySentRef = React.useRef('');
    const roundStartedLocalRef = React.useRef(Date.now());

    const configuredPhase = normalized.state.phase;
    const countdownRemainingMs = configuredPhase === 'COUNTDOWN'
      ? normalized.clock.remainingMs(normalized.state.startedAt)
      : 0;
    const phase = configuredPhase === 'COUNTDOWN' && countdownRemainingMs <= 0 ? 'OPEN' : configuredPhase;
    const timerTarget = phase === 'COUNTDOWN' ? normalized.state.startedAt : normalized.state.endsAt;
    const active = phase === 'OPEN' || phase === 'COUNTDOWN';
    const remainingMs = useServerTimer(normalized.clock, timerTarget, active);
    const isTeamMode = normalized.room.mode === 'TEAMS';
    const currentPlayer = props && props.player || normalized.player || null;
    const hasTurnControl = !!(turnState && turnEngine && typeof turnEngine.canPlayerAct === 'function');
    const isMyTurn = hasTurnControl
      ? turnEngine.canPlayerAct(turnState, currentPlayer, {readOnly:!!(props && props.readOnly)})
      : !(props && props.readOnly);
    const canPlay = phase === 'OPEN' && isMyTurn && !locked && remainingMs > 0;
    const turnNumber = Number(turnState && turnState.turn_number || 0) || 0;
    const turnDescription = React.useMemo(() => {
      if (!turnState || !turnEngine || typeof turnEngine.describeTurn !== 'function') return null;
      return turnEngine.describeTurn(turnState, players);
    }, [turnState, turnEngine, players]);

    React.useEffect(() => {
      setOpenIds([]);
      setMatchedIds(serverMatchedCardIds);
      setLocked(false);
      setAnnouncement('');
      timeoutSentRef.current = false;
      completionSentRef.current = '';
      readySentRef.current = '';
      roundStartedLocalRef.current = Date.now();
    }, [normalized.round.roundId]);

    React.useEffect(() => {
      setMatchedIds(serverMatchedCardIds);
    }, [boardVersion, serverMatchedCardIds]);

    React.useEffect(() => {
      setOpenIds([]);
      setLocked(false);
      setAnnouncement('');
      timeoutSentRef.current = false;
      roundStartedLocalRef.current = Date.now();
    }, [turnNumber]);

    React.useEffect(() => {
      if (phase !== 'OPEN' || remainingMs > 0 || timeoutSentRef.current || !isMyTurn || (props && props.readOnly)) return;
      timeoutSentRef.current = true;
      setLocked(true);
      setAnnouncement('Tiempo finalizado.');
      if (props && typeof props.onTimeout === 'function') {
        props.onTimeout({
          roomCode: normalized.room.roomCode,
          roundId: normalized.round.roundId,
          turnNumber,
        });
      }
    }, [remainingMs, phase, isMyTurn, normalized.room.roomCode, normalized.round.roundId, props, turnNumber]);

    React.useEffect(() => {
      if (!props || typeof props.onReady !== 'function') return;
      const readyKey = `${normalized.round.roundId}|${cards.length}|${hasTurnControl?'TURN':'FREE'}`;
      if (readySentRef.current === readyKey) return;
      readySentRef.current = readyKey;
      props.onReady({
        version: VERSION,
        gameId: 'MEMORY_MATCH',
        cardCount: cards.length,
        pairCount: cards.length / 2,
        turnControlled: hasTurnControl,
      });
    }, [cards.length, hasTurnControl, normalized.round.roundId, props]);

    const submitPair = React.useCallback(async (first, second, correct) => {
      if (!props || typeof props.onSubmit !== 'function') return {ok:true,accepted:true,correct};
      const playerId = normalizedPlayerId(currentPlayer);
      const teamId = clean(currentPlayer && (currentPlayer.team_id || currentPlayer.teamId));
      const submission = runtime.buildSubmission({
        roomCode: normalized.room.roomCode,
        roundId: normalized.round.roundId,
        playerId,
        teamId,
        answerType: 'PAIR',
        answerValue: {
          first_card_id: first.id,
          second_card_id: second.id,
          pair_id: first.pairId,
          correct,
        },
        timeMs: Math.max(0, Date.now() - roundStartedLocalRef.current),
      });
      return props.onSubmit(submission);
    }, [props, currentPlayer, runtime, normalized.room.roomCode, normalized.round.roundId]);

    const flip = React.useCallback((card) => {
      if (!canPlay || openIds.includes(card.id) || matchedIds.includes(card.id)) return;
      const next = openIds.concat(card.id).slice(-2);
      setOpenIds(next);
      if (next.length < 2) {
        setAnnouncement('Primera tarjeta seleccionada.');
        return;
      }

      const first = cards.find(item => item.id === next[0]);
      const second = cards.find(item => item.id === next[1]);
      if (!first || !second) return;
      const correct = first.pairId === second.pairId;
      setLocked(true);
      setAnnouncement(correct ? 'Verificando par correcto…' : 'Verificando intento…');

      Promise.resolve(submitPair(first, second, correct)).then((result) => {
        if (result && result.accepted === false) {
          setAnnouncement(result.message || result.mensaje || 'El intento no fue aceptado.');
          setOpenIds([]);
          setLocked(false);
          return;
        }
        setAnnouncement(correct ? '¡Par correcto!' : 'No forman un par.');
        window.setTimeout(() => {
          if (correct) setMatchedIds(current => Array.from(new Set(current.concat(first.id, second.id))));
          setOpenIds([]);
          setLocked(false);
        }, correct ? 600 : 900);
      }).catch((error) => {
        setAnnouncement(error && error.message ? error.message : 'No se pudo guardar el intento.');
        setOpenIds([]);
        setLocked(false);
      });
    }, [canPlay, openIds, matchedIds, cards, submitPair]);

    const completed = matchedIds.length === cards.length || sharedState.completed === true;
    React.useEffect(() => {
      if (!completed || (props && props.readOnly)) return;
      const completionKey = normalized.round.roundId || `${normalized.room.roomCode}|COMPLETE`;
      if (completionSentRef.current === completionKey) return;
      completionSentRef.current = completionKey;
      setAnnouncement('¡Tablero completado!');
      if (props && typeof props.onComplete === 'function') {
        props.onComplete({
          roomCode: normalized.room.roomCode,
          roundId: normalized.round.roundId,
          elapsedMs: Math.max(0, Date.now() - roundStartedLocalRef.current),
        });
      }
    }, [completed, props, normalized.room.roomCode, normalized.round.roundId]);

    const statusText = phase === 'OPEN'
      ? (props && props.readOnly ? 'Vista de control' : isMyTurn ? 'Tu turno' : 'Esperando turno')
      : phase;

    return <section className="elmm-shell" data-game-engine="MEMORY_MATCH" data-version={VERSION}>
      <header className="elmm-header">
        <div>
          <div className="elmm-kicker">English LAB · Memory Match</div>
          <h2>{clean(packageInput && packageInput.round && packageInput.round.title) || 'Encuentra los pares'}</h2>
          <p>{isTeamMode ? 'Cada integrante juega cuando le corresponde a su equipo.' : hasTurnControl ? 'Cada estudiante juega una vez y el turno rota automáticamente.' : 'Seleccioná dos tarjetas que formen un par.'}</p>
        </div>
        <div className="elmm-room-chip">{normalized.room.roomCode || 'SALA'}</div>
      </header>

      <TimerBar remainingMs={remainingMs} durationMs={phase==='COUNTDOWN'?normalized.rules.autoStartDelayMs:normalized.rules.roundDurationMs}/>
      <TurnRoster players={players} turnState={turnState} turnDescription={turnDescription} currentPlayer={currentPlayer} readOnly={!!(props && props.readOnly)}/>
      <TeamPanel teams={normalized.teams} activeTeamId={clean(turnState && turnState.active_team_id) || normalized.state.activeTeamId} player={currentPlayer}/>

      <div className="elmm-status-row">
        <span>{matchedIds.length / 2} / {cards.length / 2} pares</span>
        <span>{statusText}</span>
      </div>

      <div className={`elmm-grid elmm-grid-${Math.min(cards.length, 16)}`} role="grid" aria-label="Tablero de memoria">
        {cards.map((card, index) => <MemoryCard
          key={card.id}
          card={card}
          index={index}
          open={openIds.includes(card.id)}
          matched={matchedIds.includes(card.id)}
          disabled={!canPlay || locked}
          onFlip={flip}/>) }
      </div>

      <div className="elmm-live-announcement" aria-live="polite">{announcement}</div>
      {completed && <div className="elmm-complete" role="status">Tablero completado</div>}
    </section>;
  }

  function registerGameEngine(registry) {
    const target = registry || global.EnglishLabGameRegistryCS21A173 || {};
    target.MEMORY_MATCH = Object.freeze({
      id: 'MEMORY_MATCH',
      version: VERSION,
      component: MemoryMatchGameCS21A173,
      accepts: ['TEXT', 'IMAGE', 'AUDIO'],
      turnPolicies: ['RANDOM_PLAYER', 'TEAM_ALTERNATING'],
    });
    global.EnglishLabGameRegistryCS21A173 = target;
    return target.MEMORY_MATCH;
  }

  global.MemoryMatchGameCS21A173 = MemoryMatchGameCS21A173;
  global.validateMemoryMatchCardsCS21A173 = validateCards;
  global.registerMemoryMatchCS21A173 = registerGameEngine;
  registerGameEngine();
})(window);
