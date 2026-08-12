#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const exists=relative=>fs.existsSync(path.join(root,relative));

const live=read('src/english_lab_live.jsx');
const adapter=read('src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx');
const classic=read('src/english_lab_games/memory_match_classic_sync_cs21a189.jsx');
const classicCss=read('styles/english_lab_memory_match_classic_sync_cs21a189.css');
const preview=read('src/english_lab_games/memory_match_authoritative_sync_preview_cs21a192.html');
const conflictTest=read('scripts/test_memory_match_conflict_reconciliation_browser_cs21a196.mjs');
const historical196Patch=read('scripts/patch_qa_package_cs21a196.mjs');
const historical197Patch=read('scripts/patch_qa_package_cs21a197.mjs');
const historical197Finalize=read('scripts/finalize_qa_package_cs21a197.mjs');
const currentPackageWorkflowPath='.github/workflows/qa-cs21a200-final-candidate.yml';
const currentPackageWorkflow=exists(currentPackageWorkflowPath)?read(currentPackageWorkflowPath):'';

assert.match(live,/CS21A202: un rechazo de dominio con room_package/,'postLive real debe conservar room_package en rechazos de dominio');
assert.doesNotMatch(live,/!res\.ok \|\| !data \|\| data\.ok === false/,'postLive real no puede convertir todo ok:false en error de transporte');
assert.match(adapter,/const stateCandidate=candidate\.ok===false/,'adaptador debe normalizar envelope reconciliable');

// No fijar el gate a un nombre histórico de variable. La semántica vigente es:
// DISCOVER_CARD puede seguir interactuando; SUBMIT_PAIR y demás mutaciones autoritativas bloquean.
assert.match(adapter,/const blocksInteraction=submissionAction!=='DISCOVER_CARD';/,'el adaptador debe distinguir discovery de mutaciones bloqueantes');
assert.match(adapter,/setBusy\(true\);if\(blocksInteraction\)setBlockingBusy\(true\);/,'una mutación bloqueante debe activar busy autoritativo síncronamente');
assert.match(adapter,/finally\{setBusy\(false\);if\(blocksInteraction\)setBlockingBusy\(false\);\}/,'busy autoritativo debe liberarse sólo al terminar la mutación bloqueante');
assert.match(adapter,/mutationBusy=\{blockingBusy\}/,'el hijo debe recibir el busy autoritativo semántico, no el busy genérico');

assert.match(adapter,/client_request_id:`\$\{actionId\}-R1`/,'retry de conflicto debe conservar action_id y variar solo client_request_id');
assert.match(classic,/const authoritativeBusy=!!\(props&&props\.mutationBusy\)/,'Memory Match debe bloquear por mutación autoritativa');
assert.match(classic,/if\(interactionEpochRef\.current===interactionEpoch\)\{\s*setSyncing\(false\);\s*pairPendingRef\.current=false;/s,'pairPendingRef sólo puede liberarse en el epoch vigente');

// CS21A197 también había quedado sólo en dist/. CS202 exige que TODAS sus piezas frontend vivan en src.
assert.match(adapter,/function pollMsForState\(state\)/,'poll transitorio CS197 debe vivir en src');
assert.match(adapter,/return Math\.max\(250,Math\.round\(normal\/2\)\)/,'ráfaga debe usar mitad del tier con piso 250 ms');
assert.match(adapter,/data-live-current-poll-ms=\{currentPollMs\}/,'métrica de poll efectiva debe estar en el DOM real');
assert.match(adapter,/livePollMsForState:pollMsForState/,'API de poll por estado debe estar exportada');
assert.match(classic,/data-spectator-reveal-ms=\{revealRuleMs\}/,'duración spectator debe estar expuesta por la UI real');
assert.match(classic,/se cierran en \$\{revealSeconds\}s/,'countdown de mismatch debe vivir en src');
assert.match(classic,/function Timer\(\{remainingMs,durationMs,waiting,syncingTurn,revealWaiting\}\)/,'Timer final CS197 debe existir en src');
assert.match(classic,/const label=revealWaiting\?'Cartas'/,'Timer de reveal debe mostrar Cartas');
assert.match(classic,/const value=revealWaiting\?`\$\{seconds\}s`/,'Timer de reveal debe mostrar segundos, no elipsis');
assert.match(classic,/data-reveal-waiting=\{revealWaiting\?'true':'false'\}/,'Timer debe exponer modo reveal');
assert.match(classic,/waiting=\{turnStartsIn>0\} revealWaiting=\{waitingForFlipback\}/,'mismatch y cambio de turno deben ser estados visuales distintos');
assert.match(classicCss,/transition:transform \.20s cubic-bezier\(\.2,\.75,\.25,1\)/,'giro CS197 de 200 ms debe vivir en CSS source');

assert.match(preview,/CS21A202 fixture: el mismo contrato de reconciliación/,'fixture debe declarar contrato sin parche runtime');
assert.doesNotMatch(conflictTest,/original\.replace\(oldTransport,newTransport\)/,'el test no puede reescribir código bajo prueba');
assert.doesNotMatch(conflictTest,/oldTransport=/,'el test no puede conservar transport patch oculto');
assert.doesNotMatch(conflictTest,/newTransport=/,'el test no puede conservar transport patch oculto');
assert.match(historical196Patch,/function patchFrontend\(\)/,'CS196 histórico se conserva como evidencia de cómo nació el fix');
assert.match(historical197Patch,/function patchFrontend\(\)/,'CS197 patch histórico se conserva como evidencia');
assert.match(historical197Finalize,/const timerNew=/,'CS197 finalizer histórico conserva evidencia del Timer que antes sólo vivía en dist');

// En checkout Git validamos también el workflow de empaquetado. En el ZIP final .github se excluye
// deliberadamente, por lo que el gate debe seguir siendo ejecutable y verificar el source real.
let modernPackageFromCleanCheckout='NOT_AVAILABLE_IN_PACKAGE';
if(currentPackageWorkflow){
  assert.match(currentPackageWorkflow,/rsync -a --exclude '.git'/,'el candidato moderno se construye desde checkout limpio');
  modernPackageFromCleanCheckout=true;
} else if(exists('VERSION.txt')) {
  const packagedVersion=read('VERSION.txt');
  assert.match(packagedVersion,/BACKEND_VERSION=CS21A201/,'el paquete debe declarar backend CS201');
  assert.match(packagedVersion,/APPS_SCRIPT_CHANGE=NO/,'el paquete no puede declarar cambios Apps Script');
  modernPackageFromCleanCheckout='WORKFLOW_EXCLUDED_PACKAGE_METADATA_OK';
}

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
  version:'CS21A202-SOURCE-TRUTH-QA-4',
  source_of_truth:'src',
  transport_domain_reconciliation:true,
  adapter_state_candidate:true,
  mutation_busy_authoritative:true,
  mutation_busy_semantics:'DISCOVER_CARD_NON_BLOCKING__SUBMIT_PAIR_BLOCKING',
  epoch_scoped_pending_release:true,
  cs197_transient_poll_recovered:true,
  cs197_spectator_countdown_recovered:true,
  cs197_reveal_timer_recovered:true,
  cs197_flip_animation_recovered:true,
  browser_runtime_code_patch:false,
  browser_tests_scanned:browserFiles.length,
  historical_cs196_patch_preserved_as_evidence:true,
  historical_cs197_patch_preserved_as_evidence:true,
  historical_cs197_finalize_preserved_as_evidence:true,
  modern_package_from_clean_checkout:modernPackageFromCleanCheckout
},null,2));
