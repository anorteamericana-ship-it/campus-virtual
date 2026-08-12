#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const baseAssembler=path.join(root,'scripts/assemble_apps_script_cs21a211_unified.mjs');
const baseTarget=path.join(root,'apps_script_patches/99_CS21A211_ENGLISH_LAB_UNIFIED_COMPLETO.gs');
const patch=path.join(root,'apps_script_patches/99X_MEMORY_MATCH_LATENCY_SAFE_FAST_TURN_QA_CS21A212.gs');
const target=path.join(root,'apps_script_patches/99_CS21A212_ENGLISH_LAB_UNIFIED_COMPLETO.gs');

for(const file of [baseAssembler,patch]) assert.equal(fs.existsSync(file),true,`Falta ${path.relative(root,file)}`);
execFileSync(process.execPath,[baseAssembler],{cwd:root,stdio:'inherit'});
assert.equal(fs.existsSync(baseTarget),true,'No se generó el backend CS21A211 base.');

const previous=fs.readFileSync(baseTarget,'utf8').replace(/^\uFEFF/,'').trimEnd();
const extra=fs.readFileSync(patch,'utf8').replace(/^\uFEFF/,'').trimEnd();
const header=`// =============================================================================\n// CS21A212 · ENGLISH LAB LIVE · APPS SCRIPT QA UNIFICADO\n// Base exacta: CS21A211\n// Corrección P0: Memory Match 15 s iniciales + 15 s desde FIRST_REVEALED autoritativo\n// Mismatch: 3 s. Deadline nunca se reduce.\n// INSTALAR COMO UN SOLO ARCHIVO EN QA. NO USAR EN PRODUCCION.\n// =============================================================================\n`;
const content=[header,previous,'','// =============================================================================','// CAPA FINAL: MEMORY MATCH LATENCY SAFE FAST TURN CS21A212','// =============================================================================',extra,''].join('\n');
fs.writeFileSync(target,content,'utf8');

const check=fs.readFileSync(target,'utf8');
for(const marker of [
  "ELCS201_VERSION = 'CS21A201-CURRICULUM-SOURCE-1'",
  "CS21A211_MM_FAST_TURN_VERSION = 'CS21A211-MM-10S-3S-1'",
  "CS21A212_MM_VERSION = 'CS21A212-MM-LATENCY-SAFE-15S-ACK-1'",
  'CS21A212_MM_INITIAL_TURN_MS = 15000',
  'CS21A212_MM_MIN_SECOND_PICK_MS = 15000',
  'CS21A212_MM_PAIR_REVEAL_MS = 3000',
  'Math.max(currentEndMs || 0, requiredEndMs)',
  "if (phase !== 'FIRST_REVEALED')",
  '_cs21a192TransitionNeeded_.__cs21a212FirstRevealProtected = true',
  'function verificarMemoryMatchFastTurnCS21A212()'
]) assert.ok(check.includes(marker),`Falta marcador backend CS21A212: ${marker}`);

assert.ok(check.includes('function englishLabWordSearchClaimWordCS21A200'),'Word Search debe permanecer incluido.');
assert.ok(check.includes('function englishLabQuizTimeAnswerCS21A198'),'Quiz Time debe permanecer incluido.');
assert.ok(check.includes('function englishLabHangman'),'Hangman debe permanecer incluido.');

console.log(JSON.stringify({
  ok:true,
  version:'CS21A212-MM-LATENCY-SAFE-15S-ACK-1',
  previous_version:'CS21A211-MM-10S-3S-1',
  target:path.relative(root,target),
  install_mode:'ONE_COMPLETE_APPS_SCRIPT_QA_FILE',
  apps_script_change:'YES_QA_REQUIRED_AFTER_AUTOMATED_AND_HUMAN_VALIDATION',
  memory_match:{initial_turn_ms:15000,second_pick_from_server_reveal_ms:15000,mismatch_reveal_ms:3000,deadline_never_reduced:true},
  preserves:['SENTENCE_ORDER','HANGMAN','QUIZ_TIME','WORD_SEARCH'],
  bytes:Buffer.byteLength(check,'utf8')
},null,2));
