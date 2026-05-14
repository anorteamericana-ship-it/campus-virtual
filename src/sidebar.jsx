/* global React, Icon */
const { useState: _u1 } = React;

function Sidebar({ role, setRole, active, setActive, student, usuario, onLogout }) {
  // Datos del usuario logueado (sessionStorage > props)
  const usuarioSS = React.useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('an_usuario') || 'null'); } catch { return null; }
  }, []);
  const usr = usuario || usuarioSS;
  const studentNav = [
    { id: 'perfil', label: 'Mi Perfil', icon: 'profile' },
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'cronograma', label: 'Cronograma', icon: 'calendar' },
    { id: 'notas', label: 'Mis Notas', icon: 'grades' },
    { id: 'tareas', label: 'Tareas', icon: 'homework', badge: 3 },
    { id: 'materiales', label: 'Materiales', icon: 'materials' },
    { id: 'ican', label: 'Club I CAN', icon: 'ican' },
    { id: 'mensajes', label: 'Mensajes', icon: 'messages', badge: 1 },
    { id: 'pagos', label: 'Estado de cuenta', icon: 'payments' },
    { id: 'certificados', label: 'Certificados', icon: 'certificates' },
  ];
  const teacherNav = [
    { id: 'perfil', label: 'Mi Perfil', icon: 'profile' },
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'grupos', label: 'Mis Grupos', icon: 'roster' },
    { id: 'calificar', label: 'Calificar', icon: 'grades' },
    { id: 'asistencia', label: 'Asistencia', icon: 'check' },
    { id: 'calendario', label: 'Calendario', icon: 'calendar' },
    { id: 'materiales', label: 'Materiales', icon: 'materials' },
    { id: 'ican', label: 'Club I CAN', icon: 'ican' },
    { id: 'mensajes', label: 'Mensajes', icon: 'messages' },
  ];
  const adminNav = [
    { id: 'perfil', label: 'Mi Perfil', icon: 'profile' },
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'matriculas', label: 'Matrículas', icon: 'graduation', badge: 3 },
    { id: 'grupos', label: 'Grupos', icon: 'roster' },
    { id: 'estudiantes', label: 'Estudiantes', icon: 'profile' },
    { id: 'buscador', label: 'Buscador', icon: 'search' },
    { id: 'banco', label: 'Importar Banco', icon: 'payments' },
    { id: 'aplicar_pago', label: 'Aplicar Pago', icon: 'card' },
    { id: 'docentes', label: 'Docentes', icon: 'graduation' },
    { id: 'horas', label: 'Horas docentes', icon: 'chart' },
    { id: 'ican', label: 'Club I CAN', icon: 'ican' },
    { id: 'finanzas', label: 'Finanzas', icon: 'payments' },
    { id: 'reportes', label: 'Reportes', icon: 'chart' },
    { id: 'config', label: 'Configuración', icon: 'settings' },
  ];
  const nav = role === 'student' ? studentNav : role === 'teacher' ? teacherNav : adminNav;
  const userName = usr?.nombre || (role === 'student' ? student.short : role === 'teacher' ? 'Docente' : 'Administrador');
  const userRole = usr
    ? (usr.rol === 'admin' ? 'Administración' : usr.rol === 'teacher' ? `Docente${usr.grupo ? ' · ' + usr.grupo : ''}` : `Estudiante${usr.codigo ? ' · ' + usr.codigo : ''}`)
    : (role === 'student' ? 'Estudiante · G0001' : role === 'teacher' ? 'Docente · 3 grupos' : 'Administración');
  const userInit = userName.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || 'AN';

  return (
    <aside className="sb">
      <div className="sb-brand">
        <div className="sb-logo" />
        <div className="sb-brand-text">
          <div className="sb-brand-t1">Norteamericana</div>
          <div className="sb-brand-t2">Campus Virtual</div>
        </div>
      </div>

      <div className="sb-role-switch" role="tablist">
        <button className={role==='student' ? 'active':''} onClick={() => { setRole('student'); setActive('dashboard'); }}>Estudiante</button>
        <button className={role==='teacher' ? 'active':''} onClick={() => { setRole('teacher'); setActive('dashboard'); }}>Docente</button>
        <button className={role==='admin'   ? 'active':''} onClick={() => { setRole('admin');   setActive('dashboard'); }}>Admin</button>
      </div>

      <div className="sb-section">Menú</div>
      {nav.map(item => (
        <button key={item.id} className={`sb-item ${active===item.id?'active':''}`} onClick={() => setActive(item.id)}>
          <Icon name={item.icon} size={18} />
          <span className="sb-label">{item.label}</span>
          {item.badge && <span className="sb-badge">{item.badge}</span>}
        </button>
      ))}

      <div className="sb-user">
        <div className="sb-avatar">{userInit}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="sb-user-t1">{userName}</div>
          <div className="sb-user-t2">{userRole}</div>
        </div>
        <button
          onClick={() => {
            try { sessionStorage.removeItem('an_usuario'); sessionStorage.removeItem('an_just_logged_in'); localStorage.removeItem('an_role'); } catch{}
            if (onLogout) onLogout();
            else window.location.href = 'login.html';
          }}
          title="Cerrar sesión"
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-3)', padding:4, flexShrink:0, lineHeight:1 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}

Object.assign(window, { Sidebar });
