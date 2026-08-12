#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const baseAssembler=path.join(root,'scripts/assemble_apps_script_cs21a201_unified.mjs');
const baseTarget=path.join(root,'apps_script_patches/99_CS21A201_ENGLISH_LAB_UNIFIED_COMPLETO.gs');
const patch=path.join(root,'apps_script_patches/99W_MEMORY_MATCH_FAST_TURN_QA_CS21A211.gs');
const target=path.join(root,'apps_script_patches/99_CS21A211_ENGLISH_LAB_UNIFIED_COMPLETO.gs');

for(const file of [baseAssembler,patch]) assert.equal(fs.existsSync(file),true,`Falta ${path.relative(root,file)}`);
execFileSync(process.execPath,[baseAssembler],{cwd:root,stdio:'inherit'});
assert.equal(fs.existsSync(baseTarget),true,'No se generó el backend CS21A201 base.');

let previous=fs.readFileSync(baseTarget,'utf8').replace(/^\uFEFF/,'').trimEnd();
const extra=fs.readFileSync(patch,'utf8').replace(/^\uFEFF/,'').trimEnd();

const revealPattern=/revealUntil = new Date\(now\.getTime\(\) \+ Math\.max\(\s*Number\(CS21A189_MM_MISMATCH_REVEAL_MS \|\| 0\) \|\| 0,\s*Number\(CS21A197_MM_SPECTATOR_REVEAL_MS \|\| 0\) \|\| 0\s*\)\);/g;
const rulesPattern=/pkg\.rules\.mismatch_reveal_ms = Math\.max\(\s*Number\(CS21A189_MM_MISMATCH_REVEAL_MS \|\| 0\) \|\| 0,\s*Number\(CS21A197_MM_SPECTATOR_REVEAL_MS \|\| 0\) \|\| 0\s*\);\s*pkg\.rules\.spectator_reveal_ms = pkg\.rules\.mismatch_reveal_ms;/g;

const revealMatches=previous.match(revealPattern)||[];
const rulesMatches=previous.match(rulesPattern)||[];
assert.equal(revealMatches.length,1,'CS21A211 esperaba exactamente un cálculo runtime de reveal mismatch CS197.');
assert.equal(rulesMatches.length,1,'CS21A211 esperaba exactamente un bloque de reglas mismatch/spectator CS197.');

previous=previous.replace(revealPattern,'revealUntil = new Date(now.getTime() + CS21A211_MM_PAIR_REVEAL_MS);');
previous=previous.replace(rulesPattern,`pkg.rules.mismatch_reveal_ms = CS21A211_MM_PAIR_REVEAL_MS;\n    pkg.rules.spectator_reveal_ms = CS21A211_MM_PAIR_REVEAL_MS;\n    pkg.rules.pair_reveal_ms = CS21A211_MM_PAIR_REVEAL_MS;`);

const header=`// =============================================================================\n// CS21A211 · ENGLISH LAB LIVE · APPS SCRIPT QA UNIFICADO\n// Base exacta: CS21A201 (cinco juegos)\n// Cambio único de producto: Memory Match 10 s selección / 3 s mismatch reveal\n// INSTALAR COMO UN SOLO ARCHIVO EN QA. NO USAR EN PRODUCCION.\n// =============================================================================\n`;
const content=[header,previous,'','// =============================================================================','// CAPA FINAL: MEMORY MATCH FAST TURN CS21A211','// =============================================================================',extra,''].join('\n');
fs.writeFileSync(target,content,'utf8');

const check=fs.readFileSync(target,'utf8');
for(const marker of [
  "ELCS201_VERSION = 'CS21A201-CURRICULUM-SOURCE-1'",
  "ELWS200_VERSION = 'CS21A200-WORD-SEARCH-LIVE-1'",
  "ELQ198_OPTION_BALANCE_VERSION = 'CS21A198-QUIZ-TIME-B1U01-2'",
  "CS21A211_MM_FAST_TURN_VERSION = 'CS21A211-MM-10S-3S-1'",
  'CS21A211_MM_TURN_SELECTION_MS = 10000',
  'CS21A211_MM_PAIR_REVEAL_MS = 3000',
  'revealUntil = new Date(now.getTime() + CS21A211_MM_PAIR_REVEAL_MS);',
  'pkg.rules.mismatch_reveal_ms = CS21A211_MM_PAIR_REVEAL_MS;',
  '_cs21a194FirstRevealWindow_.__cs21a211NoDeadlineExtension = true',
  'function verificarMemoryMatchFastTurnCS21A211()'
]) assert.ok(check.includes(marker),`Falta marcador backend CS21A211: ${marker}`);

assert.equal(revealPattern.test(check),false,'No puede sobrevivir el reveal runtime max(6000,8500) en CS21A211.');
assert.ok(check.includes('function englishLabWordSearchClaimWordCS21A200'),'Word Search debe permanecer incluido.');
assert.ok(check.includes('function englishLabQuizTimeAnswerCS21A198'),'Quiz Time debe permanecer incluido.');
assert.ok(check.includes('function englishLabHangman'),'Hangman debe permanecer incluido.');

console.log(JSON.stringify({
  ok:true,
  version:'CS21A211-MM-10S-3S-1',
  previous_version:'CS21A201-CURRICULUM-SOURCE-1',
  target:path.relative(root,target),
  install_mode:'ONE_COMPLETE_APPS_SCRIPT_QA_FILE',
  apps_script_change:'YES_QA_REQUIRED_FOR_NEW_MEMORY_CONTRACT',
  memory_match:{turn_selection_ms:10000,mismatch_reveal_ms:3000,first_card_extends_turn:false},
  preserves:['SENTENCE_ORDER','HANGMAN','QUIZ_TIME','WORD_SEARCH'],
  bytes:Buffer.byteLength(check,'utf8')
},null,2));
