/* global React, ReactDOM, Toast, Sidebar, STUDENT,
   StudentDashboard, NotasView, TareasView, MaterialesView, ICANView, ICANViewNew,
   MensajesView, PagosView, CertificadosView, PerfilView,
   ExamenOralView, TeacherDashboard, GruposView, CalificarView, AsistenciaView,
   AdminDashboard, AdminGruposView, FinanzasView, AdminPlaceholderView,
   AdminHorasDocentesView, WelcomeBanner, MatriculasView, AdminEstudiantesView */

const { useState, useEffect } = React;

// ── TWEAKABLE DEFAULTS ─────────────────────────────────────────────────────
const TWEAKS = /*EDITMODE-BEGIN*/{
  "showAmounts": true,
  "cuotasInline": true,
  "defaultRole": "student",
  "heroStyle": "soft",
  "bundleDiscount": true
}/*EDITMODE-END*/;

function App() {
  const [role, setRole] = useState(() => localStorage.getItem('an_role') || TWEAKS.defaultRole || 'student');
  const [active, setActive] = useState(() => localStorage.getItem('an_active') || 'dashboard');
  const [toastMsg, setToastMsg] = useState('');
  const [tweaks, setTweaks] = useState(TWEAKS);
  const [editMode, setEditMode] = useState(false);
  const [pendingLesson, setPendingLesson] = useState(null);
  const navigateTo = (target, opts = {}) => {
    if (opts.lesson) setPendingLesson(opts.lesson);
    else setPendingLesson(null);
    setActive(target);
  };
  // Welcome banner: shown once for student after login (unless dismissed)
  const [showWelcome, setShowWelcome] = useState(() => {
    const hasLoginFlag = sessionStorage.getItem('an_just_logged_in') === '1';
    const dismissed = localStorage.getItem('an_welcome_dismissed') === '1';
    return hasLoginFlag && !dismissed;
  });
  const closeWelcome = () => {
    setShowWelcome(false);
    sessionStorage.removeItem('an_just_logged_in');
    localStorage.setItem('an_welcome_dismissed', '1');
  };

  useEffect(() => { localStorage.setItem('an_role', role); }, [role]);
  useEffect(() => { localStorage.setItem('an_active', active); }, [active]);

  // ── Edit mode protocol ──────────────────────────────────────────────────
  useEffect(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setEditMode(true);
      else if (d.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', onMsg);
    // Announce availability after listener is live
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const updateTweak = (key, value) => {
    setTweaks(t => ({ ...t, [key]: value }));
    try {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: value } }, '*');
    } catch (e) { /* noop */ }
  };

  const toast = (m) => setToastMsg(m);

  // Route
  let content = null;
  if (role === 'student') {
    const map = {
      dashboard:    <StudentDashboard toast={toast} onNavigate={setActive} />,
      notas:        <NotasView toast={toast} />,
      tareas:       <TareasView toast={toast} />,
      materiales:   <MaterialesView initialLesson={pendingLesson} />,
      ican:         <ICANViewNew toast={toast} role="student" />,
      mensajes:     <MensajesView />,
      pagos:        <PagosView tweaks={tweaks} />,
      certificados: <CertificadosView />,
      perfil:       <PerfilView onNavigate={navigateTo} />,
    };
    content = map[active] || map.dashboard;
  } else if (role === 'teacher') {
    const map = {
      dashboard:   <TeacherDashboard setActive={setActive} />,
      grupos:      <GruposView />,
      calificar:   <CalificarView toast={toast} />,
      asistencia:  <AsistenciaView toast={toast} />,
      calendario:  <CalendarioView />,
      materiales:  <MaterialesView />,
      ican:        <ICANViewNew toast={toast} role="teacher" />,
      mensajes:    <MensajesView />,
      perfil:      <PerfilView />,
    };
    content = map[active] || map.dashboard;
  } else {
    const map = {
      matriculas:    <MatriculasView />,
      dashboard:    <AdminDashboard setActive={setActive} />,
      grupos:       <AdminGruposView />,
      estudiantes:  <AdminEstudiantesView />,
      docentes:     <AdminPlaceholderView title="Docentes" />,
      finanzas:     <FinanzasView />,
      horas:        <AdminHorasDocentesView />,
      ican:         <ICANViewNew toast={toast} role="admin" />,
      reportes:     <AdminPlaceholderView title="Reportes" />,
      config:       <AdminPlaceholderView title="Configuración" />,
    };
    content = map[active] || map.dashboard;
  }

  return (
    <div className="app">
      <Sidebar role={role} setRole={setRole} active={active} setActive={setActive} student={STUDENT} />
      <main className="main">{content}</main>
      <Toast msg={toastMsg} onClose={() => setToastMsg('')} />
      {editMode && <TweaksPanel tweaks={tweaks} update={updateTweak} />}
      {showWelcome && role === 'student' && <WelcomeBanner onClose={closeWelcome} />}
    </div>
  );
}

