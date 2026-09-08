import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const must=(ok,msg)=>{if(!ok)throw new Error(`REBECA_R0_FAIL: ${msg}`)};
const hash=p=>execFileSync('git',['hash-object',p],{encoding:'utf8'}).trim();

const part2='patches/apps-script/CS21A211/99_QA_Staging_Guard.js.part2.patch';
const part3='patches/apps-script/CS21A211/99_QA_Staging_Guard.js.part3.patch';
const review='00_DOCUMENTACION/ENDPOINT_MANUAL_REVIEW_CS21A211C_2026-09-02.md';
must(hash(part2)==='a485806e4bdfafc79611c1809cfb9a28ddaa2f18','containment part2 drift');
must(hash(part3)==='c92c1f87c772d67aa8334416acb9c8f7263aedb5','containment part3 drift');
must(hash(review)==='85732a2160844c814e0ab72b80aefbe715ec210c','manual endpoint review drift');

const p2=fs.readFileSync(part2,'utf8');
const p3=fs.readFileSync(part3,'utf8');
const rev=fs.readFileSync(review,'utf8');
const all=p2+p3;

for(const fn of ['agentgetcommercialconfig','agentgetpaymentstatus','agentgetroutingdirectory','agentresolvecontactcontext','agentsubmitenrollmentrequest','agentupdateprospectprogress','agentreportpayment']) must(rev.toLowerCase().includes(fn),`classification missing ${fn}`);
for(const marker of ['READ_WITH_TECHNICAL_SIDE_EFFECT','BUSINESS_WRITE','BLOCK_DEFAULT_DENY']) must(rev.includes(marker),`review marker missing ${marker}`);

must(all.includes("error:'qa_route_ambiguous'"),'ambiguous route fail-closed missing');
must(all.includes("error:'qa_write_blocked'"),'dangerous route rejection missing');
must(all.includes("error:'qa_endpoint_not_allowlisted'"),'default deny missing');
must(all.includes('if (!_qa144IdsOk_())'),'QA resource gate must precede dispatch');
must(all.includes('if (_qa144AllowedLabFn_(req.fn) || _qa144AllowedCampusCoreFn_(req.fn))'),'explicit POST delegation boundary missing');

const core=p2.slice(p2.indexOf('function _qa144AllowedCampusCoreFn_'),p2.indexOf('function _qa144DangerousFn_'));
must(core && !/agent/i.test(core),'agent route leaked into core allowlist');
const getBlock=p3.slice(p3.indexOf('function _qa144AllowedGetFn_'),p3.indexOf('function _qa144GetBlockedHtml_'));
must(getBlock && !/agent/i.test(getBlock),'agent route leaked into GET allowlist');

const danger=p2.match(/function _qa144DangerousFn_\(fn\)[\s\S]*?\n\+\}/)?.[0] || '';
must(/payment/i.test(danger),'payment dangerous marker missing');
must(!/submitenrollment/i.test(danger),'submit enrollment unexpectedly classified by dangerous regex');
must(!/updateprospect/i.test(danger),'update prospect unexpectedly classified by dangerous regex');

const report=fs.readFileSync('00_DOCUMENTACION/REBECA_POST_CONTAINMENT_R0_2026-09-08.md','utf8');
for(const marker of ['R0-BOUNDARY-001','R0-BOUNDARY-002','R0_HANDLER_SOURCE=BLOCKED','qa_write_blocked','qa_endpoint_not_allowlisted']) must(report.includes(marker),`report marker missing ${marker}`);

const changed=execFileSync('git',['diff','--name-only','14048346d5392a1ff0f9208bf9c42c07713ff019...HEAD'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
const allowed=new Set(['00_DOCUMENTACION/REBECA_POST_CONTAINMENT_R0_2026-09-08.md','scripts/qa_rebeca_post_containment_r0_20260908.mjs','.github/workflows/qa-rebeca-post-containment-r0-20260908.yml']);
for(const p of changed) must(allowed.has(p),`unexpected changed path ${p}`);

console.log('REBECA POST-CONTAINMENT R0 PASS');
console.log('AGENT_READS=4 DEFAULT_DENY');
console.log('AGENT_WRITES=3 DEFAULT_DENY');
console.log('HANDLER_SOURCE=BLOCKED');
console.log('R1_R2_R3=STOP');
