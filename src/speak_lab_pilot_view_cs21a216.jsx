// SPEAK LAB · CS21A216 · vista piloto docente/estudiante
/* global React */
(function(){
  'use strict';

  const PHRASES = [
    { id:'SL01', level:'B1', text:"What's your name?", focus:'Introductions', hint:'Escuchá la frase completa y repetila con ritmo natural.' },
    { id:'SL02', level:'B1', text:'My name is Daniel.', focus:'Introductions', hint:'No cortes demasiado entre “name” e “is”.' },
    { id:'SL03', level:'B1', text:'Where are you from?', focus:'Questions', hint:'Intentá decir la pregunta como una sola unidad de sentido.' },
    { id:'SL04', level:'B1', text:'I am from Costa Rica.', focus:'Introductions', hint:'Mantené clara la diferencia entre “am” y “from”.' },
    { id:'SL05', level:'B1', text:'Can you repeat, please?', focus:'Classroom English', hint:'Buscá un ritmo natural y una entonación amable al final.' },
    { id:'SL06', level:'B1', text:"I don't understand.", focus:'Classroom English', hint:'No agregués una vocal extra al final de “understand”.' },
    { id:'SL07', level:'B1', text:'Three students are in the classroom.', focus:'TH /θ/', hint:'Prestá atención al sonido inicial de “three”.' },
    { id:'SL08', level:'B2', text:'I usually get up at seven o’clock.', focus:'Rhythm', hint:'Evitá pronunciar cada palabra como una oración separada.' },
    { id:'SL09', level:'B2', text:'She works in a very busy office.', focus:'V/B + endings', hint:'Prestá atención a “very” y a la terminación de “works”.' },
    { id:'SL10', level:'B2', text:'I would like to book a room for two nights.', focus:'Mission language', hint:'Intentá mantener fluidez en toda la frase antes de buscar perfección.' },
  ];

  function runtime(){
    const value = window.SpeakLabPilotRuntimeCS21A216;
    if (!value) throw new Error('El runtime de Speak LAB no terminó de cargar.');
    return value;
  }

  function formatTime(ms){
    const total = Math.max(0, Math.floor(Number(ms || 0) / 1000));
    return `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
  }

  function friendlyError(error){
    const code = String(error && error.code || '');
    if (code === 'CAMPUS_SESSION_REQUIRED' || code === 'CAMPUS_SESSION_INVALID') return 'Tu sesión venció. Volvé a iniciar sesión en el Campus.';
    if (code === 'ORIGIN_NOT_ALLOWED') return 'Speak LAB todavía no está habilitado para este origen del Campus.';
    if (code === 'NotAllowedError' || code === 'PermissionDeniedError') return 'El permiso del micrófono fue rechazado. Habilitalo en el navegador para continuar.';
    if (code === 'NotFoundError' || code === 'DevicesNotFoundError') return 'No se encontró un micrófono disponible.';
    if (code === 'AUDIO_TOO_LONG') return 'El intento superó 30 segundos. Grabalo nuevamente.';
    if (code === 'CAMPUS_AUTH_TIMEOUT' || code === 'AZURE_PRONUNCIATION_TIMEOUT') return 'El servicio de voz tardó demasiado. Tu intento no se convierte en un error de pronunciación; podés enviarlo nuevamente.';
    return String(error && error.message || 'No se pudo completar el intento. Probá nuevamente.');
  }

  function SpeakLabPilotView({ onClose = null }){
    const [index,setIndex] = React.useState(0);
    const [consent,setConsent] = React.useState(false);
    const [recording,setRecording] = React.useState(false);
    const [elapsed,setElapsed] = React.useState(0);
    const [rawBlob,setRawBlob] = React.useState(null);
    const [rawUrl,setRawUrl] = React.useState('');
    const [busy,setBusy] = React.useState('');
    const [result,setResult] = React.useState(null);
    const [error,setError] = React.useState('');
    const [status,setStatus] = React.useState('Listo para practicar.');
    const recorderRef = React.useRef(null);
    const streamRef = React.useRef(null);
    const chunksRef = React.useRef([]);
    const timerRef = React.useRef(null);
    const startedRef = React.useRef(0);
    const phrase = PHRASES[index];
    const role = String((window.getSesion && window.getSesion() || {}).rol || '').toLowerCase();

    const clearTimer = React.useCallback(() => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    }, []);

    const stopStream = React.useCallback(() => {
      const stream = streamRef.current;
      if (stream) {
        try { stream.getTracks().forEach(track => track.stop()); } catch (_) {}
      }
      streamRef.current = null;
    }, []);

    const clearAttempt = React.useCallback((message = 'Listo para practicar.') => {
      clearTimer();
      stopStream();
      recorderRef.current = null;
      chunksRef.current = [];
      if (rawUrl) {
        try { URL.revokeObjectURL(rawUrl); } catch (_) {}
      }
      setRawUrl('');
      setRawBlob(null);
      setResult(null);
      setError('');
      setRecording(false);
      setElapsed(0);
      setStatus(message);
    }, [clearTimer, stopStream, rawUrl]);

    React.useEffect(() => () => {
      clearTimer();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        try { recorder.stop(); } catch (_) {}
      }
      stopStream();
      if (rawUrl) {
        try { URL.revokeObjectURL(rawUrl); } catch (_) {}
      }
    }, [clearTimer, stopStream, rawUrl]);

    const listen = async () => {
      setError('');
      setBusy('tts');
      setStatus('Preparando la voz modelo…');
      try {
        const audioBlob = await runtime().synthesize(phrase.text);
        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);
        audio.onended = () => {
          try { URL.revokeObjectURL(url); } catch (_) {}
          setStatus('Ahora grabá tu intento.');
        };
        audio.onerror = () => {
          try { URL.revokeObjectURL(url); } catch (_) {}
          setError('No se pudo reproducir la voz modelo.');
        };
        await audio.play();
        setStatus('Escuchando el modelo…');
      } catch (e) {
        setError(friendlyError(e));
        setStatus('No se pudo reproducir el modelo.');
      } finally {
        setBusy('');
      }
    };

    const startRecording = async () => {
      setError('');
      setResult(null);
      if (!consent) {
        setError('Marcá primero la autorización de micrófono y procesamiento temporal del intento.');
        return;
      }
      const info = runtime().support();
      if (!info.secure || !info.microphone || !info.mediaRecorder || !info.audioContext || !info.offlineAudioContext) {
        setError('Este navegador no tiene el soporte seguro de audio requerido por Speak LAB.');
        return;
      }
      if (rawUrl) {
        try { URL.revokeObjectURL(rawUrl); } catch (_) {}
        setRawUrl('');
        setRawBlob(null);
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio:{ echoCancellation:true, noiseSuppression:true, autoGainControl:true },
          video:false,
        });
        streamRef.current = stream;
        const mimeType = runtime().preferredRecordingMimeType();
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        recorderRef.current = recorder;
        chunksRef.current = [];

        recorder.addEventListener('dataavailable', event => {
          if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
        });
        recorder.addEventListener('start', () => {
          startedRef.current = Date.now();
          setElapsed(0);
          setRecording(true);
          setStatus('Grabando… hablá con naturalidad.');
          clearTimer();
          timerRef.current = window.setInterval(() => {
            const ms = Date.now() - startedRef.current;
            setElapsed(ms);
            if (ms >= 29500 && recorder.state !== 'inactive') {
              try { recorder.stop(); } catch (_) {}
            }
          }, 200);
        });
        recorder.addEventListener('stop', () => {
          clearTimer();
          stopStream();
          setRecording(false);
          const chunks = chunksRef.current.slice();
          if (!chunks.length) {
            setError('La grabación quedó vacía. Intentá nuevamente.');
            setStatus('Grabación vacía.');
            return;
          }
          const type = recorder.mimeType || mimeType || 'audio/webm';
          const blob = new Blob(chunks, { type });
          const url = URL.createObjectURL(blob);
          setRawBlob(blob);
          setRawUrl(url);
          setStatus('Grabación lista. Escuchala antes de enviarla.');
        });
        recorder.addEventListener('error', event => {
          clearTimer();
          stopStream();
          setRecording(false);
          setError(friendlyError(event && event.error));
          setStatus('No se pudo completar la grabación.');
        });
        recorder.start(250);
      } catch (e) {
        stopStream();
        setRecording(false);
        if (e && !e.code) e.code = e.name;
        setError(friendlyError(e));
        setStatus('Micrófono no disponible.');
      }
    };

    const stopRecording = () => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === 'inactive') return;
      try {
        recorder.stop();
        setStatus('Preparando tu grabación…');
      } catch (_) {}
    };

    const submit = async () => {
      if (!rawBlob || busy) return;
      setBusy('evaluate');
      setError('');
      setResult(null);
      setStatus('Normalizando audio y analizando tu intento…');
      try {
        const evaluated = await runtime().evaluateRecording(rawBlob, phrase.text);
        setResult(evaluated);
        setStatus('Intento procesado. Revisá la retroalimentación.');
        try {
          window.dispatchEvent(new CustomEvent('an:speak-lab-pilot-result', {
            detail:{
              phraseId:phrase.id,
              role,
              transcript:evaluated.transcript,
              pronunciation:evaluated.pronunciation,
              evidence:evaluated.evidence,
              official:false,
              calibrated:false,
            },
          }));
        } catch (_) {}
      } catch (e) {
        setError(friendlyError(e));
        setStatus('El intento no pudo procesarse.');
      } finally {
        setBusy('');
      }
    };

    const move = delta => {
      if (recording || busy) return;
      const next = Math.min(Math.max(index + delta, 0), PHRASES.length - 1);
      if (next === index) return;
      clearAttempt('Listo para practicar.');
      setIndex(next);
    };

    const suggestions = result && Array.isArray(result.pronunciation && result.pronunciation.issues)
      ? result.pronunciation.issues
      : [];

    return (
      <section className="sl216" data-screen-label={`Speak LAB · ${role === 'teacher' ? 'Docente' : 'Estudiante'} · Piloto`}>
        <style>{`
          .sl216{min-height:100%;background:#f7f4ef;color:#14213d;font-family:var(--f-sans,system-ui);padding:24px}
          .sl216-shell{max-width:980px;margin:0 auto;display:grid;gap:18px}
          .sl216-head,.sl216-card{background:#fff;border:1px solid var(--line,#e5e0d8);border-radius:20px;box-shadow:0 12px 34px rgba(20,33,61,.07)}
          .sl216-head{padding:22px 24px;display:flex;justify-content:space-between;gap:18px;align-items:flex-start}
          .sl216-card{padding:24px}
          .sl216-kicker{font-size:10px;letter-spacing:.16em;text-transform:uppercase;font-weight:900;color:var(--an-granate,#7A1E2C)}
          .sl216-title{font-family:var(--f-serif,Georgia,serif);font-size:32px;line-height:1.05;margin:5px 0 8px;color:var(--an-navy-ink,#001E47)}
          .sl216-muted{color:#687184;font-size:13px;line-height:1.55}
          .sl216-badge{padding:7px 11px;border-radius:999px;background:#FFF4D6;color:#805500;font-size:11px;font-weight:900;white-space:nowrap}
          .sl216-meta{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
          .sl216-pill{padding:5px 9px;border-radius:999px;background:#eef3f9;color:#29415f;font-size:11px;font-weight:800}
          .sl216-phrase{font-family:var(--f-serif,Georgia,serif);font-size:34px;line-height:1.18;color:#001e47;margin:10px 0 12px}
          .sl216-hint{padding:12px 14px;border-radius:12px;background:#f7f8fa;font-size:13px;color:#526074;line-height:1.5}
          .sl216-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
          .sl216-btn{border:1px solid #cdd5df;background:#fff;border-radius:11px;padding:10px 15px;font:inherit;font-size:13px;font-weight:800;cursor:pointer;color:#17324f}
          .sl216-btn.primary{background:var(--an-navy,#002F6C);border-color:var(--an-navy,#002F6C);color:#fff}
          .sl216-btn.record{background:#7A1E2C;border-color:#7A1E2C;color:#fff}
          .sl216-btn:disabled{opacity:.45;cursor:not-allowed}
          .sl216-consent{margin-top:18px;padding:14px;border:1px solid #e8dfcf;border-radius:14px;background:#fffcf5;display:flex;gap:10px;align-items:flex-start;font-size:12px;line-height:1.5;color:#594f41}
          .sl216-status{margin-top:14px;padding:10px 12px;border-radius:10px;background:#eef3f9;color:#29415f;font-size:12px;font-weight:700}
          .sl216-error{margin-top:12px;padding:11px 13px;border-radius:10px;background:#fdecec;color:#8b1f1f;font-size:12px;font-weight:700}
          .sl216-audio{width:100%;margin-top:14px}
          .sl216-result{margin-top:20px;border-top:1px solid #ece7de;padding-top:18px;display:grid;gap:13px}
          .sl216-resultbox{padding:14px;border-radius:14px;background:#f5f8fc;border:1px solid #dce6f0}
          .sl216-transcript{font-size:20px;font-weight:800;color:#17324f;margin-top:5px}
          .sl216-suggest{padding:11px 13px;border-radius:12px;background:#fff8e7;color:#72510a;font-size:13px;line-height:1.5}
          .sl216-foot{font-size:11px;color:#687184;line-height:1.5;padding-top:4px}
          .sl216-nav{display:flex;justify-content:space-between;gap:10px;margin-top:18px}
          @media(max-width:620px){.sl216{padding:12px}.sl216-head,.sl216-card{border-radius:15px}.sl216-head{padding:17px;flex-direction:column}.sl216-card{padding:17px}.sl216-title{font-size:27px}.sl216-phrase{font-size:28px}.sl216-actions{display:grid;grid-template-columns:1fr 1fr}.sl216-btn{width:100%}.sl216-nav{display:grid;grid-template-columns:1fr 1fr}}
        `}</style>
        <div className="sl216-shell">
          <header className="sl216-head">
            <div>
              <div className="sl216-kicker">Campus Virtual · práctica oral</div>
              <h1 className="sl216-title">Speak LAB</h1>
              <div className="sl216-muted">Escuchá, hablá y recibí retroalimentación para seguir practicando tu inglés.</div>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <span className="sl216-badge">Beta · práctica</span>
              {typeof onClose === 'function' && <button type="button" className="sl216-btn" onClick={onClose}>Cerrar</button>}
            </div>
          </header>

          <article className="sl216-card">
            <div className="sl216-meta">
              <span className="sl216-pill">{phrase.id}</span>
              <span className="sl216-pill">{phrase.level}</span>
              <span className="sl216-pill">{phrase.focus}</span>
              <span className="sl216-pill">{index + 1} / {PHRASES.length}</span>
            </div>

            <div className="sl216-kicker">Escuchá y repetí</div>
            <div className="sl216-phrase">{phrase.text}</div>
            <div className="sl216-hint">{phrase.hint}</div>

            <div className="sl216-actions">
              <button type="button" className="sl216-btn primary" onClick={listen} disabled={!!busy || recording}>
                {busy === 'tts' ? 'Preparando…' : '🔊 Escuchar modelo'}
              </button>
              {!recording ? (
                <button type="button" className="sl216-btn record" onClick={startRecording} disabled={!!busy}>🎙️ Grabar mi intento</button>
              ) : (
                <button type="button" className="sl216-btn record" onClick={stopRecording}>■ Detener · {formatTime(elapsed)}</button>
              )}
              <button type="button" className="sl216-btn" onClick={() => clearAttempt('Intento limpio. Escuchá el modelo y probá otra vez.')} disabled={recording || !!busy}>↻ Repetir</button>
            </div>

            <label className="sl216-consent">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} disabled={recording || !!busy} style={{marginTop:3}} />
              <span><strong>Autorizo usar mi micrófono para este intento.</strong> Al enviarlo, una copia normalizada del audio se procesa temporalmente por los servicios de voz de Speak LAB. El Campus no guarda el audio crudo de este piloto ni usa esta práctica como nota académica.</span>
            </label>

            <div className="sl216-status">{status}</div>
            {error && <div className="sl216-error" role="alert">{error}</div>}

            {rawUrl && (
              <div style={{marginTop:16}}>
                <div className="sl216-kicker">Revisá tu grabación</div>
                <audio className="sl216-audio" controls src={rawUrl} />
                <div className="sl216-actions">
                  <button type="button" className="sl216-btn primary" onClick={submit} disabled={!!busy || recording}>
                    {busy === 'evaluate' ? 'Analizando…' : 'Enviar y analizar'}
                  </button>
                </div>
              </div>
            )}

            {result && (
              <div className="sl216-result">
                <div className="sl216-resultbox">
                  <div className="sl216-kicker">El sistema entendió</div>
                  <div className="sl216-transcript">{result.transcript.noSpeechDetected ? 'No se detectó voz suficiente.' : (result.transcript.text || 'No se obtuvo una transcripción clara.')}</div>
                </div>

                <div>
                  <div className="sl216-kicker" style={{marginBottom:8}}>Sugerencias de práctica</div>
                  {suggestions.length ? suggestions.map((item, i) => (
                    <div className="sl216-suggest" key={`${item.code || 'issue'}-${i}`} style={{marginBottom:8}}>{item.message}</div>
                  )) : (
                    <div className="sl216-suggest">No se generó una observación específica en este intento. Volvé a escuchar el modelo y compará ritmo, sonidos y entonación antes de repetir.</div>
                  )}
                </div>

                <div className="sl216-foot">
                  Evaluación de práctica / beta. No corresponde a una calificación académica, no establece aprobación o reprobación y el motor continúa en proceso de calibración.
                </div>
              </div>
            )}

            <div className="sl216-nav">
              <button type="button" className="sl216-btn" onClick={() => move(-1)} disabled={index === 0 || recording || !!busy}>← Anterior</button>
              <button type="button" className="sl216-btn" onClick={() => move(1)} disabled={index === PHRASES.length - 1 || recording || !!busy}>Siguiente →</button>
            </div>
          </article>
        </div>
      </section>
    );
  }

  SpeakLabPilotView.__cs21a216 = true;
  window.SpeakLabPilotView = SpeakLabPilotView;
  window.SPEAK_LAB_PILOT_PHRASES_CS21A216 = Object.freeze(PHRASES.map(item => Object.freeze({...item})));
})();
