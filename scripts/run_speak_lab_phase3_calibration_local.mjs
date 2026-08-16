#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { buildPronunciationCalibrationReport } from '../prototypes/speak_lab_phase3/pronunciation_calibration_harness.mjs';

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : '';
if (!inputPath) {
  fail('Uso: node scripts/run_speak_lab_phase3_calibration_local.mjs <dataset.json> [report.json]');
} else if (!fs.existsSync(inputPath)) {
  fail(`No existe dataset: ${inputPath}`);
} else {
  const defaultDir = path.resolve('.speak-lab-calibration-local');
  const parsed = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const report = buildPronunciationCalibrationReport(parsed);
  const outputPath = process.argv[3]
    ? path.resolve(process.argv[3])
    : path.join(defaultDir, `${report.sessionId}.report.json`);

  fs.mkdirSync(path.dirname(outputPath), { recursive:true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log('SPEAK_LAB_CALIBRATION_LOCAL_REPORT');
  console.log(`session=${report.sessionId}`);
  console.log(`samples=${report.counts.samples}`);
  console.log(`speakers=${report.counts.speakers}`);
  console.log(`reviewers=${report.counts.reviewers}`);
  console.log(`phrases=${report.counts.phrases}`);
  console.log(`cohorts=${report.counts.cohorts}`);
  console.log(`official=${report.official}`);
  console.log(`calibrated=${report.calibrated}`);
  console.log(`thresholdsEstablished=${report.thresholdsEstablished}`);
  console.log(`report=${outputPath}`);
}
