#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const previousAssembler=path.join(root,'scripts/assemble_apps_script_cs21a194_complete.mjs');
const previousTarget=path.join(root,'apps_script_patches/99_CS21A194_MEMORY_MATCH_LATENCY_SAFE_COMPLETO.gs');
const relayPatch=path.join(root,'apps_script_patches/99Q_MEMORY_MATCH_CONVERGENCE_RELAY_QA_CS21A195.gs');
const target=path.join(root,'apps_script_patches/99_CS21A195_MEMORY_MATCH_CONVERGENCE_COMPLETO.gs');

for(const file of [previousAssembler,relayPatch]) assert.equal(fs.existsSync(file),true,`Falta ${path.relative(root,file)}`);
execFileSync(process.execPath,[previousAssembler],{cwd:root,stdio:'inherit'});
assert.equal(fs.existsSync(previousTarget),true,'No se generó el completo CS21A194.');

const previous=fs.readFileSync(previousTarget,'utf8').replace(/^\uFEFF/,'').trimEnd();
const patch=fs.readFileSync(relayPatch,'utf8').replace(/^\uFEFF/,'').trimEnd();
const header=`// =============================================================================\n// CS21A195 · APPS SCRIPT QA COMPLETO · MEMORY MATCH CONVERGENCE RELAY\n// Base exacta: CS21A194-MM-LATENCY-SAFE-1\n// Capa adicional: 99Q_MEMORY_MATCH_CONVERGENCE_RELAY_QA_CS21A195.gs\n// QA/STAGING SOLAMENTE. NO USAR EN PRODUCCIÓN.\n// =============================================================================\n`;
const content=[header,previous,'','// =============================================================================','// BLOQUE 17/17: 99Q_MEMORY_MATCH_CONVERGENCE_RELAY_QA_CS21A195.gs','// =============================================================================',patch,''].join('\n');
fs.writeFileSync(target,content,'utf8');

const check=fs.readFileSync(target,'utf8');
for(const marker of [
  'CS21A195 · APPS SCRIPT QA COMPLETO · MEMORY MATCH CONVERGENCE RELAY',
  "CS21A194_MM_LATENCY_SAFE_VERSION = 'CS21A194-MM-LATENCY-SAFE-1'",
  'BLOQUE 16/16: 99P_MEMORY_MATCH_LATENCY_SAFE_QA_CS21A194.gs',
  'BLOQUE 17/17: 99Q_MEMORY_MATCH_CONVERGENCE_RELAY_QA_CS21A195.gs',
  "CS21A195_MM_CONVERGENCE_VERSION = 'CS21A195-MM-CONVERGENCE-RELAY-1'",
  '_elive180SetCells_.__cs21a195ConvergenceRelay = true',
  '_cs21a192CanonicalSnapshot_.__cs21a195StaleReadShield = true',
  'englishLabMemoryMatchGetPlayerStateCS21A180.__cs21a195FastRelay = true',
  'englishLabMemoryMatchGetRoomControlCS21A180.__cs21a195FastRelay = true',
]) assert.ok(check.includes(marker),`Falta marcador CS21A195: ${marker}`);

console.log(JSON.stringify({
  ok:true,
  version:'CS21A195-MM-CONVERGENCE-RELAY-1',
  base:'CS21A194-MM-LATENCY-SAFE-1',
  target:path.relative(root,target),
  relay_ttl_seconds:90,
  full_refresh_ms:30000,
  bytes:Buffer.byteLength(check,'utf8'),
},null,2));
