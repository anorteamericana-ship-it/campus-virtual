/* global window, document, MutationObserver */
// F98.4-Z6-CS21A182 · Limpieza visual aditiva de English LAB.
// Reduce texto repetido y oculta diagnósticos, demos y controles internos sin alterar juegos, permisos ni backend.
(function installEnglishLabVisualCleanupCS21A182(global, doc) {
  'use strict';

  if (!global || !doc || global.__ENGLISH_LAB_VISUAL_CLEANUP_CS21A182__) return;

  var VERSION = 'F98.4-Z6-CS21A182';
  var scheduled = false;
  var lastAudit = {roots:0,replaced:0,hidden:0,technical:0,studentInternal:0,demoCards:0,teacherDemo:0,adminModes:0};

  var exactText = {
    'Pantalla del estudiante. Respondé cuando el docente abra la pregunta.':'Respondé cuando el docente abra la pregunta.',
    'Control de ronda docente. Todavía no guarda notas oficiales ni afecta aprobación.':'Controlá la actividad y el avance del grupo.',
    'Salas de práctica en vivo para juegos tipo reto. No guarda notas oficiales ni afecta aprobación académica.':'Creá una sala, compartí el código y dirigí la actividad en vivo.',
    'CS20H deja lista la entrada del estudiante y el mensaje para compartir. Elegí unidad y juego, creá la sala y copiá el código o mensaje para Zoom/WhatsApp. El banco sigue con diagnóstico activo.':'Elegí el grupo, la unidad y el juego. Luego creá la sala y compartí el código con tus estudiantes.',
    'Solo práctica. Nada de esto se mezcla con notas oficiales, certificados o pagos.':'Reabrí una sala reciente o revisá su estado.',
    'Seguimiento visual por juegos completados al 100%. No genera nota oficial.':'Seguimiento por juegos completados al 100%.',
    'Práctica cargada desde el banco curricular. No genera nota oficial.':'Práctica cargada desde el contenido de la unidad.',
    'No hay nota oficial.':'Práctica libre.',
    'Solo se registra premio si completás 100%.':'Completá todos los ítems para finalizar.',
    'No se cargó backend ni se escriben datos. Pedí acceso piloto desde administración.':'Este acceso todavía no está habilitado para tu usuario. Consultá con administración.',
    'English LAB todavía no está conectado para este usuario.':'English LAB todavía no está habilitado para este usuario.',
    'Piloto visual':'Acceso restringido',
    'La hoja se inicializa al cargar English LAB Live.':'',
    'Copiado listo.':'Copiado.',
    'Esta pregunta ya no acepta respuestas para tu usuario o está siendo actualizada.':'La pregunta está siendo actualizada. Esperá un momento.',
    'Respuesta recibida. Esperá a que el docente cierre la pregunta para ver la respuesta correcta.':'Respuesta recibida. Esperá el resultado.',
    'Esperando que el docente lance una pregunta…':'Esperando la siguiente pregunta…',
    'Banco curricular':'Juegos por unidad',
    'Cargando juego real':'Preparando el juego',
    'No se pudo cargar el juego desde el banco.':'No se pudo cargar este juego.',
    'El juego existe, pero no tiene ítems compatibles para este formato.':'Este juego todavía no tiene contenido disponible.',
    'Elegí nivel, unidad y área. Cada unidad debe tener 12 juegos.':'Elegí tu nivel, unidad y área para practicar.',
    'Todavía no hay juegos importados o el banco no respondió.':'Todavía no hay juegos disponibles para esta selección.',
    'Importá el banco desde admin para activar la ruta real.':'El contenido por unidades todavía no está disponible.',
    'Validá e importá cada nivel desde Admin → Banco curricular. Si ya importaste, tocá Actualizar.':'Probá otra unidad o área. También podés actualizar la vista.',
    'Áreas cognitivas demo':'Áreas de práctica',
    'Catálogo visual inicial y juegos gratis.':'Elegí el tipo de práctica que querés trabajar.',
    'Catálogo demo':'Más juegos',
    'Demo estudiante':'Práctica',
    'Práctica demo':'Práctica',
    'Práctica visual: sin notas oficiales.':'Practicá a tu ritmo.',
    'Respuesta inválida del backend.':'No se pudo cargar la información.',
    'El backend tardó demasiado en responder.':'La respuesta está tardando más de lo esperado. Intentá de nuevo.',
    'ACADEMIA_PLAY_BANK':'Banco de juegos',
    'CS14 Importador':'Importador',
    'Actualizar banco':'Actualizar juegos',
    'Importar banco por nivel':'Importar juegos por nivel',
    'Importar al banco':'Importar juegos',
    'GAME_ID únicos':'juegos únicos',
    'Templates':'Tipos de juego',
    'Sin templates todavía.':'Sin tipos de juego todavía.',
    'Contenido listo para motor por nivel, unidad, área y template.':'Contenido organizado por nivel, unidad, área y tipo de juego.',
    'Progreso real separado de notas oficiales.':'Seguimiento de práctica y participación.',
    'Nota admin':'Resumen',
    'Hoja separada':'Seguimiento de práctica',
    'Este panel lee ACADEMIA_PLAY_PROGRESS. La ficha por estudiante ayuda a ventas/admin sin tocar notas oficiales.':'Consultá el avance por estudiante y detectá quién necesita apoyo.',
    'en hoja separada':'registrados',
    'separado de notas':'promedio de práctica',
    'sincronizado':'Actualizado',
    'SIN_TIPO':'Sin tipo',
    'PREMATRICULA':'Prematrícula',
    'ESTUDIANTE':'Estudiante'
  };

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function hideNode(node, audit, bucket) {
    if (!node || node.getAttribute('data-cs21a182-hidden') === 'true') return;
    node.setAttribute('data-cs21a182-hidden', 'true');
    node.setAttribute('aria-hidden', 'true');
    audit.hidden += 1;
    if (bucket && Object.prototype.hasOwnProperty.call(audit, bucket)) audit[bucket] += 1;
  }

  function routeLooksRelevant() {
    var route = '';
    try { route = String(global.location && (global.location.hash + ' ' + global.location.search) || '').toLowerCase(); } catch (_) {}
    if (route.indexOf('english_lab') >= 0 || route.indexOf('academia_play') >= 0) return true;
    return !!doc.querySelector('.elive-main-grid,.elive-join-grid,.aplay-shell,.ap-view,.ap-practice-wrap,.ap-live-room,[data-screen-label*="English LAB"]');
  }

  function roots() {
    var selector = '.elive-main-grid,.elive-join-grid,.aplay-shell,.ap-view,.ap-practice-wrap,.ap-live-room,.ap-denied,[data-screen-label*="English LAB"]';
    var nodes = Array.prototype.slice.call(doc.querySelectorAll(selector));
    if (routeLooksRelevant()) {
      Array.prototype.forEach.call(doc.querySelectorAll('h1,h2'), function (heading) {
        if (clean(heading.textContent).toLowerCase().indexOf('english lab') < 0) return;
        var candidate = heading.closest('.ap-view,.ap-practice-wrap,.ap-live-room,[data-screen-label],div[style*="max-width"]') || heading.parentElement;
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
      '[data-cs21a182-clean="true"] .btn,[data-cs21a182-clean="true"] .ap-btn{min-height:42px}',
      '[data-cs21a182-clean="true"] .elive-cs182-clamp{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}',
      '[data-cs21a182-clean="true"] [data-cs21a182-secondary="true"]{color:#667085!important;font-size:12px!important;line-height:1.45!important}',
      '[data-cs21a182-clean="true"] .ap-card-tags,[data-cs21a182-clean="true"] .ap-area-stats{display:none!important}',
      '.elive-cs182-live-redirect{margin-top:16px;padding:22px;border:1px solid #B7D5FF;border-radius:20px;background:linear-gradient(135deg,#EEF4FF 0%,#FFFFFF 75%);box-shadow:0 12px 30px rgba(7,59,122,.08)}',
      '.elive-cs182-live-redirect h2{margin:0;color:#001E47;font-size:24px}.elive-cs182-live-redirect p{margin:8px 0 0;color:#475467;line-height:1.55}',
      '.elive-cs182-live-link{display:inline-flex;align-items:center;justify-content:center;min-height:42px;margin-top:14px;padding:10px 16px;border-radius:12px;background:#073B7A;color:#FFF!important;font-weight:900;text-decoration:none}',
      '@media(max-width:760px){[data-cs21a182-clean="true"] h1{font-size:30px!important;line-height:1.05!important}[data-cs21a182-clean="true"] .card{border-radius:16px!important}[data-cs21a182-clean="true"] .elive-main-grid,[data-cs21a182-clean="true"] .elive-join-grid{gap:12px!important}[data-cs21a182-clean="true"] .elive-main-grid .btn,[data-cs21a182-clean="true"] .elive-join-grid .btn,[data-cs21a182-clean="true"] .ap-hero-actions>.ap-btn,[data-cs21a182-clean="true"] .ap-center-actions>.ap-btn{width:100%;justify-content:center}[data-cs21a182-clean="true"] .ap-area-dots{display:none!important}.elive-cs182-live-link{width:100%;box-sizing:border-box}}'
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
      if (/^Estamos leyendo .+ desde ACADEMIA_PLAY_BANK\.$/.test(normalized)) {
        node.nodeValue = 'Estamos preparando el contenido de esta actividad.';
        audit.replaced += 1;
        continue;
      }
      if (/Resultado demo/i.test(normalized)) {
        node.nodeValue = original.replace(/Resultado demo/gi, 'Resultado');
        audit.replaced += 1;
        continue;
      }
      if (/\b(?:CS20H|CS14|F98\.4-Z6-CS21A\d+|ACADEMIA_PLAY_BANK|GAME_ID)\b/.test(normalized)) {
        var parent = node.parentElement;
        if (parent && parent.children.length === 0) hideNode(parent, audit, 'technical');
      }
    }
  }

  function hideClosestCardByLabel(root, label, audit) {
    var elements = root.querySelectorAll('div,span,strong,b');
    Array.prototype.forEach.call(elements, function (element) {
      if (clean(element.textContent) !== label) return;
      var card = element.closest('.card');
      if (card) hideNode(card, audit, 'technical');
    });
  }

  function hideMessagePreview(root, audit) {
    var bold = root.querySelectorAll('b,strong');
    Array.prototype.forEach.call(bold, function (element) {
      if (clean(element.textContent) !== 'Mensaje listo:') return;
      hideNode(element.parentElement, audit);
    });
  }

  function hideStudentInternalPanels(root, audit) {
    var student = root.classList && root.classList.contains('ap-view-student') ? root : root.querySelector('.ap-view-student');
    if (!student) return;
    Array.prototype.forEach.call(student.querySelectorAll('.ap-live-preview,.ap-stats-grid,.ap-medal-shelf,.ap-bank-unit-summary'), function (node) {
      hideNode(node, audit, 'studentInternal');
    });
    Array.prototype.forEach.call(student.querySelectorAll('.ap-game-card'), function (card) {
      var text = clean(card.textContent);
      if (/Próximamente|Live Trivia/.test(text)) hideNode(card, audit, 'demoCards');
    });
    Array.prototype.forEach.call(student.querySelectorAll('.ap-track-card'), function (card) {
      if (/Live Trivia/.test(clean(card.textContent))) hideNode(card, audit, 'demoCards');
    });
    Array.prototype.forEach.call(student.querySelectorAll('.ap-demo-note'), function (note) {
      if (/CS14|ACADEMIA_PLAY_BANK|GAME_ID|banco curricular/i.test(clean(note.textContent))) hideNode(note, audit, 'technical');
    });
  }

  function liveNotice(title, copy) {
    var notice = doc.createElement('section');
    notice.className = 'elive-cs182-live-redirect';
    notice.setAttribute('role', 'status');
    notice.innerHTML = '<h2>' + title + '</h2><p>' + copy + '</p><a class="elive-cs182-live-link" href="#english_lab_live">Abrir English LAB Live</a>';
    return notice;
  }

  function replaceLegacyLiveDemo(root, audit) {
    var room = root.classList && root.classList.contains('ap-live-room') ? root : root.querySelector('.ap-live-room');
    if (!room) return;
    var main = room.querySelector('.ap-live-main');
    if (main) hideNode(main, audit, 'demoCards');
    if (room.querySelector('.elive-cs182-live-redirect')) return;
    var notice = liveNotice('Las actividades en vivo están en English LAB Live', 'Usá la sala real para crear o ingresar a una actividad. La demostración con datos ficticios fue retirada.');
    var back = room.querySelector('button');
    if (back && back.nextSibling) room.insertBefore(notice, back.nextSibling);
    else room.appendChild(notice);
  }

  function replaceLegacyTeacherDemo(root, audit) {
    var teacher = root.classList && root.classList.contains('ap-view-teacher') ? root : root.querySelector('.ap-view-teacher');
    if (!teacher) return;
    Array.prototype.forEach.call(Array.prototype.slice.call(teacher.children), function (child) {
      if (!child.classList.contains('elive-cs182-live-redirect')) hideNode(child, audit, 'teacherDemo');
    });
    if (!teacher.querySelector('.elive-cs182-live-redirect')) {
      teacher.appendChild(liveNotice('La sala docente está en English LAB Live', 'Creá salas reales, compartí el código y controlá la actividad desde el módulo Live. La maqueta docente anterior fue retirada.'));
    }
  }

  function enforceAdminMode(root, audit) {
    var shell = root.classList && root.classList.contains('aplay-shell') ? root : root.closest('.aplay-shell') || root.querySelector('.aplay-shell');
    if (!shell) return;
    var tabs = shell.querySelector('.ap-mode-tabs');
    if (!tabs) return;
    var buttons = Array.prototype.slice.call(tabs.querySelectorAll('button'));
    if (buttons.length < 3) return;
    var admin = buttons.find(function (button) { return clean(button.textContent) === 'Admin'; });
    if (!admin) return;
    if (admin.getAttribute('aria-selected') !== 'true' && shell.getAttribute('data-cs21a182-admin-forced') !== 'true') {
      shell.setAttribute('data-cs21a182-admin-forced', 'true');
      try { admin.click(); } catch (_) {}
    }
    hideNode(tabs, audit, 'adminModes');
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
    var audit = {roots:0,replaced:0,hidden:0,technical:0,studentInternal:0,demoCards:0,teacherDemo:0,adminModes:0};
    roots().forEach(function (root) {
      audit.roots += 1;
      root.setAttribute('data-cs21a182-clean', 'true');
      root.setAttribute('data-cs21a182-version', VERSION);
      replaceText(root, audit);
      hideClosestCardByLabel(root, 'Banco pedagógico', audit);
      hideMessagePreview(root, audit);
      hideStudentInternalPanels(root, audit);
      replaceLegacyLiveDemo(root, audit);
      replaceLegacyTeacherDemo(root, audit);
      enforceAdminMode(root, audit);
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
