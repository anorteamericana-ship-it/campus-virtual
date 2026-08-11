#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const baseAssembler=path.join(root,'scripts/assemble_apps_script_cs21a198_complete.mjs');
const baseTarget=path.join(root,'apps_script_patches/99_CS21A198_QUIZ_TIME_B1U01_COMPLETO.gs');
const hardening=path.join(root,'apps_script_patches/99U_QUIZ_TIME_OPTION_BALANCE_QA_CS21A198.gs');
const target=path.join(root,'apps_script_patches/99_CS21A198_QUIZ_TIME_B1U01_COMPLETO_FINAL.gs');

for(const file of [baseAssembler,hardening]) assert.equal(fs.existsSync(file),true,`Falta ${path.relative(root,file)}`);
execFileSync(process.execPath,[baseAssembler],{cwd:root,stdio:'inherit'});
assert.equal(fs.existsSync(baseTarget),true,'No se genero el completo CS21A198 base.');

const previous=fs.readFileSync(baseTarget,'utf8').replace(/^\uFEFF/,'').trimEnd();
const extra=fs.readFileSync(hardening,'utf8').replace(/^\uFEFF/,'').trimEnd();
const header=`// =============================================================================\n// CS21A198 · APPS SCRIPT QA COMPLETO FINAL · QUIZ TIME B1-U01\n// Base acumulativa: CS21A197 + 99T Quiz Time\n// Hardening: 99U balance de opciones\n// QA/STAGING SOLAMENTE. NO USAR EN PRODUCCION.\n// =============================================================================\n`;
const content=[header,previous,'','// =============================================================================','// BLOQUE FINAL: 99U_QUIZ_TIME_OPTION_BALANCE_QA_CS21A198.gs','// =============================================================================',extra,''].join('\n');
fs.writeFileSync(target,content,'utf8');

const check=fs.readFileSync(target,'utf8');
for(const marker of [
  "ELQ198_VERSION = 'CS21A198-QUIZ-TIME-B1U01-1'",
  "ELQ198_OPTION_BALANCE_VERSION = 'CS21A198-QUIZ-TIME-B1U01-2'",
  'function _elq198BalancedCorrectSlots_',
  'source_bank_correct_options_unchanged:true',
  'true_audio_listening_pending:true'
]) assert.ok(check.includes(marker),`Falta marcador CS21A198 final: ${marker}`);

console.log(JSON.stringify({
  ok:true,
  version:'CS21A198-QUIZ-TIME-B1U01-2',
  previous_version:'CS21A198-QUIZ-TIME-B1U01-1',
  target:path.relative(root,target),
  option_positions_balanced:true,
  source_bank_unchanged:true,
  listening_delivery_mode:'DIALOGUE_TEXT_QA',
  bytes:Buffer.byteLength(check,'utf8')
},null,2));
