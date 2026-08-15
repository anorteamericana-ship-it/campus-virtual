export const SPEAK_LAB_CONTRACT_VERSION = '1.0.0';

export class SpeakLabContractError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'SpeakLabContractError';
    this.code = code;
    this.details = details;
  }
}

function invariant(condition, code, message, details = null) {
  if (!condition) throw new SpeakLabContractError(code, message, details);
}

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function assertObject(value, label) {
  invariant(isObject(value), 'INVALID_OBJECT', `${label} debe ser un objeto.`);
}

function assertBlob(value, label = 'audio') {
  invariant(typeof Blob !== 'undefined' && value instanceof Blob, 'INVALID_AUDIO_BLOB', `${label} debe ser un Blob.`);
  invariant(value.size > 0, 'EMPTY_AUDIO_BLOB', `${label} no puede estar vacío.`);
}

function assertLanguage(value) {
  const language = cleanText(value || 'en');
  invariant(/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(language), 'INVALID_LANGUAGE', `Idioma inválido: ${language}`);
  return language;
}

function assertRate(value) {
  const rate = Number(value ?? 1);
  invariant(Number.isFinite(rate) && rate >= 0.5 && rate <= 1.5, 'INVALID_SPEAKING_RATE', 'speakingRate debe estar entre 0.5 y 1.5.');
  return rate;
}

function providerMeta(value, kind) {
  assertObject(value, `${kind}.provider`);
  const provider = cleanText(value.provider);
  const model = cleanText(value.model);
  invariant(provider, 'MISSING_PROVIDER', `${kind}.provider.provider es obligatorio.`);
  invariant(model, 'MISSING_MODEL', `${kind}.provider.model es obligatorio.`);
  return {
    provider,
    model,
    requestId: cleanText(value.requestId),
  };
}

export function validateTtsRequest(input) {
  assertObject(input, 'TTS request');
  const text = cleanText(input.text);
  invariant(text, 'EMPTY_TTS_TEXT', 'TTS requiere texto.');
  invariant(text.length <= 4096, 'TTS_TEXT_TOO_LONG', 'TTS excede 4096 caracteres.');

  return Object.freeze({
    text,
    language: assertLanguage(input.language || 'en-US'),
    voiceProfile: cleanText(input.voiceProfile || 'default'),
    speakingRate: assertRate(input.speakingRate),
    style: cleanText(input.style || 'clear, natural language-learning model voice'),
    cachePolicy: input.cachePolicy === 'no-store' ? 'no-store' : 'cache-static',
  });
}

