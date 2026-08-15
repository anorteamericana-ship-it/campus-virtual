import http from 'node:http';
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import {
  VOICE_GATEWAY_LIMITS,
  VOICE_GATEWAY_SCOPES,
  assertNoProviderSecrets,
  requireVoiceScope,
  validateGatewayTtsEnvelope,
  validateGatewaySttMetadata,
  validateVoiceGrantClaims,
} from './gateway_protocol.js';

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function jsonBase64url(value) {
  return base64url(JSON.stringify(value));
}

function signPayload(payloadPart, secret) {
  return createHmac('sha256', secret).update(payloadPart).digest('base64url');
}

export function createMockVoiceGrant({
  secret,
  sub = 'sl_mocksubject001',
  role = 'student',
  scopes = [VOICE_GATEWAY_SCOPES.TTS_READ, VOICE_GATEWAY_SCOPES.STT_WRITE],
  ttlSeconds = 120,
  nowSeconds = Math.floor(Date.now() / 1000),
  jti = randomBytes(12).toString('base64url'),
} = {}) {
  if (!secret) throw new Error('Mock Voice Grant requiere secret de prueba.');
  const claims = validateVoiceGrantClaims({
    iss:'campus-auth',
    aud:'speak-lab-voice-gateway',
    sub,
    role,
    scopes,
    iat:nowSeconds,
    exp:nowSeconds + ttlSeconds,
    jti,
  }, { nowSeconds });
  const payloadPart = jsonBase64url(claims);
  return `${payloadPart}.${signPayload(payloadPart, secret)}`;
}

