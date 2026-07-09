// F98.4-Z6-CS6 · Sidebar con bandeja interna de prematrículas
// F98.4-Z6-CS2 · Sidebar prematrícula unificada
// F98.4-Z6-P · navegación Super Admin agrupada por operación
// F98.4-Z6-F · menú docente reordenado y renombrado
// F92.7_20260620_MENU_DOCENTE_SIN_CALIFICAR_LEGACY
/* global React, Icon, getSesion, setSesion */
const { useState: _u1 } = React;

// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const SCRIPT_URL_SB = window.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';
if (!window.APPS_SCRIPT_URL) window.APPS_SCRIPT_URL = SCRIPT_URL_SB;

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

function sidebarTeacherGroupLabelF88(code) {
  const raw=String(code||'').trim().toUpperCase();
  const cycle=(raw.split('-').filter(Boolean).pop()||'').trim();
  const m=raw.match(/-(LM|KJ|LJ|L4|SA|SAB|L|K|M|J|V|D)(\d{2})-/) || raw.match(/-(LM|KJ|LJ|L4|SA|SAB|L|K|M|J|V|D)(\d{2})/);
  const day=({LM:'Lunes y miércoles',KJ:'Martes y jueves',LJ:'Lunes y jueves',L4:'Lunes a jueves',SA:'Sábados',SAB:'Sábados',L:'Lunes',K:'Martes',M:'Miércoles',J:'Jueves',V:'Viernes',D:'Domingos'})[m?.[1]] || 'Grupo';
  const hours=({'69':'6pm a 9pm','94':'9am a 4pm','96':'9am a 12pm'})[m?.[2]] || '';
  return `${day}${hours?' '+hours:''}${cycle?' · '+cycle:''}`;
}



function sidebarEsUsuarioGratisF984Z6CS(usr, role) {
  if (String(role || '').toLowerCase() !== 'student') return false;
  const tipo = String(usr?.tipoUsuario || usr?.tipo_usuario || usr?.origen || usr?.ORIGEN || usr?.etapa || usr?.ETAPA || '').toLowerCase();
  const explicito = /gratis|free|prospect|prematric|lead|formulario/.test(tipo);
  const codigo = String(usr?.codigo || usr?.CODIGO || usr?.CODIGO_ESTUDIANTE || '').trim();
  const grupo = String(usr?.grupo || usr?.GRUPO || usr?.grupo_actual || usr?.GRUPO_ACTUAL || '').trim();
  const matricula = String(usr?.matricula || usr?.MATRICULA || usr?.estadoAcademico || usr?.ESTADO_ACADEMICO || '').trim();
  const nivel = String(usr?.nivel_activo || usr?.NIVEL_ACTIVO || usr?.estatus_activo || usr?.ESTATUS_ACTIVO || '').trim();
  const niveles = usr?.niveles_estatus || usr?.NIVELES_ESTATUS || null;
  const tieneNivelOficial = !!(nivel || (niveles && typeof niveles === 'object' && Object.values(niveles).some(v => String(v || '').trim())));
  return explicito || (!codigo && !grupo && !matricula && !tieneNivelOficial);
}

function sidebarNormCedulaAplay(v) {
  return String(v || '').replace(/[^0-9]/g, '');
}

function sidebarMostrarAcademiaPlayF984Z6(usr, role, rolEfectivo) {
  const rol = String(rolEfectivo || role || '').toLowerCase();
  if (rol === 'superadmin' || rol === 'admin' || rol === 'teacher' || rol === 'student') return true;
  const ced = sidebarNormCedulaAplay(usr?.cedula || usr?.CEDULA || usr?.identificacion || usr?.IDENTIFICACION || usr?.documento || usr?.DOCUMENTO || usr?.id || usr?.ID);
  const cod = String(usr?.codigo || usr?.CODIGO || usr?.CODIGO_ESTUDIANTE || '').trim().toUpperCase();
  if (ced === '120180140' || cod === '120814') return true;
  try {
    const q = new URLSearchParams(window.location.search || '');
    if (q.get('aplay') === '1' || q.get('play') === '1') return true;
    if (localStorage.getItem('an_academia_play_piloto') === '1') return true;
  } catch (_) {}
  return false;
}

