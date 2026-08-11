#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const previousAssembler=path.join(root,'scripts/assemble_apps_script_cs21a196_complete.mjs');
const previousTarget=path.join(root,'apps_script_patches/99_CS21A196_MEMORY_MATCH_CONFLICT_RECONCILIATION_COMPLETO.gs');
const patch=path.join(root,'apps_script_patches/99S_MEMORY_MATCH_SPECTATOR_REVEAL_QA_CS21A197.gs');
const target=path.join(root,'apps_script_patches/99_CS21A197_MEMORY_MATCH_SPECTATOR_REVEAL_COMPLETO.gs');

for(const file of [previousAssembler,patch]) assert.equal(fs.existsSync(file),true,`Falta ${path.relative(root,file)}`);
execFileSync(process.execPath,[previousAssembler],{cwd:root,stdio:'inherit'});
assert.equal(fs.existsSync(previousTarget),true,'No se genero el completo CS21A196.');

let previous=fs.readFileSync(previousTarget,'utf8').replace(/^\uFEFF/,'').trimEnd();

const timingOld=`    });\n\n    var durationMs = Number(pkg.rules && pkg.rules.round_duration_ms || 30000) || 30000;`;
const timingNew=`    });\n\n    // CS21A197: el reloj del resultado empieza DESPUES de persistir la respuesta.\n    // Asi una escritura lenta de ELIVE_ANSWERS no consume la ventana en la que\n    // docente y espectadores deben recibir y leer la segunda carta.\n    now = new Date();\n\n    var durationMs = Number(pkg.rules && pkg.rules.round_duration_ms || 30000) || 30000;`;
assert.ok(previous.includes(timingOld),'No se encontro el punto de commit temporal de SUBMIT_PAIR CS189.');
previous=previous.replace(timingOld,timingNew);

const revealOld=`      revealUntil = new Date(now.getTime() + CS21A189_MM_MISMATCH_REVEAL_MS);`;
const revealNew=`      revealUntil = new Date(now.getTime() + Math.max(\n        Number(CS21A189_MM_MISMATCH_REVEAL_MS || 0) || 0,\n        Number(CS21A197_MM_SPECTATOR_REVEAL_MS || 0) || 0\n      ));`;
assert.ok(previous.includes(revealOld),'No se encontro el calculo historico de revealUntil.');
previous=previous.replace(revealOld,revealNew);

const rulesOld=`    pkg.version = CS21A189_MM_CLASSIC_SYNC_VERSION;\n    pkg.turn_state = nextTurn;`;
const rulesNew=`    pkg.version = CS21A189_MM_CLASSIC_SYNC_VERSION;\n    pkg.rules = pkg.rules && typeof pkg.rules === 'object' ? pkg.rules : {};\n    pkg.rules.mismatch_reveal_ms = Math.max(\n      Number(CS21A189_MM_MISMATCH_REVEAL_MS || 0) || 0,\n      Number(CS21A197_MM_SPECTATOR_REVEAL_MS || 0) || 0\n    );\n    pkg.rules.spectator_reveal_ms = pkg.rules.mismatch_reveal_ms;\n    pkg.turn_state = nextTurn;`;
assert.ok(previous.includes(rulesOld),'No se encontro el contrato rules del paquete Memory Match.');
previous=previous.replace(rulesOld,rulesNew);

const extra=fs.readFileSync(patch,'utf8').replace(/^\uFEFF/,'').trimEnd();
const header=`// =============================================================================\n// CS21A197 · APPS SCRIPT QA COMPLETO · MEMORY MATCH SPECTATOR REVEAL\n// Base exacta: CS21A196-MM-CONFLICT-RECONCILIATION-1\n// Capa adicional: 99S_MEMORY_MATCH_SPECTATOR_REVEAL_QA_CS21A197.gs\n// QA/STAGING SOLAMENTE. NO USAR EN PRODUCCION.\n// =============================================================================\n`;
const content=[header,previous,'','// =============================================================================','// BLOQUE 19/19: 99S_MEMORY_MATCH_SPECTATOR_REVEAL_QA_CS21A197.gs','// =============================================================================',extra,''].join('\n');
fs.writeFileSync(target,content,'utf8');

const check=fs.readFileSync(target,'utf8');
for(const marker of [
  'CS21A197 · APPS SCRIPT QA COMPLETO · MEMORY MATCH SPECTATOR REVEAL',
  "CS21A196_MM_RECONCILIATION_VERSION = 'CS21A196-MM-CONFLICT-RECONCILIATION-1'",
  'BLOQUE 19/19: 99S_MEMORY_MATCH_SPECTATOR_REVEAL_QA_CS21A197.gs',
  "CS21A197_MM_SPECTATOR_REVEAL_VERSION = 'CS21A197-MM-SPECTATOR-REVEAL-1'",
  'CS21A197_MM_SPECTATOR_REVEAL_MS || 0',
  'now = new Date();',
  'pkg.rules.spectator_reveal_ms = pkg.rules.mismatch_reveal_ms;'
]) assert.ok(check.includes(marker),`Falta marcador CS21A197: ${marker}`);
assert.ok(check.indexOf('now = new Date();') < check.indexOf('var durationMs = Number(pkg.rules && pkg.rules.round_duration_ms || 30000) || 30000;'),'El refresh temporal debe ocurrir antes de calcular el turno/reveal.');
assert.match(check,/revealUntil = new Date\(now\.getTime\(\) \+ Math\.max\([\s\S]*CS21A197_MM_SPECTATOR_REVEAL_MS/,'El mismatch runtime debe usar el max historico/CS197.');

console.log(JSON.stringify({
  ok:true,
  version:'CS21A197-MM-SPECTATOR-REVEAL-1',
  base:'CS21A196-MM-CONFLICT-RECONCILIATION-1',
  target:path.relative(root,target),
  blocks:19,
  historical_reveal_ms:6000,
  spectator_reveal_ms:8500,
  historical_contract_preserved:true,
  reveal_deadline_commit_aligned:true,
  bytes:Buffer.byteLength(check,'utf8'),
},null,2));
