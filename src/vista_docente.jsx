/* global React, Icon, PageHeader, EmptyState, ErrorState,
   fetchCalendarioDocente, fetchTareasPendientesDocente */

// ─────────────────────────────────────────────────────────────────────────
// VISTA DOCENTE — Fase 2 · Prompt A1 (ESQUELETO + INTEGRACIÓN)
//
// Este archivo es SOLO el cascarón. Lo que falta y entra en prompts A2/A3/A4:
//   • A2 → lista detallada de lecciones (cards por lección, filtros, etc.)
//   • A3 → modal de cierre de lección (form completo)
//   • A4 → banner de pendientes funcional (acciones directas)
//
// Acá viven: auth/fallback, fetch inicial, layout vacío con placeholders,
// tabs con contadores reales.
// ─────────────────────────────────────────────────────────────────────────

// TODO: reemplazar por endpoint listDocentes() cuando exista
const DOCENTES_TESTING = [
  'ANA BELEN SALAZAR FUENTES',
  'EMILY LUCIA VEGA SALAS',
  'JOHN ALVAREZ GONZALEZ',
  'JOSELYN RODRÍGUEZ UGALDE',
  'KEYLOR LEIVA MIRANDA',
  'RACHELLE MICHELLE CRUZ PEREZ',
  'SULIVANY MEDINA FONSECA',
  'YENDRY VANESSA AGUILAR ROJAS',
];

// ── Auth: lee la sesión con prioridad para keys sueltas ─────────────────
//   Spec del prompt: sessionStorage.cedula / .nombre / .rol
//   Realidad del proyecto: sessionStorage.an_usuario = JSON.stringify({...})
// Soportamos ambos. Las keys sueltas ganan si existen.
function leerSesionDocente() {
  const cedula = sessionStorage.getItem('cedula') || '';
  const nombre = sessionStorage.getItem('nombre') || '';
  const rol    = sessionStorage.getItem('rol')    || '';
  if (nombre || cedula) return { cedula, nombre, rol };
  try {
    const u = JSON.parse(sessionStorage.getItem('an_usuario') || 'null');
    if (u) return { cedula: u.cedula || '', nombre: u.nombre || '', rol: u.rol || '' };
  } catch (_) {}
  return { cedula: '', nombre: '', rol: '' };
}

// ── Selector "modo testing" ─────────────────────────────────────────────
function TestingSelector({ value, onChange }) {
  return (
    <div style={{
      maxWidth: 520, margin: '64px auto', padding: 24,
      background: 'var(--surface-2)',
      border: '1px dashed var(--line-2)',
      borderRadius: 'var(--r-md)',
      fontFamily: 'var(--f-sans)',
    }}>
      <div style={{
        fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--ink-3)', fontWeight: 700, marginBottom: 8,
      }}>
        Modo testing
      </div>
      <div style={{ fontSize: 15, color: 'var(--ink-2)', marginBottom: 14, lineHeight: 1.5 }}>
        No hay docente logueado. Simulá la vista escogiendo un nombre:
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 12px',
          border: '1.5px solid var(--line)',
          borderRadius: 'var(--r-sm)',
          background: 'var(--surface)',
          fontFamily: 'var(--f-mono)', fontSize: 13,
          color: 'var(--ink)', cursor: 'pointer', outline: 'none',
        }}
      >
        <option value="">— elegir docente —</option>
        {DOCENTES_TESTING.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
    </div>
  );
}

