/* global React, Icon */
// F98.4-Z6-PLAY1 · Academia Play V1 demo enriquecido.
// No llama backend. No guarda intentos. No modifica notas oficiales.

const { useMemo: apUseMemo, useState: apUseState } = React;

function apNormCedula(v) {
  return String(v || '').replace(/[^0-9]/g, '');
}

function apRole(role, rolReal) {
  return String(rolReal || role || '').toLowerCase();
}

function apEsUsuarioPiloto(usuario, role, rolReal) {
  const rol = apRole(role, rolReal);
  if (rol === 'superadmin' || rol === 'admin' || rol === 'teacher') return true;
  const ced = apNormCedula(usuario?.cedula || usuario?.CEDULA || usuario?.identificacion || usuario?.IDENTIFICACION || usuario?.documento || usuario?.DOCUMENTO || usuario?.id || usuario?.ID);
  const cod = String(usuario?.codigo || usuario?.CODIGO || usuario?.CODIGO_ESTUDIANTE || '').trim().toUpperCase();
  if (ced === '120180140' || cod === '120814') return true;
  try {
    const q = new URLSearchParams(window.location.search || '');
    if (q.get('aplay') === '1' || q.get('play') === '1') return true;
    if (localStorage.getItem('an_academia_play_piloto') === '1') return true;
  } catch (_) {}
  return false;
}

function apEsUsuarioGratis(usuario, role, rolReal) {
  const rol = apRole(role, rolReal);
  if (rol !== 'student') return false;
  const tipo = String(usuario?.tipoUsuario || usuario?.tipo_usuario || usuario?.origen || usuario?.ORIGEN || '').toLowerCase();
  const cod = String(usuario?.codigo || usuario?.CODIGO || usuario?.CODIGO_ESTUDIANTE || '').trim();
  const matricula = String(usuario?.matricula || usuario?.MATRICULA || usuario?.estadoAcademico || '').trim();
  if (tipo.includes('gratis') || tipo.includes('prospect') || tipo.includes('prematric')) return true;
  return !cod && !matricula;
}

const AP_GAMES = [
  {
    id: 'vocabulary',
    title: 'Vocabulary Sprint',
    type: 'Vocabulario',
    desc: 'Rondas rápidas para reconocer palabras de uso diario.',
    duration: '6–8 min',
    level: 'Básico I',
    status: 'free',
    accent: 'red',
  },
  {
    id: 'word_match',
    title: 'Word Match',
    type: 'Asociación',
    desc: 'Uní palabra, significado y contexto sin presión oficial.',
    duration: '5 min',
    level: 'Básico I',
    status: 'free',
    accent: 'navy',
  },
  {
    id: 'daily',
    title: 'Daily Challenge',
    type: 'Reto diario',
    desc: 'Tres preguntas cortas para mantener el hábito de práctica.',
    duration: '3 min',
    level: 'Todos',
    status: 'free',
    accent: 'gold',
  },
  {
    id: 'grammar',
    title: 'Grammar Builder',
    type: 'Gramática',
    desc: 'Elegí la estructura correcta con explicación inmediata.',
    duration: '8–10 min',
    level: 'Básico I',
    status: 'matriculated',
    accent: 'navy',
  },
  {
    id: 'sentence_order',
    title: 'Sentence Order',
    type: 'Ordenar oración',
    desc: 'Construí frases correctas moviendo ideas en orden lógico.',
    duration: '7 min',
    level: 'Básico I',
    status: 'matriculated',
    accent: 'blue',
  },
  {
    id: 'flashcards',
    title: 'Flashcards',
    type: 'Memoria activa',
    desc: 'Tarjetas de vocabulario con repaso rápido.',
    duration: '4 min',
    level: 'Básico I–II',
    status: 'soon',
    accent: 'muted',
  },
  {
    id: 'listen',
    title: 'Listen & Choose',
    type: 'Listening',
    desc: 'Audio demo para elegir la respuesta natural.',
    duration: '6 min',
    level: 'Básico II',
    status: 'soon',
    accent: 'muted',
  },
  {
    id: 'live',
    title: 'Live Trivia',
    type: 'En vivo',
    desc: 'Sala activada por docente durante la clase.',
    duration: '10–15 min',
    level: 'Grupo',
    status: 'live',
    accent: 'red',
  },
];

