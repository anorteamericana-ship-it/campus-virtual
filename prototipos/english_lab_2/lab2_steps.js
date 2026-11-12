/* English Lab 2.0 · tipos de paso (los "motores").
 * Cada paso recibe { step, ctx, onDone } y avisa una sola vez con
 *   onDone({ firstTry:boolean, tries:number, review:{ q, a, why }|null })
 * Un paso no sabe de niveles, puntos ni usuarios. Agregar una mecánica = agregar un tipo aquí.
 */
(function () {
  'use strict';
  var LAB2 = window.LAB2;
  var R = window.React;
  var h = R.createElement;
  var useState = R.useState, useMemo = R.useMemo, useRef = R.useRef, useEffect = R.useEffect;

  function castOf(ctx, id) {
    return (ctx.cast || []).filter(function (c) { return c.id === id; })[0] || { id: id, name: id, role: '', tone: 'amber' };
  }

  /* Burbuja de quien habla, con botón para escuchar. El texto siempre está visible. */
  function Speaker(props) {
    var c = castOf(props.ctx, props.who);
    var text = LAB2.fill(props.say, props.ctx.player);
    return h('div', { className: 'l2-speaker l2-tone-' + c.tone },
      h('div', { className: 'l2-avatar', 'aria-hidden': 'true' }, c.name.replace(/^Mrs?\.\s*/, '').charAt(0)),
      h('div', { className: 'l2-bubble' },
        h('div', { className: 'l2-who' }, c.name, c.role ? h('span', null, ' · ' + c.role) : null),
        h('p', { className: 'l2-say', lang: 'en' }, text),
        LAB2.voice.available() ? h('button', { type: 'button', className: 'l2-listen', onClick: function () { LAB2.voice.speak(text); } }, 'Escuchar') : null
      )
    );
  }

  function Feedback(props) {
    return h('div', { className: 'l2-feedback ' + (props.ok ? 'is-ok' : 'is-no'), role: 'status', 'aria-live': 'polite' },
      h('strong', null, props.ok ? 'Correcto.' : (props.title || 'Todavía no.')), ' ', props.children);
  }

  function Continue(props) {
    var ref = useRef(null);
    useEffect(function () { if (ref.current) ref.current.focus(); }, []);
    return h('button', { type: 'button', ref: ref, className: 'l2-btn l2-btn-go', onClick: props.onClick }, props.label || 'Continuar');
  }

  /* ---------- line: narración ---------- */
  function LineStep(props) {
    return h('div', { className: 'l2-step' },
      h('p', { className: 'l2-narration' }, LAB2.fill(props.step.text_es, props.ctx.player)),
      h(Continue, { onClick: function () { props.onDone({ firstTry: true, tries: 0, review: null, silent: true }); } })
    );
  }

  /* ---------- choice: elegir la respuesta, opciones barajadas en cada intento ---------- */
  function ChoiceStep(props) {
    var step = props.step, ctx = props.ctx;
    var options = useMemo(function () { return LAB2.shuffle(step.options.map(function (o, i) { return { o: o, id: i }; })); }, [step]);
    var s = useState([]); var wrong = s[0], setWrong = s[1];
    var d = useState(false); var done = d[0], setDone = d[1];
    var last = wrong.length ? options.filter(function (x) { return x.id === wrong[wrong.length - 1]; })[0] : null;
    function pick(item) {
      if (done) return;
      if (item.o.ok) { setDone(true); return; }
      if (wrong.indexOf(item.id) < 0) setWrong(wrong.concat([item.id]));
    }
    var right = step.options.filter(function (o) { return o.ok; })[0];
    return h('div', { className: 'l2-step' },
      h(Speaker, { ctx: ctx, who: step.who, say: step.say }),
      h('p', { className: 'l2-ask' }, step.ask_es),
      h('div', { className: 'l2-options', role: 'group', 'aria-label': 'Opciones de respuesta' },
        options.map(function (item) {
          var isWrong = wrong.indexOf(item.id) >= 0;
          var isRight = done && item.o.ok;
          return h('button', {
            key: item.id, type: 'button', lang: 'en', disabled: isWrong || (done && !item.o.ok),
            className: 'l2-option' + (isWrong ? ' is-wrong' : '') + (isRight ? ' is-right' : ''),
            onClick: function () { pick(item); }
          }, LAB2.fill(item.o.t, ctx.player));
        })
      ),
      !done && last ? h(Feedback, { ok: false }, last.o.why_es, ' Probá otra.') : null,
      done ? h(Feedback, { ok: true }, step.explain_es) : null,
      done ? h(Continue, { onClick: function () {
        props.onDone({ firstTry: wrong.length === 0, tries: wrong.length + 1,
          review: wrong.length ? { q: LAB2.fill(step.say, ctx.player), a: LAB2.fill(right.t, ctx.player), why: step.explain_es } : null });
      } }) : null
    );
  }

  /* ---------- spell: escuchar letras y escribir; pistas de sonido como alternativa sin audio ---------- */
  function SpellStep(props) {
    var step = props.step, ctx = props.ctx, content = ctx.content;
    var word = step.own ? LAB2.lettersOf(ctx.player.name) : step.word;
    var hasVoice = LAB2.voice.available();
    var v = useState(''); var value = v[0], setValue = v[1];
    var t = useState(0); var tries = t[0], setTries = t[1];
    var r = useState(null); var result = r[0], setResult = r[1];
    var p = useState(!hasVoice && !step.own); var hints = p[0], setHints = p[1];
    var g = useState(false); var gaveUp = g[0], setGaveUp = g[1];
    var done = !!(result && result.ok) || gaveUp;
    var maxTries = ctx.noHints ? 3 : 2;
    function check(e) {
      if (e) e.preventDefault();
      if (done || !LAB2.lettersOf(value)) return;
      var res = LAB2.checkSpelling(value, word, content.letterTraps);
      setResult(res);
      if (!res.ok) setTries(tries + 1);
    }
    var sounds = word.split('').map(function (ch) { return content.letterSounds[ch] || ch; });
    return h('div', { className: 'l2-step' },
      h(Speaker, { ctx: ctx, who: step.who, say: step.say }),
      h('p', { className: 'l2-ask' }, step.ask_es),
      step.own ? null : h('div', { className: 'l2-audio-row' },
        hasVoice ? h('button', { type: 'button', className: 'l2-btn', onClick: function () { LAB2.voice.spell(word, false); } }, 'Escuchar las letras') : null,
        hasVoice ? h('button', { type: 'button', className: 'l2-btn l2-btn-quiet', onClick: function () { LAB2.voice.spell(word, true); } }, 'Más lento') : null,
        !hints ? h('button', { type: 'button', className: 'l2-btn l2-btn-quiet', onClick: function () { setHints(true); } },
          hasVoice ? (ctx.noHints ? 'No escucho el audio' : 'Ver pistas de sonido') : 'Ver pistas de sonido') : null
      ),
      !hasVoice && !step.own ? h('p', { className: 'l2-note' }, 'Este navegador no tiene voz. Usá las pistas: cada tarjeta es el nombre de una letra en inglés.') : null,
      hints && !step.own ? h('ol', { className: 'l2-sounds', 'aria-label': 'Cómo suena cada letra' },
        sounds.map(function (snd, i) { return h('li', { key: i }, snd); })) : null,
      h('form', { className: 'l2-input-row', onSubmit: check },
        h('label', { className: 'l2-sr', htmlFor: 'l2-spell-input' }, 'Tu respuesta'),
        h('input', {
          id: 'l2-spell-input', className: 'l2-input l2-input-letters', type: 'text', value: value, disabled: done,
          autoComplete: 'off', autoCapitalize: 'characters', autoCorrect: 'off', spellCheck: false, maxLength: 20,
          placeholder: step.own ? 'Tu nombre' : 'Escribí las letras',
          onChange: function (e) { setValue(e.target.value.toUpperCase()); setResult(null); }
        }),
        !done ? h('button', { type: 'submit', className: 'l2-btn l2-btn-go', disabled: !LAB2.lettersOf(value) }, 'Revisar') : null
      ),
      result && !result.ok && !gaveUp ? h('div', null,
        h('div', { className: 'l2-marks', 'aria-hidden': 'true' }, result.marks.map(function (m, i) {
          return h('span', { key: i, className: m.ok ? 'is-ok' : 'is-no' }, m.ch);
        })),
        h(Feedback, { ok: false },
          result.trap || (result.lengthOff ? 'La cantidad de letras no coincide. Escuchá otra vez y contá las letras.' : 'Las letras marcadas no coinciden. Escuchá otra vez.'),
          tries >= maxTries ? h('button', { type: 'button', className: 'l2-link', onClick: function () { setGaveUp(true); } }, 'Ver la respuesta') : null)
      ) : null,
      result && result.ok ? h(Feedback, { ok: true },
        step.own ? 'Así se deletrea tu nombre en inglés: ' + sounds.join(' · ') + '.' : word.split('').join(' - ') + '.',
        step.own && hasVoice ? h('button', { type: 'button', className: 'l2-link', onClick: function () { LAB2.voice.spell(word, false); } }, 'Escuchar a ' + castOf(ctx, step.who).name) : null
      ) : null,
      gaveUp ? h(Feedback, { ok: false, title: 'La respuesta era:' }, word.split('').join(' - ') + ' (' + sounds.join(' · ') + ').') : null,
      done ? h(Continue, { onClick: function () {
        props.onDone({ firstTry: tries === 0 && !gaveUp, tries: tries + (gaveUp ? 0 : 1),
          review: tries > 0 || gaveUp ? { q: 'Deletreo: ' + sounds.join(' · '), a: word, why: (result && result.trap) || 'Repasá el nombre de las letras en inglés.' } : null });
      } }) : null
    );
  }

  /* ---------- build: armar la frase con fichas, con distractores ---------- */
  function BuildStep(props) {
    var step = props.step, ctx = props.ctx;
    var answer = useMemo(function () { return step.answer.map(function (w) { return LAB2.fill(w, ctx.player); }); }, [step, ctx.player.name]);
    var tiles = useMemo(function () {
      return LAB2.shuffleDifferent(answer.concat(step.extra || []).map(function (w, i) { return { w: w, id: i }; }));
    }, [answer]);
    var b = useState([]); var built = b[0], setBuilt = b[1];
    var t = useState(0); var tries = t[0], setTries = t[1];
    var st = useState(''); var status = st[0], setStatus = st[1];
    var done = status === 'ok' || status === 'shown';
    function add(tile) { if (!done) { setBuilt(built.concat([tile])); setStatus(''); } }
    function remove(tile) { if (!done) { setBuilt(built.filter(function (x) { return x.id !== tile.id; })); setStatus(''); } }
    function check() {
      if (built.map(function (x) { return x.w; }).join(' ') === answer.join(' ')) setStatus('ok');
      else { setTries(tries + 1); setStatus('no'); }
    }
    var left = tiles.filter(function (x) { return !built.some(function (y) { return y.id === x.id; }); });
    var usedExtra = built.filter(function (x) { return (step.extra || []).indexOf(x.w) >= 0 && answer.indexOf(x.w) < 0; })[0];
    return h('div', { className: 'l2-step' },
      h(Speaker, { ctx: ctx, who: step.who, say: step.say }),
      h('p', { className: 'l2-ask' }, step.ask_es),
      h('div', { className: 'l2-line' + (status ? ' is-' + status : ''), 'aria-label': 'Tu frase', lang: 'en' },
        built.length ? built.map(function (tile) {
          return h('button', { key: tile.id, type: 'button', className: 'l2-tile is-placed', disabled: done, onClick: function () { remove(tile); }, 'aria-label': 'Quitar ' + tile.w }, tile.w);
        }) : h('span', { className: 'l2-line-empty' }, 'Tocá las palabras en orden')),
      h('div', { className: 'l2-tiles', role: 'group', 'aria-label': 'Palabras disponibles', lang: 'en' },
        left.map(function (tile) {
          return h('button', { key: tile.id, type: 'button', className: 'l2-tile', disabled: done, onClick: function () { add(tile); } }, tile.w);
        })),
      !done ? h('div', { className: 'l2-actions' },
        h('button', { type: 'button', className: 'l2-btn l2-btn-go', disabled: !built.length, onClick: check }, 'Revisar'),
        built.length ? h('button', { type: 'button', className: 'l2-btn l2-btn-quiet', onClick: function () { setBuilt([]); setStatus(''); } }, 'Borrar') : null) : null,
      status === 'no' ? h(Feedback, { ok: false },
        usedExtra ? 'La palabra "' + usedExtra.w + '" sobra en esta frase.' : (built.length !== answer.length ? 'Faltan o sobran palabras.' : 'Las palabras están, pero en otro orden.'),
        tries >= (ctx.noHints ? 3 : 2) ? h('button', { type: 'button', className: 'l2-link', onClick: function () { setStatus('shown'); } }, 'Ver la respuesta') : null) : null,
      status === 'ok' ? h(Feedback, { ok: true }, step.explain_es) : null,
      status === 'shown' ? h(Feedback, { ok: false, title: 'La frase era:' }, h('span', { lang: 'en' }, answer.join(' ')), '. ', step.explain_es) : null,
      done ? h(Continue, { onClick: function () {
        props.onDone({ firstTry: tries === 0, tries: tries + (status === 'ok' ? 1 : 0),
          review: tries > 0 ? { q: LAB2.fill(step.say, ctx.player), a: answer.join(' '), why: step.explain_es } : null });
      } }) : null
    );
  }

  /* ---------- type: escribir la respuesta ---------- */
  function TypeStep(props) {
    var step = props.step, ctx = props.ctx;
    var accept = useMemo(function () { return step.accept.map(function (a) { return LAB2.normEnglish(LAB2.fill(a, ctx.player)); }); }, [step]);
    var v = useState(''); var value = v[0], setValue = v[1];
    var t = useState(0); var tries = t[0], setTries = t[1];
    var st = useState(''); var status = st[0], setStatus = st[1];
    var done = status === 'ok' || status === 'shown';
    var model = LAB2.fill(step.accept[0], ctx.player);
    model = model.charAt(0).toUpperCase() + model.slice(1) + '.';
    function check(e) {
      if (e) e.preventDefault();
      if (done || !LAB2.normEnglish(value)) return;
      if (accept.indexOf(LAB2.normEnglish(value)) >= 0) setStatus('ok');
      else { setTries(tries + 1); setStatus('no'); }
    }
    return h('div', { className: 'l2-step' },
      h(Speaker, { ctx: ctx, who: step.who, say: step.say }),
      h('p', { className: 'l2-ask' }, step.ask_es),
      h('form', { className: 'l2-input-row', onSubmit: check },
        h('label', { className: 'l2-sr', htmlFor: 'l2-type-input' }, 'Tu respuesta en inglés'),
        h('input', { id: 'l2-type-input', className: 'l2-input', type: 'text', lang: 'en', value: value, disabled: done, maxLength: 60,
          autoComplete: 'off', autoCorrect: 'off', spellCheck: false, placeholder: 'Escribí en inglés',
          onChange: function (e) { setValue(e.target.value); if (status === 'no') setStatus(''); } }),
        !done ? h('button', { type: 'submit', className: 'l2-btn l2-btn-go', disabled: !LAB2.normEnglish(value) }, 'Revisar') : null),
      status === 'no' ? h(Feedback, { ok: false },
        tries === 1 ? 'Esa no es la frase que se usa aquí. Pensá en las frases de cortesía de la unidad.' : 'Revisá la ortografía, palabra por palabra.',
        tries >= (ctx.noHints ? 3 : 2) ? h('button', { type: 'button', className: 'l2-link', onClick: function () { setStatus('shown'); } }, 'Ver la respuesta') : null) : null,
      status === 'ok' ? h(Feedback, { ok: true }, step.explain_es) : null,
      status === 'shown' ? h(Feedback, { ok: false, title: 'Una respuesta correcta:' }, h('span', { lang: 'en' }, model), ' ', step.explain_es) : null,
      done ? h(Continue, { onClick: function () {
        props.onDone({ firstTry: tries === 0, tries: tries + (status === 'ok' ? 1 : 0),
          review: tries > 0 ? { q: LAB2.fill(step.say, ctx.player), a: model, why: step.explain_es } : null });
      } }) : null
    );
  }

  /* ---------- say: decirlo en voz alta. No se califica: no hay micrófono ni puntaje automático ---------- */
  function SayStep(props) {
    var step = props.step, ctx = props.ctx;
    var phrase = LAB2.fill(step.phrase, ctx.player);
    return h('div', { className: 'l2-step' },
      h(Speaker, { ctx: ctx, who: step.who, say: step.say }),
      h('p', { className: 'l2-ask' }, step.ask_es),
      h('p', { className: 'l2-phrase', lang: 'en' }, phrase),
      h('p', { className: 'l2-note' }, 'Esto no se califica. Lo importante es que lo digás.'),
      h('div', { className: 'l2-actions' },
        LAB2.voice.available() ? h('button', { type: 'button', className: 'l2-btn', onClick: function () { LAB2.voice.speak(phrase, { rate: 0.8 }); } }, 'Escuchar el modelo') : null,
        h('button', { type: 'button', className: 'l2-btn l2-btn-go', onClick: function () { props.onDone({ firstTry: true, tries: 1, review: null, spoken: true }); } }, 'Marcar práctica realizada (sin verificación)'))
    );
  }

  LAB2.steps = { line: LineStep, choice: ChoiceStep, spell: SpellStep, build: BuildStep, type: TypeStep, say: SayStep };
})();
