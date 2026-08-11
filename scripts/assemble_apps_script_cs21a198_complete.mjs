#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const previousAssembler=path.join(root,'scripts/assemble_apps_script_cs21a197_complete.mjs');
const previousTarget=path.join(root,'apps_script_patches/99_CS21A197_MEMORY_MATCH_SPECTATOR_REVEAL_COMPLETO.gs');
const patch=path.join(root,'apps_script_patches/99T_QUIZ_TIME_CURRICULAR_QA_CS21A198.gs');
const target=path.join(root,'apps_script_patches/99_CS21A198_QUIZ_TIME_B1U01_COMPLETO.gs');

for(const file of [previousAssembler,patch]) assert.equal(fs.existsSync(file),true,`Falta ${path.relative(root,file)}`);
execFileSync(process.execPath,[previousAssembler],{cwd:root,stdio:'inherit'});
assert.equal(fs.existsSync(previousTarget),true,'No se genero el completo CS21A197.');

const previous=fs.readFileSync(previousTarget,'utf8').replace(/^\uFEFF/,'').trimEnd();
const extra=fs.readFileSync(patch,'utf8').replace(/^\uFEFF/,'').trimEnd();
const header=`// =============================================================================\n// CS21A198 · APPS SCRIPT QA COMPLETO · QUIZ TIME B1-U01\n// Base exacta: CS21A197-MM-SPECTATOR-REVEAL-1\n// Capa adicional: 99T_QUIZ_TIME_CURRICULAR_QA_CS21A198.gs\n// QA/STAGING SOLAMENTE. NO USAR EN PRODUCCION.\n// =============================================================================\n`;
const content=[header,previous,'','// =============================================================================','// BLOQUE 20/20: 99T_QUIZ_TIME_CURRICULAR_QA_CS21A198.gs','// =============================================================================',extra,''].join('\n');
fs.writeFileSync(target,content,'utf8');

const check=fs.readFileSync(target,'utf8');
for(const marker of [
  'CS21A198 · APPS SCRIPT QA COMPLETO · QUIZ TIME B1-U01',
  'BLOQUE 20/20: 99T_QUIZ_TIME_CURRICULAR_QA_CS21A198.gs',
  "ELQ198_VERSION = 'CS21A198-QUIZ-TIME-B1U01-1'",
  "ELQ198_UNIT_ID = 'B1-U01'",
  'englishLabQuizTimeCreateRoomCS21A198',
  'englishLabQuizTimeJoinRoomCS21A198',
  'englishLabQuizTimeAnswerCS21A198',
  'verificarQuizTimeCS21A198'
]) assert.ok(check.includes(marker),`Falta marcador CS21A198: ${marker}`);

assert.ok(check.includes("CS21A197_MM_SPECTATOR_REVEAL_VERSION = 'CS21A197-MM-SPECTATOR-REVEAL-1'"),'La base CS197 debe preservarse.');
assert.ok(check.indexOf('BLOQUE 20/20: 99T_QUIZ_TIME_CURRICULAR_QA_CS21A198.gs') > check.indexOf('CS21A197 · APPS SCRIPT QA COMPLETO'),'Quiz Time debe ser la ultima capa acumulativa.');

console.log(JSON.stringify({
  ok:true,
  version:'CS21A198-QUIZ-TIME-B1U01-1',
  base:'CS21A197-MM-SPECTATOR-REVEAL-1',
  target:path.relative(root,target),
  blocks:20,
  enabled_unit:'B1-U01',
  question_count:10,
  historical_games_preserved:true,
  bytes:Buffer.byteLength(check,'utf8'),
},null,2));
