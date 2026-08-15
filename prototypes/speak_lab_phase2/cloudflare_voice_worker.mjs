import { SpeakLabContractError } from '../speak_lab_phase1/contracts.js';
import {
  VOICE_GATEWAY_LIMITS,
  VOICE_GATEWAY_PROTOCOL_VERSION,
  VOICE_GATEWAY_SCOPES,
  assertNoProviderSecrets,
  requireVoiceScope,
  validateGatewaySttMetadata,
  validateGatewayTtsEnvelope,
  validateVoiceGrantClaims,
} from '../speak_lab_phase1/gateway_protocol.js';
import { OpenAIAudioProvider } from './openai_audio_provider.mjs';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const MAX_TTS_BODY_BYTES = 32_768;
const TARGET_HEADERS = Object.freeze([
  'x-speaklab-expected-text',
  'x-speaklab-reference-text',
  'x-speaklab-target-text',
  'x-speaklab-answer-text',
  'x-speaklab-correct-answer',
]);
const TARGET_QUERY_KEYS = Object.freeze([
  'expectedText', 'referenceText', 'targetText', 'answerText', 'correctAnswer',
]);
const ALLOWED_CORS_HEADERS = Object.freeze([
  'Authorization',
  'Content-Type',
  'X-SpeakLab-Protocol',
  'X-SpeakLab-Language',
  'X-SpeakLab-Duration-Ms',
  'X-SpeakLab-Vocabulary-Hints',
]);

class GatewayHttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'GatewayHttpError';
    this.status = status;
    this.code = code;
  }
}

function clean(value) {
  return String(value ?? '').trim();
}

function parseAllowedOrigins(env) {
  return new Set(
    clean(env?.ALLOWED_ORIGINS)
      .split(',')
      .map(item => item.trim())
      .filter(Boolean),
  );
}

function validateOrigin(request, env) {
  const origin = clean(request.headers.get('Origin'));
  if (!origin) return '';
  const allowed = parseAllowedOrigins(env);
  if (!allowed.has(origin)) {
    throw new GatewayHttpError(403, 'ORIGIN_NOT_ALLOWED', 'Origen no autorizado para SPEAK LAB.');
  }
  return origin;
}

function corsHeaders(origin) {
  if (!origin) return {};
  return {
    'Access-Control-Allow-Origin':origin,
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':ALLOWED_CORS_HEADERS.join(', '),
    'Access-Control-Max-Age':'600',
    'Vary':'Origin',
  };
}

function withCors(response, origin) {
  for (const [name, value] of Object.entries(corsHeaders(origin))) response.headers.set(name, value);
  return response;
}

function jsonResponse(status, data, { origin = '', requestId = '' } = {}) {
  const headers = new Headers({
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
  });
  if (requestId) headers.set('X-Request-Id', requestId);
  return withCors(new Response(JSON.stringify(data), { status, headers }), origin);
}

function parseBearer(request) {
  const value = clean(request.headers.get('Authorization'));
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? clean(match[1]) : '';
}

function decodeBase64UrlBytes(value) {
  const normalized = clean(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  let binary;
  try { binary = atob(padded); }
  catch (_) { throw new GatewayHttpError(401, 'VOICE_GRANT_MALFORMED', 'Voice Grant inválido.'); }
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function decodeBase64UrlText(value) {
  return decoder.decode(decodeBase64UrlBytes(value));
}

async function verifyVoiceGrant(token, secret, { nowSeconds = Math.floor(Date.now() / 1000) } = {}) {
  const parts = clean(token).split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new GatewayHttpError(401, 'VOICE_GRANT_MALFORMED', 'Voice Grant inválido.');
  }
  if (!clean(secret)) {
    throw new GatewayHttpError(503, 'VOICE_GRANT_SECRET_UNAVAILABLE', 'Servicio de autorización no disponible.');
  }

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(clean(secret)),
    { name:'HMAC', hash:'SHA-256' },
    false,
    ['verify'],
  );
  const signature = decodeBase64UrlBytes(parts[1]);
  const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(parts[0]));
  if (!valid) throw new GatewayHttpError(401, 'VOICE_GRANT_BAD_SIGNATURE', 'Voice Grant inválido.');

  let claims;
  try { claims = JSON.parse(decodeBase64UrlText(parts[0])); }
  catch (_) { throw new GatewayHttpError(401, 'VOICE_GRANT_BAD_PAYLOAD', 'Voice Grant inválido.'); }

  try { return validateVoiceGrantClaims(claims, { nowSeconds }); }
  catch (_) { throw new GatewayHttpError(401, 'VOICE_GRANT_INVALID', 'Voice Grant inválido o expirado.'); }
}

