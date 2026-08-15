import assert from 'node:assert/strict';
import { VOICE_GATEWAY_SCOPES } from '../prototypes/speak_lab_phase1/gateway_protocol.js';
import { createSpeakLabCloudflareWorker } from '../prototypes/speak_lab_phase2/cloudflare_voice_worker.mjs';

const BASE = 'https://voice-qa.example.test';
const ORIGIN = 'https://qa.example.test';
const SIGNING_SECRET = 'TEST_ONLY_DIAGNOSTIC_SIGNING_SECRET';
const OPENAI_TEST_KEY = 'sk-test-only-diagnostic-never-real-1234567890';
const EXPECTED_TEXT = "What's your name?";
const nowMs = Date.now();
const nowSeconds = Math.floor(nowMs / 1000);

async function voiceGrant() {
  const claims = {
    iss:'campus-auth',
    aud:'speak-lab-voice-gateway',
    sub:'sl_diagqa123456',
    role:'admin',
    scopes:[VOICE_GATEWAY_SCOPES.TTS_READ],
    iat:nowSeconds,
    exp:nowSeconds + 120,
    jti:'jti_diag_qa_0001',
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SIGNING_SECRET),
    { name:'HMAC', hash:'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${Buffer.from(new Uint8Array(signature)).toString('base64url')}`;
}

const logs = [];
const worker = createSpeakLabCloudflareWorker({
  nowMs:() => nowMs,
  requestIdFactory:() => 'cf_diag_request_1',
  logger:{ log:value => logs.push(String(value)) },
  fetchImpl:async (url, init = {}) => {
    assert.equal(String(url), 'https://api.openai.com/v1/audio/speech');
    assert.equal(init.headers.Authorization, `Bearer ${OPENAI_TEST_KEY}`);
    const payload = JSON.parse(init.body);
    assert.equal(payload.input, EXPECTED_TEXT);
    return new Response(JSON.stringify({
      error:{
        message:`permission denied for ${OPENAI_TEST_KEY}; input=${EXPECTED_TEXT}`,
        type:'invalid_request_error',
      },
    }), {
      status:403,
      headers:{
        'Content-Type':'application/json',
        'x-request-id':'req_diag_openai_403',
      },
    });
  },
});

const env = {
  ENVIRONMENT:'qa',
  ALLOWED_ORIGINS:ORIGIN,
  VOICE_GRANT_SIGNING_SECRET:SIGNING_SECRET,
  OPENAI_API_KEY:OPENAI_TEST_KEY,
  VOICE_RATE_LIMITER:{ limit:async () => ({ success:true }) },
};

const response = await worker.fetch(new Request(`${BASE}/v1/tts`, {
  method:'POST',
  headers:{
    Origin:ORIGIN,
    Authorization:`Bearer ${await voiceGrant()}`,
    'Content-Type':'application/json',
  },
  body:JSON.stringify({
    text:EXPECTED_TEXT,
    language:'en-US',
    voiceProfile:'default',
    speakingRate:0.88,
    style:'clear, natural language-learning model voice',
    cachePolicy:'no-store',
  }),
}), env);

assert.equal(response.status, 502);
const publicBody = await response.json();
assert.equal(publicBody.error, 'OPENAI_AUDIO_HTTP_ERROR');
assert.equal(publicBody.message, 'Proveedor de voz temporalmente no disponible.');
assert.equal(publicBody.upstreamStatus, undefined);
assert.equal(publicBody.upstreamRequestId, undefined);
assert.doesNotMatch(JSON.stringify(publicBody), /permission denied|sk-test-only|What's your name/i);

assert.equal(logs.length, 1);
const technical = JSON.parse(logs[0]);
assert.equal(technical.errorClass, 'OPENAI_AUDIO_HTTP_ERROR');
assert.equal(technical.status, 502);
assert.equal(technical.upstreamStatus, 403);
assert.equal(technical.upstreamRequestId, 'req_diag_openai_403');
assert.equal(technical.requestId, 'cf_diag_request_1');
assert.doesNotMatch(JSON.stringify(technical), /permission denied|sk-test-only|What's your name/i);
assert.doesNotMatch(JSON.stringify(technical), /input=/i);

console.log(JSON.stringify({
  ok:true,
  diagnostic:'upstream-status-and-request-id-only',
  public_response_redacted:true,
  upstream_status_logged:technical.upstreamStatus,
  upstream_request_id_logged:technical.upstreamRequestId,
  network_calls_real:0,
  secrets_real:0,
}, null, 2));