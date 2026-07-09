// F98.4-Z6-CS20A · English LAB Live foundation
// Práctica gamificada en vivo. No registra notas oficiales ni afecta aprobación.
/* global React, PageHeader */
(function(){
  const SCRIPT_URL_LIVE = window.APPS_SCRIPT_URL;
  const VERSION = 'F98.4-Z6-CS20A';
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
  function toneStatus(s){
    const v=upper(s);
    if(v==='LIVE') return {bg:'#EAF8EF', ink:'#145C38', border:'#20A15C'};
    if(v==='CLOSED') return {bg:'#F3F4F6', ink:'#4B5563', border:'#CBD5E1'};
    return {bg:'#EEF4FF', ink:'#073B7A', border:'#6AA8F6'};
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
  function RoomCard({room, onRefresh}){
    const t=toneStatus(room.status || room.STATUS);
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
        <div style={{color:'#98A2B3'}}>Creada: {clean(room.created_at || room.CREATED_AT) || '—'}</div>
      </div>
      <div style={{marginTop:12,display:'flex',gap:8,flexWrap:'wrap'}}>
        <button className="btn btn-ghost" type="button" onClick={onRefresh}>Actualizar</button>
        <button className="btn btn-primary" type="button" disabled title="Siguiente entrega">Abrir control de ronda</button>
      </div>
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
        await load();
      }catch(e){ setError(e.message || String(e)); }
      finally{ setBusy(false); }
    }

    const recent = Array.isArray(data.rooms) ? data.rooms : [];
    return <div style={{width:'100%',maxWidth:1180,margin:'0 auto'}}>
      <Header title={<>English LAB <em>Live</em></>} sub="Salas de práctica en vivo para juegos tipo reto. No guarda notas oficiales ni afecta aprobación académica." />
      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.15fr) minmax(300px,.85fr)',gap:16,alignItems:'start'}}>
        <div style={{display:'grid',gap:14}}>
          <Alert tone="warn"><b>CS20A es base controlada.</b> En esta primera entrega se crean salas y códigos. Todavía no se activa respuesta de estudiantes ni ranking; eso entra en la siguiente fase para no meter un módulo en vivo medio armado.</Alert>
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
          {created && <Alert tone="ok"><b>Sala creada:</b> <span style={{fontFamily:'var(--f-mono,monospace)',fontWeight:950,fontSize:16}}>{created.room_code || created.ROOM_CODE}</span>. En la siguiente entrega conectamos ingreso de estudiantes y control de rondas.</Alert>}
        </div>
        <aside style={{display:'grid',gap:12}}>
          <div className="card" style={{padding:16,borderRadius:18,background:'#FFF'}}>
            <div style={{fontSize:11,fontWeight:900,letterSpacing:'.13em',color:'#7A1E2C',textTransform:'uppercase'}}>Salas recientes</div>
            <div style={{fontSize:13,color:'#667085',marginTop:4,lineHeight:1.45}}>Solo práctica. Nada de esto se mezcla con notas oficiales, certificados o pagos.</div>
          </div>
          {loading ? <Alert>Cargando salas…</Alert> : recent.length ? recent.slice(0,8).map(r=><RoomCard key={r.room_id || r.ROOM_ID || r.room_code || r.ROOM_CODE} room={r} onRefresh={load}/>) : <Alert>No hay salas recientes todavía.</Alert>}
        </aside>
      </div>
      <style>{`@media(max-width:900px){.teacher-page-english_lab_live [style*="grid-template-columns: minmax(0px, 1.15fr)"]{grid-template-columns:1fr!important}}`}</style>
    </div>;
  }
  window.EnglishLabLiveTeacherView = EnglishLabLiveTeacherView;
  window.ENGLISH_LAB_LIVE_CS20A = { version:VERSION, games:GAME_TYPES.map(g=>g.code) };
})();
