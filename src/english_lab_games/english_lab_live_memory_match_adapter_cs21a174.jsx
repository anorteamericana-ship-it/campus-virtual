// CS21A174-CS21A188 · Adaptador canónico entre English LAB Live, Shared Discovery y turnos compartidos.
// Solo se activa para GAME_ID = MEMORY_MATCH. No contiene contenido pedagógico.
/* global React, MemoryMatchGameCS21A173 */
(function (global) {
  'use strict';

  const VERSION = 'CS21A188';
  const GAME_ID = 'MEMORY_MATCH';
  const GAME_LABEL = 'MEMORY MATCH';
  const STYLE_ID = 'english-lab-memory-match-cs21a174';
  const STYLE_HREF = 'styles/english_lab_memory_match_cs21a173.css?v=CS21A188';
  const TURN_ENGINE_ID = 'english-lab-turn-engine-cs21a176';
  const TURN_ENGINE_SRC = 'src/english_lab_games/english_lab_turn_engine_cs21a176.js?v=CS21A176';
  const SYNC_GUARD_ID = 'english-lab-live-sync-cs21a177';
  const SYNC_GUARD_SRC = 'src/english_lab_games/english_lab_live_sync_guard_cs21a177.js?v=CS21A188';
  const LIVE_POLL_MS = 1500;
  const ENDPOINTS = Object.freeze({
    createRoom: 'englishLabMemoryMatchCreateRoom',
    startRoom: 'englishLabMemoryMatchStartRoom',
    getPlayerState: 'englishLabMemoryMatchGetPlayerState',
    submitPair: 'englishLabMemoryMatchSubmitPair',
    getRoomControl: 'englishLabMemoryMatchGetRoomControl',
    closeRound: 'englishLabMemoryMatchCloseRound',
  });

  let turnEnginePromise = null;
  let syncGuardPromise = null;

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function upper(value) {
    return clean(value).toUpperCase();
  }

  function ensureStyles() {
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

  function loadScript(id, src, readyCheck, errorMessage) {
    const doc = global.document;
    if (readyCheck()) return Promise.resolve(readyCheck());
    if (!doc || !doc.head) return Promise.reject(new Error(errorMessage));
    return new Promise((resolve, reject) => {
      const existing = doc.getElementById(id);
      const script = existing || doc.createElement('script');
      function ready() {
        const value = readyCheck();
        if (value) resolve(value);
        else reject(new Error(errorMessage));
      }
      script.addEventListener('load', ready, {once:true});
      script.addEventListener('error', () => reject(new Error(errorMessage)), {once:true});
      if (!existing) {
        script.id = id;
        script.src = src;
        script.async = true;
        doc.head.appendChild(script);
      } else {
        const value = readyCheck();
        if (value) resolve(value);
      }
    });
  }

  function ensureTurnEngine() {
    if (global.EnglishLabTurnEngineCS21A176) return Promise.resolve(global.EnglishLabTurnEngineCS21A176);
    if (turnEnginePromise) return turnEnginePromise;
    turnEnginePromise = loadScript(
      TURN_ENGINE_ID,
      TURN_ENGINE_SRC,
      () => global.EnglishLabTurnEngineCS21A176 || null,
      'No se pudo cargar el motor de turnos.'
    ).catch((error) => {
      turnEnginePromise = null;
      throw error;
    });
    return turnEnginePromise;
  }

  function ensureSyncGuard() {
    if (global.EnglishLabLiveSyncCS21A177) return Promise.resolve(global.EnglishLabLiveSyncCS21A177);
    if (syncGuardPromise) return syncGuardPromise;
    syncGuardPromise = loadScript(
      SYNC_GUARD_ID,
      SYNC_GUARD_SRC,
      () => global.EnglishLabLiveSyncCS21A177 || null,
      'No se pudo cargar la protección de sincronización.'
    ).catch((error) => {
      syncGuardPromise = null;
      throw error;
    });
    return syncGuardPromise;
  }

  function roomGameId(room) {
    return upper(room && (
      room.game_id || room.gameId || room.game_code || room.gameCode ||
      room.GAME_ID || room.GAME_CODE
    ));
  }

  function roomGameLabel(room) {
    return upper(room && (
      room.game_label || room.gameLabel || room.GAME_LABEL || room.label
    ));
  }

  function isMemoryMatchRoom(room) {
    if (!room || typeof room !== 'object') return false;
    if (room.memory_match === true || room.memoryMatch === true) return true;
    if (roomGameId(room) === GAME_ID) return true;
    if (roomGameLabel(room) === GAME_LABEL) return true;
    if (room.room && room.room !== room && isMemoryMatchRoom(room.room)) return true;
    if (room.room_package && room.room_package.room && isMemoryMatchRoom(room.room_package.room)) return true;
    return false;
  }

  function roomCode(room, roomPackage) {
    return clean(
      roomPackage && roomPackage.room && (roomPackage.room.room_code || roomPackage.room.roomCode) ||
      room && (room.room_code || room.roomCode || room.ROOM_CODE)
    ).toUpperCase();
  }

  function roomStatus(room) {
    return upper(room && (room.status || room.STATUS));
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

  function mergeLiveState(current, result, room, player) {
    if (!result || typeof result !== 'object') return current;
    return {
      ...(current || {}),
      ...result,
      room: result.room || room || (current && current.room) || {},
      player: result.player || player || (current && current.player) || null,
      room_package: result.room_package || (current && current.room_package) || null,
    };
  }

  function gameDescriptor() {
    return Object.freeze({
      code: GAME_ID,
      label: 'Memory Match',
      area: 'Vocabulario visual',
      note: 'Tarjetas palabra, imagen o audio; individual o por equipos.',
      engine: 'MemoryMatchGameCS21A173',
      turnEngine: 'EnglishLabTurnEngineCS21A176',
      syncGuard: 'EnglishLabLiveSyncCS21A177',
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

  function resultLabel(result) {
    if (!result || typeof result !== 'object') return '';
    const action = upper(result.action || result.answer_type);
    if (action === 'DISCOVER_CARD') return result.accepted === false ? 'Carta ya visible para la sala.' : 'Carta compartida con toda la sala.';
    if (result.correct === true) return `Pareja reclamada · +${Number(result.points || 0)} · seguís jugando`;
    if (result.correct === false) return result.message || result.mensaje || 'No coinciden · quedan descubiertas';
    return result.message || result.mensaje || '';
  }

  function MemoryMatchLiveRoundCS21A174(props) {
    ensureStyles();
    const incomingState = props && props.state || {};
    const postLive = props && props.postLive;
    const onRefresh = props && props.onRefresh;
    const readOnly = !!(props && props.readOnly);
    const [liveState, setLiveState] = React.useState(incomingState);
    const [error, setError] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const [lastResult, setLastResult] = React.useState(null);
    const [turnReady, setTurnReady] = React.useState(!!global.EnglishLabTurnEngineCS21A176);
    const pollingRef = React.useRef(false);

    React.useEffect(() => {
      setLiveState(incomingState);
    }, [incomingState]);

    const state = liveState && typeof liveState === 'object' ? liveState : incomingState;
    const room = state.room || props.room || {};
    const player = state.player || props.player || null;
    const pkg = packageFromLiveState(state) || props.roomPackage || null;
    const code = roomCode(room, pkg);
    const status = roomStatus(room);
    const pid = playerId(player);

    React.useEffect(() => {
      let active = true;
      Promise.all([ensureTurnEngine(), ensureSyncGuard()]).then(() => {
        if (active) setTurnReady(true);
      }).catch((err) => {
        if (active) setError(err && err.message ? err.message : String(err));
      });
      return () => { active = false; };
    }, []);

    // Shared Discovery necesita convergencia visible rápida, pero solo dentro de
    // Memory Match. Este polling es silencioso, no se superpone y se pausa cuando
    // la pestaña queda oculta. El flujo base del Campus permanece intacto.
    React.useEffect(() => {
      if (typeof postLive !== 'function' || !code || status === 'CLOSED') return undefined;
      if (!readOnly && !pid) return undefined;
      let disposed = false;
      async function poll() {
        if (disposed || pollingRef.current) return;
        if (global.document && global.document.visibilityState === 'hidden') return;
        pollingRef.current = true;
        try {
          const endpoint = readOnly ? ENDPOINTS.getRoomControl : ENDPOINTS.getPlayerState;
          const payload = readOnly
            ? {room_id:code, room_code:code}
            : {room_code:code, player_id:pid, cod_estudiante:pid};
          const result = await postLive(endpoint, payload, 45000);
          if (!disposed && result && result.ok !== false) {
            setLiveState(current => mergeLiveState(current, result, room, player));
            setError('');
          }
        } catch (err) {
          if (!disposed) setError(err && err.message ? err.message : String(err));
        } finally {
          pollingRef.current = false;
        }
      }
      const timer = global.setInterval(poll, LIVE_POLL_MS);
      return () => {
        disposed = true;
        global.clearInterval(timer);
      };
    }, [readOnly, postLive, code, status, pid]);

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
      setBusy(true);
      setError('');
      try {
        const result = await postLive(ENDPOINTS.submitPair, submitPayload(submission, room, pkg, player), 45000);
        setLastResult(result || null);
        if (result && result.room_package) {
          // La pantalla que ejecutó la acción adopta el estado autoritativo devuelto
          // de inmediato. No abre un spinner ni fuerza otra lectura de red.
          setLiveState(current => mergeLiveState(current, result, room, player));
        } else if (typeof onRefresh === 'function') {
          await onRefresh();
        }
        return result;
      } catch (err) {
        const message = err && err.message ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setBusy(false);
      }
    }

    return <div data-live-game="MEMORY_MATCH" data-version={VERSION} data-live-poll-ms={LIVE_POLL_MS} style={{display:'grid',gap:12}}>
      {error && <div role="alert" style={{padding:'10px 12px',border:'1px solid #F5B5B5',background:'#FDECEA',borderRadius:12,color:'#8B1F1F',fontWeight:800}}>{error}</div>}
      {busy && <div role="status" style={{fontSize:12,fontWeight:900,color:'#073B7A'}}>Sincronizando jugada…</div>}
      {lastResult && resultLabel(lastResult) && <div aria-live="polite" style={{fontSize:12,fontWeight:900,color:lastResult.correct?'#145C38':'#073B7A'}}>{resultLabel(lastResult)}</div>}
      <MemoryMatchGameCS21A173
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

  ensureSyncGuard().catch(() => {});

  const api = Object.freeze({
    VERSION,
    GAME_ID,
    ENDPOINTS,
    STYLE_HREF,
    TURN_ENGINE_SRC,
    SYNC_GUARD_SRC,
    LIVE_POLL_MS,
    READ_ONLY_POLL_MS:LIVE_POLL_MS,
    ensureStyles,
    ensureTurnEngine,
    ensureSyncGuard,
    isMemoryMatchRoom,
    roomGameId,
    roomGameLabel,
    packageFromLiveState,
    mergeLiveState,
    gameDescriptor,
    submitPayload,
    resultLabel,
    component: MemoryMatchLiveRoundCS21A174,
  });

  global.MemoryMatchLiveRoundCS21A174 = MemoryMatchLiveRoundCS21A174;
  global.EnglishLabMemoryMatchLiveCS21A174 = api;
})(window);
