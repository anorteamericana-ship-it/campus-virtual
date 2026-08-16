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

const provider = new AzurePronunciationProvider({ env, fetchImpl:fakeFetch });

const oggAudio = new Blob([
  new Uint8Array([0x4f,0x67,0x67,0x53,0x00,0x02,0x03,0x04]),
], { type:'audio/ogg' });

const oggResult = await provider.evaluate({
  audio:oggAudio,
  referenceText:"What's your name?",
  language:'en-US',
  rubricVersion:'speaklab-pronunciation-v0',
});

assert.equal(calls.length, 1);
const oggRequest = calls[0];
const oggUrl = new URL(oggRequest.url);
assert.equal(oggUrl.protocol, 'https:');
assert.equal(oggUrl.hostname, 'speak-lab-speech-qa.cognitiveservices.azure.com');
assert.equal(oggUrl.pathname, '/stt/speech/recognition/conversation/cognitiveservices/v1');
assert.equal(oggUrl.searchParams.get('language'), 'en-US');
assert.equal(oggUrl.searchParams.get('format'), 'detailed');
assert.equal(oggRequest.init.method, 'POST');
assert.equal(oggRequest.init.headers['Content-Type'], 'audio/ogg; codecs=opus');
assert.equal(oggRequest.init.headers.Accept, 'application/json');
assert.equal(oggRequest.init.headers['Ocp-Apim-Subscription-Key'], 'qa-placeholder-key-not-secret');
assert.equal(oggRequest.init.body, oggAudio);

const assessmentHeader = oggRequest.init.headers['Pronunciation-Assessment'];
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

assert.equal(oggResult.dimensions.segmentalAccuracy, 84.5);
assert.equal(oggResult.dimensions.fluency, 78);
assert.equal(oggResult.dimensions.intelligibility, null);
assert.equal(oggResult.dimensions.wordStress, null);
assert.equal(oggResult.dimensions.rhythm, null);
assert.equal(oggResult.dimensions.intonation, null);
assert.equal(oggResult.calibrated, false);
assert.equal(oggResult.official, false);
assert.equal(oggResult.confidence, null);
assert.equal(oggResult.evaluatorVersion, 'azure-pronunciation-rest-v0.3-wav-ogg-unvalidated');
assert.equal(oggResult.issues.length, 1);
assert.equal(oggResult.issues[0].code, 'AZURE_MISPRONUNCIATION');
assert.equal(oggResult.issues[0].target, 'name');
assert.equal(oggResult.issues[0].severity, 'practice');
assert.match(oggResult.issues[0].message, /name/);
assert.equal(Object.prototype.hasOwnProperty.call(oggResult, 'officialGrade'), false);
assert.equal(Object.prototype.hasOwnProperty.call(oggResult, 'finalGrade'), false);

// PC9/piloto Campus: WAV PCM 16 kHz mono es la forma canónica del navegador.
const wavAudio = new Blob([
  new Uint8Array([
    0x52,0x49,0x46,0x46, 0x24,0x00,0x00,0x00, 0x57,0x41,0x56,0x45,
    0x66,0x6d,0x74,0x20, 0x10,0x00,0x00,0x00, 0x01,0x00,0x01,0x00,
    0x80,0x3e,0x00,0x00, 0x00,0x7d,0x00,0x00, 0x02,0x00,0x10,0x00,
    0x64,0x61,0x74,0x61, 0x00,0x00,0x00,0x00,
  ]),
], { type:'audio/wav' });

const wavResult = await provider.evaluate({
  audio:wavAudio,
  referenceText:"What's your name?",
  language:'en-US',
  rubricVersion:'speaklab-pronunciation-v0',
});
assert.equal(calls.length, 2);
const wavRequest = calls[1];
assert.equal(wavRequest.init.body, wavAudio);
assert.equal(wavRequest.init.headers['Content-Type'], 'audio/wav; codecs=audio/pcm; samplerate=16000');
assert.equal(wavResult.evaluatorVersion, 'azure-pronunciation-rest-v0.3-wav-ogg-unvalidated');
assert.equal(wavResult.official, false);
assert.equal(wavResult.calibrated, false);

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
    audio:oggAudio,
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
assert.deepEqual(AZURE_PRONUNCIATION_PROVIDER_DEFAULTS.supportedInput, [
  'audio/ogg; codecs=opus',
  'audio/wav; codecs=audio/pcm; samplerate=16000',
]);

console.log(JSON.stringify({
  ok:true,
  phase:'speak-lab-phase3-pronunciation-offline',
  provider:'azure-pronunciation-rest',
  response_shape:'verified-against-real-qa-2026-08-15',
  endpoint_mode:'resource-cognitiveservices',
  supported_input:['ogg-opus','wav-pcm-16khz-mono'],
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