async function authorize(request, env, scope, nowSeconds) {
  const token = parseBearer(request);
  if (!token) throw new GatewayHttpError(401, 'VOICE_GRANT_REQUIRED', 'Voice Grant requerido.');
  if (/sk-[A-Za-z0-9_-]{12,}/.test(token)) {
    throw new GatewayHttpError(401, 'PROVIDER_SECRET_FORBIDDEN', 'Voice Grant inválido.');
  }
  const claims = await verifyVoiceGrant(token, env?.VOICE_GRANT_SIGNING_SECRET, { nowSeconds });
  try { return requireVoiceScope(claims, scope); }
  catch (_) { throw new GatewayHttpError(403, 'VOICE_GATEWAY_SCOPE_DENIED', 'Voice Grant no autoriza esta operación.'); }
}

async function enforceRateLimit(env, claims, scope) {
  const binding = env?.VOICE_RATE_LIMITER;
  if (!binding || typeof binding.limit !== 'function') {
    throw new GatewayHttpError(503, 'RATE_LIMITER_UNAVAILABLE', 'Rate limiter QA no configurado.');
  }
  const { success } = await binding.limit({ key:`${claims.sub}:${scope}` });
  if (!success) throw new GatewayHttpError(429, 'VOICE_RATE_LIMITED', 'Demasiadas solicitudes de voz.');
}

function assertNoSttTargetLeakage(request, url) {
  const leakedHeader = TARGET_HEADERS.find(name => clean(request.headers.get(name)));
  const leakedQuery = TARGET_QUERY_KEYS.find(name => clean(url.searchParams.get(name)));
  if (leakedHeader || leakedQuery) {
    throw new GatewayHttpError(
      400,
      'STT_TARGET_LEAKAGE',
      leakedHeader ? `Header prohibido: ${leakedHeader}` : `Query prohibido: ${leakedQuery}`,
    );
  }
}

function parseVocabularyHints(value) {
  if (!clean(value)) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(clean(value)));
    if (!Array.isArray(parsed)) throw new Error('NOT_ARRAY');
    return parsed;
  } catch (_) {
    throw new GatewayHttpError(400, 'INVALID_VOCABULARY_HINTS', 'Vocabulary hints inválidos.');
  }
}

async function parseTtsBody(request) {
  const declared = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declared) && declared > MAX_TTS_BODY_BYTES) {
    throw new GatewayHttpError(413, 'BODY_TOO_LARGE', 'Payload TTS excede el límite.');
  }
  const raw = await request.text();
  if (encoder.encode(raw).byteLength > MAX_TTS_BODY_BYTES) {
    throw new GatewayHttpError(413, 'BODY_TOO_LARGE', 'Payload TTS excede el límite.');
  }
  let body;
  try { body = JSON.parse(raw); }
  catch (_) { throw new GatewayHttpError(400, 'INVALID_JSON', 'Payload TTS debe ser JSON.'); }
  assertNoProviderSecrets(body);
  return validateGatewayTtsEnvelope(body);
}

