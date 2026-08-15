import assert from 'node:assert/strict';
import { VOICE_GATEWAY_SCOPES } from '../prototypes/speak_lab_phase1/gateway_protocol.js';
import { createSpeakLabCloudflareWorker } from '../prototypes/speak_lab_phase2/cloudflare_voice_worker.mjs';

const ORIGIN = 'https://qa.example.test';
const BASE = 'https://voice-qa.example.test';
const SIGNING_SECRET = 'TEST_ONLY_CLOUDFLARE_VOICE_GRANT_SECRET';
const OPENAI_TEST_KEY = 'sk-test-only-never-real-1234567890';
const START_MS = Date.now();
const START_SECONDS = Math.floor(START_MS / 1000);

function base64urlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

async function hmacBase64url(payload, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name:'HMAC', hash:'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Buffer.from(new Uint8Array(signature)).toString('base64url');
}

async function grant({
  scopes = [VOICE_GATEWAY_SCOPES.TTS_READ, VOICE_GATEWAY_SCOPES.STT_WRITE],
  iat = START_SECONDS,
  exp = START_SECONDS + 120,
  sub = 'sl_cloudflareqa01',
  role = 'student',
  jti = 'jti_cloudflare_qa_001',
  secret = SIGNING_SECRET,
} = {}) {
  const payload = base64urlJson({
    iss:'campus-auth',
    aud:'speak-lab-voice-gateway',
    sub,
    role,
    scopes,
    iat,
    exp,
    jti,
  });
  return `${payload}.${await hmacBase64url(payload, secret)}`;
}

class FakeRateLimiter {
  constructor() {
    this.success = true;
    this.calls = [];
  }
  async limit({ key }) {
    this.calls.push(key);
    return { success:this.success };
  }
}

const providerCalls = [];
let providerMode = 'success';
async function fakeProviderFetch(url, init = {}) {
  providerCalls.push({ url:String(url), init });
  assert.match(String(url), /^https:\/\/api\.openai\.com\/v1\/audio\/(speech|transcriptions)$/);
  assert.equal(init.headers.Authorization, `Bearer ${OPENAI_TEST_KEY}`);

  if (providerMode === 'http-error') {
    return new Response(JSON.stringify({ error:{ message:`provider failed ${OPENAI_TEST_KEY}` } }), {
      status:500,
      headers:{ 'Content-Type':'application/json', 'x-request-id':'oa_error_1' },
    });
  }

  if (String(url).endsWith('/audio/speech')) {
    assert.equal(init.method, 'POST');
    const payload = JSON.parse(init.body);
    assert.equal(payload.model, 'gpt-4o-mini-tts');
    assert.equal(payload.voice, 'marin');
    assert.equal(payload.input, "What's your name?");
    assert.equal(payload.response_format, 'mp3');
    return new Response(new Uint8Array([0x49, 0x44, 0x33, 0x01]), {
      status:200,
      headers:{ 'Content-Type':'audio/mpeg', 'x-request-id':'oa_tts_1' },
    });
  }

  assert.ok(init.body instanceof FormData, 'STT debe enviar FormData');
  assert.equal(init.body.get('model'), 'gpt-4o-mini-transcribe');
  assert.equal(init.body.get('language'), 'en');
  assert.equal(init.body.has('prompt'), false, 'STT no puede enviar prompt');
  assert.ok(init.body.get('file') instanceof Blob, 'STT debe adjuntar Blob');
  return new Response(JSON.stringify({ text:'hello from qa' }), {
    status:200,
    headers:{ 'Content-Type':'application/json', 'x-request-id':'oa_stt_1' },
  });
}

const rateLimiter = new FakeRateLimiter();
const logs = [];
const env = {
  ENVIRONMENT:'qa',
  ALLOWED_ORIGINS:ORIGIN,
  VOICE_GRANT_SIGNING_SECRET:SIGNING_SECRET,
  OPENAI_API_KEY:OPENAI_TEST_KEY,
  VOICE_RATE_LIMITER:rateLimiter,
};
const worker = createSpeakLabCloudflareWorker({
  fetchImpl:fakeProviderFetch,
  nowMs:() => START_MS,
  requestIdFactory:(() => {
    let index = 0;
    return () => `cfqa_req_${++index}`;
  })(),
  logger:{ log:value => logs.push(String(value)) },
});

