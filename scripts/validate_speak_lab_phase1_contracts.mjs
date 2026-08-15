import fs from 'node:fs';
import path from 'node:path';
import {
  SPEAK_LAB_CONTRACT_VERSION,
  SPEAK_LAB_CONTRACTS,
  SpeakLabContractError,
  validateTtsRequest,
  validateTtsResult,
  validateSttRequest,
  validateSttResult,
  validatePronunciationRequest,
  validatePronunciationResult,
} from '../prototypes/speak_lab_phase1/contracts.js';

const root = process.cwd();
const contractsPath = path.join(root, 'prototypes', 'speak_lab_phase1', 'contracts.js');
const docPath = path.join(root, '00_DOCUMENTACION', 'SPEAK_LAB_PHASE1_PROVIDER_CONTRACTS_2026-08-14.md');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectContractError(fn, code) {
  let error = null;
  try { fn(); } catch (caught) { error = caught; }
  assert(error instanceof SpeakLabContractError, `Se esperaba SpeakLabContractError ${code}`);
  assert(error.code === code, `Código esperado ${code}, recibido ${error.code}`);
  return error;
}

assert(SPEAK_LAB_CONTRACT_VERSION === '1.0.0', 'Versión de contrato inesperada');
assert(SPEAK_LAB_CONTRACTS.sttForbiddenTargetKeys.includes('expectedText'), 'expectedText debe estar bloqueado en STT');
assert(SPEAK_LAB_CONTRACTS.sttForbiddenTargetKeys.includes('referenceText'), 'referenceText debe estar bloqueado en STT');

const learnerAudio = new Blob(['fake-audio-bytes'], { type:'audio/webm' });
const referenceAudio = new Blob(['fake-reference-audio'], { type:'audio/mpeg' });

const ttsRequest = validateTtsRequest({
  text:"What's your name?",
  language:'en-US',
  voiceProfile:'clear-us-model',
  speakingRate:0.9,
  style:'clear and natural',
  cachePolicy:'cache-static',
});
assert(ttsRequest.text === "What's your name?", 'TTS perdió el texto');
assert(ttsRequest.cachePolicy === 'cache-static', 'TTS perdió la política de caché');

const ttsResult = validateTtsResult({
  audio:referenceAudio,
  mimeType:'audio/mpeg',
  syntheticVoice:true,
  provider:{provider:'mock-provider',model:'mock-tts',requestId:'req-tts-1'},
  cacheKey:'sl01-en-us',
});
assert(ttsResult.syntheticVoice === true, 'TTS debe declarar voz sintética');
expectContractError(() => validateTtsResult({
  audio:referenceAudio,
  mimeType:'audio/mpeg',
  syntheticVoice:false,
  provider:{provider:'mock-provider',model:'mock-tts'},
}), 'SYNTHETIC_VOICE_FLAG_REQUIRED');

const blindStt = validateSttRequest({
  audio:learnerAudio,
  language:'en',
  mode:'file',
  timestamps:'word',
  vocabularyHints:['name','student'],
});
assert(blindStt.mode === 'file', 'STT mode incorrecto');
assert(!('referenceText' in blindStt), 'STT normalizado no debe contener referenceText');

for (const key of SPEAK_LAB_CONTRACTS.sttForbiddenTargetKeys) {
  expectContractError(() => validateSttRequest({
    audio:learnerAudio,
    language:'en',
    [key]:"What's your name?",
  }), 'STT_TARGET_LEAKAGE');
}

expectContractError(() => validateSttRequest({
  audio:new Blob([], { type:'audio/webm' }),
  language:'en',
}), 'EMPTY_AUDIO_BLOB');

const transcript = validateSttResult({
  text:'whats your name',
  language:'en',
  words:[
    {word:'whats',start:0.0,end:0.25},
    {word:'your',start:0.25,end:0.42},
    {word:'name',start:0.42,end:0.75},
  ],
  provider:{provider:'mock-provider',model:'mock-stt',requestId:'req-stt-1'},
});
assert(transcript.words.length === 3, 'STT perdió word timestamps');

const pronunciationRequest = validatePronunciationRequest({
  audio:learnerAudio,
  referenceAudio,
  referenceText:"What's your name?",
  language:'en-US',
  transcript,
  rubricVersion:'speaklab-pronunciation-v0',
});
assert(pronunciationRequest.referenceText === "What's your name?", 'PronunciationEvaluator sí debe recibir referenceText');
assert(pronunciationRequest.transcript.text === 'whats your name', 'PronunciationEvaluator perdió la transcripción ciega');

const pronunciation = validatePronunciationResult({
  dimensions:{
    intelligibility:88,
    segmentalAccuracy:null,
    wordStress:null,
    rhythm:74,
    fluency:81,
    intonation:null,
  },
  issues:[
    {code:'TARGET_WORD',target:'name',message:'Revisar la vocal objetivo.',severity:'practice',start:0.42,end:0.75},
  ],
  evaluatorVersion:'mock-evaluator-v0',
  confidence:52,
  calibrated:false,
});
assert(pronunciation.official === false, 'Pronunciation result debe ser no oficial');
assert(pronunciation.calibrated === false, 'Mock no debe declararse calibrado');
assert(pronunciation.dimensions.segmentalAccuracy === null, 'Una dimensión no medida debe conservar null');

expectContractError(() => validatePronunciationResult({
  dimensions:{},
  evaluatorVersion:'bad',
  officialGrade:95,
}), 'OFFICIAL_GRADE_FORBIDDEN');

const source = fs.readFileSync(contractsPath, 'utf8');
const doc = fs.readFileSync(docPath, 'utf8');

for (const forbidden of [
  /\bfetch\s*\(/,
  /XMLHttpRequest/,
  /WebSocket/,
  /OPENAI_API_KEY/,
  /sk-[A-Za-z0-9_-]+/,
  /APPS_SCRIPT_URL/,
]) {
  assert(!forbidden.test(source), `contracts.js contiene dependencia/red/secreto prohibido: ${forbidden}`);
}

assert(doc.includes('## Regla anti-sesgo'), 'Documento perdió sección anti-sesgo STT');
assert(doc.includes('no puede recibir la frase objetivo ni la respuesta correcta'), 'Documento perdió la prohibición de target leakage');
for (const key of SPEAK_LAB_CONTRACTS.sttForbiddenTargetKeys) {
  assert(doc.includes(`\`${key}\``), `Documento perdió la clave STT prohibida ${key}`);
}
assert(doc.includes('Browser → API externa usando OPENAI_API_KEY'), 'Documento debe advertir contra API key en browser');
assert(doc.includes('Apps Script no debe asumirse como transporte de voz'), 'Documento perdió decisión sobre Apps Script');
assert(doc.includes('Work está desarrollando CS21A215 en PR #85'), 'Documento debe registrar coordinación con trabajo paralelo');

console.log('SPEAK_LAB_PHASE1_CONTRACTS_PASS');
console.log(`contract_version=${SPEAK_LAB_CONTRACT_VERSION}`);
console.log(`stt_target_leak_keys=${SPEAK_LAB_CONTRACTS.sttForbiddenTargetKeys.length}`);
console.log('network_calls=0');
console.log('provider_api_keys=0');
console.log('official_grades=forbidden');
