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
const fastTurnPatch=exists('apps_script_patches/99W_MEMORY_MATCH_FAST_TURN_QA_CS21A211.gs')
  ? read('apps_script_patches/99W_MEMORY_MATCH_FAST_TURN_QA_CS21A211.gs') : '';
const currentPackageWorkflowPath='.github/workflows/qa-cs21a200-final-candidate.yml';
const currentPackageWorkflow=exists(currentPackageWorkflowPath)?read(currentPackageWorkflowPath):'';

assert.match(live,/CS21A202: un rechazo de dominio con room_package/,'postLive real debe conservar room_package en rechazos de dominio');
assert.doesNotMatch(live,/!res\.ok \|\| !data \|\| data\.ok === false/,'postLive real no puede convertir todo ok:false en error de transporte');
assert.match(adapter,/const stateCandidate=candidate\.ok===false/,'adaptador debe normalizar envelope reconciliable');

assert.match(adapter,/const blocksInteraction=submissionAction!=='DISCOVER_CARD';/,'el adaptador debe distinguir discovery de mutaciones bloqueantes');
assert.match(adapter,/setBusy\(true\);if\(blocksInteraction\)setBlockingBusy\(true\);/,'una mutación bloqueante debe activar busy autoritativo síncronamente');
assert.match(adapter,/finally\{setBusy\(false\);if\(blocksInteraction\)setBlockingBusy\(false\);\}/,'busy autoritativo debe liberarse sólo al terminar la mutación bloqueante');
assert.match(adapter,/mutationBusy=\{blockingBusy\}/,'el hijo debe recibir el busy autoritativo semántico, no el busy genérico');
assert.match(adapter,/client_request_id:`\$\{actionId\}-R1`/,'retry de conflicto debe conservar action_id y variar solo client_request_id');
assert.match(classic,/const authoritativeBusy=!!\(props&&props\.mutationBusy\)/,'Memory Match debe bloquear por mutación autoritativa');
assert.match(classic,/if\(interactionEpochRef\.current===interactionEpoch\)\{\s*setSyncing\(false\);\s*pairPendingRef\.current=false;/s,'pairPendingRef sólo puede liberarse en el epoch vigente');

// CS21A211: la segunda carta debe salir a red sin esperar el ACK de la primera.
assert.match(classic,/const pairSubmission=\(\)=>send\(buildAction\('SUBMIT_PAIR'/,'segunda carta debe tener submit inmediato propio');
assert.match(classic,/Promise\.resolve\(pairSubmission\(\)\)/,'SUBMIT_PAIR debe arrancar inmediatamente al segundo click');
assert.doesNotMatch(classic,/Promise\.resolve\(revealPromiseRef\.current\)\s*\.then\(\(\)=>send\(buildAction\('SUBMIT_PAIR'/s,'segunda carta no puede quedar en cola detrás del ACK normal de DISCOVER_CARD');
assert.match(classic,/PRIMERA_CARTA_NO_SINCRONIZADA/,'sólo el reorder real de servidor puede caer al fallback del primer ACK');

// Sync visual: un request máximo en vuelo. En FIRST_REVEALED/MISMATCH_REVEAL
// no agregamos sleep cliente entre respuestas; para <=5 participantes el estado
// estable se sondea cada 250 ms para descubrir la primera carta rápidamente.
assert.match(adapter,/Object\.freeze\(\{maxPlayers:5,ms:250\}\)/,'QA/salas pequeñas deben descubrir cambios sin el antiguo piso de 550 ms');
assert.match(adapter,/const TRANSIENT_SETTLE_MS=0;/,'reveal transitorio no debe sumar espera artificial entre polls');
assert.match(adapter,/if\(phase==='FIRST_REVEALED'\|\|phase==='MISMATCH_REVEAL'\) return TRANSIENT_SETTLE_MS;/,'FIRST_REVEALED y MISMATCH_REVEAL deben repollear apenas termina el request previo');
assert.match(adapter,/if\(inFlight\)\{wakeRequested=true;return;\}/,'el sync rápido no puede superponer polls del mismo cliente');
assert.match(adapter,/data-live-current-poll-ms=\{currentPollMs\}/,'métrica de poll efectiva debe estar en el DOM real');
assert.match(adapter,/livePollMsForState:pollMsForState/,'API de poll por estado debe estar exportada');

assert.match(classic,/data-spectator-reveal-ms=\{revealRuleMs\}/,'duración spectator debe estar expuesta por la UI real');
assert.match(classic,/const turnSelectionMs=.*turn_selection_ms\|\|packageInput\.rules\.round_duration_ms.*\|\|15000/,'la UI debe resolver el turno desde el contrato autoritativo con fallback seguro de 15 s');
assert.match(classic,/data-turn-selection-ms=\{turnSelectionMs\}/,'la UI debe exponer la duración autoritativa realmente usada');
assert.match(classic,/Tenés \{turnSelectionSeconds\} segundos para escoger dos cartas/,'la explicación visible debe reflejar la duración autoritativa y no un literal obsoleto');
assert.match(classic,/pair_reveal_ms\|\|packageInput\.rules\.spectator_reveal_ms/,'la UI debe preferir el reveal canónico CS211');
assert.match(classic,/\|\|3000\)\|\|3000\)/,'fallback de reveal no puede volver a 8.5 s');
assert.match(classic,/se cierran en \$\{revealSeconds\}s/,'countdown de mismatch debe vivir en src');
assert.match(classic,/function Timer\(\{[^}]*remainingMs[^}]*durationMs[^}]*revealWaiting[^}]*\}\)/,'Timer debe recibir tiempo y estado de reveal aunque agregue parámetros nuevos');
assert.match(classic,/revealWaiting\?'Cartas'/,'Timer de reveal debe mostrar Cartas');
assert.match(classic,/revealWaiting\?`\$\{seconds\}s`/,'Timer de reveal debe mostrar segundos, no elipsis');
assert.match(classic,/data-reveal-waiting=\{revealWaiting\?'true':'false'\}/,'Timer debe exponer modo reveal');
assert.match(classic,/waiting=\{turnStartsIn>0\}/,'Timer debe recibir el estado de espera del turno');
assert.match(classic,/revealWaiting=\{waitingForFlipback\}/,'Timer debe separar reveal de mismatch del cambio de turno');
assert.match(classic,/countdownMs=\{turnStartsIn\}/,'countdown añadido por CS203 debe conservar fuente autoritativa');
assert.match(classicCss,/transition:transform \.20s cubic-bezier\(\.2,\.75,\.25,1\)/,'giro de carta debe conservar animación corta');

