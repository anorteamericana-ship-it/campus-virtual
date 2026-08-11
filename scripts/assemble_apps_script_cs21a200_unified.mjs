#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const baseAssembler=path.join(root,'scripts/assemble_apps_script_cs21a198_hardened_complete.mjs');
const baseTarget=path.join(root,'apps_script_patches/99_CS21A198_QUIZ_TIME_B1U01_COMPLETO_FINAL.gs');
const wordSearch=path.join(root,'apps_script_unified/english_lab_word_search_module_cs21a200.gs');
const target=path.join(root,'apps_script_patches/99_CS21A200_ENGLISH_LAB_UNIFIED_COMPLETO.gs');

for(const file of [baseAssembler,wordSearch]) assert.equal(fs.existsSync(file),true,`Falta ${path.relative(root,file)}`);
execFileSync(process.execPath,[baseAssembler],{cwd:root,stdio:'inherit'});
assert.equal(fs.existsSync(baseTarget),true,'No se genero el completo CS21A198 base.');

const previous=fs.readFileSync(baseTarget,'utf8').replace(/^\uFEFF/,'').trimEnd();
const extra=fs.readFileSync(wordSearch,'utf8').replace(/^\uFEFF/,'').trimEnd();
const header=`// =============================================================================\n// CS21A200 · ENGLISH LAB LIVE · APPS SCRIPT QA UNIFICADO\n// Base acumulativa: Memory Match + Sentence Order + Hangman + Quiz Time CS21A198\n// Modulo nuevo: Word Search autoritativo CS21A200\n// INSTALAR COMO UN SOLO ARCHIVO EN QA. NO USAR EN PRODUCCION.\n// =============================================================================\n`;
const content=[header,previous,'','// =============================================================================','// MODULO UNIFICADO: WORD SEARCH CS21A200','// =============================================================================',extra,''].join('\n');
fs.writeFileSync(target,content,'utf8');

const check=fs.readFileSync(target,'utf8');
for(const marker of [
  "ELQ198_OPTION_BALANCE_VERSION = 'CS21A198-QUIZ-TIME-B1U01-2'",
  "ELWS200_VERSION = 'CS21A200-WORD-SEARCH-LIVE-1'",
  'function englishLabWordSearchClaimWordCS21A200',
  'function verificarWordSearchCS21A200',
  'first_claim_wins:true',
  'public_puzzle_hides_solutions:noLeak'
]) assert.ok(check.includes(marker),`Falta marcador backend unificado: ${marker}`);

console.log(JSON.stringify({
  ok:true,
  version:'CS21A200-WORD-SEARCH-LIVE-1',
  previous_version:'CS21A198-QUIZ-TIME-B1U01-2',
  target:path.relative(root,target),
  install_mode:'ONE_COMPLETE_APPS_SCRIPT_QA_FILE',
  includes:['MEMORY_MATCH','SENTENCE_ORDER','HANGMAN','QUIZ_TIME','WORD_SEARCH'],
  bytes:Buffer.byteLength(check,'utf8')
},null,2));
