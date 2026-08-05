// CS21A174/CS21A176 · Adaptador canónico entre English LAB Live, Memory Match y turnos compartidos.
// Solo se activa para GAME_ID = MEMORY_MATCH. No contiene contenido pedagógico.
/* global React, MemoryMatchGameCS21A173 */
(function (global) {
  'use strict';

  const VERSION = 'CS21A176';
  const GAME_ID = 'MEMORY_MATCH';
  const STYLE_ID = 'english-lab-memory-match-cs21a174';
  const STYLE_HREF = 'styles/english_lab_memory_match_cs21a173.css?v=CS21A176';
  const TURN_ENGINE_ID = 'english-lab-turn-engine-cs21a176';
  const TURN_ENGINE_SRC = 'src/english_lab_games/english_lab_turn_engine_cs21a176.js?v=CS21A176';
  const ENDPOINTS = Object.freeze({
    createRoom: 'englishLabMemoryMatchCreateRoom',
    startRoom: 'englishLabMemoryMatchStartRoom',
    getPlayerState: 'englishLabMemoryMatchGetPlayerState',
    submitPair: 'englishLabMemoryMatchSubmitPair',
    getRoomControl: 'englishLabMemoryMatchGetRoomControl',
    closeRound: 'englishLabMemoryMatchCloseRound',
  });

  let turnEnginePromise = null;

  function ensureStyles() {
    const doc = global.document;
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    const link = doc.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = STYLE_HREF;
    doc.head.appendChild(link);
  }

  function ensureTurnEngine() {
    if (global.EnglishLabTurnEngineCS21A176) return Promise.resolve(global.EnglishLabTurnEngineCS21A176);
    if (turnEnginePromise) return turnEnginePromise;
    const doc = global.document;
    if (!doc || !doc.head) return Promise.reject(new Error('No se puede cargar el motor de turnos.'));
    turnEnginePromise = new Promise((resolve, reject) => {
      const existing = doc.getElementById(TURN_ENGINE_ID);
      const script = existing || doc.createElement('script');
      function ready() {
        if (global.EnglishLabTurnEngineCS21A176) resolve(global.EnglishLabTurnEngineCS21A176);
        else reject(new Error('El motor de turnos no terminó de cargar.'));
      }
      script.addEventListener('load', ready, {once:true});
      script.addEventListener('error', () => reject(new Error('No se pudo cargar el motor de turnos.')), {once:true});
      if (!existing) {
        script.id = TURN_ENGINE_ID;
        script.src = TURN_ENGINE_SRC;
        script.async = true;
        doc.head.appendChild(script);
      } else if (global.EnglishLabTurnEngineCS21A176) ready();
    }).catch((error) => {
      turnEnginePromise = null;
      throw error;
    });
    return turnEnginePromise;
  }

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function upper(value) {
    return clean(value).toUpperCase();
  }

  function roomGameId(room) {
    return upper(room && (room.game_id || room.gameId || room.game_code || room.gameCode || room.GAME_CODE));
  }

  function isMemoryMatchRoom(room) {
    return roomGameId(room) === GAME_ID;
  }

  function roomCode(room, roomPackage) {
    return clean(
      roomPackage && roomPackage.room && (roomPackage.room.room_code || roomPackage.room.roomCode) ||
      room && (room.room_code || room.roomCode || room.ROOM_CODE)
    ).toUpperCase();
  }

  function playerId(player) {
    return clean(player && (
      player.player_id || player.playerId || player.cod_estudiante ||
      player.codigo_estudiante || player.COD_ESTUDIANTE || player.id
    ));
  }

  function packageFromLiveState(state) {
    if (!state || typeof state !== 'object') return null;
    if (state.room_package && typeof state.room_package === 'object') return state.room_package;
    const question = state.question || state.current_question || null;
    if (question && question.room_package && typeof question.room_package === 'object') return question.room_package;
    return null;
  }

  function gameDescriptor() {
    return Object.freeze({
      code: GAME_ID,
      label: 'Memory Match',
      area: 'Vocabulario visual',
      note: 'Tarjetas palabra, imagen o audio; individual o por equipos.',
      engine: 'MemoryMatchGameCS21A173',
      turnEngine: 'EnglishLabTurnEngineCS21A176',
      participationPolicies: ['RANDOM_PLAYER', 'TEAM_ALTERNATING'],
      createEndpoint: ENDPOINTS.createRoom,
      startEndpoint: ENDPOINTS.startRoom,
    });
  }

  function submitPayload(submission, room, pkg, player) {
    const source = submission || {};
    return Object.freeze({
      room_code: roomCode(room, pkg),
      player_id: playerId(player),
      answer_value: source.answer_value || source.answerValue || null,
      time_ms: Math.max(0, Number(source.time_ms || source.timeMs || 0) || 0),
    });
  }

  function MemoryMatchLiveRoundCS21A174(props) {
    ensureStyles();
    const state = props && props.state || {};
    const room = state.room || props.room || {};
    const player = state.player || props.player || null;
    const pkg = packageFromLiveState(state) || props.roomPackage || null;
    const postLive = props && props.postLive;
    const onRefresh = props && props.onRefresh;
    const [error, setError] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const [lastResult, setLastResult] = React.useState(null);
    const [turnReady, setTurnReady] = React.useState(!!global.EnglishLabTurnEngineCS21A176);

    React.useEffect(() => {
      let active = true;
      ensureTurnEngine().then(() => {
        if (active) setTurnReady(true);
      }).catch((err) => {
        if (active) setError(err && err.message ? err.message : String(err));
      });
      return () => { active = false; };
    }, []);

    if (!pkg) {
      return <div role="status" style={{padding:16,border:'1px solid #FFD88A',background:'#FFF7E6',borderRadius:14,color:'#7A4B00',fontWeight:800}}>
        Esperando el paquete de tarjetas de la sala…
      </div>;
    }
    if (typeof global.MemoryMatchGameCS21A173 !== 'function') {
      return <div role="alert" style={{padding:16,border:'1px solid #F5B5B5',background:'#FDECEA',borderRadius:14,color:'#8B1F1F',fontWeight:800}}>
        El motor Memory Match no terminó de cargar.
      </div>;
    }
    if (pkg.turn_state && !turnReady) {
      return <div role="status" style={{padding:16,border:'1px solid #B7D5FF',background:'#EEF4FF',borderRadius:14,color:'#073B7A',fontWeight:800}}>
        Cargando turnos de la sala…
      </div>;
    }

    async function handleSubmit(submission) {
      if (typeof postLive !== 'function') throw new Error('postLive no está disponible.');
      setBusy(true); setError('');
      try {
        const result = await postLive(ENDPOINTS.submitPair, submitPayload(submission, room, pkg, player), 45000);
        setLastResult(result || null);
        if (typeof onRefresh === 'function') await onRefresh();
        return result;
      } catch (err) {
        const message = err && err.message ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setBusy(false);
      }
    }

    return <div data-live-game="MEMORY_MATCH" data-version={VERSION} style={{display:'grid',gap:12}}>
      {error && <div role="alert" style={{padding:'10px 12px',border:'1px solid #F5B5B5',background:'#FDECEA',borderRadius:12,color:'#8B1F1F',fontWeight:800}}>{error}</div>}
      {busy && <div role="status" style={{fontSize:12,fontWeight:900,color:'#073B7A'}}>Guardando intento…</div>}
      {lastResult && <div aria-live="polite" style={{fontSize:12,fontWeight:900,color:lastResult.correct?'#145C38':'#7A4B00'}}>
        {lastResult.correct ? `Par correcto · ${Number(lastResult.points || 0)} puntos` : lastResult.message || 'No forman un par'}
      </div>}
      <MemoryMatchGameCS21A173
        roomPackage={pkg}
        player={player}
        turnEngine={global.EnglishLabTurnEngineCS21A176 || null}
        onReady={props.onReady}
        onSubmit={handleSubmit}
        onTimeout={props.onTimeout}
        onComplete={props.onComplete}
        readOnly={!!props.readOnly}/>
    </div>;
  }

  const api = Object.freeze({
    VERSION,
    GAME_ID,
    ENDPOINTS,
    STYLE_HREF,
    TURN_ENGINE_SRC,
    ensureStyles,
    ensureTurnEngine,
    isMemoryMatchRoom,
    roomGameId,
    packageFromLiveState,
    gameDescriptor,
    submitPayload,
    component: MemoryMatchLiveRoundCS21A174,
  });

  global.MemoryMatchLiveRoundCS21A174 = MemoryMatchLiveRoundCS21A174;
  global.EnglishLabMemoryMatchLiveCS21A174 = api;
})(window);
