import {
  VOICE_GATEWAY_LIMITS,
  VOICE_GATEWAY_SCOPES,
  validateGatewaySttMetadata,
  validateVoiceGrantClaims,
} from '../prototypes/speak_lab_phase1/gateway_protocol.js';
import { VoiceGatewayClient } from '../prototypes/speak_lab_phase1/voice_gateway_client.js';
import {
  createMockVoiceGrant,
  startMockVoiceGateway,
  verifyMockVoiceGrant,
} from '../prototypes/speak_lab_phase1/mock_voice_gateway.mjs';
import { SpeakLabContractError } from '../prototypes/speak_lab_phase1/contracts.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectError(fn, code) {
  return Promise.resolve()
    .then(fn)
    .then(() => { throw new Error(`Se esperaba error ${code}`); })
    .catch(error => {
      if (error instanceof Error && error.message === `Se esperaba error ${code}`) throw error;
      const actual = error?.code || error?.message;
      assert(actual === code || String(actual).includes(code), `Esperado ${code}; recibido ${actual}`);
      return error;
    });
}

const now = Math.floor(Date.now() / 1000);

validateVoiceGrantClaims({
  iss:'campus-auth', aud:'speak-lab-voice-gateway', sub:'sl_subjectopaque01',
  role:'student', scopes:[VOICE_GATEWAY_SCOPES.TTS_READ], iat:now, exp:now+120, jti:'opaquegrantid001',
}, { nowSeconds:now });

await expectError(() => validateVoiceGrantClaims({
  iss:'campus-auth', aud:'speak-lab-voice-gateway', sub:'sl_subjectopaque01',
  name:'Daniel Student', role:'student', scopes:[VOICE_GATEWAY_SCOPES.TTS_READ],
  iat:now, exp:now+120, jti:'opaquegrantid002',
}, { nowSeconds:now }), 'VOICE_GRANT_PII_FORBIDDEN');

await expectError(() => validateVoiceGrantClaims({
  iss:'campus-auth', aud:'speak-lab-voice-gateway', sub:'sl_subjectopaque01',
  role:'student', scopes:[VOICE_GATEWAY_SCOPES.TTS_READ], iat:now, exp:now+601, jti:'opaquegrantid003',
}, { nowSeconds:now }), 'VOICE_GRANT_TTL_TOO_LONG');

await expectError(() => validateGatewaySttMetadata({
  byteLength:1200, durationMs:1200, mimeType:'audio/webm', language:'en',
  expectedText:"What's your name?",
}), 'STT_TARGET_LEAKAGE');

await expectError(() => validateGatewaySttMetadata({
  byteLength:VOICE_GATEWAY_LIMITS.maxAudioBytes + 1,
  durationMs:1200, mimeType:'audio/webm', language:'en',
}), 'AUDIO_TOO_LARGE');

