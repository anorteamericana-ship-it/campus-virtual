import {
  SpeakLabContractError,
  validateTtsRequest,
  validateTtsResult,
  validateSttRequest,
  validateSttResult,
} from '../speak_lab_phase1/contracts.js';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const ALLOWED_TTS_FORMATS = new Set(['mp3','opus','aac','flac','wav','pcm']);
const MIME_BY_TTS_FORMAT = Object.freeze({
  mp3:'audio/mpeg', opus:'audio/ogg', aac:'audio/aac', flac:'audio/flac', wav:'audio/wav', pcm:'audio/pcm',
});

function clean(value) {
  return String(value ?? '').trim();
}

function invariant(condition, code, message, details = null) {
  if (!condition) throw new SpeakLabContractError(code, message, details);
}

function assertServerOnly() {
  invariant(typeof window === 'undefined' && typeof document === 'undefined', 'SERVER_ONLY_PROVIDER', 'OpenAIAudioProvider solo puede ejecutarse en servidor.');
}

function normalizeBaseUrl(value) {
  let url;
  try { url = new URL(clean(value || DEFAULT_BASE_URL)); }
  catch (_) { throw new SpeakLabContractError('INVALID_OPENAI_BASE_URL', 'OpenAI base URL inválida.'); }
  invariant(url.protocol === 'https:', 'INVALID_OPENAI_BASE_URL', 'OpenAI base URL debe usar HTTPS.');
  invariant(url.hostname === 'api.openai.com' || url.hostname.endsWith('.api.openai.com'), 'INVALID_OPENAI_BASE_URL', 'OpenAI base URL debe pertenecer a api.openai.com.');
  return `${url.origin}${url.pathname.replace(/\/$/, '')}`;
}

function safeProviderError(status, requestId, detail = '') {
  const safeDetail = clean(detail).slice(0, 240).replace(/sk-[A-Za-z0-9_-]+/g, '[REDACTED]');
  return new SpeakLabContractError(
    'OPENAI_AUDIO_HTTP_ERROR',
    `OpenAI Audio respondió HTTP ${status}${safeDetail ? `: ${safeDetail}` : ''}.`,
    { status, requestId:clean(requestId) },
  );
}

async function readErrorDetail(response) {
  try {
    const data = await response.clone().json();
    return clean(data?.error?.message || data?.error || data?.message);
  } catch (_) {
    try { return clean(await response.clone().text()); } catch (_) { return ''; }
  }
}

function filenameForMime(mimeType) {
  const type = clean(mimeType).toLowerCase();
  if (type.includes('webm')) return 'speech.webm';
  if (type.includes('mp4')) return 'speech.mp4';
  if (type.includes('mpeg')) return 'speech.mp3';
  if (type.includes('ogg')) return 'speech.ogg';
  if (type.includes('wav')) return 'speech.wav';
  return 'speech.audio';
}

export class OpenAIAudioProvider {
  constructor({
    env = typeof process !== 'undefined' ? process.env : {},
    fetchImpl = globalThis.fetch,
    baseUrl = DEFAULT_BASE_URL,
    timeoutMs = 30_000,
  } = {}) {
    assertServerOnly();
    invariant(typeof fetchImpl === 'function', 'FETCH_REQUIRED', 'OpenAIAudioProvider requiere fetch server-side.');

    const apiKey = clean(env?.OPENAI_API_KEY);
    invariant(apiKey, 'OPENAI_API_KEY_REQUIRED', 'OPENAI_API_KEY debe existir únicamente en el entorno servidor.');

    this.apiKey = apiKey;
    this.fetchImpl = fetchImpl;
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.timeoutMs = Math.min(Math.max(Number(timeoutMs) || 30_000, 1_000), 120_000);
    this.ttsModel = clean(env?.SPEAK_LAB_TTS_MODEL || 'gpt-4o-mini-tts');
    this.ttsVoice = clean(env?.SPEAK_LAB_TTS_VOICE || 'marin');
    this.ttsFormat = clean(env?.SPEAK_LAB_TTS_FORMAT || 'mp3').toLowerCase();
    this.sttModel = clean(env?.SPEAK_LAB_STT_MODEL || 'gpt-4o-mini-transcribe');

    invariant(this.ttsModel, 'TTS_MODEL_REQUIRED', 'SPEAK_LAB_TTS_MODEL no puede quedar vacío.');
    invariant(this.ttsVoice, 'TTS_VOICE_REQUIRED', 'SPEAK_LAB_TTS_VOICE no puede quedar vacía.');
    invariant(ALLOWED_TTS_FORMATS.has(this.ttsFormat), 'INVALID_TTS_FORMAT', `Formato TTS no permitido: ${this.ttsFormat}`);
    invariant(this.sttModel, 'STT_MODEL_REQUIRED', 'SPEAK_LAB_STT_MODEL no puede quedar vacío.');
  }

