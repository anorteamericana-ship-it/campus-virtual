// F98.4-Z6-CS21A65 · Recursos Didácticos unificados por rol
/* global React, ReactDOM, Sidebar */
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A65';
  const ROUTE_ID = 'recursos_didacticos';
  const ADMIN_TAB_KEY = 'an_admin_resources_tab';
  const ADMIN_OPEN_KEY = 'an_admin_resources_open';
  const TEACHER_TAB_KEY = 'an_teacher_materiales_tab';
  const ADMIN_EVENT = 'an:admin-resource-tab';
  const VIEWER_SELECTOR = 'section[data-screen-label*="CS21A60"][data-screen-label*="Libros"]';

  function textOf(node) {
    return String(node?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function currentSession() {
    try {
      return (typeof window.getSesion === 'function'
        ? window.getSesion()
        : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {};
    } catch (_) {
      return {};
    }
  }

  function currentRole(props) {
    return String(props?.role || currentSession()?.rol || currentSession()?.role || '').trim().toLowerCase();
  }

  function normalizeStoredRoutes() {
    try {
      if (['audios', 'biblioteca'].includes(sessionStorage.getItem(ADMIN_TAB_KEY))) {
        sessionStorage.setItem(ADMIN_TAB_KEY, 'libros');
      }
      if (['audios', 'biblioteca'].includes(sessionStorage.getItem(TEACHER_TAB_KEY))) {
        sessionStorage.setItem(TEACHER_TAB_KEY, 'libros');
      }
    } catch (_) {}
  }

  function openResources(setActive) {
    try {
      sessionStorage.setItem(ADMIN_OPEN_KEY, '1');
      sessionStorage.setItem(ADMIN_TAB_KEY, 'libros');
      sessionStorage.setItem(TEACHER_TAB_KEY, 'libros');
    } catch (_) {}
    try {
      window.dispatchEvent(new CustomEvent(ADMIN_EVENT, { detail: { tab: 'libros' } }));
      window.dispatchEvent(new CustomEvent('an:teacher-material-tab', { detail: { tab: 'libros' } }));
    } catch (_) {}
    if (typeof setActive === 'function') setActive(ROUTE_ID);
  }

  function stripLegacyResourceWrappers(component) {
    let current = component;
    const seen = new Set();
    while (
      current &&
      !seen.has(current) &&
      (current.__cs21a59AdminResources || current.__cs21a60SuperResources)
    ) {
      seen.add(current);
      current = current.__base;
    }
    return current || component;
  }

  function findAdminInsertPoint(aside) {
    const sections = Array.from(aside.querySelectorAll('.admin-sb-section'));
    return sections.find(node => textOf(node) === 'Operación administrativa') || aside.querySelector('.sb-user');
  }

  function AdminResourcesPortal({ active, setActive }) {
    const [host, setHost] = React.useState(null);

    React.useEffect(() => {
      let disposed = false;
      let timer = null;
      let mount = null;

      const attach = () => {
        if (disposed) return true;
        const aside = document.querySelector('aside.admin-sb');
        if (!aside) return false;

        aside.querySelectorAll('#an-admin-resources-nav-cs21a59, #an-superadmin-resources-cs21a60').forEach(node => node.remove());
        mount = aside.querySelector('#an-resources-nav-cs21a65');
        if (!mount) {
          mount = document.createElement('div');
          mount.id = 'an-resources-nav-cs21a65';
          mount.setAttribute('data-version', VERSION);
          const before = findAdminInsertPoint(aside);
          if (before?.parentNode === aside) aside.insertBefore(mount, before);
          else aside.appendChild(mount);
        }
        setHost(mount);
        return true;
      };

      if (!attach()) timer = setInterval(() => { if (attach()) clearInterval(timer); }, 60);
      return () => {
        disposed = true;
        if (timer) clearInterval(timer);
        if (mount?.parentNode) mount.parentNode.removeChild(mount);
      };
    }, []);

    if (!host || !ReactDOM?.createPortal) return null;
    const selected = active === ROUTE_ID && sessionStorage.getItem(ADMIN_OPEN_KEY) === '1';

    return ReactDOM.createPortal(
      <>
        <div className="sb-section admin-sb-section">Recursos Didácticos</div>
        <button
          type="button"
          className={`sb-item admin-sb-item ${selected ? 'active' : ''}`}
          onClick={() => openResources(setActive)}
        >
          <span aria-hidden="true" style={{ width:18, textAlign:'center', fontWeight:950 }}>▣</span>
          <span className="sb-label">Libros y Audios</span>
        </button>
      </>,
      host
    );
  }

  function normalizeViewer(viewer, role) {
    Array.from(viewer.querySelectorAll('div')).forEach(node => {
      const text = textOf(node);
      if (/^Libros de texto\s*·/.test(text) && node.children.length === 0) {
        node.textContent = text.replace(/^Libros de texto/, 'Libros y Audios');
      }
      if (text === 'Libro del nivel actual' && node.children.length === 0) {
        node.textContent = 'Recursos Didácticos';
      }
    });

    const superadmin = role === 'superadmin';
    Array.from(viewer.querySelectorAll('button')).forEach(button => {
      const label = textOf(button);
      if (label === 'Actualizar desde Drive' || label === 'Actualizar' || label === 'Guardando…') {
        button.style.display = superadmin ? '' : 'none';
        button.setAttribute('aria-hidden', superadmin ? 'false' : 'true');
        if (!superadmin) button.tabIndex = -1;
      }
    });
  }

  function normalizeTeacherSidebar(aside) {
    const buttons = Array.from(aside.querySelectorAll('button'));
    buttons.forEach(button => {
      const labelNode = button.querySelector('.sb-label');
      const label = textOf(labelNode || button);
      if (label === 'Libros de texto' && labelNode) labelNode.textContent = 'Libros y Audios';
      if (label === 'Biblioteca digital' || label === 'Audios') button.style.display = 'none';
    });
  }

  function normalizeStudentSidebar(aside) {
    const courseButton = Array.from(aside.querySelectorAll('button')).find(button => {
      const label = textOf(button.querySelector('.sb-label') || button);
      return label === 'Mi curso' || label === 'Libros y Audios';
    });
    if (!courseButton) return;

    const labelNode = courseButton.querySelector('.sb-label');
    if (labelNode) labelNode.textContent = 'Libros y Audios';

    let section = aside.querySelector('#an-student-resources-section-cs21a65');
    if (!section) {
      section = document.createElement('div');
      section.id = 'an-student-resources-section-cs21a65';
      section.className = 'sb-section student-sb-section';
      section.textContent = 'Recursos Didácticos';
    }

    const management = Array.from(aside.querySelectorAll('.student-sb-section')).find(node => textOf(node) === 'Gestión');
    if (management?.parentNode === aside) {
      const alreadyPlaced = section.parentNode === aside &&
        section.nextElementSibling === courseButton &&
        courseButton.nextElementSibling === management;
      if (!alreadyPlaced) {
        aside.insertBefore(section, management);
        aside.insertBefore(courseButton, management);
      }
    }
  }

  function cleanLegacyAdminHosts(aside) {
    aside.querySelectorAll('#an-admin-resources-nav-cs21a59, #an-superadmin-resources-cs21a60').forEach(node => node.remove());
    const current = aside.querySelector('#an-resources-nav-cs21a65');
    Array.from(aside.querySelectorAll('.admin-sb-section')).forEach(section => {
      if (textOf(section) !== 'Recursos Didácticos') return;
      if (current && current.contains(section)) return;
      const parent = section.parentElement;
      if (parent && parent !== aside) parent.remove();
      else section.remove();
    });
  }

  function RoleNormalizer({ role }) {
    React.useEffect(() => {
      let scheduled = false;
      const run = () => {
        scheduled = false;
        const aside = document.querySelector(`aside[data-role="${role}"]`) || document.querySelector('aside');
        if (aside) {
          if (role === 'teacher' || role === 'docente') normalizeTeacherSidebar(aside);
          if (role === 'student' || role === 'estudiante') normalizeStudentSidebar(aside);
          if (role === 'admin' || role === 'superadmin') cleanLegacyAdminHosts(aside);
        }
        document.querySelectorAll(VIEWER_SELECTOR).forEach(viewer => normalizeViewer(viewer, role));
      };
      const schedule = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(run);
      };
      schedule();
      const observer = new MutationObserver(schedule);
      observer.observe(document.documentElement, { childList:true, subtree:true, characterData:true });
      window.addEventListener('an:teacher-material-tab', schedule);
      window.addEventListener('an:admin-resource-tab', schedule);
      window.addEventListener('an:session-changed', schedule);
      return () => {
        observer.disconnect();
        window.removeEventListener('an:teacher-material-tab', schedule);
        window.removeEventListener('an:admin-resource-tab', schedule);
        window.removeEventListener('an:session-changed', schedule);
      };
    }, [role]);
    return null;
  }

  function install() {
    normalizeStoredRoutes();
    const Current = window.Sidebar || (typeof Sidebar === 'function' ? Sidebar : null);
    if (!Current || Current.__cs21a65UnifiedResources) return false;

    const Base = stripLegacyResourceWrappers(Current);
    const Wrapped = function SidebarCS21A65(props) {
      const role = currentRole(props);
      const adminLike = role === 'admin' || role === 'superadmin';
      return (
        <>
          <Base {...props} />
          <RoleNormalizer role={role} />
          {adminLike && <AdminResourcesPortal active={props?.active} setActive={props?.setActive} />}
        </>
      );
    };

    Wrapped.__cs21a65UnifiedResources = true;
    Wrapped.__cs21a59AdminResources = true;
    Wrapped.__cs21a60SuperResources = true;
    Wrapped.__base = Base;
    window.Sidebar = Wrapped;
    try { Sidebar = Wrapped; } catch (_) {}
    return true;
  }

  install();
  window.addEventListener('an:lazy-module-loaded', () => setTimeout(install, 20));
  window.__AN_RESOURCES_PANEL_VERSION__ = VERSION;
})();
