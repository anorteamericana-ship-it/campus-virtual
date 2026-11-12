/* Northbound · banda sonora original de introducción (10 segundos).
 * 100 % Web Audio: sin archivos remotos, sin música protegida, sin backend.
 * Los navegadores exigen interacción del usuario antes de emitir sonido.
 * El MP4 continúa silencioso; este módulo crea música/ambiente sincronizados
 * al botón "Ver con sonido". Las voces del juego utilizan otro control.
 */
(function () {
  'use strict';
  var ctx = null, active = null, started = 0, lastError = '';
  var AC = window.AudioContext || window.webkitAudioContext;

  function disconnectOld() {
    if (!active || !ctx) return;
    var old = active;
    active = null;
    try {
      var now = ctx.currentTime;
      old.gain.cancelScheduledValues(now);
      old.gain.setValueAtTime(Math.max(0.0001, old.gain.value || 0.0001), now);
      old.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      window.setTimeout(function () { try { old.disconnect(); } catch (_) {} }, 450);
    } catch (_) { try { old.disconnect(); } catch (_) {} }
  }

  function playNote(dest, when, freq, length, vol, shape, attack) {
    if (!ctx || length <= 0) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    var t = ctx.currentTime + 0.04 + when;
    o.type = shape || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t + Math.min(length * 0.4, attack || 0.12));
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + length + 0.06);
  }

  function playNoise(dest, when, length, vol, lowHz, hiHz) {
    if (!ctx || length <= 0) return;
    var t = ctx.currentTime + 0.04 + when;
    var samples = Math.ceil(ctx.sampleRate * length);
    var buffer = ctx.createBuffer(1, samples, ctx.sampleRate);
    var data = buffer.getChannelData(0), seed = 211;
    for (var i = 0; i < samples; i++) {
      seed = (seed * 16807) % 2147483647;
      data[i] = ((seed / 1073741823.5) - 1) * 0.65;
    }
    var src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buffer; lp.type = 'lowpass'; lp.frequency.value = hiHz || 1350;
    hp.type = 'highpass'; hp.frequency.value = lowHz || 100;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.3, length / 3));
    g.gain.linearRampToValueAtTime(0.0001, t + length);
    src.connect(lp); lp.connect(hp); hp.connect(g); g.connect(dest);
    src.start(t); src.stop(t + length + 0.05);
  }

  function prime() {
    if (!AC) { lastError = 'Este navegador no ofrece audio Web Audio.'; return false; }
    try {
      if (!ctx || ctx.state === 'closed') ctx = new AC();
      if (ctx.state === 'suspended') {
        var p = ctx.resume();
        if (p && p.catch) p.catch(function () { lastError = 'El navegador bloqueó la reproducción de audio.'; });
      }
      return true;
    } catch (_) { lastError = 'No fue posible habilitar el sonido.'; return false; }
  }

  function start(opts) {
    opts = opts || {};
    if (!prime()) return false;
    try {
      disconnectOld();
      var track = ctx.createGain(); active = track;
      track.gain.value = 0.62; track.connect(ctx.destination);
      var offset = Math.max(0, Math.min(9.9, Number(opts.offset) || 0));
      var shop = opts.scene === 'gifts';
      /* Patrón armónico original; textura cálida en lugar de melodía invasiva. */
      var chords = shop
        ? [[0, [220, 261.63, 329.63], 2.9], [2.9, [196, 246.94, 293.66], 3.0], [5.9, [174.61, 220, 261.63], 4.05]]
        : [[0, [196, 246.94, 293.66], 3.1], [3.1, [174.61, 220, 261.63], 2.95], [6.05, [196, 246.94, 329.63], 3.85]];
      chords.forEach(function (chord) {
        chord[1].forEach(function (freq) {
          if (chord[0] + chord[2] <= offset) return;
          var when = Math.max(0, chord[0] - offset);
          var len = chord[2] - Math.max(0, offset - chord[0]);
          playNote(track, when, freq, len, 0.027, 'sine', 0.38);
          playNote(track, when + 0.02, freq * 2.004, Math.max(0.08, len - 0.1), 0.006, 'triangle', 0.4);
        });
      });
      /* Calle tranquila, pasos, cafetera y campanilla; volumen moderado. */
      [
        [0.4, 3.7, 0.011, 90, 850],   // aire de la calle
        [3.6, 2.8, 0.009, 110, 900],  // llegada a la puerta
        [5.45, 1.55, shop ? 0.016 : 0.022, 1300, 4100], // máquina / papel
        [7.0, 1.4, 0.012, 170, 2100]
      ].forEach(function (n) {
        if (n[0] + n[1] > offset) {
          var when = Math.max(0, n[0] - offset);
          var length = n[1] - Math.max(0, offset - n[0]);
          playNoise(track, when, length, n[2], n[3], n[4]);
        }
      });
      [3.25, 3.65, 4.15].forEach(function (at) {
        if (at >= offset) playNote(track, at - offset, 160, 0.085, 0.026, 'triangle', 0.012);
      });
      /* Campanilla que coincide con la puerta al final del clip. */
      [784, 1174.66, 1567.98].forEach(function (freq, i) {
        if (8.18 + 0.12 * i >= offset) playNote(track, 8.18 + 0.12 * i - offset, freq, 1.15 - i * 0.15, 0.051 - i * 0.006, 'sine', 0.018);
      });
      started++;
      lastError = '';
      return true;
    } catch (e) {
      lastError = 'No fue posible iniciar la ambientación sonora.';
      disconnectOld();
      return false;
    }
  }

  window.NBIntroAudio = {
    prime: prime,
    start: start,
    stop: disconnectOld,
    state: function () { return { available: !!AC, context: ctx ? ctx.state : 'none', active: !!active, starts: started, error: lastError }; }
  };
  document.addEventListener('visibilitychange', function () { if (document.hidden) disconnectOld(); });
})();