  async request(path, init) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        headers:{
          Authorization:`Bearer ${this.apiKey}`,
          ...(init?.headers || {}),
        },
        signal:controller.signal,
      });
      return response;
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new SpeakLabContractError('OPENAI_AUDIO_TIMEOUT', 'OpenAI Audio excedió el timeout configurado.');
      }
      throw new SpeakLabContractError('OPENAI_AUDIO_NETWORK_ERROR', `Fallo de red en OpenAI Audio: ${clean(error?.message || error)}`);
    } finally {
      clearTimeout(timer);
    }
  }

  async synthesize(input) {
    const request = validateTtsRequest(input);
    const body = {
      model:this.ttsModel,
      input:request.text,
      voice:this.ttsVoice,
      response_format:this.ttsFormat,
      speed:request.speakingRate,
    };
    if (request.style) body.instructions = request.style;

    const response = await this.request('/audio/speech', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify(body),
    });
    const requestId = response.headers.get('x-request-id') || '';
    if (!response.ok) throw safeProviderError(response.status, requestId, await readErrorDetail(response));

    const audio = await response.blob();
    invariant(audio.size > 0, 'OPENAI_TTS_EMPTY_AUDIO', 'OpenAI TTS devolvió audio vacío.');
    const mimeType = clean(response.headers.get('content-type')) || MIME_BY_TTS_FORMAT[this.ttsFormat];

    return validateTtsResult({
      audio,
      mimeType,
      syntheticVoice:true,
      provider:{ provider:'openai', model:this.ttsModel, requestId },
      cacheKey:'',
    });
  }

  async transcribe(input) {
    const request = validateSttRequest(input);
    invariant(request.timestamps !== 'word', 'STT_WORD_TIMESTAMPS_NOT_IMPLEMENTED', 'El adaptador inicial no habilita word timestamps; no debe degradarlos silenciosamente.');

    const form = new FormData();
    form.append('file', request.audio, filenameForMime(request.audio.type));
    form.append('model', this.sttModel);
    form.append('language', request.language.split('-')[0]);

    // Deliberado: NO enviamos `prompt` ni reconstruimos vocabularyHints como prompt.
    // El primer STT real debe permanecer ciego respecto a la frase objetivo.
    const response = await this.request('/audio/transcriptions', {
      method:'POST',
      body:form,
    });
    const requestId = response.headers.get('x-request-id') || '';
    if (!response.ok) throw safeProviderError(response.status, requestId, await readErrorDetail(response));

    let data;
    try { data = await response.json(); }
    catch (_) { throw new SpeakLabContractError('OPENAI_STT_INVALID_JSON', 'OpenAI STT devolvió una respuesta JSON inválida.'); }

    return validateSttResult({
      text:data?.text || '',
      language:request.language,
      words:[],
      noSpeechDetected:!clean(data?.text),
      provider:{ provider:'openai', model:this.sttModel, requestId },
    });
  }
}

export const OPENAI_AUDIO_PROVIDER_DEFAULTS = Object.freeze({
  baseUrl:DEFAULT_BASE_URL,
  ttsModel:'gpt-4o-mini-tts',
  ttsVoice:'marin',
  ttsFormat:'mp3',
  sttModel:'gpt-4o-mini-transcribe',
});
