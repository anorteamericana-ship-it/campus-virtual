import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE='564a341445cdfba90fd40ded9198c48b09785e54';
const FREE_PATH='src/english_lab_free_access_cs21a66.js';
const CAMPUS_PATH='campus.html';
const FREE_BLOB='75525ac6f6606c77b736070e5b12824d239f48b7';
const CAMPUS_BLOB='c1a3b3b9bb44593b311bf674a771335e5c517ca4';
const hashFile=(path)=>execFileSync('git',['hash-object',path],{encoding:'utf8'}).trim();

if(hashFile(FREE_PATH)!==FREE_BLOB) throw new Error(`free access source changed ${hashFile(FREE_PATH)}`);
if(hashFile(CAMPUS_PATH)!==CAMPUS_BLOB) throw new Error(`campus preimage changed ${hashFile(CAMPUS_PATH)}`);

const src=fs.readFileSync(FREE_PATH,'utf8');
const campus=fs.readFileSync(CAMPUS_PATH,'utf8');
if(!campus.includes('src/english_lab_free_access_cs21a66.js?v=F98.4Z6CS13')) throw new Error('effective campus loader missing');

const tokens=[
  "message:clean(user?.english_lab_gratis_mensaje || ''),",
  "message:clean(source.mensaje || source.english_lab_gratis_mensaje || ''),",
  "message:clean(response.mensaje || ''),",
  "throw new Error(data?.mensaje || data?.error || `HTTP ${response.status}`);",
  "message:clean(error?.message || error || 'No fue posible confirmar el acceso.'),",
  "const body = loading",
  ": (current.message || 'Tu prematrícula todavía no ha sido aprobada. English LAB Gratis se habilitará cuando Admisiones autorice el acceso.');",
  "if (!freeUser || access.allowed === true) return React.createElement(Base, props);",
  "return React.createElement(AccessMessage, { loading:access.loading || !access.checked });",
];
for(const token of tokens){ if(!src.includes(token)) throw new Error(`data-flow token missing: ${token}`); }

const workflow=fs.readFileSync('.github/workflows/qa-english-lab-source-truth-guard.yml','utf8');
if(!workflow.includes("grep -Eq '^(src/english_lab|styles/english_lab|scripts/.*browser.*\\.mjs)'")) throw new Error('global English LAB fail-closed pattern changed');
if(!workflow.includes('if [ -f scripts/qa_cs21a202_source_truth.mjs ]; then')) throw new Error('CS21A202 strict gate condition changed');
if(fs.existsSync('scripts/qa_cs21a202_source_truth.mjs')) throw new Error('CS21A202 unexpectedly present on this line; reassess functional-block conclusion');

const baseBlob=execFileSync('git',['rev-parse',`${BASE}:${FREE_PATH}`],{encoding:'utf8'}).trim();
if(baseBlob!==FREE_BLOB) throw new Error(`base free-access blob mismatch ${baseBlob}`);

const report=fs.readFileSync('00_DOCUMENTACION/ENGLISH_LAB_FREE_ACCESS_MESSAGE_BOUNDARY_CS21A210BH_2026-09-01.md','utf8');
for(const marker of ['FALSE_POSITIVE_SCANNER','EFFECTIVE_VISIBLE','cuatro fronteras','E2: **NO**','BACKEND CURRENT SNAPSHOT UNVERIFIED']){
  if(!report.includes(marker)) throw new Error(`report marker missing ${marker}`);
}

console.log('CS21A210BH free-access message boundary audit PASS');
console.log('SCANNER_LINE=FALSE_POSITIVE_SCANNER');
console.log('DATA_FLOW=EFFECTIVE_VISIBLE');
console.log('RAW_INPUT_BOUNDARIES=4');
console.log('FUNCTIONAL_FIX=BLOCKED_BY_CS21A202_SOURCE_TRUTH');
console.log('E2=NO');
