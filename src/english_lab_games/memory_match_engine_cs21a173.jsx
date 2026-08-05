// CS21A173 · Motor visual Memory Match para English LAB.
// Componente puro: recibe room package compacto; no consulta backend ni contiene banco de preguntas.
/* global React */
(function (global) {
  'use strict';

  const Runtime = global.EnglishLabRuntimeCS21A173;
  const VERSION = 'CS21A173';

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
    const [openIds, setOpenIds] = React.useState([]);
    const [matchedIds, setMatchedIds] = React.useState([]);
    const [locked, setLocked] = React.useState(false);
    const [announcement, setAnnouncement] = React.useState('');
    const timeoutSentRef = React.useRef(false);
    const roundStartedLocalRef = React.useRef(Date.now());

    const phase = normalized.state.phase;
    const active = phase === 'OPEN' || phase === 'COUNTDOWN';
    const remainingMs = useServerTimer(normalized.clock, normalized.state.endsAt, active);
    const isTeamMode = normalized.room.mode === 'TEAMS';
    const currentPlayer = props && props.player || normalized.player || null;
    const canPlay = phase === 'OPEN' && !locked && remainingMs > 0;

    React.useEffect(() => {
      setOpenIds([]);
      setMatchedIds([]);
      setLocked(false);
      setAnnouncement('');
      timeoutSentRef.current = false;
      roundStartedLocalRef.current = Date.now();
    }, [normalized.round.roundId]);

    React.useEffect(() => {
      if (phase !== 'OPEN' || remainingMs > 0 || timeoutSentRef.current) return;
      timeoutSentRef.current = true;
      setLocked(true);
      setAnnouncement('Tiempo finalizado.');
      if (props && typeof props.onTimeout === 'function') {
        props.onTimeout({
          roomCode: normalized.room.roomCode,
          roundId: normalized.round.roundId,
        });
      }
    }, [remainingMs, phase, normalized.room.roomCode, normalized.round.roundId, props]);

    React.useEffect(() => {
      if (props && typeof props.onReady === 'function') {
        props.onReady({
          version: VERSION,
          gameId: 'MEMORY_MATCH',
          cardCount: cards.length,
          pairCount: cards.length / 2,
        });
      }
    }, [cards.length, props]);

    const submitPair = React.useCallback(async (first, second, correct) => {
      if (!props || typeof props.onSubmit !== 'function') return;
      const playerId = clean(currentPlayer && (currentPlayer.player_id || currentPlayer.playerId || currentPlayer.id));
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
      await props.onSubmit(submission);
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
      setAnnouncement(correct ? '¡Par correcto!' : 'No forman un par.');

      Promise.resolve(submitPair(first, second, correct)).catch(() => {});
      window.setTimeout(() => {
        if (correct) setMatchedIds(current => Array.from(new Set(current.concat(first.id, second.id))));
        setOpenIds([]);
        setLocked(false);
      }, correct ? 600 : 900);
    }, [canPlay, openIds, matchedIds, cards, submitPair]);

    const completed = matchedIds.length === cards.length;
    React.useEffect(() => {
      if (!completed) return;
      setAnnouncement('¡Tablero completado!');
      if (props && typeof props.onComplete === 'function') {
        props.onComplete({
          roomCode: normalized.room.roomCode,
          roundId: normalized.round.roundId,
          elapsedMs: Math.max(0, Date.now() - roundStartedLocalRef.current),
        });
      }
    }, [completed, props, normalized.room.roomCode, normalized.round.roundId]);

    return <section className="elmm-shell" data-game-engine="MEMORY_MATCH" data-version={VERSION}>
      <header className="elmm-header">
        <div>
          <div className="elmm-kicker">English LAB · Memory Match</div>
          <h2>{clean(packageInput && packageInput.round && packageInput.round.title) || 'Encuentra los pares'}</h2>
          <p>{isTeamMode ? 'Debatan, respeten el turno y seleccionen dos tarjetas.' : 'Seleccioná dos tarjetas que formen un par.'}</p>
        </div>
        <div className="elmm-room-chip">{normalized.room.roomCode || 'SALA'}</div>
      </header>

      <TimerBar remainingMs={remainingMs} durationMs={normalized.rules.roundDurationMs}/>
      <TeamPanel teams={normalized.teams} activeTeamId={normalized.state.activeTeamId} player={currentPlayer}/>

      <div className="elmm-status-row">
        <span>{matchedIds.length / 2} / {cards.length / 2} pares</span>
        <span>{phase === 'OPEN' ? (canPlay ? 'Ronda abierta' : 'Esperando') : phase}</span>
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
    });
    global.EnglishLabGameRegistryCS21A173 = target;
    return target.MEMORY_MATCH;
  }

  global.MemoryMatchGameCS21A173 = MemoryMatchGameCS21A173;
  global.validateMemoryMatchCardsCS21A173 = validateCards;
  global.registerMemoryMatchCS21A173 = registerGameEngine;
  registerGameEngine();
})(window);