export function verifyMockVoiceGrant(token, secret, { nowSeconds = Math.floor(Date.now() / 1000) } = {}) {
  const [payloadPart, signaturePart, extra] = String(token || '').split('.');
  if (!payloadPart || !signaturePart || extra) throw new Error('VOICE_GRANT_MALFORMED');
  const expected = Buffer.from(signPayload(payloadPart, secret));
  const actual = Buffer.from(signaturePart);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new Error('VOICE_GRANT_BAD_SIGNATURE');
  let claims;
  try { claims = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')); }
  catch (_) { throw new Error('VOICE_GRANT_BAD_PAYLOAD'); }
  return validateVoiceGrantClaims(claims, { nowSeconds });
}

function sendJson(res, status, data, headers = {}) {
  const body = Buffer.from(JSON.stringify(data));
  res.writeHead(status, {
    'Content-Type':'application/json; charset=utf-8',
    'Content-Length':String(body.length),
    'Cache-Control':'no-store',
    ...headers,
  });
  res.end(body);
}

function sendError(res, status, code, message) {
  sendJson(res, status, { ok:false, error:code, message, mock:true });
}

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(Object.assign(new Error('BODY_TOO_LARGE'), { status:413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function bearer(req) {
  const value = String(req.headers.authorization || '');
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function authorize(req, secret, scope) {
  const token = bearer(req);
  if (!token) throw Object.assign(new Error('VOICE_GRANT_REQUIRED'), { status:401 });
  let claims;
  try { claims = verifyMockVoiceGrant(token, secret); }
  catch (error) { throw Object.assign(new Error(error.message || 'VOICE_GRANT_INVALID'), { status:401 }); }
  try { return requireVoiceScope(claims, scope); }
  catch (error) { throw Object.assign(new Error(error.code || 'VOICE_GATEWAY_SCOPE_DENIED'), { status:403 }); }
}

function makeSilentWav({ durationMs = 180, sampleRate = 16000 } = {}) {
  const channels = 1;
  const bitsPerSample = 16;
  const samples = Math.max(1, Math.floor(sampleRate * durationMs / 1000));
  const dataSize = samples * channels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28);
  buffer.writeUInt16LE(channels * bitsPerSample / 8, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

function parseVocabularyHints(value) {
  if (!value) return [];
  try {
    const decoded = decodeURIComponent(String(value));
    const parsed = JSON.parse(decoded);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    throw Object.assign(new Error('INVALID_VOCABULARY_HINTS'), { status:400 });
  }
}

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

export async function startMockVoiceGateway({ port = 0, host = '127.0.0.1', secret = 'TEST_ONLY_SPEAK_LAB_GATEWAY_SECRET' } = {}) {
  const requestLog = [];

  const server = http.createServer(async (req, res) => {
    const requestId = `mock_${randomBytes(8).toString('hex')}`;
    const url = new URL(req.url || '/', `http://${req.headers.host || `${host}:${port}`}`);
    const entry = { method:req.method, path:url.pathname, requestId, sub:null, scope:null, bytes:0 };
    requestLog.push(entry);

    try {
      if (req.method === 'GET' && url.pathname === '/health') {
        return sendJson(res, 200, { ok:true, service:'speak-lab-mock-voice-gateway', mock:true, protocol:'1.0.0' }, { 'X-Request-Id':requestId });
      }

      if (req.method === 'POST' && url.pathname === '/v1/tts') {
        const claims = authorize(req, secret, VOICE_GATEWAY_SCOPES.TTS_READ);
        entry.sub = claims.sub;
        entry.scope = VOICE_GATEWAY_SCOPES.TTS_READ;
        const raw = await readBody(req, 32_768);
        entry.bytes = raw.length;
        let body;
        try { body = JSON.parse(raw.toString('utf8')); }
        catch (_) { return sendError(res, 400, 'INVALID_JSON', 'Payload TTS debe ser JSON.'); }
        assertNoProviderSecrets(body);
        const payload = validateGatewayTtsEnvelope(body);
        const wav = makeSilentWav();
        res.writeHead(200, {
          'Content-Type':'audio/wav',
          'Content-Length':String(wav.length),
          'Cache-Control':payload.cachePolicy === 'cache-static' ? 'private, max-age=60' : 'no-store',
          'X-SpeakLab-Provider':'mock-gateway',
          'X-SpeakLab-Model':'MOCK_SILENCE_NOT_SPEECH',
          'X-SpeakLab-Mock':'true',
          'X-SpeakLab-Cache-Key':`mock:${Buffer.from(payload.text).toString('base64url').slice(0, 24)}`,
          'X-Request-Id':requestId,
        });
        return res.end(wav);
      }

      if (req.method === 'POST' && url.pathname === '/v1/stt') {
        const claims = authorize(req, secret, VOICE_GATEWAY_SCOPES.STT_WRITE);
        entry.sub = claims.sub;
        entry.scope = VOICE_GATEWAY_SCOPES.STT_WRITE;

        const leakedHeader = TARGET_HEADERS.find(name => String(req.headers[name] || '').trim());
        const leakedQuery = TARGET_QUERY_KEYS.find(name => String(url.searchParams.get(name) || '').trim());
        if (leakedHeader || leakedQuery) {
          return sendError(res, 400, 'STT_TARGET_LEAKAGE', leakedHeader ? `Header prohibido: ${leakedHeader}` : `Query prohibido: ${leakedQuery}`);
        }

        const raw = await readBody(req, VOICE_GATEWAY_LIMITS.maxAudioBytes + 1);
        entry.bytes = raw.length;
        const metadata = validateGatewaySttMetadata({
          byteLength:raw.length,
          durationMs:Number(req.headers['x-speaklab-duration-ms']),
          mimeType:String(req.headers['content-type'] || ''),
          language:String(req.headers['x-speaklab-language'] || 'en'),
          vocabularyHints:parseVocabularyHints(req.headers['x-speaklab-vocabulary-hints']),
        });
        assertNoProviderSecrets(metadata);
        return sendJson(res, 200, {
          ok:true,
          mock:true,
          text:'[MOCK_STT_NO_RECOGNITION]',
          language:metadata.language,
          words:[],
          noSpeechDetected:false,
          provider:'mock-gateway',
          model:'MOCK_STT_NO_RECOGNITION',
          requestId,
        }, {
          'X-SpeakLab-Provider':'mock-gateway',
          'X-SpeakLab-Model':'MOCK_STT_NO_RECOGNITION',
          'X-SpeakLab-Mock':'true',
          'X-Request-Id':requestId,
        });
      }

      if (url.pathname.startsWith('/v1/pronunciation') || url.pathname.startsWith('/v1/realtime')) {
        return sendError(res, 501, 'NOT_IMPLEMENTED', 'Mock gateway no implementa pronunciación ni Realtime.');
      }

      return sendError(res, 404, 'NOT_FOUND', 'Ruta no encontrada.');
    } catch (error) {
      const status = Number(error?.status) || (error?.code ? 400 : 500);
      return sendError(res, status, error?.code || error?.message || 'MOCK_GATEWAY_ERROR', error?.message || 'Mock gateway error.');
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  const baseUrl = `http://${host}:${actualPort}`;

  return Object.freeze({
    server,
    baseUrl,
    secret,
    requestLog,
    createGrant:(options = {}) => createMockVoiceGrant({ secret, ...options }),
    close:() => new Promise(resolve => server.close(resolve)),
  });
}
