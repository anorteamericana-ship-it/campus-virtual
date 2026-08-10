#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const historicalAssembler=path.join(root,'scripts/assemble_apps_script_cs21a183_complete.mjs');
const historicalTarget=path.join(root,'apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs');
const latencyPatch=path.join(root,'apps_script_patches/99P_MEMORY_MATCH_LATENCY_SAFE_QA_CS21A194.gs');
const target=path.join(root,'apps_script_patches/99_CS21A194_MEMORY_MATCH_LATENCY_SAFE_COMPLETO.gs');

for(const file of [historicalAssembler,latencyPatch]) assert.equal(fs.existsSync(file),true,`Falta ${path.relative(root,file)}`);

// Generar primero el artefacto histórico exacto CS21A192 con su propio ensamblador.
// No se altera ese contrato ni su ruta: CS21A194 vive en un archivo completo nuevo.
execFileSync(process.execPath,[historicalAssembler],{cwd:root,stdio:'inherit'});
assert.equal(fs.existsSync(historicalTarget),true,'No se generó el completo histórico CS21A192.');

const historical=fs.readFileSync(historicalTarget,'utf8').replace(/^\uFEFF/,'').trimEnd();
const patch=fs.readFileSync(latencyPatch,'utf8').replace(/^\uFEFF/,'').trimEnd();
const header=`// =============================================================================\n// CS21A194 · APPS SCRIPT QA COMPLETO · MEMORY MATCH LATENCY SAFE\n// Base exacta: 99_CS21A183_SENTENCE_ORDER_COMPLETO.gs generado por CS21A192\n// Capa adicional: 99P_MEMORY_MATCH_LATENCY_SAFE_QA_CS21A194.gs\n// QA/STAGING SOLAMENTE. NO USAR EN PRODUCCIÓN.\n// Copiar y pegar ESTE archivo completo solo cuando el gate CS21A194 indique instalar backend QA.\n// =============================================================================\n`;
const content=[header,historical,'','// =============================================================================','// BLOQUE 16/16: 99P_MEMORY_MATCH_LATENCY_SAFE_QA_CS21A194.gs','// =============================================================================',patch,''].join('\n');
fs.writeFileSync(target,content,'utf8');

const check=fs.readFileSync(target,'utf8');
for(const marker of [
  'CS21A194 · APPS SCRIPT QA COMPLETO · MEMORY MATCH LATENCY SAFE',
  'CS21A183-CS21A192 · APPS SCRIPT QA COMPLETO',
  "CS21A192_MM_SYNC_VERSION = 'CS21A192-MM-CONSISTENCY-2'",
  'BLOQUE 15/15: 99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs',
  'BLOQUE 16/16: 99P_MEMORY_MATCH_LATENCY_SAFE_QA_CS21A194.gs',
  "CS21A194_MM_LATENCY_SAFE_VERSION = 'CS21A194-MM-LATENCY-SAFE-1'",
  'CS21A194_MM_MIN_SECOND_PICK_MS = 30000',
  '_cs21a189WritePackage_.__cs21a194LatencySafe = true',
  'first_reveal_deadline_extended_atomically:true',
  'first_reveal_deadline_extension_idempotent:true',
]) assert.ok(check.includes(marker),`Falta marcador CS21A194: ${marker}`);

assert.ok(check.indexOf("CS21A192_MM_SYNC_VERSION = 'CS21A192-MM-CONSISTENCY-2'")<check.indexOf("CS21A194_MM_LATENCY_SAFE_VERSION = 'CS21A194-MM-LATENCY-SAFE-1'"),'99P no quedó después de 99O.');

console.log(JSON.stringify({
  ok:true,
  version:'CS21A194-MM-LATENCY-SAFE-1',
  base:'CS21A192-MM-CONSISTENCY-2',
  target:path.relative(root,target),
  historical_target:path.relative(root,historicalTarget),
  min_second_pick_ms:30000,
  historical_complete_preserved:true,
  bytes:Buffer.byteLength(check,'utf8'),
},null,2));
