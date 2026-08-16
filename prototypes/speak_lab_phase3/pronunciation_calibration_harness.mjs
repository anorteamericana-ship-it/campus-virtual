import { validatePronunciationResult } from '../speak_lab_phase1/contracts.js';

export const SPEAK_LAB_CALIBRATION_SCHEMA_VERSION = '1.0.0';
export const SPEAK_LAB_CALIBRATION_CONDITIONS = Object.freeze(['good', 'intermediate', 'problematic']);
export const SPEAK_LAB_CALIBRATION_DIMENSIONS = Object.freeze([
  'intelligibility', 'segmentalAccuracy', 'wordStress', 'rhythm', 'fluency', 'intonation',
]);

const FORBIDDEN_KEYS = new Set([
  'name', 'nombre', 'email', 'correo', 'cedula', 'cédula', 'phone', 'telefono', 'teléfono',
  'referenceText', 'expectedText', 'targetText', 'answerText', 'correctAnswer', 'transcript',
  'audio', 'audioPath', 'filePath', 'rawAudio', 'officialGrade', 'finalGrade',
]);
const OPAQUE_ID = /^[A-Za-z][A-Za-z0-9_-]{5,79}$/;
const SHA256 = /^[a-f0-9]{64}$/i;
const MIME_OGG = /^audio\/ogg(?:;|$)/i;
const MAX_AUDIO_BYTES = 2_500_000;
const MAX_AUDIO_DURATION_MS = 30_000;

export class SpeakLabCalibrationError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'SpeakLabCalibrationError';
    this.code = code;
    this.details = details;
  }
}

function invariant(condition, code, message, details = null) {
  if (!condition) throw new SpeakLabCalibrationError(code, message, details);
}

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function opaqueId(value, label) {
  const normalized = clean(value);
  invariant(OPAQUE_ID.test(normalized), 'INVALID_OPAQUE_ID', `${label} debe ser un ID opaco sin PII.`);
  return normalized;
}

function assertNoDirectPii(value, path = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoDirectPii(item, `${path}[${index}]`));
    return;
  }
  if (!isObject(value)) {
    if (typeof value === 'string') {
      invariant(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value), 'PII_VALUE_FORBIDDEN', `Email directo prohibido en ${path}.`);
    }
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    invariant(!FORBIDDEN_KEYS.has(key), 'CALIBRATION_FIELD_FORBIDDEN', `Campo prohibido en dataset de calibración: ${path}.${key}`);
    assertNoDirectPii(item, `${path}.${key}`);
  }
}

function optionalScore(value, label) {
  if (value == null || value === '') return null;
  const score = Number(value);
  invariant(Number.isFinite(score) && score >= 0 && score <= 100, 'INVALID_CALIBRATION_SCORE', `${label} debe estar entre 0 y 100 o ser null.`);
  return score;
}

function validateHumanReview(input) {
  invariant(isObject(input), 'HUMAN_REVIEW_REQUIRED', 'Cada muestra requiere revisión humana controlada.');
  const reviewerId = opaqueId(input.reviewerId, 'humanReview.reviewerId');
  const dimensions = {};
  for (const dimension of SPEAK_LAB_CALIBRATION_DIMENSIONS) {
    dimensions[dimension] = optionalScore(input.dimensions?.[dimension], `humanReview.dimensions.${dimension}`);
  }
  invariant(Object.values(dimensions).some(value => value != null), 'HUMAN_REVIEW_EMPTY', 'La revisión humana debe aportar al menos una dimensión.');
  return Object.freeze({ reviewerId, dimensions:Object.freeze(dimensions) });
}

function validateAudioEvidence(input) {
  invariant(isObject(input), 'AUDIO_EVIDENCE_REQUIRED', 'Cada muestra requiere evidencia técnica del audio sin persistir el audio.');
  const sha256 = clean(input.sha256).toLowerCase();
  const bytes = Number(input.bytes);
  const durationMs = Number(input.durationMs);
  const mimeType = clean(input.mimeType).toLowerCase();
  invariant(SHA256.test(sha256), 'INVALID_AUDIO_SHA256', 'audioEvidence.sha256 debe ser SHA-256 hexadecimal.');
  invariant(Number.isInteger(bytes) && bytes > 0 && bytes <= MAX_AUDIO_BYTES, 'INVALID_AUDIO_BYTES', 'audioEvidence.bytes fuera de límites QA.');
  invariant(Number.isFinite(durationMs) && durationMs > 0 && durationMs <= MAX_AUDIO_DURATION_MS, 'INVALID_AUDIO_DURATION', 'audioEvidence.durationMs fuera de límites QA.');
  invariant(MIME_OGG.test(mimeType), 'INVALID_AUDIO_MIME', 'PC8 inicial admite evidencia OGG/Opus únicamente.');
  return Object.freeze({ sha256, bytes, durationMs, mimeType });
}

