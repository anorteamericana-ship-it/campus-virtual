// F98.4-Z6-CS21A69 · Selección única y reactiva del menú lateral
/* global React, Sidebar */
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A69';
  const RESOURCE_MODE_KEY = 'an_resources_panel_mode_cs21a68';
  const RESOURCE_MODE_EVENT = 'an:resources-panel-mode';
  const lastKeyByRole = Object.create(null);
  const pendingUntilByRole = Object.create(null);

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function normalizeRole(value) {
    const role = clean(value).toLowerCase();
    if (role === 'superadmin') return 'admin';
    if (role === 'docente') return 'teacher';
    if (role === 'estudiante') return 'student';
    return role || 'unknown';
  }

  function menuLabel(button) {
    return clean(button && button.querySelector && button.querySelector('.sb-label')
      ? button.querySelector('.sb-label').textContent
      : button && button.textContent);
  }

  function buttonKey(button) {
    if (!button) return '';
    return clean(button.getAttribute('data-nav-id') || button.id || menuLabel(button)).toLowerCase();
  }

  function navButtons(aside) {
    return Array.from(aside && aside.querySelectorAll ? aside.querySelectorAll('button.sb-item') : []);
  }

  function usable(button) {
    if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return false;
    if (button.style.display === 'none' || button.getAttribute('aria-hidden') === 'true') return false;
    return true;
  }

  function findByKey(aside, key) {
    if (!key) return null;
    return navButtons(aside).find(function (button) {
      return usable(button) && buttonKey(button) === key;
    }) || null;
  }

  function findByLabels(aside, labels) {
    const wanted = (labels || []).map(function (value) { return clean(value).toLowerCase(); });
    return navButtons(aside).find(function (button) {
      return usable(button) && wanted.indexOf(menuLabel(button).toLowerCase()) >= 0;
    }) || null;
  }

  function readResourceMode() {
    try { return sessionStorage.getItem(RESOURCE_MODE_KEY) === 'additional' ? 'additional' : 'books'; }
    catch (_) { return 'books'; }
  }

  function setResourceMode(mode) {
    const next = mode === 'additional' ? 'additional' : 'books';
    try { sessionStorage.setItem(RESOURCE_MODE_KEY, next); } catch (_) {}
    if (next === 'books') window.__AN_ADDITIONAL_RESOURCES_OPENING_CS21A68__ = false;
    try { window.dispatchEvent(new CustomEvent(RESOURCE_MODE_EVENT, { detail:{ mode:next } })); } catch (_) {}
  }

  function currentRoute(role) {
    try {
      return clean(localStorage.getItem('an_active_' + role) || localStorage.getItem('an_active') || '');
    } catch (_) {
      return '';
    }
  }

  function routeCandidate(aside, role) {
    const route = currentRoute(role);
    const mode = readResourceMode();

    if (mode === 'additional') {
      const additional = findByLabels(aside, ['Recursos adicionales']);
      if (additional && (
        route === 'materiales' || route === 'mi_curso' || route === 'recursos_didacticos' ||
        document.querySelector('[data-screen-label^="Recursos Didácticos · Recursos adicionales"]')
      )) return additional;
    }

    if (role === 'teacher' && route === 'materiales') {
      let intent = 'info';
      try { intent = sessionStorage.getItem('an_teacher_materiales_tab') || 'info'; } catch (_) {}
      const map = {
        info:['Información General del Programa'],
        asistencia:['Asistencia'],
        syllabus:['Syllabus'],
        planeamiento:['Planeamiento didáctico','Planeamiento por lección'],
        cronograma_modulo:['Cronograma del módulo'],
        cronograma_general:['Cronograma general'],
        biblioteca:['Libros y Audios'],
        libros:['Libros y Audios'],
        audios:['Libros y Audios']
      };
      const candidate = findByLabels(aside, map[intent] || []);
      if (candidate) return candidate;
    }

    if (role === 'student' && (route === 'mi_curso' || route === 'materiales')) {
      const studentCandidate = findByLabels(aside, [mode === 'additional' ? 'Recursos adicionales' : 'Libros y Audios']);
      if (studentCandidate) return studentCandidate;
    }

    if (role === 'admin' && route === 'recursos_didacticos') {
      const adminCandidate = findByLabels(aside, [mode === 'additional' ? 'Recursos adicionales' : 'Libros y Audios']);
      if (adminCandidate) return adminCandidate;
    }

    const byId = navButtons(aside).find(function (button) {
      return usable(button) && clean(button.getAttribute('data-nav-id')) === route;
    });
    if (byId) return byId;

    const routeLabels = {
      dashboard:['Mi Campus','Panel Maestro'],
      perfil:['Mi Perfil'],
      grupos:['Mis grupos','Mis Grupos','Grupos'],
      estudiantes:['Estudiantes'],
      matriculas:['Matrículas'],
      calendario_grupo:['Calendario académico'],
      cronograma_grupo:['Calendario académico','Cronograma Inglés Conversacional'],
      ican:['I CAN Conversation Club','Club I CAN'],
      examenes:['Exámenes'],
      mensajes:['Comunicados'],
      mi_panel_docente:['Mis pendientes'],
      academia_play:['English LAB'],
      english_lab_live:['English LAB','English LAB Live'],
      evaluaciones:['Evaluaciones'],
      pagos:['Pagos','Pagos y estado de cuenta'],
      certificados:['Certificados'],
      documentos_ayuda:['Documentos y ayuda'],
      buscador:['Consulta individual'],
      auditoria_academica:['Auditoría académica'],
      supervision:['Supervisión'],
      prematriculas:['Prematrículas'],
      solicitudes:['Solicitudes'],
      conape_cobranza:['CONAPE y Cobranza'],
      banco:['Importar banco'],
      aplicar_pago:['Aplicar pago'],
      reportes:['Reportes'],
      diagnostico_interno:['Diagnóstico interno'],
      permisos_roles:['Permisos y roles'],
      inscripcion_admin:['Inscripción pública']
    };
    return findByLabels(aside, routeLabels[route] || []);
  }

  function applySingle(aside, target) {
    if (!aside) return;
    navButtons(aside).forEach(function (button) {
      const active = button === target;
      if (button.classList.contains('active') !== active) button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }

  function reconcile(aside, role, forceKey) {
    if (!aside) return;
    const buttons = navButtons(aside).filter(usable);
    if (!buttons.length) return;

    const pending = Number(pendingUntilByRole[role] || 0) > Date.now();
    let target = findByKey(aside, forceKey || (pending ? lastKeyByRole[role] : ''));
    const active = buttons.filter(function (button) { return button.classList.contains('active'); });

    if (!target && !pending && active.length === 1) {
      lastKeyByRole[role] = buttonKey(active[0]);
      active[0].setAttribute('aria-current', 'page');
      return;
    }

    if (!target) target = routeCandidate(aside, role);
    if (!target && active.length) target = active[active.length - 1];
    if (!target) target = findByKey(aside, lastKeyByRole[role]);
    if (!target) return;

    lastKeyByRole[role] = buttonKey(target);
    applySingle(aside, target);
  }

  function SidebarActiveGuard(props) {
    const role = props.role;
    const revision = props.revision;
    React.useEffect(function () {
      const domRole = normalizeRole(role);
      let disposed = false;
      let aside = null;
      let observer = null;
      let frame = 0;
      let attachTimer = 0;

      function schedule(forceKey) {
        if (disposed) return;
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(function () {
          frame = 0;
          if (!aside || !document.documentElement.contains(aside)) {
            aside = document.querySelector('aside[data-role="' + domRole + '"]') || document.querySelector('aside');
          }
          reconcile(aside, domRole, forceKey);
        });
      }

      function attach() {
        aside = document.querySelector('aside[data-role="' + domRole + '"]') || document.querySelector('aside');
        if (!aside) return false;
        observer = new MutationObserver(function () { schedule(); });
        observer.observe(aside, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style','aria-hidden'] });
        schedule();
        return true;
      }

      function onClick(event) {
        if (event.isTrusted !== true) return;
        const button = event.target && event.target.closest ? event.target.closest('aside button.sb-item') : null;
        if (!button || !usable(button)) return;
        const owner = button.closest('aside');
        if (!owner) return;
        aside = owner;
        const label = menuLabel(button);
        const key = buttonKey(button);
        lastKeyByRole[domRole] = key;
        pendingUntilByRole[domRole] = Date.now() + 1400;

        if (label === 'Recursos adicionales') setResourceMode('additional');
        else setResourceMode('books');

        applySingle(aside, button);
        schedule(key);
        setTimeout(function () { schedule(key); }, 40);
        setTimeout(function () { schedule(key); }, 180);
        setTimeout(function () { schedule(); }, 500);
      }

      document.addEventListener('click', onClick, true);
      if (!attach()) {
        attachTimer = window.setInterval(function () {
          if (attach()) window.clearInterval(attachTimer);
        }, 60);
      }

      return function () {
        disposed = true;
        document.removeEventListener('click', onClick, true);
        if (observer) observer.disconnect();
        if (frame) cancelAnimationFrame(frame);
        if (attachTimer) window.clearInterval(attachTimer);
      };
    }, [role, revision]);
    return null;
  }

  function install() {
    const Current = window.Sidebar || (typeof Sidebar === 'function' ? Sidebar : null);
    if (typeof Current !== 'function' || Current.__cs21a69ActiveState) return false;
    const Base = Current;

    const Wrapped = function SidebarCS21A69(props) {
      const state = React.useState(0);
      const revision = state[0];
      const setRevision = state[1];
      React.useEffect(function () {
        const refresh = function () { setRevision(function (value) { return value + 1; }); };
        const events = ['an:teacher-material-tab','an:admin-resource-tab',RESOURCE_MODE_EVENT,'an:session-changed','hashchange','popstate'];
        events.forEach(function (name) { window.addEventListener(name, refresh); });
        return function () { events.forEach(function (name) { window.removeEventListener(name, refresh); }); };
      }, []);

      const role = normalizeRole((props && props.role) || (props && props.rolReal));
      return React.createElement(
        React.Fragment,
        null,
        React.createElement(Base, Object.assign({}, props, { __cs21a69Revision:revision })),
        React.createElement(SidebarActiveGuard, { role:role, revision:revision })
      );
    };

    try { Object.keys(Base).forEach(function (key) { Wrapped[key] = Base[key]; }); } catch (_) {}
    Wrapped.__cs21a69ActiveState = true;
    Wrapped.__base = Base;
    window.Sidebar = Wrapped;
    try { Sidebar = Wrapped; } catch (_) {}
    return true;
  }

  install();
  window.addEventListener('an:lazy-module-loaded', function () { setTimeout(install, 20); });
  window.__AN_SIDEBAR_ACTIVE_STATE_VERSION__ = VERSION;
})();
