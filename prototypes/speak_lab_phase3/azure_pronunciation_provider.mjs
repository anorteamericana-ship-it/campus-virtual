import {
  SpeakLabContractError,
  validatePronunciationRequest,
  validatePronunciationResult,
} from '../speak_lab_phase1/contracts.js';

const DEFAULT_EVALUATOR_VERSION = 'azure-pronunciation-rest-v0.2-live-shape-unvalidated';
const DEFAULT_TIMEOUT_MS = 30_000;
const AZURE_REGION_PATTERN = /^[a-z0-9-]{2,40}$/;

function clean(value) {
  return String(value ?? '').trim();
}

function invariant(condition, code, message, details = null) {
  if (!condition) throw new SpeakLabContractError(code, message, details);
}

function assertServerOnly() {
  invariant(
    typeof window === 'undefined' && typeof document === 'undefined',
    'SERVER_ONLY_PROVIDER',
    'AzurePronunciationProvider solo puede ejecutarse en servidor.',
  );
}

function normalizeRegion(value) {
  const region = clean(value).toLowerCase();
  invariant(region, 'AZURE_SPEECH_REGION_REQUIRED', 'AZURE_SPEECH_REGION es obligatorio en servidor.');
  invariant(AZURE_REGION_PATTERN.test(region), 'INVALID_AZURE_SPEECH_REGION', 'AZURE_SPEECH_REGION inválida.');
  return region;
}

function normalizeEndpoint(value) {
  const raw = clean(value);
  invariant(raw, 'AZURE_SPEECH_ENDPOINT_REQUIRED', 'AZURE_SPEECH_ENDPOINT es obligatorio en servidor.');

  let url;
  try { url = new URL(raw); }
  catch (_) { throw new SpeakLabContractError('INVALID_AZURE_SPEECH_ENDPOINT', 'AZURE_SPEECH_ENDPOINT inválido.'); }

  invariant(url.protocol === 'https:', 'INVALID_AZURE_SPEECH_ENDPOINT', 'AZURE_SPEECH_ENDPOINT debe usar HTTPS.');
  invariant(
    url.hostname.endsWith('.cognitiveservices.azure.com'),
    'INVALID_AZURE_SPEECH_ENDPOINT',
    'AZURE_SPEECH_ENDPOINT debe pertenecer a cognitiveservices.azure.com.',
  );
  invariant(
    url.pathname === '/' || url.pathname === '',
    'INVALID_AZURE_SPEECH_ENDPOINT',
    'AZURE_SPEECH_ENDPOINT debe ser la raíz del recurso Azure.',
  );
  invariant(!url.username && !url.password && !url.search && !url.hash, 'INVALID_AZURE_SPEECH_ENDPOINT', 'AZURE_SPEECH_ENDPOINT no puede contener credenciales, query ni hash.');

  return url.origin;
}

function normalizeAudioContentType(blob) {
  const type = clean(blob?.type).toLowerCase();
  if (type === 'audio/ogg' || type === 'audio/ogg; codecs=opus' || type === 'audio/ogg;codecs=opus') {
    return 'audio/ogg; codecs=opus';
  }
  throw new SpeakLabContractError(
    'AZURE_PRONUNCIATION_AUDIO_TYPE_UNSUPPORTED',
    `El adaptador QA inicial de pronunciación requiere OGG/Opus; recibido: ${type || 'sin MIME'}.`,
  );
}

function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function finiteScore(value) {
  const score = Number(value);
  return Number.isFinite(score) && score >= 0 && score <= 100 ? score : null;
}

function requestIdFrom(response) {
  return clean(
    response?.headers?.get?.('x-requestid') ||
    response?.headers?.get?.('x-request-id') ||
    response?.headers?.get?.('x-ms-request-id'),
  );
}

function providerHttpError(response) {
  return new SpeakLabContractError(
    'AZURE_PRONUNCIATION_HTTP_ERROR',
    `Azure Pronunciation respondió HTTP ${response.status}.`,
    {
      status:response.status,
      requestId:requestIdFrom(response),
    },
  );
}

function issueSeverity(errorType) {
  if (errorType === 'Omission') return 'important';
  return 'practice';
}

function issueMessage(errorType, target) {
  if (errorType === 'Mispronunciation') return `Revisar la pronunciación de “${target}”.`;
  if (errorType === 'Omission') return `La palabra “${target}” parece haberse omitido.`;
  if (errorType === 'Insertion') return `Se detectó una inserción cerca de “${target}”.`;
  if (errorType === 'UnexpectedBreak') return `Se detectó una pausa inesperada antes o cerca de “${target}”.`;
  if (errorType === 'MissingBreak') return `Puede faltar una pausa natural cerca de “${target}”.`;
  if (errorType === 'Monotone') return 'Se detectó una señal de entonación monótona en el enunciado.';
  return '';
}

function wordErrorType(word) {
  return clean(word?.ErrorType || word?.PronunciationAssessment?.ErrorType);
}

