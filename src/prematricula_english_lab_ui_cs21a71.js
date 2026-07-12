// F98.4-Z6-CS21A71 · Prematrícula estable + English LAB por código real
/* global React, Sidebar */
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A71';
  const FREE_MARKER = /gratis|free|prospect|prematric|lead|formulario/i;
  const LEVEL_LABELS = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };
  let scheduled = false;

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function readSession() {
    try {
      return (typeof window.getSesion === 'function'
        ? window.getSesion()
        : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {};
    } catch (_) {
      return {};
    }
  }

  function codeOf(user) {
    return clean(user?.codigo || user?.CODIGO || user?.CODIGO_ESTUDIANTE);
  }

  function roleOf(user) {
    return clean(user?.rol || user?.role).toLowerCase();
  }

  function isFreeStudent(user) {
    if (roleOf(user) !== 'student' && roleOf(user) !== 'estudiante') return false;
    if (codeOf(user)) return false;
    const explicit = user?.estudiante_gratis === true || user?.perfil_pre_matricula === true ||
      /^(TRUE|SI|SÍ|1)$/i.test(clean(user?.estudiante_gratis || user?.perfil_pre_matricula));
    const marker = [user?.tipoUsuario, user?.tipo_usuario, user?.origen, user?.ORIGEN, user?.etapa, user?.ETAPA]
      .some(value => FREE_MARKER.test(clean(value)));
    const group = clean(user?.grupo || user?.GRUPO || user?.grupo_actual || user?.GRUPO_ACTUAL);
    const academic = clean(user?.matricula || user?.MATRICULA || user?.estadoAcademico || user?.ESTADO_ACADEMICO || user?.nivel_activo || user?.NIVEL_ACTIVO);
    return explicit || marker || (!group && !academic);
  }

  function normalizeMatriculatedSession() {
    const current = readSession();
    if ((roleOf(current) !== 'student' && roleOf(current) !== 'estudiante') || !codeOf(current)) return current;

    const next = { ...current };
    let changed = false;
    ['tipoUsuario','tipo_usuario','origen','ORIGEN','etapa','ETAPA'].forEach(key => {
      if (FREE_MARKER.test(clean(next[key]))) {
        next[key] = key.toLowerCase().includes('origen') ? 'MATRICULADO' : 'ESTUDIANTE';
        changed = true;
      }
    });
    ['estudiante_gratis','perfil_pre_matricula'].forEach(key => {
      if (next[key] === true || /^(TRUE|SI|SÍ|1)$/i.test(clean(next[key]))) {
        next[key] = false;
        changed = true;
      }
    });

    if (changed) {
      try {
        if (typeof window.setSesion === 'function') window.setSesion(next);
        else sessionStorage.setItem('an_usuario', JSON.stringify(next));
      } catch (_) {}
    }
    return next;
  }

  function levelCode(user) {
    const direct = clean(user?.nivel_activo || user?.NIVEL_ACTIVO || user?.nivel || user?.NIVEL).toUpperCase();
    if (LEVEL_LABELS[direct]) return direct;
    const group = clean(user?.grupo || user?.GRUPO || user?.grupo_actual || user?.GRUPO_ACTUAL).toUpperCase();
    const match = group.match(/(?:^|[-_])(B1|B2|I1|I2)(?:[-_]|$)/);
    return match ? match[1] : 'B1';
  }

  function publishStudentKind(user) {
    document.documentElement.setAttribute('data-an-student-kind', isFreeStudent(user) ? 'prematricula' : codeOf(user) ? 'matriculado' : 'otro');
  }

  function injectEarlyStyles() {
    if (document.getElementById('an-prematricula-english-lab-style-cs21a71')) return;
    const style = document.createElement('style');
    style.id = 'an-prematricula-english-lab-style-cs21a71';
    style.textContent = `
      html[data-an-student-kind="prematricula"]:not([data-an-premat-sidebar-ready="true"]) aside.student-sb {
        visibility:hidden !important;
      }
      html[data-an-student-kind="prematricula"] .ap-view-student .ap-progress-map,
      html[data-an-student-kind="prematricula"] .ap-view-student .ap-bank-student-panel,
      html[data-an-student-kind="prematricula"] .ap-view-student .ap-bank-student-panel + .ap-catalog-head,
      html[data-an-student-kind="prematricula"] .ap-view-student .ap-bank-student-panel + .ap-catalog-head + .ap-area-grid {
        display:none !important;
      }
      html[data-an-student-kind="prematricula"] aside.student-sb #an-student-resources-section-cs21a65,
      html[data-an-student-kind="prematricula"] aside.student-sb [id^="an-additional-resources-nav-cs21a68-"] {
        display:none !important;
      }
      html[data-an-student-kind="prematricula"] aside.student-sb button[data-nav-id="mi_curso"] .sb-label {
        font-size:0 !important;
      }
      html[data-an-student-kind="prematricula"] aside.student-sb button[data-nav-id="mi_curso"] .sb-label:after {
        content:"Mi curso";
        font-size:13px;
      }
    `;
    document.head.appendChild(style);
  }

  function unwrapForFreeStudent(component) {
    let current = component;
    const seen = new Set();
    while (current && !seen.has(current)) {
      seen.add(current);
      const knownWrapper = current.__cs21a65UnifiedResources || current.__cs21a69ActiveState ||
        current.__cs21a59AdminResources || current.__cs21a60SuperResources ||
        (current.__cs21a71PrematriculaStable && current.__cs21a71PrematriculaStable !== current);
      if (!knownWrapper || typeof current.__base !== 'function') break;
      current = current.__base;
    }
    return current || component;
  }

  // 0 = no disponible, 1 = ya era la capa exterior, 2 = se instaló una capa nueva.
  function installSidebarBypass() {
    const Current = window.Sidebar || (typeof Sidebar === 'function' ? Sidebar : null);
    if (typeof Current !== 'function') return 0;
    if (Current.__cs21a71PrematriculaStable === Current) return 1;

    const user = readSession();
    if (isFreeStudent(user)) document.documentElement.removeAttribute('data-an-premat-sidebar-ready');
    const freeBase = unwrapForFreeStudent(Current);
    const Wrapped = function SidebarCS21A71(props) {
      const currentUser = props?.usuario || readSession();
      const role = clean(props?.rolReal || props?.role || currentUser?.rol || currentUser?.role).toLowerCase();
      if ((role === 'student' || role === 'estudiante') && isFreeStudent(currentUser)) {
        return React.createElement(freeBase, props);
      }
      return React.createElement(Current, props);
    };

    try { Object.keys(Current).forEach(key => { Wrapped[key] = Current[key]; }); } catch (_) {}
    Wrapped.__cs21a71PrematriculaStable = Wrapped;
    Wrapped.__base = Current;
    Wrapped.__freeBase = freeBase;
    window.Sidebar = Wrapped;
    try { Sidebar = Wrapped; } catch (_) {}
    return 2;
  }

  function findHeading(root, exact) {
    return Array.from(root.querySelectorAll('h1,h2,h3,h4')).find(node => clean(node.textContent).toLowerCase() === exact.toLowerCase()) || null;
  }

  function setVisible(node, visible) {
    if (!node) return;
    node.style.display = visible ? '' : 'none';
    node.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function cleanFreeSidebar(user) {
    const aside = document.querySelector('aside.student-sb, aside[data-role="student"]');
    if (!aside || !isFreeStudent(user)) return;

    aside.querySelectorAll('#an-student-resources-section-cs21a65, [id^="an-additional-resources-nav-cs21a68-"]').forEach(node => node.remove());
    Array.from(aside.querySelectorAll('button')).forEach(button => {
      const labelNode = button.querySelector('.sb-label');
      const label = clean(labelNode?.textContent || button.textContent);
      const navId = clean(button.getAttribute('data-nav-id'));
      if (navId === 'mi_curso' && labelNode && label === 'Libros y Audios') labelNode.textContent = 'Mi curso';
      if (label === 'Recursos adicionales') button.remove();
    });
    Array.from(aside.querySelectorAll('.student-sb-section')).forEach(section => {
      if (clean(section.textContent) === 'Recursos Didácticos') section.remove();
    });
    document.documentElement.setAttribute('data-an-premat-sidebar-ready', 'true');
  }

  function arrangeEnglishLab(user) {
    const root = document.querySelector('.ap-view.ap-view-student');
    if (!root) return;

    const free = isFreeStudent(user);
    const progressMap = root.querySelector('.ap-progress-map');
    const bankPanel = root.querySelector('.ap-bank-student-panel');
    const areaHeading = findHeading(root, 'Áreas cognitivas demo') || findHeading(root, 'Áreas cognitivas');
    const areaHead = areaHeading?.closest('.ap-catalog-head') || null;
    const areaGrid = areaHead?.nextElementSibling?.classList?.contains('ap-area-grid') ? areaHead.nextElementSibling : root.querySelector('.ap-area-grid');
    const catalogHeading = findHeading(root, 'Catálogo demo') || Array.from(root.querySelectorAll('.ap-catalog-head h3')).find(node => /^Catálogo\s+/i.test(clean(node.textContent)));
    const catalogHead = catalogHeading?.closest('.ap-catalog-head') || null;
    const catalogGrid = catalogHead?.nextElementSibling?.classList?.contains('ap-card-grid') ? catalogHead.nextElementSibling : null;

    setVisible(progressMap, !free);
    setVisible(bankPanel, !free);
    setVisible(areaHead, !free);
    setVisible(areaGrid, !free);

    if (free) {
      if (catalogHeading) catalogHeading.textContent = 'Catálogo demo';
      root.setAttribute('data-access-mode', 'prematricula');
      return;
    }

    const level = levelCode(user);
    const levelLabel = LEVEL_LABELS[level] || 'Básico I';
    if (catalogHeading) catalogHeading.textContent = `Catálogo ${levelLabel}`;
    if (areaHeading) areaHeading.textContent = `Áreas cognitivas · ${levelLabel}`;

    if (catalogHead && catalogGrid && progressMap && catalogHead.parentElement === progressMap.parentElement) {
      const parent = progressMap.parentElement;
      if (catalogHead.nextElementSibling !== catalogGrid || catalogGrid.nextElementSibling !== progressMap) {
        parent.insertBefore(catalogHead, progressMap);
        parent.insertBefore(catalogGrid, progressMap);
      }
    }
    root.setAttribute('data-access-mode', 'estudiante');
    root.setAttribute('data-academic-level', level);
  }

  function scan() {
    scheduled = false;
    const user = normalizeMatriculatedSession();
    publishStudentKind(user);
    const installState = installSidebarBypass();
    cleanFreeSidebar(user);
    arrangeEnglishLab(user);

    if (installState === 2 && isFreeStudent(user)) {
      setTimeout(() => {
        try { window.dispatchEvent(new Event('an:session-changed')); } catch (_) {}
      }, 0);
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(scan);
  }

  const initialUser = normalizeMatriculatedSession();
  publishStudentKind(initialUser);
  injectEarlyStyles();
  installSidebarBypass();
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList:true, subtree:true, characterData:true });
  ['an:lazy-module-loaded','an:session-changed','an:english-lab-free-access','an:free-user-solicitudes-changed','popstate','hashchange']
    .forEach(name => window.addEventListener(name, schedule));

  const sidebarProbe = setInterval(schedule, 60);
  setTimeout(() => clearInterval(sidebarProbe), 8000);
  schedule();

  window.__AN_PREMATRICULA_ENGLISH_LAB_UI_VERSION__ = VERSION;
})();