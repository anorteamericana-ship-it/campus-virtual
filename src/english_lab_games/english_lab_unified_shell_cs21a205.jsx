/* global React */
// CS21A205 · Shell visual único para los cinco juegos vigentes de English LAB Live.
// Frontend solamente: no cambia endpoints, scoring, permisos ni Apps Script.
(function installEnglishLabUnifiedShellCS21A205(global){
  'use strict';
  if(!global || global.EnglishLabUnifiedShellCS21A205) return;

  const VERSION='CS21A205';
  const STYLE_ID='el205-style';
  const STYLE_HREF='styles/english_lab_unified_shell_cs21a205.css?v=CS21A205';
  const GAMES=Object.freeze([
    Object.freeze({id:'MEMORY_MATCH',label:'Memory Match',short:'Memoria',icon:'◫',area:'Vocabulario',note:'Encontrá parejas y seguí el turno compartido en tiempo real.'}),
    Object.freeze({id:'SENTENCE_ORDER',label:'Sentence Order',short:'Oraciones',icon:'↔',area:'Gramática',note:'Ordená palabras para construir oraciones correctas por unidad.'}),
    Object.freeze({id:'HANGMAN',label:'Hangman',short:'Ahorcado',icon:'A_',area:'Vocabulario',note:'Descubrí palabras y pistas con turnos y validación del servidor.'}),
    Object.freeze({id:'QUIZ_TIME',label:'Quiz Time',short:'Quiz',icon:'?',area:'Práctica mixta',note:'Diez preguntas curriculares con respuesta oculta hasta el reveal.'}),
    Object.freeze({id:'WORD_SEARCH',label:'Word Search',short:'Sopa de letras',icon:'#',area:'Vocabulario',note:'Encontrá palabras en una cuadrícula compartida y autoritativa.'}),
  ]);
  const GAME_IDS=new Set(GAMES.map(game=>game.id));

  function clean(value){return String(value==null?'':value).trim();}
  function upper(value){return clean(value).toUpperCase();}
  function ensureStyle(){
    if(!global.document || global.document.getElementById(STYLE_ID)) return;
    const link=global.document.createElement('link');
    link.id=STYLE_ID;
    link.rel='stylesheet';
    link.href=STYLE_HREF;
    (global.document.head||global.document.documentElement).appendChild(link);
  }
  function requestedGame(){
    try{
      const query=new URLSearchParams(global.location.search||'');
      const direct=upper(query.get('game'));
      if(GAME_IDS.has(direct)) return direct;
      if(query.get('quiz')==='1') return 'QUIZ_TIME';
      if(query.get('wordsearch')==='1') return 'WORD_SEARCH';
    }catch(_){}
    return 'MEMORY_MATCH';
  }
  function writeGameToUrl(gameId){
    try{
      const url=new URL(global.location.href);
      url.searchParams.set('game',gameId);
      url.searchParams.delete('quiz');
      url.searchParams.delete('wordsearch');
      global.history.replaceState(global.history.state||null,'',url.pathname+(url.search||'')+(url.hash||''));
    }catch(_){}
  }
  function unwrap(component){
    let current=component;
    const seen=new Set();
    for(let i=0;i<12 && typeof current==='function' && !seen.has(current);i+=1){
      seen.add(current);
      if(typeof current.__cs21a183Base==='function'){current=current.__cs21a183Base;continue;}
      if(typeof current.__base==='function'){current=current.__base;continue;}
      break;
    }
    return current;
  }

  ensureStyle();

  // Hangman se instala antes de capturar la cadena legacy. Así finalizeStack()
  // no vuelve a envolver este shell al final de la carga canónica.
  try{global.EnglishLabHangmanCS21A191?.install?.();}catch(_){}

  const QuizGateway=global.EnglishLabQuizTimeGatewayCS21A198;
  const WordGateway=global.EnglishLabWordSearchGatewayCS21A200;
  const Hangman=global.EnglishLabHangmanCS21A191;
  const LegacyTeacherCurrent=global.EnglishLabLiveTeacherView;
  const LegacyStudentCurrent=global.EnglishLabLiveStudentView;
  const SentenceTeacher=QuizGateway?.LegacyTeacher || null;
  const MemoryTeacher=unwrap(SentenceTeacher || WordGateway?.LegacyTeacher || LegacyTeacherCurrent);

  function missing(name){
    return function MissingEnglishLabGame(){
      return <div className="el205-missing"><strong>{name} no terminó de cargar.</strong><span>Recargá English LAB. Si continúa, registralo como fallo de carga del candidato QA.</span></div>;
    };
  }

  const TeacherComponents=Object.freeze({
    MEMORY_MATCH:typeof MemoryTeacher==='function'?MemoryTeacher:missing('Memory Match'),
    SENTENCE_ORDER:typeof SentenceTeacher==='function'?SentenceTeacher:missing('Sentence Order'),
    HANGMAN:typeof Hangman?.HangmanTeacherView==='function'?Hangman.HangmanTeacherView:missing('Hangman'),
    QUIZ_TIME:typeof QuizGateway?.TeacherQuiz==='function'?QuizGateway.TeacherQuiz:missing('Quiz Time'),
    WORD_SEARCH:typeof WordGateway?.TeacherWordSearch==='function'?WordGateway.TeacherWordSearch:missing('Word Search'),
  });
  const StudentComponents=Object.freeze({
    MEMORY_MATCH:typeof LegacyStudentCurrent==='function'?LegacyStudentCurrent:missing('Memory Match'),
    SENTENCE_ORDER:typeof LegacyStudentCurrent==='function'?LegacyStudentCurrent:missing('Sentence Order'),
    HANGMAN:typeof LegacyStudentCurrent==='function'?LegacyStudentCurrent:missing('Hangman'),
    QUIZ_TIME:typeof QuizGateway?.StudentQuiz==='function'?QuizGateway.StudentQuiz:missing('Quiz Time'),
    WORD_SEARCH:typeof WordGateway?.StudentWordSearch==='function'?WordGateway.StudentWordSearch:missing('Word Search'),
  });

  function gameById(id){return GAMES.find(game=>game.id===id)||GAMES[0];}

  function GameTabs({active,onChange,role}){
    return <div className="el205-game-grid" role="tablist" aria-label="Juegos English LAB">
      {GAMES.map(game=><button key={game.id} type="button" role="tab" aria-selected={active===game.id} className={'el205-game-card '+(active===game.id?'is-active':'')} onClick={()=>onChange(game.id)}>
        <span className="el205-game-icon" aria-hidden="true">{game.icon}</span>
        <span className="el205-game-copy"><small>{game.area}</small><strong>{game.label}</strong><em>{game.note}</em></span>
        <span className="el205-game-action">{role==='teacher'?'Preparar':'Entrar'} →</span>
      </button>)}
    </div>;
  }

  function ShellHeader({role,active}){
    const game=gameById(active);
    return <div className="el205-head">
      <div>
        <span className="el205-kicker">Academia Norteamericana · English LAB</span>
        <h1>{role==='teacher'?'Juegos Live para tu clase':'Práctica Live con tu grupo'}</h1>
        <p>{role==='teacher'?'Elegí un juego. Cada motor conserva sus reglas, fuente curricular y control de sala actuales.':'Elegí el juego indicado por tu docente y usá el código de sala. Los resultados son formativos y no modifican la nota oficial.'}</p>
      </div>
      <div className="el205-current"><span>Seleccionado</span><strong>{game.label}</strong><small>{VERSION}</small></div>
    </div>;
  }

  function useScopedCleanup(ref,gameId){
    React.useEffect(()=>{
      const root=ref.current;
      if(!root) return undefined;
      function cleanLegacy(){
        root.querySelectorAll('.ws200-gateway,.qt198-gateway,.elh191-tabs').forEach(node=>{node.style.display='none';});
        if(gameId==='MEMORY_MATCH'){
          const legacyLabels=new Set(['VOCABULARY SPRINT','WORD MATCH','PHRASE BUILDER','MINI CHALLENGE','SURVIVAL MISSION']);
          root.querySelectorAll('button').forEach(button=>{
            const text=upper(button.textContent);
            if(legacyLabels.has(text)) button.style.display='none';
          });
          root.querySelectorAll('.card').forEach(card=>{
            const text=upper(card.textContent);
            if(text.includes('BANCO PEDAGÓGICO')) card.style.display='none';
          });
        }
        if(gameId==='SENTENCE_ORDER'){
          Array.from(root.children).forEach(child=>{
            const isSentence=child.classList?.contains('elso183-shell');
            child.style.display=isSentence?'':'none';
          });
        }
      }
      cleanLegacy();
      const observer=typeof MutationObserver!=='undefined'?new MutationObserver(cleanLegacy):null;
      if(observer) observer.observe(root,{childList:true,subtree:true});
      return ()=>observer?.disconnect();
    },[gameId]);
  }

  function GameHost({role,gameId,props}){
    const ref=React.useRef(null);
    useScopedCleanup(ref,gameId);
    const Component=(role==='teacher'?TeacherComponents:StudentComponents)[gameId] || missing(gameId);
    return <div ref={ref} className={'el205-game-host el205-host-'+gameId.toLowerCase()} data-game={gameId}><Component key={gameId} {...(props||{})}/></div>;
  }

  function UnifiedShell({role,props}){
    const [gameId,setGameId]=React.useState(requestedGame);
    React.useEffect(()=>{writeGameToUrl(gameId);},[gameId]);
    return <div className={'el205-shell el205-'+role} data-version={VERSION}>
      <ShellHeader role={role} active={gameId}/>
      <GameTabs active={gameId} onChange={setGameId} role={role}/>
      <div className="el205-stage-head"><span>{role==='teacher'?'Configuración y control':'Ingreso y actividad'}</span><strong>{gameById(gameId).label}</strong></div>
      <GameHost role={role} gameId={gameId} props={props}/>
    </div>;
  }

  function EnglishLabLiveTeacherViewCS21A205(props){return <UnifiedShell role="teacher" props={props}/>;}
  function EnglishLabLiveStudentViewCS21A205(props){return <UnifiedShell role="student" props={props}/>;}

  // El hook histórico de Sentence Order envuelve cualquier asignación a estas
  // globals. La marca conserva la consola únicamente dentro de la pestaña
  // Sentence Order y evita volver a anteponerla a los otros cuatro juegos.
  EnglishLabLiveTeacherViewCS21A205.__cs21a183SentenceWrapped=true;
  EnglishLabLiveTeacherViewCS21A205.__cs21a205UnifiedShell=true;
  EnglishLabLiveStudentViewCS21A205.__cs21a183SentenceWrapped=true;
  EnglishLabLiveStudentViewCS21A205.__cs21a205UnifiedShell=true;

  global.EnglishLabLiveTeacherView=EnglishLabLiveTeacherViewCS21A205;
  global.EnglishLabLiveStudentView=EnglishLabLiveStudentViewCS21A205;
  global.EnglishLabUnifiedShellCS21A205=Object.freeze({
    VERSION,
    games:GAMES,
    requestedGame,
    writeGameToUrl,
    TeacherView:EnglishLabLiveTeacherViewCS21A205,
    StudentView:EnglishLabLiveStudentViewCS21A205,
    legacyTeacher:LegacyTeacherCurrent,
    legacyStudent:LegacyStudentCurrent,
    memoryTeacher:MemoryTeacher,
    sentenceTeacher:SentenceTeacher,
  });
})(window);
