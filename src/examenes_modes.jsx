/* global React, NIVEL_TEMA, CATALOGO, EXAM_I2_T1_A, SUBMISSION_DEMO,
   ExamShell, examQuestions, evalQuestion, getMatchVal */
// ──────────────────────────────────────────────────────────────────────────
// examenes_modes.jsx — Estudiante / Profesor / Administrador + barra de
// control (auditoría). Maqueta interactiva, sin backend, sin guardar notas.
// ──────────────────────────────────────────────────────────────────────────
const { useState, useMemo, useCallback, useEffect } = React;

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
          <button className="btn-ghost" disabled title="Pendiente de backend">Guardar avance · pendiente backend</button>
          <button className="btn-primary" disabled title="Pendiente de backend">Enviar examen · pendiente backend</button>
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
        No es posible escoger otro examen ni cambiar de opción. El envío real queda pendiente
        de backend; esta pantalla no guarda entregas todavía.
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
      <div className="tch-note"><b>Vista docente de revisión visual.</b> Esta bandeja usa entregas de demostración para validar interfaz y corrección preliminar. No consulta estudiantes reales, no guarda borradores y no envía notas a <b>Mis Notas</b>.</div>
      <TeacherBackendReviewPanel />
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

        <button className="btn-ghost" disabled title="Pendiente de backend">Guardar borrador · pendiente backend</button>
        <button className={`btn-close${closed?' done':''}`} disabled={closed} onClick={()=>setClosed(true)}>
          {closed ? '✓ Cierre local previsualizado' : 'Previsualizar cierre local'}
        </button>
        {closed && <div className="rev-closed">Nota <b>{note100}</b> previsualizada localmente. No se guardó, no se cerró en servidor y no se envió a <b>Mis Notas</b>.</div>}
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



function testCodeFromLeccion(leccion) {
  return Number(leccion) === 18 ? 'TEST1' : 'TEST2';
}

function leccionFromTestCode(test) {
  return test === 'TEST2' ? 32 : 18;
}

function getExamParentSession() {
  try {
    if (!window.parent || window.parent === window) return null;
    if (typeof window.parent.getSesion !== 'function') return null;
    return window.parent.getSesion();
  } catch (_) {
    return null;
  }
}

function getExamParentToken() {
  try {
    if (window.parent && window.parent !== window && typeof window.parent.getSessionToken === 'function') {
      return window.parent.getSessionToken() || '';
    }
  } catch (_) {}
  const ses = getExamParentSession();
  return ses && typeof ses.token === 'string' ? ses.token : '';
}

function getExamAppsScriptUrl() {
  try {
    if (window.parent && window.parent !== window && window.parent.APPS_SCRIPT_URL) return window.parent.APPS_SCRIPT_URL;
  } catch (_) {}
  return window.APPS_SCRIPT_URL || '';
}

async function postExamBackend(fn, payload = {}) {
  const url = getExamAppsScriptUrl();
  const token = getExamParentToken();
  if (!url) return { ok:false, error:'apps_script_url_no_disponible', mensaje:'No se encontró APPS_SCRIPT_URL desde el campus padre.' };
  if (!token) return { ok:false, error:'token_no_disponible', mensaje:'No se encontró token de sesión admin/superadmin.' };
  try {
    const res = await fetch(`${url}?fn=${encodeURIComponent(fn)}`, {
      method:'POST',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body:JSON.stringify(Object.assign({ fn, token }, payload || {})),
    });
    return await res.json();
  } catch (e) {
    return { ok:false, error:'conexion', mensaje:e && e.message ? e.message : String(e) };
  }
}

function normalizeBackendDate(v) {
  return String(v || '').replace('T', ' ').trim();
}

function normalizeBackendPlan(v) {
  return String(v || '').toUpperCase().replace(/\s+/g, '_');
}

function normalizeBackendTipo(v) {
  return String(v || '').toUpperCase().replace(/\s+/g, '_');
}

function statusClass(st) {
  return String(st || 'DRAFT').toLowerCase();
}

