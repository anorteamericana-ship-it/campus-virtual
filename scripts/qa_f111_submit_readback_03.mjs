import assert from 'node:assert/strict';
import fs from 'node:fs';
const modes=fs.readFileSync('src/examenes_modes.jsx','utf8');
const bundle=fs.readFileSync('src/examenes_bundle.jsx','utf8');
const app=fs.readFileSync('src/examenes_app.jsx','utf8');
const checks=[
 'submitUncertainRef.current=true;',
 "error:'submit_readback_required'",
 'data-f111-submit-readback="true"',
 'onClick={checkSubmission}',
 "status==='SUBMITTED'||status==='REVIEWED'",
 "status==='STARTED'",
 'autoSubmitRef.current = true;',
 'onCheckSubmission(backend.attemptId)'
];
for(const marker of checks){
 assert.ok(modes.includes(marker),'motor sin '+marker);
 assert.ok(bundle.includes(marker),'bundle sin '+marker);
}
const cbStart='  const checkWrittenSubmission = async (id) => {';
for(const s of [app,bundle]){
 const i=s.indexOf(cbStart),j=s.indexOf('  const heartbeatAttempt = async () => {',i);
 assert.ok(i>=0&&j>i,'callback de readback');
 const cb=s.slice(i,j);
 assert.ok(cb.includes("examPostLive('examGetStudentLivePanel'"));
 assert.ok(cb.includes("String(a.ATTEMPT_ID||'')===String(id)"));
 assert.ok(cb.includes("statuses.length!==1"));
 assert.ok(cb.includes("['STARTED','SUBMITTED','REVIEWED']"));
 assert.ok(!cb.includes("examSubmitAttempt")||cb.includes("// Solo lectura:"),'readback no debe reenviar');
 assert.ok(s.includes('onCheckSubmission:checkWrittenSubmission,'));
}
assert.ok(!modes.includes("setStage('sent');\n    return { ok:true };") ||
 modes.includes('if (backend && typeof backend.onSubmit'), 'sin cambiar modo demo');
console.log('F111 SUBMIT-READBACK-03 E1 PASS: ACK incierto, lectura por intento, no reenvío automático y paridad bundle');
