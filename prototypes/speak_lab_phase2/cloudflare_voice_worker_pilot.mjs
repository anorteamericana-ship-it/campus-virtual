import { createSpeakLabCloudflareWorker } from './cloudflare_voice_worker.mjs';
import {
  VOICE_GATEWAY_LIMITS,
  VOICE_GATEWAY_SCOPES,
  validateVoiceGrantClaims,
} from '../speak_lab_phase1/gateway_protocol.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const PILOT_SCOPES = Object.freeze([
  VOICE_GATEWAY_SCOPES.TTS_READ,
  VOICE_GATEWAY_SCOPES.STT_WRITE,
  VOICE_GATEWAY_SCOPES.PRONUNCIATION_WRITE,
]);
const PILOT_ROLES = new Set(['student', 'teacher']);
const SESSION_GRANT_PATH = '/v1/session-grant';
const SESSION_AUTH_TIMEOUT_MS = 14_000;

class PilotHttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'PilotHttpError';
    this.status = status;
    this.code = code;
  }
}

function clean(value) {
  return String(value ?? '').trim();
}

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function parseBearer(request) {
  const value = clean(request.headers.get('Authorization'));
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? clean(match[1]) : '';
}

function allowedOrigins(env) {
  return new Set(
    clean(env?.ALLOWED_ORIGINS)
      .split(',')
      .map(value => value.trim())
      .filter(Boolean),
  );
}

function validateOrigin(request, env) {
  const origin = clean(request.headers.get('Origin'));
  if (!origin || !allowedOrigins(env).has(origin)) {
    throw new PilotHttpError(403, 'ORIGIN_NOT_ALLOWED', 'Origen no autorizado para SPEAK LAB.');
  }
  return origin;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin':origin,
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':'Authorization, Content-Type, X-SpeakLab-Protocol, X-SpeakLab-Language, X-SpeakLab-Duration-Ms, X-SpeakLab-Vocabulary-Hints, X-SpeakLab-Reference-Text, X-SpeakLab-Rubric-Version',
    'Access-Control-Max-Age':'600',
    'Vary':'Origin',
  };
}

function json(status, data, { origin = '', requestId = '' } = {}) {
  const headers = new Headers({
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
  });
  if (requestId) headers.set('X-Request-Id', requestId);
  if (origin) {
    for (const [name, value] of Object.entries(corsHeaders(origin))) headers.set(name, value);
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function campusAuthUrl(env) {
  const raw = clean(env?.CAMPUS_AUTH_URL);
  if (!raw) throw new PilotHttpError(503, 'CAMPUS_AUTH_URL_UNAVAILABLE', 'Validación de sesión no configurada.');
  let url;
  try { url = new URL(raw); }
  catch (_) { throw new PilotHttpError(503, 'INVALID_CAMPUS_AUTH_URL', 'Validación de sesión no configurada.'); }
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'script.google.com' ||
    !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec\/?$/.test(url.pathname) ||
    url.username || url.password || url.search || url.hash
  ) {
    throw new PilotHttpError(503, 'INVALID_CAMPUS_AUTH_URL', 'Validación de sesión no configurada.');
  }
  url.searchParams.set('fn', 'validarSesion');
  return url.toString();
}

function normalizedScopes(value) {
  const requested = Array.isArray(value) ? value.map(clean).filter(Boolean) : [];
  const unique = [...new Set(requested)];
  if (!unique.length) throw new PilotHttpError(400, 'VOICE_SCOPE_REQUIRED', 'Seleccioná al menos una operación de voz.');
  if (unique.some(scope => !PILOT_SCOPES.includes(scope))) {
    throw new PilotHttpError(400, 'VOICE_SCOPE_FORBIDDEN', 'Scope no habilitado para el piloto.');
  }
  return unique;
}

function authRole(data) {
  const candidates = [
    data?.rol,
    data?.role,
    data?.usuario?.rol,
    data?.usuario?.role,
    data?.sesion?.rol,
    data?.sesion?.role,
  ].map(value => clean(value).toLowerCase()).filter(Boolean);
  return candidates.find(role => ['student','teacher','admin','superadmin'].includes(role)) || '';
}

async function validateCampusSession(token, env, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SESSION_AUTH_TIMEOUT_MS);
  let response;
  try {
    response = await fetchImpl(campusAuthUrl(env), {
      method:'POST',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body:JSON.stringify({ fn:'validarSesion', token }),
      redirect:'follow',
      signal:controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new PilotHttpError(504, 'CAMPUS_AUTH_TIMEOUT', 'La validación de sesión tardó demasiado.');
    }
    throw new PilotHttpError(502, 'CAMPUS_AUTH_NETWORK_ERROR', 'No se pudo validar la sesión del Campus.');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) throw new PilotHttpError(502, 'CAMPUS_AUTH_HTTP_ERROR', 'No se pudo validar la sesión del Campus.');
  let data;
  try { data = await response.json(); }
  catch (_) { throw new PilotHttpError(502, 'CAMPUS_AUTH_INVALID_JSON', 'La validación de sesión devolvió una respuesta inválida.'); }
  if (data?.ok !== true) throw new PilotHttpError(401, 'CAMPUS_SESSION_INVALID', 'La sesión del Campus no es válida.');
  return data;
}

async function hmacBytes(secret, text) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name:'HMAC', hash:'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(text)));
}

async function opaqueSubject(token, secret) {
  const digest = await hmacBytes(secret, `speak-lab-subject:${token}`);
  return `sl_${base64Url(digest).slice(0, 32)}`;
}

