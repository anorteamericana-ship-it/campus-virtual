// F98.4-Z6-CS20B · English LAB Live control de ronda
// Práctica gamificada en vivo. No registra notas oficiales ni afecta aprobación.
/* global React, PageHeader */
(function(){
  const SCRIPT_URL_LIVE = window.APPS_SCRIPT_URL;
  const VERSION = 'F98.4-Z6-CS20B';
  const GAME_TYPES = [
    { code:'VOCAB_SPRINT', label:'Vocabulary Sprint', area:'Vocabulario', note:'Rondas rápidas de vocabulario.' },
    { code:'WORD_MATCH', label:'Word Match', area:'Vocabulario', note:'Parejas palabra / significado.' },
    { code:'PHRASE_BUILDER', label:'Phrase Builder', area:'Speaking', note:'Construcción guiada de frases.' },
    { code:'MINI_CHALLENGE', label:'Mini Challenge', area:'Mixto', note:'Preguntas cortas de práctica.' },
    { code:'SURVIVAL_MISSION', label:'Survival Mission', area:'Conversacional', note:'Situaciones reales de supervivencia.' },
  ];
  const MODES = [
    { code:'INDIVIDUAL', label:'Individual' },
    { code:'TEAMS', label:'Equipos' },
  ];

  function clean(v){ return String(v == null ? '' : v).trim(); }
  function upper(v){ return clean(v).toUpperCase(); }
  function groupCode(g){ return clean(typeof g === 'object' ? (g.code || g.cod_grupo || g.codigo || g.grupo) : g); }
  function levelId(g){ const c=groupCode(g); return upper(g?.nivelId || g?.nivel || c.split('-')[0] || 'B1'); }
  function levelLabel(id){ return ({B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'}[upper(id)] || id || 'Nivel'); }
  function shortGroup(g){ const code=groupCode(g); const parts=code.split('-'); return parts.length ? parts[parts.length-1] : code; }
  function groupTitle(g){
    const code=groupCode(g);
    const dias=clean(g?.dias_label || g?.dias || g?.diasCode || 'Horario');
    const hora=[clean(g?.hora_i || g?.hora_inicio), clean(g?.hora_f || g?.hora_fin)].filter(Boolean).join(' a ');
    return `${levelLabel(levelId(g))} · ${dias}${hora?' · '+hora:''} · ${shortGroup(g)||code}`;
  }
  function statusLabel(s){
    const v=upper(s);
    if(v==='CREATED') return 'Creada';
    if(v==='LIVE') return 'En vivo';
    if(v==='CLOSED') return 'Cerrada';
    return v || '—';
  }
  function roundLabel(s){
    const v=upper(s);
    if(v==='OPEN') return 'Pregunta abierta';
    if(v==='CLOSED') return 'Pregunta cerrada';
    return 'Sin pregunta activa';
  }
  function toneStatus(s){
    const v=upper(s);
    if(v==='LIVE') return {bg:'#EAF8EF', ink:'#145C38', border:'#20A15C'};
    if(v==='CLOSED') return {bg:'#F3F4F6', ink:'#4B5563', border:'#CBD5E1'};
    return {bg:'#EEF4FF', ink:'#073B7A', border:'#6AA8F6'};
  }
  function toneRound(s){
    const v=upper(s);
    if(v==='OPEN') return {bg:'#FFF7E6', ink:'#7A4B00', border:'#FFD88A'};
    if(v==='CLOSED') return {bg:'#EEF4FF', ink:'#073B7A', border:'#B7D5FF'};
    return {bg:'#F8FAFC', ink:'#475467', border:'#E4E7EC'};
  }
  async function postLive(fn, payload={}, timeoutMs=35000){
    const token = window.getSessionToken ? window.getSessionToken() : '';
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(()=>controller.abort(), timeoutMs) : null;
    try{
      const res = await fetch(`${SCRIPT_URL_LIVE}?fn=${encodeURIComponent(fn)}`, {
        method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({ fn, token, ...payload }),
        signal:controller ? controller.signal : undefined,
      });
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch(_) { throw new Error('Respuesta inválida del backend.'); }
      if(!res.ok || !data || data.ok === false) throw new Error((data && (data.mensaje || data.error)) || `HTTP ${res.status}`);
      return data;
    } catch(e){
      if(e && e.name === 'AbortError') throw new Error('El backend tardó demasiado en responder.');
      throw e;
    } finally { if(timer) clearTimeout(timer); }
  }

  function Header({title, sub}){
    if(typeof PageHeader === 'function') return <PageHeader kicker="English LAB Live" title={title} sub={sub}/>;
    return <div style={{marginBottom:18}}><div style={{fontSize:11,fontWeight:900,letterSpacing:'.15em',color:'#7A1E2C',textTransform:'uppercase'}}>English LAB Live</div><h1 style={{margin:'4px 0',fontSize:34,color:'#001E47'}}>{title}</h1>{sub&&<p style={{color:'#667085'}}>{sub}</p>}</div>;
  }
  function Alert({children, tone='info'}){
    const map={info:['#EEF4FF','#073B7A','#B7D5FF'],warn:['#FFF7E6','#7A4B00','#FFD88A'],err:['#FDECEA','#8B1F1F','#F5B5B5'],ok:['#EAF8EF','#145C38','#BDE8CD']};
    const [bg,ink,border]=map[tone]||map.info;
    return <div style={{padding:'12px 14px',borderRadius:14,background:bg,color:ink,border:`1px solid ${border}`,fontSize:12.5,lineHeight:1.45,fontWeight:650}}>{children}</div>;
  }
  function GameButton({game, active, onClick}){
    return <button type="button" onClick={onClick} style={{border:active?'2px solid #073B7A':'1px solid var(--line,#E4E7EC)',background:active?'#EEF4FF':'#FFF',borderRadius:14,padding:'13px 14px',textAlign:'left',cursor:'pointer',fontFamily:'inherit',minHeight:94,boxShadow:active?'0 8px 20px rgba(7,59,122,.12)':'0 2px 8px rgba(15,23,42,.04)'}}>
      <div style={{fontSize:10,fontWeight:900,letterSpacing:'.11em',color:active?'#073B7A':'#7A1E2C',textTransform:'uppercase'}}>{game.area}</div>
      <div style={{fontSize:17,fontWeight:950,color:'#001E47',marginTop:4}}>{game.label}</div>
      <div style={{fontSize:11.5,color:'#667085',marginTop:5,lineHeight:1.35}}>{game.note}</div>
    </button>;
  }

  function RoomCard({room, onRefresh, onOpen}){
    const t=toneStatus(room.status || room.STATUS);
    const rt=toneRound(room.round_status || room.ROUND_STATUS);
    const code=clean(room.room_code || room.ROOM_CODE || room.room_id || room.ROOM_ID);
    const status=room.status || room.STATUS;
    return <div style={{border:'1px solid var(--line,#E4E7EC)',borderRadius:16,padding:14,background:'#FFF',boxShadow:'0 4px 14px rgba(15,23,42,.05)'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'flex-start'}}>
        <div>
          <div style={{fontSize:10,fontWeight:900,letterSpacing:'.12em',color:'#7A1E2C',textTransform:'uppercase'}}>Sala</div>
          <div style={{fontSize:26,fontWeight:950,color:'#001E47',fontFamily:'var(--f-mono,monospace)',letterSpacing:'.02em'}}>{code}</div>
        </div>
        <span style={{padding:'5px 9px',borderRadius:999,background:t.bg,color:t.ink,border:`1px solid ${t.border}`,fontSize:10.5,fontWeight:900}}>{statusLabel(status)}</span>
      </div>
      <div style={{display:'grid',gap:5,marginTop:10,fontSize:12.5,color:'#475467'}}>
        <div><b>{room.game_label || room.GAME_LABEL}</b> · {room.mode || room.MODE}</div>
        <div>{room.cod_grupo || room.COD_GRUPO} · {levelLabel(room.nivel || room.NIVEL)} · {room.question_count || room.QUESTION_COUNT} preguntas</div>
        <div><span style={{display:'inline-flex',padding:'3px 7px',borderRadius:999,background:rt.bg,color:rt.ink,border:`1px solid ${rt.border}`,fontSize:10.5,fontWeight:900}}>{roundLabel(room.round_status || room.ROUND_STATUS)}</span></div>
        <div style={{color:'#98A2B3'}}>Creada: {clean(room.created_at || room.CREATED_AT) || '—'}</div>
      </div>
      <div style={{marginTop:12,display:'flex',gap:8,flexWrap:'wrap'}}>
        <button className="btn btn-ghost" type="button" onClick={onRefresh}>Actualizar</button>
        <button className="btn btn-primary" type="button" onClick={()=>onOpen && onOpen(room)}>Abrir control de ronda</button>
      </div>
    </div>;
  }

  function QuestionCard({question, showAnswer=false}){
    if(!question) return <Alert tone="warn">Aún no hay pregunta seleccionada.</Alert>;
    const options = Array.isArray(question.options) ? question.options : [];
    const correct = clean(question.correct);
    return <div style={{border:'1px solid #D0D5DD',borderRadius:18,background:'#FFF',padding:18,boxShadow:'0 10px 24px rgba(15,23,42,.06)'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',alignItems:'center',marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:950,letterSpacing:'.13em',color:'#7A1E2C',textTransform:'uppercase'}}>Pregunta {question.index || 1}</div>
        <span style={{fontSize:10.5,fontWeight:950,padding:'5px 9px',borderRadius:999,background:'#EEF4FF',border:'1px solid #B7D5FF',color:'#073B7A'}}>{clean(question.type || 'choice')}</span>
      </div>
      <div style={{fontSize:24,fontWeight:950,color:'#001E47',lineHeight:1.15,marginBottom:14}}>{question.prompt}</div>
      {question.context && <div style={{padding:'10px 12px',borderRadius:12,background:'#F8FAFC',border:'1px solid #E4E7EC',color:'#475467',fontSize:13,lineHeight:1.45,marginBottom:12}}>{question.context}</div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:8}}>
        {options.map((op,i)=>{
          const isOk = showAnswer && clean(op.value || op) === correct;
          return <div key={i} style={{border:`1.5px solid ${isOk?'#20A15C':'#E4E7EC'}`,background:isOk?'#EAF8EF':'#FFF',borderRadius:12,padding:'10px 12px',fontSize:14,fontWeight:850,color:isOk?'#145C38':'#344054'}}>
            <span style={{display:'inline-grid',placeItems:'center',width:22,height:22,borderRadius:999,background:isOk?'#20A15C':'#EEF4FF',color:isOk?'#FFF':'#073B7A',fontSize:11,fontWeight:950,marginRight:7}}>{String.fromCharCode(65+i)}</span>
            {clean(op.label || op.text || op.value || op)}
          </div>;
        })}
      </div>
      {showAnswer && question.explanation && <div style={{marginTop:12,fontSize:12.5,lineHeight:1.45,color:'#145C38',background:'#EAF8EF',border:'1px solid #BDE8CD',borderRadius:12,padding:'10px 12px'}}><b>Respuesta:</b> {question.explanation}</div>}
    </div>;
  }

  function RoomControl({roomRef, onBack, onChanged}){
    const roomId = clean(roomRef?.room_id || roomRef?.ROOM_ID || roomRef?.room_code || roomRef?.ROOM_CODE);
    const [loading,setLoading]=React.useState(true);
    const [busy,setBusy]=React.useState(false);
    const [error,setError]=React.useState('');
    const [data,setData]=React.useState(null);
    const room=data?.room || roomRef || {};
    const questions=Array.isArray(data?.questions) ? data.questions : [];
    const current=data?.current_question || null;
    const events=Array.isArray(data?.events) ? data.events : [];
    const status=upper(room.status || room.STATUS);
    const round=upper(room.round_status || room.ROUND_STATUS);
    const total=Number(room.question_count || room.QUESTION_COUNT || questions.length || 0) || questions.length;
    const currentIndex=Number(room.current_index || room.CURRENT_INDEX || 0) || 0;

    const load=React.useCallback(async()=>{
      if(!roomId) return;
      setLoading(true); setError('');
      try{ const r=await postLive('englishLabLiveGetRoomControl',{room_id:roomId},45000); setData(r); }
      catch(e){ setError(e.message || String(e)); }
      finally{ setLoading(false); }
    },[roomId]);
    React.useEffect(()=>{ load(); },[load]);

    async function action(fn,payload={}){
      setBusy(true); setError('');
      try{
        await postLive(fn,{room_id:roomId,...payload},45000);
        await load();
        onChanged && onChanged();
      }catch(e){ setError(e.message || String(e)); }
      finally{ setBusy(false); }
    }
    const canOpen = status !== 'CLOSED';
    const canStart = status === 'CREATED';
    const canLaunch = canOpen && (round !== 'OPEN');
    const canCloseRound = canOpen && round === 'OPEN';
    const nextIndex = Math.min(Math.max(currentIndex + 1, 1), total || 1);
    const closedOrStarted = status === 'LIVE' || status === 'CLOSED';

    return <div style={{display:'grid',gap:14}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <button className="btn btn-ghost" type="button" onClick={onBack}>← Volver a salas</button>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="btn btn-ghost" type="button" disabled={loading||busy} onClick={load}>Actualizar control</button>
          <button className="btn btn-ghost" type="button" disabled={busy||status==='CLOSED'} onClick={()=>{ if(confirm('¿Cerrar esta sala live?')) action('englishLabLiveCloseRoom'); }}>Cerrar sala</button>
        </div>
      </div>
      {error && <Alert tone="err">{error}</Alert>}
      <div className="card" style={{padding:18,borderRadius:18,background:'#FFF'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:11,fontWeight:950,letterSpacing:'.13em',color:'#7A1E2C',textTransform:'uppercase'}}>Control de ronda</div>
            <div style={{fontSize:34,fontWeight:950,color:'#001E47',fontFamily:'var(--f-mono,monospace)',lineHeight:1}}>{room.room_code || room.ROOM_CODE || roomId}</div>
            <div style={{fontSize:13,color:'#667085',marginTop:8,lineHeight:1.4}}>{room.game_label || room.GAME_LABEL} · {room.mode || room.MODE} · {room.cod_grupo || room.COD_GRUPO} · {levelLabel(room.nivel || room.NIVEL)}</div>
          </div>
          <div style={{display:'grid',gap:7,justifyItems:'end'}}>
            <span style={{fontSize:11,fontWeight:950,borderRadius:999,padding:'6px 10px',background:toneStatus(status).bg,color:toneStatus(status).ink,border:`1px solid ${toneStatus(status).border}`}}>{statusLabel(status)}</span>
            <span style={{fontSize:11,fontWeight:950,borderRadius:999,padding:'6px 10px',background:toneRound(round).bg,color:toneRound(round).ink,border:`1px solid ${toneRound(round).border}`}}>{roundLabel(round)}</span>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10,marginTop:18}}>
          <div style={{padding:12,borderRadius:14,background:'#F8FAFC',border:'1px solid #E4E7EC'}}><div style={{fontSize:10,fontWeight:900,color:'#667085',textTransform:'uppercase'}}>Pregunta</div><div style={{fontSize:24,fontWeight:950,color:'#001E47'}}>{currentIndex || '—'} / {total || '—'}</div></div>
          <div style={{padding:12,borderRadius:14,background:'#F8FAFC',border:'1px solid #E4E7EC'}}><div style={{fontSize:10,fontWeight:900,color:'#667085',textTransform:'uppercase'}}>Participantes</div><div style={{fontSize:24,fontWeight:950,color:'#001E47'}}>{data?.stats?.players || 0}</div></div>
          <div style={{padding:12,borderRadius:14,background:'#F8FAFC',border:'1px solid #E4E7EC'}}><div style={{fontSize:10,fontWeight:900,color:'#667085',textTransform:'uppercase'}}>Respuestas ronda</div><div style={{fontSize:24,fontWeight:950,color:'#001E47'}}>{data?.stats?.answers_current || 0}</div></div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 280px',gap:14,alignItems:'start'}} className="elive-control-grid">
        <div style={{display:'grid',gap:12}}>
          {loading ? <Alert>Cargando control de ronda…</Alert> : <QuestionCard question={current || questions[Math.max(0,nextIndex-1)]} showAnswer={round==='CLOSED' || status==='CLOSED'}/>} 
          <div className="card" style={{padding:14,borderRadius:18,background:'#FFF'}}>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
              {canStart && <button className="btn btn-primary" type="button" disabled={busy} onClick={()=>action('englishLabLiveStartRoom')}>Iniciar sala</button>}
              {canLaunch && <button className="btn btn-primary" type="button" disabled={busy||!total} onClick={()=>action('englishLabLiveLaunchQuestion',{question_index:nextIndex})}>{closedOrStarted?'Lanzar siguiente pregunta':'Lanzar pregunta 1'}</button>}
              {canCloseRound && <button className="btn btn-primary" type="button" disabled={busy} onClick={()=>action('englishLabLiveCloseRound')}>Cerrar pregunta</button>}
              {status==='CLOSED' && <span style={{padding:'10px 14px',borderRadius:999,background:'#F3F4F6',color:'#475467',fontWeight:900}}>Sala cerrada</span>}
            </div>
            <div style={{marginTop:10,textAlign:'center',fontSize:12,color:'#667085',lineHeight:1.45}}>CS20B controla la ronda docente. Las respuestas de estudiantes entran en CS20C para no montar tiempo real a medias.</div>
          </div>
        </div>
        <aside className="card" style={{padding:14,borderRadius:18,background:'#FFF'}}>
          <div style={{fontSize:11,fontWeight:950,letterSpacing:'.13em',color:'#7A1E2C',textTransform:'uppercase'}}>Bitácora</div>
          <div style={{display:'grid',gap:8,marginTop:10,maxHeight:420,overflow:'auto'}}>
            {events.length ? events.slice(0,18).map((ev,i)=><div key={ev.event_id || ev.EVENT_ID || i} style={{border:'1px solid #E4E7EC',borderRadius:12,padding:'8px 10px',fontSize:11.5,color:'#475467',background:'#F8FAFC'}}><b style={{color:'#001E47'}}>{ev.event_type || ev.EVENT_TYPE}</b><br/><span>{ev.created_at || ev.CREATED_AT}</span></div>) : <div style={{fontSize:12,color:'#667085'}}>Sin eventos aún.</div>}
          </div>
        </aside>
      </div>
      <style>{`@media(max-width:900px){.elive-control-grid{grid-template-columns:1fr!important}}`}</style>
    </div>;
  }

  function EnglishLabLiveTeacherView(){
    const [loading,setLoading]=React.useState(true);
    const [busy,setBusy]=React.useState(false);
    const [error,setError]=React.useState('');
    const [data,setData]=React.useState({grupos:[],rooms:[]});
    const [codGrupo,setCodGrupo]=React.useState('');
    const [game,setGame]=React.useState(GAME_TYPES[0].code);
    const [mode,setMode]=React.useState('INDIVIDUAL');
    const [count,setCount]=React.useState(8);
    const [created,setCreated]=React.useState(null);
    const [controlRoom,setControlRoom]=React.useState(null);

    const grupos = Array.isArray(data.grupos) ? data.grupos : [];
    const selectedGroup = grupos.find(g=>groupCode(g)===codGrupo) || grupos[0] || null;
    const selectedGame = GAME_TYPES.find(g=>g.code===game) || GAME_TYPES[0];

    const load = React.useCallback(async()=>{
      setLoading(true); setError('');
      try{
        const r = await postLive('englishLabLiveGetTeacherData', {}, 45000);
        setData(r);
        const first = (r.grupos || [])[0];
        setCodGrupo(prev => prev || groupCode(first));
      }catch(e){ setError(e.message || String(e)); }
      finally{ setLoading(false); }
    },[]);
    React.useEffect(()=>{ load(); },[load]);

    async function createRoom(){
      if(!selectedGroup) { setError('No hay grupo seleccionado.'); return; }
      setBusy(true); setError(''); setCreated(null);
      try{
        const r = await postLive('englishLabLiveCreateRoom', { cod_grupo:codGrupo, nivel:levelId(selectedGroup), game_code:selectedGame.code, question_count:Number(count)||8, mode }, 45000);
        setCreated(r.room || r);
        setControlRoom(r.room || r);
        await load();
      }catch(e){ setError(e.message || String(e)); }
      finally{ setBusy(false); }
    }

    if(controlRoom){
      return <div style={{width:'100%',maxWidth:1180,margin:'0 auto'}}>
        <Header title={<>English LAB <em>Live</em></>} sub="Control de ronda docente. Todavía no guarda notas oficiales ni afecta aprobación." />
        <RoomControl roomRef={controlRoom} onBack={()=>setControlRoom(null)} onChanged={load}/>
      </div>;
    }

    const recent = Array.isArray(data.rooms) ? data.rooms : [];
    return <div style={{width:'100%',maxWidth:1180,margin:'0 auto'}}>
      <Header title={<>English LAB <em>Live</em></>} sub="Salas de práctica en vivo para juegos tipo reto. No guarda notas oficiales ni afecta aprobación académica." />
      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.15fr) minmax(300px,.85fr)',gap:16,alignItems:'start'}} className="elive-main-grid">
        <div style={{display:'grid',gap:14}}>
          <Alert tone="warn"><b>CS20B activa control docente de ronda.</b> Ya podés iniciar sala, lanzar pregunta, cerrar pregunta y avanzar. Respuestas de estudiantes/ranking entran en CS20C.</Alert>
          <div className="card" style={{padding:18,borderRadius:18,background:'#FFF'}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginBottom:14,flexWrap:'wrap'}}>
              <div><div style={{fontSize:11,fontWeight:900,letterSpacing:'.13em',color:'#7A1E2C',textTransform:'uppercase'}}>Crear sala</div><div style={{fontSize:22,fontWeight:950,color:'#001E47'}}>Configurar práctica live</div></div>
              <span style={{fontSize:10.5,fontWeight:900,color:'#073B7A',background:'#EEF4FF',border:'1px solid #B7D5FF',borderRadius:999,padding:'5px 9px'}}>{VERSION}</span>
            </div>
            {loading ? <Alert>Cargando grupos del docente…</Alert> : error ? <Alert tone="err">{error}</Alert> : null}
            <div style={{display:'grid',gap:12,marginTop:12}}>
              <label style={{display:'grid',gap:6,fontSize:12,fontWeight:850,color:'#344054'}}>Grupo
                <select value={codGrupo} onChange={e=>setCodGrupo(e.target.value)} style={{height:44,border:'1px solid var(--line,#D0D5DD)',borderRadius:12,padding:'0 12px',fontWeight:800,background:'#FFF'}}>
                  {grupos.map(g=><option key={groupCode(g)} value={groupCode(g)}>{groupTitle(g)}</option>)}
                </select>
              </label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(185px,1fr))',gap:10}}>
                {GAME_TYPES.map(g=><GameButton key={g.code} game={g} active={game===g.code} onClick={()=>setGame(g.code)}/>) }
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10}}>
                <label style={{display:'grid',gap:6,fontSize:12,fontWeight:850,color:'#344054'}}>Modo
                  <select value={mode} onChange={e=>setMode(e.target.value)} style={{height:42,border:'1px solid var(--line,#D0D5DD)',borderRadius:12,padding:'0 12px',fontWeight:800,background:'#FFF'}}>
                    {MODES.map(m=><option key={m.code} value={m.code}>{m.label}</option>)}
                  </select>
                </label>
                <label style={{display:'grid',gap:6,fontSize:12,fontWeight:850,color:'#344054'}}>Cantidad de preguntas
                  <select value={count} onChange={e=>setCount(Number(e.target.value)||8)} style={{height:42,border:'1px solid var(--line,#D0D5DD)',borderRadius:12,padding:'0 12px',fontWeight:800,background:'#FFF'}}>
                    {[5,8,10,12,15].map(n=><option key={n} value={n}>{n} preguntas</option>)}
                  </select>
                </label>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8,flexWrap:'wrap'}}>
                <button className="btn btn-ghost" type="button" disabled={loading||busy} onClick={load}>Actualizar</button>
                <button className="btn btn-primary" type="button" disabled={loading||busy||!selectedGroup} onClick={createRoom}>{busy?'Creando…':'Crear sala live'}</button>
              </div>
            </div>
          </div>
          {created && <Alert tone="ok"><b>Sala creada:</b> <span style={{fontFamily:'var(--f-mono,monospace)',fontWeight:950,fontSize:16}}>{created.room_code || created.ROOM_CODE}</span>. Ya podés abrir el control de ronda.</Alert>}
        </div>
        <aside style={{display:'grid',gap:12}}>
          <div className="card" style={{padding:16,borderRadius:18,background:'#FFF'}}>
            <div style={{fontSize:11,fontWeight:900,letterSpacing:'.13em',color:'#7A1E2C',textTransform:'uppercase'}}>Salas recientes</div>
            <div style={{fontSize:13,color:'#667085',marginTop:4,lineHeight:1.45}}>Solo práctica. Nada de esto se mezcla con notas oficiales, certificados o pagos.</div>
          </div>
          {loading ? <Alert>Cargando salas…</Alert> : recent.length ? recent.slice(0,8).map(r=><RoomCard key={r.room_id || r.ROOM_ID || r.room_code || r.ROOM_CODE} room={r} onRefresh={load} onOpen={setControlRoom}/>) : <Alert>No hay salas recientes todavía.</Alert>}
        </aside>
      </div>
      <style>{`@media(max-width:900px){.elive-main-grid{grid-template-columns:1fr!important}}`}</style>
    </div>;
  }
  window.EnglishLabLiveTeacherView = EnglishLabLiveTeacherView;
  window.ENGLISH_LAB_LIVE_CS20B = { version:VERSION, games:GAME_TYPES.map(g=>g.code) };
})();
