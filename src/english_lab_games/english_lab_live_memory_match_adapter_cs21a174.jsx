// CS21A174 · Adaptador canónico entre English LAB Live y el motor Memory Match.
// No contiene contenido pedagógico ni consulta Sheets.
/* global React, MemoryMatchGameCS21A173 */
(function (global) {
  'use strict';

  const VERSION = 'CS21A174';
  const GAME_ID = 'MEMORY_MATCH';
  const ENDPOINTS = Object.freeze({
    createRoom: 'englishLabMemoryMatchCreateRoom',
    startRoom: 'englishLabMemoryMatchStartRoom',
    getPlayerState: 'englishLabMemoryMatchGetPlayerState',
    submitPair: 'englishLabMemoryMatchSubmitPair',
    getRoomControl: 'englishLabMemoryMatchGetRoomControl',
    closeRound: 'englishLabMemoryMatchCloseRound',
  });

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
    const state = props && props.state || {};
    const room = state.room || props.room || {};
    const player = state.player || props.player || null;
    const pkg = packageFromLiveState(state) || props.roomPackage || null;
    const postLive = props && props.postLive;
    const onRefresh = props && props.onRefresh;
    const [error, setError] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const [lastResult, setLastResult] = React.useState(null);

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

    async function handleSubmit(submission) {
      if (typeof postLive !== 'function') throw new Error('postLive no está disponible.');
      setBusy(true); setError('');
      try {
        const result = await postLive(ENDPOINTS.submitPair, submitPayload(submission, room, pkg, player), 20000);
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
        {lastResult.correct ? `Par correcto · ${Number(lastResult.points || 0)} puntos` : 'No forman un par'}
      </div>}
      <MemoryMatchGameCS21A173
        roomPackage={pkg}
        player={player}
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
