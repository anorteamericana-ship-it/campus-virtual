import fs from 'node:fs';
import path from 'node:path';
import {
  OpenAIAudioProvider,
  OPENAI_AUDIO_PROVIDER_DEFAULTS,
} from '../prototypes/speak_lab_phase2/openai_audio_provider.mjs';
import { SpeakLabContractError } from '../prototypes/speak_lab_phase1/contracts.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectContractError(fn, code) {
  let error;
  try { await fn(); } catch (caught) { error = caught; }
  assert(error instanceof SpeakLabContractError, `Se esperaba SpeakLabContractError ${code}`);
  assert(error.code === code, `Esperado ${code}; recibido ${error.code}`);
  return error;
}

const TEST_SECRET = 'TEST_SERVER_SECRET_NOT_A_REAL_KEY';
const calls = [];
const fakeFetch = async (url, init = {}) => {
  calls.push({ url:String(url), init });
  if (String(url).endsWith('/audio/speech')) {
    return new Response(new Uint8Array([73,68,51,4,0,0,0,0]), {
      status:200,
      headers:{
        'Content-Type':'audio/mpeg',
        'X-Request-Id':'req_tts_mock_001',
      },
    });
  }
  if (String(url).endsWith('/audio/transcriptions')) {
    return new Response(JSON.stringify({ text:'whats your name' }), {
      status:200,
      headers:{
        'Content-Type':'application/json',
        'X-Request-Id':'req_stt_mock_001',
      },
    });
  }
  return new Response(JSON.stringify({ error:{ message:'unexpected mock route' } }), { status:404, headers:{'Content-Type':'application/json'} });
};

const provider = new OpenAIAudioProvider({
  env:{ OPENAI_API_KEY:TEST_SECRET },
  fetchImpl:fakeFetch,
});

assert(OPENAI_AUDIO_PROVIDER_DEFAULTS.ttsModel === 'gpt-4o-mini-tts', 'Default TTS model inesperado');
assert(OPENAI_AUDIO_PROVIDER_DEFAULTS.sttModel === 'gpt-4o-mini-transcribe', 'Default STT model inesperado');

const tts = await provider.synthesize({
  text:"What's your name?",
  language:'en-US',
  voiceProfile:'curriculum-model',
  speakingRate:0.9,
  style:'Speak clearly and naturally for an English learner.',
  cachePolicy:'cache-static',
});
assert(tts.syntheticVoice === true, 'TTS debe quedar marcado syntheticVoice=true');
assert(tts.provider.provider === 'openai', 'TTS provider debe ser openai');
assert(tts.provider.model === 'gpt-4o-mini-tts', 'TTS model metadata incorrecta');
assert(tts.provider.requestId === 'req_tts_mock_001', 'TTS request id perdido');
assert(tts.audio.size > 0, 'TTS mock devolvió audio vacío');

const ttsCall = calls.find(call => call.url.endsWith('/audio/speech'));
assert(ttsCall, 'No se observó request TTS simulado');
assert(ttsCall.url === 'https://api.openai.com/v1/audio/speech', `Endpoint TTS incorrecto: ${ttsCall.url}`);
assert(ttsCall.init.headers.Authorization === `Bearer ${TEST_SECRET}`, 'TTS no usó secreto server-side');
const ttsBody = JSON.parse(ttsCall.init.body);
assert(ttsBody.model === 'gpt-4o-mini-tts', 'TTS body model incorrecto');
assert(ttsBody.input === "What's your name?", 'TTS body input incorrecto');
assert(ttsBody.voice === 'marin', 'TTS voice default incorrecta');
assert(ttsBody.response_format === 'mp3', 'TTS formato default incorrecto');
assert(ttsBody.speed === 0.9, 'TTS speed no respetó contrato');
assert(ttsBody.instructions.includes('English learner'), 'TTS instructions no llegaron al proveedor compatible');

for (const legacyModel of ['tts-1','tts-1-hd','tts-1-legacy-snapshot']) {
  const callStart = calls.length;
  const legacyProvider = new OpenAIAudioProvider({
    env:{
      OPENAI_API_KEY:TEST_SECRET,
      SPEAK_LAB_TTS_MODEL:legacyModel,
    },
    fetchImpl:fakeFetch,
  });
  await legacyProvider.synthesize({
    text:'Legacy compatibility check',
    language:'en-US',
    style:'This instruction must not be sent to legacy TTS.',
  });
  const legacyCall = calls.slice(callStart).find(call => call.url.endsWith('/audio/speech'));
  assert(legacyCall, `No se observó request TTS legacy para ${legacyModel}`);
  const legacyBody = JSON.parse(legacyCall.init.body);
  assert(legacyBody.model === legacyModel, `Modelo legacy no llegó correctamente: ${legacyModel}`);
  assert(!Object.prototype.hasOwnProperty.call(legacyBody, 'instructions'), `${legacyModel} no admite instructions y el adaptador las envió`);
}

