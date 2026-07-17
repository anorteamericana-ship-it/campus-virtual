// F98.4-Z6-CS21A117 · A institucional, material docente y acceso estudiantil.
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A117';
  let queued = false;

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

  function openStudentProgramInfo() {
    const existing = document.querySelector('.student-sb [data-nav-id="documentos_ayuda"]');
    if (existing && typeof existing.click === 'function') existing.click();

    let attempts = 0;
    const timer = window.setInterval(function () {
      attempts += 1;
      const target = Array.from(document.querySelectorAll('main button, main [role="tab"], .main button, .main [role="tab"]')).find(function (node) {
        return !node.closest('.student-sb') && /información general del programa|informacion general del programa/i.test(String(node.textContent || '').trim());
      });
      if (target && typeof target.click === 'function') {
        target.click();
        window.clearInterval(timer);
        return;
      }
      if (attempts >= 12) window.clearInterval(timer);
    }, 180);
  }

  function patchStudentMenu() {
    const sidebar = document.querySelector('.student-sb');
    if (!sidebar || !sidebar.querySelector('[data-nav-id="mi_curso"]')) return;
    if (sidebar.querySelector('[data-nav-id="info_programa_cs21a117"]')) return;

    const home = sidebar.querySelector('[data-nav-id="dashboard"]');
    if (!home || !home.parentNode) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sb-item student-sb-item';
    button.dataset.navId = 'info_programa_cs21a117';
    button.innerHTML = '<svg class="sb-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg><span class="sb-label">Información General del Programa</span>';
    button.addEventListener('click', function () {
      openStudentProgramInfo();
    });

    home.parentNode.insertBefore(button, home.nextSibling);
  }

  function patch() {
    patchTeacherProfile();
    patchStudentMenu();
    window.CS21A117_CAMPUS_BRAND_MATERIAL = VERSION;
  }

  function queuePatch() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      patch();
    });
  }

  window.addEventListener('an:lazy-module-loaded', queuePatch);
  window.addEventListener('an:session-changed', queuePatch);
  window.addEventListener('popstate', queuePatch);

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
