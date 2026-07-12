// F98.4-Z6-CS21A59 · Recursos Didácticos en Admin
/* global React, ReactDOM, Sidebar, AdminMasterDashboard, MaterialesView */
(function () {
  const VERSION = 'F98.4-Z6-CS21A59';
  const ROUTE_ID = 'recursos_didacticos';
  const TAB_KEY = 'an_admin_resources_tab';
  const OPEN_KEY = 'an_admin_resources_open';
  const TEACHER_TAB_KEY = 'an_teacher_materiales_tab';
  const EVENT_NAME = 'an:admin-resource-tab';

  function session() {
    try {
      return (typeof window.getSesion === 'function'
        ? window.getSesion()
        : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {};
    } catch (_) {
      return {};
    }
  }

  function token() {
    return typeof window.getSessionToken === 'function'
      ? window.getSessionToken()
      : '';
  }

  async function post(fn, payload = {}, timeout = 90000) {
    const endpoint = window.APPS_SCRIPT_URL;
    if (!endpoint) throw new Error('No está configurada la URL de Apps Script.');

    const controller = typeof AbortController !== 'undefined'
      ? new AbortController()
      : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;

    try {
      const response = await fetch(`${endpoint}?fn=${encodeURIComponent(fn)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ fn, token: token(), ...payload }),
        signal: controller ? controller.signal : undefined,
      });
      const raw = await response.text();
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; }
      catch (_) { throw new Error('Apps Script devolvió una respuesta inválida.'); }
      if (!response.ok || !data || data.ok !== true) {
        throw new Error(data?.mensaje || data?.error || `HTTP ${response.status}`);
      }
      return data;
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error('La actualización desde Drive tardó demasiado.');
      }
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function readTab() {
    return sessionStorage.getItem(TAB_KEY) === 'audios' ? 'audios' : 'libros';
  }

  function isOpen() {
    return sessionStorage.getItem(OPEN_KEY) === '1';
  }

  function clearAdminResourceRoute() {
    try { sessionStorage.removeItem(OPEN_KEY); } catch (_) {}
  }

  function emitTab(tab) {
    try {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { tab } }));
    } catch (_) {}
  }

  function openAdminResource(tab, setActive) {
    const nextTab = tab === 'audios' ? 'audios' : 'libros';
    try {
      sessionStorage.setItem(OPEN_KEY, '1');
      sessionStorage.setItem(TAB_KEY, nextTab);
      sessionStorage.setItem(TEACHER_TAB_KEY, nextTab);
    } catch (_) {}
    emitTab(nextTab);
    if (typeof setActive === 'function') setActive(ROUTE_ID);
  }

  function buttonText(button) {
    return String(button?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function HideTeacherDriveRefresh({ children }) {
    const ref = React.useRef(null);

    React.useEffect(() => {
      const hide = () => {
        if (!ref.current) return;
        Array.from(ref.current.querySelectorAll('button')).forEach(button => {
          if (buttonText(button) === 'Actualizar desde Drive') {
            button.style.display = 'none';
            button.setAttribute('aria-hidden', 'true');
            button.tabIndex = -1;
          }
        });
      };
      hide();
      const observer = new MutationObserver(hide);
      if (ref.current) observer.observe(ref.current, { childList: true, subtree: true });
      return () => observer.disconnect();
    }, []);

    return <div ref={ref}>{children}</div>;
  }

  function installTeacherPermissionPatch() {
    if (!window.MaterialesView || window.MaterialesView.__cs21a59AdminPermission) return;

    const Base = window.MaterialesView;
    window.__AN_CS21A59_TEACHER_MATERIALS_BASE__ = Base;

    const Wrapped = function MaterialesViewCS21A59Permission(props) {
      const user = session();
      const tab = sessionStorage.getItem(TEACHER_TAB_KEY) || 'info';
      const node = <Base {...props} />;
      if (user?.rol === 'teacher' && ['libros', 'biblioteca', 'audios'].includes(tab)) {
        return <HideTeacherDriveRefresh>{node}</HideTeacherDriveRefresh>;
      }
      return node;
    };

    Wrapped.__cs21a59AdminPermission = true;
    Wrapped.__base = Base;
    window.MaterialesView = Wrapped;
    try { MaterialesView = Wrapped; } catch (_) {}
  }

  function renderTeacherResourcesForAdmin(props, mode) {
    const Base = window.__AN_CS21A59_TEACHER_MATERIALS_BASE__;
    if (typeof Base !== 'function') return null;

    const realGetSesion = window.getSesion;
    const realSession = session();
    try {
      sessionStorage.setItem(TEACHER_TAB_KEY, mode);
      window.getSesion = () => ({ ...realSession, rol: 'teacher' });
      return Base(props || {});
    } finally {
      window.getSesion = realGetSesion;
    }
  }

  function inferOpenBook(root) {
    const buttons = Array.from(root?.querySelectorAll('button') || []);
    const levelButton = buttons.find(button => {
      const text = buttonText(button);
      return /^(B1|B2|I1|I2)\s*·/.test(text) && button.classList.contains('btn-primary');
    });
    const typeButton = buttons.find(button =>
      button.getAttribute('aria-pressed') === 'true' && /^(SB|TB|WB)$/.test(buttonText(button))
    );

    const levelMatch = buttonText(levelButton).match(/^(B1|B2|I1|I2)/);
    return {
      level: levelMatch ? levelMatch[1] : 'B1',
      bookType: typeButton ? buttonText(typeButton) : 'SB',
    };
  }

  function AdminResourcesMirror({ mode }) {
    const ref = React.useRef(null);
    const [renderKey, setRenderKey] = React.useState(0);
    const [syncing, setSyncing] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [error, setError] = React.useState('');

    React.useEffect(() => {
      try { sessionStorage.setItem(TEACHER_TAB_KEY, mode); } catch (_) {}
    }, [mode]);

    const handleCapture = async event => {
      const button = event.target?.closest?.('button');
      if (!button || buttonText(button) !== 'Actualizar desde Drive') return;

      event.preventDefault();
      event.stopPropagation();
      if (syncing) return;

      const open = inferOpenBook(ref.current);
      setSyncing(true);
      setError('');
      setMessage(`Actualizando ${open.level} · ${open.bookType}…`);

      try {
        const result = await post('adminBooksRefreshOpenBook', {
          level: open.level,
          book_type: open.bookType,
        });
        setMessage(
          `${open.level} · ${open.bookType} actualizado: ${Number(result.updated_page_count || 0)} hojas. Solo se modificó este libro.`
        );
        setRenderKey(value => value + 1);
      } catch (reason) {
        setMessage('');
        setError(String(reason?.message || reason || 'No se pudo actualizar el libro abierto.'));
      } finally {
        setSyncing(false);
      }
    };

    const node = renderTeacherResourcesForAdmin({}, mode);
    if (!node) {
      return (
        <div style={{ padding: 28, textAlign: 'center' }}>
          No se pudo cargar Recursos Didácticos.
        </div>
      );
    }

    return (
      <div ref={ref} onClickCapture={handleCapture} data-admin-resource-mode={mode}>
        {(message || error) && (
          <div
            role="status"
            style={{
              margin: '10px 12px 0',
              padding: '10px 13px',
              borderRadius: 10,
              border: `1px solid ${error ? '#D66' : '#58A36B'}`,
              background: error ? '#FFF0F0' : '#EDF9F0',
              color: error ? '#8D1E1E' : '#1F6333',
              fontSize: 12,
              fontWeight: 850,
            }}
          >
            {error || message}
          </div>
        )}
        <React.Fragment key={`${mode}-${renderKey}`}>{node}</React.Fragment>
        {syncing && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,30,71,.18)',
              display: 'grid',
              placeItems: 'center',
              pointerEvents: 'all',
            }}
          >
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: 12, fontWeight: 900 }}>
              Actualizando únicamente el libro abierto…
            </div>
          </div>
        )}
      </div>
    );
  }

  function AdminResourceMenuPortal({ active, setActive }) {
    const [target, setTarget] = React.useState(null);
    const [tab, setTab] = React.useState(readTab);

    React.useEffect(() => {
      const sync = event => setTab(event?.detail?.tab === 'audios' ? 'audios' : readTab());
      window.addEventListener(EVENT_NAME, sync);
      return () => window.removeEventListener(EVENT_NAME, sync);
    }, []);

    React.useEffect(() => {
      let disposed = false;
      let mount = null;
      let timer = null;

      const attach = () => {
        if (disposed) return true;
        const aside = document.querySelector('aside.admin-sb');
        if (!aside) return false;

        mount = aside.querySelector('#an-admin-resources-nav-cs21a59');
        if (!mount) {
          mount = document.createElement('div');
          mount.id = 'an-admin-resources-nav-cs21a59';
          mount.setAttribute('data-version', VERSION);
          const sections = Array.from(aside.querySelectorAll('.admin-sb-section'));
          const before = sections.find(node => buttonText(node) === 'Operación administrativa');
          const user = aside.querySelector('.sb-user');
          if (before?.parentNode === aside) aside.insertBefore(mount, before);
          else if (user?.parentNode === aside) aside.insertBefore(mount, user);
          else aside.appendChild(mount);
        }
        setTarget(mount);
        return true;
      };

      if (!attach()) timer = setInterval(() => { if (attach()) clearInterval(timer); }, 60);
      return () => {
        disposed = true;
        if (timer) clearInterval(timer);
        if (mount?.parentNode) mount.parentNode.removeChild(mount);
      };
    }, []);

    if (!target || !ReactDOM?.createPortal) return null;
    const routeActive = active === ROUTE_ID && isOpen();

    return ReactDOM.createPortal(
      <>
        <div className="sb-section admin-sb-section">Recursos Didácticos</div>
        <button
          type="button"
          className={`sb-item admin-sb-item ${routeActive && tab === 'libros' ? 'active' : ''}`}
          onClick={() => { setTab('libros'); openAdminResource('libros', setActive); }}
        >
          <span aria-hidden="true" style={{ width: 18, textAlign: 'center', fontWeight: 950 }}>▣</span>
          <span className="sb-label">Libros de texto</span>
        </button>
        <button
          type="button"
          className={`sb-item admin-sb-item ${routeActive && tab === 'audios' ? 'active' : ''}`}
          onClick={() => { setTab('audios'); openAdminResource('audios', setActive); }}
        >
          <span aria-hidden="true" style={{ width: 18, textAlign: 'center', fontWeight: 950 }}>♪</span>
          <span className="sb-label">Audios</span>
        </button>
      </>,
      target
    );
  }

  function installSidebarPatch() {
    if (!window.Sidebar || window.Sidebar.__cs21a59AdminResources) return;
    const Base = window.Sidebar;

    const Wrapped = function SidebarCS21A59(props) {
      const admin = props?.role === 'admin';
      const baseSetActive = target => {
        if (target !== ROUTE_ID) clearAdminResourceRoute();
        if (typeof props?.setActive === 'function') props.setActive(target);
      };
      return (
        <>
          <Base {...props} setActive={baseSetActive} />
          {admin && <AdminResourceMenuPortal active={props.active} setActive={props.setActive} />}
        </>
      );
    };

    Wrapped.__cs21a59AdminResources = true;
    Wrapped.__base = Base;
    window.Sidebar = Wrapped;
    try { Sidebar = Wrapped; } catch (_) {}
  }

  function AdminResourceDashboardSwitch({ Base, props }) {
    const [state, setState] = React.useState(() => ({ open: isOpen(), tab: readTab() }));

    React.useEffect(() => {
      const sync = event => setState({
        open: isOpen(),
        tab: event?.detail?.tab === 'audios' ? 'audios' : readTab(),
      });
      window.addEventListener(EVENT_NAME, sync);
      window.addEventListener('storage', sync);
      return () => {
        window.removeEventListener(EVENT_NAME, sync);
        window.removeEventListener('storage', sync);
      };
    }, []);

    if (state.open) return <AdminResourcesMirror mode={state.tab} />;
    return <Base {...props} />;
  }

  function installDashboardPatch() {
    const Current = window.AdminMasterDashboard ||
      (typeof AdminMasterDashboard === 'function' ? AdminMasterDashboard : null);
    if (!Current || Current.__cs21a59AdminResources) return false;

    const Base = Current;
    const Wrapped = function AdminMasterDashboardCS21A59(props) {
      return <AdminResourceDashboardSwitch Base={Base} props={props} />;
    };
    Wrapped.__cs21a59AdminResources = true;
    Wrapped.__base = Base;
    window.AdminMasterDashboard = Wrapped;
    try { AdminMasterDashboard = Wrapped; } catch (_) {}
    return true;
  }

  function install() {
    installTeacherPermissionPatch();
    installSidebarPatch();
    installDashboardPatch();
  }

  install();
  window.addEventListener('an:lazy-module-loaded', () => setTimeout(install, 20));
  window.addEventListener(EVENT_NAME, () => setTimeout(installDashboardPatch, 20));

  const probe = setInterval(() => {
    installTeacherPermissionPatch();
    if (installDashboardPatch()) clearInterval(probe);
  }, 250);
  setTimeout(() => clearInterval(probe), 20000);

  window.__AN_ADMIN_RESOURCES_VERSION__ = VERSION;
})();
