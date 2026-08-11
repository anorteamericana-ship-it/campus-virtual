/* global React */
// CS21A198 · Gateway aditivo de Quiz Time sobre las vistas históricas English LAB Live.
(function installQuizTimeGatewayCS21A198(global){
  'use strict';
  if(!global || global.EnglishLabQuizTimeGatewayCS21A198) return;

  const VERSION='F98.4-Z6-CS21A198-G1';
  const API=global.EnglishLabQuizTimeCS21A198;
  const LegacyTeacher=global.EnglishLabLiveTeacherView;
  const LegacyStudent=global.EnglishLabLiveStudentView;
  if(!API) throw new Error('Falta EnglishLabQuizTimeCS21A198.');
  if(typeof LegacyTeacher!=='function' || typeof LegacyStudent!=='function') throw new Error('Las vistas históricas de English LAB Live no están disponibles.');

  function clean(v){return String(v==null?'':v).trim();}
  function upper(v){return clean(v).toUpperCase();}
  function groupCode(g){return clean(typeof g==='object'?(g.code||g.cod_grupo||g.codigo||g.grupo):g);}
  function levelId(g){const c=groupCode(g);return upper(g?.nivelId||g?.nivel||c.split('-')[0]||'');}
  function publicCode(v){return upper(v).replace(/[^A-Z0-9-]/g,'').slice(0,12);}
  function wantsQuiz(){try{const q=new URLSearchParams(global.location.search||'');return q.get('quiz')==='1'||upper(q.get('game'))==='QUIZ_TIME';}catch(_){return false;}}
  function sessionUser(props){if(props?.usuario)return props.usuario;try{return JSON.parse(sessionStorage.getItem('an_usuario')||'{}')||{};}catch(_){return {};}}
  function studentCode(props){const u=sessionUser(props);return clean(u.codigo||u.CODIGO||u.cod_estudiante||u.COD_ESTUDIANTE||u.cedula||u.CEDULA||u.identificacion||'');}
  function studentName(props){const u=sessionUser(props);return clean(u.nombre||u.nombre_completo||u.NOMBRE||u.name||'');}

  function Switcher({mode,setMode,student=false}){
    return <div className={'qt198-gateway '+(student?'student':'')}>
      <button type="button" className={mode==='quiz'?'active':''} onClick={()=>setMode('quiz')}>Quiz Time · B1-U01</button>
      <button type="button" className={mode==='legacy'?'active':''} onClick={()=>setMode('legacy')}>{student?'Otros juegos':'Otros juegos Live'}</button>
    </div>;
  }

  function TeacherQuiz(){
    const [data,setData]=React.useState(null); const [loading,setLoading]=React.useState(true); const [busy,setBusy]=React.useState(false); const [error,setError]=React.useState('');
    const [group,setGroup]=React.useState(''); const [room,setRoom]=React.useState(null);
    const load=React.useCallback(async()=>{setLoading(true);setError('');try{const r=await API.teacherData();setData(r);const b1=(r.grupos||[]).find(g=>levelId(g)==='B1');setGroup(prev=>prev||groupCode(b1));}catch(e){setError(e.message||String(e));}finally{setLoading(false);}},[]);
    React.useEffect(()=>{load();},[load]);
    const groups=(data?.grupos||[]).filter(g=>levelId(g)==='B1');
    const curriculum=data?.curriculum||{};
    async function create(){if(!group)return;setBusy(true);setError('');try{const r=await API.createRoom({codGrupo:group,nivel:'B1',unit:'U01'});setRoom(r);}catch(e){setError(e.message||String(e));}finally{setBusy(false);}}
    function copyLink(){const code=publicCode(room?.room?.room_code||room?.room?.ROOM_CODE);if(!code)return;const url=new URL(global.location.href);url.searchParams.set('room',code);url.searchParams.set('quiz','1');url.hash='english_lab_live';navigator.clipboard?.writeText(url.toString()).catch(()=>{});}
    if(room) return <div><div className="qt198-gateway-roomhead"><div><span>Quiz Time · sala</span><strong>{publicCode(room?.room?.room_code||room?.room?.ROOM_CODE)}</strong></div><button type="button" className="qt198-btn secondary" onClick={copyLink}>Copiar enlace estudiante</button></div><API.TeacherRoom initial={room} onExit={()=>{setRoom(null);load();}}/></div>;
    return <div className="qt198-builder">
      <section className="qt198-builder-hero"><span>English LAB · núcleo curricular</span><h2>Quiz Time</h2><p>Básico I · Unidad 1 · 10 preguntas equilibradas en Vocabulary, Grammar, Communication, Listening y Reading.</p></section>
      {error&&<div className="qt198-feedback warn"><i>!</i><div><strong>No se pudo cargar Quiz Time</strong><p>{error}</p></div></div>}
      <div className="qt198-builder-grid">
        <section className="qt198-builder-card"><span className="qt198-eyebrow">Crear sala</span><h3>B1 · U01 · What’s your name?</h3><label>Grupo Básico I<select value={group} onChange={e=>setGroup(e.target.value)} disabled={loading}>{groups.map(g=><option key={groupCode(g)} value={groupCode(g)}>{groupCode(g)} · {clean(g.dias_label||g.dias||'Horario')}</option>)}</select></label><div className="qt198-builder-areas"><span>Vocabulary ×2</span><span>Grammar ×2</span><span>Communication ×2</span><span>Listening ×2</span><span>Reading ×2</span></div><button type="button" className="qt198-btn" disabled={busy||loading||!group||data?.curriculum_validation?.ok===false} onClick={create}>{busy?'Creando…':'Crear Quiz Time B1-U01'}</button></section>
        <aside className="qt198-builder-card curriculum"><span className="qt198-eyebrow">Trazabilidad curricular</span><h3>{clean(curriculum.UNIT_NAME||curriculum.unit_name||"What's your name?")}</h3><p>{clean(curriculum.UNIT_OBJECTIVE_ES||curriculum.unit_objective_es||'Presentarse e intercambiar información personal básica.')}</p><small>Fuente: CONFIG_UNIDADES + ACADEMIA_PLAY_BANK · 25 ítems canónicos · 10 por ronda</small></aside>
      </div>
      <section className="qt198-builder-card"><span className="qt198-eyebrow">Salas Quiz Time recientes</span>{loading?<p>Cargando…</p>:(data?.rooms||[]).length?(data.rooms||[]).slice(0,6).map(r=><button key={publicCode(r.room_code||r.ROOM_CODE)} className="qt198-builder-room" onClick={()=>setRoom({room:r,quiz_state:{phase:'WAITING'},question_total:10})}><b>{publicCode(r.room_code||r.ROOM_CODE)}</b><span>{upper(r.status||r.STATUS)} · {clean(r.cod_grupo||r.COD_GRUPO)}</span></button>):<p>Aún no hay salas de Quiz Time.</p>}</section>
    </div>;
  }

  function StudentQuiz(props){
    const initialCode=(()=>{try{return publicCode(new URLSearchParams(global.location.search||'').get('room')||'');}catch(_){return'';}})();
    const [code,setCode]=React.useState(initialCode); const [name,setName]=React.useState(studentName(props)); const [student,setStudent]=React.useState(studentCode(props)); const [joined,setJoined]=React.useState(null); const [busy,setBusy]=React.useState(false); const [error,setError]=React.useState('');
    async function join(){const rc=publicCode(code);if(!rc){setError('Escribí el código de sala.');return;}if(!student){setError('No pudimos confirmar tu código de estudiante desde la sesión.');return;}setBusy(true);setError('');try{const r=await API.joinRoom(rc,{...props,usuario:{...sessionUser(props),codigo:student,nombre:name||student}});setJoined(r);}catch(e){setError(e.message||String(e));}finally{setBusy(false);}}
    if(joined) return <API.StudentSession initial={joined} props={{...props,usuario:{...sessionUser(props),codigo:student,nombre:name||student}}} onExit={()=>setJoined(null)}/>;
    return <div className="qt198-student-entry"><section className="qt198-entry-copy"><span>English LAB Live</span><h2>Quiz Time</h2><p>Entrá con el código del docente. La respuesta correcta permanece oculta hasta el reveal de cada pregunta.</p><div className="qt198-builder-areas"><span>V</span><span>G</span><span>C</span><span>L</span><span>R</span></div></section><section className="qt198-builder-card">{error&&<div className="qt198-feedback warn"><i>!</i><div><strong>No se pudo entrar</strong><p>{error}</p></div></div>}<label>Código de sala<input value={code} onChange={e=>setCode(publicCode(e.target.value))} placeholder="LAB-0000" autoFocus/></label><label>Nombre<input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre"/></label><label>Código estudiante<input value={student} onChange={e=>setStudent(e.target.value)} placeholder="Se toma de la sesión"/></label><button type="button" className="qt198-btn" disabled={busy} onClick={join}>{busy?'Entrando…':'Entrar a Quiz Time'}</button><small>Actividad formativa. No altera notas, pagos ni certificados.</small></section></div>;
  }

  function TeacherGateway(props){const [mode,setMode]=React.useState(wantsQuiz()?'quiz':'legacy');return <div><Switcher mode={mode} setMode={setMode}/>{mode==='quiz'?<TeacherQuiz/>:<LegacyTeacher {...props}/>}</div>;}
  function StudentGateway(props){const [mode,setMode]=React.useState(wantsQuiz()?'quiz':'legacy');return <div><Switcher mode={mode} setMode={setMode} student/>{mode==='quiz'?<StudentQuiz {...props}/>:<LegacyStudent {...props}/>}</div>;}

  const api=Object.freeze({VERSION,LegacyTeacher,LegacyStudent,TeacherGateway,StudentGateway,TeacherQuiz,StudentQuiz,install(){global.EnglishLabLiveTeacherView=TeacherGateway;global.EnglishLabLiveStudentView=StudentGateway;return true;}});
  global.EnglishLabQuizTimeGatewayCS21A198=api;
  api.install();
})(window);