if(fastTurnPatch){
  assert.match(fastTurnPatch,/CS21A211_MM_TURN_SELECTION_MS = 10000/,'backend CS211 debe fijar 10 s por turno');
  assert.match(fastTurnPatch,/CS21A211_MM_PAIR_REVEAL_MS = 3000/,'backend CS211 debe fijar 3 s de mismatch');
  assert.match(fastTurnPatch,/first_card_does_not_extend_turn:true/,'primera carta no puede regalar tiempo adicional');
  assert.match(fastTurnPatch,/_cs21a194FirstRevealWindow_\.__cs21a211NoDeadlineExtension = true/,'hook histórico CS194 debe quedar neutralizado en runtime');
}

assert.match(preview,/CS21A202 fixture: el mismo contrato de reconciliación/,'fixture debe declarar contrato sin parche runtime');
assert.doesNotMatch(conflictTest,/original\.replace\(oldTransport,newTransport\)/,'el test no puede reescribir código bajo prueba');
assert.doesNotMatch(conflictTest,/oldTransport=/,'el test no puede conservar transport patch oculto');
assert.doesNotMatch(conflictTest,/newTransport=/,'el test no puede conservar transport patch oculto');
assert.match(historical196Patch,/function patchFrontend\(\)/,'CS196 histórico se conserva como evidencia de cómo nació el fix');
assert.match(historical197Patch,/function patchFrontend\(\)/,'CS197 patch histórico se conserva como evidencia');
assert.match(historical197Finalize,/const timerNew=/,'CS197 finalizer histórico conserva evidencia del Timer que antes sólo vivía en dist');

let modernPackageFromCleanCheckout='NOT_AVAILABLE_IN_PACKAGE';
if(currentPackageWorkflow){
  assert.match(currentPackageWorkflow,/rsync -a --exclude '.git'/,'el candidato moderno se construye desde checkout limpio');
  modernPackageFromCleanCheckout=true;
} else if(exists('VERSION.txt')) {
  const packagedVersion=read('VERSION.txt');
  assert.match(packagedVersion,/BACKEND_VERSION=CS21A(?:201|211)/,'el paquete debe declarar un backend English LAB conocido');
  assert.match(packagedVersion,/QA_ENVIRONMENT=qa/,'el paquete auto-verificable debe seguir marcado QA');
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
  version:'CS21A213-SOURCE-TRUTH-QA-1',
  source_of_truth:'src',
  transport_domain_reconciliation:true,
  adapter_state_candidate:true,
  mutation_busy_authoritative:true,
  mutation_busy_semantics:'DISCOVER_CARD_NON_BLOCKING__SUBMIT_PAIR_BLOCKING',
  epoch_scoped_pending_release:true,
  cs211_second_submit_starts_without_first_ack:true,
  cs211_transient_poll_added_delay_ms:0,
  cs211_small_room_stable_poll_ms:250,
  cs211_turn_selection_ms:10000,
  cs211_mismatch_reveal_ms:3000,
  cs211_first_card_extends_deadline:false,
  cs213_turn_selection_dynamic:true,
  cs213_turn_selection_fallback_ms:15000,
  browser_runtime_code_patch:false,
  browser_tests_scanned:browserFiles.length,
  historical_cs196_patch_preserved_as_evidence:true,
  historical_cs197_patch_preserved_as_evidence:true,
  historical_cs197_finalize_preserved_as_evidence:true,
  modern_package_from_clean_checkout:modernPackageFromCleanCheckout
},null,2));
