import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  SpeakLabCalibrationError,
  buildPronunciationCalibrationReport,
  validateCalibrationDataset,
} from '../prototypes/speak_lab_phase3/pronunciation_calibration_harness.mjs';

const conditionBase = {
  good:96,
  intermediate:76,
  problematic:52,
};

const samples = [];
for (const speaker of [
  { speakerId:'spk_alpha01', cohortTag:'cohort_alpha' },
  { speakerId:'spk_beta001', cohortTag:'cohort_beta' },
]) {
  for (const condition of ['good', 'intermediate', 'problematic']) {
    for (let repetition = 1; repetition <= 3; repetition += 1) {
      const sampleId = `cal_${speaker.speakerId}_${condition}_${repetition}`;
      const base = conditionBase[condition] + (repetition - 2);
      const sha256 = createHash('sha256').update(sampleId).digest('hex');
      samples.push({
        sampleId,
        speakerId:speaker.speakerId,
        cohortTag:speaker.cohortTag,
        phraseId:'phrase_SL01',
        condition,
        repetition,
        staffQaAuthorized:true,
        audioEvidence:{
          sha256,
          bytes:5800 + repetition,
          durationMs:2800 + repetition * 10,
          mimeType:'audio/ogg; codecs=opus',
        },
        humanReview:{
          reviewerId:'reviewer_teacher01',
          dimensions:{
            intelligibility:Math.min(100, base + 1),
            segmentalAccuracy:Math.max(0, base - 2),
            wordStress:Math.max(0, base - 4),
            rhythm:Math.max(0, base - 3),
            fluency:Math.max(0, base - 1),
            intonation:Math.max(0, base - 5),
          },
        },
        providerResult:{
          dimensions:{
            intelligibility:null,
            segmentalAccuracy:base,
            wordStress:null,
            rhythm:null,
            fluency:Math.max(0, base - 1),
            intonation:null,
          },
          issues:[],
          evaluatorVersion:'azure-pronunciation-rest-v0.2-live-shape-unvalidated',
          confidence:null,
          calibrated:false,
          official:false,
        },
      });
    }
  }
}

const dataset = {
  sessionId:'calibration_pc8_fake01',
  rubricVersion:'speaklab-pronunciation-v0',
  samples,
};

const validated = validateCalibrationDataset(dataset);
assert.equal(validated.samples.length, 18);
assert.equal(validated.samples.every(sample => sample.staffQaAuthorized === true), true);

const report = buildPronunciationCalibrationReport(dataset, { generatedAt:'2026-08-16T02:00:00.000Z' });
assert.equal(report.official, false);
assert.equal(report.calibrated, false);
assert.equal(report.thresholdsEstablished, false);
assert.equal(report.decision, 'NO_AUTOMATIC_ACADEMIC_DECISION');
assert.deepEqual(report.counts, {
  samples:18,
  speakers:2,
  reviewers:1,
  phrases:1,
  cohorts:2,
});
assert.equal(report.repeatability.length, 6);
assert.equal(report.repeatability.every(group => group.repetitions === 3 && group.status === 'descriptive_only'), true);
assert.equal(report.humanAgreement.segmentalAccuracy.pairs, 18);
assert.equal(report.humanAgreement.segmentalAccuracy.meanSignedDelta, 2);
assert.equal(report.humanAgreement.segmentalAccuracy.meanAbsoluteDelta, 2);
assert.equal(report.humanAgreement.fluency.meanSignedDelta, 0);
assert.equal(report.humanAgreement.intelligibility.status, 'insufficient_data');
assert.equal(report.cohorts.length, 2);
assert.equal(report.cohorts.every(cohort => cohort.samples === 9), true);
assert.equal(report.conditions.every(condition => condition.samples === 6), true);
assert.equal(report.conditions.find(item => item.condition === 'good').dimensions.segmentalAccuracy.mean > report.conditions.find(item => item.condition === 'intermediate').dimensions.segmentalAccuracy.mean, true);
assert.equal(report.conditions.find(item => item.condition === 'intermediate').dimensions.segmentalAccuracy.mean > report.conditions.find(item => item.condition === 'problematic').dimensions.segmentalAccuracy.mean, true);

const serialized = JSON.stringify(report);
for (const forbidden of ['officialGrade', 'finalGrade', 'referenceText', 'transcript', 'audioPath', 'rawAudio', 'PronScore', 'ProsodyScore']) {
  const propertyPattern = new RegExp(`"${forbidden}"\\s*:`, 'i');
  assert.equal(propertyPattern.test(serialized), false, `Reporte filtró propiedad prohibida: ${forbidden}`);
}

const insufficient = buildPronunciationCalibrationReport({
  sessionId:'calibration_small01',
  rubricVersion:'speaklab-pronunciation-v0',
  samples:[samples[0]],
}, { generatedAt:'2026-08-16T02:00:00.000Z' });
assert.equal(insufficient.repeatability[0].status, 'insufficient_data');
assert.equal(insufficient.humanAgreement.segmentalAccuracy.status, 'insufficient_data');
assert.equal(insufficient.cohorts[0].status, 'insufficient_data');

function expectCalibrationError(mutator, code) {
  const clone = structuredClone(dataset);
  mutator(clone);
  assert.throws(
    () => validateCalibrationDataset(clone),
    error => error instanceof SpeakLabCalibrationError && error.code === code,
  );
}

expectCalibrationError(data => { data.samples[0].email = 'qa@example.com'; }, 'CALIBRATION_FIELD_FORBIDDEN');
expectCalibrationError(data => { data.samples[0].referenceText = "What's your name?"; }, 'CALIBRATION_FIELD_FORBIDDEN');
expectCalibrationError(data => { data.samples[0].transcript = "What's your name?"; }, 'CALIBRATION_FIELD_FORBIDDEN');
expectCalibrationError(data => { data.samples[0].audio = 'raw-bytes'; }, 'CALIBRATION_FIELD_FORBIDDEN');
expectCalibrationError(data => { data.samples[0].staffQaAuthorized = false; }, 'STAFF_QA_AUTHORIZATION_REQUIRED');
expectCalibrationError(data => { data.samples[0].providerResult.official = true; }, 'OFFICIAL_RESULT_FORBIDDEN');
expectCalibrationError(data => { data.samples[0].providerResult.calibrated = true; }, 'CALIBRATED_RESULT_FORBIDDEN');
expectCalibrationError(data => { data.samples[1].sampleId = data.samples[0].sampleId; }, 'DUPLICATE_SAMPLE_ID');

console.log(JSON.stringify({
  ok:true,
  checkpoint:'PC8_CALIBRATION_HARNESS_OFFLINE',
  samples_fake:18,
  network_calls_real:0,
  secrets_real:0,
  raw_audio_in_repo:0,
  student_audio:0,
  official:false,
  calibrated:false,
  thresholds_established:false,
  insufficient_data_is_not_pass:true,
  human_provider_comparison:'descriptive-only',
  cohort_bias_review:'descriptive-only',
}));
