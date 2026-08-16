// SPEAK LAB · CS21A216 · runtime navegador del piloto visible
// Audio crudo vive solo en memoria. Antes de salir del navegador se normaliza
// a WAV PCM 16 kHz mono; STT nunca recibe la frase objetivo.
(function(){
  'use strict';

  const VERSION = 'CS21A216';
  const DEFAULT_GATEWAY = 'https://speak-lab-voice-gateway-qa.anorteamericana.workers.dev';
  const MAX_DURATION_MS = 30000;
  const MAX_BYTES = 2500000;
  const PRACTICE_SCOPES = Object.freeze(['tts:read','stt:write','pronunciation:write']);
  const grantCache = new Map();

  function clean(value){
    return String(value == null ? '' : value).trim();
  }

  function invariant(condition, code, message){
    if (condition) return;
    const error = new Error(message);
    error.code = code;
    throw error;
  }

  function gatewayBase(){
    const configured = clean(window.SPEAK_LAB_GATEWAY_URL || DEFAULT_GATEWAY).replace(/\/$/, '');
    let url;
    try { url = new URL(configured); }
    catch (_) { throw new Error('Voice Gateway de Speak LAB inválido.'); }
    invariant(url.protocol === 'https:', 'INSECURE_GATEWAY', 'Speak LAB requiere un Voice Gateway HTTPS.');
    invariant(!/openai\.com$/i.test(url.hostname), 'DIRECT_PROVIDER_FORBIDDEN', 'El navegador no puede conectarse directamente al proveedor.');
    return url.origin + url.pathname.replace(/\/$/, '');
  }

  function activeRole(){
    const session = typeof window.getSesion === 'function' ? window.getSesion() : null;
    const role = clean(session && session.rol).toLowerCase();
    invariant(role === 'teacher' || role === 'student', 'PILOT_ROLE_REQUIRED', 'Speak LAB piloto requiere una sesión docente o estudiante.');
    return role;
  }

  function campusToken(){
    const token = typeof window.getSessionToken === 'function' ? clean(window.getSessionToken()) : '';
    invariant(token, 'CAMPUS_SESSION_REQUIRED', 'Tu sesión del Campus expiró. Iniciá sesión nuevamente.');
    return token;
  }

  function support(){
    return Object.freeze({
      secure:window.isSecureContext === true,
      microphone:!!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function'),
      mediaRecorder:typeof window.MediaRecorder === 'function',
      audioContext:typeof (window.AudioContext || window.webkitAudioContext) === 'function',
      offlineAudioContext:typeof (window.OfflineAudioContext || window.webkitOfflineAudioContext) === 'function',
      crypto:!!(window.crypto && window.crypto.subtle),
    });
  }

  function preferredRecordingMimeType(){
    if (typeof window.MediaRecorder !== 'function' || typeof window.MediaRecorder.isTypeSupported !== 'function') return '';
    return [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ].find(type => window.MediaRecorder.isTypeSupported(type)) || '';
  }

  function writeAscii(view, offset, text){
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  }

  function encodePcm16Wav(samples, sampleRate){
    const bytesPerSample = 2;
    const dataLength = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);
    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeAscii(view, 8, 'WAVE');
    writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample, true);
    view.setUint16(32, bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeAscii(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    let offset = 44;
    for (let i = 0; i < samples.length; i += 1) {
      const clamped = Math.max(-1, Math.min(1, samples[i]));
      const pcm = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      view.setInt16(offset, Math.round(pcm), true);
      offset += 2;
    }
    return buffer;
  }

  async function normalizeToWav16kMono(blob){
    invariant(blob instanceof Blob && blob.size > 0, 'EMPTY_RECORDING', 'La grabación está vacía.');
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    const OfflineCtor = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    invariant(AudioContextCtor && OfflineCtor, 'AUDIO_NORMALIZATION_UNSUPPORTED', 'Este navegador no permite normalizar el audio para Speak LAB.');

    const context = new AudioContextCtor();
    let decoded;
    try {
      const sourceBytes = await blob.arrayBuffer();
      decoded = await context.decodeAudioData(sourceBytes.slice(0));
    } finally {
      try { await context.close(); } catch (_) {}
    }

    const durationMs = Math.round(decoded.duration * 1000);
    invariant(durationMs > 0, 'INVALID_AUDIO_DURATION', 'No se detectó audio en la grabación.');
    invariant(durationMs <= MAX_DURATION_MS, 'AUDIO_TOO_LONG', 'Cada intento de Speak LAB puede durar máximo 30 segundos.');

    const targetRate = 16000;
    const targetFrames = Math.max(1, Math.ceil(decoded.duration * targetRate));
    const offline = new OfflineCtor(1, targetFrames, targetRate);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);
    const rendered = await offline.startRendering();
    const wavBuffer = encodePcm16Wav(rendered.getChannelData(0), targetRate);
    const wav = new Blob([wavBuffer], { type:'audio/wav; codecs=audio/pcm; samplerate=16000' });
    invariant(wav.size <= MAX_BYTES, 'AUDIO_TOO_LARGE', 'La grabación normalizada supera el límite del servicio.');
    return Object.freeze({
      audio:wav,
      durationMs:Math.round(rendered.duration * 1000),
      sampleRate:targetRate,
      channels:1,
      mimeType:wav.type,
    });
  }

  async function sha256Hex(blob){
    invariant(window.crypto && window.crypto.subtle, 'CRYPTO_UNSUPPORTED', 'El navegador no permite verificar la evidencia de audio.');
    const digest = new Uint8Array(await window.crypto.subtle.digest('SHA-256', await blob.arrayBuffer()));
    return Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function responseError(response){
    let data = null;
    try { data = await response.clone().json(); } catch (_) {}
    const error = new Error(clean(data && (data.message || data.error)) || `Speak LAB respondió HTTP ${response.status}.`);
    error.code = clean(data && data.error) || 'SPEAK_LAB_HTTP_ERROR';
    error.status = response.status;
    error.requestId = clean(data && data.requestId) || clean(response.headers.get('x-request-id'));
    return error;
  }

  function cacheKey(role, scopes){
    return `${role}|${[...scopes].sort().join(',')}`;
  }

  async function requestGrant(scopes = PRACTICE_SCOPES){
    const role = activeRole();
    const key = cacheKey(role, scopes);
    const cached = grantCache.get(key);
    if (cached && cached.expiresAt > Date.now() + 15000) return cached.grant;

    const response = await fetch(`${gatewayBase()}/v1/session-grant`, {
      method:'POST',
      headers:{
        'Authorization':`Bearer ${campusToken()}`,
        'Content-Type':'application/json',
      },
      body:JSON.stringify({ role, scopes }),
      cache:'no-store',
    });
    if (!response.ok) throw await responseError(response);
    const data = await response.json();
    invariant(data && data.ok === true && clean(data.grant), 'VOICE_GRANT_INVALID', 'No se pudo autorizar la práctica de voz.');
    const ttl = Math.max(1, Number(data.expiresIn) || 1);
    grantCache.set(key, { grant:clean(data.grant), expiresAt:Date.now() + ttl * 1000 });
    return clean(data.grant);
  }

  async function synthesize(text){
    const phrase = clean(text);
    invariant(phrase, 'EMPTY_TTS_TEXT', 'No hay frase para reproducir.');
    const grant = await requestGrant(PRACTICE_SCOPES);
    const response = await fetch(`${gatewayBase()}/v1/tts`, {
      method:'POST',
      headers:{
        'Authorization':`Bearer ${grant}`,
        'Content-Type':'application/json',
        'X-SpeakLab-Protocol':'1',
      },
      body:JSON.stringify({
        text:phrase,
        language:'en-US',
        voiceProfile:'default',
        speakingRate:0.9,
        style:'clear, natural language-learning model voice',
        cachePolicy:'cache-static',
      }),
    });
    if (!response.ok) throw await responseError(response);
    const audio = await response.blob();
    invariant(audio.size > 0, 'EMPTY_TTS_AUDIO', 'La voz modelo llegó vacía.');
    return audio;
  }

  async function transcribe(normalized, grant){
    const response = await fetch(`${gatewayBase()}/v1/stt`, {
      method:'POST',
      headers:{
        'Authorization':`Bearer ${grant}`,
        'Content-Type':normalized.mimeType,
        'X-SpeakLab-Protocol':'1',
        'X-SpeakLab-Language':'en',
        'X-SpeakLab-Duration-Ms':String(normalized.durationMs),
        'X-SpeakLab-Vocabulary-Hints':encodeURIComponent('[]'),
      },
      body:normalized.audio,
    });
    if (!response.ok) throw await responseError(response);
    return await response.json();
  }

  async function pronunciation(normalized, referenceText, grant){
    const reference = clean(referenceText);
    invariant(reference, 'MISSING_REFERENCE_TEXT', 'No hay frase objetivo para el evaluador.');
    const response = await fetch(`${gatewayBase()}/v1/pronunciation`, {
      method:'POST',
      headers:{
        'Authorization':`Bearer ${grant}`,
        'Content-Type':normalized.mimeType,
        'X-SpeakLab-Protocol':'1',
        'X-SpeakLab-Language':'en-US',
        'X-SpeakLab-Duration-Ms':String(normalized.durationMs),
        'X-SpeakLab-Reference-Text':encodeURIComponent(reference),
        'X-SpeakLab-Rubric-Version':encodeURIComponent('speaklab-pronunciation-v0'),
      },
      body:normalized.audio,
    });
    if (!response.ok) throw await responseError(response);
    const data = await response.json();
    invariant(data && data.official === false, 'OFFICIAL_RESULT_FORBIDDEN', 'El piloto no admite resultados oficiales.');
    invariant(data.calibrated === false, 'CALIBRATED_RESULT_FORBIDDEN', 'El piloto continúa en calibración.');
    return data;
  }

  async function evaluateRecording(rawBlob, referenceText){
    const normalized = await normalizeToWav16kMono(rawBlob);
    const grant = await requestGrant(PRACTICE_SCOPES);
    // La frase objetivo viaja solamente al evaluador de pronunciación.
    // El STT primario recibe exactamente el mismo audio, sin referenceText/hints de frase.
    const [stt, evaluation, sha256] = await Promise.all([
      transcribe(normalized, grant),
      pronunciation(normalized, referenceText, grant),
      sha256Hex(normalized.audio),
    ]);
    return Object.freeze({
      transcript:Object.freeze({
        text:clean(stt && stt.text),
        language:clean(stt && stt.language) || 'en',
        noSpeechDetected:stt && stt.noSpeechDetected === true,
      }),
      pronunciation:evaluation,
      evidence:Object.freeze({
        sha256,
        bytes:normalized.audio.size,
        durationMs:normalized.durationMs,
        mimeType:normalized.mimeType,
        sampleRate:normalized.sampleRate,
        channels:normalized.channels,
      }),
      official:false,
      calibrated:false,
    });
  }

  function clearGrantCache(){
    grantCache.clear();
  }

  window.addEventListener('an:session-changed', clearGrantCache);

  window.SpeakLabPilotRuntimeCS21A216 = Object.freeze({
    version:VERSION,
    gatewayBase,
    support,
    preferredRecordingMimeType,
    normalizeToWav16kMono,
    synthesize,
    evaluateRecording,
    clearGrantCache,
    limits:Object.freeze({ maxDurationMs:MAX_DURATION_MS, maxBytes:MAX_BYTES }),
  });
})();