function request(path, { method = 'GET', headers = {}, body } = {}) {
  return new Request(`${BASE}${path}`, {
    method,
    headers:{ Origin:ORIGIN, ...headers },
    body,
  });
}

async function json(response) {
  return response.json();
}

const validGrant = await grant();
const ttsGrant = await grant({ scopes:[VOICE_GATEWAY_SCOPES.TTS_READ], jti:'jti_cloudflare_tts_001' });
const sttGrant = await grant({ scopes:[VOICE_GATEWAY_SCOPES.STT_WRITE], jti:'jti_cloudflare_stt_001' });

// Health no necesita proveedor ni grant y conserva CORS exacto.
{
  const before = providerCalls.length;
  const response = await worker.fetch(request('/health'), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal((await json(response)).service, 'speak-lab-voice-gateway');
  assert.equal(providerCalls.length, before);
}

// Preflight.
{
  const response = await worker.fetch(request('/v1/tts', { method:'OPTIONS' }), env);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
}

// Origen ajeno se rechaza antes de proveedor.
{
  const before = providerCalls.length;
  const response = await worker.fetch(new Request(`${BASE}/v1/tts`, {
    method:'POST',
    headers:{ Origin:'https://evil.example', Authorization:`Bearer ${ttsGrant}`, 'Content-Type':'application/json' },
    body:JSON.stringify({ text:"What's your name?" }),
  }), env);
  assert.equal(response.status, 403);
  assert.equal((await json(response)).error, 'ORIGIN_NOT_ALLOWED');
  assert.equal(providerCalls.length, before);
}

// Grant obligatorio.
{
  const response = await worker.fetch(request('/v1/tts', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body:JSON.stringify({ text:"What's your name?" }),
  }), env);
  assert.equal(response.status, 401);
  assert.equal((await json(response)).error, 'VOICE_GRANT_REQUIRED');
}

// Firma inválida.
{
  const badGrant = await grant({ secret:'WRONG_TEST_SECRET' });
  const response = await worker.fetch(request('/v1/tts', {
    method:'POST',
    headers:{ Authorization:`Bearer ${badGrant}`, 'Content-Type':'application/json' },
    body:JSON.stringify({ text:"What's your name?" }),
  }), env);
  assert.equal(response.status, 401);
  assert.equal((await json(response)).error, 'VOICE_GRANT_BAD_SIGNATURE');
}

// Grant expirado.
{
  const expired = await grant({ iat:START_SECONDS - 200, exp:START_SECONDS - 100, jti:'jti_cloudflare_exp_001' });
  const response = await worker.fetch(request('/v1/tts', {
    method:'POST',
    headers:{ Authorization:`Bearer ${expired}`, 'Content-Type':'application/json' },
    body:JSON.stringify({ text:"What's your name?" }),
  }), env);
  assert.equal(response.status, 401);
  assert.equal((await json(response)).error, 'VOICE_GRANT_INVALID');
}

// Scope incorrecto.
{
  const response = await worker.fetch(request('/v1/stt', {
    method:'POST',
    headers:{
      Authorization:`Bearer ${ttsGrant}`,
      'Content-Type':'audio/webm',
      'X-SpeakLab-Duration-Ms':'1000',
      'X-SpeakLab-Language':'en',
    },
    body:new Blob([new Uint8Array([1, 2, 3])], { type:'audio/webm' }),
  }), env);
  assert.equal(response.status, 403);
  assert.equal((await json(response)).error, 'VOICE_GATEWAY_SCOPE_DENIED');
}

// TTS realista, pero fake network.
{
  const before = providerCalls.length;
  const response = await worker.fetch(request('/v1/tts', {
    method:'POST',
    headers:{ Authorization:`Bearer ${ttsGrant}`, 'Content-Type':'application/json' },
    body:JSON.stringify({
      text:"What's your name?",
      language:'en-US',
      voiceProfile:'default',
      speakingRate:0.88,
      style:'clear, natural language-learning model voice',
      cachePolicy:'no-store',
    }),
  }), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'audio/mpeg');
  assert.equal(response.headers.get('x-speaklab-provider'), 'openai');
  assert.equal(response.headers.get('x-speaklab-model'), 'gpt-4o-mini-tts');
  assert.equal(response.headers.get('x-speaklab-synthetic-voice'), 'true');
  assert.ok((await response.arrayBuffer()).byteLength > 0);
  assert.equal(providerCalls.length, before + 1);
}