const gateway = await startMockVoiceGateway();
try {
  const ttsGrant = gateway.createGrant({ scopes:[VOICE_GATEWAY_SCOPES.TTS_READ], jti:'ttsonlygrant0001' });
  const sttGrant = gateway.createGrant({ scopes:[VOICE_GATEWAY_SCOPES.STT_WRITE], jti:'sttonlygrant0001' });

  const verified = verifyMockVoiceGrant(ttsGrant, gateway.secret);
  assert(verified.scopes.length === 1 && verified.scopes[0] === VOICE_GATEWAY_SCOPES.TTS_READ, 'Firma/grant TTS inválido');

  const grants = new Map([
    [VOICE_GATEWAY_SCOPES.TTS_READ, ttsGrant],
    [VOICE_GATEWAY_SCOPES.STT_WRITE, sttGrant],
  ]);
  const client = new VoiceGatewayClient({
    baseUrl:gateway.baseUrl,
    testMode:true,
    getVoiceGrant:async scope => grants.get(scope) || '',
  });

  const health = await fetch(`${gateway.baseUrl}/health`).then(response => response.json());
  assert(health.ok && health.mock === true, 'Mock gateway health inválido');

  const tts = await client.synthesize({
    text:"What's your name?",
    language:'en-US',
    voiceProfile:'clear-us-model',
    speakingRate:0.9,
    cachePolicy:'cache-static',
  });
  assert(tts.mock === true, 'TTS mock debe conservar mock=true');
  assert(tts.audio instanceof Blob && tts.audio.size > 44, 'TTS mock no devolvió WAV binario');
  assert(tts.provider.provider === 'mock-gateway', 'TTS mock provider incorrecto');
  assert(tts.provider.model === 'MOCK_SILENCE_NOT_SPEECH', 'TTS mock no está inequívocamente etiquetado');

  const learnerAudio = new Blob(['synthetic-browser-audio-payload'], { type:'audio/webm' });
  const stt = await client.transcribe({
    audio:learnerAudio,
    language:'en',
    vocabularyHints:['name','student'],
  }, { durationMs:1250 });
  assert(stt.mock === true, 'STT mock debe conservar mock=true');
  assert(stt.text === '[MOCK_STT_NO_RECOGNITION]', 'STT mock no debe parecer transcripción real');
  assert(stt.provider.model === 'MOCK_STT_NO_RECOGNITION', 'STT model mock ambiguo');

  const wrongScope = await fetch(`${gateway.baseUrl}/v1/stt`, {
    method:'POST',
    headers:{
      Authorization:`Bearer ${ttsGrant}`,
      'Content-Type':'audio/webm',
      'X-SpeakLab-Duration-Ms':'1000',
      'X-SpeakLab-Language':'en',
    },
    body:learnerAudio,
  });
  assert(wrongScope.status === 403, `Scope incorrecto debía dar 403, dio ${wrongScope.status}`);

  const leakedTarget = await fetch(`${gateway.baseUrl}/v1/stt`, {
    method:'POST',
    headers:{
      Authorization:`Bearer ${sttGrant}`,
      'Content-Type':'audio/webm',
      'X-SpeakLab-Duration-Ms':'1000',
      'X-SpeakLab-Language':'en',
      'X-SpeakLab-Expected-Text':"What's your name?",
    },
    body:learnerAudio,
  });
  const leakedTargetBody = await leakedTarget.json();
  assert(leakedTarget.status === 400 && leakedTargetBody.error === 'STT_TARGET_LEAKAGE', 'Gateway no bloqueó target leakage por header');

  const expired = createMockVoiceGrant({
    secret:gateway.secret,
    scopes:[VOICE_GATEWAY_SCOPES.TTS_READ],
    nowSeconds:now-300,
    ttlSeconds:60,
    jti:'expiredgrant0001',
  });
  const expiredResponse = await fetch(`${gateway.baseUrl}/v1/tts`, {
    method:'POST',
    headers:{ Authorization:`Bearer ${expired}`, 'Content-Type':'application/json' },
    body:JSON.stringify({ text:'Hello', language:'en-US' }),
  });
  assert(expiredResponse.status === 401, `Grant expirado debía dar 401, dio ${expiredResponse.status}`);

  await expectError(() => new VoiceGatewayClient({
    baseUrl:'https://api.openai.com',
    getVoiceGrant:async () => 'grant',
  }), 'DIRECT_PROVIDER_FORBIDDEN');

  const secretClient = new VoiceGatewayClient({
    baseUrl:gateway.baseUrl,
    testMode:true,
    getVoiceGrant:async () => 'sk-THIS_IS_NOT_ALLOWED_123456789',
  });
  await expectError(() => secretClient.synthesize({ text:'Hello', language:'en-US' }), 'PROVIDER_SECRET_FORBIDDEN');

  const paths = gateway.requestLog.map(entry => entry.path);
  assert(paths.includes('/v1/tts') && paths.includes('/v1/stt'), 'Request log no contiene TTS/STT');
  assert(gateway.requestLog.every(entry => !('name' in entry) && !('email' in entry) && !('cedula' in entry)), 'Request log filtró PII directa');

  console.log('SPEAK_LAB_GATEWAY_PROTOCOL_PASS');
  console.log(`requests=${gateway.requestLog.length}`);
  console.log(`grant_ttl_max=${VOICE_GATEWAY_LIMITS.grantMaxTtlSeconds}`);
  console.log(`audio_max_bytes=${VOICE_GATEWAY_LIMITS.maxAudioBytes}`);
  console.log('provider_calls=0');
  console.log('mock_tts=explicit');
  console.log('mock_stt=explicit');
  console.log('target_leakage=blocked');
  console.log('provider_secrets=blocked');
} finally {
  await gateway.close();
}
