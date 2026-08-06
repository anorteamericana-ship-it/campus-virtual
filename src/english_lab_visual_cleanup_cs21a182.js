/* global window, document, MutationObserver */
// F98.4-Z6-CS21A182 · Limpieza visual aditiva de English LAB.
// Reduce texto repetido y oculta diagnósticos internos sin alterar juegos, permisos ni backend.
(function installEnglishLabVisualCleanupCS21A182(global, doc) {
  'use strict';

  if (!global || !doc || global.__ENGLISH_LAB_VISUAL_CLEANUP_CS21A182__) return;

  var VERSION = 'F98.4-Z6-CS21A182';
  var scheduled = false;
  var lastAudit = {roots:0,replaced:0,hidden:0,technical:0};

  var exactText = {
    'Pantalla del estudiante. Respondé cuando el docente abra la pregunta.':'Respondé cuando el docente abra la pregunta.',
    'Control de ronda docente. Todavía no guarda notas oficiales ni afecta aprobación.':'Controlá la actividad y el avance del grupo.',
    'Salas de práctica en vivo para juegos tipo reto. No guarda notas oficiales ni afecta aprobación académica.':'Creá una sala, compartí el código y dirigí la actividad en vivo.',
    'CS20H deja lista la entrada del estudiante y el mensaje para compartir. Elegí unidad y juego, creá la sala y copiá el código o mensaje para Zoom/WhatsApp. El banco sigue con diagnóstico activo.':'Elegí el grupo, la unidad y el juego. Luego creá la sala y compartí el código con tus estudiantes.',
    'Solo práctica. Nada de esto se mezcla con notas oficiales, certificados o pagos.':'Reabrí una sala reciente o revisá su estado.',
    'Seguimiento visual por juegos completados al 100%. No genera nota oficial.':'Seguimiento por juegos completados al 100%.',
    'Práctica cargada desde el banco curricular. No genera nota oficial.':'Práctica cargada desde el banco curricular.',
    'No hay nota oficial.':'Práctica libre.',
    'Solo se registra premio si completás 100%.':'Completá todos los ítems para finalizar.',
    'No se cargó backend ni se escriben datos. Pedí acceso piloto desde administración.':'Este acceso todavía no está habilitado para tu usuario. Consultá con administración.',
    'English LAB todavía no está conectado para este usuario.':'English LAB todavía no está habilitado para este usuario.',
    'Piloto visual':'Acceso restringido',
    'La hoja se inicializa al cargar English LAB Live.':'',
    'Copiado listo.':'Copiado.',
    'Esta pregunta ya no acepta respuestas para tu usuario o está siendo actualizada.':'La pregunta está siendo actualizada. Esperá un momento.',
    'Respuesta recibida. Esperá a que el docente cierre la pregunta para ver la respuesta correcta.':'Respuesta recibida. Esperá el resultado.',
    'Esperando que el docente lance una pregunta…':'Esperando la siguiente pregunta…'
  };

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function routeLooksRelevant() {
    var route = '';
    try { route = String(global.location && (global.location.hash + ' ' + global.location.search) || '').toLowerCase(); } catch (_) {}
    if (route.indexOf('english_lab') >= 0 || route.indexOf('academia_play') >= 0) return true;
    return !!doc.querySelector('.elive-main-grid,.elive-join-grid,.aplay-shell,[data-screen-label*="English LAB"]');
  }

  function roots() {
    var nodes = Array.prototype.slice.call(doc.querySelectorAll('.elive-main-grid,.elive-join-grid,.aplay-shell,[data-screen-label*="English LAB"]'));
    if (!nodes.length && routeLooksRelevant()) {
      Array.prototype.forEach.call(doc.querySelectorAll('h1,h2'), function (heading) {
        if (clean(heading.textContent).toLowerCase().indexOf('english lab') < 0) return;
        var candidate = heading.closest('[data-screen-label]') || heading.parentElement;
        if (candidate) nodes.push(candidate);
      });
    }
    if (!nodes.length && routeLooksRelevant()) {
      var fallback = doc.querySelector('main,[role="main"],#root');
      if (fallback) nodes.push(fallback);
    }
    var unique = [];
    nodes.forEach(function (node) {
      var root = node;
      if (node.classList && (node.classList.contains('elive-main-grid') || node.classList.contains('elive-join-grid'))) {
        root = node.parentElement || node;
      }
      if (unique.indexOf(root) < 0) unique.push(root);
    });
    return unique;
  }

  function injectStyles() {
    if (doc.getElementById('elive-cs21a182-style')) return;
    var style = doc.createElement('style');
    style.id = 'elive-cs21a182-style';
    style.textContent = [
      '[data-cs21a182-hidden="true"]{display:none!important}',
      '[data-cs21a182-clean="true"] .elive-main-grid,[data-cs21a182-clean="true"] .elive-join-grid{align-items:start!important}',
      '[data-cs21a182-clean="true"] .card{scroll-margin-top:88px}',
      '[data-cs21a182-clean="true"] button{min-height:42px}',
      '[data-cs21a182-clean="true"] .elive-cs182-clamp{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}',
      '[data-cs21a182-clean="true"] [data-cs21a182-secondary="true"]{color:#667085!important;font-size:12px!important;line-height:1.45!important}',
      '@media(max-width:760px){[data-cs21a182-clean="true"] h1{font-size:30px!important;line-height:1.05!important}[data-cs21a182-clean="true"] .card{border-radius:16px!important}[data-cs21a182-clean="true"] button{width:100%;justify-content:center}[data-cs21a182-clean="true"] .elive-main-grid,[data-cs21a182-clean="true"] .elive-join-grid{gap:12px!important}}'
    ].join('');
    (doc.head || doc.documentElement).appendChild(style);
  }

  function replaceText(root, audit) {
    if (!root || typeof doc.createTreeWalker !== 'function') return;
    var walker = doc.createTreeWalker(root, 4);
    var node;
    while ((node = walker.nextNode())) {
      var original = node.nodeValue;
      var normalized = clean(original);
      if (!normalized) continue;
      if (Object.prototype.hasOwnProperty.call(exactText, normalized)) {
        node.nodeValue = exactText[normalized];
        audit.replaced += 1;
        continue;
      }
      if (/\b(?:CS20H|F98\.4-Z6-CS21A\d+)\b/.test(normalized)) {
        var parent = node.parentElement;
        if (parent && parent.children.length === 0) {
          parent.setAttribute('data-cs21a182-hidden', 'true');
          audit.technical += 1;
        }
      }
    }
  }

  function hideClosestCardByLabel(root, label, audit) {
    var elements = root.querySelectorAll('div,span,strong,b');
    Array.prototype.forEach.call(elements, function (element) {
      if (clean(element.textContent) !== label) return;
      var card = element.closest('.card');
      if (!card || card.getAttribute('data-cs21a182-hidden') === 'true') return;
      card.setAttribute('data-cs21a182-hidden', 'true');
      card.setAttribute('aria-hidden', 'true');
      audit.hidden += 1;
    });
  }

  function hideMessagePreview(root, audit) {
    var bold = root.querySelectorAll('b,strong');
    Array.prototype.forEach.call(bold, function (element) {
      if (clean(element.textContent) !== 'Mensaje listo:') return;
      var box = element.parentElement;
      if (!box || box.getAttribute('data-cs21a182-hidden') === 'true') return;
      box.setAttribute('data-cs21a182-hidden', 'true');
      box.setAttribute('aria-hidden', 'true');
      audit.hidden += 1;
    });
  }

  function improveHierarchy(root) {
    var paragraphs = root.querySelectorAll('p,div');
    Array.prototype.forEach.call(paragraphs, function (element) {
      var text = clean(element.textContent);
      if (!text || element.children.length) return;
      if (text.length > 95 && text.length < 260) element.classList.add('elive-cs182-clamp');
      if (/^(Para Zoom o WhatsApp:|Reabrí una sala reciente|Seguimiento por juegos|Práctica cargada)/.test(text)) {
        element.setAttribute('data-cs21a182-secondary', 'true');
      }
    });
  }

  function applyCleanup() {
    scheduled = false;
    if (!routeLooksRelevant()) return;
    injectStyles();
    var audit = {roots:0,replaced:0,hidden:0,technical:0};
    roots().forEach(function (root) {
      audit.roots += 1;
      root.setAttribute('data-cs21a182-clean', 'true');
      root.setAttribute('data-cs21a182-version', VERSION);
      replaceText(root, audit);
      hideClosestCardByLabel(root, 'Banco pedagógico', audit);
      hideMessagePreview(root, audit);
      improveHierarchy(root);
    });
    lastAudit = audit;
  }

  function scheduleCleanup() {
    if (scheduled) return;
    scheduled = true;
    if (typeof global.requestAnimationFrame === 'function') global.requestAnimationFrame(applyCleanup);
    else global.setTimeout(applyCleanup, 0);
  }

  var observer = typeof MutationObserver === 'function'
    ? new MutationObserver(scheduleCleanup)
    : null;
  if (observer) observer.observe(doc.documentElement, {subtree:true,childList:true,characterData:true});
  global.addEventListener('hashchange', scheduleCleanup);
  global.addEventListener('popstate', scheduleCleanup);
  doc.addEventListener('visibilitychange', scheduleCleanup);

  global.__ENGLISH_LAB_VISUAL_CLEANUP_CS21A182__ = {
    version:VERSION,
    run:applyCleanup,
    getLastAudit:function () { return Object.assign({}, lastAudit); }
  };

  scheduleCleanup();
})(window, document);
