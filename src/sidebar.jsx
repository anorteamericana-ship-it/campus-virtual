/* global React, Icon, getSesion, setSesion */
const { useState: _u1 } = React;

// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const SCRIPT_URL_SB = window.APPS_SCRIPT_URL;

// FIX-ADMIN-CORE-POST-001: lectura de perfil vía POST text/plain. Conserva
// `?fn=` en la URL (Apps Script enruta con e.parameter.fn) y envía el token en
// el BODY, nunca en la URL.
async function postSidebar(fn, payload = {}) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const res = await fetch(`${SCRIPT_URL_SB}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      fn,
      token,
      ...payload,
    }),
  });
  return await res.json();
}

// ─────────────────────────────────────────────────────────────────────────
// MODO PRUEBA — superadmin only
// ─────────────────────────────────────────────────────────────────────────
// Reemplazo del antiguo DevSwitcher. Reglas:
//   1) SOLO se monta si usuario.rol === 'superadmin' (lo decide Sidebar).
//   2) NO autoejecuta nada al montar — el campus arranca con la sesión
//      real del superadmin.
//   3) Al usarse, REESCRIBE `an_usuario` con una identidad REAL
//      (estudiante por código, o docente por nombre+grupo+cédula) y
//      guarda la sesión original en `an_modo_prueba` para poder volver.
//   4) Tras transformarse, despacha 'an:session-changed' para que App
//      recalcule rol + router.
// ─────────────────────────────────────────────────────────────────────────

function entrarModoPrueba(nuevaIdentidad) {
  // Solo guardamos el "original" la primera vez (anidar modos prueba no
  // tiene sentido — siempre volvés al superadmin real).
  const actual = getSesion();
  if (!actual) return;
  let modo = null;
  try {
    const raw = sessionStorage.getItem('an_modo_prueba');
    modo = raw ? JSON.parse(raw) : null;
  } catch { modo = null; }
  if (!modo || !modo.original) {
    modo = { original: actual };
    sessionStorage.setItem('an_modo_prueba', JSON.stringify(modo));
  }
  setSesion(nuevaIdentidad);
  window.dispatchEvent(new Event('an:session-changed'));
}

function ModoPruebaPanel() {
  // Tabs: 'student' | 'teacher'
  const [tab, setTab]         = React.useState('student');
  const [open, setOpen]       = React.useState(false);
  // Estudiante
  const [codEst, setCodEst]   = React.useState('');
  // Docente
  const [docNombre, setDocNombre] = React.useState('');
  const [docGrupo,  setDocGrupo]  = React.useState('');
  const [docCedula, setDocCedula] = React.useState('');
  // UI
  const [cargando, setCargando] = React.useState(false);
  const [errMsg,   setErrMsg]   = React.useState('');

  const cargarEstudianteReal = async (codigo) => {
    const c = (codigo || '').trim();
    if (!c) { setErrMsg('Ingresá un código de estudiante.'); return; }
    setCargando(true);
    setErrMsg('');
    try {
      const data = await postSidebar('getEstudiante', { codigo: c });
      if (!data.ok) { setErrMsg(data.error || 'Código no encontrado'); return; }

      const est     = data.estudiante || {};
      const niveles = data.niveles    || {};
      const ORDEN   = ['B1','B2','I1','I2'];
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
      const estatus_activo  = nivel_activo ? getEstatus(nivel_activo) : '';
      const niveles_estatus = Object.fromEntries(ORDEN.map(n => [n, getEstatus(n)]));
      const grupo = data.grupo?.CODIGO_GRUPO || est.GRUPO || est['GRUPO'] || '';

      entrarModoPrueba({
        rol:             'student',
        nombre:          est.NOMBRE     || est.nombre  || c,
        codigo:          est.CODIGO     || est.REC_M   || est.rec_m || c,
        cedula:          est.NUM_CEDULA || est.CEDULA  || est.cedula || '',
        grupo,
        grupos:          grupo ? [grupo] : [],
        programa:        data.grupo?.PROGRAMA || est.PROGRAMA || 'SIN_INA',
        nivel_activo,
        estatus_activo,
        niveles_estatus,
      });
    } catch (_) {
      setErrMsg('Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  const cargarDocenteReal = () => {
    const n = (docNombre || '').trim();
    const g = (docGrupo  || '').trim();
    const c = (docCedula || '').trim();
    if (!n) { setErrMsg('Escribí el nombre del docente (igual a USUARIOS).'); return; }
    if (!g) { setErrMsg('Escribí el código de grupo.'); return; }
    entrarModoPrueba({
      rol:        'teacher',
      nombre:     n,
      cedula:     c,
      grupo:      g,
      grupos:     [g],
      grupoActivo: g,
      programa:   'SIN_INA',
    });
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
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: '2px 0', fontFamily: 'inherit',
          fontSize: 11, fontWeight: 800, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'var(--an-granate)',
        }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--an-granate)' }} />
          Modo prueba · superadmin
        </span>
        <span style={{ fontSize: 14 }}>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.45 }}>
            Cambia tu identidad por la de un estudiante o docente real para
            ver el campus como lo ven ellos. Una cinta te recordará el modo,
            y podés volver a tu sesión de superadmin en cualquier momento.
          </div>

          <div style={{ display:'flex', gap:4, background:'var(--surface)', padding:3, borderRadius:6, border:'1px solid var(--line)' }}>
            <button
              onClick={() => { setTab('student'); setErrMsg(''); }}
              style={{
                flex:1, padding:'5px 8px', fontSize:11, fontWeight:700,
                background: tab === 'student' ? 'var(--an-granate)' : 'transparent',
                color:      tab === 'student' ? 'white' : 'var(--ink-2)',
                border:'none', borderRadius:4, cursor:'pointer', fontFamily:'inherit',
              }}>
              Estudiante
            </button>
            <button
              onClick={() => { setTab('teacher'); setErrMsg(''); }}
              style={{
                flex:1, padding:'5px 8px', fontSize:11, fontWeight:700,
                background: tab === 'teacher' ? 'var(--an-granate)' : 'transparent',
                color:      tab === 'teacher' ? 'white' : 'var(--ink-2)',
                border:'none', borderRadius:4, cursor:'pointer', fontFamily:'inherit',
              }}>
              Docente
            </button>
          </div>

          {tab === 'student' && (
            <div style={{ display:'flex', gap:6 }}>
              <input
                value={codEst}
                onChange={e => { setCodEst(e.target.value); setErrMsg(''); }}
                onKeyDown={e => { if (e.key === 'Enter') cargarEstudianteReal(codEst); }}
                placeholder="Código (ej: 17056)"
                style={{
                  flex: 1, padding: '6px 10px',
                  border: '1.5px solid var(--line)', borderRadius: 'var(--r-md)',
                  fontFamily: 'var(--f-mono)', fontSize: 13, outline: 'none',
                }}
              />
              <button
                onClick={() => cargarEstudianteReal(codEst)}
                disabled={cargando}
                className="btn btn-primary"
                style={{
                  padding: '6px 12px', fontSize: 12, flexShrink: 0,
                  background: 'var(--an-granate)', borderColor: 'var(--an-granate)',
                  opacity: cargando ? 0.6 : 1,
                }}>
                {cargando ? '…' : 'Entrar'}
              </button>
            </div>
          )}

          {tab === 'teacher' && (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <input
                value={docNombre}
                onChange={e => { setDocNombre(e.target.value); setErrMsg(''); }}
                placeholder="Nombre del docente (USUARIOS.nombre)"
                style={{
                  padding: '6px 10px',
                  border: '1.5px solid var(--line)', borderRadius: 'var(--r-md)',
                  fontFamily: 'inherit', fontSize: 12, outline: 'none',
                }}
              />
              <div style={{ display:'flex', gap:6 }}>
                <input
                  value={docGrupo}
                  onChange={e => { setDocGrupo(e.target.value); setErrMsg(''); }}
                  placeholder="Código de grupo"
                  style={{
                    flex: 1, padding: '6px 10px',
                    border: '1.5px solid var(--line)', borderRadius: 'var(--r-md)',
                    fontFamily: 'var(--f-mono)', fontSize: 12, outline: 'none',
                  }}
                />
                <input
                  value={docCedula}
                  onChange={e => { setDocCedula(e.target.value); setErrMsg(''); }}
                  placeholder="Cédula (opcional)"
                  style={{
                    width: 110, padding: '6px 10px',
                    border: '1.5px solid var(--line)', borderRadius: 'var(--r-md)',
                    fontFamily: 'var(--f-mono)', fontSize: 12, outline: 'none',
                  }}
                />
              </div>
              <button
                onClick={cargarDocenteReal}
                disabled={cargando}
                className="btn btn-primary"
                style={{
                  padding: '6px 12px', fontSize: 12,
                  background: 'var(--an-granate)', borderColor: 'var(--an-granate)',
                  opacity: cargando ? 0.6 : 1,
                }}>
                Entrar como docente
              </button>
            </div>
          )}

          {errMsg && (
            <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>
              ⚠ {errMsg}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Sidebar({ role, rolReal, active, setActive, usuario, onLogout }) {
  // Sesión única — sin fallbacks a claves sueltas.
  const usr = usuario || (typeof getSesion === 'function' ? getSesion() : null);
  const rolEfectivo = rolReal || usr?.rol || role;
  const esSuperadmin = rolEfectivo === 'superadmin';

  // ── Badge de pendientes para "Mi Panel" (solo docente real) ─────────────
  const [pendientesDoc, setPendientesDoc] = React.useState(0);
  React.useEffect(() => {
    // Solo polleamos pendientes si el rol EFECTIVO es teacher.
    if (role !== 'teacher') return;
    const nombre = usr?.nombre || '';
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
      if (document.visibilityState === 'visible') refrescar();
    };

    refrescar();
    intervalId = setInterval(refrescar, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancel = true;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [role, usr?.nombre]);

  // ── Badge "Suspensiones" — admin / superadmin ───────────────────────────
  const [pendientesSusp, setPendientesSusp] = React.useState(0);
  React.useEffect(() => {
    if (rolEfectivo !== 'admin' && rolEfectivo !== 'superadmin') return;

    let cancel = false;
    let intervalId = null;

    const refrescar = () => {
      if (document.visibilityState !== 'visible') return;
      if (typeof window.fetchGetSolicitudesSuspension !== 'function') return;
      window.fetchGetSolicitudesSuspension('PENDIENTE').then(r => {
        if (cancel) return;
        if (r?.ok) setPendientesSusp(r.total ?? (r.solicitudes?.length || 0));
      }).catch(() => {});
    };
    const onVis = () => { if (document.visibilityState === 'visible') refrescar(); };

    refrescar();
    intervalId = setInterval(refrescar, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancel = true;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [rolEfectivo]);

  // ── Badge "Solicitudes" de pago — admin / superadmin (Fase 3.5) ────────
  const [pendientesPago, setPendientesPago] = React.useState(0);
  React.useEffect(() => {
    if (rolEfectivo !== 'admin' && rolEfectivo !== 'superadmin') return;
    let cancel = false;
    let intervalId = null;
    const fetchCount = () => {
      if (typeof window.getSolicitudesPago !== 'function') return;
      window.getSolicitudesPago({ estado: 'PENDIENTE' }).then(r => {
        if (cancel) return;
        if (r && r.ok) setPendientesPago(r.pendientes ?? (r.solicitudes?.length || 0));
      }).catch(() => {});
    };
    const refrescar = () => { if (document.visibilityState === 'visible') fetchCount(); };
    const onVis = () => { if (document.visibilityState === 'visible') fetchCount(); };
    fetchCount();   // inicial, sin gate de visibilidad para poblar el badge en el primer render
    intervalId = setInterval(refrescar, 2 * 60 * 1000);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('an:solicitudes-pago-changed', fetchCount);
    return () => {
      cancel = true;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('an:solicitudes-pago-changed', fetchCount);
    };
  }, [rolEfectivo, active]);

  const studentNav = [
    // CALGRUPO_F37_20260617_PORTAL_ESTUDIANTE_MENU
    { id: 'portal_estudiante', label: 'Mi Campus', icon: 'home' },
    { id: 'dashboard', label: 'Inicio', icon: 'home' },
    { id: 'cronograma_grupo', label: 'Cronograma académico', icon: 'calendar' },
    { id: 'materiales', label: 'Biblioteca del curso', icon: 'materials' },
    { id: 'info_programa', label: 'Información del Programa', icon: 'doc' },
    { id: 'notas', label: 'Mis Notas', icon: 'grades' },
    { id: 'examenes', label: 'Exámenes', icon: 'check' },
    { id: 'tareas', label: 'Tareas', icon: 'homework' },
    { id: 'ican', label: 'Club I CAN', icon: 'ican' },
    { id: 'mensajes', label: 'Mensajes', icon: 'messages' },
    { id: 'pagos', label: 'Estado de cuenta', icon: 'payments' },
    { id: 'certificados', label: 'Certificaciones', icon: 'certificates' },
  ];
  const teacherNav = [
    { id: 'perfil', label: 'Teacher', icon: 'profile' },
    { id: 'mi_panel_docente', label: 'Mi Panel', icon: 'home', badge: pendientesDoc || null },
    // CALGRUPO_F35_20260617_DOCENTE_OPERATIVO_MENU
    { id: 'docente_operativo', label: 'Panel operativo', icon: 'grades' },
    { id: 'grupos', label: 'Mis Grupos', icon: 'roster' },
    { id: 'cronograma_grupo', label: 'Cronograma académico', icon: 'calendar' },
    { id: 'calificar', label: 'Calificar', icon: 'grades' },
    // CALGRUPO_F66_20260618_ASISTENCIA_UNICA_DESDE_CRONOGRAMA
    // La asistencia docente se opera desde Cronograma académico; se elimina la pestaña duplicada.
    { id: 'examenes', label: 'Exámenes', icon: 'check' },
    { id: 'materiales', label: 'Biblioteca del curso', icon: 'materials' },
    { id: 'ican', label: 'Club I CAN', icon: 'ican', proximamente: true },
    { id: 'mensajes', label: 'Mensajes', icon: 'messages' },
  ];
  const adminNav = [
    { id: 'perfil', label: 'Mi Perfil', icon: 'profile' },
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'supervision', label: 'Supervisión', icon: 'bell' },
    // CALGRUPO_F1_20260616_PANEL_NUEVO: panel fusionado calendario + grupo + estudiantes.
    { id: 'calendario_grupo', label: 'Calendario de Grupo', icon: 'calendar' },
    { id: 'auditoria_academica', label: 'Auditoría Académica', icon: 'grades' },
    // CALGRUPO_F33_20260617_DIAGNOSTICO_INTERNO_MENU
    { id: 'diagnostico_interno', label: 'Diagnóstico interno', icon: 'settings' },
    // CALGRUPO_F42_20260617_AUDITORIA_ROLES_PERMISOS_MENU
    { id: 'permisos_roles', label: 'Permisos y roles', icon: 'settings' },
    // CALGRUPO_F36_20260617_CONAPE_COBRANZA_MENU
    { id: 'conape_cobranza', label: 'CONAPE y Cobranza', icon: 'payments' },
    ...(esSuperadmin ? [{ id: 'inscripcion_admin', label: 'Inscripción pública', icon: 'settings' }] : []),
    { id: 'examenes', label: 'Exámenes', icon: 'check' },
    { id: 'suspensiones', label: 'Suspensiones', icon: 'calendar', badge: pendientesSusp || null },
    { id: 'matriculas', label: 'Matrículas', icon: 'graduation' },
    { id: 'solicitudes', label: 'Solicitudes', icon: 'card', badge: pendientesPago || null },
    { id: 'grupos', label: 'Grupos', icon: 'roster' },
    { id: 'cronograma_grupo', label: 'Calendario', icon: 'calendar' },
    { id: 'estudiantes', label: 'Estudiantes', icon: 'profile' },
    { id: 'buscador', label: 'Buscador', icon: 'search' },
    { id: 'banco', label: 'Importar Banco', icon: 'payments' },
    { id: 'aplicar_pago', label: 'Aplicar Pago', icon: 'card' },
    // Ítems sin lógica real — marcados como "Próximamente" hasta que se
    // conecten. No navegan; renderizarían datos vacíos o demo si lo
    // hicieran (bloque 2).
    { id: 'docentes', label: 'Docentes',         icon: 'graduation', proximamente: true },
    { id: 'horas',    label: 'Horas docentes',   icon: 'chart',      proximamente: true },
    { id: 'ican',     label: 'Club I CAN',       icon: 'ican',       proximamente: true },
    { id: 'finanzas', label: 'Finanzas',         icon: 'payments',   proximamente: true },
    // CALGRUPO_F38_20260617_REPORTES_ADMINISTRATIVOS_MENU
    { id: 'reportes', label: 'Reportes',         icon: 'chart' },
    { id: 'config',   label: 'Configuración',    icon: 'settings',   proximamente: true },
  ];
  const nav = role === 'student' ? studentNav : role === 'teacher' ? teacherNav : adminNav;
  const userName = usr?.nombre || '—';
  const userRole = usr
    ? (usr.rol === 'superadmin' ? 'Superadmin'
      : usr.rol === 'admin'    ? 'Administración'
      : usr.rol === 'teacher'  ? `Docente${usr.grupo ? ' · ' + usr.grupo : ''}`
      : `Estudiante${usr.codigo ? ' · ' + usr.codigo : ''}`)
    : 'Sin sesión';
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

      {esSuperadmin && <ModoPruebaPanel />}

      <div className="sb-section">Menú</div>
      {nav.map(item => {
        if (item.proximamente) {
          return (
            <button
              key={item.id}
              type="button"
              disabled
              aria-disabled="true"
              title="En construcción — lo conectamos pronto"
              className="sb-item"
              style={{
                opacity: 0.42,
                cursor: 'not-allowed',
                pointerEvents: 'auto', // queremos el tooltip
                background: 'transparent',
              }}
            >
              <Icon name={item.icon} size={18} />
              <span className="sb-label" style={{ textDecoration: 'none' }}>{item.label}</span>
              <span style={{
                marginLeft: 'auto',
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                padding: '2px 7px',
                borderRadius: 999,
                background: 'color-mix(in srgb, var(--ink-3) 18%, transparent)',
                color: 'var(--ink-3)',
                whiteSpace: 'nowrap',
              }}>Pronto</span>
            </button>
          );
        }
        return (
          <button
            key={item.id}
            className={`sb-item ${active===item.id?'active':''}`}
            onClick={() => setActive(item.id)}>
            <Icon name={item.icon} size={18} />
            <span className="sb-label">{item.label}</span>
            {item.badge && <span className="sb-badge">{item.badge}</span>}
          </button>
        );
      })}

      <div className="sb-user">
        <div className="sb-avatar">{userInit}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="sb-user-t1">{userName}</div>
          <div className="sb-user-t2">{userRole}</div>
        </div>
        <button
          onClick={async () => {
            // SEC-003C: cerrar la sesión en el servidor antes de redirigir.
            // cerrarSesionServidor() ya limpia an_usuario (setSesion(null))
            // en su finally, aunque la red falle — no lo duplicamos aquí.
            try {
              if (typeof window.cerrarSesionServidor === 'function') {
                await window.cerrarSesionServidor();
              } else {
                // Fallback local si la función no estuviera disponible.
                sessionStorage.removeItem('an_usuario');
              }
            } catch {}
            // Claves auxiliares que cerrarSesionServidor() no toca.
            try {
              sessionStorage.removeItem('an_just_logged_in');
              sessionStorage.removeItem('an_modo_prueba');
              localStorage.removeItem('an_role');
            } catch{}
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
