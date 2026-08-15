import {
  validateTtsRequest,
  validateTtsResult,
  validateSttRequest,
  validateSttResult,
  SpeakLabContractError,
} from './contracts.js';
import {
  VOICE_GATEWAY_SCOPES,
  assertNoProviderSecrets,
  validateGatewayTtsEnvelope,
  validateGatewaySttMetadata,
} from './gateway_protocol.js';

function clean(value) {
  return String(value ?? '').trim();
}

function normalizeBaseUrl(value, { testMode = false } = {}) {
  const raw = clean(value || '/voice');
  if (raw.startsWith('/')) return raw.replace(/\/$/, '');

  let url;
  try { url = new URL(raw); }
  catch (_) { throw new SpeakLabContractError('INVALID_GATEWAY_URL', 'Voice Gateway URL inválida.'); }

  if (testMode && ['127.0.0.1','localhost'].includes(url.hostname)) return raw.replace(/\/$/, '');
  if (url.protocol !== 'https:') throw new SpeakLabContractError('INSECURE_GATEWAY_URL', 'Voice Gateway remoto debe usar HTTPS.');
  if (/openai\.com$/i.test(url.hostname) || /api\.openai\.com$/i.test(url.hostname)) {
    throw new SpeakLabContractError('DIRECT_PROVIDER_FORBIDDEN', 'El navegador no puede usar el endpoint del proveedor como Voice Gateway.');
  }
  return raw.replace(/\/$/, '');
}

async function responseError(response) {
  let detail = '';
  try {
    const data = await response.clone().json();
    detail = clean(data?.error || data?.message || data?.code);
  } catch (_) {
    try { detail = clean(await response.clone().text()); } catch (_) {}
  }
  return new SpeakLabContractError(
    'VOICE_GATEWAY_HTTP_ERROR',
    `Voice Gateway respondió HTTP ${response.status}${detail ? `: ${detail}` : ''}.`,
    { status:response.status, detail },
  );
}

export class VoiceGatewayClient {
  constructor({ baseUrl = '/voice', getVoiceGrant, fetchImpl = globalThis.fetch, testMode = false } = {}) {
    if (typeof fetchImpl !== 'function') throw new SpeakLabContractError('FETCH_REQUIRED', 'VoiceGatewayClient requiere fetch.');
    if (typeof getVoiceGrant !== 'function') throw new SpeakLabContractError('VOICE_GRANT_PROVIDER_REQUIRED', 'VoiceGatewayClient requiere getVoiceGrant().');
    this.baseUrl = normalizeBaseUrl(baseUrl, { testMode });
    this.getVoiceGrant = getVoiceGrant;
    this.fetchImpl = fetchImpl;
  }

  async grant(scope) {
    const token = clean(await this.getVoiceGrant(scope));
    if (!token) throw new SpeakLabContractError('VOICE_GRANT_EMPTY', `No se obtuvo Voice Grant para ${scope}.`);
    if (/sk-[A-Za-z0-9_-]{12,}/.test(token)) throw new SpeakLabContractError('PROVIDER_SECRET_FORBIDDEN', 'Voice Grant no puede ser una API key del proveedor.');
    return token;
  }

  async synthesize(input) {
    const request = validateTtsRequest(input);
    const payload = validateGatewayTtsEnvelope(request);
    assertNoProviderSecrets(payload);
    const grant = await this.grant(VOICE_GATEWAY_SCOPES.TTS_READ);

    const response = await this.fetchImpl(`${this.baseUrl}/v1/tts`, {
      method:'POST',
      headers:{
        'Authorization':`Bearer ${grant}`,
        'Content-Type':'application/json',
        'X-SpeakLab-Protocol':'1',
      },
      body:JSON.stringify(payload),
    });
    if (!response.ok) throw await responseError(response);

    const audio = await response.blob();
    const validated = validateTtsResult({
      audio,
      mimeType:response.headers.get('content-type') || audio.type || 'audio/wav',
      syntheticVoice:true,
      provider:{
        provider:response.headers.get('x-speaklab-provider') || 'gateway',
        model:response.headers.get('x-speaklab-model') || 'unknown',
        requestId:response.headers.get('x-request-id') || '',
      },
      cacheKey:response.headers.get('x-speaklab-cache-key') || '',
    });
    if (response.headers.get('x-speaklab-mock') === 'true') {
      return Object.freeze({ ...validated, mock:true });
    }
    return validated;
  }

  async transcribe(input, { durationMs } = {}) {
    const request = validateSttRequest(input);
    const metadata = validateGatewaySttMetadata({
      byteLength:request.audio.size,
      durationMs,
      mimeType:request.audio.type,
      language:request.language,
      vocabularyHints:request.vocabularyHints,
    });
    assertNoProviderSecrets(metadata);
    const grant = await this.grant(VOICE_GATEWAY_SCOPES.STT_WRITE);

    const hintsHeader = encodeURIComponent(JSON.stringify(metadata.vocabularyHints));
    const response = await this.fetchImpl(`${this.baseUrl}/v1/stt`, {
      method:'POST',
      headers:{
        'Authorization':`Bearer ${grant}`,
        'Content-Type':metadata.mimeType,
        'X-SpeakLab-Protocol':'1',
        'X-SpeakLab-Language':metadata.language,
        'X-SpeakLab-Duration-Ms':String(metadata.durationMs),
        'X-SpeakLab-Vocabulary-Hints':hintsHeader,
      },
      body:request.audio,
    });
    if (!response.ok) throw await responseError(response);

    const data = await response.json();
    if (data?.mock === true) {
      return Object.freeze({
        ...validateSttResult({
          text:data.text || '',
          language:data.language || request.language,
          words:Array.isArray(data.words) ? data.words : [],
          noSpeechDetected:data.noSpeechDetected === true,
          provider:{
            provider:data.provider || 'mock-gateway',
            model:data.model || 'mock-stt',
            requestId:data.requestId || '',
          },
        }),
        mock:true,
      });
    }

    return validateSttResult({
      ...data,
      provider:data.provider || {
        provider:response.headers.get('x-speaklab-provider') || 'gateway',
        model:response.headers.get('x-speaklab-model') || 'unknown',
        requestId:response.headers.get('x-request-id') || '',
      },
    });
  }
}

export const VOICE_GATEWAY_CLIENT = Object.freeze({
  version:'1.0.0',
  defaultBaseUrl:'/voice',
});
