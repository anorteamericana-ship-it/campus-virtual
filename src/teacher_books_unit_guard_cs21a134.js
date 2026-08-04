// F98.4-Z6-CS21A162 · Mapas U01–U16, reparación de respuestas y acabado visual.
// La navegación docente pertenece a TeacherHubCS21A. Este módulo no redefine
// MaterialesView ni decide qué subpantalla debe renderizarse.
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A162';
  const ENDPOINT = 'teacherBooksOpenImageBook';
  const STYLE_ID = 'an-teacher-book-navigation-cs21a135';
  const AUTHORITY_MODE = 'TEACHER_PORTAL_OWNS_VIEWER';

  if (window.__AN_TEACHER_BOOK_NAVIGATION_CS21A135) {
    try { window.__AN_TEACHER_BOOK_NAVIGATION_CS21A135.reinstall(); } catch (_) {}
    return;
  }

  const UNIT_STARTS = Object.freeze({
    'B1|SB': Object.freeze([8,14,22,28,36,42,50,56,64,70,78,84,92,98,106,112]),
    'B1|TB': Object.freeze([25,33,43,51,61,69,79,87,97,105,115,123,133,141,151,159]),
    'B1|WB': Object.freeze([5,11,17,23,29,35,41,47,53,59,65,71,77,83,89,95]),
    'B2|SB': Object.freeze([22,28,36,42,50,56,64,70,78,84,92,98,106,112,120,126]),
    'B2|TB': Object.freeze([27,35,45,53,63,71,81,89,99,107,117,125,135,143,153,161]),
    'B2|WB': Object.freeze([6,12,18,24,30,36,42,48,54,60,66,72,78,84,90,96]),
    'I1|SB': Object.freeze([8,14,22,28,36,42,50,56,64,70,78,84,92,98,106,112]),
    'I1|TB': Object.freeze([27,35,45,53,63,71,81,89,99,107,117,125,135,143,153,161]),
    'I1|WB': Object.freeze([6,12,18,24,30,36,42,48,54,60,66,72,78,84,90,96]),
    'I2|SB': Object.freeze([10,16,24,30,38,44,52,58,66,72,80,86,94,100,108,114]),
    'I2|TB': Object.freeze([27,35,45,53,63,71,81,89,99,107,117,125,135,143,153,161]),
    'I2|WB': Object.freeze([5,11,17,23,29,35,41,47,53,59,65,71,77,83,89,95]),
  });

  const KNOWN_BAD = Object.freeze({
    'B1|SB': Object.freeze([
      Object.freeze([9,15,23,29,37,43,51,57,65,71,79,85,93,99,107,113]),
      Object.freeze([6,12,20,26,34,40,48,54,62,68,76,82,90,96,104,110]),
    ]),
  });

  let observer = null;
  let enhancementQueued = false;

  function text(value) { return String(value == null ? '' : value).trim(); }
  function compact(value) { return text(value).replace(/\s+/g, ' '); }
  function upper(value) { return compact(value).toUpperCase(); }
  function validPage(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  }
  function normalized(values) {
    return Array.from({ length: 16 }, (_, index) => validPage(values && values[index]));
  }
  function complete(values) {
    return Array.isArray(values) && values.length >= 16 && normalized(values).every(value => value != null);
  }
  function same(values, expected) {
    const left = normalized(values);
    const right = normalized(expected);
    return left.every((value, index) => value === right[index]);
  }
  function currentRole() {
    try {
      const session = (typeof window.getSesion === 'function'
        ? window.getSesion()
        : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {};
      return upper(session.rol || session.role);
    } catch (_) {
      return '';
    }
  }
  function resourceRole() {
    return ['TEACHER', 'DOCENTE', 'ADMIN', 'SUPERADMIN'].includes(currentRole());
  }
  function keyOf(data) {
    return `${upper(data && (data.level || data.nivel))}|${upper(data && (data.book_type || data.type || data.tipo))}`;
  }
  function isKnownBad(key, values) {
    return (KNOWN_BAD[key] || []).some(sequence => same(values, sequence));
  }

  function repairPayload(data) {
    if (!data || data.ok !== true || !resourceRole()) return data;
    const key = keyOf(data);
    const fallback = UNIT_STARTS[key];
    if (!fallback) return data;

    const raw = Array.isArray(data.unit_starts) ? data.unit_starts : [];
    const replaceKnownBad = isKnownBad(key, raw);
    const fillMissing = !complete(raw);
    if (!replaceKnownBad && !fillMissing) return data;

    const next = replaceKnownBad
      ? [...fallback]
      : fallback.map((value, index) => validPage(raw[index]) || value);

    return {
      ...data,
      unit_starts: next,
      unit_starts_configured: 16,
      unit_starts_source: text(data.unit_starts_source)
        ? `${data.unit_starts_source}|CS21A162_NAVIGATION_REPAIR`
        : 'CS21A162_NAVIGATION_REPAIR',
      unit_starts_repaired_frontend: true,
      unit_starts_repair_version: VERSION,
    };
  }

  function isTarget(input) {
    const raw = typeof input === 'string' ? input : text(input && input.url);
    try {
      const parsed = new URL(raw, window.location.href);
      return upper(parsed.searchParams.get('fn')) === upper(ENDPOINT);
    } catch (_) {
      return raw.toLowerCase().includes(`fn=${ENDPOINT.toLowerCase()}`);
    }
  }

  function installFetchGuard() {
    if (typeof window.fetch !== 'function' || window.fetch.__cs21a162BookRepair) return;
    const baseFetch = window.fetch.bind(window);
    const guardedFetch = function guardedBookFetch(input, init) {
      return baseFetch(input, init).then(response => {
        if (!isTarget(input) || !response || !response.ok || typeof response.clone !== 'function') return response;
        return response.clone().json().then(data => {
          const repaired = repairPayload(data);
          if (repaired === data || typeof Response !== 'function' || typeof Headers !== 'function') return response;
          const headers = new Headers(response.headers || undefined);
          headers.delete('content-length');
          headers.delete('content-encoding');
          if (!headers.has('content-type')) headers.set('content-type', 'application/json;charset=utf-8');
          return new Response(JSON.stringify(repaired), {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        }).catch(() => response);
      });
    };
    guardedFetch.__cs21a162BookRepair = true;
    guardedFetch.__base = baseFetch;
    window.fetch = guardedFetch;
  }

  function installStyles() {
    if (!document || document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .an-book-unit-strip-cs21a135{--book-accent:#0B4A8B;padding:14px 16px 16px!important;border-bottom:1px solid rgba(0,47,108,.16)!important;background:linear-gradient(180deg,#fff 0%,#f3f7fb 100%)!important;box-shadow:0 9px 24px rgba(0,31,71,.06)}
      .an-book-unit-strip-cs21a135[data-book-type="TB"]{--book-accent:#7A1E2C}.an-book-unit-strip-cs21a135[data-book-type="WB"]{--book-accent:#237A3B}
      .an-book-unit-header-cs21a135{display:flex!important;justify-content:space-between!important;gap:12px!important;flex-wrap:wrap;margin-bottom:11px!important}
      .an-book-unit-grid-cs21a135{display:grid!important;grid-template-columns:repeat(16,minmax(66px,1fr))!important;gap:8px!important;overflow-x:auto!important;padding:3px 2px 9px!important}
      .an-book-unit-button-cs21a135{position:relative!important;min-width:66px!important;height:52px!important;padding:20px 5px 5px!important;border:1px solid color-mix(in srgb,var(--book-accent) 35%,#d3dbe5)!important;border-radius:13px!important;background:#fff!important;color:var(--book-accent)!important;font-size:12px!important;font-weight:950!important;box-shadow:inset 0 3px 0 var(--book-accent),0 5px 12px rgba(0,31,71,.08)!important}
      .an-book-unit-button-cs21a135::before{content:'UNIDAD';position:absolute;top:6px;left:7px;font-size:6.5px;letter-spacing:.13em}.an-book-unit-button-cs21a135::after{content:'p. ' attr(data-page);position:absolute;top:5px;right:6px;font-size:6.5px}
      .an-book-unit-button-cs21a135[data-active="true"]{border:2px solid #F2C94C!important;background:var(--book-accent)!important;color:#fff!important;transform:translateY(-2px)}
      .an-book-unit-button-cs21a135[data-mapped="false"]{opacity:.55!important;cursor:not-allowed!important}.an-book-unit-update-cs21a135{font-size:7.5px!important;font-weight:900!important}
      @media(max-width:760px){.an-book-unit-strip-cs21a135{padding:12px 11px 14px!important}.an-book-unit-grid-cs21a135{grid-template-columns:repeat(16,minmax(62px,62px))!important}.an-book-unit-button-cs21a135{min-width:62px!important}}
    `;
    document.head.appendChild(style);
  }

  function activeBookType(section) {
    const pressed = Array.from(section.querySelectorAll('button[aria-pressed="true"]'))
      .find(button => /^(SB|TB|WB)$/.test(compact(button.textContent)));
    return pressed ? compact(pressed.textContent) : 'SB';
  }
  function unitPage(button) {
    const match = text(button.getAttribute('title')).match(/(?:hoja|página(?:\s+fuente)?)\s+(\d+)/i);
    return match ? match[1] : '—';
  }
  function isActiveUnit(button) {
    if (button.getAttribute('aria-current') === 'page' || button.getAttribute('data-active') === 'true') return true;
    const inline = upper(button.style && button.style.color);
    return inline === '#FFF' || inline === '#FFFFFF' || inline.includes('255, 255, 255');
  }
  function decorateButtons(grid) {
    if (!grid) return;
    Array.from(grid.querySelectorAll('button')).forEach(button => {
      const label = compact(button.textContent);
      if (/^U\d{2}$/.test(label)) {
        const page = unitPage(button);
        const active = isActiveUnit(button);
        button.classList.add('an-book-unit-button-cs21a135');
        button.setAttribute('data-page', page);
        button.setAttribute('data-mapped', page === '—' ? 'false' : 'true');
        button.setAttribute('data-active', active ? 'true' : 'false');
        if (active) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      } else if (/Actualizar|Guardando/i.test(label)) {
        button.classList.add('an-book-unit-update-cs21a135');
      }
    });
  }

  function enhanceSection(section) {
    if (!section || /ESTUDIANTE/i.test(text(section.getAttribute('data-screen-label')))) return false;
    const heading = Array.from(section.querySelectorAll('strong'))
      .find(node => /inicio oficial por unidad|navegación por unidad/i.test(compact(node.textContent)));
    if (!heading || !heading.parentElement || !heading.parentElement.parentElement) return false;
    const header = heading.parentElement;
    const strip = header.parentElement;
    const grid = strip.children && strip.children[1];
    if (!grid) return false;
    section.setAttribute('data-book-viewer', 'institutional');
    strip.classList.add('an-book-unit-strip-cs21a135');
    strip.setAttribute('data-book-type', activeBookType(section));
    header.classList.add('an-book-unit-header-cs21a135');
    grid.classList.add('an-book-unit-grid-cs21a135');
    heading.textContent = 'Navegación por unidad';
    decorateButtons(grid);
    return true;
  }

  function ensureLegacyStrip() {
    // Las rutas CS21A58 están retiradas. Se conserva la firma para los módulos
    // que consultan la API del guard, sin volver a fabricar interfaz histórica.
    return false;
  }

  function enhanceAll() {
    if (!document || typeof document.querySelectorAll !== 'function') return;
    Array.from(document.querySelectorAll(
      'section[data-screen-label*="Libros"],section[data-screen-label*="libros"],section[data-screen-label*="biblioteca"]'
    )).forEach(enhanceSection);
  }
  function queueEnhancement() {
    if (enhancementQueued) return;
    enhancementQueued = true;
    const run = () => {
      enhancementQueued = false;
      enhanceAll();
    };
    if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(run);
    else window.setTimeout(run, 16);
  }
  function installAuthority() {
    return typeof window.__AN_BOOK_RESOURCES_COMPONENT__ === 'function';
  }
  function reinstall() {
    installFetchGuard();
    installStyles();
    queueEnhancement();
  }

  reinstall();
  ['an:lazy-module-loaded', 'an:teacher-material-tab', 'an:admin-resource-tab'].forEach(eventName => {
    window.addEventListener(eventName, () => window.setTimeout(queueEnhancement, 40));
  });

  if (typeof MutationObserver === 'function' && document && document.documentElement) {
    observer = new MutationObserver(queueEnhancement);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-pressed', 'disabled'],
    });
  }
  window.addEventListener('pagehide', () => observer && observer.disconnect(), { once: true });

  window.__AN_TEACHER_BOOK_NAVIGATION_CS21A135 = Object.freeze({
    version: VERSION,
    endpoint: ENDPOINT,
    maps: UNIT_STARTS,
    knownBad: KNOWN_BAD,
    repairPayload,
    complete,
    installAuthority,
    authorityMode: AUTHORITY_MODE,
    enhanceAll,
    enhanceSection,
    ensureLegacyStrip,
    reinstall,
    styleId: STYLE_ID,
  });
})();
