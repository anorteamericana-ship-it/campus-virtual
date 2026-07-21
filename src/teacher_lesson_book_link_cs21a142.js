// F98.4-Z6-CS21A142 · Acceso contextual al libro desde el detalle de clase docente.
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A142';
  const REQUEST_KEY = 'an_teacher_book_open_request';
  const MATERIAL_TAB_KEY = 'an_teacher_materiales_tab';
  const LEVEL_NAMES = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };
  let stableTarget = { signature:'', since:0 };

  const text = node => String(node?.textContent || '').replace(/\s+/g, ' ').trim();
  const normalize = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

  function session() {
    try {
      return (typeof getSesion === 'function'
        ? getSesion()
        : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {};
    } catch (_) {
      return {};
    }
  }

  function groupCode(value) {
    if (typeof value === 'string') return value.trim();
    return String(value?.code || value?.cod_grupo || value?.codigo_grupo || value?.grupo || value?.codigo || '').trim();
  }

  function levelFromText(value) {
    const normalized = normalize(value);
    const codeMatch = normalized.match(/(?:^|[^A-Z0-9])(B1|B2|I1|I2)(?:[^A-Z0-9]|$)/);
    if (codeMatch) return codeMatch[1];
    if (/(?:^|\s)INTERMEDIO II(?:\s|$)/.test(normalized)) return 'I2';
    if (/(?:^|\s)INTERMEDIO I(?:\s|$)/.test(normalized)) return 'I1';
    if (/(?:^|\s)BASICO II(?:\s|$)/.test(normalized)) return 'B2';
    if (/(?:^|\s)BASICO I(?:\s|$)/.test(normalized)) return 'B1';
    return '';
  }

  function resolveLevel(drawer) {
    let value = levelFromText(drawer?.dataset?.teacherLevel);
    if (value) return value;
    value = levelFromText(text(drawer));
    if (value) return value;
    try {
      value = levelFromText(groupCode(typeof getGrupoActivoDocente === 'function' ? getGrupoActivoDocente() : null));
      if (value) return value;
    } catch (_) {}
    const user = session();
    const groups = [user.grupoActivo, user.grupo, ...(Array.isArray(user.grupos) ? user.grupos : [])];
    for (const group of groups) {
      value = levelFromText(groupCode(group));
      if (value) return value;
    }
    return '';
  }

  function context(drawer) {
    const normalizedText = normalize(text(drawer));
    const lessonMatch = normalizedText.match(/(?:^|\s)LECCION\s*(\d{1,2})(?:\s|$)/);
    const lesson = Number(drawer?.dataset?.teacherLesson || lessonMatch?.[1] || 0);
    const rail = normalize(drawer?.dataset?.teacherRail);
    return {
      level: resolveLevel(drawer),
      lesson,
      unit: lesson ? Math.min(16, Math.max(1, Math.ceil(lesson / 2))) : 0,
      book_type: 'SB',
      ican: rail === 'ICAN' || /(?:^|\s)CLUB I CAN(?:\s|$)|(?:^|\s)I CAN(?:\s|$)/.test(normalizedText),
    };
  }

  function requestBook(bookContext) {
    try {
      sessionStorage.setItem(MATERIAL_TAB_KEY, 'libros');
      sessionStorage.setItem(REQUEST_KEY, JSON.stringify({ ...bookContext, at:Date.now() }));
    } catch (_) {}
    try {
      dispatchEvent(new CustomEvent('an:teacher-material-tab', { detail:{ tab:'libros' } }));
    } catch (_) {}
    const button = [...document.querySelectorAll('aside button')].find(candidate => {
      const label = normalize(text(candidate.querySelector('.sb-label') || candidate));
      return label === 'LIBROS Y AUDIOS' || label === 'LIBROS DE TEXTO';
    });
    if (button) button.click();
  }

  function attach(drawer) {
    const labels = [
      'VER MATERIAL PDF',
      'VER PLANEAMIENTO DE LECCION',
      'VERIFICANDO MATERIAL...',
      'VERIFICANDO PLANEAMIENTO...',
      'MATERIAL NO DISPONIBLE',
      'PLANEAMIENTO NO DISPONIBLE',
    ];
    const planningButton = [...drawer.querySelectorAll('button')].find(button => labels.includes(normalize(text(button))));
    if (!planningButton) return;

    const planningLabel = normalize(text(planningButton));
    if (planningLabel === 'VER MATERIAL PDF') planningButton.textContent = 'Ver Planeamiento de Lección';
    else if (planningLabel === 'VERIFICANDO MATERIAL...') planningButton.textContent = 'Verificando planeamiento…';
    else if (planningLabel === 'MATERIAL NO DISPONIBLE') planningButton.textContent = 'Planeamiento no disponible';
    planningButton.style.minWidth = '190px';

    let bookButton = planningButton.parentElement?.querySelector(':scope > [data-book-cs21a142]');
    if (!bookButton) {
      bookButton = document.createElement('button');
      bookButton.type = 'button';
      bookButton.className = 'btn btn-ghost';
      bookButton.dataset.bookCs21a142 = '1';
      bookButton.textContent = 'Ver en Libro';
      bookButton.style.minWidth = '150px';
      bookButton.onclick = () => {
        const currentContext = context(bookButton.closest('aside') || drawer);
        if (currentContext.level && currentContext.lesson && !currentContext.ican) requestBook(currentContext);
      };
      planningButton.insertAdjacentElement('afterend', bookButton);
    }

    const currentContext = context(drawer);
    const disabled = currentContext.ican || !currentContext.level || !currentContext.lesson;
    bookButton.disabled = disabled;
    bookButton.style.opacity = disabled ? '.55' : '1';
    bookButton.title = currentContext.ican
      ? 'Club I CAN no tiene unidad equivalente en el libro.'
      : disabled
        ? 'No se pudo identificar nivel o lección.'
        : `Abrir ${currentContext.level} · SB · U${String(currentContext.unit).padStart(2, '0')}`;
  }

  function applyPendingRequest() {
    let request;
    try {
      request = JSON.parse(sessionStorage.getItem(REQUEST_KEY) || 'null');
    } catch (_) {
      return;
    }
    if (!request || !LEVEL_NAMES[request.level] || Date.now() - Number(request.at || 0) > 300000) {
      try { sessionStorage.removeItem(REQUEST_KEY); } catch (_) {}
      return;
    }

    const viewer = document.querySelector('section[data-screen-label*="Libros"]');
    if (!viewer) return;
    const buttons = [...viewer.querySelectorAll('button')];
    const levelButton = buttons.find(button => normalize(text(button)).startsWith(`${request.level} ·`));
    if (levelButton && !levelButton.classList.contains('btn-primary')) {
      stableTarget = { signature:'', since:0 };
      levelButton.click();
      return;
    }
    if (!normalize(text(viewer)).includes(normalize(LEVEL_NAMES[request.level]))) return;

    const sbButton = buttons.find(button => normalize(text(button)) === 'SB');
    if (sbButton && sbButton.getAttribute('aria-pressed') !== 'true') {
      stableTarget = { signature:'', since:0 };
      sbButton.click();
      return;
    }

    const unitButton = buttons.find(button => normalize(text(button)) === `U${String(request.unit).padStart(2, '0')}`);
    if (!unitButton || unitButton.disabled) return;
    const signature = `${request.level}:SB:${request.unit}`;
    const unitIsActive = unitButton.dataset.active === 'true' || unitButton.getAttribute('aria-current') === 'page';
    if (!unitIsActive) {
      stableTarget = { signature:'', since:0 };
      unitButton.click();
      return;
    }
    if (stableTarget.signature !== signature) {
      stableTarget = { signature, since:Date.now() };
      setTimeout(scan, 800);
      return;
    }
    if (Date.now() - stableTarget.since < 700) {
      setTimeout(scan, 800);
      return;
    }
    try {
      sessionStorage.removeItem(REQUEST_KEY);
      unitButton.scrollIntoView({ behavior:'smooth', block:'center', inline:'center' });
    } catch (_) {}
    stableTarget = { signature:'', since:0 };
  }

  let queued = false;
  function scan() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      [...document.querySelectorAll('aside')]
        .filter(drawer => normalize(text(drawer)).includes('DETALLE DE CLASE'))
        .forEach(attach);
      applyPendingRequest();
    });
  }

  new MutationObserver(scan).observe(document.documentElement, { childList:true, subtree:true, characterData:true });
  ['an:teacher-material-tab', 'an:lazy-module-loaded', 'an:session-changed'].forEach(eventName => addEventListener(eventName, scan));
  scan();

  window.__AN_TEACHER_LESSON_BOOK_LINK_TEST__ = { context, levelFromText };
  window.__AN_TEACHER_LESSON_BOOK_LINK_VERSION__ = VERSION;
})();
