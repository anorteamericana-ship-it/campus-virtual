#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const baseAssembler=path.join(root,'scripts/assemble_apps_script_cs21a200_unified.mjs');
const baseTarget=path.join(root,'apps_script_patches/99_CS21A200_ENGLISH_LAB_UNIFIED_COMPLETO.gs');
const sourceRouter=path.join(root,'apps_script_patches/99V_ENGLISH_LAB_CURRICULUM_SOURCE_QA_CS21A201.gs');
const target=path.join(root,'apps_script_patches/99_CS21A201_ENGLISH_LAB_UNIFIED_COMPLETO.gs');

for(const file of [baseAssembler,sourceRouter]) assert.equal(fs.existsSync(file),true,`Falta ${path.relative(root,file)}`);
execFileSync(process.execPath,[baseAssembler],{cwd:root,stdio:'inherit'});
assert.equal(fs.existsSync(baseTarget),true,'No se genero el completo CS21A200 base.');

const previous=fs.readFileSync(baseTarget,'utf8').replace(/^\uFEFF/,'').trimEnd();
const extra=fs.readFileSync(sourceRouter,'utf8').replace(/^\uFEFF/,'').trimEnd();
const header=`// =============================================================================\n// CS21A201 · ENGLISH LAB LIVE · APPS SCRIPT QA UNIFICADO\n// Base acumulativa: CS21A200 (Memory Match + Sentence Order + Hangman + Quiz + Word Search)\n// Correccion autenticada: Quiz Time y Word Search leen currículo por QA_STAGING_MASTER_ID\n// Reutiliza _elso183ApolloRows_ de CS21A183; no duplica SpreadsheetApp ni copia hojas.\n// INSTALAR COMO UN SOLO ARCHIVO EN QA. NO USAR EN PRODUCCION.\n// =============================================================================\n`;
const content=[header,previous,'','// =============================================================================','// CAPA FINAL: ROUTER CURRICULAR CS21A201','// =============================================================================',extra,''].join('\n');
fs.writeFileSync(target,content,'utf8');

const check=fs.readFileSync(target,'utf8');
for(const marker of [
  "ELWS200_VERSION = 'CS21A200-WORD-SEARCH-LIVE-1'",
  "ELCS201_VERSION = 'CS21A201-CURRICULUM-SOURCE-1'",
  "ELCS201_SOURCE = 'QA_STAGING_MASTER_ID'",
  'function _elso183ApolloRows_',
  'function _elcs201ApolloRows_',
  'operational_sheet_dependency_removed:true'
]) assert.ok(check.includes(marker),`Falta marcador backend CS21A201: ${marker}`);

const finalBlock=check.slice(check.lastIndexOf('// CAPA FINAL: ROUTER CURRICULAR CS21A201'));
assert.equal(finalBlock.includes('SpreadsheetApp.openById'),false,'La capa CS201 no debe abrir spreadsheets por su cuenta.');
assert.ok(finalBlock.includes('_elso183ApolloRows_'),'La capa CS201 debe reutilizar el lector CS183.');

console.log(JSON.stringify({
  ok:true,
  version:'CS21A201-CURRICULUM-SOURCE-1',
  previous_version:'CS21A200-WORD-SEARCH-LIVE-1',
  target:path.relative(root,target),
  install_mode:'ONE_COMPLETE_APPS_SCRIPT_QA_FILE',
  curriculum_source:'QA_STAGING_MASTER_ID',
  reused_reader:'_elso183ApolloRows_',
  includes:['MEMORY_MATCH','SENTENCE_ORDER','HANGMAN','QUIZ_TIME','WORD_SEARCH'],
  bytes:Buffer.byteLength(check,'utf8')
},null,2));
