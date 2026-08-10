// CS21A191 · Ahorcado integrado a English LAB Live.
// Capa aditiva: no reemplaza Memory Match ni los juegos históricos.
/* global React */
(function installEnglishLabHangmanLiveCS21A191(global) {
  'use strict';

  if (!global || global.EnglishLabHangmanCS21A191) return;

  const VERSION = 'CS21A191';
  const GAME_ID = 'HANGMAN';
  const EVENT_STATE = 'an:english-lab-hangman-state';
  const ACTIVE_ROOM_KEY = 'elh191_active_room';
  const STYLE_ID = 'elh191-style';
  const STYLE_HREF = 'styles/english_lab_hangman_cs21a191.css?v=CS21A191';
  const HANGMAN_ENDPOINTS = new Set([
    'englishLabLiveJoinRoom','englishLabLiveGetPlayerState',
    'englishLabHangmanJoinRoom','englishLabHangmanGetPlayerState','englishLabHangmanAction',
    'englishLabHangmanStartRoom','englishLabHangmanGetRoomControl','englishLabHangmanNextRound',
    'englishLabHangmanCloseRound','englishLabHangmanCloseRoom','englishLabHangmanCreateRoom'
  ]);

  const Engine = global.EnglishLabHangmanEngineCS21A191;
  const Registry = global.EnglishLabGameRegistryCS21A191;
  if (!Engine) throw new Error('Falta EnglishLabHangmanEngineCS21A191.');

  function clean(value) { return String(value == null ? '' : value).trim(); }
  function upper(value) { return clean(value).toUpperCase(); }
  function publicCode(value) { return upper(value).replace(/[^A-Z0-9-]/g, '').slice(0, 12); }
  function groupCode(group) { return clean(typeof group === 'object' ? (group.code || group.cod_grupo || group.codigo || group.grupo) : group); }
  function levelId(group) { const code=groupCode(group); return upper(group?.nivelId || group?.nivel || code.split('-')[0] || 'B1'); }
  function levelLabel(id) { return ({B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'}[upper(id)] || id || 'Nivel'); }
  function unitCode(value) { const n=Math.max(1,Math.min(16,Number(String(value||'').replace(/\D/g,''))||1)); return 'U'+String(n).padStart(2,'0'); }
  function sessionToken() { return typeof global.getSessionToken === 'function' ? global.getSessionToken() : ''; }
  function sessionUser(props) {
    if (props?.usuario) return props.usuario;
    try { return typeof global.getSesion === 'function' ? (global.getSesion() || {}) : JSON.parse(global.sessionStorage.getItem('an_usuario') || '{}'); }
    catch (_) { return {}; }
  }
  function userCode(props) { const u=sessionUser(props); return clean(u.codigo || u.CODIGO || u.cod_estudiante || u.COD_ESTUDIANTE || u.cedula || u.CEDULA); }
  function userName(props) { const u=sessionUser(props); return clean(u.nombre || u.nombre_completo || u.NOMBRE || u.name || userCode(props) || 'Estudiante'); }

  function ensureStyle() {
    if (!global.document || global.document.getElementById(STYLE_ID)) return;
    const doc=global.document;
    let expectedPath='';
    try { expectedPath=new global.URL(STYLE_HREF,doc.baseURI || global.location?.href || '/').pathname; }
    catch (_) { expectedPath=STYLE_HREF.split('?')[0].replace(/^\.?\//,'/'); }
    const existing=Array.from(doc.querySelectorAll('link[rel~="stylesheet"][href]')).find(link=>{
      try { return new global.URL(link.getAttribute('href'),doc.baseURI || global.location?.href || '/').pathname===expectedPath; }
      catch (_) { return link.getAttribute('href').split('?')[0].replace(/^\.?\//,'/')===expectedPath; }
    });
    if(existing){ existing.id=STYLE_ID; return; }
    const link=doc.createElement('link'); link.id=STYLE_ID; link.rel='stylesheet'; link.href=STYLE_HREF; doc.head.appendChild(link);
  }
  ensureStyle();

  async function post(fn, payload={}, timeoutMs=35000) {
    const endpoint=global.APPS_SCRIPT_URL;
    if (!endpoint) throw new Error('No está configurada la URL de Apps Script.');
    const controller=typeof AbortController!=='undefined' ? new AbortController() : null;
    const timer=controller ? setTimeout(()=>controller.abort(),timeoutMs) : null;
    try {
      const response=await global.fetch(`${endpoint}?fn=${encodeURIComponent(fn)}`,{
        method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({fn,token:sessionToken(),...payload}),signal:controller?controller.signal:undefined
      });
      const text=await response.text();
      let data=null;
      try { data=text?JSON.parse(text):null; } catch (_) { throw new Error('Respuesta inválida del backend.'); }
      if (!response.ok || !data || data.ok===false) throw new Error(data?.mensaje || data?.message || data?.error || `HTTP ${response.status}`);
      return data;
    } catch (error) {
      if (error?.name==='AbortError') throw new Error('El backend tardó demasiado en responder.');
      throw error;
    } finally { if (timer) clearTimeout(timer); }
  }

  function gameIdFromRoom(room) {
    return Registry ? Registry.gameIdFromRoom(room) : upper(room?.game_id || room?.game_code || room?.GAME_ID || room?.GAME_CODE);
  }
  function isHangmanPayload(data) {
    if (!data || typeof data!=='object') return false;
    if (data.hangman===true) return true;
    if (gameIdFromRoom(data.room || data)===GAME_ID) return true;
    return upper(data.hangman_state?.game_id)===GAME_ID;
  }
  function roomCodeFrom(data) { return publicCode(data?.room?.room_code || data?.room?.ROOM_CODE || data?.hangman_state?.room_code || data?.room_code); }
  function endpointFromRequest(input) {
    try { const raw=typeof input==='string'?input:input?.url; return clean(new URL(raw,global.location?.href||'https://local.invalid/').searchParams.get('fn')); }
    catch (_) { return ''; }
  }

  let fetchObserved=false;
  function installFetchObserver() {
    if (fetchObserved || typeof global.fetch!=='function') return fetchObserved;
    const baseFetch=global.fetch.bind(global);
    global.fetch=function hangmanStateObserverCS21A191(input,init){
      const promise=baseFetch(input,init);
      const endpoint=endpointFromRequest(input);
      if (!HANGMAN_ENDPOINTS.has(endpoint)) return promise;
      return promise.then(response=>{
        try {
          response.clone().json().then(data=>{
            if (!isHangmanPayload(data)) return;
            const code=roomCodeFrom(data);
            if (code) { try { global.localStorage.setItem(ACTIVE_ROOM_KEY,code); } catch (_) {} }
            try { global.dispatchEvent(new global.CustomEvent(EVENT_STATE,{detail:data})); } catch (_) {}
          }).catch(()=>{});
        } catch (_) {}
        return response;
      });
    };
    global.fetch.__cs21a191HangmanObserver=true;
    fetchObserved=true;
    return true;
  }
  installFetchObserver();

  function Message({tone='info',children}) { return <div className={`elh191-message ${tone}`}>{children}</div>; }
  function Button({secondary=false,warn=false,className='',children,...props}) { return <button className={`elh191-btn ${secondary?'secondary':''} ${warn?'warn':''} ${className}`} type="button" {...props}>{children}</button>; }
  function Loading() { return <Message>Cargando Ahorcado…</Message>; }

  function Ranking({state}) {
    const mode=upper(state?.room?.mode || state?.room?.MODE);
    const rows=mode==='TEAMS' ? (state?.team_leaderboard||[]) : (state?.leaderboard||[]);
    return <div className="elh191-ranking">
      {(rows||[]).length ? rows.slice(0,8).map((row,index)=><div className="elh191-rank" key={row.cod_estudiante||row.team||index}>
        <i>{row.rank||index+1}</i><strong>{mode==='TEAMS'?(row.team||'Equipo'):(row.nombre||'Jugador')}</strong><span>{Number(row.points||0)} pts</span>
      </div>) : <div className="elh191-source">El ranking aparecerá cuando comiencen las jugadas.</div>}
    </div>;
  }

  function resolvePlayerName(state,id) {
    const players=[...(state?.online_players||[]),...(state?.room_package?.players||[])];
    const found=players.find(p=>clean(p.cod_estudiante||p.player_id)===clean(id));
    return clean(found?.nombre || found?.name || id || 'Jugador');
  }

  function HangmanBoard({response,onLetter,onSolve,readOnly=false,busy=false}) {
    const raw=response?.hangman_state || null;
    const state=Engine.normalizePublicState(raw||{});
    const player=response?.player || null;
    const canAct=!readOnly && response?.can_act===true && !busy && !state.completed;
    const [solve,setSolve]=React.useState('');
    const [now,setNow]=React.useState(Date.now());
    const turn=state.turnState||{};
    const duration=Math.max(1000,(Date.parse(turn.turn_ends_at||'')||0)-(Date.parse(turn.turn_started_at||'')||0));
    const remaining=Engine.remainingMs(raw,now);
    const percent=Math.max(0,Math.min(100,duration?remaining/duration*100:0));
    const activePlayer=resolvePlayerName(response,turn.active_player_id);
    const activeTeam=clean(turn.active_team_id);
    const cells=Array.isArray(raw?.pattern_cells)?raw.pattern_cells:[];
    const used=new Set(state.guessedLetters);
    const wrong=new Set(state.wrongLetters);

    React.useEffect(()=>{ const id=setInterval(()=>setNow(Date.now()),250); return()=>clearInterval(id); },[]);
    React.useEffect(()=>{ setSolve(''); },[state.roundId,state.completed]);
    React.useEffect(()=>{
      if(!canAct) return undefined;
      const handler=(event)=>{
        if(event.ctrlKey||event.metaKey||event.altKey) return;
        const tag=upper(event.target?.tagName);
        if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') return;
        const key=upper(event.key);
        if(/^[A-Z]$/.test(key)&&!used.has(key)){ event.preventDefault(); onLetter&&onLetter(key); }
      };
      global.addEventListener('keydown',handler); return()=>global.removeEventListener('keydown',handler);
    },[canAct,state.roundId,state.guessedLetters.join('|'),onLetter]);

    if(!raw) return <Message tone="warn">La sala está lista. El docente debe iniciar la primera palabra.</Message>;
    return <div className="elh191-board" aria-live="polite">
      <div className="elh191-card">
        <div className="elh191-toolbar"><div><div className="elh191-kicker">Ahorcado · Ronda {state.index}/{state.total}</div><div className="elh191-sub">Vocabulario y ortografía · la respuesta se valida en el servidor.</div></div><div><b>{state.livesRemaining}</b> vidas</div></div>
        <div className="elh191-clue"><strong>Pista</strong>{state.clue||'Sin pista disponible.'}</div>
        <div className="elh191-pattern" aria-label={state.pattern||'Palabra oculta'}>
          {cells.length ? cells.map((cell,index)=><span key={index} className={`elh191-letter-slot ${cell.kind==='SPACE'?'is-space':cell.kind==='PUNCTUATION'?'is-punctuation':''}`}>{cell.kind==='LETTER'?(cell.value||''):cell.value}</span>) : <div style={{fontSize:28,fontWeight:950,letterSpacing:'.12em'}}>{state.pattern}</div>}
        </div>
        <div className="elh191-lives" aria-label={`${state.livesRemaining} vidas restantes`}>
          {Array.from({length:state.maxErrors},(_,i)=><span key={i} className={`elh191-life ${i<state.errorsUsed?'is-lost':''}`}>{i<state.errorsUsed?'×':'✓'}</span>)}
        </div>
      </div>

      {!state.completed && <div className="elh191-card">
        <div className="elh191-turn">
          <b>{activeTeam?`${activeTeam} · `:''}{activePlayer}{canAct?' · tu turno':''}</b>
          <span>{readOnly?'Vista docente':canAct?'Elegí una letra o intentá resolver.':'Esperá la jugada del participante activo.'} · {Math.ceil(remaining/1000)} s</span>
          <div className="elh191-timer"><i style={{width:`${percent}%`}} /></div>
        </div>
        <div className="elh191-keyboard" style={{marginTop:14}}>
          {Engine.LETTERS.map(letter=><button key={letter} className={`elh191-key ${used.has(letter)?'is-used':''} ${wrong.has(letter)?'is-wrong':''}`} disabled={!canAct||used.has(letter)} onClick={()=>onLetter&&onLetter(letter)} aria-label={`Letra ${letter}${used.has(letter)?', ya usada':''}`}>{letter}</button>)}
        </div>
        {!readOnly && <div className="elh191-solve" style={{marginTop:14}}>
          <input value={solve} onChange={e=>setSolve(e.target.value)} disabled={!canAct} placeholder="Resolver palabra o frase completa" maxLength={48} onKeyDown={e=>{if(e.key==='Enter'&&canAct&&clean(solve)){e.preventDefault();onSolve&&onSolve(solve);}}}/>
          <Button disabled={!canAct||!clean(solve)} onClick={()=>onSolve&&onSolve(solve)}>Resolver</Button>
        </div>}
        <div className="elh191-stats" style={{marginTop:14}}>
          <div className="elh191-stat"><span>Errores</span><b>{state.errorsUsed}/{state.maxErrors}</b></div>
          <div className="elh191-stat"><span>Letras usadas</span><b>{state.guessedLetters.length}</b></div>
          <div className="elh191-stat"><span>Turno</span><b>{Number(turn.turn_number||1)}</b></div>
        </div>
      </div>}

      {state.completed && <div className="elh191-complete">
        <div className="elh191-kicker">Ronda terminada</div>
        <div className="answer">{state.answer||'Respuesta revelada por el docente'}</div>
        <div className="elh191-sub">{state.won?'¡Palabra resuelta!':'La ronda terminó.'} · {state.clue}</div>
      </div>}
    </div>;
  }

  function HangmanStudentSession({initial,props,onExit}) {
    const [state,setState]=React.useState(initial||null);
    const [busy,setBusy]=React.useState(false);
    const [loading,setLoading]=React.useState(false);
    const [error,setError]=React.useState('');
    const inFlight=React.useRef(false);
    const roomCode=publicCode(state?.room?.room_code || state?.room?.ROOM_CODE || (()=>{try{return global.localStorage.getItem(ACTIVE_ROOM_KEY)||'';}catch(_){return'';}})());
    const playerId=clean(state?.player?.cod_estudiante || (()=>{try{return global.localStorage.getItem('elive_player_'+roomCode)||'';}catch(_){return'';}})() || userCode(props));

    const load=React.useCallback(async()=>{
      if(!roomCode||!playerId||inFlight.current) return;
      inFlight.current=true; setLoading(true);
      try { const r=await post('englishLabHangmanGetPlayerState',{room_code:roomCode,player_id:playerId,cod_estudiante:userCode(props),player_name:userName(props)}); setState(r); setError(''); }
      catch(e){ setError(e.message||String(e)); }
      finally{ inFlight.current=false; setLoading(false); }
    },[roomCode,playerId,userCode(props),userName(props)]);

    React.useEffect(()=>{
      if(!roomCode||!playerId) return undefined;
      const tick=()=>{ if(global.document?.visibilityState!=='hidden') load(); };
      const id=setInterval(tick,2500); return()=>clearInterval(id);
    },[roomCode,playerId,load]);

    async function action(actionType,value){
      if(busy) return;
      setBusy(true); setError('');
      const key=(global.crypto&&typeof global.crypto.randomUUID==='function')?global.crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const started=Date.now();
      try {
        const payload={room_code:roomCode,player_id:playerId,cod_estudiante:userCode(props),player_name:userName(props),action_type:actionType,action_key:key,time_ms:0,client_sent_at:new Date().toISOString()};
        if(actionType==='LETTER') payload.letter=value; else payload.solve=value;
        payload.time_ms=Math.max(0,Date.now()-started);
        const r=await post('englishLabHangmanAction',payload); setState(r);
        if(r.message) setError('');
      } catch(e){ setError(e.message||String(e)); }
      finally{ setBusy(false); }
    }

    function exit(){
      try { global.localStorage.removeItem(ACTIVE_ROOM_KEY); global.localStorage.removeItem('elive_last_room'); if(roomCode) global.localStorage.removeItem('elive_player_'+roomCode); } catch(_) {}
      onExit&&onExit();
    }

    return <div className="elh191-shell" style={{width:'100%',maxWidth:1080,margin:'0 auto'}}>
      <div className="elh191-toolbar"><div><div className="elh191-kicker">English LAB Live</div><div className="elh191-title">Ahorcado</div><div className="elh191-sub">Sala {roomCode} · {state?.room?.mode||''} · práctica, no nota oficial.</div></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Button secondary onClick={load} disabled={loading||busy}>{loading?'Actualizando…':'Actualizar'}</Button><Button secondary onClick={exit}>Cambiar sala</Button></div></div>
      {error&&<Message tone="err">{error}</Message>}
      <div className="elh191-grid">
        <HangmanBoard response={state} busy={busy} onLetter={letter=>action('LETTER',letter)} onSolve={solve=>action('SOLVE',solve)} />
        <aside className="elh191-card"><div className="elh191-kicker">Ranking temporal</div><div className="elh191-sub" style={{marginBottom:10}}>Solo puntos de esta práctica.</div><Ranking state={state}/></aside>
      </div>
    </div>;
  }

  function HangmanTeacherControl({roomRef,onBack}) {
    const roomId=clean(roomRef?.room_id||roomRef?.ROOM_ID||roomRef?.room_code||roomRef?.ROOM_CODE);
    const [state,setState]=React.useState(null); const [loading,setLoading]=React.useState(true); const [busy,setBusy]=React.useState(false); const [error,setError]=React.useState('');
    const load=React.useCallback(async()=>{ if(!roomId)return; setLoading(true); try{setState(await post('englishLabHangmanGetRoomControl',{room_id:roomId},45000));setError('');}catch(e){setError(e.message||String(e));}finally{setLoading(false);} },[roomId]);
    React.useEffect(()=>{load();const id=setInterval(()=>{if(global.document?.visibilityState!=='hidden')load();},3000);return()=>clearInterval(id);},[load]);
    async function act(fn){setBusy(true);setError('');try{setState(await post(fn,{room_id:roomId},45000));}catch(e){setError(e.message||String(e));}finally{setBusy(false);}}
    const room=state?.room||roomRef||{}; const status=upper(room.status||room.STATUS); const round=upper(room.round_status||room.ROUND_STATUS); const h=state?.hangman_state||{};
    const code=publicCode(room.room_code||room.ROOM_CODE||roomId);
    return <div className="elh191-shell">
      <div className="elh191-toolbar"><Button secondary onClick={onBack}>← Volver</Button><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Button secondary onClick={load} disabled={loading||busy}>{loading?'Actualizando…':'Actualizar'}</Button><Button warn onClick={()=>{if(global.confirm('¿Cerrar esta sala de Ahorcado?'))act('englishLabHangmanCloseRoom');}} disabled={busy||status==='CLOSED'}>Cerrar sala</Button></div></div>
      <div className="elh191-card"><div className="elh191-kicker">Control docente · Ahorcado</div><div className="elh191-title">{code}</div><div className="elh191-sub">{room.cod_grupo||room.COD_GRUPO} · {levelLabel(room.nivel||room.NIVEL)} · {room.unit||room.UNIT} · {room.mode||room.MODE}</div><div className="elh191-stats" style={{marginTop:12}}><div className="elh191-stat"><span>Estado</span><b style={{fontSize:15}}>{status||'—'}</b></div><div className="elh191-stat"><span>Ronda</span><b>{Number(room.current_index||room.CURRENT_INDEX||0)}/{Number(room.question_count||room.QUESTION_COUNT||0)}</b></div><div className="elh191-stat"><span>En línea</span><b>{Number(state?.stats?.players_online||state?.stats?.players||0)}</b></div></div></div>
      {error&&<Message tone="err">{error}</Message>}
      {loading&&!state?<Loading/>:<div className="elh191-grid"><HangmanBoard response={state} readOnly={true}/><aside className="elh191-shell"><div className="elh191-card"><div className="elh191-kicker">Acciones</div><div style={{display:'grid',gap:8,marginTop:10}}>{status==='CREATED'&&<Button disabled={busy} onClick={()=>act('englishLabHangmanStartRoom')}>Iniciar Ahorcado</Button>}{status==='LIVE'&&round==='OPEN'&&<Button secondary disabled={busy} onClick={()=>act('englishLabHangmanCloseRound')}>Cerrar ronda y revelar</Button>}{status==='LIVE'&&round==='CLOSED'&&Number(h.index||0)<Number(h.total||0)&&<Button disabled={busy} onClick={()=>act('englishLabHangmanNextRound')}>Siguiente palabra</Button>}{status==='LIVE'&&round==='CLOSED'&&Number(h.index||0)>=Number(h.total||0)&&<Message tone="ok">Todas las rondas terminaron. Cerrá la sala para mostrar el resultado final.</Message>}{status==='CLOSED'&&<Message>La sala está cerrada.</Message>}</div></div><div className="elh191-card"><div className="elh191-kicker">Ranking</div><div style={{marginTop:10}}><Ranking state={state}/></div></div></aside></div>}
    </div>;
  }

  function HangmanTeacherView() {
    const [data,setData]=React.useState({grupos:[]}); const [loading,setLoading]=React.useState(true); const [busy,setBusy]=React.useState(false); const [error,setError]=React.useState('');
    const [codGrupo,setCodGrupo]=React.useState(''); const [unit,setUnit]=React.useState('U01'); const [mode,setMode]=React.useState('INDIVIDUAL'); const [roundCount,setRoundCount]=React.useState(5); const [maxErrors,setMaxErrors]=React.useState(6); const [turnSeconds,setTurnSeconds]=React.useState(15);
    const [sourceItems,setSourceItems]=React.useState([]); const [curriculum,setCurriculum]=React.useState(null); const [sourceLoaded,setSourceLoaded]=React.useState(false); const [ack,setAck]=React.useState(false); const [control,setControl]=React.useState(null);
    const groups=Array.isArray(data.grupos)?data.grupos:[]; const selected=groups.find(g=>groupCode(g)===codGrupo)||groups[0]||null;
    const load=React.useCallback(async()=>{setLoading(true);try{const r=await post('englishLabLiveGetTeacherData',{},45000);setData(r);setCodGrupo(prev=>prev||groupCode((r.grupos||[])[0]));setError('');}catch(e){setError(e.message||String(e));}finally{setLoading(false);}},[]);
    React.useEffect(()=>{load();},[load]);
    function invalidate(){setSourceItems([]);setCurriculum(null);setSourceLoaded(false);setAck(false);}
    async function loadSource(){if(!selected)return;setBusy(true);setError('');try{const r=await post('englishLabHangmanSuggestions',{cod_grupo:codGrupo,nivel:levelId(selected),unit},45000);setSourceItems((r.items||[]).slice(0,5));setCurriculum(r.curriculum||null);setSourceLoaded(true);setAck(false);setRoundCount(Math.min(5,Math.max(3,(r.items||[]).length)));}catch(e){setError(e.message||String(e));invalidate();}finally{setBusy(false);}}
    function editItem(index,key,value){setSourceItems(items=>items.map((item,i)=>i===index?{...item,[key]:value,edited:true}:item));}
    async function create(){if(!selected||!sourceLoaded||!ack)return;const items=sourceItems.slice(0,roundCount);setBusy(true);setError('');try{const r=await post('englishLabHangmanCreateRoom',{cod_grupo:codGrupo,nivel:levelId(selected),unit,mode,round_count:roundCount,max_errors:maxErrors,turn_seconds:turnSeconds,items,curriculum_source_loaded:true,curriculum_acknowledged:true},45000);setControl(r.room||r);}catch(e){setError(e.message||String(e));}finally{setBusy(false);}}
    if(control)return <HangmanTeacherControl roomRef={control} onBack={()=>setControl(null)}/>;
    return <div className="elh191-shell" style={{maxWidth:1120,margin:'0 auto'}}>
      <div><div className="elh191-kicker">English LAB Live</div><div className="elh191-title">Ahorcado</div><div className="elh191-sub">Palabras trazables por nivel y unidad, editables antes de crear la sala. Práctica: no modifica notas.</div></div>
      {error&&<Message tone="err">{error}</Message>}
      <div className="elh191-grid"><div className="elh191-card"><div className="elh191-kicker">1 · Preparar sala</div>{loading?<Loading/>:<div className="elh191-shell" style={{marginTop:12}}>
        <div className="elh191-form-grid"><label className="elh191-field">Grupo<select className="elh191-select" value={codGrupo} onChange={e=>{setCodGrupo(e.target.value);invalidate();}}>{groups.map(g=><option key={groupCode(g)} value={groupCode(g)}>{levelLabel(levelId(g))} · {groupCode(g)}</option>)}</select></label><label className="elh191-field">Unidad<select className="elh191-select" value={unit} onChange={e=>{setUnit(e.target.value);invalidate();}}>{Array.from({length:16},(_,i)=><option key={i} value={`U${String(i+1).padStart(2,'0')}`}>Unidad {i+1}</option>)}</select></label></div>
        <div className="elh191-form-grid"><label className="elh191-field">Modo<select className="elh191-select" value={mode} onChange={e=>setMode(e.target.value)}><option value="INDIVIDUAL">Individual</option><option value="TEAMS">Equipos</option></select></label><label className="elh191-field">Rondas<select className="elh191-select" value={roundCount} onChange={e=>setRoundCount(Number(e.target.value)||5)}>{[3,4,5].map(n=><option key={n} value={n}>{n} palabras</option>)}</select></label><label className="elh191-field">Vidas / errores<select className="elh191-select" value={maxErrors} onChange={e=>setMaxErrors(Number(e.target.value)||6)}>{[5,6,7,8].map(n=><option key={n} value={n}>{n}</option>)}</select></label><label className="elh191-field">Tiempo por turno<select className="elh191-select" value={turnSeconds} onChange={e=>setTurnSeconds(Number(e.target.value)||15)}>{[10,15,20,25,30].map(n=><option key={n} value={n}>{n} s</option>)}</select></label></div>
        <Button onClick={loadSource} disabled={busy||!selected}>{busy?'Cargando…':'Cargar palabras de la unidad'}</Button>
        {sourceLoaded&&<><div className="elh191-source"><b>{curriculum?.unit_id||`${levelId(selected)}-${unit}`}</b> · {curriculum?.program_topic||curriculum?.unit_name||'Tema curricular'}<br/>Fuente curricular: CONFIG_UNIDADES. Contenido jugable: QUESTION_BANK trazado por unidad. Podés corregir palabra o pista sin perder la referencia de origen.</div><div className="elh191-shell">{sourceItems.slice(0,roundCount).map((item,index)=><div key={item.source_item_id||index} className="elh191-form-grid" style={{padding:'10px',border:'1px solid #E4E7EC',borderRadius:14}}><label className="elh191-field">Palabra / frase {index+1}<input className="elh191-input" value={item.answer} maxLength={48} onChange={e=>editItem(index,'answer',e.target.value)}/></label><label className="elh191-field">Pista<input className="elh191-input" value={item.clue} maxLength={140} onChange={e=>editItem(index,'clue',e.target.value)}/></label></div>)}</div><label style={{display:'flex',gap:9,alignItems:'flex-start',fontSize:12.5,color:'#344054',lineHeight:1.45}}><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)} style={{marginTop:3}}/>Revisé el tema oficial y las {roundCount} palabras/pistas que se usarán en esta sala.</label><Button onClick={create} disabled={busy||!ack||sourceItems.slice(0,roundCount).some(x=>!clean(x.answer)||!clean(x.clue))}>{busy?'Creando…':'Crear sala de Ahorcado'}</Button></>}
      </div>}</div><aside className="elh191-card"><div className="elh191-kicker">Reglas CS21A191</div><div className="elh191-source" style={{marginTop:10}}>✓ Letra correcta: 10 pts por aparición y conserva turno.<br/>✓ Letra incorrecta: 0 pts, pierde una vida y rota turno.<br/>✓ Letra repetida: sin castigo.<br/>✓ Resolver: 100 + 10 × vidas restantes.<br/>✓ Timeout: rota turno sin quitar vida.<br/>✓ Servidor autoritativo: la respuesta no se envía al estudiante mientras la ronda está abierta.</div></aside></div>
    </div>;
  }

  let studentInstalled=false,teacherInstalled=false;
  function installStudentView() {
    if(studentInstalled) return true;
    const Base=global.EnglishLabLiveStudentView;
    if(typeof Base!=='function') return false;
    const Wrapped=function EnglishLabLiveStudentViewCS21A191(props){
      const [hangman,setHangman]=React.useState(null);
      const [checking,setChecking]=React.useState(false);
      React.useEffect(()=>{
        const handler=e=>{if(isHangmanPayload(e?.detail))setHangman(e.detail);}; global.addEventListener(EVENT_STATE,handler);
        let active='';try{active=publicCode(global.localStorage.getItem(ACTIVE_ROOM_KEY)||'');}catch(_){}
        if(active&&!hangman){const pid=(()=>{try{return clean(global.localStorage.getItem('elive_player_'+active)||'');}catch(_){return'';}})()||userCode(props);if(pid){setChecking(true);post('englishLabHangmanGetPlayerState',{room_code:active,player_id:pid,cod_estudiante:userCode(props),player_name:userName(props)}).then(r=>{if(isHangmanPayload(r))setHangman(r);else{try{global.localStorage.removeItem(ACTIVE_ROOM_KEY);}catch(_){}}}).catch(()=>{try{global.localStorage.removeItem(ACTIVE_ROOM_KEY);}catch(_){}}).finally(()=>setChecking(false));}}
        return()=>global.removeEventListener(EVENT_STATE,handler);
      },[]);
      if(hangman)return <HangmanStudentSession initial={hangman} props={props} onExit={()=>setHangman(null)}/>;
      if(checking)return <div style={{maxWidth:760,margin:'50px auto'}}><Loading/></div>;
      return <Base {...props}/>;
    };
    Wrapped.__cs21a191HangmanBridge=true; Wrapped.__cs21a144AccessGate=Base.__cs21a144AccessGate===true; Wrapped.__base=Base;
    global.EnglishLabLiveStudentView=Wrapped; studentInstalled=true; return true;
  }
  function installTeacherView() {
    if(teacherInstalled) return true;
    const Base=global.EnglishLabLiveTeacherView;
    if(typeof Base!=='function') return false;
    const Wrapped=function EnglishLabLiveTeacherViewCS21A191(props){
      const [tab,setTab]=React.useState('BASE');
      return <div className="elh191-shell"><div className="elh191-tabs" role="tablist" aria-label="Juegos English LAB"><button className={`elh191-tab ${tab==='BASE'?'is-active':''}`} type="button" onClick={()=>setTab('BASE')}>Juegos actuales</button><button className={`elh191-tab ${tab==='HANGMAN'?'is-active':''}`} type="button" onClick={()=>setTab('HANGMAN')}>Ahorcado</button></div>{tab==='HANGMAN'?<HangmanTeacherView/>:<Base {...props}/>}</div>;
    };
    Wrapped.__cs21a191HangmanBridge=true; Wrapped.__base=Base; global.EnglishLabLiveTeacherView=Wrapped; teacherInstalled=true; return true;
  }
  function installViews(){ensureStyle();installFetchObserver();const s=installStudentView();const t=installTeacherView();return s&&t;}
  let probe=null;
  if(!installViews()){
    probe=global.setInterval(()=>{if(installViews()&&probe){global.clearInterval(probe);probe=null;}},100);
    global.setTimeout(()=>{if(probe){global.clearInterval(probe);probe=null;}},30000);
  }
  global.addEventListener?.('an:lazy-module-loaded',()=>installViews());

  global.EnglishLabHangmanCS21A191=Object.freeze({VERSION,GAME_ID,isHangmanPayload,post,install:installViews,HangmanBoard,HangmanTeacherView});
})(window);
