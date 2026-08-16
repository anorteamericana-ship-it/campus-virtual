import { SPEAK_LAB_CONTRACTS, SpeakLabContractError } from './contracts.js';

export const VOICE_GATEWAY_PROTOCOL_VERSION = '1.0.0';

export const VOICE_GATEWAY_SCOPES = Object.freeze({
  TTS_READ: 'tts:read',
  STT_WRITE: 'stt:write',
  PRONUNCIATION_WRITE: 'pronunciation:write',
  REALTIME_CONNECT: 'realtime:connect',
});

export const VOICE_GATEWAY_LIMITS = Object.freeze({
  grantMaxTtlSeconds: 600,
  maxAudioBytes: 2_500_000,
  maxAudioDurationMs: 30_000,
  maxTtsCharacters: 4096,
  maxVocabularyHints: 32,
  maxVocabularyHintCharacters: 32,
  maxPronunciationReferenceCharacters: 4096,
  maxRubricVersionCharacters: 120,
});

const ALLOWED_SCOPES = new Set(Object.values(VOICE_GATEWAY_SCOPES));
const FORBIDDEN_IDENTITY_KEYS = Object.freeze([
  'name', 'nombre', 'email', 'correo', 'cedula', 'cédula', 'phone', 'telefono', 'teléfono',
]);

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function invariant(condition, code, message, details = null) {
  if (!condition) throw new SpeakLabContractError(code, message, details);
}

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function objectHasValue(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key) && clean(obj[key]);
}

export function validateVoiceGrantClaims(input, { nowSeconds = Math.floor(Date.now() / 1000) } = {}) {
  invariant(isObject(input), 'INVALID_VOICE_GRANT', 'Voice Grant debe ser un objeto.');

  const identityLeaks = FORBIDDEN_IDENTITY_KEYS.filter(key => objectHasValue(input, key));
  invariant(identityLeaks.length === 0, 'VOICE_GRANT_PII_FORBIDDEN', 'Voice Grant no puede contener PII directa.', { identityLeaks });

  const iss = clean(input.iss);
  const aud = clean(input.aud);
  const sub = clean(input.sub);
  const jti = clean(input.jti);
  const role = clean(input.role).toLowerCase();
  const iat = Number(input.iat);
  const exp = Number(input.exp);

  invariant(iss === 'campus-auth', 'VOICE_GRANT_INVALID_ISSUER', 'Issuer de Voice Grant inválido.');
  invariant(aud === 'speak-lab-voice-gateway', 'VOICE_GRANT_INVALID_AUDIENCE', 'Audience de Voice Grant inválido.');
  invariant(/^sl_[A-Za-z0-9_-]{12,64}$/.test(sub), 'VOICE_GRANT_INVALID_SUBJECT', 'Voice Grant requiere subject opaco sl_*.');
  invariant(/^[A-Za-z0-9_-]{12,96}$/.test(jti), 'VOICE_GRANT_INVALID_JTI', 'Voice Grant requiere jti no vacío y opaco.');
  invariant(['student','teacher','admin','superadmin'].includes(role), 'VOICE_GRANT_INVALID_ROLE', 'Rol de Voice Grant inválido.');
  invariant(Number.isInteger(iat) && Number.isInteger(exp), 'VOICE_GRANT_INVALID_TIME', 'Voice Grant requiere iat/exp enteros.');
  invariant(exp > iat, 'VOICE_GRANT_INVALID_TIME', 'Voice Grant exp debe ser posterior a iat.');
  invariant(exp - iat <= VOICE_GATEWAY_LIMITS.grantMaxTtlSeconds, 'VOICE_GRANT_TTL_TOO_LONG', 'Voice Grant excede TTL máximo.');
  invariant(iat <= nowSeconds + 30, 'VOICE_GRANT_FROM_FUTURE', 'Voice Grant tiene iat futuro inválido.');
  invariant(exp > nowSeconds, 'VOICE_GRANT_EXPIRED', 'Voice Grant expiró.');

  const scopes = Array.isArray(input.scopes) ? [...new Set(input.scopes.map(clean).filter(Boolean))] : [];
  invariant(scopes.length > 0, 'VOICE_GRANT_SCOPE_REQUIRED', 'Voice Grant requiere al menos un scope.');
  invariant(scopes.every(scope => ALLOWED_SCOPES.has(scope)), 'VOICE_GRANT_INVALID_SCOPE', 'Voice Grant contiene scope no permitido.');

  return Object.freeze({ iss, aud, sub, jti, role, iat, exp, scopes:Object.freeze(scopes) });
}

