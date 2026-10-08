import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('services/conape-bridge/server_v2.mjs','utf8');
const a=source.indexOf('async function readProspectRowsWithSessionRecovery()');
const b=source.indexOf('async function publishProspectacionSnapshot(',a);
assert(a>=0&&b>a,'Read-only helper + listing found');
const code=source.slice(a,b);
assert(code.includes('await ConapeSession.close()'),'Recovery discards browser');
assert(code.includes("CONAPE_REPORT_DOUBLE_MISMATCH"),'Must verify both fingerprints before publication');
assert(source.indexOf('const applied = await publishProspectacionSnapshot(list);')>0,'Only verified list gets published');

function build(failures=[], fingerprints=['stable','stable'], opts={}){
  let read=0, opens=0, closes=0, reloads=0, events=[];
  const p={reload:async()=>{reloads++}};
  class AppError extends Error {constructor(code,message,status,stage){super(message);this.code=code;this.status=status;this.stage=stage}}
  const s={
    console:{log:raw=>events.push(JSON.parse(raw))},VERSION:'QA-F99',Date,
    txt:v=>String(v||''),AppError,Map,
    ConapeSession:{
      state:'DISCONNECTED',connectedAt:'',lastActivity:'',
      browserPage:async()=>{opens++;return p},
      close:async()=>{closes++},
    },
    readRowsAllSnapshot:async()=>{
      read++;
      if(failures.includes(read))throw (opts.unexpected?new TypeError('Untrusted external info'):new AppError('CONAPE_REPORT_CONTEXT_NOT_READY','Stale report',503,'REPORT'));
      const fingerprint=fingerprints[(read-1)%fingerprints.length];
      return {rows:[{cedula:'111111111',nombre:'Synthetic Student'}],fingerprint};
    },
    waitForApexDynamicAction:async()=>{},
    addProspectRows:(map,rows)=>rows.forEach(x=>map.set(x.cedula,x)),
    nowIso:()=> '2026-10-07T20:00:00.000Z',
  };
  vm.createContext(s);
  vm.runInContext(code+'globalThis.readTest={readProspectRowsWithSessionRecovery,listProspectsFromHome};',s);
  return {...s, get counts(){return {read,opens,closes,reloads}},get events(){return events}};
}
let m=build();
let result=await m.readTest.listProspectsFromHome();
assert.equal(result.row_count,1);assert.equal(result.counts_match,true);
assert.equal(result.recovery_used,false);assert.equal(m.counts.read,2);assert.equal(m.counts.closes,0);
console.log('PASS normal snapshot: double read, no browser reset');

m=build([1]);
result=await m.readTest.listProspectsFromHome();
assert.equal(result.row_count,1);assert.equal(result.recovery_used,true);
assert.equal(m.counts.closes,1);assert.equal(m.counts.read,3);
assert(m.events.some(x=>x.event==='conape_prospectacion_read_failed'&&x.recovery==='FRESH_BROWSER_RETRY'));
console.log('PASS stale session: closes browser and retries from clean context');

m=build([2]);
result=await m.readTest.listProspectsFromHome();
assert.equal(result.row_count,1);assert.equal(result.recovery_used,true);assert.equal(m.counts.read,4);assert.equal(m.counts.closes,1);
console.log('PASS reload interrupted: both reads restarted after recovery');

m=build([1,2],['stable'],{unexpected:true});
await assert.rejects(()=>m.readTest.listProspectsFromHome(),e=>e.code==='CONAPE_REPORT_READ_UNEXPECTED'&&e.status===503);
assert.equal(m.counts.closes,1);assert.equal(m.counts.read,2);
assert(m.events.some(x=>x.recovery==='EXHAUSTED'));
assert(!m.events.some(x=>JSON.stringify(x).includes('Untrusted external info')));
console.log('PASS persistent unexpected failure: sanitized 503, retry bounded, no PII');

m=build([] , ['A','B']);
await assert.rejects(()=>m.readTest.listProspectsFromHome(),e=>e.code==='CONAPE_REPORT_DOUBLE_MISMATCH');
assert.equal(m.counts.read,2);assert.equal(m.counts.closes,0);
console.log('PASS mismatched double read: blocked, no retry/mutating publication');

console.log('CONAPE F99 READ-RETRY QA PASS: 5 isolated scenarios; no real customer or CONAPE writes.');
