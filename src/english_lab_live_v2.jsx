// English LAB LIVE v2 · E10 visible shell + QA hardening.
// Server-authoritative: identity, role, capabilities, score and answers come only from Apps Script v2.
/* global React, PageHeader */
(function(){
  const API_VERSION = 'english_lab_live.v2';
  const SHELL_VERSION = 'ELV2-E10-QA-20260827';
  const VIEW = Object.freeze({ STUDENT:'STUDENT', CONTROLLER:'CONTROLLER' });
  const MUTATING = new Set(['createRoom','joinRoom','startRoom','prepareRound','openRound','lockRound','revealRound','submitAttempt','closeRound','closeRoom']);
  const GAME_CATALOG = Object.freeze([
    { id:'SENTENCE_ORDER', label:'Sentence Order', kind:'SENTENCE_ORDER', area:'Grammar + Speaking', note:'Ordená las palabras para construir la oración correcta.', itemMax:5 },
    { id:'HANGMAN', label:'Hangman', kind:'VOCABULARY', area:'Vocabulary', note:'Descubrí la palabra letra por letra en un tablero compartido.', itemMax:10 },
    { id:'QUIZ_TIME', label:'Quiz Time', kind:'QUIZ_TIME', area:'Comprehension', note:'Diez preguntas privadas; la corrección aparece al revelar.', itemMax:0 },
    { id:'WORD_SEARCH', label:'Word Search', kind:'VOCABULARY', area:'Vocabulary', note:'Encontrá palabras en una cuadrícula compartida 14 × 14.', itemMax:0 },
  ]);
  const LEVELS = ['B1','B2','I1','I2'];
  const UNITS = Array.from({length:16}, (_,i)=>String(i+1).padStart(2,'0'));
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  function injectStyles(){
    if(document.getElementById('elv2-e10-style')) return;
    const style=document.createElement('style');
    style.id='elv2-e10-style';
    style.textContent=`
      .elv2-shell{max-width:1180px;margin:0 auto;padding:4px 0 36px;font-family:var(--f-sans,system-ui,sans-serif);color:var(--ink-1,#172033)}
      .elv2-shell *{box-sizing:border-box}.elv2-two{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,.75fr);gap:16px;align-items:start}
      .elv2-card{background:var(--surface,#fff);border:1px solid var(--line,#e4e7ec);border-radius:20px;padding:18px;box-shadow:0 8px 24px rgba(15,23,42,.06)}
      .elv2-grid4{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.elv2-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
      .elv2-room-summary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center}.elv2-room-actions{display:grid;grid-template-columns:1fr;gap:8px;min-width:168px}.elv2-room-actions>*{width:100%;justify-content:center}.elv2-round-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}.elv2-controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px}
      .elv2-btn{border:1px solid #cfd6e3;background:#fff;color:#073b7a;border-radius:12px;padding:10px 14px;font:inherit;font-weight:850;cursor:pointer;min-height:42px}
      .elv2-btn:hover{background:#f5f8ff}.elv2-btn.primary{background:#073b7a;color:#fff;border-color:#073b7a}.elv2-btn.danger{color:#8b1f1f;border-color:#efb5b5}.elv2-btn:disabled{opacity:.45;cursor:not-allowed}
      .elv2-label{font-size:10px;font-weight:950;letter-spacing:.13em;text-transform:uppercase;color:#7a1e2c}.elv2-muted{font-size:12px;line-height:1.5;color:#667085}
      .elv2-input,.elv2-select{width:100%;min-height:44px;border:1px solid #cfd6e3;border-radius:12px;background:#fff;padding:9px 11px;font:inherit;color:#172033}
      .elv2-game{border:1px solid #d8dee9;background:#fff;border-radius:16px;padding:13px;text-align:left;cursor:pointer;min-height:105px}.elv2-game.active{border:2px solid #073b7a;background:#eef4ff;padding:12px}
      .elv2-pill{display:inline-flex;align-items:center;gap:5px;border:1px solid #d6deeb;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:850;background:#f8fafc;color:#344054}
      .elv2-code{font-family:var(--f-mono,ui-monospace,monospace);font-size:34px;font-weight:950;letter-spacing:.05em;color:#001e47}
      .elv2-alert{border-radius:14px;padding:11px 13px;font-size:12.5px;line-height:1.45;font-weight:700}.elv2-alert.err{background:#fdecea;color:#8b1f1f;border:1px solid #f5b5b5}.elv2-alert.info{background:#eef4ff;color:#073b7a;border:1px solid #b7d5ff}.elv2-alert.ok{background:#eaf8ef;color:#145c38;border:1px solid #bde8cd}.elv2-alert-action{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}
      .elv2-tokenbank,.elv2-answer{display:flex;flex-wrap:wrap;gap:8px;min-height:58px;padding:10px;border-radius:14px;border:1px dashed #c8d1df;background:#f8fafc}.elv2-token{border:1px solid #b9c6da;background:#fff;border-radius:10px;padding:9px 11px;font-weight:850;cursor:pointer;min-height:40px}.elv2-token.used{opacity:.35}
      .elv2-alpha{display:grid;grid-template-columns:repeat(9,minmax(34px,1fr));gap:6px}.elv2-letter{aspect-ratio:1;border:1px solid #c9d4e3;border-radius:10px;background:#fff;font-weight:950;cursor:pointer}.elv2-letter:disabled{opacity:.35}
      .elv2-quizq{border:0;border-top:1px solid #dfe5ee;padding:18px 0;margin:0;min-width:0}.elv2-question-title{display:block;padding:0;font-size:14px;font-weight:900;line-height:1.45;color:#172033}.elv2-question-context{margin:7px 0 0;padding:10px 12px;border-left:3px solid #b7d5ff;border-radius:0 9px 9px 0;background:#f8fafc;white-space:pre-wrap}.elv2-quiz-options{display:grid;gap:8px;margin-top:11px}.elv2-option{display:block;width:100%;text-align:left;border:1px solid #d6deeb;background:#fff;border-radius:11px;padding:10px 12px;margin:0;cursor:pointer;line-height:1.4}.elv2-option.selected{border:2px solid #073b7a;background:#eef4ff;padding:9px 11px}
      .elv2-hang-pattern{font-size:30px;font-weight:950;letter-spacing:.09em;line-height:1.35;color:#001E47;margin:8px 0;overflow-wrap:anywhere}.elv2-ws{display:grid;grid-template-rows:repeat(14,minmax(0,1fr));gap:3px;width:100%;max-width:630px;margin:0 auto}.elv2-ws-row{display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:3px;min-width:0}.elv2-cell{aspect-ratio:1;border:1px solid #bfc9d8;border-radius:6px;background:#fff;color:#172033;font-weight:900;font-size:13px;cursor:pointer;min-width:0;padding:0}.elv2-cell:disabled{opacity:1;color:#172033;cursor:default}.elv2-cell.start{background:#ddebff;border-color:#073b7a;box-shadow:inset 0 0 0 1px #073b7a}.elv2-cell.solution{background:#eaf8ef;border-color:#58b87b;color:#145c38;box-shadow:inset 0 0 0 1px #58b87b}.elv2-word-list{list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:7px;margin:14px 0 0;padding:0}.elv2-word-item{border:1px solid #d6deeb;border-radius:10px;padding:7px 9px;background:#f8fafc;color:#344054;font-size:12px;font-weight:850}.elv2-word-item.claimed,.elv2-word-item.revealed{background:#eaf8ef;border-color:#bde8cd;color:#145c38}
      .elv2-leader{display:grid;gap:7px}.elv2-rank{display:grid;grid-template-columns:32px 1fr auto;gap:8px;align-items:center;padding:8px 10px;border-radius:11px;background:#f8fafc;font-size:12px}
      @media (max-width:760px){.elv2-two{grid-template-columns:1fr}.elv2-grid4{grid-template-columns:1fr 1fr}.elv2-card{padding:15px;border-radius:16px}}
      @media (max-width:520px){.elv2-room-summary{grid-template-columns:1fr}.elv2-room-actions{grid-template-columns:1fr 1fr;min-width:0}.elv2-room-actions>*:first-child{grid-column:1/-1}.elv2-round-head{align-items:start}}
      @media (max-width:420px){.elv2-shell{padding-bottom:24px}.elv2-grid4{grid-template-columns:1fr}.elv2-row>.elv2-btn{flex:1 1 130px}.elv2-btn,.elv2-input,.elv2-select{min-height:44px}.elv2-code{font-size:30px}.elv2-alpha{grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}.elv2-letter{min-height:40px;aspect-ratio:auto}.elv2-ws,.elv2-ws-row{gap:1px}.elv2-cell{border-radius:3px;font-size:clamp(9px,2.65vw,12px)}.elv2-word-list{grid-template-columns:1fr 1fr}.elv2-room-actions{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function clean(v){ return String(v==null?'':v).trim(); }
  function upper(v){ return clean(v).toUpperCase(); }
  function errorText(err){ return clean(err && err.message) || 'No se pudo completar la operación.'; }
  function backendTimeoutError(){
    const error=new Error('El backend no respondió a tiempo. Podés reintentar sin duplicar la operación.');
    error.code='BACKEND_TIMEOUT';error.retryable=true;return error;
  }
  function reqId(action){
    const id=(window.crypto&&typeof window.crypto.randomUUID==='function')?window.crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${action}:${id}`.slice(0,128);
  }
  function sessionToken(){ return typeof window.getSessionToken==='function' ? clean(window.getSessionToken()) : ''; }
  function roomStoreKey(mode){ return mode===VIEW.STUDENT?'elv2_room_student':'elv2_room_controller'; }
  function readRoom(mode){ try{return clean(sessionStorage.getItem(roomStoreKey(mode)));}catch(_){return '';} }
  function saveRoom(mode,id){ try{ if(id) sessionStorage.setItem(roomStoreKey(mode),id); else sessionStorage.removeItem(roomStoreKey(mode)); }catch(_){} }
  function apiUrl(){ return clean(window.APPS_SCRIPT_URL || window.SCRIPT_URL_LIVE || ''); }

  async function postV2(action, spec={}, timeoutMs=35000){
    const url=apiUrl();
    if(!url) throw new Error('El Campus no tiene configurado el backend QA.');
    const body={api_version:API_VERSION,action,token:sessionToken(),payload:spec.payload||{}};
    if(MUTATING.has(action)) body.request_id=spec.request_id||reqId(action);
    ['room_id','room_code','round_id','client_seen_revision'].forEach(k=>{ if(spec[k]!==undefined&&spec[k]!==null&&spec[k]!=='') body[k]=spec[k]; });
    const controller=typeof AbortController!=='undefined'?new AbortController():null;
    const timer=controller?setTimeout(()=>controller.abort(),timeoutMs):null;
    try{
      const res=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),signal:controller?controller.signal:undefined});
      const text=await res.text();
      let data=null;
      try{data=text?JSON.parse(text):null;}catch(_){throw new Error('El backend devolvió una respuesta no válida.');}
      if(!data||data.ok!==true){
        const code=clean(data&&data.error&&data.error.code)||clean(data&&data.error)||`HTTP_${res.status}`;
        const msg=clean(data&&data.error&&data.error.message)||clean(data&&data.mensaje)||code;
        const e=new Error(msg); e.code=code; throw e;
      }
      return data;
    }catch(e){
      if(e&&e.name==='AbortError') throw backendTimeoutError();
      throw e;
    }finally{ if(timer) clearTimeout(timer); }
  }

  function groupCode(g){ return clean(typeof g==='object'?(g.code||g.cod_grupo||g.codigo||g.grupo||g.group_id):g); }
  function extractGroups(usuario){
    const raw=[];
    const candidates=[usuario&&usuario.grupos,usuario&&usuario.multiGrupo,usuario&&usuario.groups];
    candidates.forEach(value=>{
      if(Array.isArray(value)) value.forEach(x=>raw.push(x));
      else if(typeof value==='string') value.split(/[|,;]/).forEach(x=>raw.push(x));
    });
    if(usuario&&usuario.grupo) raw.push(usuario.grupo);
    const seen=new Set();
    return raw.map(groupCode).filter(Boolean).filter(code=>{const k=upper(code);if(seen.has(k))return false;seen.add(k);return true;});
  }
  function inferLevel(group){ const hit=upper(group).match(/(?:^|[-_])(B1|B2|I1|I2)(?:[-_]|$)/); return hit?hit[1]:(LEVELS.includes(upper(group).slice(0,2))?upper(group).slice(0,2):'B1'); }
  function contentRef(level,unit,game){ return `APOLLO_PLAY_V1:${level}:${level}-U${unit}:${game.kind}`; }
  function statusEs(v){ return ({LOBBY:'Sala de espera',LIVE:'En vivo',CLOSED:'Cerrada',READY:'Lista',OPEN:'Respondiendo',LOCKED:'Bloqueada',REVEAL:'Corrección',CLOSED_ROUND:'Cerrada'})[upper(v)]||clean(v)||'—'; }
  function gameMeta(id){ return GAME_CATALOG.find(g=>g.id===id)||null; }
  function stateRevision(view){ return view&&Number.isInteger(view.state_revision)?view.state_revision:null; }
  function roomFrom(data){ return data&&data.view&&data.view.room?data.view.room:null; }

  function useLiveState(mode){
    const [roomId,setRoomIdState]=React.useState(()=>readRoom(mode));
    const [view,setView]=React.useState(null);
    const [busy,setBusy]=React.useState(false);
    const [error,setError]=React.useState('');
    const [notice,setNotice]=React.useState('');
    const viewRef=React.useRef(null);
    React.useEffect(()=>{viewRef.current=view;},[view]);
    function setRoomId(id){const next=clean(id);setRoomIdState(next);saveRoom(mode,next);if(!next){setView(null);setError('');}}
    function accept(data){
      const incoming=data&&data.view;
      if(incoming&&incoming.unchanged===true){
        setView(prev=>prev?{...prev,server_now:incoming.server_now,state_revision:incoming.state_revision}:prev);
      }else if(incoming){ setView(incoming); viewRef.current=incoming; }
      const r=roomFrom(data); if(r&&r.room_id&&r.room_id!==roomId){setRoomId(r.room_id);}
      return data;
    }
    async function run(action,spec={},opts={}){
      const stableSpec=MUTATING.has(action)&&!spec.request_id?{...spec,request_id:reqId(action)}:spec;
      if(opts.busy!==false)setBusy(true);setError('');setNotice('');
      try{const data=await postV2(action,stableSpec);accept(data);return data;}
      catch(e){
        const message=errorText(e);
        if(e&&e.retryable===true)setError({message,onRetry:()=>run(action,stableSpec)});
        else setError(message);
        throw e;
      }
      finally{if(opts.busy!==false)setBusy(false);}
    }
    async function refresh(silent=true){
      const id=clean(roomId);if(!id)return null;
      try{
        const current=viewRef.current;
        const spec={room_id:id,payload:{view_mode:mode}};
        const rev=stateRevision(current);if(rev!==null)spec.client_seen_revision=rev;
        const data=await postV2('getState',spec);accept(data);if(!silent)setError('');return data;
      }catch(e){if(!silent)setError(errorText(e));return null;}
    }
    React.useEffect(()=>{
      if(!roomId)return undefined;
      let live=true;let timer=null;
      const tick=async()=>{if(!live)return;await refresh(true);if(live)timer=setTimeout(tick,2500);};
      tick();return()=>{live=false;if(timer)clearTimeout(timer);};
    },[roomId,mode]);
    return {roomId,setRoomId,view,busy,error,setError,notice,setNotice,run,refresh};
  }

  function Header({title,sub}){
    if(typeof PageHeader==='function') return <PageHeader kicker="English LAB Live · v2" title={title} sub={sub}/>;
    return <div style={{marginBottom:18}}><div className="elv2-label">English LAB Live · v2</div><h1 style={{margin:'5px 0',fontSize:32,color:'#001E47'}}>{title}</h1><div className="elv2-muted">{sub}</div></div>;
  }
  function Alert({text,type='info'}){
    if(!text)return null;
    const detail=typeof text==='object'?text:{message:text};
    return <div className={`elv2-alert ${type} ${detail.onRetry?'elv2-alert-action':''}`} role={type==='err'?'alert':'status'}><span>{detail.message}</span>{detail.onRetry&&<button className="elv2-btn" type="button" onClick={detail.onRetry}>Reintentar</button>}</div>;
  }
  function Pill({children}){return <span className="elv2-pill">{children}</span>;}
  function GamePicker({selected,onSelect}){return <div className="elv2-grid4">{GAME_CATALOG.map(g=><button key={g.id} type="button" className={`elv2-game ${selected===g.id?'active':''}`} onClick={()=>onSelect(g.id)}><div className="elv2-label">{g.area}</div><div style={{fontSize:17,fontWeight:950,color:'#001E47',marginTop:5}}>{g.label}</div><div className="elv2-muted" style={{marginTop:5}}>{g.note}</div></button>)}</div>;}
  function Leaderboard({rows=[]}){return <div className="elv2-card"><div className="elv2-label">Ranking de práctica</div><div style={{fontSize:20,fontWeight:950,color:'#001E47',margin:'4px 0 12px'}}>Sala en vivo</div><div className="elv2-leader">{rows.length?rows.slice(0,20).map((r,i)=><div className="elv2-rank" key={r.player_id||`${i}-${r.display_name}`}><b>#{i+1}</b><span>{r.display_name||'Estudiante'}</span><b>{Number(r.score||0)} pts</b></div>):<div className="elv2-muted">Aún no hay participantes con puntaje.</div>}</div></div>;}
  function RoomSummary({view,onClear}){
    const room=view&&view.room;if(!room)return null;
    const participants=Number(view.participant_count||0);
    return <section className="elv2-card" style={{marginBottom:16,background:'linear-gradient(135deg,#eef4ff,#fff 72%)',borderColor:'#b7d5ff'}} aria-label="Resumen de la sala"><div className="elv2-room-summary"><div><div className="elv2-label">Código de sala</div><div className="elv2-code">{room.room_code}</div><div className="elv2-muted">{room.title||'English LAB Live'} · {statusEs(room.status)}</div></div><div className="elv2-room-actions"><Pill><span aria-live="polite">{participants} {participants===1?'participante':'participantes'}</span></Pill><button className="elv2-btn" type="button" onClick={()=>navigator.clipboard&&navigator.clipboard.writeText(room.room_code)}>Copiar código</button>{onClear&&<button className="elv2-btn" type="button" onClick={onClear}>Salir de esta vista</button>}</div></div></section>;
  }

  function SentenceOrder({game,phase,student,onSubmit,busy,roundId}){
    const [chosen,setChosen]=React.useState([]);
    React.useEffect(()=>setChosen([]),[roundId]);
    if(!game)return null;
    const used=new Set(chosen);
    const tokenMap=Object.fromEntries((game.tokens||[]).map(t=>[t.token_id,t]));
    return <div className="elv2-card"><div className="elv2-label">Sentence Order</div><h3 style={{margin:'5px 0 3px',color:'#001E47'}}>{game.prompt||'Ordená la oración'}</h3>{game.stem&&<div className="elv2-muted" style={{marginBottom:12}}>{game.stem}</div>}<div className="elv2-answer" style={{marginBottom:10}}>{chosen.length?chosen.map((id,i)=><button className="elv2-token" type="button" key={`${id}-${i}`} onClick={()=>student&&phase==='OPEN'&&setChosen(prev=>prev.filter((_,idx)=>idx!==i))}>{tokenMap[id]?.label||'?'}</button>):<span className="elv2-muted">Tu oración aparecerá aquí.</span>}</div><div className="elv2-tokenbank">{(game.tokens||[]).map(t=><button type="button" className={`elv2-token ${used.has(t.token_id)?'used':''}`} disabled={!student||phase!=='OPEN'||used.has(t.token_id)||game.has_submitted} key={t.token_id} onClick={()=>setChosen(prev=>[...prev,t.token_id])}>{t.label}</button>)}</div>{student&&phase==='OPEN'&&!game.has_submitted&&<div className="elv2-row" style={{marginTop:12}}><button className="elv2-btn" type="button" onClick={()=>setChosen([])}>Reiniciar</button><button className="elv2-btn primary" type="button" disabled={busy||chosen.length!==(game.tokens||[]).length} onClick={()=>onSubmit({action_type:'SUBMIT_ORDER',token_ids:chosen})}>Enviar oración</button></div>}{game.has_submitted&&<Alert type="ok" text="Respuesta enviada. Esperá la corrección del docente."/>}{(phase==='REVEAL'||phase==='CLOSED')&&game.answer_sentence&&<div style={{marginTop:12}}><Alert type="ok" text={`Respuesta: ${game.answer_sentence}`}/></div>}</div>;
  }

  function Hangman({game,phase,student,onSubmit,busy}){
    if(!game)return null;
    const guessed=new Set([...(game.guessed_letters||[]),...(game.wrong_letters||[])].map(upper));
    const revealed=(phase==='REVEAL'||phase==='CLOSED')&&game.term;
    return <div className="elv2-card"><div className="elv2-label">Hangman</div><div className="elv2-hang-pattern" aria-label={revealed?`Palabra: ${game.term}`:'Palabra oculta'}>{revealed?game.term:(game.pattern||'—')}</div>{game.clue&&<div className="elv2-muted">Pista: {game.clue}</div>}<div className="elv2-row" style={{margin:'10px 0'}}><Pill>Errores {game.errors_used||0}/{game.max_errors||6}</Pill>{game.wrong_letters&&game.wrong_letters.length>0&&<Pill>Fallos: {game.wrong_letters.join(', ')}</Pill>}</div>{student&&phase==='OPEN'&&!game.completed&&<div className="elv2-alpha">{ALPHABET.map(letter=><button type="button" className="elv2-letter" key={letter} disabled={busy||guessed.has(letter)} onClick={()=>onSubmit({action_type:'GUESS_LETTER',letter})}>{letter}</button>)}</div>}{game.completed&&<Alert type={game.won?'ok':'info'} text={game.won?'¡Palabra completada!':'La ronda terminó. Esperá la revelación.'}/>}</div>;
  }

  function QuizTime({game,phase,student,onSubmit,busy,roundId}){
    const [answers,setAnswers]=React.useState({});
    React.useEffect(()=>setAnswers({}),[roundId]);
    if(!game)return null;
    const questions=game.questions||[];
    return <div className="elv2-card"><div className="elv2-label">Quiz Time</div><h3 style={{margin:'5px 0 12px',color:'#001E47'}}>10 preguntas · respuesta privada</h3>{questions.map((q,i)=><fieldset className="elv2-quizq" key={q.question_id}><legend className="elv2-question-title">{i+1}. {q.stem||q.prompt||'Pregunta'}</legend>{q.context_text&&<div className="elv2-muted elv2-question-context">{q.context_text}</div>}<div className="elv2-quiz-options" role="group" aria-label={`Opciones de la pregunta ${i+1}`}>{(q.options||[]).map(o=><button type="button" key={o.option_id} disabled={!student||phase!=='OPEN'||game.has_submitted} aria-pressed={answers[q.question_id]===o.option_id} className={`elv2-option ${answers[q.question_id]===o.option_id?'selected':''}`} onClick={()=>setAnswers(prev=>({...prev,[q.question_id]:o.option_id}))}>{o.label}</button>)}</div></fieldset>)}{student&&phase==='OPEN'&&!game.has_submitted&&<button className="elv2-btn primary" type="button" disabled={busy||questions.length!==10||Object.keys(answers).length!==10} onClick={()=>onSubmit({action_type:'SUBMIT_QUIZ',answers:questions.map(q=>({question_id:q.question_id,option_id:answers[q.question_id]}))})}>Enviar las 10 respuestas</button>}{game.has_submitted&&<Alert type="ok" text="Quiz enviado. Las respuestas correctas permanecen ocultas hasta REVEAL."/>}{(phase==='REVEAL'||phase==='CLOSED')&&Array.isArray(game.answer_key)&&<div style={{marginTop:14}}><div className="elv2-label">Corrección</div><ol>{game.answer_key.map(a=><li key={a.question_id} className="elv2-muted" style={{padding:'7px 0'}}><b>{a.correct_option_label}</b>{a.explanation?` · ${a.explanation}`:''}</li>)}</ol></div>}</div>;
  }

  function WordSearch({game,phase,student,onSubmit,busy,roundId}){
    const [start,setStart]=React.useState(null);
    React.useEffect(()=>setStart(null),[roundId]);
    if(!game)return null;
    const grid=Array.isArray(game.grid)?game.grid:[];
    const validGrid=grid.length===14&&grid.every(row=>Array.isArray(row)&&row.length===14);
    const revealSolutions=phase==='REVEAL'||phase==='CLOSED';
    const revealedPaths=revealSolutions&&Array.isArray(game.revealed_paths)?game.revealed_paths:[];
    const solutionCells=new Set();
    const revealedTargets=new Set();
    revealedPaths.forEach(path=>{
      if(path&&path.target_id)revealedTargets.add(path.target_id);
      (path&&Array.isArray(path.cells)?path.cells:[]).forEach(cell=>{
        if(cell&&Number.isInteger(cell.row)&&Number.isInteger(cell.col))solutionCells.add(`${cell.row}:${cell.col}`);
      });
    });
    function choose(row,col){
      if(!student||phase!=='OPEN'||busy)return;
      if(!start){setStart({row,col});return;}
      const first=start;setStart(null);onSubmit({action_type:'CLAIM_PATH',start_row:first.row,start_col:first.col,end_row:row,end_col:col});
    }
    const boardNote=revealSolutions&&revealedPaths.length?'Corrección: las respuestas están resaltadas en verde.':(student&&phase==='OPEN'?'Tocá la primera y la última letra de la palabra.':'Tablero compartido de la sala.');
    return <div className="elv2-card"><div className="elv2-label">Word Search</div><div className="elv2-muted" style={{margin:'5px 0 12px'}}>{boardNote}</div>{validGrid?<div className="elv2-ws" role="grid" aria-label="Sopa de letras de 14 filas por 14 columnas" aria-rowcount="14" aria-colcount="14">{grid.map((row,r)=><div className="elv2-ws-row" role="row" key={`row-${r}`}>{row.map((letter,c)=>{const solution=solutionCells.has(`${r}:${c}`);return <button key={`${r}-${c}`} type="button" role="gridcell" aria-label={`Fila ${r+1}, columna ${c+1}: ${letter}${solution?', parte de una solución':''}`} className={`elv2-cell ${start&&start.row===r&&start.col===c?'start':''} ${solution?'solution':''}`} onClick={()=>choose(r,c)} disabled={!student||phase!=='OPEN'}>{letter}</button>;})}</div>)}</div>:<Alert type="err" text="No se pudo mostrar la cuadrícula 14 × 14. Actualizá el estado de la sala."/>}<ul className="elv2-word-list" aria-label="Palabras por encontrar">{(game.words||[]).map(w=>{const revealed=revealedTargets.has(w.target_id);const solved=w.claimed||revealed;return <li className={`elv2-word-item ${w.claimed?'claimed':''} ${revealed?'revealed':''}`} key={w.target_id}>{solved?'✓ ':''}{w.label}</li>;})}</ul>{game.completed&&<div style={{marginTop:12}}><Alert type="ok" text="¡Todas las palabras fueron encontradas!"/></div>}</div>;
  }

  function GameBoard({view,student,onSubmit,busy}){
    const round=view&&view.round;const game=view&&view.game;if(!round)return <div className="elv2-card"><div className="elv2-muted">No hay una ronda activa.</div></div>;
    const props={game,phase:round.phase,student,onSubmit,busy,roundId:round.round_id};
    if(round.game_id==='SENTENCE_ORDER')return <SentenceOrder {...props}/>;
    if(round.game_id==='HANGMAN')return <Hangman {...props}/>;
    if(round.game_id==='QUIZ_TIME')return <QuizTime {...props}/>;
    if(round.game_id==='WORD_SEARCH')return <WordSearch {...props}/>;
    return <div className="elv2-card"><Alert type="err" text="Este juego no pertenece al catálogo v2 de producción."/></div>;
  }

  function TeacherView({usuario}){
    injectStyles();
    const live=useLiveState(VIEW.CONTROLLER);
    const groups=React.useMemo(()=>extractGroups(usuario||{}),[usuario]);
    const [group,setGroup]=React.useState(()=>groups[0]||'');
    const [title,setTitle]=React.useState('English LAB Live');
    const [gameId,setGameId]=React.useState('SENTENCE_ORDER');
    const [level,setLevel]=React.useState(()=>inferLevel(groups[0]||'B1'));
    const [unit,setUnit]=React.useState('01');
    const [item,setItem]=React.useState(1);
    const [duration,setDuration]=React.useState(60000);
    React.useEffect(()=>{if(group)setLevel(inferLevel(group));},[group]);
    const view=live.view,room=view&&view.room,round=view&&view.round,meta=gameMeta(gameId);
    async function safe(fn){try{return await fn();}catch(_){return null;}}
    async function create(){await safe(()=>live.run('createRoom',{payload:{group_id:group,title:clean(title)||'English LAB Live',config:{shell_version:SHELL_VERSION}}}));}
    async function control(action,payload={}){if(!room)return;const spec={room_id:room.room_id,payload:{expected_revision:stateRevision(view),...payload}};if(round)spec.round_id=round.round_id;await safe(()=>live.run(action,spec));}
    async function prepare(){
      if(!room||!meta)return;
      const settings={};if(meta.id==='SENTENCE_ORDER')settings.item_index=Number(item)||1;if(meta.id==='HANGMAN'){settings.item_index=Number(item)||1;settings.max_errors=6;}
      await control('prepareRound',{game_id:meta.id,content_ref:contentRef(level,unit,meta),settings});
    }
    return <div className="elv2-shell"><Header title="English LAB Live" sub="Control docente v2 · cuatro juegos server-authoritative · actividad de práctica, no nota oficial."/><Alert type="err" text={live.error}/><Alert type="ok" text={live.notice}/>{!room?<div className="elv2-two"><div className="elv2-card"><div className="elv2-label">Crear sala</div><h2 style={{margin:'5px 0 14px',color:'#001E47'}}>Nueva sesión en vivo</h2>{groups.length?<><label className="elv2-muted">Grupo anfitrión</label><select className="elv2-select" value={group} onChange={e=>setGroup(e.target.value)}>{groups.map(g=><option key={g} value={g}>{g}</option>)}</select></>:<Alert type="err" text="Tu sesión docente no trae grupos autorizados; el backend no permitirá crear una sala."/>}<label className="elv2-muted" style={{display:'block',marginTop:12}}>Título</label><input className="elv2-input" value={title} onChange={e=>setTitle(e.target.value)} maxLength={100}/><button className="elv2-btn primary" style={{marginTop:14}} disabled={live.busy||!group} type="button" onClick={create}>Crear sala</button></div><div className="elv2-card"><div className="elv2-label">Política de acceso</div><h3 style={{color:'#001E47'}}>SALA_MIXTA_AUTORIZADA</h3><div className="elv2-muted">El código puede compartirse con estudiantes autenticados de otros grupos para Club I CAN o sesiones combinadas. La identidad nunca se toma del navegador.</div></div></div>:<><RoomSummary view={view} onClear={()=>live.setRoomId('')}/><div className="elv2-two"><div style={{display:'grid',gap:16}}>{room.status==='LOBBY'&&<div className="elv2-card"><div className="elv2-label">Sala de espera</div><h2 style={{color:'#001E47'}}>Compartí el código y comenzá</h2><div className="elv2-muted" style={{marginBottom:12}}>Los estudiantes pueden ingresar con sesión válida antes de iniciar.</div><button className="elv2-btn primary" disabled={live.busy} type="button" onClick={()=>control('startRoom')}>Iniciar sala</button></div>}{room.status==='LIVE'&&!round&&<div className="elv2-card"><div className="elv2-label">Preparar ronda</div><h2 style={{margin:'5px 0 12px',color:'#001E47'}}>Elegí el juego</h2><GamePicker selected={gameId} onSelect={id=>{setGameId(id);setItem(1);}}/><div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10,marginTop:12}}><div><label className="elv2-muted">Nivel</label><select className="elv2-select" value={level} onChange={e=>setLevel(e.target.value)}>{LEVELS.map(x=><option key={x}>{x}</option>)}</select></div><div><label className="elv2-muted">Unidad</label><select className="elv2-select" value={unit} onChange={e=>setUnit(e.target.value)}>{UNITS.map(x=><option key={x} value={x}>Unidad {Number(x)}</option>)}</select></div>{meta&&meta.itemMax>0?<div><label className="elv2-muted">Ítem</label><select className="elv2-select" value={item} onChange={e=>setItem(Number(e.target.value))}>{Array.from({length:meta.itemMax},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></div>:<div/>}</div><button className="elv2-btn primary" style={{marginTop:14}} disabled={live.busy} type="button" onClick={prepare}>Preparar {meta&&meta.label}</button></div>}{round&&<><div className="elv2-card"><div className="elv2-row" style={{justifyContent:'space-between'}}><div><div className="elv2-label">Ronda #{round.sequence_no}</div><h2 style={{margin:'4px 0',color:'#001E47'}}>{gameMeta(round.game_id)?.label||round.game_id}</h2></div><Pill>{statusEs(round.phase)}</Pill></div><div className="elv2-row" style={{marginTop:12}}>{round.phase==='READY'&&<><select className="elv2-select" style={{width:170}} value={duration} onChange={e=>setDuration(Number(e.target.value))}><option value={30000}>30 segundos</option><option value={60000}>60 segundos</option><option value={90000}>90 segundos</option><option value={120000}>120 segundos</option></select><button className="elv2-btn primary" disabled={live.busy} type="button" onClick={()=>control('openRound',{duration_ms:duration})}>Abrir ronda</button></>}{round.phase==='OPEN'&&<button className="elv2-btn primary" disabled={live.busy} type="button" onClick={()=>control('lockRound')}>Bloquear respuestas</button>}{round.phase==='LOCKED'&&<button className="elv2-btn primary" disabled={live.busy} type="button" onClick={()=>control('revealRound',{reveal_duration_ms:30000})}>Revelar corrección</button>}{round.phase==='REVEAL'&&<button className="elv2-btn primary" disabled={live.busy} type="button" onClick={()=>control('closeRound',{reason:'TEACHER_NEXT_ROUND'})}>Cerrar ronda</button>}</div></div><GameBoard view={view} student={false} busy={live.busy}/></>}{room.status==='LIVE'&&!round&&<div className="elv2-card"><div className="elv2-row" style={{justifyContent:'space-between'}}><div><div className="elv2-label">Fin de sesión</div><div className="elv2-muted">Cerrá la sala solo cuando terminaste todas las rondas.</div></div><button className="elv2-btn danger" disabled={live.busy} type="button" onClick={()=>control('closeRoom',{reason:'TEACHER_ENDED_SESSION'})}>Cerrar sala</button></div></div>}{room.status==='CLOSED'&&<div className="elv2-card"><Alert type="info" text="Esta sala está cerrada. Podés salir de la vista y crear una nueva."/></div>}</div><Leaderboard rows={view.leaderboard||[]}/></div></>}</div>;
  }

  function StudentView(){
    injectStyles();
    const live=useLiveState(VIEW.STUDENT);
    const initial=React.useMemo(()=>{try{return upper(new URL(window.location.href).searchParams.get('room')||'');}catch(_){return '';}},[]);
    const [code,setCode]=React.useState(initial);
    const view=live.view,room=view&&view.room,round=view&&view.round;
    async function join(){try{await live.run('joinRoom',{room_code:upper(code),payload:{}});}catch(_){} }
    async function submit(attempt){
      if(!room||!round)return;
      try{await live.run('submitAttempt',{room_id:room.room_id,round_id:round.round_id,client_seen_revision:stateRevision(view),payload:attempt});}catch(_){}
    }
    let waiting='';if(room){if(room.status==='LOBBY')waiting='La sala está lista. Esperá a que el docente la inicie.';else if(room.status==='LIVE'&&!round)waiting='Estás dentro. Esperá a que el docente prepare la siguiente ronda.';else if(round&&round.phase==='READY')waiting='Ronda preparada. En unos segundos el docente abrirá las respuestas.';else if(round&&round.phase==='LOCKED')waiting='Respuestas bloqueadas. Esperá la corrección.';}
    return <div className="elv2-shell"><Header title="English LAB Live" sub="Entrá con el código de tu profe y jugá desde tu sesión del Campus."/><Alert type="err" text={live.error}/>{!room?<div className="elv2-two"><div className="elv2-card"><div className="elv2-label">Entrar a una sala</div><h2 style={{margin:'5px 0 8px',color:'#001E47'}}>Código LAB</h2><div className="elv2-muted" style={{marginBottom:12}}>No necesitás escribir tu nombre ni tu grupo: el servidor usa tu sesión autenticada.</div><input className="elv2-input" value={code} onChange={e=>setCode(upper(e.target.value))} placeholder="LAB-1234" maxLength={32} autoCapitalize="characters"/><button className="elv2-btn primary" type="button" style={{marginTop:12}} disabled={live.busy||clean(code).length<4} onClick={join}>Entrar a la sala</button></div><div className="elv2-card"><div className="elv2-label">Actividad de práctica</div><h3 style={{color:'#001E47'}}>Tu progreso oficial no cambia</h3><div className="elv2-muted">English LAB Live sirve para practicar en clase. Los puntos son del juego y no sustituyen notas, asistencia ni evaluaciones oficiales.</div></div></div>:<><RoomSummary view={view} onClear={()=>live.setRoomId('')}/>{waiting&&<div style={{marginBottom:16}}><Alert type="info" text={waiting}/></div>}<div className="elv2-two"><div><GameBoard view={view} student={true} onSubmit={submit} busy={live.busy}/></div><Leaderboard rows={view.leaderboard||[]}/></div>{room.status==='CLOSED'&&<div style={{marginTop:16}}><Alert type="info" text="La sesión terminó. Salí de esta vista para ingresar a otra sala."/></div>}</>}</div>;
  }

  TeacherView.__elv2E10=true;StudentView.__elv2E10=true;
  window.EnglishLabLiveTeacherView=TeacherView;
  window.EnglishLabLiveStudentView=StudentView;
  window.EnglishLabLiveV2={version:SHELL_VERSION,api_version:API_VERSION,games:GAME_CATALOG.map(g=>g.id),postV2};
})();
