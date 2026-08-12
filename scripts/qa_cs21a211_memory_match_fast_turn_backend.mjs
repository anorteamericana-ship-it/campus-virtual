#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const assembler=path.join(root,'scripts/assemble_apps_script_cs21a211_unified.mjs');
const patch=path.join(root,'apps_script_patches/99W_MEMORY_MATCH_FAST_TURN_QA_CS21A211.gs');
const target=path.join(root,'apps_script_patches/99_CS21A211_ENGLISH_LAB_UNIFIED_COMPLETO.gs');
const classic=fs.readFileSync(path.join(root,'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx'),'utf8');
const adapter=fs.readFileSync(path.join(root,'src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx'),'utf8');

for(const file of [assembler,patch]) assert.equal(fs.existsSync(file),true,`Falta ${path.relative(root,file)}`);
execFileSync(process.execPath,[assembler],{cwd:root,stdio:'inherit'});
assert.equal(fs.existsSync(target),true,'No se generó 99_CS21A211_ENGLISH_LAB_UNIFIED_COMPLETO.gs');
const backend=fs.readFileSync(target,'utf8');

assert.match(backend,/CS21A211_MM_TURN_SELECTION_MS = 10000/);
assert.match(backend,/CS21A211_MM_PAIR_REVEAL_MS = 3000/);
assert.match(backend,/rules\.round_duration_ms = CS21A211_MM_TURN_SELECTION_MS/);
assert.match(backend,/rules\.mismatch_reveal_ms = CS21A211_MM_PAIR_REVEAL_MS/);
assert.match(backend,/revealUntil = new Date\(now\.getTime\(\) \+ CS21A211_MM_PAIR_REVEAL_MS\);/);
assert.match(backend,/_cs21a194FirstRevealWindow_\.__cs21a211NoDeadlineExtension = true/);
assert.match(backend,/targetEndMs = startMs \? startMs \+ CS21A211_MM_TURN_SELECTION_MS : currentEndMs/);
assert.match(backend,/_cs21a186MmContinueSamePlayer_\(turnState, now, durationMs, 'PAIR_MATCHED_CONTINUE'\)/,'MATCH debe conservar jugador y arrancar deadline nuevo desde resolución');
assert.match(backend,/_elive176NextTurn_\(turnState, revealUntil, durationMs, 'PAIR_MISMATCH_AFTER_FLIPBACK'\)/,'MISMATCH debe arrancar siguiente turno exactamente al finalizar reveal');
assert.match(backend,/_elive176NextTurn_\(previousTurn, now, durationMs, 'TURN_TIMEOUT'\)/,'timeout debe rotar al alcanzar deadline de 10 s');
assert.doesNotMatch(backend,/revealUntil = new Date\(now\.getTime\(\) \+ Math\.max\([\s\S]{0,300}CS21A197_MM_SPECTATOR_REVEAL_MS/,'runtime CS211 no puede conservar max histórico 6s/8.5s');

assert.match(classic,/Promise\.resolve\(pairSubmission\(\)\)/,'segunda carta debe iniciar SUBMIT_PAIR sin esperar primer ACK');
assert.match(classic,/PRIMERA_CARTA_NO_SINCRONIZADA/,'reorder real conserva fallback seguro');
assert.match(classic,/\|\|3000\)\|\|3000\)/,'UI debe tener fallback 3 s');
assert.match(adapter,/const TRANSIENT_SETTLE_MS=0;/,'reveal transitorio no debe sumar sleep');
assert.match(adapter,/Object\.freeze\(\{maxPlayers:5,ms:250\}\)/,'salas pequeñas usan poll estable 250 ms');
assert.match(adapter,/if\(inFlight\)\{wakeRequested=true;return;\}/,'sync rápido debe mantener máximo un poll en vuelo');

for(const marker of [
  "ELCS201_VERSION = 'CS21A201-CURRICULUM-SOURCE-1'",
  "ELWS200_VERSION = 'CS21A200-WORD-SEARCH-LIVE-1'",
  "ELQ198_OPTION_BALANCE_VERSION = 'CS21A198-QUIZ-TIME-B1U01-2'",
  'function englishLabWordSearchClaimWordCS21A200',
  'function englishLabQuizTimeAnswerCS21A198'
]) assert.ok(backend.includes(marker),`CS211 perdió componente del stack: ${marker}`);

const tmp='/tmp/cs21a211-backend-check.js';
fs.writeFileSync(tmp,backend,'utf8');
execFileSync(process.execPath,['--check',tmp],{stdio:'inherit'});

const output={
  ok:true,
  version:'CS21A211-MM-10S-3S-1',
  backend:path.relative(root,target),
  turnSelectionMs:10000,
  mismatchRevealMs:3000,
  firstCardExtendsDeadline:false,
  matchStartsFreshTurnImmediately:true,
  mismatchStartsNextTurnAtRevealDeadline:true,
  timeoutRotatesAtSelectionDeadline:true,
  secondSubmitWaitsForFirstAck:false,
  transientClientAddedDelayMs:0,
  onePollInFlightPerClient:true,
  preserves:['SENTENCE_ORDER','HANGMAN','QUIZ_TIME','WORD_SEARCH'],
};
console.log(JSON.stringify(output,null,2));
