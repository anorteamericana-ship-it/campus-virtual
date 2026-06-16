/* global React, ReactDOM, NIVEL_TEMA, StudentMode, TeacherMode, AdminMode, ExamShell, EXAM_I2_T1_A, themedExam */
// examenes_app.jsx — shell + barra de control (auditoría / tweaks)
const { useState } = React;

const VIEWS = [
  { k:'student', t:'Estudiante' },
  { k:'teacher', t:'Profesor' },
  { k:'admin',   t:'Administrador' },
  { k:'preview', t:'Preview' },
];

function readInitialViewConfig() {
  try {
    const params = new URLSearchParams(window.location.search || '');
    const raw = String(params.get('view') || '').trim().toLowerCase();
    const allowed = VIEWS.some(v => v.k === raw);
    return {
      view: allowed ? raw : 'student',
      explicit: !!raw && allowed,
      studentLocked: allowed && raw === 'student',
    };
  } catch (_) {
    return { view: 'student', explicit: false, studentLocked: false };
  }
}

const INITIAL_VIEW_CONFIG = readInitialViewConfig();

// ── auditMode ───────────────────────────────────────────────────────────
// true  → panel de auditoría montado (admin/docente/preview): se puede
//         cambiar vista, opción, plan, nivel visual, clave/preview.
// false → estudiante entra DIRECTO a su examen asignado. NO se monta el
//         panel; no puede cambiar opción/plan/nivel, ni ver clave, ni entrar
//         a profesor/admin/preview.
// En campus principal admin/superadmin carga ?view=admin. Si alguien carga
// explícitamente ?view=student, se bloquea en modo estudiante asignado.
const AUDIT_MODE = !INITIAL_VIEW_CONFIG.studentLocked;

// Asignación oficial del estudiante (vendría del cronograma/backend).
const ASIGNACION = { nivel: 'I2', test: 'TEST1', opcion: 'A', plan: 'con_ina' };

function App() {
  const [view, setView] = useState(INITIAL_VIEW_CONFIG.view);
  const [nivel, setNivel] = useState('I2');
  const [test, setTest] = useState('TEST1'); // TEST1 (L18) | TEST2 (L32)
  const [opcion, setOpcion] = useState('A');
  const [shell, setShell] = useState('premium');
  const [density, setDensity] = useState('comfy');
  const [previewKey, setPreviewKey] = useState(true);
  const [previewExam, setPreviewExam] = useState(null);
  const [plan, setPlan] = useState('ambos'); // ambos | con_ina | sin_ina

  const goPreview = (entry) => { setPreviewExam(entry); setView('preview'); };

  // Sin auditoría: el estudiante solo ve su examen asignado, sin controles.
  if (!AUDIT_MODE) {
    return (
      <div className="exapp">
        <main className="exmain">
          <StudentMode shell="premium" density="comfy"
                       nivel={ASIGNACION.nivel} test={ASIGNACION.test}
                       opcion={ASIGNACION.opcion} plan={ASIGNACION.plan} />
        </main>
      </div>
    );
  }

  return (
    <div className="exapp">
      <ControlBar {...{ view, setView, nivel, setNivel, test, setTest, opcion, setOpcion, shell, setShell, density, setDensity, previewKey, setPreviewKey, plan, setPlan }} />
      <main className="exmain">
        {view==='student' && <StudentMode shell={shell} density={density} nivel={nivel} test={test} opcion={opcion} plan={plan} />}
        {view==='teacher' && <TeacherMode shell={shell} density={density} />}
        {view==='admin'   && <AdminMode shell={shell} density={density} onPreview={goPreview} />}
        {view==='preview' && <PreviewMode shell={shell} density={density} nivel={nivel} test={test} opcion={opcion} showKey={previewKey} entry={previewExam} plan={plan} />}
      </main>
    </div>
  );
}

function ControlBar({ view, setView, nivel, setNivel, test, setTest, opcion, setOpcion, shell, setShell, density, setDensity, previewKey, setPreviewKey, plan, setPlan }) {
  const tema = NIVEL_TEMA[nivel];
  const showKeyToggle = view==='preview';
  const themeable = view==='preview' || view==='admin';
  return (
    <div className="cbar">
      <div className="cbar-banner">
        <span className="cbar-eye">👁</span>
        Panel de auditoría · <b>no visible para el estudiante</b> · solo para administración / docente / preview
      </div>
      <div className="cbar-row">
      <div className="cbar-brand">
        <span className="cbar-logo">AN</span>
        <div>
          <div className="cbar-t">Exámenes · Sistema maestro</div>
          <div className="cbar-s">Maqueta de auditoría · sin backend · EXAM-MASTER-001</div>
        </div>
      </div>

      <div className="cbar-group">
        <label>Vista</label>
        <div className="seg">
          {VIEWS.map(v => <button key={v.k} className={view===v.k?'on':''} onClick={()=>setView(v.k)}>{v.t}</button>)}
        </div>
      </div>

      <div className="cbar-group">
        <label>Prueba (test)</label>
        <div className="seg seg-sm">
          {[['TEST1','Prueba 1'],['TEST2','Prueba 2']].map(([k,l]) =>
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
          {[['ambos','Ambos'],['con_ina','CON INA'],['sin_ina','SIN INA']].map(([k,l]) =>
            <button key={k} className={plan===k?'on':''} onClick={()=>setPlan(k)}>{l}</button>)}
        </div>
      </div>

      <div className={`cbar-group${themeable?'':' dim'}`}>
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
          {[['premium','Premium'],['compact','Compacto'],['sheet','Hoja']].map(([k,l]) =>
            <button key={k} className={shell===k?'on':''} onClick={()=>setShell(k)}>{l}</button>)}
        </div>
      </div>

      <div className="cbar-group">
        <label>Densidad</label>
        <div className="seg seg-sm">
          {[['comfy','Cómoda'],['compact','Compacta']].map(([k,l]) =>
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
