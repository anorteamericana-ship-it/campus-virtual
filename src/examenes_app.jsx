/* global React, ReactDOM, NIVEL_TEMA, StudentMode, TeacherMode, AdminMode, ExamShell, EXAM_I2_T1_A, themedExam */
// examenes_app.jsx — shell + barra de control (auditoría / tweaks)
const { useState } = React;

const VIEWS = [
  { k:'student', t:'Estudiante' },
  { k:'teacher', t:'Profesor' },
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
    teacher: ['teacher'],
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

function App() {
  const [view, setViewRaw] = useState(INITIAL_VIEW_CONFIG.view);
  const [nivel, setNivel] = useState('I2');
  const [test, setTest] = useState('TEST1'); // TEST1 (L18) | TEST2 (L32)
  const [opcion, setOpcion] = useState('A');
  const [shell, setShell] = useState('premium');
  const [density, setDensity] = useState('comfy');
  const [previewKey, setPreviewKey] = useState(true);
  const [previewExam, setPreviewExam] = useState(null);
  const [plan, setPlan] = useState('ambos'); // ambos | con_ina | sin_ina

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

  // Estudiante: solo examen asignado por sesión/backend futuro. Sin
  // asignación explícita, NO se carga ningún examen real ni demo fijo.
  if (INITIAL_VIEW_CONFIG.role === 'student') {
    const asig = INITIAL_VIEW_CONFIG.studentAssignment;
    return (
      <div className="exapp">
        <main className="exmain">
          {asig
            ? <StudentMode shell="premium" density="comfy"
                           nivel={asig.nivel} test={asig.test}
                           opcion={asig.opcion} plan={asig.plan} />
            : <StudentNoAssignmentView />}
        </main>
      </div>
    );
  }

  // Docente: vista fija de profesor. No puede saltar a Admin ni Preview desde
  // este shell. La operación real de guardado queda para una fase con backend.
  if (INITIAL_VIEW_CONFIG.role === 'teacher') {
    return (
      <div className="exapp">
        <RoleLockBanner role="teacher" />
        <main className="exmain">
          <TeacherMode shell="premium" density="comfy" />
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

function RoleLockBanner({ role }) {
  const label = role === 'teacher' ? 'Modo profesor' : 'Modo restringido';
  return (
    <div className="cbar-banner" style={{ margin: 12 }}>
      <span className="cbar-eye">🔒</span>
      {label} · vista fija sin acceso a administrador ni preview. Guardado real pendiente de backend.
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
        <span className="cbar-eye">👁</span>
        Panel de auditoría · <b>solo administración</b> · backend parcial conectado, sin estudiante real ni Mis Notas
      </div>
      <div className="cbar-row">
      <div className="cbar-brand">
        <span className="cbar-logo">AN</span>
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

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
