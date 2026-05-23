/* global React, Icon */
const { useState: _u1 } = React;

// ── DEV SWITCHER — datos hardcodeados ──────────────────────────────────
const SCRIPT_URL_SB = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';

const DEV_DOCENTES = [
  { nombre: 'CRUZ PÉREZ RACHELLE MICHELLE', grupo: 'B1-LM69-C3-0125', programa: 'SIN_INA' },
  { nombre: 'SALAZAR FUENTES ANA BELÉN',    grupo: 'B1-LM69-C3-0126', programa: 'SIN_INA' },
  { nombre: 'VEGA SALAS EMILY LUCÍA',       grupo: 'B1-KJ69-C3-0225', programa: 'SIN_INA' },
  { nombre: 'MEDINA FONSECA SULIVANY',      grupo: 'B1-L469-B1-0226', programa: 'SIN_INA' },
  { nombre: 'JOHN ALVAREZ GONZÁLEZ',        grupo: 'B1-L469-B6-0325', programa: 'SIN_INA' },
  { nombre: 'YENDRY AGUILAR',               grupo: 'B1-L469-B2-0426', programa: 'SIN_INA' },
];

const DEV_ADMIN = {
  nombre: 'SALAZAR FUENTES LEONARDO',
  rol: 'admin',
  codigo: 'LEO-001',
};

