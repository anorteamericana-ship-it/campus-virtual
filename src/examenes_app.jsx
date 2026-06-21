// CAMPUS_F95_0_20260621_PREVIEW_DOCENTE_Y_RUNTIME_ESTUDIANTE
// CALGRUPO_F51_20260617_INDICE_MAESTRO_CAMPUS_APP
// CALGRUPO_F50_20260617_CIERRE_TECNICO_EXAMENES_APP
// CALGRUPO_F49_20260617_CHECKLIST_QA_FINAL_EXAMENES_APP
// CALGRUPO_F48_20260617_CENTRO_DIAGNOSTICO_EXAMENES_APP
/* global React, ReactDOM, NIVEL_TEMA, StudentMode, TeacherMode, AdminMode, ExamShell, EXAM_I2_T1_A, themedExam */
// examenes_app.jsx — shell + barra de control (auditoría / tweaks)
// F95.0: no destructurar hooks en el ámbito global. examenes_modes.jsx ya
// declara esos nombres y los scripts clásicos comparten el mismo entorno léxico.

const VIEWS = [
  { k:'student', t:'Estudiante' },
  { k:'teacher', t:'Profesor' },
  { k:'teacher_preview', t:'Modelo docente' },
  { k:'admin',   t:'Administrador' },
  { k:'preview', t:'Preview' },
];

const VIEW_TITLES = VIEWS.reduce((m, v) => Object.assign(m, { [v.k]: v.t }), {});

function normalizeRole(rol) {
  const r = String(rol || '').trim().toLowerCase();
  if (r === 'superadmin' || r === 'admin') return 'admin';
  if (r === 'teacher') return 'teacher';
  if (r === 'student') return 'student';
  return '';
}

function getCampusParentSession() {
  try {
    if (!window.parent || window.parent === window) return null;
    if (typeof window.parent.getSesion !== 'function') return null;
    return window.parent.getSesion();
  } catch (_) {
    return null;
  }
}

function readRequestedView() {
  try {
    const params = new URLSearchParams(window.location.search || '');
    const raw = String(params.get('view') || '').trim().toLowerCase();
    return VIEWS.some(v => v.k === raw) ? raw : '';
  } catch (_) {
    return '';
  }
}

function readTeacherPreviewParams() {
  try {
    const p = new URLSearchParams(window.location.search || '');
    return {
      nivel: normalizeExamNivel(p.get('nivel')) || 'B1',
      test: normalizeExamTest(p.get('test')) || 'TEST1',
      opcion: normalizeExamOpcion(p.get('opcion')) || 'A',
      plan: normalizeExamPlan(p.get('plan')) || 'con_ina',
      grupo: String(p.get('grupo') || '').trim(),
    };
  } catch (_) {
    return { nivel:'B1', test:'TEST1', opcion:'A', plan:'con_ina', grupo:'' };
  }
}

function normalizeExamNivel(v) {
  const n = String(v || '').trim().toUpperCase();
  return ['B1','B2','I1','I2'].includes(n) ? n : '';
}

function normalizeExamTest(v) {
  const t = String(v || '').trim().toUpperCase();
  if (t === 'TEST1' || t === 'T1' || t === 'L18' || t === '18') return 'TEST1';
  if (t === 'TEST2' || t === 'T2' || t === 'L32' || t === '32') return 'TEST2';
  return '';
}

function normalizeExamOpcion(v) {
  const o = String(v || '').trim().toUpperCase();
  return o === 'A' || o === 'B' ? o : '';
}

function normalizeExamPlan(v) {
  const p = String(v || '').trim().toLowerCase();
  if (p === 'con_ina' || p === 'con ina' || p === 'ina' || p === 'conina') return 'con_ina';
  if (p === 'sin_ina' || p === 'sin ina' || p === 'sinina') return 'sin_ina';
  return '';
}

function resolveStudentAssignment(session) {
  if (!session || typeof session !== 'object') return null;

  // V6: no examen fijo de prueba. El estudiante solo carga contenido si la
  // sesión trae una asignación explícita desde el campus/backend futuro.
  // No se leen nivel/test/opción desde query params para evitar selección manual.
  const src = session.examenAsignado || session.examen_asignado || session.examAssignment || null;
  if (!src || typeof src !== 'object') return null;

  const nivel = normalizeExamNivel(src.nivel || src.level);
  const test = normalizeExamTest(src.test || src.prueba || src.leccion);
  const opcion = normalizeExamOpcion(src.opcion || src.option || src.variante);
  const plan = normalizeExamPlan(src.plan || src.programa || session.programa) || normalizeExamPlan(session.programa);

  if (!nivel || !test || !opcion || !plan) return null;
  return {
    nivel,
    test,
    opcion,
    plan,
    grupo: session.grupoActivo || session.grupo || '',
    codigo: session.codigo || '',
    nombre: session.nombre || '',
  };
}

