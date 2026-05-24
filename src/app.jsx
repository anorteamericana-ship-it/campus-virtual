/* global React, ReactDOM, Toast, Sidebar, getSesion, setSesion,
   StudentDashboard, NotasView, TareasView, MaterialesView, ICANView, ICANViewNew,
   MensajesView, PagosView, CertificadosView, PerfilView,
   ExamenOralView, TeacherDashboard, GruposView, CalificarView, AsistenciaView,
   AdminDashboard, AdminGruposView, FinanzasView, AdminPlaceholderView,
   AdminHorasDocentesView, WelcomeBanner, MatriculasView, AdminEstudiantesView,
   CronogramaModulo, CronogramaGrupo, BuscadorEstudiantes, ImportadorBancario, AplicarPago,
   VistaDocente, PanelAdminSupervision, PanelSuspensiones */

const { useState, useEffect } = React;

// ── Guard: si no hay sesión → mandar a login.html ────────────────────────
// Lo hacemos FUERA del render para evitar que React monte el árbol con
// estado basura (rol demo, dashboards vacíos, etc). Si vuelve true,
// abortamos el render del campus.
function ensureSesion() {
  const u = getSesion();
  if (!u) {
    window.location.replace('login.html');
    return null;
  }
  return u;
}

// ── Lee el flag de modo prueba (superadmin viendo como otro) ─────────────
function getModoPrueba() {
  try {
    const raw = sessionStorage.getItem('an_modo_prueba');
    if (!raw) return null;
    const m = JSON.parse(raw);
    if (!m || !m.original) return null;
    return m; // { original: <an_usuario_obj_del_superadmin> }
  } catch (_) {
    return null;
  }
}

// ── Cinta superior: solo visible en modo prueba ──────────────────────────
function ModoPruebaRibbon({ usuario, onVolver }) {
  const rolLabel =
    usuario.rol === 'student' ? 'estudiante'
    : usuario.rol === 'teacher' ? 'docente'
    : usuario.rol === 'admin'   ? 'administrador'
    : usuario.rol;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '8px 18px',
        background: 'repeating-linear-gradient(135deg, #2A1A1F 0 14px, #3A2026 14px 28px)',
        color: 'white',
        fontFamily: 'var(--f-sans, system-ui)',
        fontSize: 12.5,
        letterSpacing: '0.01em',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 9px', borderRadius: 999,
        background: 'rgba(255,255,255,0.14)',
        fontWeight: 800, letterSpacing: '0.14em', fontSize: 10.5, textTransform: 'uppercase',
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#FFC857', boxShadow: '0 0 0 3px rgba(255,200,87,0.22)',
        }} />
        Modo prueba
      </span>
      <span style={{ opacity: 0.92 }}>
        Viendo el campus como <strong>{usuario.nombre || '—'}</strong>{' '}
        (<em>{rolLabel}</em>
        {usuario.grupo ? <> · grupo <strong>{usuario.grupo}</strong></> : null}
        {usuario.codigo ? <> · código <strong>{usuario.codigo}</strong></> : null}
        )
      </span>
      <span style={{ flex: 1 }} />
      <button
        type="button"
        onClick={onVolver}
        style={{
          padding: '6px 12px',
          background: 'white',
          color: '#2A1A1F',
          border: 'none',
          borderRadius: 6,
          fontFamily: 'inherit',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        ← Volver a superadmin
      </button>
    </div>
  );
}

