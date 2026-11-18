import assert from 'node:assert/strict';
import fs from 'node:fs';
const files=['src/examenes_modes.jsx','src/examenes_bundle.jsx'];
for(const file of files){
 const s=fs.readFileSync(file,'utf8');
 const start=s.indexOf('const doSubmit = useCallback(async (auto=false) => {');
 const end=s.indexOf('const handleSubmit = async () => {',start);
 assert.ok(start>=0&&end>start,file+' submit function exists');
 const part=s.slice(start,end);
 assert.match(part,/if \(!r \|\| r\.ok !== true \|\| \(backend\.attemptId && String\(r\.attempt_id \|\| ''\) !== String\(backend\.attemptId\)\)\)/);
 assert.ok(part.indexOf('if (!r || r.ok !== true')<part.indexOf("setStage('sent')"),'must validate ACK before sent state');
 assert.ok(part.includes('autoSubmitRef.current = false;')&&part.includes('return r;'),'retry path retained');
 assert.ok(part.includes('examWrittenFinalizeAfterPendingSave('),'wait in-flight save');
}
function accepted(r,id){return !!(r&&r.ok===true&&(!id||String(r.attempt_id||'')===String(id)));}
for(const r of [null,undefined,{}, {ok:false}, {ok:'true'}, {ok:true}, {ok:true,attempt_id:'OTHER'}])
 assert.equal(accepted(r,'ATT-1'),false,JSON.stringify(r));
assert.equal(accepted({ok:true,attempt_id:'ATT-1'},'ATT-1'),true);
console.log('F111 submit ACK E1 PASS: ambiguous responses fail closed, exact attempt required');