function Sidebar({ role, rolReal, active, setActive, usuario, onLogout }) {
  // Sesión única — sin fallbacks a claves sueltas.
  const usr = usuario || (typeof getSesion === 'function' ? getSesion() : null);
  const rolEfectivo = rolReal || usr?.rol || role;
  const esSuperadmin = rolEfectivo === 'superadmin';
  const mostrarAcademiaPlay = sidebarMostrarAcademiaPlayF984Z6(usr, role, rolEfectivo);

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
    // PERF1: no bloquear el primer render del panel por contadores administrativos.
    const initialTimer = setTimeout(fetchCount, 900);
    intervalId = setInterval(refrescar, 3 * 60 * 1000);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('an:solicitudes-pago-changed', fetchCount);
    return () => {
      cancel = true;
      clearTimeout(initialTimer);
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('an:solicitudes-pago-changed', fetchCount);
    };
  }, [rolEfectivo]);

  // F98.4-Z6-PLAY1: badge rojo para solicitudes de usuarios gratis sin registro.
  const [pendientesGratis, setPendientesGratis] = React.useState(0);
  React.useEffect(() => {
    if (rolEfectivo !== 'admin' && rolEfectivo !== 'superadmin') return;
    let cancel = false;
    let intervalId = null;
    const fetchCount = async () => {
      try {
        const token = typeof window.getSessionToken === 'function' ? window.getSessionToken() : ((window.getSesion && window.getSesion() || {}).token || '');
        if (!token || !SCRIPT_URL_SB) return;
        const res = await fetch(SCRIPT_URL_SB, {
          method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ fn:'freeUserListarSolicitudes', token, estado:'PENDIENTE', limit:1 }),
        });
        const r = await res.json();
        if (!cancel && r?.ok) setPendientesGratis(r.pendientes ?? r.total ?? 0);
      } catch (_) {}
    };
    const refrescar = () => { if (document.visibilityState === 'visible') fetchCount(); };
    const onVis = () => { if (document.visibilityState === 'visible') fetchCount(); };
    // PERF1: se difiere para que el Campus pinte primero.
    const initialTimer = setTimeout(fetchCount, 1200);
    intervalId = setInterval(refrescar, 3 * 60 * 1000);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('an:free-user-solicitudes-changed', fetchCount);
    return () => {
      cancel = true;
      clearTimeout(initialTimer);
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('an:free-user-solicitudes-changed', fetchCount);
    };
  }, [rolEfectivo]);

  const solicitudesBadge = Number(pendientesPago || 0) || null;
  const prematriculasBadge = Number(pendientesGratis || 0) || null;
  const esUsuarioGratis = sidebarEsUsuarioGratisF984Z6CS(usr, role);

  // F98.4-A: menú del estudiante por proceso académico, no por archivo interno.
  // Club I CAN usa primero un indicador explícito de sesión (`acceso_ican`) y,
  // si no existe, el campo PROGRAMA proveniente de GRUPOS. No se muestra una
  // opción permanente "No aplica".
  const programaEstudiante = String(usr?.programa || usr?.PROGRAMA || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  const tieneICANExplicito = usr?.acceso_ican === true || String(usr?.acceso_ican || '').toUpperCase() === 'TRUE';
  const tieneICANPrograma = ['INA','CON_INA'].includes(programaEstudiante);
  const mostrarICAN = tieneICANExplicito || tieneICANPrograma;
  const studentSections = esUsuarioGratis ? [
    {
      label: 'Aprendizaje',
      items: [
        { id: 'dashboard', label: 'Mi Campus', icon: 'home' },
        { id: 'mi_curso', label: 'Mi curso', icon: 'materials', locked: true },
        ...(mostrarAcademiaPlay ? [{ id: 'academia_play', label: 'English LAB', icon: 'play', badge: 'Gratis' }] : []),
        { id: 'documentos_ayuda', label: 'Materiales', icon: 'doc', locked: true },
        { id: 'ican', label: 'Club I CAN', icon: 'ican', locked: true },
      ],
    },
    {
      label: 'Gestión',
      items: [
        { id: 'dashboard', label: 'Solicitar contacto', icon: 'card', badge: 'Nuevo' },
        { id: 'pagos', label: 'Pagos', icon: 'payments', locked: true },
        { id: 'certificados', label: 'Certificados', icon: 'certificates', locked: true },
      ],
    },
  ] : [
    {
      label: 'Menú',
      items: [
        { id: 'dashboard', label: 'Mi Campus', icon: 'home' },
        { id: 'mi_curso', label: 'Mi curso', icon: 'materials' },
        { id: 'evaluaciones', label: 'Evaluaciones', icon: 'check' },
        ...(mostrarICAN ? [{ id: 'ican', label: 'Club I CAN', icon: 'ican' }] : []),
        ...(mostrarAcademiaPlay ? [{ id: 'academia_play', label: 'English LAB', icon: 'play', badge: 'Piloto' }] : []),
      ],
    },
    {
      label: 'Gestión',
      items: [
        { id: 'pagos', label: 'Pagos y estado de cuenta', icon: 'payments' },
        { id: 'certificados', label: 'Certificados', icon: 'certificates' },
        { id: 'documentos_ayuda', label: 'Documentos y ayuda', icon: 'doc' },
      ],
    },
  ];
  // F98.4-Z6-F · orden y nombres definitivos del menú docente.
  // Club I CAN queda operativo para todos los docentes; cuando no existan
  // sesiones asignadas la vista muestra un estado vacío real, no “Próximamente”.
  const teacherNav = [
    { id: 'perfil', label: 'Mi Perfil', icon: 'profile' },
    { id: 'grupos', label: 'Mis Grupos', icon: 'roster' },
    { id: 'materiales', label: 'Biblioteca del Programa', icon: 'materials' },
    ...(mostrarAcademiaPlay ? [{ id: 'academia_play', label: 'English LAB', icon: 'play', badge: 'Piloto' }] : []),
    { id: 'examenes', label: 'Exámenes', icon: 'check' },
    { id: 'cronograma_grupo', label: 'Cronograma Inglés Conversacional', icon: 'calendar' },
    { id: 'ican', label: 'Club I CAN', icon: 'ican' },
    { id: 'mensajes', label: 'Comunicados', icon: 'messages' },
    { id: 'mi_panel_docente', label: 'Mis pendientes', icon: 'home', badge: pendientesDoc || null },
  ];
  const adminSections = [
    {
      label: 'Principal',
      items: [
        { id: 'perfil', label: 'Mi Perfil', icon: 'profile' },
        { id: 'dashboard', label: 'Panel Maestro', icon: 'chart' },
        { id: 'buscador', label: 'Consulta individual', icon: 'search' },
        { id: 'calendario_grupo', label: 'Calendario académico', icon: 'calendar' },
        { id: 'supervision', label: 'Supervisión', icon: 'bell' },
        ...(mostrarAcademiaPlay ? [{ id: 'academia_play', label: 'English LAB', icon: 'play', badge: 'Piloto' }] : []),
      ],
    },
    {
      label: 'Gestión académica',
      items: [
        { id: 'grupos', label: 'Grupos', icon: 'roster' },
        { id: 'estudiantes', label: 'Estudiantes', icon: 'profile' },
        { id: 'matriculas', label: 'Matrículas', icon: 'graduation' },
        { id: 'examenes', label: 'Exámenes', icon: 'check' },
        { id: 'auditoria_academica', label: 'Auditoría académica', icon: 'grades' },
      ],
    },
    {
      label: 'Operación administrativa',
      items: [
        ...(esSuperadmin ? [{ id: 'inscripcion_admin', label: 'Inscripción pública', icon: 'settings' }] : []),
        { id: 'prematriculas', label: 'Prematrículas', icon: 'card', badge: prematriculasBadge },
        { id: 'solicitudes', label: 'Solicitudes', icon: 'card', badge: solicitudesBadge },
      ],
    },
    {
      label: 'Finanzas y cobranza',
      items: [
        { id: 'conape_cobranza', label: 'CONAPE y Cobranza', icon: 'payments' },
        { id: 'banco', label: 'Importar banco', icon: 'payments' },
        { id: 'aplicar_pago', label: 'Aplicar pago', icon: 'card' },
        { id: 'reportes', label: 'Reportes', icon: 'chart' },
        { id: 'finanzas', label: 'Finanzas', icon: 'payments', proximamente: true },
      ],
    },
    {
      label: 'Control del sistema',
      items: [
        { id: 'diagnostico_interno', label: 'Diagnóstico interno', icon: 'settings' },
        { id: 'permisos_roles', label: 'Permisos y roles', icon: 'settings' },
        { id: 'docentes', label: 'Docentes', icon: 'graduation', proximamente: true },
        { id: 'horas', label: 'Horas docentes', icon: 'chart', proximamente: true },
        { id: 'ican', label: 'Club I CAN', icon: 'ican', proximamente: true },
        { id: 'config', label: 'Configuración', icon: 'settings', proximamente: true },
      ],
    },
  ];
  const adminNav = adminSections.flatMap(section => section.items);
  const nav = role === 'teacher' ? teacherNav : adminNav;
  const userName = usr?.nombre || '—';
  const userRole = usr
    ? (usr.rol === 'superadmin' ? 'Superadmin'
      : usr.rol === 'admin'    ? 'Administración'
      : usr.rol === 'teacher'  ? `Docente${usr.grupo ? ' · ' + sidebarTeacherGroupLabelF88(usr.grupo) : ''}`
      : (esUsuarioGratis ? 'Prematrícula' : `Estudiante${usr.codigo ? ' · ' + usr.codigo : ''}`))
    : 'Sin sesión';
  const userInit = userName.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || 'AN';

  return (
    <aside className={`sb ${role === 'student' ? 'student-sb' : ''} ${role === 'teacher' ? 'teacher-sb' : ''} ${role === 'admin' ? 'admin-sb' : ''}`} data-role={role || 'unknown'}>
      <div className="sb-brand">
        <div className="sb-logo sb-logo-real" style={{ background:'none', width:88, height:44, borderRadius:12, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
          <img src="assets/logo_academia_norteamericana_original.png" alt="Academia Norteamericana" style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} />
        </div>
        <div className="sb-brand-text">
          <div className="sb-brand-t1">Norteamericana</div>
          <div className="sb-brand-t2">Campus Virtual</div>
        </div>
      </div>

      {esSuperadmin && <ModoPruebaPanel />}

      {role === 'student' ? studentSections.map(section => (
        <React.Fragment key={section.label}>
          <div className="sb-section student-sb-section">{section.label}</div>
          {section.items.map(item => {
            if (item.locked) {
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Se desbloquea al activar matrícula"
                  className="sb-item student-sb-item student-sb-item-free-locked"
                  data-nav-id={item.id}>
                  <Icon name={item.icon} size={18} />
                  <span className="sb-label">{item.label}</span>
                  <span className="student-sb-soon">Bloqueado</span>
                </button>
              );
            }
            return (
              <button
                key={item.id}
                className={`sb-item student-sb-item ${active===item.id?'active':''}`}
                data-nav-id={item.id}
                onClick={() => setActive(item.id)}>
                <Icon name={item.icon} size={18} />
                <span className="sb-label">{item.label}</span>
                {item.badge && <span className="sb-badge">{item.badge}</span>}
              </button>
            );
          })}
        </React.Fragment>
      )) : role === 'teacher' ? (
        <>
          <div className="sb-section teacher-sb-section">Menú</div>
          {teacherNav.map(item => (
            <button
              key={item.id}
              className={`sb-item teacher-sb-item ${active===item.id?'active':''}`}
              onClick={() => setActive(item.id)}>
              <Icon name={item.icon} size={18} />
              <span className="sb-label">{item.label}</span>
              {item.badge && <span className="sb-badge">{item.badge}</span>}
            </button>
          ))}
        </>
      ) : (
        <>
          {adminSections.map(section => (
            <React.Fragment key={section.label}>
              <div className="sb-section admin-sb-section">{section.label}</div>
              {section.items.map(item => {
                if (item.proximamente) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled
                      aria-disabled="true"
                      title="En construcción — lo conectamos pronto"
                      className="sb-item admin-sb-item admin-sb-item-future">
                      <Icon name={item.icon} size={18} />
                      <span className="sb-label">{item.label}</span>
                      <span className="admin-sb-soon">Pronto</span>
                    </button>
                  );
                }
                return (
                  <button
                    key={item.id}
                    className={`sb-item admin-sb-item ${active===item.id?'active':''}`}
                    onClick={() => setActive(item.id)}>
                    <Icon name={item.icon} size={18} />
                    <span className="sb-label">{item.label}</span>
                    {item.badge && <span className="sb-badge">{item.badge}</span>}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </>
      )}

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