function buildInitialViewConfig() {
  const requested = readRequestedView();
  const framed = (() => {
    try { return !!window.parent && window.parent !== window; }
    catch (_) { return false; }
  })();

  if (!framed) {
    return {
      authorized: false,
      view: 'blocked',
      role: '',
      requested,
      allowedViews: [],
      controls: false,
      locked: true,
      reason: 'Este módulo solo puede abrirse desde el campus principal.',
    };
  }

  const session = getCampusParentSession();
  const role = normalizeRole(session && session.rol);
  if (!role) {
    return {
      authorized: false,
      view: 'blocked',
      role: '',
      requested,
      allowedViews: [],
      controls: false,
      locked: true,
      reason: 'No se pudo validar una sesión activa del campus.',
    };
  }

  const allowedViewsByRole = {
    admin:   ['admin', 'preview'],
    teacher: ['teacher', 'teacher_preview'],
    student: ['student'],
  };
  const defaultViewByRole = {
    admin: 'admin',
    teacher: 'teacher',
    student: 'student',
  };

  const allowedViews = allowedViewsByRole[role] || [];
  const fallbackView = defaultViewByRole[role] || '';
  const view = requested || fallbackView;

  if (!allowedViews.includes(view)) {
    return {
      authorized: false,
      view: 'blocked',
      role,
      requested: view,
      allowedViews,
      controls: false,
      locked: true,
      reason: `La vista ${VIEW_TITLES[view] || view || 'solicitada'} no está autorizada para este rol.`,
    };
  }

  return {
    authorized: true,
    view,
    role,
    requested: view,
    allowedViews,
    controls: role === 'admin',
    locked: role !== 'admin',
    reason: '',
    studentAssignment: role === 'student' ? resolveStudentAssignment(session) : null,
  };
}

const INITIAL_VIEW_CONFIG = buildInitialViewConfig();


