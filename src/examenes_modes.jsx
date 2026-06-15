/* global React, NIVEL_TEMA, CATALOGO, EXAM_I2_T1_A, SUBMISSION_DEMO,
   ExamShell, examQuestions, evalQuestion, getMatchVal */
// ──────────────────────────────────────────────────────────────────────────
// examenes_modes.jsx — Estudiante / Profesor / Administrador + barra de
// control (auditoría). Maqueta interactiva, sin backend, sin guardar notas.
// ──────────────────────────────────────────────────────────────────────────
const { useState, useMemo, useCallback } = React;

// Valor compacto del examen según plan (para la grilla).
function planValor(pp, plan) {
  if (!pp) return '—';
  if (plan === 'con_ina') return `${pp.con_ina}% (CON INA)`;
  if (plan === 'sin_ina') return `${pp.sin_ina}% (SIN INA)`;
  return `${pp.con_ina}% / ${pp.sin_ina}%`;
}

// El examen real, re-pintado según el nivel seleccionado para tema (auditoría).
function themedExam(nivel) {
  if (nivel === 'I2') return EXAM_I2_T1_A;
  // Auditar el color en otro nivel: mismo contenido, distinto tema (solo demo).
  return Object.assign({}, EXAM_I2_T1_A, { nivel });
}

