import assert from 'node:assert/strict';
import {
  AzurePronunciationProvider,
  AZURE_PRONUNCIATION_PROVIDER_DEFAULTS,
} from '../prototypes/speak_lab_phase3/azure_pronunciation_provider.mjs';

const calls = [];

// Fake basado en la forma REST observada en QA real 2026-08-15.
const fakeAzureResponse = {
  RecognitionStatus:'Success',
  Offset:0,
  Duration:28200000,
  DisplayText:"What's your name?",
  NBest:[{
    Confidence:0.92,
    Lexical:"what's your name",
    Display:"What's your name?",
    AccuracyScore:84.5,
    FluencyScore:78,
    CompletenessScore:100,
    PronScore:82,
    ProsodyScore:73,
    Words:[
      {
        Word:"what's",
        AccuracyScore:91,
        ErrorType:'None',
        Phonemes:[
          { Phoneme:'w', AccuracyScore:90 },
          { Phoneme:'ao', AccuracyScore:93 },
        ],
      },
      {
        Word:'your',
        AccuracyScore:88,
        ErrorType:'None',
        Phonemes:[
          { Phoneme:'y', AccuracyScore:89 },
        ],
      },
      {
        Word:'name',
        AccuracyScore:58,
        ErrorType:'Mispronunciation',
        Phonemes:[
          { Phoneme:'n', AccuracyScore:61 },
          { Phoneme:'ey', AccuracyScore:54 },
          { Phoneme:'m', AccuracyScore:59 },
        ],
      },
    ],
  }],
};

const fakeFetch = async (url, init) => {
  calls.push({ url, init });
  return new Response(JSON.stringify(fakeAzureResponse), {
    status:200,
    headers:{
      'content-type':'application/json',
      'x-requestid':'azure_fake_request_1',
    },
  });
};

const env = {
  AZURE_SPEECH_KEY:'qa-placeholder-key-not-secret',
  AZURE_SPEECH_REGION:'eastus',
  AZURE_SPEECH_ENDPOINT:'https://speak-lab-speech-qa.cognitiveservices.azure.com',
};

const provider = new AzurePronunciationProvider({
  env,
  fetchImpl:fakeFetch,
});

const audio = new Blob([
  new Uint8Array([0x4f,0x67,0x67,0x53,0x00,0x02,0x03,0x04]),
], { type:'audio/ogg' });

const result = await provider.evaluate({
  audio,
  referenceText:"What's your name?",
  language:'en-US',
  rubricVersion:'speaklab-pronunciation-v0',
});

assert.equal(calls.length, 1);
const request = calls[0];
const url = new URL(request.url);
assert.equal(url.protocol, 'https:');
assert.equal(url.hostname, 'speak-lab-speech-qa.cognitiveservices.azure.com');
assert.equal(url.pathname, '/stt/speech/recognition/conversation/cognitiveservices/v1');
assert.equal(url.searchParams.get('language'), 'en-US');
assert.equal(url.searchParams.get('format'), 'detailed');
assert.equal(request.init.method, 'POST');
assert.equal(request.init.headers['Content-Type'], 'audio/ogg; codecs=opus');
assert.equal(request.init.headers.Accept, 'application/json');
assert.equal(request.init.headers['Ocp-Apim-Subscription-Key'], 'qa-placeholder-key-not-secret');
assert.equal(request.init.body, audio);

const assessmentHeader = request.init.headers['Pronunciation-Assessment'];
assert.ok(assessmentHeader);
const assessmentConfig = JSON.parse(Buffer.from(assessmentHeader, 'base64').toString('utf8'));
assert.deepEqual(assessmentConfig, {
  ReferenceText:"What's your name?",
  GradingSystem:'HundredMark',
  Granularity:'Phoneme',
  Dimension:'Comprehensive',
  EnableMiscue:true,
  EnableProsodyAssessment:'True',
});

assert.equal(result.dimensions.segmentalAccuracy, 84.5);
assert.equal(result.dimensions.fluency, 78);
assert.equal(result.dimensions.intelligibility, null);
assert.equal(result.dimensions.wordStress, null);
assert.equal(result.dimensions.rhythm, null);
assert.equal(result.dimensions.intonation, null);
assert.equal(result.calibrated, false);
assert.equal(result.official, false);
assert.equal(result.confidence, null);
assert.equal(result.evaluatorVersion, 'azure-pronunciation-rest-v0.2-live-shape-unvalidated');
assert.equal(result.issues.length, 1);
assert.equal(result.issues[0].code, 'AZURE_MISPRONUNCIATION');
assert.equal(result.issues[0].target, 'name');
assert.equal(result.issues[0].severity, 'practice');
assert.match(result.issues[0].message, /name/);
assert.equal(Object.prototype.hasOwnProperty.call(result, 'officialGrade'), false);
assert.equal(Object.prototype.hasOwnProperty.call(result, 'finalGrade'), false);

