// HOTFIX F111 reversal visibility: source and helper contract (no payment writes).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('src/admin_students_status_fresh_cs21a42.jsx','utf8');
const html=fs.readFileSync('campus.html','utf8');
let checks=0;
const check=(ok,msg)=>{assert.ok(ok,msg);checks++};
check((source.match(/^\(function\(\)\{/gm)||[]).length===1,'only one shared private IIFE');
check((source.match(/^\}\)\(\);/gm)||[]).length===1,'only one IIFE close');
check(source.includes('async function call(')&&source.includes('async function postRev('),'both helpers exist');
check(!source.includes('})();\n\n(function(){'),'separate inaccessible closure removed');
check(html.includes('src/admin_students_status_fresh_cs21a42.jsx?v=F111REVERSALR2_20261102'),'new live cache marker');
check(source.includes('if(!allowed)return null;'),'server authorization still controls button');
check(source.includes("postRev('revertirPagoOperacion'"),'reversal backend contract preserved');
check(source.includes('window.confirm('),'explicit confirmation preserved');
const between=(a,b)=>{const start=source.indexOf(a),end=source.indexOf(b,start);assert.ok(start>=0&&end>start,'helper boundaries');return source.slice(start,end)};
const safe=between('function statusSafeUserError(','\nasync function call(');
const call=between('async function call(','\nfunction Modal(');
const reversal=between('async function postRev(','\nfunction ReversalModal(');
let calls=0;
const env={
 postCampusData:async(fn,payload)=>{calls++;return {ok:true,operaciones:[{operacion_id:'QA_SYNTHETIC',monto_total:1}],fn,codigo:payload.codigo}},
 setTimeout:()=>7,clearTimeout:()=>{},console:{warn:()=>{}},Promise,Error,String,
};
vm.createContext(env);
vm.runInContext(safe+'\n'+call+'\n'+reversal+'\nthis.__read=postRev',env,{timeout:3000});
const a=await env.__read('getOperacionesPagoReversibles',{codigo:'QA_SYNTHETIC'},2000);
check(a.ok===true&&Array.isArray(a.operaciones),'authorized mock response retained');
check(calls===1,'one query issued');
env.postCampusData=async()=>({ok:false,error:'no_autorizado'});
const denied=await env.__read('getOperacionesPagoReversibles',{codigo:'QA_SYNTHETIC'},2000);
check(denied.ok===false&&denied.error,'unauthorized query does not reveal payment');
env.postCampusData=async()=>{throw Error('simulated network error')};
const failure=await env.__read('getOperacionesPagoReversibles',{codigo:'QA_SYNTHETIC'},2000);
check(failure.ok===false,'network error safely handled');
console.log(JSON.stringify({ok:true,checks,mode:'MOCK_E1_ONLY',bank_writes:0,backend_deploys:0,student_writes:0}));