function validateProviderResult(input) {
  invariant(isObject(input), 'PROVIDER_RESULT_REQUIRED', 'Cada muestra requiere resultado SPEAK LAB del evaluador.');
  invariant(input.official === false, 'OFFICIAL_RESULT_FORBIDDEN', 'PC8 solo admite providerResult.official=false.');
  invariant(input.calibrated === false, 'CALIBRATED_RESULT_FORBIDDEN', 'PC8 solo admite providerResult.calibrated=false.');
  return validatePronunciationResult(input);
}

export function validateCalibrationSample(input) {
  invariant(isObject(input), 'INVALID_CALIBRATION_SAMPLE', 'Muestra de calibración inválida.');
  assertNoDirectPii(input);
  const condition = clean(input.condition).toLowerCase();
  invariant(SPEAK_LAB_CALIBRATION_CONDITIONS.includes(condition), 'INVALID_CALIBRATION_CONDITION', 'condition debe ser good, intermediate o problematic.');
  const repetition = Number(input.repetition);
  invariant(Number.isInteger(repetition) && repetition >= 1 && repetition <= 20, 'INVALID_REPETITION', 'repetition debe estar entre 1 y 20.');
  invariant(input.staffQaAuthorized === true, 'STAFF_QA_AUTHORIZATION_REQUIRED', 'PC8 solo admite audio staff/QA autorizado.');
  const humanReview = validateHumanReview(input.humanReview);
  return Object.freeze({
    sampleId:opaqueId(input.sampleId, 'sampleId'),
    speakerId:opaqueId(input.speakerId, 'speakerId'),
    reviewerId:humanReview.reviewerId,
    cohortTag:opaqueId(input.cohortTag || 'cohort_default', 'cohortTag'),
    phraseId:opaqueId(input.phraseId, 'phraseId'),
    condition,
    repetition,
    staffQaAuthorized:true,
    audioEvidence:validateAudioEvidence(input.audioEvidence),
    humanReview,
    providerResult:validateProviderResult(input.providerResult),
  });
}

