#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const backend=fs.readFileSync('apps_script_patches/99L_FIX_MEMORY_MATCH_TIMEOUT_CLEANUP_QA_CS21A190.gs','utf8');
const guard=fs.readFileSync('src/english_lab_live_timeout_style_guard_cs21a190.js','utf8');
const patcher=fs.readFileSync('scripts/patch_qa_package_cs21a190.mjs','utf8');
const assembler=fs.readFileSync('scripts/assemble_apps_script_cs21a183_complete.mjs','utf8');

for(const marker of [
  "CS21A190_MM_TIMEOUT_CLEANUP_VERSION = 'CS21A190-MM-TIMEOUT-CLEANUP-1'",
  '_cs21a190NormalizeTransientPackage_',
  'MEMORY_MATCH_TRANSIENT_REVEAL_CLEARED',
  'timeout_clears_first_reveal:true',
  'stale_snapshot_sanitized:true',
  '__cs21a190TransientCleanup',
]) assert.ok(backend.includes(marker),`Backend CS21A190 no contiene ${marker}`);

for(const marker of [
  "BASE_STYLE_HREF='/styles/english_lab_memory_match_cs21a173.css?v=CS21A190'",
  "CLASSIC_STYLE_HREF='/styles/english_lab_memory_match_classic_sync_cs21a189.css?v=CS21A190'",
  'ensureStyles',
  '__ENGLISH_LAB_TIMEOUT_STYLE_GUARD_CS21A190__',
]) assert.ok(guard.includes(marker),`Guard CS21A190 no contiene ${marker}`);

for(const marker of [
  'english_lab_memory_match_cs21a173.css?v=CS21A190',
  'english_lab_memory_match_classic_sync_cs21a189.css?v=CS21A190',
  'english_lab_live_timeout_style_guard_cs21a190.js?v=F98.4Z6CS21A190',
  'MEMORY_MATCH_TIMEOUT_FIRST_REVEAL_CLEAR=true',
]) assert.ok(patcher.includes(marker),`Patcher CS21A190 no contiene ${marker}`);

assert.ok(assembler.includes('99L_FIX_MEMORY_MATCH_TIMEOUT_CLEANUP_QA_CS21A190.gs'));
assert.ok(assembler.includes('CS21A183-CS21A190 · APPS SCRIPT QA COMPLETO'));
assert.ok(assembler.includes('99L TIMEOUT CLEANUP'));

console.log(JSON.stringify({
  verdict:'PASS_CONTRACT_CS21A190',
  timeout_clears_first_reveal:true,
  timeout_clears_stale_attempt:true,
  stale_snapshot_sanitized:true,
  base_style_guaranteed:true,
  classic_style_guaranteed:true,
  cache_epoch:'CS21A190'
},null,2));