export function requireVoiceScope(claims, scope) {
  const normalized = validateVoiceGrantClaims(claims);
  invariant(ALLOWED_SCOPES.has(scope), 'VOICE_GATEWAY_UNKNOWN_SCOPE', `Scope desconocido: ${scope}`);
  invariant(normalized.scopes.includes(scope), 'VOICE_GATEWAY_SCOPE_DENIED', `Voice Grant no autoriza ${scope}.`);
  return normalized;
}

export function validateGatewayTtsEnvelope(input) {
  invariant(isObject(input), 'INVALID_GATEWAY_TTS', 'Payload TTS inválido.');
  const text = clean(input.text);
  invariant(text, 'EMPTY_TTS_TEXT', 'TTS requiere texto.');
  invariant(text.length <= VOICE_GATEWAY_LIMITS.maxTtsCharacters, 'TTS_TEXT_TOO_LONG', 'TTS excede límite del gateway.');
  const speakingRate = Number.isFinite(Number(input.speakingRate)) ? Number(input.speakingRate) : 1;
  invariant(speakingRate >= 0.5 && speakingRate <= 1.5, 'INVALID_SPEAKING_RATE', 'speakingRate debe estar entre 0.5 y 1.5.');
  return Object.freeze({
    text,
    language:clean(input.language || 'en-US'),
    voiceProfile:clean(input.voiceProfile || 'default'),
    speakingRate,
    style:clean(input.style),
    cachePolicy:input.cachePolicy === 'no-store' ? 'no-store' : 'cache-static',
  });
}

