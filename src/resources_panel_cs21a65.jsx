// F98.4-Z6-CS21A156 · Normalización transitoria de Recursos Didácticos docente.
// Administración usa una ruta React nativa y estudiante usa CS21A120.
/* global React, Sidebar */
(function teacherResourcesNormalizerCS21A156() {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A156';
  const VIEWER_SELECTOR = 'section[data-screen-label*="CS21A75"][data-screen-label*="Libros"]';

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function roleOf(props) {
    try {
      const user = typeof window.getSesion === 'function' ? window.getSesion() : null;
      return clean(user?.rol || props?.rolReal || props?.role).toLowerCase();
    } catch (_) {
      return clean(props?.rolReal || props?.role).toLowerCase();
    }
  }

  function labelOf(button) {
    return clean(button?.querySelector?.('.sb-label')?.textContent || button?.textContent);
  }

  function normalizeTeacherSidebar(aside) {
    Array.from(aside?.querySelectorAll?.('button.sb-item') || []).forEach(button => {
      const label = labelOf(button);
      const node = button.querySelector('.sb-label');
      if (label === 'Libros de texto' && node) node.textContent = 'Libros y Audios';
      if (label === 'Biblioteca digital' || label === 'Audios') {
        button.style.display = 'none';
        button.setAttribute('aria-hidden', 'true');
        button.tabIndex = -1;
      }
    });
  }

  function normalizeTeacherViewer(viewer) {
    Array.from(viewer?.querySelectorAll?.('div') || []).forEach(node => {
      const text = clean(node.textContent);
      if (/^Libros de texto\s*·/.test(text) && node.children.length === 0) {
        node.textContent = text.replace(/^Libros de texto/, 'Libros y Audios');
      }
    });
  }

  function TeacherResourcesNormalizer() {
    React.useEffect(() => {
      let frame = 0;
      const run = () => {
        frame = 0;
        normalizeTeacherSidebar(document.querySelector('aside[data-role="teacher"]'));
        document.querySelectorAll(VIEWER_SELECTOR).forEach(normalizeTeacherViewer);
      };
      const schedule = () => {
        if (frame) return;
        frame = requestAnimationFrame(run);
      };
      schedule();
      const observer = new MutationObserver(schedule);
      observer.observe(document.documentElement, { childList:true, subtree:true });
      window.addEventListener('an:teacher-material-tab', schedule);
      return () => {
        if (frame) cancelAnimationFrame(frame);
        observer.disconnect();
        window.removeEventListener('an:teacher-material-tab', schedule);
      };
    }, []);
    return null;
  }

  function install() {
    const Current = window.Sidebar || (typeof Sidebar === 'function' ? Sidebar : null);
    if (typeof Current !== 'function' || Current.__cs21a156TeacherResources) return false;
    const Base = Current;
    const Wrapped = function SidebarTeacherResourcesCS21A156(props) {
      const teacher = ['teacher','docente'].includes(roleOf(props));
      return <><Base {...props}/>{teacher && <TeacherResourcesNormalizer/>}</>;
    };
    Wrapped.__cs21a156TeacherResources = true;
    Wrapped.__cs21a65UnifiedResources = true;
    Wrapped.__base = Base;
    window.Sidebar = Wrapped;
    try { Sidebar = Wrapped; } catch (_) {}
    return true;
  }

  install();
  window.addEventListener('an:lazy-module-loaded', () => setTimeout(install, 20));
  window.__AN_RESOURCES_PANEL_VERSION__ = VERSION;
})();
