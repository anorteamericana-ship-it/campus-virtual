// F98.4-Z6-CS21A120 · A institucional y material obligatorio del docente.
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A120';
  let queued = false;

  const MATERIALS = [
    {
      code:'1.1', title:'Reglamento estudiantil',
      desc:'Derechos, deberes y conducta académica.',
      meta:'REQUERIDO · ~20 min',
      url:'https://drive.google.com/file/d/1K_yZjUpiPF6MtXgapeFq7J314qqPQ-Ei/view'
    },
    {
      code:'1.2', title:'Reglamento de netiqueta',
      desc:'Normas de comportamiento en sesiones virtuales.',
      meta:'REQUERIDO · ~10 min',
      url:'https://drive.google.com/file/d/1X4NP2QJ-xMGBxLukRo-nSuKXf9zCcBll/view'
    },
    {
      code:'1.3', title:'Video de bienvenida al Programa',
      desc:'Introducción al Campus Virtual y al programa.',
      meta:'REQUERIDO · ~6 min',
      url:'https://drive.google.com/drive/folders/1UdRasbHeqzos7dzt-5VxjIE-Z6gjsrp8'
    },
    {
      code:'1.4', title:'Guía — Uso de Zoom y Google Meet',
      desc:'Herramienta principal y de contingencia.',
      meta:'RECOMENDADO · ~8 min',
      url:'https://drive.google.com/file/d/1zMbXdVpyBhci3skWFUthwmOfjdrv8Fed/view'
    },
    {
      code:'1.5', title:'Guía — Contingencias técnicas',
      desc:'Qué hacer ante fallas de audio, video o conexión.',
      meta:'RECOMENDADO · ~5 min',
      url:'https://drive.google.com/drive/folders/1QK3-mstC3ITvstKOCA1ccHzsR-CdKaZb'
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

  function patch() {
    patchTeacherProfile();
    window.CS21A120_CAMPUS_BRAND_MATERIAL = VERSION;
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
  new MutationObserver(queuePatch).observe(document.documentElement, { childList:true, subtree:true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', queuePatch, { once:true });
  } else {
    queuePatch();
  }
})();
