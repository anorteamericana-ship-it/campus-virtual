// F98.4-Z6-CS21A74 · Ruta directa y estable de Libros y Audios para admin/superadmin
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A74';
  const OPEN_KEY = 'an_admin_resources_open';
  const TAB_KEY = 'an_admin_resources_tab';
  const TEACHER_TAB_KEY = 'an_teacher_materiales_tab';
  const EVENT_NAME = 'an:admin-resource-tab';

  function isOpen() {
    try { return sessionStorage.getItem(OPEN_KEY) === '1'; }
    catch (_) { return false; }
  }

  function readTab() {
    try { return sessionStorage.getItem(TAB_KEY) === 'audios' ? 'audios' : 'libros'; }
    catch (_) { return 'libros'; }
  }

  function materialsReady() {
    const current = window.MaterialesView;
    return typeof current === 'function' && Boolean(current.__cs21a60UnitStarts);
  }

  function renderResources() {
    const Current = window.MaterialesView;
    if (!materialsReady()) return null;

    const realGetSesion = window.getSesion;
    let realSession = {};
    try {
      realSession = typeof realGetSesion === 'function'
        ? (realGetSesion() || {})
        : (JSON.parse(sessionStorage.getItem('an_usuario') || 'null') || {});
    } catch (_) {
      realSession = {};
    }

    try {
      sessionStorage.setItem(TEACHER_TAB_KEY, readTab());
      window.getSesion = function () { return Object.assign({}, realSession, { rol: 'teacher' }); };
      return Current({});
    } finally {
      window.getSesion = realGetSesion;
    }
  }

  function LoadingView() {
    return React.createElement(
      'section',
      {
        'data-screen-label': 'Admin · Recursos Didácticos · CS21A74',
        style: {
          maxWidth: 760,
          margin: '54px auto',
          padding: '28px 30px',
          border: '1px solid var(--line,#e5e0d8)',
          borderRadius: 18,
          background: '#fff',
          boxShadow: '0 10px 34px rgba(0,0,0,.08)',
          textAlign: 'center'
        }
      },
      React.createElement('div', {
        style: {
          fontSize: 10.5,
          fontWeight: 950,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: 'var(--an-granate,#7A1E2C)'
        }
      }, 'Recursos Didácticos'),
      React.createElement('div', {
        style: {
          marginTop: 7,
          fontFamily: 'var(--f-serif,Georgia,serif)',
          fontSize: 27,
          color: 'var(--an-navy-ink,#001E47)'
        }
      }, 'Preparando Libros y Audios…'),
      React.createElement('div', {
        style: {
          marginTop: 9,
          fontSize: 13,
          lineHeight: 1.55,
          color: 'var(--ink-3,#6f6a63)'
        }
      }, 'Cargando el visor institucional sin consultar grupos ni expedientes estudiantiles.')
    );
  }

  function DirectGate(props) {
    const Base = props.Base;
    const baseProps = props.props || {};
    const statePair = React.useState(function () { return { open: isOpen(), tab: readTab(), tick: 0 }; });
    const state = statePair[0];
    const setState = statePair[1];

    React.useEffect(function () {
      const sync = function (event) {
        setState(function (previous) {
          return {
            open: isOpen(),
            tab: event && event.detail && event.detail.tab === 'audios' ? 'audios' : readTab(),
            tick: previous.tick + 1
          };
        });
      };
      window.addEventListener(EVENT_NAME, sync);
      window.addEventListener('an:lazy-module-loaded', sync);
      window.addEventListener('storage', sync);
      return function () {
        window.removeEventListener(EVENT_NAME, sync);
        window.removeEventListener('an:lazy-module-loaded', sync);
        window.removeEventListener('storage', sync);
      };
    }, []);

    React.useEffect(function () {
      if (!state.open || materialsReady()) return undefined;
      const timer = window.setInterval(function () {
        if (materialsReady()) {
          window.clearInterval(timer);
          setState(function (previous) {
            return { open: isOpen(), tab: readTab(), tick: previous.tick + 1 };
          });
        }
      }, 100);
      const stop = window.setTimeout(function () { window.clearInterval(timer); }, 20000);
      return function () {
        window.clearInterval(timer);
        window.clearTimeout(stop);
      };
    }, [state.open, state.tab]);

    if (!state.open) return React.createElement(Base, baseProps);
    const node = renderResources();
    return node || React.createElement(LoadingView);
  }

  function install() {
    const Current = window.AdminMasterDashboard;
    if (typeof Current !== 'function') return false;
    if (Current.__cs21a74DirectResources) return true;

    const Base = Current;
    const Wrapped = function AdminMasterDashboardCS21A74(props) {
      return React.createElement(DirectGate, { Base: Base, props: props });
    };

    Wrapped.__cs21a74DirectResources = true;
    Wrapped.__cs21a61ResourceRuntime = true;
    Wrapped.__cs21a59AdminResources = true;
    Wrapped.__base = Base;
    window.AdminMasterDashboard = Wrapped;
    try { AdminMasterDashboard = Wrapped; } catch (_) {}
    return true;
  }

  function scheduleInstall() {
    window.setTimeout(install, 80);
  }

  install();
  window.addEventListener('an:lazy-module-loaded', scheduleInstall);
  window.addEventListener(EVENT_NAME, scheduleInstall);
  const probe = window.setInterval(function () {
    if (install()) window.clearInterval(probe);
  }, 200);
  window.setTimeout(function () { window.clearInterval(probe); }, 30000);

  window.__AN_ADMIN_RESOURCES_DIRECT_VERSION__ = VERSION;
})();
