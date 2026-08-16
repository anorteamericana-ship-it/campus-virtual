import assert from 'node:assert/strict';
import {
  VOICE_GATEWAY_LIMITS,
  VOICE_GATEWAY_SCOPES,
} from '../prototypes/speak_lab_phase1/gateway_protocol.js';
import { createSpeakLabCloudflareWorker } from '../prototypes/speak_lab_phase2/cloudflare_voice_worker.mjs';

const ORIGIN = 'https://qa.example.test';
const BASE = 'https://voice-qa.example.test';
const SIGNING_SECRET = 'TEST_ONLY_PHASE3_VOICE_GRANT_SECRET';
const AZURE_TEST_KEY = 'AZURE_TEST_ONLY_KEY_NEVER_REAL_123456';
const AZURE_ENDPOINT = 'https://speak-lab-speech-qa.cognitiveservices.azure.com';
const REFERENCE_TEXT = "What's your name?";
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
  scopes = [VOICE_GATEWAY_SCOPES.PRONUNCIATION_WRITE],
  iat = START_SECONDS,
  exp = START_SECONDS + 120,
  sub = 'sl_phase3pronqa01',
  role = 'admin',
  jti = 'jti_phase3_pron_001',
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

const fakeAzureResponse = {
  RecognitionStatus:'Success',
  Offset:0,
  Duration:28200000,
  DisplayText:REFERENCE_TEXT,
  NBest:[{
    Confidence:0.99,
    Lexical:"what's your name",
    ITN:"what's your name",
    MaskedITN:"what's your name",
    Display:REFERENCE_TEXT,
    AccuracyScore:99,
    FluencyScore:99,
    ProsodyScore:83.8,
    CompletenessScore:100,
    PronScore:93.1,
    Words:[
      {
        Word:"what's",
        AccuracyScore:97,
        ErrorType:'None',
        Phonemes:[
          { Phoneme:'h', AccuracyScore:54 },
          { Phoneme:'w', AccuracyScore:91 },
          { Phoneme:'ao', AccuracyScore:100 },
          { Phoneme:'t', AccuracyScore:100 },
          { Phoneme:'s', AccuracyScore:88 },
        ],
      },
      {
        Word:'your',
        AccuracyScore:100,
        ErrorType:'None',
        Phonemes:[
          { Phoneme:'y', AccuracyScore:100 },
          { Phoneme:'uh', AccuracyScore:100 },
          { Phoneme:'r', AccuracyScore:100 },
        ],
      },
      {
        Word:'name',
        AccuracyScore:100,
        ErrorType:'None',
        Phonemes:[
          { Phoneme:'n', AccuracyScore:100 },
          { Phoneme:'ey', AccuracyScore:100 },
          { Phoneme:'m', AccuracyScore:100 },
        ],
      },
    ],
  }],
};

const providerCalls = [];
let providerMode = 'success';

async function fakeProviderFetch(url, init = {}) {
  providerCalls.push({ url:String(url), init });
  const parsed = new URL(String(url));
  assert.equal(parsed.protocol, 'https:');
  assert.equal(parsed.hostname, 'speak-lab-speech-qa.cognitiveservices.azure.com');
  assert.equal(parsed.pathname, '/stt/speech/recognition/conversation/cognitiveservices/v1');
  assert.equal(parsed.searchParams.get('language'), 'en-US');
  assert.equal(parsed.searchParams.get('format'), 'detailed');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers['Ocp-Apim-Subscription-Key'], AZURE_TEST_KEY);
  assert.equal(init.headers['Content-Type'], 'audio/ogg; codecs=opus');
  assert.ok(init.body instanceof Blob);

  const assessmentConfig = JSON.parse(
    Buffer.from(init.headers['Pronunciation-Assessment'], 'base64').toString('utf8'),
  );
  assert.equal(assessmentConfig.ReferenceText, REFERENCE_TEXT);
  assert.equal(assessmentConfig.GradingSystem, 'HundredMark');
  assert.equal(assessmentConfig.Granularity, 'Phoneme');
  assert.equal(assessmentConfig.Dimension, 'Comprehensive');
  assert.equal(assessmentConfig.EnableMiscue, true);
  assert.equal(assessmentConfig.EnableProsodyAssessment, 'True');

  if (providerMode === 'http-error') {
    return new Response(JSON.stringify({
      error:{ message:`invalid subscription key ${AZURE_TEST_KEY}` },
    }), {
      status:401,
      headers:{
        'Content-Type':'application/json',
        'x-requestid':'azure_phase3_error_1',
      },
    });
  }

  return new Response(JSON.stringify(fakeAzureResponse), {
    status:200,
    headers:{
      'Content-Type':'application/json',
      'x-requestid':'azure_phase3_success_1',
    },
  });
}

const rateLimiter = new FakeRateLimiter();
const logs = [];
const env = {
  ENVIRONMENT:'qa',
  ALLOWED_ORIGINS:ORIGIN,
  VOICE_GRANT_SIGNING_SECRET:SIGNING_SECRET,
  AZURE_SPEECH_KEY:AZURE_TEST_KEY,
  AZURE_SPEECH_REGION:'eastus',
  AZURE_SPEECH_ENDPOINT:AZURE_ENDPOINT,
  VOICE_RATE_LIMITER:rateLimiter,
};