// ── Tweaks panel ──────────────────────────────────────────────────────────
function TweaksPanel({ tweaks, update }) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div style={{
      position:'fixed', bottom:20, right:20, zIndex:200,
      width: collapsed ? 180 : 320,
      background:'var(--surface)',
      border:'1px solid var(--line)',
      borderRadius:'var(--r-lg)',
      boxShadow:'var(--sh-3)',
      fontFamily:'var(--f-sans)',
      overflow:'hidden',
      transition:'width .2s',
    }}>
      {/* Header */}
      <div
        onClick={() => setCollapsed(v => !v)}
        style={{
          padding:'12px 16px',
          background:'var(--an-navy)',
          color:'white',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          gap:10, cursor:'pointer',
        }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>Tweaks</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition:'transform .2s', opacity:0.75 }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {!collapsed && (
        <div style={{ padding:'14px 16px 16px', display:'flex', flexDirection:'column', gap:14 }}>
          <TweakSection title="Estado de cuenta">
            <TweakToggle
              label="Mostrar montos por defecto"
              hint="Cuando está activo, el estudiante ve los montos sin tener que pedirlos."
              value={tweaks.showAmounts}
              onChange={(v) => update('showAmounts', v)}
            />
            <TweakToggle
              label="Cuotas en línea"
              hint="Las 4 cuotas del nivel en fila (cómo normalmente se pagan)."
              value={tweaks.cuotasInline}
              onChange={(v) => update('cuotasInline', v)}
            />
            <TweakToggle
              label="Oferta 'Pagar ciclo completo'"
              hint="Sugiere pagar las 4 cuotas juntas con un CTA destacado."
              value={tweaks.bundleDiscount}
              onChange={(v) => update('bundleDiscount', v)}
            />
          </TweakSection>

          <TweakSection title="Sesión">
            <TweakPills
              label="Rol de entrada"
              options={[
                { id:'student', label:'Estudiante' },
                { id:'teacher', label:'Docente' },
                { id:'admin',   label:'Admin' },
              ]}
              value={tweaks.defaultRole}
              onChange={(v) => update('defaultRole', v)}
            />
          </TweakSection>

          <TweakSection title="Tono visual">
            <TweakPills
              label="Hero de pagos"
              options={[
                { id:'soft',   label:'Suave' },
                { id:'strong', label:'Fuerte' },
                { id:'none',   label:'Sin hero' },
              ]}
              value={tweaks.heroStyle}
              onChange={(v) => update('heroStyle', v)}
            />
          </TweakSection>

          <div style={{
            fontSize:10, color:'var(--ink-3)', letterSpacing:'0.06em',
            textTransform:'uppercase', textAlign:'center', paddingTop:4,
            borderTop:'1px dashed var(--line)',
          }}>
            Cambios se guardan automáticamente
          </div>
        </div>
      )}
    </div>
  );
}

function TweakSection({ title, children }) {
  return (
    <div>
      <div style={{
        fontSize:10, fontWeight:700, letterSpacing:'0.14em',
        textTransform:'uppercase', color:'var(--an-granate)',
        marginBottom:8,
      }}>{title}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>{children}</div>
    </div>
  );
}

function TweakToggle({ label, hint, value, onChange }) {
  return (
    <label style={{
      display:'grid', gridTemplateColumns:'1fr auto', gap:10, alignItems:'center',
      cursor:'pointer', padding:'2px 0',
    }}>
      <div>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>{label}</div>
        {hint && <div style={{ fontSize:10, color:'var(--ink-3)', marginTop:2, lineHeight:1.35 }}>{hint}</div>}
      </div>
      <div
        role="switch" aria-checked={!!value}
        onClick={() => onChange(!value)}
        style={{
          width:34, height:20, borderRadius:10,
          background: value ? 'var(--ok)' : 'var(--line-2)',
          position:'relative', transition:'background .15s',
          flexShrink:0,
        }}>
        <div style={{
          position:'absolute', top:2, left: value ? 16 : 2,
          width:16, height:16, borderRadius:'50%',
          background:'white', boxShadow:'0 1px 2px rgba(0,0,0,0.2)',
          transition:'left .15s',
        }} />
      </div>
    </label>
  );
}

function TweakPills({ label, options, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize:12, fontWeight:600, color:'var(--ink)', marginBottom:6 }}>{label}</div>
      <div style={{
        display:'grid', gridTemplateColumns:`repeat(${options.length}, 1fr)`,
        gap:4, padding:3, background:'var(--bg-deep)', borderRadius:'var(--r-md)',
      }}>
        {options.map(o => (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            border:'none', padding:'6px 8px', borderRadius:8,
            fontSize:11, fontWeight:600, letterSpacing:'0.02em',
            background: value === o.id ? 'var(--an-navy)' : 'transparent',
            color: value === o.id ? 'white' : 'var(--ink-2)',
            cursor:'pointer', transition:'all .15s',
          }}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
