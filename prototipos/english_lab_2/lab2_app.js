/* English Lab 2.0 · pantallas: inicio, episodio, escena y resultado.
 * Expone window.EnglishLab2View (componente) y LAB2.mount(elemento, opciones).
 * En el prototipo no hay sesión del campus: se usa un perfil de demostración.
 */
(function () {
  'use strict';
  var LAB2 = window.LAB2;
  var R = window.React;
  var h = R.createElement;
  var useState = R.useState, useEffect = R.useEffect, useRef = R.useRef;
  var SKILL_ES = { listening: 'Escucha', reading: 'Lectura', writing: 'Escritura', speaking: 'Habla' };

  function userKeyOf(usuario) {
    var raw = usuario && (usuario.cedula || usuario.CEDULA || usuario.codigo || usuario.CODIGO);
    return raw ? String(raw).replace(/[^A-Za-z0-9]/g, '') : 'demo';
  }
  function interactive(scene) { return scene.steps.filter(function (s) { return s.kind !== 'line'; }); }
  function partOfDay(clock) {
    var hour = parseInt(String(clock || '12:00').split(':')[0], 10);
    if (hour >= 5 && hour < 12) return { id: 'morning', es: 'mañana' };
    if (hour >= 12 && hour < 18) return { id: 'afternoon', es: 'tarde' };
    return { id: 'night', es: 'noche' };
  }
  function clock12(clock) {
    var p = String(clock || '12:00').split(':'); var hh = parseInt(p[0], 10);
    return ((hh % 12) || 12) + ':' + p[1] + (hh < 12 ? ' a. m.' : ' p. m.');
  }

  function Skills(props) {
    return h('ul', { className: 'l2-skills', 'aria-label': 'Habilidades' }, props.list.map(function (s) { return h('li', { key: s }, SKILL_ES[s] || s); }));
  }
  function StatusTag(props) {
    return h('span', { className: 'l2-status', title: 'Estado de revisión académica' }, props.status);
  }

  /* ---------- Inicio ---------- */
  function Home(props) {
    var content = props.content, state = props.state;
    var lv = useState('B1'); var levelId = lv[0], setLevelId = lv[1];
    var nm = useState(state.player ? state.player.name : LAB2.cleanName(props.suggestedName)); var draft = nm[0], setDraft = nm[1];
    var ed = useState(!state.player); var editing = ed[0], setEditing = ed[1];
    var level = content.levels.filter(function (l) { return l.id === levelId; })[0];
    var stops = content.stops[levelId] || [];
    var allScenes = content.episodes.reduce(function (acc, e) { return acc.concat(e.scenes); }, []);
    var stamps = allScenes.filter(function (s) { return state.scenes[s.id] && state.scenes[s.id].completed; }).length;
    function saveName(e) {
      e.preventDefault();
      var name = LAB2.cleanName(draft);
      if (!name) return;
      props.onPlayer({ name: name }); setEditing(false);
    }
    return h('div', { className: 'l2-home' },
      h('header', { className: 'l2-hero' },
        h('p', { className: 'l2-kicker' }, 'English Lab · Academia Norteamericana'),
        h('h1', null, 'Northbound'),
        h('p', { className: 'l2-lede' }, 'Llegás a ' + content.city + ', una ciudad donde nadie habla español. Cada unidad del curso es un episodio de tu vida ahí, y para avanzar tenés que resolverlo en inglés.')
      ),
      h('section', { className: 'l2-pass', 'aria-label': 'Tu pasaporte' },
        editing || !state.player ? h('form', { className: 'l2-pass-form', onSubmit: saveName },
          h('label', { htmlFor: 'l2-name' }, 'Tu primer nombre, como querés que te llamen en la historia'),
          h('div', { className: 'l2-input-row' },
            h('input', { id: 'l2-name', className: 'l2-input', type: 'text', value: draft, maxLength: 14, autoComplete: 'given-name',
              onChange: function (e) { setDraft(e.target.value); } }),
            h('button', { type: 'submit', className: 'l2-btn l2-btn-go', disabled: !LAB2.cleanName(draft) }, 'Guardar'))
        ) : h('div', { className: 'l2-pass-row' },
          h('div', null,
            h('p', { className: 'l2-pass-label' }, 'Pasaporte de'),
            h('p', { className: 'l2-pass-name' }, state.player.name)),
          h('div', null,
            h('p', { className: 'l2-pass-label' }, 'Sellos'),
            h('p', { className: 'l2-pass-name' }, stamps + ' de ' + allScenes.length)),
          h('button', { type: 'button', className: 'l2-btn l2-btn-quiet', onClick: function () { setEditing(true); } }, 'Cambiar nombre'))
      ),
      h('nav', { className: 'l2-route', 'aria-label': 'Niveles' },
        content.levels.map(function (l, i) {
          return h('button', { key: l.id, type: 'button', 'aria-pressed': l.id === levelId,
            className: 'l2-route-stop' + (l.id === levelId ? ' is-on' : ''), onClick: function () { setLevelId(l.id); } },
            h('span', { className: 'l2-route-dot', 'aria-hidden': 'true' }, i + 1),
            h('span', { className: 'l2-route-name' }, l.name),
            h('span', { className: 'l2-route-arc', lang: 'en' }, l.arc));
        })),
      h('section', { className: 'l2-level' },
        h('h2', null, level.name, h('span', { lang: 'en' }, ' · ' + level.arc)),
        h('p', { className: 'l2-level-arc' }, level.arc_es),
        !level.ready ? h('p', { className: 'l2-empty' }, 'Este nivel todavía no tiene episodios. Se construye después de validar Básico I.') :
        h('ol', { className: 'l2-stops' }, stops.map(function (stop) {
          var ep = stop.episode ? content.episodes.filter(function (e) { return e.id === stop.episode; })[0] : null;
          var doneCount = ep ? ep.scenes.filter(function (s) { return state.scenes[s.id] && state.scenes[s.id].completed; }).length : 0;
          var begun = ep ? ep.scenes.some(function (s) { return state.scenes[s.id] && state.scenes[s.id].started; }) : false;
          return h('li', { key: stop.unit, className: 'l2-stop' + (ep ? ' is-open' : '') },
            h('span', { className: 'l2-stop-num' }, 'Unidad ' + stop.unit),
            h('div', { className: 'l2-stop-body' },
              ep ? h('h3', { lang: 'en' }, ep.title) : null,
              h('p', null, stop.topic),
              ep ? h('p', { className: 'l2-stop-meta' }, doneCount + ' de ' + ep.scenes.length + ' escenas completadas') : h('p', { className: 'l2-stop-meta' }, 'Próximamente')),
            ep ? h('button', { type: 'button', className: 'l2-btn l2-btn-go', disabled: !state.player,
              onClick: function () { props.onOpen(ep.id); } }, begun ? 'Continuar' : 'Entrar') : null);
        })),
        level.ready && !state.player ? h('p', { className: 'l2-note' }, 'Guardá tu nombre arriba para entrar al primer episodio.') : null
      )
    );
  }

  /* ---------- Episodio ---------- */
  function Episode(props) {
    var ep = props.episode, state = props.state;
    var next = ep.scenes.filter(function (s) { return !(state.scenes[s.id] && state.scenes[s.id].completed); })[0];
    return h('div', { className: 'l2-episode' },
      h('button', { type: 'button', className: 'l2-back', onClick: props.onBack }, '← Todos los episodios'),
      h('header', { className: 'l2-ep-head' },
        h('p', { className: 'l2-kicker' }, 'Básico I · Unidad ' + ep.unit + ' · Episodio ' + ep.number, ' ', h(StatusTag, { status: ep.status })),
        h('h1', { lang: 'en' }, ep.title),
        h('p', { className: 'l2-place', lang: 'en' }, ep.place),
        h('p', { className: 'l2-lede' }, ep.story_es)),
      h('details', { className: 'l2-objectives' },
        h('summary', null, 'Qué practicás en este episodio'),
        h('ul', null, ep.syllabus.objectives.map(function (o, i) { return h('li', { key: i }, o); })),
        h('p', { className: 'l2-note' }, 'Fuente: ' + ep.syllabus.source + '.')),
      h('ol', { className: 'l2-scenes' }, ep.scenes.map(function (scene, i) {
        var rec = state.scenes[scene.id] || LAB2.emptyScene();
        var total = interactive(scene).length;
        var label = rec.completed ? 'Repetir' : (rec.resume ? 'Retomar' : 'Jugar');
        var meta = rec.completed
          ? 'Completada · mejor resultado: ' + rec.bestFirstTry + ' de ' + total + ' a la primera · ' + rec.attempts + (rec.attempts === 1 ? ' intento' : ' intentos')
          : rec.resume ? 'En curso · vas por el paso ' + (rec.resume.step + 1) + ' de ' + scene.steps.length
          : rec.started ? 'Iniciada, sin terminar' : 'Nueva';
        return h('li', { key: scene.id, className: 'l2-scene-card' + (rec.completed ? ' is-done' : '') + (next && next.id === scene.id ? ' is-next' : '') },
          h('div', { className: 'l2-scene-stage' },
            h('span', { className: 'l2-scene-n', 'aria-hidden': 'true' }, i + 1),
            h('span', null, scene.stage),
            next && next.id === scene.id ? h('em', null, 'Sigue esta') : null,
            rec.completed ? h('em', { className: 'l2-stamp-mini' + (rec.bestFirstTry / total >= 0.8 ? ' is-gold' : '') }, rec.bestFirstTry / total >= 0.8 ? 'Sello dorado' : 'Sello') : null),
          h('h2', { lang: 'en' }, scene.title),
          h('p', { className: 'l2-scene-goal' }, scene.goal_es),
          h('p', { className: 'l2-scene-why' }, scene.why_es),
          h(Skills, { list: scene.skills }),
          h('p', { className: 'l2-stop-meta' }, meta),
          h('button', { type: 'button', className: 'l2-btn ' + (rec.completed ? '' : 'l2-btn-go'), onClick: function () { props.onPlay(scene.id, false); } }, label),
          rec.resume && !rec.completed ? h('button', { type: 'button', className: 'l2-btn l2-btn-quiet', onClick: function () { props.onPlay(scene.id, true); } }, 'Empezar de nuevo') : null);
      })),
      h('p', { className: 'l2-note' }, 'Todas las escenas están abiertas y se pueden repetir. El orden es una recomendación: el Reto junta todo y no da pistas.')
    );
  }

  /* ---------- Escena ---------- */
  function Scene(props) {
    var scene = props.scene, ep = props.episode;
    var start = props.resume ? props.resume.step : 0;
    var ix = useState(start); var index = ix[0], setIndex = ix[1];
    var lg = useRef(props.resume ? props.resume.log.slice() : []);
    var top = useRef(null);
    var step = scene.steps[index];
    var Step = LAB2.steps[step.kind];
    var part = partOfDay(step.clock);
    var ctx = { player: props.player, cast: ep.cast, content: props.content, noHints: !!scene.noHints };
    useEffect(function () { if (top.current && top.current.scrollIntoView) top.current.scrollIntoView({ block: 'start' }); }, [index]);
    useEffect(function () { return function () { LAB2.voice.stop(); }; }, []);
    function done(res) {
      LAB2.voice.stop();
      if (!res.silent) lg.current.push({ i: index, kind: step.kind, firstTry: !!res.firstTry, tries: res.tries || 1, review: res.review || null, spoken: !!res.spoken });
      LAB2.emit('step-done', { scene: scene.id, index: index, kind: step.kind });
      if (index >= scene.steps.length - 1) { props.onFinish(lg.current); return; }
      props.onProgress(index + 1, lg.current);
      setIndex(index + 1);
    }
    return h('div', { className: 'l2-scene l2-sky-' + part.id, ref: top },
      h('div', { className: 'l2-scene-bar' },
        h('button', { type: 'button', className: 'l2-back', onClick: props.onExit }, '← Salir (queda guardado dónde vas)'),
        h('div', { className: 'l2-clock', role: 'img', 'aria-label': 'Son las ' + clock12(step.clock) + ', es de ' + part.es },
          h('span', { className: 'l2-orb', 'aria-hidden': 'true' }),
          h('span', { className: 'l2-clock-time' }, clock12(step.clock)),
          h('span', { className: 'l2-clock-part' }, part.es))),
      h('div', { className: 'l2-scene-title' },
        h('span', null, scene.stage + ' · '), h('span', { lang: 'en' }, scene.title)),
      h('div', { className: 'l2-progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': scene.steps.length, 'aria-valuenow': index,
        'aria-label': 'Paso ' + (index + 1) + ' de ' + scene.steps.length },
        scene.steps.map(function (s, i) { return h('span', { key: i, className: i < index ? 'is-past' : i === index ? 'is-now' : '' }); })),
      Step ? h(Step, { key: scene.id + ':' + index, step: step, ctx: ctx, onDone: done })
        : h('div', { className: 'l2-step' },
            h('p', { className: 'l2-feedback is-no' }, 'Este paso usa un tipo de actividad que esta versión no conoce (' + step.kind + ').'),
            h('button', { type: 'button', className: 'l2-btn', onClick: function () { done({ silent: true }); } }, 'Saltar este paso'))
    );
  }

  /* ---------- Resultado ---------- */
  function Result(props) {
    var scene = props.scene, r = props.result, rec = props.record;
    var gold = r.total > 0 && r.firstTry / r.total >= 0.8;
    var ref = useRef(null);
    useEffect(function () { if (ref.current) ref.current.focus(); }, []);
    return h('div', { className: 'l2-result' },
      h('section', { className: 'l2-ticket', 'aria-label': 'Resultado de la escena' },
        h('div', { className: 'l2-ticket-main' },
          h('p', { className: 'l2-kicker' }, scene.stage + ' completada'),
          h('h1', { lang: 'en', tabIndex: -1, ref: ref }, scene.title),
          h('dl', { className: 'l2-facts' },
            h('div', null, h('dt', null, 'A la primera'), h('dd', null, r.firstTry + ' de ' + r.total)),
            h('div', null, h('dt', null, 'Veces que jugaste esta escena'), h('dd', null, rec.attempts)),
            h('div', null, h('dt', null, 'Tu mejor resultado'), h('dd', null, rec.bestFirstTry + ' de ' + r.total))),
          h(Skills, { list: scene.skills })),
        h('div', { className: 'l2-ticket-stub' },
          h('div', { className: 'l2-stamp' + (gold ? ' is-gold' : '') },
            h('span', null, gold ? 'Sello dorado' : 'Sello'), h('strong', { lang: 'en' }, 'Port Hazel')),
          h('p', null, gold ? 'Casi todo a la primera.' : 'Escena completada. El dorado sale con 8 de cada 10 a la primera.'))),
      r.spoken ? h('p', { className: 'l2-note' }, 'Marcaste que practicaste una frase en voz alta. El sistema no puede verificar tu pronunciación; llevala a clase.') : null,
      r.review.length ? h('section', { className: 'l2-review' },
        h('h2', null, r.review.length === 1 ? 'Una cosa para repasar' : r.review.length + ' cosas para repasar'),
        h('ul', null, r.review.map(function (item, i) {
          return h('li', { key: i },
            h('p', { className: 'l2-review-q', lang: 'en' }, item.q),
            h('p', { className: 'l2-review-a' }, h('span', null, 'Respuesta: '), h('strong', { lang: 'en' }, item.a)),
            h('p', { className: 'l2-review-why' }, item.why));
        })),
        h('p', { className: 'l2-note' }, 'Repetir la escena no borra tu mejor resultado.')
      ) : h('p', { className: 'l2-clean' }, 'Sin errores en esta vuelta.'),
      h('div', { className: 'l2-actions' },
        props.next ? h('button', { type: 'button', className: 'l2-btn l2-btn-go', onClick: props.onNext }, 'Siguiente escena: ' + props.next.stage) : null,
        h('button', { type: 'button', className: 'l2-btn', onClick: props.onRepeat }, 'Repetir esta escena'),
        h('button', { type: 'button', className: 'l2-btn l2-btn-quiet', onClick: props.onEpisode }, 'Volver al episodio'))
    );
  }

  /* ---------- App ---------- */
  function AppInner(props) {
    var content = window.LAB2_CONTENT;
    var userKey = userKeyOf(props.usuario);
    var st = useState(function () { return LAB2.store.load(userKey); }); var state = st[0], setState = st[1];
    /* startEpisode: una portada externa (por ejemplo una introducción) ya pidió el nombre y abre directo el episodio. */
    var vw = useState(function () {
      var ep = props.startEpisode && state.player && content.episodes.some(function (e) { return e.id === props.startEpisode; });
      return ep ? { name: 'episode', episode: props.startEpisode } : { name: 'home' };
    }); var view = vw[0], setView = vw[1];
    function commit(next) { setState(next); LAB2.store.save(userKey, next); }
    function patchScene(id, patch) {
      var scenes = Object.assign({}, state.scenes);
      scenes[id] = Object.assign(LAB2.emptyScene(), scenes[id] || {}, patch);
      var next = { player: state.player, scenes: scenes };
      commit(next);
      return scenes[id];
    }
    var episode = view.episode ? content.episodes.filter(function (e) { return e.id === view.episode; })[0] : null;
    var scene = episode && view.scene ? episode.scenes.filter(function (s) { return s.id === view.scene; })[0] : null;

    function play(sceneId, fresh) {
      var rec = state.scenes[sceneId] || LAB2.emptyScene();
      var resume = !fresh && !rec.completed && rec.resume ? rec.resume : null;
      patchScene(sceneId, { started: true, resume: resume, lastAt: new Date().toISOString() });
      LAB2.emit('scene-start', { scene: sceneId });
      setView({ name: 'scene', episode: view.episode, scene: sceneId, resume: resume, run: Date.now() });
    }
    function finish(log) {
      var total = interactive(scene).length;
      var firstTry = log.filter(function (x) { return x.firstTry; }).length;
      var prev = state.scenes[scene.id] || LAB2.emptyScene();
      var rec = patchScene(scene.id, {
        started: true, completed: true, attempts: (prev.attempts || 0) + 1, lastFirstTry: firstTry,
        bestFirstTry: Math.max(prev.bestFirstTry || 0, firstTry), total: total, skills: scene.skills, lastAt: new Date().toISOString(), resume: null
      });
      LAB2.emit('scene-end', { scene: scene.id, firstTry: firstTry, total: total, player: state.player });
      setView({ name: 'result', episode: view.episode, scene: scene.id, record: rec,
        result: { total: total, firstTry: firstTry, spoken: log.some(function (x) { return x.spoken; }),
          review: log.filter(function (x) { return x.review; }).map(function (x) { return x.review; }) } });
    }

    var body;
    if (view.name === 'scene' && scene) {
      body = h(Scene, { key: scene.id + ':' + view.run, scene: scene, episode: episode, content: content, player: state.player, resume: view.resume,
        onProgress: function (step, log) { patchScene(scene.id, { resume: { step: step, log: log.slice() } }); },
        onFinish: finish,
        onExit: function () { setView({ name: 'episode', episode: view.episode }); } });
    } else if (view.name === 'result' && scene) {
      var idx = episode.scenes.indexOf(scene);
      var next = episode.scenes[idx + 1] || null;
      body = h(Result, { scene: scene, result: view.result, record: view.record, next: next,
        onNext: function () { play(next.id, true); },
        onRepeat: function () { play(scene.id, true); },
        onEpisode: function () { setView({ name: 'episode', episode: view.episode }); } });
    } else if (view.name === 'episode' && episode) {
      body = h(Episode, { episode: episode, state: state, onBack: function () { setView({ name: 'home' }); }, onPlay: play });
    } else {
      body = h(Home, { content: content, state: state, suggestedName: props.usuario && (props.usuario.nombre || props.usuario.NOMBRE),
        onPlayer: function (player) { commit({ player: player, scenes: state.scenes }); },
        onOpen: function (id) { setView({ name: 'episode', episode: id }); } });
    }
    return h('div', { className: 'l2-root' },
      props.preview ? h('div', { className: 'l2-preview', role: 'note' },
        h('strong', null, 'Prototipo. '), 'Contenido en estado BORRADOR IA, sin revisión docente. El avance se guarda solo en este navegador y no toca el campus ni las notas.',
        h('button', { type: 'button', className: 'l2-link', onClick: function () { LAB2.store.clear(userKey); setState(LAB2.store.load(userKey)); setView({ name: 'home' }); } }, 'Borrar mi avance de prueba'),
        h('a', { href: './presentacion.html', className: 'l2-link' }, 'Conocer Academia Norteamericana'),
        h('a', { href: 'https://wa.me/50686860097?text=Hola%2C%20quiero%20gestionar%20mi%20matr%C3%ADcula%20en%20Academia%20Norteamericana.', className: 'l2-link', target: '_blank', rel: 'noopener noreferrer' }, 'Gestionar matrícula')) : null,
      h('main', { className: 'l2-main' }, body));
  }

  // Una nueva identidad fuerza desmontaje y lectura limpia; nunca muestra el estado previo.
  function App(props) {
    var userKey = userKeyOf(props && props.usuario);
    return h(AppInner, Object.assign({}, props, { key: userKey + ':' + (props && props.preview ? 'demo' : 'campus') }));
  }
  window.EnglishLab2View = App;
  LAB2.mount = function (el, options) {
    var element = h(App, options || {});
    if (window.ReactDOM.createRoot) window.ReactDOM.createRoot(el).render(element);
    else window.ReactDOM.render(element, el);
  };
})();