const worker = createSpeakLabCloudflareWorker({
  fetchImpl:fakeProviderFetch,
  nowMs:() => START_MS,
  requestIdFactory:(() => {
    let index = 0;
    return () => `cfpron_req_${++index}`;
  })(),
  logger:{ log:value => logs.push(String(value)) },
});

function request(path, { method = 'POST', headers = {}, body } = {}) {
  return new Request(`${BASE}${path}`, {
    method,
    headers:{ Origin:ORIGIN, ...headers },
    body,
  });
}

function audio(bytes = [0x4f,0x67,0x67,0x53,0x00,0x02,0x03,0x04]) {
  return new Blob([new Uint8Array(bytes)], { type:'audio/ogg' });
}

function pronunciationHeaders(token, overrides = {}) {
  return {
    Authorization:`Bearer ${token}`,
    'Content-Type':'audio/ogg; codecs=opus',
    'X-SpeakLab-Duration-Ms':'2820',
    'X-SpeakLab-Language':'en-US',
    'X-SpeakLab-Reference-Text':encodeURIComponent(REFERENCE_TEXT),
    'X-SpeakLab-Rubric-Version':encodeURIComponent('speaklab-pronunciation-v0'),
    ...overrides,
  };
}

async function json(response) {
  return response.json();
}

const pronunciationGrant = await grant();
const sttGrant = await grant({
  scopes:[VOICE_GATEWAY_SCOPES.STT_WRITE],
  jti:'jti_phase3_stt_001',
});

// Preflight declara los headers específicos de pronunciación.
{
  const response = await worker.fetch(request('/v1/pronunciation', { method:'OPTIONS' }), env);
  assert.equal(response.status, 204);
  const allowed = response.headers.get('access-control-allow-headers') || '';
  assert.match(allowed, /X-SpeakLab-Reference-Text/i);
  assert.match(allowed, /X-SpeakLab-Rubric-Version/i);
}

