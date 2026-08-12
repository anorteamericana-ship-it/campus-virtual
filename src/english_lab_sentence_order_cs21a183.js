/* global window, document, React, Response, Request, URL, MutationObserver */
// F98.4-Z6-CS21A183 · Ordena la oración en English LAB Live.
// Capa aditiva: consola docente, editor de oraciones y tablero estudiantil sincronizado.
(function installSentenceOrderLiveCS21A183(global, doc) {
  'use strict';

  if (!global || !doc || global.__ENGLISH_LAB_SENTENCE_ORDER_CS21A183__) return;

  var VERSION = 'F98.4-Z6-CS21A183';
  var GAME_CODE = 'SENTENCE_ORDER';
  var listeners = [];
  var playerState = {active:false,data:null,roomCode:'',updatedAt:0};

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }
  function upper(value) {
    return clean(value).toUpperCase();
  }
  function token() {
    try { return global.getSessionToken ? global.getSessionToken() : ''; }
    catch (_) { return ''; }
  }
  function publishPlayer(next) {
    playerState = Object.assign({}, playerState, next || {}, {updatedAt:Date.now()});
    listeners.slice().forEach(function (listener) {
      try { listener(playerState); } catch (_) {}
    });
  }
  function subscribePlayer(listener) {
    listeners.push(listener);
    return function () { listeners = listeners.filter(function (item) { return item !== listener; }); };
  }
  function usePlayerStore() {
    var current = global.React.useState(playerState);
    var value = current[0];
    var setValue = current[1];
    global.React.useEffect(function () { return subscribePlayer(setValue); }, []);
    return value;
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
  async function post(fn, payload, timeoutMs) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? global.setTimeout(function () { controller.abort(); }, Number(timeoutMs || 40000)) : null;
    try {
      var base = clean(global.APPS_SCRIPT_URL);
      if (!base) throw new Error('No se encontró la conexión de English LAB.');
      var response = await global.fetch(base + '?fn=' + encodeURIComponent(fn), {
        method:'POST',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify(Object.assign({fn:fn,token:token()}, payload || {})),
        signal:controller ? controller.signal : undefined
      });
      var raw = await response.text();
      var data = null;
      try { data = raw ? JSON.parse(raw) : null; } catch (_) {}
      if (!response.ok || !data || data.ok === false) {
        throw new Error(data && (data.mensaje || data.message || data.error) || ('HTTP ' + response.status));
      }
      return data;
    } catch (error) {
      if (error && error.name === 'AbortError') throw new Error('La respuesta está tardando más de lo esperado.');
      throw error;
    } finally {
      if (timer) global.clearTimeout(timer);
    }
  }

  function parseSentenceDraft(value, expected) {
    var seen = {};
    var invalid = [];
    var sentences = String(value || '').split(/\r?\n/).map(function (line, index) {
      var sentence = clean(line);
      if (!sentence) return null;
      var words = sentence.split(/\s+/).filter(Boolean);
      var key = upper(sentence);
      if (words.length < 3 || words.length > 18 || seen[key]) {
        invalid.push(index + 1);
        return null;
      }
      seen[key] = true;
      return {sentence:sentence};
    }).filter(Boolean);
    return {
      sentences:sentences,
      invalid:invalid,
      valid:invalid.length === 0 && sentences.length === Number(expected || 0)
    };
  }
  function sentenceText(items) {
    return (Array.isArray(items) ? items : []).map(function (item) {
      return clean(item && (item.sentence || item.correct_sentence || item.CORRECT_SENTENCE));
    }).filter(Boolean).join('\n');
  }
  function levelLabel(value) {
    return ({B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'}[upper(value)] || clean(value) || 'Nivel');
  }
  function unitCode(value) {
    var text = upper(value || 'U01').replace(/[\s_-]+/g, '');
    var match = text.match(/^(?:U|UNIT|UNIDAD)?0*(\d{1,2})$/);
    if (!match) return upper(value || 'U01');
    var number = Math.max(1, Math.min(16, Number(match[1]) || 1));
    return 'U' + (number < 10 ? '0' : '') + number;
  }
  function roomCode(room) {
    return upper(room && (room.room_code || room.ROOM_CODE || room.room_id || room.ROOM_ID));
  }
  function groupCode(group) {
    return clean(typeof group === 'string' ? group : group && (group.code || group.cod_grupo || group.codigo || group.grupo));
  }
  function groupLevel(group) {
    var code = groupCode(group);
    return upper(group && (group.nivelId || group.nivel || group.NIVEL) || code.split('-')[0] || 'B1');
  }
  function groupTitle(group) {
    var code = groupCode(group);
    var days = clean(group && (group.dias_label || group.dias || group.diasCode));
    var start = clean(group && (group.hora_i || group.hora_inicio));
    var end = clean(group && (group.hora_f || group.hora_fin));
    return [levelLabel(groupLevel(group)),days,[start,end].filter(Boolean).join(' a '),code].filter(Boolean).join(' · ');
  }
  function isSentenceRoom(room) {
    return upper(room && (room.game_code || room.GAME_CODE || room.game_id)) === GAME_CODE;
  }
  function copyText(value) {
    var text = clean(value);
    if (!text) return Promise.resolve(false);
    try {
      if (global.navigator && global.navigator.clipboard && global.navigator.clipboard.writeText) {
        return global.navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () { return false; });
      }
    } catch (_) {}
    try {
      var area = doc.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      doc.body.appendChild(area);
      area.select();
      var ok = doc.execCommand('copy');
      doc.body.removeChild(area);
      return Promise.resolve(!!ok);
    } catch (_) { return Promise.resolve(false); }
  }

  function installStyles() {
    if (doc.getElementById('elso183-style')) return;
    var style = doc.createElement('style');
    style.id = 'elso183-style';
    style.textContent = [
      '.elso183-shell{max-width:1180px;margin:0 auto 18px;font-family:var(--f-sans,Poppins,sans-serif)}',
      '.elso183-panel{border:1px solid #B7D5FF;border-radius:22px;background:#FFF;box-shadow:0 12px 30px rgba(7,59,122,.08);overflow:hidden}',
      '.elso183-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:18px 20px;background:linear-gradient(135deg,#EEF4FF 0%,#FFF 72%);border-bottom:1px solid #D9E8FF;flex-wrap:wrap}',
      '.elso183-kicker{font-size:10.5px;font-weight:950;letter-spacing:.14em;text-transform:uppercase;color:#7A1E2C}',
      '.elso183-head h2,.elso183-card h3{margin:4px 0 0;color:#001E47}',
      '.elso183-head p{margin:7px 0 0;color:#475467;font-size:13px;line-height:1.5;max-width:720px}',
      '.elso183-body{padding:18px 20px;display:grid;gap:16px}',
      '.elso183-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}',
      '.elso183-field{display:grid;gap:6px;font-size:11px;font-weight:900;color:#475467;text-transform:uppercase;letter-spacing:.05em}',
      '.elso183-field select,.elso183-field input,.elso183-editor{box-sizing:border-box;width:100%;min-height:44px;border:1px solid #D0D5DD;border-radius:12px;background:#FFF;color:#001E47;padding:10px 12px;font:600 13px/1.4 var(--f-sans,Poppins,sans-serif);text-transform:none;letter-spacing:normal}',
      '.elso183-editor{min-height:150px;resize:vertical;font-family:var(--f-mono,JetBrains Mono,monospace);line-height:1.55}',
      '.elso183-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
      '.elso183-status{padding:10px 12px;border-radius:12px;font-size:12.5px;font-weight:800;line-height:1.45}',
      '.elso183-status[data-tone="ok"]{background:#EAF8EF;color:#145C38;border:1px solid #BDE8CD}',
      '.elso183-status[data-tone="warn"]{background:#FFF7E6;color:#7A4B00;border:1px solid #FFD88A}',
      '.elso183-status[data-tone="err"]{background:#FDECEA;color:#8B1F1F;border:1px solid #F5B5B5}',
      '.elso183-status[data-tone="info"]{background:#EEF4FF;color:#073B7A;border:1px solid #B7D5FF}',
      '.elso183-card{padding:16px;border:1px solid #E4E7EC;border-radius:17px;background:#FFF}',
      '.elso183-room-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}',
      '.elso183-room-code{font:950 24px/1 var(--f-mono,JetBrains Mono,monospace);color:#001E47}',
      '.elso183-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:8px}',
      '.elso183-metric{padding:11px;border-radius:13px;background:#F8FAFC;border:1px solid #E4E7EC}',
      '.elso183-metric span{display:block;font-size:9.5px;font-weight:950;text-transform:uppercase;color:#667085}',
      '.elso183-metric strong{display:block;margin-top:3px;font-size:21px;color:#001E47}',
      '.elso183-token-zone{min-height:70px;padding:12px;border:1px dashed #98A2B3;border-radius:16px;background:#F8FAFC;display:flex;gap:8px;align-items:flex-start;align-content:flex-start;flex-wrap:wrap}',
      '.elso183-token-zone[data-zone="answer"]{background:#EEF4FF;border-style:solid;border-color:#B7D5FF}',
      '.elso183-token{border:1px solid #B7D5FF;border-radius:12px;background:#FFF;color:#001E47;padding:10px 12px;font:850 14px/1.2 var(--f-sans,Poppins,sans-serif);cursor:pointer;box-shadow:0 4px 10px rgba(7,59,122,.06)}',
      '.elso183-token:hover{border-color:#073B7A;transform:translateY(-1px)}',
      '.elso183-round-title{font-size:26px;font-weight:950;color:#001E47;line-height:1.15}',
      '.elso183-hint{padding:10px 12px;border-radius:12px;background:#FFF7E6;border:1px solid #FFD88A;color:#7A4B00;font-size:12.5px}',
      '.elso183-rank{display:grid;gap:6px}',
      '.elso183-rank-row{display:grid;grid-template-columns:28px 1fr auto;gap:8px;align-items:center;padding:8px 10px;border-radius:11px;background:#F8FAFC;font-size:12px}',
      '.elso183-rank-row strong{color:#001E47}',
      '.elso183-player-layout{max-width:980px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:14px;align-items:start}',
      '@media(max-width:820px){.elso183-player-layout{grid-template-columns:1fr}.elso183-head,.elso183-body{padding:15px}.elso183-actions>.btn{width:100%;justify-content:center}.elso183-round-title{font-size:22px}}'
    ].join('');
    (doc.head || doc.documentElement).appendChild(style);
  }

  function installFetchLayer() {
    if (typeof global.fetch !== 'function' || global.__ENGLISH_LAB_SENTENCE_FETCH_CS21A183__) return;
    var baseFetch = global.fetch.bind(global);
    global.fetch = async function sentenceOrderFetchCS21A183(input, init) {
      var info = requestInfo(input, init || {});
      var response = await baseFetch(input, init);
      if (clean(info.fn).toLowerCase().indexOf('englishlab') < 0) return response;
      var raw = await response.text();
      var data = null;
      try { data = raw ? JSON.parse(raw) : null; } catch (_) {}
      if (!data) return new Response(raw, {status:response.status,statusText:response.statusText,headers:response.headers});
      var name = clean(info.fn).toLowerCase();
      if (name === 'englishlablivegetteacherdata' && Array.isArray(data.rooms)) {
        data.rooms = data.rooms.filter(function (room) { return !isSentenceRoom(room); });
      }
      if (data.ok === true && data.sentence_order === true && data.player) {
        publishPlayer({active:true,data:data,roomCode:roomCode(data.room) || playerState.roomCode});
      }
      return new Response(JSON.stringify(data), {
        status:response.status,
        statusText:response.statusText,
        headers:{'Content-Type':'application/json;charset=utf-8'}
      });
    };
    global.__ENGLISH_LAB_SENTENCE_FETCH_CS21A183__ = true;
  }

  function Status(props) {
    var h = global.React.createElement;
    return h('div', {className:'elso183-status','data-tone':props.tone || 'info'}, props.children);
  }
  function Metric(props) {
    var h = global.React.createElement;
    return h('div', {className:'elso183-metric'}, h('span', null, props.label), h('strong', null, props.value));
  }
  function Ranking(props) {
    var h = global.React.createElement;
    var rows = Array.isArray(props.rows) ? props.rows.slice(0, 8) : [];
    return h('div', {className:'elso183-rank'},
      rows.length ? rows.map(function (row, index) {
        return h('div', {className:'elso183-rank-row',key:clean(row.cod_estudiante || row.player_id || row.nombre || index)},
          h('b', null, index + 1),
          h('strong', null, clean(row.nombre || row.name || row.cod_estudiante || 'Estudiante')),
          h('span', null, String(Number(row.points || row.puntos || 0) || 0) + ' pts')
        );
      }) : h('div', {style:{fontSize:12,color:'#667085'}}, 'El ranking aparecerá cuando lleguen respuestas.')
    );
  }

  function SentenceOrderTeacherConsole() {
    var ReactRef = global.React;
    var h = ReactRef.createElement;
    var statePair = ReactRef.useState({grupos:[],rooms:[]});
    var data = statePair[0], setData = statePair[1];
    var loadingPair = ReactRef.useState(true);
    var loading = loadingPair[0], setLoading = loadingPair[1];
    var busyPair = ReactRef.useState(false);
    var busy = busyPair[0], setBusy = busyPair[1];
    var errorPair = ReactRef.useState('');
    var error = errorPair[0], setError = errorPair[1];
    var noticePair = ReactRef.useState('');
    var notice = noticePair[0], setNotice = noticePair[1];
    var groupPair = ReactRef.useState('');
    var selectedGroup = groupPair[0], setSelectedGroup = groupPair[1];
    var unitPair = ReactRef.useState('U01');
    var unit = unitPair[0], setUnit = unitPair[1];
    var modePair = ReactRef.useState('INDIVIDUAL');
    var mode = modePair[0], setMode = modePair[1];
    var countPair = ReactRef.useState(5);
    var count = countPair[0], setCount = countPair[1];
    var draftPair = ReactRef.useState('');
    var draft = draftPair[0], setDraft = draftPair[1];
    var controlPair = ReactRef.useState(null);
    var control = controlPair[0], setControl = controlPair[1];
    var openPair = ReactRef.useState(false);
    var open = openPair[0], setOpen = openPair[1];

    var groups = Array.isArray(data.grupos) ? data.grupos : [];
    var group = groups.filter(function (item) { return groupCode(item) === selectedGroup; })[0] || groups[0] || null;
    var level = groupLevel(group);
    var parsed = parseSentenceDraft(draft, count);

    var load = ReactRef.useCallback(async function () {
      setLoading(true); setError('');
      try {
        var response = await post('englishLabSentenceOrderTeacherData', {}, 45000);
        setData(response);
        var nextGroups = Array.isArray(response.grupos) ? response.grupos : [];
        if (!selectedGroup && nextGroups.length) setSelectedGroup(groupCode(nextGroups[0]));
      } catch (loadError) { setError(loadError.message || String(loadError)); }
      finally { setLoading(false); }
    }, [selectedGroup]);

    ReactRef.useEffect(function () { load(); }, []);
    ReactRef.useEffect(function () {
      if (!control || !roomCode(control.room)) return undefined;
      var timer = global.setInterval(async function () {
        try {
          var response = await post('englishLabSentenceOrderGetRoomControl', {room_id:roomCode(control.room)}, 45000);
          setControl(response);
        } catch (_) {}
      }, 3500);
      return function () { global.clearInterval(timer); };
    }, [control && roomCode(control.room)]);

    async function loadSuggestions() {
      if (!group) { setError('Seleccioná un grupo.'); return; }
      setBusy(true); setError(''); setNotice('Buscando oraciones del banco…');
      try {
        var catalog = await post('academiaPlayBankCatalog', {}, 45000);
        var fullUnit = level + '-' + unitCode(unit);
        var games = Array.isArray(catalog.games) ? catalog.games : [];
        var candidate = games.filter(function (game) {
          return upper(game.level_id || game.LEVEL_ID) === level &&
            upper(game.unit_id || game.UNIT_ID) === fullUnit &&
            upper(game.template_id || game.TEMPLATE_ID) === 'GRAM_02';
        })[0];
        if (!candidate) throw new Error('No hay un juego Sentence Order disponible para ' + levelLabel(level) + ' · ' + unitCode(unit) + '.');
        var gameId = clean(candidate.game_id || candidate.GAME_ID || candidate.id);
        var detail = await post('academiaPlayBankGetGame', {game_id:gameId}, 45000);
        var items = Array.isArray(detail.items) ? detail.items : [];
        var suggestions = items.map(function (item) {
          return clean(item.correct_sentence || item.CORRECT_SENTENCE);
        }).filter(Boolean).slice(0, Number(count));
        if (suggestions.length < Number(count)) throw new Error('El banco solo devolvió ' + suggestions.length + ' oraciones; se requieren ' + count + '.');
        setDraft(suggestions.join('\n'));
        setNotice('Sugerencias cargadas. Revisalas antes de crear la sala.');
      } catch (suggestionError) {
        setNotice('');
        setError(suggestionError.message || String(suggestionError));
      } finally { setBusy(false); }
    }

    async function createRoom() {
      if (!group) { setError('Seleccioná un grupo.'); return; }
      if (!parsed.valid) { setError(parsed.invalid.length ? 'Revisá las líneas ' + parsed.invalid.join(', ') + '.' : 'Se requieren exactamente ' + count + ' oraciones.'); return; }
      setBusy(true); setError(''); setNotice('');
      try {
        var response = await post('englishLabSentenceOrderCreateRoom', {
          cod_grupo:groupCode(group),
          nivel:level,
          unit:unitCode(unit),
          mode:mode,
          sentence_count:Number(count),
          sentences:parsed.sentences
        }, 45000);
        setControl(response);
        setNotice('Sala creada. Compartí el código cuando el grupo esté listo.');
        await load();
      } catch (createError) { setError(createError.message || String(createError)); }
      finally { setBusy(false); }
    }

    async function openRoom(room) {
      setBusy(true); setError('');
      try { setControl(await post('englishLabSentenceOrderGetRoomControl', {room_id:roomCode(room)}, 45000)); }
      catch (openError) { setError(openError.message || String(openError)); }
      finally { setBusy(false); }
    }

    async function roomAction(fn) {
      if (!control || !roomCode(control.room)) return;
      setBusy(true); setError('');
      try {
        var response = await post(fn, {room_id:roomCode(control.room)}, 45000);
        setControl(response);
        await load();
      } catch (actionError) { setError(actionError.message || String(actionError)); }
      finally { setBusy(false); }
    }

    var currentRoom = control && control.room || null;
    var round = control && control.sentence_round || null;
    var status = upper(currentRoom && (currentRoom.status || currentRoom.STATUS));
    var recent = Array.isArray(data.rooms) ? data.rooms : [];
    var code = roomCode(currentRoom);

    return h('section', {className:'elso183-shell','data-version':VERSION},
      h('div', {className:'elso183-panel'},
        h('div', {className:'elso183-head'},
          h('div', null,
            h('div', {className:'elso183-kicker'}, 'Nuevo juego Live'),
            h('h2', null, 'Ordena la oración'),
            h('p', null, 'Cargá sugerencias de la unidad, corregí las oraciones y creá una sala para que todo el grupo responda en vivo.')
          ),
          h('button', {type:'button',className:'btn btn-ghost',onClick:function () { setOpen(!open); }}, open ? 'Ocultar configuración' : 'Preparar juego')
        ),
        open && h('div', {className:'elso183-body'},
          loading ? h(Status, null, 'Cargando grupos…') : null,
          error ? h(Status, {tone:'err'}, error) : null,
          notice ? h(Status, {tone:'ok'}, notice) : null,
          h('div', {className:'elso183-grid'},
            h('label', {className:'elso183-field'}, 'Grupo',
              h('select', {value:selectedGroup,onChange:function (event) { setSelectedGroup(event.target.value); }},
                groups.map(function (item) { return h('option', {key:groupCode(item),value:groupCode(item)}, groupTitle(item)); })
              )
            ),
            h('label', {className:'elso183-field'}, 'Unidad',
              h('select', {value:unit,onChange:function (event) { setUnit(event.target.value); }},
                Array.from({length:16}, function (_, index) { var value = 'U' + String(index + 1).padStart(2, '0'); return h('option', {key:value,value:value}, 'Unidad ' + (index + 1)); })
              )
            ),
            h('label', {className:'elso183-field'}, 'Modo',
              h('select', {value:mode,onChange:function (event) { setMode(event.target.value); }},
                h('option', {value:'INDIVIDUAL'}, 'Individual'),
                h('option', {value:'TEAMS'}, 'Equipos')
              )
            ),
            h('label', {className:'elso183-field'}, 'Oraciones',
              h('select', {value:String(count),onChange:function (event) { setCount(Number(event.target.value)); }},
                [3,4,5,6,7,8].map(function (value) { return h('option', {key:value,value:String(value)}, value + ' oraciones'); })
              )
            )
          ),
          h('div', {className:'elso183-actions'},
            h('button', {type:'button',className:'btn btn-ghost',disabled:busy || !group,onClick:loadSuggestions}, busy ? 'Cargando…' : 'Cargar sugerencias'),
            h('span', {style:{fontSize:12,fontWeight:900,color:parsed.valid ? '#145C38' : '#7A4B00'}}, parsed.sentences.length + '/' + count + ' válidas')
          ),
          h('label', {className:'elso183-field'}, 'Oraciones editables',
            h('textarea', {
              className:'elso183-editor',
              value:draft,
              rows:Math.max(6, Number(count) + 1),
              placeholder:'Una oración por línea.\nMy name is Ana.\nWhere do you live?',
              onChange:function (event) { setDraft(event.target.value); },
              'aria-label':'Oraciones para Ordena la oración'
            })
          ),
          h('div', {className:'elso183-actions'},
            h('button', {type:'button',className:'btn btn-primary',disabled:busy || !parsed.valid,onClick:createRoom}, busy ? 'Procesando…' : 'Crear sala Ordena la oración'),
            h('span', {style:{fontSize:12,color:'#667085'}}, 'Cada oración debe tener entre 3 y 18 palabras.')
          ),
          currentRoom ? h('div', {className:'elso183-card'},
            h('div', {className:'elso183-actions',style:{justifyContent:'space-between'}},
              h('div', null,h('div', {className:'elso183-kicker'}, 'Control de sala'),h('div', {className:'elso183-room-code'}, code)),
              h('div', {className:'elso183-actions'},
                h('button', {type:'button',className:'btn btn-ghost',onClick:function () { copyText(code); }}, 'Copiar código'),
                h('button', {type:'button',className:'btn btn-ghost',onClick:function () { copyText('English LAB Live · Ordena la oración\nCódigo: ' + code + '\nIngresá desde el Campus Virtual.'); }}, 'Copiar mensaje')
              )
            ),
            h('div', {className:'elso183-metrics',style:{marginTop:12}},
              h(Metric, {label:'Estado',value:status || 'Creada'}),
              h(Metric, {label:'Oración',value:String(currentRoom.current_index || currentRoom.CURRENT_INDEX || 0) + '/' + String(currentRoom.question_count || currentRoom.QUESTION_COUNT || count)}),
              h(Metric, {label:'Participantes',value:String(control.stats && control.stats.players || 0)}),
              h(Metric, {label:'Respuestas',value:String(control.answer_count || control.stats && control.stats.answers_current || 0)})
            ),
            round ? h('div', {style:{marginTop:14}},
              h('div', {className:'elso183-kicker'}, 'Vista docente'),
              h('div', {className:'elso183-round-title'}, round.prompt || 'Ordená la oración.'),
              h('div', {className:'elso183-token-zone',style:{marginTop:10}}, (round.tokens || []).map(function (item) { return h('span', {className:'elso183-token',key:item.token_id}, item.label); })),
              round.correct_sentence ? h(Status, {tone:'ok'}, 'Respuesta: ' + round.correct_sentence) : null
            ) : null,
            h('div', {className:'elso183-actions',style:{marginTop:14}},
              status === 'CREATED' ? h('button', {type:'button',className:'btn btn-primary',disabled:busy,onClick:function () { roomAction('englishLabSentenceOrderStartRoom'); }}, 'Iniciar actividad') : null,
              status === 'LIVE' ? h('button', {type:'button',className:'btn btn-primary',disabled:busy,onClick:function () { roomAction('englishLabSentenceOrderNextSentence'); }}, 'Siguiente oración') : null,
              status !== 'CLOSED' ? h('button', {type:'button',className:'btn btn-ghost',disabled:busy,onClick:function () { if (global.confirm('¿Cerrar esta sala?')) roomAction('englishLabSentenceOrderCloseRoom'); }}, 'Cerrar sala') : null
            ),
            h('div', {style:{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(220px,.45fr)',gap:12,marginTop:14}},
              h('div', {className:'elso183-card'}, h('div', {className:'elso183-kicker'}, 'Oraciones configuradas'),
                (control.suggested_sentences || []).map(function (item, index) { return h('div', {key:index,style:{padding:'7px 0',borderBottom:'1px solid #EEF2F6',fontSize:12.5,color:'#344054'}}, (index + 1) + '. ' + item.sentence); })
              ),
              h('div', {className:'elso183-card'}, h('div', {className:'elso183-kicker'}, 'Ranking'), h(Ranking, {rows:control.leaderboard || []}))
            )
          ) : null,
          recent.length ? h('div', {className:'elso183-card'},
            h('div', {className:'elso183-kicker'}, 'Salas recientes de Ordena la oración'),
            h('div', {className:'elso183-room-list',style:{marginTop:10}}, recent.slice(0,6).map(function (room) {
              return h('button', {type:'button',className:'elso183-card',key:roomCode(room),onClick:function () { openRoom(room); },style:{textAlign:'left',cursor:'pointer'}},
                h('div', {className:'elso183-room-code'}, roomCode(room)),
                h('div', {style:{marginTop:7,fontSize:12,color:'#667085'}}, clean(room.cod_grupo || room.COD_GRUPO) + ' · ' + clean(room.status || room.STATUS))
              );
            }))
          ) : null
        )
      )
    );
  }

  function SentenceOrderPlayer(props) {
    var ReactRef = global.React;
    var h = ReactRef.createElement;
    var store = usePlayerStore();
    var data = store.data || {};
    var round = data.sentence_round || null;
    var poolPair = ReactRef.useState([]);
    var pool = poolPair[0], setPool = poolPair[1];
    var answerPair = ReactRef.useState([]);
    var answer = answerPair[0], setAnswer = answerPair[1];
    var busyPair = ReactRef.useState(false);
    var busy = busyPair[0], setBusy = busyPair[1];
    // CS21A209: lock inmediato por instancia; React state no bloquea dos clicks en el mismo tick.
    var submitLockRef = ReactRef.useRef(false);
    var errorPair = ReactRef.useState('');
    var error = errorPair[0], setError = errorPair[1];
    var startedPair = ReactRef.useState(Date.now());
    var startedAt = startedPair[0], setStartedAt = startedPair[1];
    var roundKey = round ? String(round.sentence_id || round.index) + '|' + String(round.started_at || '') : '';

    ReactRef.useEffect(function () {
      submitLockRef.current = false;
      setPool(round && Array.isArray(round.tokens) ? round.tokens.slice() : []);
      setAnswer([]);
      setError('');
      setStartedAt(Date.now());
    }, [roundKey]);

    ReactRef.useEffect(function () {
      if (!store.active || !store.roomCode) return undefined;
      var timer = global.setInterval(async function () {
        try {
          var response = await post('englishLabSentenceOrderGetPlayerState', {room_code:store.roomCode}, 45000);
          publishPlayer({active:true,data:response,roomCode:store.roomCode});
        } catch (_) {}
      }, 2600);
      return function () { global.clearInterval(timer); };
    }, [store.active,store.roomCode]);

    function moveToAnswer(item) {
      if (!data.can_answer || busy) return;
      setPool(pool.filter(function (tokenItem) { return tokenItem.token_id !== item.token_id; }));
      setAnswer(answer.concat([item]));
    }
    function moveToPool(item) {
      if (!data.can_answer || busy) return;
      setAnswer(answer.filter(function (tokenItem) { return tokenItem.token_id !== item.token_id; }));
      setPool(pool.concat([item]));
    }
    async function submit() {
      if (submitLockRef.current) return;
      if (!round || answer.length !== (round.tokens || []).length) { setError('Usá todas las palabras antes de enviar.'); return; }
      submitLockRef.current = true;
      setBusy(true); setError('');
      try {
        var response = await post('englishLabSentenceOrderSubmit', {
          room_code:store.roomCode,
          ordered_token_ids:answer.map(function (item) { return item.token_id; }),
          time_ms:Math.max(0, Date.now() - startedAt)
        }, 45000);
        publishPlayer({active:true,data:response,roomCode:store.roomCode});
      } catch (submitError) { setError(submitError.message || String(submitError)); }
      finally { submitLockRef.current = false; setBusy(false); }
    }
    function leave() {
      publishPlayer({active:false,data:null,roomCode:''});
      try {
        var url = new URL(global.location.href);
        url.searchParams.delete('room');
        global.history.replaceState({}, '', url.pathname + url.search + '#english_lab_live');
      } catch (_) {}
    }

    var room = data.room || {};
    var myAnswer = data.my_answer || null;
    var resultTone = myAnswer ? (myAnswer.correct ? 'ok' : 'warn') : 'info';
    return h('div', {className:'elso183-shell','data-version':VERSION},
      h('div', {className:'elso183-head',style:{border:'1px solid #B7D5FF',borderRadius:20,marginBottom:14}},
        h('div', null,h('div', {className:'elso183-kicker'}, 'English LAB Live · Ordena la oración'),h('h2', null, roomCode(room) || store.roomCode),h('p', null, clean(room.cod_grupo || room.COD_GRUPO) + ' · ' + levelLabel(room.nivel || room.NIVEL))),
        h('button', {type:'button',className:'btn btn-ghost',onClick:leave}, 'Salir de la sala')
      ),
      error ? h(Status, {tone:'err'}, error) : null,
      h('div', {className:'elso183-player-layout'},
        h('main', {className:'elso183-panel'},
          h('div', {className:'elso183-body'},
            !round ? h(Status, null, 'Esperando que el docente inicie la actividad…') : null,
            round ? h(global.React.Fragment, null,
              h('div', {className:'elso183-kicker'}, 'Oración ' + round.index + ' de ' + round.total),
              h('div', {className:'elso183-round-title'}, round.prompt || 'Ordená las palabras.'),
              round.hint ? h('div', {className:'elso183-hint'}, round.hint) : null,
              h('div', {style:{fontSize:11,fontWeight:950,textTransform:'uppercase',color:'#667085'}}, 'Tu oración'),
              h('div', {className:'elso183-token-zone','data-zone':'answer','aria-label':'Oración construida'},
                answer.length ? answer.map(function (item) { return h('button', {type:'button',className:'elso183-token',key:item.token_id,onClick:function () { moveToPool(item); }}, item.label); }) : h('span', {style:{fontSize:12,color:'#667085'}}, 'Tocá las palabras de abajo en el orden correcto.')
              ),
              h('div', {style:{fontSize:11,fontWeight:950,textTransform:'uppercase',color:'#667085'}}, 'Palabras disponibles'),
              h('div', {className:'elso183-token-zone','aria-label':'Palabras disponibles'},
                pool.map(function (item) { return h('button', {type:'button',className:'elso183-token',key:item.token_id,onClick:function () { moveToAnswer(item); }}, item.label); })
              ),
              data.can_answer ? h('div', {className:'elso183-actions'},
                h('button', {type:'button',className:'btn btn-ghost',disabled:busy,onClick:function () { setPool((round.tokens || []).slice()); setAnswer([]); }}, 'Reiniciar'),
                h('button', {type:'button',className:'btn btn-primary',disabled:busy || answer.length !== (round.tokens || []).length,onClick:submit}, busy ? 'Enviando…' : 'Enviar respuesta')
              ) : null,
              myAnswer ? h(Status, {tone:resultTone}, myAnswer.correct ? '¡Correcto! Sumaste ' + myAnswer.points + ' puntos.' : 'Revisá el orden. La respuesta correcta es: ' + clean(round.correct_sentence)) : null,
              !data.can_answer && !myAnswer ? h(Status, null, upper(room.status || room.STATUS) === 'CLOSED' ? 'La sala terminó.' : 'Esperando la siguiente oración…') : null,
              myAnswer && round.correct_sentence ? h('div', {className:'elso-card'}, h('strong', {style:{color:'#001E47'}}, round.correct_sentence)) : null
            ) : null
          )
        ),
        h('aside', {className:'elso183-card'},
          h('div', {className:'elso183-kicker'}, 'Ranking temporal'),
          h('div', {style:{marginTop:10}}, h(Ranking, {rows:data.leaderboard || []})),
          data.my_rank ? h(Status, {tone:'info'}, 'Tu posición: ' + clean(data.my_rank.rank || data.my_rank.position || '—') + ' · ' + String(Number(data.my_rank.points || 0) || 0) + ' puntos') : null
        )
      )
    );
  }

  function wrapTeacher(Base) {
    if (typeof Base !== 'function' || Base.__cs21a183SentenceWrapped) return Base;
    var Wrapped = function EnglishLabLiveTeacherViewCS21A183(props) {
      return global.React.createElement(global.React.Fragment, null,
        global.React.createElement(SentenceOrderTeacherConsole, null),
        global.React.createElement(Base, props)
      );
    };
    Wrapped.__cs21a183SentenceWrapped = true;
    Wrapped.__cs21a183Base = Base;
    return Wrapped;
  }
  function wrapStudent(Base) {
    if (typeof Base !== 'function' || Base.__cs21a183SentenceWrapped) return Base;
    var Wrapped = function EnglishLabLiveStudentViewCS21A183(props) {
      var store = usePlayerStore();
      if (store.active && store.data && store.data.sentence_order === true) {
        return global.React.createElement(SentenceOrderPlayer, props);
      }
      return global.React.createElement(Base, props);
    };
    Wrapped.__cs21a183SentenceWrapped = true;
    Wrapped.__cs21a183Base = Base;
    return Wrapped;
  }
  function hook(name, wrapper) {
    var stored = typeof global[name] === 'function' ? wrapper(global[name]) : global[name];
    try {
      Object.defineProperty(global, name, {
        configurable:true,
        enumerable:true,
        get:function () { return stored; },
        set:function (value) { stored = wrapper(value); }
      });
    } catch (_) {
      if (typeof global[name] === 'function') global[name] = wrapper(global[name]);
    }
  }

  installStyles();
  installFetchLayer();
  hook('EnglishLabLiveTeacherView', wrapTeacher);
  hook('EnglishLabLiveStudentView', wrapStudent);

  global.EnglishLabSentenceOrderCS21A183 = {
    version:VERSION,
    parseSentences:parseSentenceDraft,
    getPlayerState:function () { return playerState; },
    resetPlayer:function () { publishPlayer({active:false,data:null,roomCode:''}); }
  };
  global.__ENGLISH_LAB_SENTENCE_ORDER_CS21A183__ = true;
})(window, document);
