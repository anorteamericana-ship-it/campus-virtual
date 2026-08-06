/* global window, document, Response, Request, URL, MutationObserver, Event */
// F98.4-Z6-CS21A183-CURRICULUM · Guardia curricular para Ordena la oración.
// Exige cargar GRAM_02 de la unidad seleccionada, muestra el tema oficial de Apollo
// y adjunta evidencia de origen antes de crear una sala. No cambia otros juegos.
(function installSentenceOrderCurriculumGuardCS21A183(global, doc) {
  'use strict';

  if (!global || !doc || global.__ENGLISH_LAB_SENTENCE_CURRICULUM_GUARD_CS21A183__) return;

  var VERSION = 'F98.4-Z6-CS21A183-CURRICULUM';
  var curriculumUnits = [];
  var source = {gameId:'',level:'',unitId:'',itemIds:[],loadedAt:0};
  var acknowledgedKey = '';
  var scheduled = false;

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }
  function upper(value) {
    return clean(value).toUpperCase();
  }
  function unitCode(value) {
    var text = upper(value || 'U01').replace(/[\s_-]+/g, '');
    var match = text.match(/^(?:U|UNIT|UNIDAD)?0*(\d{1,2})$/);
    if (!match) return upper(value || 'U01');
    var number = Math.max(1, Math.min(16, Number(match[1]) || 1));
    return 'U' + (number < 10 ? '0' : '') + number;
  }
  function requestInfo(input, init) {
    var url = '';
    try {
      if (typeof input === 'string') url = input;
      else if (typeof URL !== 'undefined' && input instanceof URL) url = input.href;
      else if (typeof Request !== 'undefined' && input instanceof Request) url = input.url;
    } catch (_) {}
    var body = null;
    if (init && typeof init.body === 'string') {
      try { body = JSON.parse(init.body); } catch (_) {}
    }
    var fn = clean(body && body.fn);
    if (!fn && url) {
      try { fn = clean(new URL(url, global.location && global.location.href).searchParams.get('fn')); } catch (_) {}
    }
    return {fn:fn,body:body};
  }
  function responseFrom(data, original) {
    return new Response(JSON.stringify(data), {
      status:original ? original.status : 200,
      statusText:original ? original.statusText : 'OK',
      headers:{'Content-Type':'application/json;charset=utf-8'}
    });
  }
  function blocked(message, error) {
    return responseFrom({
      ok:false,
      version:VERSION,
      error:error || 'curriculum_guard',
      mensaje:message
    });
  }
  function gameMeta(data) {
    var game = data && data.game || {};
    var gameId = upper(game.game_id || game.GAME_ID || data && data.game_id);
    var match = gameId.match(/^(B1|B2|I1|I2)-(U\d{2})-GRAM-02$/);
    if (!match) return null;
    var items = Array.isArray(data && data.items) ? data.items : [];
    var validItems = items.filter(function (item) {
      return upper(item.template_id || item.TEMPLATE_ID || 'GRAM_02') === 'GRAM_02' &&
        upper(item.item_type || item.ITEM_TYPE || 'ORDER') === 'ORDER' &&
        clean(item.correct_sentence || item.CORRECT_SENTENCE);
    });
    return {
      gameId:gameId,
      level:match[1],
      unitId:match[1] + '-' + match[2],
      itemIds:validItems.map(function (item) {
        return clean(item.play_item_id || item.PLAY_ITEM_ID || item.source_item_id || item.SOURCE_ITEM_ID);
      }).filter(Boolean),
      loadedAt:Date.now()
    };
  }
  function contextFromDom() {
    var shell = doc.querySelector('.elso183-shell');
    if (!shell) return null;
    var labels = Array.prototype.slice.call(shell.querySelectorAll('label.elso183-field'));
    var groupSelect = null;
    var unitSelect = null;
    var countSelect = null;
    labels.forEach(function (label) {
      var title = clean(label.firstChild && label.firstChild.nodeValue || label.textContent).toLowerCase();
      var select = label.querySelector('select');
      if (!select) return;
      if (title.indexOf('grupo') === 0) groupSelect = select;
      else if (title.indexOf('unidad') === 0) unitSelect = select;
      else if (title.indexOf('oraciones') === 0) countSelect = select;
    });
    if (!groupSelect || !unitSelect) return {shell:shell,countSelect:countSelect};
    var groupValue = upper(groupSelect.value);
    var level = groupValue.split('-')[0];
    var unitId = level + '-' + unitCode(unitSelect.value);
    var curriculum = curriculumUnits.filter(function (item) {
      return upper(item.level_id || item.LEVEL_ID) === level &&
        upper(item.unit_id || item.UNIT_ID) === unitId;
    })[0] || null;
    return {
      shell:shell,
      groupSelect:groupSelect,
      unitSelect:unitSelect,
      countSelect:countSelect,
      level:level,
      unitId:unitId,
      key:level + '|' + unitId,
      curriculum:curriculum
    };
  }
  function element(tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function limitSentenceCount(context) {
    var select = context && context.countSelect;
    if (!select) return;
    Array.prototype.slice.call(select.options).forEach(function (option) {
      if (Number(option.value || 0) > 5) option.remove();
    });
    if (Number(select.value || 0) > 5) {
      select.value = '5';
      try { select.dispatchEvent(new Event('change', {bubbles:true})); } catch (_) {}
    }
  }
  function renderContext() {
    scheduled = false;
    var context = contextFromDom();
    if (!context || !context.shell) return;
    limitSentenceCount(context);
    var existing = context.shell.querySelector('.elso183-curriculum-guard');
    if (!context.key || !context.curriculum) {
      if (existing) existing.remove();
      return;
    }
    if (existing && existing.getAttribute('data-curriculum-key') === context.key) {
      var existingBox = existing.querySelector('input[type="checkbox"]');
      if (existingBox) existingBox.checked = acknowledgedKey === context.key;
      return;
    }
    if (existing) existing.remove();
    acknowledgedKey = '';

    var box = element('section', 'elso183-curriculum-guard');
    box.setAttribute('data-curriculum-key', context.key);
    var kicker = element('div', 'elso183-curriculum-kicker', 'Tema oficial de la unidad');
    var title = element('h3', '', clean(context.curriculum.unit_name || context.curriculum.UNIT_NAME || context.unitId));
    var objective = element('p', '', clean(context.curriculum.unit_objective_es || context.curriculum.UNIT_OBJECTIVE_ES));
    var topic = element('div', 'elso183-curriculum-topic');
    topic.appendChild(element('strong', '', 'Contenido: '));
    topic.appendChild(doc.createTextNode(clean(context.curriculum.program_topic || context.curriculum.PROGRAM_TOPIC)));
    var sourceLine = element('small', '', 'Nivel ' + context.level + ' · ' + context.unitId + ' · dificultad ' + clean(context.curriculum.difficulty_1_10 || context.curriculum.DIFFICULTY_1_10 || '—'));
    var confirmLabel = element('label', 'elso183-curriculum-confirm');
    var checkbox = doc.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = acknowledgedKey === context.key;
    checkbox.addEventListener('change', function () {
      acknowledgedKey = checkbox.checked ? context.key : '';
    });
    confirmLabel.appendChild(checkbox);
    confirmLabel.appendChild(doc.createTextNode(' Revisé que las oraciones correspondan a este tema y a esta unidad.'));

    box.appendChild(kicker);
    box.appendChild(title);
    if (objective.textContent) box.appendChild(objective);
    if (clean(context.curriculum.program_topic || context.curriculum.PROGRAM_TOPIC)) box.appendChild(topic);
    box.appendChild(sourceLine);
    box.appendChild(confirmLabel);

    var editor = context.shell.querySelector('.elso183-editor');
    var editorLabel = editor && editor.closest('label.elso183-field');
    if (editorLabel && editorLabel.parentNode) editorLabel.parentNode.insertBefore(box, editorLabel);
    else context.shell.appendChild(box);
  }
  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    if (typeof global.requestAnimationFrame === 'function') global.requestAnimationFrame(renderContext);
    else global.setTimeout(renderContext, 0);
  }
  function injectStyles() {
    if (doc.getElementById('elso183-curriculum-style')) return;
    var style = doc.createElement('style');
    style.id = 'elso183-curriculum-style';
    style.textContent = [
      '.elso183-curriculum-guard{padding:15px 16px;border:1px solid #BDE8CD;border-radius:16px;background:linear-gradient(135deg,#F1FBF5 0%,#FFF 80%);color:#344054}',
      '.elso183-curriculum-kicker{font-size:10px;font-weight:950;letter-spacing:.13em;text-transform:uppercase;color:#145C38}',
      '.elso183-curriculum-guard h3{margin:4px 0 5px;color:#001E47;font-size:18px}',
      '.elso183-curriculum-guard p{margin:0 0 8px;font-size:12.5px;line-height:1.5}',
      '.elso183-curriculum-topic{padding:9px 10px;border-radius:11px;background:#FFF;border:1px solid #D0EBDD;font-size:12px;line-height:1.45}',
      '.elso183-curriculum-guard small{display:block;margin-top:7px;color:#667085;font-size:10.5px}',
      '.elso183-curriculum-confirm{display:flex;gap:7px;align-items:flex-start;margin-top:12px;font-size:12px;font-weight:850;color:#145C38;text-transform:none!important;letter-spacing:normal!important}',
      '.elso183-curriculum-confirm input{width:18px;height:18px;margin:0;flex:0 0 auto}'
    ].join('');
    (doc.head || doc.documentElement).appendChild(style);
  }
  function installFetchLayer() {
    if (typeof global.fetch !== 'function' || global.__ENGLISH_LAB_SENTENCE_CURRICULUM_FETCH_CS21A183__) return;
    var baseFetch = global.fetch.bind(global);
    global.fetch = async function sentenceCurriculumFetchCS21A183(input, init) {
      var info = requestInfo(input, init || {});
      var name = clean(info.fn).toLowerCase();
      var nextInit = init ? Object.assign({}, init) : {};

      if (name === 'englishlabsentenceordercreateroom') {
        var body = Object.assign({}, info.body || {});
        var level = upper(body.nivel || clean(body.cod_grupo).split('-')[0]);
        var fullUnit = level + '-' + unitCode(body.unit || body.unidad);
        var key = level + '|' + fullUnit;
        if (!source.gameId || source.level !== level || source.unitId !== fullUnit) {
          return blocked('Cargá primero las sugerencias de la unidad seleccionada. Así se garantiza que el juego use el tema correcto de Apollo.', 'curriculum_source_required');
        }
        if (acknowledgedKey !== key) {
          return blocked('Confirmá que revisaste el tema oficial y que las oraciones corresponden a esta unidad.', 'curriculum_acknowledgement_required');
        }
        if (Number(body.sentence_count || 0) > source.itemIds.length || Number(body.sentence_count || 0) > 5) {
          return blocked('Esta unidad dispone de ' + source.itemIds.length + ' oraciones curriculares. Elegí entre 3 y ' + Math.min(5, source.itemIds.length) + '.', 'curriculum_sentence_count_exceeded');
        }
        body.source_game_id = source.gameId;
        body.source_item_ids = source.itemIds.slice();
        body.curriculum_source_loaded = true;
        body.curriculum_acknowledged = true;
        nextInit.body = JSON.stringify(body);
      }

      var response = await baseFetch(input, nextInit);
      if (name !== 'academiaplaybankgetgame' && name !== 'englishlabsentenceorderteacherdata') return response;
      var raw = await response.text();
      var data = null;
      try { data = raw ? JSON.parse(raw) : null; } catch (_) {}
      if (!data) return new Response(raw, {status:response.status,statusText:response.statusText,headers:response.headers});

      if (name === 'academiaplaybankgetgame' && data.ok === true) {
        var nextSource = gameMeta(data);
        if (nextSource && nextSource.itemIds.length) {
          source = nextSource;
          acknowledgedKey = '';
          scheduleRender();
        }
      }
      if (name === 'englishlabsentenceorderteacherdata' && data.ok === true) {
        curriculumUnits = Array.isArray(data.curriculum_units) ? data.curriculum_units : [];
        scheduleRender();
      }
      return responseFrom(data, response);
    };
    global.__ENGLISH_LAB_SENTENCE_CURRICULUM_FETCH_CS21A183__ = true;
  }

  injectStyles();
  installFetchLayer();
  doc.addEventListener('change', function (event) {
    if (event.target && event.target.closest && event.target.closest('.elso183-shell')) {
      var before = contextFromDom();
      if (!before || acknowledgedKey !== before.key) acknowledgedKey = '';
      scheduleRender();
    }
  });
  if (typeof MutationObserver === 'function') {
    new MutationObserver(scheduleRender).observe(doc.documentElement, {subtree:true,childList:true});
  }
  global.addEventListener('hashchange', scheduleRender);

  global.EnglishLabSentenceOrderCurriculumGuardCS21A183 = {
    version:VERSION,
    getState:function () {
      return {
        source:Object.assign({}, source, {itemIds:source.itemIds.slice()}),
        curriculumUnits:curriculumUnits.slice(),
        acknowledgedKey:acknowledgedKey
      };
    },
    run:renderContext
  };
  global.__ENGLISH_LAB_SENTENCE_CURRICULUM_GUARD_CS21A183__ = true;
  scheduleRender();
})(window, document);