const AP_FLOWS = {
  vocabulary: {
    title: 'Vocabulary Sprint',
    intro: 'Elegí la palabra correcta. Este intento es demo y no guarda nota.',
    questions: [
      { type: 'Vocabulario', prompt: 'Choose the greeting.', stem: '¿Cuál frase sirve para saludar?', options: ['Good morning', 'I am twenty', 'Red table', 'She works'], correct: 0, explain: '“Good morning” es un saludo.' },
      { type: 'Vocabulario', prompt: 'Choose the meaning.', stem: '“Classmate” significa:', options: ['Compañero de clase', 'Profesor', 'Horario', 'Cuaderno'], correct: 0, explain: 'Classmate es una persona que estudia con vos.' },
      { type: 'Vocabulario', prompt: 'Complete the idea.', stem: 'My phone number is ____.', options: ['8788-3939', 'Monday', 'Costa Rica', 'Fine'], correct: 0, explain: 'Un número telefónico responde a “phone number”.' },
      { type: 'Vocabulario', prompt: 'Choose the classroom word.', stem: 'Objeto para escribir:', options: ['Pencil', 'Window', 'Teacher', 'Break'], correct: 0, explain: 'Pencil es lápiz.' },
      { type: 'Vocabulario', prompt: 'Choose the correct phrase.', stem: 'Para despedirte:', options: ['See you later', 'How old are you?', 'I live in', 'Open the book'], correct: 0, explain: '“See you later” se usa para despedirse.' },
    ],
  },
  word_match: {
    title: 'Word Match',
    intro: 'Seleccioná la pareja correcta entre palabra y significado.',
    questions: [
      { type: 'Match', prompt: 'Match the word.', stem: 'Student', options: ['Estudiante', 'Docente', 'Grupo', 'Pago'], correct: 0, explain: 'Student = estudiante.' },
      { type: 'Match', prompt: 'Match the word.', stem: 'Schedule', options: ['Horario', 'Certificado', 'Nota', 'Aula'], correct: 0, explain: 'Schedule = horario.' },
      { type: 'Match', prompt: 'Match the word.', stem: 'Homework', options: ['Tarea', 'Pago', 'Feriado', 'Beca'], correct: 0, explain: 'Homework = tarea.' },
      { type: 'Match', prompt: 'Match the word.', stem: 'Teacher', options: ['Docente', 'Estudiante', 'Libro', 'Lección'], correct: 0, explain: 'Teacher = docente.' },
    ],
  },
  daily: {
    title: 'Daily Challenge',
    intro: 'Tres preguntas rápidas para calentar antes de clase.',
    questions: [
      { type: 'Daily', prompt: 'Choose the correct answer.', stem: 'How are you?', options: ['I am fine, thanks.', 'I am Costa Rica.', 'I am Monday.', 'I am English.'], correct: 0, explain: '“I am fine, thanks” responde cómo estás.' },
      { type: 'Daily', prompt: 'Complete.', stem: 'She ____ a student.', options: ['is', 'are', 'am', 'be'], correct: 0, explain: 'Con “she” usamos “is”.' },
      { type: 'Daily', prompt: 'Choose the question.', stem: 'Respuesta: I live in Guadalupe.', options: ['Where do you live?', 'How old are you?', 'What time is it?', 'Who is she?'], correct: 0, explain: 'Where pregunta por lugar.' },
    ],
  },
  grammar: {
    title: 'Grammar Builder',
    intro: 'Estructuras básicas para construir frases correctas.',
    questions: [
      { type: 'Grammar', prompt: 'Choose the correct sentence.', stem: 'Presentación personal:', options: ['I am Camila.', 'I are Camila.', 'I has Camila.', 'Me am Camila.'], correct: 0, explain: 'I + am.' },
      { type: 'Grammar', prompt: 'Complete.', stem: 'They ____ classmates.', options: ['are', 'is', 'am', 'be'], correct: 0, explain: 'They + are.' },
      { type: 'Grammar', prompt: 'Choose the question.', stem: 'Pregunta correcta:', options: ['Where do you live?', 'Where you live do?', 'Do where live you?', 'Where live you do?'], correct: 0, explain: 'Where + do + subject + verb.' },
      { type: 'Grammar', prompt: 'Negative form.', stem: 'She is not a teacher.', options: ['Correcta', 'Incorrecta', 'Falta do', 'Falta are'], correct: 0, explain: 'Con “be” se niega con not.' },
    ],
  },
  sentence_order: {
    title: 'Sentence Order',
    intro: 'Ordená ideas. En V1 demo se elige la oración correcta.',
    questions: [
      { type: 'Order', prompt: 'Order the sentence.', stem: 'do / you / where / live ?', options: ['Where do you live?', 'Do where you live?', 'You live where do?', 'Where you do live?'], correct: 0, explain: 'Where + do + you + live.' },
      { type: 'Order', prompt: 'Order the sentence.', stem: 'name / is / my / Camila', options: ['My name is Camila.', 'Name my is Camila.', 'Is my name Camila.', 'Camila my name is.'], correct: 0, explain: 'My name is + nombre.' },
      { type: 'Order', prompt: 'Order the sentence.', stem: 'from / I / Costa Rica / am', options: ['I am from Costa Rica.', 'From Costa Rica I am.', 'I from am Costa Rica.', 'Am I from Costa Rica.'], correct: 0, explain: 'I am from + país.' },
      { type: 'Order', prompt: 'Order the question.', stem: 'old / are / how / you ?', options: ['How old are you?', 'How are old you?', 'Are how old you?', 'You are how old?'], correct: 0, explain: 'How old + are + you.' },
    ],
  },
};

