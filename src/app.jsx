/* global React, ReactDOM, Toast, Sidebar, getSesion, setSesion,
   StudentDashboard, NotasView, TareasView, MaterialesView, InfoProgramaView, ICANView, ICANViewNew,
   MensajesView, PagosView, CertificadosView, PerfilView,
   ExamenOralView, GruposView, CalificarView, AsistenciaView,
   AdminDashboard, AdminGruposView, WelcomeBanner, MatriculasView, AdminEstudiantesView,
   CronogramaModulo, CronogramaGrupo, BuscadorEstudiantes, ImportadorBancario, AplicarPago,
   VistaDocente, PanelAdminSupervision, PanelSuspensiones */

// ── Placeholder para ítems del menú admin marcados "Próximamente" ──────
// (Bloque 2: docentes / horas / ican / finanzas / reportes / config no
// están conectados. En el sidebar se ven atenuados y no navegan; este
// componente es una red de seguridad por si alguien llega vía URL/state
// antiguo. NO renderiza datos demo.)
function ProximamenteView({ title }) {
  return (
    <div data-screen-label={'Admin · ' + title + ' (próximamente)'} style={{
      maxWidth: 640, margin: '64px auto', padding: '28px 30px',
      background: 'var(--surface-2)',
      border: '1px dashed var(--line-2)',
      borderRadius: 'var(--r-md)',
      fontFamily: 'var(--f-sans)',
      textAlign: 'center',
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 10px', borderRadius: 999,
        background: 'color-mix(in srgb, var(--ink-3) 18%, transparent)',
        color: 'var(--ink-2)', fontSize: 10.5, fontWeight: 800,
        letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 14,
      }}>Próximamente</div>
      <div style={{ fontFamily: 'var(--f-serif)', fontSize: 26, fontWeight: 500,
                    color: 'var(--an-navy-ink)', letterSpacing: '-0.02em', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>
        Este módulo aún no está conectado. Lo habilitamos en una próxima
        iteración, con datos reales.
      </div>
    </div>
  );
}

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
        background: 'repeating-linear-gradient(135deg, #001E47 0 14px, #002F6C 14px 28px)',
        color: 'white',
        fontFamily: 'var(--f-sans, system-ui)',
        fontSize: 12.5,
        letterSpacing: '0.01em',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
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
          background: '#DA291C', boxShadow: '0 0 0 3px rgba(218,41,28,0.30)',
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
          color: '#002F6C',
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
  // pendingGrupo: el grupo con el que arranca filtrada la vista Estudiantes
  // cuando se navega desde el detalle de una lección en el Cronograma.
  const [pendingGrupo, setPendingGrupo] = useState(null);
  const [modoPrueba, setModoPrueba] = useState(() => getModoPrueba());

  const navigateTo = (target, opts = {}) => {
    if (opts.lesson) setPendingLesson(opts.lesson);
    else setPendingLesson(null);
    if (opts.grupo) setPendingGrupo(opts.grupo);
    else setPendingGrupo(null);
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
      info_programa: <InfoProgramaView />,
      ican:         <ICANViewNew toast={toast} role="student" />,
      mensajes:     <MensajesView />,
      pagos:        <PagosView />,
      certificados: <CertificadosView />,
      perfil:       <PerfilView onNavigate={navigateTo} />,
    };
    content = map[active] || map.dashboard;
  } else if (role === 'teacher') {
    // VistaDocente es la pantalla principal del docente. El antiguo
    // TeacherDashboard se eliminó (bloque 2). 'dashboard' queda como
    // alias por compatibilidad con an_active viejo en localStorage.
    const map = {
      dashboard:        <VistaDocente />,
      mi_panel_docente: <VistaDocente />,
      grupos:      <GruposView />,
      calificar:   <CalificarView toast={toast} />,
      asistencia:  <AsistenciaView toast={toast} />,
      cronograma_grupo: <CronogramaGrupo rol="teacher" />,
      materiales:  <MaterialesView />,
      ican:        <ProximamenteView title="Club I CAN" />,
      mensajes:    <MensajesView />,
      perfil:      <PerfilView />,
    };
    content = map[active] || map.mi_panel_docente;
  } else {
    // Admin / superadmin. Los 6 ítems "Próximamente" (docentes, horas,
    // ican, finanzas, reportes, config) van a ProximamenteView — no
    // hay datos demo en producción. El sidebar además los presenta
    // como no-clickeables; esto es la red de seguridad por si el id
    // llega vía state antiguo.
    const map = {
      matriculas:    <MatriculasView onNavigate={navigateTo} />,
      dashboard:    <AdminDashboard setActive={setActive} />,
      supervision:  <PanelAdminSupervision />,
      suspensiones: <PanelSuspensiones />,
      grupos:       <AdminGruposView />,
      estudiantes:  <AdminEstudiantesView onNavigate={navigateTo} grupoInicial={pendingGrupo} />,
      cronograma_grupo: <CronogramaGrupo rol="admin" onNavigate={navigateTo} />,
      buscador:     <BuscadorEstudiantes />,
      banco:        <ImportadorBancario />,
      aplicar_pago: <AplicarPago />,
      // — Próximamente (sin datos demo) ——————————————————————
      docentes:  <ProximamenteView title="Docentes" />,
      horas:     <ProximamenteView title="Horas docentes" />,
      ican:      <ProximamenteView title="Club I CAN" />,
      finanzas:  <ProximamenteView title="Finanzas" />,
      reportes:  <ProximamenteView title="Reportes" />,
      config:    <ProximamenteView title="Configuración" />,
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
