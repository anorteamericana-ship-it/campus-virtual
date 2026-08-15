(function(){
  'use strict';

  const phrases = Array.isArray(window.SPEAK_LAB_PHASE0_PHRASES)
    ? window.SPEAK_LAB_PHASE0_PHRASES
    : [];

  const $ = (id) => document.getElementById(id);
  const els = {
    phraseId: $('phraseId'),
    phraseLevel: $('phraseLevel'),
    phraseFocus: $('phraseFocus'),
    phraseText: $('phraseText'),
    phraseHint: $('phraseHint'),
    phraseCounter: $('phraseCounter'),
    status: $('status'),
    support: $('support'),
    listen: $('listenBtn'),
    record: $('recordBtn'),
    stop: $('stopBtn'),
    retry: $('retryBtn'),
    previous: $('previousBtn'),
    next: $('nextBtn'),
    recordingBox: $('recordingBox'),
    recordingTime: $('recordingTime'),
    playbackBox: $('playbackBox'),
    playback: $('playback'),
    privacy: $('privacyNote'),
  };

  let index = 0;
  let recorder = null;
  let stream = null;
  let chunks = [];
  let audioUrl = '';
  let timer = null;
  let startedAt = 0;

  function setStatus(kind, text){
    els.status.className = `sl-status ${kind || 'neutral'}`;
    els.status.textContent = text;
  }

  function formatSeconds(total){
    const seconds = Math.max(0, Math.floor(total));
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function mediaSupport(){
    return !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof window.MediaRecorder === 'function'
    );
  }

  function preferredMimeType(){
    if (typeof window.MediaRecorder !== 'function' || typeof window.MediaRecorder.isTypeSupported !== 'function') return '';
    const candidates = [
      'audio/mp4',
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus'
    ];
    return candidates.find(type => window.MediaRecorder.isTypeSupported(type)) || '';
  }

  function cleanupTimer(){
    if (timer) clearInterval(timer);
    timer = null;
  }

  function stopStream(){
    if (!stream) return;
    try { stream.getTracks().forEach(track => track.stop()); } catch (_) {}
    stream = null;
  }

  function revokeAudio(){
    if (audioUrl) {
      try { URL.revokeObjectURL(audioUrl); } catch (_) {}
    }
    audioUrl = '';
    if (els.playback) {
      els.playback.pause();
      els.playback.removeAttribute('src');
      try { els.playback.load(); } catch (_) {}
    }
  }

  function resetAttempt(message){
    cleanupTimer();
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); } catch (_) {}
    }
    recorder = null;
    stopStream();
    chunks = [];
    revokeAudio();
    els.recordingBox.hidden = true;
    els.playbackBox.hidden = true;
    els.record.disabled = !mediaSupport();
    els.stop.disabled = true;
    els.retry.disabled = true;
    els.recordingTime.textContent = '00:00';
    setStatus('neutral', message || 'Listo para practicar.');
  }

  function render(){
    const phrase = phrases[index];
    if (!phrase) {
      els.phraseText.textContent = 'No hay frases configuradas.';
      els.listen.disabled = true;
      els.record.disabled = true;
      els.previous.disabled = true;
      els.next.disabled = true;
      return;
    }

    resetAttempt('Listo para practicar.');
    els.phraseId.textContent = phrase.id || `SL${String(index + 1).padStart(2, '0')}`;
    els.phraseLevel.textContent = phrase.level || '—';
    els.phraseFocus.textContent = phrase.focus || 'Speaking';
    els.phraseText.textContent = phrase.text || '';
    els.phraseHint.textContent = phrase.hint || '';
    els.phraseCounter.textContent = `${index + 1} / ${phrases.length}`;
    els.previous.disabled = index === 0;
    els.next.disabled = index >= phrases.length - 1;
    els.listen.disabled = !(window.speechSynthesis && typeof window.SpeechSynthesisUtterance === 'function');
    els.record.disabled = !mediaSupport();
  }

  function englishVoice(){
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    return voices.find(v => /^en-US\b/i.test(v.lang))
      || voices.find(v => /^en-GB\b/i.test(v.lang))
      || voices.find(v => /^en\b/i.test(v.lang))
      || null;
  }

  function listen(){
    const phrase = phrases[index];
    if (!phrase || !window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') {
      setStatus('warning', 'Este navegador no ofrece voz modelo provisional.');
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase.text);
      utterance.lang = 'en-US';
      utterance.rate = 0.88;
      utterance.pitch = 1;
      const voice = englishVoice();
      if (voice) utterance.voice = voice;
      utterance.onstart = () => setStatus('active', 'Escuchando el modelo…');
      utterance.onend = () => setStatus('neutral', 'Ahora repetí la frase con tu propia voz.');
      utterance.onerror = () => setStatus('warning', 'No se pudo reproducir la voz modelo en este navegador.');
      window.speechSynthesis.speak(utterance);
    } catch (_) {
      setStatus('warning', 'No se pudo reproducir la voz modelo en este navegador.');
    }
  }

  async function startRecording(){
    if (!mediaSupport()) {
      setStatus('error', 'Este navegador no permite la grabación requerida por el prototipo.');
      return;
    }

    resetAttempt('Solicitando permiso de micrófono…');
    els.record.disabled = true;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      const mimeType = preferredMimeType();
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunks = [];

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      });

      recorder.addEventListener('start', () => {
        startedAt = Date.now();
        els.recordingBox.hidden = false;
        els.playbackBox.hidden = true;
        els.stop.disabled = false;
        els.retry.disabled = false;
        setStatus('recording', 'Grabando localmente…');
        cleanupTimer();
        timer = setInterval(() => {
          els.recordingTime.textContent = formatSeconds((Date.now() - startedAt) / 1000);
        }, 250);
      });

      recorder.addEventListener('stop', () => {
        cleanupTimer();
        stopStream();
        els.stop.disabled = true;
        els.record.disabled = false;
        els.retry.disabled = false;
        els.recordingBox.hidden = true;

        if (!chunks.length) {
          setStatus('warning', 'La grabación quedó vacía. Probá de nuevo.');
          return;
        }

        const blobType = recorder && recorder.mimeType ? recorder.mimeType : (mimeType || 'audio/webm');
        const blob = new Blob(chunks, { type: blobType });
        revokeAudio();
        audioUrl = URL.createObjectURL(blob);
        els.playback.src = audioUrl;
        els.playbackBox.hidden = false;
        setStatus('success', 'Grabación local lista. Escuchate y compará con el modelo.');
      });

      recorder.addEventListener('error', () => {
        cleanupTimer();
        stopStream();
        els.record.disabled = false;
        els.stop.disabled = true;
        setStatus('error', 'Ocurrió un error al grabar. El audio no fue enviado a ningún backend.');
      });

      recorder.start(250);
    } catch (error) {
      stopStream();
      els.record.disabled = false;
      els.stop.disabled = true;
      const name = String(error && error.name || '');
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setStatus('error', 'El permiso de micrófono fue rechazado. Activá el permiso del sitio para continuar.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setStatus('error', 'No se encontró un micrófono disponible.');
      } else if (!window.isSecureContext) {
        setStatus('error', 'El micrófono requiere un contexto seguro. Abrí el prototipo mediante HTTPS o localhost.');
      } else {
        setStatus('error', `No se pudo iniciar el micrófono${name ? ` (${name})` : ''}.`);
      }
    }
  }

  function stopRecording(){
    if (!recorder || recorder.state === 'inactive') return;
    try {
      recorder.stop();
      setStatus('active', 'Preparando tu grabación…');
    } catch (_) {
      setStatus('error', 'No se pudo detener la grabación correctamente.');
    }
  }

  function retry(){
    resetAttempt('Intento limpio. Escuchá el modelo o grabate otra vez.');
  }

  function move(delta){
    const next = Math.min(Math.max(index + delta, 0), Math.max(phrases.length - 1, 0));
    if (next === index) return;
    index = next;
    render();
  }

  function install(){
    const supported = mediaSupport();
    const secure = window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!supported) {
      els.support.textContent = 'Grabación no soportada en este navegador';
      els.support.className = 'sl-support bad';
    } else if (!secure) {
      els.support.textContent = 'Micrófono bloqueado fuera de HTTPS/localhost';
      els.support.className = 'sl-support warn';
    } else {
      els.support.textContent = 'Micrófono compatible · audio local';
      els.support.className = 'sl-support good';
    }

    els.privacy.textContent = 'Fase 0: la grabación se mantiene en esta sesión del navegador. No hay STT, IA, subida de audio ni nota automática.';

    els.listen.addEventListener('click', listen);
    els.record.addEventListener('click', startRecording);
    els.stop.addEventListener('click', stopRecording);
    els.retry.addEventListener('click', retry);
    els.previous.addEventListener('click', () => move(-1));
    els.next.addEventListener('click', () => move(1));

    window.addEventListener('beforeunload', () => {
      cleanupTimer();
      stopStream();
      revokeAudio();
      try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (_) {}
    });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once:true });
  } else {
    install();
  }
})();
