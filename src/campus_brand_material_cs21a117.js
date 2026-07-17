// F98.4-Z6-CS21A119 · A institucional, material docente y programa compartido.
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A119';
  let queued = false;
  let studentRoot = null;

  const MATERIALS = [
    {
      code: '1.1',
      title: 'Reglamento estudiantil',
      desc: 'Derechos, deberes y conducta académica.',
      meta: 'REQUERIDO · ~20 min',
      url: 'https://drive.google.com/file/d/1K_yZjUpiPF6MtXgapeFq7J314qqPQ-Ei/view'
    },
    {
      code: '1.2',
      title: 'Reglamento de netiqueta',
      desc: 'Normas de comportamiento en sesiones virtuales.',
      meta: 'REQUERIDO · ~10 min',
      url: 'https://drive.google.com/file/d/1X4NP2QJ-xMGBxLukRo-nSuKXf9zCcBll/view'
    },
    {
      code: '1.3',
      title: 'Video de bienvenida al Programa',
      desc: 'Introducción al Campus Virtual y al programa.',
      meta: 'REQUERIDO · ~6 min',
      url: 'https://drive.google.com/drive/folders/1UdRasbHeqzos7dzt-5VxjIE-Z6gjsrp8'
    },
    {
      code: '1.4',
      title: 'Guía — Uso de Zoom y Google Meet',
      desc: 'Herramienta principal y de contingencia.',
      meta: 'RECOMENDADO · ~8 min',
      url: 'https://drive.google.com/file/d/1zMbXdVpyBhci3skWFUthwmOfjdrv8Fed/view'
    },
    {
      code: '1.5',
      title: 'Guía — Contingencias técnicas',
      desc: 'Qué hacer ante fallas de audio, video o conexión.',
      meta: 'RECOMENDADO · ~5 min',
      url: 'https://drive.google.com/drive/folders/1QK3-mstC3ITvstKOCA1ccHzsR-CdKaZb'
    }
  ];

  function teacherMaterialBlock() {
    const section = document.createElement('section');
    section.className = 'tp117-required';
    section.dataset.cs21a117 = 'teacher-required-material';
    section.setAttribute('aria-label', 'Material obligatorio del programa');

    const head = document.createElement('div');
    head.className = 'tp117-required-head';
    head.innerHTML = '<div class="tp117-required-icon">📋</div><div><div class="tp117-required-kicker">Material obligatorio</div><div class="tp117-required-title">Antes de empezar tu programa</div></div>';

    const grid = document.createElement('div');
    grid.className = 'tp117-required-grid';

    MATERIALS.forEach(function (item) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tp117-required-card';
      button.innerHTML = '<span class="tp117-required-code">' + item.code + '</span><strong>' + item.title + '</strong><p>' + item.desc + '</p><span class="tp117-required-meta">' + item.meta + '</span>';
      button.addEventListener('click', function () {
        window.open(item.url, '_blank', 'noopener,noreferrer');
      });
      grid.appendChild(button);
    });

    section.appendChild(head);
    section.appendChild(grid);
    return section;
  }

  function patchTeacherProfile() {
    const mark = document.querySelector('.tp76-cover-mark');
    if (mark && mark.textContent.trim() !== 'A') mark.textContent = 'A';

    const hero = document.querySelector('.tp76-page .tp76-hero-card');
    if (!hero || document.querySelector('[data-cs21a117="teacher-required-material"]')) return;
    hero.insertAdjacentElement('afterend', teacherMaterialBlock());
  }

  function studentSessionActive() {
    try {
      const current = typeof window.getSesion === 'function'
        ? window.getSesion()
        : JSON.parse(sessionStorage.getItem('an_usuario') || 'null');
      return String(current && current.rol || '').toLowerCase() === 'student';
    } catch (_) {
      return false;
    }
  }

  function closeMobileMenu() {
    document.body.classList.remove('an-mobile-nav-open');
  }

  function programInfoHost() {
    let host = document.getElementById('an-program-info-host');
    if (host) return host;
    const app = document.querySelector('.app');
    if (!app) return null;
    host = document.createElement('main');
    host.id = 'an-program-info-host';
    host.className = 'main an-program-info-host';
    host.setAttribute('aria-live', 'polite');
    const currentMain = app.querySelector(':scope > .main:not(.an-program-info-host)');
    if (currentMain) currentMain.insertAdjacentElement('afterend', host);
    else app.appendChild(host);
    return host;
  }

  function markProgramMenuActive() {
    const sidebar = document.querySelector('.student-sb');
    if (!sidebar) return;
    sidebar.querySelectorAll('.sb-item.active').forEach(function (item) {
      item.classList.remove('active');
    });
    const button = sidebar.querySelector('[data-nav-id="info_programa"]');
    if (button) button.classList.add('active');
  }

  function closeStudentProgramInfo(keepHistory) {
    document.body.classList.remove('an-student-program-info-open');
    if (studentRoot) {
      try { studentRoot.unmount(); } catch (_) {}
      studentRoot = null;
    }
    const host = document.getElementById('an-program-info-host');
    if (host) host.remove();
    if (!keepHistory && (location.hash === '#info_programa' || location.hash === '#documentos_ayuda')) {
      try { history.replaceState({}, '', '#dashboard'); } catch (_) {}
    }
  }

  function openStudentProgramInfo(pushHistory) {
    if (!studentSessionActive()) return;
    const Component = window.ProgramInfoSharedCS21A119;
    if (typeof Component !== 'function' || !window.React || !window.ReactDOM) return;

    const host = programInfoHost();
    if (!host) return;

    document.body.classList.add('an-student-program-info-open');
    markProgramMenuActive();
    closeMobileMenu();

    if (!studentRoot) studentRoot = ReactDOM.createRoot(host);
    studentRoot.render(React.createElement(Component));

    if (pushHistory && location.hash !== '#info_programa') {
      try { history.pushState({ anProgramInfo:true }, '', '#info_programa'); } catch (_) { location.hash = 'info_programa'; }
    } else if (location.hash === '#documentos_ayuda') {
      try { history.replaceState({ anProgramInfo:true }, '', '#info_programa'); } catch (_) {}
    }

    try { window.scrollTo({ top:0, left:0, behavior:'auto' }); } catch (_) { window.scrollTo(0,0); }
  }

  function removeDocumentsHelpMenu(sidebar) {
    sidebar.querySelectorAll('[data-nav-id="documentos_ayuda"]').forEach(function (item) {
      item.remove();
    });
    sidebar.querySelectorAll('.sb-item').forEach(function (item) {
      const label = String(item.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (label === 'documentos y ayuda' || label === 'materiales bloqueado') item.remove();
    });
  }

  function patchStudentMenu() {
    const sidebar = document.querySelector('.student-sb');
    if (!sidebar) return;

    removeDocumentsHelpMenu(sidebar);

    sidebar.querySelectorAll('[data-nav-id="info_programa_cs21a117"]').forEach(function (item) {
      item.remove();
    });

    let button = sidebar.querySelector('[data-nav-id="info_programa"]');
    if (!button) {
      const home = sidebar.querySelector('[data-nav-id="dashboard"]');
      if (!home || !home.parentNode) return;
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'sb-item student-sb-item';
      button.dataset.navId = 'info_programa';
      button.innerHTML = '<svg class="sb-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg><span class="sb-label">Información General del Programa</span>';
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        openStudentProgramInfo(true);
      });
      home.parentNode.insertBefore(button, home.nextSibling);
    }

    if (document.body.classList.contains('an-student-program-info-open')) markProgramMenuActive();

    if (location.hash === '#documentos_ayuda') {
      openStudentProgramInfo(false);
    } else if (location.hash === '#info_programa' && !document.body.classList.contains('an-student-program-info-open')) {
      openStudentProgramInfo(false);
    }
  }

  function patch() {
    patchTeacherProfile();
    patchStudentMenu();
    window.CS21A119_CAMPUS_BRAND_MATERIAL = VERSION;
  }

  function queuePatch() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      patch();
    });
  }

  document.addEventListener('click', function (event) {
    const item = event.target && event.target.closest
      ? event.target.closest('.student-sb .sb-item')
      : null;
    if (!item || item.dataset.navId === 'info_programa') return;
    if (document.body.classList.contains('an-student-program-info-open')) {
      closeStudentProgramInfo(true);
    }
  }, true);

  window.addEventListener('popstate', function () {
    if (location.hash === '#info_programa' || location.hash === '#documentos_ayuda') {
      openStudentProgramInfo(false);
    } else if (document.body.classList.contains('an-student-program-info-open')) {
      closeStudentProgramInfo(true);
    }
  });

  window.addEventListener('an:lazy-module-loaded', queuePatch);
  window.addEventListener('an:session-changed', function () {
    closeStudentProgramInfo(true);
    queuePatch();
  });

  new MutationObserver(queuePatch).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', queuePatch, { once: true });
  } else {
    queuePatch();
  }
})();
