/* global React */
// CS21A215 · Hub único de English LAB.
// Reutiliza práctica curricular y shell Live existentes. No modifica motores ni backend.
(function installEnglishLabHubCS21A215(global){
  'use strict';
  if(!global || global.EnglishLabHubCS21A215) return;

  const VERSION='CS21A215';
  const PracticeView=global.AcademiaPlayView;
  const LegacyStudent=global.EnglishLabLiveStudentView;
  const LegacyTeacher=global.EnglishLabLiveTeacherView;

  function clean(value){return String(value==null?'':value).trim();}
  function roleOf(props){return clean(props?.rolReal||props?.role||'student').toLowerCase();}
  function firstName(props){
    const raw=clean(props?.usuario?.nombre||props?.usuario?.NOMBRE||'Estudiante');
    return raw.split(/\s+/)[0]||'Estudiante';
  }
  function chainHasMarker(component,marker){
    let current=component;
    const seen=new Set();
    for(let i=0;i<20 && typeof current==='function' && !seen.has(current);i+=1){
      seen.add(current);
      if(current[marker]===true) return true;
      if(typeof current.__cs21a183Base==='function'){current=current.__cs21a183Base;continue;}
      if(typeof current.__base==='function'){current=current.__base;continue;}
      break;
    }
    return false;
  }
  function setGame(gameId){
    try{
      const url=new URL(global.location.href);
      url.searchParams.set('game',gameId||'HANGMAN');
      url.searchParams.delete('quiz');
      url.searchParams.delete('wordsearch');
      global.history.replaceState(global.history.state||null,'',url.pathname+(url.search||'')+(url.hash||''));
    }catch(_){}
  }
  function currentGame(){
    try{return clean(new URLSearchParams(global.location.search||'').get('game')).toUpperCase();}
    catch(_){return '';}
  }

  function Header({props}){
    const role=roleOf(props);
    return <div className="el215-hero">
      <div className="el215-hero-main">
        <span className="el215-kicker">Academia Norteamericana · English LAB</span>
        <h1>Tu laboratorio de inglés</h1>
        <p>{role==='teacher'
          ? 'Elegí cómo querés trabajar con el grupo: práctica curricular, dinámica por equipos o actividad dirigida en clase.'
          : `Hola, ${firstName(props)}. Elegí si querés practicar por tu cuenta, competir o entrar a una actividad de tu clase.`}</p>
      </div>
      <div className="el215-status">
        <span>English LAB</span>
        <strong>Una sola experiencia</strong>
        <small>Práctica por unidad + competencia + clase en vivo, conservando el contenido curricular y los motores ya construidos.</small>
      </div>
    </div>;
  }

  function Home({props,onPractice,onTeams,onLive}){
    const role=roleOf(props);
    return <>
      <Header props={props}/>
      <div className="el215-grid" role="list" aria-label="Modos de English LAB">
        <button type="button" className="el215-mode-card" onClick={onPractice} role="listitem">
          <span className="el215-icon" aria-hidden="true">🏃</span>
          <small>Ruta curricular</small>
          <strong>Practicar & Competir</strong>
          <p>Elegí nivel, unidad y juego. Acá viven los 12 tipos de práctica por unidad y los juegos gratuitos.</p>
          <em>Abrir práctica →</em>
        </button>
        <button type="button" className="el215-mode-card" onClick={onTeams} role="listitem">
          <span className="el215-icon" aria-hidden="true">👥</span>
          <small>Dinámica grupal</small>
          <strong>Jugar en equipos</strong>
          <p>Ahorcado y Quiz Time son la base actual. Taboo, Categories Battle y Bingo quedan como siguientes dinámicas.</p>
          <em>Ver juegos de equipo →</em>
        </button>
        <button type="button" className="el215-mode-card" onClick={()=>onLive('HANGMAN')} role="listitem">
          <span className="el215-icon" aria-hidden="true">🎓</span>
          <small>Con tu docente</small>
          <strong>Clase en vivo</strong>
          <p>Entrá a la sala indicada por tu docente. Conservamos los motores actuales mientras renovamos cada dinámica.</p>
          <em>{role==='teacher'?'Preparar actividad':'Entrar a la actividad'} →</em>
        </button>
      </div>
      <div className="el215-notice"><strong>Memory Match compartido:</strong> se conserva íntegro en código, pero queda fuera de la nueva entrada mientras evaluamos una arquitectura de sincronización adecuada. La futura modalidad Memory Sprint será local-first.</div>
    </>;
  }

  function BackHeader({eyebrow,title,onBack}){
    return <div className="el215-subhead">
      <div className="el215-subhead-copy"><small>{eyebrow}</small><h2>{title}</h2></div>
      <button type="button" className="el215-back" onClick={onBack}>← English LAB</button>
    </div>;
  }

  function Practice({props,onBack}){
    if(typeof PracticeView!=='function'){
      return <div className="el215-shell"><BackHeader eyebrow="Practicar & Competir" title="Práctica curricular" onBack={onBack}/><div className="el215-panel">La práctica curricular no terminó de cargar. Recargá English LAB.</div></div>;
    }
    return <div className="el215-shell" data-el215-mode="practice">
      <BackHeader eyebrow="Practicar & Competir" title="Nivel · unidad · juego" onBack={onBack}/>
      <PracticeView {...props}/>
    </div>;
  }

  function Teams({props,onBack,onLive}){
    const role=roleOf(props);
    const action=role==='teacher'?'Preparar':'Entrar';
    return <div className="el215-shell" data-el215-mode="teams">
      <BackHeader eyebrow="Jugar en equipos" title="Dinámicas de clase" onBack={onBack}/>
      <div className="el215-mini-grid">
        <div className="el215-mini-card"><span aria-hidden="true">A_</span><strong>Hangman · Equipos</strong><p>Motor ya existente y adecuado para turnos más largos, pistas y participación oral del grupo.</p><button type="button" onClick={()=>onLive('HANGMAN')}>{action} Ahorcado</button></div>
        <div className="el215-mini-card"><span aria-hidden="true">?</span><strong>Quiz Time</strong><p>Rondas de preguntas curriculares. La renovación de puntuación por equipos se hará sin depender de milisegundos de red.</p><button type="button" onClick={()=>onLive('QUIZ_TIME')}>{action} Quiz Time</button></div>
        <div className="el215-mini-card is-soon"><span aria-hidden="true">💬</span><strong>Taboo</strong><p>Describir una palabra en inglés sin usar términos prohibidos. Ideal para Zoom y speaking.</p><button type="button" disabled>Próximamente</button></div>
        <div className="el215-mini-card is-soon"><span aria-hidden="true">⚡</span><strong>Categories Battle</strong><p>Cada equipo produce vocabulario por categoría y envía una sola vez al cierre de la ronda.</p><button type="button" disabled>Próximamente</button></div>
        <div className="el215-mini-card is-soon"><span aria-hidden="true">▦</span><strong>Vocabulary Bingo</strong><p>Cartones locales, pistas del docente y validación al completar una línea o cartón.</p><button type="button" disabled>Próximamente</button></div>
        <div className="el215-mini-card is-soon"><span aria-hidden="true">🎤</span><strong>Conversation Cards</strong><p>Retos de conversación para clase o Club I CAN, centrados en interacción oral real.</p><button type="button" disabled>Próximamente</button></div>
      </div>
    </div>;
  }

  function Live({props,onBack,role}){
    const Component=role==='teacher'?LegacyTeacher:LegacyStudent;
    React.useEffect(()=>{
      if(currentGame()==='MEMORY_MATCH' || !currentGame()) setGame('HANGMAN');
    },[]);
    if(typeof Component!=='function'){
      return <div className="el215-shell"><BackHeader eyebrow="Clase en vivo" title="Actividad con tu grupo" onBack={onBack}/><div className="el215-panel">El shell de clase no terminó de cargar. Recargá English LAB.</div></div>;
    }
    return <div className="el215-shell el215-live-wrap" data-el215-mode="live">
      <BackHeader eyebrow="Clase en vivo" title={role==='teacher'?'Preparar actividad':'Actividad de tu grupo'} onBack={onBack}/>
      <Component {...props}/>
    </div>;
  }

  function EnglishLabHubView({role,props}){
    const [mode,setMode]=React.useState('home');
    const openLive=React.useCallback((gameId)=>{setGame(gameId||'HANGMAN');setMode('live');},[]);
    if(mode==='practice') return <Practice props={props} onBack={()=>setMode('home')}/>;
    if(mode==='teams') return <Teams props={props} onBack={()=>setMode('home')} onLive={openLive}/>;
    if(mode==='live') return <Live props={props} role={role} onBack={()=>setMode('home')}/>;
    return <div className="el215-shell" data-el215-mode="home"><Home props={props} onPractice={()=>setMode('practice')} onTeams={()=>setMode('teams')} onLive={openLive}/></div>;
  }

  function EnglishLabStudentViewCS21A215(props){return <EnglishLabHubView role="student" props={props}/>;}
  function EnglishLabTeacherViewCS21A215(props){return <EnglishLabHubView role="teacher" props={props}/>;}

  // Conserva marcadores de compatibilidad sin fabricar permisos nuevos.
  EnglishLabStudentViewCS21A215.__cs21a215EnglishLabHub=true;
  EnglishLabStudentViewCS21A215.__cs21a183SentenceWrapped=true;
  EnglishLabStudentViewCS21A215.__cs21a205UnifiedShell=true;
  if(chainHasMarker(LegacyStudent,'__cs21a144AccessGate')) EnglishLabStudentViewCS21A215.__cs21a144AccessGate=true;
  EnglishLabTeacherViewCS21A215.__cs21a215EnglishLabHub=true;
  EnglishLabTeacherViewCS21A215.__cs21a183SentenceWrapped=true;
  EnglishLabTeacherViewCS21A215.__cs21a205UnifiedShell=true;

  global.EnglishLabLiveStudentView=EnglishLabStudentViewCS21A215;
  global.EnglishLabLiveTeacherView=EnglishLabTeacherViewCS21A215;
  global.EnglishLabHubCS21A215=Object.freeze({
    version:VERSION,
    PracticeView,
    LegacyStudent,
    LegacyTeacher,
    StudentView:EnglishLabStudentViewCS21A215,
    TeacherView:EnglishLabTeacherViewCS21A215,
    modes:Object.freeze(['practice','teams','live']),
    sharedMemoryQuarantined:true,
  });
})(window);
