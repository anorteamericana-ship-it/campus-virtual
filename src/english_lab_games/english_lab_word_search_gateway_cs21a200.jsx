/* global React */
// CS21A200 · Gateway multi-juego: Word Search + Quiz Time + juegos históricos.
(function installEnglishLabWordSearchGatewayCS21A200(global){
  'use strict';
  if(!global||global.EnglishLabWordSearchGatewayCS21A200)return;

  const VERSION='CS21A200';
  const API=global.EnglishLabWordSearchLiveCS21A200;
  const QuizGateway=global.EnglishLabQuizTimeGatewayCS21A198;
  if(!API)throw new Error('Falta EnglishLabWordSearchLiveCS21A200.');
  if(!QuizGateway)throw new Error('Falta EnglishLabQuizTimeGatewayCS21A198.');
  const LegacyTeacher=QuizGateway.LegacyTeacher;
  const LegacyStudent=QuizGateway.LegacyStudent;
  const TeacherQuiz=QuizGateway.TeacherQuiz;
  const StudentQuiz=QuizGateway.StudentQuiz;
  if(typeof LegacyTeacher!=='function'||typeof LegacyStudent!=='function'||typeof TeacherQuiz!=='function'||typeof StudentQuiz!=='function')throw new Error('Gateway CS198 incompleto para CS21A200.');

  function clean(v){return String(v==null?'':v).trim();}
  function upper(v){return clean(v).toUpperCase();}
  function publicCode(v){return upper(v).replace(/[^A-Z0-9-]/g,'').slice(0,12);}
  function groupCode(g){return clean(typeof g==='object'?(g.code||g.cod_grupo||g.codigo||g.grupo):g);}
  function levelId(g){const c=groupCode(g);return upper(g?.nivelId||g?.nivel||c.split('-')[0]||'');}
  function sessionUser(props){if(props?.usuario)return props.usuario;try{return JSON.parse(global.sessionStorage.getItem('an_usuario')||'{}')||{};}catch(_){return{};}}
  function studentCode(props){const u=sessionUser(props);return clean(u.codigo||u.CODIGO||u.cod_estudiante||u.COD_ESTUDIANTE||u.cedula||u.CEDULA||u.identificacion||'');}
  function studentName(props){const u=sessionUser(props);return clean(u.nombre||u.nombre_completo||u.NOMBRE||u.name||'');}
  function requestedMode(){try{const q=new URLSearchParams(global.location.search||'');const game=upper(q.get('game'));if(game==='WORD_SEARCH'||q.get('wordsearch')==='1')return'wordsearch';if(game==='QUIZ_TIME'||q.get('quiz')==='1')return'quiz';return'legacy';}catch(_){return'legacy';}}

  function Switcher({mode,setMode}){return <div className="ws200-gateway"><button type="button" className={mode==='wordsearch'?'active':''} onClick={()=>setMode('wordsearch')}>Word Search · B1-U01</button><button type="button" className={mode==='quiz'?'active':''} onClick={()=>setMode('quiz')}>Quiz Time · B1-U01</button><button type="button" className={mode==='legacy'?'active':''} onClick={()=>setMode('legacy')}>Otros juegos Live</button></div>;}

  function TeacherWordSearch(){
    const [data,setData]=React.useState(null),[loading,setLoading]=React.useState(true),[busy,setBusy]=React.useState(false),[error,setError]=React.useState(''),[group,setGroup]=React.useState(''),[room,setRoom]=React.useState(null);
    const load=React.useCallback(async()=>{setLoading(true);setError('');try{const r=await API.teacherData();setData(r);const b1=(r.grupos||[]).find(g=>levelId(g)==='B1');setGroup(prev=>prev||groupCode(b1));}catch(e){setError(e.message||String(e));}finally{setLoading(false);}},[]);
    React.useEffect(()=>{load();},[load]);
    const groups=(data?.grupos||[]).filter(g=>levelId(g)==='B1');
    async function create(){if(!group)return;setBusy(true);setError('');try{setRoom(await API.createRoom({codGrupo:group,nivel:'B1',unit:'U01'}));}catch(e){setError(e.message||String(e));}finally{setBusy(false);}}
    function copyLink(){const code=publicCode(room?.room?.room_code||room?.room?.ROOM_CODE);if(!code)return;const url=new URL(global.location.href);url.searchParams.set('room',code);url.searchParams.set('game','WORD_SEARCH');url.hash='english_lab_live';navigator.clipboard?.writeText(url.toString()).catch(()=>{});}
    if(room)return <div><div className="ws200-live-head"><div><span>Word Search · sala</span><strong>{publicCode(room?.room?.room_code||room?.room?.ROOM_CODE)}</strong></div><div><button type="button" onClick={copyLink}>Copiar enlace estudiante</button></div></div><API.TeacherRoom initial={room} onExit={()=>{setRoom(null);load();}}/></div>;
    return <div className="ws200-builder"><section className="ws200-builder-hero"><span>English LAB · vocabulario curricular</span><h2>Word Search</h2><p>Básico I · Unidad 1 · 10 vocablos canónicos en una cuadrícula 14×14. Primer claim autoritativo gana la palabra.</p></section>{error&&<div className="ws200-live-error">{error}</div>}<div className="ws200-builder-grid"><section className="ws200-builder-card"><h3>Crear sala B1 · U01</h3><label>Grupo Básico I<select value={group} onChange={e=>setGroup(e.target.value)} disabled={loading}>{groups.map(g=><option key={groupCode(g)} value={groupCode(g)}>{groupCode(g)} · {clean(g.dias_label||g.dias||'Horario')}</option>)}</select></label><div className="ws200-builder-meta"><span>14×14</span><span>10 palabras</span><span>3 minutos</span><span>Práctica formativa</span></div><button type="button" disabled={busy||loading||!group||data?.curriculum_validation?.ok===false} onClick={create}>{busy?'Creando…':'Crear Word Search B1-U01'}</button></section><aside className="ws200-builder-card"><h3>Contrato curricular</h3><p>{clean(data?.curriculum?.UNIT_NAME||"What's your name?")}</p><small>Fuente: CONFIG_UNIDADES + ACADEMIA_PLAY_BANK. La solución no viaja al navegador.</small></aside></div><section className="ws200-builder-card"><h3>Salas Word Search recientes</h3>{loading?<p>Cargando…</p>:(data?.rooms||[]).length?(data.rooms||[]).slice(0,6).map(r=><button key={publicCode(r.room_code||r.ROOM_CODE)} className="ws200-builder-room" onClick={()=>setRoom({room:r,word_search_state:{phase:'WAITING'}})}><b>{publicCode(r.room_code||r.ROOM_CODE)}</b><span>{upper(r.status||r.STATUS)} · {clean(r.cod_grupo||r.COD_GRUPO)}</span></button>):<p>Aún no hay salas Word Search.</p>}</section></div>;
  }

  function StudentWordSearch(props){
    const initialCode=(()=>{try{return publicCode(new URLSearchParams(global.location.search||'').get('room')||'');}catch(_){return'';}})();
    const [code,setCode]=React.useState(initialCode),[joined,setJoined]=React.useState(null),[busy,setBusy]=React.useState(false),[error,setError]=React.useState('');
    const codeStudent=studentCode(props),name=studentName(props)||codeStudent;
    async function join(){const roomCode=publicCode(code);if(!roomCode){setError('Escribí el código de sala.');return;}if(!codeStudent){setError('No pudimos confirmar tu código de estudiante desde la sesión.');return;}setBusy(true);setError('');try{setJoined(await API.joinRoom(roomCode,{...props,usuario:{...sessionUser(props),codigo:codeStudent,nombre:name}}));}catch(e){setError(e.message||String(e));}finally{setBusy(false);}}
    if(joined)return <API.StudentSession initial={joined} props={{...props,usuario:{...sessionUser(props),codigo:codeStudent,nombre:name}}} onExit={()=>setJoined(null)}/>;
    return <div className="ws200-student-entry"><section className="ws200-entry-copy"><span>English LAB Live</span><h2>Word Search</h2><p>Encontrá el vocabulario de B1 · U01. Si dos jugadores encuentran la misma palabra casi al mismo tiempo, el servidor decide quién la obtuvo primero.</p></section><section className="ws200-builder-card">{error&&<div className="ws200-live-error">{error}</div>}<label>Código de sala<input value={code} onChange={e=>setCode(publicCode(e.target.value))} placeholder="LAB-0000" autoFocus/></label><label>Estudiante<input value={`${name}${codeStudent?` · ${codeStudent}`:''}`} readOnly/></label><button type="button" disabled={busy} onClick={join}>{busy?'Entrando…':'Entrar a Word Search'}</button><small>Actividad formativa. No altera notas, pagos ni certificados.</small></section></div>;
  }

  function TeacherGateway(props){const [mode,setMode]=React.useState(requestedMode());return <div><Switcher mode={mode} setMode={setMode}/>{mode==='wordsearch'?<TeacherWordSearch/>:mode==='quiz'?<TeacherQuiz/>:<LegacyTeacher {...props}/>}</div>;}
  function StudentGateway(props){const [mode,setMode]=React.useState(requestedMode());return <div><Switcher mode={mode} setMode={setMode}/>{mode==='wordsearch'?<StudentWordSearch {...props}/>:mode==='quiz'?<StudentQuiz {...props}/>:<LegacyStudent {...props}/>}</div>;}

  const api=Object.freeze({VERSION,TeacherGateway,StudentGateway,TeacherWordSearch,StudentWordSearch,LegacyTeacher,LegacyStudent,install(){global.EnglishLabLiveTeacherView=TeacherGateway;global.EnglishLabLiveStudentView=StudentGateway;return true;}});
  global.EnglishLabWordSearchGatewayCS21A200=api;
  api.install();
})(window);