// Primera ruta de pronunciación: Voice Grant -> gateway -> Azure fake -> contrato SPEAK LAB.
{
  const before = providerCalls.length;
  const response = await worker.fetch(request('/v1/pronunciation', {
    headers:pronunciationHeaders(pronunciationGrant),
    body:audio(),
  }), env);
  assert.equal(response.status, 200);
  const data = await json(response);
  assert.equal(data.dimensions.segmentalAccuracy, 99);
  assert.equal(data.dimensions.fluency, 99);
  assert.equal(data.dimensions.intelligibility, null);
  assert.equal(data.dimensions.wordStress, null);
  assert.equal(data.dimensions.rhythm, null);
  assert.equal(data.dimensions.intonation, null);
  assert.equal(data.calibrated, false);
  assert.equal(data.official, false);
  assert.equal(data.confidence, null);
  assert.equal(data.evaluatorVersion, 'azure-pronunciation-rest-v0.2-live-shape-unvalidated');
  assert.deepEqual(data.issues, []);
  const publicRaw = JSON.stringify(data);
  assert.doesNotMatch(publicRaw, /PronScore|ProsodyScore|Phonemes|CompletenessScore/);
  assert.doesNotMatch(publicRaw, /What's your name\?/i);
  assert.equal(providerCalls.length, before + 1);
}

// Scope STT no autoriza pronunciación.
{
  const before = providerCalls.length;
  const response = await worker.fetch(request('/v1/pronunciation', {
    headers:pronunciationHeaders(sttGrant),
    body:audio(),
  }), env);
  assert.equal(response.status, 403);
  assert.equal((await json(response)).error, 'VOICE_GATEWAY_SCOPE_DENIED');
  assert.equal(providerCalls.length, before);
}

// Reference text obligatorio.
{
  const before = providerCalls.length;
  const headers = pronunciationHeaders(pronunciationGrant);
  delete headers['X-SpeakLab-Reference-Text'];
  const response = await worker.fetch(request('/v1/pronunciation', {
    headers,
    body:audio(),
  }), env);
  assert.equal(response.status, 400);
  assert.equal((await json(response)).error, 'MISSING_REFERENCE_TEXT');
  assert.equal(providerCalls.length, before);
}

// Reference text acotado.
{
  const before = providerCalls.length;
  const tooLong = 'a'.repeat(VOICE_GATEWAY_LIMITS.maxPronunciationReferenceCharacters + 1);
  const response = await worker.fetch(request('/v1/pronunciation', {
    headers:pronunciationHeaders(pronunciationGrant, {
      'X-SpeakLab-Reference-Text':encodeURIComponent(tooLong),
    }),
    body:audio(),
  }), env);
  assert.equal(response.status, 400);
  assert.equal((await json(response)).error, 'PRONUNCIATION_REFERENCE_TOO_LONG');
  assert.equal(providerCalls.length, before);
}

// Pronunciación V0 solo acepta OGG/Opus.
{
  const before = providerCalls.length;
  const response = await worker.fetch(request('/v1/pronunciation', {
    headers:pronunciationHeaders(pronunciationGrant, {
      'Content-Type':'audio/webm',
    }),
    body:new Blob([new Uint8Array([1,2,3])], { type:'audio/webm' }),
  }), env);
  assert.equal(response.status, 400);
  assert.equal((await json(response)).error, 'UNSUPPORTED_PRONUNCIATION_AUDIO_TYPE');
  assert.equal(providerCalls.length, before);
}

// Duración >30s se rechaza antes de Azure.
{
  const before = providerCalls.length;
  const response = await worker.fetch(request('/v1/pronunciation', {
    headers:pronunciationHeaders(pronunciationGrant, {
      'X-SpeakLab-Duration-Ms':String(VOICE_GATEWAY_LIMITS.maxAudioDurationMs + 1),
    }),
    body:audio(),
  }), env);
  assert.equal(response.status, 400);
  assert.equal((await json(response)).error, 'AUDIO_TOO_LONG');
  assert.equal(providerCalls.length, before);
}

// Content-Length anunciado >2.5MB se rechaza antes de leer el body.
{
  const before = providerCalls.length;
  const response = await worker.fetch(request('/v1/pronunciation', {
    headers:pronunciationHeaders(pronunciationGrant, {
      'Content-Length':String(VOICE_GATEWAY_LIMITS.maxAudioBytes + 1),
    }),
    body:audio([1]),
  }), env);
  assert.equal(response.status, 413);
  assert.equal((await json(response)).error, 'AUDIO_TOO_LARGE');
  assert.equal(providerCalls.length, before);
}

// Rate limiter por subject opaco + pronunciation scope.
{
  const before = providerCalls.length;
  rateLimiter.success = false;
  const response = await worker.fetch(request('/v1/pronunciation', {
    headers:pronunciationHeaders(pronunciationGrant),
    body:audio(),
  }), env);
  assert.equal(response.status, 429);
  assert.equal((await json(response)).error, 'VOICE_RATE_LIMITED');
  assert.equal(providerCalls.length, before);
  rateLimiter.success = true;
}

// Secret Azure ausente falla cerrado y no intenta red.
{
  const before = providerCalls.length;
  const { AZURE_SPEECH_KEY, ...envWithoutAzureKey } = env;
  const response = await worker.fetch(request('/v1/pronunciation', {
    headers:pronunciationHeaders(pronunciationGrant),
    body:audio(),
  }), envWithoutAzureKey);
  assert.equal(response.status, 503);
  assert.equal((await json(response)).error, 'AZURE_SPEECH_KEY_REQUIRED');
  assert.equal(providerCalls.length, before);
}

// Error Azure queda redactado; status/requestId pueden ir solo al log técnico seguro.
{
  providerMode = 'http-error';
  const response = await worker.fetch(request('/v1/pronunciation', {
    headers:pronunciationHeaders(pronunciationGrant),
    body:audio(),
  }), env);
  assert.equal(response.status, 502);
  const data = await json(response);
  assert.equal(data.error, 'AZURE_PRONUNCIATION_HTTP_ERROR');
  const publicRaw = JSON.stringify(data);
  assert.doesNotMatch(publicRaw, new RegExp(AZURE_TEST_KEY));
  assert.doesNotMatch(publicRaw, /azure_phase3_error_1/);
  providerMode = 'success';

  const technical = JSON.parse(logs.at(-1));
  assert.equal(technical.upstreamStatus, 401);
  assert.equal(technical.upstreamRequestId, 'azure_phase3_error_1');
  assert.equal(technical.upstreamCategory, 'PERMISSION_DENIED');
}

// Logging minimizado: sin frase, secret Azure ni scores crudos.
{
  const joined = logs.join('\n');
  assert.doesNotMatch(joined, /What's your name\?/i);
  assert.doesNotMatch(joined, new RegExp(AZURE_TEST_KEY));
  assert.doesNotMatch(joined, /ProsodyScore|PronScore|Phoneme|CompletenessScore/i);
  assert.doesNotMatch(joined, /TEST_ONLY_PHASE3_VOICE_GRANT_SECRET/i);
  assert.match(joined, /pronunciation:write/);
  assert.match(joined, /cfpron_req_/);
}

assert.ok(providerCalls.length >= 2);
assert.ok(providerCalls.every(call => call.url.startsWith(`${AZURE_ENDPOINT}/stt/`)));
assert.ok(rateLimiter.calls.some(key => key.includes(':pronunciation:write')));

console.log(JSON.stringify({
  ok:true,
  phase:'speak-lab-phase3-gateway-pronunciation-offline',
  route:'/v1/pronunciation',
  scope:'pronunciation:write',
  provider:'azure-pronunciation-rest',
  mapped_dimensions:['segmentalAccuracy','fluency'],
  intentionally_null_dimensions:['intelligibility','wordStress','rhythm','intonation'],
  public_raw_scores_exposed:false,
  reference_text_logged:false,
  calibrated:false,
  official:false,
  provider_calls_fake:providerCalls.length,
  network_calls_real:0,
  deploys:0,
  secrets_real:0,
}, null, 2));