// CALGRUPO_F27_20260617_EXAMENES_ESTUDIANTE_LIVE_BACKEND
// CALGRUPO_F43_20260617_EXAMENES_ESTUDIANTE_QA_AUTOSAVE_TIMER
function examParentApiUrl() {
  try {
    if (window.parent && window.parent !== window && window.parent.APPS_SCRIPT_URL) return window.parent.APPS_SCRIPT_URL;
  } catch (_) {}
  try { return window.APPS_SCRIPT_URL || ''; } catch (_) { return ''; }
}
function examParentToken() {
  try {
    if (window.parent && window.parent !== window && typeof window.parent.getSessionToken === 'function') return window.parent.getSessionToken() || '';
  } catch (_) {}
  try { return window.getSessionToken ? window.getSessionToken() : ''; } catch (_) { return ''; }
}
async function examPostLive(fn, payload = {}) {
  const url = examParentApiUrl();
  if (!url) return { ok:false, error:'apps_script_url_no_disponible', mensaje:'No se encontró la URL del backend del campus.' };
  const token = examParentToken();
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutMs = 25000;
  const timeoutId = setTimeout(() => {
    try { if (controller) controller.abort(); } catch (_) {}
  }, timeoutMs);
  try {
    const res = await fetch(`${url}?fn=${encodeURIComponent(fn)}`, {
      method: 'POST',
      headers: { 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ fn, token }, payload || {})),
      signal: controller ? controller.signal : undefined,
      cache: 'no-store',
    });
    const raw = await res.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : {}; }
    catch (_) {
      return {
        ok:false,
        error:'respuesta_backend_no_json',
        mensaje:`El backend respondió en un formato inválido (HTTP ${res.status}). Volvé a cargar el Campus; si continúa, revisá la implementación de Apps Script.`,
      };
    }
    if (!res.ok && data && data.ok !== false) {
      return Object.assign({}, data, {
        ok:false,
        error:data.error || `http_${res.status}`,
        mensaje:data.mensaje || `El backend respondió con HTTP ${res.status}.`,
      });
    }
    return data;
  } catch (err) {
    if (err && err.name === 'AbortError') {
      return {
        ok:false,
        error:'backend_timeout',
        mensaje:'El backend tardó más de 25 segundos en responder. No se dejó la pantalla congelada: presioná “Actualizar estado”.',
      };
    }
    return {
      ok:false,
      error:'backend_fetch_error',
      mensaje:String(err && err.message ? err.message : 'No se pudo conectar con Apps Script.'),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
function parseExamAnswersJson(v) {
  if (!v) return {};
  if (typeof v === 'object') return v;
  try { return JSON.parse(String(v || '{}')); } catch (_) { return {}; }
}
function activationToStudentConfig(activation) {
  const a = activation || {};
  const nivel = normalizeExamNivel(a.NIVEL || a.nivel);
  const test = normalizeExamTest(a.TEST_CODE || a.test_code || a.LECCION || a.leccion);
  const opcion = normalizeExamOpcion(a.OPCION || a.opcion);
  const plan = normalizeExamPlan(a.PLAN || a.plan) || 'con_ina';
  return { nivel, test, opcion, plan };
}
function StudentLiveLoading() {
  return (
    <div style={{ maxWidth:620, margin:'72px auto', padding:'30px 32px', borderRadius:18, background:'#fff', border:'1px solid #E2D8C8', boxShadow:'0 18px 60px rgba(0,0,0,0.10)', fontFamily:'Poppins, system-ui, sans-serif', textAlign:'center', color:'#001E47' }}>
      <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase', color:'#7A1E2C', marginBottom:12 }}>Consultando cronograma</div>
      <h2 style={{ margin:'0 0 8px', fontSize:26 }}>Buscando examen disponible…</h2>
      <p style={{ color:'#5A6472', fontSize:14 }}>El sistema valida tu grupo, la lección activa y la activación oficial.</p>
    </div>
  );
}
function StudentLiveStatusCard({ title, badge='Examen no disponible', children, tone='gold', onRefresh }) {
  const bg = tone === 'red' ? '#F7E8E9' : tone === 'blue' ? '#E2EFF8' : '#FFF5D6';
  const ink = tone === 'red' ? '#7A1E2C' : tone === 'blue' ? '#0C447C' : '#7A4A00';
  return (
    <div style={{ maxWidth:660, margin:'72px auto', padding:'30px 32px', borderRadius:18, background:'#fff', border:'1px solid #E2D8C8', boxShadow:'0 18px 60px rgba(0,0,0,0.10)', fontFamily:'Poppins, system-ui, sans-serif', textAlign:'center', color:'#001E47' }}>
      <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 12px', borderRadius:999, background:bg, color:ink, fontSize:11, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:14 }}>{badge}</div>
      <h2 style={{ margin:'0 0 8px', fontSize:26, letterSpacing:'-0.03em' }}>{title}</h2>
      <div style={{ margin:'0 auto 18px', maxWidth:530, color:'#5A6472', fontSize:14, lineHeight:1.55 }}>{children}</div>
      {onRefresh && <button className="btn-primary" onClick={onRefresh}>Actualizar estado</button>}
    </div>
  );
}
function StudentLiveExamApp() {
  const [live, setLive] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [attemptId, setAttemptId] = React.useState('');
  const [publicExam, setPublicExam] = React.useState(null);
  const [currentAttempt, setCurrentAttempt] = React.useState(null);

  const load = React.useCallback(() => {
    setLoading(true); setError('');
    const ses = getCampusParentSession() || {};
    examPostLive('examGetStudentLivePanel', {
      cod_grupo_hint: ses.grupoActivo || ses.grupo || ses.cod_grupo || '',
      nivel_hint: ses.nivel_activo || ses.nivel || '',
      codigo_hint: ses.codigo || '',
      client_meta:{ source:'student_iframe_f95_runtime_group_resolution' }
    })
      .then(r => {
        if (!r || r.ok === false) {
          // CALGRUPO_F52_20260617_EXAMENES_BACKEND_DESFASADO_MSG
          // Compatibilidad: si el backend F27/F43+ aún no está instalado, intenta
          // el endpoint viejo. Si también falla, mostramos un mensaje accionable.
          const errTxt = String((r && (r.error || r.mensaje)) || '').toLowerCase();
          if (r && (errTxt.includes('desconocid') || errTxt.includes('no reconoc'))) {
            return examPostLive('examGetStudentAssignment', { client_meta:{ source:'student_iframe_f52_fallback_backend_desfasado' } });
          }
          throw r || { error:'respuesta_invalida' };
        }
        return r;
      })
      .then(r => {
        if (!r || r.ok === false) throw r || { error:'respuesta_invalida' };
        setLive(r);
        const a = r.current_attempt || null;
        setCurrentAttempt(a);
        setAttemptId(a && a.ATTEMPT_ID || '');
        setPublicExam(r.public_exam || null);
      })
      .catch(e => {
        const raw = (e && (e.mensaje || e.error)) || 'No se pudo consultar el backend de exámenes.';
        const txt = String(raw);
        if (/no reconoc|desconocid/i.test(txt)) {
          setError('El frontend ya está en F95.0, pero el Apps Script publicado no reconoce los endpoints de exámenes. Actualizá y desplegá el Apps Script v5.89.0 F95.0 en Apps Script; subir GitHub solo no basta para esta sección. Detalle: ' + txt);
        } else {
          setError(txt);
        }
      })
      .finally(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    if (!(live && live.preparing)) return;
    const timer = window.setTimeout(load, 3500);
    return () => window.clearTimeout(timer);
  }, [live && live.preparing, load]);

  const activation = live && live.activation;
  const cfg = activationToStudentConfig(activation || {});
  const initialAnswers = parseExamAnswersJson(currentAttempt && (currentAttempt.ANSWERS_JSON || currentAttempt.answers_json));

  const startAttempt = async () => {
    const r = await examPostLive('examStartAttempt', { activation_id: activation && activation.ACTIVATION_ID, client_meta:{ source:'student_iframe_f43_start' }, user_agent: navigator.userAgent });
    if (r && r.ok) {
      setAttemptId(r.attempt_id || '');
      setPublicExam(r.public_exam || publicExam);
      setCurrentAttempt({ ATTEMPT_ID:r.attempt_id, STATUS:'STARTED', STARTED_AT:r.started_at || r.server_now || '', ANSWERS_JSON:'{}' });
    }
    return r;
  };
  const saveAttempt = async (answers, meta = {}) => {
    const source = meta && meta.source === 'auto' ? 'student_iframe_f95_auto_save' : 'student_iframe_f95_manual_save';
    return await examPostLive('examSaveAttemptDraft', { attempt_id: attemptId, answers, client_meta:{ source, answered:Object.keys(answers || {}).length } });
  };
  const submitAttempt = async (answers, meta = {}) => {
    const autoSubmit = !!(meta && meta.autoSubmit);
    const r = await examPostLive('examSubmitAttempt', {
      attempt_id: attemptId,
      answers,
      time_spent_sec: meta && meta.timeSpentSec != null ? meta.timeSpentSec : '',
      auto_submit: autoSubmit ? 'SI' : 'NO',
      client_meta:{ source:autoSubmit ? 'student_iframe_f43_auto_submit_timeout' : 'student_iframe_f43_submit', answered:Object.keys(answers || {}).length }
    });
    if (r && r.ok) setCurrentAttempt(Object.assign({}, currentAttempt || {}, { STATUS:'SUBMITTED', SUBMITTED_AT:r.server_now || '' }));
    return r;
  };
  const heartbeatAttempt = async () => {
    return await examPostLive('examHeartbeatAttempt', { attempt_id: attemptId, client_meta:{ source:'student_iframe_f43_heartbeat' } });
  };

  if (loading) return <StudentLiveLoading />;
  if (error) return <StudentLiveStatusCard title="No se pudo abrir exámenes" badge="Error de conexión" tone="red" onRefresh={load}>{error}</StudentLiveStatusCard>;
  if (live && live.enabled === false) return <StudentLiveStatusCard title="Exámenes aún deshabilitados" badge="Configuración pendiente" tone="blue" onRefresh={load}>{live.mensaje || 'El backend está instalado, pero la configuración STUDENT_EXAMS_ENABLED todavía no está activa.'}</StudentLiveStatusCard>;
  if (live && live.preparing) return <StudentLiveStatusCard title="Preparando tu examen" badge="Reintento automático" tone="blue" onRefresh={load}>{live.mensaje || 'La clase está abierta. El sistema está creando una única activación y volverá a consultar en unos segundos.'}</StudentLiveStatusCard>;
  if (!live || live.assigned !== true || !activation) {
    const msg = live && (live.mensaje || (live.availability && live.availability.mensaje));
    return <StudentLiveStatusCard title="No hay examen disponible" onRefresh={load}>{msg || 'No hay una sesión docente abierta de la lección 18 o 32 para tu matrícula activa.'}</StudentLiveStatusCard>;
  }
  const submitted = currentAttempt && String(currentAttempt.STATUS || '').toUpperCase() === 'SUBMITTED';
  if (submitted) return <StudentLiveStatusCard title="Examen ya enviado" badge="En revisión docente" tone="blue" onRefresh={load}>Tu intento fue recibido correctamente. La nota final aparecerá cuando el docente complete la revisión.</StudentLiveStatusCard>;

  return <StudentMode
    shell="premium" density="comfy"
    nivel={cfg.nivel} test={cfg.test} opcion={cfg.opcion} plan={cfg.plan}
    examOverride={publicExam}
    assignment={activation}
    backend={{ attemptId, initialAnswers, onStart:startAttempt, onSave:saveAttempt, onSubmit:submitAttempt, onHeartbeat:heartbeatAttempt, student: live.student || null, activation, timeLimitMin:Number(activation && activation.TIME_LIMIT_MIN || 0) || 0, startedAt:currentAttempt && currentAttempt.STARTED_AT || '' }}
  />;
}

function TeacherPreviewLiveApp() {
  const cfg = React.useMemo(() => readTeacherPreviewParams(), []);
  const [showKey, setShowKey] = React.useState(false);
  const [scriptSec, setScriptSec] = React.useState(null);
  const exam = window.getExam ? window.getExam(cfg.nivel, cfg.test, cfg.opcion) : null;
  const tema = NIVEL_TEMA[cfg.nivel] || NIVEL_TEMA.B1;
  if (!exam) return <StudentLiveStatusCard title="Modelo no disponible" badge="Revisar catálogo" tone="red">No existe contenido para {cfg.nivel} · {cfg.test} · Opción {cfg.opcion}.</StudentLiveStatusCard>;
  return (
    <div className="pvwrap" style={{paddingTop:0}}>
      <div style={{position:'sticky',top:0,zIndex:40,display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',padding:'12px 16px',background:'#fff',borderBottom:'1px solid #E2D8C8',boxShadow:'0 8px 20px rgba(0,30,71,.07)'}}>
        <div>
          <div style={{fontSize:10,fontWeight:900,letterSpacing:'.14em',color:'#7A1E2C'}}>MODELO DOCENTE · VISTA SEGURA</div>
          <div style={{fontSize:15,fontWeight:900,color:'#001E47',marginTop:2}}>{cfg.grupo || 'Grupo'} · {cfg.nivel} · {cfg.test==='TEST2'?'2.º examen escrito':'1.er examen escrito'} · Opción {cfg.opcion}</div>
          <div style={{fontSize:11.5,color:'#667085',marginTop:2}}>{showKey?'Las respuestas y guiones están visibles. No proyectés esta vista al estudiante.':'Así lo ve el estudiante, sin respuestas correctas ni guiones.'}</div>
        </div>
        <button type="button" onClick={()=>setShowKey(v=>!v)} style={{border:`1.5px solid ${showKey?'#7A1E2C':'#003B7A'}`,background:showKey?'#F7E8E9':'#E7F1FA',color:showKey?'#7A1E2C':'#003B7A',padding:'10px 14px',borderRadius:10,fontWeight:900,cursor:'pointer',fontFamily:'inherit'}}>{showKey?'OCULTAR RESPUESTAS':'VER RESPUESTAS'}</button>
      </div>
      <div className="pv-banner" style={{'--lvl':tema.color,'--lvl-soft':tema.soft,'--lvl-ink':tema.ink,marginTop:12}}>
        <span className="pv-tag">{showKey?'CLAVE DOCENTE':'VISTA ESTUDIANTE'}</span>
        <span>{exam.id}</span>
        <span className="pv-dim">· audio disponible · el guion aparece únicamente al mostrar respuestas</span>
      </div>
      <ExamShell exam={exam} answers={{}} mode="preview" showKey={showKey} shell="premium" density="comfy" plan={cfg.plan}
        onOpenScript={setScriptSec}
        meta={{nombre:'Modelo para el docente',fecha:'',grupo:cfg.grupo,opcion:cfg.opcion,scoreLabel:'solo lectura'}} />
      <PvScript section={scriptSec} exam={exam} onClose={()=>setScriptSec(null)} />
    </div>
  );
}

function App() {
  const [view, setViewRaw] = React.useState(INITIAL_VIEW_CONFIG.view);
  const [nivel, setNivel] = React.useState('I2');
  const [test, setTest] = React.useState('TEST1'); // TEST1 (L18) | TEST2 (L32)
  const [opcion, setOpcion] = React.useState('A');
  const [shell, setShell] = React.useState('premium');
  const [density, setDensity] = React.useState('comfy');
  const [previewKey, setPreviewKey] = React.useState(true);
  const [previewExam, setPreviewExam] = React.useState(null);
  const [plan, setPlan] = React.useState('ambos'); // ambos | con_ina | sin_ina

  const canEnter = (target) => INITIAL_VIEW_CONFIG.allowedViews.includes(target);
  const setView = (target) => {
    if (!canEnter(target)) return;
    setViewRaw(target);
  };
  const goPreview = (entry) => {
    if (!canEnter('preview')) return;
    setPreviewExam(entry);
    setViewRaw('preview');
  };

  if (!INITIAL_VIEW_CONFIG.authorized) {
    return <AccessBlockedView config={INITIAL_VIEW_CONFIG} />;
  }

  // F27: estudiante conectado a Apps Script. Ya no depende de una asignación
  // manual en sesión: lee cronograma + activación oficial + intento real.
  if (INITIAL_VIEW_CONFIG.role === 'student') {
    return (
      <div className="exapp">
        <main className="exmain">
          <StudentLiveExamApp />
        </main>
      </div>
    );
  }

  // Docente: vista operativa limpia, sin mensajes técnicos ni controles de administrador.
  if (INITIAL_VIEW_CONFIG.role === 'teacher') {
    return (
      <div className="exapp">
        <main className="exmain">
          {INITIAL_VIEW_CONFIG.view === 'teacher_preview'
            ? <TeacherPreviewLiveApp />
            : <TeacherMode shell="premium" density="comfy" />}
        </main>
      </div>
    );
  }

  return (
    <div className="exapp">
      {INITIAL_VIEW_CONFIG.controls && (
        <ControlBar {...{
          view, setView, allowedViews: INITIAL_VIEW_CONFIG.allowedViews,
          nivel, setNivel, test, setTest, opcion, setOpcion,
          shell, setShell, density, setDensity, previewKey, setPreviewKey, plan, setPlan
        }} />
      )}
      <main className="exmain">
        {view==='admin'   && <AdminMode shell={shell} density={density} onPreview={goPreview} />}
        {view==='preview' && <PreviewMode shell={shell} density={density} nivel={nivel} test={test} opcion={opcion} showKey={previewKey} entry={previewExam} plan={plan} />}
      </main>
    </div>
  );
}

function AccessBlockedView({ config }) {
  return (
    <div className="exapp">
      <main className="exmain">
        <div style={{
          maxWidth: 620, margin: '72px auto', padding: '30px 32px',
          borderRadius: 18, background: '#fff', border: '1px solid #E2D8C8',
          boxShadow: '0 18px 60px rgba(0,0,0,0.10)', fontFamily: 'Poppins, system-ui, sans-serif',
          textAlign: 'center', color: '#001E47',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px',
            borderRadius: 999, background: '#F7E8E9', color: '#7A1E2C', fontSize: 11,
            fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14,
          }}>Acceso restringido</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 26, letterSpacing: '-0.03em' }}>Panel de exámenes no disponible</h2>
          <p style={{ margin: '0 auto 18px', maxWidth: 500, color: '#5A6472', fontSize: 14, lineHeight: 1.55 }}>
            {config.reason || 'Esta vista no está autorizada para la sesión actual.'}
          </p>
          <div style={{
            display: 'grid', gap: 8, maxWidth: 430, margin: '0 auto', padding: 12,
            borderRadius: 14, background: '#F8F6F1', color: '#4A413A', fontSize: 12.5,
            textAlign: 'left',
          }}>
            <div><b>Vista solicitada:</b> {VIEW_TITLES[config.requested] || config.requested || 'ninguna'}</div>
            <div><b>Rol detectado:</b> {config.role || 'sin validar'}</div>
            <div><b>Regla:</b> abrir siempre desde el campus principal y según rol.</div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StudentNoAssignmentView() {
  return (
    <div style={{
      maxWidth: 640, margin: '72px auto', padding: '30px 32px',
      borderRadius: 18, background: '#fff', border: '1px solid #E2D8C8',
      boxShadow: '0 18px 60px rgba(0,0,0,0.10)', fontFamily: 'Poppins, system-ui, sans-serif',
      textAlign: 'center', color: '#001E47',
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px',
        borderRadius: 999, background: '#FFF5D6', color: '#7A4A00', fontSize: 11,
        fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14,
      }}>Examen no asignado</div>
      <h2 style={{ margin: '0 0 8px', fontSize: 26, letterSpacing: '-0.03em' }}>No hay examen disponible</h2>
      <p style={{ margin: '0 auto 18px', maxWidth: 520, color: '#5A6472', fontSize: 14, lineHeight: 1.55 }}>
        El estudiante no puede escoger exámenes manualmente. Para mostrar un examen real,
        el campus debe recibir una asignación oficial desde cronograma/backend.
      </p>
      <div style={{
        display: 'grid', gap: 8, maxWidth: 460, margin: '0 auto', padding: 12,
        borderRadius: 14, background: '#F8F6F1', color: '#4A413A', fontSize: 12.5,
        textAlign: 'left',
      }}>
        <div><b>Regla:</b> sin asignación explícita no se carga ningún examen.</div>
        <div><b>Estado:</b> pendiente de activación real con backend.</div>
        <div><b>Seguridad:</b> se eliminó la asignación fija de demostración.</div>
      </div>
    </div>
  );
}


function ControlBar({ view, setView, allowedViews, nivel, setNivel, test, setTest, opcion, setOpcion, shell, setShell, density, setDensity, previewKey, setPreviewKey, plan, setPlan }) {
  const showKeyToggle = view==='preview';
  return (
    <div className="cbar">
      <div className="cbar-banner">
        <span className="cbar-eye">●</span>
        Exámenes institucionales · <b>Academia Norteamericana</b>
        <button type="button" onClick={()=>window.print()} style={{marginLeft:'auto',border:'1px solid currentColor',background:'#fff',color:'#073B7A',borderRadius:8,padding:'6px 10px',fontWeight:800,cursor:'pointer'}}>Imprimir / Guardar PDF</button>
      </div>
      <div className="cbar-row">
      <div className="cbar-brand">
        <img className="cbar-logo" src="../assets/logo_circular.jpg" alt="Academia Norteamericana" />
        <div>
          <div className="cbar-t">Exámenes · Sistema maestro</div>
          <div className="cbar-s">Catálogo administrativo · EXAM-MASTER-001</div>
        </div>
      </div>

      <div className="cbar-group">
        <label>Vista</label>
        <div className="seg">
          {VIEWS.filter(v => allowedViews.includes(v.k)).map(v => (
            <button key={v.k} className={view===v.k?'on':''} onClick={()=>setView(v.k)}>{v.t}</button>
          ))}
        </div>
      </div>

      <div className="cbar-group">
        <label>Prueba (test)</label>
        <div className="seg seg-sm">
          {[["TEST1","Prueba 1"],["TEST2","Prueba 2"]].map(([k,l]) =>
            <button key={k} className={test===k?'on':''} onClick={()=>setTest(k)}>{l}</button>)}
        </div>
      </div>

      <div className="cbar-group">
        <label>Opción asignada (examen)</label>
        <div className="seg seg-sm">
          {['A','B'].map(o => <button key={o} className={opcion===o?'on':''} onClick={()=>setOpcion(o)}>{o}</button>)}
        </div>
      </div>

      <div className="cbar-group">
        <label>Plan académico</label>
        <div className="seg seg-sm">
          {[["ambos","Ambos"],["con_ina","CON INA"],["sin_ina","SIN INA"]].map(([k,l]) =>
            <button key={k} className={plan===k?'on':''} onClick={()=>setPlan(k)}>{l}</button>)}
        </div>
      </div>

      <div className="cbar-group">
        <label>Tema por nivel</label>
        <div className="lvlswatches">
          {Object.keys(NIVEL_TEMA).map(k => (
            <button key={k} className={`lvlsw${nivel===k?' on':''}`} title={NIVEL_TEMA[k].nombre}
                    style={{ background:NIVEL_TEMA[k].color }} onClick={()=>setNivel(k)}>{nivel===k?NIVEL_TEMA[k].code:''}</button>
          ))}
        </div>
      </div>

      <div className="cbar-group">
        <label>Formato</label>
        <div className="seg seg-sm">
          {[["premium","Premium"],["compact","Compacto"],["sheet","Hoja"]].map(([k,l]) =>
            <button key={k} className={shell===k?'on':''} onClick={()=>setShell(k)}>{l}</button>)}
        </div>
      </div>

      <div className="cbar-group">
        <label>Densidad</label>
        <div className="seg seg-sm">
          {[["comfy","Cómoda"],["compact","Compacta"]].map(([k,l]) =>
            <button key={k} className={density===k?'on':''} onClick={()=>setDensity(k)}>{l}</button>)}
        </div>
      </div>

      <div className={`cbar-group${showKeyToggle?'':' dim'}`}>
        <label>Clave / preliminar</label>
        <button className={`tgl${previewKey?' on':''}`} disabled={!showKeyToggle} onClick={()=>setPreviewKey(v=>!v)}>
          <span className="tgl-dot" />{previewKey?'Visible':'Oculta'}
        </button>
      </div>
      </div>
    </div>
  );
}

// Preview/admin: el examen con o sin clave, tema por nivel
function PreviewMode({ shell, density, nivel, test='TEST1', opcion, showKey, entry, plan }) {
  const [scriptSec, setScriptSec] = React.useState(null);
  // Si viene una entrada del catálogo, usa su nivel/test/opción; si no, los
  // controles de auditoría.
  const eNivel = entry ? entry.nivel : nivel;
  const eTest  = entry ? (entry.leccion === 18 ? 'TEST1' : 'TEST2') : test;
  const eOpcion = entry ? entry.opcion : opcion;
  const tema = NIVEL_TEMA[eNivel];
  const exam = window.getExam ? window.getExam(eNivel, eTest, eOpcion) : null;
  const esReal = !!exam;
  const esDemoTema = eNivel !== 'I2' && eNivel !== 'I1' && eNivel !== 'B2' && eNivel !== 'B1'; // tema visual de otro nivel
  const SAMPLES = {
    'I2_WRITTEN_L18_TEST1_A': window.SUBMISSION_DEMO,
    'I2_WRITTEN_L18_TEST1_B': window.SUBMISSION_DEMO_I2_T1_B,
    'I2_WRITTEN_L32_TEST2_A': window.SUBMISSION_DEMO_T2,
    'I2_WRITTEN_L32_TEST2_B': window.SUBMISSION_DEMO_I2_T2_B,
    'I1_WRITTEN_L18_TEST1_A': window.SUBMISSION_DEMO_I1_T1,
    'I1_WRITTEN_L18_TEST1_B': window.SUBMISSION_DEMO_I1_T1_B,
    'I1_WRITTEN_L32_TEST2_A': window.SUBMISSION_DEMO_I1_T2,
    'I1_WRITTEN_L32_TEST2_B': window.SUBMISSION_DEMO_I1_T2_B,
    'B2_WRITTEN_L18_TEST1_A': window.SUBMISSION_DEMO_B2_T1,
    'B2_WRITTEN_L18_TEST1_B': window.SUBMISSION_DEMO_B2_T1_B,
    'B2_WRITTEN_L32_TEST2_A': window.SUBMISSION_DEMO_B2_T2,
    'B2_WRITTEN_L32_TEST2_B': window.SUBMISSION_DEMO_B2_T2_B,
    'B1_WRITTEN_L18_TEST1_A': window.SUBMISSION_DEMO_B1_T1,
    'B1_WRITTEN_L32_TEST2_A': window.SUBMISSION_DEMO_B1_T2,
    'B1_WRITTEN_L18_TEST1_B': window.SUBMISSION_DEMO_B1_T1_B,
    'B1_WRITTEN_L32_TEST2_B': window.SUBMISSION_DEMO_B1_T2_B,
  };
  const sample = ((exam && SAMPLES[exam.id]) || window.SUBMISSION_DEMO).respuestas;
  const id = entry ? entry.id : window.examIdDe(eNivel, eTest, eOpcion);
  return (
    <div className="pvwrap">
      <div className="pv-banner" style={{ '--lvl':tema.color, '--lvl-soft':tema.soft, '--lvl-ink':tema.ink }}>
        <span className="pv-tag">PREVIEW / ADMIN</span>
        <span>{id}</span>
        <span className="pv-dim">· {esReal ? (showKey ? 'clave + corrección preliminar visibles' : 'clave oculta (vista estudiante)') : 'sin contenido real'}</span>
      </div>
      {!esReal && eOpcion === 'B' && (
        <div className="pv-demo">
          <b>Opción B pendiente de publicar.</b> Esta variante (reposición / casos autorizados)
          aún no tiene contenido. No se renderiza el examen de la Opción A bajo la etiqueta Opción B.
        </div>
      )}
      {!esReal && eOpcion === 'A' && esDemoTema && (
        <div className="pv-demo">
          <b>Solo demostración de tema visual.</b> No representa un examen real de {tema.nombre}.
          Los 16 exámenes escritos ya tienen contenido real: B1/B2/I1/I2 · Prueba 1/2 · Opción A/B.
        </div>
      )}
      {esReal
        ? <>
            <ExamShell exam={exam} answers={showKey ? sample : {}} mode="preview" showKey={showKey}
                       shell={shell} density={density} plan={plan}
                       onOpenScript={setScriptSec}
                       meta={{ nombre:'— muestra —', fecha:'preview', grupo:'I2-LM-0625', opcion:eOpcion, scoreLabel:`muestra` }} />
            <PvScript section={scriptSec} exam={exam} onClose={()=>setScriptSec(null)} />
          </>
        : <div className="pv-empty">
            <div className="pv-empty-ic">⌛</div>
            <h3>Sin contenido para mostrar</h3>
            <p>{eOpcion === 'B'
                ? 'La Opción B aún no está publicada. No se carga contenido de la Opción A.'
                : `Solo demostración visual del nivel ${tema.nombre}. No hay examen real para esta combinación.`}</p>
          </div>}
    </div>
  );
}
function PvScript({ section, exam, onClose }) {
  if (!section) return null;
  const lines = exam.audioScript[section] || [];
  return (
    <div className="exov" onClick={onClose}>
      <div className="exov-card" onClick={e=>e.stopPropagation()}>
        <div className="exov-h"><h3>Guion de audio · Sección {section}</h3><span className="exov-tag">solo docente</span><button className="exov-x" onClick={onClose}>✕</button></div>
        <div className="exov-body">{lines.map(([w,t],i)=><p key={i} className="exov-line">{w && <b>{w}:</b>} {t}</p>)}</div>
        <div className="exov-foot">El guion nunca es visible para el estudiante durante el examen oficial.</div>
      </div>
    </div>
  );
}

class ExamRuntimeBoundaryF950 extends React.Component {
  constructor(props) { super(props); this.state = { error:null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) {
    try { console.error('F95 exam runtime error', error); } catch (_) {}
  }
  render() {
    if (!this.state.error) return this.props.children;
    const msg = this.state.error && this.state.error.message ? this.state.error.message : String(this.state.error || 'Error desconocido');
    return <div className="exapp"><main className="exmain"><StudentLiveStatusCard title="El módulo de exámenes se detuvo" badge="Error visible" tone="red" onRefresh={()=>window.location.reload()}>Ya no se ocultará detrás de una pantalla en blanco. Detalle técnico: {msg}</StudentLiveStatusCard></main></div>;
  }
}

const EXAM_ROOT_F950 = document.getElementById('root');
ReactDOM.createRoot(EXAM_ROOT_F950).render(<ExamRuntimeBoundaryF950><App /></ExamRuntimeBoundaryF950>);
(function confirmExamMountF950(tries) {
  try {
    if (EXAM_ROOT_F950 && EXAM_ROOT_F950.querySelector('.exapp')) {
      window.__EXAMENES_BOOT_OK__ = true;
      EXAM_ROOT_F950.setAttribute('data-exam-boot', 'F95.0');
      return;
    }
  } catch (_) {}
  if (tries < 35) window.setTimeout(() => confirmExamMountF950(tries + 1), 100);
})(0);