function normalizeVocabularyHints(input) {
  const hints = Array.isArray(input)
    ? input.map(clean).filter(Boolean).slice(0, VOICE_GATEWAY_LIMITS.maxVocabularyHints)
    : [];
  for (const hint of hints) {
    invariant(hint.length <= VOICE_GATEWAY_LIMITS.maxVocabularyHintCharacters, 'STT_HINT_TOO_LONG', 'Vocabulary hint excede longitud máxima.');
    invariant(/^[A-Za-z][A-Za-z'’-]*$/.test(hint), 'STT_HINT_MUST_BE_LEXEME', 'Vocabulary hints deben ser lexemas individuales, no frases objetivo.');
  }
  return Object.freeze(hints);
}

export function validateGatewaySttMetadata(input) {
  invariant(isObject(input), 'INVALID_GATEWAY_STT', 'Metadata STT inválida.');

  const leakedKeys = SPEAK_LAB_CONTRACTS.sttForbiddenTargetKeys.filter(key => objectHasValue(input, key));
  invariant(leakedKeys.length === 0, 'STT_TARGET_LEAKAGE', `Gateway STT no acepta target text: ${leakedKeys.join(', ')}`, { leakedKeys });

  const byteLength = Number(input.byteLength);
  const durationMs = Number(input.durationMs);
  invariant(Number.isInteger(byteLength) && byteLength > 0, 'INVALID_AUDIO_SIZE', 'STT requiere byteLength positivo.');
  invariant(byteLength <= VOICE_GATEWAY_LIMITS.maxAudioBytes, 'AUDIO_TOO_LARGE', 'Audio excede tamaño máximo del gateway.');
  invariant(Number.isFinite(durationMs) && durationMs > 0, 'INVALID_AUDIO_DURATION', 'STT requiere duración positiva.');
  invariant(durationMs <= VOICE_GATEWAY_LIMITS.maxAudioDurationMs, 'AUDIO_TOO_LONG', 'Audio excede duración máxima del gateway.');

  const mimeType = clean(input.mimeType).toLowerCase();
  invariant(/^audio\/(webm|mp4|mpeg|wav|x-wav|ogg)(?:;|$)/.test(mimeType), 'UNSUPPORTED_AUDIO_TYPE', `Tipo de audio no soportado: ${mimeType}`);

  return Object.freeze({
    byteLength,
    durationMs,
    mimeType,
    language:clean(input.language || 'en'),
    vocabularyHints:normalizeVocabularyHints(input.vocabularyHints),
  });
}

export function validateGatewayPronunciationMetadata(input) {
  invariant(isObject(input), 'INVALID_GATEWAY_PRONUNCIATION', 'Metadata de pronunciación inválida.');

  const byteLength = Number(input.byteLength);
  const durationMs = Number(input.durationMs);
  invariant(Number.isInteger(byteLength) && byteLength > 0, 'INVALID_AUDIO_SIZE', 'Pronunciación requiere byteLength positivo.');
  invariant(byteLength <= VOICE_GATEWAY_LIMITS.maxAudioBytes, 'AUDIO_TOO_LARGE', 'Audio excede tamaño máximo del gateway.');
  invariant(Number.isFinite(durationMs) && durationMs > 0, 'INVALID_AUDIO_DURATION', 'Pronunciación requiere duración positiva.');
  invariant(durationMs <= VOICE_GATEWAY_LIMITS.maxAudioDurationMs, 'AUDIO_TOO_LONG', 'Audio excede duración máxima del gateway.');

  const mimeType = clean(input.mimeType).toLowerCase();
  invariant(
    /^audio\/ogg(?:;|$)/.test(mimeType) || /^audio\/(wav|x-wav)(?:;|$)/.test(mimeType),
    'UNSUPPORTED_PRONUNCIATION_AUDIO_TYPE',
    'Pronunciación requiere OGG/Opus o WAV PCM canónico.',
  );

  const referenceText = clean(input.referenceText);
  invariant(referenceText, 'MISSING_REFERENCE_TEXT', 'Pronunciación requiere referenceText.');
  invariant(
    referenceText.length <= VOICE_GATEWAY_LIMITS.maxPronunciationReferenceCharacters,
    'PRONUNCIATION_REFERENCE_TOO_LONG',
    'referenceText excede el límite del gateway.',
  );

  const rubricVersion = clean(input.rubricVersion || 'speaklab-pronunciation-v0');
  invariant(
    rubricVersion.length <= VOICE_GATEWAY_LIMITS.maxRubricVersionCharacters,
    'RUBRIC_VERSION_TOO_LONG',
    'rubricVersion excede el límite del gateway.',
  );

  return Object.freeze({
    byteLength,
    durationMs,
    mimeType,
    language:clean(input.language || 'en-US'),
    referenceText,
    rubricVersion,
  });
}

export function assertNoProviderSecrets(input) {
  const serialized = JSON.stringify(input ?? {});
  const secretPatterns = [
    /OPENAI_API_KEY/i,
    /api[_-]?key/i,
    /sk-[A-Za-z0-9_-]{12,}/,
    /provider[_-]?secret/i,
  ];
  invariant(!secretPatterns.some(pattern => pattern.test(serialized)), 'PROVIDER_SECRET_FORBIDDEN', 'El cliente/gateway envelope no puede transportar secretos del proveedor.');
  return true;
}

export const VOICE_GATEWAY_PROTOCOL = Object.freeze({
  version:VOICE_GATEWAY_PROTOCOL_VERSION,
  scopes:VOICE_GATEWAY_SCOPES,
  limits:VOICE_GATEWAY_LIMITS,
  forbiddenIdentityKeys:FORBIDDEN_IDENTITY_KEYS,
});
