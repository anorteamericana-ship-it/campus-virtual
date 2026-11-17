// F111 · Regression focalizada: autoguardado no borra el estado pendiente
// cuando el alumno responde mientras el servidor procesa el snapshot anterior.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('src/examenes_modes.jsx','utf8');
const bundle=fs.readFileSync('src/examenes_bundle.jsx','utf8');
const start=source.indexOf('  const doSave = useCallback(async (source=');
const end=source.indexOf('  const doSubmit = useCallback(',start);
assert.ok(start>0&&end>start,'motor de guardado localizable');
const save=source.slice(start,end);
const contract=[
  'const snapshot = JSON.stringify(answersRef.current || {});',
  'lastSavedJsonRef.current = snapshot;',
  'const hasNewAnswers = JSON.stringify(answersRef.current || {}) !== snapshot;',
  'dirtyRef.current = hasNewAnswers;',
  'setDirty(hasNewAnswers);'
];
for(const line of contract) {
  assert.ok(save.includes(line),'falta contrato de snapshot: '+line);
  assert.ok(bundle.includes(line),'bundle desactualizado: '+line);
}
assert.ok(save.indexOf('lastSavedJsonRef.current = snapshot;') <
          save.indexOf('const hasNewAnswers = JSON.stringify(answersRef.current || {}) !== snapshot;'),
          'el readback de cambios posteriores debe ocurrir después del ACK');
assert.ok(!save.includes('lastSavedJsonRef.current = snapshot;\n        dirtyRef.current = false;'),
          'no se debe limpiar dirty incondicionalmente después de guardar');
const applyAck=(sent,current)=>({
  lastSavedJson:JSON.stringify(sent),
  dirty:JSON.stringify(current)!==JSON.stringify(sent)
});
assert.deepEqual(applyAck({a:'1'},{a:'1'}),{
  lastSavedJson:'{"a":"1"}',dirty:false
},'sin cambios posteriores: queda guardado');
assert.deepEqual(applyAck({a:'1'},{a:'1',b:'2'}),{
  lastSavedJson:'{"a":"1"}',dirty:true
},'respuesta nueva durante POST: permanece pendiente');
assert.deepEqual(applyAck({a:'1'},{a:'2'}),{
  lastSavedJson:'{"a":"1"}',dirty:true
},'edición de respuesta anterior durante POST: permanece pendiente');
console.log('F111 WRITTEN SAVE RACE: PASS · fuente, bundle, 3 casos');


// WRITTEN-FINALIZE-02: probar el helper REAL extraído del código distribuido.
// Evita pruebas E2 repetidas o uso de intentos de estudiantes.
import vm from 'node:vm';
const helperStart=source.indexOf('async function examWrittenFinalizeAfterPendingSave(');
const helperEnd=source.indexOf('// CALGRUPO_F27_20260617_STUDENTMODE_INTENTO_REAL_BACKEND',helperStart);
const bundleStart=bundle.indexOf('async function examWrittenFinalizeAfterPendingSave(');
const bundleEnd=bundle.indexOf('// CALGRUPO_F27_20260617_STUDENTMODE_INTENTO_REAL_BACKEND',bundleStart);
assert.ok(helperStart>0&&helperEnd>helperStart&&bundleStart>0&&bundleEnd>bundleStart,
 'helper de envío final presente en fuente y bundle');
const helperSrc=source.slice(helperStart,helperEnd);
assert.equal(bundle.slice(bundleStart,bundleEnd),helperSrc,
 'el bundle no coincide con el helper de producción');
const finalize=vm.runInNewContext(helperSrc+';examWrittenFinalizeAfterPendingSave');
for(const token of [
  'saveInFlightRef.current = saveRequest;',
  'if (saveInFlightRef.current === saveRequest) saveInFlightRef.current = null;',
  'backend.onSave(JSON.parse(snapshot), { source })',
  'await examWrittenFinalizeAfterPendingSave(saveInFlightRef.current,',
  'if (sendingRef.current) return;'
]) {
  assert.ok(source.includes(token)&&bundle.includes(token),'protección de concurrencia: '+token);
}
let resolveSave;
const pending=new Promise(resolve=>{resolveSave=resolve;});
let answers={A1:'antes'};
const log=[];
const submitPromise=finalize(pending,()=>answers,async payload=>{
 log.push({at:'submit',payload});return {ok:true};
});
await Promise.resolve();
assert.equal(log.length,0,'el submit no puede adelantar al guardado pendiente');
answers={A1:'después',B2:'nueva'};
resolveSave({ok:true,saved:true});
const posted=await submitPromise;
assert.equal(posted.ok,true);
assert.deepEqual(JSON.parse(JSON.stringify(log)),[
 {at:'submit',payload:{A1:'después',B2:'nueva'}}
],'se envía snapshot FINAL, no el del autoguardado anterior');

const afterFailedSave=await finalize(Promise.reject(Error('offline')),
 ()=>({Q1:'última respuesta'}),async payload=>({ok:true,answers:payload}));
assert.deepEqual(JSON.parse(JSON.stringify(afterFailedSave)),
 {ok:true,answers:{Q1:'última respuesta'}},
 'un borrador fallido no evita enviar todas las respuestas');
const object={X:'a'};
const isolated=await finalize(null,()=>object,async copy=>copy);
assert.notEqual(isolated,object,'snapshot enviado debe ser una copia');
object.X='cambiado';
assert.equal(isolated.X,'a','el envío no comparte una referencia mutable');
console.log('F111 WRITTEN-FINALIZE-02 PASS: orden de POST, última respuesta, fallo borrador, copia inmutable');