async function issueGrant({ token, role, scopes, env, nowMs, randomUUID }) {
  const secret = clean(env?.VOICE_GRANT_SIGNING_SECRET);
  if (!secret) throw new PilotHttpError(503, 'VOICE_GRANT_SECRET_UNAVAILABLE', 'Servicio de autorización no disponible.');
  const nowSeconds = Math.floor(nowMs() / 1000);
  const sub = await opaqueSubject(token, secret);
  const claims = validateVoiceGrantClaims({
    iss:'campus-auth',
    aud:'speak-lab-voice-gateway',
    sub,
    role,
    scopes,
    iat:nowSeconds,
    exp:nowSeconds + Math.min(300, VOICE_GATEWAY_LIMITS.grantMaxTtlSeconds),
    jti:`slj_${clean(randomUUID()).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64)}`,
  }, { nowSeconds });
  const payload = base64Url(encoder.encode(JSON.stringify(claims)));
  const signature = base64Url(await hmacBytes(secret, payload));
  return {
    grant:`${payload}.${signature}`,
    claims,
  };
}

async function enforceGrantRateLimit(env, sub) {
  const binding = env?.VOICE_RATE_LIMITER;
  if (!binding || typeof binding.limit !== 'function') {
    throw new PilotHttpError(503, 'RATE_LIMITER_UNAVAILABLE', 'Rate limiter no configurado.');
  }
  const { success } = await binding.limit({ key:`${sub}:session-grant` });
  if (!success) throw new PilotHttpError(429, 'VOICE_RATE_LIMITED', 'Demasiadas solicitudes de voz.');
}

async function sessionGrant(request, env, { fetchImpl, nowMs, randomUUID, requestId }) {
  const origin = validateOrigin(request, env);
  const token = parseBearer(request);
  if (!token) throw new PilotHttpError(401, 'CAMPUS_SESSION_REQUIRED', 'Sesión del Campus requerida.');
  if (/sk-[A-Za-z0-9_-]{12,}/.test(token)) {
    throw new PilotHttpError(401, 'PROVIDER_SECRET_FORBIDDEN', 'Sesión del Campus inválida.');
  }

  let body;
  try { body = await request.json(); }
  catch (_) { throw new PilotHttpError(400, 'INVALID_JSON', 'Solicitud de Voice Grant inválida.'); }
  const requestedRole = clean(body?.role).toLowerCase();
  if (!PILOT_ROLES.has(requestedRole)) {
    throw new PilotHttpError(403, 'PILOT_ROLE_FORBIDDEN', 'Speak LAB piloto está habilitado para docente y estudiante.');
  }
  const scopes = normalizedScopes(body?.scopes);

  const auth = await validateCampusSession(token, env, fetchImpl);
  const verifiedRole = authRole(auth);
  if (verifiedRole && verifiedRole !== requestedRole) {
    throw new PilotHttpError(403, 'CAMPUS_ROLE_MISMATCH', 'El rol activo no coincide con la sesión validada.');
  }

  // El rol es metadato del grant; la autorización efectiva son scopes fijos de práctica.
  // Si validarSesion no repite el rol, el token válido + rol visible student/teacher del Campus
  // bastan para el piloto. Ningún scope administrativo existe en este broker.
  const issued = await issueGrant({ token, role:requestedRole, scopes, env, nowMs, randomUUID });
  await enforceGrantRateLimit(env, issued.claims.sub);
  return json(200, {
    ok:true,
    grant:issued.grant,
    expiresIn:issued.claims.exp - issued.claims.iat,
    scopes:issued.claims.scopes,
    role:issued.claims.role,
  }, { origin, requestId });
}

export function createSpeakLabPilotWorker({
  fetchImpl = (...args) => globalThis.fetch(...args),
  nowMs = () => Date.now(),
  randomUUID = () => crypto.randomUUID(),
  requestIdFactory = () => crypto.randomUUID(),
  logger = console,
} = {}) {
  const baseWorker = createSpeakLabCloudflareWorker({
    fetchImpl,
    nowMs,
    requestIdFactory,
    logger,
  });

  return {
    async fetch(request, env = {}) {
      const url = new URL(request.url);
      if (request.method !== 'POST' || url.pathname !== SESSION_GRANT_PATH) {
        return baseWorker.fetch(request, env);
      }
      const requestId = clean(requestIdFactory()) || clean(randomUUID());
      let origin = '';
      try {
        origin = validateOrigin(request, env);
        return await sessionGrant(request, env, { fetchImpl, nowMs, randomUUID, requestId });
      } catch (rawError) {
        const status = Number(rawError?.status) || 500;
        const code = clean(rawError?.code) || 'SESSION_GRANT_ERROR';
        const message = status >= 500
          ? (clean(rawError?.message) || 'Servicio de autorización temporalmente no disponible.')
          : (clean(rawError?.message) || 'Solicitud de autorización inválida.');
        try {
          logger?.info?.(JSON.stringify({
            method:'POST',
            path:SESSION_GRANT_PATH,
            requestId,
            status,
            errorClass:code,
          }));
        } catch (_) {}
        return json(status, { ok:false, error:code, message, requestId }, { origin, requestId });
      }
    },
  };
}

export const SPEAK_LAB_PILOT_GATEWAY = Object.freeze({
  sessionGrantPath:SESSION_GRANT_PATH,
  scopes:PILOT_SCOPES,
  roles:Object.freeze([...PILOT_ROLES]),
  authTimeoutMs:SESSION_AUTH_TIMEOUT_MS,
});

export default createSpeakLabPilotWorker();
