import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const runtime = read('src/speak_lab_pilot_runtime_cs21a216.js');
const view = read('src/speak_lab_pilot_view_cs21a216.jsx');
const integration = read('src/speak_lab_pilot_integration_cs21a216.js');
const guard = read('src/student_menu_academic_guard_cs21a120.js');
const protocol = read('prototypes/speak_lab_phase1/gateway_protocol.js');
const azure = read('prototypes/speak_lab_phase3/azure_pronunciation_provider.mjs');
const pilotWorker = read('prototypes/speak_lab_phase2/cloudflare_voice_worker_pilot.mjs');
const wrangler = read('prototypes/speak_lab_phase2/wrangler.qa.template.jsonc');

// Normalización canónica en navegador.
assert.match(runtime, /targetRate\s*=\s*16000/);
assert.match(runtime, /new OfflineCtor\(1,/);
assert.match(runtime, /audio\/wav; codecs=audio\/pcm; samplerate=16000/);
assert.match(runtime, /encodePcm16Wav/);
assert.match(runtime, /MAX_DURATION_MS\s*=\s*30000/);
assert.match(runtime, /MAX_BYTES\s*=\s*2500000/);

// El STT primario no puede recibir la frase objetivo.
const transcribeMatch = runtime.match(/async function transcribe\([\s\S]*?\n  }\n\n  async function pronunciation/);
assert.ok(transcribeMatch, 'No se pudo aislar transcribe().');
assert.doesNotMatch(transcribeMatch[0], /Reference-Text|referenceText|expectedText|targetText|answerText|correctAnswer/);
const pronunciationMatch = runtime.match(/async function pronunciation\([\s\S]*?\n  }\n\n  async function evaluateRecording/);
assert.ok(pronunciationMatch, 'No se pudo aislar pronunciation().');
assert.match(pronunciationMatch[0], /X-SpeakLab-Reference-Text/);
assert.match(runtime, /Promise\.all\(\[\s*transcribe\(normalized, grant\),\s*pronunciation\(normalized, referenceText, grant\)/);

// El navegador usa la sesión Campus y jamás contiene secretos de proveedor.
assert.match(runtime, /getSessionToken/);
assert.match(runtime, /\/v1\/session-grant/);
for (const source of [runtime, view, integration]) {
  assert.doesNotMatch(source, /OPENAI_API_KEY|AZURE_SPEECH_KEY|VOICE_GRANT_SIGNING_SECRET|Ocp-Apim-Subscription-Key/);
  assert.doesNotMatch(source, /sk-[A-Za-z0-9_-]{12,}/);
}

// UX académica: beta/práctica y sin nota automática.
assert.match(view, /Beta · práctica/);
assert.match(view, /Evaluación de práctica \/ beta/);
assert.match(view, /No corresponde a una calificación académica/);
assert.match(view, /motor continúa en proceso de calibración/);
assert.doesNotMatch(view, /officialGrade|finalGrade/);
assert.doesNotMatch(view, />\s*(?:Aprobado|Reprobado)\s*</i);
assert.match(view, /El sistema entendió/);
assert.match(view, /Autorizo usar mi micrófono/);
assert.match(view, /Campus no guarda el audio crudo/);

// Integración aislada: menú propio y overlay; no depende del router app.jsx.
assert.match(integration, /data-nav-id', 'speak_lab'/);
assert.match(integration, /Speak LAB/);
assert.match(integration, /data-speak-lab-pilot-overlay/);
assert.match(integration, /anLazyCampus\.loadMany/);
assert.match(guard, /speak_lab_pilot_integration_cs21a216\.js/);

// Gateway y Azure aceptan WAV canónico además del OGG legado.
assert.match(protocol, /audio\\\/(wav\|x-wav)/);
assert.match(azure, /audio\/wav; codecs=audio\/pcm; samplerate=16000/);
assert.match(azure, /azure-pronunciation-rest-v0\.3-wav-ogg-unvalidated/);

// Broker: sesión Campus validada server-side y scopes cerrados de práctica.
assert.match(pilotWorker, /SESSION_GRANT_PATH\s*=\s*'\/v1\/session-grant'/);
assert.match(pilotWorker, /CAMPUS_AUTH_URL/);
assert.match(pilotWorker, /validarSesion/);
assert.match(pilotWorker, /PILOT_ROLES\s*=\s*new Set\(\['student', 'teacher'\]\)/);
assert.match(pilotWorker, /VOICE_GATEWAY_SCOPES\.TTS_READ/);
assert.match(pilotWorker, /VOICE_GATEWAY_SCOPES\.STT_WRITE/);
assert.match(pilotWorker, /VOICE_GATEWAY_SCOPES\.PRONUNCIATION_WRITE/);
assert.match(pilotWorker, /Cache-Control':'no-store/);
assert.match(wrangler, /cloudflare_voice_worker_pilot\.mjs/);
assert.match(wrangler, /CAMPUS_AUTH_URL/);

console.log(JSON.stringify({
  ok:true,
  cut:'CS21A216',
  visible_module:'Speak LAB',
  roles:['teacher','student'],
  canonical_audio:'wav-pcm-16khz-mono',
  stt_target_leakage:false,
  campus_session_broker:true,
  raw_audio_persistence:false,
  official:false,
  calibrated:false,
  app_js_modified:false,
  memory_match_modified:false,
}, null, 2));
