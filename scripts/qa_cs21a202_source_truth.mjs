#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

const live=read('src/english_lab_live.jsx');
const adapter=read('src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx');
const classic=read('src/english_lab_games/memory_match_classic_sync_cs21a189.jsx');
const preview=read('src/english_lab_games/memory_match_authoritative_sync_preview_cs21a192.html');
const conflictTest=read('scripts/test_memory_match_conflict_reconciliation_browser_cs21a196.mjs');
const historicalPatch=read('scripts/patch_qa_package_cs21a196.mjs');
const currentPackageWorkflow=read('.github/workflows/qa-cs21a200-final-candidate.yml');

assert.match(live,/CS21A202: un rechazo de dominio con room_package/,'postLive real debe conservar room_package en rechazos de dominio');
assert.doesNotMatch(live,/!res\.ok \|\| !data \|\| data\.ok === false/,'postLive real no puede convertir todo ok:false en error de transporte');
assert.match(adapter,/const stateCandidate=candidate\.ok===false/,'adaptador debe normalizar envelope reconciliable');
assert.match(adapter,/mutationBusy=\{busy\}/,'busy autoritativo debe llegar al juego');
assert.match(adapter,/client_request_id:`\$\{actionId\}-R1`/,'retry de conflicto debe conservar action_id y variar solo client_request_id');
assert.match(classic,/const authoritativeBusy=!!\(props&&props\.mutationBusy\)/,'Memory Match debe bloquear por mutación autoritativa');
assert.match(classic,/if\(interactionEpochRef\.current===interactionEpoch\)\{\s*setSyncing\(false\);\s*pairPendingRef\.current=false;/s,'pairPendingRef sólo puede liberarse en el epoch vigente');
assert.match(preview,/CS21A202 fixture: el mismo contrato de reconciliación/,'fixture debe declarar contrato sin parche runtime');
assert.doesNotMatch(conflictTest,/original\.replace\(oldTransport,newTransport\)/,'el test no puede reescribir código bajo prueba');
assert.doesNotMatch(conflictTest,/oldTransport=/,'el test no puede conservar transport patch oculto');
assert.doesNotMatch(conflictTest,/newTransport=/,'el test no puede conservar transport patch oculto');
assert.match(historicalPatch,/function patchFrontend\(\)/,'CS196 histórico se conserva como evidencia de cómo nació el fix');
assert.match(currentPackageWorkflow,/rsync -a --exclude '.git'/,'el candidato moderno se construye desde checkout limpio');

const browserFiles=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const abs=path.join(dir,entry.name);
    if(entry.isDirectory())walk(abs);
    else if(/\.mjs$/i.test(entry.name)&&/browser/i.test(entry.name))browserFiles.push(abs);
  }
}
walk(path.join(root,'scripts'));
const runtimePatchCandidates=[];
for(const file of browserFiles){
  const source=fs.readFileSync(file,'utf8');
  if(/route\.fulfill[\s\S]{0,1200}(?:original\.)?replace\(/.test(source)||/body\s*:\s*[^,\n]*\.replace\(/.test(source)){
    runtimePatchCandidates.push(path.relative(root,file).split(path.sep).join('/'));
  }
}
assert.deepEqual(runtimePatchCandidates,[],'Ningún browser test debe reemplazar código/HTML servido para fabricar el comportamiento bajo prueba');

console.log(JSON.stringify({
  ok:true,
  version:'CS21A202-SOURCE-TRUTH-QA-1',
  source_of_truth:'src',
  transport_domain_reconciliation:true,
  adapter_state_candidate:true,
  mutation_busy_authoritative:true,
  epoch_scoped_pending_release:true,
  browser_runtime_code_patch:false,
  browser_tests_scanned:browserFiles.length,
  historical_cs196_patch_preserved_as_evidence:true,
  modern_package_from_clean_checkout:true
},null,2));