const learnerAudio = new Blob(['fake-learner-audio'], { type:'audio/webm' });
const stt = await provider.transcribe({
  audio:learnerAudio,
  language:'en',
  vocabularyHints:['name','student'],
  timestamps:'none',
});
assert(stt.text === 'whats your name', 'STT mock text incorrecto');
assert(stt.provider.provider === 'openai', 'STT provider metadata incorrecta');
assert(stt.provider.model === 'gpt-4o-mini-transcribe', 'STT model metadata incorrecta');
assert(stt.provider.requestId === 'req_stt_mock_001', 'STT request id perdido');

const sttCall = calls.find(call => call.url.endsWith('/audio/transcriptions'));
assert(sttCall, 'No se observó request STT simulado');
assert(sttCall.url === 'https://api.openai.com/v1/audio/transcriptions', `Endpoint STT incorrecto: ${sttCall.url}`);
assert(sttCall.init.headers.Authorization === `Bearer ${TEST_SECRET}`, 'STT no usó secreto server-side');
assert(sttCall.init.body instanceof FormData, 'STT debe enviar multipart FormData');
assert(sttCall.init.body.get('model') === 'gpt-4o-mini-transcribe', 'STT form model incorrecto');
assert(sttCall.init.body.get('language') === 'en', 'STT form language incorrecto');
assert(sttCall.init.body.get('file') instanceof Blob, 'STT form perdió audio file');
assert(sttCall.init.body.get('prompt') === null, 'STT primario NO debe enviar prompt');
assert(sttCall.init.body.get('expectedText') === null, 'STT filtró expectedText');
assert(sttCall.init.body.get('referenceText') === null, 'STT filtró referenceText');
assert(sttCall.init.body.get('vocabularyHints') === null, 'Vocabulary hints no deben convertirse silenciosamente en prompt');

const callsBeforeTimestampFailure = calls.length;
await expectContractError(() => provider.transcribe({
  audio:learnerAudio,
  language:'en',
  timestamps:'word',
}), 'STT_WORD_TIMESTAMPS_NOT_IMPLEMENTED');
assert(calls.length === callsBeforeTimestampFailure, 'Word timestamps no soportados no deben generar request');

await expectContractError(() => Promise.resolve(new OpenAIAudioProvider({
  env:{}, fetchImpl:fakeFetch,
})), 'OPENAI_API_KEY_REQUIRED');

await expectContractError(() => Promise.resolve(new OpenAIAudioProvider({
  env:{ OPENAI_API_KEY:TEST_SECRET },
  fetchImpl:fakeFetch,
  baseUrl:'https://evil.example/v1',
})), 'INVALID_OPENAI_BASE_URL');

const originalWindow = globalThis.window;
try {
  globalThis.window = {};
  await expectContractError(() => Promise.resolve(new OpenAIAudioProvider({
    env:{ OPENAI_API_KEY:TEST_SECRET }, fetchImpl:fakeFetch,
  })), 'SERVER_ONLY_PROVIDER');
} finally {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
}

const redactionProvider = new OpenAIAudioProvider({
  env:{ OPENAI_API_KEY:TEST_SECRET },
  fetchImpl:async () => new Response(JSON.stringify({ error:{ message:'bad credential sk-THIS_SHOULD_NEVER_SURFACE_123456' } }), {
    status:401,
    headers:{'Content-Type':'application/json','X-Request-Id':'req_error_001'},
  }),
});
const redacted = await expectContractError(() => redactionProvider.synthesize({ text:'Hello', language:'en-US' }), 'OPENAI_AUDIO_HTTP_ERROR');
assert(!redacted.message.includes('sk-THIS'), 'Error del proveedor filtró secreto con formato sk-*');
assert(redacted.message.includes('[REDACTED]'), 'Error del proveedor no marcó redacción');

const source = fs.readFileSync(path.join(process.cwd(), 'prototypes/speak_lab_phase2/openai_audio_provider.mjs'), 'utf8');
assert(!/console\.(log|error|warn)\s*\(/.test(source), 'Provider server-only no debe loguear payload/audio/secretos directamente');
assert(!source.includes('localStorage'), 'Provider server-only no puede leer localStorage');
assert(!source.includes('sessionStorage'), 'Provider server-only no puede leer sessionStorage');
assert(source.includes("form.append('file'"), 'Provider STT debe enviar archivo real');
assert(!/form\.append\(['"]prompt['"]/.test(source), 'Provider STT primario no puede agregar prompt');

console.log('SPEAK_LAB_OPENAI_AUDIO_PROVIDER_PASS');
console.log(`tts_endpoint=${ttsCall.url}`);
console.log(`stt_endpoint=${sttCall.url}`);
console.log(`network_calls_real=0`);
console.log(`fake_fetch_calls=${calls.length}`);
console.log('api_key_source=server_env_only');
console.log('stt_prompt=absent');
console.log('legacy_tts_instructions=blocked');
console.log('pronunciation_score=not_implemented');