// ════════════════════════════════════════════════════════════════════════
// MODAL guion de audio (solo profesor/admin/preview)
// ════════════════════════════════════════════════════════════════════════
function ScriptModal({ section, exam, onClose }) {
  if (!section) return null;
  const lines = exam.audioScript[section] || [];
  return (
    <div className="exov" onClick={onClose}>
      <div className="exov-card" onClick={e=>e.stopPropagation()}>
        <div className="exov-h">
          <h3>Guion de audio · Sección {section}</h3>
          <span className="exov-tag">solo docente</span>
          <button className="exov-x" onClick={onClose}>✕</button>
        </div>
        <div className="exov-body">
          {lines.map(([who, t], i) => (
            <p key={i} className="exov-line">{who && <b>{who}:</b>} {t}</p>
          ))}
        </div>
        <div className="exov-foot">El guion nunca es visible para el estudiante durante el examen oficial.</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ESTUDIANTE
// ════════════════════════════════════════════════════════════════════════
// Resuelve el examen real asignado (o null si no hay contenido).
function examIdDe(nivel, test, opcion) {
  const lec = test === 'TEST1' ? 'L18' : 'L32';
  return `${nivel}_WRITTEN_${lec}_${test}_${opcion}`;
}
function getExam(nivel, test, opcion) {
  return (window.EXAMS || {})[examIdDe(nivel, test, opcion)] || null;
}

function StudentMode({ shell, density, nivel='I2', test='TEST1', opcion, plan }) {
  // El sistema YA decidió qué examen le toca (no lo escoge).
  const exam = getExam(nivel, test, opcion);
  const tema = NIVEL_TEMA[nivel] || NIVEL_TEMA['I2'];
  const [stage, setStage] = useState('lobby'); // lobby | taking | sent
  const [answers, setAnswers] = useState({});
  const onAnswer = useCallback((id, v) => setAnswers(a => Object.assign({}, a, { [id]: v })), []);

  // Sin contenido real (Opción B, u otra combinación) — NUNCA carga otro examen.
  if (!exam) {
    return <div className="stwrap"><PendingCard tema={tema} opcion={opcion} /></div>;
  }

  const all = examQuestions(exam);
  const answered = all.filter(({ q, kind, section }) => {
    if (kind === 'match') return getMatchVal(answers, q.n, section.letter) != null;
    return answers[q.id] != null && String(answers[q.id]).trim() !== '';
  }).length;
  const pct = Math.round((answered / all.length) * 100);

  if (stage === 'lobby') {
    return <div className="stwrap">
      <AssignmentCard exam={exam} tema={tema} opcion={opcion} plan={plan} onStart={()=>setStage('taking')} />
    </div>;
  }

  if (stage === 'sent') {
    return <div className="stwrap"><SentCard exam={exam} tema={tema} opcion={opcion} plan={plan} /></div>;
  }

  return (
    <div className="stwrap">
      <div className="sttake">
        <ExamShell exam={exam} answers={answers} onAnswer={onAnswer} mode="student" showKey={false}
                   shell={shell} density={density} plan={plan}
                   meta={{ nombre:'María Fernanda Quirós', fecha:'13 jun 2026', grupo:'I2-LM-0625', opcion, scoreLabel:`${answered} / ${all.length} resp.` }} />
      </div>      <div className="stbar">
        <div className="stbar-prog">
          <div className="stbar-track"><div className="stbar-fill" style={{ width:pct+'%', background:tema.color }} /></div>
          <span>{answered} de {all.length} respondidas · {pct}%</span>
        </div>
        <div className="stbar-actions">
          <button className="btn-ghost" onClick={()=>alert('Avance guardado (simulado).')}>Guardar avance</button>
          <button className="btn-primary" onClick={()=>setStage('sent')}>Enviar examen</button>
        </div>
      </div>
    </div>
  );
}

function AssignmentCard({ exam, tema, opcion, plan, onStart }) {
  return (
    <div className="ascard" style={{ '--lvl':tema.color, '--lvl-soft':tema.soft, '--lvl-ink':tema.ink }}>
      <div className="ascard-top">
        <span className="ascard-lvl">{tema.code} · {tema.nombre.toUpperCase()}</span>
        <span className={`ascard-opt opt-${opcion}`}>Opción {opcion} {opcion==='B' && '· reposición'}</span>
      </div>
      <h2 className="ascard-title">{exam.titulo}</h2>
      <p className="ascard-sub">{exam.subtitulo}</p>
      <div className="ascard-pond">{window.ponderacionTexto(exam.ponderacion_por_plan, plan)}</div>
      <div className="ascard-grid">
        <div><span>Unidades</span><b>{exam.unidades}</b></div>
        <div><span>Lección</span><b>{exam.leccion} · cronograma</b></div>
        <div><span>Valor</span><b>{planValor(exam.ponderacion_por_plan, plan)}</b></div>
        <div><span>Puntos</span><b>{exam.puntos_totales}</b></div>
      </div>
      <div className="ascard-note">
        Este examen fue asignado automáticamente según tu grupo y el cronograma.
        No es posible escoger otro examen ni cambiar de opción.
      </div>
      <button className="btn-primary ascard-go" onClick={onStart}>Iniciar examen</button>
    </div>
  );
}

// Opción B (o cualquier variante sin contenido): pendiente, no inicia.
function PendingCard({ tema, opcion }) {
  return (
    <div className="ascard pendcard" style={{ '--lvl':tema.color, '--lvl-soft':tema.soft, '--lvl-ink':tema.ink }}>
      <div className="ascard-top">
        <span className="ascard-lvl">{tema.code} · {tema.nombre.toUpperCase()}</span>
        <span className={`ascard-opt opt-${opcion}`}>Opción {opcion} {opcion==='B' && '· reposición'}</span>
      </div>
      <h2 className="ascard-title">Opción {opcion} pendiente de publicar</h2>
      <p className="ascard-sub">Esta variante se usará para reposición o casos autorizados por docente/administración.</p>
      <div className="ascard-note">
        El contenido de la Opción {opcion} aún no está disponible. No carga el examen de otra opción.
        Cuando esté publicado, el sistema lo asignará automáticamente según el cronograma.
      </div>
      <button className="btn-primary ascard-go" disabled>Examen pendiente</button>
    </div>
  );
}

function SentCard({ exam, tema, opcion, plan }) {
  return (
    <div className="ascard sentcard" style={{ '--lvl':tema.color, '--lvl-soft':tema.soft, '--lvl-ink':tema.ink }}>
      <div className="sent-check" style={{ background:tema.color }}>✓</div>
      <h2 className="ascard-title">Examen enviado</h2>
      <p className="sent-msg">Tu examen fue enviado correctamente. La nota final estará disponible cuando el docente complete la revisión.</p>
      <div className="sent-state"><span className="sent-dot" />En revisión docente</div>
      <div className="sent-grid">
        <div><span>Examen</span><b>{exam.titulo}</b></div>
        <div><span>Opción</span><b>{opcion}</b></div>
        <div><span>Valor</span><b>{planValor(exam.ponderacion_por_plan, plan)}</b></div>
        <div><span>Nota</span><b className="sent-pending">Pendiente</b></div>
      </div>
      <div className="ascard-note">No verás respuestas correctas ni una nota automática. La nota la confirma tu profesor.</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// PROFESOR — bandeja + revisión
// ════════════════════════════════════════════════════════════════════════
const ESTADOS = {
  pendiente:   { t:'Pendiente de revisión', c:'#C67100', bg:'#FBF1D8' },
  en_revision: { t:'En revisión',           c:'#0C447C', bg:'#E2EFF8' },
  parcial:     { t:'Corregido parcial',      c:'#6B4FA0', bg:'#EEE8F7' },
  listo:       { t:'Listo para cerrar',      c:'#1F6B25', bg:'#E4F3E5' },
  cerrado:     { t:'Cerrado',                c:'#4A413A', bg:'#EAE3D5' },
};

// Bandeja con entregas simuladas. Exámenes oficiales revisables:
// las 16 entradas del catálogo (B1/B2/I1/I2 · Test 1/2 · Opción A/B).
const INBOX = [
  Object.assign({}, SUBMISSION_DEMO),
  Object.assign({}, window.SUBMISSION_DEMO_I2_T1_B),
  Object.assign({}, SUBMISSION_DEMO_T2),
  Object.assign({}, window.SUBMISSION_DEMO_I2_T2_B),
  Object.assign({}, window.SUBMISSION_DEMO_I1_T1),
  Object.assign({}, window.SUBMISSION_DEMO_I1_T1_B),
  Object.assign({}, window.SUBMISSION_DEMO_I1_T2),
  Object.assign({}, window.SUBMISSION_DEMO_I1_T2_B),
  Object.assign({}, window.SUBMISSION_DEMO_B2_T1),
  Object.assign({}, window.SUBMISSION_DEMO_B2_T1_B),
  Object.assign({}, window.SUBMISSION_DEMO_B2_T2),
  Object.assign({}, window.SUBMISSION_DEMO_B2_T2_B),
  Object.assign({}, window.SUBMISSION_DEMO_B1_T1),
  Object.assign({}, window.SUBMISSION_DEMO_B1_T2),
  Object.assign({}, window.SUBMISSION_DEMO_B1_T1_B),
  Object.assign({}, window.SUBMISSION_DEMO_B1_T2_B),
];

function TeacherMode({ shell, density }) {
  const [openId, setOpenId] = useState(null);
  const sub = openId != null ? INBOX[openId] : null;
  if (sub && !sub.stub) {
    return <TeacherReview sub={sub} shell={shell} density={density} onBack={()=>setOpenId(null)} />;
  }
  return <TeacherInbox onOpen={setOpenId} />;
}

function TeacherInbox({ onOpen }) {
  const counts = INBOX.reduce((m,s)=>{ m[s.estado]=(m[s.estado]||0)+1; return m; },{});
  return (
    <div className="tchwrap">
      <div className="tch-head">
        <div>
          <div className="tch-kicker">BANDEJA DE REVISIÓN · B1 / B2 / I1 / I2 · pruebas oficiales</div>
          <h2 className="tch-title">Exámenes por revisar</h2>
        </div>
        <div className="tch-stats">
          <div className="tch-stat"><b>{counts.pendiente||0}</b><span>pendientes</span></div>
          <div className="tch-stat"><b>{INBOX.length}</b><span>entregas</span></div>
        </div>
      </div>
      <div className="tch-note">La nota final NO pasa a <b>Mis Notas</b> hasta que el profesor cierra la revisión. La corrección automática es solo preliminar.</div>
      <table className="tch-table">
        <thead><tr><th>Estudiante</th><th>Grupo</th><th>Opción</th><th>Enviado</th><th>Tiempo</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {INBOX.map((s, i) => {
            const est = ESTADOS[s.estado];
            return (
              <tr key={i} className={s.pendiente?'row-pend':''}>
                <td><b>{s.estudiante}</b><span className="tch-code">{s.codigo}</span></td>
                <td>{s.grupo}</td>
                <td><span className={`mini-opt opt-${s.opcion}`}>{s.opcion}</span></td>
                <td>{s.enviado}</td>
                <td>{s.tiempo}</td>
                <td><span className="tch-pill" style={{ color:est.c, background:est.bg }}>{est.t}</span></td>
                <td>
                  {s.pendiente
                    ? <span className="tch-stub">Opción B pendiente</span>
                    : s.stub
                      ? <span className="tch-stub">demo: 1 examen</span>
                      : <button className="btn-sm" onClick={()=>onOpen(i)}>Revisar →</button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TeacherReview({ sub, shell, density, onBack }) {
  const exam = (window.EXAMS || {})[sub.examen] || EXAM_I2_T1_A;
  const tema = NIVEL_TEMA[exam.nivel];
  const answers = sub.respuestas;
  const all = examQuestions(exam);

  // Auto-grade preliminar
  const autoEval = useMemo(() => all.map(({ section, q, kind }) => {
    const val = kind==='match' ? getMatchVal(answers, q.n, section.letter) : answers[q.id];
    const ev = evalQuestion(section, q, val);
    return { id: kind==='match' ? section.letter+q.n : q.id, ev };
  }), []);
  const autoScore = autoEval.filter(x => x.ev.verdict==='ok').length;
  const needReview = autoEval.filter(x => x.ev.verdict==='review').length;

  const [marks, setMarks] = useState({});       // id -> 0 / 0.5 / 1 (override)
  const [comments, setComments] = useState({});
  const [openComment, setOpenComment] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [closed, setClosed] = useState(false);

  const setMark = (id, p) => setMarks(m => Object.assign({}, m, { [id]: p }));
  const setComment = (id, t) => setComments(c => Object.assign({}, c, { [id]: t }));

  // Nota actual = override si existe, si no auto (1 si ok, 0 resto)
  const finalScore = autoEval.reduce((sum, x) => {
    const m = marks[x.id];
    return sum + (m == null ? (x.ev.verdict==='ok' ? 1 : 0) : m);
  }, 0);
  const adjusted = Object.keys(marks).length;
  const note100 = Math.round((finalScore / all.length) * 100);

  const review = { marks, setMark, comments, setComment, openComment, setOpenComment };

  const [scriptSec, setScriptSec] = useState(null);

  return (
    <div className="tchrev" style={{ '--lvl':tema.color, '--lvl-soft':tema.soft, '--lvl-ink':tema.ink }}>
      <ScriptModal section={scriptSec} exam={exam} onClose={()=>setScriptSec(null)} />
      {/* sidebar de control */}
      <aside className="rev-side">
        <button className="rev-back" onClick={onBack}>← Bandeja</button>
        <div className="rev-stud">
          <h3>{sub.estudiante}</h3>
          <div className="rev-meta"><span>Código</span>{sub.codigo}</div>
          <div className="rev-meta"><span>Cédula</span>{sub.cedula}</div>
          <div className="rev-meta"><span>Grupo</span>{sub.grupo}</div>
          <div className="rev-meta"><span>Examen</span>{sub.examen}</div>
          <div className="rev-meta"><span>Opción</span><span className={`mini-opt opt-${sub.opcion}`}>{sub.opcion}</span></div>
          <div className="rev-meta"><span>Enviado</span>{sub.enviado}</div>
          <div className="rev-meta"><span>Tiempo</span>{sub.tiempo}</div>
        </div>

        <div className="rev-prelim">
          <div className="rev-prelim-h">Corrección preliminar</div>
          <div className="rev-prelim-row"><span>Auto correctas</span><b>{autoScore}/{all.length}</b></div>
          <div className="rev-prelim-row warn"><span>Requieren revisión</span><b>{needReview}</b></div>
          <div className="rev-prelim-row"><span>Ajustes docente</span><b>{adjusted}</b></div>
          <div className="rev-note">La nota automática es preliminar — nunca es nota final sin docente.</div>
        </div>

        <div className="rev-score">
          <div className="rev-score-num" style={{ color:tema.ink }}>{note100}</div>
          <div className="rev-score-lbl">Nota actual · {finalScore}/{all.length} pts</div>
        </div>

        <textarea className="rev-fb" placeholder="Retroalimentación final para el estudiante…" value={feedback} onChange={e=>setFeedback(e.target.value)} />

        <button className="btn-ghost" disabled={closed} onClick={()=>alert('Borrador guardado (simulado).')}>Guardar borrador</button>
        <button className={`btn-close${closed?' done':''}`} disabled={closed} onClick={()=>setClosed(true)}>
          {closed ? '✓ Nota final cerrada' : 'Cerrar nota final'}
        </button>
        {closed && <div className="rev-closed">Nota <b>{note100}</b> enviada a <b>Mis Notas</b> (simulado). Estado: Cerrada.</div>}
      </aside>

      {/* examen con clave + corrección por pregunta */}
      <div className="rev-main">
        <ExamShell exam={exam} answers={answers} mode="review" showKey={true}
                   shell={shell} density={density} review={review}
                   onOpenScript={setScriptSec}
                   meta={{ nombre:sub.estudiante, fecha:sub.enviado, grupo:sub.grupo, opcion:sub.opcion, scoreLabel:`${note100} / 100` }} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ADMINISTRADOR — catálogo maestro
// ════════════════════════════════════════════════════════════════════════
// Modelo de ponderación por plan (referencia administrativa)
function PonderacionModelo() {
  const [open, setOpen] = useState(false);
  const rows = window.PONDERACION_MODELO();
  const totCon = rows.reduce((s,r)=>s+r.con_ina,0);
  const totSin = rows.reduce((s,r)=>s+r.sin_ina,0);
  return (
    <div className="pmodel">
      <button className="pmodel-h" onClick={()=>setOpen(o=>!o)}>
        <span className="pmodel-ttl">Modelo de ponderación por plan · CON INA / SIN INA</span>
        <span className="pmodel-sub">La ponderación no es fija — depende del plan del estudiante</span>
        <span className="pmodel-chev">{open?'▾':'▸'}</span>
      </button>
      {open && (
        <table className="pmodel-table">
          <thead><tr><th>Evaluación</th><th>CON INA</th><th>SIN INA</th></tr></thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} className={/Escrito/.test(r.item)?'pm-w':''}>
                <td>{r.item}</td>
                <td><b>{r.con_ina}%</b></td>
                <td><b>{r.sin_ina===0?'—':r.sin_ina+'%'}</b></td>
              </tr>
            ))}
            <tr className="pm-tot"><td>Total</td><td>{totCon}%</td><td>{totSin}%</td></tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

function AdminMode({ shell, density, onPreview }) {
  const [filtro, setFiltro] = useState('todos');
  const [sel, setSel] = useState(null);
  const list = CATALOGO.filter(e => filtro==='todos' ? true : filtro==='real' ? e.estado==='real' : e.opcion===filtro);
  const real = CATALOGO.filter(e=>e.estado==='real').length;

  return (
    <div className="adwrap">
      <div className="ad-head">
        <div>
          <div className="ad-kicker">CATÁLOGO MAESTRO DE EXÁMENES · WRITTEN</div>
          <h2 className="ad-title">16 entradas · 4 niveles × Test 1/2 × Opción A/B</h2>
        </div>
        <div className="ad-legend">
          <span className="ad-leg"><i className="dot-real" />{real} con contenido real</span>
          <span className="ad-leg"><i className="dot-pend" />{CATALOGO.length-real} pendientes</span>
        </div>
      </div>

      <div className="ad-filters">
        {[['todos','Todos'],['A','Opción A'],['B','Opción B'],['real','Solo reales']].map(([k,l])=>(
          <button key={k} className={`ad-f${filtro===k?' on':''}`} onClick={()=>setFiltro(k)}>{l}</button>
        ))}
      </div>

      <PonderacionModelo />

      <div className="ad-grid">
        {list.map(e => {
          const t = NIVEL_TEMA[e.nivel];
          return (
            <div key={e.id} className={`adcard estado-${e.estado}`} style={{ '--lvl':t.color, '--lvl-soft':t.soft, '--lvl-ink':t.ink }}>
              <div className="adcard-top">
                <span className="adcard-lvl">{t.code}</span>
                <span className={`mini-opt opt-${e.opcion}`}>{e.opcion}</span>
                <span className={`adcard-state ${e.estado}`}>{e.estado==='real'?'REAL':'PENDIENTE'}</span>
              </div>
              <div className="adcard-id">{e.id}</div>
              <div className="adcard-name">{e.nombre_nivel} · {e.test}</div>
              <div className="adcard-rows">
                <div><span>Libro (interno)</span>{e.libro}</div>
                <div><span>Units</span>{e.units}</div>
                <div><span>Lección</span>{e.leccion}</div>
                <div><span>Valor (plan)</span>{e.ponderacion_por_plan.con_ina}% / {e.ponderacion_por_plan.sin_ina}%</div>
                <div><span>Listening A</span><code className="vid-id">{e.videos.listening_A}</code></div>
                <div><span>Listening B</span><code className="vid-id">{e.videos.listening_B}</code></div>
                <div><span>Opción examen</span>{e.opcion}</div>
                <div><span>Answer key</span>{e.estado==='real'?'incluida':'pendiente'}</div>
              </div>
              <div className="adcard-foot">
                {e.estado==='real'
                  ? <><button className="btn-sm" onClick={()=>onPreview(e)}>Preview / Admin →</button><button className="ad-meta-btn" onClick={()=>setSel(e)}>Metadatos</button></>
                  : <span className="adcard-pendmsg">Sin contenido — no inventar preguntas</span>}
              </div>
            </div>
          );
        })}
      </div>

      {sel && <MetaModal e={sel} onClose={()=>setSel(null)} />}
    </div>
  );
}

function MetaModal({ e, onClose }) {
  const t = NIVEL_TEMA[e.nivel];
  const exam = (window.EXAMS || {})[e.id] || null;
  const secs = exam ? exam.sections : [];
  const secLetters = secs.map(s => s.letter);
  const secRange = secLetters.length ? `${secLetters[0]}–${secLetters[secLetters.length-1]} (${secLetters.length})` : '—';
  const revSecs = secs.filter(s => s.needsReview).map(s => s.letter);
  const meta = {
    id_examen:e.id, nivel:e.nivel, nombre_nivel:e.nombre_nivel, libro:e.libro,
    test:e.test, units:e.units, leccion:e.leccion, tipo:e.tipo,
    opcion:e.opcion,  // Opción A/B del EXAMEN (reposición/anti-trampa)
    estado:e.estado, oficial:e.oficial, contenido_real:e.contenido_real,
    puntos_totales:e.puntos_totales, color_nivel:e.color_nivel,
    ponderacion_configurable:e.ponderacion_configurable,
    ponderacion_fuente:e.ponderacion_fuente,
    ponderacion_por_plan:e.ponderacion_por_plan,  // { con_ina, sin_ina }
    fuente_original:e.fuente_original, answer_key_fuente:e.answer_key_fuente,
    audio_script_fuente:e.audio_script_fuente,
    videos:e.videos,  // listening_A / listening_B (sección del audio)
  };
  return (
    <div className="exov" onClick={onClose}>
      <div className="exov-card meta-card" onClick={ev=>ev.stopPropagation()}>
        <div className="exov-h"><h3>Metadatos · {e.id}</h3><button className="exov-x" onClick={onClose}>✕</button></div>
        <pre className="meta-json">{JSON.stringify(meta, null, 2)}</pre>
        <div className="meta-report">
          <b>Reporte de conversión</b>
          <ul>
            <li>Fuente Word/PDF: {e.fuente_original}</li>
            <li>Nivel detectado en archivo: "Test A · Interchange 3" (título del documento)</li>
            <li>Nivel final usado: <b>{e.nombre_nivel} ({e.nivel})</b> — el libro {t.libro} manda sobre el título</li>
            <li>Test: {e.test} · {e.units} · Lección {e.leccion}</li>
            <li>Total de puntos: {e.puntos_totales} · Secciones: {secRange}</li>
            <li>Videos: listening_A <code className="vid-id">{e.videos.listening_A}</code> · listening_B <code className="vid-id">{e.videos.listening_B}</code></li>
            <li>Ponderación: {e.ponderacion_por_plan.con_ina}% CON INA / {e.ponderacion_por_plan.sin_ina}% SIN INA (configurable por plan)</li>
            <li>Dudas detectadas: {revSecs.length ? `secciones ${revSecs.join(', ')} marcadas "requiere revisión docente" (respuestas con variación)` : 'ninguna'}</li>
            <li>Contenido inventado: <b>ninguno</b> — transcripción 1:1 del original. Sin mezclar otros exámenes.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StudentMode, TeacherMode, AdminMode, themedExam, getExam, examIdDe });
