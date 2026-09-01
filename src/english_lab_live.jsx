// F98.4-Z6-CS20H · English LAB Live ingreso estudiante + compartir sala
// Práctica gamificada en vivo. No registra notas oficiales ni afecta aprobación.
/* global React, PageHeader */
(function(){
  const SCRIPT_URL_LIVE = window.APPS_SCRIPT_URL;
  const VERSION = 'F98.4-Z6-CS20H';
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
  const UNIT_OPTIONS = [
    { code:'MIX', label:'Mixto / repaso' },
    ...Array.from({length:16}, (_,i)=>({ code:'U'+(i+1), label:'Unidad '+(i+1) }))
  ];
  function unitLabel(u){
    const code = upper(u || 'MIX');
    const found = UNIT_OPTIONS.find(x=>x.code===code);
    return found ? found.label : (code || 'Mixto');
  }

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
  function roomPublicCode(room){
    return clean(room?.room_code || room?.ROOM_CODE || room?.room_id || room?.ROOM_ID || '').toUpperCase();
  }
  function liveShareUrl(room){
    const code = roomPublicCode(room);
    try{
      const url = new URL(window.location.href);
      url.searchParams.set('room', code);
      url.hash = 'english_lab_live';
      return url.toString();
    }catch(_){
      const base = String((window.location && window.location.href) || '').split('#')[0].split('?')[0];
      return `${base}?room=${encodeURIComponent(code)}#english_lab_live`;
    }
  }
  function liveShareText(room){
    const code = roomPublicCode(room);
    const link = liveShareUrl(room);
    return `English LAB Live\n\nCódigo de sala: ${code}\n\nEntrá al Campus Virtual > English LAB Live, escribí el código y respondé cuando el docente lance la pregunta.\n\nEnlace directo: ${link}\n\nActividad de práctica. No es nota oficial.`;
  }
  async function copyLiveText(text){
    const value = clean(text);
    if(!value) return false;
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){ await navigator.clipboard.writeText(value); return true; }
    }catch(_){}
    try{
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    }catch(_){ return false; }
  }
  function ShareRoomPanel({room, compact=false}){
    const [copied,setCopied]=React.useState('');
    const code = roomPublicCode(room);
    if(!code) return null;
    const link = liveShareUrl(room);
    const text = liveShareText(room);
    async function doCopy(kind, value){
      const ok = await copyLiveText(value);
      setCopied(ok ? kind : 'error');
      setTimeout(()=>setCopied(''), 1800);
    }
    return <div style={{border:'1px solid #B7D5FF',borderRadius:compact?16:20,background:'linear-gradient(135deg,#EEF4FF 0%,#FFFFFF 72%)',padding:compact?12:16,display:'grid',gap:12,boxShadow:'0 10px 24px rgba(7,59,122,.08)'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <div>
          <div style={{fontSize:10.5,fontWeight:950,letterSpacing:'.14em',color:'#7A1E2C',textTransform:'uppercase'}}>Compartir con estudiantes</div>
          <div style={{fontSize:compact?26:34,fontWeight:950,color:'#001E47',fontFamily:'var(--f-mono,monospace)',letterSpacing:'.03em',lineHeight:1}}>{code}</div>
          <div style={{fontSize:12.5,color:'#475467',lineHeight:1.4,marginTop:6}}>Para Zoom o WhatsApp: el estudiante entra a English LAB Live, escribe este código y espera la pregunta.</div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
          <button className="btn btn-primary" type="button" onClick={()=>doCopy('codigo', code)}>Copiar código</button>
          <button className="btn btn-ghost" type="button" onClick={()=>doCopy('mensaje', text)}>Copiar mensaje</button>
          <button className="btn btn-ghost" type="button" onClick={()=>doCopy('enlace', link)}>Copiar enlace</button>
        </div>
      </div>
      <div style={{padding:'10px 12px',borderRadius:14,background:'#FFF',border:'1px solid #D0D5DD',fontSize:12.5,color:'#344054',lineHeight:1.45,wordBreak:'break-word'}}>
        <b>Mensaje listo:</b> Código <span style={{fontFamily:'var(--f-mono,monospace)',fontWeight:950,color:'#073B7A'}}>{code}</span> · {link}
      </div>
      {copied && <div style={{fontSize:12,fontWeight:900,color:copied==='error'?'#8B1F1F':'#145C38'}}>{copied==='error'?'No se pudo copiar automáticamente. Copiá manualmente el código.':'Copiado listo.'}</div>}
    </div>;
  }

  function GameButton({game, active, onClick}){
    return <button type="button" onClick={onClick} style={{border:active?'2px solid #073B7A':'1px solid var(--line,#E4E7EC)',background:active?'#EEF4FF':'#FFF',borderRadius:14,padding:'13px 14px',textAlign:'left',cursor:'pointer',fontFamily:'inherit',minHeight:94,boxShadow:active?'0 8px 20px rgba(7,59,122,.12)':'0 2px 8px rgba(15,23,42,.04)'}}>
      <div style={{fontSize:10,fontWeight:900,letterSpacing:'.11em',color:active?'#073B7A':'#7A1E2C',textTransform:'uppercase'}}>{game.area}</div>
      <div style={{fontSize:17,fontWeight:950,color:'#001E47',marginTop:4}}>{game.label}</div>
      <div style={{fontSize:11.5,color:'#667085',marginTop:5,lineHeight:1.35}}>{game.note}</div>
    </button>;
  }


  function QuestionBankHealthCard({meta}){
    const qb = meta || {};
    const coverage = qb.coverage || {};
    const bySource = qb.sources || {};
    const missing = Number(qb.missing_exact_combos || 0) || 0;
    const warnings = Number(qb.quality_warnings || 0) || 0;
    const total = Number(qb.total || 0) || 0;
    const ready = total > 0 && missing === 0 && warnings === 0;
    const tone = ready ? {bg:'#EAF8EF',ink:'#145C38',border:'#BDE8CD',label:'Banco listo'} : {bg:'#FFF7E6',ink:'#7A4B00',border:'#FFD88A',label:'Banco en revisión'};
    const sourcePairs = Object.keys(bySource).sort().slice(0,4).map(k=>`${k}: ${bySource[k]}`);
    return <div className="card" style={{padding:16,borderRadius:18,background:'#FFF',border:`1px solid ${tone.border}`}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <div>
          <div style={{fontSize:11,fontWeight:950,letterSpacing:'.13em',textTransform:'uppercase',color:'#7A1E2C'}}>Banco pedagógico</div>
          <div style={{fontSize:22,fontWeight:950,color:'#001E47',marginTop:3}}>{total || '—'} preguntas activas</div>
        </div>
        <span style={{fontSize:10.5,fontWeight:950,borderRadius:999,padding:'6px 9px',background:tone.bg,color:tone.ink,border:`1px solid ${tone.border}`}}>{tone.label}</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(92px,1fr))',gap:8,marginTop:12}}>
        <div style={{padding:10,borderRadius:12,background:'#F8FAFC',border:'1px solid #E4E7EC'}}><div style={{fontSize:9.5,fontWeight:950,color:'#667085',textTransform:'uppercase'}}>Cobertura</div><div style={{fontSize:18,fontWeight:950,color:'#001E47'}}>{coverage.ready || 0}/{coverage.expected || 320}</div></div>
        <div style={{padding:10,borderRadius:12,background:'#F8FAFC',border:'1px solid #E4E7EC'}}><div style={{fontSize:9.5,fontWeight:950,color:'#667085',textTransform:'uppercase'}}>Faltantes</div><div style={{fontSize:18,fontWeight:950,color:missing?'#7A4B00':'#145C38'}}>{missing}</div></div>
        <div style={{padding:10,borderRadius:12,background:'#F8FAFC',border:'1px solid #E4E7EC'}}><div style={{fontSize:9.5,fontWeight:950,color:'#667085',textTransform:'uppercase'}}>Alertas</div><div style={{fontSize:18,fontWeight:950,color:warnings?'#8B1F1F':'#145C38'}}>{warnings}</div></div>
      </div>
      <div style={{fontSize:11.5,color:'#667085',lineHeight:1.4,marginTop:10}}>
        {sourcePairs.length ? sourcePairs.join(' · ') : 'La hoja se inicializa al cargar English LAB Live.'}
      </div>
      <div style={{fontSize:11.5,color:'#7A4B00',lineHeight:1.4,marginTop:8}}>Contenido original de práctica conversacional. No reemplaza exámenes ni material oficial.</div>
    </div>;
  }

  function LiveLeaderboard({rows=[], teams=[], compact=false}){
    const safeRows = Array.isArray(rows) ? rows.slice(0, compact ? 5 : 10) : [];
    const safeTeams = Array.isArray(teams) ? teams.slice(0, compact ? 4 : 8) : [];
    const has = safeRows.length || safeTeams.length;
    if(!has) return <div style={{fontSize:12,color:'#667085',lineHeight:1.45}}>Aún no hay ranking. Cuando entren estudiantes y respondan, aparecerá aquí.</div>;
    return <div style={{display:'grid',gap:12}}>
      {safeTeams.length ? <div style={{display:'grid',gap:7}}>
        <div style={{fontSize:10,fontWeight:950,letterSpacing:'.12em',textTransform:'uppercase',color:'#7A1E2C'}}>Equipos</div>
        {safeTeams.map((t,i)=><div key={t.team||i} style={{display:'grid',gridTemplateColumns:'26px 1fr auto',gap:8,alignItems:'center',padding:'8px 9px',border:'1px solid #E4E7EC',borderRadius:12,background:i===0?'#FFF7E6':'#F8FAFC'}}>
          <div style={{width:24,height:24,borderRadius:999,display:'grid',placeItems:'center',background:i===0?'#FDB022':'#EEF4FF',color:i===0?'#3B2600':'#073B7A',fontSize:11,fontWeight:950}}>{i+1}</div>
          <div style={{minWidth:0}}><div style={{fontSize:12.5,fontWeight:900,color:'#001E47',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.team || 'Equipo'}</div><div style={{fontSize:10.5,color:'#667085'}}>{t.players||0} jugadores · {t.correct||0} correctas</div></div>
          <div style={{fontSize:15,fontWeight:950,color:'#001E47'}}>{t.points||0}</div>
        </div>)}
      </div> : null}
      {safeRows.length ? <div style={{display:'grid',gap:7}}>
        <div style={{fontSize:10,fontWeight:950,letterSpacing:'.12em',textTransform:'uppercase',color:'#7A1E2C'}}>Jugadores</div>
        {safeRows.map((r,i)=><div key={r.cod_estudiante||i} style={{display:'grid',gridTemplateColumns:'26px 1fr auto',gap:8,alignItems:'center',padding:'8px 9px',border:'1px solid #E4E7EC',borderRadius:12,background:i===0?'#EAF8EF':'#FFF'}}>
          <div style={{width:24,height:24,borderRadius:999,display:'grid',placeItems:'center',background:i===0?'#20A15C':'#EEF4FF',color:i===0?'#FFF':'#073B7A',fontSize:11,fontWeight:950}}>{r.rank||i+1}</div>
          <div style={{minWidth:0}}><div style={{fontSize:12.5,fontWeight:900,color:'#001E47',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.nombre || 'Jugador'}</div><div style={{fontSize:10.5,color:'#667085'}}>{r.team ? r.team+' · ' : ''}{r.correct||0}/{r.answered||0} correctas</div></div>
          <div style={{fontSize:15,fontWeight:950,color:'#001E47'}}>{r.points||0}</div>
        </div>)}
      </div> : null}
    </div>;
  }



  function FinalResultsCard({room={}, rows=[], teams=[], myRank=null, compact=false}){
    const mode = upper(room.mode || room.MODE);
    const safeRows = Array.isArray(rows) ? rows : [];
    const safeTeams = Array.isArray(teams) ? teams : [];
    const winnerTeam = safeTeams[0] || null;
    const winnerPlayer = safeRows[0] || null;
    const title = mode === 'TEAMS' && winnerTeam ? `Ganó ${winnerTeam.team || 'un equipo'}` : winnerPlayer ? `Ganó ${winnerPlayer.nombre || 'un jugador'}` : 'Ronda finalizada';
    return <div style={{border:'1px solid #D0D5DD',borderRadius:22,background:'linear-gradient(135deg,#FFFFFF 0%,#F7FAFF 55%,#FFF7E6 100%)',padding:compact?16:22,boxShadow:'0 14px 34px rgba(15,23,42,.08)'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
        <div>
          <div style={{fontSize:11,fontWeight:950,letterSpacing:'.14em',textTransform:'uppercase',color:'#7A1E2C'}}>Resultados finales</div>
          <div style={{fontSize:compact?24:34,fontWeight:950,color:'#001E47',lineHeight:1.05,marginTop:4}}>{title}</div>
          <div style={{fontSize:13,color:'#667085',marginTop:6}}>Solo práctica English LAB. No es nota oficial.</div>
        </div>
        <div style={{width:compact?64:84,height:compact?64:84,borderRadius:'50%',display:'grid',placeItems:'center',background:'#FFF7E6',border:'1px solid #FFD88A',boxShadow:'inset 0 0 0 5px rgba(253,176,34,.14)',fontSize:compact?30:42}}>🏆</div>
      </div>
      <LiveLeaderboard rows={safeRows} teams={safeTeams} compact={compact}/>
      {myRank && <div style={{marginTop:12,padding:'10px 12px',borderRadius:14,background:'#EEF4FF',border:'1px solid #B7D5FF',color:'#073B7A',fontSize:13,fontWeight:900}}>Tu resultado: posición #{myRank.rank} · {myRank.points || 0} pts · {myRank.correct || 0}/{myRank.answered || 0} correctas</div>}
    </div>;
  }

  function LiveProjectionView({room={}, question=null, leaderboard=[], teamLeaderboard=[], stats={}, onExit, onRefresh, loading=false}){
    const status = upper(room.status || room.STATUS);
    const round = upper(room.round_status || room.ROUND_STATUS);
    const showAnswer = round === 'CLOSED' || status === 'CLOSED';
    const code = clean(room.room_code || room.ROOM_CODE || 'LAB');
    const players = Number(stats?.players || 0) || 0;
    const answers = Number(stats?.answers_current || 0) || 0;
    return <div style={{minHeight:'calc(100vh - 40px)',width:'100%',background:'radial-gradient(circle at 18% 20%,#EEF4FF 0,#EEF4FF 22%,transparent 23%),linear-gradient(135deg,#FFF 0%,#F8FAFC 55%,#FBF7EF 100%)',borderRadius:24,padding:24,display:'grid',gap:18}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',flexWrap:'wrap'}}>
        <div>
          <div style={{fontSize:12,fontWeight:950,letterSpacing:'.16em',color:'#7A1E2C',textTransform:'uppercase'}}>English LAB Live · Pantalla proyector</div>
          <div style={{fontSize:54,fontWeight:950,color:'#001E47',fontFamily:'var(--f-mono,monospace)',lineHeight:1,letterSpacing:'.02em'}}>{code}</div>
          <div style={{fontSize:15,fontWeight:850,color:'#073B7A',marginTop:8}}>Estudiantes: Campus Virtual &gt; English LAB Live &gt; código {code}</div>
          <div style={{fontSize:16,color:'#475467',marginTop:8}}>{room.game_label || room.GAME_LABEL} · {unitLabel(room.unit || room.UNIT)} · {room.mode || room.MODE} · {room.cod_grupo || room.COD_GRUPO} · {levelLabel(room.nivel || room.NIVEL)}</div>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:13,fontWeight:950,borderRadius:999,padding:'9px 13px',background:toneStatus(status).bg,color:toneStatus(status).ink,border:`1px solid ${toneStatus(status).border}`}}>{statusLabel(status)}</span>
          <span style={{fontSize:13,fontWeight:950,borderRadius:999,padding:'9px 13px',background:toneRound(round).bg,color:toneRound(round).ink,border:`1px solid ${toneRound(round).border}`}}>{roundLabel(round)}</span>
          <button className="btn btn-ghost" type="button" onClick={onRefresh} disabled={loading}>{loading?'Actualizando…':'Actualizar'}</button>
          <button className="btn btn-primary" type="button" onClick={onExit}>Volver al control</button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12}}>
        <div style={{padding:16,borderRadius:18,background:'#FFF',border:'1px solid #E4E7EC',boxShadow:'0 8px 20px rgba(15,23,42,.05)'}}><div style={{fontSize:11,fontWeight:950,color:'#667085',textTransform:'uppercase'}}>Participantes</div><div style={{fontSize:42,fontWeight:950,color:'#001E47'}}>{players}</div></div>
        <div style={{padding:16,borderRadius:18,background:'#FFF',border:'1px solid #E4E7EC',boxShadow:'0 8px 20px rgba(15,23,42,.05)'}}><div style={{fontSize:11,fontWeight:950,color:'#667085',textTransform:'uppercase'}}>Respuestas ronda</div><div style={{fontSize:42,fontWeight:950,color:'#001E47'}}>{answers}</div></div>
        <div style={{padding:16,borderRadius:18,background:'#FFF',border:'1px solid #E4E7EC',boxShadow:'0 8px 20px rgba(15,23,42,.05)'}}><div style={{fontSize:11,fontWeight:950,color:'#667085',textTransform:'uppercase'}}>Pregunta</div><div style={{fontSize:42,fontWeight:950,color:'#001E47'}}>{room.current_index || 0}/{room.question_count || '—'}</div></div>
      </div>
      {status === 'CLOSED'
        ? <FinalResultsCard room={room} rows={leaderboard} teams={teamLeaderboard}/>
        : <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.25fr) minmax(280px,.75fr)',gap:16,alignItems:'start'}} className="elive-projector-grid">
            <QuestionCard question={question} showAnswer={showAnswer}/>
            <div style={{border:'1px solid #E4E7EC',borderRadius:20,background:'#FFF',padding:16,boxShadow:'0 10px 24px rgba(15,23,42,.06)'}}>
              <div style={{fontSize:11,fontWeight:950,letterSpacing:'.13em',color:'#7A1E2C',textTransform:'uppercase'}}>Ranking en vivo</div>
              <div style={{marginTop:12}}><LiveLeaderboard rows={leaderboard} teams={teamLeaderboard} compact={false}/></div>
            </div>
          </div>}
      <style>{`@media(max-width:900px){.elive-projector-grid{grid-template-columns:1fr!important}}`}</style>
    </div>;
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
        <div>{room.cod_grupo || room.COD_GRUPO} · {levelLabel(room.nivel || room.NIVEL)} · {unitLabel(room.unit || room.UNIT)} · {room.question_count || room.QUESTION_COUNT} preguntas</div>
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

  function englishLabLiveSafeUserError(error, fallback, context){
    const detail = String(error && (error.message || error) || '').trim();
    if(detail) console.warn('[CS21A210BE][EnglishLabLive][' + (context || 'unknown') + ']', detail);
    return fallback;
  }

  function RoomControl({roomRef, onBack, onChanged}){
    const roomId = clean(roomRef?.room_id || roomRef?.ROOM_ID || roomRef?.room_code || roomRef?.ROOM_CODE);
    const [loading,setLoading]=React.useState(true);
    const [busy,setBusy]=React.useState(false);
    const [error,setError]=React.useState('');
    const [data,setData]=React.useState(null);
    const [projector,setProjector]=React.useState(false);
    const room=data?.room || roomRef || {};
    const questions=Array.isArray(data?.questions) ? data.questions : [];
    const current=data?.current_question || null;
    const events=Array.isArray(data?.events) ? data.events : [];
    const leaderboard=Array.isArray(data?.leaderboard) ? data.leaderboard : [];
    const teamLeaderboard=Array.isArray(data?.team_leaderboard) ? data.team_leaderboard : [];
    const status=upper(room.status || room.STATUS);
    const round=upper(room.round_status || room.ROUND_STATUS);
    const total=Number(room.question_count || room.QUESTION_COUNT || questions.length || 0) || questions.length;
    const currentIndex=Number(room.current_index || room.CURRENT_INDEX || 0) || 0;

    const load=React.useCallback(async()=>{
      if(!roomId) return;
      setLoading(true); setError('');
      try{ const r=await postLive('englishLabLiveGetRoomControl',{room_id:roomId},45000); setData(r); }
      catch(e){ setError(englishLabLiveSafeUserError(e, "No pudimos cargar el control de la sala. Intentá nuevamente.", 'room_control_load')); }
      finally{ setLoading(false); }
    },[roomId]);
    React.useEffect(()=>{ load(); },[load]);

    async function action(fn,payload={}){
      setBusy(true); setError('');
      try{
        await postLive(fn,{room_id:roomId,...payload},45000);
        await load();
        onChanged && onChanged();
      }catch(e){ setError(englishLabLiveSafeUserError(e, "No pudimos completar la acción de la sala. Intentá nuevamente.", 'room_control_action')); }
      finally{ setBusy(false); }
    }
    const canOpen = status !== 'CLOSED';
    const canStart = status === 'CREATED';
    const canLaunch = canOpen && (round !== 'OPEN');
    const canCloseRound = canOpen && round === 'OPEN';
    const nextIndex = Math.min(Math.max(currentIndex + 1, 1), total || 1);
    const closedOrStarted = status === 'LIVE' || status === 'CLOSED';

    if(projector){
      return <LiveProjectionView room={room} question={current || questions[Math.max(0,nextIndex-1)]} leaderboard={leaderboard} teamLeaderboard={teamLeaderboard} stats={data?.stats || {}} onExit={()=>setProjector(false)} onRefresh={load} loading={loading}/>;
    }

    return <div style={{display:'grid',gap:14}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <button className="btn btn-ghost" type="button" onClick={onBack}>← Volver a salas</button>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="btn btn-ghost" type="button" disabled={loading||busy} onClick={load}>Actualizar control</button>
          <button className="btn btn-primary" type="button" disabled={loading} onClick={()=>setProjector(true)}>Pantalla proyector</button>
          <button className="btn btn-ghost" type="button" disabled={busy||status==='CLOSED'} onClick={()=>{ if(confirm('¿Cerrar esta sala live?')) action('englishLabLiveCloseRoom'); }}>Cerrar sala</button>
        </div>
      </div>
      {error && <Alert tone="err">{error}</Alert>}
      <div className="card" style={{padding:18,borderRadius:18,background:'#FFF'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:11,fontWeight:950,letterSpacing:'.13em',color:'#7A1E2C',textTransform:'uppercase'}}>Control de ronda</div>
            <div style={{fontSize:34,fontWeight:950,color:'#001E47',fontFamily:'var(--f-mono,monospace)',lineHeight:1}}>{room.room_code || room.ROOM_CODE || roomId}</div>
            <div style={{fontSize:13,color:'#667085',marginTop:8,lineHeight:1.4}}>{room.game_label || room.GAME_LABEL} · {unitLabel(room.unit || room.UNIT)} · {room.mode || room.MODE} · {room.cod_grupo || room.COD_GRUPO} · {levelLabel(room.nivel || room.NIVEL)}</div>
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
      <ShareRoomPanel room={room}/>
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
            <div style={{marginTop:10,textAlign:'center',fontSize:12,color:'#667085',lineHeight:1.45}}>CS20H agrega ingreso estudiantil pulido y mensaje listo para compartir. Sigue siendo solo práctica, no nota oficial.</div>
          </div>
          {status==='CLOSED' && <FinalResultsCard room={room} rows={leaderboard} teams={teamLeaderboard} compact={true}/>} 
        </div>
        <aside style={{display:'grid',gap:12}}>
          <div className="card" style={{padding:14,borderRadius:18,background:'#FFF'}}>
            <div style={{fontSize:11,fontWeight:950,letterSpacing:'.13em',color:'#7A1E2C',textTransform:'uppercase'}}>Ranking temporal</div>
            <div style={{marginTop:10}}><LiveLeaderboard rows={leaderboard} teams={teamLeaderboard} compact={true}/></div>
          </div>
          <div className="card" style={{padding:14,borderRadius:18,background:'#FFF'}}>
          <div style={{fontSize:11,fontWeight:950,letterSpacing:'.13em',color:'#7A1E2C',textTransform:'uppercase'}}>Bitácora</div>
          <div style={{display:'grid',gap:8,marginTop:10,maxHeight:420,overflow:'auto'}}>
            {events.length ? events.slice(0,18).map((ev,i)=><div key={ev.event_id || ev.EVENT_ID || i} style={{border:'1px solid #E4E7EC',borderRadius:12,padding:'8px 10px',fontSize:11.5,color:'#475467',background:'#F8FAFC'}}><b style={{color:'#001E47'}}>{ev.event_type || ev.EVENT_TYPE}</b><br/><span>{ev.created_at || ev.CREATED_AT}</span></div>) : <div style={{fontSize:12,color:'#667085'}}>Sin eventos aún.</div>}
          </div>
        </div></aside>
      </div>
      <style>{`@media(max-width:900px){.elive-control-grid{grid-template-columns:1fr!important}}`}</style>
    </div>;
  }


  function liveSessionUser(usuario){
    let u = usuario || null;
    if(!u){ try { u = JSON.parse(sessionStorage.getItem('an_usuario') || 'null'); } catch(_) { u = null; } }
    return u || {};
  }
  function liveStudentName(usuario){
    const u = liveSessionUser(usuario);
    return clean(u.nombre || u.nombre_completo || u.name || u.NOMBRE || u.estudiante || u.usuario || '');
  }
  function liveStudentCode(usuario){
    const u = liveSessionUser(usuario);
    return clean(u.codigo || u.CODIGO || u.cod_estudiante || u.COD_ESTUDIANTE || u.cedula || u.CEDULA || u.identificacion || '');
  }
  function publicCode(v){ return upper(v).replace(/[^A-Z0-9-]/g,'').slice(0,12); }
  function optionText(op){ return clean(op?.label || op?.text || op?.value || op); }
  function optionValue(op){ return clean(op?.value || op?.label || op?.text || op); }
  function PlayerQuestionCard({question, answer, selected, onSelect, onSubmit, busy, reveal}){
    if(!question) return <Alert tone="warn">Esperando que el docente lance una pregunta.</Alert>;
    const options = Array.isArray(question.options) ? question.options : [];
    const answered = !!answer;
    const correctValue = clean(question.correct);
    return <div style={{border:'1px solid #D0D5DD',borderRadius:18,background:'#FFF',padding:18,boxShadow:'0 10px 24px rgba(15,23,42,.06)'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',alignItems:'center',marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:950,letterSpacing:'.13em',color:'#7A1E2C',textTransform:'uppercase'}}>Pregunta {question.index || 1}</div>
        <span style={{fontSize:10.5,fontWeight:950,padding:'5px 9px',borderRadius:999,background:answered?'#EAF8EF':'#EEF4FF',border:`1px solid ${answered?'#BDE8CD':'#B7D5FF'}`,color:answered?'#145C38':'#073B7A'}}>{answered ? 'Respuesta enviada' : 'Elige una opción'}</span>
      </div>
      <div style={{fontSize:24,fontWeight:950,color:'#001E47',lineHeight:1.15,marginBottom:14}}>{question.prompt}</div>
      {question.context && <div style={{padding:'10px 12px',borderRadius:12,background:'#F8FAFC',border:'1px solid #E4E7EC',color:'#475467',fontSize:13,lineHeight:1.45,marginBottom:12}}>{question.context}</div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:9}}>
        {options.map((op,i)=>{
          const val=optionValue(op);
          const chosen = clean(selected || answer?.answer_value) === val;
          const isCorrect = reveal && correctValue && val === correctValue;
          const isWrongChosen = reveal && chosen && correctValue && val !== correctValue;
          const bg = isCorrect ? '#EAF8EF' : isWrongChosen ? '#FDECEA' : chosen ? '#EEF4FF' : '#FFF';
          const border = isCorrect ? '#20A15C' : isWrongChosen ? '#C62828' : chosen ? '#073B7A' : '#E4E7EC';
          const ink = isCorrect ? '#145C38' : isWrongChosen ? '#8B1F1F' : '#344054';
          return <button key={i} type="button" disabled={answered || busy || reveal} onClick={()=>onSelect(val)} style={{border:`1.5px solid ${border}`,background:bg,borderRadius:13,padding:'12px 13px',fontSize:14,fontWeight:850,color:ink,textAlign:'left',cursor:(answered||busy||reveal)?'default':'pointer',fontFamily:'inherit',boxShadow:chosen?'0 8px 18px rgba(7,59,122,.10)':'0 2px 7px rgba(15,23,42,.03)'}}>
            <span style={{display:'inline-grid',placeItems:'center',width:23,height:23,borderRadius:999,background:isCorrect?'#20A15C':isWrongChosen?'#C62828':'#EEF4FF',color:isCorrect||isWrongChosen?'#FFF':'#073B7A',fontSize:11,fontWeight:950,marginRight:7}}>{String.fromCharCode(65+i)}</span>
            {optionText(op)}
          </button>;
        })}
      </div>
      {!answered && !reveal && <div style={{display:'flex',justifyContent:'flex-end',marginTop:14}}><button className="btn btn-primary" type="button" disabled={busy||!selected} onClick={onSubmit}>{busy?'Enviando…':'Enviar respuesta'}</button></div>}
      {answered && !reveal && <Alert tone="ok">Respuesta recibida. Esperá a que el docente cierre la pregunta para ver la respuesta correcta.</Alert>}
      {reveal && question.explanation && <div style={{marginTop:12,fontSize:12.5,lineHeight:1.45,color:'#145C38',background:'#EAF8EF',border:'1px solid #BDE8CD',borderRadius:12,padding:'10px 12px'}}><b>Respuesta:</b> {question.explanation}</div>}
    </div>;
  }

  function EnglishLabLiveStudentView({usuario, onNavigate}){
    const u = liveSessionUser(usuario);
    const initialCode = (()=>{ try {
      const q = new URLSearchParams(window.location.search);
      const h = String(window.location.hash || '');
      const hq = h.includes('?') ? new URLSearchParams(h.split('?').slice(1).join('?')) : new URLSearchParams();
      return publicCode(q.get('room') || q.get('codigo') || q.get('lab') || hq.get('room') || hq.get('codigo') || localStorage.getItem('elive_last_room') || '');
    } catch(_) { return ''; } })();
    const [roomCode,setRoomCode]=React.useState(initialCode);
    const [playerName,setPlayerName]=React.useState(liveStudentName(u));
    const [studentCode,setStudentCode]=React.useState(liveStudentCode(u));
    const [playerId,setPlayerId]=React.useState('');
    const [joined,setJoined]=React.useState(false);
    const [state,setState]=React.useState(null);
    const [selected,setSelected]=React.useState('');
    const [busy,setBusy]=React.useState(false);
    const [loading,setLoading]=React.useState(false);
    const [error,setError]=React.useState('');
    const [questionStartedAt,setQuestionStartedAt]=React.useState(Date.now());
    const room=state?.room || {};
    const question=state?.question || null;
    const answer=state?.answer || null;
    const reveal=!!state?.reveal;
    const canAnswer=!!state?.can_answer;
    const leaderboard=Array.isArray(state?.leaderboard) ? state.leaderboard : [];
    const teamLeaderboard=Array.isArray(state?.team_leaderboard) ? state.team_leaderboard : [];
    const myRank=state?.my_rank || null;
    const qIndex=Number(question?.index || room.current_index || 0) || 0;

    React.useEffect(()=>{ setSelected(''); setQuestionStartedAt(Date.now()); },[qIndex, answer?.answer_value]);
    const loadState=React.useCallback(async(pid=playerId, code=roomCode)=>{
      const rc=publicCode(code);
      if(!rc) return;
      setLoading(true); setError('');
      try{
        const r=await postLive('englishLabLiveGetPlayerState',{room_code:rc, player_id:pid || '', player_name:playerName || '', cod_estudiante:studentCode || ''},35000);
        setState(r); setJoined(!!(r.player && r.player.cod_estudiante));
        if(r.player && r.player.cod_estudiante){ setPlayerId(r.player.cod_estudiante); try{ localStorage.setItem('elive_player_'+rc, r.player.cod_estudiante); }catch(_){} }
      }catch(e){ setError(englishLabLiveSafeUserError(e, "No pudimos actualizar el estado de la sala. Intentá nuevamente.", 'player_state')); }
      finally{ setLoading(false); }
    },[playerId,roomCode,playerName,studentCode]);

    React.useEffect(()=>{
      const rc=publicCode(roomCode);
      if(!rc || playerId) return;
      try{ const saved=localStorage.getItem('elive_player_'+rc) || ''; if(saved) { setPlayerId(saved); setJoined(true); loadState(saved, rc); } }catch(_){}
    },[roomCode,playerId,loadState]);
    React.useEffect(()=>{
      if(!joined || !roomCode) return;
      const id=setInterval(()=>loadState(),4000);
      return ()=>clearInterval(id);
    },[joined,roomCode,loadState]);

    async function joinRoom(){
      const rc=publicCode(roomCode);
      if(!rc){ setError('Escribí el código de sala.'); return; }
      if(!clean(playerName)){ setError('Escribí tu nombre para entrar.'); return; }
      setBusy(true); setError('');
      try{
        const saved = (()=>{ try{return localStorage.getItem('elive_player_'+rc)||'';}catch(_){return '';} })();
        const r=await postLive('englishLabLiveJoinRoom',{room_code:rc, player_name:playerName, cod_estudiante:studentCode, player_id:saved || playerId},35000);
        setRoomCode(rc); setState(r); setJoined(true);
        const pid=clean(r.player?.cod_estudiante || saved || playerId);
        if(pid){ setPlayerId(pid); try{ localStorage.setItem('elive_player_'+rc,pid); localStorage.setItem('elive_last_room',rc); }catch(_){} }
      }catch(e){ setError(englishLabLiveSafeUserError(e, "No pudimos entrar a la sala. Verificá el código e intentá nuevamente.", 'join_room')); }
      finally{ setBusy(false); }
    }
    async function submitAnswer(){
      if(!selected || !question) return;
      setBusy(true); setError('');
      try{
        await postLive('englishLabLiveSubmitAnswer',{room_code:roomCode, player_id:playerId, player_name:playerName, cod_estudiante:studentCode, question_index:question.index, answer_value:selected, time_ms:Math.max(0, Date.now()-questionStartedAt)},35000);
        await loadState();
      }catch(e){ setError(englishLabLiveSafeUserError(e, "No pudimos enviar tu respuesta. Intentá nuevamente.", 'submit_answer')); }
      finally{ setBusy(false); }
    }

    if(!joined){
      const previewRoom = roomCode ? { room_code: roomCode } : null;
      return <div style={{width:'100%',maxWidth:900,margin:'0 auto'}}>
        <Header title={<>Entrar a English LAB <em>Live</em></>} sub="Escribí el código de sala que comparte el docente por Zoom o WhatsApp." />
        <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.05fr) minmax(280px,.95fr)',gap:16,alignItems:'stretch'}} className="elive-join-grid">
          <div className="card" style={{padding:22,borderRadius:24,background:'linear-gradient(135deg,#001E47 0%,#073B7A 58%,#7A1E2C 100%)',color:'#FFF',display:'grid',alignContent:'space-between',minHeight:310,boxShadow:'0 18px 46px rgba(0,30,71,.22)'}}>
            <div>
              <div style={{fontSize:11,fontWeight:950,letterSpacing:'.16em',textTransform:'uppercase',opacity:.82}}>English LAB Live</div>
              <div style={{fontSize:42,fontWeight:950,lineHeight:.98,marginTop:10}}>Entrá, contestá y practicá en vivo.</div>
              <div style={{fontSize:14,lineHeight:1.5,marginTop:14,opacity:.9}}>Esta actividad es gamificada y segura: no guarda notas oficiales, no afecta pagos, certificados ni aprobación académica.</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:20}}>
              {['1. Código','2. Responder','3. Ranking'].map(x=><div key={x} style={{border:'1px solid rgba(255,255,255,.22)',background:'rgba(255,255,255,.10)',borderRadius:14,padding:'10px 8px',fontSize:12,fontWeight:900,textAlign:'center'}}>{x}</div>)}
            </div>
          </div>
          <div className="card" style={{padding:20,borderRadius:24,background:'#FFF',display:'grid',gap:14,boxShadow:'0 14px 34px rgba(15,23,42,.08)'}}>
            {error && <Alert tone="err">{error}</Alert>}
            <Alert tone="info"><b>Ingreso rápido.</b> Usá el código de la pantalla del docente, por ejemplo <b>LAB-5937</b>. Si abriste un enlace compartido, el código aparece cargado automáticamente.</Alert>
            <label style={{display:'grid',gap:6,fontSize:12,fontWeight:850,color:'#344054'}}>Código de sala
              <input value={roomCode} onChange={e=>setRoomCode(publicCode(e.target.value))} placeholder="LAB-5937" autoFocus style={{height:56,border:'1px solid #D0D5DD',borderRadius:16,padding:'0 15px',fontSize:24,fontWeight:950,fontFamily:'var(--f-mono,monospace)',color:'#001E47',textTransform:'uppercase',letterSpacing:'.03em',background:'#F8FAFC'}} />
            </label>
            <label style={{display:'grid',gap:6,fontSize:12,fontWeight:850,color:'#344054'}}>Nombre del jugador
              <input value={playerName} onChange={e=>setPlayerName(e.target.value)} placeholder="Nombre del estudiante" style={{height:46,border:'1px solid #D0D5DD',borderRadius:13,padding:'0 12px',fontWeight:800}} />
            </label>
            <label style={{display:'grid',gap:6,fontSize:12,fontWeight:850,color:'#344054'}}>Código / cédula estudiante <span style={{fontWeight:600,color:'#98A2B3'}}>(opcional para demo)</span>
              <input value={studentCode} onChange={e=>setStudentCode(e.target.value)} placeholder="Se toma de la sesión si existe" style={{height:42,border:'1px solid #D0D5DD',borderRadius:12,padding:'0 12px',fontWeight:700}} />
            </label>
            <button className="btn btn-primary" type="button" disabled={busy} onClick={joinRoom} style={{height:48,fontSize:15,fontWeight:950}}>{busy?'Entrando…':'Entrar a sala'}</button>
            {previewRoom && <div style={{fontSize:11.5,color:'#667085',lineHeight:1.45}}>Enlace cargado: <span style={{fontFamily:'var(--f-mono,monospace)',fontWeight:900,color:'#073B7A'}}>{roomCode}</span></div>}
          </div>
        </div>
        <div style={{marginTop:14}}><Alert tone="warn">Para clase por Zoom: mantené esta pestaña abierta. La pregunta cambia cuando el docente avanza la ronda.</Alert></div>
        <style>{`@media(max-width:900px){.elive-join-grid{grid-template-columns:1fr!important}}`}</style>
      </div>;
    }

    return <div style={{width:'100%',maxWidth:980,margin:'0 auto'}}>
      <Header title={<>English LAB <em>Live</em></>} sub="Pantalla del estudiante. Respondé cuando el docente abra la pregunta." />
      <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:12}}>
        <button className="btn btn-ghost" type="button" onClick={()=>{setJoined(false);setState(null);}}>← Cambiar sala</button>
        <button className="btn btn-ghost" type="button" disabled={loading||busy} onClick={()=>loadState()}>{loading?'Actualizando…':'Actualizar'}</button>
      </div>
      {error && <div style={{marginBottom:12}}><Alert tone="err">{error}</Alert></div>}
      <div className="card" style={{padding:18,borderRadius:18,background:'#FFF',marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:11,fontWeight:950,letterSpacing:'.13em',color:'#7A1E2C',textTransform:'uppercase'}}>Sala</div>
            <div style={{fontSize:32,fontWeight:950,color:'#001E47',fontFamily:'var(--f-mono,monospace)',lineHeight:1}}>{room.room_code || roomCode}</div>
            <div style={{fontSize:13,color:'#667085',marginTop:8,lineHeight:1.4}}>{room.game_label || 'English LAB Live'} · {unitLabel(room.unit)} · {room.mode || ''} · {room.cod_grupo || ''} · {levelLabel(room.nivel)}</div>
            <div style={{fontSize:12,color:'#475467',marginTop:8}}><b>Jugador:</b> {playerName}</div>
          </div>
          <div style={{display:'grid',gap:7,justifyItems:'end'}}>
            <span style={{fontSize:11,fontWeight:950,borderRadius:999,padding:'6px 10px',background:toneStatus(room.status).bg,color:toneStatus(room.status).ink,border:`1px solid ${toneStatus(room.status).border}`}}>{statusLabel(room.status)}</span>
            <span style={{fontSize:11,fontWeight:950,borderRadius:999,padding:'6px 10px',background:toneRound(room.round_status).bg,color:toneRound(room.round_status).ink,border:`1px solid ${toneRound(room.round_status).border}`}}>{roundLabel(room.round_status)}</span>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginTop:16}}>
          <div style={{padding:12,borderRadius:14,background:'#F8FAFC',border:'1px solid #E4E7EC'}}><div style={{fontSize:10,fontWeight:900,color:'#667085',textTransform:'uppercase'}}>Pregunta</div><div style={{fontSize:24,fontWeight:950,color:'#001E47'}}>{room.current_index || 0} / {room.question_count || '—'}</div></div>
          <div style={{padding:12,borderRadius:14,background:'#F8FAFC',border:'1px solid #E4E7EC'}}><div style={{fontSize:10,fontWeight:900,color:'#667085',textTransform:'uppercase'}}>Participantes</div><div style={{fontSize:24,fontWeight:950,color:'#001E47'}}>{state?.stats?.players || 0}</div></div>
          <div style={{padding:12,borderRadius:14,background:'#F8FAFC',border:'1px solid #E4E7EC'}}><div style={{fontSize:10,fontWeight:900,color:'#667085',textTransform:'uppercase'}}>Respuestas</div><div style={{fontSize:24,fontWeight:950,color:'#001E47'}}>{state?.stats?.answers_current || 0}</div></div>
        </div>
      </div>
      {(myRank || leaderboard.length || teamLeaderboard.length) && <div className="card" style={{padding:16,borderRadius:18,background:'#FFF',marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:10}}>
          <div><div style={{fontSize:11,fontWeight:950,letterSpacing:'.13em',color:'#7A1E2C',textTransform:'uppercase'}}>Ranking temporal</div><div style={{fontSize:13,color:'#667085'}}>Solo práctica. No es nota oficial.</div></div>
          {myRank && <span style={{fontSize:12,fontWeight:950,borderRadius:999,padding:'7px 10px',background:'#EEF4FF',border:'1px solid #B7D5FF',color:'#073B7A'}}>Tu posición: #{myRank.rank} · {myRank.points||0} pts</span>}
        </div>
        <LiveLeaderboard rows={leaderboard} teams={teamLeaderboard} compact={true}/>
      </div>}
      {upper(room.status)==='CLOSED' ? <FinalResultsCard room={room} rows={leaderboard} teams={teamLeaderboard} myRank={myRank} compact={false}/> : !question ? <Alert tone="warn">Esperando que el docente lance una pregunta…</Alert> : <PlayerQuestionCard question={question} answer={answer} selected={selected} onSelect={setSelected} onSubmit={submitAnswer} busy={busy} reveal={reveal} />}
      {question && !canAnswer && !answer && upper(room.round_status)==='OPEN' && <div style={{marginTop:12}}><Alert tone="warn">Esta pregunta ya no acepta respuestas para tu usuario o está siendo actualizada.</Alert></div>}
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
    const [unit,setUnit]=React.useState('MIX');
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
      }catch(e){ setError(englishLabLiveSafeUserError(e, "No pudimos cargar las salas y grupos. Intentá nuevamente.", 'teacher_data')); }
      finally{ setLoading(false); }
    },[]);
    React.useEffect(()=>{ load(); },[load]);

    async function createRoom(){
      if(!selectedGroup) { setError('No hay grupo seleccionado.'); return; }
      setBusy(true); setError(''); setCreated(null);
      try{
        const r = await postLive('englishLabLiveCreateRoom', { cod_grupo:codGrupo, nivel:levelId(selectedGroup), game_code:selectedGame.code, question_count:Number(count)||8, mode, unit }, 45000);
        setCreated(r.room || r);
        setControlRoom(r.room || r);
        await load();
      }catch(e){ setError(englishLabLiveSafeUserError(e, "No pudimos crear la sala. Intentá nuevamente.", 'create_room')); }
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
          <Alert tone="warn"><b>CS20H deja lista la entrada del estudiante y el mensaje para compartir.</b> Elegí unidad y juego, creá la sala y copiá el código o mensaje para Zoom/WhatsApp. El banco sigue con diagnóstico activo.</Alert>
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
              <label style={{display:'grid',gap:6,fontSize:12,fontWeight:850,color:'#344054'}}>Unidad / enfoque del banco
                <select value={unit} onChange={e=>setUnit(e.target.value)} style={{height:42,border:'1px solid var(--line,#D0D5DD)',borderRadius:12,padding:'0 12px',fontWeight:800,background:'#FFF'}}>
                  {UNIT_OPTIONS.map(u=><option key={u.code} value={u.code}>{u.label}</option>)}
                </select>
              </label>
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
          {created && <ShareRoomPanel room={created} compact={true}/>}
        </div>
        <aside style={{display:'grid',gap:12}}>
          <QuestionBankHealthCard meta={data.question_bank}/>
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
  window.EnglishLabLiveStudentView = EnglishLabLiveStudentView;
  window.ENGLISH_LAB_LIVE_CS20H = { version:VERSION, games:GAME_TYPES.map(g=>g.code), units:UNIT_OPTIONS.map(u=>u.code), questionBank:true, shareRoom:true, studentJoin:true };
  window.ENGLISH_LAB_LIVE_CS20G = window.ENGLISH_LAB_LIVE_CS20H;
  window.ENGLISH_LAB_LIVE_CS20E = window.ENGLISH_LAB_LIVE_CS20H;
  window.ENGLISH_LAB_LIVE_CS20D = window.ENGLISH_LAB_LIVE_CS20E;
  window.ENGLISH_LAB_LIVE_CS20C = window.ENGLISH_LAB_LIVE_CS20E;
  window.ENGLISH_LAB_LIVE_CS20B = window.ENGLISH_LAB_LIVE_CS20E;
})();
