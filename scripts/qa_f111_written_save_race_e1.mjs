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