// ── Spinner sobrio ──────────────────────────────────────────────────────
function VDSpinner({ label = 'Cargando panel del docente…' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 12, padding: '80px 24px', color: 'var(--ink-3)',
      fontFamily: 'var(--f-sans)',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '3px solid var(--line)',
        borderTopColor: 'var(--an-granate)',
        animation: 'vd-spin 0.8s linear infinite',
      }} />
      <div style={{ fontSize: 13 }}>{label}</div>
      <style>{`@keyframes vd-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Banner pendientes (placeholder — A4 lo activa) ──────────────────────
function PendientesBanner({ total }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px',
      background: 'var(--surface-2)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r-md)',
      marginBottom: 20,
      fontFamily: 'var(--f-sans)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: total > 0 ? 'var(--an-red)' : 'var(--bg-deep)',
        color: total > 0 ? 'white' : 'var(--ink-3)',
        display: 'grid', placeItems: 'center',
        fontWeight: 700, fontSize: 14, flexShrink: 0,
      }}>{total}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
          {total === 0
            ? 'No tenés pendientes administrativos.'
            : `Tenés ${total} ${total === 1 ? 'pendiente' : 'pendientes'} por resolver.`}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
          Acciones rápidas — disponibles en próxima fase (A4)
        </div>
      </div>
    </div>
  );
}

// ── Tabs ────────────────────────────────────────────────────────────────
function VDTabs({ value, onChange, counts }) {
  const tabs = [
    { id: 'proximas',  label: 'Próximas',    count: counts.proximas },
    { id: 'historico', label: 'Histórico',   count: counts.historico },
    { id: 'pre',       label: 'PRE-Campus',  count: counts.pre },
  ];
  return (
    <div style={{
      display: 'flex', gap: 4,
      borderBottom: '1px solid var(--line)',
      marginBottom: 20,
      fontFamily: 'var(--f-sans)',
    }}>
      {tabs.map(t => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px 16px', marginBottom: -1,
              fontSize: 14, fontWeight: active ? 700 : 500,
              color: active ? 'var(--an-granate)' : 'var(--ink-2)',
              borderBottom: active ? '2px solid var(--an-granate)' : '2px solid transparent',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {t.label}
            <span style={{
              fontSize: 11, fontWeight: 600,
              padding: '2px 8px', borderRadius: 'var(--r-pill)',
              background: active ? 'var(--an-granate)' : 'var(--bg-deep)',
              color: active ? 'white' : 'var(--ink-2)',
              fontFamily: 'var(--f-mono)',
              minWidth: 24, textAlign: 'center',
            }}>{t.count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Placeholder del contenido del tab ───────────────────────────────────
function TabPlaceholder({ tabId }) {
  const labels = {
    proximas:  'Lecciones programadas (próximas)',
    historico: 'Lecciones cerradas (histórico)',
    pre:       'Lecciones PRE-Campus',
  };
  return (
    <div style={{
      padding: '60px 24px', textAlign: 'center',
      background: 'var(--surface-2)',
      border: '1px dashed var(--line-2)',
      borderRadius: 'var(--r-md)',
      fontFamily: 'var(--f-sans)',
    }}>
      <div style={{
        fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--ink-3)', fontWeight: 700, marginBottom: 10,
      }}>
        Próximamente
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
        {labels[tabId] || 'Contenido'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>
        Tu lista de lecciones aparecerá aquí (A2).
      </div>
    </div>
  );
}

// ── Componente raíz ─────────────────────────────────────────────────────
function VistaDocente({ cedulaOverride, nombreOverride } = {}) {
  const sesion = React.useMemo(() => leerSesionDocente(), []);
  // El selector testing aplica solo si NO hay nombre/cédula reales y
  // tampoco se pasó override por props.
  const [testingNombre, setTestingNombre] = React.useState('');

  const nombre = nombreOverride || sesion.nombre || testingNombre || '';
  const cedula = cedulaOverride || sesion.cedula || '';
  // El backend acepta ambos pero usamos el nombre como ID funcional.
  const idDocente = nombre || cedula;

  const [calendario, setCalendario] = React.useState(null);
  const [pendientes, setPendientes] = React.useState(null);
  const [loading, setLoading]       = React.useState(false);
  const [error, setError]           = React.useState('');
  const [tab, setTab]               = React.useState('proximas');

  React.useEffect(() => {
    if (!idDocente) return;
    let cancel = false;
    setLoading(true);
    setError('');
    Promise.all([
      fetchCalendarioDocente(idDocente),
      fetchTareasPendientesDocente(idDocente),
    ])
      .then(([cal, pend]) => {
        if (cancel) return;
        if (!cal?.ok) throw new Error(cal?.error || 'No se pudo cargar el calendario.');
        if (!pend?.ok) throw new Error(pend?.error || 'No se pudieron cargar los pendientes.');
        setCalendario(cal);
        setPendientes(pend);
      })
      .catch(e => { if (!cancel) setError(e.message || 'Error de conexión.'); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [idDocente]);

  // Sin sesión → selector testing
  if (!idDocente) {
    return (
      <div>
        <PageHeader
          kicker="Panel del docente"
          title={<>Mi <em>Panel</em></>}
          sub="Sin sesión activa — escogé un docente para previsualizar la vista."
        />
        <TestingSelector value={testingNombre} onChange={setTestingNombre} />
      </div>
    );
  }

  // Loading inicial
  if (loading && !calendario) {
    return (
      <div>
        <PageHeader
          kicker="Panel del docente"
          title={<>Mi <em>Panel</em></>}
          sub={nombre || cedula}
        />
        <VDSpinner />
      </div>
    );
  }

  // Error duro
  if (error && !calendario) {
    return (
      <div>
        <PageHeader
          kicker="Panel del docente"
          title={<>Mi <em>Panel</em></>}
          sub={nombre || cedula}
        />
        <ErrorState message={error} onRetry={() => {
          // refetch simple: forzar el efecto cambiando el idDocente
          // (truco: setear estado temporal y volver). Para A1 alcanza con
          // recargar la página manualmente; en A2 metemos retry real.
          setError('');
          setLoading(true);
          Promise.all([
            fetchCalendarioDocente(idDocente),
            fetchTareasPendientesDocente(idDocente),
          ]).then(([cal, pend]) => {
            setCalendario(cal); setPendientes(pend);
          }).catch(e => setError(e.message)).finally(() => setLoading(false));
        }} />
      </div>
    );
  }

  const counts = {
    proximas:  calendario?.total_programadas ?? (calendario?.programadas?.length || 0),
    historico: calendario?.total_cerradas    ?? (calendario?.cerradas?.length || 0),
    pre:       calendario?.total_historico   ?? (calendario?.historico?.length || 0),
  };
  const totalPendientes = pendientes?.totales?.total_pendientes ?? 0;

  return (
    <div>
      <PageHeader
        kicker="Panel del docente"
        title={<>Mi <em>Panel</em></>}
        sub={nombre || cedula}
      />

      <PendientesBanner total={totalPendientes} />

      <VDTabs value={tab} onChange={setTab} counts={counts} />

      <TabPlaceholder tabId={tab} />
    </div>
  );
}

Object.assign(window, { VistaDocente });