// STT ciego, fake network, sin prompt.
{
  const before = providerCalls.length;
  const hints = encodeURIComponent(JSON.stringify(['name', 'Costa']));
  const response = await worker.fetch(request('/v1/stt', {
    method:'POST',
    headers:{
      Authorization:`Bearer ${sttGrant}`,
      'Content-Type':'audio/webm',
      'X-SpeakLab-Duration-Ms':'1200',
      'X-SpeakLab-Language':'en-US',
      'X-SpeakLab-Vocabulary-Hints':hints,
    },
    body:new Blob([new Uint8Array([1, 2, 3, 4, 5])], { type:'audio/webm' }),
  }), env);
  assert.equal(response.status, 200);
  const data = await json(response);
  assert.equal(data.text, 'hello from qa');
  assert.equal(data.provider.provider, 'openai');
  assert.equal(data.provider.model, 'gpt-4o-mini-transcribe');
  assert.equal(providerCalls.length, before + 1);
}

// Target leakage por header: cero proveedor.
{
  const before = providerCalls.length;
  const response = await worker.fetch(request('/v1/stt', {
    method:'POST',
    headers:{
      Authorization:`Bearer ${sttGrant}`,
      'Content-Type':'audio/webm',
      'X-SpeakLab-Duration-Ms':'1000',
      'X-SpeakLab-Target-Text':"What's your name?",
    },
    body:new Blob([new Uint8Array([1, 2, 3])], { type:'audio/webm' }),
  }), env);
  assert.equal(response.status, 400);
  assert.equal((await json(response)).error, 'STT_TARGET_LEAKAGE');
  assert.equal(providerCalls.length, before);
}

// Target leakage por query: cero proveedor.
{
  const before = providerCalls.length;
  const response = await worker.fetch(request('/v1/stt?referenceText=hello', {
    method:'POST',
    headers:{ Authorization:`Bearer ${sttGrant}`, 'Content-Type':'audio/webm', 'X-SpeakLab-Duration-Ms':'1000' },
    body:new Blob([new Uint8Array([1, 2, 3])], { type:'audio/webm' }),
  }), env);
  assert.equal(response.status, 400);
  assert.equal((await json(response)).error, 'STT_TARGET_LEAKAGE');
  assert.equal(providerCalls.length, before);
}

// Hint que intenta filtrar frase completa: rechazo.
{
  const before = providerCalls.length;
  const response = await worker.fetch(request('/v1/stt', {
    method:'POST',
    headers:{
      Authorization:`Bearer ${sttGrant}`,
      'Content-Type':'audio/webm',
      'X-SpeakLab-Duration-Ms':'1000',
      'X-SpeakLab-Vocabulary-Hints':encodeURIComponent(JSON.stringify(["What's your name"])),
    },
    body:new Blob([new Uint8Array([1, 2, 3])], { type:'audio/webm' }),
  }), env);
  assert.equal(response.status, 400);
  assert.equal((await json(response)).error, 'STT_HINT_MUST_BE_LEXEME');
  assert.equal(providerCalls.length, before);
}

// Content-Length anunciado sobre 2.5 MB: rechazo antes de leer/proveedor.
{
  const before = providerCalls.length;
  const response = await worker.fetch(request('/v1/stt', {
    method:'POST',
    headers:{
      Authorization:`Bearer ${sttGrant}`,
      'Content-Type':'audio/webm',
      'Content-Length':String(2_500_001),
      'X-SpeakLab-Duration-Ms':'1000',
    },
    body:new Blob([new Uint8Array([1])], { type:'audio/webm' }),
  }), env);
  assert.equal(response.status, 413);
  assert.equal((await json(response)).error, 'AUDIO_TOO_LARGE');
  assert.equal(providerCalls.length, before);
}