function APBadge({ children, tone }) {
  return <span className={'ap-badge ' + (tone || '')}>{children}</span>;
}

function APSectionTitle({ eyebrow, title, children }) {
  return (
    <div className="ap-section-head">
      <span className="ap-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

function APStat({ label, value, sub, tone }) {
  return (
    <div className={'ap-stat ' + (tone || '')}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}

function APProgress({ value, label }) {
  return (
    <div className="ap-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value} aria-label={label || 'Progreso'}>
      <div style={{ width: value + '%' }} />
    </div>
  );
}

function APTimer({ seconds }) {
  const tone = seconds <= 5 ? 'critical' : seconds <= 10 ? 'warn' : 'normal';
  return <span className={'ap-timer ' + tone} aria-label={'Quedan ' + seconds + ' segundos'}>{seconds}s</span>;
}

function apStatusLabel(status, isFreeUser) {
  if (status === 'free') return 'Gratis';
  if (status === 'live') return 'En vivo';
  if (status === 'soon') return 'Próximamente';
  return isFreeUser ? 'Matrícula' : 'Disponible';
}

function apCanOpen(game, isFreeUser) {
  if (!game) return false;
  if (game.status === 'soon') return false;
  if (game.status === 'live') return true;
  if (game.status === 'free') return true;
  return !isFreeUser;
}

function APGameCard({ game, isFreeUser, onOpen }) {
  const locked = !apCanOpen(game, isFreeUser);
  return (
    <button type="button" className={'ap-game-card ' + (game.status === 'live' ? 'is-live ' : '') + (locked ? 'is-locked ' : '') + (game.accent || '')} onClick={() => onOpen(game)}>
      <span className="ap-game-eyebrow">{game.status === 'live' && <i aria-hidden="true" />} {game.type}</span>
      <strong>{game.title}</strong>
      <em>{game.desc}</em>
      <small>{game.level} · {game.duration}</small>
      <APBadge tone={game.status === 'free' ? 'ok' : game.status === 'live' ? 'red' : game.status === 'soon' ? 'muted' : 'navy'}>{apStatusLabel(game.status, isFreeUser)}</APBadge>
    </button>
  );
}

function APGameRunner({ gameId, isFreeUser, onBack }) {
  const flow = AP_FLOWS[gameId] || AP_FLOWS.vocabulary;
  const [qIndex, setQIndex] = apUseState(0);
  const [selected, setSelected] = apUseState(null);
  const [score, setScore] = apUseState(0);
  const [finished, setFinished] = apUseState(false);
  const q = flow.questions[qIndex];
  const answered = selected !== null;
  const correct = answered && selected === q.correct;
  const progress = Math.round(((qIndex + 1) / flow.questions.length) * 100);
  const liveText = finished
    ? 'Práctica finalizada. Resultado demo ' + score + ' de ' + flow.questions.length + '.'
    : answered
      ? (correct ? 'Correcto. Respuesta guardada.' : 'Casi. Revisá esta estructura.')
      : 'Pregunta activa: ' + flow.title;

  function select(idx) {
    if (answered) return;
    setSelected(idx);
    if (idx === q.correct) setScore(score + 1);
  }
  function next() {
    if (qIndex >= flow.questions.length - 1) {
      setFinished(true);
      return;
    }
    setQIndex(qIndex + 1);
    setSelected(null);
  }
  function reset() {
    setQIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  return (
    <div className="ap-practice-wrap">
      <div className="ap-live-region" aria-live="polite">{liveText}</div>
      <div className="ap-practice-card ap-enter">
        <div className="ap-practice-top">
          <button type="button" className="ap-btn ap-btn-light" onClick={onBack}>← Juegos</button>
          <div className="ap-practice-meta"><APTimer seconds={answered ? 12 : 22} /><APBadge tone={isFreeUser ? 'ok' : 'navy'}>{isFreeUser ? 'Gratis' : 'Demo estudiante'}</APBadge></div>
        </div>
        {!finished ? (
          <>
            <APBadge>{q.type}</APBadge>
            <h3>{flow.title}</h3>
            <p>{flow.intro}</p>
            <div className="ap-question-strip"><strong>{q.prompt}</strong><span>Pregunta {qIndex + 1} de {flow.questions.length}</span></div>
            <p className="ap-question-stem">{q.stem}</p>
            <APProgress value={progress} label={'Progreso ' + flow.title} />
            <div className="ap-answer-list">
              {q.options.map((opt, idx) => {
                const state = !answered ? '' : idx === q.correct ? 'correct' : idx === selected ? 'wrong' : 'locked';
                return (
                  <button type="button" key={opt} disabled={answered} className={'ap-answer ' + state} onClick={() => select(idx)}>
                    <span>{String.fromCharCode(65 + idx)}</span>{opt}
                  </button>
                );
              })}
            </div>
            {answered && (
              <div className={'ap-feedback ' + (correct ? 'correct' : 'wrong')}>
                <strong>{correct ? 'Correcto' : 'Casi'}</strong>
                <span>{correct ? 'Respuesta guardada · bloqueado' : 'Revisá esta estructura · respuesta guardada'}</span>
                <p>{q.explain}</p>
                <button type="button" className="ap-btn ap-btn-primary" onClick={next}>Siguiente</button>
              </div>
            )}
          </>
        ) : (
          <div className="ap-summary ap-enter">
            <APBadge tone="red">Resumen demo</APBadge>
            <h3>{score >= Math.ceil(flow.questions.length * .75) ? 'Buen trabajo' : 'Sigamos practicando'}</h3>
            <p>Resultado visual: {score}/{flow.questions.length}. Este intento no se guarda y no afecta nota oficial.</p>
            <div className="ap-summary-grid"><APStat label="Correctas" value={String(score)} sub="demo" /><APStat label="Total" value={String(flow.questions.length)} sub="preguntas" /><APStat label="Tiempo" value="6:42" sub="demo" /></div>
            <div className="ap-hero-actions ap-center-actions">
              <button type="button" className="ap-btn ap-btn-primary" onClick={reset}>Practicar otra vez</button>
              <button type="button" className="ap-btn ap-btn-ghost" onClick={onBack}>Volver al catálogo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function APLockedState({ game, isFreeUser, onBack }) {
  const title = game?.status === 'soon' ? 'Juego en preparación' : 'Disponible al activar tu matrícula';
  const desc = game?.status === 'soon'
    ? 'Este juego está en diseño. No se muestra como promesa productiva todavía.'
    : 'Los usuarios gratis pueden practicar Vocabulary Sprint, Word Match y Daily Challenge. Este juego se desbloquea cuando admisiones active matrícula.';
  return (
    <div className="ap-locked-state ap-enter">
      <div className="ap-panel">
        <APBadge tone={game?.status === 'soon' ? 'muted' : 'red'}>{game?.title || 'Juego'}</APBadge>
        <h3>{title}</h3>
        <p>{desc}</p>
        <div className="ap-hero-actions">
          <button type="button" className="ap-btn ap-btn-primary" onClick={onBack}>Volver a juegos gratis</button>
          {isFreeUser && <button type="button" className="ap-btn ap-btn-ghost" onClick={onBack}>Solicitar contacto desde Mi Campus</button>}
        </div>
      </div>
    </div>
  );
}

function APStudentView({ usuario, role, rolReal }) {
  const isFreeUser = apEsUsuarioGratis(usuario, role, rolReal);
  const [screen, setScreen] = apUseState('dashboard');
  const [activeGame, setActiveGame] = apUseState(null);
  const freeGames = AP_GAMES.filter(g => g.status === 'free').length;
  const unlockedGames = AP_GAMES.filter(g => apCanOpen(g, isFreeUser)).length;

  function openGame(game) {
    if (game.status === 'live') {
      setActiveGame(game);
      setScreen('live');
      return;
    }
    if (!apCanOpen(game, isFreeUser) || !AP_FLOWS[game.id]) {
      setActiveGame(game);
      setScreen('locked');
      return;
    }
    setActiveGame(game);
    setScreen('play');
  }

  if (screen === 'play') return <APGameRunner gameId={activeGame?.id} isFreeUser={isFreeUser} onBack={() => setScreen('catalog')} />;
  if (screen === 'locked') return <APLockedState game={activeGame} isFreeUser={isFreeUser} onBack={() => setScreen('catalog')} />;
  if (screen === 'live') return <APLiveRoom onBack={() => setScreen('catalog')} />;

  return (
    <div className="ap-view ap-view-student">
      <APSectionTitle eyebrow={isFreeUser ? 'Prematrícula · Gratis' : 'Estudiante · Piloto'} title="Academia Play">
        Juegos cortos para practicar inglés. No guarda notas oficiales, no crea rankings permanentes y no toca evaluaciones.
      </APSectionTitle>
      <div className="ap-hero-grid">
        <div className="ap-hero-card ap-cascade ap-cascade-1">
          <APBadge tone="red">Práctica recomendada de hoy</APBadge>
          <h3>{isFreeUser ? 'Vocabulary Sprint · acceso gratis' : 'Grammar Builder · Básico I'}</h3>
          <p>{isFreeUser ? 'Empezá con vocabulario básico mientras admisiones activa tu matrícula.' : 'Reforzá estructura, vocabulario y respuestas de clase con feedback inmediato.'}</p>
          <div className="ap-hero-actions">
            <button type="button" className="ap-btn ap-btn-primary ap-breathe" onClick={() => openGame(AP_GAMES[0])}>Practicar ahora</button>
            <button type="button" className="ap-btn ap-btn-ghost" onClick={() => setScreen('catalog')}>Explorar juegos</button>
          </div>
        </div>
        <div className="ap-panel ap-cascade ap-cascade-2">
          <span className="ap-small-label">Progreso semanal demo</span>
          <div className="ap-week-row"><strong>{isFreeUser ? '2 prácticas' : '4 prácticas'}</strong><span>Meta 5</span></div>
          <APProgress value={isFreeUser ? 38 : 72} label="Progreso semanal demo" />
          <p>{isFreeUser ? 'Acceso gratis limitado. No guarda historial productivo.' : 'Demo visual. Historial real queda para V1 backend.'}</p>
        </div>
      </div>
      <div className="ap-stats-grid">
        <APStat label="Acceso" value={isFreeUser ? 'Gratis' : 'Piloto'} sub={isFreeUser ? 'sin matrícula activa' : 'estudiante demo'} tone={isFreeUser ? 'red' : ''} />
        <APStat label="Juegos" value={String(unlockedGames)} sub={isFreeUser ? freeGames + ' gratis' : 'demo desbloqueado'} />
        <APStat label="Live" value="PLAY" sub="sala demo disponible" tone="red" />
        <APStat label="Nota oficial" value="0" sub="no afecta evaluaciones" />
      </div>
      <div className="ap-catalog-head">
        <h3>Catálogo de juegos</h3>
        <p>{isFreeUser ? 'Camila puede usar los juegos gratis. Los demás quedan bloqueados hasta matrícula.' : 'Vista demo para validar catálogo antes de conectar backend.'}</p>
      </div>
      <div className="ap-card-grid ap-card-grid-catalog">
        {AP_GAMES.map(g => <APGameCard key={g.id} game={g} isFreeUser={isFreeUser} onOpen={openGame} />)}
      </div>
    </div>
  );
}

function APLiveRoom({ onBack }) {
  return (
    <div className="ap-live-room ap-enter">
      <button type="button" className="ap-btn ap-btn-light" onClick={onBack}>← Volver</button>
      <div className="ap-live-main">
        <div className="ap-panel ap-live-lobby">
          <APBadge tone="red">Juego en vivo</APBadge>
          <h3>Sala PLAY-4821</h3>
          <p>Esperando al docente. Resultado de actividad; no ranking permanente.</p>
          <div className="ap-participants">
            {['Camila O.', 'Valeria M.', 'José R.', 'María F.', 'Daniela C.'].map((n, i) => <span key={n} className={'ap-person ap-person-' + i}>{n}</span>)}
          </div>
          <div className="ap-hero-actions"><button type="button" className="ap-btn ap-btn-primary">Copiar código</button><button type="button" className="ap-btn ap-btn-ghost">Compartir sala</button></div>
        </div>
        <div className="ap-practice-card">
          <div className="ap-practice-top"><APBadge>Pregunta activa demo</APBadge><APTimer seconds={9} /></div>
          <h3>Choose the correct question.</h3>
          <p>Respuesta esperada: I live in Costa Rica.</p>
          <APProgress value={67} label="Respuestas recibidas" />
          <p><strong>12/18 respondieron</strong> · Se bloquea después de responder.</p>
          <div className="ap-answer-list"><button type="button" className="ap-answer correct"><span>A</span>Where do you live?</button><button type="button" className="ap-answer locked"><span>B</span>How old are you?</button></div>
        </div>
      </div>
    </div>
  );
}

function APTeacherView() {
  const [live, setLive] = apUseState(false);
  const [game, setGame] = apUseState('Vocabulary Sprint');
  return (
    <div className="ap-view ap-view-teacher">
      <APSectionTitle eyebrow="Docente · Piloto" title="Crear juego en vivo">
        Control visual de clase. No activa backend todavía.
      </APSectionTitle>
      <div className="ap-teacher-grid">
        <div className="ap-panel ap-enter">
          <APBadge>Configuración demo</APBadge>
          <h3>Preparar sala</h3>
          <div className="ap-form-grid">
            <label>Grupo<span>B1-LM18-C3-0726</span></label>
            <label>Nivel<span>Básico I</span></label>
            <label>Juego<span>{game}</span></label>
            <label>Preguntas<span>10</span></label>
            <label>Tiempo<span>20 s por pregunta</span></label>
            <label>Modo<span>Resultado de actividad</span></label>
          </div>
          <div className="ap-game-mini-selector" aria-label="Seleccionar juego demo">
            {['Vocabulary Sprint','Word Match','Grammar Builder','Sentence Order'].map(n => <button key={n} type="button" className={game===n?'active':''} onClick={()=>setGame(n)}>{n}</button>)}
          </div>
          <button type="button" className="ap-btn ap-btn-primary" onClick={() => setLive(true)}>Activar juego demo</button>
        </div>
        <div className="ap-panel ap-enter ap-cascade-2">
          <APBadge tone={live ? 'red' : ''}>{live ? 'Juego en curso' : 'Vista previa'}</APBadge>
          <h3>Sala PLAY-4821</h3>
          <p>{live ? '18 conectados · 12 respondieron la pregunta actual.' : 'El docente verá estudiantes conectados y respuestas recibidas.'}</p>
          <APProgress value={live ? 67 : 20} label="Respuestas recibidas" />
          <div className="ap-teacher-actions">
            <button type="button" className="ap-btn ap-btn-light">Pausar</button>
            <button type="button" className="ap-btn ap-btn-primary">Siguiente pregunta</button>
            <button type="button" className="ap-btn ap-btn-ghost">Finalizar</button>
          </div>
        </div>
      </div>
      <div className="ap-panel ap-table-panel">
        <h3>Estudiantes conectados</h3>
        <div className="ap-table">
          {['Camila Otoya', 'Valeria Mora', 'José Rojas', 'María Fernández'].map((n, i) => (
            <div key={n}><span>{n}</span><strong>{i < 3 ? 'Respondió' : 'Esperando'}</strong></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function APAdminView() {
  return (
    <div className="ap-view ap-view-admin">
      <APSectionTitle eyebrow="Admin · Superadmin" title="Panel Academia Play">
        Estado del módulo en piloto. Métricas demo para validar navegación, no producción.
      </APSectionTitle>
      <div className="ap-stats-grid">
        <APStat label="Estado" value="Piloto" sub="sin backend productivo" tone="red" />
        <APStat label="Juegos" value="8" sub="catálogo visual" />
        <APStat label="Gratis" value="3" sub="para prospectos" />
        <APStat label="Niveles" value="4" sub="B1 · B2 · I1 · I2" />
      </div>
      <div className="ap-admin-grid">
        <div className="ap-panel">
          <APBadge tone="red">Módulo en piloto</APBadge>
          <h3>Antes de producción falta</h3>
          <ul className="ap-check-list">
            <li>Definir hojas o backend de juegos.</li>
            <li>Banco real de preguntas por nivel.</li>
            <li>Permisos por grupo y docente.</li>
            <li>Historial separado de notas oficiales.</li>
            <li>QA mobile y accesibilidad real.</li>
          </ul>
        </div>
        <div className="ap-panel">
          <h3>Uso por nivel · demo</h3>
          {['Básico I', 'Básico II', 'Intermedio I', 'Intermedio II'].map((n, i) => (
            <div key={n} className="ap-level-row"><span>{n}</span><APProgress value={[72, 48, 28, 12][i]} label={'Uso demo ' + n} /></div>
          ))}
        </div>
      </div>
      <div className="ap-panel ap-table-panel">
        <h3>Catálogo V1 · estado demo</h3>
        <div className="ap-table">
          {AP_GAMES.map(g => <div key={g.id}><span>{g.title}</span><strong>{apStatusLabel(g.status, false)}</strong></div>)}
        </div>
      </div>
    </div>
  );
}

function AcademiaPlayView({ usuario, role, rolReal, onNavigate }) {
  const allowed = apEsUsuarioPiloto(usuario, role, rolReal);
  const rol = apRole(role, rolReal);
  const initialMode = rol === 'admin' || rol === 'superadmin' ? 'admin' : rol === 'teacher' ? 'teacher' : 'student';
  const [mode, setMode] = apUseState(initialMode);
  const nombre = usuario?.nombre || usuario?.NOMBRE || 'Estudiante';

  const modes = apUseMemo(() => {
    if (rol === 'admin' || rol === 'superadmin') return ['student', 'teacher', 'admin'];
    if (rol === 'teacher') return ['teacher'];
    return ['student'];
  }, [rol]);

  if (!allowed) {
    return (
      <div className="aplay-shell ap-denied">
        <div className="ap-panel">
          <APBadge tone="red">Piloto cerrado</APBadge>
          <h2>Academia Play todavía no está disponible para este usuario.</h2>
          <p>El piloto está limitado a administración, docentes y estudiantes de prueba. No se cargó backend ni se escriben datos.</p>
          <button type="button" className="ap-btn ap-btn-primary" onClick={() => onNavigate && onNavigate('dashboard')}>Volver al Campus</button>
        </div>
      </div>
    );
  }

  return (
    <div className="aplay-shell" data-screen-label="Academia Play · V1 demo">
      <div className="aplay-topbar">
        <div>
          <APBadge tone="red">V1 demo · catálogo enriquecido</APBadge>
          <h1>Academia Play</h1>
          <p>{nombre} · Este piloto no guarda intentos, no crea rankings y no afecta notas oficiales.</p>
        </div>
        <div className="ap-mode-tabs" role="tablist" aria-label="Vistas del piloto Academia Play">
          {modes.map(m => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
              {m === 'student' ? 'Estudiante' : m === 'teacher' ? 'Docente' : 'Admin'}
            </button>
          ))}
        </div>
      </div>
      {mode === 'student' && <APStudentView usuario={usuario || {}} role={role} rolReal={rolReal} />}
      {mode === 'teacher' && <APTeacherView />}
      {mode === 'admin' && <APAdminView />}
    </div>
  );
}

window.AcademiaPlayView = AcademiaPlayView;
