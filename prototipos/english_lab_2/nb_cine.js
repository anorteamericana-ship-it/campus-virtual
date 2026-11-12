/* Northbound · capa audiovisual de la aventura 001.
 * Introducción con video, sonido ambiente y efectos sintetizados, voces por personaje,
 * retratos con expresión y recuerdo final. Escucha los eventos de los motores (LAB2.on);
 * no cambia su lógica. Sin archivos de audio: todo el sonido se genera en el navegador.
 */
(function () {
  'use strict';
  var LAB2 = window.LAB2, R = window.React, h = R.createElement;
  var NB = window.NB = {};
  function load(key, fallback) { try { var v = JSON.parse(window.localStorage.getItem(key)); return v == null ? fallback : v; } catch (_) { return fallback; } }
  function save(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  /* Cada aventura declara lo suyo en window.NB_CONFIG antes de cargar este archivo. */
  var CFG = Object.assign({ id: '001', flags: { drink: 'coffee' }, lastScene: '', souvenir: 'cup', next: 'comprar un souvenir' }, window.NB_CONFIG || {});
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ================= sonido ================= */
  var settings = Object.assign({ voice: true, ambience: true, sfx: true }, load('nb_audio_v1', {}));
  var ctx = null, master = null, ambGain = null, ambTimer = null, ducked = false;
  LAB2.voice.muted = !settings.voice;
  LAB2.voice.profiles = {
    rivera: { prefer: /Samantha|Zira|Jenny|Aria|Ava|Allison|Google US English|Female/i, pitch: 1.1, rate: 0.98 },
    sam: { prefer: /Alex|David|Guy|Fred|Aaron|Evan|Tom|Male/i, pitch: 0.8, rate: 1.04 },
    okafor: { prefer: /Daniel|Fred|Ralph|Bruce|Mark|David|Male/i, pitch: 0.62, rate: 0.92 }
  };
  function noise(seconds) {
    var buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate), d = buf.getChannelData(0), last = 0;
    for (var i = 0; i < d.length; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }   /* ruido marrón */
    return buf;
  }
  function tone(freq, start, dur, vol, type, dest) {
    var o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime + start;
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function hiss(start, dur, vol) {                    /* máquina de café: ruido agudo que sube y baja */
    var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t0 = ctx.currentTime + start;
    var buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    src.buffer = buf; f.type = 'highpass'; f.frequency.value = 3200;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(ambGain); src.start(t0);
  }
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination); return true; } catch (_) { ctx = null; return false; }
  }
  function ambTarget() { return settings.ambience ? (ducked ? 0.18 : 1) : 0; }
  function ambApply() { if (ambGain) ambGain.gain.setTargetAtTime(ambTarget(), ctx.currentTime, 0.25); }
  function startAmbience() {
    if (!ensure() || ambGain) { ambApply(); return; }
    ambGain = ctx.createGain(); ambGain.gain.value = 0; ambGain.connect(master);
    var src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise(6); src.loop = true; bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.6; g.gain.value = 0.11;   /* murmullo */
    var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.13; lg.gain.value = 0.035; lfo.connect(lg); lg.connect(g.gain); lfo.start();
    src.connect(bp); bp.connect(g); g.connect(ambGain); src.start();
    var n = 0;
    ambTimer = window.setInterval(function () {
      if (!settings.ambience || ducked || ctx.state !== 'running') return;
      n++;
      if (n % 5 === 0) hiss(0, 1.6, 0.05);                                   /* vapor de la máquina */
      else { var f = 1900 + Math.random() * 900; tone(f, 0, 0.09, 0.02, 'sine', ambGain); tone(f * 1.5, 0.05, 0.07, 0.012, 'sine', ambGain); }   /* tazas */
    }, 3400);
    ambApply();
  }
  var SFX = {
    door: function () { tone(1318, 0, 0.9, 0.09); tone(1760, 0.16, 1.1, 0.07); },                 /* campanilla de la puerta */
    ok: function () { tone(880, 0, 0.18, 0.06); tone(1174, 0.09, 0.3, 0.06); },
    no: function () { tone(196, 0, 0.16, 0.05, 'triangle'); },                                     /* suave: avisa, no castiga */
    done: function () { tone(784, 0, 0.2, 0.07); tone(988, 0.13, 0.2, 0.07); tone(1318, 0.26, 0.6, 0.07); }
  };
  NB.sfx = function (name) { if (settings.sfx && ensure() && SFX[name]) SFX[name](); };
  NB.audio = {
    get: function () { return Object.assign({}, settings); },
    set: function (key, value) {
      settings[key] = !!value; save('nb_audio_v1', settings);
      LAB2.voice.muted = !settings.voice; if (!settings.voice) LAB2.voice.stop();
      if (key === 'ambience' && value) startAmbience(); else ambApply();
      renderControls();
    },
    start: function () { if (ensure()) { NB.sfx('door'); if (settings.ambience) startAmbience(); } },
    state: function () { return { context: ctx ? ctx.state : 'none', ambience: !!ambGain, ducked: ducked, target: ambTarget() }; }
  };
  LAB2.on(function (name, d) {
    if (name === 'voice-start') { ducked = true; ambApply(); }
    if (name === 'voice-end') { ducked = false; ambApply(); }
    if (name === 'answer') NB.sfx(d.ok ? 'ok' : 'no');
    if (name === 'scene-end') { NB.sfx('done'); if (CFG.lastScene ? d.scene === CFG.lastScene : /-S3$/.test(d.scene)) window.setTimeout(function () { NB.souvenir(d.player); }, 500); }
    if (name === 'answer' && d.kind === 'pick') save('nb_flags_' + CFG.id, LAB2.flags);
  });
  Object.assign(LAB2.flags, load('nb_flags_' + CFG.id, {}));
  Object.keys(CFG.flags).forEach(function (k) { if (!LAB2.flags[k]) LAB2.flags[k] = CFG.flags[k]; });
  Object.assign(LAB2.flags, CFG.fixed || {});       /* datos heredados de otra historia: siempre mandan los de origen */

  function renderControls() {
    var el = document.getElementById('nb-sound'); if (!el) return;
    var items = [['voice', 'Voz'], ['ambience', 'Ambiente'], ['sfx', 'Efectos']];
    var allOff = items.every(function (i) { return !settings[i[0]]; });
    el.innerHTML = '<span class="nb-sound-label">Sonido</span>' + items.map(function (i) {
      return '<button type="button" data-k="' + i[0] + '" aria-pressed="' + settings[i[0]] + '">' + i[1] + '</button>';
    }).join('') + '<button type="button" data-k="all" class="nb-sound-all">' + (allOff ? 'Activar' : 'Silenciar') + '</button>';
  }
  NB.audio.renderControls = renderControls;
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#nb-sound button'); if (!b) return;
    var k = b.getAttribute('data-k');
    if (k === 'all') { var on = ['voice', 'ambience', 'sfx'].every(function (x) { return !settings[x]; }); ['voice', 'ambience', 'sfx'].forEach(function (x) { NB.audio.set(x, on); }); }
    else NB.audio.set(k, !settings[k]);
  });

  /* ================= retratos ================= */
  var LOOK = {
    rivera: { skin: '#c98f6b', hair: '#2a1a1a', top: '#f5ead3', apron: '#8e1f2f', bg: '#f0a2ad' },
    sam: { skin: '#8d5a3b', hair: '#17110f', top: '#2f4f7f', apron: '#1f7a6d', bg: '#63c7b8' },
    okafor: { skin: '#6b4630', hair: '#cfcfcf', top: '#d9a03a', apron: '#27464f', bg: '#f2b441', glasses: true, label: 'Mr. Okafor' }
  };
  LOOK.rivera.bun = true; LOOK.rivera.label = 'Ms. Rivera'; LOOK.sam.label = 'Sam';
  LAB2.portrait = function (id, mood) {
    var L = LOOK[id]; if (!L) return null;
    var happy = mood === 'happy', conf = mood === 'confused';
    var eye = function (cx) {
      return happy ? h('path', { d: 'M' + (cx - 5) + ' 47 q5 -6 10 0', stroke: '#1b1420', strokeWidth: 2.6, fill: 'none', strokeLinecap: 'round' })
        : h('ellipse', { className: 'nb-eye', cx: cx, cy: 47, rx: 2.9, ry: 3.4, fill: '#1b1420' });
    };
    return h('svg', { className: 'nb-portrait nb-' + mood, viewBox: '0 0 100 100', role: 'img',
      'aria-label': L.label + (happy ? ', sonríe' : conf ? ', no entendió la respuesta' : '') },
      h('circle', { cx: 50, cy: 50, r: 50, fill: L.bg }),
      h('g', { className: 'nb-body' },
        h('path', { d: 'M14 100 q4 -30 36 -30 q32 0 36 30 z', fill: L.top }),
        h('path', { d: 'M34 100 v-22 q16 8 32 0 v22 z', fill: L.apron }),
        h('rect', { x: 43, y: 60, width: 14, height: 16, rx: 6, fill: L.skin })),
      h('g', { className: 'nb-head' },
        L.bun ? h('circle', { cx: 50, cy: 17, r: 10, fill: L.hair }) : null,
        h('ellipse', { cx: 50, cy: 45, rx: 21, ry: 24, fill: L.skin }),
        L.bun
          ? h('path', { d: 'M28 46 q-3 -30 22 -30 q25 0 22 30 q-5 -17 -22 -17 q-17 0 -22 17 z', fill: L.hair })
          : h('path', { d: 'M28 42 q-4 -28 22 -28 q26 0 22 28 q-3 -12 -8 -14 q-14 5 -28 0 q-5 2 -8 14 z', fill: L.hair }),
        L.bun ? h('g', null, h('circle', { cx: 29, cy: 54, r: 2.2, fill: '#f2b441' }), h('circle', { cx: 71, cy: 54, r: 2.2, fill: '#f2b441' })) : null,
        h('path', { d: conf ? 'M35 39 l10 -3' : 'M35 38 q5 -3 10 0', stroke: L.hair, strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round' }),
        h('path', { d: conf ? 'M55 35 l10 3' : 'M55 38 q5 -3 10 0', stroke: L.hair, strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round' }),
        eye(40), eye(60),
        L.glasses ? h('g', { fill: 'rgba(255,255,255,.18)', stroke: '#fff6da', strokeWidth: 2 }, h('circle', { cx: 40, cy: 47, r: 7.5 }), h('circle', { cx: 60, cy: 47, r: 7.5 }), h('path', { d: 'M47.5 47 h5 M32.5 46 l-5 -2 M67.5 46 l5 -2' })) : null,
        L.glasses ? h('path', { d: 'M40 55 q10 -5 20 0 q-10 3 -20 0 z', fill: L.hair }) : null,
        happy ? h('path', { d: 'M40 57 q10 10 20 0 z', fill: '#fff', stroke: '#7a2a2a', strokeWidth: 1.6, strokeLinejoin: 'round' })
          : conf ? h('ellipse', { cx: 51, cy: 59, rx: 3.6, ry: 2.8, fill: '#7a2a2a' })
          : h('path', { d: 'M42 58 q8 4 16 0', stroke: '#7a2a2a', strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round' })));
  };

  /* ================= recuerdo ================= */
  NB.souvenir = function (player) {
    var el = document.getElementById('nb-souvenir'); if (!el || !player) return;
    var name = String(player.name || '').replace(/[<>&"]/g, '');
    var drink = { coffee: 'coffee', tea: 'tea', water: 'water' }[LAB2.flags.drink] || 'coffee';
    var gift = { mug: 'a mug', postcard: 'a postcard', keychain: 'a keychain' }[LAB2.flags.gift] || 'a postcard';
    if (CFG.souvenir === 'postcard') {
      el.innerHTML = '<div class="nb-souvenir-card" role="dialog" aria-modal="true" aria-labelledby="nb-sv-title">' +
        '<p class="nb-kicker">Tu recuerdo de City Gifts</p>' +
        '<svg class="nb-cup nb-postcard" viewBox="0 0 300 200" role="img" aria-label="Una postal de North City con tu nombre">' +
        '<rect x="4" y="4" width="292" height="192" rx="8" fill="#fffaf0" stroke="#d9c9a8" stroke-width="3"/>' +
        '<rect x="16" y="16" width="150" height="112" rx="4" fill="#7fb6ea"/><circle cx="48" cy="44" r="15" fill="#fbe9c4"/>' +
        '<path d="M16 128 v-34 h22 v-20 h24 v30 h18 v-44 h26 v40 h20 v-22 h24 v16 h16 v34 z" fill="#002F6C"/><rect x="16" y="118" width="150" height="10" fill="#1f7a6d"/>' +
        '<text x="91" y="150" text-anchor="middle" font-size="13" fill="#DA291C" font-family="Barlow Condensed, Arial Narrow, sans-serif" letter-spacing="2">GREETINGS FROM</text>' +
        '<text x="91" y="174" text-anchor="middle" font-size="22" fill="#002F6C" font-family="Barlow Condensed, Arial Narrow, sans-serif" letter-spacing="2" font-weight="700">NORTH CITY</text>' +
        '<rect x="246" y="18" width="34" height="42" fill="#DA291C"/><path d="M186 92 h96 M186 116 h96 M186 140 h96" stroke="#c9c0aa" stroke-width="1.5"/>' +
        '<text x="234" y="86" text-anchor="middle" font-size="' + (name.length > 8 ? 15 : 19) + '" fill="#1b2340" font-family="Segoe Script, Bradley Hand, Comic Sans MS, cursive" transform="rotate(-3 234 86)">' + name + '</text>' +
        '<text x="234" y="111" text-anchor="middle" font-size="11" fill="#555a72" font-family="Barlow, sans-serif">bought ' + gift + '</text></svg>' +
        '<h2 id="nb-sv-title">Una postal para vos, ' + name + '</h2>' +
        '<p>Nombraste objetos, dijiste de quién era cada cosa y compraste tu recuerdo, todo en inglés. Es práctica, no una calificación.</p>' +
        '<p class="nb-next"><strong>Próxima historia en North City:</strong> ' + CFG.next + '. En preparación, sin fecha.</p>' +
        '<button type="button" class="nb-btn" id="nb-sv-close">Seguir</button></div>';
    } else
    el.innerHTML = '<div class="nb-souvenir-card" role="dialog" aria-modal="true" aria-labelledby="nb-sv-title">' +
      '<p class="nb-kicker">Tu recuerdo de North Coffee</p>' +
      '<svg class="nb-cup" viewBox="0 0 200 220" role="img" aria-label="Un vaso de la cafetería con tu nombre escrito a mano">' +
      '<path d="M48 40 h104 l-12 160 q-1 10 -11 10 h-58 q-10 0 -11 -10 z" fill="#fffaf0" stroke="#d9c9a8" stroke-width="3"/>' +
      '<rect x="40" y="26" width="120" height="18" rx="6" fill="#002F6C"/><path d="M53 96 h94 l-5 62 h-84 z" fill="#DA291C"/>' +
      '<text x="100" y="124" text-anchor="middle" font-size="12" fill="#fff" font-family="Barlow Condensed, Arial Narrow, sans-serif" letter-spacing="2">NORTH COFFEE</text>' +
      '<text x="100" y="148" text-anchor="middle" font-size="11" fill="#ffe7b0" font-family="Barlow, sans-serif">' + drink + '</text>' +
      '<text x="100" y="82" text-anchor="middle" font-size="' + (name.length > 8 ? 20 : 26) + '" fill="#1b2340" font-family="Segoe Script, Bradley Hand, Comic Sans MS, cursive" transform="rotate(-4 100 82)">' + name + '</text></svg>' +
      '<h2 id="nb-sv-title">Sam escribió tu nombre: ' + name + '</h2>' +
      '<p>Saludaste, te presentaste, deletreaste tu nombre y diste las gracias, todo en inglés. Es práctica, no una calificación.</p>' +
      '<p class="nb-next"><strong>Próxima historia en North City:</strong> ' + CFG.next + '.' + (CFG.nextHref ? ' <a href="' + CFG.nextHref + '">Jugarla ahora</a>' : ' En preparación, sin fecha.') + '</p>' +
      '<button type="button" class="nb-btn" id="nb-sv-close">Seguir</button></div>';
    el.hidden = false;
    var close = document.getElementById('nb-sv-close'); close.focus();
    close.addEventListener('click', function () { el.hidden = true; el.innerHTML = ''; var m = document.querySelector('.l2-result h1'); if (m) m.focus(); });
  };
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var sv = document.getElementById('nb-souvenir'); if (sv && !sv.hidden) { var c = document.getElementById('nb-sv-close'); if (c) c.click(); return; }
    if (NB.skipIntro) NB.skipIntro();
  });

  /* ================= introducción ================= */
  NB.intro = function (opts) {
    var root = document.getElementById('nb-intro'), video = document.getElementById('nb-video');
    var gate = document.getElementById('nb-audio-gate'), enterSound = document.getElementById('nb-enter-sound');
    var enterQuiet = document.getElementById('nb-enter-quiet'), gateStatus = document.getElementById('nb-gate-status');
    var card = document.getElementById('nb-title'), skip = document.getElementById('nb-skip'), replay = document.getElementById('nb-replay');
    var nameInput = document.getElementById('nb-name'), start = document.getElementById('nb-start'), status = document.getElementById('nb-video-status');
    var seenKey = 'nb_intro_sound_v2_seen_' + CFG.id;
    var seen = !!load(seenKey, false), shownCard = false, playing = false, wantedSound = false;
    var conn = navigator.connection || {};
    var light = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '') || window.innerWidth < 700;
    var soundtrack = window.NBIntroAudio || { start: function () { return false; }, stop: function () {} };

    function stopIntroSound() { soundtrack.stop(); playing = false; }
    function showCard() {
      if (shownCard) return;
      shownCard = true;
      NB.skipIntro = null;
      stopIntroSound();
      wantedSound = false;
      try { video.pause(); } catch (_) {}
      gate.hidden = true;
      root.classList.remove('is-gate');
      root.classList.add('is-card');
      skip.hidden = true;
      card.hidden = false;
      save(seenKey, true);
      (nameInput.value ? start : nameInput).focus();
    }
    function showGate() {
      stopIntroSound();
      shownCard = false;
      root.classList.remove('is-card');
      root.classList.add('is-gate');
      card.hidden = true;
      skip.hidden = true;
      gate.hidden = false;
      NB.skipIntro = showCard;
      gateStatus.textContent = '';
      enterSound.focus();
    }
    function playVideo(withSound) {
      shownCard = false;
      gate.hidden = true;
      root.classList.remove('is-gate', 'is-card');
      card.hidden = true;
      skip.hidden = false;
      NB.skipIntro = showCard;
      playing = true;
      /* Desbloquear el AudioContext en este clic y sincronizar sus notas al evento playing.
         Si la descarga tarda, el sonido nunca se adelanta al primer cuadro del video. */
      wantedSound = !!withSound && !!(soundtrack.prime && soundtrack.prime());
      if (withSound && !wantedSound) status.textContent = 'El sonido no está disponible aquí. Podés continuar con el video en silencio.';
      if (!video.getAttribute('src')) video.setAttribute('src', light ? opts.videoSmall : opts.video);
      try { video.currentTime = 0; } catch (_) {}
      var playPromise;
      try { playPromise = video.play(); } catch (_) { playPromise = null; showCard(); }
      if (playPromise && playPromise.catch) playPromise.catch(function () {
        if (!playing) return;
        status.textContent = 'No se pudo reproducir el video; podés continuar con la aventura.';
        showCard();
      });
      skip.focus();
    }
    video.addEventListener('playing', function () {
      if (!playing || !wantedSound) return;
      soundtrack.start({ scene: CFG.id === '002' ? 'gifts' : 'cafe', offset: video.currentTime });
    });
    video.addEventListener('ended', showCard);
    /* Algunos navegadores no disparan ended tras buscar cerca del último cuadro.
       Cerrar también por la línea de tiempo evita una pantalla inmóvil al acabar. */
    video.addEventListener('timeupdate', function () {
      if (playing && !shownCard && Number.isFinite(video.duration) &&
          video.duration > 0 && video.currentTime >= video.duration - 0.22) showCard();
    });
    video.addEventListener('error', function () {
      status.textContent = 'El video no cargó; podés continuar con la imagen y el juego.';
      showCard();
    });
    skip.addEventListener('click', showCard);
    enterSound.addEventListener('click', function () { playVideo(true); });
    enterQuiet.addEventListener('click', function () { playVideo(false); });
    document.getElementById('nb-gate-skip').addEventListener('click', showCard);
    replay.addEventListener('click', showGate);
    window.addEventListener('pagehide', stopIntroSound);
    /* Pausar la pista si la pestaña pierde visibilidad. Nunca continuar sonido sin video. */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && playing && !shownCard) {
        try { video.pause(); } catch (_) {}
        showCard();
      }
    });

    var prev = opts.loadPlayer();
    nameInput.value = prev ? prev.name : '';
    function sync() { start.disabled = !LAB2.cleanName(nameInput.value); }
    nameInput.addEventListener('input', sync); sync();
    document.getElementById('nb-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = LAB2.cleanName(nameInput.value); if (!name) return;
      stopIntroSound();
      NB.audio.start();                 /* sonido del juego tras el clic, separado de la introducción */
      root.hidden = true;
      document.body.classList.remove('nb-locked');
      document.getElementById('nb-sound').hidden = false;
      renderControls();
      opts.onStart({ name: name });
    });

    /* Regreso y accesibilidad: no forzar video largo ni cargas a quien ya vio el episodio. */
    if (seen || reduced || conn.saveData) {
      shownCard = false;
      showCard();
    } else showGate();
  };
  NB.reduced = reduced;
})();
