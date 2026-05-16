/* global React, ReactDOM, Toast, Sidebar, STUDENT,
   StudentDashboard, NotasView, TareasView, MaterialesView, ICANView, ICANViewNew,
   MensajesView, PagosView, CertificadosView, PerfilView,
   ExamenOralView, TeacherDashboard, GruposView, CalificarView, AsistenciaView,
   AdminDashboard, AdminGruposView, FinanzasView, AdminPlaceholderView,
   AdminHorasDocentesView, WelcomeBanner, MatriculasView, AdminEstudiantesView,
   CronogramaModulo, CronogramaGrupo, BuscadorEstudiantes, ImportadorBancario, AplicarPago */

const { useState, useEffect } = React;

function App() {
  const [role, setRole] = useState(() => localStorage.getItem('an_role') || 'student');
  const [active, setActive] = useState(() => localStorage.getItem('an_active') || 'dashboard');
  const [toastMsg, setToastMsg] = useState('');
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

  const toast = (m) => setToastMsg(m);

  // Route
  let content = null;
  if (role === 'student') {
    const map = {
      cronograma:    <CronogramaModulo />,
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

  return (
    <div className="app">
      <Sidebar role={role} setRole={setRole} active={active} setActive={setActive} student={STUDENT} />
      <main className="main">{content}</main>
      <Toast msg={toastMsg} onClose={() => setToastMsg('')} />
      {showWelcome && role === 'student' && <WelcomeBanner onClose={closeWelcome} />}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
