/* global window, document, React, Response, Request, URL */
// F98.4-Z6-CS21A181 · UX aditiva de English LAB.
// Un solo indicador visual de carga y editor previo de parejas Memory Match.
(function installEnglishLabUxCS21A181(global) {
  'use strict';

  if (!global || global.__ENGLISH_LAB_UX_CS21A181__) return;

  var VERSION = 'F98.4-Z6-CS21A181';
  var listeners = [];
  var pending = {};
  var pendingSequence = 0;
  var state = {
    memoryMatch:false,
    status:'',
    roomCode:'',
    pairCount:6,
    suggestedPairs:[],
    draft:'',
    dirty:false,
  };

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function upper(value) {
    return clean(value).toUpperCase();
  }

  function snapshot() {
    return {
      memoryMatch:state.memoryMatch,
      status:state.status,
      roomCode:state.roomCode,
      pairCount:state.pairCount,
      suggestedPairs:state.suggestedPairs.slice(),
      draft:state.draft,
      dirty:state.dirty,
    };
  }

  function publish() {
    var current = snapshot();
    listeners.slice().forEach(function (listener) {
      try { listener(current); } catch (_) {}
    });
  }

  function subscribe(listener) {
    listeners.push(listener);
    return function () {
      listeners = listeners.filter(function (item) { return item !== listener; });
    };
  }

  function pairText(pairs) {
    return (Array.isArray(pairs) ? pairs : []).map(function (pair) {
      return clean(pair && (pair.left || pair.PAIR_LEFT)) + ' = ' + clean(pair && (pair.right || pair.PAIR_RIGHT));
    }).join('\n');
  }

  function parsePairs(value) {
    var pairs = [];
    var invalid = [];
    var seen = {};
    String(value || '').split(/\r?\n/).forEach(function (raw, index) {
      var line = clean(raw);
      if (!line) return;
      var parts = line.split(/\s*(?:=|→|\|)\s*/);
      var left = clean(parts.shift());
      var right = clean(parts.join(' = '));
      var key = upper(left);
      if (!left || !right || seen[key]) {
        invalid.push(index + 1);
        return;
      }
      seen[key] = true;
      pairs.push({left:left,right:right});
    });
    return {pairs:pairs,invalid:invalid};
  }

  function sanitizeString(value) {
    return String(value)
      .replace(/Acceso financiero/g, 'Acceso')
      .replace(/acceso financiero/g, 'acceso');
  }

  function sanitizeData(value) {
    if (typeof value === 'string') return sanitizeString(value);
    if (Array.isArray(value)) return value.map(sanitizeData);
    if (!value || typeof value !== 'object') return value;
    var output = {};
    Object.keys(value).forEach(function (key) { output[key] = sanitizeData(value[key]); });
    return output;
  }

  function injectStyles() {
    if (document.getElementById('elive-cs21a181-style')) return;
    var style = document.createElement('style');
    style.id = 'elive-cs21a181-style';
    style.textContent = [
      '@keyframes eliveSpin181{to{transform:rotate(360deg)}}',
      '@keyframes eliveLoad181{0%{transform:translateX(-120%)}100%{transform:translateX(340%)}}',
      '#elive-cs21a181-loading{position:fixed;z-index:99999;left:50%;top:18px;transform:translateX(-50%);display:none;align-items:center;gap:11px;min-width:min(390px,calc(100vw - 28px));padding:12px 15px;border:1px solid #B7D5FF;border-radius:17px;background:#F7FAFF;box-shadow:0 14px 34px rgba(0,30,71,.18);color:#001E47;font-family:var(--f-sans,Poppins,sans-serif)}',
      '#elive-cs21a181-loading[data-visible="true"]{display:flex}',
      '.elive-cs181-spinner{width:23px;height:23px;flex:0 0 auto;border-radius:50%;border:3px solid #D9E8FF;border-top-color:#073B7A;animation:eliveSpin181 .75s linear infinite}',
      '.elive-cs181-load-copy{min-width:0;flex:1;font-size:12px;font-weight:900}',
      '.elive-cs181-load-track{height:4px;margin-top:6px;border-radius:999px;overflow:hidden;background:#D9E8FF}',
      '.elive-cs181-load-track span{display:block;width:42%;height:100%;border-radius:999px;background:#073B7A;animation:eliveLoad181 1.15s ease-in-out infinite}',
      '.elive-cs181-editor{max-width:1180px;margin:0 auto 16px;padding:18px;border:1px solid #B7D5FF;border-radius:20px;background:#FFF;box-shadow:0 10px 26px rgba(15,23,42,.07);font-family:var(--f-sans,Poppins,sans-serif)}',
      '.elive-cs181-editor-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}',
      '.elive-cs181-editor-kicker{font-size:11px;font-weight:950;letter-spacing:.13em;text-transform:uppercase;color:#7A1E2C}',
      '.elive-cs181-editor h2{margin:4px 0 0;font-size:21px;color:#001E47}',
      '.elive-cs181-count{padding:6px 10px;border-radius:999px;font-size:11px;font-weight:950}',
      '.elive-cs181-count[data-valid="true"]{border:1px solid #BDE8CD;background:#EAF8EF;color:#145C38}',
      '.elive-cs181-count[data-valid="false"]{border:1px solid #FFD88A;background:#FFF7E6;color:#7A4B00}',
      '.elive-cs181-help{margin-top:8px;color:#667085;font-size:12.5px;line-height:1.55}',
      '.elive-cs181-editor textarea{box-sizing:border-box;width:100%;margin-top:12px;padding:12px 13px;border:1px solid #D0D5DD;border-radius:14px;resize:vertical;background:#F8FAFC;color:#001E47;font:13px/1.55 var(--f-mono,JetBrains Mono,monospace)}',
      '.elive-cs181-editor-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:10px}',
      '.elive-cs181-validation{font-size:12px;font-weight:850}',
      '.elive-cs181-validation[data-valid="true"]{color:#145C38}',
      '.elive-cs181-validation[data-valid="false"]{color:#8B1F1F}',
    ].join('');
    document.head.appendChild(style);
  }

  function loadingLabel(fn) {
    var name = clean(fn).toLowerCase();
    if (name.indexOf('accessstatus') >= 0) return 'Verificando acceso a English LAB…';
    if (name.indexOf('joinroom') >= 0) return 'Entrando a la sala…';
    if (name.indexOf('createroom') >= 0) return 'Creando la sala…';
    if (name.indexOf('startroom') >= 0) return 'Iniciando Memory Match…';
    if (name.indexOf('submitpair') >= 0) return 'Comprobando la pareja…';
    if (name.indexOf('getroomcontrol') >= 0 || name.indexOf('getplayerstate') >= 0) return 'Actualizando la sala…';
    return 'Cargando English LAB…';
  }

  function loadingNode() {
    var node = document.getElementById('elive-cs21a181-loading');
    if (node) return node;
    node = document.createElement('div');
    node.id = 'elive-cs21a181-loading';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    node.innerHTML = '<span class="elive-cs181-spinner" aria-hidden="true"></span><div class="elive-cs181-load-copy"><span>Cargando English LAB…</span><div class="elive-cs181-load-track"><span></span></div></div>';
    document.body.appendChild(node);
    return node;
  }

  function renderLoading() {
    var visible = Object.keys(pending).map(function (key) { return pending[key]; }).filter(function (item) { return item.visible; });
    var node = loadingNode();
    if (!visible.length) {
      node.dataset.visible = 'false';
      node.setAttribute('aria-busy', 'false');
      return;
    }
    node.querySelector('.elive-cs181-load-copy > span').textContent = visible[visible.length - 1].label;
    node.dataset.visible = 'true';
    node.setAttribute('aria-busy', 'true');
  }

  function beginLoading(fn) {
    var id = String(++pendingSequence);
    pending[id] = {label:loadingLabel(fn),visible:false,timer:null};
    pending[id].timer = setTimeout(function () {
      if (!pending[id]) return;
      pending[id].visible = true;
      renderLoading();
    }, 260);
    return id;
  }

  function endLoading(id) {
    if (!pending[id]) return;
    if (pending[id].timer) clearTimeout(pending[id].timer);
    delete pending[id];
    renderLoading();
  }

  function requestInfo(input, init) {
    var url = '';
    try {
      if (typeof input === 'string') url = input;
      else if (typeof URL !== 'undefined' && input instanceof URL) url = input.href;
      else if (typeof Request !== 'undefined' && input instanceof Request) url = input.url;
    } catch (_) {}
    var body = init && init.body;
    var parsedBody = null;
    if (typeof body === 'string') {
      try { parsedBody = JSON.parse(body); } catch (_) {}
    }
    var fn = clean(parsedBody && parsedBody.fn);
    if (!fn && url) {
      try { fn = clean(new URL(url, location.href).searchParams.get('fn')); } catch (_) {}
    }
    return {url:url,body:parsedBody,fn:fn};
  }

  function updateRoomState(data, fn) {
    var name = clean(fn).toLowerCase();
    if (name.indexOf('listteachergroups') >= 0 || name.indexOf('listteacherrooms') >= 0) {
      state.memoryMatch = false;
      state.status = '';
      publish();
      return;
    }
    var room = data && (data.room || (data.state && data.state.room));
    var gameCode = upper(room && (room.game_code || room.GAME_CODE || room.game_id));
    var memory = !!(data && data.memory_match) || gameCode === 'MEMORY_MATCH';
    if (!memory) return;
    var roomCode = clean(room && (room.room_code || room.ROOM_CODE || room.codigo));
    var nextStatus = upper(room && (room.status || room.STATUS));
    var suggestions = Array.isArray(data && data.suggested_pairs) ? data.suggested_pairs : [];
    var count = Math.max(3, Math.min(12, Number((data && data.pair_count) || (data && data.settings && data.settings.pair_count) || suggestions.length || state.pairCount || 6) || 6));
    var changedRoom = roomCode && roomCode !== state.roomCode;
    state.memoryMatch = true;
    state.status = nextStatus || state.status;
    state.roomCode = roomCode || state.roomCode;
    state.pairCount = count;
    if (suggestions.length) {
      state.suggestedPairs = suggestions.map(function (pair) {
        return {left:clean(pair && (pair.left || pair.PAIR_LEFT)),right:clean(pair && (pair.right || pair.PAIR_RIGHT))};
      });
      if (changedRoom || !state.dirty || !state.draft) {
        state.draft = pairText(state.suggestedPairs);
        state.dirty = false;
      }
    }
    publish();
  }

  function invalidPairResponse(message) {
    return new Response(JSON.stringify({
      ok:false,
      version:'CS21A181',
      error:'parejas_personalizadas_invalidas',
      mensaje:message,
    }), {
      status:200,
      headers:{'Content-Type':'application/json;charset=utf-8'},
    });
  }

  function installFetchLayer() {
    if (typeof global.fetch !== 'function' || global.__ENGLISH_LAB_FETCH_CS21A181__) return;
    var baseFetch = global.fetch.bind(global);
    global.fetch = async function englishLabFetchCS21A181(input, init) {
      var info = requestInfo(input, init || {});
      if (clean(info.fn).toLowerCase().indexOf('englishlab') < 0) return baseFetch(input, init);

      var nextInit = init ? Object.assign({}, init) : {};
      if (clean(info.fn).toLowerCase() === 'englishlabmemorymatchstartroom') {
        var parsed = parsePairs(state.draft);
        if (parsed.invalid.length) {
          return invalidPairResponse('Revisá las líneas ' + parsed.invalid.join(', ') + ': cada línea debe tener palabra = significado.');
        }
        if (parsed.pairs.length !== Number(state.pairCount || 0)) {
          return invalidPairResponse('La sala requiere exactamente ' + state.pairCount + ' parejas.');
        }
        var body = Object.assign({}, info.body || {}, {custom_pairs:parsed.pairs});
        nextInit.body = JSON.stringify(body);
      }

      // CS21A192: el polling autoritativo es mantenimiento silencioso. Mostrar el
      // overlay global en cada lectura bloqueaba las cartas y lo dejaba visible
      // casi permanentemente cuando Apps Script tardaba más de 260 ms.
      var silentPoll = !!(info.body && (info.body.silent_poll === true || clean(info.body.sync_policy) === 'CS21A192-MM-CONSISTENCY-1'));
      var loadingId = silentPoll ? '' : beginLoading(info.fn);
      try {
        var response = await baseFetch(input, nextInit);
        var raw = await response.text();
        var data = null;
        try { data = raw ? JSON.parse(raw) : null; } catch (_) {}
        if (!data) {
          return new Response(raw, {status:response.status,statusText:response.statusText,headers:response.headers});
        }
        data = sanitizeData(data);
        updateRoomState(data, info.fn);
        return new Response(JSON.stringify(data), {
          status:response.status,
          statusText:response.statusText,
          headers:{'Content-Type':'application/json;charset=utf-8'},
        });
      } finally {
        if (loadingId) endLoading(loadingId);
      }
    };
    global.__ENGLISH_LAB_FETCH_CS21A181__ = true;
  }

  function useUxState() {
    var ReactRef = global.React;
    var current = ReactRef.useState(snapshot());
    var value = current[0];
    var setValue = current[1];
    ReactRef.useEffect(function () { return subscribe(setValue); }, []);
    return value;
  }

  function PairEditor() {
    var ReactRef = global.React;
    var h = ReactRef.createElement;
    var current = useUxState();
    if (!current.memoryMatch || current.status !== 'CREATED' || !current.suggestedPairs.length) return null;
    var parsed = parsePairs(current.draft);
    var valid = parsed.invalid.length === 0 && parsed.pairs.length === Number(current.pairCount || 0);
    var validation = valid
      ? 'Lista lista para iniciar.'
      : (parsed.invalid.length
        ? 'Revisá las líneas ' + parsed.invalid.join(', ') + '.'
        : 'Se requieren exactamente ' + current.pairCount + ' parejas.');

    return h('section', {className:'elive-cs181-editor','data-version':VERSION},
      h('div', {className:'elive-cs181-editor-head'},
        h('div', null,
          h('div', {className:'elive-cs181-editor-kicker'}, 'Palabras sugeridas'),
          h('h2', null, 'Revisá las parejas antes de compartir la sala')
        ),
        h('span', {className:'elive-cs181-count','data-valid':valid ? 'true' : 'false'}, parsed.pairs.length + '/' + current.pairCount + ' parejas')
      ),
      h('div', {className:'elive-cs181-help'},
        'Una pareja por línea con el formato ',
        h('strong', null, 'palabra = significado'),
        '. Podés sustituir las sugerencias por vocabulario propio; una palabra sola no sirve para Memory Match.'
      ),
      h('textarea', {
        value:current.draft,
        rows:Math.max(6, Math.min(12, Number(current.pairCount || 6))),
        spellCheck:'false',
        'aria-label':'Parejas de palabras para Memory Match',
        onChange:function (event) {
          state.draft = event.target.value;
          state.dirty = true;
          publish();
        },
      }),
      h('div', {className:'elive-cs181-editor-actions'},
        h('div', {className:'elive-cs181-validation','data-valid':valid ? 'true' : 'false'}, validation),
        h('button', {
          type:'button',
          className:'btn btn-ghost',
          onClick:function () {
            state.draft = pairText(state.suggestedPairs);
            state.dirty = false;
            publish();
          },
        }, 'Restaurar sugeridas')
      )
    );
  }

  function wrapTeacherComponent(Base) {
    if (typeof Base !== 'function' || Base.__cs21a181Wrapped) return Base;
    var Wrapped = function EnglishLabLiveTeacherViewCS21A181(props) {
      var ReactRef = global.React;
      return ReactRef.createElement(ReactRef.Fragment, null,
        ReactRef.createElement(PairEditor, null),
        ReactRef.createElement(Base, props)
      );
    };
    Wrapped.__cs21a181Wrapped = true;
    Wrapped.__cs21a181Base = Base;
    return Wrapped;
  }

  function hookTeacherComponent() {
    var name = 'EnglishLabLiveTeacherView';
    var stored = typeof global[name] === 'function' ? wrapTeacherComponent(global[name]) : global[name];
    try {
      Object.defineProperty(global, name, {
        configurable:true,
        enumerable:true,
        get:function () { return stored; },
        set:function (value) { stored = wrapTeacherComponent(value); },
      });
    } catch (_) {
      if (typeof global[name] === 'function') global[name] = wrapTeacherComponent(global[name]);
    }
  }

  function sanitizeEnglishLabDom(root) {
    var scope = root || document;
    var candidates = [];
    if (scope.nodeType === 3) candidates.push(scope);
    if (scope.querySelectorAll) {
      scope.querySelectorAll('[data-screen-label*="English LAB"], [data-screen-label*="English LAB"] *').forEach(function (element) {
        element.childNodes.forEach(function (node) {
          if (node.nodeType === 3) candidates.push(node);
        });
      });
    }
    candidates.forEach(function (node) {
      var next = sanitizeString(node.nodeValue || '');
      if (next !== node.nodeValue) node.nodeValue = next;
    });
  }

  function installDomSanitizer() {
    var run = function () { sanitizeEnglishLabDom(document); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, {once:true});
    else run();
    try {
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) { sanitizeEnglishLabDom(node); });
        });
      });
      observer.observe(document.documentElement, {childList:true,subtree:true});
    } catch (_) {}
  }

  injectStyles();
  installFetchLayer();
  hookTeacherComponent();
  installDomSanitizer();

  global.EnglishLabUxCS21A181 = {
    version:VERSION,
    snapshot:snapshot,
    parsePairs:parsePairs,
  };
  global.__ENGLISH_LAB_UX_CS21A181__ = true;
})(window);