// Body real sobre 2.5 MB también se rechaza.
{
  const before = providerCalls.length;
  const response = await worker.fetch(request('/v1/stt', {
    method:'POST',
    headers:{
      Authorization:`Bearer ${sttGrant}`,
      'Content-Type':'audio/webm',
      'X-SpeakLab-Duration-Ms':'1000',
    },
    body:new Blob([new Uint8Array(2_500_001)], { type:'audio/webm' }),
  }), env);
  assert.equal(response.status, 400);
  assert.equal((await json(response)).error, 'AUDIO_TOO_LARGE');
  assert.equal(providerCalls.length, before);
}

// Rate limit 429 por subject opaco + scope.
{
  const before = providerCalls.length;
  rateLimiter.success = false;
  const response = await worker.fetch(request('/v1/tts', {
    method:'POST',
    headers:{ Authorization:`Bearer ${validGrant}`, 'Content-Type':'application/json' },
    body:JSON.stringify({ text:"What's your name?" }),
  }), env);
  assert.equal(response.status, 429);
  assert.equal((await json(response)).error, 'VOICE_RATE_LIMITED');
  assert.equal(providerCalls.length, before);
  rateLimiter.success = true;
}

// Binding ausente falla cerrado en ruta protegida.
{
  const before = providerCalls.length;
  const { VOICE_RATE_LIMITER, ...envWithoutLimiter } = env;
  const response = await worker.fetch(request('/v1/tts', {
    method:'POST',
    headers:{ Authorization:`Bearer ${ttsGrant}`, 'Content-Type':'application/json' },
    body:JSON.stringify({ text:"What's your name?" }),
  }), envWithoutLimiter);
  assert.equal(response.status, 503);
  assert.equal((await json(response)).error, 'RATE_LIMITER_UNAVAILABLE');
  assert.equal(providerCalls.length, before);
}

// Error upstream no puede devolver la API key ni detalle crudo.
{
  providerMode = 'http-error';
  const response = await worker.fetch(request('/v1/tts', {
    method:'POST',
    headers:{ Authorization:`Bearer ${ttsGrant}`, 'Content-Type':'application/json' },
    body:JSON.stringify({ text:"What's your name?" }),
  }), env);
  assert.equal(response.status, 502);
  const raw = JSON.stringify(await json(response));
  assert.doesNotMatch(raw, /sk-test-only-never-real/);
  assert.match(raw, /OPENAI_AUDIO_HTTP_ERROR/);
  providerMode = 'success';
}

// Pronunciación / Realtime siguen explícitamente fuera de alcance.
{
  const response = await worker.fetch(request('/v1/pronunciation'), env);
  assert.equal(response.status, 501);
  assert.equal((await json(response)).error, 'NOT_IMPLEMENTED');
}

// Logging minimizado: sin frase, transcript, secretos ni PII directa.
{
  const joined = logs.join('\n');
  assert.ok(logs.length > 0);
  assert.doesNotMatch(joined, /What's your name\?/i);
  assert.doesNotMatch(joined, /hello from qa/i);
  assert.doesNotMatch(joined, /sk-test-only-never-real/i);
  assert.doesNotMatch(joined, /TEST_ONLY_CLOUDFLARE_VOICE_GRANT_SECRET/i);
  assert.doesNotMatch(joined, /email|correo|cedula|cédula|telefono|teléfono/i);
  assert.match(joined, /sl_cloudflareqa01/);
  assert.match(joined, /cfqa_req_/);
}

// Todas las llamadas de proveedor fueron interceptadas por fake fetch.
assert.ok(providerCalls.length >= 3);
assert.ok(providerCalls.every(call => String(call.url).startsWith('https://api.openai.com/v1/audio/')));
assert.ok(rateLimiter.calls.some(key => key.includes(':tts:read')));
assert.ok(rateLimiter.calls.some(key => key.includes(':stt:write')));

console.log(JSON.stringify({
  ok:true,
  worker:'speak-lab-cloudflare-qa-offline',
  provider_calls_fake:providerCalls.length,
  network_calls_real:0,
  technical_logs:logs.length,
  rate_limit_calls:rateLimiter.calls.length,
  deploys:0,
  secrets_real:0,
}, null, 2));
