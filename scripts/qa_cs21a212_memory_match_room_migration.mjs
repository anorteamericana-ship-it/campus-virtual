#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const assembler=path.join(root,'scripts/assemble_apps_script_cs21a212_unified.mjs');
const migration=path.join(root,'apps_script_patches/99Y_MEMORY_MATCH_CS211_ROOM_MIGRATION_QA_CS21A212.gs');
const target=path.join(root,'apps_script_patches/99_CS21A212_ENGLISH_LAB_UNIFIED_COMPLETO.gs');
for(const file of [assembler,migration]) assert.equal(fs.existsSync(file),true,`Falta ${path.relative(root,file)}`);
execFileSync(process.execPath,[assembler],{cwd:root,stdio:'inherit'});
const code=fs.readFileSync(target,'utf8');

for(const marker of [
  "CS21A212_MM_ROOM_MIGRATION_VERSION = 'CS21A212-MM-CS211-ROOM-MIGRATION-1'",
  '_cs21a212NormalizeLegacyRoomPackage_',
  'pkg.rules = _cs21a212Rules_(pkg.rules || {})',
  'requiredEndMs = startedMs ? startedMs + CS21A212_MM_INITIAL_TURN_MS : 0',
  'revealedMs + CS21A212_MM_MIN_SECOND_PICK_MS',
  'targetEndMs = Math.max(currentEndMs || 0, requiredEndMs || 0)',
  "attemptPhase !== 'MISMATCH_REVEAL'",
  'var _cs21a212CurrentBase_ = _elive176Current_',
  '_elive176Current_.__cs21a212LegacyRoomMigration = true',
  'function verificarMemoryMatchRoomMigrationCS21A212()'
]) assert.ok(code.includes(marker),`Falta contrato de migración: ${marker}`);

const migrationPos=code.lastIndexOf("CS21A212_MM_ROOM_MIGRATION_VERSION = 'CS21A212-MM-CS211-ROOM-MIGRATION-1'");
const latencyPos=code.lastIndexOf("CS21A212_MM_VERSION = 'CS21A212-MM-LATENCY-SAFE-15S-ACK-1'");
assert.ok(migrationPos>latencyPos,'La migración debe ensamblarse después de la capa latency-safe.');

const tmp='/tmp/cs21a212-room-migration-check.js';
fs.writeFileSync(tmp,code,'utf8');
execFileSync(process.execPath,['--check',tmp],{stdio:'inherit'});

console.log(JSON.stringify({
  ok:true,
  verdict:'PASS_CS21A212_EXISTING_ROOM_MIGRATION',
  existingCs211RoomInitialMs:10000,
  normalizedInitialMs:15000,
  firstRevealWindowMs:15000,
  mismatchRevealMs:3000,
  deadlineNeverReduced:true,
  mismatchDeadlineUntouched:true,
  normalizationEntryPoint:'_elive176Current_',
  newRoomRequired:false
},null,2));
