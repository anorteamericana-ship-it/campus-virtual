/* global React, Icon */
// F98.4-Z6-PLAY0 · Academia Play V0 oculta / piloto visual.
// No llama backend. No guarda datos. No modifica notas oficiales.

const { useMemo: apUseMemo, useState: apUseState } = React;

function apNormCedula(v) {
  return String(v || '').replace(/[^0-9]/g, '');
}

function apEsUsuarioPiloto(usuario, role, rolReal) {
  const rol = String(rolReal || role || '').toLowerCase();
  if (rol === 'superadmin' || rol === 'admin' || rol === 'teacher' || rol === 'student') return true;
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

const AP_DEMO_QUESTIONS = [
  {
    type: 'Opción múltiple',
    prompt: 'Choose the correct sentence.',
    stem: 'Seleccioná la frase correcta para presentarte en clase.',
    options: ['I am Camila.', 'I has Camila.', 'I are Camila.', 'Me Camila am.'],
    correct: 0,
    explain: 'Usamos “I am” para decir “yo soy/estoy”.',
  },
  {
    type: 'Completar frase',
    prompt: 'Complete the sentence.',
    stem: 'She ____ from Costa Rica.',
    options: ['is', 'are', 'am', 'be'],
    correct: 0,
    explain: 'Con “she” usamos “is”.',
  },
  {
    type: 'Listening Boost · demo',
    prompt: 'Listen and choose.',
    stem: 'Audio demo: “Nice to meet you.”',
    options: ['Nice to meet you too.', 'I am twenty.', 'It is Monday.', 'I live English.'],
    correct: 0,
    explain: 'La respuesta natural es “Nice to meet you too.”',
  },
  {
    type: 'Ordenar palabras',
    prompt: 'Order the sentence.',
    stem: 'Orden correcto: do / you / where / live ?',
    options: ['Where do you live?', 'Do where you live?', 'You live where do?', 'Where you do live?'],
    correct: 0,
    explain: 'En preguntas con “do”: Where + do + subject + verb.',
  },
];

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

function APGameCard({ eyebrow, title, desc, meta, live, onClick }) {
  return (
    <button type="button" className={'ap-game-card ' + (live ? 'is-live' : '')} onClick={onClick}>
      <span className="ap-game-eyebrow">{live && <i aria-hidden="true" />} {eyebrow}</span>
      <strong>{title}</strong>
      <em>{desc}</em>
      <small>{meta}</small>
    </button>
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

function APStudentView({ usuario }) {
  const [screen, setScreen] = apUseState('dashboard');
  const [qIndex, setQIndex] = apUseState(0);
  const [selected, setSelected] = apUseState(null);
  const [finished, setFinished] = apUseState(false);
  const q = AP_DEMO_QUESTIONS[qIndex];
  const answered = selected !== null;
  const correct = answered && selected === q.correct;
  const liveText = finished ? 'Práctica finalizada. Resultado demo ocho de diez.' : answered ? (correct ? 'Correcto. Respuesta guardada.' : 'Casi. Revisá esta estructura.') : 'Pregunta activa.';

  const nextQuestion = () => {
    if (qIndex >= AP_DEMO_QUESTIONS.length - 1) {
      setFinished(true);
      return;
    }
    setQIndex(qIndex + 1);
    setSelected(null);
  };

  return (
    <div className="ap-view ap-view-student">
      <div className="ap-live-region" aria-live="polite">{liveText}</div>
      {screen === 'dashboard' && (
        <>
          <APSectionTitle eyebrow="Estudiante · Piloto" title="Academia Play">
            Práctica corta y juegos en vivo para reforzar inglés sin afectar nota oficial.
          </APSectionTitle>
          <div className="ap-hero-grid">
            <div className="ap-hero-card ap-cascade ap-cascade-1">
              <APBadge tone="red">Práctica recomendada de hoy</APBadge>
              <h3>Vocabulary Sprint · Básico I</h3>
              <p>8 minutos para reforzar saludos, presentación personal y preguntas básicas.</p>
              <div className="ap-hero-actions">
                <button type="button" className="ap-btn ap-btn-primary ap-breathe" onClick={() => setScreen('practice')}>Practicar ahora</button>
                <button type="button" className="ap-btn ap-btn-ghost" onClick={() => setScreen('live')}>Unirme a juego en vivo</button>
              </div>
            </div>
            <div className="ap-panel ap-cascade ap-cascade-2">
              <span className="ap-small-label">Progreso semanal demo</span>
              <div className="ap-week-row"><strong>4 prácticas</strong><span>Meta 5</span></div>
              <APProgress value={72} label="Progreso semanal demo" />
              <p>Demo visual. No guarda intentos todavía.</p>
            </div>
          </div>
          <div className="ap-stats-grid">
            <APStat label="Nivel" value={usuario?.codigo ? (usuario?.nivel || usuario?.NIVEL || 'Básico I') : 'Acceso gratis'} sub={usuario?.codigo ? 'Demo académico' : 'Sin matrícula activa'} />
            <APStat label="Grupo" value={usuario?.codigo ? (usuario?.grupo || usuario?.GRUPO || 'B1-LM18-C3-0726') : 'Pendiente'} sub={usuario?.codigo ? 'Modo piloto' : 'Sin grupo asignado'} />
            <APStat label="Actividad" value="12/18" sub="respondieron en sala demo" tone="red" />
          </div>
          <div className="ap-card-grid">
            <APGameCard eyebrow="Individual" title="Grammar Challenge" desc="Preguntas rápidas con feedback inmediato." meta="4 tipos de pregunta · Demo" onClick={() => setScreen('practice')} />
            <APGameCard eyebrow="En vivo" title="Sala PLAY-4821" desc="Trivia grupal activada por docente." meta="Resultado de actividad · No ranking permanente" live onClick={() => setScreen('live')} />
            <APGameCard eyebrow="Próximamente" title="Insignias y retos" desc="En diseño; sin reglas ni premios oficiales." meta="Backlog visual" />
          </div>
        </>
      )}

      {screen === 'practice' && (
        <div className="ap-practice-wrap">
          <div className="ap-practice-card ap-enter">
            <div className="ap-practice-top">
              <button type="button" className="ap-btn ap-btn-light" onClick={() => { setScreen('dashboard'); setSelected(null); setFinished(false); setQIndex(0); }}>← Volver</button>
              <APTimer seconds={answered ? 12 : 18} />
            </div>
            {!finished ? (
              <>
                <APBadge>{q.type}</APBadge>
                <h3>{q.prompt}</h3>
                <p>{q.stem}</p>
                <APProgress value={Math.round(((qIndex + 1) / AP_DEMO_QUESTIONS.length) * 100)} label="Progreso de preguntas" />
                <div className="ap-answer-list">
                  {q.options.map((opt, idx) => {
                    const state = !answered ? '' : idx === q.correct ? 'correct' : idx === selected ? 'wrong' : 'locked';
                    return (
                      <button type="button" key={opt} disabled={answered} className={'ap-answer ' + state} onClick={() => setSelected(idx)}>
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
                    <button type="button" className="ap-btn ap-btn-primary" onClick={nextQuestion}>Siguiente</button>
                  </div>
                )}
              </>
            ) : (
              <div className="ap-summary ap-enter">
                <APBadge tone="red">Resumen demo</APBadge>
                <h3>Buen trabajo</h3>
                <p>Resultado visual: 8/10. Este intento no se guarda y no afecta nota oficial.</p>
                <div className="ap-summary-grid"><APStat label="Correctas" value="8" sub="demo" /><APStat label="Tiempo" value="6:42" sub="demo" /></div>
                <button type="button" className="ap-btn ap-btn-primary" onClick={() => { setFinished(false); setSelected(null); setQIndex(0); }}>Practicar otra vez</button>
              </div>
            )}
          </div>
        </div>
      )}

      {screen === 'live' && (
        <div className="ap-live-room ap-enter">
          <button type="button" className="ap-btn ap-btn-light" onClick={() => setScreen('dashboard')}>← Volver</button>
          <div className="ap-live-main">
            <div className="ap-panel ap-live-lobby">
              <APBadge tone="red">Juego en vivo</APBadge>
              <h3>Sala PLAY-4821</h3>
              <p>Esperando al docente. Resultado de actividad; no ranking permanente.</p>
              <div className="ap-participants">
                {['Camila O.', 'Valeria M.', 'José R.', 'María F.'].map((name, i) => <span key={name} className={'ap-person ap-person-' + i}>{name}</span>)}
              </div>
              <button type="button" className="ap-btn ap-btn-primary">Copiar código</button>
            </div>
            <div className="ap-panel ap-question-live">
              <div className="ap-practice-top"><span>Pregunta activa demo</span><APTimer seconds={9} /></div>
              <h3>What is the correct answer?</h3>
              <p>12/18 respondieron</p>
              <APProgress value={67} label="Respuestas recibidas" />
              <div className="ap-feedback correct"><strong>Bloqueado después de responder</strong><span>Esperá el cierre de la pregunta.</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function APTeacherView() {
  const [live, setLive] = apUseState(false);
  return (
    <div className="ap-view ap-view-teacher">
      <APSectionTitle eyebrow="Docente · Piloto visual" title="Academia Play · Control de clase">
        Crear y conducir juegos demo. Sin guardar preguntas ni respuestas todavía.
      </APSectionTitle>
      <div className="ap-teacher-grid">
        <div className="ap-panel ap-enter">
          <APBadge>Crear juego</APBadge>
          <h3>Grammar Challenge</h3>
          <div className="ap-form-grid">
            <label>Grupo<span>B1-LM18-C3-0726</span></label>
            <label>Nivel<span>Básico I</span></label>
            <label>Preguntas<span>10</span></label>
            <label>Tiempo<span>20 s por pregunta</span></label>
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
        <APStat label="Juegos activos" value="1" sub="demo visual" />
        <APStat label="Participación" value="18" sub="estudiantes demo" />
        <APStat label="Niveles" value="4" sub="B1 · B2 · I1 · I2" />
      </div>
      <div className="ap-admin-grid">
        <div className="ap-panel">
          <APBadge tone="red">Módulo en piloto</APBadge>
          <h3>Antes de producción falta</h3>
          <ul className="ap-check-list">
            <li>Definir hojas o backend de juegos.</li>
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
        <h3>Actividad reciente demo</h3>
        <div className="ap-table">
          <div><span>Vocabulary Sprint</span><strong>Básico I · PLAY-4821</strong></div>
          <div><span>Grammar Challenge</span><strong>Docente · borrador</strong></div>
          <div><span>Listening Boost</span><strong>Próximamente</strong></div>
        </div>
      </div>
    </div>
  );
}

function AcademiaPlayView({ usuario, role, rolReal, onNavigate }) {
  const allowed = apEsUsuarioPiloto(usuario, role, rolReal);
  const initialMode = role === 'admin' ? 'admin' : role === 'teacher' ? 'teacher' : 'student';
  const [mode, setMode] = apUseState(initialMode);
  const nombre = usuario?.nombre || usuario?.NOMBRE || 'Estudiante';

  const modes = apUseMemo(() => {
    if (role === 'admin') return ['student', 'teacher', 'admin'];
    if (role === 'teacher') return ['teacher'];
    return ['student'];
  }, [role]);

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
    <div className="aplay-shell" data-screen-label="Academia Play · V0 piloto">
      <div className="aplay-topbar">
        <div>
          <APBadge tone="red">V0 oculto · demo visual</APBadge>
          <h1>Academia Play</h1>
          <p>{nombre} · Este piloto no guarda intentos, no crea rankings y no afecta notas oficiales{usuario?.codigo ? '' : ' · acceso gratis sin matrícula'}.</p>
        </div>
        <div className="ap-mode-tabs" role="tablist" aria-label="Vistas del piloto Academia Play">
          {modes.map(m => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
              {m === 'student' ? 'Estudiante' : m === 'teacher' ? 'Docente' : 'Admin'}
            </button>
          ))}
        </div>
      </div>
      {mode === 'student' && <APStudentView usuario={usuario || {}} />}
      {mode === 'teacher' && <APTeacherView />}
      {mode === 'admin' && <APAdminView />}
    </div>
  );
}

window.AcademiaPlayView = AcademiaPlayView;
