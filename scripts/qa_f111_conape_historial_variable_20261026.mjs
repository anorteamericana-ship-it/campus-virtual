/**
 * Regression QA del parche de cardinalidad CONAPE.
 * Ejecutar: node scripts/qa_f111_conape_historial_variable_20261026.mjs
 * No hay llamadas de red ni escrituras de plan/pago.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const path = 'apps_script_patches/F111_CONAPE_HISTORIAL_VARIABLE_17187_20261026.gs';
const source = fs.readFileSync(path, 'utf8');
const sandbox = vm.createContext({});
new vm.Script(source, {filename:path}).runInContext(sandbox);

const ced='111750252', prefix=['SJ01','ING-CONV-IN',ced,'CURSO IDIOMA'];
const lvl={B1:'ING-IN-B1-01',B2:'ING-IN-B2-02',I1:'ING-IN-I1-03',I2:'ING-IN-I2-04'};
const plan=Object.values(lvl).map((materia,i)=>[ced,'SJ01','ING-CONV-IN','CURSO IDIOMA',i+1,i<2?'B':'C',materia,i<2?'APR':i===2?'CA':'PE']);
const history=[
 [...prefix,lvl.B1,2026,3,'B','APR',90],
 [...prefix,lvl.B2,2026,4,'B','APR',95],
 [...prefix,lvl.I1,2026,3,'C','CA',0]
];
const mora=[['SJ01',ced,2026,3,'NO'],['SJ01',ced,2026,4,'NO']];
const evaluate = sandbox._f111HxEvaluate_;
assert.equal(evaluate(ced,plan,history,mora).ok,true,'tres líneas historial son válidas');
assert.equal(evaluate(ced,plan,[...history,[...prefix,lvl.I1,2027,1,'C','REP',60]],mora).ok,true,'repetición real aumenta historial');
const sixMora=[...mora,['SJ01',ced,2027,1,'NO'],['SJ01',ced,2027,2,'NO'],['SJ01',ced,2027,3,'NO'],['SJ01',ced,2027,4,'NO']];
assert.equal(evaluate(ced,plan,history,sixMora).ok,true,'morosidad puede superar cuatro períodos');
assert.equal(evaluate(ced,plan,[...history,history[2]],mora).ok,false,'duplicación exacta de intento se rechaza');
assert.equal(evaluate(ced,plan,history,[...mora,mora[0]]).ok,false,'morosidad duplicada se rechaza');
assert.equal(evaluate(ced,[...plan.slice(0,3),plan[2]],history,mora).ok,false,'plan de 4 filas con nivel repetido se rechaza');
assert.equal(evaluate(ced,plan.slice(0,3),history,mora).ok,false,'plan incompleto se rechaza');
const foreign=['999999999', 'SJ01','ING-CONV-IN','CURSO IDIOMA',3,'C',lvl.I1,'CA',0];
assert.equal(evaluate(ced,[...plan,foreign],history,mora).ok,true,'otros estudiantes no afectan cardinalidad');

let syncCalls=0;
sandbox.LockService={getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})};
sandbox._f111HxFindOperation_=()=>({row:{ESTADO:'CONFIRMADO_LOCAL',CONAPE_SYNC:'PENDIENTE',__row:96}});
sandbox._f111HxBanco_=()=>{};
sandbox._f111HxReads_=()=>({preparado:true, faltantes:[], filas_historial_observadas:3});
sandbox._f111HxFindReview_=()=>({ESTADO:'REVISION_INTERNA_NO_ENVIADA',APROBADO_CONAPE_EN:'',REFERENCIA_APROBACION:''});
sandbox._conapeAxSyncStudentCore_=()=>{syncCalls++;return {ok:true}};
let ret=sandbox.F111_CONAPE_17187_REINTENTO_SOLO_SYNC();
assert.equal(ret.bloqueado,'APROBACION_CONAPE_NO_REGISTRADA','no se puede sincronizar sin autorización');
assert.equal(syncCalls,0,'sincronizador no invocado sin aprobación');
sandbox._f111HxFindOperation_=()=>({row:{ESTADO:'CONFIRMADO',CONAPE_SYNC:'OK',__row:96}});
ret=sandbox.F111_CONAPE_17187_REINTENTO_SOLO_SYNC();
assert.equal(ret.ya_sincronizado,true,'segundo reintento es idempotente');
assert.equal(syncCalls,0,'el reintento idempotente no escribe');
assert.match(source,/NO exponer estas funciones en doGet\/doPost/);
assert.doesNotMatch(source,/aplicarPago\s*\(/, 'el parche nunca llama aplicarPago');
console.log('F111_CONAPE_VARIABLE_PASS: 10 controles, sin cobros ni despliegue');
