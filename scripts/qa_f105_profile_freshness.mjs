import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const primitives = fs.readFileSync(new URL('../src/primitives.jsx',import.meta.url),'utf8');
const html = fs.readFileSync(new URL('../campus.html',import.meta.url),'utf8');
const first=primitives.indexOf('const STUDENT_PROFILE_CACHE_TTL_MS');
const end=primitives.indexOf('// ── LoadingState',first);
assert(first>0&&end>first,'Cache + hook snippet present');
const snippet=primitives.slice(first,end);
new vm.Script(snippet,{filename:'primitives_profile_refresh.js'});
const storage=new Map();
let now=1_000_000;
const sandbox={
  sessionStorage:{
    getItem:k=>storage.get(k)??null,
    setItem:(k,v)=>storage.set(k,v),
    removeItem:k=>storage.delete(k),
  },
  document:{visibilityState:'visible'},
  Date:class extends Date{static now(){return now;}},
  React:{useState:()=>{},useEffect:()=>{},useRef:()=>{}},
};
vm.runInNewContext(snippet,sandbox);
const calc=(busy=false,lastAttempt=0,codigo='17197')=>vm.runInNewContext(
  `studentProfileShouldRefresh(${JSON.stringify(codigo)},${busy},${lastAttempt},Date.now())`,sandbox
);
assert.equal(calc(),true,'Without cache, perform first fetch');
vm.runInNewContext("studentProfileCachePut('17197',{ok:true,pendientes:{matricula:0}})",sandbox);
assert.equal(calc(),false,'Fresh cache should not refetch');
now+=89_000;assert.equal(calc(),false,'At 89 seconds preserve cache');
now+=2_000;assert.equal(calc(),true,'At 91 seconds profile must be refreshable');
assert.equal(calc(true),false,'Busy request never duplicated');
assert.equal(calc(false,now-15_000),false,'Retry throttle prevents bursts');
sandbox.document.visibilityState='hidden';
assert.equal(calc(),false,'Hidden tabs never poll');
sandbox.document.visibilityState='visible';
assert.equal(calc(false,0,''),false,'No student: no call');
assert.match(snippet,/window\.addEventListener\('focus', refreshIfStale\)/,'Focus refresh registration');
assert.match(snippet,/window\.addEventListener\('hashchange', refreshIfStale\)/,'Route refresh registration');
assert.match(snippet,/document\.addEventListener\('visibilitychange', onVisibility\)/,'Visibility refresh registration');
assert.match(snippet,/window\.setInterval\(refreshIfStale, STUDENT_PROFILE_AUTO_CHECK_MS\)/,'Long-stay refresh poll');
assert.match(snippet,/window\.clearInterval\(interval\)/,'Unsubscribe timer');
assert.match(snippet,/pendingRef\.current/,'In-flight lock');
assert.match(html,/src\/primitives\.jsx\?v=F105STUDENTPROFILE20261009/,'Public script cache-bust');
console.log('QA_F105_STUDENT_PROFILE_FRESHNESS_PASS');
