// F98.4-Z6-CS21A61 · Arranque estable de Recursos Didácticos admin/superadmin
/* global React, AdminMasterDashboard */
(function () {
  const VERSION = 'F98.4-Z6-CS21A61';
  const OPEN_KEY = 'an_admin_resources_open';
  const TAB_KEY = 'an_admin_resources_tab';
  const EVENT_NAME = 'an:admin-resource-tab';
  const SYLLABUS_FILE = 'src/syllabus_views.jsx?v=F98.4Z6G';

  function isOpen() {
    try { return sessionStorage.getItem(OPEN_KEY) === '1'; }
    catch (_) { return false; }
  }

  function readTab() {
    try { return sessionStorage.getItem(TAB_KEY) === 'audios' ? 'audios' : 'libros'; }
    catch (_) { return 'libros'; }
  }

  function resourcesReady() {
    const base = window.__AN_CS21A59_TEACHER_MATERIALS_BASE__;
    const current = window.MaterialesView;
    return typeof base === 'function' &&
      typeof current === 'function' &&
      Boolean(current.__cs21a60UnitStarts || base.__cs21a60UnitStarts);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function ensureResourcesRuntime() {
    if (resourcesReady()) return true;

    let loader = window.anLazyCampus;
    for (let attempt = 0; attempt < 40 && (!loader || typeof loader.loadMany !== 'function'); attempt += 1) {
      await sleep(100);
      loader = window.anLazyCampus;
    }

    if (!loader || typeof loader.loadMany !== 'function') {
      throw new Error('El cargador del Campus todavía no está disponible.');
    }

    await loader.loadMany([SYLLABUS_FILE]);

    // Los parches CS21A59 y CS21A60 reaccionan al evento del cargador. Esperamos
    // a que terminen de encadenar MaterialesView antes de montar la pantalla.
    for (let attempt = 0; attempt < 80; attempt += 1) {
      if (resourcesReady()) return true;
      await sleep(100);
    }

    throw new Error('La biblioteca se cargó, pero Recursos Didácticos no terminó de inicializarse.');
  }

  function ResourceRuntimeGate({ Base, props }) {
    const [route, setRoute] = React.useState(() => ({ open: isOpen(), tab: readTab() }));
    const [state, setState] = React.useState(() => resourcesReady()
      ? { status: 'ready', error: '' }
      : { status: 'idle', error: '' });
    const requestRef = React.useRef(0);

    const start = React.useCallback(() => {
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      setState({ status: 'loading', error: '' });

      ensureResourcesRuntime()
        .then(() => {
          if (requestRef.current !== requestId) return;
          setState({ status: 'ready', error: '' });
        })
        .catch(reason => {
          if (requestRef.current !== requestId) return;
          setState({
            status: 'error',
            error: String(reason?.message || reason || 'No se pudo preparar Recursos Didácticos.'),
          });
        });
    }, []);

    React.useEffect(() => {
      const sync = event => {
        setRoute({
          open: isOpen(),
          tab: event?.detail?.tab === 'audios' ? 'audios' : readTab(),
        });
      };
      window.addEventListener(EVENT_NAME, sync);
      window.addEventListener('storage', sync);
      return () => {
        window.removeEventListener(EVENT_NAME, sync);
        window.removeEventListener('storage', sync);
      };
    }, []);

    React.useEffect(() => {
      if (!route.open) return;
      if (resourcesReady()) {
        setState({ status: 'ready', error: '' });
        return;
      }
      start();
    }, [route.open, route.tab, start]);

    if (!route.open) return <Base {...props} />;
    if (state.status === 'ready' && resourcesReady()) return <Base {...props} />;

    return (
      <section
        data-screen-label={`Admin · Recursos Didácticos · ${VERSION}`}
        style={{
          maxWidth: 760,
          margin: '54px auto',
          padding: '28px 30px',
          border: '1px solid var(--line,#e5e0d8)',
          borderRadius: 18,
          background: '#fff',
          boxShadow: '0 10px 34px rgba(0,0,0,.08)',
          textAlign: 'center',
        }}
      >
        <div style={{
          fontSize: 10.5,
          fontWeight: 950,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: 'var(--an-granate,#7A1E2C)',
        }}>
          Recursos Didácticos
        </div>
        <div style={{
          marginTop: 7,
          fontFamily: 'var(--f-serif,Georgia,serif)',
          fontSize: 27,
          color: 'var(--an-navy-ink,#001E47)',
        }}>
          {state.status === 'error' ? 'No se pudo completar la carga' : 'Preparando biblioteca…'}
        </div>
        <div style={{
          marginTop: 9,
          fontSize: 13,
          lineHeight: 1.55,
          color: state.status === 'error' ? '#8D1E1E' : 'var(--ink-3,#6f6a63)',
        }}>
          {state.status === 'error'
            ? state.error
            : `Cargando ${route.tab === 'audios' ? 'audios' : 'libros de texto'} y aplicando los permisos del perfil.`}
        </div>
        {state.status === 'error' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={start}
            style={{ marginTop: 17 }}
          >
            Reintentar
          </button>
        )}
      </section>
    );
  }

  function install() {
    const Current = window.AdminMasterDashboard ||
      (typeof AdminMasterDashboard === 'function' ? AdminMasterDashboard : null);

    // Debe envolver específicamente la capa CS21A59. Así queda por fuera de su
    // mensaje prematuro y evita que CS21A59 vuelva a envolver esta corrección.
    if (!Current || Current.__cs21a61ResourceRuntime) return false;
    if (!Current.__cs21a59AdminResources) return false;

    const Base = Current;
    const Wrapped = function AdminMasterDashboardCS21A61(props) {
      return <ResourceRuntimeGate Base={Base} props={props} />;
    };

    Wrapped.__cs21a61ResourceRuntime = true;
    Wrapped.__cs21a59AdminResources = true;
    Wrapped.__base = Base;
    window.AdminMasterDashboard = Wrapped;
    try { AdminMasterDashboard = Wrapped; } catch (_) {}
    return true;
  }

  install();
  window.addEventListener('an:lazy-module-loaded', () => setTimeout(install, 30));
  window.addEventListener(EVENT_NAME, () => setTimeout(install, 10));

  const probe = setInterval(() => {
    if (install()) clearInterval(probe);
  }, 200);
  setTimeout(() => clearInterval(probe), 30000);

  window.__AN_ADMIN_RESOURCES_RUNTIME_VERSION__ = VERSION;
})();
