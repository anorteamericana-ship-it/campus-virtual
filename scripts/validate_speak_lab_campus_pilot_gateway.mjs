import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createSpeakLabPilotWorker } from '../prototypes/speak_lab_phase2/cloudflare_voice_worker_pilot.mjs';
import { validateVoiceGrantClaims } from '../prototypes/speak_lab_phase1/gateway_protocol.js';

const ORIGIN = 'https://qa-campus.example';
const AUTH_URL = 'https://script.google.com/macros/s/QA_SPEAK_LAB_AUTH/exec';
const SIGNING_SECRET = 'qa-signing-secret-placeholder-123456789';
const NOW_MS = 1_786_854_600_000;
const logs = [];
const authCalls = [];
let rateLimitCalls = 0;

function decodeBase64UrlText(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function expectedSignature(payload) {
  return crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(payload)
    .digest('base64url');
}

const fakeFetch = async (url, init = {}) => {
  const parsed = new URL(url);
  assert.equal(parsed.origin + parsed.pathname, AUTH_URL);
  assert.equal(parsed.searchParams.get('fn'), 'validarSesion');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers['Content-Type'], 'text/plain;charset=utf-8');
  const body = JSON.parse(init.body);
  assert.equal(body.fn, 'validarSesion');
  assert.ok(body.token);
  authCalls.push({ token:body.token });

  if (body.token === 'campus-invalid-session') {
    return new Response(JSON.stringify({ ok:false, error:'sesion_invalida' }), {
      status:200,
      headers:{ 'content-type':'application/json' },
    });
  }
  if (body.token === 'campus-student-session') {
    return new Response(JSON.stringify({ ok:true, rol:'student' }), {
      status:200,
      headers:{ 'content-type':'application/json' },
    });
  }
  return new Response(JSON.stringify({ ok:true, rol:'teacher' }), {
    status:200,
    headers:{ 'content-type':'application/json' },
  });
};

const env = {
  ENVIRONMENT:'qa',
  ALLOWED_ORIGINS:ORIGIN,
  CAMPUS_AUTH_URL:AUTH_URL,
  VOICE_GRANT_SIGNING_SECRET:SIGNING_SECRET,
  VOICE_RATE_LIMITER:{
    async limit({ key }) {
      rateLimitCalls += 1;
      assert.match(key, /^sl_[A-Za-z0-9_-]{12,64}:session-grant$/);
      return { success:true };
    },
  },
};

let uuidIndex = 0;
const worker = createSpeakLabPilotWorker({
  fetchImpl:fakeFetch,
  nowMs:() => NOW_MS,
  randomUUID:() => `00000000-0000-4000-8000-${String(++uuidIndex).padStart(12, '0')}`,
  requestIdFactory:() => `pilot_request_${++uuidIndex}`,
  logger:{ info:value => logs.push(String(value)), log:value => logs.push(String(value)), error:value => logs.push(String(value)) },
});

async function grantRequest({ token='campus-teacher-session', role='teacher', scopes=['tts:read','stt:write','pronunciation:write'], origin=ORIGIN } = {}) {
  return worker.fetch(new Request('https://worker.example/v1/session-grant', {
    method:'POST',
    headers:{
      Origin:origin,
      Authorization:`Bearer ${token}`,
      'Content-Type':'application/json',
    },
    body:JSON.stringify({ role, scopes }),
  }), env);
}

const response = await grantRequest();
assert.equal(response.status, 200);
assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
assert.equal(response.headers.get('cache-control'), 'no-store');
const data = await response.json();
assert.equal(data.ok, true);
assert.equal(data.role, 'teacher');
assert.deepEqual(data.scopes, ['tts:read','stt:write','pronunciation:write']);
assert.equal(data.expiresIn, 300);
assert.ok(data.grant);

const [payload, signature] = data.grant.split('.');
assert.ok(payload && signature);
assert.equal(signature, expectedSignature(payload));
const claims = JSON.parse(decodeBase64UrlText(payload));
const normalizedClaims = validateVoiceGrantClaims(claims, { nowSeconds:Math.floor(NOW_MS / 1000) });
assert.equal(normalizedClaims.role, 'teacher');
assert.equal(normalizedClaims.iss, 'campus-auth');
assert.equal(normalizedClaims.aud, 'speak-lab-voice-gateway');
assert.match(normalizedClaims.sub, /^sl_[A-Za-z0-9_-]{12,64}$/);
assert.equal(normalizedClaims.exp - normalizedClaims.iat, 300);
assert.deepEqual(normalizedClaims.scopes, ['tts:read','stt:write','pronunciation:write']);
assert.equal(authCalls.length, 1);
assert.equal(rateLimitCalls, 1);

const invalidSession = await grantRequest({ token:'campus-invalid-session' });
assert.equal(invalidSession.status, 401);
assert.equal((await invalidSession.json()).error, 'CAMPUS_SESSION_INVALID');

const roleMismatch = await grantRequest({ token:'campus-student-session', role:'teacher' });
assert.equal(roleMismatch.status, 403);
assert.equal((await roleMismatch.json()).error, 'CAMPUS_ROLE_MISMATCH');

const forbiddenRole = await grantRequest({ role:'admin' });
assert.equal(forbiddenRole.status, 403);
assert.equal((await forbiddenRole.json()).error, 'PILOT_ROLE_FORBIDDEN');

const forbiddenScope = await grantRequest({ scopes:['tts:read','realtime:connect'] });
assert.equal(forbiddenScope.status, 400);
assert.equal((await forbiddenScope.json()).error, 'VOICE_SCOPE_FORBIDDEN');

const hostileOrigin = await grantRequest({ origin:'https://evil.example' });
assert.equal(hostileOrigin.status, 403);
assert.equal((await hostileOrigin.json()).error, 'ORIGIN_NOT_ALLOWED');

const noToken = await worker.fetch(new Request('https://worker.example/v1/session-grant', {
  method:'POST',
  headers:{ Origin:ORIGIN, 'Content-Type':'application/json' },
  body:JSON.stringify({ role:'teacher', scopes:['tts:read'] }),
}), env);
assert.equal(noToken.status, 401);
assert.equal((await noToken.json()).error, 'CAMPUS_SESSION_REQUIRED');

// Las demás rutas siguen delegando al Worker base.
const health = await worker.fetch(new Request('https://worker.example/health', {
  headers:{ Origin:ORIGIN },
}), env);
assert.equal(health.status, 200);
const healthData = await health.json();
assert.equal(healthData.ok, true);
assert.equal(healthData.service, 'speak-lab-voice-gateway');

const serializedLogs = logs.join('\n');
assert.doesNotMatch(serializedLogs, /campus-teacher-session/);
assert.doesNotMatch(serializedLogs, /campus-student-session/);
assert.doesNotMatch(serializedLogs, new RegExp(SIGNING_SECRET.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
assert.doesNotMatch(JSON.stringify(data), new RegExp(SIGNING_SECRET.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

console.log(JSON.stringify({
  ok:true,
  phase:'speak-lab-campus-pilot-gateway',
  session_validation:'campus-validarSesion-server-side',
  grant_ttl_seconds:data.expiresIn,
  scopes:data.scopes,
  roles:['student','teacher'],
  hostile_origin_rejected:true,
  invalid_session_rejected:true,
  role_mismatch_rejected:true,
  forbidden_scope_rejected:true,
  provider_secrets_in_browser:0,
  session_tokens_in_logs:0,
  network_calls_real:0,
}, null, 2));
