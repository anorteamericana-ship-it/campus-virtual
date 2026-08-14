#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const previousAssembler=path.join(root,'scripts/assemble_apps_script_cs21a195_complete.mjs');
const previousTarget=path.join(root,'apps_script_patches/99_CS21A195_MEMORY_MATCH_CONVERGENCE_COMPLETO.gs');
const patch=path.join(root,'apps_script_patches/99R_MEMORY_MATCH_CONFLICT_RECONCILIATION_QA_CS21A196.gs');
const target=path.join(root,'apps_script_patches/99_CS21A196_MEMORY_MATCH_CONFLICT_RECONCILIATION_COMPLETO.gs');

for(const file of [previousAssembler,patch]) assert.equal(fs.existsSync(file),true,`Falta ${path.relative(root,file)}`);
execFileSync(process.execPath,[previousAssembler],{cwd:root,stdio:'inherit'});
assert.equal(fs.existsSync(previousTarget),true,'No se generó el completo CS21A195.');

// Los bloques históricos pueden conservar CRLF al ensamblarse en Windows.
// Normalizar antes de buscar los dos callsites hace el ensamblador reproducible
// sin alterar el Apps Script resultante.
let previous=fs.readFileSync(previousTarget,'utf8').replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').trimEnd();

const discoverOld=`      room = _cs21a189WritePackage_(found, room, current, pkg);\n\n      _elive180AppendEvent_`;
const discoverNew=`      room = _cs21a189WritePackage_(found, room, current, pkg);\n      // CS21A196: adoptar la revisión realmente escrita por 99O antes de responder.\n      if (typeof _cs21a196AlignWrittenPackage_ === 'function') {\n        pkg = _cs21a196AlignWrittenPackage_(room, pkg);\n        shared = pkg && pkg.shared_state || shared;\n        turnState = pkg && pkg.turn_state || turnState;\n      }\n\n      _elive180AppendEvent_`;
assert.ok(previous.includes(discoverOld),'No se encontró callsite DISCOVER_CARD CS189.');
previous=previous.replace(discoverOld,discoverNew);

const pairOld=`    room = _elive180SetCells_(found, patch);\n\n    _elive180AppendEvent_`;
const pairNew=`    room = _elive180SetCells_(found, patch);\n    // CS21A196: SUBMIT_PAIR también responde con la revisión persistida.\n    if (typeof _cs21a196AlignWrittenPackage_ === 'function') {\n      pkg = _cs21a196AlignWrittenPackage_(room, pkg);\n      shared = pkg && pkg.shared_state || shared;\n      nextTurn = pkg && pkg.turn_state || nextTurn;\n    }\n\n    _elive180AppendEvent_`;
assert.ok(previous.includes(pairOld),'No se encontró callsite SUBMIT_PAIR CS189.');
previous=previous.replace(pairOld,pairNew);

const extra=fs.readFileSync(patch,'utf8').replace(/^\uFEFF/,'').trimEnd();
const header=`// =============================================================================\n// CS21A196 · APPS SCRIPT QA COMPLETO · MEMORY MATCH CONFLICT RECONCILIATION\n// Base exacta: CS21A195-MM-CONVERGENCE-RELAY-1\n// Capa adicional: 99R_MEMORY_MATCH_CONFLICT_RECONCILIATION_QA_CS21A196.gs\n// QA/STAGING SOLAMENTE. NO USAR EN PRODUCCIÓN.\n// =============================================================================\n`;
const content=[header,previous,'','// =============================================================================','// BLOQUE 18/18: 99R_MEMORY_MATCH_CONFLICT_RECONCILIATION_QA_CS21A196.gs','// =============================================================================',extra,''].join('\n');
fs.writeFileSync(target,content,'utf8');

const check=fs.readFileSync(target,'utf8');
for(const marker of [
  'CS21A196 · APPS SCRIPT QA COMPLETO · MEMORY MATCH CONFLICT RECONCILIATION',
  "CS21A195_MM_CONVERGENCE_VERSION = 'CS21A195-MM-CONVERGENCE-RELAY-1'",
  'BLOQUE 18/18: 99R_MEMORY_MATCH_CONFLICT_RECONCILIATION_QA_CS21A196.gs',
  "CS21A196_MM_RECONCILIATION_VERSION = 'CS21A196-MM-CONFLICT-RECONCILIATION-1'",
  '_cs21a196AlignWrittenPackage_(room, pkg)',
  '__cs21a196RejectsNotShared',
]) assert.ok(check.includes(marker),`Falta marcador CS21A196: ${marker}`);
assert.ok((check.match(/_cs21a196AlignWrittenPackage_\(room, pkg\)/g)||[]).length>=2,'Faltan ambos callsites de alineación.');

console.log(JSON.stringify({
  ok:true,
  version:'CS21A196-MM-CONFLICT-RECONCILIATION-1',
  base:'CS21A195-MM-CONVERGENCE-RELAY-1',
  target:path.relative(root,target),
  blocks:18,
  response_alignment_calls:2,
  bytes:Buffer.byteLength(check,'utf8'),
},null,2));