export function validateTtsResult(input) {
  assertObject(input, 'TTS result');
  assertBlob(input.audio, 'TTS result.audio');
  const mimeType = cleanText(input.mimeType || input.audio.type);
  invariant(/^audio\//i.test(mimeType), 'INVALID_TTS_MIME', 'TTS result debe declarar MIME de audio.');
  invariant(input.syntheticVoice === true, 'SYNTHETIC_VOICE_FLAG_REQUIRED', 'Toda voz TTS debe marcarse explícitamente como syntheticVoice=true.');

  return Object.freeze({
    audio: input.audio,
    mimeType,
    syntheticVoice: true,
    provider: providerMeta(input.provider, 'TTS'),
    cacheKey: cleanText(input.cacheKey),
  });
}

const STT_TARGET_LEAK_KEYS = Object.freeze([
  'expectedText',
  'referenceText',
  'targetText',
  'answerText',
  'correctAnswer',
]);

export function validateSttRequest(input) {
  assertObject(input, 'STT request');
  assertBlob(input.audio, 'STT request.audio');

  const leakedKeys = STT_TARGET_LEAK_KEYS.filter(key => cleanText(input[key]));
  invariant(
    leakedKeys.length === 0,
    'STT_TARGET_LEAKAGE',
    `El STT primario no puede recibir la respuesta esperada: ${leakedKeys.join(', ')}`,
    { leakedKeys },
  );

  const hints = Array.isArray(input.vocabularyHints)
    ? input.vocabularyHints.map(cleanText).filter(Boolean).slice(0, 32)
    : [];

  return Object.freeze({
    audio: input.audio,
    language: assertLanguage(input.language || 'en'),
    mode: input.mode === 'streaming' ? 'streaming' : 'file',
    vocabularyHints: Object.freeze(hints),
    timestamps: input.timestamps === 'word' ? 'word' : 'none',
  });
}

export function validateSttResult(input) {
  assertObject(input, 'STT result');
  const text = cleanText(input.text);
  const words = Array.isArray(input.words)
    ? input.words.map(item => ({
        word: cleanText(item?.word),
        start: Number.isFinite(Number(item?.start)) ? Number(item.start) : null,
        end: Number.isFinite(Number(item?.end)) ? Number(item.end) : null,
      })).filter(item => item.word)
    : [];

  return Object.freeze({
    text,
    language: assertLanguage(input.language || 'en'),
    words: Object.freeze(words),
    noSpeechDetected: input.noSpeechDetected === true,
    provider: providerMeta(input.provider, 'STT'),
  });
}

export function validatePronunciationRequest(input) {
  assertObject(input, 'Pronunciation request');
  assertBlob(input.audio, 'Pronunciation request.audio');
  const referenceText = cleanText(input.referenceText);
  invariant(referenceText, 'MISSING_REFERENCE_TEXT', 'El evaluador de pronunciación requiere referenceText.');

  const transcript = isObject(input.transcript) ? validateSttResult(input.transcript) : null;

  return Object.freeze({
    audio: input.audio,
    referenceText,
    language: assertLanguage(input.language || 'en-US'),
    transcript,
    rubricVersion: cleanText(input.rubricVersion || 'speaklab-pronunciation-v0'),
    referenceAudio: input.referenceAudio instanceof Blob ? input.referenceAudio : null,
  });
}

const DIMENSIONS = Object.freeze([
  'intelligibility',
  'segmentalAccuracy',
  'wordStress',
  'rhythm',
  'fluency',
  'intonation',
]);

function optionalDimension(value, name) {
  if (value == null) return null;
  const score = Number(value);
  invariant(Number.isFinite(score) && score >= 0 && score <= 100, 'INVALID_PRONUNCIATION_DIMENSION', `${name} debe estar entre 0 y 100 o ser null.`);
  return score;
}

export function validatePronunciationResult(input) {
  assertObject(input, 'Pronunciation result');
  invariant(!('officialGrade' in input), 'OFFICIAL_GRADE_FORBIDDEN', 'Fase de validación no permite officialGrade.');
  invariant(!('finalGrade' in input), 'OFFICIAL_GRADE_FORBIDDEN', 'Fase de validación no permite finalGrade.');

  const dimensions = {};
  for (const name of DIMENSIONS) dimensions[name] = optionalDimension(input.dimensions?.[name], name);

  const issues = Array.isArray(input.issues)
    ? input.issues.slice(0, 12).map(issue => ({
        code: cleanText(issue?.code),
        target: cleanText(issue?.target),
        message: cleanText(issue?.message),
        severity: ['info','practice','important'].includes(issue?.severity) ? issue.severity : 'practice',
        start: Number.isFinite(Number(issue?.start)) ? Number(issue.start) : null,
        end: Number.isFinite(Number(issue?.end)) ? Number(issue.end) : null,
      })).filter(issue => issue.code && issue.message)
    : [];

  return Object.freeze({
    dimensions: Object.freeze(dimensions),
    issues: Object.freeze(issues),
    evaluatorVersion: cleanText(input.evaluatorVersion || 'unversioned'),
    confidence: optionalDimension(input.confidence, 'confidence'),
    calibrated: input.calibrated === true,
    official: false,
  });
}

export class TextToSpeechProvider {
  async synthesize(_request) {
    throw new SpeakLabContractError('NOT_IMPLEMENTED', 'TextToSpeechProvider.synthesize no implementado.');
  }
}

export class SpeechToTextProvider {
  async transcribe(_request) {
    throw new SpeakLabContractError('NOT_IMPLEMENTED', 'SpeechToTextProvider.transcribe no implementado.');
  }
}

export class PronunciationEvaluator {
  async evaluate(_request) {
    throw new SpeakLabContractError('NOT_IMPLEMENTED', 'PronunciationEvaluator.evaluate no implementado.');
  }
}

export class ConversationProvider {
  async createSession(_request) {
    throw new SpeakLabContractError('NOT_IMPLEMENTED', 'ConversationProvider.createSession no implementado.');
  }
}

export const SPEAK_LAB_CONTRACTS = Object.freeze({
  version: SPEAK_LAB_CONTRACT_VERSION,
  dimensions: DIMENSIONS,
  sttForbiddenTargetKeys: STT_TARGET_LEAK_KEYS,
});
