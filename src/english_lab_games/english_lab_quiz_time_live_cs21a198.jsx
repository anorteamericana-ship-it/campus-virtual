// CS21A198 · Quiz Time Live · UI y cliente QA.
// Capa aditiva. No reemplaza Memory Match, Hangman ni Sentence Order.
/* global React */
(function installEnglishLabQuizTimeLiveCS21A198(global) {
  'use strict';

  if (!global || global.EnglishLabQuizTimeCS21A198) return;

  const VERSION = 'CS21A198';
  const GAME_ID = 'QUIZ_TIME';
  const STYLE_ID = 'elq198-style';
  const STYLE_HREF = 'styles/english_lab_quiz_time_cs21a198.css?v=CS21A198';
  const Engine = global.EnglishLabQuizEngineCS21A198;
  const Contract = global.EnglishLabQuizCurriculumContractCS21A198;
  const Registry = global.EnglishLabGameRegistryCS21A191 || null;
  if (!Engine) throw new Error('Falta EnglishLabQuizEngineCS21A198.');
  if (!Contract) throw new Error('Falta EnglishLabQuizCurriculumContractCS21A198.');

  const ENDPOINTS = Object.freeze({
    teacherData:'englishLabQuizTimeTeacherData',
    create:'englishLabQuizTimeCreateRoom',
    start:'englishLabQuizTimeStartRoom',
    control:'englishLabQuizTimeGetRoomControl',
    join:'englishLabQuizTimeJoinRoom',
    state:'englishLabQuizTimeGetPlayerState',
    answer:'englishLabQuizTimeAnswer',
    closeRoom:'englishLabQuizTimeCloseRoom',
  });

  if (Registry && !Registry.has(GAME_ID)) {
    Registry.register({
      id:GAME_ID,label:'Quiz Time',category:'Comprensión y uso del idioma',version:VERSION,
      endpoints:{suggestions:ENDPOINTS.teacherData,create:ENDPOINTS.create,start:ENDPOINTS.start,control:ENDPOINTS.control,join:ENDPOINTS.join,state:ENDPOINTS.state,action:ENDPOINTS.answer,closeRoom:ENDPOINTS.closeRoom},
      capabilities:{individual:true,teams:false,projector:true,serverAuthoritative:true,curriculum:true},
    });
  }

  function clean(value) { return String(value == null ? '' : value).replace(/\s+/g,' ').trim(); }
  function upper(value) { return clean(value).toUpperCase(); }
  function publicCode(value) { return upper(value).replace(/[^A-Z0-9-]/g,'').slice(0,12); }
  function sessionToken() { try { return typeof global.getSessionToken === 'function' ? (global.getSessionToken() || '') : ''; } catch (_) { return ''; } }
  function sessionUser(props) {
    if (props?.usuario) return props.usuario;
    try { return typeof global.getSesion === 'function' ? (global.getSesion() || {}) : JSON.parse(global.sessionStorage.getItem('an_usuario') || '{}'); }
    catch (_) { return {}; }
  }
  function userCode(props) { const u=sessionUser(props); return clean(u.codigo||u.CODIGO||u.cod_estudiante||u.COD_ESTUDIANTE||u.cedula||u.CEDULA); }
  function userName(props) { const u=sessionUser(props); return clean(u.nombre||u.nombre_completo||u.NOMBRE||u.name||userCode(props)||'Estudiante'); }

  function ensureStyle() {
    if (!global.document || global.document.getElementById(STYLE_ID)) return;
    const link=global.document.createElement('link'); link.id=STYLE_ID; link.rel='stylesheet'; link.href=STYLE_HREF; global.document.head.appendChild(link);
  }
  ensureStyle();

  async function post(fn,payload={},timeoutMs=30000) {
    const endpoint=global.APPS_SCRIPT_URL;
    if (!endpoint) throw new Error('No está configurada la URL QA de Apps Script.');
    const controller=typeof AbortController!=='undefined'?new AbortController():null;
    const timer=controller?setTimeout(()=>controller.abort(),timeoutMs):null;
    try {
      const response=await global.fetch(`${endpoint}?fn=${encodeURIComponent(fn)}`,{
        method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({fn,token:sessionToken(),...payload}),signal:controller?controller.signal:undefined,
      });
      const text=await response.text();
      let data=null;
      try { data=text?JSON.parse(text):null; } catch (_) { throw new Error('Quiz Time recibió una respuesta inválida del backend.'); }
      if (!response.ok || !data) throw new Error((data&&(data.mensaje||data.error))||`HTTP ${response.status}`);
      if (data.ok===false) {
        const error=new Error(data.mensaje||data.message||data.error||'La acción no fue aceptada.');
        error.data=data;
        throw error;
      }
      return data;
    } catch (error) {
      if (error?.name==='AbortError') throw new Error('Quiz Time tardó demasiado en responder.');
      throw error;
    } finally { if(timer) clearTimeout(timer); }
  }

  function areaLabel(areaId) {
    return ({VOCAB:'Vocabulary',GRAM:'Grammar',SPEAK:'Communication',LISTEN:'Listening',READ:'Reading'}[upper(areaId)]||areaId||'English');
  }
  function initials(name) {
    const parts=clean(name).split(/\s+/).filter(Boolean); if(!parts.length) return 'AN';
    return (parts[0][0]+(parts.length>1?parts[parts.length-1][0]:'')).toUpperCase();
  }
  function roomCodeOf(response) { return publicCode(response?.room?.room_code||response?.room?.ROOM_CODE||response?.quiz_state?.room_code||response?.room_code); }
  function normalizedState(response) {
    const raw=response?.quiz_state || response?.state || response || {};
    const merged={...raw,room_code:raw.room_code||roomCodeOf(response)};
    return Engine.normalizePublicState(merged);
  }
  function currentPlayer(response) { return response?.player||null; }

  function Clock({state,now}) {
    const ms=Engine.remainingMs(state,now); const seconds=Math.ceil(ms/1000);
    const tone=seconds<=5?'critical':seconds<=10?'warn':'';
    const label=state.phase==='REVEAL'?'reveal':'tiempo';
    return <div className={`qt198-clock ${tone}`} aria-label={`${seconds} segundos`}><strong>{seconds}</strong><span>{label}</span></div>;
  }

  function Ranking({rows=[]}) {
    const safe=(rows||[]).slice(0,8);
    return <div className="qt198-side-card">
      <div className="qt198-side-title"><span>Ranking en vivo</span><b>{safe.length} jugadores</b></div>
      {safe.length?safe.map((row,index)=><div className="qt198-rank" key={row.cod_estudiante||index}>
        <span className="qt198-avatar">{initials(row.nombre||row.cod_estudiante)}</span>
        <span className="qt198-rank-copy"><strong>{row.nombre||row.cod_estudiante||'Jugador'}</strong><small>{Number(row.correct||0)} correctas · #{row.rank||index+1}</small></span>
        <span className="qt198-score">{Number(row.points||0)} pt</span>
      </div>):<div className="qt198-curriculum"><p>El ranking aparecerá cuando lleguen respuestas.</p></div>}
    </div>;
  }

  function CurriculumCard({state,response}) {
    const curriculum=response?.curriculum || Contract.INITIAL_CURRICULUM;
    return <div className="qt198-side-card qt198-curriculum-card">
      <div className="qt198-side-title"><span>Ruta curricular</span><b>B1 · U01</b></div>
      <div className="qt198-curriculum"><strong>{curriculum?.unit_name||curriculum?.unitTitle||"What's your name?"}</strong>
        <p>{curriculum?.unit_objective_es||curriculum?.objectiveEs||'Presentaciones, saludos e información personal básica.'}</p>
        <div className="qt198-curriculum-tags"><span>{areaLabel(state?.question?.areaId)}</span><span>{state?.question?.templateId||'QUIZ'}</span><span>Práctica formativa</span></div>
      </div>
    </div>;
  }

  function Option({option,state,myAnswer,localSelected,canAnswer,onSelect}) {
    const reveal=state.phase==='REVEAL';
    const correctId=reveal?state.reveal.correctOption:'';
    const selected=upper(myAnswer?.option_id||myAnswer?.optionId||localSelected)===option.id;
    const correct=reveal&&option.id===correctId;
    const wrong=reveal&&selected&&correctId&&option.id!==correctId;
    const dim=reveal&&correctId&&!correct&&!wrong;
    return <button type="button" className={`qt198-option ${selected?'is-selected ':''}${correct?'is-correct ':''}${wrong?'is-wrong ':''}${dim?'is-dim':''}`} disabled={!canAnswer} onClick={()=>onSelect(option.id)}>
      <span className="qt198-option-letter">{option.id}</span><span className="qt198-option-text">{option.label}</span>
    </button>;
  }

  function QuizStage({response,readOnly=false,busy=false,localSelected='',onAnswer}) {
    const state=normalizedState(response);
    const [now,setNow]=React.useState(Date.now());
    React.useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(id);},[]);
    const question=state.question;
    const myAnswer=response?.my_answer||null;
    const progress=state.questionTotal?Math.max(0,Math.min(100,(Math.max(1,state.questionIndex)/state.questionTotal)*100)):0;
    const answerLocked=!!(busy||localSelected||myAnswer||readOnly||state.phase!=='OPEN');
    const canAnswer=!answerLocked && response?.can_answer===true && Engine.canPlayerAnswer(state,currentPlayer(response),now);

    if(state.phase==='WAITING'||!question) return <div className="qt198-shell"><div className="qt198-card qt198-complete"><div className="qt198-complete-icon">Q</div><h2>Quiz Time está listo</h2><p>Esperando que el docente inicie la primera pregunta de Básico I · Unidad 1.</p></div></div>;
    if(state.phase==='COMPLETE'||state.phase==='CLOSED') return <div className="qt198-shell"><div className="qt198-card qt198-complete"><div className="qt198-complete-icon">✓</div><h2>Ronda completada</h2><p>Terminaste las 10 preguntas de B1 · U01. El ranking conserva únicamente esta práctica formativa.</p></div><div className="qt198-layout" style={{marginTop:18}}><div/><div><Ranking rows={response?.leaderboard||[]}/></div></div></div>;

    const waiting=!readOnly&&!canAnswer&&state.phase==='OPEN';
    const reveal=state.phase==='REVEAL';
    return <div className="qt198-shell">
      <div className="qt198-topbar">
        <div className="qt198-brand"><span className="qt198-brandmark">Q</span><div className="qt198-brandcopy"><span className="qt198-eyebrow">English LAB · Quiz Time</span><strong>Básico I · U01 · {areaLabel(question.areaId)}</strong></div></div>
        <div className="qt198-meta"><span className="qt198-chip live">Sala {roomCodeOf(response)||'LIVE'}</span><span className="qt198-chip">{response?.answer_count||0} respuestas</span></div>
      </div>
      <div className="qt198-layout">
        <main className="qt198-stage">
          <section className="qt198-card qt198-question">
            <div className="qt198-progress-head"><span>Pregunta {state.questionIndex} de {state.questionTotal}</span><b>{question.sourceItemId||'B1-U01'}</b></div>
            <div className="qt198-progress"><i style={{width:`${progress}%`}}/></div>
            <div className="qt198-question-head"><div><span className="qt198-area">{areaLabel(question.areaId)}</span><h2>{question.stem||question.promptEn||'Elegí la mejor respuesta.'}</h2>{question.promptEs&&<p className="qt198-prompt">{question.promptEs}</p>}</div><Clock state={state} now={now}/></div>
            {question.miniTextOrDialogue&&<div className="qt198-stimulus">{question.miniTextOrDialogue}</div>}
            <div className="qt198-options">{question.options.map(option=><Option key={option.id} option={option} state={state} myAnswer={myAnswer} localSelected={localSelected} canAnswer={canAnswer} onSelect={onAnswer}/>)}</div>
            {reveal&&<div className="qt198-feedback"><i>✓</i><div><strong>Respuesta: {state.reveal.correctOption}</strong><p>{state.reveal.explanationEs||'Revisá la estructura y conectala con el objetivo de esta unidad.'}</p></div></div>}
            {waiting&&<div className="qt198-wait"><span><strong>{myAnswer||localSelected?'Respuesta enviada':'Observando la pregunta'}</strong> · {myAnswer||localSelected?'esperando que cierre el grupo':'esperá tu habilitación'}</span><span className="qt198-dotpulse" aria-hidden="true"><i/><i/><i/></span></div>}
            {busy&&<div className="qt198-wait"><span><strong>Guardando respuesta…</strong> · no hace falta volver a tocar</span><span className="qt198-dotpulse" aria-hidden="true"><i/><i/><i/></span></div>}
          </section>
        </main>
        <aside className="qt198-side"><Ranking rows={response?.leaderboard||[]}/><CurriculumCard state={state} response={response}/></aside>
      </div>
    </div>;
  }

  function useSerialPoll(load,delayForState) {
    const loadRef=React.useRef(load); loadRef.current=load;
    React.useEffect(()=>{let stopped=false,timer=null;
      const tick=async()=>{try{await loadRef.current();}catch(_){} if(stopped)return; const delay=typeof delayForState==='function'?delayForState():Number(delayForState||1200); timer=setTimeout(tick,Math.max(600,delay||1200));};
      timer=setTimeout(tick,250); return()=>{stopped=true;if(timer)clearTimeout(timer);};
    },[delayForState]);
  }

  function StudentSession({initial,props,onExit}) {
    const [response,setResponse]=React.useState(initial||null);
    const [busy,setBusy]=React.useState(false);
    const [error,setError]=React.useState('');
    const [localSelected,setLocalSelected]=React.useState('');
    const roomCode=roomCodeOf(response)||publicCode(initial?.room_code);
    const playerId=clean(response?.player?.cod_estudiante||response?.player?.player_id||userCode(props));
    const state=normalizedState(response||{});
    const lastQuestionRef=React.useRef('');
    const actionsRef=React.useRef({});
    const submitQuestionRef=React.useRef('');
    const inFlight=React.useRef(false);

    React.useEffect(()=>{const q=state.question?.questionId||'';if(q!==lastQuestionRef.current){lastQuestionRef.current=q;submitQuestionRef.current='';setLocalSelected(response?.my_answer?.option_id||'');setError('');}},[state.question?.questionId]);
    React.useEffect(()=>{if(response?.my_answer?.option_id)setLocalSelected(response.my_answer.option_id);},[response?.my_answer?.option_id]);

    const load=React.useCallback(async()=>{if(inFlight.current||!roomCode||!playerId)return;inFlight.current=true;try{const next=await post(ENDPOINTS.state,{room_code:roomCode,player_id:playerId},25000);setResponse(next);setError('');}catch(err){setError(err.message||String(err));}finally{inFlight.current=false;}},[roomCode,playerId]);
    useSerialPoll(load,React.useCallback(()=>state.phase==='REVEAL'?750:1200,[state.phase]));

    const answer=React.useCallback(async(optionId)=>{
      const qid=state.question?.questionId||'';
      if(busy||localSelected||!qid||submitQuestionRef.current===qid)return;
      submitQuestionRef.current=qid;
      const actionId=actionsRef.current[qid] || `QT198-${qid}-${playerId}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      actionsRef.current[qid]=actionId; setLocalSelected(optionId); setBusy(true); setError('');
      try{
        const payload=Engine.buildAnswerAction(state,{player_id:playerId},optionId,actionId);
        const next=await post(ENDPOINTS.answer,payload,30000); setResponse(next);
      }catch(err){
        const canonical=err?.data?.room_state||null;
        if(canonical)setResponse(canonical);
        if(!canonical?.my_answer){setLocalSelected('');submitQuestionRef.current='';}
        setError(err.message||String(err));
      }finally{setBusy(false);}
    },[busy,localSelected,state,playerId]);

    return <div>{error&&<div className="qt198-feedback warn" style={{marginBottom:10}}><i>!</i><div><strong>No se pudo completar la última acción</strong><p>{error}</p></div></div>}<QuizStage response={response||{}} busy={busy} localSelected={localSelected} onAnswer={answer}/>{onExit&&<div className="qt198-actions" style={{marginTop:12}}><button type="button" className="qt198-btn secondary" onClick={onExit}>Volver a juegos</button></div>}</div>;
  }

  function TeacherRoom({initial,onExit}) {
    const [response,setResponse]=React.useState(initial||null); const [busy,setBusy]=React.useState(false); const [error,setError]=React.useState(''); const inFlight=React.useRef(false);
    const roomCode=roomCodeOf(response);
    const load=React.useCallback(async()=>{if(inFlight.current||!roomCode)return;inFlight.current=true;try{setResponse(await post(ENDPOINTS.control,{room_code:roomCode},25000));setError('');}catch(err){setError(err.message||String(err));}finally{inFlight.current=false;}},[roomCode]);
    const state=normalizedState(response||{});
    useSerialPoll(load,React.useCallback(()=>state.phase==='REVEAL'?700:1000,[state.phase]));
    const act=async(fn)=>{if(busy)return;setBusy(true);setError('');try{setResponse(await post(fn,{room_code:roomCode},30000));}catch(err){setError(err.message||String(err));}finally{setBusy(false);}};
    const status=upper(response?.room?.status||response?.room?.STATUS);
    return <div>
      <div className="qt198-actions" style={{marginBottom:12}}>{status==='CREATED'&&<button type="button" className="qt198-btn" disabled={busy} onClick={()=>act(ENDPOINTS.start)}>Iniciar Quiz Time</button>}<button type="button" className="qt198-btn secondary" disabled={busy} onClick={load}>Actualizar control</button><button type="button" className="qt198-btn secondary" disabled={busy} onClick={()=>act(ENDPOINTS.closeRoom)}>Cerrar sala</button>{onExit&&<button type="button" className="qt198-btn secondary" onClick={onExit}>Volver</button>}</div>
      {error&&<div className="qt198-feedback warn" style={{marginBottom:10}}><i>!</i><div><strong>Control docente</strong><p>{error}</p></div></div>}
      <QuizStage response={response||{}} readOnly busy={busy} onAnswer={()=>{}}/>
    </div>;
  }

  async function joinRoom(roomCode,props) {
    const code=publicCode(roomCode); if(!code)throw new Error('Escribí un código de sala válido.');
    const playerId=userCode(props); if(!playerId)throw new Error('No pudimos confirmar tu código de estudiante.');
    return post(ENDPOINTS.join,{room_code:code,player_id:playerId,player_name:userName(props)},30000);
  }
  async function createRoom({codGrupo,nivel='B1',unit='U01'}={}) {
    return post(ENDPOINTS.create,{cod_grupo:clean(codGrupo),nivel,unit},30000);
  }
  async function teacherData(payload={}) { return post(ENDPOINTS.teacherData,payload,25000); }

  global.EnglishLabQuizTimeCS21A198=Object.freeze({VERSION,GAME_ID,ENDPOINTS,QuizStage,StudentSession,TeacherRoom,joinRoom,createRoom,teacherData,post});
})(window);