assert.throws(
  () => new AzurePronunciationProvider({
    env:{
      AZURE_SPEECH_REGION:'eastus',
      AZURE_SPEECH_ENDPOINT:'https://speak-lab-speech-qa.cognitiveservices.azure.com',
    },
    fetchImpl:fakeFetch,
  }),
  error => error?.code === 'AZURE_SPEECH_KEY_REQUIRED',
);

assert.throws(
  () => new AzurePronunciationProvider({
    env:{
      AZURE_SPEECH_KEY:'qa-placeholder-key-not-secret',
      AZURE_SPEECH_REGION:'eastus.evil.example',
      AZURE_SPEECH_ENDPOINT:'https://speak-lab-speech-qa.cognitiveservices.azure.com',
    },
    fetchImpl:fakeFetch,
  }),
  error => error?.code === 'INVALID_AZURE_SPEECH_REGION',
);

assert.throws(
  () => new AzurePronunciationProvider({
    env:{
      AZURE_SPEECH_KEY:'qa-placeholder-key-not-secret',
      AZURE_SPEECH_REGION:'eastus',
      AZURE_SPEECH_ENDPOINT:'https://evil.example.com',
    },
    fetchImpl:fakeFetch,
  }),
  error => error?.code === 'INVALID_AZURE_SPEECH_ENDPOINT',
);

assert.throws(
  () => new AzurePronunciationProvider({
    env:{
      AZURE_SPEECH_KEY:'qa-placeholder-key-not-secret',
      AZURE_SPEECH_REGION:'eastus',
    },
    fetchImpl:fakeFetch,
  }),
  error => error?.code === 'AZURE_SPEECH_ENDPOINT_REQUIRED',
);

await assert.rejects(
  provider.evaluate({
    audio:new Blob([new Uint8Array([1,2,3])], { type:'audio/webm' }),
    referenceText:"What's your name?",
    language:'en-US',
  }),
  error => error?.code === 'AZURE_PRONUNCIATION_AUDIO_TYPE_UNSUPPORTED',
);

const secretMarker = 'QA_SECRET_MUST_NOT_LEAK_123';
const failingProvider = new AzurePronunciationProvider({
  env:{
    AZURE_SPEECH_KEY:secretMarker,
    AZURE_SPEECH_REGION:'eastus',
    AZURE_SPEECH_ENDPOINT:'https://speak-lab-speech-qa.cognitiveservices.azure.com',
  },
  fetchImpl:async () => new Response(
    JSON.stringify({ error:{ message:`invalid key ${secretMarker}` } }),
    {
      status:401,
      headers:{ 'x-requestid':'azure_fake_error_1' },
    },
  ),
});

await assert.rejects(
  failingProvider.evaluate({
    audio,
    referenceText:"What's your name?",
    language:'en-US',
  }),
  error => {
    assert.equal(error?.code, 'AZURE_PRONUNCIATION_HTTP_ERROR');
    assert.equal(error?.details?.status, 401);
    assert.equal(error?.details?.requestId, 'azure_fake_error_1');
    assert.doesNotMatch(String(error?.message || ''), new RegExp(secretMarker));
    assert.doesNotMatch(JSON.stringify(error?.details || {}), new RegExp(secretMarker));
    return true;
  },
);

assert.equal(AZURE_PRONUNCIATION_PROVIDER_DEFAULTS.calibrated, false);
assert.equal(AZURE_PRONUNCIATION_PROVIDER_DEFAULTS.official, false);
assert.equal(AZURE_PRONUNCIATION_PROVIDER_DEFAULTS.supportedInput, 'audio/ogg; codecs=opus');

console.log(JSON.stringify({
  ok:true,
  phase:'speak-lab-phase3-pronunciation-offline',
  provider:'azure-pronunciation-rest',
  response_shape:'verified-against-real-qa-2026-08-15',
  endpoint_mode:'resource-cognitiveservices',
  mapped_dimensions:['segmentalAccuracy','fluency'],
  intentionally_null_dimensions:['intelligibility','wordStress','rhythm','intonation'],
  target_reference_used_only_by_pronunciation_evaluator:true,
  transcript_equality_used_for_score:false,
  calibrated:false,
  official:false,
  fake_network_calls:calls.length,
  network_calls_real:0,
  secrets_real:0,
}, null, 2));
