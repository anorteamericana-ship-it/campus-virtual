// CALGRUPO_F51_20260617_INDICE_MAESTRO_CAMPUS_UI
// CALGRUPO_F50_20260617_CIERRE_TECNICO_EXAMENES_UI
// CALGRUPO_F49_20260617_CHECKLIST_QA_FINAL_EXAMENES_UI
// CALGRUPO_F48_20260617_CENTRO_DIAGNOSTICO_EXAMENES_UI
// CALGRUPO_F47_20260617_SENALES_ANTIFRAUDE_EXAMENES_UI
/* global React, NIVEL_TEMA, CATALOGO, EXAM_I2_T1_A, SUBMISSION_DEMO,
   ExamShell, examQuestions, evalQuestion, getMatchVal */
// ──────────────────────────────────────────────────────────────────────────
// examenes_modes.jsx — Estudiante / Profesor / Administrador + barra de
// CALGRUPO_F44_20260617_REVISION_OFICIAL_EXAMENES_MIS_NOTAS_UI
// CALGRUPO_F45_20260617_BANDEJA_REVISION_DOCENTE_ADMIN_UI
// CALGRUPO_F46_20260617_BITACORA_VISUAL_EXAMENES_UI
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

// CALGRUPO_F43_20260617_EXAMENES_ESTUDIANTE_QA_AUTOSAVE_TIMER
function examParseLocalMs(v) {
  const s = String(v || '').trim();
  if (!s) return 0;
  const m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] || 0)).getTime();
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : 0;
}
function examFormatClock(sec) {
  const n = Math.max(0, Number(sec) || 0);
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = n % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// CALGRUPO_F27_20260617_STUDENTMODE_INTENTO_REAL_BACKEND
function StudentMode({ shell, density, nivel='I2', test='TEST1', opcion, plan, examOverride, assignment, backend }) {
  // El sistema YA decidió qué examen le toca (no lo escoge). En F27 se
  // prefiere el payload público recibido desde Apps Script; si no existe,
  // se usa el banco local solo como respaldo visual controlado.
  const exam = examOverride || getExam(nivel, test, opcion);
  const tema = NIVEL_TEMA[nivel] || NIVEL_TEMA['I2'];
  const [stage, setStage] = useState((backend && backend.attemptId) ? 'taking' : 'lobby'); // lobby | taking | sent
  const [answers, setAnswers] = useState(backend && backend.initialAnswers ? backend.initialAnswers : {});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [dirty, setDirty] = useState(false);

  const timeLimitMin = Number((backend && backend.timeLimitMin) || (assignment && assignment.TIME_LIMIT_MIN) || 0) || 0;
  const limitSec = timeLimitMin > 0 ? timeLimitMin * 60 : 0;
  const startedAtText = (backend && backend.startedAt) || '';
  const startMs = useMemo(() => examParseLocalMs(startedAtText) || Date.now(), [startedAtText, backend && backend.attemptId]);
  const elapsedNow = useCallback(() => Math.max(0, Math.floor((Date.now() - startMs) / 1000)), [startMs]);
  const [timeLeftSec, setTimeLeftSec] = useState(() => limitSec ? Math.max(0, limitSec - elapsedNow()) : null);

  const answersRef = React.useRef(answers);
  const dirtyRef = React.useRef(false);
  const savingRef = React.useRef(false);
  const sendingRef = React.useRef(false);
  const lastSavedJsonRef = React.useRef(JSON.stringify(answers || {}));
  const autoSubmitRef = React.useRef(false);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { savingRef.current = saving; }, [saving]);
  useEffect(() => { sendingRef.current = sending; }, [sending]);

  const onAnswer = useCallback((id, v) => {
    setAnswers(a => {
      const next = Object.assign({}, a, { [id]: v });
      answersRef.current = next;
      return next;
    });
    dirtyRef.current = true;
    setDirty(true);
  }, []);

  useEffect(() => {
    if (backend && backend.attemptId && stage === 'lobby') setStage('taking');
  }, [backend && backend.attemptId]);

  useEffect(() => {
    if (stage !== 'taking' || !limitSec) return;
    setTimeLeftSec(Math.max(0, limitSec - elapsedNow()));
  }, [stage, limitSec, startMs]);

  const doSave = useCallback(async (source='manual') => {
    if (!(backend && typeof backend.onSave === 'function') || !(backend && backend.attemptId)) return null;
    if (savingRef.current || sendingRef.current) return null;
    const snapshot = JSON.stringify(answersRef.current || {});
    if (source === 'auto' && (!dirtyRef.current || snapshot === lastSavedJsonRef.current)) return { ok:true, skipped:true };
    setSaving(true);
    setSaveMsg(source === 'auto' ? 'Guardando automáticamente…' : 'Guardando…');
    try {
      const r = await backend.onSave(answersRef.current || {});
      if (r && r.ok) {
        lastSavedJsonRef.current = snapshot;
        dirtyRef.current = false;
        setDirty(false);
        setSaveMsg(source === 'auto' ? 'Guardado automático correcto.' : 'Avance guardado correctamente.');
      } else {
        setSaveMsg((r && (r.mensaje || r.error)) || 'No se pudo guardar.');
      }
      return r;
    } catch (e) {
      setSaveMsg('No se pudo guardar. Revise la conexión.');
      return { ok:false, error:'save_exception' };
    } finally {
      setSaving(false);
    }
  }, [backend && backend.attemptId, backend && backend.onSave]);

  const doSubmit = useCallback(async (auto=false) => {
    if (sendingRef.current) return null;
    if (backend && typeof backend.onSubmit === 'function') {
      setSending(true);
      setSaveMsg(auto ? 'Tiempo agotado. Enviando automáticamente…' : 'Enviando…');
      try {
        const elapsed = limitSec ? Math.min(limitSec, elapsedNow()) : elapsedNow();
        const r = await backend.onSubmit(answersRef.current || {}, { autoSubmit:auto, timeSpentSec:elapsed });
        if (!r || r.ok === false) {
          setSaveMsg((r && (r.mensaje || r.error)) || 'No se pudo enviar el examen.');
          autoSubmitRef.current = false;
          return r;
        }
        dirtyRef.current = false;
        setDirty(false);
        setStage('sent');
        return r;
      } catch (e) {
        setSaveMsg('No se pudo enviar. Revise la conexión.');
        autoSubmitRef.current = false;
        return { ok:false, error:'submit_exception' };
      } finally {
        setSending(false);
      }
    }
    setStage('sent');
    return { ok:true };
  }, [backend && backend.attemptId, backend && backend.onSubmit, limitSec, elapsedNow]);

  useEffect(() => {
    if (stage !== 'taking') return;
    const handler = (e) => {
      if (dirtyRef.current && !sendingRef.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
      return undefined;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'taking' || !(backend && backend.attemptId)) return;
    const t = window.setInterval(() => { doSave('auto'); }, 25000);
    return () => window.clearInterval(t);
  }, [stage, backend && backend.attemptId, doSave]);

  useEffect(() => {
    if (stage !== 'taking' || !limitSec) return;
    const tick = () => {
      const left = Math.max(0, limitSec - elapsedNow());
      setTimeLeftSec(left);
      if (left <= 0 && !autoSubmitRef.current) {
        autoSubmitRef.current = true;
        doSubmit(true);
      }
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [stage, limitSec, elapsedNow, doSubmit]);

  useEffect(() => {
    if (stage !== 'taking' || !(backend && backend.attemptId) || !(backend && typeof backend.onHeartbeat === 'function')) return;
    let cancelled = false;
    const beat = async () => {
      if (sendingRef.current) return;
      try {
        const r = await backend.onHeartbeat();
        if (cancelled) return;
        if (!r || r.ok === false) {
          setSaveMsg((r && (r.mensaje || r.error)) || 'No se pudo validar el estado del intento.');
          return;
        }
        if (typeof r.remaining_sec === 'number') setTimeLeftSec(Math.max(0, r.remaining_sec));
        if (String(r.status || '').toUpperCase() === 'SUBMITTED') {
          dirtyRef.current = false;
          setDirty(false);
          setStage('sent');
          return;
        }
        if (r.should_auto_submit && !autoSubmitRef.current) {
          autoSubmitRef.current = true;
          doSubmit(true);
          return;
        }
        if (r.can_submit === false) setSaveMsg(r.mensaje || 'El intento ya no está disponible para envío.');
      } catch (e) {
        if (!cancelled) setSaveMsg('No se pudo validar el intento con el servidor.');
      }
    };
    beat();
    const t = window.setInterval(beat, 45000);
    return () => { cancelled = true; window.clearInterval(t); };
  }, [stage, backend && backend.attemptId, backend && backend.onHeartbeat, doSubmit]);

  // Sin contenido real — NUNCA carga otro examen.
  if (!exam) {
    return <div className="stwrap"><PendingCard tema={tema} opcion={opcion} /></div>;
  }

  const all = examQuestions(exam);
  const answered = all.filter(({ q, kind, section }) => {
    if (kind === 'match') return getMatchVal(answers, q.n, section.letter) != null;
    return answers[q.id] != null && String(answers[q.id]).trim() !== '';
  }).length;
  const pct = Math.round((answered / Math.max(1, all.length)) * 100);
  const lowTime = limitSec && Number(timeLeftSec) <= 60;

  const handleStart = async () => {
    setSaveMsg('');
    if (backend && typeof backend.onStart === 'function') {
      setSaving(true);
      try {
        const r = await backend.onStart();
        if (!r || r.ok === false) {
          setSaveMsg((r && (r.mensaje || r.error)) || 'No se pudo iniciar el intento.');
          return;
        }
        lastSavedJsonRef.current = JSON.stringify(answersRef.current || {});
        dirtyRef.current = false;
        setDirty(false);
        autoSubmitRef.current = false;
      } finally { setSaving(false); }
    }
    setStage('taking');
  };

  const handleSave = async () => { await doSave('manual'); };

  const handleSubmit = async () => {
    if (!window.confirm('¿Enviar examen ahora? Después de enviarlo no podrás editar tus respuestas.')) return;
    await doSubmit(false);
  };

  if (stage === 'lobby') {
    return <div className="stwrap">
      <AssignmentCard exam={exam} tema={tema} opcion={opcion} plan={plan} assignment={assignment} backend={backend} onStart={handleStart} starting={saving} />
      {saveMsg && <div style={{ maxWidth:680, margin:'12px auto 0', color:'#7A1E2C', fontSize:12.5, textAlign:'center' }}>{saveMsg}</div>}
    </div>;
  }

  if (stage === 'sent') {
    return <div className="stwrap"><SentCard exam={exam} tema={tema} opcion={opcion} plan={plan} attemptId={backend && backend.attemptId} /></div>;
  }

  const metaNombre = assignment && (assignment.NOMBRE || assignment.nombre) || (backend && backend.student && backend.student.nombre) || '';
  const metaGrupo = assignment && (assignment.COD_GRUPO || assignment.grupo) || (backend && backend.student && backend.student.grupo) || '';
  const metaFecha = assignment && assignment.FECHA || new Date().toLocaleDateString('es-CR');

  return (
    <div className="stwrap">
      <div className="sttake">
        <ExamShell exam={exam} answers={answers} onAnswer={onAnswer} mode="student" showKey={false}
                   shell={shell} density={density} plan={plan}
                   meta={{ nombre: metaNombre || 'Estudiante', fecha: metaFecha, grupo: metaGrupo || 'Grupo activo', opcion, scoreLabel:`${answered} / ${all.length} resp.` }} />
      </div>
      <div className="stbar">
        <div className="stbar-prog">
          <div className="stbar-track"><div className="stbar-fill" style={{ width:pct+'%', background:tema.color }} /></div>
          <span>{answered} de {all.length} respondidas · {pct}%</span>
          {limitSec > 0 && <span style={{ marginLeft:10, color:lowTime ? '#7A1E2C' : '#001E47', fontWeight:800 }}>Tiempo: {examFormatClock(timeLeftSec == null ? limitSec : timeLeftSec)}</span>}
          {dirty && <span style={{ marginLeft:10, color:'#7A4A00' }}>Cambios sin guardar</span>}
          {saveMsg && <span style={{ marginLeft:10, color: saveMsg.includes('correct') ? '#1F6B25' : '#7A1E2C' }}>{saveMsg}</span>}
        </div>
        <div className="stbar-actions">
          <button className="btn-ghost" onClick={handleSave} disabled={saving || sending || !(backend && backend.attemptId)}>
            {saving ? 'Guardando…' : 'Guardar avance'}
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={sending || saving || !(backend && backend.attemptId)}>
            {sending ? 'Enviando…' : 'Enviar examen'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignmentCard({ exam, tema, opcion, plan, assignment, backend, onStart, starting }) {
  const cron = assignment && (assignment.CRONOGRAMA || assignment.availability) || null;
  const liveLabel = cron && cron.dia ? `${cron.dia}${cron.turno ? ' · ' + cron.turno : ''}` : 'cronograma activo';
  const intentoTxt = backend && backend.attemptId ? `Intento activo: ${backend.attemptId}` : 'Se creará un intento oficial al iniciar.';
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
        <div><span>Lección</span><b>{exam.leccion} · {liveLabel}</b></div>
        <div><span>Valor</span><b>{planValor(exam.ponderacion_por_plan, plan)}</b></div>
        <div><span>Puntos</span><b>{exam.puntos_totales}</b></div>
      </div>
      <div className="ascard-note">
        Este examen fue asignado automáticamente según tu grupo y el cronograma.
        No es posible escoger otro examen ni cambiar de opción. {intentoTxt}
      </div>
      <button className="btn-primary ascard-go" onClick={onStart} disabled={!!starting}>{starting ? 'Preparando intento…' : 'Iniciar examen'}</button>
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

function SentCard({ exam, tema, opcion, plan, attemptId }) {
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
        {attemptId && <div><span>Intento</span><b>{attemptId}</b></div>}
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
  const [pushOnClose, setPushOnClose] = useState(false);
  const [pushForce, setPushForce] = useState(false);
  const [lastPushResult, setLastPushResult] = useState(null);
  const [inboxRows, setInboxRows] = useState([]);
  const [inboxSummary, setInboxSummary] = useState(null);
  const [inboxFilters, setInboxFilters] = useState({ cod_grupo:'', nivel:'', queue:'NEEDS_ACTION', search:'', limit:'50' });
  const [auditRows, setAuditRows] = useState([]);
  const [auditSummary, setAuditSummary] = useState(null);
  const [auditFilters, setAuditFilters] = useState({ cod_grupo:'', nivel:'', action:'', target_id:'', search:'', limit:'100' });
  const [signalRows, setSignalRows] = useState([]);
  const [signalSummary, setSignalSummary] = useState(null);
  const [signalFilters, setSignalFilters] = useState({ cod_grupo:'', nivel:'', severity:'', type:'', search:'', limit:'100' });
  const [diagResult, setDiagResult] = useState(null);
  const [diagSample, setDiagSample] = useState(false);
  const [qaReady, setQaReady] = useState(null);
  const [closure, setClosure] = useState(null);
  const [masterIndex, setMasterIndex] = useState(null);

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

  const setInboxFilter = (key, value) => {
    setInboxFilters(f => Object.assign({}, f, { [key]: value }));
  };

  const loadInbox = async (patch) => {
    const next = Object.assign({}, inboxFilters, patch || {});
    setInboxFilters(next);
    setLoading(true);
    const payload = {
      cod_grupo: String(next.cod_grupo || '').trim(),
      nivel: next.nivel,
      queue: next.queue,
      search: String(next.search || '').trim(),
      limit: Number(next.limit) || 50
    };
    const r = await postExamBackend('examReviewInbox', payload);
    setLoading(false);
    if (r && r.ok) {
      setInboxRows(Array.isArray(r.rows) ? r.rows : []);
      setInboxSummary(r.summary || null);
      setErr('');
      setMsg(`Bandeja F45 cargada: ${r.total || 0} filas visibles · ${r.summary ? r.summary.needs_action : 0} requieren acción.`);
    } else {
      setInboxRows([]);
      setInboxSummary(null);
      setResult(r);
    }
  };



  const setAuditFilter = (key, value) => {
    setAuditFilters(f => Object.assign({}, f, { [key]: value }));
  };

  const loadAuditTrail = async (patch) => {
    const next = Object.assign({}, auditFilters, patch || {});
    setAuditFilters(next);
    setLoading(true);
    const payload = {
      cod_grupo: String(next.cod_grupo || '').trim(),
      nivel: next.nivel,
      action: String(next.action || '').trim(),
      target_id: String(next.target_id || '').trim(),
      search: String(next.search || '').trim(),
      limit: Number(next.limit) || 100
    };
    const r = await postExamBackend('examAuditTrail', payload);
    setLoading(false);
    if (r && r.ok) {
      setAuditRows(Array.isArray(r.rows) ? r.rows : []);
      setAuditSummary(r.summary || null);
      setErr('');
      setMsg(`Bitácora F46 cargada: ${r.total || 0} logs visibles · ${r.summary ? r.summary.errores : 0} alertas/error.`);
    } else {
      setAuditRows([]);
      setAuditSummary(null);
      setResult(r);
    }
  };


  const setSignalFilter = (key, value) => {
    setSignalFilters(f => Object.assign({}, f, { [key]: value }));
  };

  const loadIntegritySignals = async (patch) => {
    const next = Object.assign({}, signalFilters, patch || {});
    setSignalFilters(next);
    setLoading(true);
    const payload = {
      cod_grupo: String(next.cod_grupo || '').trim(),
      nivel: next.nivel,
      severity: next.severity,
      type: next.type,
      search: String(next.search || '').trim(),
      limit: Number(next.limit) || 100
    };
    const r = await postExamBackend('examIntegritySignals', payload);
    setLoading(false);
    if (r && r.ok) {
      setSignalRows(Array.isArray(r.rows) ? r.rows : []);
      setSignalSummary(r.summary || null);
      setErr('');
      setMsg(`Señales F47 cargadas: ${r.total || 0} visibles · ${r.summary ? ((r.summary.critical || 0) + (r.summary.high || 0)) : 0} altas/críticas.`);
    } else {
      setSignalRows([]);
      setSignalSummary(null);
      setResult(r);
    }
  };


  const loadDiagnosticCenter = async () => {
    setLoading(true);
    const r = await postExamBackend('examDiagnosticCenter', { include_sample: diagSample ? 'SI' : 'NO' });
    setLoading(false);
    if (r && r.ok) {
      setDiagResult(r);
      setErr('');
      const issues = Array.isArray(r.issues) ? r.issues.length : 0;
      const counts = r.counts || {};
      setMsg(`Diagnóstico F48 cargado: ${issues} alertas · ${counts.attempts || 0} intentos · ${counts.reviews || 0} revisiones.`);
    } else {
      setDiagResult(null);
      setResult(r);
    }
  };


  const loadQaReadiness = async () => {
    setLoading(true);
    const r = await postExamBackend('examQaReadiness', { limit: 300 });
    setLoading(false);
    if (r && r.ok) {
      setQaReady(r);
      setErr('');
      const c = r.status_counts || {};
      setMsg(`Checklist F49 cargado: ${r.decision || '—'} · ${c.FAIL || 0} bloqueos · ${c.WARN || 0} advertencias · ${c.MANUAL || 0} manuales.`);
    } else {
      setQaReady(null);
      setResult(r);
    }
  };


  const loadTechnicalClosure = async () => {
    setLoading(true);
    const r = await postExamBackend('examTechnicalClosure', { limit: 300 });
    setLoading(false);
    if (r && r.ok) {
      setClosure(r);
      setErr('');
      const c = r.readiness_counts || {};
      setMsg(`Cierre F50 cargado: ${r.release_decision || '—'} · ${c.FAIL || 0} bloqueos · ${c.WARN || 0} advertencias.`);
    } else {
      setClosure(null);
      setResult(r);
    }
  };



  const loadCampusMasterIndex = async () => {
    setLoading(true);
    const r = await postExamBackend('examCampusMasterIndex', { limit: 300 });
    setLoading(false);
    if (r && r.ok) {
      setMasterIndex(r);
      setErr('');
      setMsg(`Índice F51 cargado: ${r.decision || '—'} · ${(r.campus_areas || []).length} áreas · ${(r.visual_checklist || []).length} puntos visuales.`);
    } else {
      setMasterIndex(null);
      setResult(r);
    }
  };

  const openInboxReview = async (row) => {
    const id = row && row.ATTEMPT_ID;
    if (!id) return;
    setAttemptId(id);
    if (row.REVIEW_ID) await loadReview(id);
    else await createReview(id);
  };

  const pushReviewIdToNotas = async (reviewId, attemptIdValue) => {
    const rid = String(reviewId || '').trim();
    if (!rid) { setErr('No hay REVIEW_ID para enviar a Mis Notas.'); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examPushReviewToNotas', {
      review_id: rid,
      force: pushForce ? 'SI' : 'NO',
      source: 'admin_panel_f45_inbox'
    });
    setLoading(false);
    setLastPushResult(r || null);
    if (r && r.ok) {
      setErr('');
      setMsg(r.already_pushed ? 'Esta revisión ya estaba enviada a Mis Notas.' : 'Revisión enviada a Mis Notas desde bandeja F45.');
      if (attemptIdValue) await loadReview(attemptIdValue);
      await loadInbox();
      loadReviews();
    } else setResult(r);
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

  const loadReview = async (id) => {
    const target = String(id || attemptId || '').trim();
    if (!target) { setErr('Indicá ATTEMPT_ID para cargar revisión.'); setMsg(''); return null; }
    setLoading(true);
    const r = await postExamBackend('examGetReview', { attempt_id: target });
    setLoading(false);
    if (r && r.ok) {
      setReview(r.review || null);
      setSelected(r.attempt || selected);
      setAttemptId(target);
      setReviewDraft({
        final_score_100: r.review && r.review.FINAL_SCORE_100 != null ? String(r.review.FINAL_SCORE_100) : '',
        comments: r.review && r.review.COMMENTS ? String(r.review.COMMENTS) : '',
        student_feedback: r.review && r.review.STUDENT_FEEDBACK ? String(r.review.STUDENT_FEEDBACK) : '',
      });
      setErr('');
      setMsg('Revisión cargada desde backend.');
      return r.review || null;
    }
    setResult(r);
    return null;
  };

  const createReview = async (id) => {
    const target = String(id || attemptId || '').trim();
    if (!target) { setErr('Indicá ATTEMPT_ID para crear revisión.'); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examCreateReviewDraft', { attempt_id: target });
    setLoading(false);
    if (r && r.ok) {
      setAttemptId(target);
      setErr('');
      setMsg(r.existing ? 'Revisión existente recuperada.' : 'Borrador de revisión creado.');
      if (r.review) setReview(r.review);
      else await loadReview(target);
      loadReviews();
    }
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
      manual_adjustments_json: { source:'admin_panel_f45', note:'draft only' },
    });
    setLoading(false);
    if (r && r.ok) { setReview(r.review || review); setErr(''); setMsg('Borrador de revisión guardado en backend.'); loadReviews(); }
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
      push_to_notas: pushOnClose ? 'SI' : 'NO',
      force: pushForce ? 'SI' : 'NO',
      manual_adjustments_json: { source:'admin_panel_f45', note: pushOnClose ? 'closed and requested Mis Notas push' : 'closed without Mis Notas push' },
    });
    setLoading(false);
    if (r && r.ok) {
      setLastPushResult(r.notas || null);
      setErr('');
      setMsg(pushOnClose
        ? (r.pushed_to_notas === 'SI' ? 'Revisión cerrada y enviada a Mis Notas.' : 'Revisión cerrada, pero Mis Notas no confirmó sincronización. Revisá detalle.')
        : 'Revisión cerrada en backend. No se envió a Mis Notas porque no marcaste la opción.');
      await loadReview(attemptId || (review && review.ATTEMPT_ID));
      loadReviews();
    }
    else setResult(r);
  };

  const pushReviewToNotas = async () => {
    const rid = review && review.REVIEW_ID;
    if (!rid) { setErr('Primero cargá una revisión cerrada.'); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examPushReviewToNotas', {
      review_id: rid,
      force: pushForce ? 'SI' : 'NO',
      source: 'admin_panel_f45_push_button'
    });
    setLoading(false);
    setLastPushResult(r || null);
    if (r && r.ok) {
      setErr('');
      setMsg(r.already_pushed ? 'Esta revisión ya estaba enviada a Mis Notas.' : 'Revisión enviada a Mis Notas.');
      await loadReview(attemptId || (review && review.ATTEMPT_ID));
      loadReviews();
    } else setResult(r);
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
          <div className="opsbox-k">OPERACIÓN BACKEND · F51</div>
          <div className="opsbox-t">Bandeja + bitácora + diagnóstico + checklist + cierre + índice maestro</div>
          <div className="opsbox-s">Une intentos, revisiones, Mis Notas, auditoría, señales, diagnóstico, cierre técnico e inventario visual GitHub.</div>
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
            <button className="btn-sm" disabled={loading} onClick={()=>loadReview()}>Cargar revisión</button>
          </div>
          <div className="ops-warning">
            <b>Regla de seguridad:</b> esta sección no publica exámenes ni crea intentos estudiantiles. Mis Notas solo se toca si la revisión está cerrada y marcás la sincronización explícitamente.
          </div>

          <div className="ops-master">
            <div className="ops-card-h"><b>Índice F51 · mapa maestro del campus</b><span>{masterIndex ? masterIndex.decision : 'sin cargar'}</span></div>
            <div className="ops-actions compact">
              <button className="ad-meta-btn" disabled={loading} onClick={loadCampusMasterIndex}>Cargar índice F51</button>
            </div>
            <div className="ops-warning small">Solo lectura. Sirve para revisar visualmente GitHub: áreas, páginas, archivos, orden de revisión y smoke backend posterior. No aprueba producción.</div>
            {masterIndex && <>
              <div className="ops-kpis master-kpis">
                <span><b>{masterIndex.campus_areas ? masterIndex.campus_areas.length : 0}</b> áreas</span>
                <span><b>{masterIndex.visual_checklist ? masterIndex.visual_checklist.length : 0}</b> checks visuales</span>
                <span><b>{masterIndex.backend_smoke_plan ? masterIndex.backend_smoke_plan.length : 0}</b> smoke backend</span>
                <span><b>{masterIndex.f48_summary && masterIndex.f48_summary.counts ? masterIndex.f48_summary.counts.attempts || 0 : 0}</b> intentos</span>
                <span><b>{masterIndex.f50_summary ? masterIndex.f50_summary.release_decision || '—' : '—'}</b> F50</span>
              </div>
              <div className="master-grid">
                <div className="master-card wide">
                  <h4>Áreas del campus</h4>
                  {(masterIndex.campus_areas || []).map((x,i)=><div className="master-line" key={i}>
                    <b>{x.area}</b><span>{(x.pages || []).join(', ')} · {x.visual_focus}</span>
                  </div>)}
                </div>
                <div className="master-card">
                  <h4>Orden GitHub</h4>
                  {(masterIndex.github_review_order || []).map((x,i)=><div className="diag-line low" key={i}><b>{i+1}</b><span>{x}</span></div>)}
                </div>
                <div className="master-card">
                  <h4>No confundir</h4>
                  {(masterIndex.do_not_confuse || []).map((x,i)=><div className="diag-line warn" key={i}><b>{i+1}</b><span>{x}</span></div>)}
                </div>
              </div>
              <div className="opstable-wrap master-wrap">
                <table className="opstable master-table">
                  <thead><tr><th>#</th><th>Página</th><th>Rol</th><th>Qué revisar visualmente</th><th>Riesgo</th></tr></thead>
                  <tbody>{(masterIndex.visual_checklist || []).map((x,i)=><tr key={x.order || i}>
                    <td><b>{x.order}</b></td><td>{x.page}</td><td>{x.role}</td><td><small>{x.check}</small></td><td><small>{x.risk}</small></td>
                  </tr>)}</tbody>
                </table>
              </div>
              <div className="ops-json compact"><h4>Respuesta F51 para copiar/pegar</h4><pre>{JSON.stringify({ version:masterIndex.version, decision:masterIndex.decision, areas:(masterIndex.campus_areas || []).length, visual_checks:(masterIndex.visual_checklist || []).length, backend_smoke_plan:masterIndex.backend_smoke_plan, do_not_confuse:masterIndex.do_not_confuse, f50_summary:masterIndex.f50_summary }, null, 2)}</pre></div>
            </>}
          </div>

          <div className="ops-closure">
            <div className="ops-card-h"><b>Cierre F50 · paquete técnico de exámenes</b><span>{closure ? closure.release_decision : 'sin cargar'}</span></div>
            <div className="ops-actions compact">
              <button className="ad-meta-btn" disabled={loading} onClick={loadTechnicalClosure}>Cargar cierre F50</button>
            </div>
            <div className="ops-warning small">Solo lectura. Resume release, endpoints, hojas, orden de QA, riesgos abiertos y rollback. No habilita estudiante ni toca Mis Notas.</div>
            {closure && <>
              <div className="ops-kpis closure-kpis">
                <span><b>{closure.release_decision || '—'}</b> decisión release</span>
                <span><b>{closure.readiness_counts ? closure.readiness_counts.FAIL : 0}</b> bloqueos</span>
                <span><b>{closure.readiness_counts ? closure.readiness_counts.WARN : 0}</b> advertencias</span>
                <span><b>{closure.endpoint_map ? closure.endpoint_map.length : 0}</b> endpoints</span>
                <span><b>{closure.sheet_map ? closure.sheet_map.length : 0}</b> hojas/mapas</span>
              </div>
              <div className="closure-grid">
                <div className="closure-card">
                  <h4>Riesgos abiertos</h4>
                  {(closure.open_risks || []).map((x,i)=><div className={`diag-line ${String(x.level || '').toLowerCase()}`} key={i}>
                    <b>{x.level || '—'}</b><span>{x.risk} · {x.mitigation}</span>
                  </div>)}
                </div>
                <div className="closure-card">
                  <h4>No tocar</h4>
                  {(closure.do_not_touch || []).map((x,i)=><div className="diag-line warn" key={i}>
                    <b>{i+1}</b><span>{x}</span>
                  </div>)}
                </div>
                <div className="closure-card">
                  <h4>Rollback</h4>
                  {(closure.rollback_plan || []).slice(0, 7).map((x,i)=><div className={`diag-line ${String(x.severity || '').toLowerCase()}`} key={i}>
                    <b>{x.order}</b><span>{x.action}</span>
                  </div>)}
                </div>
              </div>
              <div className="opstable-wrap closure-wrap">
                <table className="opstable closure-table">
                  <thead><tr><th>#</th><th>Fase</th><th>Prueba QA</th><th>Criterio de aprobación</th></tr></thead>
                  <tbody>{(closure.qa_order || []).map((x,i)=><tr key={x.order || i}>
                    <td><b>{x.order}</b></td><td>{x.phase}</td><td><small>{x.test}</small></td><td><small>{x.pass}</small></td>
                  </tr>)}</tbody>
                </table>
              </div>
              <div className="ops-json compact"><h4>Respuesta F50 para copiar/pegar</h4><pre>{JSON.stringify({ version:closure.version, release_decision:closure.release_decision, readiness_decision:closure.readiness_decision, readiness_counts:closure.readiness_counts, open_risks:closure.open_risks, do_not_touch:closure.do_not_touch }, null, 2)}</pre></div>
            </>}
          </div>

          <div className="ops-diagnostic">
            <div className="ops-card-h"><b>Diagnóstico F48 · centro de pruebas controladas</b><span>{diagResult ? 'cargado' : 'sin cargar'}</span></div>
            <div className="ops-actions compact">
              <label className="ops-checkline"><input type="checkbox" checked={diagSample} onChange={e=>setDiagSample(e.target.checked)} /> <span>Incluir muestra sanitizada de últimas filas</span></label>
              <button className="ad-meta-btn" disabled={loading} onClick={loadDiagnosticCenter}>Cargar diagnóstico F48</button>
            </div>
            <div className="ops-warning small">Solo lectura. No crea intentos, no abre activaciones, no cierra revisiones y no toca Mis Notas. La respuesta sirve para pegarla después y revisar el estado real del backend.</div>
            {diagResult && <>
              <div className="ops-kpis diagnostic-kpis">
                <span><b>{diagResult.issues ? diagResult.issues.length : 0}</b> alertas</span>
                <span><b>{diagResult.counts ? diagResult.counts.activations : 0}</b> activaciones</span>
                <span><b>{diagResult.counts ? diagResult.counts.attempts : 0}</b> intentos</span>
                <span><b>{diagResult.counts ? diagResult.counts.reviews : 0}</b> revisiones</span>
                <span><b>{diagResult.counts ? diagResult.counts.audit_logs : 0}</b> logs</span>
                <span><b>{diagResult.server_now || '—'}</b> servidor</span>
              </div>
              <div className="diag-grid">
                <div className="diag-card">
                  <h4>Hojas</h4>
                  {(diagResult.sheets || []).map(s=><div className={`diag-line ${s.status === 'OK' ? 'ok' : 'warn'}`} key={s.sheet}>
                    <b>{s.sheet}</b><span>{s.exists ? `${s.data_rows || 0} filas · ${s.header_ok ? 'headers OK' : 'faltan headers'}` : 'no existe'}</span>
                  </div>)}
                </div>
                <div className="diag-card">
                  <h4>Endpoints</h4>
                  {(diagResult.endpoints || []).map(e=><div className={`diag-line ${e.function_exists ? 'ok' : 'warn'}`} key={e.endpoint}>
                    <b>{e.endpoint}</b><span>{e.function_exists ? 'función existe' : 'no existe'}</span>
                  </div>)}
                </div>
                <div className="diag-card">
                  <h4>Alertas</h4>
                  {!(diagResult.issues || []).length && <div className="diag-line ok"><b>Sin alertas</b><span>La estructura básica está completa.</span></div>}
                  {(diagResult.issues || []).map((x,i)=><div className={`diag-line ${String(x.severity || '').toLowerCase()}`} key={i}>
                    <b>{x.code || 'ISSUE'}</b><span>{x.message || JSON.stringify(x)}</span>
                  </div>)}
                </div>
              </div>
              <div className="ops-json compact"><h4>Respuesta F48 para copiar/pegar</h4><pre>{JSON.stringify({ version:diagResult.version, server_now:diagResult.server_now, counts:diagResult.counts, issues:diagResult.issues, config:diagResult.config }, null, 2)}</pre></div>
            </>}
          </div>

          <div className="ops-readiness">
            <div className="ops-card-h"><b>Checklist F49 · preparación para QA manual final</b><span>{qaReady ? qaReady.decision : 'sin cargar'}</span></div>
            <div className="ops-actions compact">
              <button className="ad-meta-btn" disabled={loading} onClick={loadQaReadiness}>Cargar checklist F49</button>
            </div>
            <div className="ops-warning small">Solo lectura. No reemplaza la prueba real: ordena bloqueos, advertencias y pruebas manuales que no se deben saltar antes de producción.</div>
            {qaReady && <>
              <div className="ops-kpis readiness-kpis">
                <span><b>{qaReady.decision || '—'}</b> decisión</span>
                <span><b>{qaReady.status_counts ? qaReady.status_counts.FAIL : 0}</b> bloqueos</span>
                <span><b>{qaReady.status_counts ? qaReady.status_counts.WARN : 0}</b> advertencias</span>
                <span><b>{qaReady.status_counts ? qaReady.status_counts.MANUAL : 0}</b> manuales</span>
                <span><b>{qaReady.status_counts ? qaReady.status_counts.PASS : 0}</b> listos</span>
              </div>
              <div className="readiness-grid">
                <div className="readiness-card">
                  <h4>Bloqueos / advertencias</h4>
                  {!(qaReady.blockers || []).length && !(qaReady.warnings || []).length && <div className="diag-line ok"><b>Sin bloqueos</b><span>No hay FAIL/WARN estructurales en esta lectura.</span></div>}
                  {(qaReady.blockers || []).concat(qaReady.warnings || []).slice(0, 10).map((x,i)=><div className={`diag-line ${String(x.status || '').toLowerCase()}`} key={x.id || i}>
                    <b>{x.id}</b><span>{x.label} · {x.evidence}</span>
                  </div>)}
                </div>
                <div className="readiness-card">
                  <h4>Pruebas manuales obligatorias</h4>
                  {(qaReady.items || []).filter(x=>String(x.status || '').toUpperCase()==='MANUAL').slice(0, 10).map((x,i)=><div className="diag-line manual" key={x.id || i}>
                    <b>{x.id}</b><span>{x.next_action}</span>
                  </div>)}
                </div>
                <div className="readiness-card">
                  <h4>Payloads sugeridos</h4>
                  {(qaReady.manual_probes || []).slice(0, 7).map((p,i)=><div className="diag-line" key={p.fn || i}>
                    <b>{p.order}. {p.fn}</b><span>{p.expected}</span>
                  </div>)}
                </div>
              </div>
              <div className="opstable-wrap readiness-wrap">
                <table className="opstable readiness-table">
                  <thead><tr><th>Estado</th><th>Área</th><th>Control</th><th>Evidencia</th><th>Siguiente acción</th></tr></thead>
                  <tbody>
                    {(qaReady.items || []).map((x,i)=><tr key={x.id || i}>
                      <td><span className={`actstatus qa-${String(x.status || '').toLowerCase()}`}>{x.status || '—'}</span></td>
                      <td><b>{x.area || '—'}</b></td>
                      <td><b>{x.id || '—'}</b><small>{x.label || '—'}</small></td>
                      <td><small>{x.evidence || '—'}</small></td>
                      <td><small>{x.next_action || '—'}</small></td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
              <div className="ops-json compact"><h4>Respuesta F49 para copiar/pegar</h4><pre>{JSON.stringify({ version:qaReady.version, decision:qaReady.decision, status_counts:qaReady.status_counts, blockers:qaReady.blockers, warnings:qaReady.warnings, manual_probes:qaReady.manual_probes }, null, 2)}</pre></div>
            </>}
          </div>


          <div className="ops-inbox">
            <div className="ops-card-h"><b>Bandeja F45 · revisión docente/admin</b><span>{inboxRows.length} visibles</span></div>
            <div className="ops-filterline">
              <label><span>Grupo</span><input value={inboxFilters.cod_grupo} onChange={e=>setInboxFilter('cod_grupo', e.target.value)} placeholder="B1-LM6..." /></label>
              <label><span>Nivel</span><select value={inboxFilters.nivel} onChange={e=>setInboxFilter('nivel', e.target.value)}><option value="">Todos</option><option>B1</option><option>B2</option><option>I1</option><option>I2</option></select></label>
              <label><span>Cola</span><select value={inboxFilters.queue} onChange={e=>setInboxFilter('queue', e.target.value)}><option value="NEEDS_ACTION">Requieren acción</option><option value="PENDING">Sin revisión</option><option value="IN_REVIEW">En revisión</option><option value="CLOSED_NOT_PUSHED">Cerradas sin Mis Notas</option><option value="PUSHED">Enviadas a Mis Notas</option><option value="STARTED">Iniciadas/no enviadas</option><option value="ALL">Todas</option></select></label>
              <label><span>Buscar</span><input value={inboxFilters.search} onChange={e=>setInboxFilter('search', e.target.value)} placeholder="nombre, código, intento" /></label>
              <label><span>Límite</span><input value={inboxFilters.limit} onChange={e=>setInboxFilter('limit', e.target.value)} placeholder="50" /></label>
              <button className="ad-meta-btn" disabled={loading} onClick={()=>loadInbox()}>Cargar bandeja</button>
            </div>
            {inboxSummary && <div className="ops-kpis">
              <span><b>{inboxSummary.needs_action || 0}</b> requieren acción</span>
              <span><b>{inboxSummary.submitted_without_review || 0}</b> sin revisión</span>
              <span><b>{inboxSummary.in_review || 0}</b> en revisión</span>
              <span><b>{inboxSummary.closed_not_pushed || 0}</b> sin Mis Notas</span>
              <span><b>{inboxSummary.pushed_to_notas || 0}</b> sincronizadas</span>
              <span><b>{inboxSummary.started || 0}</b> iniciadas</span>
            </div>}
            <div className="opstable-wrap inbox-wrap">
              <table className="opstable">
                <thead><tr><th>Cola</th><th>Estudiante</th><th>Examen</th><th>Revisión</th><th>Mis Notas</th><th>Acciones</th></tr></thead>
                <tbody>
                  {!inboxRows.length && <tr><td colSpan="6" className="actempty">Cargá la bandeja para ver intentos/revisiones unificados.</td></tr>}
                  {inboxRows.map((r,i)=>{
                    const bucket = String(r.bucket || '').toLowerCase();
                    const att = r.ATTEMPT_ID || '';
                    const rev = r.REVIEW_ID || '';
                    return <tr key={(att || rev || i)}>
                      <td><span className={`actstatus ${bucket}`}>{r.bucket || '—'}</span><small>{r.ATTEMPT_STATUS || '—'}</small></td>
                      <td><b>{r.NOMBRE || '—'}</b><small>{r.CODIGO || '—'} · {r.COD_GRUPO || '—'}</small></td>
                      <td><code>{r.EXAM_ID || '—'}</code><small>{r.NIVEL || '—'} · {compactDate(r.SUBMITTED_AT || r.STARTED_AT)}</small></td>
                      <td><b>{r.REVIEW_STATUS || 'PENDING'}</b><small>{rev || 'sin REVIEW_ID'} · nota {r.FINAL_SCORE_100 || '—'}</small></td>
                      <td><b>{r.PUSHED_TO_NOTAS || 'NO'}</b><small>{compactDate(r.PUSHED_AT)}</small></td>
                      <td className="ops-row-actions">
                        <button disabled={loading} onClick={()=>inspectAttempt(att)}>Ver</button>
                        <button disabled={loading || !att} onClick={()=>openInboxReview(r)}>{rev ? 'Cargar rev.' : 'Crear rev.'}</button>
                        <button disabled={loading || !rev || String(r.REVIEW_STATUS || '').toUpperCase() !== 'CLOSED' || String(r.PUSHED_TO_NOTAS || '').toUpperCase() === 'SI'} onClick={()=>pushReviewIdToNotas(rev, att)}>Mis Notas</button>
                      </td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>



          <div className="ops-signals">
            <div className="ops-card-h"><b>Señales F47 · antifraude e inconsistencias</b><span>{signalRows.length} visibles</span></div>
            <div className="ops-filterline signal-filterline">
              <label><span>Grupo</span><input value={signalFilters.cod_grupo} onChange={e=>setSignalFilter('cod_grupo', e.target.value)} placeholder="opcional admin / obligatorio docente" /></label>
              <label><span>Nivel</span><select value={signalFilters.nivel} onChange={e=>setSignalFilter('nivel', e.target.value)}><option value="">Todos</option><option>B1</option><option>B2</option><option>I1</option><option>I2</option></select></label>
              <label><span>Severidad</span><select value={signalFilters.severity} onChange={e=>setSignalFilter('severity', e.target.value)}><option value="">Todas</option><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select></label>
              <label><span>Tipo</span><select value={signalFilters.type} onChange={e=>setSignalFilter('type', e.target.value)}><option value="">Todos</option><option>TIME_LIMIT</option><option>DUPLICATE_ATTEMPT</option><option>REVIEW</option><option>MIS_NOTAS</option><option>AUDIT</option><option>DATA</option></select></label>
              <label><span>Buscar</span><input value={signalFilters.search} onChange={e=>setSignalFilter('search', e.target.value)} placeholder="estudiante, intento, código" /></label>
              <label><span>Límite</span><input value={signalFilters.limit} onChange={e=>setSignalFilter('limit', e.target.value)} placeholder="100" /></label>
              <button className="ad-meta-btn" disabled={loading} onClick={()=>loadIntegritySignals()}>Cargar señales</button>
            </div>
            {signalSummary && <div className="ops-kpis signal-kpis">
              <span><b>{signalSummary.critical || 0}</b> críticas</span>
              <span><b>{signalSummary.high || 0}</b> altas</span>
              <span><b>{signalSummary.medium || 0}</b> medias</span>
              <span><b>{signalSummary.low || 0}</b> bajas</span>
              <span><b>{signalSummary.attempts_scanned || 0}</b> intentos escaneados</span>
              <span><b>{signalSummary.reviews_scanned || 0}</b> revisiones escaneadas</span>
            </div>}
            <div className="opstable-wrap signal-wrap">
              <table className="opstable signal-table">
                <thead><tr><th>Severidad</th><th>Señal</th><th>Contexto</th><th>Evidencia</th><th>Acción sugerida</th></tr></thead>
                <tbody>
                  {!signalRows.length && <tr><td colSpan="5" className="actempty">Cargá señales para priorizar revisión humana. No bloquea ni acusa estudiantes.</td></tr>}
                  {signalRows.map((s,i)=>{
                    const ctx = s.context || {};
                    return <tr key={(s.code || 'SIG') + i}>
                      <td><span className={`actstatus ${String(s.severity || '').toLowerCase()}`}>{s.severity || '—'}</span><small>{s.type || '—'}</small></td>
                      <td><b>{s.title || s.code || '—'}</b><small>{s.code || '—'}</small></td>
                      <td><b>{ctx.NOMBRE || ctx.CODIGO || '—'}</b><small>{ctx.COD_GRUPO || '—'} · {ctx.NIVEL || '—'} · {ctx.ATTEMPT_ID || ctx.REVIEW_ID || '—'}</small></td>
                      <td><pre>{JSON.stringify(s.evidence || {}, null, 2).slice(0, 600)}</pre></td>
                      <td>{s.recommendation || 'Revisión manual.'}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div className="ops-warning small">Estas señales no son sanciones. Son banderas para revisar manualmente antes de cerrar notas.</div>
          </div>

          <div className="ops-auditbox">
            <div className="ops-card-h"><b>Bitácora F46 · auditoría de exámenes</b><span>{auditRows.length} logs visibles</span></div>
            <div className="ops-filterline audit-filterline">
              <label><span>Grupo</span><input value={auditFilters.cod_grupo} onChange={e=>setAuditFilter('cod_grupo', e.target.value)} placeholder="opcional admin / obligatorio docente" /></label>
              <label><span>Nivel</span><select value={auditFilters.nivel} onChange={e=>setAuditFilter('nivel', e.target.value)}><option value="">Todos</option><option>B1</option><option>B2</option><option>I1</option><option>I2</option></select></label>
              <label><span>Acción</span><select value={auditFilters.action} onChange={e=>setAuditFilter('action', e.target.value)}><option value="">Todas</option><option value="ATTEMPT">Intentos</option><option value="REVIEW">Revisión</option><option value="NOTAS">Mis Notas</option><option value="AUDIT">Lecturas auditoría</option><option value="ERROR">Errores</option></select></label>
              <label><span>Target / intento</span><input value={auditFilters.target_id} onChange={e=>setAuditFilter('target_id', e.target.value)} placeholder="ATT/REV/ACT/LOG" /></label>
              <label><span>Buscar</span><input value={auditFilters.search} onChange={e=>setAuditFilter('search', e.target.value)} placeholder="actor, estudiante, acción" /></label>
              <label><span>Límite</span><input value={auditFilters.limit} onChange={e=>setAuditFilter('limit', e.target.value)} placeholder="100" /></label>
              <button className="ad-meta-btn" disabled={loading} onClick={()=>loadAuditTrail()}>Cargar bitácora</button>
            </div>
            {auditSummary && <div className="ops-kpis audit-kpis">
              <span><b>{auditSummary.returned || 0}</b> devueltos</span>
              <span><b>{auditSummary.student_flow || 0}</b> estudiante</span>
              <span><b>{auditSummary.review_flow || 0}</b> revisión</span>
              <span><b>{auditSummary.notas_flow || 0}</b> Mis Notas</span>
              <span><b>{auditSummary.errores || 0}</b> errores</span>
              <span><b>{auditSummary.warnings || 0}</b> alertas</span>
            </div>}
            <div className="opstable-wrap audit-wrap">
              <table className="opstable audit-table">
                <thead><tr><th>Fecha</th><th>Acción</th><th>Actor</th><th>Contexto</th><th>Detalle</th></tr></thead>
                <tbody>
                  {!auditRows.length && <tr><td colSpan="5" className="actempty">Cargá la bitácora para ver eventos reales de intentos, revisiones y sincronización.</td></tr>}
                  {auditRows.map((r,i)=>{
                    const ctx = r.CONTEXT || {};
                    const detail = r.DETAIL || {};
                    const action = String(r.ACTION || '').toLowerCase();
                    return <tr key={r.LOG_ID || i}>
                      <td><small>{compactDate(r.TS)}</small><code>{r.LOG_ID || 'LOG'}</code></td>
                      <td><span className={`actstatus ${action}`}>{r.ACTION || '—'}</span><small>{r.TARGET_TYPE || '—'} · {r.TARGET_ID || '—'}</small></td>
                      <td><b>{r.ACTOR_ROLE || '—'}</b><small>{r.ACTOR_ID || '—'}</small></td>
                      <td><b>{ctx.NOMBRE || ctx.CODIGO || '—'}</b><small>{ctx.COD_GRUPO || '—'} · {ctx.NIVEL || '—'} · {ctx.ATTEMPT_ID || ctx.REVIEW_ID || ctx.ACTIVATION_ID || '—'}</small></td>
                      <td><pre>{JSON.stringify(detail, null, 2).slice(0, 900)}</pre></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div className="ops-warning small">Esta bitácora es lectura operativa. No corrige datos; solo deja evidencia para la revisión manual final.</div>
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
              <label className="ops-checkline"><input type="checkbox" checked={pushOnClose} onChange={e=>setPushOnClose(e.target.checked)} /> <span>Enviar a Mis Notas al cerrar esta revisión</span></label>
              <label className="ops-checkline"><input type="checkbox" checked={pushForce} onChange={e=>setPushForce(e.target.checked)} /> <span>Forzar reenvío si ya fue sincronizada</span></label>
              <div className="ops-actions tight">
                <button className="btn-sm" disabled={loading || !review} onClick={saveReview}>Guardar borrador backend</button>
                <button className="ad-meta-btn" disabled={loading || !review} onClick={closeReview}>Cerrar revisión backend</button>
                <button className="btn-sm" disabled={loading || !review || String(review.REVIEW_STATUS || '').toUpperCase() !== 'CLOSED'} onClick={pushReviewToNotas}>Pasar a Mis Notas</button>
              </div>
              <div className="ops-warning small">El botón de Mis Notas usa examPushReviewToNotas. Si EXAM_PUSH_TO_NOTAS_ENABLED está en NO, backend debe rechazarlo.</div>
              {lastPushResult && <div className="ops-json compact"><h4>Resultado Mis Notas</h4><pre>{JSON.stringify(lastPushResult, null, 2)}</pre></div>}
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
    const r = await postExamBackend('examReviewInbox', { cod_grupo:g, queue:'NEEDS_ACTION', limit:80 });
    setLoading(false);
    if (r && r.ok) { setRows(Array.isArray(r.rows) ? r.rows : []); setErr(''); setMsg(`Pendientes reales encontrados: ${r.total || 0} · requieren acción ${r.summary ? r.summary.needs_action : 0}`); }
    else { setRows([]); setMsg(''); setErr((r && (r.mensaje || r.error)) || 'No se pudo consultar backend.'); }
  };
  return (
    <div className="tch-realbox">
      <button className="tch-realbox-h" onClick={()=>setOpen(v=>!v)}>
        <div><b>Backend real · F48</b><span>Bandeja y señales por grupo propio</span></div>
        <span>{open ? '▴' : '▾'}</span>
      </button>
      {open && <div className="tch-realbox-b">
        <div className="tch-realrow">
          <input value={grupo} onChange={e=>setGrupo(e.target.value)} placeholder="Código de grupo" />
          <button className="btn-sm" disabled={loading} onClick={load}>Consultar revisiones</button>
        </div>
        <div className="tch-note compact"><b>Solo lectura operativa.</b> Esta bandeja no cierra ni envía notas; sirve para ubicar qué falta revisar.</div>
        {msg && <div className="ex-okmsg">✓ {msg}</div>}
        {err && <div className="ex-errmsg">⚠ {err}</div>}
        <div className="tch-real-list">
          {!rows.length && <div className="actempty">Sin revisiones reales para mostrar.</div>}
          {rows.map((r,i)=><div className="tch-real-item" key={r.ATTEMPT_ID || r.REVIEW_ID || i}>
            <b>{r.ATTEMPT_ID || 'ATT'}</b>
            <span>{r.bucket || '—'} · {r.NOMBRE || '—'} · {r.COD_GRUPO || '—'}</span>
            <em>{r.REVIEW_STATUS || 'PENDING'} · nota {r.FINAL_SCORE_100 || '—'}</em>
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