function DevSwitcher({ role, setRole, setActive }) {
  const [codEst, setCodEst]     = React.useState('17056');
  const [docSel, setDocSel]     = React.useState(DEV_DOCENTES[0].grupo);
  const [cargando, setCargando] = React.useState(false);
  const [errMsg, setErrMsg]     = React.useState('');

  // Auto-cargar el estudiante demo al montar (solo si no hay sesión)
  React.useEffect(() => {
    const sess = sessionStorage.getItem('an_usuario');
    if (!sess) cargarEstudiante('17056');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarEstudiante = async (codigo) => {
    if (!codigo.trim()) return;
    setCargando(true);
    setErrMsg('');
    try {
      const res  = await fetch(`${SCRIPT_URL_SB}?fn=getEstudiante&codigo=${encodeURIComponent(codigo.trim())}`);
      const data = await res.json();
      if (!data.ok) { setErrMsg(data.error || 'Código no encontrado'); return; }
      const est     = data.estudiante || {};
      const niveles = data.niveles    || {};
      const ORDEN   = ['B1','B2','I1','I2'];

      // Acepta { B1: 'APR' } o { B1: { estatus:'APR', nota:88 } }
      const getEstatus = n => {
        const v = niveles[n];
        if (!v) return '';
        return typeof v === 'object'
          ? String(v.estatus || v.ESTATUS || '').toUpperCase()
          : String(v).toUpperCase();
      };
      const nivel_activo =
        ORDEN.find(n => getEstatus(n) === 'CA') ||
        [...ORDEN].reverse().find(n => ['APR','CNV'].includes(getEstatus(n))) ||
        '';
      const estatus_activo = nivel_activo ? getEstatus(nivel_activo) : '';
      const niveles_estatus = Object.fromEntries(
        ORDEN.map(n => [n, getEstatus(n)])
      );

      // Grupo: preferir el de DATOS o el del nivel activo
      const grupo = data.grupo?.CODIGO_GRUPO || est.GRUPO || est['GRUPO'] || '';

      sessionStorage.setItem('an_usuario', JSON.stringify({
        nombre:          est.NOMBRE     || est.nombre  || codigo,
        rol:             'student',
        codigo:          est.CODIGO     || est.REC_M   || est.rec_m || codigo,
        cedula:          est.NUM_CEDULA || est.CEDULA  || est.cedula || '',
        grupo,
        programa:        data.grupo?.PROGRAMA || est.PROGRAMA || 'SIN_INA',
        nivel_activo,
        estatus_activo,
        niveles_estatus,
      }));
      setRole('student');
      setActive('dashboard');
    } catch(e) {
      setErrMsg('Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  const cargarDocente = (grupoCod) => {
    const doc = DEV_DOCENTES.find(d => d.grupo === grupoCod) || DEV_DOCENTES[0];
    sessionStorage.setItem('an_usuario', JSON.stringify({
      nombre:   doc.nombre,
      rol:      'teacher',
      grupo:    doc.grupo,
      programa: doc.programa,
    }));
    setRole('teacher');
    setActive('dashboard');
  };

  const cargarAdmin = () => {
    sessionStorage.setItem('an_usuario', JSON.stringify({
      nombre: DEV_ADMIN.nombre,
      rol:    'admin',
      codigo: DEV_ADMIN.codigo,
    }));
    setRole('admin');
    setActive('dashboard');
  };

  return (
    <div style={{
      padding: '10px 12px',
      background: 'color-mix(in srgb, var(--an-granate) 6%, white)',
      borderBottom: '1px solid color-mix(in srgb, var(--an-granate) 20%, white)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div className="sb-role-switch" role="tablist">
        <button className={role === 'student' ? 'active' : ''}
          onClick={() => cargarEstudiante(codEst)}>Estudiante</button>
        <button className={role === 'teacher' ? 'active' : ''}
          onClick={() => cargarDocente(docSel)}>Docente</button>
        <button className={role === 'admin' ? 'active' : ''}
          onClick={cargarAdmin}>Admin</button>
      </div>

      {role === 'student' && (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={codEst}
            onChange={e => setCodEst(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') cargarEstudiante(codEst); }}
            placeholder="Código (ej: 17056)"
            style={{
              flex: 1,
              padding: '6px 10px',
              border: '1.5px solid var(--line)',
              borderRadius: 'var(--r-md)',
              fontFamily: 'var(--f-mono)',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={() => cargarEstudiante(codEst)}
            disabled={cargando}
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: 12, flexShrink: 0,
                     background: 'var(--an-granate)', borderColor: 'var(--an-granate)',
                     opacity: cargando ? 0.6 : 1 }}
          >
            {cargando ? '…' : 'Cargar'}
          </button>
        </div>
      )}

      {role === 'teacher' && (
        <select
          value={docSel}
          onChange={e => { setDocSel(e.target.value); cargarDocente(e.target.value); }}
          style={{
            padding: '6px 10px',
            border: '1.5px solid var(--line)',
            borderRadius: 'var(--r-md)',
            fontFamily: 'inherit',
            fontSize: 12,
            outline: 'none',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          {DEV_DOCENTES.map(d => (
            <option key={d.grupo} value={d.grupo}>
              {d.nombre.split(' ').filter((_, i) => i >= 2).map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
            </option>
          ))}
        </select>
      )}

      {errMsg && (
        <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>
          ⚠ {errMsg}
        </div>
      )}
    </div>
  );
}

function Sidebar({ role, setRole, active, setActive, usuario, onLogout }) {
  // Datos del usuario logueado (sessionStorage > props)
  const usuarioSS = React.useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('an_usuario') || 'null'); } catch { return null; }
  }, []);
  const usr = usuario || usuarioSS;

  // ── Badge de pendientes para "Mi Panel" (docente / superadmin testing) ──
  // Polling optimizado (A1.1) para no quemar la cuota del Apps Script:
  //   • Solo si hay rol relevante (teacher / admin / superadmin)
  //   • Solo si hay nombre identificado
  //   • Solo cuando la pestaña está VISIBLE (document.visibilityState)
  //   • Intervalo: 5 minutos (no 60s)
  //   • Al volver a la pestaña: refresco inmediato + reinicia el ciclo
  //   • Cleanup completo: clearInterval + removeEventListener
  const [pendientesDoc, setPendientesDoc] = React.useState(0);
  React.useEffect(() => {
    if (role !== 'teacher' && role !== 'admin' && role !== 'superadmin') return;
    const nombre = sessionStorage.getItem('nombre') || usr?.nombre || '';
    if (!nombre) return;

    let cancel = false;
    let intervalId = null;

    const refrescar = () => {
      if (document.visibilityState !== 'visible') return;
      if (typeof window.fetchTareasPendientesDocente !== 'function') return;
      window.fetchTareasPendientesDocente(nombre).then(r => {
        if (cancel) return;
        if (r?.ok) setPendientesDoc(r.totales?.total_pendientes || 0);
      }).catch(() => {});
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresco inmediato al volver a la pestaña
        refrescar();
      }
    };

    // Primera carga (solo si la pestaña está visible al montar)
    refrescar();

    // Polling cada 5 minutos
    intervalId = setInterval(refrescar, 5 * 60 * 1000);

    // Escuchar cambios de visibilidad
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancel = true;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [role, usr?.nombre]);
  const studentNav = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'cronograma_grupo', label: 'Mis lecciones', icon: 'calendar' },
    { id: 'notas', label: 'Mis Notas', icon: 'grades' },
    { id: 'tareas', label: 'Tareas', icon: 'homework' },
    { id: 'materiales', label: 'Materiales', icon: 'materials' },
    { id: 'ican', label: 'Club I CAN', icon: 'ican' },
    { id: 'mensajes', label: 'Mensajes', icon: 'messages' },
    { id: 'pagos', label: 'Estado de cuenta', icon: 'payments' },
    { id: 'certificados', label: 'Certificados', icon: 'certificates' },
  ];
  const teacherNav = [
    { id: 'perfil', label: 'Mi Perfil', icon: 'profile' },
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'mi_panel_docente', label: 'Mi Panel', icon: 'homework', badge: pendientesDoc || null },
    { id: 'grupos', label: 'Mis Grupos', icon: 'roster' },
    { id: 'cronograma_grupo', label: 'Calendario', icon: 'calendar' },
    { id: 'calificar', label: 'Calificar', icon: 'grades' },
    { id: 'asistencia', label: 'Asistencia', icon: 'check' },
    { id: 'materiales', label: 'Materiales', icon: 'materials' },
    { id: 'ican', label: 'Club I CAN', icon: 'ican' },
    { id: 'mensajes', label: 'Mensajes', icon: 'messages' },
  ];
  const adminNav = [
    { id: 'perfil', label: 'Mi Perfil', icon: 'profile' },
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    // Panel docente para superadmin (testing). Solo aparece si hay
    // un nombre seteado en sessionStorage (modo docente simulado).
    ...(sessionStorage.getItem('nombre') ? [{
      id: 'mi_panel_docente', label: 'Panel Docente', icon: 'homework',
      badge: pendientesDoc || null,
    }] : []),
    { id: 'supervision', label: 'Supervisión', icon: 'bell' },
    { id: 'matriculas', label: 'Matrículas', icon: 'graduation', badge: 3 },
    { id: 'grupos', label: 'Grupos', icon: 'roster' },
    { id: 'cronograma_grupo', label: 'Calendario lecciones', icon: 'calendar' },
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
  const userName = usr?.nombre || (role === 'student' ? '—' : role === 'teacher' ? 'Docente' : 'Administrador');
  const userRole = usr
    ? (usr.rol === 'admin' ? 'Administración' : usr.rol === 'teacher' ? 'Docente' : `Estudiante${usr.codigo ? ' · ' + usr.codigo : ''}`)
    : (role === 'student' ? 'Sin sesión' : role === 'teacher' ? 'Docente' : 'Administración');
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

      <DevSwitcher role={role} setRole={setRole} setActive={setActive} />

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