function issuesFromAzure(best) {
  const issues = [];
  for (const word of Array.isArray(best?.Words) ? best.Words : []) {
    const errorType = wordErrorType(word);
    if (!errorType || errorType === 'None') continue;
    const target = clean(word?.Word || word?.DisplayText || 'segmento');
    const message = issueMessage(errorType, target);
    if (!message) continue;
    issues.push({
      code:`AZURE_${errorType.replace(/[^A-Za-z0-9]+/g, '_').toUpperCase()}`,
      target,
      message,
      severity:issueSeverity(errorType),
      start:null,
      end:null,
    });
    if (issues.length >= 12) break;
  }
  return issues;
}

function mapAzureResult(data) {
  invariant(
    clean(data?.RecognitionStatus).toLowerCase() === 'success',
    'AZURE_PRONUNCIATION_RECOGNITION_FAILED',
    'Azure Pronunciation no devolvió RecognitionStatus=Success.',
  );

  const best = Array.isArray(data?.NBest) ? data.NBest[0] : null;
  invariant(best && typeof best === 'object', 'AZURE_PRONUNCIATION_NBEST_MISSING', 'Azure Pronunciation no devolvió NBest[0].');

  // Forma REST verificada en QA real 2026-08-15:
  // AccuracyScore / FluencyScore / CompletenessScore / ProsodyScore / PronScore viven en NBest[0].
  // Words[].AccuracyScore / ErrorType / Phonemes[] también son campos directos.
  // El contrato SPEAK LAB V0 solo mapea señales suficientemente directas.
  // ProsodyScore combina estrés, entonación, velocidad y ritmo; NO se reparte artificialmente.
  return validatePronunciationResult({
    dimensions:{
      intelligibility:null,
      segmentalAccuracy:finiteScore(best.AccuracyScore),
      wordStress:null,
      rhythm:null,
      fluency:finiteScore(best.FluencyScore),
      intonation:null,
    },
    issues:issuesFromAzure(best),
    evaluatorVersion:DEFAULT_EVALUATOR_VERSION,
    confidence:null,
    calibrated:false,
  });
}

export class AzurePronunciationProvider {
  constructor({
    env = typeof process !== 'undefined' ? process.env : {},
    fetchImpl = globalThis.fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = {}) {
    assertServerOnly();
    invariant(typeof fetchImpl === 'function', 'FETCH_REQUIRED', 'AzurePronunciationProvider requiere fetch server-side.');

    const apiKey = clean(env?.AZURE_SPEECH_KEY);
    invariant(apiKey, 'AZURE_SPEECH_KEY_REQUIRED', 'AZURE_SPEECH_KEY debe existir únicamente en el entorno servidor.');

    this.apiKey = apiKey;
    this.region = normalizeRegion(env?.AZURE_SPEECH_REGION);
    this.endpoint = normalizeEndpoint(env?.AZURE_SPEECH_ENDPOINT);
    this.fetchImpl = fetchImpl;
    this.timeoutMs = Math.min(Math.max(Number(timeoutMs) || DEFAULT_TIMEOUT_MS, 1_000), 120_000);
  }

  async evaluate(input) {
    const request = validatePronunciationRequest(input);
    const contentType = normalizeAudioContentType(request.audio);
    const locale = request.language;

    const assessmentConfig = {
      ReferenceText:request.referenceText,
      GradingSystem:'HundredMark',
      Granularity:'Phoneme',
      Dimension:'Comprehensive',
      EnableMiscue:true,
      EnableProsodyAssessment:'True',
    };

    const url = new URL('/stt/speech/recognition/conversation/cognitiveservices/v1', `${this.endpoint}/`);
    url.searchParams.set('language', locale);
    url.searchParams.set('format', 'detailed');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response;
    try {
      response = await this.fetchImpl(url.toString(), {
        method:'POST',
        headers:{
          'Ocp-Apim-Subscription-Key':this.apiKey,
          'Pronunciation-Assessment':utf8ToBase64(JSON.stringify(assessmentConfig)),
          'Content-Type':contentType,
          'Accept':'application/json',
        },
        body:request.audio,
        signal:controller.signal,
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new SpeakLabContractError('AZURE_PRONUNCIATION_TIMEOUT', 'Azure Pronunciation excedió el timeout configurado.');
      }
      throw new SpeakLabContractError('AZURE_PRONUNCIATION_NETWORK_ERROR', 'Fallo de red en Azure Pronunciation.');
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) throw providerHttpError(response);

    let data;
    try { data = await response.json(); }
    catch (_) {
      throw new SpeakLabContractError('AZURE_PRONUNCIATION_INVALID_JSON', 'Azure Pronunciation devolvió JSON inválido.');
    }

    return mapAzureResult(data);
  }
}

export const AZURE_PRONUNCIATION_PROVIDER_DEFAULTS = Object.freeze({
  evaluatorVersion:DEFAULT_EVALUATOR_VERSION,
  supportedInput:'audio/ogg; codecs=opus',
  granularity:'Phoneme',
  dimension:'Comprehensive',
  calibrated:false,
  official:false,
});