function ActivationBackendPanel({ onPreview }) {
  const [open, setOpen] = useState(true);
  const [grupo, setGrupo] = useState('');
  const [nivel, setNivel] = useState('B1');
  const [test, setTest] = useState('TEST1');
  const [opcion, setOpcion] = useState('A');
  const [plan, setPlan] = useState('CON_INA');
  const [tipo, setTipo] = useState('ORDINARIO');
  const [abre, setAbre] = useState('');
  const [cierra, setCierra] = useState('');
  const [timeLimit, setTimeLimit] = useState(90);
  const [allowLate, setAllowLate] = useState('NO');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const session = getExamParentSession() || {};
  const isSuper = String(session.rol || '').toLowerCase() === 'superadmin';

  const leccion = leccionFromTestCode(test);
  const entry = CATALOGO.find(e => e.nivel === nivel && e.leccion === leccion && e.opcion === opcion) || null;
  const exam = entry && window.EXAMS ? window.EXAMS[entry.id] : null;
  const tema = NIVEL_TEMA[nivel];
  const valor = entry ? planValor(entry.ponderacion_por_plan, plan.toLowerCase()) : '—';

  const payload = () => ({
    cod_grupo: grupo.trim(),
    nivel,
    test_code: test,
    leccion,
    opcion,
    plan: normalizeBackendPlan(plan),
    tipo: normalizeBackendTipo(tipo),
    open_at: normalizeBackendDate(abre),
    close_at: normalizeBackendDate(cierra),
    time_limit_min: Number(timeLimit) || 90,
    allow_late: allowLate,
    max_attempts: 1,
    notes: notes.trim(),
  });

  const warnings = [];
  if (!grupo.trim()) warnings.push('Grupo requerido para guardar activación real.');
  if (!abre || !cierra) warnings.push('Apertura y cierre requeridos para operación real.');
  if (!exam) warnings.push('No hay contenido oficial para esta combinación.');
  if (opcion === 'B' && tipo === 'ORDINARIO') warnings.push('Opción B ordinaria debe usarse solo si administración lo autoriza.');

  const setResult = (r, okMsg) => {
    if (r && r.ok) {
      setErr('');
      setMsg(okMsg || r.mensaje || 'Operación realizada.');
    } else {
      setMsg('');
      const detail = r && (r.mensaje || r.error || (r.errores && r.errores.join(' · ')));
      setErr(detail || 'No se pudo completar la operación.');
    }
  };

  const loadRows = async () => {
    setLoading(true); setErr('');
    const r = await postExamBackend('examListActivations', {});
    setLoading(false);
    if (r && r.ok) { setRows(Array.isArray(r.rows) ? r.rows.reverse() : []); setMsg(`Activaciones cargadas: ${r.total || 0}`); }
    else setResult(r);
  };

  useEffect(() => { if (open) loadRows(); }, []);

  const setupSheets = async () => {
    setLoading(true);
    const r = await postExamBackend('examSetupSheets', {});
    setLoading(false);
    setResult(r, 'Hojas de exámenes verificadas/creadas.');
    if (r && r.ok) loadRows();
  };

  const createActivation = async (status) => {
    if (warnings.length) { setErr('No guardé: ' + warnings.join(' ')); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examCreateActivation', Object.assign(payload(), { status }));
    setLoading(false);
    setResult(r, `Activación ${status} creada correctamente.`);
    if (r && r.ok) loadRows();
  };

  const changeStatus = async (fn, id, label) => {
    if (!id) return;
    setLoading(true);
    const r = await postExamBackend(fn, { activation_id:id });
    setLoading(false);
    setResult(r, label);
    if (r && r.ok) loadRows();
  };

  return (
    <div className="actbox" style={{ '--lvl':tema.color, '--lvl-soft':tema.soft, '--lvl-ink':tema.ink }}>
      <button className="actbox-h" onClick={()=>setOpen(v=>!v)}>
        <div>
          <div className="actbox-k">ACTIVACIONES DE EXÁMENES · BACKEND V10F</div>
          <div className="actbox-t">Crear, listar, abrir y cerrar activaciones reales</div>
          <div className="actbox-s">Conecta con backend V10F en CAMPUS_OPERATIVO. No habilita estudiante y no envía notas.</div>
        </div>
        <span className="actbox-state">Backend conectado</span>
        <span className="pmodel-chev">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="actbox-body actbox-body-live">
          <div>
            <div className="actform">
              <label><span>Grupo</span><input value={grupo} onChange={e=>setGrupo(e.target.value)} placeholder="Ej. B1-LM6A9-C32026-001" /></label>
              <label><span>Nivel</span><select value={nivel} onChange={e=>setNivel(e.target.value)}>{Object.keys(NIVEL_TEMA).map(k=><option key={k} value={k}>{k} · {NIVEL_TEMA[k].nombre}</option>)}</select></label>
              <label><span>Prueba</span><select value={test} onChange={e=>setTest(e.target.value)}><option value="TEST1">Test 1 · Lección 18</option><option value="TEST2">Test 2 · Lección 32</option></select></label>
              <label><span>Opción</span><select value={opcion} onChange={e=>setOpcion(e.target.value)}><option value="A">A · ordinaria</option><option value="B">B · reposición/caso autorizado</option></select></label>
              <label><span>Plan</span><select value={plan} onChange={e=>setPlan(e.target.value)}><option value="CON_INA">CON INA · 5%</option><option value="SIN_INA">SIN INA · 15%</option></select></label>
              <label><span>Tipo</span><select value={tipo} onChange={e=>setTipo(e.target.value)}><option value="ORDINARIO">Ordinario</option><option value="REPOSICION">Reposición</option><option value="EXTRAORDINARIO">Extraordinario</option></select></label>
              <label><span>Apertura</span><input type="datetime-local" value={abre} onChange={e=>setAbre(e.target.value)} /></label>
              <label><span>Cierre</span><input type="datetime-local" value={cierra} onChange={e=>setCierra(e.target.value)} /></label>
              <label><span>Tiempo límite</span><input type="number" min="1" value={timeLimit} onChange={e=>setTimeLimit(e.target.value)} /></label>
              <label><span>Entrega tardía</span><select value={allowLate} onChange={e=>setAllowLate(e.target.value)}><option value="NO">NO</option><option value="SI">SI</option></select></label>
            </div>
            <label className="actnotes"><span>Notas internas</span><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Observación administrativa opcional" /></label>
          </div>

          <div className="actsummary">
            <div className="actpick">
              <span className="adcard-lvl">{tema.code}</span>
              <span className={`mini-opt opt-${opcion}`}>{opcion}</span>
              <b>{entry ? entry.id : 'SIN EXAMEN'}</b>
            </div>
            <div className="actgrid">
              <div><span>Contenido</span><b>{exam ? 'oficial' : 'no disponible'}</b></div>
              <div><span>Valor</span><b>{valor}</b></div>
              <div><span>Backend</span><b>V10F</b></div>
              <div><span>Estudiante</span><b>Cerrado</b></div>
            </div>
            <div className="actwarns">
              {warnings.map((w,i)=><div key={i}>⚠ {w}</div>)}
              <div>🔒 Esta conexión solo administra activaciones. No abre exámenes al estudiante.</div>
            </div>
            {msg && <div className="ex-okmsg">✓ {msg}</div>}
            {err && <div className="ex-errmsg">⚠ {err}</div>}
            <div className="actactions">
              <button className="btn-sm" disabled={!exam} onClick={()=>entry && onPreview(entry)}>Preview admin</button>
              <button className="btn-sm" disabled={loading} onClick={setupSheets}>Verificar hojas</button>
              <button className="btn-sm" disabled={loading || warnings.length>0} onClick={()=>createActivation('DRAFT')}>Guardar DRAFT</button>
              <button className="btn-sm" disabled={loading || warnings.length>0} onClick={()=>createActivation('SCHEDULED')}>Guardar SCHEDULED</button>
              <button className="ad-meta-btn" disabled={loading || warnings.length>0} onClick={()=>createActivation('OPEN')}>Crear y abrir OPEN</button>
              <button className="ad-meta-btn" disabled={loading} onClick={loadRows}>Refrescar lista</button>
            </div>
          </div>

          <div className="actlist">
            <div className="actlist-h">
              <b>Activaciones registradas</b>
              <span>{loading ? 'Cargando…' : `${rows.length} filas`}</span>
            </div>
            <div className="acttable-wrap">
              <table className="acttable">
                <thead><tr><th>Estado</th><th>Grupo</th><th>Examen</th><th>Ventana</th><th>Tipo</th><th>Acciones</th></tr></thead>
                <tbody>
                  {!rows.length && <tr><td colSpan="6" className="actempty">Sin activaciones registradas todavía.</td></tr>}
                  {rows.map((r,i)=>{
                    const id = r.ACTIVATION_ID || r.activation_id;
                    const st = r.STATUS || 'DRAFT';
                    return <tr key={id || i}>
                      <td><span className={`actstatus ${statusClass(st)}`}>{st}</span></td>
                      <td><b>{r.COD_GRUPO || '—'}</b><small>{r.NIVEL || '—'} · {r.PLAN || '—'}</small></td>
                      <td><code>{r.EXAM_ID || '—'}</code><small>{r.TEST_CODE || '—'} · Op. {r.OPCION || '—'}</small></td>
                      <td><small>{r.OPEN_AT || 'sin apertura'}</small><small>{r.CLOSE_AT || 'sin cierre'}</small></td>
                      <td>{r.TIPO || '—'}</td>
                      <td className="actrow-actions">
                        {st !== 'OPEN' && st !== 'CLOSED' && st !== 'CANCELLED' && <button onClick={()=>changeStatus('examOpenActivation', id, 'Activación abierta.')} disabled={loading}>Abrir</button>}
                        {st === 'OPEN' && <button onClick={()=>changeStatus('examCloseActivation', id, 'Activación cerrada.')} disabled={loading}>Cerrar</button>}
                        {isSuper && st !== 'CANCELLED' && <button onClick={()=>changeStatus('examCancelActivation', id, 'Activación cancelada.')} disabled={loading}>Cancelar</button>}
                      </td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function parseJsonMaybe(text) {
  if (!text) return null;
  if (typeof text === 'object') return text;
  try { return JSON.parse(String(text)); } catch (_) { return null; }
}

function compactDate(v) {
  return String(v || '—').replace('T', ' ').replace(/\.000Z$/, '');
}

function attemptStatusClass(st) {
  return String(st || 'STARTED').toLowerCase();
}

function BackendOperationsPanel() {
  const [open, setOpen] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [attemptId, setAttemptId] = useState('');
  const [selected, setSelected] = useState(null);
  const [review, setReview] = useState(null);
  const [publicExamId, setPublicExamId] = useState('B1_WRITTEN_L18_TEST1_A');
  const [publicPlan, setPublicPlan] = useState('CON_INA');
  const [publicPayload, setPublicPayload] = useState(null);
  const [reviewDraft, setReviewDraft] = useState({ final_score_100:'', comments:'', student_feedback:'' });

  const setResult = (r, okMsg) => {
    if (r && r.ok) { setErr(''); setMsg(okMsg || r.mensaje || 'Operación realizada.'); }
    else { setMsg(''); setErr((r && (r.mensaje || r.error)) || 'No se pudo completar la operación.'); }
  };

  const loadAttempts = async () => {
    setLoading(true);
    const r = await postExamBackend('examListAttempts', {});
    setLoading(false);
    if (r && r.ok) { setAttempts(Array.isArray(r.rows) ? r.rows.reverse() : []); setMsg(`Intentos cargados: ${r.total || 0}`); setErr(''); }
    else setResult(r);
  };

  const loadReviews = async () => {
    setLoading(true);
    const r = await postExamBackend('examListReviews', {});
    setLoading(false);
    if (r && r.ok) { setReviews(Array.isArray(r.rows) ? r.rows.reverse() : []); setMsg(`Revisiones cargadas: ${r.total || 0}`); setErr(''); }
    else setResult(r);
  };

  const inspectAttempt = async (id) => {
    const target = String(id || attemptId || '').trim();
    if (!target) { setErr('Indicá ATTEMPT_ID para inspeccionar.'); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examGetAttempt', { attempt_id: target });
    setLoading(false);
    if (r && r.ok) { setSelected(r.attempt || null); setAttemptId(target); setErr(''); setMsg('Intento cargado para inspección admin.'); }
    else setResult(r);
  };

  const createReview = async (id) => {
    const target = String(id || attemptId || '').trim();
    if (!target) { setErr('Indicá ATTEMPT_ID para crear revisión.'); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examCreateReviewDraft', { attempt_id: target });
    setLoading(false);
    if (r && r.ok) { setReview(r.review || null); setAttemptId(target); setErr(''); setMsg('Borrador de revisión creado/recuperado.'); loadReviews(); }
    else setResult(r);
  };

  const saveReview = async () => {
    const rid = review && review.REVIEW_ID;
    if (!rid) { setErr('Primero creá o cargá una revisión.'); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examSaveReviewDraft', {
      review_id: rid,
      final_score_100: reviewDraft.final_score_100,
      comments: reviewDraft.comments,
      student_feedback: reviewDraft.student_feedback,
      manual_adjustments_json: { source:'admin_panel_v10f', note:'draft only' },
    });
    setLoading(false);
    if (r && r.ok) { setReview(r.review || review); setErr(''); setMsg('Borrador de revisión guardado en backend. No se envió a Mis Notas.'); loadReviews(); }
    else setResult(r);
  };

  const closeReview = async () => {
    const rid = review && review.REVIEW_ID;
    if (!rid) { setErr('Primero creá o cargá una revisión.'); setMsg(''); return; }
    if (reviewDraft.final_score_100 === '') { setErr('Para cerrar, indicá nota final 0–100.'); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examCloseReview', {
      review_id: rid,
      final_score_100: reviewDraft.final_score_100,
      comments: reviewDraft.comments,
      student_feedback: reviewDraft.student_feedback,
      manual_adjustments_json: { source:'admin_panel_v10f', note:'closed without Mis Notas push' },
    });
    setLoading(false);
    if (r && r.ok) { setReview(r.review || review); setErr(''); setMsg('Revisión cerrada en backend. Mis Notas sigue desconectado.'); loadReviews(); }
    else setResult(r);
  };

  const loadPublicPayload = async () => {
    const target = String(publicExamId || '').trim();
    if (!target) { setErr('Indicá EXAM_ID para probar payload público.'); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examGetPublicExamPayload', { exam_id: target, plan: publicPlan });
    setLoading(false);
    if (r && r.ok) {
      setPublicPayload(r.public_exam || null);
      const raw = JSON.stringify(r.public_exam || {});
      const leaked = /correct|accepted|audioScript|answer_key|answers/i.test(raw);
      setErr(leaked ? 'Alerta: el payload contiene una palabra sensible. Revisar antes de habilitar estudiante.' : '');
      setMsg(leaked ? '' : 'Payload público V10G cargado sin keys evidentes.');
    } else setResult(r);
  };

  return (
    <div className="opsbox">
      <button className="opsbox-h" onClick={()=>setOpen(v=>!v)}>
        <div>
          <div className="opsbox-k">OPERACIÓN BACKEND · V10G</div>
          <div className="opsbox-t">Intentos y revisiones reales</div>
          <div className="opsbox-s">Lee intentos/revisiones y permite preparar revisión admin. No habilita estudiantes, conecta payload público sanitizado y no conecta Mis Notas.</div>
        </div>
        <span className="opsbox-state">Monitoreo seguro</span>
        <span className="pmodel-chev">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="opsbox-body">
          <div className="ops-actions">
            <button className="btn-sm" disabled={loading} onClick={loadAttempts}>Listar intentos</button>
            <button className="btn-sm" disabled={loading} onClick={loadReviews}>Listar revisiones</button>
            <label><span>ATTEMPT_ID</span><input value={attemptId} onChange={e=>setAttemptId(e.target.value)} placeholder="ATT-..." /></label>
            <button className="btn-sm" disabled={loading} onClick={()=>inspectAttempt()}>Inspeccionar intento</button>
            <button className="ad-meta-btn" disabled={loading} onClick={()=>createReview()}>Crear/abrir revisión</button>
          </div>
          <div className="ops-warning">
            <b>Regla de seguridad:</b> esta sección no publica exámenes, no crea intentos estudiantiles y no envía notas a Mis Notas. Solo opera sobre datos que ya existan en backend.
          </div>

          <div className="public-payload-box">
            <div className="public-payload-head">
              <b>Payload público estudiante · V10G</b>
              <span>Prueba sanitizada sin correct, accepted, audioScript, scripts ni keys</span>
            </div>
            <div className="ops-actions compact">
              <label><span>EXAM_ID</span><input value={publicExamId} onChange={e=>setPublicExamId(e.target.value)} placeholder="B1_WRITTEN_L18_TEST1_A" /></label>
              <label><span>Plan</span><select value={publicPlan} onChange={e=>setPublicPlan(e.target.value)}><option value="CON_INA">CON INA · 5%</option><option value="SIN_INA">SIN INA · 15%</option></select></label>
              <button className="btn-sm" disabled={loading} onClick={loadPublicPayload}>Probar payload público</button>
            </div>
            {publicPayload && (
              <div className="public-payload-result">
                <div><b>{publicPayload.id || publicPayload.exam_id}</b><span>{publicPayload.sections ? publicPayload.sections.length : 0} secciones · peso {publicPayload.weight_percent}%</span></div>
                <pre>{JSON.stringify({ id: publicPayload.id || publicPayload.exam_id, nivel: publicPayload.nivel, sections: publicPayload.sections ? publicPayload.sections.length : 0, payload_scope: publicPayload.payload_scope, security_note: publicPayload.security_note }, null, 2)}</pre>
              </div>
            )}
          </div>

          {msg && <div className="ex-okmsg">✓ {msg}</div>}
          {err && <div className="ex-errmsg">⚠ {err}</div>}

          <div className="ops-grid">
            <div className="ops-card">
              <div className="ops-card-h"><b>Intentos</b><span>{attempts.length}</span></div>
              <div className="opstable-wrap">
                <table className="opstable">
                  <thead><tr><th>Estado</th><th>Estudiante</th><th>Examen</th><th>Enviado</th><th></th></tr></thead>
                  <tbody>
                    {!attempts.length && <tr><td colSpan="5" className="actempty">Sin intentos registrados.</td></tr>}
                    {attempts.slice(0, 12).map((r,i)=>{
                      const id = r.ATTEMPT_ID || '';
                      return <tr key={id || i}>
                        <td><span className={`actstatus ${attemptStatusClass(r.STATUS)}`}>{r.STATUS || '—'}</span></td>
                        <td><b>{r.NOMBRE || '—'}</b><small>{r.CODIGO || '—'} · {r.COD_GRUPO || '—'}</small></td>
                        <td><code>{r.EXAM_ID || '—'}</code><small>{r.NIVEL || '—'} · {r.WEIGHT_PERCENT || '—'}%</small></td>
                        <td><small>{compactDate(r.SUBMITTED_AT)}</small></td>
                        <td><button onClick={()=>inspectAttempt(id)} disabled={loading}>Ver</button></td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="ops-card">
              <div className="ops-card-h"><b>Revisiones</b><span>{reviews.length}</span></div>
              <div className="opstable-wrap">
                <table className="opstable">
                  <thead><tr><th>Estado</th><th>Intento</th><th>Nota</th><th>Locked</th></tr></thead>
                  <tbody>
                    {!reviews.length && <tr><td colSpan="4" className="actempty">Sin revisiones registradas.</td></tr>}
                    {reviews.slice(0, 12).map((r,i)=><tr key={r.REVIEW_ID || i}>
                      <td><span className={`actstatus ${attemptStatusClass(r.REVIEW_STATUS)}`}>{r.REVIEW_STATUS || '—'}</span></td>
                      <td><code>{r.ATTEMPT_ID || '—'}</code><small>{r.REVIEWER_ROLE || '—'} · {compactDate(r.REVIEWED_AT)}</small></td>
                      <td><b>{r.FINAL_SCORE_100 || '—'}</b><small>{r.WEIGHTED_SCORE || '—'} pond.</small></td>
                      <td>{r.LOCKED || 'NO'}</td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {(selected || review) && <div className="ops-detail">
            {selected && <div className="ops-json"><h4>Intento seleccionado</h4><pre>{JSON.stringify(Object.assign({}, selected, { ANSWERS_JSON: parseJsonMaybe(selected.ANSWERS_JSON) || selected.ANSWERS_JSON }), null, 2)}</pre></div>}
            <div className="ops-reviewbox">
              <h4>Revisión admin · preparación</h4>
              {review ? <div className="ops-mini"><b>{review.REVIEW_ID}</b><span>{review.REVIEW_STATUS}</span></div> : <p>No hay revisión cargada todavía.</p>}
              <label><span>Nota final 0–100</span><input type="number" min="0" max="100" value={reviewDraft.final_score_100} onChange={e=>setReviewDraft(d=>Object.assign({}, d, { final_score_100:e.target.value }))} /></label>
              <label><span>Comentarios internos</span><textarea value={reviewDraft.comments} onChange={e=>setReviewDraft(d=>Object.assign({}, d, { comments:e.target.value }))} /></label>
              <label><span>Feedback estudiante</span><textarea value={reviewDraft.student_feedback} onChange={e=>setReviewDraft(d=>Object.assign({}, d, { student_feedback:e.target.value }))} /></label>
              <div className="ops-actions tight">
                <button className="btn-sm" disabled={loading || !review} onClick={saveReview}>Guardar borrador backend</button>
                <button className="ad-meta-btn" disabled={loading || !review} onClick={closeReview}>Cerrar revisión backend</button>
              </div>
              <div className="ops-warning small">Cerrar revisión bloquea la revisión en backend, pero todavía no existe push a Mis Notas en esta fase.</div>
            </div>
          </div>}
        </div>
      )}
    </div>
  );
}

function TeacherBackendReviewPanel() {
  const [open, setOpen] = useState(false);
  const [grupo, setGrupo] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const load = async () => {
    const g = grupo.trim();
    if (!g) { setErr('Indicá un grupo para consultar revisiones reales.'); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examListReviews', { cod_grupo:g });
    setLoading(false);
    if (r && r.ok) { setRows(Array.isArray(r.rows) ? r.rows : []); setErr(''); setMsg(`Revisiones reales encontradas: ${r.total || 0}`); }
    else { setRows([]); setMsg(''); setErr((r && (r.mensaje || r.error)) || 'No se pudo consultar backend.'); }
  };
  return (
    <div className="tch-realbox">
      <button className="tch-realbox-h" onClick={()=>setOpen(v=>!v)}>
        <div><b>Backend real · V10F</b><span>Consulta controlada de revisiones por grupo</span></div>
        <span>{open ? '▴' : '▾'}</span>
      </button>
      {open && <div className="tch-realbox-b">
        <div className="tch-realrow">
          <input value={grupo} onChange={e=>setGrupo(e.target.value)} placeholder="Código de grupo" />
          <button className="btn-sm" disabled={loading} onClick={load}>Consultar revisiones</button>
        </div>
        <div className="tch-note compact"><b>No es operación de notas todavía.</b> Si el backend responde bloqueo por configuración, está correcto mientras la revisión real siga deshabilitada.</div>
        {msg && <div className="ex-okmsg">✓ {msg}</div>}
        {err && <div className="ex-errmsg">⚠ {err}</div>}
        <div className="tch-real-list">
          {!rows.length && <div className="actempty">Sin revisiones reales para mostrar.</div>}
          {rows.map((r,i)=><div className="tch-real-item" key={r.REVIEW_ID || i}>
            <b>{r.REVIEW_ID || 'REV'}</b>
            <span>{r.REVIEW_STATUS || '—'} · intento {r.ATTEMPT_ID || '—'}</span>
            <em>Nota {r.FINAL_SCORE_100 || '—'} · locked {r.LOCKED || 'NO'}</em>
          </div>)}
        </div>
      </div>}
    </div>
  );
}


function BackendContractSpecPanel() {
  const [open, setOpen] = useState(false);
  const requiredFields = [
    ['activation_id', 'ID único generado por backend; nunca por URL ni por estudiante.'],
    ['grupo_codigo', 'Código del grupo activo que recibirá el examen.'],
    ['nivel', 'B1/B2/I1/I2 tomado del grupo o del plan académico, no editable por estudiante.'],
    ['exam_id', 'Debe existir en CATALOGO y en EXAMS para activación real.'],
    ['opcion', 'A ordinaria o B reposición/caso autorizado.'],
    ['plan_academico', 'con_ina/sin_ina para resolver ponderación 5%/15%.'],
    ['tipo_activacion', 'ordinario/reposicion/extraordinario.'],
    ['apertura/cierre', 'Ventana válida; backend bloquea fuera de horario.'],
    ['created_by', 'Usuario admin/superadmin que creó la activación.'],
    ['estado', 'draft/scheduled/open/closed/cancelled.'],
  ];
  const validations = [
    'No aceptar nivel/test/opción enviados por estudiante como fuente de verdad.',
    'No publicar si exam_id no existe como contenido oficial real.',
    'No permitir Opción B para ordinario salvo autorización explícita.',
    'No crear más de un intento abierto por estudiante y activación.',
    'No enviar nota a Mis Notas hasta cierre docente confirmado.',
    'Registrar auditoría de creación, apertura, cierre, revisión y cambios manuales.',
  ];
  const lifecycle = [
    ['DRAFT', 'Admin prepara activación; no visible para estudiantes.'],
    ['SCHEDULED', 'Guardada con fechas futuras; todavía cerrada.'],
    ['OPEN', 'Backend entrega payload estudiante sin claves ni scripts.'],
    ['SUBMITTED', 'Estudiante envía intento; queda pendiente de revisión.'],
    ['REVIEWED', 'Docente revisa y pre-cierra calificación.'],
    ['CLOSED', 'Admin/docente autorizado cierra y sincroniza con Mis Notas.'],
  ];
  return (
    <div className="specbox">
      <button className="specbox-h" onClick={()=>setOpen(v=>!v)}>
        <div>
          <div className="specbox-k">ESPECIFICACIÓN BACKEND · V9</div>
          <div className="specbox-t">Contrato técnico pendiente antes de habilitar estudiantes</div>
          <div className="specbox-s">Define campos, estados y validaciones. No ejecuta acciones ni guarda datos.</div>
        </div>
        <span className="specbox-state">Diseño interno</span>
        <span className="pmodel-chev">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="specbox-body">
          <div className="speccol">
            <h3>Campos obligatorios</h3>
            <div className="speclist">
              {requiredFields.map(([k,v])=>(
                <div key={k} className="specitem"><code>{k}</code><span>{v}</span></div>
              ))}
            </div>
          </div>
          <div className="speccol">
            <h3>Validaciones mínimas</h3>
            <ul className="specrules">{validations.map((v,i)=><li key={i}>{v}</li>)}</ul>
          </div>
          <div className="specflow">
            <h3>Ciclo recomendado</h3>
            <div className="flowgrid">
              {lifecycle.map(([k,v])=>(
                <div key={k} className="flowstep"><b>{k}</b><span>{v}</span></div>
              ))}
            </div>
          </div>
          <div className="specwarn">
            <b>No habilitar estudiante real todavía.</b> El payload de estudiante debe venir del backend sin <code>correct</code>, sin <code>accepted</code>, sin <code>audioScript</code> y sin metadatos administrativos sensibles.
          </div>
        </div>
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

      <ActivationBackendPanel onPreview={onPreview} />

      <BackendOperationsPanel />

      <BackendContractSpecPanel />

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
