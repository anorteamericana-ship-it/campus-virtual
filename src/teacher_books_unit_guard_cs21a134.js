// F98.4-Z6-CS21A135 · Autoridad del visor docente + saltos U01–U16 + acabado visual.
// Mantiene el visor institucional por encima del legado CS21A58, completa los
// mapas de los 12 libros y realza la navegación sin modificar Apps Script.
(function(){
  'use strict';

  var VERSION = 'F98.4-Z6-CS21A135';
  var ENDPOINT = 'teacherBooksOpenImageBook';
  var TAB_KEY = 'an_teacher_materiales_tab';
  var STYLE_ID = 'an-teacher-book-navigation-cs21a135';

  if (window.__AN_TEACHER_BOOK_NAVIGATION_CS21A135) {
    try { window.__AN_TEACHER_BOOK_NAVIGATION_CS21A135.reinstall(); } catch (_) {}
    return;
  }

  var UNIT_STARTS = {
    'B1|SB': [8,14,22,28,36,42,50,56,64,70,78,84,92,98,106,112],
    'B1|TB': [25,33,43,51,61,69,79,87,97,105,115,123,133,141,151,159],
    'B1|WB': [5,11,17,23,29,35,41,47,53,59,65,71,77,83,89,95],
    'B2|SB': [22,28,36,42,50,56,64,70,78,84,92,98,106,112,120,126],
    'B2|TB': [27,35,45,53,63,71,81,89,99,107,117,125,135,143,153,161],
    'B2|WB': [6,12,18,24,30,36,42,48,54,60,66,72,78,84,90,96],
    'I1|SB': [8,14,22,28,36,42,50,56,64,70,78,84,92,98,106,112],
    'I1|TB': [27,35,45,53,63,71,81,89,99,107,117,125,135,143,153,161],
    'I1|WB': [6,12,18,24,30,36,42,48,54,60,66,72,78,84,90,96],
    'I2|SB': [10,16,24,30,38,44,52,58,66,72,80,86,94,100,108,114],
    'I2|TB': [27,35,45,53,63,71,81,89,99,107,117,125,135,143,153,161],
    'I2|WB': [5,11,17,23,29,35,41,47,53,59,65,71,77,83,89,95]
  };

  var KNOWN_BAD = {
    'B1|SB': [
      [9,15,23,29,37,43,51,57,65,71,79,85,93,99,107,113],
      [6,12,20,26,34,40,48,54,62,68,76,82,90,96,104,110]
    ]
  };

  var ORIGINAL_FETCH = window.fetch.bind(window);
  var observer = null;
  var authorityTimer = null;
  var enhancementQueued = false;

  function text(value){ return String(value == null ? '' : value).trim(); }
  function upper(value){ return text(value).toUpperCase(); }
  function compact(value){ return text(value).replace(/\s+/g, ' '); }
  function validPage(value){
    var number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  }
  function normalized(values){
    return Array.from({ length:16 }, function(_, index){ return validPage(values && values[index]); });
  }
  function complete(values){
    return Array.isArray(values) && values.length >= 16 && normalized(values).every(function(value){ return value != null; });
  }
  function same(values, expected){
    var left = normalized(values);
    var right = normalized(expected);
    return left.every(function(value, index){ return value === right[index]; });
  }
  function currentSession(){
    try {
      return (typeof window.getSesion === 'function'
        ? window.getSesion()
        : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {};
    } catch (_) { return {}; }
  }
  function currentRole(){
    var session = currentSession();
    return upper(session && (session.rol || session.role));
  }
  function teacherRole(){
    var role = currentRole();
    return role === 'TEACHER' || role === 'DOCENTE';
  }
  function resourceRole(){
    var role = currentRole();
    return role === 'TEACHER' || role === 'DOCENTE' || role === 'ADMIN' || role === 'SUPERADMIN';
  }
  function keyOf(data){
    return upper(data && (data.level || data.nivel)) + '|' + upper(data && (data.book_type || data.type || data.tipo));
  }
  function isKnownBad(key, values){
    return (KNOWN_BAD[key] || []).some(function(sequence){ return same(values, sequence); });
  }

  function repairPayload(data){
    if (!data || data.ok !== true || !resourceRole()) return data;
    var key = keyOf(data);
    var fallback = UNIT_STARTS[key];
    if (!fallback) return data;

    var raw = Array.isArray(data.unit_starts) ? data.unit_starts : [];
    var replaceKnownBad = isKnownBad(key, raw);
    var fillMissing = !complete(raw);
    if (!replaceKnownBad && !fillMissing) return data;

    var next = replaceKnownBad
      ? fallback.slice()
      : fallback.map(function(value, index){ return validPage(raw[index]) || value; });

    return Object.assign({}, data, {
      unit_starts: next,
      unit_starts_configured: 16,
      unit_starts_source: text(data.unit_starts_source)
        ? data.unit_starts_source + '|CS21A135_NAVIGATION_REPAIR'
        : 'CS21A135_NAVIGATION_REPAIR',
      unit_starts_repaired_frontend: true,
      unit_starts_repair_version: VERSION
    });
  }

  function isTarget(input){
    var url = typeof input === 'string' ? input : text(input && input.url);
    try {
      var parsed = new URL(url, window.location.href);
      return upper(parsed.searchParams.get('fn')) === upper(ENDPOINT);
    } catch (_) {
      return url.toLowerCase().indexOf('fn=' + ENDPOINT.toLowerCase()) >= 0;
    }
  }

  function rebuiltResponse(response, data){
    if (typeof Response !== 'function' || typeof Headers !== 'function') return response;
    var headers = new Headers(response.headers || undefined);
    headers.delete('content-length');
    headers.delete('content-encoding');
    if (!headers.has('content-type')) headers.set('content-type', 'application/json;charset=utf-8');
    return new Response(JSON.stringify(data), {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });
  }

  function guardedFetch(input, init){
    return ORIGINAL_FETCH(input, init).then(function(response){
      if (!isTarget(input) || !response || !response.ok || typeof response.clone !== 'function') return response;
      return response.clone().json().then(function(data){
        var repaired = repairPayload(data);
        return repaired === data ? response : rebuiltResponse(response, repaired);
      }).catch(function(){ return response; });
    });
  }
  guardedFetch.__cs21a135 = true;
  guardedFetch.__base = ORIGINAL_FETCH;
  window.fetch = guardedFetch;

  function activeScreen(){
    try { return sessionStorage.getItem(TAB_KEY) || 'info'; }
    catch (_) { return 'info'; }
  }

  function installAuthority(){
    var Current = window.MaterialesView;
    if (typeof Current !== 'function' || !window.React || typeof window.React.createElement !== 'function') return false;
    if (Current.__cs21a135BookAuthority) return true;

    var Base = Current;
    var Wrapped = function MaterialesViewCS21A135(props){
      var screen = activeScreen();
      var Viewer = window.__AN_BOOK_RESOURCES_COMPONENT__;
      if (teacherRole() && (screen === 'libros' || screen === 'biblioteca') && typeof Viewer === 'function') {
        return window.React.createElement(Viewer, Object.assign({}, props || {}, {
          initialType: screen === 'biblioteca' ? 'TB' : 'SB',
          navigationVersion: VERSION
        }));
      }
      return window.React.createElement(Base, props || {});
    };

    Wrapped.__cs21a135BookAuthority = true;
    Wrapped.__cs21a75UnitStarts = true;
    Wrapped.__cs21a60UnitStarts = true;
    Wrapped.__cs21a58books = true;
    Wrapped.__base = Base;
    window.MaterialesView = Wrapped;
    window.__AN_CS21A59_TEACHER_MATERIALS_BASE__ = Wrapped;
    try { MaterialesView = Wrapped; } catch (_) {}
    return true;
  }

  function installStyles(){
    if (!document || document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .an-book-unit-strip-cs21a135 {
        --book-unit-accent:#0B4A8B;
        --book-unit-accent-dark:#002F6C;
        --book-unit-soft:#EDF5FD;
        position:relative;
        padding:14px 16px 16px !important;
        border-top:0 !important;
        border-bottom:1px solid rgba(0,47,108,.16) !important;
        background:
          radial-gradient(circle at 8% 0%,rgba(242,201,76,.22),transparent 32%),
          linear-gradient(180deg,#FFFFFF 0%,#F3F7FB 100%) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 9px 24px rgba(0,31,71,.06);
      }
      .an-book-unit-strip-cs21a135[data-book-type="TB"] {
        --book-unit-accent:#7A1E2C;
        --book-unit-accent-dark:#59131F;
        --book-unit-soft:#F9EDEF;
      }
      .an-book-unit-strip-cs21a135[data-book-type="WB"] {
        --book-unit-accent:#237A3B;
        --book-unit-accent-dark:#145A2A;
        --book-unit-soft:#EAF6ED;
      }
      .an-book-unit-header-cs21a135 {
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        gap:12px !important;
        margin-bottom:11px !important;
      }
      .an-book-unit-heading-wrap-cs21a135 {
        display:flex;
        align-items:center;
        gap:10px;
        min-width:0;
      }
      .an-book-unit-emblem-cs21a135 {
        width:34px;
        height:34px;
        flex:0 0 34px;
        display:grid;
        place-items:center;
        border-radius:11px;
        background:linear-gradient(145deg,var(--book-unit-accent),var(--book-unit-accent-dark));
        color:#fff;
        box-shadow:0 7px 16px color-mix(in srgb,var(--book-unit-accent) 28%,transparent),inset 0 1px 0 rgba(255,255,255,.24);
        font-size:11px;
        font-weight:950;
        letter-spacing:-.04em;
      }
      .an-book-unit-copy-cs21a135 { min-width:0; }
      .an-book-unit-kicker-cs21a135 {
        display:block;
        color:var(--book-unit-accent);
        font-size:8.5px;
        font-weight:950;
        letter-spacing:.16em;
        text-transform:uppercase;
        line-height:1.1;
      }
      .an-book-unit-strip-cs21a135 strong {
        display:block;
        margin-top:2px;
        color:#001E47 !important;
        font-size:14px !important;
        font-weight:950 !important;
        letter-spacing:-.015em;
      }
      .an-book-unit-status-cs21a135 {
        max-width:520px;
        padding:6px 10px;
        border:1px solid color-mix(in srgb,var(--book-unit-accent) 18%,#D9E0E8);
        border-radius:999px;
        background:rgba(255,255,255,.86);
        color:#526174 !important;
        font-size:9.5px !important;
        font-weight:800 !important;
        line-height:1.25;
        box-shadow:0 3px 10px rgba(0,31,71,.04);
      }
      .an-book-unit-grid-cs21a135 {
        display:grid !important;
        grid-template-columns:repeat(16,minmax(66px,1fr)) !important;
        gap:8px !important;
        overflow-x:auto !important;
        padding:3px 2px 9px !important;
        overscroll-behavior-x:contain;
        scrollbar-width:thin;
        scrollbar-color:color-mix(in srgb,var(--book-unit-accent) 45%,#C9D2DD) transparent;
      }
      .an-book-unit-grid-cs21a135::-webkit-scrollbar { height:8px; }
      .an-book-unit-grid-cs21a135::-webkit-scrollbar-track { background:transparent; }
      .an-book-unit-grid-cs21a135::-webkit-scrollbar-thumb {
        border-radius:999px;
        background:color-mix(in srgb,var(--book-unit-accent) 42%,#CBD4DE);
      }
      .an-book-unit-grid-cs21a135 > div { min-width:66px !important; }
      .an-book-unit-button-cs21a135 {
        position:relative !important;
        width:100% !important;
        min-width:66px !important;
        height:52px !important;
        min-height:52px !important;
        padding:20px 5px 5px !important;
        border:1px solid color-mix(in srgb,var(--book-unit-accent) 34%,#D3DBE5) !important;
        border-radius:13px !important;
        background:linear-gradient(180deg,#FFFFFF 0%,var(--book-unit-soft) 100%) !important;
        color:var(--book-unit-accent-dark) !important;
        box-shadow:inset 0 3px 0 var(--book-unit-accent),0 5px 12px rgba(0,31,71,.08) !important;
        font-size:12px !important;
        font-weight:950 !important;
        letter-spacing:.035em !important;
        cursor:pointer !important;
        opacity:1 !important;
        transform:translateY(0);
        transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease,filter .16s ease !important;
      }
      .an-book-unit-button-cs21a135::before {
        content:'UNIDAD';
        position:absolute;
        top:6px;
        left:7px;
        color:color-mix(in srgb,var(--book-unit-accent) 72%,#53657A);
        font-size:6.5px;
        font-weight:950;
        letter-spacing:.13em;
      }
      .an-book-unit-button-cs21a135::after {
        content:'p. ' attr(data-page);
        position:absolute;
        top:5px;
        right:6px;
        min-width:21px;
        padding:2px 4px;
        border-radius:999px;
        background:color-mix(in srgb,var(--book-unit-accent) 10%,white);
        color:var(--book-unit-accent);
        font-size:6.5px;
        font-weight:950;
        line-height:1;
      }
      .an-book-unit-button-cs21a135:hover:not(:disabled) {
        transform:translateY(-2px);
        border-color:var(--book-unit-accent) !important;
        box-shadow:inset 0 3px 0 var(--book-unit-accent),0 10px 20px color-mix(in srgb,var(--book-unit-accent) 17%,transparent) !important;
        filter:saturate(1.08);
      }
      .an-book-unit-button-cs21a135[data-active="true"] {
        border:2px solid #F2C94C !important;
        background:linear-gradient(145deg,var(--book-unit-accent),var(--book-unit-accent-dark)) !important;
        color:#fff !important;
        box-shadow:0 0 0 3px rgba(242,201,76,.22),0 12px 24px color-mix(in srgb,var(--book-unit-accent) 30%,transparent) !important;
        transform:translateY(-2px);
      }
      .an-book-unit-button-cs21a135[data-active="true"]::before { color:rgba(255,255,255,.72); }
      .an-book-unit-button-cs21a135[data-active="true"]::after {
        background:rgba(255,255,255,.17);
        color:#fff;
      }
      .an-book-unit-button-cs21a135[data-mapped="false"] {
        border-color:#D8DDE4 !important;
        background:#F2F3F5 !important;
        color:#8A929E !important;
        box-shadow:none !important;
        cursor:not-allowed !important;
      }
      .an-book-unit-button-cs21a135:disabled { opacity:.68 !important; cursor:wait !important; }
      .an-book-unit-update-cs21a135 {
        min-height:22px !important;
        border-radius:7px !important;
        border-color:color-mix(in srgb,var(--book-unit-accent) 25%,#A6B1BF) !important;
        color:var(--book-unit-accent-dark) !important;
        font-size:7.5px !important;
        font-weight:900 !important;
      }
      @media (max-width:760px) {
        .an-book-unit-strip-cs21a135 { padding:12px 11px 14px !important; }
        .an-book-unit-header-cs21a135 { align-items:flex-start !important; flex-direction:column; }
        .an-book-unit-status-cs21a135 { max-width:100%; border-radius:10px; }
        .an-book-unit-grid-cs21a135 { grid-template-columns:repeat(16,minmax(62px,62px)) !important; }
        .an-book-unit-button-cs21a135 { min-width:62px !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function activeBookType(section){
    var pressed = Array.from(section.querySelectorAll('button[aria-pressed="true"]')).find(function(button){
      return /^(SB|TB|WB)$/.test(compact(button.textContent));
    });
    if (pressed) return compact(pressed.textContent);
    var title = compact(section.textContent).toUpperCase();
    if (title.indexOf('-TB') >= 0 || title.indexOf(' TB ') >= 0) return 'TB';
    if (title.indexOf('-WB') >= 0 || title.indexOf(' WB ') >= 0) return 'WB';
    return 'SB';
  }

  function activeUnitButton(button){
    try {
      var style = window.getComputedStyle ? window.getComputedStyle(button) : null;
      var color = style ? style.color : button.style.color;
      var background = style ? style.backgroundColor : button.style.backgroundColor;
      return color === 'rgb(255, 255, 255)' && background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent';
    } catch (_) {
      return /255/.test(String(button.style.color || ''));
    }
  }

  function unitPage(button){
    var title = text(button.getAttribute('title'));
    var match = title.match(/(?:hoja|página(?:\s+fuente)?(?:\s+provisional)?)\s+(\d+)/i);
    return match ? match[1] : '—';
  }

  function enhanceSection(section){
    if (!section || /ESTUDIANTE/i.test(text(section.getAttribute('data-screen-label')))) return;
    var headings = Array.from(section.querySelectorAll('strong'));
    var heading = headings.find(function(node){
      return /inicio oficial por unidad|selecciona la unidad para ubicar el libro/i.test(compact(node.textContent));
    });
    if (!heading || !heading.parentElement || !heading.parentElement.parentElement) return;

    var header = heading.parentElement;
    var strip = header.parentElement;
    var grid = strip.children && strip.children[1];
    if (!grid || !strip.contains(grid)) return;

    section.setAttribute('data-book-viewer', 'institutional');
    strip.classList.add('an-book-unit-strip-cs21a135');
    strip.setAttribute('data-book-type', activeBookType(section));
    header.classList.add('an-book-unit-header-cs21a135');
    grid.classList.add('an-book-unit-grid-cs21a135');

    if (!header.querySelector('.an-book-unit-heading-wrap-cs21a135')) {
      var wrap = document.createElement('div');
      wrap.className = 'an-book-unit-heading-wrap-cs21a135';
      var emblem = document.createElement('span');
      emblem.className = 'an-book-unit-emblem-cs21a135';
      emblem.textContent = 'U16';
      var copy = document.createElement('span');
      copy.className = 'an-book-unit-copy-cs21a135';
      var kicker = document.createElement('span');
      kicker.className = 'an-book-unit-kicker-cs21a135';
      kicker.textContent = 'Saltos oficiales del libro';
      heading.textContent = 'Navegación por unidad';
      header.insertBefore(wrap, header.firstChild);
      wrap.appendChild(emblem);
      wrap.appendChild(copy);
      copy.appendChild(kicker);
      copy.appendChild(heading);
    } else {
      heading.textContent = 'Navegación por unidad';
    }

    Array.from(header.children).forEach(function(node){
      if (node !== header.querySelector('.an-book-unit-heading-wrap-cs21a135')) {
        node.classList.add('an-book-unit-status-cs21a135');
      }
    });

    Array.from(grid.querySelectorAll('button')).forEach(function(button){
      var label = compact(button.textContent);
      if (/^U\d{2}$/.test(label)) {
        var page = unitPage(button);
        button.classList.add('an-book-unit-button-cs21a135');
        button.setAttribute('data-page', page);
        button.setAttribute('data-mapped', page === '—' ? 'false' : 'true');
        button.setAttribute('data-active', activeUnitButton(button) ? 'true' : 'false');
        if (activeUnitButton(button)) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      } else if (/Actualizar|Guardando/i.test(label)) {
        button.classList.add('an-book-unit-update-cs21a135');
      }
    });
  }

  function enhanceAll(){
    if (!document || typeof document.querySelectorAll !== 'function') return;
    Array.from(document.querySelectorAll('section[data-screen-label*="Libros"],section[data-screen-label*="libros"],section[data-screen-label*="biblioteca"]')).forEach(enhanceSection);
  }

  function queueEnhancement(){
    if (enhancementQueued) return;
    enhancementQueued = true;
    var run = function(){ enhancementQueued = false; enhanceAll(); };
    if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(run);
    else window.setTimeout(run, 16);
  }

  function reinstall(){
    installStyles();
    installAuthority();
    queueEnhancement();
  }

  installStyles();
  installAuthority();
  queueEnhancement();

  ['an:lazy-module-loaded','an:teacher-material-tab','an:admin-resource-tab'].forEach(function(eventName){
    window.addEventListener(eventName, function(){ window.setTimeout(reinstall, 80); });
  });

  authorityTimer = window.setInterval(function(){
    installAuthority();
    queueEnhancement();
  }, 600);

  if (typeof MutationObserver === 'function' && document && document.documentElement) {
    observer = new MutationObserver(queueEnhancement);
    observer.observe(document.documentElement, {
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['style','aria-pressed','disabled']
    });
  }

  window.addEventListener('pagehide', function(){
    if (authorityTimer) window.clearInterval(authorityTimer);
    if (observer) observer.disconnect();
  }, { once:true });

  window.__AN_TEACHER_BOOK_NAVIGATION_CS21A135 = {
    version:VERSION,
    endpoint:ENDPOINT,
    maps:UNIT_STARTS,
    knownBad:KNOWN_BAD,
    repairPayload:repairPayload,
    complete:complete,
    installAuthority:installAuthority,
    enhanceAll:enhanceAll,
    reinstall:reinstall,
    styleId:STYLE_ID
  };
})();