async function parseSttRequest(request) {
  const declared = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declared) && declared > VOICE_GATEWAY_LIMITS.maxAudioBytes) {
    throw new GatewayHttpError(413, 'AUDIO_TOO_LARGE', 'Audio excede tamaño máximo del gateway.');
  }
  const audio = await request.blob();
  const metadata = validateGatewaySttMetadata({
    byteLength:audio.size,
    durationMs:Number(request.headers.get('X-SpeakLab-Duration-Ms')),
    mimeType:clean(request.headers.get('Content-Type')),
    language:clean(request.headers.get('X-SpeakLab-Language') || 'en'),
    vocabularyHints:parseVocabularyHints(request.headers.get('X-SpeakLab-Vocabulary-Hints')),
  });
  assertNoProviderSecrets(metadata);
  return { audio, metadata };
}

function providerFor(env, fetchImpl) {
  return new OpenAIAudioProvider({ env, fetchImpl });
}

function providerStatus(error) {
  if (error?.code === 'OPENAI_AUDIO_TIMEOUT') return 504;
  if (['OPENAI_AUDIO_HTTP_ERROR','OPENAI_AUDIO_NETWORK_ERROR','OPENAI_STT_INVALID_JSON','OPENAI_TTS_EMPTY_AUDIO'].includes(error?.code)) return 502;
  if (error?.code === 'OPENAI_API_KEY_REQUIRED') return 503;
  return null;
}

function safeUpstreamDiagnostics(error) {
  if (error?.code !== 'OPENAI_AUDIO_HTTP_ERROR') {
    return { upstreamStatus:null, upstreamRequestId:null };
  }
  const status = Number(error?.details?.status);
  const requestId = clean(error?.details?.requestId);
  return {
    upstreamStatus:Number.isInteger(status) && status >= 100 && status <= 599 ? status : null,
    upstreamRequestId:/^[A-Za-z0-9._:-]{1,160}$/.test(requestId) ? requestId : null,
  };
}

function normalizeError(error) {
  if (error instanceof GatewayHttpError) return error;
  const upstreamStatus = providerStatus(error);
  if (upstreamStatus) {
    return new GatewayHttpError(upstreamStatus, error.code, 'Proveedor de voz temporalmente no disponible.');
  }
  if (error instanceof SpeakLabContractError || clean(error?.code)) {
    return new GatewayHttpError(400, clean(error.code || 'VOICE_GATEWAY_CONTRACT_ERROR'), clean(error.message || 'Solicitud inválida.'));
  }
  return new GatewayHttpError(500, 'VOICE_GATEWAY_INTERNAL_ERROR', 'Servicio de voz temporalmente no disponible.');
}

function technicalLog(logger, entry) {
  const safe = {
    event:'speak_lab_voice_gateway',
    method:entry.method,
    path:entry.path,
    requestId:entry.requestId,
    sub:entry.sub || null,
    scope:entry.scope || null,
    status:entry.status,
    bytes:entry.bytes || 0,
    latencyMs:entry.latencyMs,
    errorClass:entry.errorClass || null,
    upstreamStatus:entry.upstreamStatus || null,
    upstreamRequestId:entry.upstreamRequestId || null,
  };
  logger?.log?.(JSON.stringify(safe));
}

function requestIdFrom(factory) {
  try { return clean(factory?.()) || crypto.randomUUID(); }
  catch (_) { return crypto.randomUUID(); }
}

