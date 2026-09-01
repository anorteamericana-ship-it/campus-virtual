import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const exists = p => fs.existsSync(p);
const read = p => fs.readFileSync(p, 'utf8');
const failures = [];
const check = (ok, message) => ok ? console.log(`PASS: ${message}`) : failures.push(message);

const sourceTruthWorkflow = '.github/workflows/qa-english-lab-source-truth-guard.yml';
const strictGate = 'scripts/qa_cs21a202_source_truth.mjs';
const v2Shell = 'src/english_lab_live_v2.jsx';
const legacyLive = 'src/english_lab_live.jsx';

check(exists(sourceTruthWorkflow), 'Source Truth workflow exists');
check(exists(legacyLive), 'current english_lab_live.jsx exists');

const workflow = exists(sourceTruthWorkflow) ? read(sourceTruthWorkflow) : '';
check(workflow.includes('if [ -f scripts/qa_cs21a202_source_truth.mjs ]; then'), 'Source Truth workflow only runs strict CS21A202 gate when present');
check(workflow.includes('Strict English LAB gate not yet present on main; PR does not modify English LAB/browser runtime surface.'), 'fallback PASS is explicitly non-certifying for untouched English LAB runtime');

const strictPresent = exists(strictGate);
const v2Present = exists(v2Shell);
const liveBlob = exists(legacyLive) ? execFileSync('git', ['hash-object', legacyLive], { encoding: 'utf8' }).trim() : '';
check(liveBlob === 'f4c865510b1ba3f7fdf8b67be8ea21cf21762cc4', 'current english_lab_live.jsx remains byte-identical to the shell observed on #121');

// This gate classifies the current release blocker. It must fail if the blocker silently disappears
// without an explicit reconciliation update to this contract.
check(!strictPresent, 'strict CS21A202 Source Truth gate is intentionally absent from current candidate');
check(!v2Present, 'english_lab_live_v2.jsx is absent from current candidate');

if (failures.length) {
  console.error('QA ENGLISH LAB RELEASE READINESS CS21A210BN FAIL');
  failures.forEach(item => console.error('-', item));
  process.exit(1);
}

console.log('QA ENGLISH LAB RELEASE READINESS CS21A210BN PASS');
console.log(`CURRENT_LIVE_BLOB=${liveBlob}`);
console.log('STRICT_SOURCE_TRUTH_PRESENT=NO');
console.log('V2_SHELL_PRESENT=NO');
console.log('SOURCE_TRUTH_GREEN_MEANS=UNTOUCHED_RUNTIME_ONLY');
console.log('RELEASE_READINESS=BLOCKED_PENDING_EXPLICIT_RECONCILIATION');
console.log('E2=NO');