export function validateCalibrationDataset(input) {
  invariant(isObject(input), 'INVALID_CALIBRATION_DATASET', 'Dataset de calibración inválido.');
  assertNoDirectPii(input);
  const samples = Array.isArray(input.samples) ? input.samples.map(validateCalibrationSample) : [];
  invariant(samples.length > 0 && samples.length <= 500, 'INVALID_SAMPLE_COUNT', 'Dataset debe contener entre 1 y 500 muestras.');
  const ids = new Set();
  for (const sample of samples) {
    invariant(!ids.has(sample.sampleId), 'DUPLICATE_SAMPLE_ID', `sampleId duplicado: ${sample.sampleId}`);
    ids.add(sample.sampleId);
  }
  return Object.freeze({
    schemaVersion:SPEAK_LAB_CALIBRATION_SCHEMA_VERSION,
    sessionId:opaqueId(input.sessionId, 'sessionId'),
    rubricVersion:opaqueId(input.rubricVersion || 'rubric_v0', 'rubricVersion'),
    samples:Object.freeze(samples),
  });
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function round(value, digits = 3) {
  if (value == null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function describe(values) {
  if (!values.length) return Object.freeze({ n:0, mean:null, min:null, max:null, range:null, standardDeviation:null, medianAbsoluteDeviation:null });
  const avg = mean(values);
  const variance = mean(values.map(value => (value - avg) ** 2));
  const med = median(values);
  const mad = median(values.map(value => Math.abs(value - med)));
  const min = Math.min(...values);
  const max = Math.max(...values);
  return Object.freeze({ n:values.length, mean:round(avg), min:round(min), max:round(max), range:round(max - min), standardDeviation:round(Math.sqrt(variance)), medianAbsoluteDeviation:round(mad) });
}

function groupBy(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function providerDimensionValues(samples, dimension) {
  return samples.map(sample => sample.providerResult.dimensions[dimension]).filter(value => value != null);
}

function summarizeRepeatability(samples) {
  const groups = groupBy(samples, sample => `${sample.speakerId}|${sample.phraseId}|${sample.condition}`);
  return [...groups.entries()].map(([key, group]) => {
    const [speakerId, phraseId, condition] = key.split('|');
    const dimensions = {};
    for (const dimension of SPEAK_LAB_CALIBRATION_DIMENSIONS) dimensions[dimension] = describe(providerDimensionValues(group, dimension));
    return Object.freeze({ speakerId, phraseId, condition, repetitions:group.length, status:group.length >= 3 ? 'descriptive_only' : 'insufficient_data', dimensions:Object.freeze(dimensions) });
  });
}

function summarizeHumanAgreement(samples) {
  const result = {};
  for (const dimension of SPEAK_LAB_CALIBRATION_DIMENSIONS) {
    const pairs = samples.map(sample => ({ human:sample.humanReview.dimensions[dimension], provider:sample.providerResult.dimensions[dimension] })).filter(pair => pair.human != null && pair.provider != null);
    const signed = pairs.map(pair => pair.provider - pair.human);
    result[dimension] = Object.freeze({
      pairs:pairs.length,
      status:pairs.length >= 3 ? 'descriptive_only' : 'insufficient_data',
      meanProvider:round(mean(pairs.map(pair => pair.provider))),
      meanHuman:round(mean(pairs.map(pair => pair.human))),
      meanSignedDelta:round(mean(signed)),
      meanAbsoluteDelta:round(mean(signed.map(Math.abs))),
    });
  }
  return Object.freeze(result);
}

function summarizeConditions(samples) {
  return SPEAK_LAB_CALIBRATION_CONDITIONS.map(condition => {
    const group = samples.filter(sample => sample.condition === condition);
    const dimensions = {};
    for (const dimension of SPEAK_LAB_CALIBRATION_DIMENSIONS) dimensions[dimension] = describe(providerDimensionValues(group, dimension));
    return Object.freeze({ condition, samples:group.length, status:group.length >= 3 ? 'descriptive_only' : 'insufficient_data', dimensions:Object.freeze(dimensions) });
  });
}

function summarizeCohorts(samples) {
  return [...groupBy(samples, sample => sample.cohortTag).entries()].map(([cohortTag, group]) => {
    const dimensions = {};
    for (const dimension of SPEAK_LAB_CALIBRATION_DIMENSIONS) {
      const deltas = group.map(sample => ({ human:sample.humanReview.dimensions[dimension], provider:sample.providerResult.dimensions[dimension] })).filter(pair => pair.human != null && pair.provider != null).map(pair => pair.provider - pair.human);
      dimensions[dimension] = Object.freeze({ pairs:deltas.length, status:deltas.length >= 3 ? 'descriptive_only' : 'insufficient_data', meanSignedDelta:round(mean(deltas)), meanAbsoluteDelta:round(mean(deltas.map(Math.abs))) });
    }
    return Object.freeze({ cohortTag, samples:group.length, status:group.length >= 3 ? 'descriptive_only' : 'insufficient_data', dimensions:Object.freeze(dimensions) });
  });
}

export function buildPronunciationCalibrationReport(input, { generatedAt = new Date().toISOString() } = {}) {
  const dataset = validateCalibrationDataset(input);
  const evaluatorVersions = [...new Set(dataset.samples.map(sample => sample.providerResult.evaluatorVersion))].sort();
  return Object.freeze({
    schemaVersion:SPEAK_LAB_CALIBRATION_SCHEMA_VERSION,
    generatedAt:clean(generatedAt),
    sessionId:dataset.sessionId,
    rubricVersion:dataset.rubricVersion,
    official:false,
    calibrated:false,
    thresholdsEstablished:false,
    decision:'NO_AUTOMATIC_ACADEMIC_DECISION',
    counts:Object.freeze({
      samples:dataset.samples.length,
      speakers:new Set(dataset.samples.map(sample => sample.speakerId)).size,
      reviewers:new Set(dataset.samples.map(sample => sample.reviewerId)).size,
      phrases:new Set(dataset.samples.map(sample => sample.phraseId)).size,
      cohorts:new Set(dataset.samples.map(sample => sample.cohortTag)).size,
    }),
    evaluatorVersions:Object.freeze(evaluatorVersions),
    repeatability:Object.freeze(summarizeRepeatability(dataset.samples)),
    humanAgreement:summarizeHumanAgreement(dataset.samples),
    conditions:Object.freeze(summarizeConditions(dataset.samples)),
    cohorts:Object.freeze(summarizeCohorts(dataset.samples)),
    limitations:Object.freeze([
      'Descriptive QA only; no pass/fail threshold is established.',
      'Missing provider dimensions remain null and are not inferred from other scores.',
      'Accent/cohort comparisons require repeated controlled samples and human review.',
      'No raw audio, transcript, reference text or direct identity data belongs in this report.',
    ]),
  });
}
