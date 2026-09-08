import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE='6606c5e34dfb58637c47c5c8c20204a0770f535e';
const guard=execFileSync('git',['show',`${BASE}:patches/apps-script/CS21A211/99_QA_Staging_Guard.js.part2.patch`],{encoding:'utf8',maxBuffer:10*1024*1024});
const review=execFileSync('git',['show',`${BASE}:00_DOCUMENTACION/ENDPOINT_MANUAL_REVIEW_CS21A211C_2026-09-02.md`],{encoding:'utf8',maxBuffer:10*1024*1024});
const provenance=execFileSync('git',['show',`${BASE}:00_DOCUMENTACION/REBECA_ROUTE_PROVENANCE_AUDIT_2026-09-08.md`],{encoding:'utf8',maxBuffer:10*1024*1024});
const report=fs.readFileSync('00_DOCUMENTACION/REBECA_CONTAINMENT_SEMANTICS_AUDIT_2026-09-08.md','utf8');
const must=(c,m)=>{if(!c) throw new Error(m);};

const m=guard.match(/function _qa144DangerousFn_\(fn\)\{\s*\+?\s*return \/([^/]+)\/i\.test\(fn\);/);
must(m,'cannot extract _qa144DangerousFn_ regex from exact base');
const dangerous=new RegExp(m[1],'i');
const expected=new Map([
  ['agentGetCommercialConfig',false],
  ['agentGetPaymentStatus',true],
  ['agentGetRoutingDirectory',false],
  ['agentResolveContactContext',false],
  ['agentSubmitEnrollmentRequest',false],
  ['agentUpdateProspectProgress',false],
  ['agentReportPayment',true],
]);
for(const [selector,want] of expected){
  must(review.toLowerCase().includes(selector.toLowerCase()),`CS21A211C route missing ${selector}`);
  const got=dangerous.test(selector);
  must(got===want,`dangerous classification drift ${selector}: got ${got} want ${want}`);
}
must(provenance.includes('CURRENT_HANDLER_SOURCE_BLOCKED'),'#281 provenance stop missing');
for(const marker of ['false positive semántico','false negative semántico','READ_ALLOWLIST','P2 · CONFIRMADO · E0','STOP R1']) must(report.includes(marker),`report marker missing ${marker}`);
console.log(`DANGEROUS_REGEX=/${m[1]}/i`);
console.log('REBECA_CONTAINMENT_SEMANTICS=PASS_E0');
console.log('READ_CLASSIFIED_DANGEROUS=agentGetPaymentStatus');
console.log('WRITES_NOT_CLASSIFIED_DANGEROUS=agentSubmitEnrollmentRequest,agentUpdateProspectProgress');
console.log('CURRENT_SAFETY=DEFAULT_DENY');
console.log('R1=STOP_PENDING_POSITIVE_ROUTE_CONTRACTS');