export function createSpeakLabCloudflareWorker({
  fetchImpl = (...args) => globalThis.fetch(...args),
  nowMs = () => Date.now(),
  requestIdFactory = () => crypto.randomUUID(),
  logger = console,
} = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('Cloudflare Worker requiere fetch.');

  return {
    async fetch(request, env = {}) {
      const startedAt = nowMs();
      const url = new URL(request.url);
      const requestId = requestIdFrom(requestIdFactory);
      const logEntry = {
        method:request.method,
        path:url.pathname,
        requestId,
        sub:null,
        scope:null,
        status:500,
        bytes:0,
        latencyMs:0,
        errorClass:null,
        upstreamStatus:null,
        upstreamRequestId:null,
      };
      let origin = '';

      try {
        origin = validateOrigin(request, env);

        if (request.method === 'OPTIONS') {
          logEntry.status = 204;
          return withCors(new Response(null, { status:204, headers:{ 'X-Request-Id':requestId } }), origin);
        }

        if (request.method === 'GET' && url.pathname === '/health') {
          logEntry.status = 200;
          return jsonResponse(200, {
            ok:true,
            service:'speak-lab-voice-gateway',
            environment:clean(env?.ENVIRONMENT || 'unknown'),
            protocol:VOICE_GATEWAY_PROTOCOL_VERSION,
          }, { origin, requestId });
        }

        if (request.method === 'POST' && url.pathname === '/v1/tts') {
          const claims = await authorize(request, env, VOICE_GATEWAY_SCOPES.TTS_READ, Math.floor(nowMs() / 1000));
          logEntry.sub = claims.sub;
          logEntry.scope = VOICE_GATEWAY_SCOPES.TTS_READ;
          await enforceRateLimit(env, claims, VOICE_GATEWAY_SCOPES.TTS_READ);
          const payload = await parseTtsBody(request);
          logEntry.bytes = encoder.encode(JSON.stringify(payload)).byteLength;

          const result = await providerFor(env, fetchImpl).synthesize(payload);
          const headers = new Headers({
            'Content-Type':result.mimeType,
            'Cache-Control':payload.cachePolicy === 'cache-static' ? 'private, max-age=60' : 'no-store',
            'X-SpeakLab-Provider':result.provider.provider,
            'X-SpeakLab-Model':result.provider.model,
            'X-SpeakLab-Synthetic-Voice':'true',
            'X-Request-Id':requestId,
          });
          if (result.cacheKey) headers.set('X-SpeakLab-Cache-Key', result.cacheKey);
          logEntry.status = 200;
          return withCors(new Response(result.audio, { status:200, headers }), origin);
        }

        if (request.method === 'POST' && url.pathname === '/v1/stt') {
          assertNoSttTargetLeakage(request, url);
          const claims = await authorize(request, env, VOICE_GATEWAY_SCOPES.STT_WRITE, Math.floor(nowMs() / 1000));
          logEntry.sub = claims.sub;
          logEntry.scope = VOICE_GATEWAY_SCOPES.STT_WRITE;
          await enforceRateLimit(env, claims, VOICE_GATEWAY_SCOPES.STT_WRITE);
          const { audio, metadata } = await parseSttRequest(request);
          logEntry.bytes = metadata.byteLength;

          const result = await providerFor(env, fetchImpl).transcribe({
            audio,
            language:metadata.language,
            mode:'file',
            vocabularyHints:metadata.vocabularyHints,
            timestamps:'none',
          });
          logEntry.status = 200;
          return jsonResponse(200, {
            text:result.text,
            language:result.language,
            words:result.words,
            noSpeechDetected:result.noSpeechDetected,
            provider:result.provider,
          }, { origin, requestId });
        }

        if (url.pathname.startsWith('/v1/pronunciation') || url.pathname.startsWith('/v1/realtime')) {
          throw new GatewayHttpError(501, 'NOT_IMPLEMENTED', 'Pronunciación y Realtime no están habilitados en este corte.');
        }

        throw new GatewayHttpError(404, 'NOT_FOUND', 'Ruta no encontrada.');
      } catch (rawError) {
        const diagnostics = safeUpstreamDiagnostics(rawError);
        logEntry.upstreamStatus = diagnostics.upstreamStatus;
        logEntry.upstreamRequestId = diagnostics.upstreamRequestId;
        const error = normalizeError(rawError);
        logEntry.status = error.status;
        logEntry.errorClass = error.code;
        return jsonResponse(error.status, {
          ok:false,
          error:error.code,
          message:error.message,
          requestId,
        }, { origin, requestId });
      } finally {
        logEntry.latencyMs = Math.max(0, nowMs() - startedAt);
        technicalLog(logger, logEntry);
      }
    },
  };
}

export default createSpeakLabCloudflareWorker();