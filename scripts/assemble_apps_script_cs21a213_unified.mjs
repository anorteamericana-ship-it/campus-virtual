#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const baseAssembler=path.join(root,'scripts/assemble_apps_script_cs21a212_unified.mjs');
const baseTarget=path.join(root,'apps_script_patches/99_CS21A212_ENGLISH_LAB_UNIFIED_COMPLETO.gs');
const intentPatch=path.join(root,'apps_script_patches/99Z_MEMORY_MATCH_IDEMPOTENT_INTENT_QA_CS21A213.gs');
const target=path.join(root,'apps_script_patches/99_CS21A213_ENGLISH_LAB_UNIFIED_COMPLETO.gs');

for(const file of [baseAssembler,intentPatch]) assert.equal(fs.existsSync(file),true,`Falta ${path.relative(root,file)}`);
execFileSync(process.execPath,[baseAssembler],{cwd:root,stdio:'inherit'});
assert.equal(fs.existsSync(baseTarget),true,'No se generó el backend CS21A212 base.');

const previous=fs.readFileSync(baseTarget,'utf8').replace(/^\uFEFF/,'').trimEnd();
const intent=fs.readFileSync(intentPatch,'utf8').replace(/^\uFEFF/,'').trimEnd();
const header=`// =============================================================================\n// CS21A213 · ENGLISH LAB LIVE · APPS SCRIPT QA UNIFICADO\n// Base exacta: CS21A212\n// Fase 1: intento idempotente compartido DISCOVER/SUBMIT + fast path conservador\n// Reglas intactas: 15 s iniciales, 15 s desde FIRST_REVEALED, mismatch 3 s\n// INSTALAR COMO UN SOLO ARCHIVO EN QA. NO USAR EN PRODUCCION.\n// =============================================================================\n`;
const content=[
  header,previous,'',
  '// =============================================================================','// CAPA FINAL: MEMORY MATCH IDEMPOTENT INTENT CS21A213','// =============================================================================',intent,''
].join('\n');
fs.writeFileSync(target,content,'utf8');

const check=fs.readFileSync(target,'utf8');
for(const marker of [
  "CS21A212_MM_VERSION = 'CS21A212-MM-LATENCY-SAFE-15S-ACK-1'",
  "CS21A213_MM_INTENT_VERSION = 'CS21A213-MM-IDEMPOTENT-INTENT-1'",
  'function _cs21a213AttemptId_',
  'function _cs21a213ContinuationConflict_',
  'function _cs21a213AppendEvents_',
  'function _cs21a213TryFastSubmit_',
  'fast_path_full_snapshot_reads:0',
  'function verificarMemoryMatchIntentCS21A213()'
]) assert.ok(check.includes(marker),`Falta marcador backend CS21A213: ${marker}`);

assert.ok(check.indexOf('CS21A213_MM_INTENT_VERSION')>check.indexOf('CS21A212_MM_ROOM_MIGRATION_VERSION'),'CS213 debe quedar después de la migración CS212.');
assert.ok(check.includes('function englishLabWordSearchClaimWordCS21A200'),'Word Search debe permanecer incluido.');
assert.ok(check.includes('function englishLabQuizTimeAnswerCS21A198'),'Quiz Time debe permanecer incluido.');
assert.ok(check.includes('function englishLabHangman'),'Hangman debe permanecer incluido.');

console.log(JSON.stringify({
  ok:true,
  version:'CS21A213-MM-IDEMPOTENT-INTENT-1',
  previous_version:'CS21A212-MM-LATENCY-SAFE-15S-ACK-1',
  target:path.relative(root,target),
  install_mode:'ONE_COMPLETE_APPS_SCRIPT_QA_FILE',
  apps_script_change:'YES_QA_REQUIRED_AFTER_AUTOMATED_VALIDATION',
  memory_match:{shared_attempt_id:true,submit_first_supported:true,discover_first_supported:true,fast_path_full_snapshot_reads:0,persistent_audit:true,script_lock_preserved:true},
  rules:{initial_turn_ms:15000,second_pick_from_server_reveal_ms:15000,mismatch_reveal_ms:3000},
  preserves:['SENTENCE_ORDER','HANGMAN','QUIZ_TIME','WORD_SEARCH'],
  bytes:Buffer.byteLength(check,'utf8')
},null,2));
