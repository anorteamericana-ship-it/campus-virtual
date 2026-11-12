/* English Lab 2.0 · núcleo: utilidades, voz y progreso.
 * JS plano, sin JSX ni Babel: carga rápido y no depende de compilar en el navegador.
 * Prefijo global único: LAB2.
 */
(function () {
  'use strict';
  var LAB2 = window.LAB2 = window.LAB2 || {};

  /* ---------- eventos: capas opcionales (sonido, personajes, cinemática) escuchan sin tocar los motores ---------- */
  var listeners = [];
  LAB2.on = function (fn) { listeners.push(fn); };
  LAB2.emit = function (name, detail) { listeners.forEach(function (fn) { try { fn(name, detail || {}); } catch (_) {} }); };
  /* Datos de la partida que el contenido puede citar con {clave}, además de {name}. */
  LAB2.flags = {};

  /* ---------- utilidades ---------- */
  LAB2.shuffle = function (list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  /* Baraja y evita devolver el mismo orden original cuando hay más de un elemento. */
  LAB2.shuffleDifferent = function (list) {
    if (list.length < 2) return list.slice();
    for (var n = 0; n < 8; n++) {
      var s = LAB2.shuffle(list);
      if (s.some(function (x, i) { return x !== list[i]; })) return s;
    }
    return list.slice().reverse();
  };
  LAB2.norm = function (text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]+/g, '').replace(/\s+/g, ' ').trim();
  };
  /* Para escritura inglesa: no aceptar la ausencia de apostrofe como equivalente a una contraccion correcta. */
  LAB2.normEnglish = function (text) {
    return String(text || '').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[\u2018\u2019]/g, "'")
      .replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  };
  LAB2.lettersOf = function (text) {
    return String(text || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z]/g, '');
  };
  LAB2.fill = function (text, player) {
    return String(text || '').replace(/\{name\}/g, (player && player.name) || 'Alex')
      .replace(/\{([a-z_]+)\}/g, function (all, key) { return LAB2.flags[key] != null ? LAB2.flags[key] : all; });
  };
  LAB2.cleanName = function (raw) {
    var first = String(raw || '').trim().split(/\s+/)[0] || '';
    first = first.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z]/g, '').slice(0, 14);
    return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : '';
  };

  /* ---------- voz: síntesis del navegador, con alternativa visible ---------- */
  var synth = null;
  try { synth = window.speechSynthesis || null; } catch (_) { synth = null; }
  function pickVoice(prefer) {
    if (!synth) return null;
    var voices = [];
    try { voices = synth.getVoices() || []; } catch (_) { voices = []; }
    var us = voices.filter(function (v) { return /^en[-_]US/i.test(v.lang); });
    if (prefer) { var hit = us.filter(function (v) { return prefer.test(v.name); })[0]; if (hit) return hit; }
    return voices.filter(function (v) { return /^en[-_]US/i.test(v.lang); })[0] ||
      voices.filter(function (v) { return /^en/i.test(v.lang); })[0] || null;
  }
  LAB2.voice = {
    /* true solo si el navegador tiene síntesis. No garantiza que suene: por eso siempre hay texto y pistas. */
    available: function () { return !!(synth && typeof window.SpeechSynthesisUtterance === 'function'); },
    stop: function () { try { if (synth) synth.cancel(); } catch (_) {} },
    /* Debe llamarse desde un clic del usuario. Devuelve false si no pudo iniciar. */
    speak: function (parts, opts) {
      if (!LAB2.voice.available()) return false;
      opts = opts || {};
      try {
        synth.cancel();
        if (LAB2.voice.muted) return false;
        /* Perfil por personaje: voz preferida si el dispositivo la tiene, y tono distinto como respaldo. */
        var prof = (LAB2.voice.profiles || {})[opts.who] || {};
        var voice = pickVoice(prof.prefer);
        var list = Array.isArray(parts) ? parts : [parts];
        list.forEach(function (text, i) {
          var u = new window.SpeechSynthesisUtterance(String(text));
          u.lang = (voice && voice.lang) || 'en-US';
          if (voice) u.voice = voice;
          u.rate = (opts.rate || 0.9) * (prof.rate || 1);
          u.pitch = prof.pitch || 1;
          if (i === 0) u.onstart = function () { LAB2.emit('voice-start', { who: opts.who }); };
          if (i === list.length - 1) u.onend = u.onerror = function () { LAB2.emit('voice-end', { who: opts.who }); };
          synth.speak(u);
        });
        return true;
      } catch (_) { return false; }
    },
    spell: function (word, slow) {
      /* Cada letra es una frase aparte para que haya pausa entre letras. */
      return LAB2.voice.speak(LAB2.lettersOf(word).split(''), { rate: slow ? 0.55 : 0.75 });
    }
  };

  /* ---------- progreso ----------
   * Contrato único de guardado. Hoy lo cumple un adaptador local (este navegador).
   * El adaptador de backend se conecta aquí mismo cuando exista un release controlado;
   * los juegos no cambian. Ver 00_DOCUMENTACION/ENGLISH_LAB_2_ESTADO.md, "Contrato de progreso".
   *
   * Registro por escena:
   *   { started, completed, attempts, bestFirstTry, lastFirstTry, total, skills[], lastAt, resume:{step,log}|null }
   */
  var KEY = 'an_english_lab_2_v1_';
  var memory = {};
  function read(userKey) {
    try {
      var raw = window.localStorage.getItem(KEY + userKey);
      var data = raw ? JSON.parse(raw) : null;
      if (data && typeof data === 'object') return data;
    } catch (_) {}
    return memory[userKey] || null;
  }
  function write(userKey, data) {
    memory[userKey] = data;
    try { window.localStorage.setItem(KEY + userKey, JSON.stringify(data)); return true; } catch (_) { return false; }
  }
  LAB2.store = {
    mode: 'local',
    load: function (userKey) {
      var d = read(userKey) || {};
      return { player: d.player || null, scenes: d.scenes || {} };
    },
    save: function (userKey, state) { return write(userKey, state); },
    clear: function (userKey) {
      delete memory[userKey];
      try { window.localStorage.removeItem(KEY + userKey); } catch (_) {}
    }
  };
  LAB2.emptyScene = function () {
    return { started: false, completed: false, attempts: 0, bestFirstTry: 0, lastFirstTry: 0, total: 0, skills: [], lastAt: '', resume: null };
  };

  /* Compara lo escrito con la palabra y explica el primer error con la trampa conocida. */
  LAB2.checkSpelling = function (typed, word, traps) {
    var a = LAB2.lettersOf(typed), b = LAB2.lettersOf(word);
    var marks = [];
    var firstTrap = '';
    for (var i = 0; i < Math.max(a.length, b.length); i++) {
      var ok = a[i] === b[i];
      marks.push({ ch: a[i] || '·', ok: ok });
      if (!ok && !firstTrap && a[i] && b[i] && traps) firstTrap = traps[b[i] + '>' + a[i]] || '';
    }
    return { ok: a === b && b.length > 0, marks: marks, trap: firstTrap, lengthOff: a.length !== b.length };
  };
})();
