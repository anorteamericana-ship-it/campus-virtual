// F98.4-Z6-CS21A75 · Ruta React segura de Libros y Audios para admin/superadmin
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A75';
  const OPEN_KEY = 'an_admin_resources_open';
  const TAB_KEY = 'an_admin_resources_tab';
  const EVENT_NAME = 'an:admin-resource-tab';

  function isOpen() {
    try { return sessionStorage.getItem(OPEN_KEY) === '1'; }
    catch (_) { return false; }
  }

  function readTab() {
    try { return sessionStorage.getItem(TAB_KEY) === 'audios' ? 'audios' : 'libros'; }
    catch (_) { return 'libros'; }
  }

  function viewerComponent() {
    return typeof window.__AN_BOOK_RESOURCES_COMPONENT__ === 'function'
      ? window.__AN_BOOK_RESOURCES_COMPONENT__
      : null;
  }

  function StatusView({ error = '', onRetry }) {
    return React.createElement(
      'section',
      {
        'data-screen-label': 'Admin · Recursos Didácticos · CS21A75',
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
      }, error ? 'No se pudo completar la carga' : 'Preparando Libros y Audios…'),
      React.createElement('div', {
        style: {
          marginTop: 9,
          fontSize: 13,
          lineHeight: 1.55,
          color: error ? '#8D1E1E' : 'var(--ink-3,#6f6a63)'
        }
      }, error || 'Esperando el visor institucional de libros.'),
      error ? React.createElement('button', {
        type: 'button',
        className: 'btn btn-primary',
        onClick: onRetry,
        style: { marginTop: 17 }
      }, 'Reintentar') : null
    );
  }

  function DirectGate({ Base, baseProps }) {
    const [route, setRoute] = React.useState(() => ({ open: isOpen(), tab: readTab() }));
    const [tick, setTick] = React.useState(0);
    const [error, setError] = React.useState('');

    const retry = React.useCallback(() => {
      setError('');
      setTick(value => value + 1);
      try { window.dispatchEvent(new CustomEvent('an:lazy-module-loaded')); } catch (_) {}
    }, []);

    React.useEffect(() => {
      const sync = event => {
        setRoute({
          open: isOpen(),
          tab: event?.detail?.tab === 'audios' ? 'audios' : readTab(),
        });
        setError('');
        setTick(value => value + 1);
      };
      window.addEventListener(EVENT_NAME, sync);
      window.addEventListener('an:lazy-module-loaded', sync);
      window.addEventListener('storage', sync);
      return () => {
        window.removeEventListener(EVENT_NAME, sync);
        window.removeEventListener('an:lazy-module-loaded', sync);
        window.removeEventListener('storage', sync);
      };
    }, []);

    React.useEffect(() => {
      if (!route.open || viewerComponent()) return undefined;
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (viewerComponent()) {
          window.clearInterval(timer);
          setTick(value => value + 1);
        } else if (attempts >= 200) {
          window.clearInterval(timer);
          setError('El visor institucional no terminó de inicializarse.');
        }
      }, 100);
      return () => window.clearInterval(timer);
    }, [route.open, route.tab, tick]);

    if (!route.open) return React.createElement(Base, baseProps || {});

    const Viewer = viewerComponent();
    if (!Viewer) return React.createElement(StatusView, { error, onRetry: retry });

    return React.createElement(Viewer, {
      key: `admin-books-${route.tab}`,
      initialType: 'SB',
      adminMode: true,
    });
  }

  function install() {
    const Current = window.AdminMasterDashboard;
    if (typeof Current !== 'function') return false;
    if (Current.__cs21a75DirectResources) return true;

    const Base = Current;
    const Wrapped = function AdminMasterDashboardCS21A75(props) {
      return React.createElement(DirectGate, { Base, baseProps: props });
    };

    Wrapped.__cs21a75DirectResources = true;
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
  const probe = window.setInterval(() => {
    if (install()) window.clearInterval(probe);
  }, 200);
  window.setTimeout(() => window.clearInterval(probe), 30000);

  window.__AN_ADMIN_RESOURCES_DIRECT_VERSION__ = VERSION;
})();