function App() {
  // Sesión obligatoria. Si no hay, ya nos redirigió ensureSesion().
  const sesionInicial = React.useMemo(() => getSesion(), []);
  const [usuario, setUsuario] = useState(sesionInicial);

  // Rol REAL — viene tal cual del backend (incluye 'superadmin').
  const rolReal = usuario?.rol || 'student';

  // Para navegación, superadmin usa las vistas de admin. El rol real se
  // conserva en `usuario.rol` para cualquier permiso especial.
  const role =
    rolReal === 'superadmin' ? 'admin'
    : rolReal === 'teacher'   ? 'teacher'
    : rolReal === 'student'   ? 'student'
    : 'admin';

  const [active, setActive] = useState(() => localStorage.getItem('an_active') || 'dashboard');
  const [toastMsg, setToastMsg] = useState('');
  const [pendingLesson, setPendingLesson] = useState(null);
  const [modoPrueba, setModoPrueba] = useState(() => getModoPrueba());

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

  useEffect(() => { localStorage.setItem('an_active', active); }, [active]);

  // Si otro componente reescribe `an_usuario` (típicamente el Modo prueba
  // del superadmin), refrescamos el estado de App para que el router
  // recalcule el rol efectivo. Escuchamos también nuestro evento custom.
  useEffect(() => {
    const handler = () => {
      const u = getSesion();
      if (!u) { window.location.replace('login.html'); return; }
      setUsuario(u);
      setModoPrueba(getModoPrueba());
      setActive('dashboard');
    };
    window.addEventListener('an:session-changed', handler);
    return () => window.removeEventListener('an:session-changed', handler);
  }, []);

  const volverASuperadmin = () => {
    if (!modoPrueba?.original) return;
    setSesion(modoPrueba.original);
    sessionStorage.removeItem('an_modo_prueba');
    window.dispatchEvent(new Event('an:session-changed'));
  };

  const toast = (m) => setToastMsg(m);

  // Sin sesión válida tras el primer render → no montar nada.
  if (!usuario) return null;

  // Route
  let content = null;
  if (role === 'student') {
    const map = {
      cronograma_grupo: <CronogramaGrupo rol="student" />,
      dashboard:    <StudentDashboard toast={toast} onNavigate={setActive} />,
      notas:        <NotasView toast={toast} />,
      tareas:       <TareasView toast={toast} />,
      materiales:   <MaterialesView initialLesson={pendingLesson} />,
      ican:         <ICANViewNew toast={toast} role="student" />,
      mensajes:     <MensajesView />,
      pagos:        <PagosView />,
      certificados: <CertificadosView />,
      perfil:       <PerfilView onNavigate={navigateTo} />,
    };
    content = map[active] || map.dashboard;
  } else if (role === 'teacher') {
    const map = {
      dashboard:   <TeacherDashboard setActive={setActive} />,
      mi_panel_docente: <VistaDocente />,
      grupos:      <GruposView />,
      calificar:   <CalificarView toast={toast} />,
      asistencia:  <AsistenciaView toast={toast} />,
      cronograma_grupo: <CronogramaGrupo rol="teacher" />,
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
      supervision:  <PanelAdminSupervision />,
      suspensiones: <PanelSuspensiones />,
      grupos:       <AdminGruposView />,
      estudiantes:  <AdminEstudiantesView onNavigate={navigateTo} />,
      cronograma_grupo: <CronogramaGrupo rol="admin" />,
      buscador:     <BuscadorEstudiantes />,
      banco:        <ImportadorBancario />,
      docentes:     <AdminPlaceholderView title="Docentes" />,
      finanzas:     <FinanzasView />,
      horas:        <AdminHorasDocentesView />,
      ican:         <ICANViewNew toast={toast} role="admin" />,
      reportes:     <AdminPlaceholderView title="Reportes" />,
      config:       <AdminPlaceholderView title="Configuración" />,
      aplicar_pago: <AplicarPago />,
    };
    content = map[active] || map.dashboard;
  }

  // setRole es no-op para la UI: el rol viene de an_usuario. Lo dejamos
  // disponible para componentes legacy hasta que migren.
  const setRoleNoop = () => {};

  return (
    <div className="app">
      <Sidebar
        role={role}
        rolReal={rolReal}
        usuario={usuario}
        setRole={setRoleNoop}
        active={active}
        setActive={setActive}
      />
      <main className="main">
        {modoPrueba && (
          <ModoPruebaRibbon usuario={usuario} onVolver={volverASuperadmin} />
        )}
        {content}
      </main>
      <Toast msg={toastMsg} onClose={() => setToastMsg('')} />
      {showWelcome && role === 'student' && <WelcomeBanner onClose={closeWelcome} />}
    </div>
  );
}

// Guard de sesión ANTES de render. Si falta, no montamos el árbol.
if (ensureSesion()) {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
}
